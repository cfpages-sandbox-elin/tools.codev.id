// article-ui.js (Restoring export for hideProgressBar)
import { textProviders, imageProviders, languageOptions, defaultSettings } from './article-config.js';
import { getState, getCustomModelState } from './article-state.js';
import { logToConsole, showElement, findCheapestModel, callAI, disableElement } from './article-helpers.js';

// --- DOM Element References (Centralized) ---
let domElements = {};
const requiredElementIds = [ /* ... list remains the same ... */ 'aiConfigSection', 'aiProviderSelect', 'aiModelSelect', 'useCustomAiModelCheckbox', 'customAiModelInput', 'apiStatus', 'apiStatusIndicator', 'step1Section', 'keywordInput', 'bulkModeCheckbox', 'bulkKeywordsContainer', 'bulkKeywords', 'language', 'customLanguageInput', 'dialectSelect', 'audienceInput', 'readerNameInput', 'toneSelect', 'customToneInput', 'genderSelect', 'ageSelect', 'purposeUrlInput', 'purposeCtaInput', 'formatSelect', 'sitemapUrlInput', 'fetchSitemapBtn', 'sitemapLoadingIndicator', 'customSpecsInput', 'generateImagesCheckbox', 'imageOptionsContainer', 'imageProviderSelect', 'imageModelSelect', 'useCustomImageModelCheckbox', 'customImageModelInput', 'numImagesSelect', 'imageAspectRatioSelect', 'imageSubjectInput', 'imageStyleSelect', 'imageStyleModifiersInput', 'imageTextInput', 'githubOptionsContainer', 'githubRepoUrlInput', 'githubCustomPathInput', 'generateSingleBtn', 'generatePlanBtn', 'structureLoadingIndicator', 'planLoadingIndicator', 'resetDataBtn', 'forceReloadBtn', 'step1_5Section', 'planningTableContainer', 'startBulkGenerationBtn', 'bulkLoadingIndicator', 'downloadBulkZipBtn', 'bulkGenerationProgress', 'bulkCurrentNum', 'bulkTotalNum', 'bulkCurrentKeyword', 'bulkUploadProgressContainer', 'bulkUploadProgressBar', 'bulkUploadProgressText', 'step2Section', 'toggleStructureVisibilityBtn', 'articleTitleInput', 'structureContainer', 'articleStructureTextarea', 'sitemapUrlsListDiv', 'linkTypeToggle', 'linkTypeText', 'generateArticleBtn', 'articleLoadingIndicator', 'generationProgressDiv', 'currentSectionNumSpan', 'totalSectionNumSpan', 'uploadProgressContainer', 'uploadProgressBar', 'uploadProgressText', 'step3Section', 'articleOutputContainer', 'generatedArticleTextarea', 'htmlPreviewDiv', 'previewHtmlCheckbox', 'enableSpinningBtn', 'spinLoadingIndicator', 'step4Section', 'spinSelectedBtn', 'spinActionLoadingIndicator', 'spinOutputContainer', 'spunArticleDisplay', 'consoleLogContainer', 'consoleLog'];


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

export function getElement(id) {
    const element = domElements[id];
    if (element === undefined || element === null) {
        logToConsole(`Attempted to get element '${id}', but it was not found during caching or is null.`, 'warn');
    }
    return element;
}

// --- UI Update Functions ---

function populateSelect(selectElement, options, selectedValue = null, addEmptyOption = false, emptyText = "-- Select --") {
    if (!selectElement) {
        return 0;
    }
    const elementName = selectElement.id || selectElement.name || 'Unnamed Select';
    selectElement.innerHTML = '';
    let optionsAdded = 0;
    if (addEmptyOption) { const emptyOpt = document.createElement('option'); emptyOpt.value = ""; emptyOpt.textContent = emptyText; selectElement.appendChild(emptyOpt); optionsAdded++; }
    options.forEach(option => { const opt = document.createElement('option'); if (typeof option === 'string') { opt.value = option; opt.textContent = option; } else { opt.value = option.value; opt.textContent = option.text; } selectElement.appendChild(opt); optionsAdded++; });
    if (selectedValue !== null && selectedValue !== undefined && Array.from(selectElement.options).some(opt => opt.value === selectedValue)) { selectElement.value = selectedValue; }
    else if (selectElement.options.length > 0) { selectElement.selectedIndex = 0; }
    return optionsAdded;
}

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

