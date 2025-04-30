// article-main.js
import { loadState, updateState, resetAllData } from './article-state.js';
import { logToConsole, checkApiStatus } from './article-helpers.js'; // Import checkApiStatus if needed here, or call from UI module
import {
    cacheDomElements, getElement, populateAiProviders, populateTextModels,
    populateImageModels, updateUIFromState, updateUIBasedOnMode, toggleCustomModelUI,
    populateLanguagesUI, populateDialectsUI, toggleGithubOptions
} from './article-ui.js';
import { handleGenerateStructure, handleGenerateArticle } from './article-single.js';
import { handleGeneratePlan, handleStartBulkGeneration, handleDownloadZip, prepareKeywords } from './article-bulk.js';
import { handleSpinSelectedText, handleSelection, highlightSpintax } from './article-spinner.js';
import { fetchAndParseSitemap } from './article-helpers.js'; // Assuming fetch is in helpers now

function initializeApp() {
    logToConsole("Initializing AI Article Generator v8...", "info");
    cacheDomElements(); // Cache all DOM elements once

    // Load initial state from storage
    const initialState = loadState();

    // Populate UI elements based on loaded state
    updateUIFromState(initialState); // This handles populating selects, setting values, etc.

    // --- Setup Event Listeners ---
    setupConfigurationListeners();
    setupStep1Listeners();
    setupStep2Listeners();
    setupStep3Listeners();
    setupStep4Listeners();
    setupBulkModeListeners();

    logToConsole("Application Initialized.", "success");
}

function setupConfigurationListeners() {
    const ui = { // Get specific elements needed for listeners
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
        // API status is checked inside populateTextModels
    });
    ui.aiModelSelect?.addEventListener('change', (e) => {
        updateState({ textModel: e.target.value });
        logToConsole(`Selected Text Model: ${e.target.value}`, 'info');
        checkApiStatus(); // Re-check status on model change
    });
    ui.useCustomAiModelCheckbox?.addEventListener('change', () => {
        toggleCustomModelUI('text');
        updateState({ useCustomTextModel: ui.useCustomAiModelCheckbox.checked }); // Save checkbox state
        checkApiStatus(); // Re-check status as model source changed
    });
    ui.customAiModelInput?.addEventListener('change', (e) => { // Use change event
        updateCustomModelState('text', getState().textProvider, e.target.value);
        updateState({ customTextModel: e.target.value }); // Also save to general state
        checkApiStatus(); // Re-check status with custom model
    });

     // Image AI Config
     ui.imageProviderSelect?.addEventListener('change', (e) => {
         updateState({ imageProvider: e.target.value });
         populateImageModels(true); // Set default model for new provider
     });
     ui.imageModelSelect?.addEventListener('change', (e) => {
         updateState({ imageModel: e.target.value });
         logToConsole(`Selected Image Model: ${e.target.value}`, 'info');
     });
     ui.useCustomImageModelCheckbox?.addEventListener('change', () => {
         toggleCustomModelUI('image');
         updateState({ useCustomImageModel: ui.useCustomImageModelCheckbox.checked });
     });
     ui.customImageModelInput?.addEventListener('change', (e) => {
         updateCustomModelState('image', getState().imageProvider, e.target.value);
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
        purposeCheckboxes: getElement('purposeCheckboxes'), // This is a NodeList
        purposeUrlInput: getElement('purposeUrl'),
        purposeCtaInput: getElement('purposeCta'),
        generateImagesCheckbox: getElement('generateImages'),
        imageStorageRadios: getElement('imageStorageRadios'), // NodeList
        fetchSitemapBtn: getElement('fetchSitemapBtn'),
        generateSingleBtn: getElement('generateSingleBtn'),
        generatePlanBtn: getElement('generatePlanBtn'),
        // Add listeners for all other input fields to save state on change
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
        updateState({ language: e.target.value, dialect: '' }); // Reset dialect on language change
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
    });
    ui.customToneInput?.addEventListener('change', (e) => updateState({ customTone: e.target.value }));

    // Purpose
    ui.purposeCheckboxes?.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selectedPurposes = Array.from(ui.purposeCheckboxes)
                                          .filter(cb => cb.checked)
                                          .map(cb => cb.value);
            updateState({ purpose: selectedPurposes });
            // Update visibility of related inputs
            const showUrl = selectedPurposes.includes('Promote URL');
            const showCta = selectedPurposes.some(p => p.startsWith('Promote') || p === 'Generate Leads');
            showElement(ui.purposeUrlInput, showUrl);
            showElement(ui.purposeCtaInput, showCta);
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
            populateImageModels(true); // Populate and set default when enabled
            toggleGithubOptions(); // Ensure GitHub options visibility is correct
        } else {
            showElement(getElement('githubOptionsContainer'), false); // Hide GitHub options if images disabled
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

    // --- Save other simple input values on change ---
    const inputsToSave = [
        'keywordInput', 'audienceInput', 'readerNameInput', 'genderSelect', 'ageSelect',
        'formatSelect', 'sitemapUrlInput', 'customSpecsInput', 'numImagesSelect',
        'imageAspectRatioSelect', 'imageSubjectInput', 'imageStyleSelect',
        'imageStyleModifiersInput', 'imageTextInput', 'githubRepoUrlInput', 'githubCustomPathInput'
    ];
    inputsToSave.forEach(key => {
        const element = ui[key];
        if (element) {
            element.addEventListener('change', (e) => {
                // Convert element key (e.g., 'keywordInput') to state key (e.g., 'keyword')
                let stateKey = key.replace(/Input$|Select$/, ''); // Remove suffix
                if (key === 'numImagesSelect') stateKey = 'numImages'; // Handle specific case
                if (key === 'genderSelect') stateKey = 'gender';
                if (key === 'ageSelect') stateKey = 'age';
                if (key === 'formatSelect') stateKey = 'format';
                 if (key === 'imageAspectRatioSelect') stateKey = 'imageAspectRatio';
                 if (key === 'imageStyleSelect') stateKey = 'imageStyle';

                updateState({ [stateKey]: e.target.value });
            });
        }
    });

    // Action Buttons
    ui.generateSingleBtn?.addEventListener('click', handleGenerateStructure);
    ui.generatePlanBtn?.addEventListener('click', handleGeneratePlan);
}

