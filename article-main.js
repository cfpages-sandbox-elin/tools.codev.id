// article-main.js (v8.7 Import + Final Mode Fix)
import { loadState, updateState, resetAllData, getCustomModelState, updateCustomModelState, getState, setBulkPlan, updateBulkPlanItem } from './article-state.js';
import { logToConsole, fetchAndParseSitemap, showLoading, disableElement, slugify } from './article-helpers.js';
import {
    cacheDomElements, getElement, populateAiProviders, populateTextModels,
    populateImageModels, updateUIFromState, updateUIBasedOnMode, toggleCustomModelUI,
    populateLanguagesUI, populateDialectsUI, toggleGithubOptions, checkApiStatus,
    displaySitemapUrlsUI
} from './article-ui.js';
// *** FIX: Import languageOptions from article-config ***
import { languageOptions } from './article-config.js';
import { handleGenerateStructure, handleGenerateArticle } from './article-single.js';
import { handleGeneratePlan, handleStartBulkGeneration, handleDownloadZip } from './article-bulk.js';
import { handleSpinSelectedText, handleSelection, highlightSpintax } from './article-spinner.js';

// Flag to prevent multiple initializations
let appInitialized = false;

function initializeApp() {
    if (appInitialized) { logToConsole("Initialization attempted again, skipping.", "warn"); return; }
    appInitialized = true;

    logToConsole("DOMContentLoaded event fired. Initializing application...", "info");

    // 1. Cache DOM Elements FIRST
    cacheDomElements();

    // --- CRITICAL CHECK ---
    const criticalElementsCheck = [ 'aiProviderSelect', 'languageSelect', 'apiStatusDiv', 'audienceInput', 'bulkModeCheckbox' ];
    let criticalMissing = false;
    criticalElementsCheck.forEach(jsKey => {
        if (!getElement(jsKey)) {
            logToConsole(`FATAL: Critical element with JS key '${jsKey}' missing after cache attempt. Cannot initialize UI.`, "error");
            criticalMissing = true;
        }
    });
    if (criticalMissing) { return; } // Halt execution
    // --- End Critical Check ---

    // 2. Load State
    logToConsole("Loading application state...", "info");
    const initialState = loadState();

    // 3. Update UI from State
    logToConsole("Applying loaded state to UI...", "info");
    updateUIFromState(initialState); // Calls updateUIBasedOnMode internally

    // 4. Setup Event Listeners
    logToConsole("Setting up event listeners...", "info");
    setupConfigurationListeners();
    setupStep1Listeners();
    setupStep2Listeners();
    setupStep3Listeners();
    setupStep4Listeners();
    setupBulkModeListeners();

    // *** FIX: Explicitly ensure correct UI mode AFTER everything else ***
    // Sometimes initial rendering might override earlier calls
    logToConsole("Final check/assertion of UI mode...", "info");
    updateUIBasedOnMode(getState().bulkMode);

    logToConsole("Application Initialized successfully.", "success");
}

