// ideas-plan.js

import { getState } from './ideas-state.js';
import { getAiAnalysis } from './ideas-api.js';
import { showError } from './ideas-ui.js';
import { extractAndParseJson } from './ideas.js';
import { createPlanPrompt } from './ideas-prompts.js';

// --- Dynamic Model Selection ---

/**
 * Checks if a model is suitable for the free planning phase.
 * This is a self-contained version of the logic from ideas-ui.js.
 * @param {object} model - The model object from the provider config.
 * @param {string} providerKey - The key of the provider.
 * @returns {boolean} - True if the model is considered free.
 */
function isFreeForPlanning(model, providerKey) {
    if (!model) return false;
    if (providerKey === 'openrouter' || providerKey === 'huggingface') return true;
    if (model.pricing?.input === 0.00 && model.pricing?.output === 0.00) return true;
    if (model.rateLimits?.tiers?.some(tier => tier.name.toLowerCase().includes('free'))) return true;
    if (model.rateLimits?.notes?.toLowerCase().includes('free tier')) return true;
    return false;
}

/**
 * Selects the best models for planning from the available providers.
 * @returns {Array<object>} A sorted list of the top models to use for planning.
 */
function selectPlanningModels() {
    const { allAiProviders } = getState();
    if (!allAiProviders) {
        console.error("AI Providers not loaded, cannot select planning models.");
        return [];
    }

    const MIN_CONTEXT_WINDOW = 65536; // Require at least a 64k context window
    const MAX_MODELS_TO_USE = 5;
    let candidates = [];

    for (const providerKey in allAiProviders) {
        const provider = allAiProviders[providerKey];
        for (const model of provider.models) {
            // Check if the model is free and has a large enough context window
            if (isFreeForPlanning(model, providerKey) && model.contextWindow >= MIN_CONTEXT_WINDOW) {
                candidates.push({ 
                    providerKey, 
                    modelId: model.id, 
                    contextWindow: model.contextWindow 
                });
            }
        }
    }

    // Sort candidates by context window size in descending order (best first)
    candidates.sort((a, b) => b.contextWindow - a.contextWindow);

    // Return the top N candidates
    return candidates.slice(0, MAX_MODELS_TO_USE);
}


// --- Core Functionality ---

export async function initPlanTab() {
    const { currentVideoId } = getState();
    const planContainer = document.getElementById('plan-content');
    planContainer.innerHTML = ''; 

    if (!currentVideoId) {
        planContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">Please analyze a video in the 'Brainstorm' tab first.</p>`;
        return;
    }

    // Dynamically select the best models for the job
    const planningModels = selectPlanningModels();

    if (planningModels.length === 0) {
        planContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">Could not find any suitable free, high-context AI models for planning. Please check your AI provider configuration.</p>`;
        return;
    }
    
    console.log("Dynamically Selected Planning Models:", planningModels.map(m => m.modelId));

    const analysisCacheKey = `analysis_${currentVideoId}`;
    const cachedAnalysis = localStorage.getItem(analysisCacheKey);

    if (!cachedAnalysis) {
        planContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">No analysis found. Please re-analyze the video in the 'Brainstorm' tab.</p>`;
        return;
    }

    const analysis = JSON.parse(cachedAnalysis);
    const productIdeas = analysis.insights?.filter(i => i.category === 'Product Idea') || [];

    if (productIdeas.length === 0) {
        planContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">No 'Product Ideas' were found in the analysis to plan for.</p>`;
        return;
    }

    // Pass the dynamically selected models to the generator function
    for (const idea of productIdeas) {
        generateAndRenderPlanForIdea(idea, planContainer, planningModels);
    }
}

