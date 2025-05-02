// article-ui.js (v8.10 State Sync Fix)
import { textProviders, imageProviders, languageOptions, defaultSettings } from './article-config.js';
// *** Import updateState function ***
import { getState, getCustomModelState, updateState } from './article-state.js';
import { logToConsole, showElement, findCheapestModel, callAI, disableElement } from './article-helpers.js';

// --- DOM Element References (Centralized) ---
let domElements = {}; // Keep private to this module

// Map JS variable names to actual HTML IDs
const elementIdMap = {
    aiConfigSection: 'aiConfigSection',
    aiProviderSelect: 'ai_provider',
    aiModelSelect: 'ai_model',
    useCustomAiModelCheckbox: 'useCustomAiModel',
    customAiModelInput: 'customAiModel',
    apiStatusDiv: 'apiStatus',
    apiStatusIndicator: 'apiStatusIndicator',
    step1Section: 'step1',
    keywordInput: 'keyword',
    bulkModeCheckbox: 'bulkModeCheckbox',
    bulkKeywordsContainer: 'bulkKeywordsContainer',
    bulkKeywords: 'bulkKeywords',
    languageSelect: 'language',
    customLanguageInput: 'custom_language',
    dialectSelect: 'dialect',
    audienceInput: 'audience',
    readerNameInput: 'readerName',
    toneSelect: 'tone',
    customToneInput: 'custom_tone',
    genderSelect: 'gender',
    ageSelect: 'age',
    purposeUrlInput: 'purposeUrl',
    purposeCtaInput: 'purposeCta',
    formatSelect: 'format',
    sitemapUrlInput: 'sitemapUrl',
    fetchSitemapBtn: 'fetchSitemapBtn',
    sitemapLoadingIndicator: 'sitemapLoadingIndicator',
    customSpecsInput: 'custom_specs',
    generateImagesCheckbox: 'generateImages',
    imageOptionsContainer: 'imageOptionsContainer',
    imageProviderSelect: 'imageProvider',
    imageModelSelect: 'imageModel',
    useCustomImageModelCheckbox: 'useCustomImageModel',
    customImageModelInput: 'customImageModel',
    numImagesSelect: 'numImages',
    imageAspectRatioSelect: 'imageAspectRatio',
    imageSubjectInput: 'imageSubject',
    imageStyleSelect: 'imageStyle',
    imageStyleModifiersInput: 'imageStyleModifiers',
    imageTextInput: 'imageText',
    githubOptionsContainer: 'githubOptionsContainer',
    githubRepoUrlInput: 'githubRepoUrl',
    githubCustomPathInput: 'githubCustomPath',
    generateSingleBtn: 'generateSingleBtn',
    generatePlanBtn: 'generatePlanBtn',
    structureLoadingIndicator: 'structureLoadingIndicator',
    planLoadingIndicator: 'planLoadingIndicator',
    resetDataBtn: 'resetDataBtn',
    forceReloadBtn: 'forceReloadBtn',
    step1_5Section: 'step1_5',
    planningTableContainer: 'planningTableContainer',
    startBulkGenerationBtn: 'startBulkGenerationBtn',
    bulkLoadingIndicator: 'bulkLoadingIndicator',
    downloadBulkZipBtn: 'downloadBulkZipBtn',
    bulkGenerationProgress: 'bulkGenerationProgress',
    bulkCurrentNum: 'bulkCurrentNum',
    bulkTotalNum: 'bulkTotalNum',
    bulkCurrentKeyword: 'bulkCurrentKeyword',
    bulkUploadProgressContainer: 'bulkUploadProgressContainer',
    bulkUploadProgressBar: 'bulkUploadProgressBar',
    bulkUploadProgressText: 'bulkUploadProgressText',
    step2Section: 'step2',
    toggleStructureVisibilityBtn: 'toggleStructureVisibility',
    articleTitleInput: 'articleTitle',
    structureContainer: 'structureContainer',
    articleStructureTextarea: 'article_structure',
    sitemapUrlsListDiv: 'sitemapUrlsList',
    linkTypeToggle: 'linkTypeToggle',
    linkTypeText: 'linkTypeText',
    generateArticleBtn: 'generateArticleBtn',
    articleLoadingIndicator: 'articleLoadingIndicator',
    generationProgressDiv: 'generationProgress',
    currentSectionNumSpan: 'currentSectionNum',
    totalSectionNumSpan: 'totalSectionNum',
    uploadProgressContainer: 'uploadProgressContainer',
    uploadProgressBar: 'uploadProgressBar',
    uploadProgressText: 'uploadProgressText',
    step3Section: 'step3',
    articleOutputContainer: 'article_output_container',
    generatedArticleTextarea: 'generated_article',
    htmlPreviewDiv: 'html_preview',
    previewHtmlCheckbox: 'preview_html_checkbox',
    enableSpinningBtn: 'enableSpinningBtn',
    spinLoadingIndicator: 'spinLoadingIndicator',
    step4Section: 'step4',
    spinSelectedBtn: 'spinSelectedBtn',
    spinActionLoadingIndicator: 'spinActionLoadingIndicator',
    spinOutputContainer: 'spin_output_container',
    spunArticleDisplay: 'spun_article_display',
    consoleLogContainer: 'consoleLogContainer',
    consoleLog: 'consoleLog'
};

