// article-ui.js
import { textProviders, imageProviders, languageOptions, defaultSettings } from './article-config.js';
import { getState, getCustomModelState } from './article-state.js';
import { logToConsole, showElement, findCheapestModel } from './article-helpers.js';

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
        toggleStructureVisibilityBtn: document.getElementById('toggleStructureVisibility'),
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
    if (!selectElement) return;
    selectElement.innerHTML = ''; // Clear existing
    if (addEmptyOption) {
        const emptyOpt = document.createElement('option');
        emptyOpt.value = "";
        emptyOpt.textContent = emptyText;
        selectElement.appendChild(emptyOpt);
    }
    options.forEach(option => {
        const opt = document.createElement('option');
        // Handle options being strings or { value: '...', text: '...' } objects
        if (typeof option === 'string') {
            opt.value = option;
            opt.textContent = option;
        } else {
            opt.value = option.value;
            opt.textContent = option.text;
        }
        selectElement.appendChild(opt);
    });
    if (selectedValue !== null) {
        selectElement.value = selectedValue;
    }
}

// Populate AI Providers
export function populateAiProviders(state) {
    populateSelect(domElements.aiProviderSelect, Object.keys(textProviders), state.textProvider);
    populateSelect(domElements.imageProviderSelect, Object.keys(imageProviders), state.imageProvider);
}

// Populate Text Models based on selected provider
export function populateTextModels(setDefault = false) {
    const state = getState(); // Get current state for provider
    const providerKey = state.textProvider;
    const providerConfig = textProviders[providerKey];
    const models = providerConfig?.models || [];
    let currentSelectedModel = state.customTextModel || state.textModel; // Prioritize custom if set

    populateSelect(domElements.aiModelSelect, models);

    // Set default or saved selection
    if (setDefault && !getCustomModelState('text', providerKey)) { // Only set default if not using custom
        const defaultModel = findCheapestModel(models);
        if (defaultModel) {
            domElements.aiModelSelect.value = defaultModel;
            logToConsole(`Default text model set to: ${defaultModel}`, 'info');
            currentSelectedModel = defaultModel; // Update for status check
        }
    } else if (currentSelectedModel && models.includes(currentSelectedModel)) {
         domElements.aiModelSelect.value = currentSelectedModel;
    } else if (getCustomModelState('text', providerKey)) {
         // If custom model is saved, ensure checkbox reflects this
         domElements.useCustomAiModelCheckbox.checked = true;
    }

    // Update custom model input visibility and value
    domElements.customAiModelInput.value = getCustomModelState('text', providerKey);
    toggleCustomModelUI('text');
    // Trigger API status check after populating
    // Note: checkApiStatus needs to be imported or passed if used here directly
    // For now, assume it's called externally after this function runs
}

// Populate Image Models based on selected provider
export function populateImageModels(setDefault = false) {
    const state = getState();
    const providerKey = state.imageProvider;
    const providerConfig = imageProviders[providerKey];
    const models = providerConfig?.models || [];
    const aspectRatios = providerConfig?.aspectRatios || ["1:1"];
    let currentSelectedModel = state.customImageModel || state.imageModel;

    populateSelect(domElements.imageModelSelect, models);
    populateSelect(domElements.imageAspectRatioSelect, aspectRatios, state.imageAspectRatio);

    // Set default or saved selection
    if (setDefault && !getCustomModelState('image', providerKey)) {
        const defaultModel = findCheapestModel(models);
        if (defaultModel) {
            domElements.imageModelSelect.value = defaultModel;
            logToConsole(`Default image model set to: ${defaultModel}`, 'info');
        }
    } else if (currentSelectedModel && models.includes(currentSelectedModel)) {
        domElements.imageModelSelect.value = currentSelectedModel;
    } else if (getCustomModelState('image', providerKey)) {
         domElements.useCustomImageModelCheckbox.checked = true;
    }

    // Update custom model input
    domElements.customImageModelInput.value = getCustomModelState('image', providerKey);
    toggleCustomModelUI('image');
}

// Toggle Custom Model UI Elements
export function toggleCustomModelUI(type) { // type = 'text' or 'image'
    const useCustomCheckbox = type === 'text' ? domElements.useCustomAiModelCheckbox : domElements.useCustomImageModelCheckbox;
    const modelSelect = type === 'text' ? domElements.aiModelSelect : domElements.imageModelSelect;
    const customInput = type === 'text' ? domElements.customAiModelInput : domElements.customImageModelInput;

    const useStandard = !useCustomCheckbox.checked;
    disableElement(modelSelect, !useStandard);
    showElement(customInput, !useStandard);
    customInput.classList.toggle('custom-input-visible', !useStandard); // Ensure class for styling
}


