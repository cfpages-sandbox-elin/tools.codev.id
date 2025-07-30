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

function isFree(model, providerKey) {
    if (!model) return false;

    if (providerKey === 'openrouter' || providerKey === 'huggingface') {
        return true;
    }

    if (model.pricing?.input === 0.00 && model.pricing?.output === 0.00) {
        return true;
    }

    const hasFreeTierInArray = model.rateLimits?.tiers?.some(tier =>
        tier.name.toLowerCase().includes('free')
    );
    if (hasFreeTierInArray) {
        return true;
    }
    
    const hasFreeTierInNotes = model.rateLimits?.notes?.toLowerCase().includes('free tier');
    if (hasFreeTierInNotes) {
        return true;
    }

    return false;
}

function estimateTokens(text) {
    if (!text) return 0;
    // A common rule of thumb: 1 token is roughly 4 characters.
    return Math.ceil(text.length / 4);
}

export function renderTranscriptUI(transcriptData) {
    // Safety check - ensures we don't try to render nothing.
    if (!transcriptData || !transcriptData.timedText) {
        console.error("renderTranscriptUI was called with invalid or missing transcript data.");
        return;
    }

    const transcriptHtml = transcriptData.timedText.map(line =>
        `<div class="flex items-start gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700/50">
            <span class="text-xs font-mono bg-gray-200 dark:bg-slate-700 text-indigo-600 dark:text-sky-400 px-2 py-1 rounded">${parseFloat(line.start).toFixed(1)}s</span>
            <p class="flex-1 text-gray-800 dark:text-slate-300">${line.text}</p>
        </div>`
    ).join('');

    const transcriptTokens = estimateTokens(transcriptData.fullText);
    const promptTemplateTokens = 250; // A reasonable constant for your prompt's overhead
    const totalInputTokens = transcriptTokens + promptTemplateTokens;

    elements.outputContent.innerHTML = `
        <div id="transcript-container" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <details>
                <summary class="cursor-pointer text-xl font-semibold text-indigo-500 dark:text-sky-300 hover:text-indigo-700 dark:hover:text-sky-200">View Full Transcript (${transcriptData.timedText.length} lines)</summary>
                <div class="mt-4 space-y-2 border-t border-gray-200 dark:border-slate-700 pt-4 max-h-96 overflow-y-auto">${transcriptHtml}</div>
            </details>
        </div>
        <div id="ai-selection-container" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-4">Analyze with AI 🤖</h3>
            <div class="text-sm text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700/50 p-3 rounded-md mb-4">
                <div class="flex items-center">
                    <p>Approximate Input: <strong class="text-indigo-600 dark:text-sky-400">${totalInputTokens.toLocaleString()} tokens</strong></p>
                    <div class="relative group ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-gray-400">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9Z" clip-rule="evenodd" />
                        </svg>
                        <span class="absolute bottom-full mb-2 w-48 p-2 text-xs text-white bg-black rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2">
                            This is a rough guide based on character count (1 token ≈ 4 chars). Actual token count varies by model.
                        </span>
                    </div>
                </div>
                <p class="text-xs mt-1">(${transcriptTokens.toLocaleString()} from transcript + ~${promptTemplateTokens} for prompt)</p>
                <p id="model-token-limit-info" class="mt-1">Selected Model Max Tokens: <span class="font-semibold">...</span></p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label for="ai-provider-select" class="block text-sm font-medium text-gray-700 dark:text-slate-300">Provider</label>
                    <select id="ai-provider-select" class="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></select>
                </div>
                <div>
                    <label for="ai-model-select" class="block text-sm font-medium text-gray-700 dark:text-slate-300">Model</label>
                    <select id="ai-model-select" class="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></select>
                </div>
            </div>
            <div class="mt-4 text-right">
                 <button id="analyze-transcript-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Analyze Transcript</button>
            </div>
        </div>
        <div id="analysis-container" class="space-y-6"></div>
    `;

    populateAiSelectors();
}

function populateAiSelectors() {
    const providerSelect = document.getElementById('ai-provider-select');
    const { allAiProviders } = getState();
    if (!providerSelect || !allAiProviders) return;

    const freeProviders = {};
    for (const key in allAiProviders) {
        if (allAiProviders[key].models.some(model => isFree(model, key))) {
            freeProviders[key] = allAiProviders[key];
        }
    }

    providerSelect.innerHTML = Object.keys(freeProviders).map(key => {
        const providerName = freeProviders[key].models[0].provider;
        return `<option value="${key}">${providerName}</option>`;
    }).join('');

    updateModelDropdownUI();
}

export function updateModelDropdownUI() {
    const providerSelect = document.getElementById('ai-provider-select');
    const modelSelect = document.getElementById('ai-model-select');
    const { allAiProviders } = getState();
    if (!providerSelect || !modelSelect || !allAiProviders) return;

    const selectedProviderKey = providerSelect.value;
    const providerData = allAiProviders[selectedProviderKey];
    
    const freeModels = providerData ? providerData.models.filter(model => isFree(model, selectedProviderKey)) : [];

    modelSelect.innerHTML = freeModels.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    
    updateTokenInfoUI();
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
        modelTokenInfo.innerHTML = 'Selected Model Max Tokens: <span class="font-semibold">Unknown</span>';
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