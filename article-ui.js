// article-ui.js
import { textProviders, imageProviders, languageOptions, defaultSettings } from './article-config.js';
import { getState, getCustomModelState } from './article-state.js'; // Import getState
import { logToConsole, showElement, findCheapestModel, callAI, disableElement } from './article-helpers.js'; // Import callAI

// --- DOM Element References (Centralized) ---
let domElements = {};

export function cacheDomElements() {
    domElements = {
        // AI Config
        aiConfigSection: document.getElementById('aiConfigSection'),
        aiProviderSelect: document.getElementById('ai_provider'),
        aiModelSelect: document.getElementById('ai_model'),
        useCustomAiModelCheckbox: document.getElementById('useCustomAiModel'),
        customAiModelInput: document.getElementById('customAiModel'),
        apiStatusDiv: document.getElementById('apiStatus'),
        apiStatusIndicator: document.getElementById('apiStatusIndicator'),
        // Step 1
        step1Section: document.getElementById('step1'),
        keywordInput: document.getElementById('keyword'),
        bulkModeCheckbox: document.getElementById('bulkModeCheckbox'),
        bulkKeywordsContainer: document.getElementById('bulkKeywordsContainer'),
        bulkKeywords: document.getElementById('bulkKeywords'),
        languageSelect: document.getElementById('language'),
        customLanguageInput: document.getElementById('custom_language'),
        dialectSelect: document.getElementById('dialect'),
        audienceInput: document.getElementById('audience'),
        readerNameInput: document.getElementById('readerName'),
        toneSelect: document.getElementById('tone'),
        customToneInput: document.getElementById('custom_tone'),
        genderSelect: document.getElementById('gender'),
        ageSelect: document.getElementById('age'),
        purposeCheckboxes: document.querySelectorAll('input[name="purpose"]'),
        purposeUrlInput: document.getElementById('purposeUrl'),
        purposeCtaInput: document.getElementById('purposeCta'),
        formatSelect: document.getElementById('format'),
        sitemapUrlInput: document.getElementById('sitemapUrl'),
        fetchSitemapBtn: document.getElementById('fetchSitemapBtn'),
        sitemapLoadingIndicator: document.getElementById('sitemapLoadingIndicator'),
        customSpecsInput: document.getElementById('custom_specs'),
        // Image Gen
        generateImagesCheckbox: document.getElementById('generateImages'),
        imageOptionsContainer: document.getElementById('imageOptionsContainer'),
        imageProviderSelect: document.getElementById('imageProvider'),
        imageModelSelect: document.getElementById('imageModel'),
        useCustomImageModelCheckbox: document.getElementById('useCustomImageModel'),
        customImageModelInput: document.getElementById('customImageModel'),
        numImagesSelect: document.getElementById('numImages'),
        imageAspectRatioSelect: document.getElementById('imageAspectRatio'),
        imageSubjectInput: document.getElementById('imageSubject'),
        imageStyleSelect: document.getElementById('imageStyle'),
        imageStyleModifiersInput: document.getElementById('imageStyleModifiers'),
        imageTextInput: document.getElementById('imageText'),
        imageStorageRadios: document.querySelectorAll('input[name="imageStorage"]'),
        githubOptionsContainer: document.getElementById('githubOptionsContainer'),
        githubRepoUrlInput: document.getElementById('githubRepoUrl'),
        githubCustomPathInput: document.getElementById('githubCustomPath'),
        // Action Buttons
        generateSingleBtn: document.getElementById('generateSingleBtn'),
        generatePlanBtn: document.getElementById('generatePlanBtn'),
        structureLoadingIndicator: document.getElementById('structureLoadingIndicator'),
        planLoadingIndicator: document.getElementById('planLoadingIndicator'),
        resetDataBtn: document.getElementById('resetDataBtn'),
        // Step 1.5 (Bulk Plan)
        step1_5Section: document.getElementById('step1_5'),
        planningTableContainer: document.getElementById('planningTableContainer'),
        planningTableBody: document.querySelector('#planningTable tbody'),
        startBulkGenerationBtn: document.getElementById('startBulkGenerationBtn'),
        bulkLoadingIndicator: document.getElementById('bulkLoadingIndicator'),
        downloadBulkZipBtn: document.getElementById('downloadBulkZipBtn'),
        bulkGenerationProgress: document.getElementById('bulkGenerationProgress'),
        bulkCurrentNum: document.getElementById('bulkCurrentNum'),
        bulkTotalNum: document.getElementById('bulkTotalNum'),
        bulkCurrentKeyword: document.getElementById('bulkCurrentKeyword'),
        bulkUploadProgressContainer: document.getElementById('bulkUploadProgressContainer'),
        bulkUploadProgressBar: document.getElementById('bulkUploadProgressBar'),
        bulkUploadProgressText: document.getElementById('bulkUploadProgressText'),
        // Step 2 (Single)
        step2Section: document.getElementById('step2'),
        toggleStructureVisibilityBtn: document.getElementById('toggleStructureVisibilityBtn'),
        articleTitleInput: document.getElementById('articleTitle'),
        structureContainer: document.getElementById('structureContainer'),
        articleStructureTextarea: document.getElementById('article_structure'),
        sitemapUrlsListDiv: document.getElementById('sitemapUrlsList'),
        linkTypeToggle: document.getElementById('linkTypeToggle'),
        linkTypeText: document.getElementById('linkTypeText'),
        generateArticleBtn: document.getElementById('generateArticleBtn'),
        articleLoadingIndicator: document.getElementById('articleLoadingIndicator'),
        generationProgressDiv: document.getElementById('generationProgress'),
        currentSectionNumSpan: document.getElementById('currentSectionNum'),
        totalSectionNumSpan: document.getElementById('totalSectionNum'),
        uploadProgressContainer: document.getElementById('uploadProgressContainer'),
        uploadProgressBar: document.getElementById('uploadProgressBar'),
        uploadProgressText: document.getElementById('uploadProgressText'),
        // Step 3 (Single)
        step3Section: document.getElementById('step3'),
        articleOutputContainer: document.getElementById('article_output_container'),
        generatedArticleTextarea: document.getElementById('generated_article'),
        htmlPreviewDiv: document.getElementById('html_preview'),
        previewHtmlCheckbox: document.getElementById('preview_html_checkbox'),
        enableSpinningBtn: document.getElementById('enableSpinningBtn'),
        spinLoadingIndicator: document.getElementById('spinLoadingIndicator'),
        // Step 4 (Single)
        step4Section: document.getElementById('step4'),
        spinSelectedBtn: document.getElementById('spinSelectedBtn'),
        spinActionLoadingIndicator: document.getElementById('spinActionLoadingIndicator'),
        spinOutputContainer: document.getElementById('spin_output_container'),
        spunArticleDisplay: document.getElementById('spun_article_display'),
        // Console
        consoleLogContainer: document.getElementById('consoleLogContainer'),
        consoleLog: document.getElementById('consoleLog'),
    };
    logToConsole("DOM Elements cached.", "info");
}

