const TRANSLATIONS = {
    en: {
        appTitle: 'Arma Reforger Mortar & Artillery Calculator',
        trajectorySectionTitle: '4️⃣ Trajectory',
        trajectoryLabel: 'Trajectory',
        trajectoryAuto: 'Auto (best)',
        trajectoryLow: 'Low trajectory',
        trajectoryHigh: 'High trajectory',
        trajectoryHint: 'Force low/high arc or let calculator choose'
    },
    ru: {
        appTitle: 'Калькулятор миномётов и артиллерии Arma Reforger',
        trajectorySectionTitle: '4️⃣ Траектория',
        trajectoryLabel: 'Траектория',
        trajectoryAuto: 'Авто (лучший вариант)',
        trajectoryLow: 'Настильная траектория',
        trajectoryHigh: 'Навесная траектория',
        trajectoryHint: 'Принудительно выбрать настильную/навесную или дать калькулятору решить'
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
