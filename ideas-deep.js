// ideas-deep.js v2.01 prettier
import { getAiAnalysis } from './ideas-api.js';
import { extractAndParseJson } from './ideas.js';
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

function renderScoreBadge(score, text = "/10") {
    if (!score) return '';
    const scoreNum = parseInt(score, 10);
    let bgColor = 'bg-gray-400';
    if (scoreNum >= 8) bgColor = 'bg-green-500';
    else if (scoreNum >= 5) bgColor = 'bg-yellow-500';
    else if (scoreNum > 0) bgColor = 'bg-red-500';
    return `<span class="text-white text-xs font-bold px-2 py-1 rounded-full ${bgColor}">${score}${text}</span>`;
}

function renderInfoCard(item, scoreKey = 'score') {
    return `
        <div class="bg-gray-100 dark:bg-slate-700/50 p-3 rounded-lg">
            <div class="flex justify-between items-center">
                <h5 class="font-semibold text-gray-800 dark:text-slate-200">${item.name}</h5>
                ${renderScoreBadge(item[scoreKey])}
            </div>
            <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">${item.description}</p>
        </div>
    `;
}

// --- NEW: MASTER UI RENDERER ---
function renderModuleUI(moduleId, data) {
    let contentHtml = '';
    switch (moduleId) {
        case 'viabilitySnapshot': contentHtml = renderViabilitySnapshot(data); break;
        case 'marketGap': contentHtml = renderMarketGap(data); break;
        case 'whyNow': contentHtml = renderWhyNow(data); break;
        case 'valueLadder': contentHtml = renderValueLadder(data); break;
        case 'valueEquation': contentHtml = renderValueEquation(data); break;
        case 'marketMatrix': contentHtml = renderMarketMatrix(data); break;
        case 'acpFramework': contentHtml = renderAcpFramework(data); break;
        case 'communitySignals': contentHtml = renderCommunitySignals(data); break;
        case 'keywordAnalysis': contentHtml = renderKeywordAnalysis(data); break;
        case 'executionPlan': contentHtml = renderExecutionPlan(data); break;
        default: contentHtml = `<pre class="text-xs"><code>${JSON.stringify(data, null, 2)}</code></pre>`;
    }
    
    return `
        ${contentHtml}
        <div class="mt-4 text-right">
            <button class="regenerate-btn text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md" data-module-id="${moduleId}">
                Re-generate
            </button>
        </div>
    `;
}