// Keys for elements retrieved with querySelectorAll
const querySelectorAllKeys = {
    purposeCheckboxes: 'input[name="purpose"]',
    imageStorageRadios: 'input[name="imageStorage"]'
};

// Keys for elements retrieved with querySelector
const querySelectorKeys = {
    planningTableBody: '#planningTable tbody'
};


export function cacheDomElements() {
    logToConsole("Attempting to cache DOM elements...", "info");
    let allFound = true;
    domElements = {}; // Reset before caching

    // Cache elements by ID using the map
    for (const key in elementIdMap) {
        const htmlId = elementIdMap[key];
        const element = document.getElementById(htmlId);
        if (element) {
            domElements[key] = element;
        } else {
            logToConsole(`Failed to cache element with ID: '${htmlId}' (JS Key: ${key})`, 'error');
            allFound = false;
            domElements[key] = null;
        }
    }

    // Cache elements using querySelectorAll
    for (const key in querySelectorAllKeys) {
        const selector = querySelectorAllKeys[key];
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
            domElements[key] = elements; // Store the NodeList
        } else {
            logToConsole(`Failed to cache elements with selector: ${selector} (JS Key: ${key})`, 'warn');
            domElements[key] = null; // Indicate not found or empty
        }
    }

    // Cache elements using querySelector
    for (const key in querySelectorKeys) {
        const selector = querySelectorKeys[key];
        const element = document.querySelector(selector);
        if (element) {
            domElements[key] = element;
        } else {
            logToConsole(`Failed to cache element with selector: ${selector} (JS Key: ${key})`, 'error');
            allFound = false; // Consider single elements from querySelector critical
            domElements[key] = null;
        }
    }

    if (allFound) { logToConsole("Core DOM Elements cached successfully.", "success"); }
    else { logToConsole("One or more critical DOM elements failed to cache! UI will likely malfunction.", "error"); }
}

// getElement can now return single elements or NodeLists
export function getElement(id) {
    const element = domElements[id];
    // Check if the key exists and has a value (could be element or NodeList)
    if (element === undefined || element === null) {
        // Check if it was expected to be a NodeList but was empty
        if (querySelectorAllKeys[id] && element === null) {
             logToConsole(`Attempted to get NodeList for key '${id}', but it was empty or not found during caching.`, 'warn');
        } else {
            logToConsole(`Attempted to get element/NodeList '${id}', but it was not found during caching or is null.`, 'warn');
        }
    }
    return element; // Return the element, NodeList, or null/undefined
}

// --- UI Update Functions ---

function populateSelect(selectElement, options, selectedValue = null, addEmptyOption = false, emptyText = "-- Select --") {
    if (!selectElement) { return 0; }
    const elementName = selectElement.id || selectElement.name || 'Unnamed Select';
    selectElement.innerHTML = '';
    let optionsAdded = 0;
    if (addEmptyOption) { const emptyOpt = document.createElement('option'); emptyOpt.value = ""; emptyOpt.textContent = emptyText; selectElement.appendChild(emptyOpt); optionsAdded++; }
    options.forEach(option => { const opt = document.createElement('option'); if (typeof option === 'string') { opt.value = option; opt.textContent = option; } else { opt.value = option.value; opt.textContent = option.text; } selectElement.appendChild(opt); optionsAdded++; });

    // Explicitly check if selectedValue exists in the new options
    const valueExists = Array.from(selectElement.options).some(opt => opt.value === selectedValue);

    if (selectedValue !== null && selectedValue !== undefined && valueExists) {
        selectElement.value = selectedValue;
        // logToConsole(`Selected value '${selectedValue}' exists in ${elementName}. Setting value.`, 'debug');
    } else if (selectElement.options.length > 0) {
        selectElement.selectedIndex = 0; // Default to the first option
        // if (selectedValue !== null && selectedValue !== undefined) {
        //     logToConsole(`Selected value '${selectedValue}' NOT found in ${elementName}. Defaulting to index 0.`, 'debug');
        // }
    }
    return optionsAdded;
}

