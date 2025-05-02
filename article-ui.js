// article-ui.js (Using correct HTML IDs for caching)
import { textProviders, imageProviders, languageOptions, defaultSettings } from './article-config.js';
import { getState, getCustomModelState } from './article-state.js';
import { logToConsole, showElement, findCheapestModel, callAI, disableElement } from './article-helpers.js';

// --- DOM Element References (Centralized) ---
// Keys are the variable names used in JS, values will be the elements
let domElements = {};

// Map JS variable names to actual HTML IDs
const elementIdMap = {
    aiConfigSection: 'aiConfigSection',
    aiProviderSelect: 'ai_provider', // Correct ID
    aiModelSelect: 'ai_model', // Correct ID
    useCustomAiModelCheckbox: 'useCustomAiModel', // Correct ID
    customAiModelInput: 'customAiModel', // Correct ID
    apiStatusDiv: 'apiStatus', // Correct ID (was apiStatusDiv before)
    apiStatusIndicator: 'apiStatusIndicator',
    step1Section: 'step1', // Correct ID
    keywordInput: 'keyword', // Correct ID
    bulkModeCheckbox: 'bulkModeCheckbox',
    bulkKeywordsContainer: 'bulkKeywordsContainer',
    bulkKeywords: 'bulkKeywords',
    languageSelect: 'language', // Correct ID (was languageSelect before)
    customLanguageInput: 'custom_language', // Correct ID
    dialectSelect: 'dialect', // Correct ID
    audienceInput: 'audience', // Correct ID
    readerNameInput: 'readerName', // Correct ID
    toneSelect: 'tone', // Correct ID
    customToneInput: 'custom_tone', // Correct ID
    genderSelect: 'gender', // Correct ID
    ageSelect: 'age', // Correct ID
    // purposeCheckboxes handled by querySelectorAll
    purposeUrlInput: 'purposeUrl',
    purposeCtaInput: 'purposeCta',
    formatSelect: 'format', // Correct ID
    sitemapUrlInput: 'sitemapUrl',
    fetchSitemapBtn: 'fetchSitemapBtn',
    sitemapLoadingIndicator: 'sitemapLoadingIndicator',
    customSpecsInput: 'custom_specs', // Correct ID
    generateImagesCheckbox: 'generateImages', // Correct ID
    imageOptionsContainer: 'imageOptionsContainer',
    imageProviderSelect: 'imageProvider', // Correct ID
    imageModelSelect: 'imageModel', // Correct ID
    useCustomImageModelCheckbox: 'useCustomImageModel', // Correct ID
    customImageModelInput: 'customImageModel',
    numImagesSelect: 'numImages', // Correct ID
    imageAspectRatioSelect: 'imageAspectRatio', // Correct ID
    imageSubjectInput: 'imageSubject',
    imageStyleSelect: 'imageStyle',
    imageStyleModifiersInput: 'imageStyleModifiers',
    imageTextInput: 'imageText',
    // imageStorageRadios handled by querySelectorAll
    githubOptionsContainer: 'githubOptionsContainer',
    githubRepoUrlInput: 'githubRepoUrl',
    githubCustomPathInput: 'githubCustomPath',
    generateSingleBtn: 'generateSingleBtn',
    generatePlanBtn: 'generatePlanBtn',
    structureLoadingIndicator: 'structureLoadingIndicator',
    planLoadingIndicator: 'planLoadingIndicator',
    resetDataBtn: 'resetDataBtn',
    forceReloadBtn: 'forceReloadBtn',
    step1_5Section: 'step1_5', // Correct ID
    planningTableContainer: 'planningTableContainer',
    // planningTableBody handled by querySelector
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
    step2Section: 'step2', // Correct ID
    toggleStructureVisibilityBtn: 'toggleStructureVisibility', // Correct ID
    articleTitleInput: 'articleTitle', // Correct ID
    structureContainer: 'structureContainer',
    articleStructureTextarea: 'article_structure', // Correct ID
    sitemapUrlsListDiv: 'sitemapUrlsList', // Correct ID
    linkTypeToggle: 'linkTypeToggle',
    linkTypeText: 'linkTypeText',
    generateArticleBtn: 'generateArticleBtn',
    articleLoadingIndicator: 'articleLoadingIndicator',
    generationProgressDiv: 'generationProgress', // Correct ID
    currentSectionNumSpan: 'currentSectionNum', // Correct ID
    totalSectionNumSpan: 'totalSectionNum', // Correct ID
    uploadProgressContainer: 'uploadProgressContainer',
    uploadProgressBar: 'uploadProgressBar',
    uploadProgressText: 'uploadProgressText',
    step3Section: 'step3', // Correct ID
    articleOutputContainer: 'article_output_container', // Correct ID
    generatedArticleTextarea: 'generated_article', // Correct ID
    htmlPreviewDiv: 'html_preview', // Correct ID
    previewHtmlCheckbox: 'preview_html_checkbox', // Correct ID
    enableSpinningBtn: 'enableSpinningBtn',
    spinLoadingIndicator: 'spinLoadingIndicator',
    step4Section: 'step4', // Correct ID
    spinSelectedBtn: 'spinSelectedBtn',
    spinActionLoadingIndicator: 'spinActionLoadingIndicator',
    spinOutputContainer: 'spin_output_container', // Correct ID
    spunArticleDisplay: 'spun_article_display', // Correct ID
    consoleLogContainer: 'consoleLogContainer',
    consoleLog: 'consoleLog'
};

