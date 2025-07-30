import { getState } from './ideas-state.js';

const elements = {};

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
    const transcriptData = getState().currentTranscript;
    if (!transcriptData) return;

    const transcriptHtml = transcriptData.timedText.map(line => `...`).join('');
    elements.outputContent.innerHTML = `...`; // Your full HTML string goes here

    populateAiSelectors();
}

function populateAiSelectors() {
    const providerSelect = document.getElementById('ai-provider-select');
    const { allAiProviders } = getState();
    if (!providerSelect || !allAiProviders) return;

    const isFree = (model) => {
        const hasFreePrice = model.pricing?.input === 0.00 && model.pricing?.output === 0.00;
        const hasFreeTier = model.rateLimits?.tiers?.some(tier => tier.name.toLowerCase().includes('free'));
        return hasFreePrice || hasFreeTier;
    };

    const freeProviders = {};
    for (const key in allAiProviders) {
        if (allAiProviders[key].models.some(isFree)) {
            freeProviders[key] = allAiProviders[key];
        }
    }

    providerSelect.innerHTML = Object.keys(freeProviders).map(key => {
        const providerName = freeProviders[key].models[0].provider;
        return `<option value="${key}">${providerName}</option>`;
    }).join('');

    // Now call the reusable functions to populate the models and token info
    updateModelDropdownUI();
}

export function updateModelDropdownUI() {
    const providerSelect = document.getElementById('ai-provider-select');
    const modelSelect = document.getElementById('ai-model-select');
    const { allAiProviders } = getState();
    if (!providerSelect || !modelSelect || !allAiProviders) return;

    const isFree = (model) => { /* ... this dynamic logic is correct, no changes needed ... */ };
    const selectedProviderKey = providerSelect.value;
    const providerData = allAiProviders[selectedProviderKey];
    const freeModels = providerData ? providerData.models.filter(isFree) : [];

    modelSelect.innerHTML = freeModels.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    updateTokenInfoUI(); // Automatically update token info after model list changes
}

export function updateTokenInfoUI() {
    const providerSelect = document.getElementById('ai-provider-select');
    const modelSelect = document.getElementById('ai-model-select');
    const modelTokenInfo = document.getElementById('model-token-limit-info');
    const { allAiProviders } = getState();
    if (!providerSelect || !modelSelect || !modelTokenInfo || !allAiProviders) return;

    const selectedProviderKey = providerSelect.value;
    const selectedModelId = modelSelect.value;
    const selectedModel = allAiProviders[selectedProviderKey]?.models.find(m => m.id === selectedModelId);

    if (selectedModel && selectedModel.contextWindow) {
        modelTokenInfo.innerHTML = `Selected Model Max Tokens: <strong class="text-indigo-600 dark:text-sky-400">${selectedModel.contextWindow.toLocaleString()}</strong>`;
    } else {
        modelTokenInfo.textContent = 'Selected Model Max Tokens: Unknown';
    }
}

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