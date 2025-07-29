import { updateState, getState } from './ideas-state.js';
import { getProviderConfig, getTranscript, getAiAnalysis } from './ideas-api.js';
import { cacheElements, initApiKeyUI, showError, toggleLoader, resetOutput, renderTranscriptUI, renderAnalysisUI, updateModelDropdownUI, updateTokenInfoUI } from './ideas-ui.js';
import { createAnalysisPrompt } from './ideas-prompts.js';
import { getYouTubeVideoId } from './ideas-helpers.js';

// --- Event Handlers (must be exportable to be used in UI module) ---

async function handleFetchTranscript() {
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim();
    if (!url) {
        showError("Please enter a URL.");
        return;
    }

    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
        showError("Could not find a valid YouTube Video ID in the URL.");
        return;
    }
    
    if (!getState().supadataApiKey) {
        showError("Please enter your Supadata API Key first.");
        return;
    }

    resetOutput();
    toggleLoader(true);
    updateState({ isLoading: true });

    try {
        let transcriptData = null;
        const cacheKey = `transcript_${videoId}`;

        // 1. Check localStorage for a cached version
        const cachedTranscript = localStorage.getItem(cacheKey);

        if (cachedTranscript) {
            console.log(`Loading transcript for video ID [${videoId}] from cache.`);
            // A small delay to make the UI feel responsive even when loading instantly
            await new Promise(resolve => setTimeout(resolve, 200)); 
            transcriptData = JSON.parse(cachedTranscript);
        } else {
            console.log(`Transcript for video ID [${videoId}] not in cache. Fetching from API...`);
            // 2. If not cached, fetch from the API
            transcriptData = await getTranscript(url); // The API needs the full URL
            
            // 3. Save the newly fetched data to the cache
            localStorage.setItem(cacheKey, JSON.stringify(transcriptData));
            console.log(`Saved new transcript for video ID [${videoId}] to cache.`);
        }

        // 4. Update state and render the UI, regardless of the source
        updateState({ currentTranscript: transcriptData });
        renderTranscriptUI();

    } catch (error) {
        showError(error.message);
    } finally {
        toggleLoader(false);
        updateState({ isLoading: false });
    }
}

export async function handleAnalyzeTranscript() {
    const analyzeBtn = document.getElementById('analyze-transcript-btn');
    const provider = document.getElementById('ai-provider-select').value;
    const model = document.getElementById('ai-model-select').value;
    const { currentTranscript } = getState();
    if (!currentTranscript) { showError("No transcript available to analyze."); return; }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = 'Analyzing... <span class="inline-block animate-spin ..."></span>';
    updateState({ isLoading: true });

    try {
        const prompt = createAnalysisPrompt(currentTranscript.fullText);
        const result = await getAiAnalysis(prompt, provider, model);
        if (result.success) {
            const analysis = JSON.parse(result.text);
            console.log("AI Analysis Complete:", analysis);
            renderAnalysisUI(analysis); // You would build out this function
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showError(error.message);
    } finally {
        analyzeBtn.style.display = 'none';
        updateState({ isLoading: false });
    }
}

function attachTranscriptUIListeners() {
    const analyzeBtn = document.getElementById('analyze-transcript-btn');
    const providerSelect = document.getElementById('ai-provider-select');
    const modelSelect = document.getElementById('ai-model-select');
    
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', handleAnalyzeTranscript);
    }
    
    // When the provider changes, rebuild the model dropdown.
    // The rebuild function will also update the token info automatically.
    if (providerSelect) {
        providerSelect.addEventListener('change', updateModelDropdownUI);
    }

    // *** THE CRITICAL FIX ***
    // When the model itself changes, we ONLY need to update the token info text.
    if (modelSelect) {
        modelSelect.addEventListener('change', updateTokenInfoUI);
    }
}

// --- Application Initialization ---

function init() {
    cacheElements();
    initApiKeyUI();

    // Load initial state
    const savedKey = localStorage.getItem('supadataApiKey');
    updateState({ supadataApiKey: savedKey });
    
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
        document.getElementById('api-key-status-icon').textContent = key ? '✅' : '⚠️';
    });
}

// --- Entry Point ---
document.addEventListener('DOMContentLoaded', init);