// --- API Status Function ---
export async function checkApiStatus() {
    const state = getState();
    const providerKey = state.textProvider;
    const model = state.useCustomTextModel ? state.customTextModel : state.textModel;
    const statusDiv = getElement('apiStatus');
    const statusIndicator = getElement('apiStatusIndicator');

    if (!statusDiv) { return; } // Cannot update UI

    statusDiv.innerHTML = ''; // Clear previous content
    showElement(statusIndicator, false); // Hide indicator

    if (!providerKey) { statusDiv.innerHTML = `<span class="status-error">Select Provider</span>`; logToConsole("API Status Check skipped: Provider missing.", "warn"); return; }
    if (!model) { statusDiv.innerHTML = `<span class="status-error">Select Model</span>`; logToConsole("API Status Check skipped: Model missing.", "warn"); return; }

    logToConsole(`Checking API Status for Provider: ${providerKey}, Model: ${model} (Custom: ${state.useCustomTextModel})`, "info");
    statusDiv.innerHTML = `<span class="status-checking">Checking ${providerKey} (${model})...</span>`;
    showElement(statusIndicator, true);

    try {
        const result = await callAI('check_status', { providerKey, model }, null, null);
        if (!result?.success) { throw new Error(result?.error || `Status check failed`); }
        if(getElement('apiStatus')) getElement('apiStatus').innerHTML = `<span class="status-ok">✅ Ready (${providerKey})</span>`; // Re-check element
        logToConsole(`API Status OK for ${providerKey} (${model})`, 'success');
    } catch (error) {
        console.error("API Status Check Failed:", error);
        logToConsole(`API Status Error: ${error.message}`, 'error');
        const displayError = error.message.includes(':') ? error.message.substring(error.message.indexOf(':') + 1).trim() : error.message;
        if(getElement('apiStatus')) getElement('apiStatus').innerHTML = `<span class="status-error">❌ Error: ${displayError}</span>`; // Re-check element
    } finally {
         showElement(getElement('apiStatusIndicator'), false); // Re-check element
    }
}

// Populate Text Models based on selected provider FROM STATE
export function populateTextModels(setDefault = false) {
    const state = getState();
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
        logToConsole(`Cannot populate text models: Invalid provider key '${providerKey}'. Clearing select.`, "warn");
        aiModelSelect.innerHTML = '<option value="">-- Select Provider --</option>';
        disableElement(aiModelSelect, true);
        useCustomCheckbox.checked = false;
        customInput.value = '';
        toggleCustomModelUI('text');
        return; // Don't check status if provider invalid
    }

    const providerConfig = textProviders[providerKey];
    const models = providerConfig?.models || [];
    const standardModelFromState = state.textModel;

    populateSelect(aiModelSelect, models);

    let modelToSelectInDropdown = '';
    if (setDefault && !state.useCustomTextModel && models.length > 0) {
        modelToSelectInDropdown = findCheapestModel(models);
        if (modelToSelectInDropdown) logToConsole(`Default text model set to: ${modelToSelectInDropdown}`, 'info');
    } else if (!state.useCustomTextModel && standardModelFromState && models.includes(standardModelFromState)) {
        modelToSelectInDropdown = standardModelFromState;
    } else if (!state.useCustomTextModel && models.length > 0) {
        modelToSelectInDropdown = models[0];
    }

    if (modelToSelectInDropdown) {
        aiModelSelect.value = modelToSelectInDropdown;
        logToConsole(`Setting text model dropdown value to: ${modelToSelectInDropdown}`, 'info');
    } else if (!state.useCustomTextModel && aiModelSelect.options.length > 0) {
         aiModelSelect.selectedIndex = 0;
         logToConsole(`No specific text model to select, defaulting dropdown to index 0.`, 'info');
    }

    useCustomCheckbox.checked = state.useCustomTextModel || false;
    customInput.value = getCustomModelState('text', providerKey);
    toggleCustomModelUI('text');

    if (!state.useCustomTextModel && aiModelSelect.options.length === 0) {
        logToConsole(`Text Model select is empty after population for provider ${providerKey}! Disabling.`, "error");
        disableElement(aiModelSelect, true);
    }
}

