// article-ui.js (fixed state reading, population, and status trigger)
import { textProviders, imageProviders, languageOptions, defaultSettings } from './article-config.js';
import { getState, getCustomModelState } from './article-state.js';
import { logToConsole, showElement, findCheapestModel, callAI, disableElement } from './article-helpers.js';

// --- DOM Element References (Centralized) ---
let domElements = {}; // Populated by cacheDomElements

export function cacheDomElements() {
    // Cache all elements by ID
    domElements = { aiConfigSection: document.getElementById('aiConfigSection'), aiProviderSelect: document.getElementById('ai_provider'), aiModelSelect: document.getElementById('ai_model'), useCustomAiModelCheckbox: document.getElementById('useCustomAiModel'), customAiModelInput: document.getElementById('customAiModel'), apiStatusDiv: document.getElementById('apiStatus'), apiStatusIndicator: document.getElementById('apiStatusIndicator'), step1Section: document.getElementById('step1'), keywordInput: document.getElementById('keyword'), bulkModeCheckbox: document.getElementById('bulkModeCheckbox'), bulkKeywordsContainer: document.getElementById('bulkKeywordsContainer'), bulkKeywords: document.getElementById('bulkKeywords'), languageSelect: document.getElementById('language'), customLanguageInput: document.getElementById('custom_language'), dialectSelect: document.getElementById('dialect'), audienceInput: document.getElementById('audience'), readerNameInput: document.getElementById('readerName'), toneSelect: document.getElementById('tone'), customToneInput: document.getElementById('custom_tone'), genderSelect: document.getElementById('gender'), ageSelect: document.getElementById('age'), purposeCheckboxes: document.querySelectorAll('input[name="purpose"]'), purposeUrlInput: document.getElementById('purposeUrl'), purposeCtaInput: document.getElementById('purposeCta'), formatSelect: document.getElementById('format'), sitemapUrlInput: document.getElementById('sitemapUrl'), fetchSitemapBtn: document.getElementById('fetchSitemapBtn'), sitemapLoadingIndicator: document.getElementById('sitemapLoadingIndicator'), customSpecsInput: document.getElementById('custom_specs'), generateImagesCheckbox: document.getElementById('generateImages'), imageOptionsContainer: document.getElementById('imageOptionsContainer'), imageProviderSelect: document.getElementById('imageProvider'), imageModelSelect: document.getElementById('imageModel'), useCustomImageModelCheckbox: document.getElementById('useCustomImageModel'), customImageModelInput: document.getElementById('customImageModel'), numImagesSelect: document.getElementById('numImages'), imageAspectRatioSelect: document.getElementById('imageAspectRatio'), imageSubjectInput: document.getElementById('imageSubject'), imageStyleSelect: document.getElementById('imageStyle'), imageStyleModifiersInput: document.getElementById('imageStyleModifiers'), imageTextInput: document.getElementById('imageText'), imageStorageRadios: document.querySelectorAll('input[name="imageStorage"]'), githubOptionsContainer: document.getElementById('githubOptionsContainer'), githubRepoUrlInput: document.getElementById('githubRepoUrl'), githubCustomPathInput: document.getElementById('githubCustomPath'), generateSingleBtn: document.getElementById('generateSingleBtn'), generatePlanBtn: document.getElementById('generatePlanBtn'), structureLoadingIndicator: document.getElementById('structureLoadingIndicator'), planLoadingIndicator: document.getElementById('planLoadingIndicator'), resetDataBtn: document.getElementById('resetDataBtn'), forceReloadBtn: document.getElementById('forceReloadBtn'), step1_5Section: document.getElementById('step1_5'), planningTableContainer: document.getElementById('planningTableContainer'), planningTableBody: document.querySelector('#planningTable tbody'), startBulkGenerationBtn: document.getElementById('startBulkGenerationBtn'), bulkLoadingIndicator: document.getElementById('bulkLoadingIndicator'), downloadBulkZipBtn: document.getElementById('downloadBulkZipBtn'), bulkGenerationProgress: document.getElementById('bulkGenerationProgress'), bulkCurrentNum: document.getElementById('bulkCurrentNum'), bulkTotalNum: document.getElementById('bulkTotalNum'), bulkCurrentKeyword: document.getElementById('bulkCurrentKeyword'), bulkUploadProgressContainer: document.getElementById('bulkUploadProgressContainer'), bulkUploadProgressBar: document.getElementById('bulkUploadProgressBar'), bulkUploadProgressText: document.getElementById('bulkUploadProgressText'), step2Section: document.getElementById('step2'), toggleStructureVisibilityBtn: document.getElementById('toggleStructureVisibilityBtn'), articleTitleInput: document.getElementById('articleTitle'), structureContainer: document.getElementById('structureContainer'), articleStructureTextarea: document.getElementById('article_structure'), sitemapUrlsListDiv: document.getElementById('sitemapUrlsList'), linkTypeToggle: document.getElementById('linkTypeToggle'), linkTypeText: document.getElementById('linkTypeText'), generateArticleBtn: document.getElementById('generateArticleBtn'), articleLoadingIndicator: document.getElementById('articleLoadingIndicator'), generationProgressDiv: document.getElementById('generationProgress'), currentSectionNumSpan: document.getElementById('currentSectionNum'), totalSectionNumSpan: document.getElementById('totalSectionNum'), uploadProgressContainer: document.getElementById('uploadProgressContainer'), uploadProgressBar: document.getElementById('uploadProgressBar'), uploadProgressText: document.getElementById('uploadProgressText'), step3Section: document.getElementById('step3'), articleOutputContainer: document.getElementById('article_output_container'), generatedArticleTextarea: document.getElementById('generated_article'), htmlPreviewDiv: document.getElementById('html_preview'), previewHtmlCheckbox: document.getElementById('preview_html_checkbox'), enableSpinningBtn: document.getElementById('enableSpinningBtn'), spinLoadingIndicator: document.getElementById('spinLoadingIndicator'), step4Section: document.getElementById('step4'), spinSelectedBtn: document.getElementById('spinSelectedBtn'), spinActionLoadingIndicator: document.getElementById('spinActionLoadingIndicator'), spinOutputContainer: document.getElementById('spin_output_container'), spunArticleDisplay: document.getElementById('spun_article_display'), consoleLogContainer: document.getElementById('consoleLogContainer'), consoleLog: document.getElementById('consoleLog'), };

    // Verify crucial elements
    const criticalElements = ['aiProviderSelect', 'aiModelSelect', 'languageSelect', 'dialectSelect', 'bulkModeCheckbox', 'step1_5Section', 'step2Section', 'step3Section', 'step4Section'];
    let missing = false;
    criticalElements.forEach(id => {
        if (!domElements[id]) {
            console.error(`Critical DOM element not found during cache: ${id}`);
            missing = true;
        }
    });
    if (!missing) {
        logToConsole("DOM Elements cached.", "info");
    } else {
        logToConsole("Critical DOM elements missing! UI may not function correctly.", "error");
    }
}

