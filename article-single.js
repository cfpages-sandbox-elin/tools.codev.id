// article-single.js (v8.9 Title Input Check Fix)
import { getState, updateState } from './article-state.js';
import { logToConsole, callAI, getArticleOutlines, constructImagePrompt, sanitizeFilename, slugify, showLoading, disableElement } from './article-helpers.js'; // Import helpers including UI ones
import { getElement, updateProgressBar, hideProgressBar, updateUIFromState } from './article-ui.js'; // Import getElement and progress helpers
import { languageOptions } from './article-config.js'; // Needed for GitHub path logic


let singleModeImagesToUpload = []; // State specific to single mode image uploads

// --- Generate Structure (and Title if needed) ---
export async function handleGenerateStructure() {
    logToConsole("handleGenerateStructure called", "info"); // Add entry log
    const state = getState();
    const ui = {
        keywordInput: getElement('keywordInput'),
        articleTitleInput: getElement('articleTitleInput'), // JS Key
        articleStructureTextarea: getElement('articleStructureTextarea'), // JS Key 'article_structure'
        step2Section: getElement('step2Section'),
        structureContainer: getElement('structureContainer'),
        toggleStructureVisibilityBtn: getElement('toggleStructureVisibilityBtn'), // JS Key 'toggleStructureVisibility'
        step3Section: getElement('step3Section'),
        step4Section: getElement('step4Section'),
        loadingIndicator: getElement('structureLoadingIndicator'),
        button: getElement('generateSingleBtn'),
    };

    // --- *** FIX: Add safety check for ui.articleTitleInput *** ---
    if (!ui.articleTitleInput) {
        logToConsole("Article title input element not found. Cannot proceed with structure generation.", "error");
        alert("Error: Could not find the article title input field.");
        return; // Stop execution if the element is missing
    }
    // --- End Fix ---

    // --- 1. Generate Title (if blank) ---
    let articleTitle = ui.articleTitleInput.value.trim(); // Now this access is safe
    logToConsole(`Initial article title from input: "${articleTitle}"`, "debug");

    if (!articleTitle) {
        logToConsole('Article title is blank, generating one...', 'info');
        const titlePrompt = buildTitlePrompt();
        const titlePayload = { providerKey: state.textProvider, model: state.textModel, prompt: titlePrompt };

        // Show loading indicator while generating title
        showLoading(ui.loadingIndicator, true);
        disableElement(ui.button, true);

        const titleResult = await callAI('generate', titlePayload, null, null); // Pass nulls as we manage UI here

        // Hide loading indicator after title generation attempt
        showLoading(ui.loadingIndicator, false); // Hide loader regardless of success

        if (titleResult?.success && titleResult.text) {
            articleTitle = titleResult.text.trim().replace(/^"|"$/g, '');
            logToConsole(`Generated Title: ${articleTitle}`, 'success');
            ui.articleTitleInput.value = articleTitle; // Update input field
            updateState({ articleTitle: articleTitle }); // Save to state
        } else {
            logToConsole('Failed to generate article title.', 'error');
            alert('Failed to generate article title. Please provide one manually or try again.');
            disableElement(ui.button, false); // Re-enable button on failure
            return; // Stop if title generation failed
        }
    } else {
        // If title was provided manually, just save it to state
        updateState({ articleTitle: articleTitle });
    }

    // --- 2. Generate Structure ---
    logToConsole('Generating article structure...', 'info');
    const structurePrompt = buildStructurePrompt(articleTitle);
    const structurePayload = { providerKey: state.textProvider, model: state.textModel, prompt: structurePrompt };

    // Show loader and disable button for structure generation
    showLoading(ui.loadingIndicator, true);
    disableElement(ui.button, true);

    const structureResult = await callAI('generate', structurePayload, null, null); // Manage UI manually

    // Hide loader and re-enable button AFTER the call finishes
    showLoading(ui.loadingIndicator, false);
    disableElement(ui.button, false);


    if (structureResult?.success && structureResult.text) {
        if (ui.articleStructureTextarea) { // Check if textarea exists
            ui.articleStructureTextarea.value = structureResult.text;
        } else {
             logToConsole("Article structure textarea not found to display results.", "error");
        }
        // Show/Hide sections - use safe getElement or direct access if already checked
        showElement(getElement('step2Section'), true); // Use getElement for safety
        showElement(getElement('structureContainer'), true);
        if(ui.toggleStructureVisibilityBtn) ui.toggleStructureVisibilityBtn.textContent = 'Hide'; // Element already checked
        showElement(getElement('step3Section'), false); // Ensure step 3 is hidden
        showElement(getElement('step4Section'), false); // Ensure step 4 is hidden

        logToConsole('Structure generated successfully.', 'success');
    } else {
        logToConsole('Failed to generate structure.', 'error');
        alert(`Failed to generate structure. Error: ${structureResult?.error || 'Unknown error'}`);
    }
}

