// article-planning.js (v9.13 canggih)
import { getState, setBulkPlan, getBulkPlan, updateBulkPlanItem, updateState } from './article-state.js';
import { callAI, logToConsole, slugify, delay, showElement, disableElement, getArticleOutlinesV2 } from './article-helpers.js';
import { getElement, renderPlanningTable } from './article-ui.js';
import { calculateDistributionDates } from './article-delivery.js';
import { getBulkStructurePrompt } from './article-prompts.js';

// --- Fetch WP Data ---
async function fetchWpContext() {
    const state = getState();
    if (state.deliveryMode !== 'wordpress' || !state.wpUrl) return;

    const credentials = {
        wpUrl: state.wpUrl,
        username: state.wpUsername,
        password: state.wpPassword,
        action: 'get_categories'
    };

    logToConsole("Fetching WordPress categories...", "info");
    
    try {
        // Fetch Categories
        const catRes = await fetch('/wordpress-api', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }).then(r => r.json());

        if (catRes.success) {
            const catNames = catRes.categories.map(c => c.name);
            updateState({ availableCategories: catNames });
            logToConsole(`Found ${catNames.length} WP categories.`, "success");
        }

        // Fetch Posts (for linking)
        credentials.action = 'get_posts';
        const postRes = await fetch('/wordpress-api', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }).then(r => r.json());

        if (postRes.success) {
            updateState({ existingPostLinks: postRes.posts });
            logToConsole(`Found ${postRes.posts.length} existing WP posts for linking.`, "success");
        }

    } catch (e) {
        logToConsole("Failed to fetch WP context. Proceeding without it.", "warn");
    }
}

function getPlanningPrompt(keywords, categories) {
    const catString = categories.length > 0 
        ? `Choose the best Category from this list: [${categories.join(', ')}]. If none fit, create a new one.`
        : `Create a relevant Category for each topic.`;

    return `Analyze these keywords:
        ${keywords.join(', ')}

        Task: Plan a content calendar.
        1. Generate a unique Title.
        2. Create a SEO slug.
        3. Determine User Intent.
        4. ${catString}

        Output strictly JSON Array:
        [{"keyword": "...", "title": "...", "slug": "...", "intent": "...", "category": "..."}]`;
}

export async function handleGeneratePlan() {
    const ui = {
        bulkKeywords: getElement('bulkKeywords'),
        loading: getElement('planLoadingIndicator'),
        btn: getElement('generatePlanBtn'),
        step1_5: getElement('step1_5Section')
    };

    const rawText = ui.bulkKeywords.value.trim();
    if (!rawText) { alert("Please enter keywords."); return; }
    const keywords = rawText.split('\n').map(k => k.trim()).filter(k => k);
    const state = getState();

    showElement(ui.step1_5, true);
    showElement(ui.loading, true);
    disableElement(ui.btn, true);

    // 1. Context Fetch (if WP)
    await fetchWpContext();
    const freshState = getState(); // Get updated state

    try {
        const provider = state.textProviders[0]; 
        const prompt = getPlanningPrompt(keywords, freshState.availableCategories);
        
        const payload = {
            providerKey: provider.provider,
            model: provider.model,
            prompt: prompt
        };

        logToConsole("Generating content plan...", "info");
        const result = await callAI('generate', payload);
        
        let newPlanItems = [];
        if (result.success && result.text) {
            try {
                const jsonMatch = result.text.match(/\[.*\]/s);
                if (jsonMatch) newPlanItems = JSON.parse(jsonMatch[0]);
            } catch (e) {
                logToConsole("Plan JSON parse error. Using fallback.", "warn");
                newPlanItems = keywords.map(k => ({
                    keyword: k, title: k, slug: slugify(k), intent: 'Info', category: 'Uncategorized'
                }));
            }
        }

        // Deduplicate & Format
        const uniqueItems = [];
        const seenSlugs = new Set();
        
        newPlanItems.forEach(item => {
            const s = slugify(item.slug || item.title);
            if (!seenSlugs.has(s)) {
                seenSlugs.add(s);
                uniqueItems.push({ 
                    ...item, 
                    slug: s, 
                    status: 'Pending',
                    structure: '' // Initialize empty structure
                });
            }
        });

        setBulkPlan(uniqueItems);
        recalculatePlanDates(); // Apply dates
        renderPlanningTable(uniqueItems);
        logToConsole(`Plan created with ${uniqueItems.length} topics.`, "success");

    } catch (e) {
        logToConsole(`Planning error: ${e.message}`, "error");
    } finally {
        showElement(ui.loading, false);
        disableElement(ui.btn, false);
    }
}

