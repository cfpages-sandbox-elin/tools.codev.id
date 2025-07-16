// article-ideas.js v8.21 refactor prompts
import { getState, updateState } from './article-state.js';
import { logToConsole, callAI, delay, disableElement, showLoading, showElement } from './article-helpers.js';
import { getElement, updateProgressBar } from './article-ui.js';
import { getIdeaPrompt } from './article-prompts.js';

const W_H_QUESTIONS = {
    "Who": "keywords that explore 'Who is related to/affected by/involved with [SEED_KEYWORD]?' or 'Who is the target audience for [SEED_KEYWORD]?'",
    "What": "keywords that explore 'What is [SEED_KEYWORD]?' or 'What are the components/types/aspects/features of [SEED_KEYWORD]?'",
    "When": "keywords that explore 'When is [SEED_KEYWORD] relevant/used/happening?' or 'What is the history/timeline/seasonality of [SEED_KEYWORD]?'",
    "Where": "keywords that explore 'Where is [SEED_KEYWORD] found/applicable/relevant/used?' or 'Where can one learn about/get [SEED_KEYWORD]?'",
    "Why": "keywords that explore 'Why is [SEED_KEYWORD] important/used/beneficial?' or 'What are the reasons/motivations/problems solved by [SEED_KEYWORD]?'",
    "How": "keywords that explore 'How does [SEED_KEYWORD] work?' or 'How to use/do/achieve/fix/learn [SEED_KEYWORD]?' or 'What are methods/techniques related to [SEED_KEYWORD]?'"
};

function parseIdeaResponse(responseText) {
    if (!responseText || typeof responseText !== 'string') return [];
    return responseText
        .split(',')
        .map(kw => kw.trim().replace(/^["']+|["']+$|^\d+\.\s*|^\-\s*|^\*\s*/g, '')) // Clean quotes, list markers
        .filter(kw => kw.length > 2); // Filter out very short/empty results
}

function cleanAndUniqueKeywords(keywords) {
    const cleaned = keywords
        .map(kw => kw
            .replace(/\(\d+\)/g, '') // Remove numbers in parentheses
            .replace(/\s+/g, ' ')   // Collapse whitespace
            .trim()
        )
        .filter(kw => kw.length > 0);
    return [...new Set(cleaned)];
}


export async function handleGenerateIdeas() {
    logToConsole("Starting article idea generation...", "info");
    const ui = {
        bulkKeywordsTextarea: getElement('bulkKeywords'),
        generateIdeasBtn: getElement('generateIdeasBtn'),
        ideasLoadingIndicator: getElement('ideasLoadingIndicator'),
        // Add new UI elements
        progressContainer: getElement('ideasProgressContainer'),
        progressBar: getElement('ideasProgressBar'),
        progressText: getElement('ideasProgressText')
    };

    if (!ui.bulkKeywordsTextarea || !ui.generateIdeasBtn || !ui.progressContainer) {
        logToConsole("Required UI elements for idea generation are missing.", "error");
        alert("Error: Could not find necessary UI elements for idea generation.");
        return;
    }

    const existingKeywords = ui.bulkKeywordsTextarea.value.split('\n').map(kw => kw.trim()).filter(kw => kw.length > 0);
    const seedKeyword = existingKeywords[0];

    if (!seedKeyword) {
        alert("Please enter at least one seed keyword in the 'Bulk Keywords' area to generate ideas.");
        logToConsole("Seed keyword missing for idea generation.", "warn");
        return;
    }

    logToConsole(`Generating ideas based on seed keyword: "${seedKeyword}"`, "info");

    disableElement(ui.generateIdeasBtn, true);
    showLoading(ui.ideasLoadingIndicator, true);
    // Initialize and show the progress bar
    updateProgressBar(ui.progressBar, ui.progressContainer, ui.progressText, 0, 1, "Initializing...");

    const state = getState();
    let allGeneratedKeywords = [];
    const questionEntries = Object.entries(W_H_QUESTIONS);
    const totalSteps = questionEntries.length;

    try {
        for (let i = 0; i < totalSteps; i++) {
            const [questionType, questionDetail] = questionEntries[i];
            
            // Update status text for the current step
            ui.progressText.textContent = `Generating ideas for "${questionType}"... (${i + 1}/${totalSteps})`;
            logToConsole(`Generating ideas for aspect: ${questionType}`, "info");
            
            // REFACTORED
            const prompt = getIdeaPrompt(seedKeyword, questionType, questionDetail.replace(/\[SEED_KEYWORD\]/g, seedKeyword));
            const payload = {
                providerKey: state.textProvider,
                model: state.textModel,
                prompt: prompt
            };

            const result = await callAI('generate', payload, null, null); 

            if (result?.success && result.text) {
                const parsedKeywords = parseIdeaResponse(result.text);
                logToConsole(`Generated ${parsedKeywords.length} ideas for ${questionType}: ${parsedKeywords.join('; ')}`, "info");
                allGeneratedKeywords.push(...parsedKeywords);
            } else {
                logToConsole(`Failed to generate ideas for ${questionType}. Error: ${result?.error || 'No text returned'}`, "error");
            }
            
            // Update progress bar after each step
            const progressPercent = Math.round(((i + 1) / totalSteps) * 100);
            ui.progressBar.style.width = `${progressPercent}%`;

            await delay(300); 
        }

        ui.progressText.textContent = 'Finalizing and de-duplicating keyword list...';
        const uniqueGeneratedKeywords = cleanAndUniqueKeywords(allGeneratedKeywords);
        const combinedKeywords = [...existingKeywords, ...uniqueGeneratedKeywords];
        const finalUniqueKeywords = cleanAndUniqueKeywords(combinedKeywords);

        const newTextareaValue = finalUniqueKeywords.join('\n');
        ui.bulkKeywordsTextarea.value = newTextareaValue;
        updateState({ bulkKeywordsContent: newTextareaValue }); // Save cleaned list to state

        logToConsole(`Idea generation complete. Total unique keywords: ${finalUniqueKeywords.length}. Populated bulk keywords textarea.`, "success");
        alert(`Generated ${uniqueGeneratedKeywords.length} new unique ideas. The keyword list has been updated.`);

    } catch (error) {
        logToConsole(`An error occurred during idea generation: ${error.message}`, 'error');
        alert('An error occurred during idea generation. Please check the console log.');
    } finally {
        // Hide all indicators
        showLoading(ui.ideasLoadingIndicator, false);
        disableElement(ui.generateIdeasBtn, false);
        showElement(ui.progressContainer, false);
        showElement(ui.progressText, false);
        ui.progressBar.style.width = '0%';
    }
}

console.log("article-ideas.js (v8.21 refactor prompts)");