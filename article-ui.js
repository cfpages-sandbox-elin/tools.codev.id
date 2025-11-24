// article-ui.js (v9.08 - add remove)
import { languageOptions, defaultSettings } from './article-config.js';
import { getState, updateState, getBulkPlan, addProviderToState, removeProviderFromState, updateProviderInState, updateCustomModelState, getCustomModelState } from './article-state.js';
import { logToConsole, showElement, findCheapestModel, callAI, disableElement, getArticleOutlinesV2, delay } from './article-helpers.js';

let ALL_PROVIDERS_CONFIG = { text: {}, image: {} };
let domElements = {}; 

// Map JS variable names to actual HTML IDs
const elementIdMap = {
    aiConfigSection: 'aiConfigSection',
    apiStatusDiv: 'apiStatus',
    apiStatusIndicator: 'apiStatusIndicator',
    aiProviderContainer: 'aiProviderContainer',
    addProviderBtn: 'addProviderBtn',
    step1Section: 'step1',
    keywordInput: 'keyword',
    bulkModeCheckbox: 'bulkModeCheckbox',
    bulkKeywordsContainer: 'bulkKeywordsContainer',
    bulkKeywords: 'bulkKeywords',
    generateIdeasBtn: 'generateIdeasBtn',
    ideasLoadingIndicator: 'ideasLoadingIndicator',
    ideasProgressContainer: 'ideasProgressContainer',
    ideasProgressBar: 'ideasProgressBar',
    ideasProgressText: 'ideasProgressText',
    languageSelect: 'language',
    customLanguageInput: 'custom_language',
    dialectSelect: 'dialect',
    audienceInput: 'audience',
    readerNameInput: 'readerName',
    humanizeContentCheckbox: 'humanizeContent',
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
    batchSizeContainer: 'batchSizeContainer',
    batchSizeInput: 'batchSizeInput',
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
    
    // Step 3
    step3Section: 'step3',
    articleOutputContainer: 'article_output_container',
    generatedArticleTextarea: 'generated_article',
    htmlPreviewDiv: 'html_preview',
    previewHtmlCheckbox: 'preview_html_checkbox',
    prepareSpinnerBtn: 'prepareSpinnerBtn',

    // Step 4
    step4Section: 'step4',
    addVariationColumnBtn: 'addVariationColumnBtn',
    removeVariationColumnBtn: 'removeVariationColumnBtn',
    bulkGenerateBtn: 'bulkGenerateBtn',
    spinnerContainer: 'spinnerContainer',
    compileSpintaxBtn: 'compileSpintaxBtn',
    scrollToStep5Btn: 'scrollToStep5Btn',
    bulkSpinnerProgressContainer: 'bulkSpinnerProgressContainer',
    bulkSpinnerProgressBar: 'bulkSpinnerProgressBar',

    // Step 5
    step5Section: 'step5',
    finalSpintaxOutput: 'finalSpintaxOutput', // NEW
    copySpintaxBtn: 'copySpintaxBtn', // NEW

    consoleLogContainer: 'consoleLogContainer',
    consoleLog: 'consoleLog',
    structureCountDisplay: 'structureCountDisplay',
    wordCountDisplay: 'wordCountDisplay',
    charCountDisplay: 'charCountDisplay'
};

const querySelectorAllKeys = {
    purposeCheckboxes: 'input[name="purpose"]',
    imageStorageRadios: 'input[name="imageStorage"]'
};

const querySelectorKeys = {
    planningTableBody: '#planningTable tbody'
};

export async function initializeProviderUI() {
    logToConsole("Fetching all provider configurations from backend...", "info");
    try {
        const result = await callAI('get_all_providers', {}, null, null);
        if (result.success) {
            ALL_PROVIDERS_CONFIG.text = result.textProviders;
            ALL_PROVIDERS_CONFIG.image = result.imageProviders;
            logToConsole("Successfully loaded all provider configurations.", "success");
            renderAiProviderRows();
            populateImageModels(); 
        } else {
            throw new Error(result.error || "Failed to fetch configurations.");
        }
    } catch (error) {
        logToConsole(`Critical Error: Could not load provider configs. ${error.message}`, "error");
        const container = getElement('aiProviderContainer');
        if(container) container.innerHTML = `<p class="text-red-500">Could not load AI provider configurations from the server. Please refresh.</p>`;
    }
}

