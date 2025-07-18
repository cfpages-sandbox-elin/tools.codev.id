// article-bulk.js (v8.23 hide download button initially)
import { getState, getBulkPlan, updateBulkPlanItem, addBulkArticle, saveBulkArticlesState, getBulkArticle, getAllBulkArticles, setBulkPlan, updateState } from './article-state.js';
import { logToConsole, callAI, sanitizeFilename, slugify, getArticleOutlinesV2, constructImagePrompt, delay, showElement, disableElement } from './article-helpers.js';
import { getElement, updatePlanItemStatusUI, updateProgressBar, hideProgressBar, renderPlanningTable } from './article-ui.js';
import { languageOptions } from './article-config.js';
import { getPlanPrompt, getBulkStructurePrompt, getBulkSectionTextPrompt } from './article-prompts.js';

let bulkImagesToUpload = [];
let isBulkRunning = false;
let currentBulkPlan = []; // Keep a local copy during generation

// --- Parse and Prepare Keywords ---
export function prepareKeywords() {
    const ui = { bulkKeywords: getElement('bulkKeywords') };
    if (!ui.bulkKeywords) return [];
    const rawKeywords = ui.bulkKeywords.value.split('\n');
    const cleanedKeywords = rawKeywords
        .map(kw => kw
            .replace(/\(\d+\)/g, '') // Remove numbers in parentheses, e.g., (24)
            .replace(/\s+/g, ' ')    // Collapse consecutive whitespace characters into a single space
            .trim()                  // Remove leading/trailing whitespace
        )
        .filter(kw => kw.length > 0);
    const uniqueKeywords = [...new Set(cleanedKeywords)];
    logToConsole(`Prepared ${uniqueKeywords.length} unique keywords for planning after cleaning.`, 'info');
    // Also update the textarea with the cleaned keywords for user visibility
    if (ui.bulkKeywords) {
        const newTextareaValue = uniqueKeywords.join('\n');
        ui.bulkKeywords.value = newTextareaValue;
        // Since we are updating the value, we should also update the state
        // This will prevent the uncleaned text from reappearing on reload
        updateState({ bulkKeywordsContent: newTextareaValue });
    }
    return uniqueKeywords;
}

