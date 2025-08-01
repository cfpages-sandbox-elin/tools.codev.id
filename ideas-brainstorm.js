// ideas-brainstorm.js (NEW FILE)
import { updateState, getState } from './ideas-state.js';
import { getTranscript, getAiAnalysis } from './ideas-api.js';
import { showError, toggleLoader, resetOutput, renderTranscriptUI, renderAnalysisUI, updateModelDropdownUI, updateTokenInfoUI, populateMoreIdeasProviderDropdown, updateMoreIdeasModelDropdown } from './ideas-ui.js';
import { createComprehensiveAnalysisPrompt, createMoreIdeasPrompt, createResummarizePrompt } from './ideas-prompts.js';
import { getYouTubeVideoId } from './ideas-helpers.js';
import { extractAndParseJson } from './ideas.js'; // Import from the main ideas.js

// --- Event Handlers ---
function handleUrlInput() {
    const url = document.getElementById('url-input').value;
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return;

    const analysisCacheKey = `analysis_v3_${videoId}`;
    const cachedAnalysisJSON = localStorage.getItem(analysisCacheKey);

    if (cachedAnalysisJSON) {
        let cachedTranscriptJSON = localStorage.getItem(`transcript_supadata_${videoId}`) || localStorage.getItem(`transcript_rapidapi_${videoId}`);
        if (cachedTranscriptJSON) {
            try {
                const analysisData = JSON.parse(cachedAnalysisJSON);
                const transcriptData = JSON.parse(cachedTranscriptJSON);
                displayFullAnalysis(transcriptData, analysisData);
            } catch (e) {
                console.error("Failed to parse cached data.", e);
                localStorage.removeItem(analysisCacheKey);
            }
        }
    }
}

async function handleFetchTranscript() {
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim();
    if (!url) { showError("Please enter a URL."); return; }
    
    const videoId = getYouTubeVideoId(url);
    if (!videoId) { showError("Could not find a valid YouTube Video ID."); return; }

    const { supadataApiKey, rapidapiApiKey } = getState();
    if (!supadataApiKey && !rapidapiApiKey) {
        showError("Please enter at least one API Key (Supadata or RapidAPI).");
        return;
    }

    resetOutput();
    toggleLoader(true);
    updateState({ isLoading: true });

    const providersToTry = [];
    if (supadataApiKey) providersToTry.push('supadata');
    if (rapidapiApiKey) providersToTry.push('rapidapi');
    
    let transcriptData = null;
    let lastError = null;

    for (const provider of providersToTry) {
        try {
            const cacheKey = `transcript_${provider}_${videoId}`;
            const cachedTranscript = localStorage.getItem(cacheKey);

            if (cachedTranscript) {
                transcriptData = JSON.parse(cachedTranscript);
            } else {
                transcriptData = await getTranscript(provider, url, videoId);
                localStorage.setItem(cacheKey, JSON.stringify(transcriptData));
            }

            if (transcriptData) break;
        } catch (error) {
            lastError = error;
        }
    }

    toggleLoader(false);
    updateState({ isLoading: false });
    
    if (transcriptData) {
        updateState({ currentTranscript: transcriptData, currentVideoId: videoId });
        renderTranscriptUI(transcriptData);
        attachTranscriptUIListeners();
    } else {
        showError(`All transcript providers failed. Last error: ${lastError.message}`);
    }
}

async function handleAnalyzeTranscript() {
    const analyzeBtn = document.getElementById('analyze-transcript-btn');
    const provider = document.getElementById('ai-provider-select').value;
    const model = document.getElementById('ai-model-select').value;
    const { currentTranscript, currentVideoId } = getState();

    if (!currentTranscript || !currentVideoId) {
        showError("No transcript available or video ID is missing.");
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = 'Analyzing... <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>';
    updateState({ isLoading: true });

    try {
        const cacheKey = `analysis_v3_${currentVideoId}`;
        const cachedAnalysis = localStorage.getItem(cacheKey);

        let analysis;
        if (cachedAnalysis) {
            analysis = JSON.parse(cachedAnalysis);
        } else {
            const prompt = createComprehensiveAnalysisPrompt(currentTranscript);
            const result = await getAiAnalysis(prompt, provider, model);
            if (!result.success) throw new Error(result.error || `API returned success:false`);
            analysis = extractAndParseJson(result.text);
            localStorage.setItem(cacheKey, JSON.stringify(analysis));
        }
        displayFullAnalysis(getState().currentTranscript, analysis);
    } catch (error) {
        showError(error.message);
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = 'Analyze Transcript';
        }
    } finally {
        updateState({ isLoading: false });
    }
}

