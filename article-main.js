// article-main.js (Ensuring DOM is ready for caching)
import { loadState, updateState, resetAllData, getCustomModelState, updateCustomModelState, getState, setBulkPlan, updateBulkPlanItem } from './article-state.js';
import { logToConsole, fetchAndParseSitemap, showLoading, disableElement } from './article-helpers.js';
import {
    cacheDomElements, getElement, populateAiProviders, populateTextModels,
    populateImageModels, updateUIFromState, updateUIBasedOnMode, toggleCustomModelUI,
    populateLanguagesUI, populateDialectsUI, toggleGithubOptions, checkApiStatus,
    displaySitemapUrlsUI
} from './article-ui.js'; // Use the updated ui file
import { handleGenerateStructure, handleGenerateArticle } from './article-single.js';
import { handleGeneratePlan, handleStartBulkGeneration, handleDownloadZip } from './article-bulk.js';
import { handleSpinSelectedText, handleSelection, highlightSpintax } from './article-spinner.js';

function initializeApp() {
    logToConsole("Initializing AI Article Generator v8.2...", "info");

    // 1. Cache DOM Elements FIRST
    cacheDomElements(); // This now has internal logging for failures

    // 2. Load State
    const initialState = loadState();

    // 3. Update UI from State (this relies on cached elements)
    updateUIFromState(initialState); // This populates and sets initial UI based on loaded state

    // 4. Setup Event Listeners (these also rely on cached elements)
    setupConfigurationListeners();
    setupStep1Listeners();
    setupStep2Listeners();
    setupStep3Listeners();
    setupStep4Listeners();
    setupBulkModeListeners();

    logToConsole("Application Initialized and listeners attached.", "success");
}

