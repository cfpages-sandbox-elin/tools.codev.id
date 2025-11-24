// article-single.js (v9.10 powerful step 3)
import { getState, updateState } from './article-state.js';
import { logToConsole, callAI, getArticleOutlinesV2, constructImagePrompt, sanitizeFilename, slugify, showLoading, disableElement, delay, showElement } from './article-helpers.js';
import { getElement, updateProgressBar, hideProgressBar, updateStructureCountDisplay, updateCounts } from './article-ui.js';
import { languageOptions } from './article-config.js';
import { getSingleTitlePrompt, getSingleStructurePrompt, getSingleSectionTextPrompt } from './article-prompts.js';


let singleModeImagesToUpload = [];

// --- Generate Structure (and Title if needed) ---
export async function handleGenerateStructure() {
    logToConsole("handleGenerateStructure called", "info");
    const state = getState();
    const primaryProvider = state.textProviders[0];
    if (!primaryProvider || !primaryProvider.provider || !primaryProvider.model) {
        alert("Please configure a valid AI Provider and select a model in the 'AI Configuration' section.");
        logToConsole("Single generation failed: No primary provider configured.", "error");
        return;
    }
    const ui = {
        keywordInput: getElement('keywordInput'),
        articleTitleInput: getElement('articleTitleInput'),
        articleStructureTextarea: getElement('articleStructureTextarea'),
        step2Section: getElement('step2Section'),
        structureContainer: getElement('structureContainer'),
        toggleStructureVisibilityBtn: getElement('toggleStructureVisibilityBtn'),
        step3Section: getElement('step3Section'),
        step4Section: getElement('step4Section'),
        loadingIndicator: getElement('structureLoadingIndicator'),
        button: getElement('generateSingleBtn'),
    };

    if (!ui.articleTitleInput || !ui.articleStructureTextarea || !ui.button ) {
        logToConsole("Missing critical elements (title input, structure textarea, or button). Cannot proceed.", "error");
        alert("Error: Could not find necessary input fields or button.");
        return;
    }

    let articleTitle = ui.articleTitleInput.value.trim();
    if (!articleTitle) {
        logToConsole('Article title is blank, generating one...', 'info');
        const titlePrompt = getSingleTitlePrompt();
        const titlePayload = { 
            providerKey: primaryProvider.provider, 
            model: primaryProvider.model, 
            prompt: titlePrompt 
        };
        
        showLoading(ui.loadingIndicator, true); disableElement(ui.button, true);
        const titleResult = await callAI('generate', titlePayload, null, null);
        showLoading(ui.loadingIndicator, false);

        if (titleResult?.success && titleResult.text) {
            articleTitle = titleResult.text.trim().replace(/^"|"$/g, '');
            logToConsole(`Generated Title: ${articleTitle}`, 'success');
            ui.articleTitleInput.value = articleTitle;
            updateState({ articleTitle: articleTitle });
        } else {
            logToConsole('Failed to generate article title.', 'error');
            alert('Failed to generate article title. Please provide one manually or try again.');
            disableElement(ui.button, false);
            return;
        }
    } else {
        updateState({ articleTitle: articleTitle });
    }

    logToConsole("Clearing previous structure...", "info");
    ui.articleStructureTextarea.value = '';
    updateState({ articleStructure: '' });
    updateStructureCountDisplay('');

    logToConsole('Generating article structure...', 'info');
    const structurePrompt = getSingleStructurePrompt(articleTitle);
    const structurePayload = { 
        providerKey: primaryProvider.provider, 
        model: primaryProvider.model, 
        prompt: structurePrompt 
    };
    showLoading(ui.loadingIndicator, true); disableElement(ui.button, true);
    const structureResult = await callAI('generate', structurePayload, null, null);
    showLoading(ui.loadingIndicator, false); disableElement(ui.button, false);

    if (structureResult?.success && structureResult.text) {
        const generatedStructure = structureResult.text;
        logToConsole('Structure generated successfully.', 'success');
        ui.articleStructureTextarea.value = generatedStructure;
        updateState({ articleStructure: generatedStructure });
        updateStructureCountDisplay(generatedStructure);

        showElement(getElement('step2Section'), true);
        showElement(getElement('structureContainer'), true);
        const toggleBtn = getElement('toggleStructureVisibilityBtn');
        if(toggleBtn) toggleBtn.textContent = 'Hide';
        showElement(getElement('step3Section'), false);
        showElement(getElement('step4Section'), false);
    } else {
        logToConsole('Failed to generate structure.', 'error');
        alert(`Failed to generate structure. Error: ${structureResult?.error || 'Unknown error'}`);
        showElement(getElement('step2Section'), false);
        updateStructureCountDisplay('');
    }
}

