// ideas-steal.js v2.01 re-steal-html
import { scrapeUrl, getAiAnalysis } from './ideas-api.js';
import { extractAndParseJson } from './ideas.js';
import { createStealIdeasPrompt } from './ideas-prompts.js';
import { renderIdeasListUI } from './ideas-ui.js';
import { getState } from './ideas-state.js';

function isFree(model, providerKey) {
    if (!model) return false;
    if (providerKey === 'openrouter' && model.pricing === null) return true;
    if (providerKey === 'huggingface') return true;
    if (model.pricing?.input === 0.00 && model.pricing?.output === 0.00) return true;
    const hasFreeTierInArray = model.rateLimits?.tiers?.some(tier => tier.name.toLowerCase().includes('free'));
    if (hasFreeTierInArray) return true;
    const hasFreeTierInNotes = model.rateLimits?.notes?.toLowerCase().includes('free tier');
    if (hasFreeTierInNotes) return true;
    return false;
}

function renderInitialUI(container) {
    container.innerHTML = `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4 text-indigo-500 dark:text-sky-300">Steal Ideas From a URL 🕵️</h2>
            <p class="text-gray-600 dark:text-slate-300 mb-4">Enter any article, landing page, or paste its raw HTML. We'll use AI to find hidden business ideas.</p>
            
            <!-- URL Input Container -->
            <div id="steal-url-container">
                <div class="flex flex-col sm:flex-row gap-3">
                    <input type="text" id="steal-url-input" class="flex-grow bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="e.g., https://www.example.com/article">
                </div>
                <div class="text-right mt-2">
                    <a href="#" id="toggle-html-input" class="text-sm text-indigo-600 dark:text-sky-400 hover:underline">...or paste raw HTML</a>
                </div>
            </div>

            <!-- Raw HTML Input Container (hidden by default) -->
            <div id="steal-html-container" class="hidden">
                 <div class="space-y-3">
                    <div>
                        <label for="steal-source-url-input" class="block text-sm font-medium text-gray-700 dark:text-slate-300">Original URL (for caching)</label>
                        <input type="text" id="steal-source-url-input" class="mt-1 block w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="https://www.example.com/protected-page">
                    </div>
                    <div>
                        <label for="steal-html-input" class="block text-sm font-medium text-gray-700 dark:text-slate-300">Paste Raw HTML Here</label>
                        <textarea id="steal-html-input" rows="6" class="mt-1 block w-full bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="<!DOCTYPE html>..."></textarea>
                    </div>
                </div>
                <div class="text-right mt-2">
                    <a href="#" id="toggle-url-input" class="text-sm text-indigo-600 dark:text-sky-400 hover:underline">...or use a URL instead</a>
                </div>
            </div>

            <div class="mt-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700">
                <h3 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Select an AI Model</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label for="steal-ai-provider-select" class="sr-only">Provider</label>
                        <select id="steal-ai-provider-select" class="block w-full text-sm rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></select>
                    </div>
                    <div>
                        <label for="steal-ai-model-select" class="sr-only">Model</label>
                        <select id="steal-ai-model-select" class="block w-full text-sm rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></select>
                    </div>
                </div>
            </div>

            <div class="mt-4">
                <button id="steal-btn" class="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white font-bold py-3 px-6 rounded-md transition-colors">
                    Steal Ideas ✨
                </button>
            </div>
        </div>
        <div id="steal-results-area" class="mt-8 space-y-6"></div>
    `;
}

function updateStealButtonState(isCached) {
    const stealBtn = document.getElementById('steal-btn');
    if (!stealBtn) return;

    if (isCached) {
        stealBtn.innerHTML = 'Re-steal Ideas 🔄';
        stealBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700', 'dark:bg-purple-700', 'dark:hover:bg-purple-800');
        stealBtn.classList.add('bg-orange-500', 'hover:bg-orange-600', 'dark:bg-orange-600', 'dark:hover:bg-orange-700');
    } else {
        stealBtn.innerHTML = 'Steal Ideas ✨';
        stealBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600', 'dark:bg-orange-600', 'dark:hover:bg-orange-700');
        stealBtn.classList.add('bg-purple-600', 'hover:bg-purple-700', 'dark:bg-purple-700', 'dark:hover:bg-purple-800');
    }
}


function handleUrlInput() {
    const urlInput = document.getElementById('steal-url-input');
    const sourceUrlInput = document.getElementById('steal-source-url-input');
    const resultsArea = document.getElementById('steal-results-area');
    
    // Use the URL from whichever input is currently visible and being used
    const isHtmlMode = document.getElementById('steal-html-container').style.display !== 'none';
    const url = isHtmlMode ? sourceUrlInput.value.trim() : urlInput.value.trim();

    if (!url) {
        resultsArea.innerHTML = '';
        updateStealButtonState(false);
        return;
    }

    const cacheKey = `stolen_ideas_${url}`;
    const cachedIdeas = localStorage.getItem(cacheKey);

    if (cachedIdeas) {
        updateStealButtonState(true);
        try {
            const ideas = JSON.parse(cachedIdeas);
            if (ideas.length > 0) {
                console.log(`Loading stolen ideas for [${url}] from cache.`);
                resultsArea.innerHTML = renderIdeasListUI(ideas);
            } else {
                resultsArea.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">Previously analyzed, but no ideas were found for this content.</p>`;
            }
        } catch (e) {
            console.error("Failed to parse cached stolen ideas:", e);
            localStorage.removeItem(cacheKey);
            updateStealButtonState(false);
        }
    } else {
        updateStealButtonState(false);
        resultsArea.innerHTML = '';
    }
}

