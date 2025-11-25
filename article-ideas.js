// article-ideas.js (v9.11 One-by-One Scraper)
import { getState, updateState } from './article-state.js';
import { logToConsole, delay, disableElement, showLoading, showElement } from './article-helpers.js';
import { getElement, updateProgressBar } from './article-ui.js';
import { keywordScraperConfig } from './article-config.js';

export async function handleGenerateIdeas() {
    logToConsole("Starting Google Suggest scraping (Sequential Mode)...", "info");
    
    const ui = {
        bulkKeywordsTextarea: getElement('bulkKeywords'),
        generateIdeasBtn: getElement('generateIdeasBtn'),
        ideaLangSelect: getElement('ideaLangSelect'),
        loadingIndicator: getElement('ideasLoadingIndicator'),
        progressContainer: getElement('ideasProgressContainer'),
        progressBar: getElement('ideasProgressBar'),
        progressText: getElement('ideasProgressText')
    };

    if (!ui.bulkKeywordsTextarea || !ui.ideaLangSelect) {
        logToConsole("UI elements missing for idea generation.", "error");
        return;
    }

    // 1. Get Seed Keyword
    const rawInput = ui.bulkKeywordsTextarea.value.trim();
    if (!rawInput) {
        alert("Please enter a seed keyword in the text area first.");
        return;
    }
    const seedKeyword = rawInput.split('\n')[0].trim();
    
    // 2. Get Settings
    const langKey = ui.ideaLangSelect.value; // 'en' or 'id'
    const config = keywordScraperConfig.languages[langKey] || keywordScraperConfig.languages['en'];
    
    logToConsole(`Scraping ideas for seed: "${seedKeyword}" (${config.name})...`, "info");

    // 3. Generate Query List
    let queriesToFetch = [];

    // A. Base seed WITH SPACE (Important: triggers specific suggestions)
    queriesToFetch.push(seedKeyword + ' '); 

    // B. Alphabet (A-Z) -> "seed a", "seed b"...
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    alphabet.forEach(char => {
        queriesToFetch.push(`${seedKeyword} ${char}`);
    });

    // C. Questions (5W+2H) -> "what seed", "how to seed"...
    if (config.questions) {
        config.questions.forEach(q => {
            queriesToFetch.push(`${q} ${seedKeyword}`);
        });
    }

    logToConsole(`Generated ${queriesToFetch.length} search patterns. Executing sequential fetch...`, "info");

    // 4. Execute Scraping (One by One)
    disableElement(ui.generateIdeasBtn, true);
    showLoading(ui.loadingIndicator, true);
    showElement(ui.progressContainer, true);
    showElement(ui.progressText, true);

    let allSuggestions = new Set();
    let completedRequests = 0;

    try {
        // Loop through every single query
        for (const singleQuery of queriesToFetch) {
            // Call Backend with a single item array
            // We don't use chunking anymore. This reduces Cloudflare CPU time per request.
            const response = await fetch('/google-browser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    queries: [singleQuery], // Send as array of 1
                    lang: config.code,
                    gl: config.gl
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.suggestions)) {
                    data.suggestions.forEach(s => allSuggestions.add(s));
                }
            } else {
                logToConsole(`Fetch failed for "${singleQuery}"`, "warn");
            }

            // Update UI
            completedRequests++;
            const pct = Math.round((completedRequests / queriesToFetch.length) * 100);
            updateProgressBar(ui.progressBar, ui.progressContainer, ui.progressText, completedRequests, queriesToFetch.length, "Fetching ");

            // Small delay to be polite to Google (even though we are proxying) and allow UI updates
            await delay(150); 
        }

        // 5. Finalize
        const uniqueList = Array.from(allSuggestions);
        uniqueList.sort();

        // Update Textarea: Seed first, then results
        const finalText = [seedKeyword, ...uniqueList].join('\n');
        ui.bulkKeywordsTextarea.value = finalText;
        
        updateState({ bulkKeywordsContent: finalText });

        logToConsole(`Scraping complete. Found ${uniqueList.length} unique keywords.`, "success");
        ui.progressText.textContent = `Done! Found ${uniqueList.length} keywords.`;

    } catch (error) {
        logToConsole(`Scraping error: ${error.message}`, 'error');
        alert(`Error generating ideas: ${error.message}`);
    } finally {
        showLoading(ui.loadingIndicator, false);
        disableElement(ui.generateIdeasBtn, false);

        setTimeout(() => {
            showElement(ui.progressContainer, false);
            showElement(ui.progressText, false);
        }, 3000);
    }
}