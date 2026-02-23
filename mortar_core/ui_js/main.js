/**
 * Main Bootstrap Module
 * Initializes all modules and wires dependencies using Dependency Injection
 * Version: 1.8.0
 * 
 * Architecture: Mediator Pattern
 * - This module acts as the central coordinator
 * - Eliminates circular dependencies by injecting functions as parameters
 * - Each module exports pure functions that receive dependencies via init()
 */

import * as State from './state.js';
import * as UI from './ui.js';
import * as FFE from './ffe.js';
import * as Calculator from './calculator.js';
import * as History from './history.js';
import * as Corrections from './corrections.js';
import * as Share from './share.js';
import { setDisplay, populateSelect } from './utils.js';
import * as DOMCache from './dom-cache.js';
import * as CoordManager from './coord-manager.js';

// Keep version local to avoid import/export mismatch issues in cached clients
const DATA_VERSION = '2.7.2';

let ballisticDataLoaded = false;
const BALLISTIC_DATA_TIMEOUT_MS = 12000;

/**
 * Add timeout protection to ballistic data loading.
 * Prevents infinite "Loading ballistic data..." state on stalled network requests.
 * @param {string} path
 * @returns {Promise<void>}
 */
async function loadBallisticDataWithTimeout(path) {
    let timerId;

    try {
        return await Promise.race([
            BallisticCalculator.loadBallisticData(path),
            new Promise((_, reject) => {
                timerId = setTimeout(() => {
                    reject(new Error(`Timed out after ${BALLISTIC_DATA_TIMEOUT_MS / 1000}s while loading ${path}`));
                }, BALLISTIC_DATA_TIMEOUT_MS);
            })
        ]);
    } finally {
        clearTimeout(timerId);
    }
}

/**
 * Wire dependencies using dependency injection
 * This is the mediator that connects all modules without creating circular dependencies
 */
function wireDependencies() {
    // Calculator dependencies
    Calculator.init({
        parsePositionFromUI: UI.parsePositionFromUI,
        showOutputError: UI.showOutputError,
        setTargetHighlight: UI.setTargetHighlight,
        addToHistory: History.addToHistory,
        getCurrentHistoryIndex: History.getCurrentHistoryIndex,
        setCurrentHistoryIndex: History.setCurrentHistoryIndex
    });
    
    // History dependencies
    History.init({
        parsePositionFromUI: UI.parsePositionFromUI,
        setPositionInputs: UI.setPositionInputs,
        setTargetHighlight: UI.setTargetHighlight,
        setCoordMode: UI.setCoordMode,
        calculateSolution: Calculator.calculateSolution,
        selectMission: Calculator.selectMission,
        updateShellTypes: Calculator.updateShellTypes,
        getAllMortarTypes: Calculator.getAllMortarTypes
    });
    
    // UI dependencies
    UI.init({
        calculateSolution: Calculator.calculateSolution,
        updateShellTypes: Calculator.updateShellTypes,
        clearHistory: History.clearHistory,
        updateCorrectionPreview: Corrections.updateCorrectionPreview
    });
    
    // Corrections dependencies
    Corrections.init({
        parsePositionFromUI: UI.parsePositionFromUI,
        setTargetHighlight: UI.setTargetHighlight,
        showOutputError: UI.showOutputError,
        setPositionInputs: UI.setPositionInputs,
        calculateSolution: Calculator.calculateSolution,
        setCurrentHistoryIndex: History.setCurrentHistoryIndex
    });
    
    // FFE dependencies
    FFE.init({
        calculateSolution: Calculator.calculateSolution,
        parsePositionFromUI: UI.parsePositionFromUI
    });
}

/**
 * Setup share feature event listeners
 */
function setupShareListeners() {
    const shareBtn = DOMCache.getElement('shareBtn', false);
    const closeModalBtn = DOMCache.getElement('closeShareModalBtn', false);
    const closeModalBtn2 = document.getElementById('closeShareModalBtn2');
    const copyURLBtn = DOMCache.getElement('copyURLBtn', false);
    const loadPasteBtn = DOMCache.getElement('loadPasteBtn', false);
    
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            Share.showShareModal();
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            Share.hideShareModal();
        });
    }
    
    if (closeModalBtn2) {
        closeModalBtn2.addEventListener('click', () => {
            Share.hideShareModal();
        });
    }
    
    if (copyURLBtn) {
        copyURLBtn.addEventListener('click', () => {
            Share.handleCopyURL();
        });
    }
    
    if (loadPasteBtn) {
        loadPasteBtn.addEventListener('click', () => {
            Share.handleLoadFromPaste();
        });
    }
    
    // Close modal when clicking outside
    const shareModal = DOMCache.getElement('shareModal', false);
    if (shareModal) {
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                Share.hideShareModal();
            }
        });
    }
}

/**
 * Load ballistic data and initialize application
 */