export function cacheDomElements() {
    logToConsole("Attempting to cache DOM elements...", "info");
    domElements = {}; 

    for (const key in elementIdMap) {
        const htmlId = elementIdMap[key];
        const element = document.getElementById(htmlId);
        if (element) {
            domElements[key] = element;
        } else {
            // Only log error if it's not a step that might be hidden/generated
            if(!['step4Section', 'step5Section', 'spinnerContainer'].includes(key)) {
                 logToConsole(`Failed to cache element with ID: '${htmlId}' (JS Key: ${key})`, 'warn');
            }
            domElements[key] = null;
        }
    }

    for (const key in querySelectorAllKeys) {
        const selector = querySelectorAllKeys[key];
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) { domElements[key] = elements; }
        else { domElements[key] = null; }
    }

    for (const key in querySelectorKeys) {
        const selector = querySelectorKeys[key];
        const element = document.querySelector(selector);
        if (element) { domElements[key] = element; }
        else { domElements[key] = null; }
    }
    logToConsole("DOM elements caching complete.", "info");
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
        return null;
    }
    return element;
}

function populateSelect(selectElement, options, selectedValue = null, addEmptyOption = false, emptyText = "-- Select --") {
    if (!selectElement) { return 0; }
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

export function renderAiProviderRows() {
    const container = getElement('aiProviderContainer');
    if (!container) return;
    if (Object.keys(ALL_PROVIDERS_CONFIG.text).length === 0) return;

    const state = getState();
    container.innerHTML = '';

    if (!state.textProviders || state.textProviders.length === 0) {
        addProviderToState();
        return;
    }

    state.textProviders.forEach((providerState, index) => {
        const row = createAiProviderRow(providerState, index);
        container.appendChild(row);
    });

    getElement('addProviderBtn')?.addEventListener('click', () => {
         addProviderToState();
         renderAiProviderRows();
    });
}

function createAiProviderRow(providerState, index) {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-1 md:grid-cols-4 gap-x-4 p-3 border rounded-md bg-gray-50/50 shadow-sm';
    row.dataset.index = index;

    const selectionDiv = document.createElement('div');
    selectionDiv.className = 'flex flex-col space-y-2';

    const providerSelect = document.createElement('select');
    providerSelect.className = 'compact-select text-sm';
    populateSelect(providerSelect, Object.keys(ALL_PROVIDERS_CONFIG.text), providerState.provider);
    providerSelect.addEventListener('change', (e) => {
        const newProvider = e.target.value;
        updateProviderInState(index, 'provider', newProvider);
        updateProviderInState(index, 'model', '');
        renderAiProviderRows();
        checkApiStatus();
    });

    const modelSelect = document.createElement('select');
    modelSelect.className = 'compact-select text-sm';
    const availableModels = ALL_PROVIDERS_CONFIG.text[providerState.provider]?.models.map(m => m.id) || [];
    
    if (providerState.model && !availableModels.includes(providerState.model)) {
        logToConsole(`Saved model "${providerState.model}" not found for provider "${providerState.provider}". Resetting model selection.`, 'warn');
        providerState.model = ''; 
        updateProviderInState(index, 'model', ''); 
    }

    populateSelect(modelSelect, availableModels, providerState.model, !providerState.model, "-- Select a Model --");
    modelSelect.addEventListener('change', (e) => {
        updateProviderInState(index, 'model', e.target.value);
        renderAiProviderRows();
        checkApiStatus();
    });

    selectionDiv.innerHTML = `<label class="compact-label font-semibold text-gray-700">Provider #${index + 1}</label>`;
    selectionDiv.appendChild(providerSelect);
    selectionDiv.appendChild(modelSelect);

    const specsDiv = document.createElement('div');
    specsDiv.className = 'md:col-span-2 text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1 items-center mt-2 md:mt-0';
    const modelConfig = ALL_PROVIDERS_CONFIG.text[providerState.provider]?.models.find(m => m.id === providerState.model);

    if (modelConfig) {
         specsDiv.innerHTML = `
            <div class="font-medium text-gray-800 col-span-2 border-b pb-1 mb-1">${modelConfig.name || modelConfig.id}</div>
            <div><strong>Context:</strong> ${(modelConfig.contextWindow / 1000).toLocaleString()}k</div>
            <div><strong>Developer:</strong> ${modelConfig.developer || 'N/A'}</div>
            <div><strong>Params:</strong> ${modelConfig.parameters || 'N/A'}</div>
            <div class="col-span-2 pt-1">
                <span class="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">${modelConfig.features.multilingual ? 'Multilingual' : 'English'}</span>
                <span class="inline-block bg-green-100 text-green-800 rounded-full px-2 py-0.5">${modelConfig.features.jsonMode ? 'JSON' : ''}</span>
                <span class="inline-block bg-purple-100 text-purple-800 rounded-full px-2 py-0.5">${modelConfig.modality.includes('vision') ? 'Vision' : 'Text'}</span>
            </div>
         `;
    } else {
        specsDiv.innerHTML = `<p class="text-gray-400 col-span-2">Select a model to see details.</p>`;
    }

    const actionDiv = document.createElement('div');
    actionDiv.className = 'flex items-center justify-end mt-2 md:mt-0';
    const removeBtn = document.createElement('button');
    removeBtn.className = 'reset-button text-xs !py-1 !px-2';
    removeBtn.innerHTML = `× Remove`;
    if (getState().textProviders.length <= 1) {
        disableElement(removeBtn, true);
    }
    removeBtn.addEventListener('click', () => {
        removeProviderFromState(index);
        renderAiProviderRows();
        checkApiStatus();
    });
    actionDiv.appendChild(removeBtn);

    row.appendChild(selectionDiv);
    row.appendChild(specsDiv);
    row.appendChild(actionDiv);

    return row;
}

export async function checkApiStatus() {
    const state = getState();
    const firstProviderState = state.textProviders[0];
    const statusDiv = getElement('apiStatusDiv');
    const statusIndicator = getElement('apiStatusIndicator');

    if (!statusDiv) return;

    showElement(statusIndicator, true);

    if (!firstProviderState) {
        logToConsole("No providers configured for API status check.", "warn");
        statusDiv.innerHTML = `<span class="status-error">Add a Provider</span>`;
        showElement(statusIndicator, false);
        return;
    }

    const providerKey = firstProviderState.provider;
    const model = firstProviderState.useCustom ? firstProviderState.customModel : firstProviderState.model;

    if (!providerKey) {
        statusDiv.innerHTML = `<span class="status-error">Select a Provider</span>`;
        logToConsole("API Status Check skipped: Provider key is missing.", "warn");
        showElement(statusIndicator, false);
        return;
    }

    if (!model) {
        statusDiv.innerHTML = `<span class="status-error">Select a Model</span>`;
        logToConsole("API Status Check skipped: Model missing.", "warn");
        showElement(statusIndicator, false);
        return;
    }

    logToConsole(`Checking API Status for Provider: ${providerKey}, Model: ${model}`, "info");
    statusDiv.innerHTML = `<span class="status-checking">Checking ${providerKey}...</span>`;

    await delay(10);

    try {
        const result = await callAI('check_status', { providerKey, model }, null, null);
        if (!result?.success) {
             const error = new Error(result?.error || `Status check failed`);
             error.status = result?.status || 500;
             throw error;
        }
        statusDiv.innerHTML = `<span class="status-ok">✅ Ready (${providerKey})</span>`;
        logToConsole(`API Status OK for ${providerKey}`, 'success');
    } catch (error) {
        let displayMessage = '';
        let technicalDetails = error.message;

        if (error.status === 400) {
            displayMessage = `❌ Model Parameter Error. The tool may need an update for this specific model.`;
        } else if (error.status === 401) {
            displayMessage = `❌ Invalid API Key.`;
        } else if (error.status === 403) {
            displayMessage = `❌ Permission Denied (Region Blocked).`;
        } else if (error.status === 429) {
            displayMessage = `❌ Quota Exceeded. Please check your billing.`;
        } else {
            displayMessage = `❌ Connection Error. The tool's server might be temporarily down.`;
        }

        logToConsole(`API Status Error: ${technicalDetails}`, 'warn');
        if(statusDiv) {
            statusDiv.innerHTML = `<span class="status-error" title="Full Details: ${technicalDetails}">${displayMessage}</span>`;
        }
    } finally {
        showElement(statusIndicator, false);
    }
}

export function populateImageModels(setDefault = false) {
    const state = getState();
    const providerKey = state.imageProvider;
    const imageModelSelect = getElement('imageModelSelect');
    const imageAspectRatioSelect = getElement('imageAspectRatioSelect');
    const useCustomCheckbox = getElement('useCustomImageModelCheckbox');
    const customInput = getElement('customImageModelInput');

    if (!imageModelSelect || !imageAspectRatioSelect || !useCustomCheckbox || !customInput) { return; }

    if (!providerKey || !ALL_PROVIDERS_CONFIG.image[providerKey]) {
        imageModelSelect.innerHTML = '<option value="">-- Select Provider --</option>';
        imageAspectRatioSelect.innerHTML = '<option value="">-- N/A --</option>';
        disableElement(imageModelSelect, true);
        disableElement(imageAspectRatioSelect, true);
        if(useCustomCheckbox) useCustomCheckbox.checked = false;
        if(customInput) customInput.value = '';
        toggleCustomModelUI('image');
        return;
    }

    const providerConfig = ALL_PROVIDERS_CONFIG.image[providerKey];
    const models = providerConfig?.models || [];
    const aspectRatios = providerConfig?.aspectRatios || ["1:1"];
    const standardModelFromState = state.imageModel;
    const aspectRatioFromState = state.imageAspectRatio;

    populateSelect(imageModelSelect, models);
    const validAspectRatio = aspectRatios.includes(aspectRatioFromState) ? aspectRatioFromState : aspectRatios[0];
    populateSelect(imageAspectRatioSelect, aspectRatios, validAspectRatio);
    disableElement(imageAspectRatioSelect, false);

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
    } else if (!state.useCustomImageModel && imageModelSelect.options.length > 0) {
        imageModelSelect.selectedIndex = 0;
    }

    if (useCustomCheckbox) useCustomCheckbox.checked = state.useCustomImageModel || false;
    if (customInput) customInput.value = getCustomModelState('image', providerKey);
    toggleCustomModelUI('image');
}

