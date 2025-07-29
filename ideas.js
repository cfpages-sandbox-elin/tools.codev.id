import { updateState, getState } from './ideas-state.js';
import { getProviderConfig, getTranscript, getAiAnalysis } from './ideas-api.js';
import { cacheElements, initApiKeyUI, showError, toggleLoader, resetOutput, renderTranscriptUI, renderAnalysisUI } from './ideas-ui.js';
import { createAnalysisPrompt } from './ideas-prompts.js';

// --- Event Handlers (must be exportable to be used in UI module) ---

async function handleFetchTranscript() {
    const urlInput = document.getElementById('url-input'); // Direct access for simplicity here
    const url = urlInput.value.trim();
    if (!url) { showError("Please enter a URL."); return; }
    if (!getState().supadataApiKey) { showError("Please enter your Supadata API Key first."); return; }

    resetOutput();
    toggleLoader(true);
    updateState({ isLoading: true });

    try {
        const transcriptData = await getTranscript(url);
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