// Populate Image Models based on selected provider FROM STATE
export function populateImageModels(setDefault = false) {
    const state = getState();
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
    const aspectRatios = providerConfig?.aspectRatios || ["1:1"];
    const standardModelFromState = state.imageModel;
    const aspectRatioFromState = state.imageAspectRatio;

    populateSelect(imageModelSelect, models);
    const validAspectRatio = aspectRatios.includes(aspectRatioFromState) ? aspectRatioFromState : aspectRatios[0];
    populateSelect(imageAspectRatioSelect, aspectRatios, validAspectRatio);
    disableElement(imageAspectRatioSelect, false);

    let modelToSelectInDropdown = '';
    if (setDefault && !state.useCustomImageModel && models.length > 0) {
        modelToSelectInDropdown = findCheapestModel(models);
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

// Populate Languages and Dialects
export function populateLanguagesUI(state) {
    logToConsole("Populating languages...", "info");
    const languageSelect = getElement('language');
    if (!languageSelect) {
        logToConsole("Language select ('language') element not found. Cannot populate languages.", "error");
        populateDialectsUI(state); // Attempt to update dialects to show error
        return;
    }
    const options = Object.keys(languageOptions).map(k => ({ value: k, text: languageOptions[k].name }));
    const count = populateSelect(languageSelect, options, state.language);
    if (count === 0) { logToConsole("Language select populated with 0 options!", "error"); }
    else { logToConsole(`Populated languages. Selected: ${languageSelect.value}`, 'info'); }
    populateDialectsUI(state);
}

// Populate Dialects based on the language in the provided state
export function populateDialectsUI(state) {
    const selectedLangKey = state.language;
    const dialectSelect = getElement('dialectSelect');
    const customLanguageInput = getElement('customLanguageInput');

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

    if (!selectedLangKey) { dialectSelect.innerHTML = '<option value="">-- Select Language --</option>'; logToConsole("No language selected, disabling dialects.", 'warn'); return; }
    else if (selectedLangKey === 'custom') { dialectSelect.innerHTML = '<option value="">-- N/A --</option>'; logToConsole("Custom language selected, disabling dialects.", 'info'); return; }

    const langConfig = languageOptions[selectedLangKey];
    const dialects = langConfig?.dialects || [];
    const currentDialectFromState = state.dialect;
    if (dialects.length > 0) {
        populateSelect(dialectSelect, dialects, currentDialectFromState, false);
        disableElement(dialectSelect, false);
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

// Update UI with loaded state
export function updateUIFromState(state) {
    logToConsole("Updating UI from loaded state...", "info");
    if (!state) { logToConsole("Cannot update UI: state is null.", "error"); return; }
    if (Object.keys(domElements).length === 0) { logToConsole("DOM elements not cached yet. Cannot update UI.", "error"); return; }

    populateAiProviders(state);
    const keywordInput = getElement('keywordInput'); if (keywordInput) keywordInput.value = state.keyword || '';
    const bulkModeCheckbox = getElement('bulkModeCheckbox'); if (bulkModeCheckbox) bulkModeCheckbox.checked = state.bulkMode || defaultSettings.bulkMode;
    populateLanguagesUI(state); // Populates language AND dialect
    getElement('audienceInput').value = state.audience || defaultSettings.audience;
    getElement('readerNameInput').value = state.readerName || defaultSettings.readerName;
    getElement('toneSelect').value = state.tone || defaultSettings.tone;
    getElement('customToneInput').value = state.customTone || '';
    getElement('genderSelect').value = state.gender || defaultSettings.gender;
    getElement('ageSelect').value = state.age || defaultSettings.age;
    getElement('formatSelect').value = state.format || defaultSettings.format;
    getElement('sitemapUrlInput').value = state.sitemapUrl || defaultSettings.sitemapUrl;
    getElement('customSpecsInput').value = state.customSpecs || defaultSettings.customSpecs;

    const savedPurposes = state.purpose || defaultSettings.purpose;
    let showPurposeUrl = false; let showPurposeCta = false;
    const purposeCheckboxes = domElements['purposeCheckboxes']; // Use cached NodeList
    if(purposeCheckboxes) {
        purposeCheckboxes.forEach(cb => { cb.checked = savedPurposes.includes(cb.value); if (cb.checked) { if (cb.value === 'Promote URL') showPurposeUrl = true; if (cb.value.startsWith('Promote') || cb.value === 'Generate Leads') showPurposeCta = true; } });
    }
    getElement('purposeUrlInput').value = state.purposeUrl || defaultSettings.purposeUrl;
    getElement('purposeCtaInput').value = state.purposeCta || defaultSettings.purposeCta;
    showElement(getElement('purposeUrlInput'), showPurposeUrl);
    showElement(getElement('purposeCtaInput'), showPurposeCta);
    showElement(getElement('customToneInput'), state.tone === 'custom');

    const generateImagesCheckbox = getElement('generateImagesCheckbox'); if (generateImagesCheckbox) generateImagesCheckbox.checked = state.generateImages || defaultSettings.generateImages;
    getElement('numImagesSelect').value = state.numImages || defaultSettings.numImages;
    getElement('imageSubjectInput').value = state.imageSubject || defaultSettings.imageSubject;
    getElement('imageStyleSelect').value = state.imageStyle || defaultSettings.imageStyle;
    getElement('imageStyleModifiersInput').value = state.imageStyleModifiers || defaultSettings.imageStyleModifiers;
    getElement('imageTextInput').value = state.imageText || defaultSettings.imageText;
    const storageValue = state.imageStorage || defaultSettings.imageStorage;
    const radioToCheck = document.querySelector(`input[name="imageStorage"][value="${storageValue}"]`); // Re-query OK here
    if (radioToCheck) radioToCheck.checked = true; else { const firstRadio = document.querySelector('input[name="imageStorage"]'); if (firstRadio) firstRadio.checked = true; }
    getElement('githubRepoUrlInput').value = state.githubRepoUrl || defaultSettings.githubRepoUrl;
    getElement('githubCustomPathInput').value = state.githubCustomPath || defaultSettings.githubCustomPath;

    populateTextModels();
    populateImageModels();

    showElement(getElement('imageOptionsContainer'), state.generateImages);
    toggleGithubOptions(); // Call after storage radio is set
    updateUIBasedOnMode(state.bulkMode); // Set initial view based on loaded bulkMode

    const articleTitleInput = getElement('articleTitleInput'); if (articleTitleInput) articleTitleInput.value = state.articleTitle || '';
    const linkTypeToggle = getElement('linkTypeToggle'); if(linkTypeToggle) linkTypeToggle.checked = !(state.linkTypeInternal ?? defaultSettings.linkTypeInternal);
    const linkTypeText = getElement('linkTypeText'); if(linkTypeText) linkTypeText.textContent = (state.linkTypeInternal ?? defaultSettings.linkTypeInternal) ? 'Internal' : 'External';

    if (state.bulkMode) { renderPlanningTable(getBulkPlan()); }

    checkApiStatus(); // Final status check after all UI is set

    logToConsole("UI update from state finished.", "info");
}

// --- Planning Table Rendering ---
export function renderPlanningTable(plan) {
    const tableBody = getElement('planningTableBody');
    if (!tableBody) { logToConsole("Planning table body not found.", "error"); return; }
    tableBody.innerHTML = '';
    if (!plan || plan.length === 0) { tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No plan generated or loaded.</td></tr>'; return; }
    plan.forEach((item, index) => { const row = tableBody.insertRow(); row.dataset.index = index; let cell; cell = row.insertCell(); cell.textContent = item.keyword || 'N/A'; cell.classList.add('px-3', 'py-2', 'whitespace-nowrap'); cell = row.insertCell(); const titleInput = document.createElement('input'); titleInput.type = 'text'; titleInput.value = item.title || ''; titleInput.dataset.field = 'title'; titleInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(titleInput); cell.classList.add('px-3', 'py-2'); cell = row.insertCell(); const slugInput = document.createElement('input'); slugInput.type = 'text'; slugInput.value = item.slug || ''; slugInput.dataset.field = 'slug'; slugInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(slugInput); cell.classList.add('px-3', 'py-2'); cell = row.insertCell(); const intentInput = document.createElement('input'); intentInput.type = 'text'; intentInput.value = item.intent || ''; intentInput.dataset.field = 'intent'; intentInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(intentInput); cell.classList.add('px-3', 'py-2'); cell = row.insertCell(); cell.classList.add('px-3', 'py-2', 'whitespace-nowrap'); updatePlanItemStatusUI(row, item.status || 'Pending', item.error); });
     logToConsole(`Rendered planning table with ${plan.length} items.`, 'info');
}

// Update Status cell in Planning Table
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

// --- Progress Bar Updates ---
export function updateProgressBar(barElement, containerElement, textElement, current, total, textPrefix = '') {
    if (!barElement || !containerElement) return;
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    barElement.style.width = `${percent}%`;
    showElement(containerElement, true);
    if (textElement) { textElement.textContent = `${textPrefix}${current} of ${total}... (${percent}%)`; showElement(textElement, true); }
}

// ***** ADD EXPORT BACK *****
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
    showElement(githubOptionsContainer, generateImages && storageType === 'github');
}

// Function to display sitemap URLs (called from main after fetch)
export function displaySitemapUrlsUI(urls = []) {
    const listDiv = getElement('sitemapUrlsListDiv');
    if (!listDiv) { logToConsole("Sitemap list element not found for UI update.", "warn"); return; }
    if (!urls || urls.length === 0) { listDiv.innerHTML = `<em class="text-gray-400">No sitemap loaded or no URLs found.</em>`; return; }
    listDiv.innerHTML = '';
    urls.forEach(url => { const div = document.createElement('div'); div.textContent = url; div.title = url; listDiv.appendChild(div); });
    logToConsole(`Displayed ${urls.length} sitemap URLs.`, 'info');
}


console.log("article-ui.js loaded (v8.4 export fix)");