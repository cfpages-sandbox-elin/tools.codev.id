// ideas-steal.js v2.02 manual dedupe
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

function normalizeTitle(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function deduplicateIdeas(ideas, favoriteTitles = []) {
    if (!ideas || ideas.length === 0) return [];

    const uniqueIdeas = [];

    ideas.forEach(currentIdea => {
        const normalizedCurrentTitle = normalizeTitle(currentIdea.title);
        let duplicateIndex = -1;

        for (let i = 0; i < uniqueIdeas.length; i++) {
            const existingIdea = uniqueIdeas[i];
            const normalizedExistingTitle = normalizeTitle(existingIdea.title);
            if (normalizedCurrentTitle.includes(normalizedExistingTitle) || normalizedExistingTitle.includes(normalizedCurrentTitle)) {
                duplicateIndex = i;
                break;
            }
        }

        if (duplicateIndex !== -1) {
            const existingIdea = uniqueIdeas[duplicateIndex];
            const isCurrentFavorite = favoriteTitles.includes(currentIdea.title);
            const isExistingFavorite = favoriteTitles.includes(existingIdea.title);

            if (isCurrentFavorite && !isExistingFavorite) {
                uniqueIdeas[duplicateIndex] = currentIdea;
            } else if (!isCurrentFavorite && isExistingFavorite) {
            } else {
                const currentDescLength = currentIdea.description?.length || 0;
                const existingDescLength = existingIdea.description?.length || 0;

                if (currentDescLength > existingDescLength) {
                    uniqueIdeas[duplicateIndex] = currentIdea;
                } else if (currentDescLength === existingDescLength && currentIdea.title.length > existingIdea.title.length) {
                    uniqueIdeas[duplicateIndex] = currentIdea;
                }
            }
        } else {
            uniqueIdeas.push(currentIdea);
        }
    });

    return uniqueIdeas;
}

function renderInitialUI(container) {
    container.innerHTML = `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4 text-indigo-500 dark:text-sky-300">Steal Ideas From a URL 🕵️</h2>
            <p class="text-gray-600 dark:text-slate-300 mb-4">Enter any article, landing page, or paste its raw HTML. We'll use AI to find hidden business ideas.</p>
            
            <div id="steal-url-container">
                <div class="flex flex-col sm:flex-row gap-3">
                    <input type="text" id="steal-url-input" class="flex-grow bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="e.g., https://www.example.com/article">
                </div>
                <div class="text-right mt-2">
                    <a href="#" id="toggle-html-input" class="text-sm text-indigo-600 dark:text-sky-400 hover:underline">...or paste raw HTML</a>
                </div>
            </div>

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
                <h3 class="text-sm font-medium text-gray-700 dark:text-slate-300">Select AI Providers</h3>
                <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">Work will be distributed among the selected providers.</p>
                <div id="steal-provider-checkboxes" class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-2">
                    <!-- Checkboxes will be rendered here by JS -->
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

function getCurrentStealUrl() {
    const isHtmlMode = !document.getElementById('steal-html-container').classList.contains('hidden');
    const url = isHtmlMode 
        ? document.getElementById('steal-source-url-input').value.trim() 
        : document.getElementById('steal-url-input').value.trim();
    return url;
}

function handleUrlInput() {
    const resultsArea = document.getElementById('steal-results-area');
    const htmlInput = document.getElementById('steal-html-input');
    const sourceUrlInput = document.getElementById('steal-source-url-input');
    const urlContainer = document.getElementById('steal-url-container');
    const htmlContainer = document.getElementById('steal-html-container');
    
    const url = getCurrentStealUrl();

    if (!url) {
        resultsArea.innerHTML = '';
        updateStealButtonState(false);
        return;
    }

    const htmlCacheKey = `stolen_html_${url}`;
    const cachedHtml = localStorage.getItem(htmlCacheKey);
    const isHtmlMode = !htmlContainer.classList.contains('hidden');

    if (cachedHtml && !isHtmlMode) {
        console.log(`Found cached HTML for [${url}]. Populating and switching view.`);
        htmlInput.value = cachedHtml;
        sourceUrlInput.value = url;
        urlContainer.classList.add('hidden');
        htmlContainer.classList.remove('hidden');
    }

    const ideasCacheKey = `stolen_ideas_${url}`;
    const favoritesCacheKey = `stolen_favorites_${url}`;
    const cachedIdeasJSON = localStorage.getItem(ideasCacheKey); // Just get the raw JSON
    const cachedFavorites = JSON.parse(localStorage.getItem(favoritesCacheKey) || '[]');

    if (cachedIdeasJSON) {
        updateStealButtonState(true);
        try {
            const ideasFromCache = JSON.parse(cachedIdeasJSON);
            const resultsArea = document.getElementById('steal-results-area');
            if (ideasFromCache.length > 0) {
                resultsArea.innerHTML = renderIdeasListUI(ideasFromCache, url, cachedFavorites);
            } else {
                resultsArea.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">Previously analyzed, but no ideas were found.</p>`;
            }
        } catch (e) {
            console.error("Failed to parse cached stolen ideas:", e);
            localStorage.removeItem(ideasCacheKey);
            updateStealButtonState(false);
        }
    } else {
        updateStealButtonState(false);
        document.getElementById('steal-results-area').innerHTML = '';
    }
}

