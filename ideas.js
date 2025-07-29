/**
 * ideas.js (Supadata Version)
 * Main JavaScript file for the Idea Engine application.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- API Key Management ---
    const apiKeyInput = document.getElementById('supadata-api-key');
    const apiKeyDetails = document.getElementById('api-key-details');
    const apiKeyStatusIcon = document.getElementById('api-key-status-icon');

    const savedApiKey = localStorage.getItem('supadataApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        apiKeyDetails.open = false; // Collapse if key exists
        apiKeyStatusIcon.textContent = '✅';
    } else {
        apiKeyDetails.open = true; // Expand if no key
        apiKeyStatusIcon.textContent = '⚠️';
    }

    apiKeyInput.addEventListener('input', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('supadataApiKey', key);
            apiKeyStatusIcon.textContent = '✅';
        } else {
            localStorage.removeItem('supadataApiKey');
            apiKeyStatusIcon.textContent = '⚠️';
        }
    });
    
    // --- DOM Element References ---
    const urlInput = document.getElementById('url-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const outputContent = document.getElementById('output-content');
    
    // --- Core Application Logic ---
    analyzeBtn.addEventListener('click', handleAnalysis);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAnalysis();
    });

    /**
     * Fetches a YouTube transcript by calling our backend, which uses Supadata.
     * @param {string} videoUrl - The full YouTube URL.
     * @returns {Promise<object>} A promise that resolves to an object with { fullText, timedText }.
     */
    async function getYouTubeTranscript(videoUrl) {
        console.log(`Requesting transcript for URL: ${videoUrl} via Supadata backend.`);
        
        const apiKey = localStorage.getItem('supadataApiKey');
        if (!apiKey) {
            throw new Error("Supadata API Key is missing. Please enter it in the configuration section.");
        }

        const response = await fetch('/data-fetcher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: apiKey,
                videoUrl: videoUrl
            }),
        });

        if (!response.ok) {
            let errorJson;
            try { errorJson = await response.json(); } catch (e) {}
            const errorDetail = errorJson?.error || errorJson?.message || `The API returned status: ${response.status}`;
            throw new Error(errorDetail);
        }

        const transcriptData = await response.json();
        
        // Supadata returns the content directly as an array of objects
        if (!Array.isArray(transcriptData.content) || transcriptData.content.length === 0) {
            throw new Error('Transcript not found or is empty.');
        }

        const fullText = transcriptData.content.map(line => line.text).join(' ');
        const timedText = transcriptData.content.map(line => ({
            text: line.text,
            start: line.offset / 1000 // Supadata provides offset in ms
        }));
        
        return { fullText, timedText };
    }
    
    async function fetchAiAnalysis(prompt) {
        const response = await fetch('/ai-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate', providerKey: 'openrouter', model: 'mistralai/mistral-7b-instruct', prompt: prompt,
            }),
        });
        if (!response.ok) {
            let errorJson;
            try { errorJson = await response.json(); } catch (e) {}
            const errorDetail = errorJson?.error || `AI API returned status: ${response.status}`;
            throw new Error(errorDetail);
        }
        return response.json();
    }
    
    async function handleAnalysis() {
        const url = urlInput.value.trim();
        if (!url) {
            showError("Please enter a URL.");
            return;
        }

        resetState();
        loader.classList.remove('hidden');

        try {
            const transcriptData = await getYouTubeTranscript(url);
            const prompt = createAnalysisPrompt(transcriptData.fullText);
            const aiResult = await fetchAiAnalysis(prompt);

            if (aiResult.success) {
                const analysis = JSON.parse(aiResult.text);
                renderResults(analysis, transcriptData.timedText);
            } else {
                throw new Error(aiResult.error);
            }
        } catch (error) {
            console.error("Analysis failed:", error);
            showError(error.message || "An unknown error occurred.");
        } finally {
            loader.classList.add('hidden');
        }
    }

    // --- UI Update Functions (renderResults, resetState, etc.) ---
    // These functions can remain the same as the previous light/dark mode version
    // ... (pasting them here for completeness) ...
    function renderResults(analysis, timedText) {
        const createSection = (title, items) => {
            if (!items || items.length === 0) return '';
            const listItems = items.map(item => `<li class="p-3 bg-gray-100 dark:bg-slate-800 rounded-md shadow-sm">${item}</li>`).join('');
            return `
                <div class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
                    <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-4">${title}</h2>
                    <ul class="space-y-3 text-gray-700 dark:text-slate-300">${listItems}</ul>
                </div>
            `;
        };
        const transcriptHtml = timedText.map(line =>
            `<div class="flex items-start gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700/50">
                <span class="text-xs font-mono bg-gray-200 dark:bg-slate-700 text-indigo-600 dark:text-sky-400 px-2 py-1 rounded">${parseFloat(line.start).toFixed(1)}s</span>
                <p class="flex-1 text-gray-800 dark:text-slate-300">${line.text}</p>
            </div>`
        ).join('');
        outputContent.innerHTML = `
            <div class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
                <h2 class="text-2xl font-semibold text-indigo-500 dark:text-sky-300 mb-4">Summary 📝</h2>
                <p class="text-gray-700 dark:text-slate-300 leading-relaxed">${analysis.summary}</p>
            </div>
            ${createSection("Key Takeaways 🔑", analysis.takeaways)}
            ${createSection("Ideas from Content 💡", analysis.extracted_ideas)}
            ${createSection("Further Ideas ✨", analysis.further_ideas)}
            <div class="bg-white dark:bg-slate-800/50 p-5 rounded-lg shadow-md">
                <details>
                    <summary class="cursor-pointer text-xl font-semibold text-indigo-500 dark:text-sky-300 hover:text-indigo-700 dark:hover:text-sky-200">View Full Transcript 字幕</summary>
                    <div class="mt-4 space-y-2 border-t border-gray-200 dark:border-slate-700 pt-4">${transcriptHtml}</div>
                </details>
            </div>
        `;
    }
    function resetState() {
        loader.classList.add('hidden');
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
        outputContent.innerHTML = '';
    }
    function showError(message) {
        errorMessage.textContent = `Error: ${message}`;
        errorMessage.classList.remove('hidden');
    }
});