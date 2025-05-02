// article-ui.js (fixed state reading and population)
import { textProviders, imageProviders, languageOptions, defaultSettings } from './article-config.js';
import { getState, getCustomModelState } from './article-state.js';
import { logToConsole, showElement, findCheapestModel, callAI, disableElement } from './article-helpers.js';

// --- DOM Element References (Centralized) ---
let domElements = {}; // Populated by cacheDomElements

export function cacheDomElements() {
    // ... (Caching logic remains the same as v8.1) ...
    domElements = { aiConfigSection: document.getElementById('aiConfigSection'), aiProviderSelect: document.getElementById('ai_provider'), aiModelSelect: document.getElementById('ai_model'), useCustomAiModelCheckbox: document.getElementById('useCustomAiModel'), customAiModelInput: document.getElementById('customAiModel'), apiStatusDiv: document.getElementById('apiStatus'), apiStatusIndicator: document.getElementById('apiStatusIndicator'), step1Section: document.getElementById('step1'), keywordInput: document.getElementById('keyword'), bulkModeCheckbox: document.getElementById('bulkModeCheckbox'), bulkKeywordsContainer: document.getElementById('bulkKeywordsContainer'), bulkKeywords: document.getElementById('bulkKeywords'), languageSelect: document.getElementById('language'), customLanguageInput: document.getElementById('custom_language'), dialectSelect: document.getElementById('dialect'), audienceInput: document.getElementById('audience'), readerNameInput: document.getElementById('readerName'), toneSelect: document.getElementById('tone'), customToneInput: document.getElementById('custom_tone'), genderSelect: document.getElementById('gender'), ageSelect: document.getElementById('age'), purposeCheckboxes: document.querySelectorAll('input[name="purpose"]'), purposeUrlInput: document.getElementById('purposeUrl'), purposeCtaInput: document.getElementById('purposeCta'), formatSelect: document.getElementById('format'), sitemapUrlInput: document.getElementById('sitemapUrl'), fetchSitemapBtn: document.getElementById('fetchSitemapBtn'), sitemapLoadingIndicator: document.getElementById('sitemapLoadingIndicator'), customSpecsInput: document.getElementById('custom_specs'), generateImagesCheckbox: document.getElementById('generateImages'), imageOptionsContainer: document.getElementById('imageOptionsContainer'), imageProviderSelect: document.getElementById('imageProvider'), imageModelSelect: document.getElementById('imageModel'), useCustomImageModelCheckbox: document.getElementById('useCustomImageModel'), customImageModelInput: document.getElementById('customImageModel'), numImagesSelect: document.getElementById('numImages'), imageAspectRatioSelect: document.getElementById('imageAspectRatio'), imageSubjectInput: document.getElementById('imageSubject'), imageStyleSelect: document.getElementById('imageStyle'), imageStyleModifiersInput: document.getElementById('imageStyleModifiers'), imageTextInput: document.getElementById('imageText'), imageStorageRadios: document.querySelectorAll('input[name="imageStorage"]'), githubOptionsContainer: document.getElementById('githubOptionsContainer'), githubRepoUrlInput: document.getElementById('githubRepoUrl'), githubCustomPathInput: document.getElementById('githubCustomPath'), generateSingleBtn: document.getElementById('generateSingleBtn'), generatePlanBtn: document.getElementById('generatePlanBtn'), structureLoadingIndicator: document.getElementById('structureLoadingIndicator'), planLoadingIndicator: document.getElementById('planLoadingIndicator'), resetDataBtn: document.getElementById('resetDataBtn'), forceReloadBtn: document.getElementById('forceReloadBtn'), step1_5Section: document.getElementById('step1_5'), planningTableContainer: document.getElementById('planningTableContainer'), planningTableBody: document.querySelector('#planningTable tbody'), startBulkGenerationBtn: document.getElementById('startBulkGenerationBtn'), bulkLoadingIndicator: document.getElementById('bulkLoadingIndicator'), downloadBulkZipBtn: document.getElementById('downloadBulkZipBtn'), bulkGenerationProgress: document.getElementById('bulkGenerationProgress'), bulkCurrentNum: document.getElementById('bulkCurrentNum'), bulkTotalNum: document.getElementById('bulkTotalNum'), bulkCurrentKeyword: document.getElementById('bulkCurrentKeyword'), bulkUploadProgressContainer: document.getElementById('bulkUploadProgressContainer'), bulkUploadProgressBar: document.getElementById('bulkUploadProgressBar'), bulkUploadProgressText: document.getElementById('bulkUploadProgressText'), step2Section: document.getElementById('step2'), toggleStructureVisibilityBtn: document.getElementById('toggleStructureVisibilityBtn'), articleTitleInput: document.getElementById('articleTitle'), structureContainer: document.getElementById('structureContainer'), articleStructureTextarea: document.getElementById('article_structure'), sitemapUrlsListDiv: document.getElementById('sitemapUrlsList'), linkTypeToggle: document.getElementById('linkTypeToggle'), linkTypeText: document.getElementById('linkTypeText'), generateArticleBtn: document.getElementById('generateArticleBtn'), articleLoadingIndicator: document.getElementById('articleLoadingIndicator'), generationProgressDiv: document.getElementById('generationProgress'), currentSectionNumSpan: document.getElementById('currentSectionNum'), totalSectionNumSpan: document.getElementById('totalSectionNum'), uploadProgressContainer: document.getElementById('uploadProgressContainer'), uploadProgressBar: document.getElementById('uploadProgressBar'), uploadProgressText: document.getElementById('uploadProgressText'), step3Section: document.getElementById('step3'), articleOutputContainer: document.getElementById('article_output_container'), generatedArticleTextarea: document.getElementById('generated_article'), htmlPreviewDiv: document.getElementById('html_preview'), previewHtmlCheckbox: document.getElementById('preview_html_checkbox'), enableSpinningBtn: document.getElementById('enableSpinningBtn'), spinLoadingIndicator: document.getElementById('spinLoadingIndicator'), step4Section: document.getElementById('step4'), spinSelectedBtn: document.getElementById('spinSelectedBtn'), spinActionLoadingIndicator: document.getElementById('spinActionLoadingIndicator'), spinOutputContainer: document.getElementById('spin_output_container'), spunArticleDisplay: document.getElementById('spun_article_display'), consoleLogContainer: document.getElementById('consoleLogContainer'), consoleLog: document.getElementById('consoleLog'), };
    if (!domElements.aiProviderSelect || !domElements.languageSelect) { logToConsole("Critical select elements not found during cache!", "error"); }
    else { logToConsole("DOM Elements cached.", "info"); }
}