// --- Listener setup functions (setupConfigurationListeners, etc.) remain the same ---
// No changes needed in listener functions themselves based on the current errors.
function setupConfigurationListeners() {
    // ... (same as previous version) ...
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

    forceReloadBtn?.addEventListener('click', () => {
        logToConsole("Attempting hard refresh...", "warn");
        location.reload(true);
    });

    resetDataBtn?.addEventListener('click', resetAllData);

    // --- Text AI Config ---
    aiProviderSelect?.addEventListener('change', (e) => {
        logToConsole(`Text Provider changed to: ${e.target.value}`, 'info');
        updateState({
            textProvider: e.target.value,
            textModel: '',
        });
        populateTextModels(true);
        checkApiStatus();
    });

    aiModelSelect?.addEventListener('change', (e) => {
        if (!getElement('useCustomAiModelCheckbox')?.checked) { // Use getElement for safety
            const selectedModel = e.target.value;
            logToConsole(`Standard Text Model selected: ${selectedModel}`, 'info');
            if (selectedModel) {
                 updateState({ textModel: selectedModel });
                 checkApiStatus();
            } else {
                 logToConsole("Empty model selected, skipping status check.", "warn");
                 checkApiStatus();
            }
        }
    });

    useCustomAiModelCheckbox?.addEventListener('change', () => {
        const isChecked = useCustomAiModelCheckbox.checked;
        logToConsole(`Use Custom Text Model checkbox changed: ${isChecked}`, 'info');
        updateState({ useCustomTextModel: isChecked });
        toggleCustomModelUI('text');

        if (isChecked) {
            updateState({ customTextModel: getElement('customAiModelInput')?.value || '' }); // Safe access
        } else {
            updateState({ textModel: getElement('aiModelSelect')?.value || '' }); // Safe access
        }
        checkApiStatus();
    });

    customAiModelInput?.addEventListener('blur', (e) => {
        if (getElement('useCustomAiModelCheckbox')?.checked) { // Safe access
            const provider = getState().textProvider;
            const customModelName = e.target.value.trim();
            logToConsole(`Custom Text Model input changed (on blur) to: ${customModelName}`, 'info');
            updateCustomModelState('text', provider, customModelName);
            updateState({ customTextModel: customModelName });
            if (customModelName) {
                checkApiStatus();
            } else {
                 logToConsole("Custom model input cleared, skipping status check.", "warn");
                 checkApiStatus();
            }
        }
    });

     // --- Image AI Config ---
     imageProviderSelect?.addEventListener('change', (e) => {
         logToConsole(`Image Provider changed to: ${e.target.value}`, 'info');
         const newProvider = e.target.value;
         const defaultAspectRatio = imageProviders[newProvider]?.aspectRatios?.[0] || '1:1';
         updateState({
             imageProvider: newProvider,
             imageModel: '',
             imageAspectRatio: defaultAspectRatio // Set default aspect ratio for new provider
         });
         populateImageModels(true); // Populate models and aspect ratio, set default model
     });

     imageModelSelect?.addEventListener('change', (e) => {
         if (!getElement('useCustomImageModelCheckbox')?.checked) { // Safe access
             const selectedModel = e.target.value;
             logToConsole(`Standard Image Model selected: ${selectedModel}`, 'info');
              if (selectedModel) {
                 updateState({ imageModel: selectedModel });
             }
         }
     });
    getElement('imageAspectRatioSelect')?.addEventListener('change', (e) => { // Safe access
        updateState({ imageAspectRatio: e.target.value });
        logToConsole(`Image Aspect Ratio changed to: ${e.target.value}`, 'info');
    });

     useCustomImageModelCheckbox?.addEventListener('change', () => {
         const isChecked = useCustomImageModelCheckbox.checked;
         logToConsole(`Use Custom Image Model checkbox changed: ${isChecked}`, 'info');
         updateState({ useCustomImageModel: isChecked });
         toggleCustomModelUI('image');
         if (isChecked) {
            updateState({ customImageModel: getElement('customImageModelInput')?.value || '' }); // Safe access
        } else {
            updateState({ imageModel: getElement('imageModelSelect')?.value || '' }); // Safe access
        }
     });

     customImageModelInput?.addEventListener('blur', (e) => {
         if (getElement('useCustomImageModelCheckbox')?.checked) { // Safe access
             const provider = getState().imageProvider;
             const customModelName = e.target.value.trim();
             logToConsole(`Custom Image Model input changed (on blur) to: ${customModelName}`, 'info');
             updateCustomModelState('image', provider, customModelName);
             updateState({ customImageModel: customModelName });
         }
     });
}
function setupStep1Listeners() {
    // ... (same as previous version, but ensure getElement is used internally if needed) ...
     const bulkModeCheckbox = getElement('bulkModeCheckbox');
    const languageSelect = getElement('language');
    const customLanguageInput = getElement('customLanguageInput');
    const dialectSelect = getElement('dialectSelect'); // Corrected ID
    const toneSelect = getElement('toneSelect');
    const customToneInput = getElement('customToneInput');
    // Query All returns a NodeList, check length before accessing
    const purposeCheckboxes = domElements['purposeCheckboxes']; // Use cached NodeList
    const purposeUrlInput = getElement('purposeUrlInput');
    const purposeCtaInput = getElement('purposeCtaInput');
    const generateImagesCheckbox = getElement('generateImagesCheckbox');
    const imageStorageRadios = domElements['imageStorageRadios']; // Use cached NodeList
    const fetchSitemapBtn = getElement('fetchSitemapBtn');
    const sitemapUrlInput = getElement('sitemapUrlInput');
    const generateSingleBtn = getElement('generateSingleBtn');
    const generatePlanBtn = getElement('generatePlanBtn');
    const sitemapLoadingIndicator = getElement('sitemapLoadingIndicator');

    bulkModeCheckbox?.addEventListener('change', (e) => {
        const isBulk = e.target.checked;
        logToConsole(`Bulk Mode Checkbox changed: ${isBulk}`, 'info');
        updateState({ bulkMode: isBulk });
        updateUIBasedOnMode(isBulk);
    });

    languageSelect?.addEventListener('change', (e) => {
        const newLang = e.target.value;
        logToConsole(`Language Select changed to: ${newLang}`, 'info');
        updateState({
            language: newLang,
            dialect: '',
            customLanguage: ''
        });
        populateDialectsUI(getState());
    });

    customLanguageInput?.addEventListener('blur', (e) => {
         if (getElement('language')?.value === 'custom') { // Safe access
             logToConsole(`Custom Language input changed (on blur): ${e.target.value}`, 'info');
            updateState({ customLanguage: e.target.value });
         }
    });

    dialectSelect?.addEventListener('change', (e) => {
         logToConsole(`Dialect Select changed to: ${e.target.value}`, 'info');
        updateState({ dialect: e.target.value });
    });

    toneSelect?.addEventListener('change', (e) => {
        const newTone = e.target.value;
        logToConsole(`Tone Select changed to: ${newTone}`, 'info');
        const showCustom = newTone === 'custom';
        updateState({ tone: newTone });
        if (!showCustom) {
            updateState({ customTone: '' });
            if(customToneInput) customToneInput.value = ''; // Safe access
        }
        showElement(customToneInput, showCustom); // customToneInput checked inside showElement
        customToneInput?.classList.toggle('custom-input-visible', showCustom); // Safe access
    });

    customToneInput?.addEventListener('blur', (e) => {
         if (getElement('toneSelect')?.value === 'custom') { // Safe access
             logToConsole(`Custom Tone input changed (on blur): ${e.target.value}`, 'info');
             updateState({ customTone: e.target.value });
         }
    });

    // Check if NodeList exists and has items
     if (purposeCheckboxes && purposeCheckboxes.length > 0) {
         purposeCheckboxes.forEach(checkbox => {
             checkbox.addEventListener('change', () => {
                 const selectedPurposes = Array.from(document.querySelectorAll('input[name="purpose"]:checked')).map(cb => cb.value); // Re-query here is fine
                 logToConsole(`Purpose checkboxes changed: ${selectedPurposes.join(', ')}`, 'info');
                 updateState({ purpose: selectedPurposes });

                 const showUrl = selectedPurposes.includes('Promote URL');
                 const showCta = selectedPurposes.some(p => p.startsWith('Promote') || p === 'Generate Leads');

                 showElement(purposeUrlInput, showUrl); // Elements checked inside
                 showElement(purposeCtaInput, showCta);

                 if (!showUrl) updateState({ purposeUrl: '' });
                 if (!showCta) updateState({ purposeCta: '' });
             });
         });
     }
     getElement('purposeUrlInput')?.addEventListener('blur', (e) => updateState({ purposeUrl: e.target.value })); // Safe access
     getElement('purposeCtaInput')?.addEventListener('blur', (e) => updateState({ purposeCta: e.target.value })); // Safe access


    generateImagesCheckbox?.addEventListener('change', (e) => {
        const generate = e.target.checked;
        logToConsole(`Generate Images checkbox changed: ${generate}`, 'info');
        updateState({ generateImages: generate });
        showElement(getElement('imageOptionsContainer'), generate); // Safe access
        if (generate) {
            populateImageModels();
        }
        toggleGithubOptions();
    });

     // Check if NodeList exists and has items
     if (imageStorageRadios && imageStorageRadios.length > 0) {
         imageStorageRadios.forEach(radio => {
             radio.addEventListener('change', (e) => {
                 if (e.target.checked) {
                      const storageType = e.target.value;
                      logToConsole(`Image Storage radio changed: ${storageType}`, 'info');
                     updateState({ imageStorage: storageType });
                     toggleGithubOptions();
                 }
             });
         });
     }

    fetchSitemapBtn?.addEventListener('click', async () => {
        const url = sitemapUrlInput?.value.trim();
        if (!url) {
            alert('Please enter a Sitemap URL.');
            return;
        }
        logToConsole(`Fetching sitemap from URL: ${url}`, 'info');
        showLoading(sitemapLoadingIndicator, true); // Element checked inside
        disableElement(fetchSitemapBtn, true); // Element checked inside
        try {
            const parsedUrls = await fetchAndParseSitemap(url);
            updateState({ sitemapUrls: parsedUrls });
            displaySitemapUrlsUI(parsedUrls);
            logToConsole(`Successfully fetched and parsed ${parsedUrls.length} URLs.`, 'success');
        } catch (error) {
            logToConsole(`Sitemap fetch failed: ${error.message}`, 'error');
            alert(`Failed to fetch or parse sitemap: ${error.message}`);
            updateState({ sitemapUrls: [] });
            displaySitemapUrlsUI([]);
        } finally {
            showLoading(sitemapLoadingIndicator, false); // Element checked inside
            disableElement(fetchSitemapBtn, false); // Element checked inside
        }
    });

    // Listeners for simple text/select inputs
    const inputsToSave = [ /* ... same list as before ... */ { id: 'keywordInput', stateKey: 'keyword', event: 'blur' }, { id: 'audienceInput', stateKey: 'audience', event: 'blur' }, { id: 'readerNameInput', stateKey: 'readerName', event: 'blur' }, { id: 'genderSelect', stateKey: 'gender', event: 'change' }, { id: 'ageSelect', stateKey: 'age', event: 'change' }, { id: 'formatSelect', stateKey: 'format', event: 'change' }, { id: 'sitemapUrlInput', stateKey: 'sitemapUrl', event: 'blur' }, { id: 'customSpecsInput', stateKey: 'customSpecs', event: 'blur' }, { id: 'numImagesSelect', stateKey: 'numImages', event: 'change' }, { id: 'imageSubjectInput', stateKey: 'imageSubject', event: 'blur' }, { id: 'imageStyleSelect', stateKey: 'imageStyle', event: 'change' }, { id: 'imageStyleModifiersInput', stateKey: 'imageStyleModifiers', event: 'blur' }, { id: 'imageTextInput', stateKey: 'imageText', event: 'blur' }, { id: 'githubRepoUrlInput', stateKey: 'githubRepoUrl', event: 'blur' }, { id: 'githubCustomPathInput', stateKey: 'githubCustomPath', event: 'blur' } ];
    inputsToSave.forEach(item => {
        const element = getElement(item.id); // Use safe getter
        element?.addEventListener(item.event, (e) => { // Add listener only if element exists
            let value = e.target.value;
            if (e.target.type === 'select-one' && item.stateKey === 'numImages') {
                value = parseInt(value, 10) || 1;
            }
            updateState({ [item.stateKey]: value });
        });
    });

    // Action Buttons
    generateSingleBtn?.addEventListener('click', handleGenerateStructure);
    generatePlanBtn?.addEventListener('click', handleGeneratePlan);
}
function setupStep2Listeners() {
    // ... (same as previous version, ensure getElement is used for safety) ...
    const toggleStructureVisibilityBtn = getElement('toggleStructureVisibilityBtn');
    const structureContainer = getElement('structureContainer');
    const linkTypeToggle = getElement('linkTypeToggle');
    const linkTypeText = getElement('linkTypeText');
    const generateArticleBtn = getElement('generateArticleBtn');
    const articleTitleInput = getElement('articleTitleInput');

    toggleStructureVisibilityBtn?.addEventListener('click', () => {
        if (structureContainer) {
            const isHidden = structureContainer.classList.toggle('hidden');
            toggleStructureVisibilityBtn.textContent = isHidden ? 'Show' : 'Hide';
        }
    });

    linkTypeToggle?.addEventListener('change', (e) => {
        const isInternal = !e.target.checked;
        updateState({ linkTypeInternal: isInternal });
        if (linkTypeText) {
             linkTypeText.textContent = isInternal ? 'Internal' : 'External';
        }
        logToConsole(`Link type toggled. Internal: ${isInternal}`, 'info');
    });

    articleTitleInput?.addEventListener('blur', (e) => {
        updateState({ articleTitle: e.target.value });
         logToConsole(`Article Title input updated (on blur): ${e.target.value}`, 'info');
    });

    generateArticleBtn?.addEventListener('click', handleGenerateArticle);
}
function setupStep3Listeners() {
    // ... (same as previous version, ensure getElement is used for safety) ...
    const previewHtmlCheckbox = getElement('preview_html_checkbox');
    const generatedArticleTextarea = getElement('generated_article');
    const htmlPreviewDiv = getElement('html_preview');
    const enableSpinningBtn = getElement('enableSpinningBtn');
    const spunArticleDisplay = getElement('spun_article_display');
    const step4Section = getElement('step4Section');

    previewHtmlCheckbox?.addEventListener('change', (e) => {
        const showPreview = e.target.checked;
        showElement(generatedArticleTextarea, !showPreview);
        showElement(htmlPreviewDiv, showPreview);
        if (showPreview && htmlPreviewDiv && generatedArticleTextarea) {
            let unsafeHTML = generatedArticleTextarea.value;
            // Simple sanitation
            let sanitizedHTML = unsafeHTML.replace(/<script.*?>.*?<\/script>/gis, '');
             sanitizedHTML = sanitizedHTML.replace(/onerror=".*?"/gi, '');
             sanitizedHTML = sanitizedHTML.replace(/onload=".*?"/gi, '');
            htmlPreviewDiv.innerHTML = sanitizedHTML;
            logToConsole("Showing sanitized HTML preview.", "warn");
        }
    });

    enableSpinningBtn?.addEventListener('click', () => {
        if (spunArticleDisplay && generatedArticleTextarea && step4Section) {
            spunArticleDisplay.innerHTML = generatedArticleTextarea.value;
            showElement(step4Section, true);
            highlightSpintax(spunArticleDisplay);
            logToConsole("Spinning enabled, content copied to Step 4.", 'info');
            spunArticleDisplay.focus();
        } else {
             logToConsole("Could not enable spinning - required elements missing.", 'error');
        }
    });
}
function setupStep4Listeners() {
    // ... (same as previous version, ensure getElement is used for safety) ...
    const spunArticleDisplay = getElement('spun_article_display');
    const spinSelectedBtn = getElement('spinSelectedBtn');

    spunArticleDisplay?.addEventListener('input', () => highlightSpintax(spunArticleDisplay));
    spunArticleDisplay?.addEventListener('mouseup', handleSelection);
    spunArticleDisplay?.addEventListener('keyup', handleSelection);
    spunArticleDisplay?.addEventListener('focus', handleSelection);
    spinSelectedBtn?.addEventListener('click', handleSpinSelectedText);
}
function setupBulkModeListeners() {
     // ... (same as previous version, ensure getElement is used for safety) ...
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
                 logToConsole(`Planning table input changed: Row ${index}, Field ${field}, Value: ${value}`, 'info');
                updateBulkPlanItem(index, { [field]: value });
                 if (field === 'slug') {
                     const newFilename = `${slugify(value || `item-${index}`)}.md`;
                     updateBulkPlanItem(index, { filename: newFilename });
                     logToConsole(`Updated filename for row ${index} to: ${newFilename}`, 'info');
                 }
            }
        }
    });
}

// --- Initialize ---
// Wrap initialization in a function that runs on DOMContentLoaded
function runInitialization() {
    // Ensure this runs only once
    if (window.appInitialized) return;
    window.appInitialized = true; // Flag to prevent double execution

    initializeApp();
}

if (document.readyState === 'loading') {
    // Still loading, wait for the event
    document.addEventListener('DOMContentLoaded', runInitialization);
} else {
    // DOM is already ready, run now
    runInitialization();
}

console.log("article-main.js loaded (v8.3 caching fixes)");