export function toggleCustomModelUI(type) {
    const useCustomCheckbox = type === 'text' ? getElement('useCustomAiModelCheckbox') : getElement('useCustomImageModelCheckbox');
    const modelSelect = type === 'text' ? getElement('aiModelSelect') : getElement('imageModelSelect');
    const customInput = type === 'text' ? getElement('customAiModelInput') : getElement('customImageModelInput');
    if (!useCustomCheckbox || !modelSelect || !customInput) { return; }

    const isChecked = useCustomCheckbox.checked;
    disableElement(modelSelect, isChecked);
    showElement(customInput, isChecked);
    customInput.classList.toggle('custom-input-visible', isChecked);

    if (!isChecked) {
        const providerKey = getState()[type === 'text' ? 'textProvider' : 'imageProvider'];
        const providerConfig = type === 'text' ? ALL_PROVIDERS_CONFIG.text[providerKey] : ALL_PROVIDERS_CONFIG.image[providerKey];
        const hasModels = providerConfig?.models?.length > 0;
        disableElement(modelSelect, !hasModels);
    }
}

export function populateLanguagesUI(state) {
    const languageSelect = getElement('languageSelect');
    if (!languageSelect) {
        logToConsole("Language select ('languageSelect') element not found.", "error");
        populateDialectsUI(state); return;
    }
    const options = Object.keys(languageOptions).map(k => ({ value: k, text: languageOptions[k].name }));
    populateSelect(languageSelect, options, state.language);
    populateDialectsUI(state);
}

