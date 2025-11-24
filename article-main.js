// article-main.js (v9.10 powerful step 3)
import { loadState, updateState, resetAllData, getCustomModelState, updateCustomModelState, getState, setBulkPlan, updateBulkPlanItem } from './article-state.js';
import { logToConsole, fetchAndParseSitemap, showLoading, disableElement, slugify, showElement } from './article-helpers.js';
import {
    cacheDomElements, getElement, renderAiProviderRows, initializeProviderUI,
    populateImageModels, updateUIFromState, updateUIBasedOnMode, toggleCustomModelUI,
    populateLanguagesUI, populateDialectsUI, toggleGithubOptions, checkApiStatus,
    displaySitemapUrlsUI, updateCounts, updateStructureCountDisplay
} from './article-ui.js';
import { languageOptions, imageProviders, defaultSettings } from './article-config.js'; // Import defaultSettings
import { handleGenerateStructure, handleGenerateArticle } from './article-single.js';
import { prepareKeywords, handleGeneratePlan, handleStartBulkGeneration, handleDownloadZip } from './article-bulk.js';
import { handleGenerateIdeas } from './article-ideas.js';
import { initStep3Editor, setViewMode, setupEditorToolbar } from './article-editor.js';
import { prepareSpinnerUI, addVariationColumn, removeVariationColumn, handleBulkGenerate, compileSpintax, loadSpinnerData } from './article-spinner.js';

function addProviderToState() {
    const currentState = getState();
    const newProviderList = [...(currentState.textProviders || [])];
    const textProvidersConfig = ALL_PROVIDERS_CONFIG.text;

    if (Object.keys(textProvidersConfig).length === 0) {
        logToConsole("Provider configs not loaded yet. Cannot add new provider.", "warn");
        return;
    }

    const firstProviderKey = Object.keys(textProvidersConfig)[0];
    const firstProviderConfig = textProvidersConfig[firstProviderKey];
    const defaultModel = findCheapestModel(firstProviderConfig?.models.map(m => m.id)) || '';

    newProviderList.push({
        provider: firstProviderKey,
        model: defaultModel,
        useCustom: false,
        customModel: ''
    });

    updateState({ textProviders: newProviderList });
    renderAiProviderRows(); // Re-render the UI after state is updated
}

// Flag to prevent multiple initializations
let appInitialized = false;

async function initializeApp() {
    if (appInitialized) { logToConsole("Initialization attempted again, skipping.", "warn"); return; }
    appInitialized = true;
    logToConsole("DOMContentLoaded event fired. Initializing application...", "info");
    cacheDomElements();

    const criticalElementsCheck = [ 'languageSelect', 'apiStatusDiv', 'audienceInput', 'bulkModeCheckbox' ];
    let criticalMissing = false;
    criticalElementsCheck.forEach(jsKey => { if (!getElement(jsKey)) { logToConsole(`FATAL: Critical element with JS key '${jsKey}' missing after cache attempt. Cannot initialize UI.`, "error"); criticalMissing = true; } });
    if (criticalMissing) { return; }

    await initializeProviderUI();

    logToConsole("Loading application state...", "info");
    const initialState = loadState();
    logToConsole("Applying loaded state to UI...", "info");
    updateUIFromState(initialState);
    loadSpinnerData(initialState); 

    const addProviderBtn = getElement('addProviderBtn');
    addProviderBtn?.addEventListener('click', addProviderToState);

    setupStep4Listeners();
    logToConsole("Setting up other event listeners...", "info");
    setupConfigurationListeners();
    setupStep1Listeners();
    setupStep2Listeners();
    setupStep3Listeners();
    setupBulkModeListeners();

    logToConsole("Final assertion of UI mode...", "info");
    updateUIBasedOnMode(getState().bulkMode);

    setupCollapsibleSections(); // Add this line
    logToConsole("Application Initialized successfully.", "success");
}

function setupCollapsibleSections() {
    document.addEventListener('click', (e) => {
        const header = e.target.closest('.section-header');
        if (header) {
            const section = header.closest('.compact-section');
            if (section) {
                section.classList.toggle('collapsed');
            }
        }
    });
}

