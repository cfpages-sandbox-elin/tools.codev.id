// ideas-plan.js v1.15 add replan + multi provider
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
    const MAX_PROVIDERS_TO_USE = 5;
    let providerCandidates = {};

    // 1. Find the best model for EACH provider
    for (const providerKey in allAiProviders) {
        const provider = allAiProviders[providerKey];
        let bestModelForProvider = null;

        for (const model of provider.models) {
            // Check if the model is suitable
            if (isFreeForPlanning(model, providerKey) && model.contextWindow >= MIN_CONTEXT_WINDOW) {
                // If we haven't found a model for this provider yet, or this one is better
                if (!bestModelForProvider || model.contextWindow > bestModelForProvider.contextWindow) {
                    bestModelForProvider = {
                        providerKey,
                        modelId: model.id.split('/').pop(), // Sanitize the ID
                        contextWindow: model.contextWindow
                    };
                }
            }
        }

        // If we found a suitable model for this provider, add it to our list of candidates
        if (bestModelForProvider) {
            providerCandidates[providerKey] = bestModelForProvider;
        }
    }

    // 2. Convert to an array and sort by context window to get the best providers first
    const sortedCandidates = Object.values(providerCandidates)
                                   .sort((a, b) => b.contextWindow - a.contextWindow);

    // 3. Return the top N providers
    return sortedCandidates.slice(0, MAX_PROVIDERS_TO_USE);
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

const delay = ms => new Promise(res => setTimeout(res, ms));

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
                    <p class="font-semibold">Generating strategic plans from ${planningModels.length} different AI providers...</p>
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
        renderPlans(JSON.parse(cachedPlan), resultsContainer, idea);
        attachPlanEventListeners(resultsContainer);
        loaderContainer.style.display = 'none';
        return;
    }

    const STAGGER_DELAY_MS = 250;

    const planPromises = planningModels.map((config, index) => {
        return delay(index * STAGGER_DELAY_MS).then(() => {
            console.log(`[Staggered Call] Requesting plan from ${config.providerKey}/${config.modelId}...`);
            const prompt = createPlanPrompt(idea);
            return getAiAnalysis(prompt, config.providerKey, config.modelId)
                .then(response => ({ ...response, ...config }))
                .catch(error => ({ success: false, error: error.message, ...config }));
        });
    });

    const results = await Promise.allSettled(planPromises);
    const planData = results.map(r => r.value || r.reason);

    renderPlans(planData, resultsContainer, idea);
    attachPlanEventListeners(resultsContainer);
    
    loaderContainer.style.display = 'none';
    localStorage.setItem(planCacheKey, JSON.stringify(planData));
}