export function populateDialectsUI(state) {
    const selectedLangKey = state.language;
    const dialectSelect = getElement('dialectSelect');
    const customLanguageInput = getElement('customLanguageInput');

    if (!dialectSelect) {
         if(customLanguageInput) showElement(customLanguageInput, false);
         return;
    }
    dialectSelect.innerHTML = '';
    disableElement(dialectSelect, true);
    const showCustom = selectedLangKey === 'custom';
     if(customLanguageInput) {
        showElement(customLanguageInput, showCustom);
        customLanguageInput.classList.toggle('custom-input-visible', showCustom);
        if (showCustom) { customLanguageInput.value = state.customLanguage || ''; }
     }

    if (!selectedLangKey) { dialectSelect.innerHTML = '<option value="">-- Select Language --</option>'; return; }
    else if (selectedLangKey === 'custom') { dialectSelect.innerHTML = '<option value="">-- N/A --</option>'; return; }

    const langConfig = languageOptions[selectedLangKey];
    const dialects = langConfig?.dialects || [];
    const dialectFromState = state.dialect;
    const dialectToSelect = dialects.includes(dialectFromState) ? dialectFromState : (dialects.length > 0 ? dialects[0] : '');

    if (dialects.length > 0) {
        populateSelect(dialectSelect, dialects, dialectToSelect, false);
        disableElement(dialectSelect, false);
    } else {
        dialectSelect.innerHTML = '<option value="">-- N/A --</option>';
        disableElement(dialectSelect, true);
    }
}

