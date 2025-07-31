// ideas-plan.js with auto prd
import { getState } from './ideas-state.js';
import { getAiAnalysis } from './ideas-api.js';
import { showError } from './ideas-ui.js';
import { extractAndParseJson } from './ideas.js';
import { createPlanPrompt, createPrdPrompt } from './ideas-prompts.js';

// --- A. HELPER FUNCTIONS ---

const delay = ms => new Promise(res => setTimeout(res, ms));

function selectDefaultModel(type = 'plan') {
    const { allAiProviders } = getState();
    if (!allAiProviders) return null;

    const planOrder = [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
        { provider: 'google', model: 'gemma-3-27b-it' },
        { provider: 'openrouter', model: 'google/gemma-2-9b-it' }
    ];
    const prdOrder = [
        { provider: 'groq', model: 'llama-3.3-70b-versatile' },
        { provider: 'google', model: 'gemma-3-27b-it' },
        { provider: 'openrouter', model: 'google/gemma-2-9b-it' }
    ];
    const preferredOrder = type === 'plan' ? planOrder : prdOrder;

    for (const pref of preferredOrder) {
        if (allAiProviders[pref.provider]) return { providerKey: pref.provider, modelId: pref.model };
    }
    return null;
}

function updateCardStatus(resultsContainer, message, showSpinner = false) {
    const spinnerHtml = showSpinner ? `<div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 ml-2"></div>` : '';
    resultsContainer.innerHTML = `<div class="card-status text-center text-sm text-gray-500 dark:text-slate-400 p-4">${message}${spinnerHtml}</div>`;
}

