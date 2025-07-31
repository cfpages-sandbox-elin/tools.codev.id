// ideas-plan.js v1.15 ideaslug + simple ver
import { getState } from './ideas-state.js';
import { getAiAnalysis } from './ideas-api.js';
import { showError } from './ideas-ui.js';
import { extractAndParseJson } from './ideas.js';
import { createPlanPrompt } from './ideas-prompts.js';

// --- A. HELPER FUNCTIONS ---

// Simplified function to select ONE reliable default model for the initial plan generation.
function selectDefaultPlanningModel() {
    const { allAiProviders } = getState();
    if (!allAiProviders) return null;

    const preferredOrder = [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },        
        { provider: 'google', model: 'gemma-3-27b-it' },
        { provider: 'openrouter', model: 'google/gemma-2-9b-it' }
    ];

    for (const pref of preferredOrder) {
        if (allAiProviders[pref.provider]) {
            return { providerKey: pref.provider, modelId: pref.model };
        }
    }

    for (const providerKey in allAiProviders) {
        const freeModel = allAiProviders[providerKey].models.find(m => m.id);
        if (freeModel) {
            return { providerKey, modelId: freeModel.id.split('/').pop() };
        }
    }
    return null;
}

// Renders the content of a single plan.
function renderPlanContent(plan) {
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

// Renders the complete UI for a product card, including the plan and its controls.
function renderPlanAndControls(container, plan, idea, providerKey, modelId, ideaSlug) {
    container.innerHTML = `
        <div class="space-y-3 text-sm" id="plan-content-${ideaSlug}">
            ${renderPlanContent(plan)}
        </div>
        <div class="mt-4 border-t border-gray-300 dark:border-slate-600 pt-4 space-y-2">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                <select id="replan-provider-${ideaSlug}" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm"></select>
                <select id="replan-model-${ideaSlug}" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm"></select>
                <button id="replan-btn-${ideaSlug}" 
                        data-idea-slug="${ideaSlug}"
                        data-idea-title="${idea.title}"
                        data-idea-description="${idea.description}"
                        class="replan-btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-md w-full">
                    Re-plan
                </button>
            </div>
        </div>
    `;
    attachPlanEventListeners(container, providerKey, ideaSlug);
}

// --- B. EVENT HANDLERS AND LISTENERS ---

// Handles the "Re-plan" button click for a single product.
async function handleReplan(event) {
    const btn = event.currentTarget;
    const ideaSlug = btn.dataset.ideaSlug;
    const idea = { title: btn.dataset.ideaTitle, description: btn.dataset.ideaDescription };

    const planContentContainer = document.getElementById(`plan-content-${ideaSlug}`);
    const providerSelect = document.getElementById(`replan-provider-${ideaSlug}`);
    const modelSelect = document.getElementById(`replan-model-${ideaSlug}`);

    const newProvider = providerSelect.value;
    const newModel = modelSelect.value;

    btn.disabled = true;
    btn.textContent = 'Re-planning...';
    planContentContainer.style.opacity = '0.5';

    try {
        const prompt = createPlanPrompt(idea);
        const result = await getAiAnalysis(prompt, newProvider, newModel);
        if (!result.success) throw new Error(result.error);
        
        const newPlan = extractAndParseJson(result.text);
        planContentContainer.innerHTML = renderPlanContent(newPlan);

        // Update cache
        const planCacheKey = `plan_v3_${getState().currentVideoId}_${ideaSlug}`;
        localStorage.setItem(planCacheKey, JSON.stringify({ plan: newPlan, providerKey: newProvider, modelId: newModel }));

    } catch (e) {
        showError(`Failed to re-plan: ${e.message}`);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Re-plan';
        planContentContainer.style.opacity = '1';
    }
}

// Wires up the controls for a single product card.
function attachPlanEventListeners(container, initialProvider, ideaSlug) {
    const replanButton = container.querySelector('.replan-btn');
    if (!replanButton) return;

    const providerSelect = document.getElementById(`replan-provider-${ideaSlug}`);
    const modelSelect = document.getElementById(`replan-model-${ideaSlug}`);
    
    replanButton.addEventListener('click', handleReplan);

    // Populate provider dropdown
    const { allAiProviders } = getState();
    providerSelect.innerHTML = Object.keys(allAiProviders).map(key => `<option value="${key}">${allAiProviders[key].models[0].provider}</option>`).join('');
    
    const updateModels = () => {
        const models = allAiProviders[providerSelect.value].models;
        modelSelect.innerHTML = models.map(m => `<option value="${m.id.split('/').pop()}">${m.name}</option>`).join('');
    };

    providerSelect.value = initialProvider; // Set to the provider that made the current plan
    updateModels();
    providerSelect.addEventListener('change', updateModels);
}

// --- C. MAIN WORKER AND ENTRY POINT ---

// Fetches and renders a plan for ONE product idea.
async function generateAndRenderPlanForIdea(idea, container) {
    // --- CREATE THE SANITIZED SLUG ONCE HERE ---
    const ideaSlug = idea.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove all non-word, non-space, non-hyphen characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .slice(0, 50);            // Use a slightly longer slice for uniqueness
    
    const planCacheKey = `plan_v3_${getState().currentVideoId}_${ideaSlug}`;
    const planCardId = `plan-card-${ideaSlug}`;

    container.innerHTML += `
        <div id="${planCardId}" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-2">${idea.title}</h2>
            <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">${idea.description}</p>
            <div class="results-container border-t border-gray-200 dark:border-slate-700 pt-4"></div>
        </div>
    `;

    const resultsContainer = document.querySelector(`#${planCardId} .results-container`);
    
    const cachedData = localStorage.getItem(planCacheKey);
    if (cachedData) {
        console.log(`Loading plan for [${idea.title}] from cache.`);
        const { plan, providerKey, modelId } = JSON.parse(cachedData);
        renderPlanAndControls(resultsContainer, plan, idea, providerKey, modelId, ideaSlug);
        return;
    }

    resultsContainer.innerHTML = `<div class="text-center text-sm">Generating plan... <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div></div>`;

    const defaultModel = selectDefaultPlanningModel();
    if (!defaultModel) {
        resultsContainer.innerHTML = `<p class="text-red-500">Could not find a default AI model to generate the plan.</p>`;
        return;
    }

    try {
        const prompt = createPlanPrompt(idea);
        const result = await getAiAnalysis(prompt, defaultModel.providerKey, defaultModel.modelId);
        if (!result.success) throw new Error(result.error);
        
        const plan = extractAndParseJson(result.text);
        renderPlanAndControls(resultsContainer, plan, idea, defaultModel.providerKey, defaultModel.modelId, ideaSlug);
        
        localStorage.setItem(planCacheKey, JSON.stringify({ plan, providerKey: defaultModel.providerKey, modelId: defaultModel.modelId }));
    } catch (e) {
        showError(e.message);
        resultsContainer.innerHTML = `<p class="text-red-500">Failed to generate plan: ${e.message}</p>`;
    }
}

// This is called when the "Plan" tab is clicked.
export async function initPlanTab() {
    const { currentVideoId } = getState();
    const planContainer = document.getElementById('plan-content');
    planContainer.innerHTML = '';

    if (!currentVideoId) {
        planContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">Please analyze a video in the 'Brainstorm' tab first.</p>`;
        return;
    }
    
    const analysisCacheKey = `analysis_v3_${currentVideoId}`;
    const cachedAnalysis = localStorage.getItem(analysisCacheKey);
    if (!cachedAnalysis) {
        planContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">No analysis found. Please re-analyze the video.</p>`;
        return;
    }

    const productIdeas = JSON.parse(cachedAnalysis).insights?.filter(i => i.category === 'Product Idea') || [];
    if (productIdeas.length === 0) {
        planContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">No 'Product Ideas' were found to plan for.</p>`;
        return;
    }

    // This loop starts the planning process for all products concurrently.
    for (const idea of productIdeas) {
        generateAndRenderPlanForIdea(idea, planContainer);
    }
}