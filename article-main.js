// article-main.js (corrected listener logic and API status checks)
import { loadState, updateState, resetAllData, getCustomModelState, updateCustomModelState, getState, setBulkPlan, updateBulkPlanItem } from './article-state.js'; // Added setBulkPlan, updateBulkPlanItem
import { logToConsole, fetchAndParseSitemap, showLoading, disableElement } from './article-helpers.js'; // Added showLoading, disableElement
import {
    cacheDomElements, getElement, populateAiProviders, populateTextModels,
    populateImageModels, updateUIFromState, updateUIBasedOnMode, toggleCustomModelUI,
    populateLanguagesUI, populateDialectsUI, toggleGithubOptions, checkApiStatus,
    displaySitemapUrlsUI
} from './article-ui.js';
import { handleGenerateStructure, handleGenerateArticle } from './article-single.js';
import { handleGeneratePlan, handleStartBulkGeneration, handleDownloadZip } from './article-bulk.js';
import { handleSpinSelectedText, handleSelection, highlightSpintax } from './article-spinner.js';

function initializeApp() {
    logToConsole("Initializing AI Article Generator v8.2...", "info");
    cacheDomElements();
    const initialState = loadState();
    updateUIFromState(initialState); // This populates and sets initial UI based on loaded state
    setupConfigurationListeners();
    setupStep1Listeners();
    setupStep2Listeners();
    setupStep3Listeners();
    setupStep4Listeners();
    setupBulkModeListeners();
    logToConsole("Application Initialized and listeners attached.", "success");

    // Final check - ensure initial UI state is correct (sometimes CSS takes time)
    // setTimeout(() => {
    //     const currentMode = getState().bulkMode;
    //     logToConsole(`Re-asserting UI mode based on state: ${currentMode ? 'Bulk' : 'Single'}`, 'debug');
    //     updateUIBasedOnMode(currentMode);
    // }, 100); // Small delay just in case
}

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

    forceReloadBtn?.addEventListener('click', () => {
        logToConsole("Attempting hard refresh...", "warn");
        location.reload(true);
    });

    resetDataBtn?.addEventListener('click', resetAllData);

    // --- Text AI Config ---
    aiProviderSelect?.addEventListener('change', (e) => {
        logToConsole(`Text Provider changed to: ${e.target.value}`, 'info');
        // Update state FIRST (resetting models)
        updateState({
            textProvider: e.target.value,
            textModel: '', // Reset standard model selection
            // Custom model is provider-specific, so it doesn't need resetting here,
            // but we'll clear the active custom model value if using custom was checked
            // customTextModel: '' // Let getCustomModelState handle provider switching
        });
        // Repopulate models for the NEW provider using the updated state
        populateTextModels(true); // Pass true to set a default model
        // Check status AFTER models are populated and a default is potentially set
        checkApiStatus();
    });

    aiModelSelect?.addEventListener('change', (e) => {
        // This listener only matters if the standard dropdown is active
        if (!useCustomAiModelCheckbox?.checked) {
            const selectedModel = e.target.value;
            logToConsole(`Standard Text Model selected: ${selectedModel}`, 'info');
            if (selectedModel) {
                 updateState({ textModel: selectedModel });
                 checkApiStatus(); // Check status for the newly selected standard model
            } else {
                 logToConsole("Empty model selected, skipping status check.", "warn");
                 checkApiStatus(); // Check status (will likely show select model)
            }
        }
    });

    useCustomAiModelCheckbox?.addEventListener('change', () => {
        const isChecked = useCustomAiModelCheckbox.checked;
        logToConsole(`Use Custom Text Model checkbox changed: ${isChecked}`, 'info');
        // Update the boolean flag in state
        updateState({ useCustomTextModel: isChecked });
        // Update the UI (disables/enables standard select, shows/hides custom input)
        toggleCustomModelUI('text');

        // Update the *active* model in the main state based on the checkbox change
        if (isChecked) {
             // If switching TO custom, update state with the custom input's current value
            updateState({ customTextModel: customAiModelInput.value });
        } else {
            // If switching TO standard, update state with the standard dropdown's current value
            updateState({ textModel: aiModelSelect.value });
             // Ensure custom model state is cleared when switching away? Optional.
             // updateState({ customTextModel: '' });
        }
        // Check API status based on the *newly active* model
        checkApiStatus();
    });

    customAiModelInput?.addEventListener('blur', (e) => { // Use 'blur' instead of 'change' for less frequent updates
        // Only process if the custom checkbox is actually checked
        if (useCustomAiModelCheckbox?.checked) {
            const provider = getState().textProvider;
            const customModelName = e.target.value.trim();
            logToConsole(`Custom Text Model input changed (on blur) to: ${customModelName}`, 'info');
            // Update the persistent custom model storage for this provider
            updateCustomModelState('text', provider, customModelName);
            // Update the active custom model in the main app state
            updateState({ customTextModel: customModelName });
            // Check status if the input is not empty
            if (customModelName) {
                checkApiStatus();
            } else {
                 logToConsole("Custom model input cleared, skipping status check.", "warn");
                 checkApiStatus(); // Check status (will show select model)
            }
        }
    });

     // --- Image AI Config ---
     imageProviderSelect?.addEventListener('change', (e) => {
         logToConsole(`Image Provider changed to: ${e.target.value}`, 'info');
         updateState({
             imageProvider: e.target.value,
             imageModel: '',
             // Reset aspect ratio based on new provider's defaults/state
             imageAspectRatio: imageProviders[e.target.value]?.aspectRatios?.[0] || '1:1'
         });
         populateImageModels(true); // Populate models and aspect ratio, set default model
         // No separate status check for image models needed currently
     });

     imageModelSelect?.addEventListener('change', (e) => {
         if (!useCustomImageModelCheckbox?.checked) {
             const selectedModel = e.target.value;
             logToConsole(`Standard Image Model selected: ${selectedModel}`, 'info');
              if (selectedModel) {
                 updateState({ imageModel: selectedModel });
             }
         }
     });
     // Also update state if aspect ratio changes
    getElement('imageAspectRatioSelect')?.addEventListener('change', (e) => {
        updateState({ imageAspectRatio: e.target.value });
        logToConsole(`Image Aspect Ratio changed to: ${e.target.value}`, 'info');
    });

     useCustomImageModelCheckbox?.addEventListener('change', () => {
         const isChecked = useCustomImageModelCheckbox.checked;
         logToConsole(`Use Custom Image Model checkbox changed: ${isChecked}`, 'info');
         updateState({ useCustomImageModel: isChecked });
         toggleCustomModelUI('image');
         if (isChecked) {
            updateState({ customImageModel: customImageModelInput.value });
        } else {
            updateState({ imageModel: imageModelSelect.value });
        }
         // No status check needed
     });

     customImageModelInput?.addEventListener('blur', (e) => {
         if (useCustomImageModelCheckbox?.checked) {
             const provider = getState().imageProvider;
             const customModelName = e.target.value.trim();
             logToConsole(`Custom Image Model input changed (on blur) to: ${customModelName}`, 'info');
             updateCustomModelState('image', provider, customModelName);
             updateState({ customImageModel: customModelName });
         }
     });
}