export function getElement(id) {
    return domElements[id];
}

// --- UI Update Functions ---

// Populate Select Options
function populateSelect(selectElement, options, selectedValue = null, addEmptyOption = false, emptyText = "-- Select --") {
    // ... (implementation same as before)
    if (!selectElement) return;
    selectElement.innerHTML = '';
    if (addEmptyOption) { const emptyOpt = document.createElement('option'); emptyOpt.value = ""; emptyOpt.textContent = emptyText; selectElement.appendChild(emptyOpt); }
    options.forEach(option => { const opt = document.createElement('option'); if (typeof option === 'string') { opt.value = option; opt.textContent = option; } else { opt.value = option.value; opt.textContent = option.text; } selectElement.appendChild(opt); });
    if (selectedValue !== null) { selectElement.value = selectedValue; }
}

// Populate AI Providers
export function populateAiProviders(state) {
    populateSelect(domElements.aiProviderSelect, Object.keys(textProviders), state.textProvider);
    populateSelect(domElements.imageProviderSelect, Object.keys(imageProviders), state.imageProvider);
}

// --- API Status Function (Moved Here) ---
export async function checkApiStatus() {
    const state = getState(); // Get current state
    const providerKey = state.textProvider;
    // Determine the actual model to check (standard or custom)
    const model = state.useCustomTextModel ? state.customTextModel : state.textModel;

    if (!providerKey || !model) {
        domElements.apiStatusDiv.innerHTML = `<span class="status-error">Select Provider/Model</span>`;
        return;
    }

    domElements.apiStatusDiv.innerHTML = `<span class="status-checking">Checking ${providerKey}...</span>`;
    showElement(domElements.apiStatusIndicator, true);

    try {
        // Use callAI (imported from helpers)
        const result = await callAI('check_status', { providerKey, model }, null, null); // No specific indicator/button needed here

        if (!result?.success) {
            throw new Error(result?.error || `Status check failed`);
        }

        domElements.apiStatusDiv.innerHTML = `<span class="status-ok">✅ Ready (${providerKey})</span>`;
        logToConsole(`API Status OK for ${providerKey} (${model})`, 'success');

    } catch (error) {
        console.error("API Status Check Failed:", error);
        logToConsole(`API Status Error: ${error.message}`, 'error');
        // Display the error message from the result if available
        const displayError = error.message.startsWith('API Error:') ? error.message.substring(10).trim() : error.message;
        domElements.apiStatusDiv.innerHTML = `<span class="status-error">❌ Error: ${displayError}</span>`;
    } finally {
         showElement(domElements.apiStatusIndicator, false);
    }
}


