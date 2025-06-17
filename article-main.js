// article-main.js (v8.18 Humanize content)

import { loadState, updateState, resetAllData, getCustomModelState, updateCustomModelState, getState, setBulkPlan, updateBulkPlanItem } from './article-state.js';
import { logToConsole, fetchAndParseSitemap, showLoading, disableElement, slugify, showElement } from './article-helpers.js';
import {
    cacheDomElements, getElement, populateAiProviders, populateTextModels,
    populateImageModels, updateUIFromState, updateUIBasedOnMode, toggleCustomModelUI,
    populateLanguagesUI, populateDialectsUI, toggleGithubOptions, checkApiStatus,
    displaySitemapUrlsUI, updateCounts, updateStructureCountDisplay
} from './article-ui.js';
import { languageOptions, imageProviders, defaultSettings } from './article-config.js'; // Import defaultSettings
import { handleGenerateStructure, handleGenerateArticle } from './article-single.js';
import { handleGeneratePlan, handleStartBulkGeneration, handleDownloadZip } from './article-bulk.js';
import { handleGenerateIdeas } from './article-ideas.js'; 
import { handleSpinSelectedText, handleSelection, highlightSpintax, handleSpinArticle, pauseSpinning, stopSpinningProcess } from './article-spinner.js';

// Flag to prevent multiple initializations
let appInitialized = false;

