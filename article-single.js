// article-single.js
import { getState, updateState } from './article-state.js';
import { logToConsole, callAI, getArticleOutlines, constructImagePrompt, sanitizeFilename, slugify } from './article-helpers.js'; // Import helpers
import { getElement, updateProgressBar, hideProgressBar, updateUIFromState } from './article-ui.js';

let singleModeImagesToUpload = []; // State specific to single mode image uploads

// --- Generate Structure (and Title if needed) ---
export async function handleGenerateStructure() {
    const state = getState();
    const ui = {
        keywordInput: getElement('keywordInput'),
        articleTitleInput: getElement('articleTitle'),
        articleStructureTextarea: getElement('articleStructureTextarea'),
        step2Section: getElement('step2Section'),
        structureContainer: getElement('structureContainer'),
        toggleStructureVisibilityBtn: getElement('toggleStructureVisibilityBtn'),
        step3Section: getElement('step3Section'),
        step4Section: getElement('step4Section'),
        loadingIndicator: getElement('structureLoadingIndicator'),
        button: getElement('generateSingleBtn'),
    };

    // --- 1. Generate Title (if blank) ---
    let articleTitle = ui.articleTitleInput.value.trim();
    if (!articleTitle) {
        logToConsole('Article title is blank, generating one...', 'info');
        const titlePrompt = buildTitlePrompt(); // Uses local helper
        const titlePayload = { providerKey: state.textProvider, model: state.textModel, prompt: titlePrompt };
        const titleResult = await callAI('generate', titlePayload, ui.loadingIndicator, ui.button);

        if (titleResult?.success && titleResult.text) {
            articleTitle = titleResult.text.trim().replace(/^"|"$/g, '');
            ui.articleTitleInput.value = articleTitle;
            updateState({ articleTitle: articleTitle });
            logToConsole(`Generated Title: ${articleTitle}`, 'success');
        } else {
            logToConsole('Failed to generate article title.', 'error');
            alert('Failed to generate article title. Please provide one manually or try again.');
            return;
        }
    } else {
        updateState({ articleTitle: articleTitle });
    }

    // --- 2. Generate Structure ---
    logToConsole('Generating article structure...', 'info');
    const structurePrompt = buildStructurePrompt(articleTitle); // Uses local helper
    const structurePayload = { providerKey: state.textProvider, model: state.textModel, prompt: structurePrompt };
    const structureResult = await callAI('generate', structurePayload, ui.loadingIndicator, ui.button);

    if (structureResult?.success && structureResult.text) {
        ui.articleStructureTextarea.value = structureResult.text;
        ui.step2Section.classList.remove('hidden');
        ui.structureContainer.classList.remove('hidden');
        ui.toggleStructureVisibilityBtn.textContent = 'Hide';
        ui.step3Section.classList.add('hidden');
        ui.step4Section.classList.add('hidden');
        // displaySitemapUrlsUI(); // Call UI function if needed
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
        articleStructureTextarea: getElement('article_structure'),
        generatedArticleTextarea: getElement('generated_article'),
        generationProgressDiv: getElement('generationProgress'),
        currentSectionNumSpan: getElement('currentSectionNum'),
        totalSectionNumSpan: getElement('totalSectionNum'),
        uploadProgressContainer: getElement('uploadProgressContainer'),
        uploadProgressText: getElement('uploadProgressText'),
        uploadProgressBar: getElement('uploadProgressBar'),
        step3Section: getElement('step3Section'),
        step4Section: getElement('step4Section'),
        previewHtmlCheckbox: getElement('preview_html_checkbox'),
        htmlPreviewDiv: getElement('html_preview'),
        loadingIndicator: getElement('articleLoadingIndicator'),
        button: getElement('generateArticleBtn'),
        articleTitleInput: getElement('articleTitle'),
    };

    const structure = ui.articleStructureTextarea.value.trim();
    if (!structure) { alert('Article structure is empty.'); return; }
    const outlines = getArticleOutlines(structure); // Use helper
    if (outlines.length === 0) { alert('Could not parse outlines.'); return; }

    // Reset state
    ui.generatedArticleTextarea.value = ''; singleModeImagesToUpload = [];
    let previousSectionContent = ''; let combinedArticleContent = '';
    const doImageGeneration = state.generateImages;
    const imageStorageType = doImageGeneration ? state.imageStorage : 'none';
    const outputFormat = state.format;
    const articleTitle = ui.articleTitleInput.value.trim() || state.keyword || 'untitled-article';

    ui.generationProgressDiv.classList.remove('hidden'); ui.totalSectionNumSpan.textContent = outlines.length;
    hideProgressBar(null, ui.uploadProgressContainer, ui.uploadProgressText);
    disableElement(ui.button, true); showLoading(ui.loadingIndicator, true);

    for (let i = 0; i < outlines.length; i++) {
        const currentOutline = outlines[i];
        ui.currentSectionNumSpan.textContent = i + 1;
        logToConsole(`Processing outline ${i+1}: "${currentOutline}"`, 'info');

        // Generate Text
        const textPayload = buildSingleTextPayload(currentOutline, previousSectionContent, articleTitle); // Use local helper
        const textResult = await callAI('generate', textPayload, null, null);
        if (!textResult?.success || !textResult.text) { logToConsole(`Failed text gen for outline: "${currentOutline}". Stopping. Error: ${textResult?.error}`, 'error'); alert(`Error generating section ${i + 1}.`); break; }
        const currentSectionText = textResult.text.trim() + (outputFormat === 'html' ? '\n\n' : '\n\n');
        combinedArticleContent += currentSectionText; ui.generatedArticleTextarea.value = combinedArticleContent;
        previousSectionContent = currentSectionText;

        // Generate Image
        let imagePlaceholder = '';
        if (doImageGeneration) {
            logToConsole(`Generating image for section ${i + 1}...`, 'info');
            const imagePayload = buildSingleImagePayload(currentSectionText, currentOutline, articleTitle, i + 1); // Use local helper
            const imageResult = await callAI('generate_image', imagePayload, null, null);

            if (imageResult?.success && imageResult.imageData) {
                const filename = imagePayload.filename;
                const altText = `Image for ${currentOutline.substring(0, 50)}`;
                const placeholderId = `img-placeholder-${filename.replace(/\./g, '-')}`;
                if (imageStorageType === 'github') {
                    singleModeImagesToUpload.push({ filename: filename, base64: imageResult.imageData, placeholderId: placeholderId });
                    imagePlaceholder = outputFormat === 'html' ? `<div id="${placeholderId}">[Uploading image: ${filename}...]</div>\n\n` : `[Uploading image: ${filename}...]\n\n`;
                    logToConsole(`Image ${filename} queued for GitHub upload.`, 'info');
                } else {
                    imagePlaceholder = outputFormat === 'html' ? `<img src="data:image/png;base64,${imageResult.imageData}" alt="${altText}" class="mx-auto my-4 rounded shadow">\n\n` : `![${altText}](data:image/png;base64,${imageResult.imageData})\n\n`;
                    logToConsole(`Image for section ${i + 1} embedded as base64.`, 'success');
                }
            } else {
                logToConsole(`Failed image gen for section ${i + 1}. Error: ${imageResult?.error}`, 'warn');
                imagePlaceholder = outputFormat === 'html' ? `\n\n` : `[Image generation failed]\n\n`;
            }
            combinedArticleContent += imagePlaceholder; ui.generatedArticleTextarea.value = combinedArticleContent;
        }
        ui.generatedArticleTextarea.scrollTop = ui.generatedArticleTextarea.scrollHeight;
    } // End outline loop

    ui.generationProgressDiv.classList.add('hidden'); showLoading(ui.loadingIndicator, false);

    // Upload Images
    if (imageStorageType === 'github' && singleModeImagesToUpload.length > 0) {
        await uploadSingleImagesToGithub(); // Use local helper
    }

    // Finalize
    disableElement(ui.button, false);
    if (combinedArticleContent) {
        ui.step3Section.classList.remove('hidden'); ui.step4Section.classList.add('hidden');
        const isHtml = outputFormat === 'html'; ui.previewHtmlCheckbox.checked = false; disableElement(ui.previewHtmlCheckbox, !isHtml);
        ui.previewHtmlCheckbox.parentElement.classList.toggle('hidden', !isHtml);
        ui.generatedArticleTextarea.classList.remove('hidden'); ui.htmlPreviewDiv.classList.add('hidden'); ui.htmlPreviewDiv.innerHTML = '';
        logToConsole('Single article generation process complete.', 'success');
    } else { logToConsole('Single article generation failed or produced no content.', 'error'); }
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
         const urlList = state.sitemapUrls.slice(0, 5).join('\n');
         linkingInstructions = `\n- Consider linking naturally to relevant URLs from this list if appropriate: ${urlList}\n- Link Type Preference: ${state.linkTypeInternal ? 'Internal' : 'External'}.`;
    }

    const prompt = `Generate the article content ONLY for the following section/outline of an article titled "${articleTitle}", continuing naturally from the previous context if provided.\nSection Outline: "${currentOutline}"\nPrevious Context (end of last section):\n---\n${previousContext ? previousContext.slice(-500) : '(Start of article)'}\n---\nOverall Article Specifications:\n- Keyword: "${state.keyword}" - Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''} - Target Audience: ${state.audience} - Tone: ${state.tone} ${state.gender ? `- Author Gender: ${state.gender}` : ''} ${state.age ? `- Author Age: ${state.age}` : ''} - Purpose(s): ${state.purpose.join(', ')} ${state.purposeUrl && state.purpose.includes('Promote URL') ? ` - Promo URL: ${state.purposeUrl}` : ''} ${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? ` - CTA: ${state.purposeCta}` : ''} ${state.readerName ? `- Reader Name: ${state.readerName}` : ''} - Output Format: ${state.format} ${state.customSpecs ? `- Other Details: ${state.customSpecs}` : ''} ${linkingInstructions}\nInstructions:\n- Write ONLY the content for the current section outline: "${currentOutline}". Do NOT repeat the outline heading unless natural. Ensure smooth transition. Adhere strictly to ${state.format} format (${state.format === 'html' ? 'use only <p>,<h1>-<h6>,<ul>,<ol>,<li>,<b>,<i>,<a> tags' : 'use standard Markdown'}). Do NOT add intro/concluding remarks.`;

    return { providerKey: state.textProvider, model: state.textModel, prompt: prompt };
}