// Populate Text Models based on selected provider
export function populateTextModels(setDefault = false) {
    const state = getState();
    const providerKey = state.textProvider;
    const providerConfig = textProviders[providerKey];
    const models = providerConfig?.models || [];
    // Determine current selection based on state (custom or standard)
    const currentSelectedModel = state.useCustomTextModel
        ? state.customTextModel
        : state.textModel;

    populateSelect(domElements.aiModelSelect, models);

    let modelToSelect = '';
    if (setDefault && !state.useCustomTextModel) {
        modelToSelect = findCheapestModel(models);
        if (modelToSelect) logToConsole(`Default text model set to: ${modelToSelect}`, 'info');
    } else if (state.useCustomTextModel && state.customTextModel) {
        // If using custom, don't select anything in the dropdown
        modelToSelect = ''; // Ensure dropdown doesn't show a selection
    } else if (currentSelectedModel && models.includes(currentSelectedModel)) {
        modelToSelect = currentSelectedModel; // Select the saved standard model
    } else if (models.length > 0) {
        modelToSelect = models[0]; // Fallback to first available standard model
    }

    if (modelToSelect) {
        domElements.aiModelSelect.value = modelToSelect;
    }

    // Update custom model UI based on state
    domElements.useCustomAiModelCheckbox.checked = state.useCustomTextModel || false;
    domElements.customAiModelInput.value = getCustomModelState('text', providerKey); // Use getter for consistency
    toggleCustomModelUI('text');
    // Trigger API status check after populating
    checkApiStatus();
}

// Populate Image Models based on selected provider
export function populateImageModels(setDefault = false) {
    const state = getState();
    const providerKey = state.imageProvider;
    const providerConfig = imageProviders[providerKey];
    const models = providerConfig?.models || [];
    const aspectRatios = providerConfig?.aspectRatios || ["1:1"];
    const currentSelectedModel = state.useCustomImageModel
        ? state.customImageModel
        : state.imageModel;

    populateSelect(domElements.imageModelSelect, models);
    populateSelect(domElements.imageAspectRatioSelect, aspectRatios, state.imageAspectRatio);

    let modelToSelect = '';
     if (setDefault && !state.useCustomImageModel) {
        modelToSelect = findCheapestModel(models);
        if (modelToSelect) logToConsole(`Default image model set to: ${modelToSelect}`, 'info');
    } else if (state.useCustomImageModel && state.customImageModel) {
        modelToSelect = '';
    } else if (currentSelectedModel && models.includes(currentSelectedModel)) {
        modelToSelect = currentSelectedModel;
    } else if (models.length > 0) {
        modelToSelect = models[0];
    }

    if (modelToSelect) {
        domElements.imageModelSelect.value = modelToSelect;
    }

    // Update custom model UI based on state
    domElements.useCustomImageModelCheckbox.checked = state.useCustomImageModel || false;
    domElements.customImageModelInput.value = getCustomModelState('image', providerKey);
    toggleCustomModelUI('image');
}

// Toggle Custom Model UI Elements
export function toggleCustomModelUI(type) {
    const useCustomCheckbox = type === 'text' ? domElements.useCustomAiModelCheckbox : domElements.useCustomImageModelCheckbox;
    const modelSelect = type === 'text' ? domElements.aiModelSelect : domElements.imageModelSelect;
    const customInput = type === 'text' ? domElements.customAiModelInput : domElements.customImageModelInput;

    // Ensure elements exist before proceeding
    if (!useCustomCheckbox || !modelSelect || !customInput) {
        logToConsole(`Missing UI elements for custom model toggle (type: ${type})`, 'warn');
        return;
    }

    const useStandard = !useCustomCheckbox.checked;
    disableElement(modelSelect, !useStandard);
    showElement(customInput, !useStandard);
    customInput.classList.toggle('custom-input-visible', !useStandard);
}


// Populate Languages and Dialects
export function populateLanguagesUI(state) {
    populateSelect(domElements.languageSelect, Object.keys(languageOptions).map(k => ({ value: k, text: languageOptions[k].name })), state.language);
    populateDialectsUI();
}

