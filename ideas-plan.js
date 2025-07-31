// ideas-plan.js with prd
import { getState } from './ideas-state.js';
import { getAiAnalysis } from './ideas-api.js';
import { showError } from './ideas-ui.js';
import { extractAndParseJson } from './ideas.js';
import { createPlanPrompt, createPrdPrompt } from './ideas-prompts.js';

// --- A. HELPER FUNCTIONS ---

const delay = ms => new Promise(res => setTimeout(res, ms));

function selectDefaultPlanningModel() {
    const { allAiProviders } = getState();
    if (!allAiProviders) return null;
    const preferredOrder = [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
        { provider: 'google', model: 'gemma-3-27b-it' },
        { provider: 'openrouter', model: 'google/gemma-2-9b-it' }
    ];
    for (const pref of preferredOrder) {
        if (allAiProviders[pref.provider]) return { providerKey: pref.provider, modelId: pref.model };
    }
    return null;
}

function updateCardStatus(resultsContainer, message, showSpinner = false) {
    let statusEl = resultsContainer.querySelector('.card-status');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.className = 'card-status text-center text-sm text-gray-500 dark:text-slate-400 p-4';
        resultsContainer.innerHTML = ''; // Clear previous content
        resultsContainer.appendChild(statusEl);
    }
    const spinnerHtml = showSpinner ? `<div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 ml-2"></div>` : '';
    statusEl.innerHTML = `${message}${spinnerHtml}`;
}