function setupStep1Listeners() {
    const bulkModeCheckbox = getElement('bulkModeCheckbox');
    const languageSelect = getElement('language');
    const customLanguageInput = getElement('customLanguageInput');
    const dialectSelect = getElement('dialectSelect');
    const toneSelect = getElement('toneSelect');
    const customToneInput = getElement('customToneInput');
    const purposeCheckboxes = document.querySelectorAll('input[name="purpose"]'); // Query all
    const purposeUrlInput = getElement('purposeUrlInput');
    const purposeCtaInput = getElement('purposeCtaInput');
    const generateImagesCheckbox = getElement('generateImagesCheckbox');
    const imageStorageRadios = document.querySelectorAll('input[name="imageStorage"]'); // Query all
    const fetchSitemapBtn = getElement('fetchSitemapBtn');
    const sitemapUrlInput = getElement('sitemapUrlInput');
    const generateSingleBtn = getElement('generateSingleBtn');
    const generatePlanBtn = getElement('generatePlanBtn');
    const sitemapLoadingIndicator = getElement('sitemapLoadingIndicator');

    bulkModeCheckbox?.addEventListener('change', (e) => {
        const isBulk = e.target.checked;
        logToConsole(`Bulk Mode Checkbox changed: ${isBulk}`, 'info');
        updateState({ bulkMode: isBulk });
        updateUIBasedOnMode(isBulk); // Update visibility of sections
    });

    languageSelect?.addEventListener('change', (e) => {
        const newLang = e.target.value;
        logToConsole(`Language Select changed to: ${newLang}`, 'info');
        // Update state FIRST, resetting dialect and custom language
        updateState({
            language: newLang,
            dialect: '', // Reset dialect when language changes
            customLanguage: '' // Clear custom language input value
        });
        // Repopulate dialects UI using the *updated* state
        populateDialectsUI(getState()); // Pass the fresh state
    });

    customLanguageInput?.addEventListener('blur', (e) => {
         if (languageSelect?.value === 'custom') {
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
        updateState({ tone: newTone }); // Update state first
        if (!showCustom) {
            updateState({ customTone: '' }); // Clear custom tone if switching away
            customToneInput.value = ''; // Clear input field visually
        }
        showElement(customToneInput, showCustom);
        customToneInput?.classList.toggle('custom-input-visible', showCustom);
    });

    customToneInput?.addEventListener('blur', (e) => {
         if (toneSelect?.value === 'custom') {
             logToConsole(`Custom Tone input changed (on blur): ${e.target.value}`, 'info');
             updateState({ customTone: e.target.value });
         }
    });

    purposeCheckboxes?.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedPurposes = Array.from(document.querySelectorAll('input[name="purpose"]:checked')).map(cb => cb.value);
            logToConsole(`Purpose checkboxes changed: ${selectedPurposes.join(', ')}`, 'info');
            updateState({ purpose: selectedPurposes });

            const showUrl = selectedPurposes.includes('Promote URL');
            const showCta = selectedPurposes.some(p => p.startsWith('Promote') || p === 'Generate Leads');

            showElement(purposeUrlInput, showUrl);
            showElement(purposeCtaInput, showCta);

            if (!showUrl) updateState({ purposeUrl: '' }); // Clear state if hidden
            if (!showCta) updateState({ purposeCta: '' }); // Clear state if hidden
        });
    });
     getElement('purposeUrlInput')?.addEventListener('blur', (e) => updateState({ purposeUrl: e.target.value }));
     getElement('purposeCtaInput')?.addEventListener('blur', (e) => updateState({ purposeCta: e.target.value }));


    generateImagesCheckbox?.addEventListener('change', (e) => {
        const generate = e.target.checked;
        logToConsole(`Generate Images checkbox changed: ${generate}`, 'info');
        updateState({ generateImages: generate });
        showElement(getElement('imageOptionsContainer'), generate);
        // If enabling, ensure models are populated (might have been skipped if disabled before)
        if (generate) {
            populateImageModels(); // Populate models based on current provider
        }
        toggleGithubOptions(); // Update visibility based on combined state
    });

    imageStorageRadios?.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                 const storageType = e.target.value;
                 logToConsole(`Image Storage radio changed: ${storageType}`, 'info');
                updateState({ imageStorage: storageType });
                toggleGithubOptions(); // Update GitHub section visibility
            }
        });
    });

    fetchSitemapBtn?.addEventListener('click', async () => {
        const url = sitemapUrlInput?.value.trim();
        if (!url) {
            alert('Please enter a Sitemap URL.');
            return;
        }
        logToConsole(`Fetching sitemap from URL: ${url}`, 'info');
        showLoading(sitemapLoadingIndicator, true);
        disableElement(fetchSitemapBtn, true);
        try {
            const parsedUrls = await fetchAndParseSitemap(url); // Helper now just returns data or throws error
            updateState({ sitemapUrls: parsedUrls }); // Update state with results
            displaySitemapUrlsUI(parsedUrls); // Update UI from state
            logToConsole(`Successfully fetched and parsed ${parsedUrls.length} URLs.`, 'success');
        } catch (error) {
            logToConsole(`Sitemap fetch failed: ${error.message}`, 'error');
            alert(`Failed to fetch or parse sitemap: ${error.message}`);
            updateState({ sitemapUrls: [] }); // Clear sitemap in state on error
            displaySitemapUrlsUI([]); // Update UI to show empty
        } finally {
            showLoading(sitemapLoadingIndicator, false);
            disableElement(fetchSitemapBtn, false);
        }
    });

    // Listeners for simple text/select inputs to save state on change/blur
    const inputsToSave = [
        { id: 'keywordInput', stateKey: 'keyword', event: 'blur' },
        { id: 'audienceInput', stateKey: 'audience', event: 'blur' },
        { id: 'readerNameInput', stateKey: 'readerName', event: 'blur' },
        { id: 'genderSelect', stateKey: 'gender', event: 'change' },
        { id: 'ageSelect', stateKey: 'age', event: 'change' },
        { id: 'formatSelect', stateKey: 'format', event: 'change' },
        { id: 'sitemapUrlInput', stateKey: 'sitemapUrl', event: 'blur' },
        { id: 'customSpecsInput', stateKey: 'customSpecs', event: 'blur' },
        { id: 'numImagesSelect', stateKey: 'numImages', event: 'change' },
        // imageAspectRatioSelect handled above
        { id: 'imageSubjectInput', stateKey: 'imageSubject', event: 'blur' },
        { id: 'imageStyleSelect', stateKey: 'imageStyle', event: 'change' },
        { id: 'imageStyleModifiersInput', stateKey: 'imageStyleModifiers', event: 'blur' },
        { id: 'imageTextInput', stateKey: 'imageText', event: 'blur' },
        { id: 'githubRepoUrlInput', stateKey: 'githubRepoUrl', event: 'blur' },
        { id: 'githubCustomPathInput', stateKey: 'githubCustomPath', event: 'blur' }
    ];

    inputsToSave.forEach(item => {
        const element = getElement(item.id);
        if (element) {
            element.addEventListener(item.event, (e) => {
                let value = e.target.value;
                if (e.target.type === 'select-one' && item.stateKey === 'numImages') {
                    value = parseInt(value, 10) || 1;
                }
                 // Only log if value actually changed? Optional.
                // if (getState()[item.stateKey] !== value) {
                //    logToConsole(`Input ${item.id} (${item.event}) updated state.${item.stateKey}: ${value}`, 'debug');
                    updateState({ [item.stateKey]: value });
                // }
            });
        } else {
             logToConsole(`Element ${item.id} not found for listener setup.`, 'warn');
        }
    });

    // Action Buttons
    generateSingleBtn?.addEventListener('click', handleGenerateStructure);
    generatePlanBtn?.addEventListener('click', handleGeneratePlan);
}

