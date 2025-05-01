// article-main.js
import { loadState, updateState, resetAllData, getCustomModelState, updateCustomModelState } from './article-state.js'; // Added state functions
import { logToConsole } from './article-helpers.js'; // Removed checkApiStatus (called via UI)
import {
    cacheDomElements, getElement, populateAiProviders, populateTextModels,
    populateImageModels, updateUIFromState, updateUIBasedOnMode, toggleCustomModelUI,
    populateLanguagesUI, populateDialectsUI, toggleGithubOptions, checkApiStatus // Import checkApiStatus here
} from './article-ui.js';
import { handleGenerateStructure, handleGenerateArticle } from './article-single.js';
import { handleGeneratePlan, handleStartBulkGeneration, handleDownloadZip } from './article-bulk.js'; // Removed prepareKeywords (used internally)
import { handleSpinSelectedText, handleSelection, highlightSpintax } from './article-spinner.js';
import { fetchAndParseSitemap } from './article-helpers.js'; // Keep this import

function initializeApp() {
    logToConsole("Initializing AI Article Generator v8...", "info");
    cacheDomElements();

    // Load initial state from storage
    const initialState = loadState();

    // Populate UI elements based on loaded state
    updateUIFromState(initialState); // Handles populating selects, setting values, etc.

    // Setup Event Listeners
    setupConfigurationListeners();
    setupStep1Listeners();
    setupStep2Listeners();
    setupStep3Listeners();
    setupStep4Listeners();
    setupBulkModeListeners();

    logToConsole("Application Initialized.", "success");
}

function setupConfigurationListeners() {
    const ui = {
        aiProviderSelect: getElement('ai_provider'),
        aiModelSelect: getElement('ai_model'),
        useCustomAiModelCheckbox: getElement('useCustomAiModel'),
        customAiModelInput: getElement('customAiModel'),
        imageProviderSelect: getElement('imageProvider'),
        imageModelSelect: getElement('imageModel'),
        useCustomImageModelCheckbox: getElement('useCustomImageModel'),
        customImageModelInput: getElement('customImageModel'),
        resetDataBtn: getElement('resetDataBtn'),
    };

    // AI Config
    ui.aiProviderSelect?.addEventListener('change', (e) => {
        updateState({ textProvider: e.target.value });
        populateTextModels(true); // Set default model for new provider
    });
    ui.aiModelSelect?.addEventListener('change', (e) => {
        updateState({ textModel: e.target.value });
        logToConsole(`Selected Text Model: ${e.target.value}`, 'info');
        checkApiStatus();
    });
    ui.useCustomAiModelCheckbox?.addEventListener('change', () => {
        toggleCustomModelUI('text');
        const isChecked = getElement('useCustomAiModel').checked; // Read current state
        updateState({ useCustomTextModel: isChecked });
        if (!isChecked) { // If switching back to standard, update state with selected standard model
             updateState({ textModel: getElement('ai_model').value });
        } else { // If switching to custom, update state with custom input value
            updateState({ customTextModel: getElement('customAiModel').value });
        }
        checkApiStatus();
    });
    ui.customAiModelInput?.addEventListener('change', (e) => {
        const provider = getState().textProvider;
        updateCustomModelState('text', provider, e.target.value); // Update storage
        updateState({ customTextModel: e.target.value }); // Update app state
        checkApiStatus();
    });

     // Image AI Config
     ui.imageProviderSelect?.addEventListener('change', (e) => {
         updateState({ imageProvider: e.target.value });
         populateImageModels(true);
     });
     ui.imageModelSelect?.addEventListener('change', (e) => {
         updateState({ imageModel: e.target.value });
         logToConsole(`Selected Image Model: ${e.target.value}`, 'info');
     });
     ui.useCustomImageModelCheckbox?.addEventListener('change', () => {
         toggleCustomModelUI('image');
         const isChecked = getElement('useCustomImageModel').checked;
         updateState({ useCustomImageModel: isChecked });
          if (!isChecked) { updateState({ imageModel: getElement('imageModel').value }); }
          else { updateState({ customImageModel: getElement('customImageModel').value }); }
     });
     ui.customImageModelInput?.addEventListener('change', (e) => {
         const provider = getState().imageProvider;
         updateCustomModelState('image', provider, e.target.value);
         updateState({ customImageModel: e.target.value });
     });

     // Reset Button
     ui.resetDataBtn?.addEventListener('click', resetAllData);
}