export function populateAiProviders(state) {
    logToConsole("Populating AI providers...", "info");
    const textProviderSelect = getElement('aiProviderSelect');
    const imageProviderSelect = getElement('imageProviderSelect');
    if (textProviderSelect) { populateSelect(textProviderSelect, Object.keys(textProviders), state.textProvider); }
    else { logToConsole("Text Provider select element ('aiProviderSelect') not found for population.", "error"); }
    if (imageProviderSelect) { populateSelect(imageProviderSelect, Object.keys(imageProviders), state.imageProvider); }
    else { logToConsole("Image Provider select element ('imageProviderSelect') not found for population.", "error"); }
}

export async function checkApiStatus() {
    const state = getState();
    const providerKey = state.textProvider;
    const model = state.useCustomTextModel ? state.customTextModel : state.textModel;
    const statusDiv = getElement('apiStatusDiv');
    const statusIndicator = getElement('apiStatusIndicator');
    if (!statusDiv) { return; }
    statusDiv.innerHTML = '';
    showElement(statusIndicator, false);
    if (!providerKey) { statusDiv.innerHTML = `<span class="status-error">Select Provider</span>`; logToConsole("API Status Check skipped: Provider missing.", "warn"); return; }
    if (!model) { statusDiv.innerHTML = `<span class="status-error">Select Model</span>`; logToConsole("API Status Check skipped: Model missing.", "warn"); return; }
    logToConsole(`Checking API Status for Provider: ${providerKey}, Model: ${model} (Custom: ${state.useCustomTextModel})`, "info");
    statusDiv.innerHTML = `<span class="status-checking">Checking ${providerKey} (${model})...</span>`;
    showElement(statusIndicator, true);
    try {
        const result = await callAI('check_status', { providerKey, model }, null, null);
        if (!result?.success) { throw new Error(result?.error || `Status check failed`); }
        if(getElement('apiStatusDiv')) getElement('apiStatusDiv').innerHTML = `<span class="status-ok">✅ Ready (${providerKey})</span>`;
        logToConsole(`API Status OK for ${providerKey} (${model})`, 'success');
    } catch (error) {
        console.error("API Status Check Failed:", error);
        logToConsole(`API Status Error: ${error.message}`, 'error');
        const displayError = error.message.includes(':') ? error.message.substring(error.message.indexOf(':') + 1).trim() : error.message;
        if(getElement('apiStatusDiv')) getElement('apiStatusDiv').innerHTML = `<span class="status-error">❌ Error: ${displayError}</span>`;
    } finally {
         showElement(getElement('apiStatusIndicator'), false);
    }
}

export function populateTextModels(setDefault = false) {
    const state = getState();
    const providerKey = state.textProvider;
    const aiModelSelect = getElement('aiModelSelect');
    const useCustomCheckbox = getElement('useCustomAiModelCheckbox');
    const customInput = getElement('customAiModelInput');

    logToConsole(`--- Running populateTextModels ---`, "debug");
    logToConsole(`State Provider: ${providerKey}`, "debug");
    logToConsole(`State Use Custom: ${state.useCustomTextModel}`, "debug");
    logToConsole(`State Standard Model: ${state.textModel}`, "debug");
    logToConsole(`State Custom Model (raw): ${state.customTextModel}`, "debug");
    logToConsole(`Custom Model for Provider (${providerKey}): ${getCustomModelState('text', providerKey)}`, "debug");

    if (!aiModelSelect || !useCustomCheckbox || !customInput) { logToConsole("Missing elements for populateTextModels.", "error"); return; }
    logToConsole(`Populating text models for provider: ${providerKey}`, "info");

    if (!providerKey || !textProviders[providerKey]) {
        logToConsole(`Cannot populate text models: Invalid provider key '${providerKey}'. Clearing select.`, "warn");
        aiModelSelect.innerHTML = '<option value="">-- Select Provider --</option>';
        disableElement(aiModelSelect, true);
        useCustomCheckbox.checked = false;
        customInput.value = '';
        toggleCustomModelUI('text');
        return;
    }

    const providerConfig = textProviders[providerKey];
    const models = providerConfig?.models || [];
    // logToConsole(`Models found for ${providerKey}: ${JSON.stringify(models)}`, "debug");
    const standardModelFromState = state.textModel;
    populateSelect(aiModelSelect, models);
    let modelToSelectInDropdown = '';
    if (setDefault && !state.useCustomTextModel && models.length > 0) {
        modelToSelectInDropdown = findCheapestModel(models);
        if (modelToSelectInDropdown) logToConsole(`Default text model determined: ${modelToSelectInDropdown}`, 'debug');
    } else if (!state.useCustomTextModel && standardModelFromState && models.includes(standardModelFromState)) {
        modelToSelectInDropdown = standardModelFromState;
        logToConsole(`Selecting standard model from state: ${modelToSelectInDropdown}`, 'debug');
    } else if (!state.useCustomTextModel && models.length > 0) {
        modelToSelectInDropdown = models[0];
        logToConsole(`Falling back to first model: ${modelToSelectInDropdown}`, 'debug');
    } else {
         logToConsole(`No standard model selection needed (using custom or no models).`, 'debug');
    }

    if (modelToSelectInDropdown) {
        aiModelSelect.value = modelToSelectInDropdown;
        logToConsole(`-> Set text model dropdown value to: ${modelToSelectInDropdown}`, 'info');
    } else if (!state.useCustomTextModel && aiModelSelect.options.length > 0) {
         aiModelSelect.selectedIndex = 0;
         logToConsole(`-> No specific text model to select, defaulted dropdown to index 0.`, 'info');
    } else {
         logToConsole(`-> Dropdown value not explicitly set.`, 'debug');
    }

    useCustomCheckbox.checked = state.useCustomTextModel || false;
    customInput.value = getCustomModelState('text', providerKey);
    toggleCustomModelUI('text');
    if (!state.useCustomTextModel && aiModelSelect.options.length === 0) { disableElement(aiModelSelect, true); }
    // logToConsole(`--- Finished populateTextModels ---`, "debug");
}