// --- setupStep2Listeners ---
// No changes needed, logic seems sound. Ensure elements are cached.
function setupStep2Listeners() {
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
        const isInternal = !e.target.checked; // Checked = External, Unchecked = Internal
        updateState({ linkTypeInternal: isInternal });
        if (linkTypeText) {
             linkTypeText.textContent = isInternal ? 'Internal' : 'External';
        }
        logToConsole(`Link type toggled. Internal: ${isInternal}`, 'info');
    });

    articleTitleInput?.addEventListener('blur', (e) => { // Use blur
        updateState({ articleTitle: e.target.value });
         logToConsole(`Article Title input updated (on blur): ${e.target.value}`, 'info');
    });

    generateArticleBtn?.addEventListener('click', handleGenerateArticle);
}

// --- setupStep3Listeners ---
// No changes needed, logic seems sound. Ensure elements are cached.
function setupStep3Listeners() {
    const previewHtmlCheckbox = getElement('preview_html_checkbox');
    const generatedArticleTextarea = getElement('generated_article');
    const htmlPreviewDiv = getElement('html_preview');
    const enableSpinningBtn = getElement('enableSpinningBtn');
    const spunArticleDisplay = getElement('spun_article_display'); // Need for enabling step 4
    const step4Section = getElement('step4Section'); // Need for enabling step 4

    previewHtmlCheckbox?.addEventListener('change', (e) => {
        const showPreview = e.target.checked;
        showElement(generatedArticleTextarea, !showPreview);
        showElement(htmlPreviewDiv, showPreview);
        if (showPreview && htmlPreviewDiv && generatedArticleTextarea) {
            // Basic sanitation example - consider a more robust library if security is critical
            let unsafeHTML = generatedArticleTextarea.value;
            let sanitizedHTML = unsafeHTML.replace(/<script.*?>.*?<\/script>/gis, ''); // Remove script tags
             sanitizedHTML = sanitizedHTML.replace(/onerror=".*?"/gi, ''); // Remove onerror attributes
             sanitizedHTML = sanitizedHTML.replace(/onload=".*?"/gi, ''); // Remove onload attributes
             // Add more sanitation as needed
            htmlPreviewDiv.innerHTML = sanitizedHTML;
            logToConsole("Showing sanitized HTML preview.", "warn");
        }
    });

    enableSpinningBtn?.addEventListener('click', () => {
        if (spunArticleDisplay && generatedArticleTextarea && step4Section) {
            spunArticleDisplay.innerHTML = generatedArticleTextarea.value; // Copy content
            showElement(step4Section, true); // Show Step 4
            highlightSpintax(spunArticleDisplay); // Highlight existing spintax
            logToConsole("Spinning enabled, content copied to Step 4.", 'info');
            spunArticleDisplay.focus(); // Focus the editable area
        } else {
             logToConsole("Could not enable spinning - required elements missing.", 'error');
        }
    });
}