export function getElement(id) {
    const element = domElements[id];
    // Add a check during retrieval as well
    // if (!element) {
    //     logToConsole(`Attempted to get non-existent or non-cached element: ${id}`, 'warn');
    // }
    return element;
}

// --- UI Update Functions ---

function populateSelect(selectElement, options, selectedValue = null, addEmptyOption = false, emptyText = "-- Select --") {
    if (!selectElement) { logToConsole(`Cannot populate select: Element not found (was null).`, 'error'); return 0; }
    const elementName = selectElement.id || selectElement.name || 'Unnamed Select';
    // logToConsole(`Populating select '${elementName}' with ${options.length} options. Selected: ${selectedValue}`, 'debug'); // More detailed log

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
        } else { // Assuming { value: '...', text: '...' } format
            opt.value = option.value;
            opt.textContent = option.text;
        }
        selectElement.appendChild(opt);
        optionsAdded++;
    });

    // Set the selected value *after* populating
    if (selectedValue !== null && selectedValue !== undefined && Array.from(selectElement.options).some(opt => opt.value === selectedValue)) {
        selectElement.value = selectedValue;
        // logToConsole(`Set selected value for '${elementName}' to: ${selectedValue}`, 'debug');
    } else if (selectElement.options.length > 0) {
        selectElement.selectedIndex = 0; // Default to the first option (could be empty or the first real one)
        // logToConsole(`Selected value '${selectedValue}' not found in '${elementName}', defaulting to index 0.`, 'debug');
    } else {
        // logToConsole(`No options to select in '${elementName}'.`, 'warn');
    }

    // logToConsole(`Finished populating '${elementName}'. Added ${optionsAdded} options. Final value: ${selectElement.value}`, 'debug');
    return optionsAdded;
}


export function populateAiProviders(state) {
    logToConsole("Populating AI providers...", "info");
    // Ensure elements exist before populating
    const textProviderSelect = getElement('aiProviderSelect');
    const imageProviderSelect = getElement('imageProviderSelect');

    if (textProviderSelect) {
        populateSelect(textProviderSelect, Object.keys(textProviders), state.textProvider);
    } else {
        logToConsole("Text Provider select element not found for population.", "error");
    }
    if (imageProviderSelect) {
        populateSelect(imageProviderSelect, Object.keys(imageProviders), state.imageProvider);
    } else {
        logToConsole("Image Provider select element not found for population.", "error");
    }
}