// Populate Languages and Dialects
export function populateLanguagesUI(state) {
    populateSelect(domElements.languageSelect, Object.keys(languageOptions).map(k => ({ value: k, text: languageOptions[k].name })), state.language);
    populateDialectsUI(); // Initial dialect population
}

export function populateDialectsUI() {
    const state = getState();
    const selectedLangKey = state.language;
    const langConfig = languageOptions[selectedLangKey];
    const dialects = langConfig?.dialects || [];

    // Populate select
    populateSelect(domElements.dialectSelect, dialects, state.dialect, false);

    // Enable/disable based on options
    const hasDialects = selectedLangKey !== 'custom' && dialects.length > 0;
    disableElement(domElements.dialectSelect, !hasDialects);
    if (!hasDialects) domElements.dialectSelect.innerHTML = '<option value="">-- N/A --</option>';

    // Show/hide custom input
    const showCustom = selectedLangKey === 'custom';
    showElement(domElements.customLanguageInput, showCustom);
    domElements.customLanguageInput.classList.toggle('custom-input-visible', showCustom);
}

// Update UI based on Mode (Single/Bulk)
export function updateUIBasedOnMode(isBulkMode) {
    logToConsole(`Switching UI to ${isBulkMode ? 'Bulk' : 'Single'} mode.`, 'info');

    // Toggle keyword inputs
    showElement(domElements.keywordInput, !isBulkMode);
    showElement(domElements.bulkKeywordsContainer, isBulkMode);
    domElements.keywordInput.closest('.input-group').classList.toggle('hidden', isBulkMode); // Hide single keyword label too

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
        domElements.formatSelect.value = 'markdown'; // Force markdown
        logToConsole('Format forced to Markdown for Bulk Mode.', 'info');
    }
}

// Update UI with loaded state
export function updateUIFromState(state) {
    logToConsole("Updating UI from loaded state...", "info");

    // AI Config
    domElements.aiProviderSelect.value = state.textProvider || defaultSettings.textProvider;
    // Models will be populated based on provider

    // Step 1 Specs
    domElements.bulkModeCheckbox.checked = state.bulkMode || defaultSettings.bulkMode;
    domElements.keywordInput.value = state.keyword || defaultSettings.keyword;
    // Note: bulkKeywords textarea is not saved in general state, loaded separately if needed
    domElements.languageSelect.value = state.language || defaultSettings.language;
    // Dialect will be populated based on language
    domElements.audienceInput.value = state.audience || defaultSettings.audience;
    domElements.readerNameInput.value = state.readerName || defaultSettings.readerName;
    domElements.toneSelect.value = state.tone || defaultSettings.tone;
    domElements.genderSelect.value = state.gender || defaultSettings.gender;
    domElements.ageSelect.value = state.age || defaultSettings.age;
    domElements.formatSelect.value = state.format || defaultSettings.format;
    domElements.sitemapUrlInput.value = state.sitemapUrl || defaultSettings.sitemapUrl;
    domElements.customSpecsInput.value = state.customSpecs || defaultSettings.customSpecs;

    // Update purpose checkboxes and related inputs
    const savedPurposes = state.purpose || defaultSettings.purpose;
    let showPurposeUrl = false;
    let showPurposeCta = false;
    domElements.purposeCheckboxes.forEach(cb => {
        cb.checked = savedPurposes.includes(cb.value);
        if (cb.checked) {
            if (cb.value === 'Promote URL') showPurposeUrl = true;
            if (cb.value.startsWith('Promote') || cb.value === 'Generate Leads') showPurposeCta = true;
        }
    });
    domElements.purposeUrlInput.value = state.purposeUrl || defaultSettings.purposeUrl;
    domElements.purposeCtaInput.value = state.purposeCta || defaultSettings.purposeCta;
    showElement(domElements.purposeUrlInput, showPurposeUrl);
    showElement(domElements.purposeCtaInput, showPurposeCta);

    // Image Gen Specs
    domElements.generateImagesCheckbox.checked = state.generateImages || defaultSettings.generateImages;
    domElements.imageProviderSelect.value = state.imageProvider || defaultSettings.imageProvider;
    // Image model will be populated
    domElements.numImagesSelect.value = state.numImages || defaultSettings.numImages;
    domElements.imageSubjectInput.value = state.imageSubject || defaultSettings.imageSubject;
    domElements.imageStyleSelect.value = state.imageStyle || defaultSettings.imageStyle;
    domElements.imageStyleModifiersInput.value = state.imageStyleModifiers || defaultSettings.imageStyleModifiers;
    domElements.imageTextInput.value = state.imageText || defaultSettings.imageText;
    // Set image storage radio
    const storageValue = state.imageStorage || defaultSettings.imageStorage;
    document.querySelector(`input[name="imageStorage"][value="${storageValue}"]`).checked = true;
    domElements.githubRepoUrlInput.value = state.githubRepoUrl || defaultSettings.githubRepoUrl;
    domElements.githubCustomPathInput.value = state.githubCustomPath || defaultSettings.githubCustomPath;

    // Other UI
    domElements.linkTypeToggle.checked = !state.linkTypeInternal; // Toggle is checked for External
    domElements.linkTypeText.textContent = state.linkTypeInternal ? 'Internal' : 'External';

    // Populate dynamic elements
    populateLanguagesUI(state); // Populates languages and dialects
    populateTextModels(); // Populates text models based on provider
    populateImageModels(); // Populates image models based on provider
    toggleCustomModelUI('text'); // Set initial visibility for custom text input
    toggleCustomModelUI('image'); // Set initial visibility for custom image input
    showElement(domElements.imageOptionsContainer, domElements.generateImagesCheckbox.checked);
    showElement(domElements.githubOptionsContainer, domElements.generateImagesCheckbox.checked && storageValue === 'github');

    // Set initial mode
    updateUIBasedOnMode(state.bulkMode);

    logToConsole("UI updated from state.", "info");
}