export function populateImageModels(setDefault = false) {
    const state = getState();
    const providerKey = state.imageProvider;
    const imageModelSelect = getElement('imageModelSelect');
    const imageAspectRatioSelect = getElement('imageAspectRatioSelect');
    const useCustomCheckbox = getElement('useCustomImageModelCheckbox');
    const customInput = getElement('customImageModelInput');

    if (!imageModelSelect || !imageAspectRatioSelect || !useCustomCheckbox || !customInput) { logToConsole("Missing elements for populateImageModels.", "error"); return; }
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
    const aspectRatios = providerConfig?.aspectRatios || ["1:1"];
    const standardModelFromState = state.imageModel;
    const aspectRatioFromState = state.imageAspectRatio;
    populateSelect(imageModelSelect, models);
    const validAspectRatio = aspectRatios.includes(aspectRatioFromState) ? aspectRatioFromState : aspectRatios[0];
    populateSelect(imageAspectRatioSelect, aspectRatios, validAspectRatio);
    disableElement(imageAspectRatioSelect, false);
    let modelToSelectInDropdown = '';
    if (setDefault && !state.useCustomImageModel && models.length > 0) { modelToSelectInDropdown = findCheapestModel(models); if (modelToSelectInDropdown) logToConsole(`Default image model set to: ${modelToSelectInDropdown}`, 'info'); }
    else if (!state.useCustomImageModel && standardModelFromState && models.includes(standardModelFromState)) { modelToSelectInDropdown = standardModelFromState; }
    else if (!state.useCustomImageModel && models.length > 0) { modelToSelectInDropdown = models[0]; }
    if (modelToSelectInDropdown) { imageModelSelect.value = modelToSelectInDropdown; logToConsole(`Setting image model dropdown value to: ${modelToSelectInDropdown}`, 'info'); }
    else if (!state.useCustomImageModel && imageModelSelect.options.length > 0) { imageModelSelect.selectedIndex = 0; logToConsole(`No specific image model to select, defaulting dropdown to index 0.`, 'info'); }
    useCustomCheckbox.checked = state.useCustomImageModel || false;
    customInput.value = getCustomModelState('image', providerKey);
    toggleCustomModelUI('image');
    if (!state.useCustomImageModel && imageModelSelect.options.length === 0) { disableElement(imageModelSelect, true); }
}

export function toggleCustomModelUI(type) {
    const useCustomCheckbox = type === 'text' ? getElement('useCustomAiModelCheckbox') : getElement('useCustomImageModelCheckbox');
    const modelSelect = type === 'text' ? getElement('aiModelSelect') : getElement('imageModelSelect');
    const customInput = type === 'text' ? getElement('customAiModelInput') : getElement('customImageModelInput');
    if (!useCustomCheckbox || !modelSelect || !customInput) { return; }
    const useStandard = !useCustomCheckbox.checked;
    disableElement(modelSelect, !useStandard);
    showElement(customInput, !useStandard);
    customInput.classList.toggle('custom-input-visible', !useStandard);
    if (useStandard) {
        const providerKey = getState()[type === 'text' ? 'textProvider' : 'imageProvider'];
        const providerConfig = type === 'text' ? textProviders[providerKey] : imageProviders[providerKey];
        const hasModels = providerConfig?.models?.length > 0;
        disableElement(modelSelect, !hasModels);
    }
}