function buildSingleImagePayload(sectionContent, sectionTitle, articleTitle, sectionIndex) {
    const state = getState();
    const keyword = state.keyword || 'article';
    const filename = sanitizeFilename(`${slugify(articleTitle)}-${slugify(sectionTitle)}-${Date.now()}-${sectionIndex}.png`);
    // Get image settings from state
    const imageSettings = {
        imageSubject: state.imageSubject,
        imageStyle: state.imageStyle,
        imageStyleModifiers: state.imageStyleModifiers,
        imageText: state.imageText
    };
    const imagePrompt = constructImagePrompt(sectionContent, sectionTitle, imageSettings); // Use helper

    return {
        providerKey: state.imageProvider,
        model: state.imageModel,
        prompt: imagePrompt,
        filename: filename,
        numImages: state.numImages || 1,
        aspectRatio: state.imageAspectRatio,
        // Pass other relevant params from state if needed by backend
        // style: state.imageStyle || undefined,
        // text: state.imageText || undefined
    };
}


// --- GitHub Image Upload Function (Single Mode Helper) ---
async function uploadSingleImagesToGithub() {
    const state = getState();
    const ui = {
        githubRepoUrlInput: getElement('githubRepoUrl'),
        githubCustomPathInput: getElement('githubCustomPath'),
        uploadProgressContainer: getElement('uploadProgressContainer'),
        uploadProgressBar: getElement('uploadProgressBar'),
        uploadProgressText: getElement('uploadProgressText'),
        generatedArticleTextarea: getElement('generated_article'),
    };

    if (singleModeImagesToUpload.length === 0) return;
    const repoUrl = state.githubRepoUrl;
    if (!repoUrl) { alert("GitHub Repo URL is required."); return; }
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch || urlMatch.length < 3) { alert("Invalid GitHub Repo URL format."); return; }
    const owner = urlMatch[1]; const repo = urlMatch[2].replace(/\.git$/, '');
    const repoDomain = repo.toLowerCase();
    const customPath = state.githubCustomPath;
    let basePath;
    if (customPath) { basePath = (customPath.startsWith('/') ? customPath.substring(1) : customPath).replace(/\/$/, '') + '/'; }
    else { const langKey = Object.keys(languageOptions).find(key => languageOptions[key].name === state.language || key === state.language) || 'English'; basePath = (languageOptions[langKey]?.defaultPath || '/articles/').replace(/^\//, '').replace(/\/$/, '') + '/'; }

    logToConsole(`Starting GitHub upload (Single Mode) to ${owner}/${repo} path /${basePath}...`, 'info');
    updateProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText, 0, singleModeImagesToUpload.length, 'Uploading image ');

    let uploadedCount = 0; const totalImages = singleModeImagesToUpload.length;

    for (let i = 0; i < totalImages; i++) {
        const img = singleModeImagesToUpload[i];
        updateProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText, i, totalImages, `Uploading image ${i + 1} of ${totalImages} (${img.filename}) `);
        const fullPath = basePath + img.filename;
        const payload = { owner: owner, repo: repo, path: fullPath, content: img.base64, message: `Upload image: ${img.filename} via AI Tool` };
        const result = await callAI('upload_image', payload, null, null);

        if (result?.success) {
            const finalImageUrl = `https://${repoDomain}/${fullPath}`;
            logToConsole(`Uploaded ${img.filename}. URL: ${finalImageUrl}`, 'success');
            replacePlaceholderInTextarea(ui.generatedArticleTextarea, img.placeholderId, img.filename, finalImageUrl, state.format);
            uploadedCount++;
        } else {
            logToConsole(`Failed to upload ${img.filename}. Error: ${result?.error || 'Unknown'}`, 'error');
            replacePlaceholderInTextarea(ui.generatedArticleTextarea, img.placeholderId, img.filename, null, state.format, true);
        }
        const progressPercent = Math.round(((i + 1) / totalImages) * 100);
        ui.uploadProgressBar.style.width = `${progressPercent}%`;
    }
    ui.uploadProgressText.textContent = `Upload complete (${uploadedCount}/${totalImages} successful).`;
    logToConsole(`GitHub upload process finished (Single Mode).`, 'info');
}

// Helper to replace placeholder (moved from v7 bulk)
function replacePlaceholderInTextarea(textarea, placeholderId, filename, finalImageUrl, format, isError = false) {
    const placeholderDivRegex = new RegExp(`<div id="${placeholderId}">\\[Uploading image: ${filename}\\.\\.\\.\\]</div>`, 's');
    const placeholderTextRegex = new RegExp(`\\[Uploading image: ${filename}\\.\\.\\.\\]`, 'g');
    let replacementText;

    if (isError) {
        replacementText = format === 'html' ? `` : `[Upload failed: ${filename}]`;
    } else {
        replacementText = format === 'html'
            ? `<img src="${finalImageUrl}" alt="${filename}" class="mx-auto my-4 rounded shadow">`
            : `![${filename}](${finalImageUrl})`;
    }
    if (textarea.value.includes(`<div id="${placeholderId}">`)) {
         textarea.value = textarea.value.replace(placeholderDivRegex, replacementText);
    } else {
        textarea.value = textarea.value.replace(placeholderTextRegex, replacementText);
    }
    // Note: We are not updating a global 'fullArticleContent' here as it's managed within handleGenerateArticle
}


console.log("article-single.js loaded");