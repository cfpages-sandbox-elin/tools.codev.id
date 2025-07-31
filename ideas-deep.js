// ideas-deep.js v2.01 very pretty
import { getAiAnalysis } from './ideas-api.js';
import { createAdvancedAnalysisPrompt } from './ideas-prompts.js';

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

// --- UI HELPER FUNCTIONS ---
function renderScoreBadge(score, text = "/10") {
    if (!score && score !== 0) return '';
    const scoreNum = parseInt(score, 10);
    let bgColor = 'bg-gray-400';
    if (scoreNum >= 8) bgColor = 'bg-green-500';
    else if (scoreNum >= 5) bgColor = 'bg-yellow-500';
    else if (scoreNum >= 0) bgColor = 'bg-red-500';
    return `<span class="text-white text-xs font-bold px-2 py-1 rounded-full ${bgColor}">${score}${text}</span>`;
}

function renderInfoCard(item, scoreKey = 'score') {
    return `
        <div class="bg-gray-100 dark:bg-slate-700/50 p-3 rounded-lg">
            <div class="flex justify-between items-center">
                <h5 class="font-semibold text-gray-800 dark:text-slate-200">${item.name}</h5>
                ${renderScoreBadge(item[scoreKey])}
            </div>
            <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">${item.description || item.reasoning || ''}</p>
        </div>
    `;
}

// --- NEW: SPECIFIC RENDERERS FOR EACH MODULE ---
function renderViabilitySnapshot(data) {
    if (!data) return '<p>No data available.</p>';
    const items = [
        { name: 'Opportunity', ...data.opportunity }, { name: 'Problem Severity', ...data.problemSeverity },
        { name: 'Feasibility', ...data.feasibility }, { name: 'Timing', ...data.timing },
    ];
    return `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${items.map(item => renderInfoCard(item)).join('')}</div>`;
}

function renderMarketGap(data) {
    if (!data) return '<p>No data available.</p>';
    return `<p class="mb-4 text-gray-700 dark:text-slate-300">${data.summary}</p><div class="space-y-4">${Object.keys(data).filter(k => Array.isArray(data[k])).map(key => `<div><h4 class="font-bold mb-2 text-gray-800 dark:text-slate-200">${key.replace(/([A-Z])/g, ' $1').trim()}</h4><div class="space-y-2">${(data[key] || []).map(item => renderInfoCard(item)).join('')}</div></div>`).join('')}</div>`;
}

function renderWhyNow(data) {
    if (!data) return '<p>No data available.</p>';
    return `<p class="mb-4 text-gray-700 dark:text-slate-300">${data.summary}</p><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="space-y-2"><h4 class="font-bold text-gray-800 dark:text-slate-200">Market Factors</h4>${(data.marketFactors || []).map(item => renderInfoCard(item)).join('')}</div><div class="space-y-2"><h4 class="font-bold text-gray-800 dark:text-slate-200">Tech Enablers</h4>${(data.techEnablers || []).map(item => renderInfoCard(item)).join('')}</div><div class="space-y-2 col-span-full"><h4 class="font-bold text-red-500 dark:text-red-400">Timing Risks</h4>${(data.timingRisks || []).map(item => renderInfoCard(item)).join('')}</div></div>`;
}

function renderValueLadder(data) {
    if (!data) return '<p>No data available.</p>';
    const ladder = [ { tier: 'Lead Magnet', ...data.leadMagnet }, { tier: 'Frontend Offer', ...data.frontendOffer }, { tier: 'Core Offer', ...data.coreOffer }, { tier: 'Continuity Program', ...data.continuityProgram }, { tier: 'Backend Offer', ...data.backendOffer } ];
    return `<div class="space-y-4">${ladder.map(item => `<div class="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-lg border-l-4 border-indigo-500"><div class="flex justify-between items-start"><div><p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">${item.tier}</p><h4 class="text-lg font-bold text-gray-800 dark:text-slate-200">${item.name}</h4></div><span class="font-semibold text-indigo-600 dark:text-sky-400">${item.price}</span></div><div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div><p class="font-semibold text-gray-700 dark:text-slate-300">Value Provided:</p><p class="text-gray-600 dark:text-slate-400">${item.valueProvided}</p></div><div><p class="font-semibold text-gray-700 dark:text-slate-300">Goal:</p><p class="text-gray-600 dark:text-slate-400">${item.goal}</p></div></div></div>`).join('')}</div>`;
}