export function populateLanguagesUI(state) {
    logToConsole("Populating languages...", "info");
    const languageSelect = getElement('languageSelect');
    if (!languageSelect) {
        logToConsole("Language select ('languageSelect') element not found.", "error");
        populateDialectsUI(state); return;
    }
    const options = Object.keys(languageOptions).map(k => ({ value: k, text: languageOptions[k].name }));
    const count = populateSelect(languageSelect, options, state.language);
    if (count === 0) { logToConsole("Language select populated with 0 options!", "error"); }
    else { logToConsole(`Populated languages. Selected: ${languageSelect.value}`, 'info'); }
    populateDialectsUI(state); // Use the same state that was used to set the language
}

export function populateDialectsUI(state) {
    const selectedLangKey = state.language; // Use the language from the passed state
    const dialectSelect = getElement('dialectSelect');
    const customLanguageInput = getElement('customLanguageInput');

    logToConsole(`--- Running populateDialectsUI ---`, "debug");
    logToConsole(`State Language: ${selectedLangKey}`, "debug");
    logToConsole(`State Dialect: ${state.dialect}`, "debug");
    logToConsole(`State Custom Lang: ${state.customLanguage}`, "debug");

    if (!dialectSelect) {
         logToConsole("Dialect select ('dialectSelect') element not found. Cannot populate dialects.", "error");
         showElement(customLanguageInput, false);
         return;
    }
    logToConsole(`Populating dialects for language key: ${selectedLangKey}`, "info");
    dialectSelect.innerHTML = '';
    disableElement(dialectSelect, true);
    const showCustom = selectedLangKey === 'custom';
     if(customLanguageInput) {
        showElement(customLanguageInput, showCustom);
        customLanguageInput.classList.toggle('custom-input-visible', showCustom);
        if (showCustom) { customLanguageInput.value = state.customLanguage || ''; logToConsole(`Show Custom Language Input: true, Value: "${customLanguageInput.value}"`, "debug"); }
        else { logToConsole(`Show Custom Language Input: false`, "debug"); }
     } else if (showCustom) { logToConsole("Custom language selected, but input element ('customLanguageInput') not found.", "warn"); }

    if (!selectedLangKey) { dialectSelect.innerHTML = '<option value="">-- Select Language --</option>'; logToConsole("-> No language selected, disabling dialects.", 'warn'); logToConsole(`--- Finished populateDialectsUI ---`, "debug"); return; }
    else if (selectedLangKey === 'custom') { dialectSelect.innerHTML = '<option value="">-- N/A --</option>'; logToConsole("-> Custom language selected, disabling dialects.", 'info'); logToConsole(`--- Finished populateDialectsUI ---`, "debug"); return; }

    const langConfig = languageOptions[selectedLangKey];
    const dialects = langConfig?.dialects || [];
    // ** FIX: Use the dialect from the passed state IF it's valid for the current language, otherwise default **
    const dialectFromState = state.dialect;
    const dialectToSelect = dialects.includes(dialectFromState) ? dialectFromState : (dialects.length > 0 ? dialects[0] : ''); // Default to first dialect if state one is invalid

    // logToConsole(`Dialects found for ${selectedLangKey}: ${JSON.stringify(dialects)}`, "debug");
    if (dialects.length > 0) {
        populateSelect(dialectSelect, dialects, dialectToSelect, false); // Populate and select the determined dialect
        disableElement(dialectSelect, false);
        logToConsole(`-> Populated ${dialects.length} dialects for ${selectedLangKey}. Selected: ${dialectSelect.value} (State was: ${dialectFromState}, Determined: ${dialectToSelect})`, 'info');
    } else {
        dialectSelect.innerHTML = '<option value="">-- N/A --</option>';
        disableElement(dialectSelect, true);
        logToConsole(`-> No dialects found for ${selectedLangKey}. Disabling select.`, 'info');
    }
    // logToConsole(`--- Finished populateDialectsUI ---`, "debug");
}

export function updateUIBasedOnMode(isBulkMode) {
    // logToConsole(`--- Running updateUIBasedOnMode ---`, "debug"); // Keep logs if needed
    logToConsole(`Setting UI for Bulk Mode: ${isBulkMode}`, 'info');
    const singleKeywordGroup = getElement('keywordInput')?.closest('.input-group');
    const generateSingleBtn = getElement('generateSingleBtn');
    const step2Section = getElement('step2Section');
    const step3Section = getElement('step3Section');
    const step4Section = getElement('step4Section');
    const formatSelect = getElement('formatSelect');
    const bulkKeywordsContainer = getElement('bulkKeywordsContainer');
    const generatePlanBtn = getElement('generatePlanBtn');
    const step1_5Section = getElement('step1_5Section');
    // logToConsole(`Setting Single Mode elements visibility: ${!isBulkMode}`, "debug");
    showElement(singleKeywordGroup, !isBulkMode);
    showElement(generateSingleBtn, !isBulkMode);
    showElement(step2Section, !isBulkMode);
    showElement(step3Section, !isBulkMode);
    showElement(step4Section, !isBulkMode);
    // logToConsole(`Setting Bulk Mode elements visibility: ${isBulkMode}`, "debug");
    showElement(bulkKeywordsContainer, isBulkMode);
    showElement(generatePlanBtn, isBulkMode);
    showElement(step1_5Section, isBulkMode);
    if (formatSelect) {
        // logToConsole(`Setting Format Select disabled: ${isBulkMode}`, "debug");
        disableElement(formatSelect, isBulkMode);
        if (isBulkMode) { formatSelect.value = 'markdown'; logToConsole('Format forced to Markdown for Bulk Mode.', 'info'); }
    } else { logToConsole("Format select element not found for mode update.", "warn"); }
    // logToConsole(`--- Finished updateUIBasedOnMode ---`, "debug");
}