// --- Planning Table Rendering ---
export function renderPlanningTable(plan) {
    if (!domElements.planningTableBody) return;
    domElements.planningTableBody.innerHTML = ''; // Clear existing

    if (!plan || plan.length === 0) {
        domElements.planningTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No plan generated yet.</td></tr>';
        return;
    }

    plan.forEach((item, index) => {
        const row = domElements.planningTableBody.insertRow();
        row.dataset.index = index; // Store index for updates

        // Keyword (Readonly)
        let cell = row.insertCell();
        cell.textContent = item.keyword;

        // Title (Editable)
        cell = row.insertCell();
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = item.title || '';
        titleInput.dataset.field = 'title';
        titleInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full');
        cell.appendChild(titleInput);

        // Slug (Editable)
        cell = row.insertCell();
        const slugInput = document.createElement('input');
        slugInput.type = 'text';
        slugInput.value = item.slug || '';
        slugInput.dataset.field = 'slug';
        slugInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full');
        cell.appendChild(slugInput);

        // Intent (Editable)
        cell = row.insertCell();
        const intentInput = document.createElement('input');
        intentInput.type = 'text';
        intentInput.value = item.intent || '';
        intentInput.dataset.field = 'intent';
        intentInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full');
        cell.appendChild(intentInput);

        // Status (Readonly)
        cell = row.insertCell();
        updatePlanItemStatusUI(row, item.status || 'Pending', item.error);
    });
}

// Update Status cell in Planning Table
export function updatePlanItemStatusUI(rowElementOrIndex, status, errorMsg = null) {
    let row;
    if (typeof rowElementOrIndex === 'number') {
        row = domElements.planningTableBody?.querySelector(`tr[data-index="${rowElementOrIndex}"]`);
    } else {
        row = rowElementOrIndex;
    }
    if (!row || row.cells.length < 5) return; // Ensure row and cell exist

    const statusCell = row.cells[4];
    statusCell.textContent = status;
    statusCell.className = 'px-3 py-2 whitespace-nowrap'; // Reset classes
    statusCell.title = ''; // Clear previous error tooltip

    switch (status.toLowerCase()) {
        case 'pending': statusCell.classList.add('status-pending'); break;
        case 'generating': statusCell.classList.add('status-generating'); break;
        case 'uploading': statusCell.classList.add('status-uploading'); break;
        case 'completed': statusCell.classList.add('status-completed'); break;
        case 'failed':
            statusCell.classList.add('status-failed');
            if (errorMsg) {
                statusCell.textContent = `Failed: ${errorMsg.substring(0, 30)}...`; // Show truncated error
                statusCell.title = errorMsg; // Full error on hover
            } else {
                 statusCell.textContent = 'Failed';
            }
            break;
        default: statusCell.classList.add('status-pending'); break;
    }
}

// --- Progress Bar Updates ---
export function updateProgressBar(barElement, containerElement, textElement, current, total, textPrefix = '') {
    if (!barElement || !containerElement) return;
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    barElement.style.width = `${percent}%`;
    showElement(containerElement, true);
    if (textElement) {
        textElement.textContent = `${textPrefix}${current} of ${total}...`;
        showElement(textElement, true);
    }
}

export function hideProgressBar(barElement, containerElement, textElement) {
     if (barElement) barElement.style.width = '0%';
     if (containerElement) showElement(containerElement, false);
     if (textElement) showElement(textElement, false);
}


console.log("article-ui.js loaded");