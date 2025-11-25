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
        // 1. Structure
        const structurePayload = {
            providerKey: providerConfig.provider,
            model: providerConfig.model,
            prompt: getBulkStructurePrompt(item)
        };
        const structRes = await callAI('generate', structurePayload);
        if (!structRes.success) throw new Error(structRes.error);
        
        const sections = getArticleOutlinesV2(structRes.text);
        let articleContent = "";
        let prevContext = "";

        // 2. Sections
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const textPayload = {
                providerKey: providerConfig.provider,
                model: providerConfig.model,
                prompt: getBulkSectionTextPrompt(item, section, prevContext)
            };
            const textRes = await callAI('generate', textPayload);
            if (!textRes.success) throw new Error(`Section ${i} failed`);
            
            articleContent += textRes.text + "\n\n";
            prevContext = textRes.text;
            await delay(200);
        }

        // 3. Save locally
        const filename = item.slug + (state.format === 'html' ? '.html' : '.md');
        addBulkArticle(filename, articleContent);

        // 4. Delivery (WP / GitHub)
        // We pass the content immediately to delivery
        const deliveryData = {
            title: item.title,
            content: articleContent,
            filename: filename,
            scheduledDate: item.scheduledDate
        };

        updatePlanItemStatusUI(index, 'Delivering...');
        const deliveryRes = await deliverArticle(deliveryData, index);
        
        if (deliveryRes && !deliveryRes.success && state.deliveryMode !== 'zip') {
             throw new Error(`Delivery failed: ${deliveryRes.error}`);
        }

        updatePlanItemStatusUI(index, 'Completed');
        updateBulkPlanItem(index, { status: 'Completed', filename: filename });

    } catch (e) {
        logToConsole(`Error processing "${item.title}": ${e.message}`, "error");
        updatePlanItemStatusUI(index, 'Failed', e.message);
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