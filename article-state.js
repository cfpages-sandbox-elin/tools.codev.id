// article-state.js
import {
    defaultSettings, APP_STATE_STORAGE_KEY, BULK_PLAN_STORAGE_KEY,
    BULK_ARTICLES_STORAGE_KEY, CUSTOM_MODELS_STORAGE_KEY
} from './article-config.js';
import { logToConsole } from './article-helpers.js';

// --- In-Memory State ---
let appState = { ...defaultSettings }; // Initialize with defaults
let customModels = { text: {}, image: {} };
let bulkPlan = []; // Array of { keyword, title, slug, intent, status, filename, error? }
let bulkArticles = {}; // Dictionary: { 'filename.md': 'markdown content...' }

// --- State Getters ---
export function getState() {
    return { ...appState }; // Return a copy to prevent direct mutation
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
            // Merge saved state with defaults to ensure new defaults are included
            appState = { ...defaultSettings, ...JSON.parse(savedState) };
            logToConsole('App state loaded from local storage.', 'info');
        } else {
            appState = { ...defaultSettings }; // Use defaults if nothing saved
            logToConsole('No saved app state found, using defaults.', 'info');
        }
        // Load other specific states
        loadCustomModelsState();
        loadBulkPlanState();
        loadBulkArticlesState();

    } catch (error) {
        logToConsole(`Error loading app state: ${error.message}`, 'error');
        appState = { ...defaultSettings }; // Reset to defaults on error
    }
    return getState(); // Return the loaded/default state
}

export function saveState() {
    try {
        localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(appState));
        // logToConsole('App state saved.', 'info'); // Can be noisy, save specific states instead
    } catch (error) {
        logToConsole(`Error saving app state: ${error.message}`, 'error');
    }
}

export function updateState(newState) {
    appState = { ...appState, ...newState };
    saveState(); // Save whenever state is updated
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
        // Be cautious with large amounts of article data in local storage
        localStorage.setItem(BULK_ARTICLES_STORAGE_KEY, JSON.stringify(bulkArticles));
        logToConsole('Bulk articles saved.', 'info');
    } catch (error) {
        logToConsole(`Error saving bulk articles (might be too large): ${error.message}`, 'error');
         // Consider more robust storage if this becomes an issue (IndexedDB)
    }
}

export function addBulkArticle(filename, content) {
    bulkArticles[filename] = content;
    saveBulkArticlesState(); // Save each time an article is added/updated
}

// --- Reset State ---
export function resetAllData() {
    if (confirm("Are you sure you want to reset ALL settings, custom models, and bulk progress? This cannot be undone.")) {
        localStorage.removeItem(APP_STATE_STORAGE_KEY);
        localStorage.removeItem(CUSTOM_MODELS_STORAGE_KEY);
        localStorage.removeItem(BULK_PLAN_STORAGE_KEY);
        localStorage.removeItem(BULK_ARTICLES_STORAGE_KEY);
        localStorage.removeItem(SITEMAP_STORAGE_KEY); // Also clear sitemap

        // Reset in-memory state
        appState = { ...defaultSettings };
        customModels = { text: {}, image: {} };
        bulkPlan = [];
        bulkArticles = {};

        logToConsole('All application data has been reset.', 'warn');
        // Reload the page to apply default UI state cleanly
        window.location.reload();
    }
}


console.log("article-state.js loaded");