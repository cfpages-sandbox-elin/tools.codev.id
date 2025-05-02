// article-main.js (Using correct JS keys in critical check)
import { loadState, updateState, resetAllData, getCustomModelState, updateCustomModelState, getState, setBulkPlan, updateBulkPlanItem } from './article-state.js';
import { logToConsole, fetchAndParseSitemap, showLoading, disableElement } from './article-helpers.js';
import {
    cacheDomElements, getElement, populateAiProviders, populateTextModels,
    populateImageModels, updateUIFromState, updateUIBasedOnMode, toggleCustomModelUI,
    populateLanguagesUI, populateDialectsUI, toggleGithubOptions, checkApiStatus,
    displaySitemapUrlsUI
} from './article-ui.js'; // Use the updated ui file (v8.4 ID fix)
import { handleGenerateStructure, handleGenerateArticle } from './article-single.js';
import { handleGeneratePlan, handleStartBulkGeneration, handleDownloadZip } from './article-bulk.js';
import { handleSpinSelectedText, handleSelection, highlightSpintax } from './article-spinner.js';

// Flag to prevent multiple initializations
let appInitialized = false;

function initializeApp() {
    if (appInitialized) { logToConsole("Initialization attempted again, skipping.", "warn"); return; }
    appInitialized = true;

    logToConsole("DOMContentLoaded event fired. Initializing application...", "info");

    // 1. Cache DOM Elements FIRST
    cacheDomElements();

    // --- CRITICAL CHECK ---
    // Use the JS keys defined in article-ui.js's elementIdMap
    const criticalElementsCheck = [
        'aiProviderSelect',     // JS Key for id="ai_provider"
        'languageSelect',       // JS Key for id="language" <--- CORRECTED
        'apiStatusDiv',         // JS Key for id="apiStatus" <--- CORRECTED
        'audienceInput',        // JS Key for id="audience"
        'bulkModeCheckbox'      // JS Key for id="bulkModeCheckbox"
        // Add more JS keys here if other elements are absolutely essential for basic operation
    ];
    let criticalMissing = false;
    criticalElementsCheck.forEach(jsKey => {
        if (!getElement(jsKey)) { // Check using the JS key
            logToConsole(`FATAL: Critical element with JS key '${jsKey}' missing after cache attempt. Cannot initialize UI.`, "error");
            criticalMissing = true;
        }
    });

    if (criticalMissing) {
        return; // Halt execution
    }
    // --- End Critical Check ---


    // 2. Load State
    logToConsole("Loading application state...", "info");
    const initialState = loadState();

    // 3. Update UI from State
    logToConsole("Applying loaded state to UI...", "info");
    updateUIFromState(initialState);

    // 4. Setup Event Listeners
    logToConsole("Setting up event listeners...", "info");
    setupConfigurationListeners();
    setupStep1Listeners();
    setupStep2Listeners();
    setupStep3Listeners();
    setupStep4Listeners();
    setupBulkModeListeners();

    logToConsole("Application Initialized successfully.", "success");
}

// --- Listener setup functions (setupConfigurationListeners, etc.) ---
// No changes needed here
function setupConfigurationListeners() { /* ... */ }
function setupStep1Listeners() { /* ... */ }
function setupStep2Listeners() { /* ... */ }
function setupStep3Listeners() { /* ... */ }
function setupStep4Listeners() { /* ... */ }
function setupBulkModeListeners() { /* ... */ }

// --- Initialize ---
logToConsole("article-main.js evaluating. Setting up DOMContentLoaded listener.", "debug");
document.addEventListener('DOMContentLoaded', initializeApp, { once: true });

console.log("article-main.js loaded (v8.4 key fix)");