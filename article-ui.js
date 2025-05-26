// article-ui.js (v8.16 fix warn spun_article_display - extended for ideas)
import { textProviders, imageProviders, languageOptions, defaultSettings } from './article-config.js';
import { getState, getCustomModelState, updateState } from './article-state.js';
import { logToConsole, showElement, findCheapestModel, callAI, disableElement, getArticleOutlinesV2 } from './article-helpers.js';

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
    generateIdeasBtn: 'generateIdeasBtn', // New
    ideasLoadingIndicator: 'ideasLoadingIndicator', // New
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
    uploadProgressContainer: 'uploadProgressContainer', // Note: This ID is duplicated, one for single, one for bulk. Should be distinct if used simultaneously.
    uploadProgressBar: 'uploadProgressBar', // Same as above
    uploadProgressText: 'uploadProgressText', // Same as above
    step3Section: 'step3',
    articleOutputContainer: 'article_output_container',
    generatedArticleTextarea: 'generated_article',
    htmlPreviewDiv: 'html_preview',
    previewHtmlCheckbox: 'preview_html_checkbox',
    enableSpinningBtn: 'enableSpinningBtn',
    spinLoadingIndicator: 'spinLoadingIndicator',
    pauseSpinBtn: 'pauseSpinBtn', // Added
    stopSpinBtn: 'stopSpinBtn',   // Added
    step4Section: 'step4',
    spinSelectedBtn: 'spinSelectedBtn',
    spinActionLoadingIndicator: 'spinActionLoadingIndicator',
    spinOutputContainer: 'spin_output_container',
    spunArticleDisplay: 'spun_article_display',
    consoleLogContainer: 'consoleLogContainer',
    consoleLog: 'consoleLog',
    structureCountDisplay: 'structureCountDisplay',
    wordCountDisplay: 'wordCountDisplay',
    charCountDisplay: 'charCountDisplay'
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
            // Log error for all missing IDs, but don't set allFound to false unless critical
            logToConsole(`Failed to cache element with ID: '${htmlId}' (JS Key: ${key})`, 'error');
            domElements[key] = null; // Ensure missing elements are explicitly null in cache
        }
    }

    // Cache elements using querySelectorAll
    for (const key in querySelectorAllKeys) {
        const selector = querySelectorAllKeys[key];
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) { domElements[key] = elements; }
        else { logToConsole(`Failed/Empty cache for querySelectorAll: ${selector} (JS Key: ${key})`, 'warn'); domElements[key] = null; }
    }

    // Cache elements using querySelector
    for (const key in querySelectorKeys) {
        const selector = querySelectorKeys[key];
        const element = document.querySelector(selector);
        if (element) { domElements[key] = element; }
        else { logToConsole(`Failed to cache element with querySelector: ${selector} (JS Key: ${key})`, 'error'); domElements[key] = null; }
    }

    const idKeys = Object.keys(elementIdMap);
    const failedIdCount = idKeys.filter(key => domElements[key] === null).length;

    if (failedIdCount === 0) { logToConsole("All getElementById elements cached successfully.", "success"); }
    else { logToConsole(`${failedIdCount}/${idKeys.length} getElementById elements failed to cache! UI may malfunction.`, "error"); }
}

export function getElement(id) {
    const element = domElements[id];
    if (element === undefined || element === null) {
        const htmlId = elementIdMap[id];
        if (htmlId) {
            const liveElement = document.getElementById(htmlId);
            if (liveElement) {
                domElements[id] = liveElement;
                return liveElement;
            }
        }
        const selectorAll = querySelectorAllKeys[id];
        if(selectorAll){
            const liveElements = document.querySelectorAll(selectorAll);
            if(liveElements && liveElements.length > 0){
                domElements[id] = liveElements;
                return liveElements;
            }
        }
        const selectorOne = querySelectorKeys[id];
        if(selectorOne){
            const liveElementOne = document.querySelector(selectorOne);
            if(liveElementOne){
                domElements[id] = liveElementOne;
                return liveElementOne;
            }
        }
        // logToConsole(`Attempted to get element/NodeList '${id}', but it was not found during caching or directly in DOM.`, 'warn');
        // For non-critical elements that might not always be present (like spunArticleDisplay if step 4 is hidden),
        // this warning can be noisy. Consider logging level or specific checks.
        if (id !== 'spunArticleDisplay' && id !== 'pauseSpinBtn' && id !== 'stopSpinBtn') { // Example of less critical elements
            logToConsole(`Element/NodeList '${id}' not found. This might be expected if the UI section is hidden.`, 'debug');
        }
    }
    return element; 
}