function initializeApp() {
    if (appInitialized) { logToConsole("Initialization attempted again, skipping.", "warn"); return; }
    appInitialized = true;
    logToConsole("DOMContentLoaded event fired. Initializing application...", "info");
    cacheDomElements();

    const criticalElementsCheck = [ 'aiProviderSelect', 'languageSelect', 'apiStatusDiv', 'audienceInput', 'bulkModeCheckbox' ];
    let criticalMissing = false;
    criticalElementsCheck.forEach(jsKey => { if (!getElement(jsKey)) { logToConsole(`FATAL: Critical element with JS key '${jsKey}' missing after cache attempt. Cannot initialize UI.`, "error"); criticalMissing = true; } });
    if (criticalMissing) { return; }

    logToConsole("Loading application state...", "info");
    const initialState = loadState();
    logToConsole("Applying loaded state to UI...", "info");
    updateUIFromState(initialState);

    setupStep4Listeners();
    logToConsole("Setting up other event listeners...", "info");
    setupConfigurationListeners();
    setupStep1Listeners();
    setupStep2Listeners();
    setupStep3Listeners();
    setupBulkModeListeners();

    logToConsole("Final assertion of UI mode...", "info");
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
        const newProvider = e.target.value;
        updateState({ textProvider: newProvider, textModel: '', useCustomTextModel: false }); 
        populateTextModels(true); 
        const selectedDefaultModel = getElement('aiModelSelect')?.value || '';
        updateState({ textModel: selectedDefaultModel }); 
        if(useCustomAiModelCheckbox) useCustomAiModelCheckbox.checked = false; 
        toggleCustomModelUI('text'); 
        checkApiStatus(); 
    });

    aiModelSelect?.addEventListener('change', (e) => {
        if (!getElement('useCustomAiModelCheckbox')?.checked) {
            const selectedModel = e.target.value;
            if (selectedModel) { updateState({ textModel: selectedModel }); checkApiStatus(); }
        }
    });

    useCustomAiModelCheckbox?.addEventListener('change', () => {
        const isChecked = useCustomAiModelCheckbox.checked;
        updateState({ useCustomTextModel: isChecked });
        toggleCustomModelUI('text');
        if (isChecked) { 
            const currentCustomModel = getElement('customAiModelInput')?.value.trim() || '';
            updateState({ customTextModel: currentCustomModel }); 
            updateCustomModelState('text', getState().textProvider, currentCustomModel);
        } else { 
            updateState({ textModel: getElement('aiModelSelect')?.value || '' }); 
        }
        checkApiStatus();
    });

    customAiModelInput?.addEventListener('blur', (e) => {
        if (getElement('useCustomAiModelCheckbox')?.checked) {
            const provider = getState().textProvider;
            const customModelName = e.target.value.trim();
            updateCustomModelState('text', provider, customModelName);
            updateState({ customTextModel: customModelName });
            checkApiStatus();
        }
    });

     imageProviderSelect?.addEventListener('change', (e) => {
         const newProvider = e.target.value;
         const defaultAspectRatio = imageProviders[newProvider]?.aspectRatios?.[0] || '1:1';
         updateState({ imageProvider: newProvider, imageModel: '', imageAspectRatio: defaultAspectRatio, useCustomImageModel: false });
         if(useCustomImageModelCheckbox) useCustomImageModelCheckbox.checked = false;
         populateImageModels(true); 
         const defaultImageModel = getElement('imageModelSelect')?.value || ''; 
         updateState({ imageModel: defaultImageModel }); 
         toggleCustomModelUI('image');
     });

     imageModelSelect?.addEventListener('change', (e) => {
         if (!getElement('useCustomImageModelCheckbox')?.checked) {
             const selectedModel = e.target.value;
             if (selectedModel) { updateState({ imageModel: selectedModel }); }
         }
     });
    getElement('imageAspectRatioSelect')?.addEventListener('change', (e) => { updateState({ imageAspectRatio: e.target.value }); });

     useCustomImageModelCheckbox?.addEventListener('change', () => {
         const isChecked = useCustomImageModelCheckbox.checked;
         updateState({ useCustomImageModel: isChecked });
         toggleCustomModelUI('image');
         if (isChecked) { 
            const currentCustomModel = getElement('customImageModelInput')?.value.trim() || '';
            updateState({ customImageModel: currentCustomModel });
            updateCustomModelState('image', getState().imageProvider, currentCustomModel);
        } else { 
            updateState({ imageModel: getElement('imageModelSelect')?.value || '' }); 
        }
     });

     customImageModelInput?.addEventListener('blur', (e) => {
         if (getElement('useCustomImageModelCheckbox')?.checked) {
             const provider = getState().imageProvider;
             const customModelName = e.target.value.trim();
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
    const generateIdeasBtn = getElement('generateIdeasBtn'); 
    const sitemapLoadingIndicator = getElement('sitemapLoadingIndicator');
    const bulkKeywordsTextarea = getElement('bulkKeywords'); 

    bulkModeCheckbox?.addEventListener('change', (e) => {
        const isBulk = e.target.checked;
        const currentState = getState();
        let newFormat = currentState.format; // Start with current format

        if (isBulk) {
            // Switching TO bulk mode
            newFormat = 'markdown'; // Force to markdown for bulk
            updateState({
                bulkMode: true,
                formatSingleMode: currentState.format, // Save current format as single mode preference
                format: newFormat
            });
            logToConsole(`Switched to Bulk Mode. Format set to Markdown. Single mode format saved: ${currentState.format}`, 'info');
        } else {
            // Switching TO single mode
            newFormat = currentState.formatSingleMode || defaultSettings.format; // Restore single mode format or use default
            updateState({
                bulkMode: false,
                format: newFormat
            });
            logToConsole(`Switched to Single Mode. Format restored to: ${newFormat}`, 'info');
        }
        updateUIBasedOnMode(isBulk); // Update UI based on the new bulkMode state
    });

    languageSelect?.addEventListener('change', (e) => { const newLang = e.target.value; const newLangConfig = languageOptions[newLang]; const defaultDialect = newLangConfig?.dialects?.[0] || ''; updateState({ language: newLang, dialect: defaultDialect, customLanguage: '' }); populateDialectsUI(getState()); });
    customLanguageInput?.addEventListener('blur', (e) => { if (getElement('languageSelect')?.value === 'custom') { updateState({ customLanguage: e.target.value }); } });
    dialectSelect?.addEventListener('change', (e) => { updateState({ dialect: e.target.value }); });
    toneSelect?.addEventListener('change', (e) => { const newTone = e.target.value; const showCustom = newTone === 'custom'; updateState({ tone: newTone }); if (!showCustom) { updateState({ customTone: '' }); if(customToneInput) customToneInput.value = ''; } showElement(customToneInput, showCustom); customToneInput?.classList.toggle('custom-input-visible', showCustom); });
    customToneInput?.addEventListener('blur', (e) => { if (getElement('toneSelect')?.value === 'custom') { updateState({ customTone: e.target.value }); } });
    if (purposeCheckboxes) { purposeCheckboxes.forEach(checkbox => { checkbox.addEventListener('change', () => { const selectedPurposes = Array.from(document.querySelectorAll('input[name="purpose"]:checked')).map(cb => cb.value); updateState({ purpose: selectedPurposes }); const showUrl = selectedPurposes.includes('Promote URL'); const showCta = selectedPurposes.some(p => p.startsWith('Promote') || p === 'Generate Leads'); showElement(purposeUrlInput, showUrl); showElement(purposeCtaInput, showCta); if (!showUrl) updateState({ purposeUrl: '' }); if (!showCta) updateState({ purposeCta: '' }); }); }); } else { logToConsole("Could not attach listeners to purposeCheckboxes (not found).", "warn"); }
    getElement('purposeUrlInput')?.addEventListener('blur', (e) => updateState({ purposeUrl: e.target.value }));
    getElement('purposeCtaInput')?.addEventListener('blur', (e) => updateState({ purposeCta: e.target.value }));
    generateImagesCheckbox?.addEventListener('change', (e) => { const generate = e.target.checked; updateState({ generateImages: generate }); showElement(getElement('imageOptionsContainer'), generate); if (generate) { populateImageModels(); } toggleGithubOptions(); });
    if (imageStorageRadios) { imageStorageRadios.forEach(radio => { radio.addEventListener('change', (e) => { if (e.target.checked) { const storageType = e.target.value; updateState({ imageStorage: storageType }); toggleGithubOptions(); } }); }); } else { logToConsole("Could not attach listeners to imageStorageRadios (not found).", "warn"); }
    fetchSitemapBtn?.addEventListener('click', async () => { const url = sitemapUrlInput?.value.trim(); if (!url) { alert('Please enter a Sitemap URL.'); return; } showLoading(sitemapLoadingIndicator, true); disableElement(fetchSitemapBtn, true); try { const parsedUrls = await fetchAndParseSitemap(url); updateState({ sitemapUrls: parsedUrls, sitemapFetchedUrl: url }); displaySitemapUrlsUI(parsedUrls); } catch (error) { logToConsole(`Sitemap fetch failed: ${error.message}`, 'error'); alert(`Failed to fetch or parse sitemap: ${error.message}`); updateState({ sitemapUrls: [], sitemapFetchedUrl: '' }); displaySitemapUrlsUI([]); } finally { showLoading(sitemapLoadingIndicator, false); disableElement(fetchSitemapBtn, false); } });
    
    bulkKeywordsTextarea?.addEventListener('blur', (e) => {
        updateState({ bulkKeywordsContent: e.target.value });
    });
    
    const inputsToSave = [ 
        { id: 'keywordInput', stateKey: 'keyword', event: 'blur' }, 
        { id: 'audienceInput', stateKey: 'audience', event: 'blur' }, 
        { id: 'readerNameInput', stateKey: 'readerName', event: 'blur' }, 
        { id: 'humanizeContentCheckbox', stateKey: 'humanizeContent', event: 'change', type: 'checkbox' },
        { id: 'genderSelect', stateKey: 'gender', event: 'change' }, 
        { id: 'ageSelect', stateKey: 'age', event: 'change' }, 
        { id: 'formatSelect', stateKey: 'format', event: 'change' }, 
        { id: 'sitemapUrlInput', stateKey: 'sitemapUrl', event: 'blur' }, 
        { id: 'customSpecsInput', stateKey: 'customSpecs', event: 'blur' }, 
        { id: 'numImagesSelect', stateKey: 'numImages', event: 'change' }, 
        { id: 'imageSubjectInput', stateKey: 'imageSubject', event: 'blur' }, 
        { id: 'imageStyleSelect', stateKey: 'imageStyle', event: 'change' }, 
        { id: 'imageStyleModifiersInput', stateKey: 'imageStyleModifiers', event: 'blur' }, 
        { id: 'imageTextInput', stateKey: 'imageText', event: 'blur' }, 
        { id: 'githubRepoUrlInput', stateKey: 'githubRepoUrl', event: 'blur' }, 
        { id: 'githubCustomPathInput', stateKey: 'githubCustomPath', event: 'blur' } ];
    inputsToSave.forEach(item => {
        const element = getElement(item.id);
        element?.addEventListener(item.event, (e) => {
            let value = e.target.value;
            if (item.type === 'checkbox') {
                value = e.target.checked;
            }
            if (e.target.type === 'select-one' && item.stateKey === 'numImages') {
                value = parseInt(value, 10) || 1;
            }
            updateState({ [item.stateKey]: value });
        });
    });
    generateSingleBtn?.addEventListener('click', handleGenerateStructure);
    generatePlanBtn?.addEventListener('click', handleGeneratePlan);
    generateIdeasBtn?.addEventListener('click', handleGenerateIdeas); 
}

function setupStep2Listeners() {
    const toggleStructureVisibilityBtn = getElement('toggleStructureVisibilityBtn');
    const structureContainer = getElement('structureContainer');
    const linkTypeToggle = getElement('linkTypeToggle');
    const linkTypeText = getElement('linkTypeText');
    const generateArticleBtn = getElement('generateArticleBtn');
    const articleTitleInput = getElement('articleTitleInput');
    const articleStructureTextarea = getElement('articleStructureTextarea');

    toggleStructureVisibilityBtn?.addEventListener('click', () => {
        if (structureContainer) { const isHidden = structureContainer.classList.toggle('hidden'); toggleStructureVisibilityBtn.textContent = isHidden ? 'Show' : 'Hide'; }
    });
    linkTypeToggle?.addEventListener('change', (e) => {
        const isInternal = !e.target.checked; updateState({ linkTypeInternal: isInternal });
        if (linkTypeText) { linkTypeText.textContent = isInternal ? 'Internal' : 'External'; }
    });
    articleTitleInput?.addEventListener('blur', (e) => { updateState({ articleTitle: e.target.value }); });
    generateArticleBtn?.addEventListener('click', handleGenerateArticle);

    articleStructureTextarea?.addEventListener('blur', (e) => {
        const currentStructure = e.target.value;
        if (getState().articleStructure !== currentStructure) {
            logToConsole("Saving manually edited structure to state...", 'info');
            updateState({ articleStructure: currentStructure });
        }
        updateStructureCountDisplay(currentStructure);
    });
     articleStructureTextarea?.addEventListener('input', (e) => {
        updateStructureCountDisplay(e.target.value);
    });
}

function setupStep3Listeners() {
    const previewHtmlCheckbox = getElement('previewHtmlCheckbox');
    const generatedArticleTextarea = getElement('generatedArticleTextarea');
    const htmlPreviewDiv = getElement('htmlPreviewDiv');
    const enableSpinningBtn = getElement('enableSpinningBtn');
    const pauseSpinBtn = getElement('pauseSpinBtn');
    const stopSpinBtn = getElement('stopSpinBtn');

    if (enableSpinningBtn) {
        enableSpinningBtn.textContent = ' Spin Article 🔄 ';
    }

    previewHtmlCheckbox?.addEventListener('change', (e) => {
        const showPreview = e.target.checked;
        showElement(generatedArticleTextarea, !showPreview); 
        showElement(htmlPreviewDiv, showPreview); 
        if (showPreview && htmlPreviewDiv && generatedArticleTextarea) {
            let unsafeHTML = generatedArticleTextarea.value;
            let sanitizedHTML = unsafeHTML.replace(/<script.*?>.*?<\/script>/gis, '');
             sanitizedHTML = sanitizedHTML.replace(/onerror=\".*?\"/gi, '');
             sanitizedHTML = sanitizedHTML.replace(/onload=\".*?\"/gi, '');
            htmlPreviewDiv.innerHTML = sanitizedHTML;
        }
    });

    enableSpinningBtn?.addEventListener('click', () => {
        const generatedTextarea = getElement('generatedArticleTextarea');
        const spunDisplay = getElement('spunArticleDisplay');
        const step4 = getElement('step4Section');

        if (generatedTextarea && spunDisplay && step4) {
             logToConsole("Spin Article button clicked.", 'info');
             showElement(step4, true); 
             handleSpinArticle(generatedTextarea, spunDisplay);
        } else {
             logToConsole("Could not start spinning - required elements missing.", 'error');
             alert("Error starting spinning process. Please check console.");
        }
    });

    pauseSpinBtn?.addEventListener('click', pauseSpinning);
    stopSpinBtn?.addEventListener('click', stopSpinningProcess);

    generatedArticleTextarea?.addEventListener('input', (e) => {
        const currentContent = e.target.value;
        updateCounts(currentContent); 
        if (getState().generatedArticleContent !== currentContent) { updateState({ generatedArticleContent: currentContent }); }
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

     if(spunArticleDisplay?.textContent) {
         highlightSpintax(spunArticleDisplay);
     }
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

console.log("article-main.js loaded (v8.18 Humanize content)");