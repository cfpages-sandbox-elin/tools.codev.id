/**
 * ideas.js
 * 
 * Main JavaScript file for the Idea Engine application.
 */
document.addEventListener('DOMContentLoaded', () => {   
    // --- DOM Element References ---
    const urlInput = document.getElementById('url-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const outputContent = document.getElementById('output-content');
    
    // Tab Elements
    const tabBrainstorm = document.getElementById('tab-brainstorm');
    const tabExecute = document.getElementById('tab-execute');
    const contentBrainstorm = document.getElementById('content-brainstorm');
    const contentExecute = document.getElementById('content-execute');

    // --- Tab Switching Logic ---
    function switchTab(activeTab, inactiveTab, activeContent, inactiveContent) {
        activeTab.classList.add('active', 'text-indigo-600', 'dark:text-sky-400', 'border-indigo-600', 'dark:border-sky-400');
        activeTab.classList.remove('text-gray-500', 'dark:text-slate-400');
        inactiveTab.classList.remove('active', 'text-indigo-600', 'dark:text-sky-400', 'border-indigo-600', 'dark:border-sky-400');
        inactiveTab.classList.add('text-gray-500', 'dark:text-slate-400');
        
        activeContent.classList.remove('hidden');
        inactiveContent.classList.add('hidden');
    }

    tabBrainstorm.addEventListener('click', () => switchTab(tabBrainstorm, tabExecute, contentBrainstorm, contentExecute));
    tabExecute.addEventListener('click', () => switchTab(tabExecute, tabBrainstorm, contentExecute, contentBrainstorm));

    // --- Core Application Logic ---
    analyzeBtn.addEventListener('click', handleAnalysis);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAnalysis();
    });

    function getYouTubeVideoId(url) {
        const regex = /(?:v=|\/|youtu\.be\/)([\w-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    /**
     * Fetches a YouTube transcript using our CORS bypass function.
     * @param {string} videoId - The 11-character YouTube video ID.
     * @returns {Promise<object>} A promise that resolves to an object with { fullText, timedText }.
     */
    async function getYouTubeTranscript(videoId) {
        console.log(`Requesting transcript for video ID: ${videoId} from our smart backend.`);
        
        const response = await fetch('/bypass-cors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'youtube', // The only mode we need now
                videoId: videoId
            }),
        });

        if (!response.ok) {
            let errorJson;
            try { errorJson = await response.json(); } catch (e) {}
            const errorMessage = errorJson?.error || `Failed to fetch transcript after all attempts. Status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const transcriptData = await response.json();
        
        if (!Array.isArray(transcriptData) || transcriptData.length === 0) {
            throw new Error('Transcript not found or is empty.');
        }

        const fullText = transcriptData.map(line => line.text).join(' ');
        const timedText = transcriptData;
        
        return { fullText, timedText };
    }
    
    async function fetchAiAnalysis(prompt) {
        const response = await fetch('/ai-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate',
                providerKey: 'openrouter',
                model: 'mistralai/mistral-7b-instruct',
                prompt: prompt,
            }),
        });

        if (!response.ok) {
            let errorMsg = `AI Error: ${response.status} ${response.statusText}`;
            try {
                const errData = await response.json();
                errorMsg = errData.error || JSON.stringify(errData);
            } catch (e) { /* Ignore parsing error */ }
            throw new Error(errorMsg);
        }

        return response.json();
    }
    
    async function handleAnalysis() {
        const url = urlInput.value.trim();
        const videoId = getYouTubeVideoId(url);

        if (!videoId) {
            showError("Please enter a valid YouTube URL (e.g., youtube.com/watch... or youtu.be/...).");
            return;
        }

        resetState();
        loader.classList.remove('hidden');

        try {
            // 1. Get Transcript using the new bypass function
            const transcriptData = await getYouTubeTranscript(videoId);

            // 2. Create AI prompt
            const prompt = createAnalysisPrompt(transcriptData.fullText);

            // 3. Call AI API
            const aiResult = await fetchAiAnalysis(prompt);

            if (aiResult.success) {
                const analysis = JSON.parse(aiResult.text);
                renderResults(analysis, transcriptData.timedText);
            } else {
                throw new Error(aiResult.error);
            }

        } catch (error) {
            console.error("Analysis failed:", error);
            showError(error.message || "An unknown error occurred during analysis.");
        } finally {
            loader.classList.add('hidden');
        }
    }

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
                    <div class="mt-4 space-y-2 border-t border-gray-200 dark:border-slate-700 pt-4">
                        ${transcriptHtml}
                    </div>
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