// --- Generate Full Article (Single Mode - Incremental) ---
export async function handleGenerateArticle() {
    const state = getState();
    const ui = {
        // Use getElement for safety
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

    // Check essential elements
    if (!ui.articleStructureTextarea || !ui.generatedArticleTextarea || !ui.articleTitleInput || !ui.button) {
        logToConsole("Missing essential UI elements for article generation.", "error");
        alert("Error: Cannot generate article due to missing UI components.");
        return;
    }

    const structure = ui.articleStructureTextarea.value.trim();
    if (!structure) { alert('Article structure is empty.'); return; }
    const outlines = getArticleOutlines(structure);
    if (outlines.length === 0) { alert('Could not parse outlines from the structure.'); return; }

    ui.generatedArticleTextarea.value = ''; // Reset output
    singleModeImagesToUpload = []; // Reset image queue
    let previousSectionContent = '';
    let combinedArticleContent = '';
    const doImageGeneration = state.generateImages;
    const imageStorageType = doImageGeneration ? state.imageStorage : 'none';
    const outputFormat = state.format;
    const articleTitle = ui.articleTitleInput.value.trim() || state.keyword || 'untitled-article';

    showElement(ui.generationProgressDiv, true); // Show progress text area
    if(ui.totalSectionNumSpan) ui.totalSectionNumSpan.textContent = outlines.length; // Update total count
    hideProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText); // Hide image upload bar initially
    disableElement(ui.button, true);
    showLoading(ui.loadingIndicator, true);

    try { // Wrap generation loop in try block
        for (let i = 0; i < outlines.length; i++) {
            const currentOutline = outlines[i];
            if(ui.currentSectionNumSpan) ui.currentSectionNumSpan.textContent = i + 1; // Update current count
            logToConsole(`Processing outline ${i+1}/${outlines.length}: "${currentOutline}"`, 'info');

            // Generate Text
            const textPayload = buildSingleTextPayload(currentOutline, previousSectionContent, articleTitle);
            const textResult = await callAI('generate', textPayload, null, null); // No loader/button disable needed here
            if (!textResult?.success || !textResult.text) {
                throw new Error(`Text generation failed for section ${i + 1} ("${currentOutline}"): ${textResult?.error || 'No text returned'}`);
            }
            const currentSectionText = textResult.text.trim() + (outputFormat === 'html' ? '\n\n' : '\n\n'); // Add spacing
            combinedArticleContent += currentSectionText;
            ui.generatedArticleTextarea.value = combinedArticleContent; // Update textarea incrementally
            previousSectionContent = currentSectionText; // Update context for next iteration

            // Generate Image (if enabled)
            let imagePlaceholder = '';
            if (doImageGeneration) {
                logToConsole(`Generating image for section ${i + 1}...`, 'info');
                const imagePayload = buildSingleImagePayload(currentSectionText, currentOutline, articleTitle, i + 1);
                const imageResult = await callAI('generate_image', imagePayload, null, null); // No loader needed

                if (imageResult?.success && imageResult.imageData) {
                    const filename = imagePayload.filename;
                    const altText = `Image for ${currentOutline.substring(0, 50)}`;
                    const placeholderId = `img-placeholder-${filename.replace(/\./g, '-')}`;

                    if (imageStorageType === 'github') {
                        singleModeImagesToUpload.push({ filename: filename, base64: imageResult.imageData, placeholderId: placeholderId });
                        imagePlaceholder = outputFormat === 'html'
                            ? `<div id="${placeholderId}">[Uploading image: ${filename}...]</div>\n\n`
                            : `[Uploading image: ${filename}...]\n\n`;
                        logToConsole(`Image ${filename} queued for GitHub upload.`, 'info');
                    } else { // Base64 embedding
                        imagePlaceholder = outputFormat === 'html'
                            ? `<img src="data:image/png;base64,${imageResult.imageData}" alt="${altText}" class="mx-auto my-4 rounded shadow">\n\n`
                            : `![${altText}](data:image/png;base64,${imageResult.imageData})\n\n`;
                        logToConsole(`Image for section ${i + 1} embedded as base64.`, 'success');
                    }
                } else {
                    logToConsole(`Failed image gen for section ${i + 1}. Error: ${imageResult?.error || 'Unknown'}`, 'warn');
                    imagePlaceholder = outputFormat === 'html' ? `\n\n<!-- Image generation failed -->\n\n` : `\n\n[Image generation failed]\n\n`;
                }
                combinedArticleContent += imagePlaceholder; // Add placeholder/image tag
                ui.generatedArticleTextarea.value = combinedArticleContent; // Update textarea again
            }
            // Scroll to bottom
            ui.generatedArticleTextarea.scrollTop = ui.generatedArticleTextarea.scrollHeight;
            await delay(200); // Small delay between sections if needed
        } // End outline loop

        // Success: Hide generation progress
        showElement(ui.generationProgressDiv, false);

        // Upload Images if needed
        if (imageStorageType === 'github' && singleModeImagesToUpload.length > 0) {
            await uploadSingleImagesToGithub(); // Handles its own progress bar
        } else {
             hideProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText); // Ensure hidden if no uploads
        }

        // Finalize UI after successful generation
        if (combinedArticleContent) {
            showElement(ui.step3Section, true); // Show review step
            showElement(ui.step4Section, false); // Ensure spin step is hidden
            const isHtml = outputFormat === 'html';
            if(ui.previewHtmlCheckbox) {
                ui.previewHtmlCheckbox.checked = false;
                disableElement(ui.previewHtmlCheckbox, !isHtml);
                showElement(ui.previewHtmlCheckbox.parentElement, isHtml); // Show/hide the checkbox label container
            }
            showElement(ui.generatedArticleTextarea, true); // Ensure textarea is visible
            showElement(ui.htmlPreviewDiv, false); // Ensure preview is hidden
            if(ui.htmlPreviewDiv) ui.htmlPreviewDiv.innerHTML = ''; // Clear preview

            logToConsole('Single article generation process complete.', 'success');
        } else {
            logToConsole('Single article generation finished but produced no content.', 'warn');
        }

    } catch (error) { // Catch errors during the generation loop
        logToConsole(`Error during article generation: ${error.message}`, 'error');
        alert(`Article generation failed: ${error.message}`);
        showElement(ui.generationProgressDiv, false); // Hide progress on error
        hideProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText); // Hide upload bar on error
    } finally {
        // Always re-enable button and hide main loader
        showLoading(ui.loadingIndicator, false);
        disableElement(ui.button, false);
    }
}


