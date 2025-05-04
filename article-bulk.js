// article-bulk.js (v8.13 OutlineV2 Alignment)
import { getState, getBulkPlan, updateBulkPlanItem, addBulkArticle, saveBulkArticlesState, getBulkArticle, getAllBulkArticles, setBulkPlan } from './article-state.js';
import { logToConsole, callAI, sanitizeFilename, slugify, getArticleOutlinesV2, constructImagePrompt, delay } from './article-helpers.js';
import { getElement, updatePlanItemStatusUI, updateProgressBar, hideProgressBar, renderPlanningTable } from './article-ui.js';
import { languageOptions } from './article-config.js';

let bulkImagesToUpload = [];
let isBulkRunning = false;
let currentBulkPlan = []; // Keep a local copy during generation

// --- Parse and Prepare Keywords ---
export function prepareKeywords() {
    const ui = { bulkKeywords: getElement('bulkKeywords') };
    if (!ui.bulkKeywords) return [];
    const rawKeywords = ui.bulkKeywords.value.split('\n');
    const cleanedKeywords = rawKeywords
        .map(kw => kw.trim().replace(/^[^a-zA-Z0-9\u00C0-\u017F]+|[^a-zA-Z0-9\u00C0-\u017F]+$/g, '')) // Allow more characters initially
        .filter(kw => kw.length > 0);
    const uniqueKeywords = [...new Set(cleanedKeywords)];
    logToConsole(`Prepared ${uniqueKeywords.length} unique keywords for planning.`, 'info');
    return uniqueKeywords;
}

// --- Generate Planning Table ---
export async function handleGeneratePlan() {
    const keywords = prepareKeywords();
    if (keywords.length === 0) { alert("Please enter keywords."); return; }
    const state = getState();
    const ui = { loadingIndicator: getElement('planLoadingIndicator'), button: getElement('generatePlanBtn'), step1_5Section: getElement('step1_5'), planningTableBody: getElement('planningTableBody') };

    logToConsole(`Generating plan for ${keywords.length} keywords...`, 'info');
    ui.planningTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 py-4">Generating plan... <span class="loader inline-block"></span></td></tr>`;
    showElement(ui.step1_5Section, true);

    const planPrompt = buildPlanPrompt(keywords); // Use local helper
    const planPayload = { providerKey: state.textProvider, model: state.textModel, prompt: planPrompt };
    const result = await callAI('generate', planPayload, ui.loadingIndicator, ui.button);

    if (result?.success && result.text) {
        const parsedPlan = parsePlanResponse(result.text, keywords); // Use local helper
        const uniquePlan = removeDuplicatePlanItems(parsedPlan); // Use local helper
        setBulkPlan(uniquePlan.map(item => ({ ...item, status: 'Pending', filename: `${item.slug}.md` }))); // Add status & default filename
        renderPlanningTable(getBulkPlan());
        logToConsole(`Plan generated with ${uniquePlan.length} unique items.`, 'success');
    } else {
        logToConsole('Failed to generate plan.', 'error');
        alert(`Failed to generate plan. Error: ${result?.error || 'Unknown error'}`);
        ui.planningTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 py-4">Failed to generate plan.</td></tr>`;
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
        bulkGenProgress: getElement('bulkGenerationProgress'),
        bulkCurrentNum: getElement('bulkCurrentNum'),
        bulkTotalNum: getElement('bulkTotalNum'),
        bulkCurrentKeyword: getElement('bulkCurrentKeyword'),
        uploadProgressContainer: getElement('bulkUploadProgressContainer'),
        uploadProgressBar: getElement('bulkUploadProgressBar'),
        uploadProgressText: getElement('bulkUploadProgressText')
    };
    disableElement(ui.button, true); showElement(ui.bulkGenProgress, true);
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
            const structurePrompt = buildBulkStructurePrompt(item);
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
                // *** Use new payload builder V2 ***
                const textPrompt = buildBulkTextPayloadV2(item, section, previousSectionContent);
                const textPayload = buildBulkPayload(textPrompt); // buildBulkPayload just wraps provider/model
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
    alert("Bulk generation process complete. Check statuses and download ZIP if needed.");
}

// --- Build Payload Functions (Bulk Mode Specific Helpers) ---
function buildPlanPrompt(keywords) {
    const state = getState();
    return `For each keyword provided below, generate a unique and SEO-friendly article Title, a URL-safe Slug (lowercase, hyphen-separated, no stop words, descriptive), and the primary User Intent (e.g., Informational, Commercial Investigation, Transactional, Navigational). Ensure Title, Slug, and Intent are unique across all keywords. If multiple keywords result in the same concept, only include one entry. Format the output strictly as a JSON array of objects, where each object has "keyword", "title", "slug", and "intent" keys.\n\nLanguage for Title/Intent: ${state.language}\nTarget Audience: ${state.audience}\nArticle Purpose(s): ${state.purpose.join(', ')}\n\nKeywords:\n${keywords.join('\n')}\n\nOutput only the JSON array.`;
}

