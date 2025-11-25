// article-ideas.js (v9.0 Google Scraper Edition)
import { getState, updateState } from './article-state.js';
import { logToConsole, delay, disableElement, showLoading, showElement } from './article-helpers.js';
import { getElement, updateProgressBar } from './article-ui.js';
import { keywordScraperConfig } from './article-config.js';

// Helper to batch array processing
function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

export async function handleGenerateIdeas() {
    logToConsole("Starting Google Suggest scraping...", "info");
    
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
    // Take the first line as the seed
    const seedKeyword = rawInput.split('\n')[0].trim();
    
    // 2. Get Settings
    const langKey = ui.ideaLangSelect.value; // 'en' or 'id'
    const config = keywordScraperConfig.languages[langKey] || keywordScraperConfig.languages['en'];
    
    logToConsole(`Scraping ideas for seed: "${seedKeyword}" (${config.name})...`, "info");

    // 3. Generate Query List
    let queriesToFetch = [];

    // A. Base seed
    queriesToFetch.push(seedKeyword);

    // B. Alphabet (A-Z) -> "seed a", "seed b"...
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    alphabet.forEach(char => {
        queriesToFetch.push(`${seedKeyword} ${char}`);
    });

    // C. Questions (5W1H) -> "what seed", "how seed"...
    if (config.questions) {
        config.questions.forEach(q => {
            queriesToFetch.push(`${q} ${seedKeyword}`);
        });
    }

    logToConsole(`Generated ${queriesToFetch.length} search patterns to check.`, "info");

    // 4. Execute Scraping
    disableElement(ui.generateIdeasBtn, true);
    showLoading(ui.loadingIndicator, true);
    showElement(ui.progressContainer, true);
    showElement(ui.progressText, true);

    let allSuggestions = new Set();
    
    // Batching: Send 5 queries per request to backend
    const batches = chunkArray(queriesToFetch, 5);
    let processedBatches = 0;

    try {
        for (const batch of batches) {
            // Update UI
            processedBatches++;
            const pct = Math.round((processedBatches / batches.length) * 100);
            updateProgressBar(ui.progressBar, ui.progressContainer, ui.progressText, processedBatches, batches.length, "Scraping batch ");

            // Call Backend
            const response = await fetch('/google-browser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    queries: batch,
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
                logToConsole(`Batch failed: ${response.status}`, "warn");
            }

            // Polite delay to prevent backend/google rate limiting
            await delay(300); 
        }

        // 5. Finalize
        const uniqueList = Array.from(allSuggestions);
        // Filter out the exact seed if desired, or keep it.
        // Let's sort them alphabetically
        uniqueList.sort();

        // Append to existing text area (or replace? usually append is safer so user doesn't lose other stuff)
        // User prompt implied using it for planning, so let's put the seed at top, then results.
        
        const finalText = [seedKeyword, ...uniqueList].join('\n');
        ui.bulkKeywordsTextarea.value = finalText;
        
        // Update state
        updateState({ bulkKeywordsContent: finalText });

        logToConsole(`Scraping complete. Found ${uniqueList.length} unique keywords.`, "success");
        ui.progressText.textContent = `Done! Found ${uniqueList.length} keywords.`;

    } catch (error) {
        logToConsole(`Scraping error: ${error.message}`, 'error');
        alert(`Error generating ideas: ${error.message}`);
    } finally {
        showLoading(ui.loadingIndicator, false);
        disableElement(ui.generateIdeasBtn, false);
        // Keep progress bar shown for a moment to say "Done"
        setTimeout(() => {
            showElement(ui.progressContainer, false);
            showElement(ui.progressText, false);
        }, 3000);
    }
}