export function getElement(id) {
    if (!domElements[id]) { logToConsole(`Attempted to get non-cached element: ${id}`, 'warn'); }
    return domElements[id];
}

// --- UI Update Functions ---

function populateSelect(selectElement, options, selectedValue = null, addEmptyOption = false, emptyText = "-- Select --") {
    // ... (implementation same as v8.1) ...
    if (!selectElement) { logToConsole(`Cannot populate select: Element not found (was null).`, 'error'); return 0; }
    const elementName = selectElement.id || selectElement.name || 'Unnamed Select';
    selectElement.innerHTML = ''; let optionsAdded = 0;
    if (addEmptyOption) { const emptyOpt = document.createElement('option'); emptyOpt.value = ""; emptyOpt.textContent = emptyText; selectElement.appendChild(emptyOpt); optionsAdded++; }
    options.forEach(option => { const opt = document.createElement('option'); if (typeof option === 'string') { opt.value = option; opt.textContent = option; } else { opt.value = option.value; opt.textContent = option.text; } selectElement.appendChild(opt); optionsAdded++; });
    if (selectedValue !== null && Array.from(selectElement.options).some(opt => opt.value === selectedValue)) { selectElement.value = selectedValue; }
    else if (selectElement.options.length > 0) { selectElement.selectedIndex = addEmptyOption ? 0 : 0; }
    // if (optionsAdded === (addEmptyOption ? 1 : 0)) { logToConsole(`Populated select '${elementName}' but added 0 actual options.`, 'warn'); }
    return optionsAdded;
}

export function populateAiProviders(state) {
    logToConsole("Populating AI providers...", "info");
    populateSelect(domElements.aiProviderSelect, Object.keys(textProviders), state.textProvider);
    populateSelect(domElements.imageProviderSelect, Object.keys(imageProviders), state.imageProvider);
}