// --- Generate Full Article (Single Mode - Incremental) ---
export async function handleGenerateArticle() {
    const state = getState();
    const primaryProvider = state.textProviders[0];
    if (!primaryProvider || !primaryProvider.provider || !primaryProvider.model) {
        alert("Please configure a valid AI Provider and select a model in the 'AI Configuration' section.");
        logToConsole("Single generation failed: No primary provider configured.", "error");
        return;
    }

    const ui = {
        articleStructureTextarea: getElement('articleStructureTextarea'),
        generatedArticleTextarea: getElement('generatedArticleTextarea'),
        generationProgressDiv: getElement('generationProgressDiv'),
        currentSectionNumSpan: getElement('currentSectionNumSpan'),
        totalSectionNumSpan: getElement('totalSectionNumSpan'),
        uploadProgressContainer: getElement('uploadProgressContainer'),
        uploadProgressText: getElement('uploadProgressText'),
        uploadProgressBar: getElement('uploadProgressBar'),
        step3Section: getElement('step3Section'),
        step4Section: getElement('step4Section'),
        previewHtmlCheckbox: getElement('previewHtmlCheckbox'),
        htmlPreviewDiv: getElement('htmlPreviewDiv'),
        loadingIndicator: getElement('articleLoadingIndicator'),
        button: getElement('generateArticleBtn'),
        articleTitleInput: getElement('articleTitleInput'),
    };

    if (!ui.articleStructureTextarea || !ui.generatedArticleTextarea || !ui.articleTitleInput || !ui.button) { logToConsole("Missing essential UI elements for article generation.", "error"); alert("Error: Cannot generate article due to missing UI components."); return; }
    
    const structure = ui.articleStructureTextarea.value.trim();
    if (!structure) { alert('Article structure is empty.'); return; }
    const outlineSections = getArticleOutlinesV2(structure);
    if (outlineSections.length === 0) { alert('Could not parse primary sections from the structure.'); return; }

    // Reset UI and state
    ui.generatedArticleTextarea.value = '';
    updateState({ generatedArticleContent: '' }); // Clear saved content state
    updateCounts(''); // Reset counts visually
    singleModeImagesToUpload = [];
    let previousSectionContent = '';
    let combinedArticleContent = ''; // Use this to build the full text
    const doImageGeneration = state.generateImages;
    const imageStorageType = doImageGeneration ? state.imageStorage : 'none';
    const outputFormat = state.format;
    const articleTitle = ui.articleTitleInput.value.trim() || state.keyword || 'untitled-article';

    // Setup Progress Indicators
    showElement(ui.generationProgressDiv, true);
    if(ui.totalSectionNumSpan) ui.totalSectionNumSpan.textContent = outlineSections.length;
    hideProgressBar(getElement('uploadProgressBar'), getElement('uploadProgressContainer'), getElement('uploadProgressText'));
    disableElement(ui.button, true);
    showLoading(getElement('articleLoadingIndicator'), true);

    try {
        for (let i = 0; i < outlineSections.length; i++) {
            const section = outlineSections[i];
            if(ui.currentSectionNumSpan) ui.currentSectionNumSpan.textContent = i + 1;
            logToConsole(`Processing Section ${i+1}/${outlineSections.length}: "${section.heading}"`, 'info');

            const textPrompt = getSingleSectionTextPrompt(section, previousSectionContent, articleTitle);
            const textPayload = { 
                providerKey: primaryProvider.provider, 
                model: primaryProvider.model, 
                prompt: textPrompt 
            };
            
            const textResult = await callAI('generate', textPayload, null, null);
            if (!textResult?.success || !textResult.text) { throw new Error(`Text generation failed for section ${i + 1} ("${section.heading}"): ${textResult?.error || 'No text returned'}`); }

            const currentSectionText = textResult.text.trim() + (outputFormat === 'html' ? '\n\n' : '\n\n');
            combinedArticleContent += currentSectionText; // Append to combined content
            ui.generatedArticleTextarea.value = combinedArticleContent;
            ui.generatedArticleTextarea.dispatchEvent(new Event('input'));
            updateState({ generatedArticleContent: combinedArticleContent });
            updateCounts(combinedArticleContent);

            previousSectionContent = currentSectionText;

            // --- Generate Image ---
            let imagePlaceholder = '';
            if (doImageGeneration) {
                logToConsole(`Generating image for section "${section.heading}"...`, 'info');
                const imagePayload = buildSingleImagePayload(currentSectionText, section.heading, articleTitle, i + 1);
                const imageResult = await callAI('generate_image', imagePayload, null, null);
                if (imageResult?.success && imageResult.imageData) {
                    const filename = imagePayload.filename;
                    const altText = `Image for ${section.heading.substring(0, 50)}`;
                    const placeholderId = `img-placeholder-${filename.replace(/\./g, '-')}`;
                    if (imageStorageType === 'github') {
                        singleModeImagesToUpload.push({ filename: filename, base64: imageResult.imageData, placeholderId: placeholderId });
                        imagePlaceholder = outputFormat === 'html' ? `<div id="${placeholderId}">[Uploading image: ${filename}...]</div>\n\n` : `[Uploading image: ${filename}...]\n\n`;
                        logToConsole(`Image ${filename} queued for GitHub upload.`, 'info');
                    } else {
                        imagePlaceholder = outputFormat === 'html' ? `<img src="data:image/png;base64,${imageResult.imageData}" alt="${altText}" class="mx-auto my-4 rounded shadow">\n\n` : `![${altText}](data:image/png;base64,${imageResult.imageData})\n\n`;
                        logToConsole(`Image for section ${i + 1} embedded as base64.`, 'success');
                    }
                    combinedArticleContent += imagePlaceholder;
                    ui.generatedArticleTextarea.value = combinedArticleContent;
                    ui.generatedArticleTextarea.dispatchEvent(new Event('input'));
                    updateState({ generatedArticleContent: combinedArticleContent });
                    updateCounts(combinedArticleContent);

                } else {
                    logToConsole(`Failed image gen section ${i + 1}. Error: ${imageResult?.error || 'Unknown'}`, 'warn');
                    imagePlaceholder = outputFormat === 'html' ? `\n\n<!-- Image generation failed -->\n\n` : `\n\n[Image generation failed]\n\n`;
                    combinedArticleContent += imagePlaceholder;
                    ui.generatedArticleTextarea.value = combinedArticleContent;
                    ui.generatedArticleTextarea.dispatchEvent(new Event('input'));
                    updateState({ generatedArticleContent: combinedArticleContent });
                    updateCounts(combinedArticleContent);
                }
            }
            ui.generatedArticleTextarea.scrollTop = ui.generatedArticleTextarea.scrollHeight;
            await delay(200);
        } // End section loop

        // Final update just in case
        updateCounts(combinedArticleContent);

        showElement(ui.generationProgressDiv, false); // Uses imported showElement implicitly

        if (imageStorageType === 'github' && singleModeImagesToUpload.length > 0) { await uploadSingleImagesToGithub(); }
        else { hideProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText); }

        if (combinedArticleContent) {
            showElement(ui.step3Section, true); // Uses imported showElement implicitly
            showElement(ui.step4Section, false); // Uses imported showElement implicitly
            const isHtml = outputFormat === 'html';
            if(ui.previewHtmlCheckbox) { ui.previewHtmlCheckbox.checked = false; disableElement(ui.previewHtmlCheckbox, !isHtml); showElement(ui.previewHtmlCheckbox.parentElement, isHtml); } // Uses imported showElement implicitly
            showElement(ui.generatedArticleTextarea, true); // Uses imported showElement implicitly
            showElement(ui.htmlPreviewDiv, false); // Uses imported showElement implicitly
            if(ui.htmlPreviewDiv) ui.htmlPreviewDiv.innerHTML = '';
            logToConsole('Single article generation process complete.', 'success');
        } else { logToConsole('Single article generation finished but produced no content.', 'warn'); }

    } catch (error) {
        logToConsole(`Error during article generation: ${error.message}`, 'error');
        alert(`Article generation failed: ${error.message}`);
        showElement(ui.generationProgressDiv, false); // Uses imported showElement implicitly
        hideProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText);
    } finally {
        showLoading(ui.loadingIndicator, false); // Uses showElement internally
        disableElement(ui.button, false);
    }
}