// --- API Status Function ---
export async function checkApiStatus() {
    const state = getState(); // Get FRESH state just before the check
    const providerKey = state.textProvider;

    // Determine the *currently active* model based on checkbox state
    const model = state.useCustomTextModel
        ? state.customTextModel // Use the custom model value from state
        : state.textModel;      // Use the standard model value from state

    const statusDiv = getElement('apiStatus');
    const statusIndicator = getElement('apiStatusIndicator');

    if (!statusDiv || !statusIndicator) {
        logToConsole("API Status UI elements not found.", "error");
        return;
    }

    // Reset status visually before check
    statusDiv.innerHTML = '';
    showElement(statusIndicator, false);

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
        // Ensure payload matches backend expectation for 'check_status'
        const result = await callAI('check_status', { providerKey, model }, null, null); // Pass exactly what's needed

        if (!result?.success) {
            throw new Error(result?.error || `Status check failed`);
        }
        statusDiv.innerHTML = `<span class="status-ok">✅ Ready (${providerKey})</span>`;
        logToConsole(`API Status OK for ${providerKey} (${model})`, 'success');
    } catch (error) {
        console.error("API Status Check Failed:", error);
        logToConsole(`API Status Error: ${error.message}`, 'error');
        // Extract a cleaner error message if possible
        const displayError = error.message.includes(':') ? error.message.substring(error.message.indexOf(':') + 1).trim() : error.message;
        statusDiv.innerHTML = `<span class="status-error">❌ Error: ${displayError}</span>`;
    } finally {
         showElement(statusIndicator, false); // Always hide loader
    }
}


// Populate Text Models based on selected provider FROM STATE
export function populateTextModels(setDefault = false) {
    const state = getState(); // Get FRESH state reflecting the selected provider
    const providerKey = state.textProvider;
    const aiModelSelect = getElement('aiModelSelect');
    const useCustomCheckbox = getElement('useCustomAiModelCheckbox');
    const customInput = getElement('customAiModelInput');

    if (!aiModelSelect || !useCustomCheckbox || !customInput) {
        logToConsole("Missing elements for populateTextModels.", "error");
        return;
    }

    logToConsole(`Populating text models for provider: ${providerKey}`, "info");

    if (!providerKey || !textProviders[providerKey]) {
        logToConsole(`Cannot populate text models: Invalid provider key '${providerKey}' found in state. Clearing select.`, "warn");
        aiModelSelect.innerHTML = '<option value="">-- Select Provider --</option>';
        disableElement(aiModelSelect, true);
        // Ensure custom UI is also hidden/disabled if no provider
        useCustomCheckbox.checked = false;
        customInput.value = '';
        toggleCustomModelUI('text'); // Update visibility/disabled state
        checkApiStatus(); // Update status to reflect missing provider/model
        return;
    }

    const providerConfig = textProviders[providerKey];
    const models = providerConfig?.models || [];

    // Determine which model *should* be selected in the dropdown
    // This depends ONLY on the standard model state IF custom is NOT checked.
    const standardModelFromState = state.textModel;

    populateSelect(aiModelSelect, models); // Populate with available models

    let modelToSelectInDropdown = '';
    if (setDefault && !state.useCustomTextModel && models.length > 0) {
        // If setting default and not using custom, find cheapest
        modelToSelectInDropdown = findCheapestModel(models);
        if (modelToSelectInDropdown) logToConsole(`Default text model set to: ${modelToSelectInDropdown}`, 'info');
    } else if (!state.useCustomTextModel && standardModelFromState && models.includes(standardModelFromState)) {
        // If not using custom, and the saved standard model is valid for this provider, select it
        modelToSelectInDropdown = standardModelFromState;
    } else if (!state.useCustomTextModel && models.length > 0) {
        // Fallback: If not using custom, but saved model is invalid or missing, select the first available
        modelToSelectInDropdown = models[0];
    }
    // If state.useCustomTextModel is true, modelToSelectInDropdown remains '',
    // and the dropdown will show its first option by default, but it's not the *active* model.

    if (modelToSelectInDropdown) {
        aiModelSelect.value = modelToSelectInDropdown;
        logToConsole(`Setting text model dropdown value to: ${modelToSelectInDropdown}`, 'info');
    } else if (!state.useCustomTextModel && aiModelSelect.options.length > 0) {
         aiModelSelect.selectedIndex = 0; // Explicitly set to first if no specific selection applied
         logToConsole(`No specific text model to select, defaulting dropdown to index 0.`, 'info');
    }


    // Update the custom model UI elements based on the *current* state
    useCustomCheckbox.checked = state.useCustomTextModel || false;
    customInput.value = getCustomModelState('text', providerKey); // Get saved custom value for *this* provider
    toggleCustomModelUI('text'); // This enables/disables the standard dropdown and shows/hides custom input

    // Final check for emptiness if not using custom
    if (!state.useCustomTextModel && aiModelSelect.options.length === 0) {
        logToConsole(`Text Model select is empty after population attempt for provider ${providerKey}! Disabling.`, "error");
        disableElement(aiModelSelect, true);
    }

    // Check API status *after* all UI elements reflect the current state
    // Let the calling context (event listener) handle the checkApiStatus call
    // checkApiStatus(); // REMOVED - Let the change event trigger this
}