async function handleDeduplicateClick(event) {
    const button = event.target.closest('.deduplicate-btn');
    if (!button) return;

    const url = button.dataset.sourceUrl;
    if (!url) return;

    button.disabled = true;
    button.textContent = 'Working...';

    const ideasCacheKey = `stolen_ideas_${url}`;
    const favoritesCacheKey = `stolen_favorites_${url}`;

    const ideasFromCache = JSON.parse(localStorage.getItem(ideasCacheKey) || '[]');
    const favorites = JSON.parse(localStorage.getItem(favoritesCacheKey) || '[]');

    const cleanIdeas = deduplicateIdeas(ideasFromCache, favorites);
    const numRemoved = ideasFromCache.length - cleanIdeas.length;

    // Save the cleaned list back to the cache
    localStorage.setItem(ideasCacheKey, JSON.stringify(cleanIdeas));

    // Re-render the entire results area with the new data
    const resultsArea = document.getElementById('steal-results-area');
    resultsArea.innerHTML = renderIdeasListUI(cleanIdeas, url, favorites);
    
    // Provide feedback on the new button after re-render
    const newButton = resultsArea.querySelector('.deduplicate-btn');
    if (newButton) {
        newButton.disabled = true;
        if (numRemoved > 0) {
            newButton.textContent = `✅ ${numRemoved} Removed!`;
        } else {
            newButton.textContent = `✅ No duplicates found!`;
        }
        setTimeout(() => {
            newButton.disabled = false;
            newButton.innerHTML = 'Deduplicate 🧹';
        }, 2500);
    }
}

function extractTextFromHtml(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body.innerText || doc.body.textContent || "";
}