// --- Phase 1: Bulk Structure Generation ---
export async function generateBulkStructures() {
    const plan = getBulkPlan();
    const state = getState();
    const provider = state.textProviders[0];
    
    const queue = plan.map((item, idx) => ({ ...item, index: idx }))
                      .filter(i => !i.structure); // Only those without structure

    if (queue.length === 0) {
        alert("All articles already have structures.");
        return;
    }

    if(!confirm(`Generate structures for ${queue.length} articles?`)) return;

    const progress = getElement('bulkGenerationProgress');
    showElement(progress, true);

    for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        progress.textContent = `Structuring ${i+1}/${queue.length}: ${item.keyword}...`;
        
        try {
            const prompt = getBulkStructurePrompt(item);
            const res = await callAI('generate', {
                providerKey: provider.provider,
                model: provider.model,
                prompt: prompt
            });

            if (res.success) {
                // Save structure to plan
                updateBulkPlanItem(item.index, { structure: res.text, status: 'Structure Ready' });
            }
            await delay(250); // Polite delay
        } catch (e) {
            console.error(e);
        }
    }

    renderPlanningTable(getBulkPlan()); // Refresh UI to show "Structure Ready"
    showElement(progress, false);
    logToConsole("Bulk Structure Generation Complete.", "success");
    
    // Refresh button state
    const btn = getElement('startBulkGenerationBtn');
    btn.textContent = "🚀 Start Bulk Generation (Content)";
    btn.classList.replace('bg-yellow-600', 'bg-indigo-700');
}

export function deletePlanRow(index) {
    const currentPlan = getBulkPlan();
    if (index > -1 && index < currentPlan.length) {
        currentPlan.splice(index, 1);
        
        // Recalculate dates if needed
        const dates = calculateDistributionDates(currentPlan.length);
        if (dates.length > 0) {
            currentPlan.forEach((item, i) => item.scheduledDate = dates[i]);
        }
        
        setBulkPlan(currentPlan);
        renderPlanningTable(currentPlan);
        logToConsole("Row deleted.", "info");
    }
}

export function prepareKeywords() {
    const ui = { bulkKeywords: getElement('bulkKeywords') };
    if (!ui.bulkKeywords) return [];
    const rawKeywords = ui.bulkKeywords.value.split('\n');
    const cleanedKeywords = rawKeywords
        .map(kw => kw
            .replace(/\(\d+\)/g, '') 
            .replace(/\s+/g, ' ')    
            .trim()                  
        )
        .filter(kw => kw.length > 0);
    const uniqueKeywords = [...new Set(cleanedKeywords)];
    
    const newTextareaValue = uniqueKeywords.join('\n');
    ui.bulkKeywords.value = newTextareaValue;
    
    // Use imported updateState from article-state.js
    updateState({ bulkKeywordsContent: newTextareaValue });
    
    return uniqueKeywords;
}

export function recalculatePlanDates() {
    const currentPlan = getBulkPlan();
    const dates = calculateDistributionDates(currentPlan.length);
    
    if (dates.length > 0) {
        currentPlan.forEach((item, i) => item.scheduledDate = dates[i]);
        setBulkPlan(currentPlan);
        renderPlanningTable(currentPlan);
        logToConsole("Scheduled dates updated.", "info");
    }
}