function parsePlanResponse(responseText, originalKeywords) {
    let plan = []; try { plan = JSON.parse(responseText); if (!Array.isArray(plan)) throw new Error("Not array."); plan = plan.filter(item => item && item.keyword && item.title && item.slug && item.intent); plan.forEach(item => { item.slug = slugify(item.slug || item.title || item.keyword); }); } catch (e) { logToConsole(`JSON parse failed: ${e.message}. Fallback parsing.`, 'warn'); originalKeywords.forEach(kw => { let title = `Title for ${kw}`, slug = slugify(kw), intent = 'Informational'; plan.push({ keyword: kw, title: title.replace(/^"|"$/g, ''), slug: slug, intent: intent.replace(/^"|"$/g, '') }); }); } return plan;
}

function removeDuplicatePlanItems(plan) {
    const uniqueTitles = new Set(); const uniqueSlugs = new Set(); const uniquePlan = [];
    for (const item of plan) { const lowerTitle = item.title.toLowerCase(); const lowerSlug = item.slug.toLowerCase(); if (!uniqueTitles.has(lowerTitle) && !uniqueSlugs.has(lowerSlug)) { uniqueTitles.add(lowerTitle); uniqueSlugs.add(lowerSlug); uniquePlan.push(item); } else { logToConsole(`Removed duplicate plan item for "${item.keyword}".`, 'warn'); } } return uniquePlan;
}

function buildBulkPayload(prompt) { const state = getState(); return { providerKey: state.textProvider, model: state.textModel, prompt: prompt }; }

function buildBulkStructurePrompt(planItem) {
    const state = getState();
    return `Generate a detailed article structure/outline for an article titled "${planItem.title}" (intent: ${planItem.intent}) about the keyword "${planItem.keyword}".\n- Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''}\n- Target Audience: ${state.audience}\n- Tone: ${state.tone}\n${state.gender ? `- Author Gender: ${state.gender}` : ''}\n${state.age ? `- Author Age: ${state.age}` : ''}\n- Purpose(s): ${state.purpose.join(', ')}\n${state.purposeUrl && state.purpose.includes('Promote URL') ? ` - Promo URL: ${state.purposeUrl}` : ''}\n${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? ` - CTA: ${state.purposeCta}` : ''}\n${state.readerName ? `- Reader Name: ${state.readerName}` : ''}\n${state.customSpecs ? `- Other Details: ${state.customSpecs}` : ''}\nInstructions: Output ONLY the structure using clear headings/bullets. No intro/conclusion.`;
}

// *** NEW: V2 Payload builder for Bulk Text ***
function buildBulkTextPayloadV2(planItem, section, previousContext) {
    const state = getState(); // Get global settings like linking preferences
    const allPlanItems = getBulkPlan(); // Get full plan for internal linking context

    // Internal Linking Context
    const otherSlugs = allPlanItems
        .filter(p => p.slug && p.slug !== planItem.slug) // Exclude self
        .map(p => `/${p.slug}`) // Format as relative paths
        .slice(0, 8); // Limit suggestions

    // External Linking Context (from sitemap)
    const sitemapUrls = state.sitemapUrls || [];
    const externalUrls = sitemapUrls.slice(0, 5); // Limit suggestions

    // Build Linking Instructions
    let linkingInstructions = '\n\nLinking Instructions (Optional):\n';
    const linkTypePref = state.linkTypeInternal ? 'Internal (use relative paths like /slug)' : 'External (use full URLs)';
    linkingInstructions += `- Link Type Preference: ${linkTypePref}.\n`;
    if (otherSlugs.length > 0 && state.linkTypeInternal) {
        linkingInstructions += `- Consider linking naturally to related internal topics: ${otherSlugs.join(', ')}\n`;
    }
    if (externalUrls.length > 0 && !state.linkTypeInternal) {
        linkingInstructions += `- Consider linking naturally to relevant external URLs:\n${externalUrls.join('\n')}\n`;
    }
    linkingInstructions += '- Aim for 1-3 relevant links total within this section, only if contextually appropriate.\n';

    // Build Points Guidance
    let pointsGuidance = '';
    if (section.points && section.points.length > 0) {
        pointsGuidance = `\nKey points/subtopics to cover in this section:\n- ${section.points.join('\n- ')}\n`;
    }

    // Construct the Main Prompt
    const prompt = `Generate the Markdown article content ONLY for the section titled or about: "${section.heading}".\nThis section belongs to an article about the keyword "${planItem.keyword}" with the title "${planItem.title}" (User Intent: ${planItem.intent}).\n${pointsGuidance}\nContinue naturally from the previous context.\nPrevious Context (end of last section):\n---\n${previousContext ? previousContext.slice(-500) : '(Start of article)'}\n---\n\nOverall Article Specifications:\n- Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''}\n- Audience: ${state.audience}\n- Tone: ${state.tone}\n${state.gender ? `- Author Gender: ${state.gender}\n` : ''}${state.age ? `- Author Age: ${state.age}\n` : ''}- Purpose(s): ${state.purpose.join(', ')}\n${state.purposeUrl && state.purpose.includes('Promote URL') ? ` - Promo URL: ${state.purposeUrl}\n` : ''}${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? ` - CTA: ${state.purposeCta}\n` : ''}${state.readerName ? `- Reader Name: ${state.readerName}\n` : ''}${state.customSpecs ? `- Other Details: ${state.customSpecs}\n` : ''}${linkingInstructions}\nInstructions:\n- Write ONLY the Markdown content for the current section: "${section.heading}".\n- Use the provided key points as essential guidance for the content.\n- Do NOT repeat the main section heading ("${section.heading}") unless it fits naturally as a Markdown heading (e.g., ## Sub Heading).\n- Ensure smooth transition from previous context.\n- Use standard Markdown formatting ONLY.\n- Do NOT add introductory or concluding remarks about the writing process or the section itself. Focus solely on generating the body content for this specific section.`;

    return prompt;
}

