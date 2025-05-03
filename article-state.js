// article-state.js v8.12 (Add articleStructure)
import {
    defaultSettings, APP_STATE_STORAGE_KEY, BULK_PLAN_STORAGE_KEY,
    BULK_ARTICLES_STORAGE_KEY, CUSTOM_MODELS_STORAGE_KEY, SITEMAP_STORAGE_KEY
} from './article-config.js';
import { logToConsole } from './article-helpers.js';

// --- In-Memory State ---
let appState = { ...defaultSettings, articleStructure: '' };
let customModels = { text: {}, image: {} };
let bulkPlan = [];
let bulkArticles = {};

// --- State Getters ---
export function getState() {
    return { ...appState, articleStructure: appState.articleStructure || '' };
}
export function getCustomModels() {
    return { ...customModels };
}
export function getBulkPlan() {
    return [...bulkPlan]; // Return a copy
}
export function getBulkArticle(filename) {
    return bulkArticles[filename];
}
export function getAllBulkArticles() {
    return { ...bulkArticles };
}

// --- State Savers/Loaders ---

// General App Settings
export function loadState() {
    try {
        const savedState = localStorage.getItem(APP_STATE_STORAGE_KEY);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            // Merge saved state with defaults, ensuring articleStructure is included
            appState = { ...defaultSettings, articleStructure: '', ...parsed };
            logToConsole('App state loaded from local storage.', 'info');
        } else {
            // Use defaults, including the empty articleStructure
            appState = { ...defaultSettings, articleStructure: '' };
            logToConsole('No saved app state found, using defaults.', 'info');
        }
        loadCustomModelsState();
        loadBulkPlanState();
        loadBulkArticlesState();
    } catch (error) {
        logToConsole(`Error loading app state: ${error.message}`, 'error');
        appState = { ...defaultSettings, articleStructure: '' }; // Reset to defaults on error
    }
    return getState();
}

export function saveState() {
    try {
        // Ensure articleStructure is included when saving
        localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(appState));
    } catch (error) {
        logToConsole(`Error saving app state: ${error.message}`, 'error');
    }
}

export function updateState(newState) {
    // Merge new state, preserving existing keys including articleStructure if not in newState
    appState = { ...appState, ...newState };
    saveState();
}

// Custom Models
function loadCustomModelsState() {
    try {
        const stored = localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY);
        customModels = stored ? JSON.parse(stored) : { text: {}, image: {} };
        customModels.text = customModels.text || {}; // Ensure structure
        customModels.image = customModels.image || {};
        logToConsole('Custom models loaded.', 'info');
    } catch (error) {
        logToConsole(`Error loading custom models: ${error.message}`, 'error');
        customModels = { text: {}, image: {} };
    }
}

export function saveCustomModelsState() {
    try {
        localStorage.setItem(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify(customModels));
        logToConsole('Custom models saved.', 'info');
    } catch (error) {
        logToConsole(`Error saving custom models: ${error.message}`, 'error');
    }
}

export function updateCustomModelState(type, provider, modelName) {
    if (!customModels[type]) customModels[type] = {};
    customModels[type][provider] = modelName.trim();
    saveCustomModelsState();
}

export function getCustomModelState(type, provider) {
    return customModels[type]?.[provider] || '';
}

// Bulk Plan
function loadBulkPlanState() {
     try {
        const storedPlan = localStorage.getItem(BULK_PLAN_STORAGE_KEY);
        bulkPlan = storedPlan ? JSON.parse(storedPlan) : [];
        logToConsole(`Bulk plan loaded (${bulkPlan.length} items).`, 'info');
    } catch (error) {
        logToConsole(`Error loading bulk plan: ${error.message}`, 'error');
        bulkPlan = [];
    }
}

export function saveBulkPlanState() {
     try {
        localStorage.setItem(BULK_PLAN_STORAGE_KEY, JSON.stringify(bulkPlan));
        logToConsole('Bulk plan saved.', 'info');
    } catch (error) {
        logToConsole(`Error saving bulk plan: ${error.message}`, 'error');
    }
}

export function setBulkPlan(newPlan) {
    bulkPlan = [...newPlan]; // Replace entire plan
    saveBulkPlanState();
}

export function updateBulkPlanItem(index, updates) {
    if (bulkPlan[index]) {
        bulkPlan[index] = { ...bulkPlan[index], ...updates };
        saveBulkPlanState(); // Save on item update
    } else {
        logToConsole(`Attempted to update non-existent bulk plan item at index ${index}`, 'warn');
    }
}

// Bulk Articles
function loadBulkArticlesState() {
     try {
        const storedArticles = localStorage.getItem(BULK_ARTICLES_STORAGE_KEY);
        bulkArticles = storedArticles ? JSON.parse(storedArticles) : {};
        logToConsole(`Bulk articles loaded (${Object.keys(bulkArticles).length} articles).`, 'info');
    } catch (error) {
        logToConsole(`Error loading bulk articles: ${error.message}`, 'error');
        bulkArticles = {};
    }
}

export function saveBulkArticlesState() {
     try {
        localStorage.setItem(BULK_ARTICLES_STORAGE_KEY, JSON.stringify(bulkArticles));
        // logToConsole('Bulk articles saved.', 'info'); // Can be noisy
    } catch (error) {
        logToConsole(`Error saving bulk articles (might be too large): ${error.message}`, 'error');
    }
}

export function addBulkArticle(filename, content) {
    bulkArticles[filename] = content;
    saveBulkArticlesState();
}

// --- Reset State ---
export function resetAllData() {
    if (confirm("Are you sure you want to reset ALL settings, custom models, and bulk progress? This cannot be undone.")) {
        logToConsole('Resetting all application data...', 'warn');
        localStorage.removeItem(APP_STATE_STORAGE_KEY);
        localStorage.removeItem(CUSTOM_MODELS_STORAGE_KEY);
        localStorage.removeItem(BULK_PLAN_STORAGE_KEY);
        localStorage.removeItem(BULK_ARTICLES_STORAGE_KEY);
        // *** FIX: Use the imported SITEMAP_STORAGE_KEY ***
        localStorage.removeItem(SITEMAP_STORAGE_KEY);

        // Reset in-memory state
        appState = { ...defaultSettings };
        customModels = { text: {}, image: {} };
        bulkPlan = [];
        bulkArticles = {};

        logToConsole('All application data has been reset.', 'warn');
        // Reload the page to apply default UI state cleanly
        window.location.reload();
    } else {
         logToConsole('Reset cancelled by user.', 'info');
    }
}

console.log("article-state.js v8.12 loaded (with articleStructure)");