function renderPlanContent(plan) {
    const html = `
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
    return { html, plan };
}

function renderPlanAndControls(container, planData, idea, providerKey, modelId) {
    const ideaSlug = idea.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
    const { html, plan } = renderPlanContent(planData);

    container.innerHTML = `
        <div class="space-y-3 text-sm" id="plan-content-${ideaSlug}">${html}</div>

        <!-- PRD Section -->
        <div class="mt-4 pt-4 border-t border-gray-300 dark:border-slate-600">
             <h4 class="font-bold text-indigo-600 dark:text-sky-400 mb-2">Product Requirements Doc (PRD)</h4>
             <textarea id="prd-textarea-${ideaSlug}" class="w-full h-64 p-2 text-xs font-mono bg-gray-100 dark:bg-slate-900/50 rounded-md" readonly placeholder="Click 'Generate PRD' to create the document..."></textarea>
             <div class="flex gap-2 mt-2">
                <button class="generate-prd-btn flex-grow bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 px-3 rounded-md" data-idea-title="${idea.title}" data-plan-json='${JSON.stringify(plan)}' data-idea-slug="${ideaSlug}">Generate PRD</button>
                <button class="copy-prd-btn hidden flex-shrink-0 bg-gray-500 hover:bg-gray-600 text-white font-bold text-xs py-2 px-3 rounded-md" data-idea-slug="${ideaSlug}">Copy</button>
                <button class="download-prd-btn hidden flex-shrink-0 bg-gray-500 hover:bg-gray-600 text-white font-bold text-xs py-2 px-3 rounded-md" data-idea-slug="${ideaSlug}" data-idea-title="${idea.title}">Download</button>
             </div>
        </div>

        <!-- Re-plan Section -->
        <div class="mt-4 pt-4 border-t border-gray-300 dark:border-slate-600 space-y-2">
            <h4 class="font-bold text-indigo-600 dark:text-sky-400">Re-plan with a Different Model</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                <select id="replan-provider-${ideaSlug}" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm"></select>
                <select id="replan-model-${ideaSlug}" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm"></select>
                <button class="replan-btn bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-md w-full" data-idea-slug="${ideaSlug}" data-idea-title="${idea.title}" data-idea-description="${idea.description}">Re-plan</button>
            </div>
        </div>
    `;
    attachPlanEventListeners(container, providerKey);
}

// --- B. EVENT HANDLERS AND LISTENERS ---

async function handleReplan(event) {
    const btn = event.currentTarget;
    const ideaSlug = btn.dataset.ideaSlug;
    const planCard = document.getElementById(`plan-card-${ideaSlug}`);
    const resultsContainer = planCard.querySelector('.results-container');
    generateAndRenderPlanForIdea({ title: btn.dataset.ideaTitle, description: btn.dataset.ideaDescription }, resultsContainer, true);
}

async function handleGeneratePrd(event) {
    const btn = event.currentTarget;
    const ideaSlug = btn.dataset.ideaSlug;
    const ideaTitle = btn.dataset.ideaTitle;
    const planJson = btn.dataset.planJson;
    const textarea = document.getElementById(`prd-textarea-${ideaSlug}`);
    
    const prdCacheKey = `prd_${getState().currentVideoId}_${ideaSlug}`;
    const cachedPrd = localStorage.getItem(prdCacheKey);

    if (cachedPrd) {
        textarea.value = cachedPrd;
        btn.textContent = 'Generated from Cache';
        btn.nextElementSibling.classList.remove('hidden'); // Show copy
        btn.nextElementSibling.nextElementSibling.classList.remove('hidden'); // Show download
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Generating...';
    
    try {
        const prompt = createPrdPrompt(ideaTitle, planJson);
        const result = await getAiAnalysis(prompt, 'google', 'gemini-2.0-flash-lite');
        if (!result.success) throw new Error(result.error);
        
        const prdText = result.text;
        textarea.value = prdText;
        localStorage.setItem(prdCacheKey, prdText);

        btn.textContent = 'Generated';
        btn.nextElementSibling.classList.remove('hidden'); // Show copy
        btn.nextElementSibling.nextElementSibling.classList.remove('hidden'); // Show download
    } catch (e) {
        textarea.value = `Error generating PRD: ${e.message}`;
        btn.textContent = 'Generation Failed';
    } finally {
        btn.disabled = false;
    }
}

function attachPlanEventListeners(container, initialProvider) {
    const replanButton = container.querySelector('.replan-btn');
    const generatePrdButton = container.querySelector('.generate-prd-btn');
    const copyPrdButton = container.querySelector('.copy-prd-btn');
    const downloadPrdButton = container.querySelector('.download-prd-btn');

    if (replanButton) {
        const ideaSlug = replanButton.dataset.ideaSlug;
        const providerSelect = document.getElementById(`replan-provider-${ideaSlug}`);
        const modelSelect = document.getElementById(`replan-model-${ideaSlug}`);
        replanButton.addEventListener('click', handleReplan);
        const { allAiProviders } = getState();
        providerSelect.innerHTML = Object.keys(allAiProviders).map(key => `<option value="${key}">${allAiProviders[key].models[0].provider}</option>`).join('');
        const updateModels = () => {
            const models = allAiProviders[providerSelect.value].models;
            modelSelect.innerHTML = models.map(m => `<option value="${m.id.split('/').pop()}">${m.name}</option>`).join('');
        };
        providerSelect.value = initialProvider;
        updateModels();
        providerSelect.addEventListener('change', updateModels);
    }

    if (generatePrdButton) generatePrdButton.addEventListener('click', handleGeneratePrd);
    
    if (copyPrdButton) {
        copyPrdButton.addEventListener('click', (e) => {
            const ideaSlug = e.currentTarget.dataset.ideaSlug;
            const textarea = document.getElementById(`prd-textarea-${ideaSlug}`);
            navigator.clipboard.writeText(textarea.value);
            e.currentTarget.textContent = 'Copied!';
            setTimeout(() => e.currentTarget.textContent = 'Copy', 2000);
        });
    }

    if (downloadPrdButton) {
        downloadPrdButton.addEventListener('click', (e) => {
            const ideaSlug = e.currentTarget.dataset.ideaSlug;
            const ideaTitle = e.currentTarget.dataset.ideaTitle;
            const textarea = document.getElementById(`prd-textarea-${ideaSlug}`);
            const blob = new Blob([textarea.value], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${ideaTitle.toLowerCase().replace(/\s/g, '-')}-prd.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}

// --- C. MAIN WORKER AND ENTRY POINT ---

async function generateAndRenderPlanForIdea(idea, container, isReplan = false) {
    const ideaSlug = idea.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
    const planCacheKey = `plan_v3_${getState().currentVideoId}_${ideaSlug}`;
    
    const resultsContainer = container; // We pass the results container directly
    
    if (!isReplan) {
        const cachedData = localStorage.getItem(planCacheKey);
        if (cachedData) {
            updateCardStatus(resultsContainer, "Loaded plan from cache.", false);
            const { plan, providerKey, modelId } = JSON.parse(cachedData);
            renderPlanAndControls(resultsContainer, plan, idea, providerKey, modelId);
            return;
        }
    }

    const providerSelect = document.getElementById(`replan-provider-${ideaSlug}`);
    const modelSelect = document.getElementById(`replan-model-${ideaSlug}`);
    
    let modelChoice;
    if (isReplan && providerSelect && modelSelect) {
        modelChoice = { providerKey: providerSelect.value, modelId: modelSelect.value };
    } else {
        modelChoice = selectDefaultPlanningModel();
    }

    if (!modelChoice) {
        updateCardStatus(resultsContainer, "Could not find a suitable AI model.", false);
        return;
    }
    
    updateCardStatus(resultsContainer, `Generating plan with ${modelChoice.providerKey}/${modelChoice.modelId}...`, true);

    try {
        const prompt = createPlanPrompt(idea);
        const result = await getAiAnalysis(prompt, modelChoice.providerKey, modelChoice.modelId);
        if (!result.success) throw new Error(result.error);
        
        const plan = extractAndParseJson(result.text);
        renderPlanAndControls(resultsContainer, plan, idea, modelChoice.providerKey, modelChoice.modelId);
        
        localStorage.setItem(planCacheKey, JSON.stringify({ plan, providerKey: modelChoice.providerKey, modelId: modelChoice.modelId }));
    } catch (e) {
        showError(e.message);
        updateCardStatus(resultsContainer, `Error: ${e.message}`, false);
    }
}

export async function initPlanTab() {
    const { currentVideoId } = getState();
    const planContainer = document.getElementById('plan-content');
    planContainer.innerHTML = '';

    // Add "Re-plan All" button at the top
    const headerDiv = document.createElement('div');
    headerDiv.className = 'text-right mb-4';
    headerDiv.innerHTML = `<button id="replan-all-btn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm">🔄 Re-plan All Products</button>`;
    planContainer.appendChild(headerDiv);
    headerDiv.querySelector('#replan-all-btn').addEventListener('click', initPlanTab);

    const productIdeasContainer = document.createElement('div');
    productIdeasContainer.className = 'space-y-6';
    planContainer.appendChild(productIdeasContainer);

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

    // This loop starts the planning process for all products with a delay.
    for (const [index, idea] of productIdeas.entries()) {
        const ideaSlug = idea.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
        const planCardId = `plan-card-${ideaSlug}`;

        const cardContainer = document.createElement('div');
        cardContainer.id = planCardId;
        cardContainer.className = "bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md";
        cardContainer.innerHTML = `
            <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-2">${idea.title}</h2>
            <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">${idea.description}</p>
            <div class="results-container border-t border-gray-200 dark:border-slate-700 pt-4"></div>
        `;
        productIdeasContainer.appendChild(cardContainer);

        const resultsContainer = cardContainer.querySelector('.results-container');
        
        // Stagger the API calls
        await delay(index * 500);
        generateAndRenderPlanForIdea(idea, resultsContainer);
    }
}