// --- UI Update Functions ---
function populateSelect(selectElement, options, selectedValue = null, addEmptyOption = false, emptyText = "-- Select --") {
    if (!selectElement) { return 0; }
    const elementName = selectElement.id || selectElement.name || 'Unnamed Select';
    selectElement.innerHTML = '';
    let optionsAdded = 0;
    if (addEmptyOption) { const emptyOpt = document.createElement('option'); emptyOpt.value = ""; emptyOpt.textContent = emptyText; selectElement.appendChild(emptyOpt); optionsAdded++; }
    options.forEach(option => { const opt = document.createElement('option'); if (typeof option === 'string') { opt.value = option; opt.textContent = option; } else { opt.value = option.value; opt.textContent = option.text; } selectElement.appendChild(opt); optionsAdded++; });

    const valueExists = Array.from(selectElement.options).some(opt => opt.value === selectedValue);

    if (selectedValue !== null && selectedValue !== undefined && valueExists) {
        selectElement.value = selectedValue;
    } else if (selectElement.options.length > 0) {
        selectElement.selectedIndex = 0; 
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
    statusDiv.innerHTML = ''; // Clear previous status text
    showElement(statusIndicator, false); // Ensure loader is hidden initially
    if (!providerKey) { statusDiv.innerHTML = `<span class="status-error">Select Provider</span>`; logToConsole("API Status Check skipped: Provider missing.", "warn"); return; }
    if (!model && !state.useCustomTextModel) { statusDiv.innerHTML = `<span class="status-error">Select Model</span>`; logToConsole("API Status Check skipped: Model missing (standard).", "warn"); return; }
    if (state.useCustomTextModel && !model) { statusDiv.innerHTML = `<span class="status-error">Enter Custom Model</span>`; logToConsole("API Status Check skipped: Model missing (custom).", "warn"); return; }

    logToConsole(`Checking API Status for Provider: ${providerKey}, Model: ${model} (Custom: ${state.useCustomTextModel})`, "info");
    statusDiv.innerHTML = `<span class="status-checking">Checking ${providerKey} (${model.length > 20 ? model.substring(0,20)+'...' : model})...</span>`;
    showElement(statusIndicator, true); // Show loader
    try {
        const result = await callAI('check_status', { providerKey, model }, null, null); // callAI handles its own loading/disabling
        if (!result?.success) { throw new Error(result?.error || `Status check failed`); }
        if(getElement('apiStatusDiv')) getElement('apiStatusDiv').innerHTML = `<span class="status-ok">✅ Ready (${providerKey})</span>`;
        logToConsole(`API Status OK for ${providerKey} (${model})`, 'success');
    } catch (error) {
        console.error("API Status Check Failed:", error);
        logToConsole(`API Status Error: ${error.message}`, 'error');
        const displayError = error.message.includes(':') ? error.message.substring(error.message.indexOf(':') + 1).trim() : error.message;
        if(getElement('apiStatusDiv')) getElement('apiStatusDiv').innerHTML = `<span class="status-error">❌ Error: ${displayError.substring(0, 30)}</span>`;
    } finally {
        showElement(getElement('apiStatusIndicator'), false); // Hide loader
    }
}

export function populateTextModels(setDefault = false) {
    const state = getState();
    const providerKey = state.textProvider;
    const aiModelSelect = getElement('aiModelSelect');
    const useCustomCheckbox = getElement('useCustomAiModelCheckbox');
    const customInput = getElement('customAiModelInput');

    if (!aiModelSelect || !useCustomCheckbox || !customInput) { logToConsole("Missing elements for populateTextModels.", "error"); return; }
    // logToConsole(`Populating text models for provider: ${providerKey}`, "info");

    if (!providerKey || !textProviders[providerKey]) {
        // logToConsole(`Cannot populate text models: Invalid provider key '${providerKey}'. Clearing select.`, "warn");
        aiModelSelect.innerHTML = '<option value="">-- Select Provider --</option>';
        disableElement(aiModelSelect, true);
        useCustomCheckbox.checked = false;
        customInput.value = '';
        toggleCustomModelUI('text');
        return;
    }

    const providerConfig = textProviders[providerKey];
    const models = providerConfig?.models || [];
    const standardModelFromState = state.textModel;
    populateSelect(aiModelSelect, models);
    let modelToSelectInDropdown = '';

    if (state.useCustomTextModel) {
        // If using custom, dropdown is disabled, value doesn't matter as much but set for consistency
        if (models.includes(standardModelFromState)) modelToSelectInDropdown = standardModelFromState;
        else if (models.length > 0) modelToSelectInDropdown = models[0];
    } else { // Not using custom
        if (setDefault) { // Explicitly set default (e.g. on provider change)
            modelToSelectInDropdown = findCheapestModel(models);
        } else if (standardModelFromState && models.includes(standardModelFromState)) { // Restore from state
            modelToSelectInDropdown = standardModelFromState;
        } else if (models.length > 0) { // Fallback to first if state value invalid or not set
            modelToSelectInDropdown = models[0];
        }
    }
    
    if (modelToSelectInDropdown) {
        aiModelSelect.value = modelToSelectInDropdown;
        // logToConsole(`-> Set text model dropdown value to: ${modelToSelectInDropdown}`, 'info');
    } else if (!state.useCustomTextModel && aiModelSelect.options.length > 0) {
         aiModelSelect.selectedIndex = 0;
        //  logToConsole(`-> No specific text model to select, defaulted dropdown to index 0.`, 'info');
    }

    useCustomCheckbox.checked = state.useCustomTextModel || false;
    customInput.value = getCustomModelState('text', providerKey); // Always load saved custom model for provider
    toggleCustomModelUI('text'); // This will disable/enable select based on checkbox
}

export function populateImageModels(setDefault = false) {
    const state = getState();
    const providerKey = state.imageProvider;
    const imageModelSelect = getElement('imageModelSelect');
    const imageAspectRatioSelect = getElement('imageAspectRatioSelect');
    const useCustomCheckbox = getElement('useCustomImageModelCheckbox');
    const customInput = getElement('customImageModelInput');

    if (!imageModelSelect || !imageAspectRatioSelect || !useCustomCheckbox || !customInput) { logToConsole("Missing elements for populateImageModels.", "error"); return; }
    // logToConsole(`Populating image models for provider: ${providerKey}`, "info");

    if (!providerKey || !imageProviders[providerKey]) {
        // logToConsole(`Cannot populate image models: Invalid provider key '${providerKey}'. Clearing selects.`, "warn");
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
    disableElement(imageAspectRatioSelect, false); // Usually enabled if provider exists

    let modelToSelectInDropdown = '';
    if (state.useCustomImageModel) {
        if (models.includes(standardModelFromState)) modelToSelectInDropdown = standardModelFromState;
        else if (models.length > 0) modelToSelectInDropdown = models[0];
    } else {
        if (setDefault) {
            modelToSelectInDropdown = findCheapestModel(models);
        } else if (standardModelFromState && models.includes(standardModelFromState)) {
            modelToSelectInDropdown = standardModelFromState;
        } else if (models.length > 0) {
            modelToSelectInDropdown = models[0];
        }
    }

    if (modelToSelectInDropdown) {
        imageModelSelect.value = modelToSelectInDropdown;
        // logToConsole(`Setting image model dropdown value to: ${modelToSelectInDropdown}`, 'info');
    } else if (!state.useCustomImageModel && imageModelSelect.options.length > 0) {
        imageModelSelect.selectedIndex = 0;
        // logToConsole(`No specific image model to select, defaulting dropdown to index 0.`, 'info');
    }

    useCustomCheckbox.checked = state.useCustomImageModel || false;
    customInput.value = getCustomModelState('image', providerKey);
    toggleCustomModelUI('image');
}

export function toggleCustomModelUI(type) {
    const useCustomCheckbox = type === 'text' ? getElement('useCustomAiModelCheckbox') : getElement('useCustomImageModelCheckbox');
    const modelSelect = type === 'text' ? getElement('aiModelSelect') : getElement('imageModelSelect');
    const customInput = type === 'text' ? getElement('customAiModelInput') : getElement('customImageModelInput');
    if (!useCustomCheckbox || !modelSelect || !customInput) { return; }

    const isChecked = useCustomCheckbox.checked;
    disableElement(modelSelect, isChecked);
    showElement(customInput, isChecked); // Show custom input if checkbox is checked
    customInput.classList.toggle('custom-input-visible', isChecked);

    // If not using custom, ensure modelSelect is enabled only if there are models
    if (!isChecked) {
        const providerKey = getState()[type === 'text' ? 'textProvider' : 'imageProvider'];
        const providerConfig = type === 'text' ? textProviders[providerKey] : imageProviders[providerKey];
        const hasModels = providerConfig?.models?.length > 0;
        disableElement(modelSelect, !hasModels);
    }
}

export function populateLanguagesUI(state) {
    // logToConsole("Populating languages...", "info");
    const languageSelect = getElement('languageSelect');
    if (!languageSelect) {
        logToConsole("Language select ('languageSelect') element not found.", "error");
        populateDialectsUI(state); return;
    }
    const options = Object.keys(languageOptions).map(k => ({ value: k, text: languageOptions[k].name }));
    const count = populateSelect(languageSelect, options, state.language);
    // if (count === 0) { logToConsole("Language select populated with 0 options!", "error"); }
    // else { logToConsole(`Populated languages. Selected: ${languageSelect.value}`, 'info'); }
    populateDialectsUI(state); 
}

export function populateDialectsUI(state) {
    const selectedLangKey = state.language; 
    const dialectSelect = getElement('dialectSelect');
    const customLanguageInput = getElement('customLanguageInput');

    if (!dialectSelect) {
         logToConsole("Dialect select ('dialectSelect') element not found. Cannot populate dialects.", "error");
         showElement(customLanguageInput, false);
         return;
    }
    // logToConsole(`Populating dialects for language key: ${selectedLangKey}`, "info");
    dialectSelect.innerHTML = '';
    disableElement(dialectSelect, true);
    const showCustom = selectedLangKey === 'custom';
     if(customLanguageInput) {
        showElement(customLanguageInput, showCustom);
        customLanguageInput.classList.toggle('custom-input-visible', showCustom);
        if (showCustom) { customLanguageInput.value = state.customLanguage || ''; }
     } else if (showCustom) { logToConsole("Custom language selected, but input element ('customLanguageInput') not found.", "warn"); }

    if (!selectedLangKey) { dialectSelect.innerHTML = '<option value="">-- Select Language --</option>'; return; }
    else if (selectedLangKey === 'custom') { dialectSelect.innerHTML = '<option value="">-- N/A --</option>'; return; }

    const langConfig = languageOptions[selectedLangKey];
    const dialects = langConfig?.dialects || [];
    const dialectFromState = state.dialect;
    const dialectToSelect = dialects.includes(dialectFromState) ? dialectFromState : (dialects.length > 0 ? dialects[0] : '');

    if (dialects.length > 0) {
        populateSelect(dialectSelect, dialects, dialectToSelect, false); 
        disableElement(dialectSelect, false);
        // logToConsole(`-> Populated ${dialects.length} dialects for ${selectedLangKey}. Selected: ${dialectSelect.value}`, 'info');
    } else {
        dialectSelect.innerHTML = '<option value="">-- N/A --</option>';
        disableElement(dialectSelect, true);
        // logToConsole(`-> No dialects found for ${selectedLangKey}. Disabling select.`, 'info');
    }
}

export function updateUIBasedOnMode(isBulkMode) {
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
    
    showElement(singleKeywordGroup, !isBulkMode);
    showElement(generateSingleBtn, !isBulkMode);
    // Only hide step 2/3/4 if switching TO bulk mode. If already in bulk, they might be shown by bulk logic.
    if (isBulkMode) {
        showElement(step2Section, false);
        showElement(step3Section, false);
        showElement(step4Section, false);
    } else { // Switching to single mode, ensure bulk sections are hidden.
        showElement(step2Section, getElement('articleStructureTextarea')?.value.trim() !== ''); // Show if structure exists
        showElement(step3Section, getElement('generatedArticleTextarea')?.value.trim() !== ''); // Show if article exists
        // Step 4 visibility usually depends on Step 3.
    }

    showElement(bulkKeywordsContainer, isBulkMode);
    showElement(generatePlanBtn, isBulkMode);
    showElement(step1_5Section, isBulkMode && getElement('planningTableBody')?.children.length > 0 && getElement('planningTableBody')?.children[0].textContent !== "No plan generated or loaded.");

    if (formatSelect) {
        disableElement(formatSelect, isBulkMode);
        if (isBulkMode) { 
            formatSelect.value = 'markdown'; 
            updateState({ format: 'markdown' }); // Also update state
            logToConsole('Format forced to Markdown for Bulk Mode.', 'info'); 
        }
    } else { logToConsole("Format select element not found for mode update.", "warn"); }
}

export function updateCounts(text) {
    const wordCountEl = getElement('wordCountDisplay');
    const charCountEl = getElement('charCountDisplay');
    if (!wordCountEl || !charCountEl) return;

    const textContent = text || ''; 
    const wordCount = textContent.trim() === '' ? 0 : textContent.trim().split(/\s+/).filter(Boolean).length;
    const charCount = textContent.length;

    wordCountEl.textContent = `Words: ${wordCount}`;
    charCountEl.textContent = `Chars: ${charCount}`;
}

export function updateStructureCountDisplay(structureText) {
    const countDisplayEl = getElement('structureCountDisplay');
    if (!countDisplayEl) return;

    if (!structureText) {
        countDisplayEl.textContent = `Sections: 0`;
        return;
    }
    const sections = getArticleOutlinesV2(structureText);
    countDisplayEl.textContent = `Sections: ${sections.length}`;
}

export function updateUIFromState(state) {
    logToConsole("Updating UI from loaded state...", "info");
    if (!state) { logToConsole("Cannot update UI: state is null.", "error"); return; }
    if (Object.keys(domElements).length === 0) { logToConsole("DOM elements not cached yet. Cannot update UI.", "error"); return; }

    populateAiProviders(state);

    const keywordInput = getElement('keywordInput'); if (keywordInput) keywordInput.value = state.keyword || '';
    const bulkModeCheckbox = getElement('bulkModeCheckbox'); if (bulkModeCheckbox) bulkModeCheckbox.checked = state.bulkMode || defaultSettings.bulkMode;
    // Ensure bulkKeywords textarea is also populated if needed (e.g., from a previous session)
    const bulkKeywordsTextarea = getElement('bulkKeywords');
    if (bulkKeywordsTextarea && state.bulkKeywordsContent) { // Assuming you might save bulkKeywordsContent to state
        bulkKeywordsTextarea.value = state.bulkKeywordsContent;
    }

    const audienceInputElement = getElement('audienceInput'); if(audienceInputElement) audienceInputElement.value = state.audience || defaultSettings.audience;
    const readerNameInputElement = getElement('readerNameInput'); if(readerNameInputElement) readerNameInputElement.value = state.readerName || defaultSettings.readerName;
    const toneSelectElement = getElement('toneSelect'); if(toneSelectElement) toneSelectElement.value = state.tone || defaultSettings.tone;
    const customToneInputElement = getElement('customToneInput'); if(customToneInputElement) customToneInputElement.value = state.customTone || '';
    const genderSelectElement = getElement('genderSelect'); if(genderSelectElement) genderSelectElement.value = state.gender || defaultSettings.gender;
    const ageSelectElement = getElement('ageSelect'); if(ageSelectElement) ageSelectElement.value = state.age || defaultSettings.age;
    const formatSelectElement = getElement('formatSelect'); if(formatSelectElement) formatSelectElement.value = state.format || defaultSettings.format;
    const sitemapUrlInputElement = getElement('sitemapUrlInput'); if(sitemapUrlInputElement) sitemapUrlInputElement.value = state.sitemapUrl || defaultSettings.sitemapUrl;
    const customSpecsInputElement = getElement('customSpecsInput'); if(customSpecsInputElement) customSpecsInputElement.value = state.customSpecs || defaultSettings.customSpecs;

    populateLanguagesUI(state); 

    const savedPurposes = state.purpose || defaultSettings.purpose;
    let showPurposeUrl = false; let showPurposeCta = false;
    const purposeCheckboxes = getElement('purposeCheckboxes');
    if(purposeCheckboxes) { purposeCheckboxes.forEach(cb => { cb.checked = savedPurposes.includes(cb.value); if (cb.checked) { if (cb.value === 'Promote URL') showPurposeUrl = true; if (cb.value.startsWith('Promote') || cb.value === 'Generate Leads') showPurposeCta = true; } }); }
    const purposeUrlInputElement = getElement('purposeUrlInput'); if(purposeUrlInputElement) purposeUrlInputElement.value = state.purposeUrl || defaultSettings.purposeUrl;
    const purposeCtaInputElement = getElement('purposeCtaInput'); if(purposeCtaInputElement) purposeCtaInputElement.value = state.purposeCta || defaultSettings.purposeCta;
    showElement(getElement('purposeUrlInput'), showPurposeUrl);
    showElement(getElement('purposeCtaInput'), showPurposeCta);
    showElement(getElement('customToneInput'), state.tone === 'custom');

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

    populateTextModels();
    populateImageModels();

    const currentTextModel = getElement('aiModelSelect')?.value;
    const currentImageModel = getElement('imageModelSelect')?.value;
    const currentImageAspect = getElement('imageAspectRatioSelect')?.value;
    const currentLanguage = getElement('languageSelect')?.value;
    const currentDialect = getElement('dialectSelect')?.value;

    const updatesToState = {};
    if (!state.useCustomTextModel && currentTextModel && state.textModel !== currentTextModel) updatesToState.textModel = currentTextModel;
    if (!state.useCustomImageModel && currentImageModel && state.imageModel !== currentImageModel) updatesToState.imageModel = currentImageModel;
    if (currentImageAspect && state.imageAspectRatio !== currentImageAspect) updatesToState.imageAspectRatio = currentImageAspect;
    if (currentLanguage && state.language !== currentLanguage) updatesToState.language = currentLanguage;
    // Only update dialect if language isn't custom and dialect is valid for selected language
    if (currentLanguage !== 'custom' && currentDialect && state.dialect !== currentDialect && (languageOptions[currentLanguage]?.dialects || []).includes(currentDialect)) {
        updatesToState.dialect = currentDialect;
    } else if (currentLanguage !== 'custom' && !(languageOptions[currentLanguage]?.dialects || []).includes(state.dialect)) {
        // If current state dialect is invalid for the (potentially newly set) language, reset dialect
        updatesToState.dialect = (languageOptions[currentLanguage]?.dialects || [])[0] || '';
    }

    if (Object.keys(updatesToState).length > 0) { 
        updateState(updatesToState); 
        state = getState(); // Re-fetch state if it was modified
    }
    
    showElement(getElement('imageOptionsContainer'), state.generateImages);
    toggleGithubOptions();
    
    const articleTitleInputElement = getElement('articleTitleInput'); if (articleTitleInputElement) articleTitleInputElement.value = state.articleTitle || '';
    const linkTypeToggleElement = getElement('linkTypeToggle'); if(linkTypeToggleElement) linkTypeToggleElement.checked = !(state.linkTypeInternal ?? defaultSettings.linkTypeInternal);
    const linkTypeTextElement = getElement('linkTypeText'); if(linkTypeTextElement) linkTypeTextElement.textContent = (state.linkTypeInternal ?? defaultSettings.linkTypeInternal) ? 'Internal' : 'External';
    
    const articleStructureTextarea = getElement('articleStructureTextarea');
    let initialStructure = ''; 
    if (articleStructureTextarea) {
        if (state.articleStructure && !state.bulkMode) {
            initialStructure = state.articleStructure;
            articleStructureTextarea.value = initialStructure;
            showElement(getElement('step2Section'), true);
            showElement(getElement('structureContainer'), true);
            const toggleBtn = getElement('toggleStructureVisibilityBtn');
            if (toggleBtn) toggleBtn.textContent = 'Hide';
        } else {
             articleStructureTextarea.value = '';
             if (!state.bulkMode) showElement(getElement('step2Section'), false);
        } 
    }
    updateStructureCountDisplay(initialStructure);

    const generatedArticleTextarea = getElement('generatedArticleTextarea');
    let initialArticleContent = ''; 
    if (generatedArticleTextarea) {
        if (state.generatedArticleContent && !state.bulkMode) {
             initialArticleContent = state.generatedArticleContent;
             generatedArticleTextarea.value = initialArticleContent;
             if (initialArticleContent) showElement(getElement('step3Section'), true);
        } else {
             generatedArticleTextarea.value = '';
             if (!state.bulkMode) showElement(getElement('step3Section'), false);
        }
    }
    updateCounts(initialArticleContent);
    
    // Update UI based on mode *after* individual elements are set up
    updateUIBasedOnMode(state.bulkMode); 

    // Render bulk plan if in bulk mode and plan exists
    if (state.bulkMode) { 
        const currentBulkPlan = getBulkPlan(); // from article-state
        if (currentBulkPlan.length > 0) {
            renderPlanningTable(currentBulkPlan);
            showElement(getElement('step1_5Section'), true);
        } else {
            const tableBody = getElement('planningTableBody');
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No plan generated or loaded.</td></tr>';
            // Do not automatically show step1_5 if plan is empty
            // showElement(getElement('step1_5Section'), false); 
        }
    }
    checkApiStatus();
    logToConsole("UI update from state finished.", "info");
}

export function renderPlanningTable(plan) {
    const tableBody = getElement('planningTableBody');
    if (!tableBody) { logToConsole("Planning table body not found.", "error"); return; }
    tableBody.innerHTML = '';
    if (!plan || plan.length === 0) { tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No plan generated or loaded.</td></tr>'; return; }
    plan.forEach((item, index) => { const row = tableBody.insertRow(); row.dataset.index = index; let cell; cell = row.insertCell(); cell.textContent = item.keyword || 'N/A'; cell.classList.add('px-3', 'py-2', 'whitespace-nowrap', 'text-xs'); cell = row.insertCell(); const titleInput = document.createElement('input'); titleInput.type = 'text'; titleInput.value = item.title || ''; titleInput.dataset.field = 'title'; titleInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(titleInput); cell.classList.add('px-3', 'py-2'); cell = row.insertCell(); const slugInput = document.createElement('input'); slugInput.type = 'text'; slugInput.value = item.slug || ''; slugInput.dataset.field = 'slug'; slugInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(slugInput); cell.classList.add('px-3', 'py-2'); cell = row.insertCell(); const intentInput = document.createElement('input'); intentInput.type = 'text'; intentInput.value = item.intent || ''; intentInput.dataset.field = 'intent'; intentInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(intentInput); cell.classList.add('px-3', 'py-2'); cell = row.insertCell(); cell.classList.add('px-3', 'py-2', 'whitespace-nowrap', 'text-xs'); updatePlanItemStatusUI(row, item.status || 'Pending', item.error); });
     logToConsole(`Rendered planning table with ${plan.length} items.`, 'info');
}

export function updatePlanItemStatusUI(rowElementOrIndex, status, errorMsg = null) {
    let row;
    const tableBody = getElement('planningTableBody');
    if (!tableBody) return;
    if (typeof rowElementOrIndex === 'number') { row = tableBody.querySelector(`tr[data-index="${rowElementOrIndex}"]`); }
    else { row = rowElementOrIndex; } // Assumes rowElementOrIndex is the <tr> element
    if (!row || row.cells.length < 5) { return; }
    const statusCell = row.cells[4]; if (!statusCell) return;
    statusCell.className = 'px-3 py-2 whitespace-nowrap text-xs'; statusCell.title = ''; // Reset classes, add text-xs
    const statusText = status || 'Pending';
    switch (statusText.toLowerCase().split('(')[0].trim()) { case 'pending': statusCell.textContent = 'Pending'; statusCell.classList.add('status-pending'); break; case 'generating': statusCell.textContent = 'Generating...'; statusCell.classList.add('status-generating'); break; case 'uploading': statusCell.textContent = 'Uploading...'; statusCell.classList.add('status-uploading'); break; case 'completed': statusCell.textContent = 'Completed'; statusCell.classList.add('status-completed'); if (statusText.includes('Image Upload Failed')) { statusCell.textContent = 'Completed (Img Fail)'; statusCell.classList.remove('status-completed'); statusCell.classList.add('status-warn', 'text-yellow-600'); statusCell.title = errorMsg || 'One or more image uploads failed.'; } break; case 'failed': statusCell.classList.add('status-failed'); if (errorMsg) { const shortError = errorMsg.length > 30 ? errorMsg.substring(0, 30) + '...' : errorMsg; statusCell.textContent = `Failed: ${shortError}`; statusCell.title = errorMsg; } else { statusCell.textContent = 'Failed'; } break; default: statusCell.textContent = statusText; statusCell.classList.add('status-pending'); break; }
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
    const storageType = getElement('imageStorageRadios') ? Array.from(getElement('imageStorageRadios')).find(r => r.checked)?.value : 'base64';
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

console.log("article-ui.js loaded (v8.16 extended for ideas)");