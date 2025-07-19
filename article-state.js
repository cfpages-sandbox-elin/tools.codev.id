// article-state.js (v8.24 multi ai provider)
import {
    defaultSettings as importedDefaultSettings,
    APP_STATE_STORAGE_KEY, BULK_PLAN_STORAGE_KEY,
    BULK_ARTICLES_STORAGE_KEY, CUSTOM_MODELS_STORAGE_KEY, SITEMAP_STORAGE_KEY
} from './article-config.js';
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
        const savedState = localStorage.getItem(APP_STATE_STORAGE_KEY);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            // Merge, ensuring new defaults are present if not in saved state
            appState = {
                ...importedDefaultSettings,
                ...parsed
            };
            // Ensure textProviders is a non-empty array for backwards compatibility
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
        localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(appState));
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
        const stored = localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY);
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
        localStorage.removeItem(SITEMAP_STORAGE_KEY);

        appState = { ...appDefaultSettings }; // Reset to full defaults
        customModels = { text: {}, image: {} };
        bulkPlan = [];
        bulkArticles = {};

        logToConsole('All application data has been reset.', 'warn');
        window.location.reload();
    } else {
        logToConsole('Reset cancelled by user.', 'info');
    }
}

export function addProviderToState() {
    const currentState = getState();
    const newProviderList = [...currentState.textProviders];
    // Add the first available provider as the default for the new row
    const firstProviderKey = Object.keys(aiTextProviders)[0];
    const firstModel = aiTextProviders[firstProviderKey]?.models[0] || '';
    newProviderList.push({ provider: firstProviderKey, model: firstModel, useCustom: false, customModel: '' });
    updateState({ textProviders: newProviderList });
}

export function removeProviderFromState(index) {
    const currentState = getState();
    const newProviderList = currentState.textProviders.filter((_, i) => i !== index);
    // Ensure at least one provider remains
    if (newProviderList.length === 0) {
        logToConsole("Cannot remove the last provider.", "warn");
        return;
    }
    updateState({ textProviders: newProviderList });
}

export function updateProviderInState(index, key, value) {
    const currentState = getState();
    const newProviderList = [...currentState.textProviders];
    if (newProviderList[index]) {
        newProviderList[index][key] = value;

        // If the provider itself changes, reset the model to the default for that new provider
        if (key === 'provider') {
            const newProviderModels = aiTextProviders[value]?.models || [];
            newProviderList[index].model = findCheapestModel(newProviderModels);
            newProviderList[index].useCustom = false; // Reset custom state
        }
        
        updateState({ textProviders: newProviderList });
    }
}

console.log("article-state.js loaded (v8.18 Humanize content)");