// --- Listener setup functions ---
function setupConfigurationListeners() {
    const aiProviderSelect = getElement('aiProviderSelect');
    const aiModelSelect = getElement('aiModelSelect');
    const useCustomAiModelCheckbox = getElement('useCustomAiModelCheckbox');
    const customAiModelInput = getElement('customAiModelInput');
    const imageProviderSelect = getElement('imageProviderSelect');
    const imageModelSelect = getElement('imageModelSelect');
    const useCustomImageModelCheckbox = getElement('useCustomImageModelCheckbox');
    const customImageModelInput = getElement('customImageModelInput');
    const resetDataBtn = getElement('resetDataBtn');
    const forceReloadBtn = getElement('forceReloadBtn');

    forceReloadBtn?.addEventListener('click', () => { logToConsole("Attempting hard refresh...", "warn"); location.reload(true); });
    resetDataBtn?.addEventListener('click', resetAllData);

    aiProviderSelect?.addEventListener('change', (e) => {
        logToConsole(`Text Provider changed to: ${e.target.value}`, 'info');
        updateState({ textProvider: e.target.value, textModel: '', });
        // logToConsole(`State updated. New provider: ${getState().textProvider}`, 'debug');
        populateTextModels(true);
        checkApiStatus();
    });

    aiModelSelect?.addEventListener('change', (e) => {
        if (!getElement('useCustomAiModelCheckbox')?.checked) {
            const selectedModel = e.target.value;
            // logToConsole(`Standard Text Model selected: ${selectedModel}`, 'info');
            if (selectedModel) { updateState({ textModel: selectedModel }); checkApiStatus(); }
            else { /* logToConsole("Empty model selected...", "warn"); */ checkApiStatus(); }
        }
    });

    useCustomAiModelCheckbox?.addEventListener('change', () => {
        const isChecked = useCustomAiModelCheckbox.checked;
        // logToConsole(`Use Custom Text Model checkbox changed: ${isChecked}`, 'info');
        updateState({ useCustomTextModel: isChecked });
        toggleCustomModelUI('text');
        if (isChecked) { updateState({ customTextModel: getElement('customAiModelInput')?.value || '' }); }
        else { updateState({ textModel: getElement('aiModelSelect')?.value || '' }); }
        checkApiStatus();
    });

    customAiModelInput?.addEventListener('blur', (e) => {
        if (getElement('useCustomAiModelCheckbox')?.checked) {
            const provider = getState().textProvider;
            const customModelName = e.target.value.trim();
            // logToConsole(`Custom Text Model input changed (on blur) to: ${customModelName}`, 'info');
            updateCustomModelState('text', provider, customModelName);
            updateState({ customTextModel: customModelName });
            if (customModelName) { checkApiStatus(); }
            else { /* logToConsole("Custom model input cleared...", "warn"); */ checkApiStatus(); }
        }
    });

     imageProviderSelect?.addEventListener('change', (e) => {
         // logToConsole(`Image Provider changed to: ${e.target.value}`, 'info');
         const newProvider = e.target.value;
         const defaultAspectRatio = imageProviders[newProvider]?.aspectRatios?.[0] || '1:1'; // Need imageProviders for this
         updateState({ imageProvider: newProvider, imageModel: '', imageAspectRatio: defaultAspectRatio });
         populateImageModels(true);
     });

     imageModelSelect?.addEventListener('change', (e) => {
         if (!getElement('useCustomImageModelCheckbox')?.checked) {
             const selectedModel = e.target.value;
             // logToConsole(`Standard Image Model selected: ${selectedModel}`, 'info');
              if (selectedModel) { updateState({ imageModel: selectedModel }); }
         }
     });
    getElement('imageAspectRatioSelect')?.addEventListener('change', (e) => {
        updateState({ imageAspectRatio: e.target.value });
        // logToConsole(`Image Aspect Ratio changed to: ${e.target.value}`, 'info');
    });

     useCustomImageModelCheckbox?.addEventListener('change', () => {
         const isChecked = useCustomImageModelCheckbox.checked;
         // logToConsole(`Use Custom Image Model checkbox changed: ${isChecked}`, 'info');
         updateState({ useCustomImageModel: isChecked });
         toggleCustomModelUI('image');
         if (isChecked) { updateState({ customImageModel: getElement('customImageModelInput')?.value || '' }); }
         else { updateState({ imageModel: getElement('imageModelSelect')?.value || '' }); }
     });

     customImageModelInput?.addEventListener('blur', (e) => {
         if (getElement('useCustomImageModelCheckbox')?.checked) {
             const provider = getState().imageProvider;
             const customModelName = e.target.value.trim();
             // logToConsole(`Custom Image Model input changed (on blur) to: ${customModelName}`, 'info');
             updateCustomModelState('image', provider, customModelName);
             updateState({ customImageModel: customModelName });
         }
     });
}

