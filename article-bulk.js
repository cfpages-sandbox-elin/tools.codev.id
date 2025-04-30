// article-bulk.js
import { getState, getBulkPlan, updateBulkPlanItem, addBulkArticle, saveBulkArticlesState, getBulkArticle, getAllBulkArticles } from './article-state.js';
import { logToConsole, callAI, sanitizeFilename, slugify, getArticleOutlines, constructImagePrompt, delay } from './article-helpers.js';
import { getElement, updatePlanItemStatusUI, updateProgressBar, hideProgressBar, renderPlanningTable } from './article-ui.js';
import { languageOptions } from './article-config.js';

let bulkImagesToUpload = []; // Queue for bulk uploads { filename, base64, articleFilename }
let isBulkRunning = false; // Flag to prevent multiple runs

// --- Parse and Prepare Keywords ---
export function prepareKeywords() {
    const ui = {
        bulkKeywords: getElement('bulkKeywords'),
    };
    const rawKeywords = ui.bulkKeywords.value.split('\n');
    const cleanedKeywords = rawKeywords
        .map(kw => kw.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')) // Remove leading/trailing symbols
        .filter(kw => kw.length > 0); // Remove empty lines
    const uniqueKeywords = [...new Set(cleanedKeywords)]; // Remove duplicates

    logToConsole(`Prepared ${uniqueKeywords.length} unique keywords for planning.`, 'info');
    return uniqueKeywords;
}

// --- Generate Planning Table ---
export async function handleGeneratePlan() {
    const keywords = prepareKeywords();
    if (keywords.length === 0) {
        alert("Please enter at least one keyword in the bulk keywords text area.");
        return;
    }

    const state = getState();
    const ui = {
        loadingIndicator: getElement('planLoadingIndicator'),
        button: getElement('generatePlanBtn'),
        step1_5Section: getElement('step1_5'),
        planningTableBody: getElement('planningTableBody'),
    };

    logToConsole(`Generating plan for ${keywords.length} keywords...`, 'info');
    ui.planningTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 py-4">Generating plan... <span class="loader inline-block"></span></td></tr>`; // Show loading state in table
    showElement(ui.step1_5Section, true); // Show the planning section

    const planPrompt = buildPlanPrompt(keywords);
    const planPayload = {
        providerKey: state.textProvider,
        model: state.textModel, // Use the selected text model
        prompt: planPrompt
    };

    const result = await callAI('generate', planPayload, ui.loadingIndicator, ui.button);

    if (result?.success && result.text) {
        const parsedPlan = parsePlanResponse(result.text, keywords);
        const uniquePlan = removeDuplicatePlanItems(parsedPlan); // Remove duplicates based on title/slug/intent
        setBulkPlan(uniquePlan.map(item => ({ ...item, status: 'Pending' }))); // Add status field and save
        renderPlanningTable(getBulkPlan()); // Render the final plan
        logToConsole(`Plan generated and rendered with ${uniquePlan.length} unique items.`, 'success');
    } else {
        logToConsole('Failed to generate plan.', 'error');
        alert(`Failed to generate plan. Error: ${result?.error || 'Unknown error'}`);
        ui.planningTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 py-4">Failed to generate plan.</td></tr>`;
    }
}

function buildPlanPrompt(keywords) {
    const state = getState();
    // Construct a prompt asking the AI to generate title, slug, and intent for each keyword
    return `For each keyword provided below, generate a unique and SEO-friendly article Title, a URL-safe Slug (lowercase, hyphen-separated, no stop words, descriptive), and the primary User Intent (e.g., Informational, Commercial Investigation, Transactional, Navigational).
    Ensure Title, Slug, and Intent are unique across all keywords. If multiple keywords result in the same concept, only include one entry.
    Format the output strictly as a JSON array of objects, where each object has "keyword", "title", "slug", and "intent" keys.

    Language for Title/Intent: ${state.language}
    Target Audience: ${state.audience}
    Article Purpose(s): ${state.purpose.join(', ')}

    Keywords:
    ${keywords.join('\n')}

    Output only the JSON array. Example object: {"keyword": "...", "title": "...", "slug": "...", "intent": "..."}`;
}

function parsePlanResponse(responseText, originalKeywords) {
    let plan = [];
    try {
        // Attempt to parse JSON directly
        plan = JSON.parse(responseText);
        if (!Array.isArray(plan)) throw new Error("Response is not a JSON array.");
        // Validate structure
        plan = plan.filter(item => item && item.keyword && item.title && item.slug && item.intent);
        // Ensure slugs are valid
        plan.forEach(item => { item.slug = slugify(item.slug || item.title || item.keyword); });

    } catch (e) {
        logToConsole(`Failed to parse plan response as JSON: ${e.message}. Attempting fallback parsing.`, 'warn');
        // Fallback: Try to parse line-by-line if JSON fails (less reliable)
        const lines = responseText.split('\n');
        originalKeywords.forEach(kw => {
            // Basic heuristic: find lines related to the keyword
            const relatedLines = lines.filter(line => line.toLowerCase().includes(kw.toLowerCase()));
            let title = `Title for ${kw}`; // Default
            let slug = slugify(kw);
            let intent = 'Informational'; // Default
            // Try to extract from related lines (very basic)
            relatedLines.forEach(line => {
                if (line.match(/title:/i)) title = line.split(/title:/i)[1]?.trim() || title;
                if (line.match(/slug:/i)) slug = slugify(line.split(/slug:/i)[1]?.trim() || slug);
                if (line.match(/intent:/i)) intent = line.split(/intent:/i)[1]?.trim() || intent;
            });
            plan.push({ keyword: kw, title: title.replace(/^"|"$/g, ''), slug: slug, intent: intent.replace(/^"|"$/g, '') });
        });
    }
    return plan;
}

function removeDuplicatePlanItems(plan) {
    const uniqueTitles = new Set();
    const uniqueSlugs = new Set();
    const uniqueIntents = new Set(); // Less critical, but good to check
    const uniquePlan = [];

    for (const item of plan) {
        const lowerTitle = item.title.toLowerCase();
        const lowerSlug = item.slug.toLowerCase(); // Slugs should already be lowercase
        const lowerIntent = item.intent.toLowerCase();

        if (!uniqueTitles.has(lowerTitle) && !uniqueSlugs.has(lowerSlug) /* && !uniqueIntents.has(lowerIntent) */) {
            uniqueTitles.add(lowerTitle);
            uniqueSlugs.add(lowerSlug);
            uniqueIntents.add(lowerIntent);
            uniquePlan.push(item);
        } else {
            logToConsole(`Removed duplicate plan item for keyword "${item.keyword}" due to non-unique title/slug.`, 'warn');
        }
    }
    return uniquePlan;
}


// --- Start Bulk Generation ---
export async function handleStartBulkGeneration() {
    if (isBulkRunning) {
        logToConsole("Bulk generation is already running.", "warn");
        return;
    }
    const plan = getBulkPlan();
    if (plan.length === 0) {
        alert("Planning table is empty. Please generate a plan first.");
        return;
    }
    // Re-validate base settings before starting
    // if (!validateInputs()) return; // Might be too strict if user only wants to run existing plan

    isBulkRunning = true;
    logToConsole("Starting bulk article generation process...", "info");
    const ui = {
        button: getElement('startBulkGenerationBtn'),
        bulkGenProgress: getElement('bulkGenerationProgress'),
        bulkCurrentNum: getElement('bulkCurrentNum'),
        bulkTotalNum: getElement('bulkTotalNum'),
        bulkCurrentKeyword: getElement('bulkCurrentKeyword'),
        uploadProgressContainer: getElement('bulkUploadProgressContainer'),
        uploadProgressBar: getElement('bulkUploadProgressBar'),
        uploadProgressText: getElement('bulkUploadProgressText'),
    };
    disableElement(ui.button, true); // Disable start button
    showElement(ui.bulkGenProgress, true);
    ui.bulkTotalNum.textContent = plan.length;
    hideProgressBar(null, ui.uploadProgressContainer, ui.uploadProgressText); // Ensure upload bar is hidden

    bulkImagesToUpload = []; // Clear image queue for this run

    for (let i = 0; i < plan.length; i++) {
        const item = plan[i];
        // Skip already completed items
        if (item.status === 'Completed') {
            logToConsole(`Skipping already completed item: ${item.keyword}`, 'info');
            continue;
        }

        ui.bulkCurrentNum.textContent = i + 1;
        ui.bulkCurrentKeyword.textContent = item.keyword;
        updatePlanItemStatusUI(i, 'Generating');
        updateBulkPlanItem(i, { status: 'Generating', error: null }); // Update state

        try {
            // --- 1. Generate Structure ---
            logToConsole(`Generating structure for: ${item.keyword}`, 'info');
            const structurePrompt = buildBulkStructurePrompt(item);
            const structurePayload = buildBulkPayload(structurePrompt);
            const structureResult = await callAI('generate', structurePayload, null, null);
            if (!structureResult?.success || !structureResult.text) {
                throw new Error(`Structure generation failed: ${structureResult?.error || 'No text returned'}`);
            }
            const structure = structureResult.text;
            const outlines = getArticleOutlines(structure);
            if (outlines.length === 0) {
                throw new Error("Could not parse outlines from generated structure.");
            }

            // --- 2. Generate Article Sections Incrementally ---
            let combinedArticleContent = '';
            let previousSectionContent = '';
            let sectionImagePlaceholders = {}; // Store placeholders for this article { placeholderId: finalTag }

            for (let j = 0; j < outlines.length; j++) {
                const currentOutline = outlines[j];
                logToConsole(`Generating section ${j+1}/${outlines.length} for: ${item.keyword}`, 'info');

                // --- Generate Text ---
                const textPrompt = buildBulkTextPrompt(item, currentOutline, previousSectionContent);
                const textPayload = buildBulkPayload(textPrompt);
                const textResult = await callAI('generate', textPayload, null, null);
                if (!textResult?.success || !textResult.text) {
                    throw new Error(`Text generation failed for section ${j+1}: ${textResult?.error || 'No text returned'}`);
                }
                const currentSectionText = textResult.text.trim() + '\n\n'; // Markdown format
                combinedArticleContent += currentSectionText;
                previousSectionContent = currentSectionText;

                // --- Generate Image (if enabled) ---
                const state = getState();
                if (state.generateImages) {
                    const imagePayload = buildBulkImagePayload(item, currentSectionText, currentOutline, j + 1);
                    const imageResult = await callAI('generate_image', imagePayload, null, null);
                    if (imageResult?.success && imageResult.imageData) {
                        const filename = imagePayload.filename;
                        const altText = `Image for ${currentOutline.substring(0, 50)}`;
                        const placeholderId = `img-placeholder-${filename.replace(/\./g, '-')}`; // Used for potential later replacement if needed

                        if (state.imageStorage === 'github') {
                            bulkImagesToUpload.push({ filename: filename, base64: imageResult.imageData, articleFilename: item.filename }); // Queue for upload
                            sectionImagePlaceholders[placeholderId] = `[Uploading image: ${filename}...]`; // Placeholder text
                            logToConsole(`Image ${filename} queued for GitHub upload.`, 'info');
                        } else { // base64
                            sectionImagePlaceholders[placeholderId] = `![${altText}](data:image/png;base64,${imageResult.imageData})`; // Embed directly
                            logToConsole(`Image for section ${j+1} embedded as base64.`, 'success');
                        }
                         // Add placeholder to content *now*
                         combinedArticleContent += sectionImagePlaceholders[placeholderId] + '\n\n';
                    } else {
                        logToConsole(`Failed image gen for section ${j+1}. Error: ${imageResult?.error}`, 'warn');
                        combinedArticleContent += `[Image generation failed for this section]\n\n`;
                    }
                }
            } // End section loop

            // --- 3. Save Article Content ---
            const articleFilename = `${item.slug}.md`;
            updateBulkPlanItem(i, { filename: articleFilename }); // Save filename to plan
            addBulkArticle(articleFilename, combinedArticleContent); // Add to in-memory store

            // --- 4. Update Status ---
            updatePlanItemStatusUI(i, 'Completed');
            updateBulkPlanItem(i, { status: 'Completed', generatedContent: combinedArticleContent }); // Store generated content in plan state temporarily if needed, or rely on bulkArticles store
            logToConsole(`Article generation completed for: ${item.keyword}`, 'success');

        } catch (error) {
            logToConsole(`Failed processing item ${i+1} (${item.keyword}): ${error.message}`, 'error');
            updatePlanItemStatusUI(i, 'Failed', error.message);
            updateBulkPlanItem(i, { status: 'Failed', error: error.message });
            // Continue to the next item
        }

        await delay(500); // Small delay between items

    } // End main bulk loop

    // --- 5. Save All Generated Articles ---
    saveBulkArticlesState(); // Save all generated articles at the end

    // --- 6. Handle GitHub Uploads (if needed) ---
    const finalState = getState(); // Get latest state
    if (finalState.generateImages && finalState.imageStorage === 'github' && bulkImagesToUpload.length > 0) {
        await uploadBulkImagesToGithub(); // Wait for uploads to finish
    } else {
        hideProgressBar(null, ui.uploadProgressContainer, ui.uploadProgressText); // Ensure hidden if no uploads
    }

    // --- Finalize ---
    isBulkRunning = false;
    disableElement(ui.button, false); // Re-enable start button
    showElement(ui.bulkGenProgress, false); // Hide progress text
    logToConsole("Bulk article generation process finished.", "info");
    alert("Bulk generation process complete. Check the planning table for status and the console log for details.");
}


// --- Build Payload Functions (Bulk Mode Specific) ---
function buildBulkPayload(prompt) {
    const state = getState();
    return {
        providerKey: state.textProvider,
        model: state.textModel, // Use the globally selected text model
        prompt: prompt
    };
}

function buildBulkStructurePrompt(planItem) {
    const state = getState();
    return `Generate a detailed article structure/outline for an article titled "${planItem.title}" (intent: ${planItem.intent}) about the keyword "${planItem.keyword}".
    - Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''}
    - Target Audience: ${state.audience}
    - Tone: ${state.tone}
    ${state.gender ? `- Author Gender Persona: ${state.gender}` : ''}
    ${state.age ? `- Author Age Persona: ${state.age}` : ''}
    - Article Purpose(s): ${state.purpose.join(', ')}
    ${state.purposeUrl && state.purpose.includes('Promote URL') ? `  - Promotional URL: ${state.purposeUrl}` : ''}
    ${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? `  - Desired Call to Action: ${state.purposeCta}` : ''}
    ${state.readerName ? `- Address Reader As: ${state.readerName}` : ''}
    ${state.customSpecs ? `- Other Details: ${state.customSpecs}` : ''}
    Instructions: Output ONLY the structure using clear headings/bullets. No intro/conclusion about the structure.`;
}

function buildBulkTextPrompt(planItem, currentOutline, previousContext) {
    const state = getState();
    const plan = getBulkPlan(); // Get current plan for linking

    // Internal linking - find slugs of other planned articles
    const otherSlugs = plan
        .filter(p => p.slug && p.slug !== planItem.slug) // Exclude self
        .map(p => p.slug)
        .slice(0, 10); // Limit number of internal links considered per section

    // Sitemap linking
    const sitemapUrls = state.sitemapUrls || [];
    const externalUrls = sitemapUrls.slice(0, 5); // Limit external links considered

    let linkingInstructions = '\n\nLinking Instructions:\n';
    const linkType = state.linkTypeInternal ? 'Internal (relative paths like /slug)' : 'External (absolute URLs)';
    linkingInstructions += `- Link Type Preference: ${linkType}.\n`;
    if (otherSlugs.length > 0) {
        linkingInstructions += `- Consider linking naturally to these related internal topics (use relative path like /${planItem.slug} without .md): ${otherSlugs.join(', ')}\n`;
    }
    if (externalUrls.length > 0) {
        linkingInstructions += `- Also consider linking to relevant external URLs from this list if appropriate: ${externalUrls.join('\n')}\n`;
    }
    linkingInstructions += '- Aim for 1-3 relevant links total within this section, if appropriate.\n';


    return `Generate the Markdown article content ONLY for the section/outline: "${currentOutline}"
    This is part of an article titled "${planItem.title}" (intent: ${planItem.intent}) about keyword "${planItem.keyword}".

    Previous Context (end of last section):
    ---
    ${previousContext ? previousContext.slice(-500) : '(Start of article)'}
    ---

    Overall Article Specifications:
    - Language: ${state.language}${state.dialect ? ` (${state.dialect} dialect)` : ''} - Target Audience: ${state.audience} - Tone: ${state.tone} ${state.gender ? `- Author Gender: ${state.gender}` : ''} ${state.age ? `- Author Age: ${state.age}` : ''} - Purpose(s): ${state.purpose.join(', ')} ${state.purposeUrl && state.purpose.includes('Promote URL') ? ` - Promo URL: ${state.purposeUrl}` : ''} ${state.purposeCta && state.purpose.some(p => p.startsWith('Promote') || p === 'Generate Leads') ? ` - CTA: ${state.purposeCta}` : ''} ${state.readerName ? `- Reader Name: ${state.readerName}` : ''} ${state.customSpecs ? `- Other Details: ${state.customSpecs}` : ''}
    ${linkingInstructions}
    Instructions:
    - Write ONLY the Markdown content for "${currentOutline}". Do NOT repeat the outline heading unless natural. Ensure smooth transition. Use standard Markdown. Do NOT add intro/concluding remarks about the generation process.`;
}

function buildBulkImagePayload(planItem, sectionContent, sectionTitle, sectionIndex) {
    const state = getState();
    const filename = sanitizeFilename(`${planItem.slug}-${slugify(sectionTitle)}-${Date.now()}-${sectionIndex}.png`);
    const imagePrompt = constructImagePrompt(sectionContent, sectionTitle);

    return {
        providerKey: state.imageProvider,
        model: state.imageModel,
        prompt: imagePrompt,
        filename: filename,
        numImages: state.numImages || 1,
        aspectRatio: state.imageAspectRatio,
        style: state.imageStyle || undefined,
        text: state.imageText || undefined
    };
}


// --- GitHub Image Upload Function (Bulk Mode) ---
async function uploadBulkImagesToGithub() {
    if (bulkImagesToUpload.length === 0) return;
    const state = getState();
    const ui = {
        uploadProgressContainer: getElement('bulkUploadProgressContainer'),
        uploadProgressBar: getElement('bulkUploadProgressBar'),
        uploadProgressText: getElement('bulkUploadProgressText'),
    };

    const repoUrl = state.githubRepoUrl;
    if (!repoUrl) { alert("GitHub Repo URL is required for upload."); return; }
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch || urlMatch.length < 3) { alert("Invalid GitHub Repo URL format."); return; }
    const owner = urlMatch[1];
    const repo = urlMatch[2].replace(/\.git$/, '');
    const repoDomain = repo.toLowerCase();

    const customPath = state.githubCustomPath;
    let basePath;
    if (customPath) { basePath = (customPath.startsWith('/') ? customPath.substring(1) : customPath).replace(/\/$/, '') + '/'; }
    else {
        const langKey = Object.keys(languageOptions).find(key => languageOptions[key].name === state.language || key === state.language) || 'English';
        basePath = (languageOptions[langKey]?.defaultPath || '/articles/').replace(/^\//, '').replace(/\/$/, '') + '/'; // Use language default path for images too
    }

    logToConsole(`Starting Bulk GitHub image upload to ${owner}/${repo} path /${basePath}...`, 'info');
    updateProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText, 0, bulkImagesToUpload.length, 'Uploading image ');

    let uploadedCount = 0;
    const totalImages = bulkImagesToUpload.length;
    const uploadedUrls = {}; // Store successful uploads: { placeholderId: finalUrl }

    for (let i = 0; i < totalImages; i++) {
        const img = bulkImagesToUpload[i];
        updateProgressBar(ui.uploadProgressBar, ui.uploadProgressContainer, ui.uploadProgressText, i, totalImages, `Uploading image ${i + 1} of ${totalImages} (${img.filename}) `);
        const fullPath = basePath + img.filename;
        const payload = { owner: owner, repo: repo, path: fullPath, content: img.base64, message: `Upload image: ${img.filename} via AI Tool` };
        const result = await callAI('upload_image', payload, null, null);

        if (result?.success) {
            const finalImageUrl = `https://${repoDomain}/${fullPath}`;
            logToConsole(`Uploaded ${img.filename}. URL: ${finalImageUrl}`, 'success');
            uploadedUrls[img.placeholderId] = finalImageUrl; // Store URL against placeholder ID
            uploadedCount++;
        } else {
            logToConsole(`Failed to upload ${img.filename}. Error: ${result?.error || 'Unknown'}`, 'error');
            uploadedUrls[img.placeholderId] = `[Upload failed: ${img.filename}]`; // Store error message
            // Update plan item status to indicate partial failure?
            const planIndex = getBulkPlan().findIndex(item => item.filename === img.articleFilename);
            if (planIndex !== -1) {
                 updatePlanItemStatusUI(planIndex, 'Completed (Image Upload Failed)');
                 updateBulkPlanItem(planIndex, { status: 'Completed (Image Upload Failed)', error: `Image upload failed: ${img.filename}` });
            }
        }
         // Update progress after attempt
        const progressPercent = Math.round(((i + 1) / totalImages) * 100);
        ui.uploadProgressBar.style.width = `${progressPercent}%`;
    }

    // --- Replace Placeholders in Saved Articles ---
    logToConsole("Replacing image placeholders in generated articles...", "info");
    const plan = getBulkPlan();
    plan.forEach(item => {
        if (item.filename && bulkArticles[item.filename]) {
            let content = bulkArticles[item.filename];
            let updated = false;
            for (const placeholderId in uploadedUrls) {
                // Construct the placeholder text used during generation
                const filenameMatch = placeholderId.match(/img-placeholder-(.*?)-[0-9]+$/); // Extract filename base
                if (filenameMatch && filenameMatch[1]) {
                    const expectedFilename = filenameMatch[1].replace(/-/g,'.'); // Reconstruct approx filename
                    const placeholderTextRegex = new RegExp(`\\[Uploading image: ${expectedFilename.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}.*?\\]`, 'g'); // Match placeholder text more broadly
                    const finalReplacement = uploadedUrls[placeholderId].startsWith('[') // Check if it's an error message
                        ? uploadedUrls[placeholderId] // Use error message
                        : `![${filenameMatch[1]}](${uploadedUrls[placeholderId]})`; // Use final URL

                    if (content.match(placeholderTextRegex)) {
                        content = content.replace(placeholderTextRegex, finalReplacement);
                        updated = true;
                    }
                }
            }
            if (updated) {
                addBulkArticle(item.filename, content); // Update the stored article content
            }
        }
    });
    saveBulkArticlesState(); // Save updated articles

    ui.uploadProgressText.textContent = `Upload complete (${uploadedCount}/${totalImages} successful). Placeholders replaced.`;
    logToConsole(`GitHub upload process finished. Placeholders replaced.`, 'info');
}


// --- Download Bulk Articles as ZIP ---
export async function handleDownloadZip() {
    const articles = getAllBulkArticles();
    const filenames = Object.keys(articles);
    if (filenames.length === 0) {
        alert("No bulk articles have been generated yet.");
        return;
    }

    logToConsole("Preparing ZIP file for download...", "info");
    const zip = new JSZip();
    filenames.forEach(filename => {
        zip.file(filename, articles[filename]); // Add each article to the zip
    });

    try {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const plan = getBulkPlan();
        const firstKeyword = plan[0]?.keyword ? slugify(plan[0].keyword) : 'bulk';
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const zipFilename = `bulk-articles-${firstKeyword}-${dateStr}.zip`;

        // Trigger download
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = zipFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Clean up blob URL
        logToConsole(`ZIP file '${zipFilename}' generated and download initiated.`, 'success');
    } catch (error) {
        logToConsole(`Error generating ZIP file: ${error.message}`, 'error');
        alert("Failed to generate ZIP file.");
    }
}


console.log("article-bulk.js loaded");