function setupStep1Listeners() {
     const ui = {
        bulkModeCheckbox: getElement('bulkModeCheckbox'),
        languageSelect: getElement('language'),
        customLanguageInput: getElement('custom_language'),
        dialectSelect: getElement('dialect'),
        toneSelect: getElement('tone'),
        customToneInput: getElement('custom_tone'),
        purposeCheckboxes: getElement('purposeCheckboxes'),
        purposeUrlInput: getElement('purposeUrl'),
        purposeCtaInput: getElement('purposeCta'),
        generateImagesCheckbox: getElement('generateImages'),
        imageStorageRadios: getElement('imageStorageRadios'),
        fetchSitemapBtn: getElement('fetchSitemapBtn'),
        generateSingleBtn: getElement('generateSingleBtn'),
        generatePlanBtn: getElement('generatePlanBtn'),
        keywordInput: getElement('keyword'),
        audienceInput: getElement('audience'),
        readerNameInput: getElement('readerName'),
        genderSelect: getElement('gender'),
        ageSelect: getElement('age'),
        formatSelect: getElement('format'),
        sitemapUrlInput: getElement('sitemapUrl'),
        customSpecsInput: getElement('custom_specs'),
        numImagesSelect: getElement('numImages'),
        imageAspectRatioSelect: getElement('imageAspectRatio'),
        imageSubjectInput: getElement('imageSubject'),
        imageStyleSelect: getElement('imageStyle'),
        imageStyleModifiersInput: getElement('imageStyleModifiers'),
        imageTextInput: getElement('imageText'),
        githubRepoUrlInput: getElement('githubRepoUrl'),
        githubCustomPathInput: getElement('githubCustomPath'),
    };

    // Mode Toggle
    ui.bulkModeCheckbox?.addEventListener('change', (e) => {
        const isBulk = e.target.checked;
        updateState({ bulkMode: isBulk });
        updateUIBasedOnMode(isBulk);
    });

    // Language/Dialect
    ui.languageSelect?.addEventListener('change', (e) => {
        updateState({ language: e.target.value, dialect: '' });
        populateDialectsUI();
    });
    ui.customLanguageInput?.addEventListener('change', (e) => updateState({ customLanguage: e.target.value }));
    ui.dialectSelect?.addEventListener('change', (e) => updateState({ dialect: e.target.value }));

    // Tone
    ui.toneSelect?.addEventListener('change', (e) => {
        const showCustom = e.target.value === 'custom';
        showElement(ui.customToneInput, showCustom);
        ui.customToneInput.classList.toggle('custom-input-visible', showCustom);
        updateState({ tone: e.target.value });
        if (!showCustom) updateState({ customTone: '' }); // Clear custom if standard selected
    });
    ui.customToneInput?.addEventListener('change', (e) => updateState({ customTone: e.target.value }));

    // Purpose
    ui.purposeCheckboxes?.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedPurposes = Array.from(document.querySelectorAll('input[name="purpose"]')) // Re-query inside listener
                                          .filter(cb => cb.checked)
                                          .map(cb => cb.value);
            updateState({ purpose: selectedPurposes });
            const showUrl = selectedPurposes.includes('Promote URL');
            const showCta = selectedPurposes.some(p => p.startsWith('Promote') || p === 'Generate Leads');
            showElement(ui.purposeUrlInput, showUrl);
            showElement(ui.purposeCtaInput, showCta);
            if (!showUrl) updateState({ purposeUrl: '' }); // Clear if hidden
            if (!showCta) updateState({ purposeCta: '' }); // Clear if hidden
        });
    });
    ui.purposeUrlInput?.addEventListener('change', (e) => updateState({ purposeUrl: e.target.value }));
    ui.purposeCtaInput?.addEventListener('change', (e) => updateState({ purposeCta: e.target.value }));

    // Image Generation Toggle
    ui.generateImagesCheckbox?.addEventListener('change', (e) => {
        const generate = e.target.checked;
        updateState({ generateImages: generate });
        showElement(getElement('imageOptionsContainer'), generate);
        if (generate) {
            populateImageModels(true);
            toggleGithubOptions();
        } else {
            showElement(getElement('githubOptionsContainer'), false);
        }
    });

    // Image Storage Toggle
    ui.imageStorageRadios?.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                updateState({ imageStorage: e.target.value });
                toggleGithubOptions();
            }
        });
    });

    // Sitemap Fetch
    ui.fetchSitemapBtn?.addEventListener('click', fetchAndParseSitemap);

    // Save other simple input values on change
    const inputsToSave = [
        { id: 'keywordInput', stateKey: 'keyword' }, { id: 'audienceInput', stateKey: 'audience' },
        { id: 'readerNameInput', stateKey: 'readerName' }, { id: 'genderSelect', stateKey: 'gender' },
        { id: 'ageSelect', stateKey: 'age' }, { id: 'formatSelect', stateKey: 'format' },
        { id: 'sitemapUrlInput', stateKey: 'sitemapUrl' }, { id: 'customSpecsInput', stateKey: 'customSpecs' },
        { id: 'numImagesSelect', stateKey: 'numImages' }, { id: 'imageAspectRatioSelect', stateKey: 'imageAspectRatio' },
        { id: 'imageSubjectInput', stateKey: 'imageSubject' }, { id: 'imageStyleSelect', stateKey: 'imageStyle' },
        { id: 'imageStyleModifiersInput', stateKey: 'imageStyleModifiers' }, { id: 'imageTextInput', stateKey: 'imageText' },
        { id: 'githubRepoUrlInput', stateKey: 'githubRepoUrl' }, { id: 'githubCustomPathInput', stateKey: 'githubCustomPath' }
    ];
    inputsToSave.forEach(item => {
        const element = getElement(item.id);
        if (element) {
            element.addEventListener('change', (e) => {
                let value = e.target.value;
                // Ensure numImages is stored as a number
                if (item.stateKey === 'numImages') {
                    value = parseInt(value, 10) || 1;
                }
                updateState({ [item.stateKey]: value });
            });
        }
    });

    // Action Buttons
    ui.generateSingleBtn?.addEventListener('click', handleGenerateStructure);
    ui.generatePlanBtn?.addEventListener('click', handleGeneratePlan);
}