// --- Listener setup functions ---
function setupConfigurationListeners() {
    const imageProviderSelect = getElement('imageProviderSelect');
    const imageModelSelect = getElement('imageModelSelect');
    const useCustomImageModelCheckbox = getElement('useCustomImageModelCheckbox');
    const customImageModelInput = getElement('customImageModelInput');
    const resetDataBtn = getElement('resetDataBtn');
    const forceReloadBtn = getElement('forceReloadBtn');

    forceReloadBtn?.addEventListener('click', () => { logToConsole("Attempting hard refresh...", "warn"); location.reload(true); });
    resetDataBtn?.addEventListener('click', resetAllData);

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
    fetchSitemapBtn?.addEventListener('click', async () => {
        const url = sitemapUrlInput?.value.trim();
        if (!url) {
            alert('Please enter a website URL (e.g., example.com).');
            return;
        }

        showLoading(sitemapLoadingIndicator, true);
        disableElement(fetchSitemapBtn, true);
        logToConsole(`Starting sitemap discovery for: ${url}`, 'info');

        try {
            // NEW: Call the dedicated sitemap discovery function
            const response = await fetch('/fetch-sitemap', { // Use the route you set for the new worker
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseUrl: url })
            });

            const result = await response.json();

            // Log the discovery process details from the backend
            if (result.log && Array.isArray(result.log)) {
                result.log.forEach(logLine => logToConsole(`[Sitemap Discovery] ${logLine}`, 'info'));
            }

            if (!response.ok || !result.success) {
                throw new Error(result.error || `Sitemap discovery failed with status ${response.status}`);
            }

            const parsedUrls = result.urls || [];
            updateState({ sitemapUrls: parsedUrls, sitemapFetchedUrl: url });
            displaySitemapUrlsUI(parsedUrls);

        } catch (error) {
            logToConsole(`Sitemap discovery failed: ${error.message}`, 'error');
            alert(`Failed to discover sitemap(s): ${error.message}`);
            updateState({ sitemapUrls: [], sitemapFetchedUrl: '' });
            displaySitemapUrlsUI([]);
        } finally {
            showLoading(sitemapLoadingIndicator, false);
            disableElement(fetchSitemapBtn, false);
        }
    });

    bulkKeywordsTextarea?.addEventListener('blur', () => {
        logToConsole("Bulk keywords textarea lost focus. Cleaning and updating content...", "info");
        // This function will read, clean, de-dupe, and update the textarea value and the state.
        prepareKeywords();
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
        { id: 'githubCustomPathInput', stateKey: 'githubCustomPath', event: 'blur' },
        { id: 'batchSizeInput', stateKey: 'batchSize', event: 'blur' }
    ];
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
    const prepareSpinnerBtn = getElement('prepareSpinnerBtn');
    const generatedArticleTextarea = getElement('generatedArticleTextarea');

    // Initialize Toolbar once
    setupEditorToolbar();

    // View Mode Buttons
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            setViewMode(mode);
        });
    });

    // Observer to detect when content is generated and Step 3 is shown
    // Or better: Hook into the 'input' event of the hidden textarea if article-single triggers it
    generatedArticleTextarea?.addEventListener('input', (e) => {
        const content = e.target.value;
        const state = getState();
        // Initialize the visual editor with the new content
        initStep3Editor(content, state.format);
        updateCounts(content);
    });

    // Existing Spinner Trigger
    prepareSpinnerBtn?.addEventListener('click', () => {
        // Get content from the active view
        let finalContent = '';
        const state = getState(); // check which view is active? 
        // Just grab from the hidden main textarea which is synced
        finalContent = generatedArticleTextarea.value;

        if(!finalContent.trim()) {
            alert("Please generate an article first.");
            return;
        }
        showElement(getElement('step4Section'), true);
        showElement(getElement('scrollToStep5Btn'), true);
        prepareSpinnerUI(finalContent);
        showElement(getElement('step3Section'), false); 
    });
}

function setupStep4Listeners() {
    const addVariationColumnBtn = getElement('addVariationColumnBtn');
    const removeVariationColumnBtn = getElement('removeVariationColumnBtn');
    const bulkGenerateBtn = getElement('bulkGenerateBtn');
    const compileSpintaxBtn = getElement('compileSpintaxBtn');
    const copySpintaxBtn = getElement('copySpintaxBtn');
    const scrollToStep5Btn = getElement('scrollToStep5Btn');
    const step4Section = getElement('step4Section');
    const step5Section = getElement('step5Section');

    addVariationColumnBtn?.addEventListener('click', addVariationColumn);
    removeVariationColumnBtn?.addEventListener('click', removeVariationColumn);
    bulkGenerateBtn?.addEventListener('click', handleBulkGenerate);
    compileSpintaxBtn?.addEventListener('click', compileSpintax);
    
    copySpintaxBtn?.addEventListener('click', () => {
        const textarea = getElement('finalSpintaxOutput');
        textarea.select();
        document.execCommand('copy');
        alert("Spintax copied to clipboard!");
    });

    // NEW: Dynamic Scroll Logic
    if (scrollToStep5Btn && step4Section && step5Section) {
        // 1. Click Logic
        scrollToStep5Btn.addEventListener('click', () => {
            if (scrollToStep5Btn.textContent.includes('Step 4')) {
                // User wants to go UP to Step 4 header
                const header = step4Section.querySelector('.section-header');
                if(header) header.scrollIntoView({ behavior: 'smooth' });
            } else {
                // User wants to go DOWN
                if (step5Section.classList.contains('hidden')) {
                    // If Step 5 isn't ready, scroll to the Compile button instead
                    compileSpintaxBtn.scrollIntoView({ behavior: 'smooth' });
                } else {
                    // Step 5 is ready, go there
                    step5Section.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        // 2. Observer Logic
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Only flip the arrow UP if Step 5 is actually visible on screen AND not hidden via CSS
                if (entry.isIntersecting && !step5Section.classList.contains('hidden')) {
                    scrollToStep5Btn.innerHTML = '⬆️ Scroll to Step 4';
                    scrollToStep5Btn.classList.replace('bg-gray-600', 'bg-indigo-600'); 
                } else {
                    scrollToStep5Btn.innerHTML = '⬇️ Scroll to Step 5';
                    scrollToStep5Btn.classList.replace('bg-indigo-600', 'bg-gray-600');
                }
            });
        }, { threshold: 0.1 });

        observer.observe(step5Section);
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

console.log("article-main.js loaded (v9.01 Refactor)");

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  if (event.reason && typeof event.reason.message === 'string' && event.reason.message.includes('A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received')) {
    logToConsole(
      'An unhandled promise rejection was caught, likely from a browser extension. This is often benign and can be ignored if the application is functioning correctly.',
      'warn'
    );
    event.preventDefault(); // Prevent the browser from logging the original error
  }
});