function renderViabilitySnapshot(data) {
    if (!data) return '<p>No data available.</p>';
    const items = [
        { name: 'Opportunity', ...data.opportunity },
        { name: 'Problem Severity', ...data.problemSeverity },
        { name: 'Feasibility', ...data.feasibility },
        { name: 'Timing', ...data.timing },
    ];
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${items.map(item => `
                <div class="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold text-gray-800 dark:text-slate-200">${item.name}</h4>
                        ${renderScoreBadge(item.score)}
                    </div>
                    <p class="text-sm text-gray-600 dark:text-slate-400">${item.reasoning}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function renderMarketGap(data) {
    if (!data) return '<p>No data available.</p>';
    return `
        <p class="mb-4 text-gray-700 dark:text-slate-300">${data.summary}</p>
        <div class="space-y-4">
            <div>
                <h4 class="font-bold mb-2 text-gray-800 dark:text-slate-200">Underserved Segments</h4>
                <div class="space-y-2">${(data.underservedSegments || []).map(item => renderInfoCard(item)).join('')}</div>
            </div>
            <div>
                <h4 class="font-bold mb-2 text-gray-800 dark:text-slate-200">Feature Gaps</h4>
                <div class="space-y-2">${(data.featureGaps || []).map(item => renderInfoCard(item)).join('')}</div>
            </div>
            <div>
                <h4 class="font-bold mb-2 text-gray-800 dark:text-slate-200">Integration Opportunities</h4>
                <div class="space-y-2">${(data.integrationOpportunities || []).map(item => renderInfoCard(item)).join('')}</div>
            </div>
        </div>
    `;
}

function renderWhyNow(data) {
    if (!data) return '<p>No data available.</p>';
    return `
        <p class="mb-4 text-gray-700 dark:text-slate-300">${data.summary}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
                <h4 class="font-bold text-gray-800 dark:text-slate-200">Market Factors</h4>
                ${(data.marketFactors || []).map(item => renderInfoCard(item)).join('')}
            </div>
            <div class="space-y-2">
                <h4 class="font-bold text-gray-800 dark:text-slate-200">Tech Enablers</h4>
                ${(data.techEnablers || []).map(item => renderInfoCard(item)).join('')}
            </div>
            <div class="space-y-2 col-span-full">
                <h4 class="font-bold text-red-500 dark:text-red-400">Timing Risks</h4>
                ${(data.timingRisks || []).map(item => renderInfoCard(item)).join('')}
            </div>
        </div>
    `;
}

function renderValueLadder(data) {
    if (!data) return '<p>No data available.</p>';
    const ladder = [
        { tier: 'Lead Magnet', ...data.leadMagnet },
        { tier: 'Frontend Offer', ...data.frontendOffer },
        { tier: 'Core Offer', ...data.coreOffer },
        { tier: 'Continuity Program', ...data.continuityProgram },
        { tier: 'Backend Offer', ...data.backendOffer },
    ];

    return `
        <div class="space-y-4">
            ${ladder.map(item => `
                <div class="bg-gray-100 dark:bg-slate-700/50 p-4 rounded-lg border-l-4 border-indigo-500">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">${item.tier}</p>
                            <h4 class="text-lg font-bold text-gray-800 dark:text-slate-200">${item.name}</h4>
                        </div>
                        <span class="font-semibold text-indigo-600 dark:text-sky-400">${item.price}</span>
                    </div>
                    <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="font-semibold text-gray-700 dark:text-slate-300">Value Provided:</p>
                            <p class="text-gray-600 dark:text-slate-400">${item.valueProvided}</p>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-700 dark:text-slate-300">Goal:</p>
                            <p class="text-gray-600 dark:text-slate-400">${item.goal}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderExecutionPlan(data) {
    if (!data) return '<p>No data available.</p>';

    const renderSidebar = (sidebar) => {
        if (!sidebar) return '';
        return `
            <div class="space-y-4 p-4 bg-gray-100 dark:bg-slate-900/50 rounded-lg">
                <div>
                    <h5 class="font-bold text-gray-800 dark:text-slate-200">Success Metrics</h5>
                    <ul class="list-disc list-inside text-sm text-gray-600 dark:text-slate-400 mt-1">
                        <li>Churn Rate: <strong>${sidebar.successMetrics?.churnRate || 'N/A'}</strong></li>
                        <li>Pilot Conversion: <strong>${sidebar.successMetrics?.pilotConversion || 'N/A'}</strong></li>
                    </ul>
                </div>
                <div>
                    <h5 class="font-bold text-gray-800 dark:text-slate-200">Resource Requirements</h5>
                    <ul class="list-disc list-inside text-sm text-gray-600 dark:text-slate-400 mt-1">
                        <li>Budget: <strong>${sidebar.resourceRequirements?.budget || 'N/A'}</strong></li>
                        <li>Team: <strong>${sidebar.resourceRequirements?.team || 'N/A'}</strong></li>
                    </ul>
                </div>
                <div>
                    <h5 class="font-bold text-gray-800 dark:text-slate-200">Risk Assessment</h5>
                    <ul class="list-disc list-inside text-sm text-gray-600 dark:text-slate-400 mt-1">
                        ${Object.entries(sidebar.riskAssessment || {}).map(([risk, desc]) => `<li><strong>${risk}:</strong> ${desc}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    };

    const renderPart = (partData, partTitle) => {
        if (!partData) return '';
        return `
            <div class="mt-6">
                <h4 class="text-lg font-bold text-indigo-600 dark:text-sky-400 border-b border-gray-300 dark:border-slate-600 pb-1 mb-3">${partTitle}</h4>
                <div class="space-y-3 text-sm">
                    ${partData.businessType ? `<div><strong class="text-gray-700 dark:text-slate-300">Business Type:</strong> <span class="text-gray-600 dark:text-slate-400">${partData.businessType}</span></div>` : ''}
                    ${partData.marketPosition ? `<div><strong class="text-gray-700 dark:text-slate-300">Market Position:</strong> <span class="text-gray-600 dark:text-slate-400">${partData.marketPosition}</span></div>` : ''}
                    ${partData.targetAudience ? `<div><strong class="text-gray-700 dark:text-slate-300">Target Audience:</strong> <ul class="list-disc list-inside pl-4 text-gray-600 dark:text-slate-400">${partData.targetAudience.map(p => `<li>${p}</li>`).join('')}</ul></div>` : ''}
                    ${partData.keyCompetitors ? `<div><strong class="text-gray-700 dark:text-slate-300">Key Competitors:</strong> <ul class="list-disc list-inside pl-4 text-gray-600 dark:text-slate-400">${partData.keyCompetitors.map(c => `<li>${c}</li>`).join('')}</ul></div>` : ''}
                </div>
            </div>
        `;
    };
    
    const renderPhase = (phaseData) => {
        if (!phaseData) return '';
        return `
            <div class="mt-6">
                <h4 class="text-lg font-bold text-indigo-600 dark:text-sky-400 border-b border-gray-300 dark:border-slate-600 pb-1 mb-3">${phaseData.title}</h4>
                ${phaseData.coreStrategy ? `
                    <div class="p-3 bg-gray-100 dark:bg-slate-700/50 rounded-md">
                        <strong class="text-gray-700 dark:text-slate-300">Core Strategy:</strong>
                        <p class="text-sm text-gray-600 dark:text-slate-400 pl-2">${phaseData.coreStrategy.mvpApproach}</p>
                        <p class="text-sm text-gray-600 dark:text-slate-400 pl-2 mt-1"><strong>Initial Offer:</strong> ${phaseData.coreStrategy.initialOffer.name} (${phaseData.coreStrategy.initialOffer.price})</p>
                    </div>
                ` : ''}
                ${phaseData.leadGenerationStrategy ? `
                    <div class="mt-3 p-3 bg-gray-100 dark:bg-slate-700/50 rounded-md">
                        <strong class="text-gray-700 dark:text-slate-300">Lead Generation:</strong>
                        <ul class="list-none space-y-2 mt-2 text-sm">${(phaseData.leadGenerationStrategy.acquisitionChannels || []).map(ch => `
                            <li>
                                <p class="font-semibold text-gray-600 dark:text-slate-400">${ch.channel}</p>
                                <p class="text-xs text-gray-500 dark:text-slate-500 pl-2">${ch.tactic} (Metric: ${ch.metric})</p>
                            </li>
                        `).join('')}</ul>
                    </div>
                ` : ''}
                ${phaseData.goal ? `<p class="text-sm text-gray-600 dark:text-slate-400"><strong>Goal:</strong> ${phaseData.goal}</p>`: ''}
                ${phaseData.strategicFocus ? `<p class="text-sm text-gray-600 dark:text-slate-400"><strong>Strategic Focus:</strong> ${phaseData.strategicFocus.join(', ')}</p>`: ''}
            </div>
        `;
    };

    const renderImplementation = (implData) => {
        if (!implData) return '';
        return `
             <div class="mt-6">
                <h4 class="text-lg font-bold text-indigo-600 dark:text-sky-400 border-b border-gray-300 dark:border-slate-600 pb-1 mb-3">${implData.title}</h4>
                <ol class="list-decimal list-inside text-sm text-gray-600 dark:text-slate-400 space-y-1">
                    ${(implData.steps || []).map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
        `;
    }

    return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
                ${renderPart(data.part1_BusinessModel, 'Part 1: Business Model & Market')}
                ${renderPhase(data.part2_Phase1_Roadmap)}
                ${renderPhase(data.part3_GrowthStrategy)}
                ${renderImplementation(data.part4_ImplementationPlan)}
            </div>
            <div class="lg:col-span-1">
                ${renderSidebar(data.sidebarAnalysis)}
            </div>
        </div>
    `;
}

function renderModuleCard(module, idea) {
    const ideaSlug = getIdeaSlug(idea.title);
    const cacheKey = `deep_analysis_v3_${module.id}_${ideaSlug}`; // Incremented cache version
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
            contentHTML = renderModuleUI(module.id, data); // Use the new master renderer
            const score = data.overallScore || data.uniquenessScore || (data.mainKeyword && '✓') || null;
            summaryScoreHTML = `<span class="score-badge">${score ? (typeof score === 'string' ? score : `${score}/10`) : '✓'}</span>`;
        } catch (e) {
            contentHTML = `<p class="text-red-500 text-sm">Error parsing cache: ${e.message}</p>`;
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

async function runSingleAnalysis(idea, module) {
    const card = document.getElementById(`card-${module.id}`);
    if (!card || card.querySelector('.regenerate-btn')) {
        return;
    }
    
    const ideaSlug = getIdeaSlug(idea.title);
    const cacheKey = `deep_analysis_v3_${module.id}_${ideaSlug}`;

    try {
        const prompt = createAdvancedAnalysisPrompt(idea, module.id);
        const result = await getAiAnalysis(prompt, 'groq', 'llama-3.1-8b-instant');
        if (!result.success) throw new Error(result.error);
        
        const analysisData = JSON.parse(result.text);
        localStorage.setItem(cacheKey, JSON.stringify(analysisData));

        card.querySelector('.p-5').innerHTML = renderModuleUI(module.id, analysisData);
        
        const score = analysisData.overallScore || analysisData.uniquenessScore || (analysisData.mainKeyword && '✓') || null;
        const scoreBadge = card.querySelector('.score-badge');
        if (scoreBadge) {
             scoreBadge.textContent = score ? (typeof score === 'string' ? score : `${score}/10`) : '✓';
        }
    } catch (error) {
        const contentContainer = card.querySelector('.p-5');
        if (contentContainer) {
            contentContainer.innerHTML = `<p class="text-red-500 text-sm">Error: ${error.message}</p>`;
        }
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