async function init() {
    const loading = DOMCache.getElement('loading');
    const app = DOMCache.getElement('app');
    
    try {
        const dataPaths = [
            `ballistic-data.json?v=${DATA_VERSION}`,
            'ballistic-data.json',
            `${window.location.origin}/ballistic-data.json?v=${DATA_VERSION}`,
            `${window.location.origin}/ballistic-data.json`
        ];

        let loaded = false;
        let lastError;

        for (const dataPath of dataPaths) {
            try {
                await loadBallisticDataWithTimeout(dataPath);
                loaded = true;
                break;
            } catch (pathError) {
                lastError = pathError;
                console.warn(`Ballistic data fetch failed for ${dataPath}:`, pathError.message);
            }
        }

        if (!loaded) {
            throw lastError || new Error('Failed to load ballistic data from all fallback paths.');
        }

        ballisticDataLoaded = true;
        State.setBallisticDataLoaded(true);
        
        setDisplay(loading, false);
        setDisplay(app, true);
        
        updateWeaponSystems();
        await Calculator.updateShellTypes();
        
        UI.initUI();
        FFE.initFFE();
        History.setupHistoryListeners();
        Calculator.setupCalculatorListeners();
        Corrections.setupCorrectionListeners();
        Corrections.setupDynamicListeners(); // Setup correction input listeners
        setupShareListeners();
        
        // Check URL for shared session (auto-load on page load)
        Share.checkURLForSharedSession();
        
    } catch (error) {
        loading.innerHTML = `
            <div style="color: red;">
                ❌ Error loading ballistic data: ${error.message}
                <br>Make sure the HTTP server is running from the mortar_core directory.
                <br><button id="retryLoadBtn" style="margin-top: 12px; width: auto; padding: 8px 12px; font-size: 13px;">Retry loading data</button>
            </div>
        `;
        const retryLoadBtn = document.getElementById('retryLoadBtn');
        if (retryLoadBtn) {
            retryLoadBtn.addEventListener('click', () => {
                retryLoadBtn.disabled = true;
                retryLoadBtn.textContent = 'Retrying...';
                init();
            });
        }
        console.error('Error loading ballistic data:', error);
    }
}

/**
 * Update weapon system options from ballistic data (mortars + MLRS)
 */
function updateWeaponSystems() {
    const weaponSelect = DOMCache.getElement('mortarType');
    const currentValue = weaponSelect.value;
    
    const allWeapons = Calculator.getAllWeaponSystems();
    
    // Group by system type with custom ordering
    // M252 first, then 2B14, then any other mortars alphabetically
    const weaponOrder = ['M252', '2B14'];
    const mortars = allWeapons.filter(w => w.systemType === 'mortar').sort((a, b) => {
        const aIndex = weaponOrder.indexOf(a.id);
        const bIndex = weaponOrder.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.name.localeCompare(b.name);
    });
    const howitzers = allWeapons.filter(w => w.systemType === 'howitzer').sort((a, b) => a.name.localeCompare(b.name));
    const mlrs = allWeapons.filter(w => w.systemType === 'mlrs').sort((a, b) => a.name.localeCompare(b.name));
    
    // Clear existing options
    weaponSelect.innerHTML = '';
    
    // Add mortars group
    if (mortars.length > 0) {
        const mortarGroup = document.createElement('optgroup');
        mortarGroup.label = '🎯 Mortars';
        mortars.forEach(weapon => {
            const option = document.createElement('option');
            option.value = weapon.id;
            option.textContent = weapon.name;
            mortarGroup.appendChild(option);
        });
        weaponSelect.appendChild(mortarGroup);
    }
    
    // Add Howitzers group
    if (howitzers.length > 0) {
        const howitzerGroup = document.createElement('optgroup');
        howitzerGroup.label = '🎯 Howitzers';
        howitzers.forEach(weapon => {
            const option = document.createElement('option');
            option.value = weapon.id;
            option.textContent = weapon.name;
            howitzerGroup.appendChild(option);
        });
        weaponSelect.appendChild(howitzerGroup);
    }
    
    // Add MLRS group
    if (mlrs.length > 0) {
        const mlrsGroup = document.createElement('optgroup');
        mlrsGroup.label = '🚀 MLRS';
        mlrs.forEach(weapon => {
            const option = document.createElement('option');
            option.value = weapon.id;
            option.textContent = weapon.name;
            mlrsGroup.appendChild(option);
        });
        weaponSelect.appendChild(mlrsGroup);
    }
    
    // Restore previous selection or select first mortar
    const optionExists = allWeapons.some(w => w.id === currentValue);
    if (optionExists) {
        weaponSelect.value = currentValue;
    } else if (mortars.length > 0) {
        weaponSelect.value = mortars[0].id;
    } else if (allWeapons.length > 0) {
        weaponSelect.value = allWeapons[0].id;
    }
}

/**
 * Expose utility modules for debugging/console access only
 * Event handlers now use event delegation (CSP compliant)
 */
function exposeUtilsForDebugging() {
    window.DOMCache = DOMCache;
    window.CoordManager = CoordManager;
    window.State = State;
    window.Share = Share;
}

/**
 * Application entry point
 */
document.addEventListener('DOMContentLoaded', () => {
    wireDependencies();
    exposeUtilsForDebugging();
    init();
});