function extractTextFromHtml(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.textContent || "";
}

async function handleSteal() {
    const resultsArea = document.getElementById('steal-results-area');
    const stealBtn = document.getElementById('steal-btn');
    
    const urlInput = document.getElementById('steal-url-input');
    const htmlInput = document.getElementById('steal-html-input');
    const sourceUrlInput = document.getElementById('steal-source-url-input');

    const isHtmlMode = document.getElementById('steal-html-container').style.display !== 'none';
    
    let url;
    let textPromise;

    stealBtn.disabled = true;
    resultsArea.innerHTML = `<div class="flex justify-center items-center py-10"><div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div></div>`;

    if (isHtmlMode) {
        url = sourceUrlInput.value.trim();
        const rawHtml = htmlInput.value.trim();
        if (!url || !rawHtml) {
            resultsArea.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">Please provide both the original URL and the raw HTML content.</div>`;
            stealBtn.disabled = false;
            return;
        }
        stealBtn.innerHTML = 'Parsing HTML...';
        // The "scraping" is just local parsing, so it's instant. We wrap it in a promise to maintain a consistent code structure.
        textPromise = Promise.resolve(extractTextFromHtml(rawHtml));
    } else {
        url = urlInput.value.trim();
        if (!url) {
            resultsArea.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">Please enter a URL.</div>`;
            stealBtn.disabled = false;
            return;
        }
        stealBtn.innerHTML = 'Scraping...';
        textPromise = scrapeUrl(url);
    }
    
    const cacheKey = `stolen_ideas_${url}`;

    try {
        const text = await textPromise;
        if (!text) {
             throw new Error("Could not extract any text from the provided source.");
        }
        stealBtn.innerHTML = 'Analyzing...';

        const provider = document.getElementById('steal-ai-provider-select').value;
        const model = document.getElementById('steal-ai-model-select').value;
        
        const prompt = createStealIdeasPrompt(text);
        const result = await getAiAnalysis(prompt, provider, model);

        if (!result.success) throw new Error(result.error);
        
        const ideas = extractAndParseJson(result.text);

        localStorage.setItem(cacheKey, JSON.stringify(ideas));
        console.log(`Saved/Overwrote stolen ideas for [${url}] in cache.`);

        if (ideas.length > 0) {
            resultsArea.innerHTML = renderIdeasListUI(ideas);
        } else {
            resultsArea.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">The AI couldn't find any specific business ideas on that page. Try another one!</p>`;
        }
        
        updateStealButtonState(true);

    } catch (error) {
        resultsArea.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">Error: ${error.message}</div>`;
        updateStealButtonState(false); // An error means it wasn't cached successfully
    } finally {
        stealBtn.disabled = false;
    }
}

function updateStealModelDropdown() {
    const providerSelect = document.getElementById('steal-ai-provider-select');
    const modelSelect = document.getElementById('steal-ai-model-select');
    const { allAiProviders } = getState();

    if (!providerSelect || !modelSelect || !allAiProviders) return;

    const selectedProviderKey = providerSelect.value;
    const providerData = allAiProviders[selectedProviderKey];
    
    const freeModels = providerData ? providerData.models.filter(model => isFree(model, selectedProviderKey)) : [];
    modelSelect.innerHTML = freeModels.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

function populateStealSelectors() {
    const providerSelect = document.getElementById('steal-ai-provider-select');
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

    // Try to default to groq, if not available, use the first in the list
    if (freeProviders['groq']) {
        providerSelect.value = 'groq';
    }

    updateStealModelDropdown();

    providerSelect.addEventListener('change', updateStealModelDropdown);
}

export function initStealTab() {
    const stealContainer = document.getElementById('steal-content');
    if (!stealContainer) return;
    renderInitialUI(stealContainer);
    
    populateStealSelectors();
    
    const urlContainer = document.getElementById('steal-url-container');
    const htmlContainer = document.getElementById('steal-html-container');
    const toggleHtmlLink = document.getElementById('toggle-html-input');
    const toggleUrlLink = document.getElementById('toggle-url-input');

    const stealUrlInput = document.getElementById('steal-url-input');
    const sourceUrlInput = document.getElementById('steal-source-url-input');

    toggleHtmlLink.addEventListener('click', (e) => {
        e.preventDefault();
        urlContainer.classList.add('hidden');
        htmlContainer.classList.remove('hidden');
        handleUrlInput(); // Check for cache based on the (possibly empty) source URL field
    });
    
    toggleUrlLink.addEventListener('click', (e) => {
        e.preventDefault();
        htmlContainer.classList.add('hidden');
        urlContainer.classList.remove('hidden');
        handleUrlInput(); // Check for cache based on the URL field
    });
    
    document.getElementById('steal-btn').addEventListener('click', handleSteal);
    
    stealUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSteal();
    });
    
    // Check cache as user types in either URL field
    stealUrlInput.addEventListener('input', handleUrlInput);
    sourceUrlInput.addEventListener('input', handleUrlInput);
}