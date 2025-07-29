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

/**
 * Renders the fetched transcript and the AI analysis controls.
 */
export function renderTranscriptUI() {
    const state = getState();
    const transcriptData = state.currentTranscript;
    if (!transcriptData) return;

    const transcriptHtml = transcriptData.timedText.map(line =>
        `<div class="flex items-start gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700/50">
            <span class="text-xs font-mono bg-gray-200 dark:bg-slate-700 text-indigo-600 dark:text-sky-400 px-2 py-1 rounded">${parseFloat(line.start).toFixed(1)}s</span>
            <p class="flex-1 text-gray-800 dark:text-slate-300">${line.text}</p>
        </div>`
    ).join('');

    elements.outputContent.innerHTML = `
        <div id="transcript-container" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <details>
                <summary class="cursor-pointer text-xl font-semibold text-indigo-500 dark:text-sky-300 hover:text-indigo-700 dark:hover:text-sky-200">View Full Transcript (${transcriptData.timedText.length} lines)</summary>
                <div class="mt-4 space-y-2 border-t border-gray-200 dark:border-slate-700 pt-4 max-h-96 overflow-y-auto">${transcriptHtml}</div>
            </details>
        </div>
        <div id="ai-selection-container" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-4">Analyze with AI 🤖</h3>
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
    document.getElementById('analyze-transcript-btn').addEventListener('click', handleAnalyzeTranscript);
}

function populateAiSelectors() {
    const providerSelect = document.getElementById('ai-provider-select');
    const modelSelect = document.getElementById('ai-model-select');
    const { allAiProviders } = getState();
    if (!providerSelect || !modelSelect || !allAiProviders) return;

    const FREE_MODELS = [
        'mistralai/mistral-7b-instruct', // OpenRouter (Mistral)
        'google/gemma-2-9b-it',         // OpenRouter / Groq (Gemma 2)
        'meta-llama/llama-3.1-8b-instant', // Groq (Llama 3.1)
    ];

    const freeProviders = {};
    for (const key in allAiProviders) {
        const filteredModels = allAiProviders[key].models.filter(m => FREE_MODELS.includes(m.id));
        if (filteredModels.length > 0) {
            freeProviders[key] = { ...allAiProviders[key], models: filteredModels };
        }
    }

    providerSelect.innerHTML = Object.keys(freeProviders).map(key => `<option value="${key}">${freeProviders[key].models[0].provider}</option>`).join('');

    const updateModels = () => {
        const selectedProvider = providerSelect.value;
        modelSelect.innerHTML = freeProviders[selectedProvider].models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    };
    providerSelect.addEventListener('change', updateModels);
    updateModels();
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