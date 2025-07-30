import { updateState, getState } from './ideas-state.js';
import { getProviderConfig, getTranscript, getAiAnalysis } from './ideas-api.js';
import { cacheElements, initApiKeyUI, showError, toggleLoader, resetOutput, renderTranscriptUI, renderAnalysisUI, updateModelDropdownUI, updateTokenInfoUI } from './ideas-ui.js';
import { createClassificationPrompt, createIdeasListPrompt, createTutorialPrompt, createPodcastPrompt, createMoreIdeasPrompt } from './ideas-prompts.js';
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

        updateState({ currentTranscript: transcriptData, currentVideoId: videoId });
        
        renderTranscriptUI(transcriptData);
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

function getVideoTypeFromText(text) {
    const lowercasedText = text.toLowerCase();
    if (lowercasedText.includes('tutorial')) {
        return 'Tutorial';
    }
    if (lowercasedText.includes('podcast')) {
        return 'Podcast';
    }
    // Default to "Ideas List" if the others aren't found or it's ambiguous.
    return 'Ideas List';
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
        const cacheKey = `analysis_v2_${currentVideoId}`;
        const cachedAnalysis = localStorage.getItem(cacheKey);

        let analysis;
        if (cachedAnalysis) {
            console.log(`Loading V2 analysis for [${currentVideoId}] from cache.`);
            analysis = JSON.parse(cachedAnalysis);
        } else {
            // STEP 1: Classify the video type
            analyzeBtn.innerHTML = 'Classifying Video...';
            const classificationPrompt = createClassificationPrompt(currentTranscript.fullText);
            const classificationResult = await getAiAnalysis(classificationPrompt, provider, model);
            if (!classificationResult.success) throw new Error(`Classification failed: ${classificationResult.error}`);
            
            // FIX: Use the new robust helper function instead of trying to parse JSON.
            const videoType = getVideoTypeFromText(classificationResult.text);
            console.log(`Video classified as: ${videoType}`);

            // STEP 2: Choose the correct detailed prompt based on classification
            const promptSelector = {
                'Tutorial': createTutorialPrompt,
                'Podcast': createPodcastPrompt,
                'Ideas List': createIdeasListPrompt,
                'Other': createIdeasListPrompt
            };
            const analysisPrompt = (promptSelector[videoType] || createIdeasListPrompt)(currentTranscript.fullText);
            
            analyzeBtn.innerHTML = 'Deep Analyzing...';
            const analysisResult = await getAiAnalysis(analysisPrompt, provider, model);
            if (!analysisResult.success) throw new Error(`Detailed analysis failed: ${analysisResult.error}`);
            
            analysis = extractAndParseJson(analysisResult.text);

            localStorage.setItem(cacheKey, JSON.stringify(analysis));
        }

        renderAnalysisUI(analysis);
        attachTranscriptUIListeners();

    } catch (error) {
        showError(error.message);
    } finally {
        const aiSelectionContainer = document.getElementById('ai-selection-container');
        if (aiSelectionContainer) aiSelectionContainer.style.display = 'none';
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

function attachTranscriptUIListeners() {
    const analyzeBtn = document.getElementById('analyze-transcript-btn');
    const providerSelect = document.getElementById('ai-provider-select');
    const modelSelect = document.getElementById('ai-model-select');
    const moreIdeasBtn = document.getElementById('generate-more-ideas-btn');
    
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
}

// --- Application Initialization ---

function init() {
    cacheElements();
    initApiKeyUI();

    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = {
        brainstorm: document.getElementById('brainstorm-content'),
        plan: document.getElementById('plan-content')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update state
            updateState({ activeTab: tabName });

            // Update button styles
            tabs.forEach(t => {
                const isActive = t.dataset.tab === tabName;
                t.classList.toggle('border-indigo-500', isActive);
                t.classList.toggle('text-indigo-600', isActive);
                t.classList.toggle('border-transparent', !isActive);
                t.classList.toggle('text-gray-500', !isActive);
                t.setAttribute('aria-current', isActive ? 'page' : 'false');
            });

            // Show/hide content
            Object.values(tabContents).forEach(content => content.classList.add('hidden'));
            tabContents[tabName].classList.remove('hidden');

            // If switching to the plan tab, initialize it
            if (tabName === 'plan') {
                import('./ideas-plan.js').then(module => {
                    module.initPlanTab();
                });
            }
        });
    });

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