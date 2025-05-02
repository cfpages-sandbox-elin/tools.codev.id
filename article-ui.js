// article-ui.js (More robust caching checks)
import { textProviders, imageProviders, languageOptions, defaultSettings } from './article-config.js';
import { getState, getCustomModelState } from './article-state.js';
import { logToConsole, showElement, findCheapestModel, callAI, disableElement } from './article-helpers.js';

// --- DOM Element References (Centralized) ---
let domElements = {}; // Populated by cacheDomElements
const requiredElementIds = [
    'aiConfigSection', 'aiProviderSelect', 'aiModelSelect', 'useCustomAiModelCheckbox',
    'customAiModelInput', 'apiStatus', 'apiStatusIndicator', // <-- Critical for status
    'step1Section', 'keywordInput', 'bulkModeCheckbox', 'bulkKeywordsContainer',
    'bulkKeywords', 'language', // <-- Critical for language
    'customLanguageInput', 'dialectSelect', 'audienceInput', 'readerNameInput',
    'toneSelect', 'customToneInput', 'genderSelect', 'ageSelect',
    // 'purposeCheckboxes', // QuerySelectorAll, handle differently if needed
    'purposeUrlInput', 'purposeCtaInput', 'formatSelect', 'sitemapUrlInput',
    'fetchSitemapBtn', 'sitemapLoadingIndicator', 'customSpecsInput',
    'generateImagesCheckbox', 'imageOptionsContainer', 'imageProviderSelect',
    'imageModelSelect', 'useCustomImageModelCheckbox', 'customImageModelInput',
    'numImagesSelect', 'imageAspectRatioSelect', 'imageSubjectInput',
    'imageStyleSelect', 'imageStyleModifiersInput', 'imageTextInput',
    // 'imageStorageRadios', // QuerySelectorAll, handle differently if needed
    'githubOptionsContainer', 'githubRepoUrlInput', 'githubCustomPathInput',
    'generateSingleBtn', 'generatePlanBtn', 'structureLoadingIndicator',
    'planLoadingIndicator', 'resetDataBtn', 'forceReloadBtn', 'step1_5Section',
    'planningTableContainer', // 'planningTableBody', // QuerySelector
    'startBulkGenerationBtn', 'bulkLoadingIndicator', 'downloadBulkZipBtn',
    'bulkGenerationProgress', 'bulkCurrentNum', 'bulkTotalNum', 'bulkCurrentKeyword',
    'bulkUploadProgressContainer', 'bulkUploadProgressBar', 'bulkUploadProgressText',
    'step2Section', 'toggleStructureVisibilityBtn', 'articleTitleInput',
    'structureContainer', 'articleStructureTextarea', 'sitemapUrlsListDiv',
    'linkTypeToggle', 'linkTypeText', 'generateArticleBtn', 'articleLoadingIndicator',
    'generationProgressDiv', 'currentSectionNumSpan', 'totalSectionNumSpan',
    'uploadProgressContainer', 'uploadProgressBar', 'uploadProgressText',
    'step3Section', 'articleOutputContainer', 'generatedArticleTextarea',
    'htmlPreviewDiv', 'previewHtmlCheckbox', 'enableSpinningBtn',
    'spinLoadingIndicator', 'step4Section', 'spinSelectedBtn',
    'spinActionLoadingIndicator', 'spinOutputContainer', 'spunArticleDisplay',
    'consoleLogContainer', 'consoleLog'
];

export function cacheDomElements() {
    logToConsole("Attempting to cache DOM elements...", "info");
    let allFound = true;
    domElements = {}; // Reset before caching

    requiredElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            domElements[id] = element;
        } else {
            logToConsole(`Failed to cache element with ID: ${id}`, 'error');
            allFound = false;
            domElements[id] = null; // Explicitly set to null if not found
        }
    });

    // Special cases for querySelector / querySelectorAll
    const planningTableBody = document.querySelector('#planningTable tbody');
    if (planningTableBody) {
        domElements['planningTableBody'] = planningTableBody;
    } else {
         logToConsole(`Failed to cache element with selector: #planningTable tbody`, 'error');
         allFound = false;
         domElements['planningTableBody'] = null;
    }

    const purposeCheckboxes = document.querySelectorAll('input[name="purpose"]');
     if (purposeCheckboxes && purposeCheckboxes.length > 0) {
         domElements['purposeCheckboxes'] = purposeCheckboxes;
     } else {
          logToConsole(`Failed to cache elements with selector: input[name="purpose"]`, 'warn'); // Warn as maybe 0 is valid initially?
          // Keep it undefined or null if not found? Decide based on usage. Let's use null.
          domElements['purposeCheckboxes'] = null;
     }

     const imageStorageRadios = document.querySelectorAll('input[name="imageStorage"]');
     if (imageStorageRadios && imageStorageRadios.length > 0) {
         domElements['imageStorageRadios'] = imageStorageRadios;
     } else {
          logToConsole(`Failed to cache elements with selector: input[name="imageStorage"]`, 'warn');
          domElements['imageStorageRadios'] = null;
     }


    if (allFound) {
        logToConsole("All expected DOM Elements cached successfully.", "success");
    } else {
        logToConsole("One or more critical DOM elements failed to cache! UI will likely malfunction.", "error");
    }
}

