const TRANSLATIONS = {
    en: {
        appTitle: 'Arma Reforger Mortar & Artillery Calculator',
        switchToEnglish: 'Switch language to English',
        switchToRussian: 'Switch language to Russian',
        loadingBallistics: 'Loading ballistic data...',
        supportedWeaponSystems: '🎯 Supported Weapon Systems',
        missionHistory: '📜 Mission History',
        clearAll: 'Clear All',
        coordinateInput: 'Coordinate Input:',
        toggleGrid: '🎯 Grid (047/069)',
        toggleMeters: '📏 Meters (X/Y)',
        sectionWeaponAndAmmo: '1️⃣ Weapon System and Ammunition',
        weaponSystemType: 'Weapon System Type',
        ammunitionType: 'Ammunition Type',
        sectionWeaponPosition: '2️⃣ Weapon Position',
        gridXCoordinate: 'Grid X Coordinate',
        gridYCoordinate: 'Grid Y Coordinate',
        gridHint: '3-digit (100m squares), 4-digit (10m), or 5-digit (1m precision)',
        xCoordinateMeters: 'X Coordinate (meters)',
        yCoordinateMeters: 'Y Coordinate (meters)',
        mapCoordinatesMetersHint: 'Map coordinates in meters (e.g., 4800.5, 7049.0)',
        heightAsl: 'Height (m ASL)',
        lockWeaponCoordinates: '🔒 Lock weapon coordinates + height',
        lockWeaponCoordinatesAria: 'Lock weapon coordinates and height',
        lockWeaponCoordinatesHint: 'Prevents accidental edits to mortar position while calculating.',
        sectionTargetPosition: '3️⃣ Target Position',
        trajectorySectionTitle: '4️⃣ Trajectory',
        trajectoryLabel: 'Trajectory',
        trajectoryAuto: 'Auto (best)',
        trajectoryLow: 'Low trajectory',
        trajectoryHigh: 'High trajectory',
        trajectoryHint: 'Force low/high arc or let calculator choose',
        sectionWeatherCorrections: '5️⃣ ACE Weather Corrections (Optional)',
        useAceWeatherCorrections: 'Use ACE weather corrections',
        windCorrection: 'Wind correction',
        windSpeed: 'Wind speed (m/s)',
        windDirection: 'Wind direction (°)',
        windDirectionHint: 'Direction wind is blowing from',
        temperatureCorrection: 'Temperature correction',
        airTemperature: 'Air temperature (°C)',
        pressureCorrection: 'Pressure correction',
        pressureHpa: 'Pressure (hPa)',
        missionLabel: 'Mission Label (Optional)',
        missionLabelPlaceholder: 'e.g., TRP 1, TGT AA1234, HILL 201',
        recommendation: '💡 Recommendation',
        useThis: 'Use This',
        dismiss: 'Dismiss',
        computeFireMission: 'Compute Fire Mission',
        reset: 'Reset',
        share: '📤 Share'
    },
    ru: {
        appTitle: 'Калькулятор миномётов и артиллерии Arma Reforger',
        switchToEnglish: 'Переключить язык на английский',
        switchToRussian: 'Переключить язык на русский',
        loadingBallistics: 'Загрузка баллистических данных...',
        supportedWeaponSystems: '🎯 Поддерживаемые системы вооружения',
        missionHistory: '📜 История миссий',
        clearAll: 'Очистить всё',
        coordinateInput: 'Формат координат:',
        toggleGrid: '🎯 Сетка (047/069)',
        toggleMeters: '📏 Метры (X/Y)',
        sectionWeaponAndAmmo: '1️⃣ Система вооружения и боеприпас',
        weaponSystemType: 'Тип системы вооружения',
        ammunitionType: 'Тип боеприпаса',
        sectionWeaponPosition: '2️⃣ Позиция орудия',
        gridXCoordinate: 'Координата сетки X',
        gridYCoordinate: 'Координата сетки Y',
        gridHint: '3 цифры (клетка 100 м), 4 цифры (10 м) или 5 цифр (точность 1 м)',
        xCoordinateMeters: 'Координата X (метры)',
        yCoordinateMeters: 'Координата Y (метры)',
        mapCoordinatesMetersHint: 'Координаты карты в метрах (например, 4800.5, 7049.0)',
        heightAsl: 'Высота (м над ур. моря)',
        lockWeaponCoordinates: '🔒 Зафиксировать координаты и высоту орудия',
        lockWeaponCoordinatesAria: 'Зафиксировать координаты и высоту орудия',
        lockWeaponCoordinatesHint: 'Предотвращает случайное изменение позиции орудия во время расчёта.',
        sectionTargetPosition: '3️⃣ Позиция цели',
        trajectorySectionTitle: '4️⃣ Траектория',
        trajectoryLabel: 'Траектория',
        trajectoryAuto: 'Авто (лучший вариант)',
        trajectoryLow: 'Настильная траектория',
        trajectoryHigh: 'Навесная траектория',
        trajectoryHint: 'Принудительно выбрать настильную/навесную или дать калькулятору решить',
        sectionWeatherCorrections: '5️⃣ Поправки ACE по погоде (опционально)',
        useAceWeatherCorrections: 'Использовать погодные поправки ACE',
        windCorrection: 'Поправка на ветер',
        windSpeed: 'Скорость ветра (м/с)',
        windDirection: 'Направление ветра (°)',
        windDirectionHint: 'Направление, откуда дует ветер',
        temperatureCorrection: 'Поправка на температуру',
        airTemperature: 'Температура воздуха (°C)',
        pressureCorrection: 'Поправка на давление',
        pressureHpa: 'Давление (гПа)',
        missionLabel: 'Метка миссии (опционально)',
        missionLabelPlaceholder: 'например: TRP 1, TGT AA1234, HILL 201',
        recommendation: '💡 Рекомендация',
        useThis: 'Использовать',
        dismiss: 'Скрыть',
        computeFireMission: 'Рассчитать огневую задачу',
        reset: 'Сброс',
        share: '📤 Поделиться'
    }
};

function applyTranslations(lang) {
    const selected = TRANSLATIONS[lang] ? lang : 'en';
    const dict = TRANSLATIONS[selected];

    document.documentElement.lang = selected;

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.dataset.i18n;
        if (dict[key]) {
            element.textContent = dict[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
        const key = element.dataset.i18nPlaceholder;
        if (dict[key]) {
            element.placeholder = dict[key];
        }
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
        const key = element.dataset.i18nAriaLabel;
        if (dict[key]) {
            element.setAttribute('aria-label', dict[key]);
        }
    });

    document.querySelectorAll('.lang-flag').forEach((button) => {
        const active = button.dataset.lang === selected;
        button.style.borderColor = active ? '#9fcc2e' : '#5a7e1f';
        button.style.boxShadow = active ? '0 0 0 1px rgba(159, 204, 46, 0.35)' : '';
    });

    localStorage.setItem('armamortars_lang', selected);
}

export function initLanguageSwitcher() {
    const saved = localStorage.getItem('armamortars_lang') || 'en';
    applyTranslations(saved);

    document.querySelectorAll('.lang-flag').forEach((button) => {
        button.addEventListener('click', () => {
            applyTranslations(button.dataset.lang || 'en');
        });
    });
}
