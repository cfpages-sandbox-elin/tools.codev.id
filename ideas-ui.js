import { getState } from './ideas-state.js';
import { handleAnalyzeTranscript } from './ideas.js'; // Import the handler from the main file

// Cache of DOM elements to avoid repeated lookups
const elements = {};

/**
 * Caches all necessary DOM elements for the UI.
 */
export function cacheElements() {
    elements.apiKeyInput = document.getElementById('supadata-api-key');
    elements.apiKeyDetails = document.getElementById('api-key-details');
    elements.apiKeyStatusIcon = document.getElementById('api-key-status-icon');
    elements.urlInput = document.getElementById('url-input');
    elements.analyzeBtn = document.getElementById('analyze-btn');
    elements.loader = document.getElementById('loader');
    elements.errorMessage = document.getElementById('error-message');
    elements.outputContent = document.getElementById('output-content');
}

/**
 * Initializes the API key input field based on localStorage.
 */
export function initApiKeyUI() {
    const savedKey = localStorage.getItem('supadataApiKey');
    if (savedKey) {
        elements.apiKeyInput.value = savedKey;
        elements.apiKeyDetails.open = false;
        elements.apiKeyStatusIcon.textContent = '✅';
    } else {
        elements.apiKeyDetails.open = true;
        elements.apiKeyStatusIcon.textContent = '⚠️';
    }
}

export function showError(message) {
    elements.errorMessage.textContent = `Error: ${message}`;
    elements.errorMessage.classList.remove('hidden');
}

export function toggleLoader(show) {
    elements.loader.classList.toggle('hidden', !show);
}

export function resetOutput() {
    elements.errorMessage.classList.add('hidden');
    elements.outputContent.innerHTML = '';
}

function estimateTokens(text) {
    if (!text) return 0;
    // A common rule of thumb: 1 token is roughly 4 characters.
    return Math.ceil(text.length / 4);
}

export function renderTranscriptUI() {
    const state = getState();
    const transcriptData = state.currentTranscript;
    if (!transcriptData) return;

    // Estimate tokens
    const transcriptTokens = estimateTokens(transcriptData.fullText);
    const promptTemplateTokens = 250; // A safe estimate for our prompt's length
    const totalInputTokens = transcriptTokens + promptTemplateTokens;

    const transcriptHtml = transcriptData.timedText.map(line =>
        // ... (this part is the same as before) ...
        `<div class="flex items-start gap-3 p-2 ...">${parseFloat(line.start).toFixed(1)}s</span><p ...>${line.text}</p></div>`
    ).join('');

    elements.outputContent.innerHTML = `
        <div id="transcript-container" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <details>
                <summary class="cursor-pointer text-xl font-semibold ...">View Full Transcript (${transcriptData.timedText.length} lines)</summary>
                <div class="mt-4 ... max-h-96 overflow-y-auto">${transcriptHtml}</div>
            </details>
        </div>
        <div id="ai-selection-container" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold ...">Analyze with AI 🤖</h3>
            
            <!-- START: NEW TOKEN INFO BLOCK -->
            <div class="text-sm text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700/50 p-3 rounded-md mb-4">
                <p>Estimated Input: <strong class="text-indigo-600 dark:text-sky-400">${totalInputTokens.toLocaleString()} tokens</strong> <span class="text-xs">(${transcriptTokens.toLocaleString()} from transcript + ~${promptTemplateTokens} for prompt)</span></p>
                <p id="model-token-limit-info" class="mt-1">Selected Model Max Tokens: <span class="font-semibold">...</span></p>
            </div>
            <!-- END: NEW TOKEN INFO BLOCK -->

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label for="ai-provider-select" class="block ...">Provider</label>
                    <select id="ai-provider-select" class="mt-1 block w-full ..."></select>
                </div>
                <div>
                    <label for="ai-model-select" class="block ...">Model</label>
                    <select id="ai-model-select" class="mt-1 block w-full ..."></select>
                </div>
            </div>
            <div class="mt-4 text-right">
                 <button id="analyze-transcript-btn" class="bg-green-600 ...">Analyze Transcript</button>
            </div>
        </div>
        <div id="analysis-container" class="space-y-6"></div>
    `;
    populateAiSelectors(); // This will now also update the token limit info
    document.getElementById('analyze-transcript-btn').addEventListener('click', handleAnalyzeTranscript);
}

function populateAiSelectors() {
    const providerSelect = document.getElementById('ai-provider-select');
    const modelSelect = document.getElementById('ai-model-select');
    const modelTokenInfo = document.getElementById('model-token-limit-info');
    const { allAiProviders } = getState();
    if (!providerSelect || !modelSelect || !modelTokenInfo || !allAiProviders) return;

    // A model is "free" if its base price is 0 or it has a specific "Free Tier" rate limit.
    const isFree = (model) => {
        const hasFreePrice = model.pricing?.input === 0.00 && model.pricing?.output === 0.00;
        const hasFreeTier = model.rateLimits?.tiers?.some(tier => tier.name.toLowerCase().includes('free'));
        return hasFreePrice || hasFreeTier;
    };

    const freeProviders = {};
    for (const key in allAiProviders) {
        const filteredModels = allAiProviders[key].models.filter(m => isFree(m));
        if (filteredModels.length > 0) {
            freeProviders[key] = { ...allAiProviders[key], models: filteredModels };
        }
    }

    providerSelect.innerHTML = Object.keys(freeProviders).map(key => {
        // Find the original provider name (e.g., "Google", not "google")
        const providerName = allAiProviders[key].models[0].provider;
        return `<option value="${key}">${providerName}</option>`
    }).join('');

    const updateUI = () => {
        const selectedProviderKey = providerSelect.value;
        // Populate model dropdown
        const models = freeProviders[selectedProviderKey]?.models || [];
        modelSelect.innerHTML = models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        
        // Update the token limit info
        const selectedModelId = modelSelect.value;
        const selectedModel = models.find(m => m.id === selectedModelId);
        if (selectedModel && selectedModel.contextWindow) {
            modelTokenInfo.innerHTML = `Selected Model Max Tokens: <strong class="text-indigo-600 dark:text-sky-400">${selectedModel.contextWindow.toLocaleString()}</strong>`;
        } else {
            modelTokenInfo.textContent = 'Selected Model Max Tokens: Unknown';
        }
    };

    providerSelect.addEventListener('change', updateUI);
    modelSelect.addEventListener('change', updateUI); // Also update when model changes
    updateUI(); // Initial population
}

/**
 * Renders the final AI analysis sections into the DOM.
 * @param {object} analysis - The parsed AI analysis object.
 */
export function renderAnalysisUI(analysis) {
    const analysisContainer = document.getElementById('analysis-container');
    if (!analysisContainer) return;

    const createSection = (title, items) => {
        if (!items || items.length === 0) return '';
        const listItems = items.map(item => `<li class="p-3 bg-gray-100 dark:bg-slate-800 rounded-md shadow-sm">${item}</li>`).join('');
        return `
            <div class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
                <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-4">${title}</h2>
                <ul class="space-y-3 text-gray-700 dark:text-slate-300">${listItems}</ul>
            </div>
        `;
    };

    analysisContainer.innerHTML = `
        <div class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-4">Summary 📝</h2>
            <p class="text-gray-700 dark:text-slate-300 leading-relaxed">${analysis.summary}</p>
        </div>
        ${createSection("Key Takeaways 🔑", analysis.takeaways)}
        ${createSection("Ideas from Content 💡", analysis.extracted_ideas)}
        ${createSection("Further Ideas ✨", analysis.further_ideas)}
    `;
}