// --- Build Payload Functions (Single Mode Specific Helpers) ---
function buildSingleImagePayload(sectionContent, sectionHeading, articleTitle, sectionIndex) {
    const state = getState();
    const baseFilename = sanitizeFilename(`${slugify(articleTitle)}-${slugify(sectionTitle)}`);
    const filename = `${baseFilename}-${Date.now()}-${sectionIndex}.png`;
    const imageSettings = {
        imageSubject: state.imageSubject,
        imageStyle: state.imageStyle,
        imageStyleModifiers: state.imageStyleModifiers,
        imageText: state.imageText
    };
    const imagePrompt = constructImagePrompt(sectionContent, sectionTitle, imageSettings);

    const imageModel = state.useCustomImageModel ? state.customImageModel : state.imageModel;

    return {
        providerKey: state.imageProvider,
        model: imageModel,
        prompt: imagePrompt,
        filename: filename,
        aspectRatio: state.imageAspectRatio,
    };
}


// --- GitHub Image Upload Function (Single Mode Helper) ---
async function uploadSingleImagesToGithub() {
    const state = getState();
    const ui = {
        // Use getElement for safety
        githubRepoUrlInput: getElement('githubRepoUrlInput'),
        githubCustomPathInput: getElement('githubCustomPathInput'),
        uploadProgressContainer: getElement('uploadProgressContainer'),
        uploadProgressBar: getElement('uploadProgressBar'),
        uploadProgressText: getElement('uploadProgressText'),
        generatedArticleTextarea: getElement('generatedArticleTextarea'),
    };

    if (singleModeImagesToUpload.length === 0 || !ui.uploadProgressContainer || !ui.uploadProgressBar || !ui.uploadProgressText || !ui.generatedArticleTextarea) {
        logToConsole("Skipping GitHub upload: No images or missing UI elements.", "warn");
        return;
    }

    const repoUrl = state.githubRepoUrl; // Repo URL from state
    if (!repoUrl) { logToConsole("GitHub Repo URL is missing in state.", "error"); alert("GitHub Repo URL is required for upload."); return; }

    // Basic validation of URL format
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch || urlMatch.length < 3) { logToConsole(`Invalid GitHub Repo URL format: ${repoUrl}`, "error"); alert("Invalid GitHub Repo URL format."); return; }
    const owner = urlMatch[1];
    const repo = urlMatch[2].replace(/\.git$/, ''); // Remove trailing .git if present

    const repoDomain = `${owner.toLowerCase()}.github.io`; // Common convention for Pages, adjust if needed
    // Or maybe use the direct raw content URL pattern? Decide based on usage.
    // const rawContentBase = `https://raw.githubusercontent.com/${owner}/${repo}/main`; // Needs branch name

    const customPath = state.githubCustomPath; // Custom path from state
    let basePath;
    if (customPath) {
        basePath = (customPath.startsWith('/') ? customPath.substring(1) : customPath).replace(/\/$/, '') + '/'; // Ensure trailing slash, remove leading
    } else {
        // Fallback to language default path
        const langKey = Object.keys(languageOptions).find(key => languageOptions[key].name === state.language || key === state.language) || 'English';
        basePath = (languageOptions[langKey]?.defaultPath || 'articles/').replace(/^\//, '').replace(/\/$/, '') + '/'; // Ensure trailing slash, remove leading
    }

    logToConsole(`Starting GitHub upload (Single Mode) to ${owner}/${repo}, Path: /${basePath}...`, 'info');
    updateProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText, 0, singleModeImagesToUpload.length, 'Uploading image ');

    let uploadedCount = 0;
    const totalImages = singleModeImagesToUpload.length;

    for (let i = 0; i < totalImages; i++) {
        const img = singleModeImagesToUpload[i];
        updateProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText, i, totalImages, `Uploading ${img.filename} (${i + 1}/${totalImages}) `);
        const fullPath = basePath + img.filename; // e.g., 'articles/my-image.png'
        const payload = {
            owner: owner,
            repo: repo,
            path: fullPath,
            content: img.base64, // Just the base64 data
            message: `Upload image: ${img.filename} via AI Tool`
        };

        const result = await callAI('upload_image', payload, null, null); // Backend handles GitHub API call

        if (result?.success && result.download_url) {
            const finalImageUrl = result.download_url;
            logToConsole(`Uploaded ${img.filename}. URL: ${finalImageUrl}`, 'success');
            replacePlaceholderInTextarea(ui.generatedArticleTextarea, img.placeholderId, img.filename, finalImageUrl, state.format);
            uploadedCount++;
        } else {
            logToConsole(`Failed to upload ${img.filename}. Error: ${result?.error || 'Unknown'}`, 'error');
            replacePlaceholderInTextarea(ui.generatedArticleTextarea, img.placeholderId, img.filename, null, state.format, true); // Indicate error
        }
        // Update visual progress (already handled by updateProgressBar in loop start)
    }

    if (ui.uploadProgressText) { // Check element exists
        ui.uploadProgressText.textContent = `Upload complete (${uploadedCount}/${totalImages} successful).`;
    }
    logToConsole(`GitHub upload process finished (Single Mode). ${uploadedCount}/${totalImages} successful.`, 'info');

    // Optionally hide the progress bar after a short delay
    setTimeout(() => {
        hideProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText);
    }, 3000);
}

