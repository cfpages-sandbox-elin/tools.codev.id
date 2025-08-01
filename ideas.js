// ideas.js v2.02 (Refactored)
import { initBrainstormTab } from './ideas-brainstorm.js';
import { initPlanTab } from './ideas-plan.js';
import { initStealTab } from './ideas-steal.js';
import { initDeepAnalysis } from './ideas-deep.js';
import { updateState, getState } from './ideas-state.js';
import { getProviderConfig } from './ideas-api.js';
import { cacheElements, initApiKeyUI, showError } from './ideas-ui.js';

export function extractAndParseJson(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }
    try {
        const firstBracket = text.indexOf('[');
        const firstBrace = text.indexOf('{');
        let startIndex = -1;
        if (firstBracket === -1 && firstBrace === -1) return [];
        if (firstBracket === -1) startIndex = firstBrace;
        else if (firstBrace === -1) startIndex = firstBracket;
        else startIndex = Math.min(firstBracket, firstBrace);

        const lastBracket = text.lastIndexOf(']');
        const lastBrace = text.lastIndexOf('}');
        const endIndex = Math.max(lastBracket, lastBrace);

        if (startIndex === -1 || endIndex === -1) return [];

        const jsonString = text.substring(startIndex, endIndex + 1);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to parse the extracted JSON:", error.message);
        console.error("Raw text (truncated):", text.substring(0, 500));
        return [];
    }
}

function handleTabClick(event) {
    const clickedButton = event.currentTarget;
    const targetTab = clickedButton.dataset.tab;

    const tabButtons = document.querySelectorAll('#main-tabs .tab-btn');
    const tabContents = document.querySelectorAll('main > div.tab-content');

    tabButtons.forEach(btn => {
        btn.classList.remove('border-indigo-500', 'text-indigo-600');
        btn.classList.add('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700', 'dark:text-slate-400', 'dark:hover:border-slate-500', 'dark:hover:text-slate-300');
        btn.removeAttribute('aria-current');
    });
    clickedButton.classList.add('border-indigo-500', 'text-indigo-600');
    clickedButton.classList.remove('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700');
    clickedButton.setAttribute('aria-current', 'page');

    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    const targetContent = document.getElementById(`${targetTab}-content`);
    if (targetContent) targetContent.classList.remove('hidden');

    updateState({ activeTab: targetTab });

    if (targetTab === 'plan' && !getState().planTabInitialized) {
        initPlanTab();
        updateState({ planTabInitialized: true });
    } else if (targetTab === 'steal' && !getState().stealTabInitialized) {
        initStealTab();
        updateState({ stealTabInitialized: true });
    } else if (targetTab === 'deep-analysis') {
        initDeepAnalysis(getState().activeDeepAnalysisIdea);
    }
}

function init() {
    cacheElements();
    initApiKeyUI();

    const savedSupadataKey = localStorage.getItem('supadataApiKey');
    const savedRapidapiKey = localStorage.getItem('rapidapiApiKey');
    updateState({ supadataApiKey: savedSupadataKey, rapidapiApiKey: savedRapidapiKey });
    
    getProviderConfig()
        .then(providers => updateState({ allAiProviders: providers }))
        .catch(err => showError(err.message));

    document.querySelectorAll('#main-tabs .tab-btn').forEach(button => {
        button.addEventListener('click', handleTabClick);
    });

    document.getElementById('supadata-api-key').addEventListener('input', (e) => {
        const key = e.target.value.trim();
        updateState({ supadataApiKey: key || null });
        localStorage.setItem('supadataApiKey', key);
        document.getElementById('supadata-api-key-status-icon').textContent = key ? '✅' : '⚠️';
    });
    
    document.getElementById('rapidapi-api-key').addEventListener('input', (e) => {
        const key = e.target.value.trim();
        updateState({ rapidapiApiKey: key || null });
        localStorage.setItem('rapidapiApiKey', key);
        document.getElementById('rapidapi-api-key-status-icon').textContent = key ? '✅' : '⚠️';
    });

    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('deep-analyze-btn')) {
            const idea = JSON.parse(e.target.dataset.idea);
            updateState({ activeDeepAnalysisIdea: idea });
            const deepAnalysisButton = document.querySelector('button[data-tab="deep-analysis"]');
            if (deepAnalysisButton) {
                handleTabClick({ currentTarget: deepAnalysisButton });
            }
        }
    });

    // Initialize the default tab
    initBrainstormTab();
}

document.addEventListener('DOMContentLoaded', init);