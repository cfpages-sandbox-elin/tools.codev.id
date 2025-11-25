// article-planning.js (v9.12 new delivery)
import { getState, setBulkPlan, getBulkPlan, updateState } from './article-state.js';
import { callAI, logToConsole, slugify, delay, showElement, disableElement } from './article-helpers.js';
import { getElement, renderPlanningTable } from './article-ui.js';
import { calculateDistributionDates } from './article-delivery.js';

// --- Prompts ---
function getBrainstormPrompt(keywords, language, audience) {
    return `Analyze the following seed keywords:
${keywords.join(', ')}

Task: Brainstorm a list of unique, engaging article topics based on these seeds.
Target Audience: ${audience}
Language: ${language}

Requirements:
1. Avoid duplicate intents (e.g., "How to buy X" and "Buying Guide for X" are duplicates).
2. Generate SEO-friendly Titles.
3. Determine the Search Intent (Informational, Commercial, Transactional).
4. Create a URL-friendly Slug.

Output strictly as a JSON Array of objects:
[{"keyword": "seed used", "title": "The Title", "slug": "the-slug", "intent": "Informational"}]
`;
}

// --- Logic ---

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
    
    // Warning check
    const state = getState();
    const providers = state.textProviders;
    if (providers.length === 0) { alert("No AI Provider configured."); return; }

    showElement(ui.step1_5, true);
    showElement(ui.loading, true);
    disableElement(ui.btn, true);

    logToConsole(`Brainstorming topics for ${keywords.length} keywords...`, "info");

    try {
        // We use the first provider for planning
        const provider = providers[0]; 
        const prompt = getBrainstormPrompt(keywords, state.language, state.audience);
        
        const payload = {
            providerKey: provider.provider,
            model: provider.model,
            prompt: prompt
        };

        const result = await callAI('generate', payload);
        
        let newPlanItems = [];
        if (result.success && result.text) {
            try {
                // Attempt to find JSON
                const jsonMatch = result.text.match(/\[.*\]/s);
                if (jsonMatch) {
                    newPlanItems = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("No JSON found");
                }
            } catch (e) {
                logToConsole("Failed to parse AI plan. Fallback to simple map.", "warn");
                // Fallback
                newPlanItems = keywords.map(k => ({
                    keyword: k,
                    title: `Guide to ${k}`,
                    slug: slugify(k),
                    intent: 'Informational'
                }));
            }
        }

        // Deduplication Logic
        const existingPlan = getBulkPlan(); // In case we are appending
        // For this button, we usually overwrite or append? Let's Overwrite for a fresh plan based on input
        // Actually, simpler to just set it fresh.
        
        // Deduplicate internal list based on Slug
        const uniqueItems = [];
        const seenSlugs = new Set();
        
        newPlanItems.forEach(item => {
            const s = slugify(item.slug || item.title);
            if (!seenSlugs.has(s)) {
                seenSlugs.add(s);
                uniqueItems.push({ ...item, slug: s, status: 'Pending' });
            }
        });

        // Update State
        setBulkPlan(uniqueItems);
        
        // Calculate Dates if WP mode (preview)
        // We will do this dynamically in render or just update state
        const dates = calculateDistributionDates(uniqueItems.length);
        if (dates.length > 0) {
            uniqueItems.forEach((item, i) => item.scheduledDate = dates[i]);
            setBulkPlan(uniqueItems); // Save with dates
        }

        renderPlanningTable(uniqueItems);
        logToConsole(`Plan generated with ${uniqueItems.length} unique topics.`, "success");

    } catch (e) {
        logToConsole(`Planning error: ${e.message}`, "error");
    } finally {
        showElement(ui.loading, false);
        disableElement(ui.btn, false);
    }
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