function setupStep1Listeners() {
    const bulkModeCheckbox = getElement('bulkModeCheckbox');
    const languageSelect = getElement('languageSelect');
    const customLanguageInput = getElement('customLanguageInput');
    const dialectSelect = getElement('dialectSelect');
    const toneSelect = getElement('toneSelect');
    const customToneInput = getElement('customToneInput');
    const purposeCheckboxes = getElement('purposeCheckboxes');
    const purposeUrlInput = getElement('purposeUrlInput');
    const purposeCtaInput = getElement('purposeCtaInput');
    const generateImagesCheckbox = getElement('generateImagesCheckbox');
    const imageStorageRadios = getElement('imageStorageRadios');
    const fetchSitemapBtn = getElement('fetchSitemapBtn');
    const sitemapUrlInput = getElement('sitemapUrlInput');
    const generateSingleBtn = getElement('generateSingleBtn');
    const generatePlanBtn = getElement('generatePlanBtn');
    const sitemapLoadingIndicator = getElement('sitemapLoadingIndicator');

    bulkModeCheckbox?.addEventListener('change', (e) => {
        const isBulk = e.target.checked;
        // logToConsole(`Bulk Mode Checkbox changed: ${isBulk}`, 'info');
        updateState({ bulkMode: isBulk });
        updateUIBasedOnMode(isBulk);
    });

    languageSelect?.addEventListener('change', (e) => {
        const newLang = e.target.value;
        logToConsole(`Language Select changed to: ${newLang}`, 'info');
        // *** FIX: Use the imported languageOptions ***
        const newLangConfig = languageOptions[newLang];
        const defaultDialect = newLangConfig?.dialects?.[0] || '';
        updateState({ language: newLang, dialect: defaultDialect, customLanguage: '' });
        logToConsole(`State updated. New language: ${getState().language}, Default Dialect: ${getState().dialect}`, 'debug');
        populateDialectsUI(getState());
    });

    customLanguageInput?.addEventListener('blur', (e) => {
         if (getElement('languageSelect')?.value === 'custom') {
             // logToConsole(`Custom Language input changed (on blur): ${e.target.value}`, 'info');
            updateState({ customLanguage: e.target.value });
         }
    });

    dialectSelect?.addEventListener('change', (e) => {
         // logToConsole(`Dialect Select changed to: ${e.target.value}`, 'info');
        updateState({ dialect: e.target.value });
    });

    toneSelect?.addEventListener('change', (e) => {
        const newTone = e.target.value;
        // logToConsole(`Tone Select changed to: ${newTone}`, 'info');
        const showCustom = newTone === 'custom';
        updateState({ tone: newTone });
        if (!showCustom) { updateState({ customTone: '' }); if(customToneInput) customToneInput.value = ''; }
        showElement(customToneInput, showCustom);
        customToneInput?.classList.toggle('custom-input-visible', showCustom);
    });

    customToneInput?.addEventListener('blur', (e) => {
         if (getElement('toneSelect')?.value === 'custom') {
             // logToConsole(`Custom Tone input changed (on blur): ${e.target.value}`, 'info');
             updateState({ customTone: e.target.value });
         }
    });

     if (purposeCheckboxes) {
         purposeCheckboxes.forEach(checkbox => {
             checkbox.addEventListener('change', () => {
                 const selectedPurposes = Array.from(document.querySelectorAll('input[name="purpose"]:checked')).map(cb => cb.value);
                 // logToConsole(`Purpose checkboxes changed: ${selectedPurposes.join(', ')}`, 'info');
                 updateState({ purpose: selectedPurposes });
                 const showUrl = selectedPurposes.includes('Promote URL');
                 const showCta = selectedPurposes.some(p => p.startsWith('Promote') || p === 'Generate Leads');
                 showElement(purposeUrlInput, showUrl);
                 showElement(purposeCtaInput, showCta);
                 if (!showUrl) updateState({ purposeUrl: '' });
                 if (!showCta) updateState({ purposeCta: '' });
             });
         });
     } else { logToConsole("Could not attach listeners to purposeCheckboxes (not found).", "warn"); }
     getElement('purposeUrlInput')?.addEventListener('blur', (e) => updateState({ purposeUrl: e.target.value }));
     getElement('purposeCtaInput')?.addEventListener('blur', (e) => updateState({ purposeCta: e.target.value }));

    generateImagesCheckbox?.addEventListener('change', (e) => {
        const generate = e.target.checked;
        // logToConsole(`Generate Images checkbox changed: ${generate}`, 'info');
        updateState({ generateImages: generate });
        showElement(getElement('imageOptionsContainer'), generate);
        if (generate) { populateImageModels(); }
        toggleGithubOptions();
    });

     if (imageStorageRadios) {
         imageStorageRadios.forEach(radio => {
             radio.addEventListener('change', (e) => {
                 if (e.target.checked) {
                      const storageType = e.target.value;
                      // logToConsole(`Image Storage radio changed: ${storageType}`, 'info');
                     updateState({ imageStorage: storageType });
                     toggleGithubOptions();
                 }
             });
         });
     } else { logToConsole("Could not attach listeners to imageStorageRadios (not found).", "warn"); }

    fetchSitemapBtn?.addEventListener('click', async () => {
        const url = sitemapUrlInput?.value.trim();
        if (!url) { alert('Please enter a Sitemap URL.'); return; }
        // logToConsole(`Fetching sitemap from URL: ${url}`, 'info');
        showLoading(sitemapLoadingIndicator, true);
        disableElement(fetchSitemapBtn, true);
        try {
            const parsedUrls = await fetchAndParseSitemap(url);
            updateState({ sitemapUrls: parsedUrls });
            displaySitemapUrlsUI(parsedUrls);
            // logToConsole(`Successfully fetched and parsed ${parsedUrls.length} URLs.`, 'success');
        } catch (error) {
            logToConsole(`Sitemap fetch failed: ${error.message}`, 'error');
            alert(`Failed to fetch or parse sitemap: ${error.message}`);
            updateState({ sitemapUrls: [] });
            displaySitemapUrlsUI([]);
        } finally {
            showLoading(sitemapLoadingIndicator, false);
            disableElement(fetchSitemapBtn, false);
        }
    });

    const inputsToSave = [ { id: 'keywordInput', stateKey: 'keyword', event: 'blur' }, { id: 'audienceInput', stateKey: 'audience', event: 'blur' }, { id: 'readerNameInput', stateKey: 'readerName', event: 'blur' }, { id: 'genderSelect', stateKey: 'gender', event: 'change' }, { id: 'ageSelect', stateKey: 'age', event: 'change' }, { id: 'formatSelect', stateKey: 'format', event: 'change' }, { id: 'sitemapUrlInput', stateKey: 'sitemapUrl', event: 'blur' }, { id: 'customSpecsInput', stateKey: 'customSpecs', event: 'blur' }, { id: 'numImagesSelect', stateKey: 'numImages', event: 'change' }, { id: 'imageSubjectInput', stateKey: 'imageSubject', event: 'blur' }, { id: 'imageStyleSelect', stateKey: 'imageStyle', event: 'change' }, { id: 'imageStyleModifiersInput', stateKey: 'imageStyleModifiers', event: 'blur' }, { id: 'imageTextInput', stateKey: 'imageText', event: 'blur' }, { id: 'githubRepoUrlInput', stateKey: 'githubRepoUrl', event: 'blur' }, { id: 'githubCustomPathInput', stateKey: 'githubCustomPath', event: 'blur' } ];
    inputsToSave.forEach(item => {
        const element = getElement(item.id);
        element?.addEventListener(item.event, (e) => {
            let value = e.target.value;
            if (e.target.type === 'select-one' && item.stateKey === 'numImages') { value = parseInt(value, 10) || 1; }
            updateState({ [item.stateKey]: value });
        });
    });

    generateSingleBtn?.addEventListener('click', handleGenerateStructure);
    generatePlanBtn?.addEventListener('click', handleGeneratePlan);
}