// --- API Status Function ---
export async function checkApiStatus() {
    const state = getState(); // Get FRESH state
    const providerKey = state.textProvider;
    // FIX: Get the correct model based on the custom checkbox state
    const model = state.useCustomTextModel
        ? state.customTextModel
        : state.textModel;

    // Check if elements exist before using them
    const statusDiv = getElement('apiStatus');
    const statusIndicator = getElement('apiStatusIndicator');
    if (!statusDiv || !statusIndicator) {
        logToConsole("API Status UI elements not found.", "error");
        return;
    }

    if (!providerKey || !model) {
        statusDiv.innerHTML = `<span class="status-error">Select Provider/Model</span>`;
        logToConsole("API Status Check skipped: Provider or Model missing.", "warn");
        return;
    }

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
        const displayError = error.message.startsWith('API Error:') ? error.message.substring(10).trim() : error.message;
        statusDiv.innerHTML = `<span class="status-error">❌ Error: ${displayError}</span>`;
    } finally {
         showElement(statusIndicator, false);
    }
}


// Populate Text Models based on selected provider
export function populateTextModels(setDefault = false) {
    const state = getState(); // Get FRESH state
    const providerKey = state.textProvider; // Use current provider from state
    logToConsole(`Populating text models for provider: ${providerKey}`, "info");
    if (!providerKey || !textProviders[providerKey]) {
        logToConsole(`Cannot populate text models: Invalid provider key '${providerKey}' found in state.`, "warn");
        domElements.aiModelSelect.innerHTML = '<option value="">-- Select Provider --</option>';
        disableElement(domElements.aiModelSelect, true);
        return;
    }
    const providerConfig = textProviders[providerKey];
    const models = providerConfig?.models || [];
    // Determine current selection based on state, PRIORITIZING custom if checked
    const currentSelectedModel = state.useCustomTextModel
        ? state.customTextModel // If custom checked, this is irrelevant for the dropdown selection
        : state.textModel;      // If not custom, use the saved standard model

    populateSelect(domElements.aiModelSelect, models);

    let modelToSelect = '';
    if (setDefault && !state.useCustomTextModel && models.length > 0) {
        modelToSelect = findCheapestModel(models);
        if (modelToSelect) logToConsole(`Default text model set to: ${modelToSelect}`, 'info');
    } else if (!state.useCustomTextModel && currentSelectedModel && models.includes(currentSelectedModel)) {
        // Select saved standard model only if not using custom and it exists in the list
        modelToSelect = currentSelectedModel;
    } else if (!state.useCustomTextModel && models.length > 0) {
        // Fallback to first standard model if not using custom and saved one is invalid
        modelToSelect = models[0];
    }
    // If using custom, modelToSelect remains '', dropdown shows first item but isn't the 'active' model

    if (modelToSelect) {
        domElements.aiModelSelect.value = modelToSelect;
    }

    // Update custom model UI based on state AFTER populating dropdown
    domElements.useCustomAiModelCheckbox.checked = state.useCustomTextModel || false;
    domElements.customAiModelInput.value = getCustomModelState('text', providerKey);
    toggleCustomModelUI('text'); // This enables/disables based on checkbox

    if (domElements.aiModelSelect && domElements.aiModelSelect.options.length === 0 && !state.useCustomTextModel) {
        logToConsole(`Text Model select is empty after population attempt for provider ${providerKey}!`, "error");
    }
    // Check status *after* everything is set
    checkApiStatus();
}