async function handleSteal() {
    const resultsArea = document.getElementById('steal-results-area');
    const stealBtn = document.getElementById('steal-btn');
    const htmlInput = document.getElementById('steal-html-input');
    const sourceUrlInput = document.getElementById('steal-source-url-input');
    const urlInput = document.getElementById('steal-url-input');

    const isHtmlMode = !document.getElementById('steal-html-container').classList.contains('hidden');
    
    let url;
    let textPromise;
    let rawHtmlForCaching = '';

    stealBtn.disabled = true;
    resultsArea.innerHTML = `<div class="flex justify-center items-center py-10"><div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div></div>`;

    if (isHtmlMode) {
        url = sourceUrlInput.value.trim();
        rawHtmlForCaching = htmlInput.value.trim();
        if (!url || !rawHtmlForCaching) {
            resultsArea.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">Please provide both the original URL and the raw HTML.</div>`;
            stealBtn.disabled = false; return;
        }
        stealBtn.innerHTML = 'Parsing HTML...';
        textPromise = Promise.resolve(extractTextFromHtml(rawHtmlForCaching));
    } else {
        url = urlInput.value.trim();
        if (!url) {
            resultsArea.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">Please enter a URL.</div>`;
            stealBtn.disabled = false; return;
        }
        stealBtn.innerHTML = 'Scraping...';
        textPromise = scrapeUrl(url);
    }
    
    const ideasCacheKey = `stolen_ideas_${url}`;
    const favoritesCacheKey = `stolen_favorites_${url}`;

    try {
        const fullText = await textPromise;
        if (!fullText) throw new Error("Could not extract any text from the source.");

        const selectedCheckboxes = document.querySelectorAll('#steal-provider-checkboxes input[type="checkbox"]:checked');
        const selectedProviderKeys = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (selectedProviderKeys.length === 0) {
            throw new Error("No AI providers selected. Please check at least one provider to run the analysis.");
        }

        const { allAiProviders } = getState();
        const availableProviders = selectedProviderKeys.map(key => {
            const providerData = allAiProviders[key];
            const freeModel = providerData.models.find(m => isFree(m, key));
            return freeModel ? { providerKey: key, modelId: freeModel.id, providerName: freeModel.provider } : null;
        }).filter(Boolean);

        if (availableProviders.length === 0) {
            throw new Error("None of the selected providers have a valid free model available.");
        }
        
        const chunkSize = 14000;
        const textChunks = [];
        for (let i = 0; i < fullText.length; i += chunkSize) {
            textChunks.push(fullText.substring(i, i + chunkSize));
        }

        stealBtn.innerHTML = `Analyzing ${textChunks.length} chunks across ${availableProviders.length} providers...`;
        
        const analysisPromises = textChunks.map((chunk, index) => {
            const provider = availableProviders[index % availableProviders.length];
            const prompt = createStealIdeasPrompt(chunk);
            return getAiAnalysis(prompt, provider.providerKey, provider.modelId);
        });

        const settledResults = await Promise.allSettled(analysisPromises);
        
        let allIdeas = [];
        settledResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                const ideasFromChunk = extractAndParseJson(result.value.text);
                if (ideasFromChunk && ideasFromChunk.length > 0) allIdeas.push(...ideasFromChunk);
            } else {
                console.error(`Chunk ${index + 1} analysis failed:`, result.reason || result.value.error);
            }
        });
        console.log(`Found ${allIdeas.length} raw ideas. Deduplicating...`);

        const existingFavorites = JSON.parse(localStorage.getItem(favoritesCacheKey) || '[]');
        console.log(`Found ${allIdeas.length} raw ideas. Deduplicating...`);

        const uniqueIdeas = deduplicateIdeas(allIdeas, existingFavorites);
        console.log(`Deduplicated down to ${uniqueIdeas.length} unique ideas.`);
        
        localStorage.setItem(ideasCacheKey, JSON.stringify(uniqueIdeas));
        console.log(`Saved/Overwrote ${uniqueIdeas.length} stolen ideas for [${url}] in cache.`);
        if (isHtmlMode && rawHtmlForCaching) {
            localStorage.setItem(`stolen_html_${url}`, rawHtmlForCaching);
            console.log(`Saved raw HTML for [${url}] in cache.`);
        }

        if (uniqueIdeas.length > 0) {
            resultsArea.innerHTML = renderIdeasListUI(uniqueIdeas, url, existingFavorites);
        } else {
            resultsArea.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">Analysis complete, but no business ideas were found. This may happen if some providers failed.</p>`;
        }
        
        updateStealButtonState(true);

    } catch (error) {
        resultsArea.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">Error: ${error.message}</div>`;
        updateStealButtonState(false);
    } finally {
        stealBtn.disabled = false;
    }
}

