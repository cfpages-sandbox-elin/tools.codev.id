// ideas-ui.js v1.15 better2 ui + re-summarize
import { getState } from './ideas-state.js';

const elements = {};

export function cacheElements() {
    // Input elements
    elements.urlInput = document.getElementById('url-input');
    elements.supadataApiKeyInput = document.getElementById('supadata-api-key');
    elements.rapidapiApiKeyInput = document.getElementById('rapidapi-api-key');

    // Button elements
    elements.analyzeBtn = document.getElementById('analyze-btn');
    
    // Container/Display elements
    elements.apiKeyDetails = document.getElementById('api-key-details');
    elements.supadataApiKeyStatusIcon = document.getElementById('supadata-api-key-status-icon');
    elements.rapidapiApiKeyStatusIcon = document.getElementById('rapidapi-api-key-status-icon');
    elements.loader = document.getElementById('loader');
    elements.errorMessage = document.getElementById('error-message');
    elements.outputContent = document.getElementById('output-content');
}

export function initApiKeyUI() {
    const savedSupadataKey = localStorage.getItem('supadataApiKey');
    const savedRapidapiKey = localStorage.getItem('rapidapiApiKey');

    // Safety check for Supadata elements
    if (elements.supadataApiKeyInput && elements.supadataApiKeyStatusIcon) {
        if (savedSupadataKey) {
            elements.supadataApiKeyInput.value = savedSupadataKey;
            elements.supadataApiKeyStatusIcon.textContent = '✅';
        } else {
            elements.supadataApiKeyStatusIcon.textContent = '⚠️';
        }
    } else {
        console.error("Could not find the Supadata API key input/status elements in the HTML.");
    }

    // Safety check for RapidAPI elements
    if (elements.rapidapiApiKeyInput && elements.rapidapiApiKeyStatusIcon) {
        if (savedRapidapiKey) {
            elements.rapidapiApiKeyInput.value = savedRapidapiKey;
            elements.rapidapiApiKeyStatusIcon.textContent = '✅';
        } else {
            elements.rapidapiApiKeyStatusIcon.textContent = '⚠️';
        }
    } else {
        console.error("Could not find the RapidAPI key input/status elements in the HTML.");
    }

    // Open the details section only if NEITHER key is present
    if (elements.apiKeyDetails) {
        if (!savedSupadataKey && !savedRapidapiKey) {
            elements.apiKeyDetails.open = true;
        } else {
            elements.apiKeyDetails.open = false;
        }
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

    // FIX: Make the 'openrouter' check more specific. Only models with null pricing are free.
    if (providerKey === 'openrouter') {
        return model.pricing === null;
    }
    
    // This rule remains for providers that are entirely free.
    if (providerKey === 'huggingface') {
        return true;
    }

    // Rule for explicit zero-cost pricing.
    if (model.pricing?.input === 0.00 && model.pricing?.output === 0.00) {
        return true;
    }

    // Rule for a 'Free Tier' in the rate limits tiers array.
    const hasFreeTierInArray = model.rateLimits?.tiers?.some(tier =>
        tier.name.toLowerCase().includes('free')
    );
    if (hasFreeTierInArray) {
        return true;
    }
    
    // Rule for 'free tier' text in the general rate limit notes.
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
        <div id="transcript-container" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md space-y-6">
            <details>
                <summary class="cursor-pointer text-xl font-semibold text-indigo-500 dark:text-sky-300 hover:text-indigo-700 dark:hover:text-sky-200">View Full Transcript (${transcriptData.timedText.length} lines)</summary>
                <div class="mt-4 space-y-2 border-t border-gray-200 dark:border-slate-700 pt-4 max-h-96 overflow-y-auto">${transcriptHtml}</div>
            </details>
        </div>
        
        <div id="reanalyze-container" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md space-y-6">
            <div id="reanalyze-controls-container" class="hidden p-4 bg-gray-100 dark:bg-slate-900/50 rounded-lg">
                <!-- Content will be added by renderAnalysisUI -->
            </div>
            
            <div id="ai-selection-container" class="p-5 rounded-lg shadow-inner bg-gray-50 dark:bg-slate-800">
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
        </div>
        
        <div id="analysis-container" class="space-y-6 mt-6"></div>
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
    const reanalyzeContainer = document.getElementById('reanalyze-controls-container');
    if (!analysisContainer || !reanalyzeContainer) return;
    
    // Make the re-analyze container visible, as it's hidden by default
    reanalyzeContainer.classList.remove('hidden');

    // Build and inject the re-analyze controls into its dedicated container
    reanalyzeContainer.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3">Analysis Controls ⚙️</h3>
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">Use these controls to re-generate the entire analysis below.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <select id="ai-provider-select" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></select>
            <select id="ai-model-select" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></select>
            <button id="reanalyze-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-md w-full">Re-analyze All</button>
        </div>
    `;

    let finalHtml = '';

    if (analysis.summary) {
        finalHtml += `<div id="summary-container">${renderSummaryUI(analysis.summary, getState().currentVideoId)}</div>`;
    }

    if (analysis.guide) {
        finalHtml += renderTutorialUI(analysis.guide);
    }
    if (analysis.podcastDetails) {
        finalHtml += renderPodcastUI(analysis.podcastDetails);
    }
    if (analysis.insights) {
        finalHtml += renderIdeasListUI(analysis.insights);
    }
    
    if (!analysis.summary && !analysis.guide && !analysis.podcastDetails && !analysis.insights) {
         finalHtml = `<p class="text-center text-gray-500">The AI could not extract any structured information from this video.</p>`;
    }

    analysisContainer.innerHTML = finalHtml;

    populateAiSelectors(); 
}

function renderSummaryUI(summary, videoId) {
    if (!summary || !videoId) return '';
    
    const subTopicsHtml = (summary.subTopics || []).map(topic => {
        const isValidTime = typeof topic.startTime === 'number' && !isNaN(topic.startTime);
        
        if (isValidTime) {
            // If the time is valid, create a clickable link with a timestamp.
            const youtubeLink = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(topic.startTime)}s`;
            const timestamp = new Date(topic.startTime * 1000).toISOString().substr(14, 5);
            return `
                <a href="${youtubeLink}" target="_blank" rel="noopener noreferrer" class="block p-3 bg-gray-100 dark:bg-slate-800 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                    <span class="font-semibold text-indigo-600 dark:text-sky-400">${topic.title}</span>
                    <span class="text-xs font-mono ml-2 text-gray-500 dark:text-slate-400">@${timestamp}</span>
                </a>
            `;
        } else {
            // If the time is invalid, render a non-clickable item to prevent errors.
            return `
                <div class="block p-3 bg-gray-100 dark:bg-slate-800 rounded-md shadow-sm">
                    <span class="font-semibold text-gray-700 dark:text-slate-300">${topic.title}</span>
                    <span class="text-xs font-mono ml-2 text-red-500">(Time N/A)</span>
                </div>
            `;
        }
    }).join('');

    // --- NEW: Re-summarize Controls ---
    const resummarizeControls = `
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
             <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">Not happy with this summary? Try again with a different model.</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                <select id="resummarize-provider-select" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></select>
                <select id="resummarize-model-select" class="w-full text-xs rounded-md border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></select>
                <button id="resummarize-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-md w-full">Re-summarize</button>
            </div>
        </div>
    `;

    return `
        <div class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-2">Summary 📝</h2>
            <p class="text-gray-700 dark:text-slate-300 mb-4"><strong>Main Topic:</strong> ${summary.mainTopic || 'N/A'}</p>
            <h3 class="font-semibold text-lg text-gray-800 dark:text-slate-200 mb-3">Key Sections:</h3>
            <div class="space-y-2">${subTopicsHtml}</div>
            ${resummarizeControls}
        </div>
    `;
}

