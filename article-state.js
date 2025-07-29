// article-state.js (v8.24 multi ai provider) - CORRECTED
import { defaultSettings as importedDefaultSettings, storageKeys } from './article-config.js';
import { logToConsole } from './article-helpers.js';

// --- In-Memory State ---
let appState = { ...importedDefaultSettings };
let customModels = { text: {}, image: {} };
let bulkPlan = [];
let bulkArticles = {};

// --- State Getters ---
export function getState() {
    return { ...appState };
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
export function loadState() {
    try {
        const savedState = localStorage.getItem(storageKeys.APP_STATE);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            appState = { ...importedDefaultSettings, ...parsed };
            if (!Array.isArray(appState.textProviders) || appState.textProviders.length === 0) {
                appState.textProviders = importedDefaultSettings.textProviders;
            }
        } else {
            appState = { ...importedDefaultSettings };
        }
        loadCustomModelsState();
        loadBulkPlanState();
        loadBulkArticlesState();
    } catch (error) {
        logToConsole(`Error loading app state: ${error.message}`, 'error');
        appState = { ...importedDefaultSettings };
    }
    return getState();
}

export function saveState() {
    try {
        localStorage.setItem(storageKeys.APP_STATE, JSON.stringify(appState));
    } catch (error) {
        logToConsole(`Error saving app state: ${error.message}`, 'error');
    }
}

export function updateState(newState) {
    appState = { ...appState, ...newState };
    saveState();
}

// Custom Models
function loadCustomModelsState() {
    try {
        const stored = localStorage.getItem(storageKeys.CUSTOM_MODELS);
        customModels = stored ? JSON.parse(stored) : { text: {}, image: {} };
        customModels.text = customModels.text || {}; 
        customModels.image = customModels.image || {};
        logToConsole('Custom models loaded.', 'info');
    } catch (error) {
        logToConsole(`Error loading custom models: ${error.message}`, 'error');
        customModels = { text: {}, image: {} };
    }
}

export function saveCustomModelsState() {
    try {
        localStorage.setItem(storageKeys.CUSTOM_MODELS, JSON.stringify(customModels));
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
        const storedPlan = localStorage.getItem(storageKeys.BULK_PLAN);
        bulkPlan = storedPlan ? JSON.parse(storedPlan) : [];
        logToConsole(`Bulk plan loaded (${bulkPlan.length} items).`, 'info');
    } catch (error) {
        logToConsole(`Error loading bulk plan: ${error.message}`, 'error');
        bulkPlan = [];
    }
}

export function saveBulkPlanState() {
    try {
        localStorage.setItem(storageKeys.BULK_PLAN, JSON.stringify(bulkPlan));
        logToConsole('Bulk plan saved.', 'info');
    } catch (error) {
        logToConsole(`Error saving bulk plan: ${error.message}`, 'error');
    }
}

export function setBulkPlan(newPlan) {
    bulkPlan = [...newPlan]; 
    saveBulkPlanState();
}

export function updateBulkPlanItem(index, updates) {
    if (bulkPlan[index]) {
        bulkPlan[index] = { ...bulkPlan[index], ...updates };
        saveBulkPlanState(); 
    } else {
        logToConsole(`Attempted to update non-existent bulk plan item at index ${index}`, 'warn');
    }
}

// Bulk Articles
function loadBulkArticlesState() {
    try {
        const storedArticles = localStorage.getItem(storageKeys.BULK_ARTICLES);
        bulkArticles = storedArticles ? JSON.parse(storedArticles) : {};
        logToConsole(`Bulk articles loaded (${Object.keys(bulkArticles).length} articles).`, 'info');
    } catch (error) {
        logToConsole(`Error loading bulk articles: ${error.message}`, 'error');
        bulkArticles = {};
    }
}

export function saveBulkArticlesState() {
    try {
        localStorage.setItem(storageKeys.BULK_ARTICLES, JSON.stringify(bulkArticles));
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
        // Corrected: Use storageKeys properties
        localStorage.removeItem(storageKeys.APP_STATE);
        localStorage.removeItem(storageKeys.CUSTOM_MODELS);
        localStorage.removeItem(storageKeys.BULK_PLAN);
        localStorage.removeItem(storageKeys.BULK_ARTICLES);
        localStorage.removeItem(storageKeys.SITEMAP);

        appState = { ...importedDefaultSettings }; 
        customModels = { text: {}, image: {} };
        bulkPlan = [];
        bulkArticles = {};

        logToConsole('All application data has been reset.', 'warn');
        window.location.reload();
    } else {
        logToConsole('Reset cancelled by user.', 'info');
    }
}

console.log("article-state.js loaded (v8.18 Humanize content)");