// --- Build Payload Functions (Single Mode Specific Helpers) ---
function buildTitlePrompt() {
    const state = getState();
    return `Generate a compelling and SEO-friendly article title for the keyword "${state.keyword}". Consider the target audience: ${state.audience}. The desired tone is: ${state.tone}. The article's main purpose is: ${state.purpose.join(', ')}. ${state.language !== 'English' ? `Generate the title in ${state.language}.` : ''} Output ONLY the title text, without any quotation marks or introductory phrases.`;
}

function buildStructurePrompt(articleTitle) {
    const state = getState();
    return `Generate a detailed article structure/outline for an article titled "${articleTitle}" about the keyword "${state.keyword}".\n- Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''}\n- Target Audience: ${state.audience}\n- Tone: ${state.tone}\n${state.gender ? `- Author Gender Persona: ${state.gender}` : ''}\n${state.age ? `- Author Age Persona: ${state.age}` : ''}\n- Article Purpose(s): ${state.purpose.join(', ')}\n${state.purposeUrl && state.purpose.includes('Promote URL') ? `  - Promotional URL: ${state.purposeUrl}` : ''}\n${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? `  - Desired Call to Action: ${state.purposeCta}` : ''}\n${state.readerName ? `- Address Reader As: ${state.readerName}` : ''}\n${state.customSpecs ? `- Other Details: ${state.customSpecs}` : ''}\n\nInstructions:\n- Create a logical structure covering the topic comprehensively.\n- Output only the structure using clear headings or bullet points.\n- Do not include intro/concluding remarks about the structure itself.`;
}