export function populateMoreIdeasProviderDropdown() {
    const providerSelect = document.getElementById('more-ideas-provider-select');
    const { allAiProviders } = getState();
    if (!providerSelect || !allAiProviders) return;

    // We can use the same logic to find providers with free models
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

    // Trigger the model dropdown update initially
    updateMoreIdeasModelDropdown();
}

export function updateMoreIdeasModelDropdown() {
    const providerSelect = document.getElementById('more-ideas-provider-select');
    const modelSelect = document.getElementById('more-ideas-model-select');
    const { allAiProviders } = getState();
    if (!providerSelect || !modelSelect || !allAiProviders) return;

    const selectedProviderKey = providerSelect.value;
    const providerData = allAiProviders[selectedProviderKey];
    
    const freeModels = providerData ? providerData.models.filter(model => isFree(model, selectedProviderKey)) : [];

    modelSelect.innerHTML = freeModels.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

function renderIdeasListUI(insights) {
    if (!insights || insights.length === 0) return '<p>No insights were generated.</p>';
    
    const insightsByCategory = insights.reduce((acc, insight) => {
        const category = insight.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(insight);
        return acc;
    }, {});
    
    const categoryDetails = {
        "Product Idea": { title: "Product Ideas 💡", icon: "💡" },
        "Marketing Strategy": { title: "Marketing Strategies 📈", icon: "📈" },
        "Business Process": { title: "Business Processes & Systems ⚙️", icon: "⚙️" },
        "Core Principle": { title: "Core Principles & Concepts 🧠", icon: "🧠" },
        "Tool/Resource": { title: "Tools & Resources 🛠️", icon: "🛠️" },
        "Uncategorized": { title: "Other Insights", icon: "" }
    };

    return Object.keys(insightsByCategory).map(category => {
        const details = categoryDetails[category] || { title: category, icon: "" };
        
        const listItems = insightsByCategory[category].map(item => `
            <li class="p-4 bg-gray-100 dark:bg-slate-800 rounded-lg shadow-sm">
                <h3 class="font-semibold text-md text-gray-800 dark:text-slate-200">${item.title}</h3>
                <p class="mt-1 text-sm text-gray-600 dark:text-slate-400">${item.description}</p>
            </li>
        `).join('');

        const moreIdeasControls = category === 'Product Idea' ? `
            <div class="mt-6 border-t border-gray-200 dark:border-slate-700 pt-4">
                <h4 class="font-semibold text-gray-700 dark:text-slate-300 mb-3">Generate More Ideas</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                     <div>
                        <label for="more-ideas-provider-select" class="sr-only">Provider</label>
                        <select id="more-ideas-provider-select" class="block w-full text-sm rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></select>
                    </div>
                    <div>
                        <label for="more-ideas-model-select" class="sr-only">Model</label>
                        <select id="more-ideas-model-select" class="block w-full text-sm rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></select>
                    </div>
                </div>
                <div class="text-right">
                    <button id="generate-more-ideas-btn" class="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors dark:bg-sky-600 dark:hover:bg-sky-700">
                        Generate with Selected Model ✨
                    </button>
                </div>
            </div>
        ` : '';

        return `
            <div class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
                <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-4">${details.title}</h2>
                <ul class="space-y-4">${listItems}</ul>
                ${moreIdeasControls}
            </div>
        `;
    }).join('');
}

function renderTutorialUI(guide) {
    if (!guide) return '';

    const toolsHtml = (guide.tools || []).map(tool => `<li class="p-3 bg-gray-100 dark:bg-slate-800 rounded-md shadow-sm">${tool}</li>`).join('');
    const stepsHtml = (guide.steps || []).map((step, index) => `
        <li class="flex items-start gap-4">
            <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-500 text-white font-bold rounded-full">${index + 1}</div>
            <div>
                <h4 class="font-semibold text-lg text-gray-800 dark:text-slate-200">${step.title}</h4>
                <p class="mt-1 text-gray-600 dark:text-slate-400">${step.description}</p>
            </div>
        </li>
    `).join('');

    return `
        <div class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-4">Tutorial Guide 📖</h2>
            <div class="mb-6">
                <h3 class="font-bold text-lg text-gray-800 dark:text-slate-200">Goal:</h3>
                <p class="mt-1 text-gray-700 dark:text-slate-300">${guide.goal}</p>
            </div>
            <div class="mb-6">
                <h3 class="font-bold text-lg text-gray-800 dark:text-slate-200">Required Tools:</h3>
                <ul class="mt-2 space-y-2">${toolsHtml}</ul>
            </div>
            <div>
                <h3 class="font-bold text-lg text-gray-800 dark:text-slate-200">Steps:</h3>
                <ol class="mt-2 space-y-6">${stepsHtml}</ol>
            </div>
        </div>
    `;
}

function renderPodcastUI(details) {
    if (!details) return '';

    const guestsHtml = (details.guests || []).map(guest => `
        <div class="p-3 bg-gray-100 dark:bg-slate-800 rounded-md shadow-sm">
            <p class="font-semibold text-gray-800 dark:text-slate-200">${guest.name}</p>
            <p class="text-sm text-gray-600 dark:text-slate-400">${guest.credentials}</p>
        </div>
    `).join('');
    const topicsHtml = (details.keyTopics || []).map(topic => `<li class="p-2 bg-gray-100 dark:bg-slate-800 rounded-md">${topic}</li>`).join('');
    const adviceHtml = (details.actionableAdvice || []).map(advice => `<li class="p-3 bg-gray-100 dark:bg-slate-800 rounded-md shadow-sm">${advice}</li>`).join('');

    return `
        <div class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md space-y-6">
            <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300">Podcast Analysis 🎙️</h2>
            <div>
                <h3 class="font-bold text-lg text-gray-800 dark:text-slate-200">Guests & Speakers:</h3>
                <div class="mt-2 space-y-2">${guestsHtml}</div>
            </div>
            <div>
                <h3 class="font-bold text-lg text-gray-800 dark:text-slate-200">Key Topics Discussed:</h3>
                <ul class="mt-2 space-y-2 text-sm">${topicsHtml}</ul>
            </div>
            <div>
                <h3 class="font-bold text-lg text-gray-800 dark:text-slate-200">Actionable Advice:</h3>
                <ul class="mt-2 space-y-3">${adviceHtml}</ul>
            </div>
        </div>
    `;
}
