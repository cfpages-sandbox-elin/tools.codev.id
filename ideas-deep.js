// ideas-deep.js v2.00 deeper
import { getAiAnalysis } from './ideas-api.js';
import { extractAndParseJson } from './ideas.js';
import { createAdvancedAnalysisPrompt } from './ideas-prompts.js';

// --- THE COMPLETE LIST OF ANALYSIS MODULES ---
const analysisModules = [
    { id: 'viabilitySnapshot', title: 'Viability Snapshot', icon: '💡' },
    { id: 'marketGap', title: 'Market Gap Analysis', icon: '🔍' },
    { id: 'whyNow', title: '"Why Now?" Timing Analysis', icon: '⌛' },
    { id: 'valueLadder', title: 'Value Ladder Strategy', icon: '🪜' },
    { id: 'valueEquation', title: 'Value Equation', icon: '⚖️' },
    { id: 'marketMatrix', title: 'Market Matrix', icon: '📈' },
    { id: 'acpFramework', title: 'A.C.P. Framework', icon: '🎯' },
    { id: 'communitySignals', title: 'Community & GTM Signals', icon: '📢' },
    { id: 'keywordAnalysis', title: 'Keyword & SEO Analysis', icon: '🔑' },
    { id: 'executionPlan', title: 'Phased Execution Plan', icon: '🗺️' },
];

function getIdeaSlug(ideaTitle) {
    return ideaTitle.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
}

// --- RENDER FUNCTIONS (with improved display logic) ---

function renderModuleCard(module, idea) {
    const ideaSlug = getIdeaSlug(idea.title);
    const cacheKey = `deep_analysis_v2_${module.id}_${ideaSlug}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    let contentHTML = `
        <div class="card-content-area text-center py-4">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
            <p class="text-sm text-gray-400 mt-2">Analyzing...</p>
        </div>
    `;
    let summaryScoreHTML = `<span class="score-badge bg-gray-400">...</span>`;

    if (cachedData) {
        try {
            const data = JSON.parse(cachedData);
            contentHTML = renderModuleContent(module.id, data);
            
            // Get score from various possible keys
            const score = data.overallScore || data.uniquenessScore || data.potentialScore || null;
            summaryScoreHTML = `<span class="score-badge">${score ? `${score}/10` : '✓'}</span>`;

        } catch (e) {
            contentHTML = `<p class="text-red-500 text-sm">Error: Failed to parse cached data.</p>`;
        }
    }
    
    return `
        <details class="bg-white dark:bg-slate-800/50 rounded-lg shadow-md overflow-hidden group" id="card-${module.id}">
            <summary class="list-none cursor-pointer p-5 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
                <div class="flex items-center">
                    <span class="text-2xl mr-3">${module.icon}</span>
                    <h3 class="text-xl font-semibold text-indigo-500 dark:text-sky-300">${module.title}</h3>
                </div>
                <div class="flex items-center">
                    ${summaryScoreHTML}
                    <div class="text-xl text-gray-400 ml-4 group-open:rotate-180 transition-transform duration-300">▼</div>
                </div>
            </summary>
            <div class="p-5 bg-gray-50 dark:bg-slate-800">${contentHTML}</div>
        </details>
    `;
}

function renderModuleContent(moduleId, data) {
    const prettyJSON = JSON.stringify(data, null, 2);
    return `
        <pre class="text-xs bg-gray-100 dark:bg-slate-900/50 p-3 rounded-md overflow-x-auto"><code>${prettyJSON}</code></pre>
        <div class="mt-4 text-right">
            <button class="regenerate-btn text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md" data-module-id="${moduleId}">
                Re-generate
            </button>
        </div>
    `;
}

function renderModuleError(moduleId, error) {
    const cardContentContainer = document.querySelector(`#card-${moduleId} .p-5`);
    if (cardContentContainer) {
        cardContentContainer.innerHTML = `<p class="text-red-500 text-sm">Error: ${error.message}</p>`;
    }
}

// --- LOGIC FUNCTIONS ---

async function runSingleAnalysis(idea, module) {
    const card = document.getElementById(`card-${module.id}`);
    if (!card || card.querySelector('.regenerate-btn')) {
        return; // Already rendered from cache
    }
    
    const ideaSlug = getIdeaSlug(idea.title);
    const cacheKey = `deep_analysis_v2_${module.id}_${ideaSlug}`;

    try {
        const prompt = createAdvancedAnalysisPrompt(idea, module.id);
        const result = await getAiAnalysis(prompt, 'groq', 'llama-3.1-8b-instant');
        if (!result.success) throw new Error(result.error);
        
        const analysisData = JSON.parse(result.text); // Using direct parse for strict JSON prompts
        localStorage.setItem(cacheKey, JSON.stringify(analysisData));

        card.querySelector('.p-5').innerHTML = renderModuleContent(module.id, analysisData);
        
        const score = analysisData.overallScore || analysisData.uniquenessScore || analysisData.potentialScore || null;
        const scoreBadge = card.querySelector('.score-badge');
        if (scoreBadge) {
             scoreBadge.textContent = score ? `${score}/10` : '✓';
        }

    } catch (error) {
        renderModuleError(module.id, error);
    }
}

// --- INITIALIZATION ---

export function initDeepAnalysis(idea) {
    const container = document.getElementById('deep-analysis-content');
    
    if (!idea) {
        container.innerHTML = `
            <div class="text-center p-8 bg-white dark:bg-slate-800/50 rounded-lg shadow-md">
                <h3 class="text-2xl font-semibold text-gray-700 dark:text-slate-200">Deep Analysis🔬</h3>
                <p class="mt-2 text-gray-500 dark:text-slate-400">
                    Click the "Deep Analyze" button on an idea in the 
                    <span class="font-semibold text-indigo-500">Brainstorm</span> or 
                    <span class="font-semibold text-purple-500">Steal</span> tabs 
                    to see a detailed breakdown here.
                </p>
            </div>
        `;
        return;
    }

    const ideaSlug = getIdeaSlug(idea.title);

    container.innerHTML = `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
            <h2 class="text-3xl font-bold text-gray-800 dark:text-white">${idea.title}</h2>
            <p class="text-gray-600 dark:text-slate-400 mt-2">${idea.description}</p>
        </div>
        <div class="space-y-4" id="deep-analysis-cards">
            ${analysisModules.map(module => renderModuleCard(module, idea)).join('')}
        </div>
    `;

    container.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('regenerate-btn')) {
            const button = e.target;
            button.disabled = true;
            button.textContent = 'Generating...';
            
            const moduleId = button.dataset.moduleId;
            const module = analysisModules.find(m => m.id === moduleId);
            
            const contentContainer = button.closest('.p-5');
            contentContainer.innerHTML = `
                <div class="card-content-area text-center py-4">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                </div>`;
            
            await runSingleAnalysis(idea, module);
        }
    });

    analysisModules.forEach(module => {
        runSingleAnalysis(idea, module);
    });
}