export function updateUIBasedOnMode(isBulkMode) {
    const appState = getState();
    const singleKeywordGroup = getElement('keywordInput')?.closest('.input-group');
    const generateSingleBtn = getElement('generateSingleBtn');
    const step2Section = getElement('step2Section');
    const step3Section = getElement('step3Section');
    const step4Section = getElement('step4Section');
    const formatSelect = getElement('formatSelect');
    const bulkKeywordsContainer = getElement('bulkKeywordsContainer');
    const generatePlanBtn = getElement('generatePlanBtn');
    const batchSizeContainer = getElement('batchSizeContainer');
    const step1_5Section = getElement('step1_5Section');

    showElement(singleKeywordGroup, !isBulkMode);
    showElement(generateSingleBtn, !isBulkMode);

    showElement(bulkKeywordsContainer, isBulkMode);
    showElement(generatePlanBtn, isBulkMode);
    showElement(batchSizeContainer, isBulkMode);

    if (isBulkMode) {
        showElement(step2Section, false);
        showElement(step3Section, false);
        showElement(step4Section, false);

        const currentPlan = getBulkPlan();
        const planningTableBody = getElement('planningTableBody');
        const planExists = currentPlan && currentPlan.length > 0 &&
                           planningTableBody && planningTableBody.children.length > 0 &&
                           planningTableBody.children[0].textContent !== "No plan generated or loaded.";
        showElement(step1_5Section, planExists);

        if(formatSelect) {
            disableElement(formatSelect, true);
        }

    } else {
        showElement(step1_5Section, false);

        const articleStructureTextarea = getElement('articleStructureTextarea');
        if (articleStructureTextarea) articleStructureTextarea.value = appState.articleStructure || '';

        const generatedArticleTextarea = getElement('generatedArticleTextarea');
        if (generatedArticleTextarea) generatedArticleTextarea.value = appState.generatedArticleContent || '';

        showElement(step2Section, (appState.articleStructure || '').trim() !== '');
        showElement(step3Section, (appState.generatedArticleContent || '').trim() !== '');
        
        const hasSpinnerData = appState.spinnerData && Array.isArray(appState.spinnerData) && appState.spinnerData.length > 0;
        showElement(step4Section, hasSpinnerData); 

        if(formatSelect) {
            disableElement(formatSelect, false);
            formatSelect.value = appState.format;
        }
    }
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
    if (!state) return;
    if (Object.keys(domElements).length === 0 && Object.keys(elementIdMap).length > 0) {
        cacheDomElements();
    }
    renderAiProviderRows();

    const keywordInput = getElement('keywordInput'); 
    if (keywordInput) keywordInput.value = state.keyword ?? defaultSettings.keyword;

    const bulkModeCheckbox = getElement('bulkModeCheckbox'); 
    if (bulkModeCheckbox) bulkModeCheckbox.checked = state.bulkMode ?? defaultSettings.bulkMode;
    
    const bulkKeywordsTextarea = getElement('bulkKeywords');
    if (bulkKeywordsTextarea) {
        bulkKeywordsTextarea.value = state.bulkKeywordsContent ?? defaultSettings.bulkKeywordsContent;
    }

    const audienceInputElement = getElement('audienceInput'); 
    if(audienceInputElement) audienceInputElement.value = state.audience ?? defaultSettings.audience;

    const readerNameInputElement = getElement('readerNameInput'); 
    if(readerNameInputElement) readerNameInputElement.value = state.readerName ?? defaultSettings.readerName;

    const humanizeContentCheckbox = getElement('humanizeContentCheckbox'); 
    if(humanizeContentCheckbox) humanizeContentCheckbox.checked = state.humanizeContent ?? defaultSettings.humanizeContent;

    const toneSelectElement = getElement('toneSelect'); 
    if(toneSelectElement) toneSelectElement.value = state.tone ?? defaultSettings.tone;

    const customToneInputElement = getElement('customToneInput'); 
    if(customToneInputElement) customToneInputElement.value = state.customTone ?? defaultSettings.customTone;

    const genderSelectElement = getElement('genderSelect'); 
    if(genderSelectElement) genderSelectElement.value = state.gender ?? defaultSettings.gender;

    const ageSelectElement = getElement('ageSelect'); 
    if(ageSelectElement) ageSelectElement.value = state.age ?? defaultSettings.age;

    const formatSelectElement = getElement('formatSelect'); 
    if(formatSelectElement) formatSelectElement.value = state.format ?? defaultSettings.format;

    const sitemapUrlInputElement = getElement('sitemapUrlInput'); 
    if(sitemapUrlInputElement) sitemapUrlInputElement.value = state.sitemapUrl ?? defaultSettings.sitemapUrl;

    const customSpecsInputElement = getElement('customSpecsInput'); 
    if(customSpecsInputElement) customSpecsInputElement.value = state.customSpecs ?? defaultSettings.customSpecs;

    populateLanguagesUI(state);

    const savedPurposes = state.purpose ?? defaultSettings.purpose;
    let showPurposeUrl = false; let showPurposeCta = false;
    const purposeCheckboxes = getElement('purposeCheckboxes');
    if(purposeCheckboxes) { purposeCheckboxes.forEach(cb => { cb.checked = savedPurposes.includes(cb.value); if (cb.checked) { if (cb.value === 'Promote URL') showPurposeUrl = true; if (cb.value.startsWith('Promote') || cb.value === 'Generate Leads') showPurposeCta = true; } }); }
    
    const purposeUrlInputElement = getElement('purposeUrlInput'); 
    if(purposeUrlInputElement) purposeUrlInputElement.value = state.purposeUrl ?? defaultSettings.purposeUrl;

    const purposeCtaInputElement = getElement('purposeCtaInput'); 
    if(purposeCtaInputElement) purposeCtaInputElement.value = state.purposeCta ?? defaultSettings.purposeCta;
    
    showElement(getElement('purposeUrlInput'), showPurposeUrl);
    showElement(getElement('purposeCtaInput'), showPurposeCta);
    if(getElement('customToneInput')) showElement(getElement('customToneInput'), state.tone === 'custom');

    const generateImagesCheckboxElement = getElement('generateImagesCheckbox'); 
    if (generateImagesCheckboxElement) generateImagesCheckboxElement.checked = state.generateImages ?? defaultSettings.generateImages;

    const numImagesSelectElement = getElement('numImagesSelect'); 
    if(numImagesSelectElement) numImagesSelectElement.value = state.numImages ?? defaultSettings.numImages;

    const imageSubjectInputElement = getElement('imageSubjectInput'); 
    if(imageSubjectInputElement) imageSubjectInputElement.value = state.imageSubject ?? defaultSettings.imageSubject;

    const imageStyleSelectElement = getElement('imageStyleSelect'); 
    if(imageStyleSelectElement) imageStyleSelectElement.value = state.imageStyle ?? defaultSettings.imageStyle;

    const imageStyleModifiersInputElement = getElement('imageStyleModifiersInput'); 
    if(imageStyleModifiersInputElement) imageStyleModifiersInputElement.value = state.imageStyleModifiers ?? defaultSettings.imageStyleModifiers;

    const imageTextInputElement = getElement('imageTextInput'); 
    if(imageTextInputElement) imageTextInputElement.value = state.imageText ?? defaultSettings.imageText;

    const storageValue = state.imageStorage ?? defaultSettings.imageStorage;
    const imageStorageRadios = getElement('imageStorageRadios');
    let radioFound = false;
    if (imageStorageRadios) { imageStorageRadios.forEach(radio => { if (radio.value === storageValue) { radio.checked = true; radioFound = true; } }); if (!radioFound && imageStorageRadios.length > 0) { imageStorageRadios[0].checked = true; } }
    
    const githubRepoUrlInputElement = getElement('githubRepoUrlInput'); 
    if(githubRepoUrlInputElement) githubRepoUrlInputElement.value = state.githubRepoUrl ?? defaultSettings.githubRepoUrl;

    const githubCustomPathInputElement = getElement('githubCustomPathInput'); 
    if(githubCustomPathInputElement) githubCustomPathInputElement.value = state.githubCustomPath ?? defaultSettings.githubCustomPath;

    populateImageModels(); 

    const articleTitleInputElement = getElement('articleTitleInput'); 
    if (articleTitleInputElement) articleTitleInputElement.value = state.articleTitle ?? '';

    const linkTypeToggleElement = getElement('linkTypeToggle'); 
    if(linkTypeToggleElement) linkTypeToggleElement.checked = !(state.linkTypeInternal ?? defaultSettings.linkTypeInternal);
    
    const linkTypeTextElement = getElement('linkTypeText'); 
    if(linkTypeTextElement) linkTypeTextElement.textContent = (state.linkTypeInternal ?? defaultSettings.linkTypeInternal) ? 'Internal' : 'External';

    const articleStructureTextarea = getElement('articleStructureTextarea');
    let initialStructure = '';
    if (articleStructureTextarea) {
        if (!state.bulkMode) {
            initialStructure = state.articleStructure ?? '';
            articleStructureTextarea.value = initialStructure;
        } else {
             articleStructureTextarea.value = '';
        }
    }
    updateStructureCountDisplay(initialStructure);

    const generatedArticleTextarea = getElement('generatedArticleTextarea');
    let initialArticleContent = '';
    if (generatedArticleTextarea) {
        if (!state.bulkMode) {
             initialArticleContent = state.generatedArticleContent ?? '';
             generatedArticleTextarea.value = initialArticleContent;
        } else {
             generatedArticleTextarea.value = '';
        }
    }
    updateCounts(initialArticleContent);

    updateUIBasedOnMode(state.bulkMode);

    if (state.bulkMode) {
        const currentBulkPlanItems = getBulkPlan();
        if (currentBulkPlanItems.length > 0) {
            renderPlanningTable(currentBulkPlanItems);
            showElement(getElement('step1_5Section'), true);
        } else {
            const tableBody = getElement('planningTableBody');
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 py-4">No plan generated or loaded.</td></tr>';
             if(getElement('step1_5Section')) showElement(getElement('step1_5Section'), false);
        }
    }
    checkApiStatus();
    logToConsole("UI update from state finished.", "info");
}