function setupStep2Listeners() {
     const ui = {
        toggleStructureVisibilityBtn: getElement('toggleStructureVisibilityBtn'),
        linkTypeToggle: getElement('linkTypeToggle'),
        linkTypeText: getElement('linkTypeText'),
        generateArticleBtn: getElement('generateArticleBtn'),
        articleTitleInput: getElement('articleTitle'),
    };

    ui.toggleStructureVisibilityBtn?.addEventListener('click', () => {
        const structureContainer = getElement('structureContainer');
        const isHidden = structureContainer.classList.toggle('hidden');
        ui.toggleStructureVisibilityBtn.textContent = isHidden ? 'Show' : 'Hide';
    });

    ui.linkTypeToggle?.addEventListener('change', (e) => {
        const isInternal = !e.target.checked;
        updateState({ linkTypeInternal: isInternal });
        ui.linkTypeText.textContent = isInternal ? 'Internal' : 'External';
    });

    ui.articleTitleInput?.addEventListener('change', (e) => {
         updateState({ articleTitle: e.target.value }); // Save single article title if user edits it
    });

    ui.generateArticleBtn?.addEventListener('click', handleGenerateArticle);
}

function setupStep3Listeners() {
    const ui = {
        previewHtmlCheckbox: getElement('preview_html_checkbox'),
        generatedArticleTextarea: getElement('generated_article'),
        htmlPreviewDiv: getElement('html_preview'),
        enableSpinningBtn: getElement('enableSpinningBtn'),
    };

    ui.previewHtmlCheckbox?.addEventListener('change', (e) => {
        const showPreview = e.target.checked;
        showElement(ui.generatedArticleTextarea, !showPreview);
        showElement(ui.htmlPreviewDiv, showPreview);
        if (showPreview) {
            let unsafeHTML = ui.generatedArticleTextarea.value;
            let sanitizedHTML = unsafeHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            ui.htmlPreviewDiv.innerHTML = sanitizedHTML;
            logToConsole("Showing HTML preview.", "warn");
        }
    });

    ui.enableSpinningBtn?.addEventListener('click', () => {
        const spunArticleDisplay = getElement('spun_article_display');
        const step4Section = getElement('step4Section');
        spunArticleDisplay.innerHTML = ui.generatedArticleTextarea.value;
        showElement(step4Section, true);
        highlightSpintax(spunArticleDisplay);
        logToConsole("Spinning enabled.", 'info');
    });
}

function setupStep4Listeners() {
     const ui = {
        spunArticleDisplay: getElement('spun_article_display'),
        spinSelectedBtn: getElement('spinSelectedBtn'),
    };
    ui.spunArticleDisplay?.addEventListener('mouseup', handleSelection);
    ui.spunArticleDisplay?.addEventListener('keyup', handleSelection);
    ui.spunArticleDisplay?.addEventListener('focus', handleSelection);
    ui.spinSelectedBtn?.addEventListener('click', handleSpinSelectedText);
}

function setupBulkModeListeners() {
     const ui = {
        startBulkGenerationBtn: getElement('startBulkGenerationBtn'),
        downloadBulkZipBtn: getElement('downloadBulkZipBtn'),
        planningTableBody: getElement('planningTableBody'),
    };

    ui.startBulkGenerationBtn?.addEventListener('click', handleStartBulkGeneration);
    ui.downloadBulkZipBtn?.addEventListener('click', handleDownloadZip);

    // Listener for edits in the planning table
    ui.planningTableBody?.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.dataset.field) {
            const rowIndex = e.target.closest('tr')?.dataset.index;
            const field = e.target.dataset.field;
            const value = e.target.value;
            if (rowIndex !== undefined && field) {
                 updateBulkPlanItem(parseInt(rowIndex, 10), { [field]: value });
                 logToConsole(`Updated plan item ${rowIndex}, field ${field}.`, 'info');
            }
        }
    });
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', initializeApp);

console.log("article-main.js loaded");