async function generateAndRenderPlanForIdea(idea, container, planningModels) {
    const ideaSlug = idea.title.toLowerCase().replace(/\s+/g, '-').slice(0, 30);
    const planCacheKey = `plan_${getState().currentVideoId}_${ideaSlug}`;
    const planCardId = `plan-card-${ideaSlug}`;

    container.innerHTML += `
        <div id="${planCardId}" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-2">${idea.title}</h2>
            <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">${idea.description}</p>
            <div class="border-t border-gray-200 dark:border-slate-700 pt-4">
                <div class="loader-container text-center">
                    <p class="font-semibold">Generating strategic plans from ${planningModels.length} different AIs...</p>
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mt-2"></div>
                </div>
                <div class="results-container"></div>
            </div>
        </div>
    `;

    const planCard = document.getElementById(planCardId);
    const resultsContainer = planCard.querySelector('.results-container');
    const loaderContainer = planCard.querySelector('.loader-container');

    const cachedPlan = localStorage.getItem(planCacheKey);
    if (cachedPlan) {
        console.log(`Loading plan for [${idea.title}] from cache.`);
        renderPlans(JSON.parse(cachedPlan), resultsContainer);
        loaderContainer.style.display = 'none';
        return;
    }

    const planPromises = planningModels.map(config => {
        const prompt = createPlanPrompt(idea);
        return getAiAnalysis(prompt, config.providerKey, config.modelId)
            .then(response => ({ ...response, ...config }))
            .catch(error => ({ success: false, error: error.message, ...config }));
    });

    const results = await Promise.allSettled(planPromises);
    const planData = results.map(r => r.value || r.reason);

    renderPlans(planData, resultsContainer);
    loaderContainer.style.display = 'none';

    localStorage.setItem(planCacheKey, JSON.stringify(planData));
}

// renderPlans function remains unchanged...
function renderPlans(planData, container) {
    let html = '<div class="space-y-4">';
    planData.forEach(result => {
        if (result.success) {
            try {
                const plan = extractAndParseJson(result.text);
                html += `
                <details class="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg">
                    <summary class="font-semibold cursor-pointer text-gray-800 dark:text-slate-200">✅ Plan from <strong>${result.providerKey}</strong> (${result.modelId})</summary>
                    <div class="mt-4 border-t border-gray-300 dark:border-slate-600 pt-4 space-y-3 text-sm">
                        <h4 class="font-bold text-indigo-600 dark:text-sky-400">Feasibility Analysis (Score: ${plan.feasibilityAnalysis.overallScore}/10)</h4>
                        <p><strong>AI Buildability:</strong> ${plan.feasibilityAnalysis.aiBuildability.score}/10 - <em>${plan.feasibilityAnalysis.aiBuildability.reasoning}</em></p>
                        <p><strong>Market Demand:</strong> ${plan.feasibilityAnalysis.marketDemand.score}/10 - <em>${plan.feasibilityAnalysis.marketDemand.reasoning}</em></p>
                        <p><strong>Monetization Potential:</strong> ${plan.feasibilityAnalysis.monetizationPotential.score}/10 - <em>${plan.feasibilityAnalysis.monetizationPotential.reasoning}</em></p>
                        
                        <h4 class="font-bold text-indigo-600 dark:text-sky-400 pt-2">MVP Feature Set</h4>
                        <ul>${plan.mvp.features.map(f => `<li>- ${f}</li>`).join('')}</ul>
                        
                        <h4 class="font-bold text-indigo-600 dark:text-sky-400 pt-2">Technical Stack</h4>
                        <ul>${plan.mvp.techStack.map(t => `<li>- <strong>${t.component}:</strong> ${t.recommendation}</li>`).join('')}</ul>

                        <h4 class="font-bold text-indigo-600 dark:text-sky-400 pt-2">Go-to-Market Plan</h4>
                         <ol class="list-decimal list-inside">${plan.goToMarketStrategy.map(s => `<li>${s}</li>`).join('')}</ol>
                    </div>
                </details>
                `;
            } catch (e) {
                 html += `<div class="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg text-red-700 dark:text-red-300"><strong>Error from ${result.providerKey}:</strong> Failed to parse JSON. ${e.message}</div>`;
            }
        } else {
            html += `<div class="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg text-red-700 dark:text-red-300"><strong>Error from ${result.providerKey}:</strong> ${result.error}</div>`;
        }
    });
    html += '</div>';
    container.innerHTML = html;
}