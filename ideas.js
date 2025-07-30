import { updateState, getState } from './ideas-state.js';
import { getProviderConfig, getTranscript, getAiAnalysis } from './ideas-api.js';
import { cacheElements, initApiKeyUI, showError, toggleLoader, resetOutput, renderTranscriptUI, renderAnalysisUI, updateModelDropdownUI, updateTokenInfoUI } from './ideas-ui.js';
import { createAnalysisPrompt } from './ideas-prompts.js';
import { getYouTubeVideoId } from './ideas-helpers.js';

// --- Event Handlers (must be exportable to be used in UI module) ---

async function handleFetchTranscript() {
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value.trim();
    if (!url) { showError("Please enter a URL."); return; }
    const videoId = getYouTubeVideoId(url);
    if (!videoId) { showError("Could not find a valid YouTube Video ID in the URL."); return; }
    if (!getState().supadataApiKey) { showError("Please enter your Supadata API Key first."); return; }

    resetOutput();
    toggleLoader(true);
    updateState({ isLoading: true });

    try {
        const cacheKey = `transcript_${videoId}`;
        const cachedTranscript = localStorage.getItem(cacheKey);
        let transcriptData;

        if (cachedTranscript) {
            console.log(`Loading transcript for [${videoId}] from cache.`);
            await new Promise(resolve => setTimeout(resolve, 200)); 
            transcriptData = JSON.parse(cachedTranscript);
        } else {
            console.log(`Fetching transcript for [${videoId}] from API...`);
            transcriptData = await getTranscript(url);
            localStorage.setItem(cacheKey, JSON.stringify(transcriptData));
        }

        updateState({ currentTranscript: transcriptData });
        
        // Step 1: Render the UI with the fetched data
        renderTranscriptUI(transcriptData);
        
        // Step 2: Attach listeners to the newly created UI
        attachTranscriptUIListeners();

    } catch (error) {
        showError(error.message);
    } finally {
        toggleLoader(false);
        updateState({ isLoading: false });
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
    const provider = document.getElementById('ai-provider-select').value;
    const model = document.getElementById('ai-model-select').value;
    const { currentTranscript } = getState();
    if (!currentTranscript) { showError("No transcript available to analyze."); return; }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = 'Analyzing... <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>';
    updateState({ isLoading: true });

    let result; 

    try {
        const prompt = createAnalysisPrompt(currentTranscript.fullText);
        result = await getAiAnalysis(prompt, provider, model);

        if (result.success) {
            // Use the new robust function to extract and parse the JSON
            const analysis = extractAndParseJson(result.text);
            console.log("AI Analysis Complete:", analysis);
            renderAnalysisUI(analysis);
        } else {
            throw new Error(result.error || "The AI API returned an unspecified error.");
        }
    } catch (error) {
        let errorMessage = error.message;
        if (result && result.text) {
             errorMessage += ` | AI Response: "${result.text}"`;
        }
        showError(errorMessage);
    } finally {
        const aiSelectionContainer = document.getElementById('ai-selection-container');
        if (aiSelectionContainer) {
            aiSelectionContainer.style.display = 'none';
        }
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
    
    if (providerSelect) {
        providerSelect.addEventListener('change', updateModelDropdownUI);
    }

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