// Populate Image Models based on selected provider FROM STATE
export function populateImageModels(setDefault = false) {
    const state = getState(); // Get FRESH state
    const providerKey = state.imageProvider;
    const imageModelSelect = getElement('imageModelSelect');
    const imageAspectRatioSelect = getElement('imageAspectRatioSelect');
    const useCustomCheckbox = getElement('useCustomImageModelCheckbox');
    const customInput = getElement('customImageModelInput');

    if (!imageModelSelect || !imageAspectRatioSelect || !useCustomCheckbox || !customInput) {
        logToConsole("Missing elements for populateImageModels.", "error");
        return;
    }

    logToConsole(`Populating image models for provider: ${providerKey}`, "info");

    if (!providerKey || !imageProviders[providerKey]) {
        logToConsole(`Cannot populate image models: Invalid provider key '${providerKey}'. Clearing selects.`, "warn");
        imageModelSelect.innerHTML = '<option value="">-- Select Provider --</option>';
        imageAspectRatioSelect.innerHTML = '<option value="">-- N/A --</option>';
        disableElement(imageModelSelect, true);
        disableElement(imageAspectRatioSelect, true);
        useCustomCheckbox.checked = false;
        customInput.value = '';
        toggleCustomModelUI('image');
        return;
    }

    const providerConfig = imageProviders[providerKey];
    const models = providerConfig?.models || [];
    const aspectRatios = providerConfig?.aspectRatios || ["1:1"]; // Default if not specified
    const standardModelFromState = state.imageModel;
    const aspectRatioFromState = state.imageAspectRatio; // Read current aspect ratio

    populateSelect(imageModelSelect, models);
    // Populate aspect ratios, selecting the one from state IF it's valid for the NEW provider
    const validAspectRatio = aspectRatios.includes(aspectRatioFromState) ? aspectRatioFromState : aspectRatios[0];
    populateSelect(imageAspectRatioSelect, aspectRatios, validAspectRatio);
    disableElement(imageAspectRatioSelect, false); // Ensure it's enabled if provider is valid

    let modelToSelectInDropdown = '';
    if (setDefault && !state.useCustomImageModel && models.length > 0) {
        modelToSelectInDropdown = findCheapestModel(models); // Assuming findCheapest works or returns first
        if (modelToSelectInDropdown) logToConsole(`Default image model set to: ${modelToSelectInDropdown}`, 'info');
    } else if (!state.useCustomImageModel && standardModelFromState && models.includes(standardModelFromState)) {
        modelToSelectInDropdown = standardModelFromState;
    } else if (!state.useCustomImageModel && models.length > 0) {
        modelToSelectInDropdown = models[0];
    }

    if (modelToSelectInDropdown) {
        imageModelSelect.value = modelToSelectInDropdown;
        logToConsole(`Setting image model dropdown value to: ${modelToSelectInDropdown}`, 'info');
    } else if (!state.useCustomImageModel && imageModelSelect.options.length > 0) {
         imageModelSelect.selectedIndex = 0;
         logToConsole(`No specific image model to select, defaulting dropdown to index 0.`, 'info');
    }


    useCustomCheckbox.checked = state.useCustomImageModel || false;
    customInput.value = getCustomModelState('image', providerKey);
    toggleCustomModelUI('image');

    if (!state.useCustomImageModel && imageModelSelect.options.length === 0) {
        logToConsole(`Image Model select is empty after population for provider ${providerKey}! Disabling.`, "error");
        disableElement(imageModelSelect, true);
    }
}