export function populateDialectsUI() {
    const state = getState(); // Get current state to determine selected language
    const selectedLangKey = state.language;
    const langConfig = languageOptions[selectedLangKey];
    const dialects = langConfig?.dialects || [];
    const currentDialect = state.dialect; // Get saved dialect

    populateSelect(domElements.dialectSelect, dialects, currentDialect, false);

    const hasDialects = selectedLangKey !== 'custom' && dialects.length > 0;
    disableElement(domElements.dialectSelect, !hasDialects);
    if (!hasDialects) domElements.dialectSelect.innerHTML = '<option value="">-- N/A --</option>';

    const showCustom = selectedLangKey === 'custom';
    showElement(domElements.customLanguageInput, showCustom);
    domElements.customLanguageInput.classList.toggle('custom-input-visible', showCustom);
     // Populate custom language input from state if shown
     if (showCustom) {
         domElements.customLanguageInput.value = state.customLanguage || '';
     }
}

// Update UI based on Mode (Single/Bulk)
export function updateUIBasedOnMode(isBulkMode) {
    logToConsole(`Switching UI to ${isBulkMode ? 'Bulk' : 'Single'} mode.`, 'info');

    // Toggle keyword inputs
    showElement(domElements.keywordInput?.closest('.input-group'), !isBulkMode); // Toggle the whole group
    showElement(domElements.bulkKeywordsContainer, isBulkMode);

    // Toggle action buttons in Step 1
    showElement(domElements.generateSingleBtn, !isBulkMode);
    showElement(domElements.generatePlanBtn, isBulkMode);

    // Show/Hide sections specific to modes
    showElement(domElements.step1_5Section, isBulkMode); // Planning Table
    showElement(domElements.step2Section, !isBulkMode); // Structure Refinement
    showElement(domElements.step3Section, !isBulkMode); // Review Article
    showElement(domElements.step4Section, !isBulkMode); // Spinner

    // Disable format selection in bulk mode (always Markdown)
    disableElement(domElements.formatSelect, isBulkMode);
    if (isBulkMode) {
        domElements.formatSelect.value = 'markdown';
        logToConsole('Format forced to Markdown for Bulk Mode.', 'info');
    }
}

// Update UI with loaded state
export function updateUIFromState(state) {
    logToConsole("Updating UI from loaded state...", "info");

    // AI Config (Provider only, models populated later)
    domElements.aiProviderSelect.value = state.textProvider;
    domElements.imageProviderSelect.value = state.imageProvider;

    // Step 1 Specs
    domElements.bulkModeCheckbox.checked = state.bulkMode;
    domElements.keywordInput.value = state.keyword;
    // bulkKeywords textarea loaded separately if needed by bulk module
    domElements.languageSelect.value = state.language;
    domElements.customLanguageInput.value = state.customLanguage || ''; // Populate custom lang input
    // Dialect populated by populateLanguagesUI/populateDialectsUI
    domElements.audienceInput.value = state.audience;
    domElements.readerNameInput.value = state.readerName;
    domElements.toneSelect.value = state.tone;
    domElements.customToneInput.value = state.customTone || ''; // Populate custom tone input
    domElements.genderSelect.value = state.gender;
    domElements.ageSelect.value = state.age;
    domElements.formatSelect.value = state.format;
    domElements.sitemapUrlInput.value = state.sitemapUrl;
    domElements.customSpecsInput.value = state.customSpecs;

    // Update purpose checkboxes and related inputs
    const savedPurposes = state.purpose || defaultSettings.purpose;
    let showPurposeUrl = false; let showPurposeCta = false;
    domElements.purposeCheckboxes.forEach(cb => { cb.checked = savedPurposes.includes(cb.value); if (cb.checked) { if (cb.value === 'Promote URL') showPurposeUrl = true; if (cb.value.startsWith('Promote') || cb.value === 'Generate Leads') showPurposeCta = true; } });
    domElements.purposeUrlInput.value = state.purposeUrl; domElements.purposeCtaInput.value = state.purposeCta;
    showElement(domElements.purposeUrlInput, showPurposeUrl); showElement(domElements.purposeCtaInput, showPurposeCta);
    domElements.customToneInput.classList.toggle('hidden', state.tone !== 'custom'); // Show/hide custom tone input

    // Image Gen Specs
    domElements.generateImagesCheckbox.checked = state.generateImages;
    domElements.numImagesSelect.value = state.numImages;
    domElements.imageAspectRatioSelect.value = state.imageAspectRatio; // Will be repopulated based on provider
    domElements.imageSubjectInput.value = state.imageSubject;
    domElements.imageStyleSelect.value = state.imageStyle;
    domElements.imageStyleModifiersInput.value = state.imageStyleModifiers;
    domElements.imageTextInput.value = state.imageText;
    const storageValue = state.imageStorage || defaultSettings.imageStorage;
    const radioToCheck = document.querySelector(`input[name="imageStorage"][value="${storageValue}"]`);
    if(radioToCheck) radioToCheck.checked = true;
    domElements.githubRepoUrlInput.value = state.githubRepoUrl;
    domElements.githubCustomPathInput.value = state.githubCustomPath;

    // Other UI
    domElements.linkTypeToggle.checked = !state.linkTypeInternal;
    domElements.linkTypeText.textContent = state.linkTypeInternal ? 'Internal' : 'External';

    // Populate dynamic elements AFTER setting provider values
    populateLanguagesUI(state); // Populates languages and dialects based on state.language
    populateTextModels(); // Populates text models based on state.textProvider
    populateImageModels(); // Populates image models based on state.imageProvider
    toggleCustomModelUI('text');
    toggleCustomModelUI('image');
    showElement(domElements.imageOptionsContainer, state.generateImages);
    showElement(domElements.githubOptionsContainer, state.generateImages && storageValue === 'github');

    // Set initial mode
    updateUIBasedOnMode(state.bulkMode);

    logToConsole("UI updated from state.", "info");
}