async function handleGenerateMoreIdeas() {
    const btn = document.getElementById('generate-more-ideas-btn');
    const provider = document.getElementById('more-ideas-provider-select').value;
    const model = document.getElementById('more-ideas-model-select').value;
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = 'Generating... <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>';

    const { currentVideoId } = getState();
    const analysisCacheKey = `analysis_v3_${currentVideoId}`;
    const cachedAnalysis = JSON.parse(localStorage.getItem(analysisCacheKey) || '{}');
    const existingIdeas = cachedAnalysis.insights?.filter(i => i.category === 'Product Idea') || [];

    try {
        const prompt = createMoreIdeasPrompt(existingIdeas);
        const result = await getAiAnalysis(prompt, provider, model);

        if (result.success) {
            const newIdeas = extractAndParseJson(result.text);
            if (!Array.isArray(newIdeas) || newIdeas.length === 0) {
                showError("The AI didn't generate any new ideas in the correct format.");
                btn.disabled = false;
                btn.innerHTML = 'Generate with Selected Model ✨';
                return;
            }
            cachedAnalysis.insights = [...(cachedAnalysis.insights || []), ...newIdeas];
            localStorage.setItem(analysisCacheKey, JSON.stringify(cachedAnalysis));
            renderAnalysisUI(cachedAnalysis);
            attachTranscriptUIListeners();
        } else {
            throw new Error(result.error || "The AI failed to generate new ideas.");
        }
    } catch (error) {
        showError(`Failed to generate more ideas: ${error.message}`);
        btn.disabled = false;
        btn.innerHTML = 'Generate with Selected Model ✨';
    }
}

async function handleReanalyze() {
    const btn = document.getElementById('reanalyze-btn');
    const provider = document.getElementById('ai-provider-select').value;
    const model = document.getElementById('ai-model-select').value;
    const { currentTranscript, currentVideoId } = getState();
    if (!btn || !currentTranscript || !currentVideoId) return;

    btn.disabled = true;
    btn.innerHTML = 'Re-analyzing... <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>';
    
    try {
        const prompt = createComprehensiveAnalysisPrompt(currentTranscript);
        const result = await getAiAnalysis(prompt, provider, model);
        if (!result.success) throw new Error(result.error);
        
        const newAnalysis = extractAndParseJson(result.text);
        const cacheKey = `analysis_v3_${currentVideoId}`;
        localStorage.setItem(cacheKey, JSON.stringify(newAnalysis));
        
        renderAnalysisUI(newAnalysis);
        attachTranscriptUIListeners();
    } catch (error) {
        showError(error.message);
        btn.disabled = false;
        btn.innerHTML = 'Re-analyze with Selected Model';
    }
}

async function handleResummarize() {
    const btn = document.getElementById('resummarize-btn');
    const { currentTranscript, currentVideoId } = getState();
    if (!btn || !currentTranscript) return;
    
    btn.disabled = true;
    btn.innerHTML = 'Summarizing...';

    const provider = document.getElementById('resummarize-provider-select').value;
    const model = document.getElementById('resummarize-model-select').value;

    try {
        const prompt = createResummarizePrompt(currentTranscript);
        const result = await getAiAnalysis(prompt, provider, model);
        if (!result.success) throw new Error(result.error);
        
        const newSummaryData = extractAndParseJson(result.text);
        const analysisCacheKey = `analysis_v3_${currentVideoId}`;
        const fullAnalysis = JSON.parse(localStorage.getItem(analysisCacheKey) || '{}');
        fullAnalysis.summary = newSummaryData.summary;
        localStorage.setItem(analysisCacheKey, JSON.stringify(fullAnalysis));
        
        renderAnalysisUI(fullAnalysis); // Re-render the whole thing to ensure listeners are consistent
        attachTranscriptUIListeners();
    } catch (error) {
        showError(error.message);
    }
}

function attachTranscriptUIListeners() {
    const analyzeBtn = document.getElementById('analyze-transcript-btn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', handleAnalyzeTranscript);
    
    const reanalyzeBtn = document.getElementById('reanalyze-btn');
    if (reanalyzeBtn) reanalyzeBtn.addEventListener('click', handleReanalyze);
    
    const providerSelect = document.getElementById('ai-provider-select');
    if (providerSelect) providerSelect.addEventListener('change', updateModelDropdownUI);
    
    const modelSelect = document.getElementById('ai-model-select');
    if (modelSelect) modelSelect.addEventListener('change', updateTokenInfoUI);
    
    const moreIdeasBtn = document.getElementById('generate-more-ideas-btn');
    if (moreIdeasBtn) moreIdeasBtn.addEventListener('click', handleGenerateMoreIdeas);
    
    const moreIdeasProviderSelect = document.getElementById('more-ideas-provider-select');
    if (moreIdeasProviderSelect) {
        populateMoreIdeasProviderDropdown();
        moreIdeasProviderSelect.addEventListener('change', updateMoreIdeasModelDropdown);
    }

    const resummarizeBtn = document.getElementById('resummarize-btn');
    if (resummarizeBtn) resummarizeBtn.addEventListener('click', handleResummarize);
}

function displayFullAnalysis(transcriptData, analysisData) {
    const videoId = getYouTubeVideoId(document.getElementById('url-input').value);
    updateState({ currentTranscript: transcriptData, currentVideoId: videoId, isLoading: false });
    resetOutput();
    toggleLoader(false);
    renderTranscriptUI(transcriptData);
    const aiSelectionContainer = document.getElementById('ai-selection-container');
    if (aiSelectionContainer) aiSelectionContainer.remove();
    renderAnalysisUI(analysisData);
    attachTranscriptUIListeners();
}

export function initBrainstormTab() {
    document.getElementById('analyze-btn').addEventListener('click', handleFetchTranscript);
    document.getElementById('url-input').addEventListener('input', handleUrlInput);
    document.getElementById('url-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleFetchTranscript();
    });
}