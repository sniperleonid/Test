#!/usr/bin/env python3
import json
import math
from bisect import bisect_left
from pathlib import Path

MIL_CIRCLE = 6400.0
MAX_ELEVATION_MIL = 1275.0
G = 9.81
SHELL_MASS_KG = 43.0
AIR_DRAG = 0.0097
BASE_V0 = 100.0
CHARGE_COEFF = {1: 1.4, 2: 2.045, 3: 2.79, 4: 3.535, 5: 4.28}
ARC_BANDS = {
    'direct_fire': (0.0, 250.0),
    'indirect_fire': (650.0, MAX_ELEVATION_MIL),
}


def mil_to_rad(mil: float) -> float:
    return (mil / MIL_CIRCLE) * (2.0 * math.pi)


def v0_for_charge(charge: int) -> float:
    return BASE_V0 * float(CHARGE_COEFF[charge])


def rk4_step(state, dt: float):
    def deriv(s):
        x, y, z, vx, vy, vz = s
        vrel = math.sqrt(vx * vx + vy * vy + vz * vz) + 1e-12
        k = AIR_DRAG / SHELL_MASS_KG
        ax = -k * vrel * vx
        ay = -G - k * vrel * vy
        az = -k * vrel * vz
        return (vx, vy, vz, ax, ay, az)

    k1 = deriv(state)
    s2 = tuple(state[i] + 0.5 * dt * k1[i] for i in range(6))
    k2 = deriv(s2)
    s3 = tuple(state[i] + 0.5 * dt * k2[i] for i in range(6))
    k3 = deriv(s3)
    s4 = tuple(state[i] + dt * k3[i] for i in range(6))
    k4 = deriv(s4)
    return tuple(state[i] + (dt / 6.0) * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]) for i in range(6))


def simulate_to_impact(v0: float, elev_mil: float, dt: float = 0.02, ttl: float = 100.0):
    elev_rad = mil_to_rad(elev_mil)
    vx0 = v0 * math.cos(elev_rad)
    vy0 = v0 * math.sin(elev_rad)
    state = (0.0, 0.0, 0.0, vx0, vy0, 0.0)

    t = 0.0
    went_up = False
    steps = int(max(1, math.ceil(ttl / dt)))
    prev = state

    for _ in range(steps):
        prev = state
        state = rk4_step(state, dt)
        t += dt
        y = state[1]
        if y > 0.0:
            went_up = True

        if went_up and prev[1] > 0.0 and y <= 0.0:
            y0 = prev[1]
            y1 = y
            a = 0.0 if y1 == y0 else (0.0 - y0) / (y1 - y0)
            x_imp = prev[0] + a * (state[0] - prev[0])
            t_imp = (t - dt) + a * dt
            return float(x_imp), float(t_imp)

    return float(state[0]), float(t)


def frange(start, stop, step):
    x = start
    while x <= stop + 1e-9:
        yield x
        x += step


def lerp(x, x0, x1, y0, y1):
    if x1 == x0:
        return y0
    a = (x - x0) / (x1 - x0)
    return y0 + a * (y1 - y0)


def interp(x, xs, ys):
    i = bisect_left(xs, x)
    if i <= 0:
        return ys[0]
    if i >= len(xs):
        return ys[-1]
    return lerp(x, xs[i - 1], xs[i], ys[i - 1], ys[i])


def gradient(values, xs, i):
    if len(values) == 1:
        return 0.0
    if i == 0:
        return (values[1] - values[0]) / (xs[1] - xs[0])
    if i == len(values) - 1:
        return (values[-1] - values[-2]) / (xs[-1] - xs[-2])
    return (values[i + 1] - values[i - 1]) / (xs[i + 1] - xs[i - 1])


def generate_table(charge: int, variant: str, min_range: int, max_range: int):
    emin, emax = ARC_BANDS[variant]
    v0 = v0_for_charge(charge)

    rows = []
    for elev in frange(emin, emax, 2.0):
        x, tof = simulate_to_impact(v0, elev)
        rows.append((x, elev, tof))

    rows.sort(key=lambda r: r[0])
    ranges, elev_samples, tof_samples = [], [], []
    prev_range = -1e9
    for r, e, t in rows:
        if r <= prev_range:
            continue
        ranges.append(r)
        elev_samples.append(e)
        tof_samples.append(t)
        prev_range = r

    grid = list(range(min_range, max_range + 1, 50))
    if grid[-1] != max_range:
        grid.append(max_range)
    grid = [g for g in grid if ranges[0] <= g <= ranges[-1]]

    elev_interp = [interp(g, ranges, elev_samples) for g in grid]
    tof_interp = [interp(g, ranges, tof_samples) for g in grid]

    out = []
    for i, r in enumerate(grid):
        delev_drange = gradient(elev_interp, grid, i)
        dtof_drange = gradient(tof_interp, grid, i)
        d_elev = -100.0 * delev_drange
        tof_100 = 100.0 * dtof_drange
        out.append({
            'range': int(r),
            'elevation': int(round(elev_interp[i])),
            'tof': round(tof_interp[i], 1),
            'dElev': round(d_elev, 2),
            'tofPer100m': round(tof_100, 2),
        })
    return out


def main():
    root = Path(__file__).resolve().parents[1]
    data_path = root / 'ballistic-data.json'
    data = json.loads(data_path.read_text(encoding='utf-8'))

    m777 = next(w for w in data['weaponSystems'] if w.get('id') == 'M777')
    for projectile in m777['projectileTypes']:
        table = generate_table(
            charge=int(projectile['charge']),
            variant=projectile['variant'],
            min_range=int(projectile['minRange']),
            max_range=int(projectile['maxRange']),
        )
        projectile['ballisticTable'] = table
        if table:
            projectile['minRange'] = table[0]['range']
            projectile['maxRange'] = table[-1]['range']

    data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Updated M777 ballistic tables with high-precision generated data.')


if __name__ == '__main__':
    main()