// --- Planning Table Rendering ---
export function renderPlanningTable(plan) {
    // ... (implementation same as v7)
    if (!domElements.planningTableBody) return;
    domElements.planningTableBody.innerHTML = '';
    if (!plan || plan.length === 0) { domElements.planningTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No plan generated yet.</td></tr>'; return; }
    plan.forEach((item, index) => { const row = domElements.planningTableBody.insertRow(); row.dataset.index = index; let cell = row.insertCell(); cell.textContent = item.keyword; cell = row.insertCell(); const titleInput = document.createElement('input'); titleInput.type = 'text'; titleInput.value = item.title || ''; titleInput.dataset.field = 'title'; titleInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(titleInput); cell = row.insertCell(); const slugInput = document.createElement('input'); slugInput.type = 'text'; slugInput.value = item.slug || ''; slugInput.dataset.field = 'slug'; slugInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(slugInput); cell = row.insertCell(); const intentInput = document.createElement('input'); intentInput.type = 'text'; intentInput.value = item.intent || ''; intentInput.dataset.field = 'intent'; intentInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(intentInput); cell = row.insertCell(); updatePlanItemStatusUI(row, item.status || 'Pending', item.error); });
}

// Update Status cell in Planning Table
export function updatePlanItemStatusUI(rowElementOrIndex, status, errorMsg = null) {
    // ... (implementation same as v7)
    let row; if (typeof rowElementOrIndex === 'number') { row = domElements.planningTableBody?.querySelector(`tr[data-index="${rowElementOrIndex}"]`); } else { row = rowElementOrIndex; } if (!row || row.cells.length < 5) return; const statusCell = row.cells[4]; statusCell.textContent = status; statusCell.className = 'px-3 py-2 whitespace-nowrap'; statusCell.title = ''; switch (status.toLowerCase().split('(')[0].trim()) { /* Check base status */ case 'pending': statusCell.classList.add('status-pending'); break; case 'generating': statusCell.classList.add('status-generating'); break; case 'uploading': statusCell.classList.add('status-uploading'); break; case 'completed': statusCell.classList.add('status-completed'); break; case 'failed': statusCell.classList.add('status-failed'); if (errorMsg) { statusCell.textContent = `Failed: ${errorMsg.substring(0, 30)}...`; statusCell.title = errorMsg; } else { statusCell.textContent = 'Failed'; } break; default: statusCell.classList.add('status-pending'); break; }
}

// --- Progress Bar Updates ---
export function updateProgressBar(barElement, containerElement, textElement, current, total, textPrefix = '') {
    // ... (implementation same as v7)
    if (!barElement || !containerElement) return; const percent = total > 0 ? Math.round((current / total) * 100) : 0; barElement.style.width = `${percent}%`; showElement(containerElement, true); if (textElement) { textElement.textContent = `${textPrefix}${current} of ${total}...`; showElement(textElement, true); }
}

export function hideProgressBar(barElement, containerElement, textElement) {
     // ... (implementation same as v7)
     if (barElement) barElement.style.width = '0%'; if (containerElement) showElement(containerElement, false); if (textElement) showElement(textElement, false);
}

// Helper function specifically for GitHub options visibility
export function toggleGithubOptions() {
    const storageType = document.querySelector('input[name="imageStorage"]:checked')?.value;
    showElement(getElement('githubOptionsContainer'), storageType === 'github');
}


console.log("article-ui.js loaded");