// Helper to replace placeholder (moved from v7 bulk)
function replacePlaceholderInTextarea(textarea, placeholderId, filename, finalImageUrl, format, isError = false) {
    if (!textarea) return;

    const placeholderDivRegex = new RegExp(`<div\\s+id="${placeholderId.replace(/-/g, '\\-')}">.*?</div>`, 'is'); // More robust div regex
    const placeholderTextRegex = new RegExp(`\\[Uploading image:\\s*${filename.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\.\\.\\.\\]`, 'g'); // Escape filename for regex

    let replacementText;

    if (isError) {
        replacementText = format === 'html' ? `<!-- Upload failed: ${filename} -->` : `[Upload failed: ${filename}]`;
    } else if (finalImageUrl) { // Ensure URL exists
        replacementText = format === 'html'
            ? `<img src="${finalImageUrl}" alt="${filename}" class="mx-auto my-4 rounded shadow">`
            : `![${filename}](${finalImageUrl})`;
    } else {
        // Should not happen if not error, but fallback just in case
        replacementText = format === 'html' ? `<!-- Image URL missing: ${filename} -->` : `[Image URL missing: ${filename}]`;
    }

    let replaced = false;
    if (format === 'html' && textarea.value.includes(placeholderId)) {
         textarea.value = textarea.value.replace(placeholderDivRegex, replacementText);
         replaced = true;
    }
    if (!replaced) {
        const originalLength = textarea.value.length;
        textarea.value = textarea.value.replace(placeholderTextRegex, replacementText);
        if (textarea.value.length !== originalLength) replaced = true;
    }
    // *** FIX: Update counts after placeholder is replaced ***
    if (replaced) {
        updateCounts(textarea.value);
        updateState({ generatedArticleContent: textarea.value }); // Also update state
    }
}

console.log("article-single.js loaded (v8.24 fix generate)");