function setupStep2Listeners() {
    const toggleStructureVisibilityBtn = getElement('toggleStructureVisibilityBtn');
    const structureContainer = getElement('structureContainer');
    const linkTypeToggle = getElement('linkTypeToggle');
    const linkTypeText = getElement('linkTypeText');
    const generateArticleBtn = getElement('generateArticleBtn');
    const articleTitleInput = getElement('articleTitleInput');

    toggleStructureVisibilityBtn?.addEventListener('click', () => {
        if (structureContainer) { const isHidden = structureContainer.classList.toggle('hidden'); toggleStructureVisibilityBtn.textContent = isHidden ? 'Show' : 'Hide'; }
    });
    linkTypeToggle?.addEventListener('change', (e) => {
        const isInternal = !e.target.checked; updateState({ linkTypeInternal: isInternal });
        if (linkTypeText) { linkTypeText.textContent = isInternal ? 'Internal' : 'External'; }
        // logToConsole(`Link type toggled. Internal: ${isInternal}`, 'info');
    });
    articleTitleInput?.addEventListener('blur', (e) => { updateState({ articleTitle: e.target.value }); /* logToConsole(`Article Title input updated...`, 'info'); */ });
    generateArticleBtn?.addEventListener('click', handleGenerateArticle);
}
function setupStep3Listeners() {
    const previewHtmlCheckbox = getElement('previewHtmlCheckbox');
    const generatedArticleTextarea = getElement('generatedArticleTextarea');
    const htmlPreviewDiv = getElement('htmlPreviewDiv');
    const enableSpinningBtn = getElement('enableSpinningBtn');
    const spunArticleDisplay = getElement('spunArticleDisplay');
    const step4Section = getElement('step4Section');

    previewHtmlCheckbox?.addEventListener('change', (e) => {
        const showPreview = e.target.checked;
        showElement(generatedArticleTextarea, !showPreview);
        showElement(htmlPreviewDiv, showPreview);
        if (showPreview && htmlPreviewDiv && generatedArticleTextarea) {
            let unsafeHTML = generatedArticleTextarea.value;
            let sanitizedHTML = unsafeHTML.replace(/<script.*?>.*?<\/script>/gis, '');
             sanitizedHTML = sanitizedHTML.replace(/onerror=".*?"/gi, '');
             sanitizedHTML = sanitizedHTML.replace(/onload=".*?"/gi, '');
            htmlPreviewDiv.innerHTML = sanitizedHTML;
            // logToConsole("Showing sanitized HTML preview.", "warn");
        }
    });
    enableSpinningBtn?.addEventListener('click', () => {
        if (spunArticleDisplay && generatedArticleTextarea && step4Section) {
            spunArticleDisplay.innerHTML = generatedArticleTextarea.value;
            showElement(step4Section, true);
            highlightSpintax(spunArticleDisplay);
            // logToConsole("Spinning enabled...", 'info');
            spunArticleDisplay.focus();
        } else { logToConsole("Could not enable spinning - required elements missing.", 'error'); }
    });
}
function setupStep4Listeners() {
    const spunArticleDisplay = getElement('spunArticleDisplay');
    const spinSelectedBtn = getElement('spinSelectedBtn');
    spunArticleDisplay?.addEventListener('input', () => highlightSpintax(spunArticleDisplay));
    spunArticleDisplay?.addEventListener('mouseup', handleSelection);
    spunArticleDisplay?.addEventListener('keyup', handleSelection);
    spunArticleDisplay?.addEventListener('focus', handleSelection);
    spinSelectedBtn?.addEventListener('click', handleSpinSelectedText);
}
function setupBulkModeListeners() {
    const startBulkGenerationBtn = getElement('startBulkGenerationBtn');
    const downloadBulkZipBtn = getElement('downloadBulkZipBtn');
    const planningTableBody = getElement('planningTableBody');

    startBulkGenerationBtn?.addEventListener('click', handleStartBulkGeneration);
    downloadBulkZipBtn?.addEventListener('click', handleDownloadZip);
    planningTableBody?.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.dataset.field) {
            const row = e.target.closest('tr');
            const rowIndex = row?.dataset.index;
            const field = e.target.dataset.field;
            const value = e.target.value;
            if (rowIndex !== undefined && field) {
                const index = parseInt(rowIndex, 10);
                updateBulkPlanItem(index, { [field]: value });
                 if (field === 'slug') {
                     const newFilename = `${slugify(value || `item-${index}`)}.md`;
                     updateBulkPlanItem(index, { filename: newFilename });
                 }
            }
        }
    });
}

// --- Initialize ---
logToConsole("article-main.js evaluating. Setting up DOMContentLoaded listener.", "debug");
document.addEventListener('DOMContentLoaded', initializeApp, { once: true });

console.log("article-main.js loaded (v8.7 Import + Final Mode Fix)");