async function handleReplan(event) {
    const btn = event.currentTarget;
    const ideaSlug = btn.dataset.ideaSlug;
    const originalProvider = btn.dataset.originalProvider;
    const originalModel = btn.dataset.originalModel;

    const idea = {
        title: btn.dataset.ideaTitle,
        description: btn.dataset.ideaDescription
    };

    // Find the specific UI elements for this card
    const planDetailsContainer = document.getElementById(`plan-details-${ideaSlug}-${originalProvider}`);
    const providerSelect = document.getElementById(`replan-provider-${ideaSlug}-${originalProvider}`);
    const modelSelect = document.getElementById(`replan-model-${ideaSlug}-${originalProvider}`);

    if (!planDetailsContainer || !providerSelect || !modelSelect) {
        showError("Could not find the replan UI components.");
        return;
    }

    const newProvider = providerSelect.value;
    const newModel = modelSelect.value;

    btn.disabled = true;
    btn.innerHTML = 'Re-planning...';
    planDetailsContainer.style.opacity = '0.5';

    try {
        const prompt = createPlanPrompt(idea);
        const result = await getAiAnalysis(prompt, newProvider, newModel);

        if (!result.success) {
            throw new Error(result.error || 'Re-plan API call failed.');
        }

        const newPlan = extractAndParseJson(result.text);

        // Re-render just the inner content of this specific plan
        planDetailsContainer.innerHTML = renderSinglePlanContent(newPlan, newProvider, newModel);

        // Update the cache
        const planCacheKey = `plan_${getState().currentVideoId}_${ideaSlug}`;
        const cachedPlansJSON = localStorage.getItem(planCacheKey);
        if (cachedPlansJSON) {
            let plans = JSON.parse(cachedPlansJSON);
            // Find and update the specific plan in the cached array
            const planIndex = plans.findIndex(p => p.providerKey === originalProvider && p.modelId === originalModel);
            if (planIndex !== -1) {
                plans[planIndex] = { ...result, providerKey: newProvider, modelId: newModel };
                localStorage.setItem(planCacheKey, JSON.stringify(plans));
                console.log(`Cache updated for replanned idea: ${idea.title}`);
            }
        }

    } catch (e) {
        showError(`Failed to re-plan: ${e.message}`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Re-plan';
        planDetailsContainer.style.opacity = '1';
    }
}

function renderSinglePlanContent(plan, providerKey, modelId) {
    return `
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
    `;
}

function renderPlans(planData, container, idea) {
    const ideaSlug = idea.title.toLowerCase().replace(/\s+/g, '-').slice(0, 30);
    let html = '<div class="space-y-4">';

    planData.forEach(result => {
        const uniqueIdSuffix = `${ideaSlug}-${result.providerKey}`;

        if (result.success) {
            try {
                const plan = extractAndParseJson(result.text);
                html += `
                <details class="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg group" open>
                    <summary class="font-semibold cursor-pointer text-gray-800 dark:text-slate-200 list-none flex justify-between items-center">
                        <span>✅ Plan from <strong>${result.providerKey}</strong> (${result.modelId})</span>
                        <span class="text-xs text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    
                    <div id="plan-details-${uniqueIdSuffix}" class="mt-4 border-t border-gray-300 dark:border-slate-600 pt-4 space-y-3 text-sm transition-opacity duration-300">
                        ${renderSinglePlanContent(plan, result.providerKey, result.modelId)}
                    </div>
                    
                    <!-- Re-plan Controls -->
                    <div class="mt-4 border-t border-gray-300 dark:border-slate-600 pt-4 space-y-2">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                            <select id="replan-provider-${uniqueIdSuffix}" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm"></select>
                            <select id="replan-model-${uniqueIdSuffix}" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm"></select>
                            <button id="replan-btn-${uniqueIdSuffix}" 
                                    data-idea-slug="${ideaSlug}"
                                    data-original-provider="${result.providerKey}"
                                    data-original-model="${result.modelId}"
                                    data-idea-title="${idea.title}"
                                    data-idea-description="${idea.description}"
                                    class="replan-btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-md w-full">Re-plan</button>
                        </div>
                    </div>
                </details>`;
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

function attachPlanEventListeners(container) {
    const replanButtons = container.querySelectorAll('.replan-btn');

    replanButtons.forEach(btn => {
        btn.addEventListener('click', handleReplan);

        const ideaSlug = btn.dataset.ideaSlug;
        const originalProvider = btn.dataset.originalProvider;
        const uniqueIdSuffix = `${ideaSlug}-${originalProvider}`;

        const providerSelect = document.getElementById(`replan-provider-${uniqueIdSuffix}`);
        const modelSelect = document.getElementById(`replan-model-${uniqueIdSuffix}`);

        if (providerSelect && modelSelect) {
            // Populate provider dropdown
            const { allAiProviders } = getState();
            providerSelect.innerHTML = Object.keys(allAiProviders).map(key => `<option value="${key}">${allAiProviders[key].models[0].provider}</option>`).join('');
            
            // Function to update model dropdown
            const updateModels = () => {
                const selectedProviderKey = providerSelect.value;
                const providerData = allAiProviders[selectedProviderKey];
                modelSelect.innerHTML = providerData.models.filter(m => isFreeForPlanning(m, selectedProviderKey)).map(m => `<option value="${m.id.split('/').pop()}">${m.name}</option>`).join('');
            };

            // Set initial state and add listener
            providerSelect.value = originalProvider;
            updateModels();
            providerSelect.addEventListener('change', updateModels);
        }
    });
}