function renderPlanAndControls(container, plan, idea, providerKey, modelId) {
    const ideaSlug = idea.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);

    container.innerHTML = `
        <div class="space-y-3 text-sm" id="plan-content-${ideaSlug}">
            <!-- Plan Content -->
            <h4 class="font-bold text-indigo-600 dark:text-sky-400">Feasibility Analysis (Score: ${plan.feasibilityAnalysis.overallScore}/10)</h4>
            <p><strong>AI Buildability:</strong> ${plan.feasibilityAnalysis.aiBuildability.score}/10 - <em>${plan.feasibilityAnalysis.aiBuildability.reasoning}</em></p>
            <p><strong>Market Demand:</strong> ${plan.feasibilityAnalysis.marketDemand.score}/10 - <em>${plan.feasibilityAnalysis.marketDemand.reasoning}</em></p>
            <!-- ... other plan details -->
            <h4 class="font-bold text-indigo-600 dark:text-sky-400 pt-2">Go-to-Market Plan</h4>
            <ol class="list-decimal list-inside">${plan.goToMarketStrategy.map(s => `<li>${s}</li>`).join('')}</ol>
        </div>

        <!-- PRD Section -->
        <div class="mt-4 pt-4 border-t border-gray-300 dark:border-slate-600">
             <h4 class="font-bold text-indigo-600 dark:text-sky-400 mb-2">Product Requirements Doc (PRD)</h4>
             <textarea id="prd-textarea-${ideaSlug}" class="w-full h-64 p-2 text-xs font-mono bg-gray-100 dark:bg-slate-900/50 rounded-md" readonly placeholder="PRD will be generated automatically..."></textarea>
             <div class="flex flex-wrap gap-2 mt-2">
                <div class="flex-grow grid grid-cols-2 gap-2">
                    <select id="prd-provider-select-${ideaSlug}" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm"></select>
                    <select id="prd-model-select-${ideaSlug}" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm"></select>
                </div>
                <button class="regenerate-prd-btn bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 px-3 rounded-md" data-plan-json='${JSON.stringify(plan)}' data-idea-slug="${ideaSlug}" data-idea-title="${idea.title}">Re-generate PRD</button>
                <button class="copy-prd-btn hidden bg-gray-500 hover:bg-gray-600 text-white font-bold text-xs py-2 px-3 rounded-md" data-idea-slug="${ideaSlug}">Copy</button>
                <button class="download-prd-btn hidden bg-gray-500 hover:bg-gray-600 text-white font-bold text-xs py-2 px-3 rounded-md" data-idea-slug="${ideaSlug}" data-idea-title="${idea.title}">Download</button>
             </div>
        </div>

        <!-- Re-plan Section -->
        <div class="mt-4 pt-4 border-t border-gray-300 dark:border-slate-600 space-y-2">
            <h4 class="font-bold text-indigo-600 dark:text-sky-400">Re-plan Strategy</h4>
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

function attachPlanEventListeners(container, initialProvider) {
    const replanButton = container.querySelector('.replan-btn');
    const regeneratePrdButton = container.querySelector('.regenerate-prd-btn');
    const copyPrdButton = container.querySelector('.copy-prd-btn');
    const downloadPrdButton = container.querySelector('.download-prd-btn');

    if (replanButton) {
        const ideaSlug = replanButton.dataset.ideaSlug;
        replanButton.addEventListener('click', () => {
             const resultsContainer = document.querySelector(`#plan-card-${ideaSlug} .results-container`);
             generateAndRenderPlanForIdea({ title: replanButton.dataset.ideaTitle, description: replanButton.dataset.ideaDescription }, resultsContainer, true);
        });
        // Populate dropdowns for re-plan
        const providerSelect = document.getElementById(`replan-provider-${ideaSlug}`);
        const modelSelect = document.getElementById(`replan-model-${ideaSlug}`);
        const { allAiProviders } = getState();
        providerSelect.innerHTML = Object.keys(allAiProviders).map(key => `<option value="${key}">${allAiProviders[key].models[0].provider}</option>`).join('');
        const updateModels = () => {
            modelSelect.innerHTML = allAiProviders[providerSelect.value].models.map(m => `<option value="${m.id.split('/').pop()}">${m.name}</option>`).join('');
        };
        providerSelect.value = initialProvider;
        updateModels();
        providerSelect.addEventListener('change', updateModels);
    }
    
    // Attach Re-generate PRD Listeners
    if (regeneratePrdButton) {
        const ideaSlug = regeneratePrdButton.dataset.ideaSlug;
        regeneratePrdButton.addEventListener('click', (e) => generateAndRenderPrd(e.currentTarget, true));
        // Populate dropdowns for PRD
        const providerSelect = document.getElementById(`prd-provider-select-${ideaSlug}`);
        const modelSelect = document.getElementById(`prd-model-select-${ideaSlug}`);
        const { allAiProviders } = getState();
        providerSelect.innerHTML = Object.keys(allAiProviders).map(key => `<option value="${key}">${allAiProviders[key].models[0].provider}</option>`).join('');
        const updateModels = () => {
            modelSelect.innerHTML = allAiProviders[providerSelect.value].models.map(m => `<option value="${m.id.split('/').pop()}">${m.name}</option>`).join('');
        };
        providerSelect.value = 'google'; // Default to a good text model provider
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

// --- C. MAIN WORKER FUNCTIONS ---

async function generateAndRenderPrd(prdButton, isManualTrigger = false) {
    const ideaSlug = prdButton.dataset.ideaSlug;
    const ideaTitle = prdButton.dataset.ideaTitle;
    const planJson = prdButton.dataset.planJson;
    const textarea = document.getElementById(`prd-textarea-${ideaSlug}`);
    const copyBtn = textarea.nextElementSibling.querySelector('.copy-prd-btn');
    const downloadBtn = textarea.nextElementSibling.querySelector('.download-prd-btn');
    
    const prdCacheKey = `prd_v2_${getState().currentVideoId}_${ideaSlug}`;
    
    if (!isManualTrigger) {
        const cachedPrd = localStorage.getItem(prdCacheKey);
        if (cachedPrd) {
            textarea.value = cachedPrd;
            copyBtn.classList.remove('hidden');
            downloadBtn.classList.remove('hidden');
            return;
        }
    }
    
    textarea.placeholder = 'Generating PRD...';
    copyBtn.classList.add('hidden');
    downloadBtn.classList.add('hidden');
    prdButton.disabled = true;
    prdButton.textContent = 'Generating...';

    let modelChoice;
    if (isManualTrigger) {
        const provider = document.getElementById(`prd-provider-select-${ideaSlug}`).value;
        const model = document.getElementById(`prd-model-select-${ideaSlug}`).value;
        modelChoice = { providerKey: provider, modelId: model };
    } else {
        modelChoice = selectDefaultModel('prd');
    }

    try {
        const prompt = createPrdPrompt(ideaTitle, planJson);
        const result = await getAiAnalysis(prompt, modelChoice.providerKey, modelChoice.modelId);
        if (!result.success) throw new Error(result.error);
        
        textarea.value = result.text;
        localStorage.setItem(prdCacheKey, result.text);
        copyBtn.classList.remove('hidden');
        downloadBtn.classList.remove('hidden');
    } catch (e) {
        textarea.value = `Error generating PRD: ${e.message}`;
    } finally {
        prdButton.disabled = false;
        prdButton.textContent = 'Re-generate PRD';
    }
}

async function generateAndRenderPlanForIdea(idea, container, isReplan = false) {
    const ideaSlug = idea.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
    const planCacheKey = `plan_v3_${getState().currentVideoId}_${ideaSlug}`;
    
    if (!isReplan) {
        const cachedData = localStorage.getItem(planCacheKey);
        if (cachedData) {
            const { plan, providerKey, modelId } = JSON.parse(cachedData);
            renderPlanAndControls(container, plan, idea, providerKey, modelId);
            const prdButton = container.querySelector('.regenerate-prd-btn');
            await generateAndRenderPrd(prdButton); // Auto-generate PRD
            return;
        }
    }

    let modelChoice;
    if (isReplan) {
        const provider = document.getElementById(`replan-provider-${ideaSlug}`).value;
        const model = document.getElementById(`replan-model-${ideaSlug}`).value;
        modelChoice = { providerKey: provider, modelId: model };
    } else {
        modelChoice = selectDefaultModel('plan');
    }

    if (!modelChoice) {
        updateCardStatus(container, "Could not find a suitable AI model.", false);
        return;
    }
    
    updateCardStatus(container, `Generating plan with ${modelChoice.providerKey}/${modelChoice.modelId}...`, true);

    try {
        const prompt = createPlanPrompt(idea);
        const result = await getAiAnalysis(prompt, modelChoice.providerKey, modelChoice.modelId);
        if (!result.success) throw new Error(result.error);
        
        const plan = extractAndParseJson(result.text);
        renderPlanAndControls(container, plan, idea, modelChoice.providerKey, modelChoice.modelId);
        localStorage.setItem(planCacheKey, JSON.stringify({ plan, providerKey: modelChoice.providerKey, modelId: modelChoice.modelId }));
        
        // Auto-generate PRD after successful plan generation
        const prdButton = container.querySelector('.regenerate-prd-btn');
        await generateAndRenderPrd(prdButton);

    } catch (e) {
        showError(e.message);
        updateCardStatus(container, `Error: ${e.message}`, false);
    }
}

export async function initPlanTab() {
    const planContainer = document.getElementById('plan-content');
    planContainer.innerHTML = '';
    
    // Add "Re-plan All" button
    const headerDiv = document.createElement('div');
    headerDiv.className = 'text-right mb-4';
    headerDiv.innerHTML = `<button id="replan-all-btn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm">🔄 Re-plan All Products</button>`;
    planContainer.appendChild(headerDiv);
    headerDiv.querySelector('#replan-all-btn').addEventListener('click', () => {
        // Clear caches to force regeneration
        const { currentVideoId } = getState();
        const analysis = JSON.parse(localStorage.getItem(`analysis_v3_${currentVideoId}`) || '{}');
        const ideas = analysis.insights?.filter(i => i.category === 'Product Idea') || [];
        ideas.forEach(idea => {
            const ideaSlug = idea.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
            localStorage.removeItem(`plan_v3_${currentVideoId}_${ideaSlug}`);
            localStorage.removeItem(`prd_v2_${currentVideoId}_${ideaSlug}`);
        });
        initPlanTab(); // Re-run the whole process
    });

    const productIdeasContainer = document.createElement('div');
    productIdeasContainer.className = 'space-y-6';
    planContainer.appendChild(productIdeasContainer);
    
    const { currentVideoId } = getState();
    const productIdeas = JSON.parse(localStorage.getItem(`analysis_v3_${currentVideoId}`) || '{}').insights?.filter(i => i.category === 'Product Idea') || [];

    // Staggered loop
    (async () => {
        for (const [index, idea] of productIdeas.entries()) {
            const cardContainer = document.createElement('div');
            cardContainer.id = `plan-card-${idea.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50)}`;
            cardContainer.className = "bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md";
            cardContainer.innerHTML = `
                <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-2">${idea.title}</h2>
                <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">${idea.description}</p>
                <div class="results-container border-t border-gray-200 dark:border-slate-700 pt-4"></div>
            `;
            productIdeasContainer.appendChild(cardContainer);
            
            await delay(index * 500); // Stagger API calls
            generateAndRenderPlanForIdea(idea, cardContainer.querySelector('.results-container'));
        }
    })();
}