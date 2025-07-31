// ideas-steal.js
import { scrapeUrl, getAiAnalysis } from './ideas-api.js';
import { extractAndParseJson } from './ideas.js';
import { createStealIdeasPrompt } from './ideas-prompts.js';
import { renderIdeasListUI } from './ideas-ui.js';

function renderInitialUI(container) {
    container.innerHTML = `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-semibold mb-4 text-indigo-500 dark:text-sky-300">Steal Ideas From a URL 🕵️</h2>
            <p class="text-gray-600 dark:text-slate-300 mb-4">Enter any article or landing page. We'll scrape its text and use AI to find hidden business ideas.</p>
            <div class="flex flex-col sm:flex-row gap-3">
                <input type="text" id="steal-url-input" class="flex-grow bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="e.g., https://www.example.com/article">
                <button id="steal-btn" class="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white font-bold py-3 px-6 rounded-md transition-colors">
                    Steal Ideas ✨
                </button>
            </div>
        </div>
        <div id="steal-results-area" class="mt-8 space-y-6"></div>
    `;
}

async function handleSteal() {
    const urlInput = document.getElementById('steal-url-input');
    const resultsArea = document.getElementById('steal-results-area');
    const stealBtn = document.getElementById('steal-btn');
    const url = urlInput.value.trim();

    if (!url) {
        resultsArea.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">Please enter a URL.</div>`;
        return;
    }

    stealBtn.disabled = true;
    stealBtn.innerHTML = 'Scraping...';
    resultsArea.innerHTML = `<div class="flex justify-center items-center py-10"><div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div></div>`;

    try {
        // Step 1: Scrape text from URL
        const text = await scrapeUrl(url);
        
        stealBtn.innerHTML = 'Analyzing...';

        // Step 2: Use AI to find ideas in the text
        const prompt = createStealIdeasPrompt(text);
        // Using a capable free model by default
        const result = await getAiAnalysis(prompt, 'groq', 'llama3-8b-8192');

        if (!result.success) throw new Error(result.error);
        
        const ideas = extractAndParseJson(result.text);

        // Step 3: Render the results
        if (ideas.length > 0) {
            resultsArea.innerHTML = renderIdeasListUI(ideas);
        } else {
            resultsArea.innerHTML = `<p class="text-center text-gray-500 dark:text-slate-400">The AI couldn't find any specific business ideas on that page. Try another one!</p>`;
        }

    } catch (error) {
        resultsArea.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg">Error: ${error.message}</div>`;
    } finally {
        stealBtn.disabled = false;
        stealBtn.innerHTML = 'Steal Ideas ✨';
    }
}

export function initStealTab() {
    const stealContainer = document.getElementById('steal-content');
    renderInitialUI(stealContainer);

    document.getElementById('steal-btn').addEventListener('click', handleSteal);
    document.getElementById('steal-url-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSteal();
    });
}