function renderValueEquation(data) {
    if (!data) return '<p>No data available.</p>';
    const items = [ { name: 'Dream Outcome', ...data.dreamOutcome }, { name: 'Perceived Likelihood', ...data.perceivedLikelihood }, { name: 'Time Delay', ...data.timeDelay }, { name: 'Effort & Sacrifice', ...data.effortAndSacrifice } ];
    return `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${items.map(item => renderInfoCard(item)).join('')}</div><div class="mt-4"><h4 class="font-bold text-gray-800 dark:text-slate-200">Improvement Suggestions</h4><ul class="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-slate-400">${(data.improvementSuggestions || []).map(s => `<li>${s}</li>`).join('')}</ul></div>`;
}

function renderMarketMatrix(data) {
    if (!data) return '<p>No data available.</p>';
    const quadrants = { 'Category King': 'bg-green-100 dark:bg-green-900/50 border-green-500', 'High Impact': 'bg-blue-100 dark:bg-blue-900/50 border-blue-500', 'Commodity Play': 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-500', 'Low Impact': 'bg-red-100 dark:bg-red-900/50 border-red-500' };
    return `<div class="text-center p-4 rounded-lg border-2 ${quadrants[data.quadrant] || 'bg-gray-100'}"><p class="text-sm font-semibold text-gray-500 dark:text-slate-400">Position</p><h3 class="text-2xl font-bold text-gray-800 dark:text-slate-200">${data.quadrant}</h3><p class="mt-2 text-sm text-gray-600 dark:text-slate-400">${data.analysis}</p></div><div class="flex justify-around mt-4 text-center"><div class="font-semibold">Uniqueness: ${renderScoreBadge(data.uniquenessScore)}</div><div class="font-semibold">Value: ${renderScoreBadge(data.valueScore)}</div></div>`;
}

function renderAcpFramework(data) {
    if (!data) return '<p>No data available.</p>';
    const sections = [ { title: 'Audience Analysis', data: data.audienceAnalysis }, { title: 'Community Analysis', data: data.communityAnalysis }, { title: 'Product Analysis', data: data.productAnalysis } ];
    return `<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">${sections.map(sec => `<div class="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-lg"><h4 class="font-bold mb-3 text-lg text-gray-800 dark:text-slate-200">${sec.title}</h4><div class="space-y-3 text-sm">${Object.entries(sec.data).map(([key, value]) => `<div><p class="font-semibold text-gray-700 dark:text-slate-300">${key.replace(/([A-Z])/g, ' $1').trim()}:</p>${Array.isArray(value) ? `<ul class="list-disc list-inside pl-2 text-gray-600 dark:text-slate-400">`+value.map(v => `<li>${v}</li>`).join('')+`</ul>` : `<p class="text-gray-600 dark:text-slate-400">${value}</p>`}</div>`).join('')}</div></div>`).join('')}</div>`;
}

function renderCommunitySignals(data) {
    if (!data) return '<p>No data available.</p>';
    const platforms = [ { name: 'Reddit', ...data.reddit }, { name: 'Facebook', ...data.facebook }, { name: 'YouTube', ...data.youtube } ];
    return `<p class="mb-4 text-gray-700 dark:text-slate-300">${data.summary}</p><div class="grid grid-cols-1 lg:grid-cols-3 gap-4">${platforms.map(p => `<div class="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-lg"><div class="flex justify-between items-center"><h4 class="font-bold text-lg text-gray-800 dark:text-slate-200">${p.name}</h4>${renderScoreBadge(p.potentialScore)}</div><p class="text-sm text-gray-600 dark:text-slate-400 mt-2">${p.analysis}</p></div>`).join('')}</div>`;
}

function renderKeywordAnalysis(data) {
    if (!data) return '<p>No data available.</p>';
    const renderKeywordList = (list) => (list || []).map(kw => `<li class="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700"><span class="text-gray-700 dark:text-slate-300">${kw.keyword}</span><span class="font-mono text-xs text-gray-500 dark:text-slate-400">${kw.volume} ${kw.growth ? `(${kw.growth})` : ''}</span></li>`).join('');
    return `<p class="mb-4 text-gray-700 dark:text-slate-300">${data.summary}</p><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="bg-gray-100 dark:bg-slate-700/50 p-3 rounded-lg"><h4 class="font-bold text-gray-800 dark:text-slate-200 mb-2">Fastest Growing</h4><ul>${renderKeywordList(data.fastestGrowing)}</ul></div><div class="bg-gray-100 dark:bg-slate-700/50 p-3 rounded-lg"><h4 class="font-bold text-gray-800 dark:text-slate-200 mb-2">Highest Volume</h4><ul>${renderKeywordList(data.highestVolume)}</ul></div><div class="bg-gray-100 dark:bg-slate-700/50 p-3 rounded-lg"><h4 class="font-bold text-gray-800 dark:text-slate-200 mb-2">Most Relevant</h4><ul>${renderKeywordList(data.mostRelevant)}</ul></div></div>`;
}

function renderExecutionPlan(data) {
    return `<div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-2">${Object.entries(data).filter(([key]) => key.startsWith('part')).map(([key, partData]) => `<div class="mt-4"><h4 class="text-lg font-bold text-indigo-600 dark:text-sky-400 border-b border-gray-300 dark:border-slate-600 pb-1 mb-3">${partData.title || key.replace('part','Part ')}</h4><div class="space-y-3 text-sm">${Object.entries(partData).filter(([k]) => k !== 'title').map(([k,v]) => `<div><strong class="text-gray-700 dark:text-slate-300">${k.replace(/([A-Z])/g, ' $1').trim()}:</strong> `+(typeof v === 'object' ? `<div class="pl-4">${Object.entries(v).map(([sk,sv]) => `<p><span class="font-semibold">${sk.replace(/([A-Z])/g, ' $1').trim()}:</span> ${sv}</p>`).join('')}</div>` : `<span class="text-gray-600 dark:text-slate-400">${v}</span>`)+`</div>`).join('')}</div></div>`).join('')}</div><div class="lg:col-span-1"><div class="space-y-4 p-4 bg-gray-100 dark:bg-slate-900/50 rounded-lg">${Object.entries(data.sidebarAnalysis || {}).map(([key, val])=>`<div><h5 class="font-bold text-gray-800 dark:text-slate-200">${key.replace(/([A-Z])/g, ' $1').trim()}</h5><div class="text-sm text-gray-600 dark:text-slate-400 mt-1">${Object.entries(val).map(([k,v])=>`<p><strong>${k.replace(/([A-Z])/g, ' $1').trim()}:</strong> ${v}</p>`).join('')}</div></div>`).join('')}</div></div></div>`; 
}

// --- NEW: MASTER UI RENDERER ---
function renderModuleDetailContent(moduleId, data) {
    let contentHtml = '';
    const renderers = { viabilitySnapshot, marketGap, whyNow, valueLadder, valueEquation, marketMatrix, acpFramework, communitySignals, keywordAnalysis, executionPlan };
    if (renderers[moduleId]) {
        contentHtml = renderers[moduleId](data);
    } else {
        contentHtml = `<pre class="text-xs"><code>${JSON.stringify(data, null, 2)}</code></pre>`;
    }
    return `${contentHtml}<div class="mt-6 text-right"><button class="regenerate-btn text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md" data-module-id="${moduleId}">Re-generate</button></div>`;
}

// --- NEW: SUMMARY & CARD PLACEHOLDER RENDERERS ---
function renderModuleSummary(module) {
    return `<div class="summary-card bg-white dark:bg-slate-800/50 p-3 rounded-lg shadow-md flex items-center" id="summary-card-${module.id}"><span class="text-xl mr-3">${module.icon}</span><div><p class="text-sm font-semibold text-gray-800 dark:text-slate-200">${module.title}</p><div class="summary-content text-xs text-gray-500 dark:text-slate-400 mt-1">Analyzing...</div></div></div>`;
}

function renderModuleDetailCard(module) {
    return `<div class="detail-card bg-white dark:bg-slate-800/50 rounded-lg shadow-md" id="detail-card-${module.id}"><h3 class="text-xl font-semibold text-indigo-500 dark:text-sky-300 p-4 border-b border-gray-200 dark:border-slate-700 flex items-center"><span class="text-2xl mr-3">${module.icon}</span>${module.title}</h3><div class="p-4 detail-content-area bg-gray-50 dark:bg-slate-800"><div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div></div></div></div>`;
}

// --- LOGIC FUNCTIONS ---
async function runSingleAnalysis(idea, module) {
    const detailCard = document.getElementById(`detail-card-${module.id}`);
    const summaryCardContent = document.querySelector(`#summary-card-${module.id} .summary-content`);
    if (!detailCard || detailCard.querySelector('.regenerate-btn')) return;

    const ideaSlug = getIdeaSlug(idea.title);
    const cacheKey = `deep_analysis_v4_${module.id}_${ideaSlug}`;

    try {
        const cachedData = localStorage.getItem(cacheKey);
        let analysisData;
        if(cachedData) {
            analysisData = JSON.parse(cachedData);
        } else {
            const prompt = createAdvancedAnalysisPrompt(idea, module.id);
            const result = await getAiAnalysis(prompt, 'groq', 'llama-3.1-8b-instant');
            if (!result.success) throw new Error(result.error);
            analysisData = JSON.parse(result.text);
            localStorage.setItem(cacheKey, JSON.stringify(analysisData));
        }

        // Update Detail Card
        detailCard.querySelector('.detail-content-area').innerHTML = renderModuleDetailContent(module.id, analysisData);
        // Update Summary Card
        const score = analysisData.overallScore || analysisData.uniquenessScore || (analysisData.mainKeyword && '✓') || '✓';
        if(summaryCardContent) summaryCardContent.innerHTML = `<strong class="text-green-500">Complete</strong> ${renderScoreBadge(score, '')}`;

    } catch (error) {
        const errorMsg = `Error: ${error.message}`;
        detailCard.querySelector('.detail-content-area').innerHTML = `<p class="text-red-500 text-sm">${errorMsg}</p>`;
        if(summaryCardContent) summaryCardContent.innerHTML = `<strong class="text-red-500">Failed</strong>`;
    }
}

// --- INITIALIZATION ---
export function initDeepAnalysis(idea) {
    const container = document.getElementById('deep-analysis-content');
    if (!idea) { /* ... placeholder logic ... */ return; }

    container.innerHTML = `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6">
            <h2 class="text-3xl font-bold text-gray-800 dark:text-white">${idea.title}</h2>
            <p class="text-gray-600 dark:text-slate-400 mt-2">${idea.description}</p>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Analysis Dashboard</h3>
        <div id="deep-analysis-summary-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">${analysisModules.map(renderModuleSummary).join('')}</div>
        <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Detailed Breakdown</h3>
        <div id="deep-analysis-cards-grid" class="grid grid-cols-1 lg:grid-cols-2 gap-6">${analysisModules.map(renderModuleDetailCard).join('')}</div>
    `;

    container.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('regenerate-btn')) {
            const button = e.target;
            const moduleId = button.dataset.moduleId;
            const module = analysisModules.find(m => m.id === moduleId);
            const detailCard = document.getElementById(`detail-card-${module.id}`);
            const summaryCardContent = document.querySelector(`#summary-card-${module.id} .summary-content`);
            
            // Invalidate cache and re-run
            localStorage.removeItem(`deep_analysis_v4_${module.id}_${getIdeaSlug(idea.title)}`);
            detailCard.querySelector('.detail-content-area').innerHTML = `<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div></div>`;
            if (summaryCardContent) summaryCardContent.innerHTML = `Re-analyzing...`;
            
            await runSingleAnalysis(idea, module);
        }
    });

    analysisModules.forEach(module => {
        runSingleAnalysis(idea, module);
    });
}