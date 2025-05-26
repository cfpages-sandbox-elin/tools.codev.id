// article-state.js (v8.13 Add generatedArticleContent - with formatSingleMode)
import {
    defaultSettings as importedDefaultSettings, // Rename to avoid conflict
    APP_STATE_STORAGE_KEY, BULK_PLAN_STORAGE_KEY,
    BULK_ARTICLES_STORAGE_KEY, CUSTOM_MODELS_STORAGE_KEY, SITEMAP_STORAGE_KEY
} from './article-config.js';
import { logToConsole } from './article-helpers.js';

// --- In-Memory State ---
const appDefaultSettings = {
    ...importedDefaultSettings,
    formatSingleMode: importedDefaultSettings.format, // Default single mode format is the overall default format
    articleStructure: '',
    generatedArticleContent: '',
    bulkKeywordsContent: '', // For storing bulk keywords textarea content
    sitemapFetchedUrl: '', // To store the URL from which sitemap was last fetched
};
// --- In-Memory State ---
let appState = { ...appDefaultSettings }; // Initialize with our extended defaults
let customModels = { text: {}, image: {} };
let bulkPlan = [];
let bulkArticles = {};

// --- State Getters ---
export function getState() {
    // Ensure new keys are always part of the returned state copy
    return {
        ...appState, // Spread current appState
        // Ensure all expected keys from appDefaultSettings are present, even if appState was loaded from an older version
        formatSingleMode: appState.formatSingleMode || appDefaultSettings.formatSingleMode,
        articleStructure: appState.articleStructure || '',
        generatedArticleContent: appState.generatedArticleContent || '',
        bulkKeywordsContent: appState.bulkKeywordsContent || '',
        sitemapFetchedUrl: appState.sitemapFetchedUrl || ''
    };
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
            // Merge, ensuring new defaults are present if not in saved state
            appState = {
                ...appDefaultSettings, // Start with all our current defaults
                ...parsed             // Then overwrite with whatever was saved
            };
            // Explicitly ensure crucial new defaults if they were missing from an old save
            appState.formatSingleMode = appState.formatSingleMode || appDefaultSettings.formatSingleMode;
            appState.articleStructure = appState.articleStructure || '';
            appState.generatedArticleContent = appState.generatedArticleContent || '';
            appState.bulkKeywordsContent = appState.bulkKeywordsContent || '';
            appState.sitemapFetchedUrl = appState.sitemapFetchedUrl || '';

            logToConsole('App state loaded from local storage.', 'info');
        } else {
            appState = { ...appDefaultSettings }; // No saved state, use full defaults
            logToConsole('No saved app state found, using defaults.', 'info');
        }
        loadCustomModelsState();
        loadBulkPlanState();
        loadBulkArticlesState();
    } catch (error) {
        logToConsole(`Error loading app state: ${error.message}`, 'error');
        appState = { ...appDefaultSettings }; // Reset on error
    }
    return getState(); // Return a consistent copy
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

console.log("article-state.js loaded (v8.13 with formatSingleMode, bulkKeywordsContent, sitemapFetchedUrl)");