// --- setupStep4Listeners ---
// No changes needed, logic seems sound. Ensure elements are cached.
function setupStep4Listeners() {
    const spunArticleDisplay = getElement('spun_article_display');
    const spinSelectedBtn = getElement('spinSelectedBtn');

    // Use 'input' event for contenteditable changes, mouseup/keyup for selection
    spunArticleDisplay?.addEventListener('input', () => highlightSpintax(spunArticleDisplay)); // Re-highlight on edit
    spunArticleDisplay?.addEventListener('mouseup', handleSelection);
    spunArticleDisplay?.addEventListener('keyup', handleSelection);
    spunArticleDisplay?.addEventListener('focus', handleSelection); // Handle selection on focus too
    spinSelectedBtn?.addEventListener('click', handleSpinSelectedText);
}

// --- setupBulkModeListeners ---
// Added listener for table input changes to update the plan state.
function setupBulkModeListeners() {
    const startBulkGenerationBtn = getElement('startBulkGenerationBtn');
    const downloadBulkZipBtn = getElement('downloadBulkZipBtn');
    const planningTableBody = getElement('planningTableBody'); // Get tbody element

    startBulkGenerationBtn?.addEventListener('click', handleStartBulkGeneration);
    downloadBulkZipBtn?.addEventListener('click', handleDownloadZip);

    // Add event delegation for changes within the table body
    planningTableBody?.addEventListener('change', (e) => {
        // Check if the changed element is an INPUT within a row with a data-field attribute
        if (e.target.tagName === 'INPUT' && e.target.dataset.field) {
            const row = e.target.closest('tr');
            const rowIndex = row?.dataset.index;
            const field = e.target.dataset.field;
            const value = e.target.value;

            if (rowIndex !== undefined && field) {
                const index = parseInt(rowIndex, 10);
                 logToConsole(`Planning table input changed: Row ${index}, Field ${field}, Value: ${value}`, 'info');
                 // Update the specific item in the bulk plan state
                updateBulkPlanItem(index, { [field]: value });
                 // If slug changed, maybe update filename?
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp(); // Already loaded
}

console.log("article-main.js loaded (v8.2 fixes)");