// Toggle Custom Model UI Elements
export function toggleCustomModelUI(type) {
    const useCustomCheckbox = type === 'text' ? getElement('useCustomAiModelCheckbox') : getElement('useCustomImageModelCheckbox');
    const modelSelect = type === 'text' ? getElement('aiModelSelect') : getElement('imageModelSelect');
    const customInput = type === 'text' ? getElement('customAiModelInput') : getElement('customImageModelInput');

    if (!useCustomCheckbox || !modelSelect || !customInput) {
        logToConsole(`Missing UI elements for custom model toggle (type: ${type})`, 'warn');
        return;
    }

    const useStandard = !useCustomCheckbox.checked;
    logToConsole(`Toggling Custom UI for ${type}: Use Standard = ${useStandard}`, 'info');

    // Disable the *standard* select if custom is checked
    disableElement(modelSelect, !useStandard);
    // Show the *custom* input if custom is checked
    showElement(customInput, !useStandard);
    customInput.classList.toggle('custom-input-visible', !useStandard);
    // Ensure the standard select is NOT disabled if we switch back to standard
    // (unless it has no options or provider is invalid)
    if (useStandard) {
         const providerKey = getState()[type === 'text' ? 'textProvider' : 'imageProvider'];
         const providerConfig = type === 'text' ? textProviders[providerKey] : imageProviders[providerKey];
         const hasModels = providerConfig?.models?.length > 0;
         disableElement(modelSelect, !hasModels); // Keep disabled if no models even when standard selected
    }
}


// Populate Languages and Dialects
export function populateLanguagesUI(state) {
    logToConsole("Populating languages...", "info");
    const languageSelect = getElement('language');
    if (!languageSelect) { logToConsole("Language select not found!", "error"); return; }

    const options = Object.keys(languageOptions).map(k => ({ value: k, text: languageOptions[k].name }));
    const count = populateSelect(languageSelect, options, state.language);
    if (count === 0) { logToConsole("Language select is empty after population attempt!", "error"); }
    else { logToConsole(`Populated languages. Selected: ${state.language}`, 'info'); }

    // IMPORTANT: Populate dialects immediately after languages are set, using the *same state*
    populateDialectsUI(state);
}

// Populate Dialects based on the language in the provided state
export function populateDialectsUI(state) {
    const selectedLangKey = state.language; // Read from the provided state
    const dialectSelect = getElement('dialectSelect');
    const customLanguageInput = getElement('customLanguageInput');

    if (!dialectSelect || !customLanguageInput) { logToConsole("Missing elements for populateDialectsUI.", "error"); return; }

    logToConsole(`Populating dialects for language key: ${selectedLangKey}`, "info");

    // Reset dialects first
    dialectSelect.innerHTML = '';
    disableElement(dialectSelect, true); // Disable by default

    if (!selectedLangKey || selectedLangKey === 'custom') {
        const showCustom = selectedLangKey === 'custom';
        showElement(customLanguageInput, showCustom);
        customLanguageInput.classList.toggle('custom-input-visible', showCustom);
        if (showCustom) {
            customLanguageInput.value = state.customLanguage || '';
            dialectSelect.innerHTML = '<option value="">-- N/A --</option>';
            logToConsole("Custom language selected, showing input, disabling dialects.", 'info');
        } else {
            // No language selected or invalid key
            dialectSelect.innerHTML = '<option value="">-- Select Language --</option>';
            showElement(customLanguageInput, false);
            customLanguageInput.classList.remove('custom-input-visible');
             logToConsole("No valid language selected, disabling dialects and custom input.", 'warn');
        }
        return; // Exit early for custom or no selection
    }

    // Handle standard languages
    const langConfig = languageOptions[selectedLangKey];
    const dialects = langConfig?.dialects || [];
    const currentDialectFromState = state.dialect;

    showElement(customLanguageInput, false); // Hide custom input for standard languages
    customLanguageInput.classList.remove('custom-input-visible');

    if (dialects.length > 0) {
        populateSelect(dialectSelect, dialects, currentDialectFromState, false); // No empty option needed if dialects exist
        disableElement(dialectSelect, false); // Enable dialect selection
        logToConsole(`Populated ${dialects.length} dialects for ${selectedLangKey}. Selected: ${dialectSelect.value}`, 'info');
    } else {
        dialectSelect.innerHTML = '<option value="">-- N/A --</option>';
        disableElement(dialectSelect, true);
        logToConsole(`No dialects found for ${selectedLangKey}. Disabling select.`, 'info');
    }
}