function setupStep2Listeners() {
     const ui = {
        toggleStructureVisibilityBtn: getElement('toggleStructureVisibility'),
        linkTypeToggle: getElement('linkTypeToggle'),
        linkTypeText: getElement('linkTypeText'),
        generateArticleBtn: getElement('generateArticleBtn'),
        articleTitleInput: getElement('articleTitle'), // Save title changes
        articleStructureTextarea: getElement('article_structure'), // Save structure changes? Maybe not auto-save this large field.
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

    // Generate Full Article Button (Single Mode)
    ui.generateArticleBtn?.addEventListener('click', handleGenerateArticle);
}

function setupStep3Listeners() {
    const ui = {
        previewHtmlCheckbox: getElement('preview_html_checkbox'),
        generatedArticleTextarea: getElement('generated_article'),
        htmlPreviewDiv: getElement('html_preview'),
        enableSpinningBtn: getElement('enableSpinningBtn'),
        step4Section: getElement('step4Section'),
    };

    ui.previewHtmlCheckbox?.addEventListener('change', (e) => {
        const showPreview = e.target.checked;
        showElement(ui.generatedArticleTextarea, !showPreview);
        showElement(ui.htmlPreviewDiv, showPreview);
        if (showPreview) {
            let unsafeHTML = ui.generatedArticleTextarea.value;
            // Basic script removal (consider a library for robust sanitization)
            let sanitizedHTML = unsafeHTML.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            ui.htmlPreviewDiv.innerHTML = sanitizedHTML;
            logToConsole("Showing HTML preview.", "warn");
        }
    });

    ui.enableSpinningBtn?.addEventListener('click', () => {
        const spunArticleDisplay = getElement('spun_article_display');
        spunArticleDisplay.innerHTML = ui.generatedArticleTextarea.value; // Copy content
        showElement(ui.step4Section, true); // Show spinner section
        highlightSpintax(spunArticleDisplay); // Highlight any existing spintax
        logToConsole("Spinning enabled.", 'info');
        // Hide Step 3 editing area and preview controls if needed
        // showElement(ui.generatedArticleTextarea, false);
        // showElement(ui.htmlPreviewDiv, false);
        // showElement(ui.previewHtmlCheckbox.parentElement, false);
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

    // Add listener for edits in the planning table
    ui.planningTableBody?.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.dataset.field) {
            const rowIndex = e.target.closest('tr')?.dataset.index;
            const field = e.target.dataset.field;
            const value = e.target.value;
            if (rowIndex !== undefined && field) {
                 // Update the specific field in the bulkPlan state
                 updateBulkPlanItem(parseInt(rowIndex, 10), { [field]: value });
                 logToConsole(`Updated plan item ${rowIndex}, field ${field}.`, 'info');
                 // Optionally re-slugify if title changed? Or let user manage slug?
                 // if (field === 'title') {
                 //    const newSlug = slugify(value);
                 //    updateBulkPlanItem(parseInt(rowIndex, 10), { slug: newSlug });
                 //    // Update the slug input field in the UI as well
                 //    const slugInput = e.target.closest('tr').querySelector('input[data-field="slug"]');
                 //    if (slugInput) slugInput.value = newSlug;
                 // }
            }
        }
    });
}


// --- Initialize ---
document.addEventListener('DOMContentLoaded', initializeApp);

console.log("article-main.js loaded");