function buildBulkTextPrompt(planItem, currentOutline, previousContext) {
    const state = getState(); const plan = getBulkPlan();
    const otherSlugs = plan.filter(p => p.slug && p.slug !== planItem.slug).map(p => p.slug).slice(0, 10);
    const sitemapUrls = state.sitemapUrls || []; const externalUrls = sitemapUrls.slice(0, 5);
    let linkingInstructions = '\n\nLinking Instructions:\n'; const linkType = state.linkTypeInternal ? 'Internal (relative paths like /slug)' : 'External (absolute URLs)'; linkingInstructions += `- Link Type Preference: ${linkType}.\n`;
    if (otherSlugs.length > 0) { linkingInstructions += `- Consider linking naturally to internal topics (use relative path like /${planItem.slug} without .md): ${otherSlugs.join(', ')}\n`; }
    if (externalUrls.length > 0) { linkingInstructions += `- Also consider external URLs: ${externalUrls.join('\n')}\n`; } linkingInstructions += '- Aim for 1-3 relevant links total in this section.\n';
    return `Generate the Markdown article content ONLY for the section/outline: "${currentOutline}"\nThis is part of an article titled "${planItem.title}" about keyword "${planItem.keyword}".\nPrevious Context (end of last section):\n---\n${previousContext ? previousContext.slice(-500) : '(Start)'}\n---\nOverall Specs:\n- Language: ${state.language}${state.dialect ? ` (${state.dialect})` : ''} - Audience: ${state.audience} - Tone: ${state.tone} ${state.gender ? `- Gender: ${state.gender}` : ''} ${state.age ? `- Age: ${state.age}` : ''} - Purpose(s): ${state.purpose.join(', ')} ${state.purposeUrl && state.purpose.includes('Promote URL') ? ` - Promo URL: ${state.purposeUrl}` : ''} ${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? ` - CTA: ${state.purposeCta}` : ''} ${state.readerName ? `- Reader: ${state.readerName}` : ''} ${state.customSpecs ? `- Details: ${state.customSpecs}` : ''}\n${linkingInstructions}\nInstructions:\n- Write ONLY Markdown content for "${currentOutline}". Do NOT repeat heading. Ensure smooth transition. Use standard Markdown. No intro/concluding remarks.`;
}

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
        if (result?.success) { const finalImageUrl = `https://${repoDomain}/${fullPath}`; logToConsole(`Uploaded ${img.filename}. URL: ${finalImageUrl}`, 'success'); uploadedUrls[img.filename] = finalImageUrl; uploadedCount++; } // Store URL against filename
        else { logToConsole(`Failed to upload ${img.filename}. Error: ${result?.error || 'Unknown'}`, 'error'); uploadedUrls[img.filename] = `[Upload failed: ${img.filename}]`; const planIndex = getBulkPlan().findIndex(item => item.filename === img.articleFilename); if (planIndex !== -1) { updatePlanItemStatusUI(planIndex, 'Completed (Image Upload Failed)'); updateBulkPlanItem(planIndex, { status: 'Completed (Image Upload Failed)', error: `Image upload failed: ${img.filename}` }); } }
        const progressPercent = Math.round(((i + 1) / totalImages) * 100); ui.uploadProgressBar.style.width = `${progressPercent}%`;
    }

    // Replace Placeholders
    logToConsole("Replacing image placeholders in generated bulk articles...", "info");
    const plan = getBulkPlan();
    plan.forEach(item => {
        if (item.filename && bulkArticles[item.filename]) {
            let content = bulkArticles[item.filename]; let updated = false;
            const placeholderRegex = /\[Uploading image: (.*?)\.\.\.\]/g;
            content = content.replace(placeholderRegex, (match, filename) => {
                if (uploadedUrls[filename]) { updated = true; return uploadedUrls[filename].startsWith('[') ? uploadedUrls[filename] : `![${filename}](${uploadedUrls[filename]})`; }
                return match; // Keep placeholder if upload failed or filename mismatch
            });
            if (updated) { addBulkArticle(item.filename, content); }
        }
    });
    saveBulkArticlesState();

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

console.log("article-bulk.js loaded (v8.13 OutlineV2 Alignment)");