function buildSingleTextPayload(currentOutline, previousContext, articleTitle) {
    const state = getState();
    let linkingInstructions = '';
    if (state.sitemapUrls && state.sitemapUrls.length > 0) {
         const urlList = state.sitemapUrls.slice(0, 5).join('\n'); // Limit shown URLs
         linkingInstructions = `\n- Consider linking naturally to relevant URLs from this list if appropriate:\n${urlList}\n- Link Type Preference: ${state.linkTypeInternal ? 'Internal (relative paths like /slug)' : 'External (full URLs)'}. Aim for 1-2 relevant links per section if possible.`;
    }

    const prompt = `Generate the article content ONLY for the following section/outline of an article titled "${articleTitle}", continuing naturally from the previous context if provided.\n\nSection Outline: "${currentOutline}"\n\nPrevious Context (end of last section):\n---\n${previousContext ? previousContext.slice(-500) : '(Start of article)'}\n---\n\nOverall Article Specifications:\n- Keyword: "${state.keyword}"\n- Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''}\n- Target Audience: ${state.audience}\n- Tone: ${state.tone}\n${state.gender ? `- Author Gender: ${state.gender}` : ''}\n${state.age ? `- Author Age: ${state.age}` : ''}\n- Purpose(s): ${state.purpose.join(', ')}\n${state.purposeUrl && state.purpose.includes('Promote URL') ? ` - Promo URL: ${state.purposeUrl}\n` : ''}${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? ` - CTA: ${state.purposeCta}\n` : ''}${state.readerName ? `- Reader Name: ${state.readerName}\n` : ''}- Output Format: ${state.format}\n${state.customSpecs ? `- Other Details: ${state.customSpecs}\n` : ''}${linkingInstructions}\n\nInstructions:\n- Write ONLY the content for the current section outline: "${currentOutline}".\n- Do NOT repeat the outline heading unless it fits naturally within the flow (e.g., as an <h2>).\n- Ensure smooth transition from previous context.\n- Adhere strictly to ${state.format} format (${state.format === 'html' ? 'use only <p>, <h2>-<h6>, <ul>, <ol>, <li>, <b>, <i>, <a> tags' : 'use standard Markdown'}).\n- Do NOT add introductory or concluding remarks about the writing process or the section itself.`;

    return { providerKey: state.textProvider, model: state.textModel, prompt: prompt };
}

function buildSingleImagePayload(sectionContent, sectionTitle, articleTitle, sectionIndex) {
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

    // Dynamically get model based on custom state for image
    const imageModel = state.useCustomImageModel ? state.customImageModel : state.imageModel;

    return {
        providerKey: state.imageProvider,
        model: imageModel, // Use potentially custom model
        prompt: imagePrompt,
        filename: filename,
        // Backend should handle numImages > 1 if needed by provider
        // numImages: state.numImages || 1, // Generally backend generates 1 per call
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
            // Use the download_url provided by the backend (likely the raw content URL)
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
    // Try replacing div placeholder first (HTML format)
    if (format === 'html' && textarea.value.includes(placeholderId)) {
         textarea.value = textarea.value.replace(placeholderDivRegex, replacementText);
         replaced = true;
         // logToConsole(`Replaced DIV placeholder ${placeholderId} with: ${replacementText.substring(0,50)}...`, 'debug');
    }

    // If div wasn't found/replaced, try text placeholder (Markdown or fallback)
    if (!replaced) {
        const originalLength = textarea.value.length;
        textarea.value = textarea.value.replace(placeholderTextRegex, replacementText);
        if (textarea.value.length !== originalLength) {
            replaced = true;
             // logToConsole(`Replaced TEXT placeholder for ${filename} with: ${replacementText.substring(0,50)}...`, 'debug');
        }
    }

    // if (!replaced) {
    //      logToConsole(`Could not find placeholder for ${filename} (ID: ${placeholderId})`, 'warn');
    // }
}


console.log("article-single.js loaded");