function handleFavoriteClick(event) {
    const favoriteButton = event.target.closest('.favorite-btn');
    if (!favoriteButton) return;

    const url = getCurrentStealUrl();
    if (!url) return;

    const ideaTitle = decodeURIComponent(favoriteButton.dataset.ideaTitle);
    const favoritesCacheKey = `stolen_favorites_${url}`;
    
    let favorites = JSON.parse(localStorage.getItem(favoritesCacheKey) || '[]');
    
    const ideaIndex = favorites.indexOf(ideaTitle);
    
    if (ideaIndex > -1) {
        favorites.splice(ideaIndex, 1);
    } else {
        favorites.push(ideaTitle);
    }

    localStorage.setItem(favoritesCacheKey, JSON.stringify(favorites));

    const ideasCacheKey = `stolen_ideas_${url}`;
    const ideas = JSON.parse(localStorage.getItem(ideasCacheKey) || '[]');
    const resultsArea = document.getElementById('steal-results-area');
    resultsArea.innerHTML = renderIdeasListUI(ideas, url, favorites);
}


function populateProviderCheckboxes() {
    const container = document.getElementById('steal-provider-checkboxes');
    const { allAiProviders } = getState();

    if (!container || !allAiProviders) return;

    const freeProviders = Object.entries(allAiProviders)
        .map(([key, providerData]) => {
            const freeModel = providerData.models.find(m => isFree(m, key));
            return freeModel ? { key, name: freeModel.provider } : null;
        })
        .filter(Boolean);
    const uniqueProviders = [...new Map(freeProviders.map(item => [item.name, item])).values()];

    if (uniqueProviders.length > 0) {
        container.innerHTML = uniqueProviders.map(provider => `
            <div class="flex items-center">
                <input id="provider-cb-${provider.key}" name="provider" type="checkbox" value="${provider.key}" checked
                       class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-600 dark:border-slate-500">
                <label for="provider-cb-${provider.key}" class="ml-2 block text-sm text-gray-900 dark:text-slate-300">${provider.name}</label>
            </div>
        `).join('');
    } else {
        container.innerHTML = `<p class="text-sm text-red-500 col-span-full">No free providers found. Please add API keys for providers like Groq, OpenRouter, etc.</p>`;
    }
}


export function initStealTab() {
    const stealContainer = document.getElementById('steal-content');
    if (!stealContainer) return;
    renderInitialUI(stealContainer);
    
    populateProviderCheckboxes();
    
    const urlContainer = document.getElementById('steal-url-container');
    const htmlContainer = document.getElementById('steal-html-container');
    const toggleHtmlLink = document.getElementById('toggle-html-input');
    const toggleUrlLink = document.getElementById('toggle-url-input');

    const stealUrlInput = document.getElementById('steal-url-input');
    const sourceUrlInput = document.getElementById('steal-source-url-input');
    const htmlInput = document.getElementById('steal-html-input');
    const resultsArea = document.getElementById('steal-results-area');

    toggleHtmlLink.addEventListener('click', (e) => {
        e.preventDefault();
        urlContainer.classList.add('hidden');
        htmlContainer.classList.remove('hidden');
        handleUrlInput();
    });
    
    toggleUrlLink.addEventListener('click', (e) => {
        e.preventDefault();
        htmlContainer.classList.add('hidden');
        urlContainer.classList.remove('hidden');
        handleUrlInput();
    });
    
    document.getElementById('steal-btn').addEventListener('click', handleSteal);
    resultsArea.addEventListener('click', (e) => {
        if (e.target.closest('.favorite-btn')) {
            handleFavoriteClick(e);
        } else if (e.target.closest('.deduplicate-btn')) {
            handleDeduplicateClick(e);
        }
    });
    
    stealUrlInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSteal(); });

    stealUrlInput.addEventListener('input', handleUrlInput);
    sourceUrlInput.addEventListener('input', handleUrlInput);
    
    htmlInput.addEventListener('input', () => {
        const url = sourceUrlInput.value.trim();
        const html = htmlInput.value.trim();
        if (url && html) {
            const htmlCacheKey = `stolen_html_${url}`;
            localStorage.setItem(htmlCacheKey, html);
            console.log(`Saved raw HTML for [${url}] on paste.`);
        }
    });
}