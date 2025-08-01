// ideas.js v2.01 better json parser
import { initPlanTab } from './ideas-plan.js';
import { initStealTab } from './ideas-steal.js';
import { initDeepAnalysis } from './ideas-deep.js';
import { updateState, getState } from './ideas-state.js';
import { getProviderConfig, getTranscript, getAiAnalysis } from './ideas-api.js';
import { cacheElements, initApiKeyUI, showError, toggleLoader, resetOutput, renderTranscriptUI, renderAnalysisUI, updateModelDropdownUI, updateTokenInfoUI, populateMoreIdeasProviderDropdown, updateMoreIdeasModelDropdown } from './ideas-ui.js';
import { createComprehensiveAnalysisPrompt, createMoreIdeasPrompt, createResummarizePrompt } from './ideas-prompts.js';
import { getYouTubeVideoId } from './ideas-helpers.js';

// --- Event Handlers (must be exportable to be used in UI module) ---
function handleUrlInput() {
    const url = document.getElementById('url-input').value;
    const videoId = getYouTubeVideoId(url);

    if (!videoId) {
        // If the URL is invalid or cleared, do nothing.
        return;
    }

    // 1. Check for the final product: the analysis cache.
    const analysisCacheKey = `analysis_v3_${videoId}`;
    const cachedAnalysisJSON = localStorage.getItem(analysisCacheKey);

    if (cachedAnalysisJSON) {
        // 2. If analysis exists, we also need the transcript. Check both potential sources.
        let cachedTranscriptJSON = localStorage.getItem(`transcript_supadata_${videoId}`);
        if (!cachedTranscriptJSON) {
            cachedTranscriptJSON = localStorage.getItem(`transcript_rapidapi_${videoId}`);
        }

        // 3. If both caches exist, we can display the results immediately.
        if (cachedTranscriptJSON) {
            try {
                const analysisData = JSON.parse(cachedAnalysisJSON);
                const transcriptData = JSON.parse(cachedTranscriptJSON);
                displayFullAnalysis(transcriptData, analysisData);
            } catch (e) {
                console.error("Failed to parse cached data. It might be corrupted.", e);
                // Clear the corrupted cache to prevent this from happening again.
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

export function extractAndParseJson(text) {
    if (!text || typeof text !== 'string') {
        console.warn("extractAndParseJson received a non-string or empty input.");
        return [];
    }

    try {
        // Find the start of a JSON object '{' or array '['
        const firstBracket = text.indexOf('[');
        const firstBrace = text.indexOf('{');
        
        let startIndex = -1;

        if (firstBracket === -1 && firstBrace === -1) {
            // No JSON structure found at all
            console.warn("No JSON start character '[' or '{' found in the response.");
            return [];
        }

        if (firstBracket === -1) startIndex = firstBrace;
        else if (firstBrace === -1) startIndex = firstBracket;
        else startIndex = Math.min(firstBracket, firstBrace);

        // Find the end of the JSON object '}' or array ']'
        const lastBracket = text.lastIndexOf(']');
        const lastBrace = text.lastIndexOf('}');
        const endIndex = Math.max(lastBracket, lastBrace);

        if (startIndex === -1 || endIndex === -1) {
             console.warn("Could not find a valid JSON start/end pair.");
             return [];
        }

        // Slice the string to get only the potential JSON part
        const jsonString = text.substring(startIndex, endIndex + 1);

        // Try to parse the extracted string
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to parse the extracted JSON. Error:", error.message);
        // Log the problematic text for debugging, but truncate it to keep the console clean
        console.error("Raw text (truncated):", text.substring(0, 500)); 
        return []; // Return an empty array on failure instead of throwing an error
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
            const prompt = createComprehensiveAnalysisPrompt(currentTranscript);
            const result = await getAiAnalysis(prompt, provider, model);

            if (!result.success) {
                throw new Error(result.error || `API returned success:false`);
            }
            
            analysis = extractAndParseJson(result.text);
            localStorage.setItem(cacheKey, JSON.stringify(analysis));
            console.log(`V3 analysis for [${currentVideoId}] saved to cache.`);
        }

        displayFullAnalysis(getState().currentTranscript, analysis);

    } catch (error) {
        showError(error.message);
        
        const analyzeBtn = document.getElementById('analyze-transcript-btn');
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
    const providerSelect = document.getElementById('more-ideas-provider-select');
    const modelSelect = document.getElementById('more-ideas-model-select');
    
    if (!btn || !providerSelect || !modelSelect) {
        showError("Could not find the 'Generate More Ideas' controls.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Generating... <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>';

    const { currentVideoId } = getState();
    const analysisCacheKey = `analysis_v3_${currentVideoId}`;
    const cachedAnalysis = JSON.parse(localStorage.getItem(analysisCacheKey) || '{}');
    const existingIdeas = cachedAnalysis.insights?.filter(i => i.category === 'Product Idea') || [];

    const provider = providerSelect.value;
    const model = modelSelect.value;

    try {
        const prompt = createMoreIdeasPrompt(existingIdeas);
        const result = await getAiAnalysis(prompt, provider, model);

        if (result.success) {
            // --- THIS IS THE FIX ---
            // Use our robust extractor instead of a direct parse.
            const newIdeasData = extractAndParseJson(result.text);

            // Safety check: ensure we're working with an array.
            const newIdeas = Array.isArray(newIdeasData) ? newIdeasData : [];
            // --- END OF FIX ---

            if (newIdeas.length === 0) {
                // Let the user know if the AI returned nothing useful
                showError("The AI didn't generate any new ideas in the correct format. Try a different model.");
                 // Re-enable the button so the user can retry
                btn.disabled = false;
                btn.innerHTML = 'Generate with Selected Model ✨';
                return; // Stop execution
            }

            // Merge new ideas with existing analysis
            cachedAnalysis.insights.push(...newIdeas);
            
            // Save the updated analysis back to the cache
            localStorage.setItem(analysisCacheKey, JSON.stringify(cachedAnalysis));
            
            // Re-render the UI to show everything, which also rebuilds the button
            renderAnalysisUI(cachedAnalysis);
            attachTranscriptUIListeners(); // Re-attach all listeners

        } else {
            throw new Error(result.error || "The AI failed to generate new ideas.");
        }

    } catch (error) {
        showError(`Failed to generate more ideas: ${error.message}`);
        // Re-enable the button on failure so the user can retry
        btn.disabled = false;
        btn.innerHTML = 'Generate with Selected Model ✨';
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
        const prompt = createComprehensiveAnalysisPrompt(currentTranscript);
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

async function handleResummarize() {
    const btn = document.getElementById('resummarize-btn');
    if (!btn) return;
    
    const { currentTranscript, currentVideoId } = getState();
    if (!currentTranscript) {
        showError("No transcript available to re-summarize.");
        return;
    }
    
    btn.disabled = true;
    btn.innerHTML = 'Summarizing...';

    // Get the selected model for this action
    const provider = document.getElementById('resummarize-provider-select').value;
    const model = document.getElementById('resummarize-model-select').value;

    try {
        const prompt = createResummarizePrompt(currentTranscript);
        const result = await getAiAnalysis(prompt, provider, model);

        if (!result.success) throw new Error(result.error);
        
        const newSummaryData = extractAndParseJson(result.text);

        // Fetch the existing full analysis from cache
        const analysisCacheKey = `analysis_v3_${currentVideoId}`;
        const fullAnalysis = JSON.parse(localStorage.getItem(analysisCacheKey) || '{}');

        // Replace the old summary with the new one
        fullAnalysis.summary = newSummaryData.summary;

        // Save the updated full analysis back to the cache
        localStorage.setItem(analysisCacheKey, JSON.stringify(fullAnalysis));
        
        // Re-render the summary section specifically
        const summaryContainer = document.getElementById('summary-container');
        if (summaryContainer) {
            summaryContainer.innerHTML = renderSummaryUI(fullAnalysis.summary, currentVideoId);
            attachTranscriptUIListeners(); 
        }
        
    } catch (error) {
        showError(error.message);
    } finally {
        // We no longer need to manually re-enable the button here,
        // because renderSummaryUI() creates a new, enabled button,
        // and attachTranscriptUIListeners() wires it up.
        // The original button is gone.
    }
}

function handleTabClick(event) {
    const clickedButton = event.currentTarget;
    const targetTab = clickedButton.dataset.tab;

    const tabButtons = document.querySelectorAll('#main-tabs .tab-btn');
    const tabContents = document.querySelectorAll('main > div.tab-content');

    // Update button styles
    tabButtons.forEach(btn => {
        btn.classList.remove('border-indigo-500', 'text-indigo-600');
        btn.classList.add('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700', 'dark:text-slate-400', 'dark:hover:border-slate-500', 'dark:hover:text-slate-300');
        btn.removeAttribute('aria-current');
    });
    clickedButton.classList.add('border-indigo-500', 'text-indigo-600');
    clickedButton.classList.remove('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700', 'dark:text-slate-400', 'dark:hover:border-slate-500', 'dark:hover:text-slate-300');
    clickedButton.setAttribute('aria-current', 'page');

    // Show/hide content panes
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    const targetContent = document.getElementById(`${targetTab}-content`);
    if(targetContent) targetContent.classList.remove('hidden');

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

function attachTranscriptUIListeners() {
    // --- Main analysis controls ---
    const analyzeBtn = document.getElementById('analyze-transcript-btn');
    const reanalyzeBtn = document.getElementById('reanalyze-btn');
    const providerSelect = document.getElementById('ai-provider-select');
    const modelSelect = document.getElementById('ai-model-select');
    
    if (analyzeBtn) analyzeBtn.addEventListener('click', handleAnalyzeTranscript);
    if (reanalyzeBtn) reanalyzeBtn.addEventListener('click', handleReanalyze);
    if (providerSelect) providerSelect.addEventListener('change', updateModelDropdownUI);
    if (modelSelect) modelSelect.addEventListener('change', updateTokenInfoUI);
    
    // --- "Generate More Ideas" controls ---
    const moreIdeasBtn = document.getElementById('generate-more-ideas-btn');
    const moreIdeasProviderSelect = document.getElementById('more-ideas-provider-select');
    const resummarizeBtn = document.getElementById('resummarize-btn');
    const resummarizeProviderSelect = document.getElementById('resummarize-provider-select');
    
    if (resummarizeBtn) {
        resummarizeBtn.addEventListener('click', handleResummarize);
    }

    if (resummarizeProviderSelect) {
        const modelSelect = document.getElementById('resummarize-model-select');
        const { allAiProviders } = getState();
        resummarizeProviderSelect.innerHTML = Object.keys(allAiProviders).map(key => `<option value="${key}">${allAiProviders[key].models[0].provider}</option>`).join('');
        const updateModels = () => {
            modelSelect.innerHTML = allAiProviders[resummarizeProviderSelect.value].models.map(m => `<option value="${m.id.split('/').pop()}">${m.name}</option>`).join('');
        };
        resummarizeProviderSelect.value = 'google'; // Default
        updateModels();
        resummarizeProviderSelect.addEventListener('change', updateModels);
    }
    
    if (moreIdeasBtn) {
        moreIdeasBtn.addEventListener('click', handleGenerateMoreIdeas);
    }
    
    if (moreIdeasProviderSelect) {
        populateMoreIdeasProviderDropdown();
        moreIdeasProviderSelect.addEventListener('change', updateMoreIdeasModelDropdown);
    }
}

function displayFullAnalysis(transcriptData, analysisData) {
    const videoId = getYouTubeVideoId(document.getElementById('url-input').value);

    updateState({ 
        currentTranscript: transcriptData, 
        currentVideoId: videoId,
        isLoading: false
    });
    
    resetOutput();
    toggleLoader(false);

    renderTranscriptUI(transcriptData);
    
    const aiSelectionContainer = document.getElementById('ai-selection-container');
    if (aiSelectionContainer) {
        aiSelectionContainer.remove();
    }

    renderAnalysisUI(analysisData);

    attachTranscriptUIListeners();
    console.log(`Successfully displayed cached analysis for video ID: ${videoId}`);
}

function init() {
    cacheElements();
    initApiKeyUI();

    // Load initial state
    const savedSupadataKey = localStorage.getItem('supadataApiKey');
    const savedRapidapiKey = localStorage.getItem('rapidapiApiKey');
    updateState({ supadataApiKey: savedSupadataKey, rapidapiApiKey: savedRapidapiKey });
    
    getProviderConfig()
        .then(providers => updateState({ allAiProviders: providers }))
        .catch(err => showError(err.message));

    const tabButtons = document.querySelectorAll('#main-tabs .tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabClick);
    });

    document.getElementById('analyze-btn').addEventListener('click', handleFetchTranscript);
    
    document.getElementById('url-input').addEventListener('input', handleUrlInput);

    document.getElementById('url-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleFetchTranscript();
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
}

document.addEventListener('DOMContentLoaded', init);