// Populate Image Models based on selected provider
export function populateImageModels(setDefault = false) {
    const state = getState(); // Get FRESH state
    const providerKey = state.imageProvider; // Use current provider from state
    logToConsole(`Populating image models for provider: ${providerKey}`, "info");
    if (!providerKey || !imageProviders[providerKey]) {
        logToConsole(`Cannot populate image models: Invalid provider key '${providerKey}' found in state.`, "warn");
        domElements.imageModelSelect.innerHTML = '<option value="">-- Select Provider --</option>';
        disableElement(domElements.imageModelSelect, true);
        return;
    }
    const providerConfig = imageProviders[providerKey];
    const models = providerConfig?.models || [];
    const aspectRatios = providerConfig?.aspectRatios || ["1:1"];
    const currentSelectedModel = state.useCustomImageModel ? state.customImageModel : state.imageModel;

    populateSelect(domElements.imageModelSelect, models);
    populateSelect(domElements.imageAspectRatioSelect, aspectRatios, state.imageAspectRatio);

    let modelToSelect = '';
    if (setDefault && !state.useCustomImageModel && models.length > 0) { modelToSelect = findCheapestModel(models); if (modelToSelect) logToConsole(`Default image model set to: ${modelToSelect}`, 'info'); }
    else if (!state.useCustomImageModel && currentSelectedModel && models.includes(currentSelectedModel)) { modelToSelect = currentSelectedModel; }
    else if (!state.useCustomImageModel && models.length > 0) { modelToSelect = models[0]; }

    if (modelToSelect) { domElements.imageModelSelect.value = modelToSelect; }

    domElements.useCustomImageModelCheckbox.checked = state.useCustomImageModel || false;
    domElements.customImageModelInput.value = getCustomModelState('image', providerKey);
    toggleCustomModelUI('image');
    if (domElements.imageModelSelect && domElements.imageModelSelect.options.length === 0 && !state.useCustomImageModel) { logToConsole(`Image Model select is empty after population attempt for provider ${providerKey}!`, "error"); }
}

// Toggle Custom Model UI Elements
export function toggleCustomModelUI(type) { /* ... (same as v8.1) ... */ const useCustomCheckbox = type === 'text' ? domElements.useCustomAiModelCheckbox : domElements.useCustomImageModelCheckbox; const modelSelect = type === 'text' ? domElements.aiModelSelect : domElements.imageModelSelect; const customInput = type === 'text' ? domElements.customAiModelInput : domElements.customImageModelInput; if (!useCustomCheckbox || !modelSelect || !customInput) { logToConsole(`Missing UI elements for custom model toggle (type: ${type})`, 'warn'); return; } const useStandard = !useCustomCheckbox.checked; disableElement(modelSelect, !useStandard); showElement(customInput, !useStandard); customInput.classList.toggle('custom-input-visible', !useStandard); }


// Populate Languages and Dialects
export function populateLanguagesUI(state) {
    logToConsole("Populating languages...", "info");
    const options = Object.keys(languageOptions).map(k => ({ value: k, text: languageOptions[k].name }));
    const count = populateSelect(domElements.languageSelect, options, state.language);
    if (count === 0) { logToConsole("Language select is empty after population attempt!", "error"); }
    populateDialectsUI(); // Call this AFTER language is set
}

export function populateDialectsUI() {
    const state = getState(); // Get FRESH state
    const selectedLangKey = state.language; // Read from current state
    logToConsole(`Populating dialects for language key: ${selectedLangKey}`, "info");
    if (!selectedLangKey) { logToConsole("Cannot populate dialects: No language key in state.", "warn"); domElements.dialectSelect.innerHTML = '<option value="">-- Select Language --</option>'; disableElement(domElements.dialectSelect, true); return; }
    const langConfig = languageOptions[selectedLangKey];
    const dialects = langConfig?.dialects || [];
    const currentDialect = state.dialect;

    populateSelect(domElements.dialectSelect, dialects, currentDialect, false);

    const hasDialects = selectedLangKey !== 'custom' && dialects.length > 0;
    disableElement(domElements.dialectSelect, !hasDialects);
    if (!hasDialects) domElements.dialectSelect.innerHTML = '<option value="">-- N/A --</option>';

    const showCustom = selectedLangKey === 'custom';
    showElement(domElements.customLanguageInput, showCustom);
    domElements.customLanguageInput.classList.toggle('custom-input-visible', showCustom);
     if (showCustom) { domElements.customLanguageInput.value = state.customLanguage || ''; }
}

// Update UI based on Mode (Single/Bulk)
export function updateUIBasedOnMode(isBulkMode) { /* ... (same as v8.1) ... */ logToConsole(`Switching UI to ${isBulkMode ? 'Bulk' : 'Single'} mode.`, 'info'); showElement(domElements.keywordInput?.closest('.input-group'), !isBulkMode); showElement(domElements.bulkKeywordsContainer, isBulkMode); showElement(domElements.generateSingleBtn, !isBulkMode); showElement(domElements.generatePlanBtn, isBulkMode); showElement(domElements.step1_5Section, isBulkMode); showElement(domElements.step2Section, !isBulkMode); showElement(domElements.step3Section, !isBulkMode); showElement(domElements.step4Section, !isBulkMode); disableElement(domElements.formatSelect, isBulkMode); if (isBulkMode) { domElements.formatSelect.value = 'markdown'; logToConsole('Format forced to Markdown for Bulk Mode.', 'info'); } }