// --- Generate Planning Table ---
export async function handleGeneratePlan() {
    const keywords = prepareKeywords();
    if (keywords.length === 0) {
        alert("Please enter keywords.");
        return;
    }
    const state = getState();
    const ui = {
        loadingIndicator: getElement('planLoadingIndicator'),
        button: getElement('generatePlanBtn'),
        step1_5Section: getElement('step1_5Section'),
        planningTableBody: getElement('planningTableBody'),
        batchSizeInput: getElement('batchSizeInput')
    };

    logToConsole(`Starting batched plan generation for ${keywords.length} keywords...`, 'info');
    showElement(ui.step1_5Section, true);
    disableElement(ui.button, true); // Disable button during the entire process

    let allPlanItems = []; // Array to accumulate results from all batches

    // --- BATCHING LOGIC START ---
    const batchSize = parseInt(ui.batchSizeInput?.value, 10) || 10;
    logToConsole(`Using batch size of ${batchSize}`, 'info');

    for (let i = 0; i < keywords.length; i += batchSize) {
        const batch = keywords.slice(i, i + batchSize);
        const currentProgress = Math.min(i + batchSize, keywords.length);

        logToConsole(`Processing batch ${Math.floor(i / batchSize) + 1}: keywords ${i + 1} to ${currentProgress}`, 'info');

        // Update UI to show progress
        ui.planningTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 py-4">Generating plan for keywords ${i + 1} - ${currentProgress} of ${keywords.length}... <span class="loader inline-block"></span></td></tr>`;

        try {
            const planPrompt = getPlanPrompt(batch);
            const planPayload = { providerKey: state.textProvider, model: state.textModel, prompt: planPrompt };
            // Note: We don't pass the main button/loader here, as we're managing the UI manually.
            const result = await callAI('generate', planPayload, null, null);

            if (result?.success && result.text) {
                const parsedBatch = parsePlanResponse(result.text, batch);
                allPlanItems.push(...parsedBatch); // Add batch results to the main array
                logToConsole(`Successfully received ${parsedBatch.length} plan items for this batch.`, 'success');
            } else {
                logToConsole(`Failed to generate plan for batch starting with "${batch[0]}". Error: ${result?.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            logToConsole(`An exception occurred while processing batch starting with "${batch[0]}": ${error.message}`, 'error');
        }

        // Add a small delay between API calls to be a good citizen and avoid rate limits
        await delay(250);
    }
    // --- BATCHING LOGIC END ---

    disableElement(ui.button, false); // Re-enable button now that all batches are done

    if (allPlanItems.length > 0) {
        logToConsole(`Total plan items generated before deduplication: ${allPlanItems.length}`, 'info');
        const uniquePlan = removeDuplicatePlanItems(allPlanItems);
        setBulkPlan(uniquePlan.map(item => ({ ...item, status: 'Pending', filename: `${item.slug}.md` })));
        renderPlanningTable(getBulkPlan());
        logToConsole(`Plan generation complete. ${uniquePlan.length} unique items created.`, 'success');
    } else {
        logToConsole('Failed to generate any plan items after all batches.', 'error');
        alert('Failed to generate a plan. Please check the console log for errors.');
        ui.planningTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-red-500 py-4">Failed to generate plan items.</td></tr>`;
    }
}

// --- Start Bulk Generation ---
export async function handleStartBulkGeneration() {
    if (isBulkRunning) { logToConsole("Bulk generation already running.", "warn"); return; }
    currentBulkPlan = getBulkPlan(); // Get a fresh copy at the start
    if (currentBulkPlan.length === 0) { alert("Planning table is empty."); return; }

    isBulkRunning = true;
    logToConsole("Starting bulk article generation...", "info");
    const ui = { 
        button: getElement('startBulkGenerationBtn'),
        downloadBulkZipBtn: getElement('downloadBulkZipBtn'),
        bulkGenProgress: getElement('bulkGenerationProgress'),
        bulkCurrentNum: getElement('bulkCurrentNum'),
        bulkTotalNum: getElement('bulkTotalNum'),
        bulkCurrentKeyword: getElement('bulkCurrentKeyword'),
        uploadProgressContainer: getElement('bulkUploadProgressContainer'),
        uploadProgressBar: getElement('bulkUploadProgressBar'),
        uploadProgressText: getElement('bulkUploadProgressText')
    };
    disableElement(ui.button, true); 
    showElement(ui.bulkGenProgress, true);
    showElement(ui.downloadBulkZipBtn, false);
    if(ui.bulkTotalNum) ui.bulkTotalNum.textContent = currentBulkPlan.length;
    hideProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText);
    bulkImagesToUpload = []; // Reset image queue

    for (let i = 0; i < currentBulkPlan.length; i++) {
        const item = currentBulkPlan[i]; // Use the local copy
        // Check status based on potentially updated state (if user interacted)
        const currentItemState = getBulkPlan().find(p => p.keyword === item.keyword); // Find current status
        if (currentItemState?.status === 'Completed' || currentItemState?.status?.startsWith('Completed')) {
            logToConsole(`Skipping completed item: ${item.keyword}`, 'info');
            // Ensure UI reflects completion if not already done
            updatePlanItemStatusUI(i, currentItemState.status, currentItemState.error);
            continue;
        }

        if(ui.bulkCurrentNum) ui.bulkCurrentNum.textContent = i + 1;
        if(ui.bulkCurrentKeyword) ui.bulkCurrentKeyword.textContent = item.keyword;
        updatePlanItemStatusUI(i, 'Generating');
        updateBulkPlanItem(i, { status: 'Generating', error: null }); // Update main state

        try {
            // Generate Structure string first
            logToConsole(`Generating structure for: ${item.keyword}`, 'info');
            const structurePrompt = getBulkStructurePrompt(item); // REFACTORED
            const structurePayload = buildBulkPayload(structurePrompt);
            const structureResult = await callAI('generate', structurePayload, null, null);
            if (!structureResult?.success || !structureResult.text) throw new Error(`Structure failed: ${structureResult?.error || 'No text'}`);

            const structure = structureResult.text;
            // *** Use the V2 parser ***
            const outlineSections = getArticleOutlinesV2(structure); // [{heading, points}, ...]
            if (outlineSections.length === 0) throw new Error("No primary sections parsed from structure.");

            // Generate Sections & Images based on V2 outlines
            let combinedArticleContent = ''; let previousSectionContent = '';
            const state = getState(); // Get current global state for image/linking settings
            const doImageGeneration = state.generateImages;
            const imageStorageType = doImageGeneration ? state.imageStorage : 'none';

            // *** Loop through V2 outline sections ***
            for (let j = 0; j < outlineSections.length; j++) {
                const section = outlineSections[j]; // section = { heading, points }
                logToConsole(`Generating section ${j+1}/${outlineSections.length} ("${section.heading}") for: ${item.keyword}`, 'info');

                // --- Text Generation ---
                const textPrompt = getBulkSectionTextPrompt(item, section, previousSectionContent); // REFACTORED
                const textPayload = buildBulkPayload(textPrompt);
                const textResult = await callAI('generate', textPayload, null, null);
                if (!textResult?.success || !textResult.text) throw new Error(`Text failed section ${j+1} ("${section.heading}"): ${textResult?.error || 'No text'}`);

                const currentSectionText = textResult.text.trim() + '\n\n'; // Use Markdown newlines
                combinedArticleContent += currentSectionText;
                previousSectionContent = currentSectionText;

                // --- Image Generation (if enabled) ---
                if (doImageGeneration) {
                    // Use section.heading for context
                    const imagePayload = buildBulkImagePayload(item, currentSectionText, section.heading, j + 1);
                    const imageResult = await callAI('generate_image', imagePayload, null, null);
                    if (imageResult?.success && imageResult.imageData) {
                        const filename = imagePayload.filename;
                        const altText = `Image for ${section.heading.substring(0, 50)}`; // Use heading
                        const placeholderId = `img-placeholder-${filename.replace(/\./g, '-')}`;
                        if (imageStorageType === 'github') {
                            bulkImagesToUpload.push({ filename: filename, base64: imageResult.imageData, articleFilename: item.filename, placeholderId: placeholderId });
                            combinedArticleContent += `[Uploading image: ${filename}...]` + '\n\n';
                            logToConsole(`Image ${filename} queued for GitHub upload.`, 'info');
                        } else { // base64
                            combinedArticleContent += `![${altText}](data:image/png;base64,${imageResult.imageData})` + '\n\n';
                            logToConsole(`Image for section ${j+1} embedded as base64.`, 'success');
                        }
                    } else {
                        logToConsole(`Failed image gen section ${j+1}. Error: ${imageResult?.error || 'Unknown'}`, 'warn');
                        combinedArticleContent += `[Image generation failed for this section]\n\n`;
                    }
                }
                await delay(200); // Small delay between sections
            } // End section loop

            // Save Article & Update Status
            const articleFilename = item.filename || `${slugify(item.slug || item.keyword)}.md`;
            addBulkArticle(articleFilename, combinedArticleContent); // Save to memory/localStorage
            updatePlanItemStatusUI(i, 'Completed');
            updateBulkPlanItem(i, { status: 'Completed', filename: articleFilename }); // Update main state
            logToConsole(`Article generation completed for: ${item.keyword}`, 'success');

        } catch (error) {
            logToConsole(`Failed processing item ${i+1} (${item.keyword}): ${error.message}`, 'error');
            updatePlanItemStatusUI(i, 'Failed', error.message);
            updateBulkPlanItem(i, { status: 'Failed', error: error.message }); // Update main state
        }
        await delay(500); // Delay between keywords
    } // End main bulk loop

    saveBulkArticlesState(); // Persist all generated articles

    // Upload Images if needed
    const finalState = getState();
    if (finalState.generateImages && finalState.imageStorage === 'github' && bulkImagesToUpload.length > 0) {
        await uploadBulkImagesToGithub();
    } else {
        hideProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText);
    }

    // Finalize
    isBulkRunning = false; disableElement(ui.button, false); showElement(ui.bulkGenProgress, false);
    logToConsole("Bulk generation process finished.", "info");

    const completedArticles = getBulkPlan().filter(item => item.status?.startsWith('Completed'));
    if (completedArticles.length > 0) {
        showElement(ui.downloadBulkZipBtn, true);
        logToConsole(`Found ${completedArticles.length} completed articles. Showing download button.`, 'info');
    }

    alert("Bulk generation process complete. Check statuses and download ZIP if needed.");
}

// --- Build Payload Functions (Bulk Mode Specific Helpers) ---
// Note: These prompt-building functions are now removed and imported from article-prompts.js
//       Helper functions that remain are for parsing or packaging data.

function parsePlanResponse(responseText, originalKeywords) {
    let plan = []; try { plan = JSON.parse(responseText); if (!Array.isArray(plan)) throw new Error("Not array."); plan = plan.filter(item => item && item.keyword && item.title && item.slug && item.intent); plan.forEach(item => { item.slug = slugify(item.slug || item.title || item.keyword); }); } catch (e) { logToConsole(`JSON parse failed: ${e.message}. Fallback parsing.`, 'warn'); originalKeywords.forEach(kw => { let title = `Title for ${kw}`, slug = slugify(kw), intent = 'Informational'; plan.push({ keyword: kw, title: title.replace(/^"|"$/g, ''), slug: slug, intent: intent.replace(/^"|"$/g, '') }); }); } return plan;
}

function removeDuplicatePlanItems(plan) {
    const uniqueTitles = new Set(); const uniqueSlugs = new Set(); const uniquePlan = [];
    for (const item of plan) { const lowerTitle = item.title.toLowerCase(); const lowerSlug = item.slug.toLowerCase(); if (!uniqueTitles.has(lowerTitle) && !uniqueSlugs.has(lowerSlug)) { uniqueTitles.add(lowerTitle); uniqueSlugs.add(lowerSlug); uniquePlan.push(item); } else { logToConsole(`Removed duplicate plan item for "${item.keyword}".`, 'warn'); } } return uniquePlan;
}

function buildBulkPayload(prompt) { const state = getState(); return { providerKey: state.textProvider, model: state.textModel, prompt: prompt }; }

function buildBulkImagePayload(planItem, sectionContent, sectionHeading, sectionIndex) {
    const state = getState();
    const baseFilename = sanitizeFilename(`${slugify(planItem.slug || planItem.keyword)}-${slugify(sectionHeading)}`);
    const filename = `${baseFilename}-${Date.now()}-${sectionIndex}.png`;
    const imageSettings = { imageSubject: state.imageSubject, imageStyle: state.imageStyle, imageStyleModifiers: state.imageStyleModifiers, imageText: state.imageText };
    const imagePrompt = constructImagePrompt(sectionContent, sectionHeading, imageSettings); // Use sectionHeading
    const imageModel = state.useCustomImageModel ? state.customImageModel : state.imageModel;
    return { providerKey: state.imageProvider, model: imageModel, prompt: imagePrompt, filename: filename, aspectRatio: state.imageAspectRatio };
}

// --- GitHub Image Upload Function (Bulk Mode Helper) ---
async function uploadBulkImagesToGithub() {
    if (bulkImagesToUpload.length === 0) return;
    const state = getState();
    const ui = { uploadProgressContainer: getElement('bulkUploadProgressContainer'), uploadProgressBar: getElement('bulkUploadProgressBar'), uploadProgressText: getElement('bulkUploadProgressText') };
    const repoUrl = state.githubRepoUrl;
    if (!repoUrl) { alert("GitHub Repo URL required."); return; }
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch || urlMatch.length < 3) { alert("Invalid GitHub Repo URL."); return; }
    const owner = urlMatch[1]; const repo = urlMatch[2].replace(/\.git$/, ''); const repoDomain = repo.toLowerCase();
    const customPath = state.githubCustomPath; let basePath;
    if (customPath) { basePath = (customPath.startsWith('/') ? customPath.substring(1) : customPath).replace(/\/$/, '') + '/'; }
    else { const langKey = Object.keys(languageOptions).find(key => languageOptions[key].name === state.language || key === state.language) || 'English'; basePath = (languageOptions[langKey]?.defaultPath || '/articles/').replace(/^\//, '').replace(/\/$/, '') + '/'; }

    logToConsole(`Starting Bulk GitHub image upload to ${owner}/${repo} path /${basePath}...`, 'info');
    updateProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText, 0, bulkImagesToUpload.length, 'Uploading image ');

    let uploadedCount = 0; const totalImages = bulkImagesToUpload.length; const uploadedUrls = {};

    for (let i = 0; i < totalImages; i++) {
        const img = bulkImagesToUpload[i];
        updateProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText, i, totalImages, `Uploading image ${i + 1}/${totalImages} (${img.filename}) `);
        const fullPath = basePath + img.filename;
        const payload = { owner: owner, repo: repo, path: fullPath, content: img.base64, message: `Upload image: ${img.filename} via AI Tool` };
        const result = await callAI('upload_image', payload, null, null);
        if (result?.success) { const finalImageUrl = result.download_url || `https://${repoDomain}/${fullPath}`; logToConsole(`Uploaded ${img.filename}. URL: ${finalImageUrl}`, 'success'); uploadedUrls[img.filename] = finalImageUrl; uploadedCount++; } // Store URL against filename
        else { logToConsole(`Failed to upload ${img.filename}. Error: ${result?.error || 'Unknown'}`, 'error'); uploadedUrls[img.filename] = `[Upload failed: ${img.filename}]`; const planIndex = getBulkPlan().findIndex(item => item.filename === img.articleFilename); if (planIndex !== -1) { updatePlanItemStatusUI(planIndex, 'Completed (Image Upload Failed)'); updateBulkPlanItem(planIndex, { status: 'Completed (Image Upload Failed)', error: `Image upload failed: ${img.filename}` }); } }
        const progressPercent = Math.round(((i + 1) / totalImages) * 100); ui.uploadProgressBar.style.width = `${progressPercent}%`;
    }

    // Replace Placeholders
    logToConsole("Replacing image placeholders in generated bulk articles...", "info");
    const plan = getBulkPlan();
    const currentBulkArticles = getAllBulkArticles(); // Get current articles from state

    plan.forEach(item => {
        if (item.filename && currentBulkArticles[item.filename]) { // Use the fetched articles
            let content = currentBulkArticles[item.filename]; // Use the fetched articles
            let updated = false;
            const placeholderRegex = /\[Uploading image: (.*?)\.\.\.\]/g;
            content = content.replace(placeholderRegex, (match, filename) => {
                if (uploadedUrls[filename]) {
                    updated = true;
                    return uploadedUrls[filename].startsWith('[') ? uploadedUrls[filename] : `![${filename}](${uploadedUrls[filename]})`;
                }
                return match; // Keep placeholder if upload failed or filename mismatch
            });
            if (updated) {
                addBulkArticle(item.filename, content); // This updates the state
            }
        }
    });
    saveBulkArticlesState(); // Persist all changes

    ui.uploadProgressText.textContent = `Upload complete (${uploadedCount}/${totalImages} successful). Placeholders replaced.`;
    logToConsole(`GitHub upload process finished. Placeholders replaced.`, 'info');
}


// --- Download Bulk Articles as ZIP ---
export async function handleDownloadZip() {
    const articles = getAllBulkArticles(); const filenames = Object.keys(articles);
    if (filenames.length === 0) { alert("No bulk articles generated."); return; }
    logToConsole("Preparing ZIP file...", "info");
    const zip = new JSZip(); filenames.forEach(filename => { zip.file(filename, articles[filename]); });
    try {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const plan = getBulkPlan(); const firstKeyword = plan[0]?.keyword ? slugify(plan[0].keyword) : 'bulk';
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const zipFilename = `bulk-articles-${firstKeyword}-${dateStr}.zip`;
        const link = document.createElement("a"); link.href = URL.createObjectURL(zipBlob); link.download = zipFilename;
        document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href);
        logToConsole(`ZIP file '${zipFilename}' download initiated.`, 'success');
    } catch (error) { logToConsole(`Error generating ZIP: ${error.message}`, 'error'); alert("Failed to generate ZIP file."); }
}

console.log("article-bulk.js loaded (v8.21 refactor prompts)");