// Update UI based on Mode (Single/Bulk)
export function updateUIBasedOnMode(isBulkMode) {
    logToConsole(`Switching UI to ${isBulkMode ? 'Bulk' : 'Single'} mode.`, 'info');

    // Ensure all elements are potentially available before trying to access them
    const singleKeywordGroup = getElement('keywordInput')?.closest('.input-group');
    const bulkKeywordsContainer = getElement('bulkKeywordsContainer');
    const generateSingleBtn = getElement('generateSingleBtn');
    const generatePlanBtn = getElement('generatePlanBtn');
    const step1_5Section = getElement('step1_5Section');
    const step2Section = getElement('step2Section');
    const step3Section = getElement('step3Section');
    const step4Section = getElement('step4Section');
    const formatSelect = getElement('formatSelect');

    showElement(singleKeywordGroup, !isBulkMode);
    showElement(bulkKeywordsContainer, isBulkMode);
    showElement(generateSingleBtn, !isBulkMode);
    showElement(generatePlanBtn, isBulkMode);

    // Show/Hide Steps
    showElement(step1_5Section, isBulkMode); // Planning Table Step
    showElement(step2Section, !isBulkMode); // Single - Structure Refine
    showElement(step3Section, !isBulkMode); // Single - Review Article
    showElement(step4Section, !isBulkMode); // Single - Spin

    // Disable format select in bulk mode and force markdown
    if (formatSelect) {
        disableElement(formatSelect, isBulkMode);
        if (isBulkMode) {
            formatSelect.value = 'markdown';
            logToConsole('Format forced to Markdown for Bulk Mode.', 'info');
            // Note: We are *not* updating state here, just the UI.
            // State should be handled when generating if bulk mode is on.
        }
    } else {
        logToConsole("Format select element not found for mode update.", "warn");
    }

    // Ensure sections intended to be hidden initially *are* hidden
    // This is crucial if called during initialization
    if (!isBulkMode) {
        showElement(step1_5Section, false); // Hide planning if switching to single
    } else {
         // Hide single-mode steps if switching to bulk
        showElement(step2Section, false);
        showElement(step3Section, false);
        showElement(step4Section, false);
    }
}


// Update UI with loaded state
export function updateUIFromState(state) {
    logToConsole("Updating UI from loaded state...", "info");
    if (!state) { logToConsole("Cannot update UI: state is null.", "error"); return; }
    if (Object.keys(domElements).length === 0) {
        logToConsole("DOM elements not cached yet. Cannot update UI.", "error");
        return;
    }

    // --- Configuration Section ---
    populateAiProviders(state); // Populates provider selects using state
    // NOTE: populateTextModels/populateImageModels are called AFTER provider selects are populated

    // --- Step 1: Simple Values & Checks ---
    const keywordInput = getElement('keywordInput');
    if (keywordInput) {
        keywordInput.value = state.keyword || ''; // Use saved or empty string
    }
    const bulkModeCheckbox = getElement('bulkModeCheckbox');
    if (bulkModeCheckbox) {
        bulkModeCheckbox.checked = state.bulkMode || defaultSettings.bulkMode;
    }
     const bulkKeywords = getElement('bulkKeywords');
     if (bulkKeywords) {
         // Maybe load saved bulk keywords if needed? For now, keep it empty on load.
         // bulkKeywords.value = state.savedBulkKeywords || '';
     }

    populateLanguagesUI(state); // Populates language AND dialect based on loaded state

    // Set other simple input/select values
    getElement('audienceInput').value = state.audience || defaultSettings.audience;
    getElement('readerNameInput').value = state.readerName || defaultSettings.readerName;
    getElement('toneSelect').value = state.tone || defaultSettings.tone;
    getElement('customToneInput').value = state.customTone || '';
    getElement('genderSelect').value = state.gender || defaultSettings.gender;
    getElement('ageSelect').value = state.age || defaultSettings.age;
    getElement('formatSelect').value = state.format || defaultSettings.format;
    getElement('sitemapUrlInput').value = state.sitemapUrl || defaultSettings.sitemapUrl;
    getElement('customSpecsInput').value = state.customSpecs || defaultSettings.customSpecs;

    // --- Step 1: Purpose ---
    const savedPurposes = state.purpose || defaultSettings.purpose;
    let showPurposeUrl = false; let showPurposeCta = false;
    const purposeCheckboxes = document.querySelectorAll('input[name="purpose"]'); // Re-query here as it's a list
    purposeCheckboxes.forEach(cb => {
        cb.checked = savedPurposes.includes(cb.value);
        if (cb.checked) {
            if (cb.value === 'Promote URL') showPurposeUrl = true;
            if (cb.value.startsWith('Promote') || cb.value === 'Generate Leads') showPurposeCta = true;
        }
    });
    getElement('purposeUrlInput').value = state.purposeUrl || defaultSettings.purposeUrl;
    getElement('purposeCtaInput').value = state.purposeCta || defaultSettings.purposeCta;
    showElement(getElement('purposeUrlInput'), showPurposeUrl);
    showElement(getElement('purposeCtaInput'), showPurposeCta);
    showElement(getElement('customToneInput'), state.tone === 'custom'); // Show/hide custom tone input


    // --- Step 1: Images ---
    const generateImagesCheckbox = getElement('generateImagesCheckbox');
     if (generateImagesCheckbox) {
        generateImagesCheckbox.checked = state.generateImages || defaultSettings.generateImages;
    }
    getElement('numImagesSelect').value = state.numImages || defaultSettings.numImages;
    getElement('imageSubjectInput').value = state.imageSubject || defaultSettings.imageSubject;
    getElement('imageStyleSelect').value = state.imageStyle || defaultSettings.imageStyle;
    getElement('imageStyleModifiersInput').value = state.imageStyleModifiers || defaultSettings.imageStyleModifiers;
    getElement('imageTextInput').value = state.imageText || defaultSettings.imageText;
    const storageValue = state.imageStorage || defaultSettings.imageStorage;
    const radioToCheck = document.querySelector(`input[name="imageStorage"][value="${storageValue}"]`);
    if (radioToCheck) radioToCheck.checked = true;
    else {
        const firstRadio = document.querySelector('input[name="imageStorage"]');
        if (firstRadio) firstRadio.checked = true; // Default to first if saved value invalid
    }
    getElement('githubRepoUrlInput').value = state.githubRepoUrl || defaultSettings.githubRepoUrl;
    getElement('githubCustomPathInput').value = state.githubCustomPath || defaultSettings.githubCustomPath;

    // --- Populate Models (Now that providers are set) ---
    populateTextModels(); // Reads state internally
    populateImageModels(); // Reads state internally, including aspect ratio

    // --- Toggle Visibility Based on State ---
    showElement(getElement('imageOptionsContainer'), state.generateImages);
    showElement(getElement('githubOptionsContainer'), state.generateImages && storageValue === 'github');
    updateUIBasedOnMode(state.bulkMode); // CRITICAL: Set initial view based on loaded bulkMode
    toggleGithubOptions(); // Ensure correct visibility based on loaded storage type

    // --- Step 2 ---
    const articleTitleInput = getElement('articleTitleInput');
     if (articleTitleInput) {
         articleTitleInput.value = state.articleTitle || ''; // Restore saved title for single mode
     }
    // Structure textarea likely loaded empty or with previous session's *unsaved* content.
    // We don't typically save the structure text itself in appState.
    getElement('linkTypeToggle').checked = !(state.linkTypeInternal ?? defaultSettings.linkTypeInternal);
    getElement('linkTypeText').textContent = (state.linkTypeInternal ?? defaultSettings.linkTypeInternal) ? 'Internal' : 'External';


    // --- Step 1.5: Bulk Plan ---
    // Render the planning table if bulk mode is active and plan exists
    if (state.bulkMode) {
        renderPlanningTable(getBulkPlan()); // getBulkPlan() reads from state module
    }

    // --- Final API Status Check ---
    // Check status after everything is populated and set based on the loaded state.
    checkApiStatus();

    logToConsole("UI update from state finished.", "info");
}