export function updateUIFromState(state) {
    logToConsole("Updating UI from loaded state...", "info");
    if (!state) { logToConsole("Cannot update UI: state is null.", "error"); return; }
    if (Object.keys(domElements).length === 0) { logToConsole("DOM elements not cached yet. Cannot update UI.", "error"); return; }

    // 1. Populate Provider Selects first
    populateAiProviders(state);

    // 2. Set simple values from state BEFORE populating models/dialects
    const keywordInput = getElement('keywordInput'); if (keywordInput) keywordInput.value = state.keyword || '';
    const bulkModeCheckbox = getElement('bulkModeCheckbox'); if (bulkModeCheckbox) bulkModeCheckbox.checked = state.bulkMode || defaultSettings.bulkMode;
    const audienceInputElement = getElement('audienceInput'); if(audienceInputElement) audienceInputElement.value = state.audience || defaultSettings.audience;
    const readerNameInputElement = getElement('readerNameInput'); if(readerNameInputElement) readerNameInputElement.value = state.readerName || defaultSettings.readerName;
    const toneSelectElement = getElement('toneSelect'); if(toneSelectElement) toneSelectElement.value = state.tone || defaultSettings.tone;
    const customToneInputElement = getElement('customToneInput'); if(customToneInputElement) customToneInputElement.value = state.customTone || '';
    const genderSelectElement = getElement('genderSelect'); if(genderSelectElement) genderSelectElement.value = state.gender || defaultSettings.gender;
    const ageSelectElement = getElement('ageSelect'); if(ageSelectElement) ageSelectElement.value = state.age || defaultSettings.age;
    const formatSelectElement = getElement('formatSelect'); if(formatSelectElement) formatSelectElement.value = state.format || defaultSettings.format;
    const sitemapUrlInputElement = getElement('sitemapUrlInput'); if(sitemapUrlInputElement) sitemapUrlInputElement.value = state.sitemapUrl || defaultSettings.sitemapUrl;
    const customSpecsInputElement = getElement('customSpecsInput'); if(customSpecsInputElement) customSpecsInputElement.value = state.customSpecs || defaultSettings.customSpecs;

    // 3. Language and Dialect (this sets the UI dropdowns)
    populateLanguagesUI(state); // Calls populateDialectsUI internally

    // 4. Purpose
    const savedPurposes = state.purpose || defaultSettings.purpose;
    let showPurposeUrl = false; let showPurposeCta = false;
    const purposeCheckboxes = getElement('purposeCheckboxes');
    if(purposeCheckboxes) { purposeCheckboxes.forEach(cb => { cb.checked = savedPurposes.includes(cb.value); if (cb.checked) { if (cb.value === 'Promote URL') showPurposeUrl = true; if (cb.value.startsWith('Promote') || cb.value === 'Generate Leads') showPurposeCta = true; } }); }
    const purposeUrlInputElement = getElement('purposeUrlInput'); if(purposeUrlInputElement) purposeUrlInputElement.value = state.purposeUrl || defaultSettings.purposeUrl;
    const purposeCtaInputElement = getElement('purposeCtaInput'); if(purposeCtaInputElement) purposeCtaInputElement.value = state.purposeCta || defaultSettings.purposeCta;
    showElement(getElement('purposeUrlInput'), showPurposeUrl);
    showElement(getElement('purposeCtaInput'), showPurposeCta);
    showElement(getElement('customToneInput'), state.tone === 'custom');

    // 5. Images
    const generateImagesCheckboxElement = getElement('generateImagesCheckbox'); if (generateImagesCheckboxElement) generateImagesCheckboxElement.checked = state.generateImages || defaultSettings.generateImages;
    const numImagesSelectElement = getElement('numImagesSelect'); if(numImagesSelectElement) numImagesSelectElement.value = state.numImages || defaultSettings.numImages;
    const imageSubjectInputElement = getElement('imageSubjectInput'); if(imageSubjectInputElement) imageSubjectInputElement.value = state.imageSubject || defaultSettings.imageSubject;
    const imageStyleSelectElement = getElement('imageStyleSelect'); if(imageStyleSelectElement) imageStyleSelectElement.value = state.imageStyle || defaultSettings.imageStyle;
    const imageStyleModifiersInputElement = getElement('imageStyleModifiersInput'); if(imageStyleModifiersInputElement) imageStyleModifiersInputElement.value = state.imageStyleModifiers || defaultSettings.imageStyleModifiers;
    const imageTextInputElement = getElement('imageTextInput'); if(imageTextInputElement) imageTextInputElement.value = state.imageText || defaultSettings.imageText;
    const storageValue = state.imageStorage || defaultSettings.imageStorage;
    const imageStorageRadios = getElement('imageStorageRadios');
    let radioFound = false;
    if (imageStorageRadios) { imageStorageRadios.forEach(radio => { if (radio.value === storageValue) { radio.checked = true; radioFound = true; } }); if (!radioFound && imageStorageRadios.length > 0) { imageStorageRadios[0].checked = true; } }
    const githubRepoUrlInputElement = getElement('githubRepoUrlInput'); if(githubRepoUrlInputElement) githubRepoUrlInputElement.value = state.githubRepoUrl || defaultSettings.githubRepoUrl;
    const githubCustomPathInputElement = getElement('githubCustomPathInput'); if(githubCustomPathInputElement) githubCustomPathInputElement.value = state.githubCustomPath || defaultSettings.githubCustomPath;

    // 6. Populate Models (this sets the UI dropdowns based on state or defaults)
    populateTextModels();
    populateImageModels();

    // *** FIX: Synchronize state AFTER populating UI ***
    logToConsole("Syncing state with default UI selections after population...", "debug");
    const defaultTextModel = getElement('aiModelSelect')?.value || '';
    const defaultImageModel = getElement('imageModelSelect')?.value || '';
    const defaultImageAspect = getElement('imageAspectRatioSelect')?.value || '';
    // Only update state if the UI value differs from current state or state is empty
    // This prevents unnecessary saves if the loaded state was already correct.
    const updatesNeeded = {};
    if (defaultTextModel && state.textModel !== defaultTextModel) {
        updatesNeeded.textModel = defaultTextModel;
        logToConsole(`Syncing state.textModel -> ${defaultTextModel}`, 'debug');
    }
    if (defaultImageModel && state.imageModel !== defaultImageModel) {
         updatesNeeded.imageModel = defaultImageModel;
         logToConsole(`Syncing state.imageModel -> ${defaultImageModel}`, 'debug');
    }
     if (defaultImageAspect && state.imageAspectRatio !== defaultImageAspect) {
         updatesNeeded.imageAspectRatio = defaultImageAspect;
         logToConsole(`Syncing state.imageAspectRatio -> ${defaultImageAspect}`, 'debug');
     }
    // Also ensure custom flags are false if we set a standard model
    if (updatesNeeded.textModel) updatesNeeded.useCustomTextModel = false;
    if (updatesNeeded.imageModel) updatesNeeded.useCustomImageModel = false;

    if (Object.keys(updatesNeeded).length > 0) {
        updateState(updatesNeeded);
        // We need the *very latest* state for the final steps
        state = getState(); // Refresh state variable after updates
    }
    // *** End Fix ***

    // 7. Set Visibility based on the potentially updated state
    showElement(getElement('imageOptionsContainer'), state.generateImages);
    toggleGithubOptions(); // Uses latest state implicitly via querySelector
    updateUIBasedOnMode(state.bulkMode); // Uses latest state

    // 8. Update Step 2+ Elements
    const articleTitleInputElement = getElement('articleTitleInput'); if (articleTitleInputElement) articleTitleInputElement.value = state.articleTitle || '';
    const linkTypeToggleElement = getElement('linkTypeToggle'); if(linkTypeToggleElement) linkTypeToggleElement.checked = !(state.linkTypeInternal ?? defaultSettings.linkTypeInternal);
    const linkTypeTextElement = getElement('linkTypeText'); if(linkTypeTextElement) linkTypeTextElement.textContent = (state.linkTypeInternal ?? defaultSettings.linkTypeInternal) ? 'Internal' : 'External';

    // 9. Bulk Plan Rendering
    if (state.bulkMode) { renderPlanningTable(getBulkPlan()); }

    // 10. Final API Status Check (uses the fully updated state)
    checkApiStatus();
    logToConsole("UI update from state finished.", "info");
}

