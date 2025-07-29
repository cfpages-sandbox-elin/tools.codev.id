/**
 * ideas.js
 * 
 * Main JavaScript file for the Idea Engine application.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const urlInput = document.getElementById('url-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultsArea = document.getElementById('results-area');
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
        activeTab.classList.add('active', 'text-sky-400', 'border-sky-400');
        activeTab.classList.remove('text-slate-400', 'hover:text-white');
        inactiveTab.classList.remove('active', 'text-sky-400', 'border-sky-400');
        inactiveTab.classList.add('text-slate-400', 'hover:text-white');
        
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

    function isValidYouTubeUrl(url) {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
        return regex.test(url);
    }

    /**
     * NOTE: This is a placeholder function.
     * In a real-world application, fetching YouTube transcripts from the client-side
     * is blocked by CORS policy. You would need a server-side component (like a
     * Cloudflare Worker or a small server) to fetch this data for you.
     */
    async function getYouTubeTranscript(url) {
        console.log(`Simulating transcript fetch for: ${url}`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return a hardcoded sample transcript for demonstration
        return {
            fullText: `Hello everyone, and welcome back to the channel. Today, we're diving deep into a fascinating topic: the power of small, consistent habits. It's not about making massive changes overnight. It's about the 1% improvements that compound over time. Think about it, if you get just 1% better each day, by the end of the year, you'll be 37 times better. This principle applies to everything – learning a new skill, building a business, or even improving your health. The key is to start small. Don't say you'll read a book a week. Instead, commit to reading one page a day. This is an idea that you can build on. The initial friction is low, making it easier to stick with. So, my challenge to you is this: pick one small thing you can do today. Just one. And do it again tomorrow. That's how you build momentum. Thanks for watching!`,
            timedText: [
                { start: "0.5", text: "Hello everyone, and welcome back to the channel." },
                { start: "2.8", text: "Today, we're diving deep into a fascinating topic: the power of small, consistent habits." },
                { start: "8.1", text: "It's not about making massive changes overnight." },
                { start: "10.5", text: "It's about the 1% improvements that compound over time." },
                { start: "14.2", text: "Think about it, if you get just 1% better each day, by the end of the year, you'll be 37 times better." },
                { start: "21.0", text: "This principle applies to everything – learning a new skill, building a business, or even improving your health." },
                { start: "27.3", text: "The key is to start small." },
                { start: "28.9", text: "Don't say you'll read a book a week. Instead, commit to reading one page a day." },
                { start: "34.1", text: "This is an idea that you can build on." },
                { start: "35.8", text: "The initial friction is low, making it easier to stick with." },
                { start: "39.5", text: "So, my challenge to you is this: pick one small thing you can do today. Just one." },
                { start: "44.8", text: "And do it again tomorrow. That's how you build momentum." },
                { start: "48.0", text: "Thanks for watching!" }
            ]
        };
    }
    
    async function fetchAiAnalysis(prompt) {
        // We use the relative path to the Cloudflare Function.
        // If deployed, this will correctly call your worker.
        const response = await fetch('/ai-api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generate',
                // Using OpenRouter for access to free/low-cost models
                providerKey: 'openrouter',
                // A capable and fast model
                model: 'mistralai/mistral-7b-instruct',
                prompt: prompt,
            }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to fetch AI analysis.');
        }

        return response.json();
    }
    
    async function handleAnalysis() {
        const url = urlInput.value.trim();
        if (!url) {
            showError("Please enter a URL.");
            return;
        }

        if (!isValidYouTubeUrl(url)) {
            // In the future, you can handle phrase analysis here.
            showError("Please enter a valid YouTube URL (e.g., youtube.com/watch... or youtu.be/...).");
            return;
        }

        // --- Start processing ---
        resetState();
        loader.classList.remove('hidden');

        try {
            // 1. Get Transcript (using our placeholder)
            const transcriptData = await getYouTubeTranscript(url);

            // 2. Create AI prompt
            const prompt = createAnalysisPrompt(transcriptData.fullText);

            // 3. Call AI API
            const aiResult = await fetchAiAnalysis(prompt);

            if (aiResult.success) {
                // The AI returns a JSON string in the 'text' field
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
            const listItems = items.map(item => `<li class="p-3 bg-slate-800 rounded-md shadow">${item}</li>`).join('');
            return `
                <div class="bg-slate-800/50 p-5 rounded-lg">
                    <h2 class="text-2xl font-semibold text-sky-300 mb-4">${title}</h2>
                    <ul class="space-y-3 list-inside text-slate-300">${listItems}</ul>
                </div>
            `;
        };
        
        const transcriptHtml = timedText.map(line => 
            `<div class="flex items-start gap-3">
                <span class="text-xs font-mono bg-slate-700 text-sky-400 px-2 py-1 rounded">${parseFloat(line.start).toFixed(1)}s</span>
                <p class="flex-1">${line.text}</p>
            </div>`
        ).join('');

        outputContent.innerHTML = `
            <div class="bg-slate-800/50 p-5 rounded-lg">
                <h2 class="text-2xl font-semibold text-sky-300 mb-4">Summary</h2>
                <p class="text-slate-300 leading-relaxed">${analysis.summary}</p>
            </div>

            ${createSection("Key Takeaways", analysis.takeaways)}
            ${createSection("Ideas from Content", analysis.extracted_ideas)}
            ${createSection("Further Ideas", analysis.further_ideas)}
            
            <div class="bg-slate-800/50 p-5 rounded-lg">
                <details>
                    <summary class="cursor-pointer text-xl font-semibold text-sky-300">View Full Transcript</summary>
                    <div class="mt-4 space-y-3 text-slate-300 border-t border-slate-700 pt-4">
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
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
});