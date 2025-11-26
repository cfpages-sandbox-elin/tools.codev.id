// article-bulk.js (v9.12 new delivery)
import { getState, getBulkPlan, updateBulkPlanItem, addBulkArticle, saveBulkArticlesState, getAllBulkArticles } from './article-state.js';
import { logToConsole, callAI, delay, showElement, disableElement, getArticleOutlinesV2, slugify, constructImagePrompt } from './article-helpers.js';
import { getElement, updatePlanItemStatusUI } from './article-ui.js';
import { getBulkStructurePrompt, getBulkSectionTextPrompt } from './article-prompts.js';
import { deliverArticle, generateZipBundle } from './article-delivery.js';

let isBulkRunning = false;

export async function handleStartBulkGeneration() {
    const state = getState();
    const plan = getBulkPlan();
    
    // 1. Validation
    if (plan.length === 0) { alert("Plan is empty."); return; }
    if (state.textProviders.length === 1) {
        if (!confirm("Warning: You are using only 1 AI Provider. This might hit rate limits. Continue?")) return;
    }

    // Delivery Validation
    if (state.deliveryMode === 'wordpress') {
        if (!state.wpUrl || !state.wpUsername || !state.wpPassword) {
            alert("Please configure ALL WordPress credentials (URL, User, App Password)."); return;
        }
        // Basic URL check
        if (!state.wpUrl.startsWith('http')) {
            alert("WordPress URL must start with http:// or https://"); return;
        }
    } else if (state.deliveryMode === 'github') {
        if (!state.githubRepoUrl) {
            alert("Please enter a GitHub Repository URL."); return;
        }
    }

    // 2. UI Setup
    isBulkRunning = true;
    const ui = {
        btn: getElement('startBulkGenerationBtn'),
        progress: getElement('bulkGenerationProgress'),
        count: getElement('bulkCurrentNum'),
        total: getElement('bulkTotalNum'),
        keyword: getElement('bulkCurrentKeyword')
    };

    disableElement(ui.btn, true);
    showElement(ui.progress, true);
    if(ui.total) ui.total.textContent = plan.length;

    // 3. Execution Loop
    const providers = state.textProviders;
    const concurrency = providers.length;
    
    // Filter only non-completed items
    const queue = plan.map((item, idx) => ({ ...item, originalIndex: idx }))
                      .filter(i => !i.status.startsWith('Completed'));

    let providerIndex = 0;

    const worker = async () => {
        while (queue.length > 0) {
            const task = queue.shift();
            const provider = providers[providerIndex % concurrency];
            providerIndex++;

            if(ui.count) ui.count.textContent = (plan.length - queue.length);
            if(ui.keyword) ui.keyword.textContent = task.keyword;

            await processSingleArticle(task, task.originalIndex, provider);
        }
    };

    const workers = Array(concurrency).fill(null).map(() => worker());
    await Promise.all(workers);

    // 4. Final Delivery: ZIP (Only if mode is ZIP)
    if (state.deliveryMode === 'zip') {
        logToConsole("All articles generated. Preparing ZIP...", "info");
        const articles = getAllBulkArticles();
        if (Object.keys(articles).length > 0) {
            await generateZipBundle(articles);
        } else {
            alert("No articles were generated successfully to zip.");
        }
    }

    // 5. Cleanup
    isBulkRunning = false;
    disableElement(ui.btn, false);
    showElement(ui.progress, false);
    
    const doneMsg = state.deliveryMode === 'zip' ? "Bulk generation & download complete." : "Bulk generation & posting complete.";
    logToConsole(doneMsg, "success");
    alert(doneMsg);
}

async function processSingleArticle(item, index, providerConfig) {
    updatePlanItemStatusUI(index, 'Generating');
    const state = getState();

    try {
        // 1. Structure Generation
        logToConsole(`[${item.keyword}] Generating structure...`, 'info');
        const structurePayload = {
            providerKey: providerConfig.provider,
            model: providerConfig.model,
            prompt: getBulkStructurePrompt(item)
        };
        const structRes = await callAI('generate', structurePayload);
        if (!structRes.success) throw new Error(`Structure generation failed: ${structRes.error}`);
        
        const sections = getArticleOutlinesV2(structRes.text);
        if (sections.length === 0) throw new Error("No sections parsed from structure.");

        // 2. Content Generation (Section by Section)
        let articleBody = "";
        let prevContext = "";

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            logToConsole(`[${item.keyword}] Generating section ${i+1}/${sections.length}...`, 'info');
            
            const textPayload = {
                providerKey: providerConfig.provider,
                model: providerConfig.model,
                prompt: getBulkSectionTextPrompt(item, section, prevContext)
            };
            
            // Strict Check: Wait for response
            const textRes = await callAI('generate', textPayload);
            
            // CRITICAL FIX: If any section fails, abort the whole article
            if (!textRes.success || !textRes.text) {
                throw new Error(`Generation failed at section "${section.heading}": ${textRes.error || 'Empty response'}`);
            }
            
            articleBody += textRes.text + "\n\n";
            prevContext = textRes.text;
            
            await delay(300); // Rate limit buffer
        }

        // 3. Final Assembly with Frontmatter (Metadata)
        const fileExtension = state.format === 'html' ? '.html' : '.md';
        const filename = item.slug + fileExtension;
        
        // Construct Content
        let finalContent = articleBody;

        // If Markdown/GitHub, Add Frontmatter
        if (state.format === 'markdown' || state.deliveryMode === 'github') {
            const dateStr = item.scheduledDate ? item.scheduledDate : new Date().toISOString();
            const frontmatter = `---
                title: "${item.title.replace(/"/g, '\\"')}"
                date: ${dateStr}
                author: ${state.readerName || 'Admin'}
                intent: ${item.intent}
                ---\n\n`;
            finalContent = frontmatter + articleBody;
        }

        // 4. Validation
        if (finalContent.length < 200) {
            throw new Error("Generated article is too short (potential error). Delivery skipped.");
        }

        // 5. Save Locally
        addBulkArticle(filename, finalContent);

        // 6. Delivery (WP / GitHub)
        // Only runs if we reached this line (meaning all sections passed)
        if (state.deliveryMode === 'wordpress' || state.deliveryMode === 'github') {
            updatePlanItemStatusUI(index, 'Delivering...');
            
            const deliveryData = {
                title: item.title,
                content: finalContent,
                filename: filename,
                scheduledDate: item.scheduledDate
            };

            const deliveryRes = await deliverArticle(deliveryData, index);
            
            if (!deliveryRes.success) {
                 throw new Error(`Delivery failed: ${deliveryRes.error}`);
            }
        }

        updatePlanItemStatusUI(index, 'Completed');
        updateBulkPlanItem(index, { status: 'Completed', filename: filename });
        logToConsole(`[${item.keyword}] Finished successfully.`, 'success');

    } catch (e) {
        logToConsole(`Error processing "${item.title}": ${e.message}`, "error");
        updatePlanItemStatusUI(index, 'Failed', e.message);
        updateBulkPlanItem(index, { status: 'Failed', error: e.message });
    }
}

export async function handleDownloadZip() {
    const articles = getAllBulkArticles();
    if (Object.keys(articles).length === 0) {
        alert("No articles generated yet.");
        return;
    }
    await generateZipBundle(articles);
}