// Update UI with loaded state
export function updateUIFromState(state) {
    logToConsole("Updating UI from loaded state...", "info");
    if (!state) { logToConsole("Cannot update UI: state is null.", "error"); return; }

    // --- Populate Selects FIRST ---
    populateAiProviders(state);
    populateLanguagesUI(state); // Populates languages and initial dialects

    // --- Set Values for Simple Inputs/Selects ---
    // FIX: Check if state.keyword exists before setting, otherwise leave placeholder
    if (state.keyword !== undefined && state.keyword !== null) {
         domElements.keywordInput.value = state.keyword;
    } else {
         domElements.keywordInput.value = ''; // Explicitly clear if state is undefined/null
    }
    // ... (rest of value setting same as v8.1, using || defaultSettings) ...
    domElements.bulkModeCheckbox.checked = state.bulkMode || defaultSettings.bulkMode;
    domElements.audienceInput.value = state.audience || defaultSettings.audience;
    domElements.readerNameInput.value = state.readerName || defaultSettings.readerName;
    domElements.toneSelect.value = state.tone || defaultSettings.tone;
    domElements.customToneInput.value = state.customTone || '';
    domElements.genderSelect.value = state.gender || defaultSettings.gender;
    domElements.ageSelect.value = state.age || defaultSettings.age;
    domElements.formatSelect.value = state.format || defaultSettings.format;
    domElements.sitemapUrlInput.value = state.sitemapUrl || defaultSettings.sitemapUrl;
    domElements.customSpecsInput.value = state.customSpecs || defaultSettings.customSpecs;
    domElements.generateImagesCheckbox.checked = state.generateImages || defaultSettings.generateImages;
    domElements.numImagesSelect.value = state.numImages || defaultSettings.numImages;
    domElements.imageSubjectInput.value = state.imageSubject || defaultSettings.imageSubject;
    domElements.imageStyleSelect.value = state.imageStyle || defaultSettings.imageStyle;
    domElements.imageStyleModifiersInput.value = state.imageStyleModifiers || defaultSettings.imageStyleModifiers;
    domElements.imageTextInput.value = state.imageText || defaultSettings.imageText;
    const storageValue = state.imageStorage || defaultSettings.imageStorage;
    const radioToCheck = document.querySelector(`input[name="imageStorage"][value="${storageValue}"]`);
    if(radioToCheck) radioToCheck.checked = true; else if(domElements.imageStorageRadios.length > 0) domElements.imageStorageRadios[0].checked = true;
    domElements.githubRepoUrlInput.value = state.githubRepoUrl || defaultSettings.githubRepoUrl;
    domElements.githubCustomPathInput.value = state.githubCustomPath || defaultSettings.githubCustomPath;
    domElements.linkTypeToggle.checked = !(state.linkTypeInternal ?? defaultSettings.linkTypeInternal);
    domElements.linkTypeText.textContent = (state.linkTypeInternal ?? defaultSettings.linkTypeInternal) ? 'Internal' : 'External';

    // --- Handle Complex UI Updates ---
    const savedPurposes = state.purpose || defaultSettings.purpose;
    let showPurposeUrl = false; let showPurposeCta = false;
    domElements.purposeCheckboxes.forEach(cb => { cb.checked = savedPurposes.includes(cb.value); if (cb.checked) { if (cb.value === 'Promote URL') showPurposeUrl = true; if (cb.value.startsWith('Promote') || cb.value === 'Generate Leads') showPurposeCta = true; } });
    domElements.purposeUrlInput.value = state.purposeUrl || defaultSettings.purposeUrl; domElements.purposeCtaInput.value = state.purposeCta || defaultSettings.purposeCta;
    showElement(domElements.purposeUrlInput, showPurposeUrl); showElement(domElements.purposeCtaInput, showPurposeCta);
    domElements.customToneInput.classList.toggle('hidden', state.tone !== 'custom');

    // Populate models *after* providers and languages/dialects are set
    // These will read the state internally now
    populateTextModels();
    populateImageModels();

    // Show/hide sections based on state
    showElement(domElements.imageOptionsContainer, state.generateImages);
    showElement(domElements.githubOptionsContainer, state.generateImages && storageValue === 'github');
    updateUIBasedOnMode(state.bulkMode);

    logToConsole("UI update from state finished.", "info");
}