// --- Planning Table Rendering ---
export function renderPlanningTable(plan) {
    const tableBody = getElement('planningTableBody');
    if (!tableBody) { logToConsole("Planning table body not found.", "error"); return; }

    tableBody.innerHTML = ''; // Clear previous rows
    if (!plan || plan.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No plan generated or loaded.</td></tr>';
        return;
    }

    plan.forEach((item, index) => {
        const row = tableBody.insertRow();
        row.dataset.index = index; // Store index for updates

        let cell;

        // Keyword (read-only)
        cell = row.insertCell();
        cell.textContent = item.keyword || 'N/A';
        cell.classList.add('px-3', 'py-2', 'whitespace-nowrap');


        // Title (editable)
        cell = row.insertCell();
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = item.title || '';
        titleInput.dataset.field = 'title'; // For identifying change
        titleInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full');
        cell.appendChild(titleInput);
        cell.classList.add('px-3', 'py-2');


        // Slug (editable)
        cell = row.insertCell();
        const slugInput = document.createElement('input');
        slugInput.type = 'text';
        slugInput.value = item.slug || '';
        slugInput.dataset.field = 'slug';
        slugInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full');
        cell.appendChild(slugInput);
        cell.classList.add('px-3', 'py-2');


        // Intent (editable)
        cell = row.insertCell();
        const intentInput = document.createElement('input');
        intentInput.type = 'text';
        intentInput.value = item.intent || '';
        intentInput.dataset.field = 'intent';
        intentInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full');
        cell.appendChild(intentInput);
        cell.classList.add('px-3', 'py-2');


        // Status (dynamic)
        cell = row.insertCell();
        cell.classList.add('px-3', 'py-2', 'whitespace-nowrap');
        // Status text and class are set by updatePlanItemStatusUI
        updatePlanItemStatusUI(row, item.status || 'Pending', item.error);
    });
     logToConsole(`Rendered planning table with ${plan.length} items.`, 'info');
}