export function renderPlanningTable(plan) {
    const tableBody = getElement('planningTableBody');
    const downloadBtn = getElement('downloadBulkZipBtn');
    if (!tableBody) return;

    if(downloadBtn) showElement(downloadBtn, false);

    tableBody.innerHTML = '';
    if (!plan || plan.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 py-4">No plan generated or loaded.</td></tr>';
        return;
    }

    const hasCompletedArticles = plan.some(item => item.status?.startsWith('Completed'));
    if (hasCompletedArticles && downloadBtn) {
        showElement(downloadBtn, true);
    }

    plan.forEach((item, index) => {
        const row = tableBody.insertRow();
        row.dataset.index = index;
        let cell;

        cell = row.insertCell();
        cell.textContent = index + 1;
        cell.classList.add('px-3', 'py-2', 'text-xs', 'text-center', 'text-gray-500');

        cell = row.insertCell();
        cell.textContent = item.keyword || 'N/A';
        cell.classList.add('px-3', 'py-2', 'whitespace-nowrap', 'text-xs');

        cell = row.insertCell();
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = item.title || '';
        titleInput.dataset.field = 'title';
        titleInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full');
        cell.appendChild(titleInput);
        cell.classList.add('px-3', 'py-2');

        cell = row.insertCell();
        const slugInput = document.createElement('input');
        slugInput.type = 'text';
        slugInput.value = item.slug || '';
        slugInput.dataset.field = 'slug';
        slugInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full');
        cell.appendChild(slugInput);
        cell.classList.add('px-3', 'py-2');

        cell = row.insertCell();
        const intentInput = document.createElement('input');
        intentInput.type = 'text';
        intentInput.value = item.intent || '';
        intentInput.dataset.field = 'intent';
        intentInput.classList.add('compact-input', 'p-1', 'text-xs', 'w-full');
        cell.appendChild(intentInput);
        cell.classList.add('px-3', 'py-2');

        cell = row.insertCell();
        cell.classList.add('px-3', 'py-2', 'whitespace-nowrap', 'text-xs');
        updatePlanItemStatusUI(row, item.status || 'Pending', item.error);
    });
}