// Modify getElement to be more robust against null values during retrieval
export function getElement(id) {
    const element = domElements[id];
    if (element === undefined || element === null) {
        // This log indicates that an element *needed* later was not found during the initial caching phase.
        logToConsole(`Attempted to get element '${id}', but it was not found during caching or is null.`, 'warn');
    }
    return element; // Return the element or null/undefined
}

// --- UI Update Functions ---

// Function to safely populate select, checking element existence first
function populateSelect(selectElement, options, selectedValue = null, addEmptyOption = false, emptyText = "-- Select --") {
    // Critical Check: Ensure the element exists before proceeding
    if (!selectElement) {
        // console.error(`Cannot populate select: Element not found (was null). ID was likely not cached.`, {options, selectedValue}); // More context
        // logToConsole is already called by getElement if needed, avoid double logging.
        return 0; // Indicate failure
    }
    const elementName = selectElement.id || selectElement.name || 'Unnamed Select';
    // logToConsole(`Populating select '${elementName}'...`, 'debug');

    selectElement.innerHTML = ''; // Clear existing options
    let optionsAdded = 0;

    if (addEmptyOption) {
        const emptyOpt = document.createElement('option');
        emptyOpt.value = "";
        emptyOpt.textContent = emptyText;
        selectElement.appendChild(emptyOpt);
        optionsAdded++;
    }

    options.forEach(option => {
        const opt = document.createElement('option');
        if (typeof option === 'string') {
            opt.value = option;
            opt.textContent = option;
        } else {
            opt.value = option.value;
            opt.textContent = option.text;
        }
        selectElement.appendChild(opt);
        optionsAdded++;
    });

    // Set selected value
    if (selectedValue !== null && selectedValue !== undefined && Array.from(selectElement.options).some(opt => opt.value === selectedValue)) {
        selectElement.value = selectedValue;
    } else if (selectElement.options.length > 0) {
        selectElement.selectedIndex = 0;
    }

    // logToConsole(`Finished populating '${elementName}'. Added ${optionsAdded} options.`, 'debug');
    return optionsAdded;
}

// --- API Status Function ---
export async function checkApiStatus() {
    const state = getState();
    const providerKey = state.textProvider;
    const model = state.useCustomTextModel ? state.customTextModel : state.textModel;

    // Get elements *safely* using the updated getElement
    const statusDiv = getElement('apiStatus');
    const statusIndicator = getElement('apiStatusIndicator');

    // Check if elements were retrieved successfully
    if (!statusDiv) {
        // Logged by getElement already, maybe add specific context?
        // logToConsole("API Status display element ('apiStatus') not available.", "error");
        return; // Cannot update UI if element is missing
    }
    if (!statusIndicator) {
        // logToConsole("API Status indicator element ('apiStatusIndicator') not available.", "error");
        // We can potentially continue without the indicator, but log it.
    }


    // Reset status visually before check
    statusDiv.innerHTML = ''; // Clear previous content
    showElement(statusIndicator, false); // Hide indicator


    if (!providerKey) {
        statusDiv.innerHTML = `<span class="status-error">Select Provider</span>`;
        logToConsole("API Status Check skipped: Provider missing.", "warn");
        return;
    }
    if (!model) {
        statusDiv.innerHTML = `<span class="status-error">Select Model</span>`;
        logToConsole("API Status Check skipped: Model missing.", "warn");
        return;
    }

    logToConsole(`Checking API Status for Provider: ${providerKey}, Model: ${model} (Custom: ${state.useCustomTextModel})`, "info");
    statusDiv.innerHTML = `<span class="status-checking">Checking ${providerKey} (${model})...</span>`;
    showElement(statusIndicator, true);


    try {
        const result = await callAI('check_status', { providerKey, model }, null, null);
        if (!result?.success) { throw new Error(result?.error || `Status check failed`); }
        statusDiv.innerHTML = `<span class="status-ok">✅ Ready (${providerKey})</span>`;
        logToConsole(`API Status OK for ${providerKey} (${model})`, 'success');
    } catch (error) {
        console.error("API Status Check Failed:", error);
        logToConsole(`API Status Error: ${error.message}`, 'error');
        const displayError = error.message.includes(':') ? error.message.substring(error.message.indexOf(':') + 1).trim() : error.message;
        // Ensure statusDiv still exists before updating on error
        if(getElement('apiStatus')) { // Re-check just in case
             getElement('apiStatus').innerHTML = `<span class="status-error">❌ Error: ${displayError}</span>`;
        }
    } finally {
         showElement(getElement('apiStatusIndicator'), false); // Use getElement again for safety
    }
}


