// ideas-deep.js
import { getAiAnalysis } from './ideas-api.js';
import { extractAndParseJson } from './ideas.js';
import { createDeepAnalysisPrompt } from './ideas-prompts.js';

const analysisModules = [
    { id: 'swot', title: 'Viability Analysis' },
    { id: 'businessModel', title: 'Business Model Tiers' },
    { id: 'market', title: 'Market Positioning' },
    { id: 'channels', title: 'Go-to-Market Channels' },
    { id: 'seo', title: 'SEO Keyword Ideas' },
    { id: 'execution', title: 'Execution Plan' },
    { id: 'acp', title: 'A.C.P. Framework' },
];

function renderCardPlaceholder(module) {
    return `
        <div id="card-${module.id}" class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold text-indigo-500 dark:text-sky-300 mb-3">${module.title}</h3>
            <div class="card-content-area text-center py-4">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                <p class="text-sm text-gray-400 mt-2">Analyzing...</p>
            </div>
        </div>
    `;
}

function renderAnalysisResult(moduleId, data) {
    const cardContent = document.querySelector(`#card-${moduleId} .card-content-area`);
    if (!cardContent) return;

    let html = '';
    // This is a simple renderer; it could be much more sophisticated
    // with custom UI for each module type.
    html = `<pre class="text-xs bg-gray-100 dark:bg-slate-900/50 p-3 rounded-md overflow-x-auto"><code>${JSON.stringify(data, null, 2)}</code></pre>`;
    
    cardContent.innerHTML = html;
}

function renderAnalysisError(moduleId, error) {
    const cardContent = document.querySelector(`#card-${moduleId} .card-content-area`);
    if (cardContent) {
        cardContent.innerHTML = `<p class="text-red-500 text-sm">Error: ${error.message}</p>`;
    }
}

export async function initDeepAnalysis(idea) {
    const container = document.getElementById('deep-analysis-content');
    
    // 1. Render the main structure and placeholders
    container.innerHTML = `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
            <h2 class="text-3xl font-bold text-gray-800 dark:text-white">${idea.title}</h2>
            <p class="text-gray-600 dark:text-slate-400 mt-2">${idea.description}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${analysisModules.map(renderCardPlaceholder).join('')}
        </div>
    `;

    // 2. Run all analyses in parallel
    analysisModules.forEach(async (module) => {
        try {
            const prompt = createDeepAnalysisPrompt(idea, module.id);
            const result = await getAiAnalysis(prompt, 'groq', 'llama3-8b-8192');
            if (!result.success) throw new Error(result.error);
            const analysisData = extractAndParseJson(result.text);
            renderAnalysisResult(module.id, analysisData);
        } catch (error) {
            renderAnalysisError(module.id, error);
        }
    });
}