export function updatePlanItemStatusUI(rowElementOrIndex, status, errorMsg = null) {
    let row;
    const tableBody = getElement('planningTableBody');
    if (!tableBody) return;
    if (typeof rowElementOrIndex === 'number') { row = tableBody.querySelector(`tr[data-index="${rowElementOrIndex}"]`); }
    else { row = rowElementOrIndex; }
    if (!row || row.cells.length < 6) { return; }
    const statusCell = row.cells[5]; if (!statusCell) return;
    statusCell.className = 'px-3 py-2 whitespace-nowrap text-xs'; statusCell.title = '';
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
    const imageStorageRadios = getElement('imageStorageRadios');
    let storageType = 'base64'; 
    if (imageStorageRadios) {
        const checkedRadio = Array.from(imageStorageRadios).find(r => r.checked);
        if (checkedRadio) storageType = checkedRadio.value;
    }

    const githubOptionsContainer = getElement('githubOptionsContainer');
    const generateImagesCheckbox = getElement('generateImagesCheckbox');
    const generateImages = generateImagesCheckbox ? generateImagesCheckbox.checked : false;

    if (githubOptionsContainer) showElement(githubOptionsContainer, generateImages && storageType === 'github');
}

export function displaySitemapUrlsUI(urls = []) {
    const listDiv = getElement('sitemapUrlsListDiv');
    if (!listDiv) return;
    if (!urls || urls.length === 0) { listDiv.innerHTML = `<em class="text-gray-400">No sitemap loaded or no URLs found.</em>`; return; }
    listDiv.innerHTML = '';
    urls.forEach(url => { const div = document.createElement('div'); div.textContent = url; div.title = url; listDiv.appendChild(div); });
    logToConsole(`Displayed ${urls.length} sitemap URLs.`, 'info');
}

export function getProviderConfig(type) {
    return ALL_PROVIDERS_CONFIG[type];
}