// Populate Languages and Dialects
export function populateLanguagesUI(state) {
    logToConsole("Populating languages...", "info");
    // Use the safe getElement
    const languageSelect = getElement('language');

    // Check if element exists before proceeding
    if (!languageSelect) {
        logToConsole("Language select ('language') element not found. Cannot populate languages.", "error");
        // Attempt to update dialects to show error state even if language select failed
        populateDialectsUI(state); // Pass state so it knows language is missing
        return;
    }

    const options = Object.keys(languageOptions).map(k => ({ value: k, text: languageOptions[k].name }));
    const count = populateSelect(languageSelect, options, state.language);

    if (count === 0) {
        logToConsole("Language select populated with 0 options!", "error");
    } else {
        logToConsole(`Populated languages. Selected: ${languageSelect.value}`, 'info');
    }

    // Populate dialects immediately after languages are set
    populateDialectsUI(state);
}

// Populate Dialects based on the language in the provided state
export function populateDialectsUI(state) {
    const selectedLangKey = state.language; // Read from the provided state
    // Use safe getElement
    const dialectSelect = getElement('dialectSelect');
    const customLanguageInput = getElement('customLanguageInput');

    // Only proceed if dialectSelect exists
    if (!dialectSelect) {
         logToConsole("Dialect select ('dialectSelect') element not found. Cannot populate dialects.", "error");
         // Hide custom input if it exists but dialect doesn't
         showElement(customLanguageInput, false);
         return;
    }


    logToConsole(`Populating dialects for language key: ${selectedLangKey}`, "info");

    // Reset dialects first
    dialectSelect.innerHTML = '';
    disableElement(dialectSelect, true); // Disable by default


    // Show/Hide Custom Language Input - check if element exists
    const showCustom = selectedLangKey === 'custom';
     if(customLanguageInput) {
        showElement(customLanguageInput, showCustom);
        customLanguageInput.classList.toggle('custom-input-visible', showCustom);
        if (showCustom) {
             customLanguageInput.value = state.customLanguage || '';
        }
     } else if (showCustom) {
        logToConsole("Custom language selected, but input element ('customLanguageInput') not found.", "warn");
     }


    // Handle language selection states
    if (!selectedLangKey) {
        // No language selected (e.g., initial load failed)
        dialectSelect.innerHTML = '<option value="">-- Select Language --</option>';
        logToConsole("No language selected, disabling dialects.", 'warn');
        return;
    } else if (selectedLangKey === 'custom') {
        // Custom language selected
        dialectSelect.innerHTML = '<option value="">-- N/A --</option>';
         logToConsole("Custom language selected, disabling dialects.", 'info');
         return;
    }

    // Handle standard languages
    const langConfig = languageOptions[selectedLangKey];
    const dialects = langConfig?.dialects || [];
    const currentDialectFromState = state.dialect;

    if (dialects.length > 0) {
        populateSelect(dialectSelect, dialects, currentDialectFromState, false);
        disableElement(dialectSelect, false); // Enable dialect selection
        logToConsole(`Populated ${dialects.length} dialects for ${selectedLangKey}. Selected: ${dialectSelect.value}`, 'info');
    } else {
        dialectSelect.innerHTML = '<option value="">-- N/A --</option>';
        disableElement(dialectSelect, true);
        logToConsole(`No dialects found for ${selectedLangKey}. Disabling select.`, 'info');
    }
}


// --- Other functions (populateAiProviders, populateTextModels, populateImageModels, etc.) ---
// Should now work correctly provided cacheDomElements successfully finds the elements.
// Add checks using getElement() inside them if needed, like we did for populateLanguagesUI.

// Example: Ensure provider selects exist in populateAiProviders
export function populateAiProviders(state) {
    logToConsole("Populating AI providers...", "info");
    const textProviderSelect = getElement('aiProviderSelect');
    const imageProviderSelect = getElement('imageProviderSelect');

    if (textProviderSelect) {
        populateSelect(textProviderSelect, Object.keys(textProviders), state.textProvider);
    } else {
        logToConsole("Text Provider select element ('aiProviderSelect') not found for population.", "error");
    }
    if (imageProviderSelect) {
        populateSelect(imageProviderSelect, Object.keys(imageProviders), state.imageProvider);
    } else {
        logToConsole("Image Provider select element ('imageProviderSelect') not found for population.", "error");
    }
}

// Rest of the file remains the same as the previous version...
// Make sure to include all other functions like toggleCustomModelUI, updateUIBasedOnMode,
// updateUIFromState, renderPlanningTable, updatePlanItemStatusUI, updateProgressBar,
// hideProgressBar, toggleGithubOptions, displaySitemapUrlsUI

console.log("article-ui.js loaded (v8.3 caching fixes)"); // Update version marker if desired