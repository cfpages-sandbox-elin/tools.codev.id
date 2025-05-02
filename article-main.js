// article-main.js (Forcing initialization strictly after DOMContentLoaded)
import { loadState, updateState, resetAllData, getCustomModelState, updateCustomModelState, getState, setBulkPlan, updateBulkPlanItem } from './article-state.js';
import { logToConsole, fetchAndParseSitemap, showLoading, disableElement } from './article-helpers.js';
import {
    cacheDomElements, getElement, populateAiProviders, populateTextModels,
    populateImageModels, updateUIFromState, updateUIBasedOnMode, toggleCustomModelUI,
    populateLanguagesUI, populateDialectsUI, toggleGithubOptions, checkApiStatus,
    displaySitemapUrlsUI
} from './article-ui.js'; // Use the updated ui file (v8.3 export fix)
import { handleGenerateStructure, handleGenerateArticle } from './article-single.js';
import { handleGeneratePlan, handleStartBulkGeneration, handleDownloadZip } from './article-bulk.js';
import { handleSpinSelectedText, handleSelection, highlightSpintax } from './article-spinner.js';

// Flag to prevent multiple initializations
let appInitialized = false;

function initializeApp() {
    // Double check flag to prevent running twice
    if (appInitialized) {
        logToConsole("Initialization attempted again, skipping.", "warn");
        return;
    }
    appInitialized = true; // Set flag immediately

    // Log that the event handler is running
    logToConsole("DOMContentLoaded event fired. Initializing application...", "info");

    // 1. Cache DOM Elements FIRST
    // We are now certain this runs after the DOM is parsed.
    cacheDomElements();

    // --- CRITICAL CHECK ---
    // Verify essential elements were cached. If not, stop everything.
    const criticalElementsCheck = ['aiProviderSelect', 'language', 'apiStatus', 'audienceInput', 'bulkModeCheckbox'];
    let criticalMissing = false;
    criticalElementsCheck.forEach(id => {
        if (!getElement(id)) { // getElement now logs warnings if null/undefined
            logToConsole(`FATAL: Critical element '${id}' missing after cache attempt. Cannot initialize UI.`, "error");
            criticalMissing = true;
        }
    });

    if (criticalMissing) {
        // Display a user-friendly message maybe?
        // document.body.innerHTML = `<p style="color:red; font-weight:bold; padding:20px;">Application Error: Failed to load UI components. Please check the console or contact support.</p>`;
        return; // Halt execution
    }
    // --- End Critical Check ---


    // 2. Load State
    logToConsole("Loading application state...", "info");
    const initialState = loadState();

    // 3. Update UI from State
    logToConsole("Applying loaded state to UI...", "info");
    updateUIFromState(initialState); // This function relies heavily on cached elements

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
// No changes needed here, but they rely on getElement working now
function setupConfigurationListeners() { /* ... same as v8.3 ... */ }
function setupStep1Listeners() { /* ... same as v8.3 ... */ }
function setupStep2Listeners() { /* ... same as v8.3 ... */ }
function setupStep3Listeners() { /* ... same as v8.3 ... */ }
function setupStep4Listeners() { /* ... same as v8.3 ... */ }
function setupBulkModeListeners() { /* ... same as v8.3 ... */ }

// --- Initialize ---
// We absolutely MUST wait for the DOM to be ready before doing anything,
// especially caching elements.
logToConsole("article-main.js evaluating. Setting up DOMContentLoaded listener.", "debug");

// Attach the listener only once.
document.addEventListener('DOMContentLoaded', initializeApp, { once: true });

// Remove the check for `document.readyState !== 'loading'` because
// if the script loads *after* DOMContentLoaded has already fired,
// the listener added above might not fire again. However, modules scripts
// at the end of the body *should* execute after parsing anyway.
// The { once: true } listener is the most reliable way.

console.log("article-main.js loaded (v8.4 timing fix 2)");