// --- Planning Table Rendering ---
export function renderPlanningTable(plan) { /* ... (same as v8.1) ... */ if (!domElements.planningTableBody) return; domElements.planningTableBody.innerHTML = ''; if (!plan || plan.length === 0) { domElements.planningTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No plan generated yet.</td></tr>'; return; } plan.forEach((item, index) => { const row = domElements.planningTableBody.insertRow(); row.dataset.index = index; let cell = row.insertCell(); cell.textContent = item.keyword; cell = row.insertCell(); const titleInput = document.createElement('input'); titleInput.type = 'text'; titleInput.value = item.title || ''; titleInput.dataset.field = 'title'; titleInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(titleInput); cell = row.insertCell(); const slugInput = document.createElement('input'); slugInput.type = 'text'; slugInput.value = item.slug || ''; slugInput.dataset.field = 'slug'; slugInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(slugInput); cell = row.insertCell(); const intentInput = document.createElement('input'); intentInput.type = 'text'; intentInput.value = item.intent || ''; intentInput.dataset.field = 'intent'; intentInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full'); cell.appendChild(intentInput); cell = row.insertCell(); updatePlanItemStatusUI(row, item.status || 'Pending', item.error); }); }

// Update Status cell in Planning Table
export function updatePlanItemStatusUI(rowElementOrIndex, status, errorMsg = null) { /* ... (same as v8.1) ... */ let row; if (typeof rowElementOrIndex === 'number') { row = domElements.planningTableBody?.querySelector(`tr[data-index="${rowElementOrIndex}"]`); } else { row = rowElementOrIndex; } if (!row || row.cells.length < 5) return; const statusCell = row.cells[4]; statusCell.textContent = status; statusCell.className = 'px-3 py-2 whitespace-nowrap'; statusCell.title = ''; switch (status.toLowerCase().split('(')[0].trim()) { case 'pending': statusCell.classList.add('status-pending'); break; case 'generating': statusCell.classList.add('status-generating'); break; case 'uploading': statusCell.classList.add('status-uploading'); break; case 'completed': statusCell.classList.add('status-completed'); break; case 'failed': statusCell.classList.add('status-failed'); if (errorMsg) { statusCell.textContent = `Failed: ${errorMsg.substring(0, 30)}...`; statusCell.title = errorMsg; } else { statusCell.textContent = 'Failed'; } break; default: statusCell.classList.add('status-pending'); break; } }

// --- Progress Bar Updates ---
export function updateProgressBar(barElement, containerElement, textElement, current, total, textPrefix = '') { /* ... (same as v8.1) ... */ if (!barElement || !containerElement) return; const percent = total > 0 ? Math.round((current / total) * 100) : 0; barElement.style.width = `${percent}%`; showElement(containerElement, true); if (textElement) { textElement.textContent = `${textPrefix}${current} of ${total}...`; showElement(textElement, true); } }
export function hideProgressBar(barElement, containerElement, textElement) { /* ... (same as v8.1) ... */ if (barElement) barElement.style.width = '0%'; if (containerElement) showElement(containerElement, false); if (textElement) showElement(textElement, false); }

// Helper function specifically for GitHub options visibility
export function toggleGithubOptions() { /* ... (same as v8.1) ... */ const storageType = document.querySelector('input[name="imageStorage"]:checked')?.value; showElement(getElement('githubOptionsContainer'), storageType === 'github'); }

// Function to display sitemap URLs (called from main after fetch)
export function displaySitemapUrlsUI(urls = []) { /* ... (same as v8.1) ... */ const listDiv = getElement('sitemapUrlsListDiv'); if (!listDiv) { logToConsole("Sitemap list element not found for UI update.", "warn"); return; } if (urls.length === 0) { listDiv.innerHTML = `<em class="text-gray-400">No sitemap loaded or no URLs found.</em>`; return; } listDiv.innerHTML = ''; urls.forEach(url => { const div = document.createElement('div'); div.textContent = url; listDiv.appendChild(div); }); }


console.log("article-ui.js loaded");