export function renderPlanningTable(plan) {
    const tableBody = getElement('planningTableBody');
    if (!tableBody) { logToConsole("Planning table body not found.", "error"); return; }
    tableBody.innerHTML = '';
    if (!plan || plan.length === 0) { tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No plan generated or loaded.</td></tr>'; return; }
    plan.forEach((item, index) => { const row = tableBody.insertRow(); row.dataset.index = index; let cell; cell = row.insertCell(); cell.textContent = item.keyword || 'N/A'; cell.classList.add('px-3', 'py-2', 'whitespace-nowrap'); cell = row.insertCell(); const titleInput = document.createElement('input'); titleInput.type = 'text'; titleInput.value = item.title || ''; titleInput.dataset.field = 'title'; titleInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(titleInput); cell.classList.add('px-3', 'py-2'); cell = row.insertCell(); const slugInput = document.createElement('input'); slugInput.type = 'text'; slugInput.value = item.slug || ''; slugInput.dataset.field = 'slug'; slugInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(slugInput); cell.classList.add('px-3', 'py-2'); cell = row.insertCell(); const intentInput = document.createElement('input'); intentInput.type = 'text'; intentInput.value = item.intent || ''; intentInput.dataset.field = 'intent'; intentInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(intentInput); cell.classList.add('px-3', 'py-2'); cell = row.insertCell(); cell.classList.add('px-3', 'py-2', 'whitespace-nowrap'); updatePlanItemStatusUI(row, item.status || 'Pending', item.error); });
     logToConsole(`Rendered planning table with ${plan.length} items.`, 'info');
}

export function updatePlanItemStatusUI(rowElementOrIndex, status, errorMsg = null) {
    let row;
    const tableBody = getElement('planningTableBody');
    if (!tableBody) return;
    if (typeof rowElementOrIndex === 'number') { row = tableBody.querySelector(`tr[data-index="${rowElementOrIndex}"]`); }
    else { row = rowElementOrIndex; }
    if (!row || row.cells.length < 5) { logToConsole(`Could not find row or cell for status update (Index/Element: ${rowElementOrIndex})`, 'warn'); return; }
    const statusCell = row.cells[4]; if (!statusCell) return;
    statusCell.className = 'px-3 py-2 whitespace-nowrap'; statusCell.title = '';
    const statusText = status || 'Pending';
    switch (statusText.toLowerCase().split('(')[0].trim()) { case 'pending': statusCell.textContent = 'Pending'; statusCell.classList.add('status-pending'); break; case 'generating': statusCell.textContent = 'Generating...'; statusCell.classList.add('status-generating'); break; case 'uploading': statusCell.textContent = 'Uploading...'; statusCell.classList.add('status-uploading'); break; case 'completed': statusCell.textContent = 'Completed'; statusCell.classList.add('status-completed'); if (statusText.includes('Image Upload Failed')) { statusCell.textContent = 'Completed (Img Fail)'; statusCell.classList.remove('status-completed'); statusCell.classList.add('status-warn'); statusCell.title = errorMsg || 'One or more image uploads failed.'; } break; case 'failed': statusCell.classList.add('status-failed'); if (errorMsg) { const shortError = errorMsg.length > 50 ? errorMsg.substring(0, 50) + '...' : errorMsg; statusCell.textContent = `Failed: ${shortError}`; statusCell.title = errorMsg; } else { statusCell.textContent = 'Failed'; } break; default: statusCell.textContent = statusText; statusCell.classList.add('status-pending'); break; }
}

export function updateProgressBar(barElement, containerElement, textElement, current, total, textPrefix = '') {
    if (!barElement || !containerElement) return;
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    barElement.style.width = `${percent}%`;
    showElement(containerElement, true);
    if (textElement) { textElement.textContent = `${textPrefix}${current} of ${total}... (${percent}%)`; showElement(textElement, true); }
}

export function hideProgressBar(barElement, containerElement, textElement) {
    if (barElement) barElement.style.width = '0%';
    if (containerElement) showElement(containerElement, false);
    if (textElement) showElement(textElement, false);
}

export function toggleGithubOptions() {
    const storageType = document.querySelector('input[name="imageStorage"]:checked')?.value;
    const githubOptionsContainer = getElement('githubOptionsContainer');
    const generateImages = getElement('generateImagesCheckbox')?.checked;
    showElement(githubOptionsContainer, generateImages && storageType === 'github');
}

export function displaySitemapUrlsUI(urls = []) {
    const listDiv = getElement('sitemapUrlsListDiv');
    if (!listDiv) { logToConsole("Sitemap list element not found for UI update.", "warn"); return; }
    if (!urls || urls.length === 0) { listDiv.innerHTML = `<em class="text-gray-400">No sitemap loaded or no URLs found.</em>`; return; }
    listDiv.innerHTML = '';
    urls.forEach(url => { const div = document.createElement('div'); div.textContent = url; div.title = url; listDiv.appendChild(div); });
    logToConsole(`Displayed ${urls.length} sitemap URLs.`, 'info');
}

console.log("article-ui.js loaded (v8.10 State Sync Fix)");