import { updateState, getState } from './ideas-state.js';
import { getProviderConfig, getTranscript, getAiAnalysis } from './ideas-api.js';
import { cacheElements, initApiKeyUI, showError, toggleLoader, resetOutput, renderTranscriptUI, renderAnalysisUI, updateModelDropdownUI, updateTokenInfoUI } from './ideas-ui.js';
import { createComprehensiveAnalysisPrompt, createMoreIdeasPrompt } from './ideas-prompts.js';
import { getYouTubeVideoId } from './ideas-helpers.js';

// --- Event Handlers (must be exportable to be used in UI module) ---

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

    // Define the providers to try, in order of preference
    const providersToTry = [];
    if (supadataApiKey) providersToTry.push('supadata');
    if (rapidapiApiKey) providersToTry.push('rapidapi');
    
    let transcriptData = null;
    let lastError = null;

    for (const provider of providersToTry) {
        try {
            console.log(`Attempting to fetch transcript with [${provider}]...`);
            const cacheKey = `transcript_${provider}_${videoId}`;
            const cachedTranscript = localStorage.getItem(cacheKey);

            if (cachedTranscript) {
                console.log(`Loading transcript for [${videoId}] from [${provider}] cache.`);
                transcriptData = JSON.parse(cachedTranscript);
            } else {
                transcriptData = await getTranscript(provider, url, videoId);
                localStorage.setItem(cacheKey, JSON.stringify(transcriptData));
            }

            // If we succeed, break the loop
            if (transcriptData) {
                console.log(`Successfully fetched transcript using [${provider}].`);
                break;
            }
        } catch (error) {
            console.warn(`Failed to fetch transcript with [${provider}]:`, error.message);
            lastError = error;
            // Continue to the next provider
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

function extractAndParseJson(text) {
    // Find the first opening curly brace, marking the start of the JSON
    const startIndex = text.indexOf('{');
    // Find the last closing curly brace, marking the potential end of the JSON
    const endIndex = text.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error("Could not find a valid JSON object structure in the AI's response.");
    }

    // Extract the substring that is most likely the JSON content
    const jsonString = text.substring(startIndex, endIndex + 1);

    try {
        // Attempt to parse this potentially "dirty" JSON string
        return JSON.parse(jsonString);
    } catch (error) {
        // If parsing fails, throw a more informative error for debugging
        throw new Error(`Failed to parse the extracted JSON. Error: ${error.message}`);
    }
}

async function handleAnalyzeTranscript() {
    const analyzeBtn = document.getElementById('analyze-transcript-btn');
    const aiSelectionContainer = document.getElementById('ai-selection-container');
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
            console.log(`Loading V3 analysis for [${currentVideoId}] from cache.`);
            analysis = JSON.parse(cachedAnalysis);
        } else {
            console.log(`Performing comprehensive analysis for [${currentVideoId}]...`);
            const prompt = createComprehensiveAnalysisPrompt(currentTranscript.fullText);
            const result = await getAiAnalysis(prompt, provider, model);

            if (!result.success) {
                throw new Error(result.error || `API returned success:false`);
            }
            
            analysis = extractAndParseJson(result.text);
            localStorage.setItem(cacheKey, JSON.stringify(analysis));
            console.log(`V3 analysis for [${currentVideoId}] saved to cache.`);
        }

        if (aiSelectionContainer) {
            aiSelectionContainer.remove(); 
        }

        renderAnalysisUI(analysis);
        attachTranscriptUIListeners(); // This will now attach listeners to the NEW controls.
        
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
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = 'Generating...';

    const { currentVideoId } = getState();
    const analysisCacheKey = `analysis_${currentVideoId}`;
    const cachedAnalysis = JSON.parse(localStorage.getItem(analysisCacheKey) || '{}');
    const existingIdeas = cachedAnalysis.insights?.filter(i => i.category === 'Product Idea') || [];

    // Use a default planning model for this creative task
    const provider = 'google';
    const model = 'gemini-2.5-pro';

    try {
        const prompt = createMoreIdeasPrompt(existingIdeas);
        const result = await getAiAnalysis(prompt, provider, model);

        if (result.success) {
            const newIdeas = JSON.parse(result.text); // The prompt asks for a direct array
            
            // Merge new ideas with existing analysis
            cachedAnalysis.insights.push(...newIdeas);
            
            // Save the updated analysis back to the cache
            localStorage.setItem(analysisCacheKey, JSON.stringify(cachedAnalysis));
            
            // Re-render the UI to show everything
            renderAnalysisUI(cachedAnalysis);
            attachTranscriptUIListeners(); // Re-attach listeners as the DOM was rebuilt

        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        showError(`Failed to generate more ideas: ${error.message}`);
    } finally {
        // The button will be re-rendered, so no need to re-enable it here.
    }
}

async function handleReanalyze() {
    const btn = document.getElementById('reanalyze-btn');
    if (!btn) return;
    
    // Get the currently selected provider and model from the UI
    const provider = document.getElementById('ai-provider-select').value;
    const model = document.getElementById('ai-model-select').value;
    const { currentTranscript, currentVideoId } = getState();

    if (!currentTranscript || !currentVideoId) {
        showError("Cannot re-analyze: missing transcript or video ID.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Re-analyzing... <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>';
    
    try {
        console.log(`Re-analyzing [${currentVideoId}] with ${provider}/${model}...`);
        const prompt = createComprehensiveAnalysisPrompt(currentTranscript.fullText);
        const result = await getAiAnalysis(prompt, provider, model);

        if (!result.success) {
            throw new Error(`Re-analysis failed: ${result.error}`);
        }
        
        const newAnalysis = extractAndParseJson(result.text);

        // Overwrite the existing cache with the new analysis data
        const cacheKey = `analysis_v3_${currentVideoId}`;
        localStorage.setItem(cacheKey, JSON.stringify(newAnalysis));
        console.log(`Cache for [${currentVideoId}] overwritten with new analysis.`);
        
        // Re-render the entire UI with the new data
        renderAnalysisUI(newAnalysis);
        // CRITICAL: Re-attach all listeners because the DOM was just rebuilt
        attachTranscriptUIListeners();

    } catch (error) {
        showError(error.message);
        // On error, re-enable the button so the user can try again
        btn.disabled = false;
        btn.innerHTML = 'Re-analyze with Selected Model';
    }
}

function attachTranscriptUIListeners() {
    const analyzeBtn = document.getElementById('analyze-transcript-btn');
    const providerSelect = document.getElementById('ai-provider-select');
    const modelSelect = document.getElementById('ai-model-select');
    const moreIdeasBtn = document.getElementById('generate-more-ideas-btn');
    const reanalyzeBtn = document.getElementById('reanalyze-btn'); // Get the new button
    
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', handleAnalyzeTranscript);
    }
    if (providerSelect) {
        providerSelect.addEventListener('change', updateModelDropdownUI);
    }
    if (modelSelect) {
        modelSelect.addEventListener('change', updateTokenInfoUI);
    }
    if (moreIdeasBtn) {
        moreIdeasBtn.addEventListener('click', handleGenerateMoreIdeas);
    }
    if (reanalyzeBtn) {
        reanalyzeBtn.addEventListener('click', handleReanalyze);
    }
}

function init() {
    cacheElements();
    initApiKeyUI();

    // Load initial state
    const savedSupadataKey = localStorage.getItem('supadataApiKey');
    const savedRapidapiKey = localStorage.getItem('rapidapiApiKey');
    updateState({ supadataApiKey: savedSupadataKey, rapidapiApiKey: savedRapidapiKey });
    
    // Asynchronously load AI provider config
    getProviderConfig()
        .then(providers => updateState({ allAiProviders: providers }))
        .catch(err => showError(err.message));

    // Attach main event listeners
    document.getElementById('analyze-btn').addEventListener('click', handleFetchTranscript);
    document.getElementById('url-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleFetchTranscript();
    });
    document.getElementById('supadata-api-key').addEventListener('input', (e) => {
        const key = e.target.value.trim();
        updateState({ supadataApiKey: key || null });
        localStorage.setItem('supadataApiKey', key);
        document.getElementById('supadata-api-key-status-icon').textContent = key ? '✅' : '⚠️';
    });
    
    // Add listener for the new RapidAPI key input
    document.getElementById('rapidapi-api-key').addEventListener('input', (e) => {
        const key = e.target.value.trim();
        updateState({ rapidapiApiKey: key || null });
        localStorage.setItem('rapidapiApiKey', key);
        document.getElementById('rapidapi-api-key-status-icon').textContent = key ? '✅' : '⚠️';
    });
}

// --- Entry Point ---
document.addEventListener('DOMContentLoaded', init);