// Update Status cell in Planning Table
export function updatePlanItemStatusUI(rowElementOrIndex, status, errorMsg = null) {
    let row;
    const tableBody = getElement('planningTableBody');
    if (!tableBody) return;

    if (typeof rowElementOrIndex === 'number') {
        row = tableBody.querySelector(`tr[data-index="${rowElementOrIndex}"]`);
    } else {
        row = rowElementOrIndex; // Assume it's the row element itself
    }

    if (!row || row.cells.length < 5) {
         logToConsole(`Could not find row or cell for status update (Index/Element: ${rowElementOrIndex})`, 'warn');
         return;
    } // Check if row exists and has enough cells

    const statusCell = row.cells[4]; // Status is the 5th cell (index 4)
    if (!statusCell) return;

    // Clear previous status classes
    statusCell.className = 'px-3 py-2 whitespace-nowrap'; // Reset base classes
    statusCell.title = ''; // Clear tooltip

    const statusText = status || 'Pending'; // Default to Pending if null/undefined

    // Set text content and apply class based on status
    switch (statusText.toLowerCase().split('(')[0].trim()) { // Check base status before parenthesis
        case 'pending':
            statusCell.textContent = 'Pending';
            statusCell.classList.add('status-pending');
            break;
        case 'generating':
             statusCell.textContent = 'Generating...';
             statusCell.classList.add('status-generating');
            break;
        case 'uploading':
            statusCell.textContent = 'Uploading...';
            statusCell.classList.add('status-uploading');
            break;
        case 'completed':
            statusCell.textContent = 'Completed';
             statusCell.classList.add('status-completed');
             // Add checkmark or specific detail if needed
             if (statusText.includes('Image Upload Failed')) {
                 statusCell.textContent = 'Completed (Img Fail)';
                 statusCell.classList.remove('status-completed');
                 statusCell.classList.add('status-warn'); // Or a specific warning class
                 statusCell.title = errorMsg || 'One or more image uploads failed for this article.';
             }
            break;
        case 'failed':
            statusCell.classList.add('status-failed');
            if (errorMsg) {
                const shortError = errorMsg.length > 50 ? errorMsg.substring(0, 50) + '...' : errorMsg;
                statusCell.textContent = `Failed: ${shortError}`;
                statusCell.title = errorMsg; // Full error on hover
            } else {
                statusCell.textContent = 'Failed';
            }
            break;
        default: // Unknown status
            statusCell.textContent = statusText;
            statusCell.classList.add('status-pending'); // Default style
            break;
    }
}


// --- Progress Bar Updates ---
export function updateProgressBar(barElement, containerElement, textElement, current, total, textPrefix = '') {
    if (!barElement || !containerElement) return;

    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    barElement.style.width = `${percent}%`;
    showElement(containerElement, true); // Make sure container is visible

    if (textElement) {
        textElement.textContent = `${textPrefix}${current} of ${total}... (${percent}%)`;
        showElement(textElement, true); // Make sure text is visible
    }
}
export function hideProgressBar(barElement, containerElement, textElement) {
    if (barElement) barElement.style.width = '0%';
    if (containerElement) showElement(containerElement, false);
    if (textElement) showElement(textElement, false);
}

// Helper function specifically for GitHub options visibility
export function toggleGithubOptions() {
    const storageType = document.querySelector('input[name="imageStorage"]:checked')?.value;
    const githubOptionsContainer = getElement('githubOptionsContainer');
    const generateImages = getElement('generateImagesCheckbox')?.checked;

    // Show GitHub options only if image generation is enabled AND storage is set to GitHub
    showElement(githubOptionsContainer, generateImages && storageType === 'github');
}

// Function to display sitemap URLs (called from main after fetch)
export function displaySitemapUrlsUI(urls = []) {
    const listDiv = getElement('sitemapUrlsListDiv');
    if (!listDiv) { logToConsole("Sitemap list element not found for UI update.", "warn"); return; }

    if (!urls || urls.length === 0) {
        listDiv.innerHTML = `<em class="text-gray-400">No sitemap loaded or no URLs found.</em>`;
        return;
    }
    listDiv.innerHTML = ''; // Clear previous
    urls.forEach(url => {
        const div = document.createElement('div');
        div.textContent = url;
        div.title = url; // Add title for full URL on hover if truncated
        listDiv.appendChild(div);
    });
    logToConsole(`Displayed ${urls.length} sitemap URLs.`, 'info');
}


console.log("article-ui.js loaded (v8.2 fixes)");