export function cacheDomElements() {
    logToConsole("Attempting to cache DOM elements using mapped IDs...", "info");
    let allFound = true;
    domElements = {}; // Reset before caching

    // Iterate over the map
    for (const key in elementIdMap) {
        const htmlId = elementIdMap[key];
        const element = document.getElementById(htmlId); // Use the correct HTML ID here
        if (element) {
            domElements[key] = element; // Store the element using the JS variable name as the key
        } else {
            logToConsole(`Failed to cache element with ID: '${htmlId}' (JS Key: ${key})`, 'error');
            allFound = false;
            domElements[key] = null; // Explicitly set to null if not found
        }
    }

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
          logToConsole(`Failed to cache elements with selector: input[name="purpose"]`, 'warn');
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

// getElement remains the same - it uses the JS variable name (the key)
export function getElement(id) { // Parameter 'id' here refers to the JS key
    const element = domElements[id];
    if (element === undefined || element === null) {
        logToConsole(`Attempted to get element '${id}', but it was not found during caching or is null.`, 'warn');
    }
    return element; // Return the element or null/undefined
}

// --- UI Update Functions ---

// populateSelect remains the same
function populateSelect(selectElement, options, selectedValue = null, addEmptyOption = false, emptyText = "-- Select --") {
    if (!selectElement) { return 0; }
    const elementName = selectElement.id || selectElement.name || 'Unnamed Select';
    selectElement.innerHTML = '';
    let optionsAdded = 0;
    if (addEmptyOption) { const emptyOpt = document.createElement('option'); emptyOpt.value = ""; emptyOpt.textContent = emptyText; selectElement.appendChild(emptyOpt); optionsAdded++; }
    options.forEach(option => { const opt = document.createElement('option'); if (typeof option === 'string') { opt.value = option; opt.textContent = option; } else { opt.value = option.value; opt.textContent = option.text; } selectElement.appendChild(opt); optionsAdded++; });
    if (selectedValue !== null && selectedValue !== undefined && Array.from(selectElement.options).some(opt => opt.value === selectedValue)) { selectElement.value = selectedValue; }
    else if (selectElement.options.length > 0) { selectElement.selectedIndex = 0; }
    return optionsAdded;
}

// populateAiProviders remains the same - uses getElement with JS keys
export function populateAiProviders(state) {
    logToConsole("Populating AI providers...", "info");
    const textProviderSelect = getElement('aiProviderSelect'); // Use JS Key
    const imageProviderSelect = getElement('imageProviderSelect'); // Use JS Key

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

// checkApiStatus remains the same - uses getElement with JS keys
export async function checkApiStatus() {
    const state = getState();
    const providerKey = state.textProvider;
    const model = state.useCustomTextModel ? state.customTextModel : state.textModel;
    const statusDiv = getElement('apiStatusDiv'); // Use JS Key
    const statusIndicator = getElement('apiStatusIndicator'); // Use JS Key

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
        if(getElement('apiStatusDiv')) getElement('apiStatusDiv').innerHTML = `<span class="status-ok">✅ Ready (${providerKey})</span>`; // Re-check
        logToConsole(`API Status OK for ${providerKey} (${model})`, 'success');
    } catch (error) {
        console.error("API Status Check Failed:", error);
        logToConsole(`API Status Error: ${error.message}`, 'error');
        const displayError = error.message.includes(':') ? error.message.substring(error.message.indexOf(':') + 1).trim() : error.message;
        if(getElement('apiStatusDiv')) getElement('apiStatusDiv').innerHTML = `<span class="status-error">❌ Error: ${displayError}</span>`; // Re-check
    } finally {
         showElement(getElement('apiStatusIndicator'), false); // Re-check
    }
}

// populateTextModels remains the same - uses getElement with JS keys
export function populateTextModels(setDefault = false) {
    const state = getState();
    const providerKey = state.textProvider;
    const aiModelSelect = getElement('aiModelSelect');
    const useCustomCheckbox = getElement('useCustomAiModelCheckbox');
    const customInput = getElement('customAiModelInput');

    if (!aiModelSelect || !useCustomCheckbox || !customInput) { /* ... */ return; }
    logToConsole(`Populating text models for provider: ${providerKey}`, "info");
    if (!providerKey || !textProviders[providerKey]) { /* ... */ return; }
    const providerConfig = textProviders[providerKey];
    const models = providerConfig?.models || [];
    const standardModelFromState = state.textModel;
    populateSelect(aiModelSelect, models);
    let modelToSelectInDropdown = '';
    if (setDefault && !state.useCustomTextModel && models.length > 0) { /* ... */ }
    else if (!state.useCustomTextModel && standardModelFromState && models.includes(standardModelFromState)) { /* ... */ }
    else if (!state.useCustomTextModel && models.length > 0) { /* ... */ }
    if (modelToSelectInDropdown) { /* ... */ }
    else if (!state.useCustomTextModel && aiModelSelect.options.length > 0) { /* ... */ }
    useCustomCheckbox.checked = state.useCustomTextModel || false;
    customInput.value = getCustomModelState('text', providerKey);
    toggleCustomModelUI('text');
    if (!state.useCustomTextModel && aiModelSelect.options.length === 0) { /* ... */ }
}

// populateImageModels remains the same - uses getElement with JS keys
export function populateImageModels(setDefault = false) {
    const state = getState();
    const providerKey = state.imageProvider;
    const imageModelSelect = getElement('imageModelSelect');
    const imageAspectRatioSelect = getElement('imageAspectRatioSelect');
    const useCustomCheckbox = getElement('useCustomImageModelCheckbox');
    const customInput = getElement('customImageModelInput');

    if (!imageModelSelect || !imageAspectRatioSelect || !useCustomCheckbox || !customInput) { /* ... */ return; }
    logToConsole(`Populating image models for provider: ${providerKey}`, "info");
    if (!providerKey || !imageProviders[providerKey]) { /* ... */ return; }
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
    if (setDefault && !state.useCustomImageModel && models.length > 0) { /* ... */ }
    else if (!state.useCustomImageModel && standardModelFromState && models.includes(standardModelFromState)) { /* ... */ }
    else if (!state.useCustomImageModel && models.length > 0) { /* ... */ }
    if (modelToSelectInDropdown) { /* ... */ }
    else if (!state.useCustomImageModel && imageModelSelect.options.length > 0) { /* ... */ }
    useCustomCheckbox.checked = state.useCustomImageModel || false;
    customInput.value = getCustomModelState('image', providerKey);
    toggleCustomModelUI('image');
    if (!state.useCustomImageModel && imageModelSelect.options.length === 0) { /* ... */ }
}

// toggleCustomModelUI remains the same - uses getElement with JS keys
export function toggleCustomModelUI(type) {
    const useCustomCheckbox = type === 'text' ? getElement('useCustomAiModelCheckbox') : getElement('useCustomImageModelCheckbox');
    const modelSelect = type === 'text' ? getElement('aiModelSelect') : getElement('imageModelSelect');
    const customInput = type === 'text' ? getElement('customAiModelInput') : getElement('customImageModelInput');
    if (!useCustomCheckbox || !modelSelect || !customInput) { return; }
    const useStandard = !useCustomCheckbox.checked;
    // logToConsole(`Toggling Custom UI for ${type}: Use Standard = ${useStandard}`, 'info'); // Keep if needed
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

// populateLanguagesUI remains the same - uses getElement with JS keys
export function populateLanguagesUI(state) {
    logToConsole("Populating languages...", "info");
    const languageSelect = getElement('languageSelect'); // Use JS Key
    if (!languageSelect) {
        logToConsole("Language select ('languageSelect') element not found. Cannot populate languages.", "error");
        populateDialectsUI(state);
        return;
    }
    const options = Object.keys(languageOptions).map(k => ({ value: k, text: languageOptions[k].name }));
    const count = populateSelect(languageSelect, options, state.language);
    if (count === 0) { logToConsole("Language select populated with 0 options!", "error"); }
    else { logToConsole(`Populated languages. Selected: ${languageSelect.value}`, 'info'); }
    populateDialectsUI(state);
}

// populateDialectsUI remains the same - uses getElement with JS keys
export function populateDialectsUI(state) {
    const selectedLangKey = state.language;
    const dialectSelect = getElement('dialectSelect'); // Use JS Key
    const customLanguageInput = getElement('customLanguageInput'); // Use JS Key

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
        if (showCustom) { customLanguageInput.value = state.customLanguage || ''; }
     } else if (showCustom) { logToConsole("Custom language selected, but input element ('customLanguageInput') not found.", "warn"); }
    if (!selectedLangKey) { /* ... */ return; }
    else if (selectedLangKey === 'custom') { /* ... */ return; }
    const langConfig = languageOptions[selectedLangKey];
    const dialects = langConfig?.dialects || [];
    const currentDialectFromState = state.dialect;
    if (dialects.length > 0) { /* ... */ }
    else { /* ... */ }
}

// updateUIBasedOnMode remains the same - uses getElement with JS keys
export function updateUIBasedOnMode(isBulkMode) {
    logToConsole(`Switching UI to ${isBulkMode ? 'Bulk' : 'Single'} mode.`, 'info');
    const singleKeywordGroup = getElement('keywordInput')?.closest('.input-group');
    const bulkKeywordsContainer = getElement('bulkKeywordsContainer');
    const generateSingleBtn = getElement('generateSingleBtn');
    const generatePlanBtn = getElement('generatePlanBtn');
    const step1_5Section = getElement('step1_5Section');
    const step2Section = getElement('step2Section');
    const step3Section = getElement('step3Section');
    const step4Section = getElement('step4Section');
    const formatSelect = getElement('formatSelect');
    // ... (rest of the logic using showElement/disableElement)
    showElement(singleKeywordGroup, !isBulkMode);
    showElement(bulkKeywordsContainer, isBulkMode);
    showElement(generateSingleBtn, !isBulkMode);
    showElement(generatePlanBtn, isBulkMode);
    showElement(step1_5Section, isBulkMode);
    showElement(step2Section, !isBulkMode);
    showElement(step3Section, !isBulkMode);
    showElement(step4Section, !isBulkMode);

    if (formatSelect) {
        disableElement(formatSelect, isBulkMode);
        if (isBulkMode) { formatSelect.value = 'markdown'; logToConsole('Format forced to Markdown for Bulk Mode.', 'info'); }
    } else { logToConsole("Format select element not found for mode update.", "warn"); }

    if (!isBulkMode) { showElement(step1_5Section, false); }
    else { showElement(step2Section, false); showElement(step3Section, false); showElement(step4Section, false); }
}

// updateUIFromState remains the same - uses getElement with JS keys
export function updateUIFromState(state) {
    logToConsole("Updating UI from loaded state...", "info");
    if (!state) { logToConsole("Cannot update UI: state is null.", "error"); return; }
    if (Object.keys(domElements).length === 0) { logToConsole("DOM elements not cached yet. Cannot update UI.", "error"); return; }

    populateAiProviders(state);
    const keywordInput = getElement('keywordInput'); if (keywordInput) keywordInput.value = state.keyword || '';
    const bulkModeCheckbox = getElement('bulkModeCheckbox'); if (bulkModeCheckbox) bulkModeCheckbox.checked = state.bulkMode || defaultSettings.bulkMode;
    populateLanguagesUI(state); // Populates language AND dialect
    // ---> Use getElement for all assignments <---
    const audienceInputElement = getElement('audienceInput'); if(audienceInputElement) audienceInputElement.value = state.audience || defaultSettings.audience;
    const readerNameInputElement = getElement('readerNameInput'); if(readerNameInputElement) readerNameInputElement.value = state.readerName || defaultSettings.readerName;
    const toneSelectElement = getElement('toneSelect'); if(toneSelectElement) toneSelectElement.value = state.tone || defaultSettings.tone;
    const customToneInputElement = getElement('customToneInput'); if(customToneInputElement) customToneInputElement.value = state.customTone || '';
    const genderSelectElement = getElement('genderSelect'); if(genderSelectElement) genderSelectElement.value = state.gender || defaultSettings.gender;
    const ageSelectElement = getElement('ageSelect'); if(ageSelectElement) ageSelectElement.value = state.age || defaultSettings.age;
    const formatSelectElement = getElement('formatSelect'); if(formatSelectElement) formatSelectElement.value = state.format || defaultSettings.format;
    const sitemapUrlInputElement = getElement('sitemapUrlInput'); if(sitemapUrlInputElement) sitemapUrlInputElement.value = state.sitemapUrl || defaultSettings.sitemapUrl;
    const customSpecsInputElement = getElement('customSpecsInput'); if(customSpecsInputElement) customSpecsInputElement.value = state.customSpecs || defaultSettings.customSpecs;


    const savedPurposes = state.purpose || defaultSettings.purpose;
    let showPurposeUrl = false; let showPurposeCta = false;
    const purposeCheckboxes = domElements['purposeCheckboxes']; // Use cached NodeList
    if(purposeCheckboxes) {
        purposeCheckboxes.forEach(cb => { cb.checked = savedPurposes.includes(cb.value); if (cb.checked) { if (cb.value === 'Promote URL') showPurposeUrl = true; if (cb.value.startsWith('Promote') || cb.value === 'Generate Leads') showPurposeCta = true; } });
    }
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
    const radioToCheck = document.querySelector(`input[name="imageStorage"][value="${storageValue}"]`);
    if (radioToCheck) radioToCheck.checked = true; else { const firstRadio = document.querySelector('input[name="imageStorage"]'); if (firstRadio) firstRadio.checked = true; }
    const githubRepoUrlInputElement = getElement('githubRepoUrlInput'); if(githubRepoUrlInputElement) githubRepoUrlInputElement.value = state.githubRepoUrl || defaultSettings.githubRepoUrl;
    const githubCustomPathInputElement = getElement('githubCustomPathInput'); if(githubCustomPathInputElement) githubCustomPathInputElement.value = state.githubCustomPath || defaultSettings.githubCustomPath;


    populateTextModels();
    populateImageModels();

    showElement(getElement('imageOptionsContainer'), state.generateImages);
    toggleGithubOptions(); // Call after storage radio is set
    updateUIBasedOnMode(state.bulkMode); // Set initial view based on loaded bulkMode

    const articleTitleInputElement = getElement('articleTitleInput'); if (articleTitleInputElement) articleTitleInputElement.value = state.articleTitle || '';
    const linkTypeToggleElement = getElement('linkTypeToggle'); if(linkTypeToggleElement) linkTypeToggleElement.checked = !(state.linkTypeInternal ?? defaultSettings.linkTypeInternal);
    const linkTypeTextElement = getElement('linkTypeText'); if(linkTypeTextElement) linkTypeTextElement.textContent = (state.linkTypeInternal ?? defaultSettings.linkTypeInternal) ? 'Internal' : 'External';

    if (state.bulkMode) { renderPlanningTable(getBulkPlan()); }

    checkApiStatus(); // Final status check after all UI is set

    logToConsole("UI update from state finished.", "info");
}


// renderPlanningTable remains the same - uses getElement with JS keys
export function renderPlanningTable(plan) { /* ... */ }
// updatePlanItemStatusUI remains the same - uses getElement with JS keys
export function updatePlanItemStatusUI(rowElementOrIndex, status, errorMsg = null) { /* ... */ }
// updateProgressBar remains the same - uses getElement with JS keys
export function updateProgressBar(barElement, containerElement, textElement, current, total, textPrefix = '') { /* ... */ }
// hideProgressBar remains the same - uses getElement with JS keys
export function hideProgressBar(barElement, containerElement, textElement) { /* ... */ }
// toggleGithubOptions remains the same - uses getElement with JS keys
export function toggleGithubOptions() { /* ... */ }
// displaySitemapUrlsUI remains the same - uses getElement with JS keys
export function displaySitemapUrlsUI(urls = []) { /* ... */ }


console.log("article-ui.js loaded (v8.4 ID fix)");