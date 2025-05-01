// article-helpers.js
import { CLOUDFLARE_FUNCTION_URL } from './article-config.js'; // Ensure this is exported from config

// --- Logging ---
const consoleLogElement = document.getElementById('consoleLog');
export function logToConsole(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (!consoleLogElement) return;
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.classList.add(`log-${type}`);
    const escapedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    logEntry.innerHTML = `[${timestamp}] ${escapedMessage}`;
    consoleLogElement.prepend(logEntry);
    while (consoleLogElement.children.length > 150) {
        consoleLogElement.removeChild(consoleLogElement.lastChild);
    }
}

// --- UI Helpers ---
export function showElement(element, show = true) {
    if (element) {
        element.classList.toggle('hidden', !show);
    } else {
        logToConsole(`Attempted to show/hide a null element.`, 'warn');
    }
}

export function showLoading(indicatorElement, show = true) {
    showElement(indicatorElement, show);
}

export function disableElement(element, disabled = true) {
     if (element) {
        element.disabled = disabled;
    } else {
        logToConsole(`Attempted to disable a null element.`, 'warn');
    }
}

export function disableActionButtons(disabled = true) {
    const btnIds = ['generateSingleBtn', 'generatePlanBtn', 'generateArticleBtn', 'startBulkGenerationBtn', 'enableSpinningBtn', 'spinSelectedBtn', 'fetchSitemapBtn'];
    btnIds.forEach(id => {
        const btn = document.getElementById(id); // Assuming direct access is okay here or pass elements
        if (btn) disableElement(btn, disabled);
    });
}

// --- Text/String Helpers ---
export function sanitizeFilename(name) {
    if (!name) return `untitled-${Date.now()}.md`;
    return name.toLowerCase()
               .replace(/[^a-z0-9\-\.]/g, '-')
               .replace(/-+/g, '-')
               .replace(/^-+|-+$/g, '')
               .substring(0, 100) || `sanitized-${Date.now()}`;
}

export function slugify(text) {
    if (!text) return '';
    return text.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// --- AI/API Call Helper ---
export async function callAI(action, payload, loadingIndicator = null, buttonToDisable = null) {
    const fullPayload = { action, ...payload };
    logToConsole(`Sending action '${action}' to backend...`, 'info');
    if (loadingIndicator) showLoading(loadingIndicator, true);
    if (buttonToDisable) disableElement(buttonToDisable, true);
    else disableActionButtons(true);

    try {
        const response = await fetch(CLOUDFLARE_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullPayload)
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            const errorMsg = data.error || `Request failed with status ${response.status}`;
            if (response.status === 429) logToConsole(`Rate limit hit during action '${action}'.`, 'warn');
            else if (response.status >= 500) logToConsole(`Server error (${response.status}) during action '${action}'.`, 'warn');
            throw new Error(errorMsg);
        }
        logToConsole(`Action '${action}' successful.`, 'success');
        return data;
    } catch (error) {
        console.error(`Action '${action}' Failed:`, error);
        logToConsole(`Error during action '${action}': ${error.message}`, 'error');
        return { success: false, error: error.message };
    } finally {
         if (loadingIndicator) showLoading(loadingIndicator, false);
         if (buttonToDisable) disableElement(buttonToDisable, false);
         else disableActionButtons(false);
    }
}

// --- Model Helpers ---
export function findCheapestModel(models = []) {
    const cheapKeywords = ['flash', 'mini', 'lite', 'fast', 'haiku', 'nano', '3.5-turbo'];
    for (const keyword of cheapKeywords) {
        const found = models.find(m => m.includes(keyword));
        if (found) return found;
    }
    return models[0] || '';
}

// --- Image Prompt Construction ---
export function constructImagePrompt(sectionContent, sectionTitle = "article image", imageSettings = {}) {
     const { imageSubject = '', imageStyle = '', imageStyleModifiers = '', imageText = '' } = imageSettings;
     const subject = imageSubject.trim() || sectionTitle;
     const style = imageStyle;
     const modifiers = imageStyleModifiers.trim();
     const textToInclude = imageText.trim();
     let prompt = `Create an image representing: ${subject}.`;
     if (style) prompt += ` Style: ${style}.`;
     if (modifiers) prompt += ` Details: ${modifiers}.`;
     if (textToInclude) prompt += ` Include the text: "${textToInclude}".`;
     const contextSnippet = typeof sectionContent === 'string' ? sectionContent.substring(0, 150) : '';
     if (contextSnippet) prompt += ` Context: ${contextSnippet}...`;
     return prompt.trim();
}

// --- Sitemap Fetching ---
// ***** FIX: Added export keyword *****
export async function fetchAndParseSitemap() {
    const sitemapUrlInput = document.getElementById('sitemapUrl'); // Get elements directly here or pass them in
    const fetchSitemapBtn = document.getElementById('fetchSitemapBtn');
    const sitemapLoadingIndicator = document.getElementById('sitemapLoadingIndicator');
    const { updateState, defaultSettings } = await import('./article-state.js'); // Dynamically import state functions if needed here
    const { displaySitemapUrlsUI } = await import('./article-ui.js'); // Dynamically import UI functions if needed here

    const url = sitemapUrlInput.value.trim();
    if (!url) {
        alert('Please enter a Sitemap URL.');
        return;
    }

    logToConsole(`Fetching sitemap from URL: ${url}`, 'info');
    showLoading(sitemapLoadingIndicator, true);
    disableElement(fetchSitemapBtn, true);

    let parsedUrls = []; // Keep track of parsed URLs locally

    try {
        const result = await callAI('fetch_sitemap', { sitemapUrl: url }, null, null); // Use callAI

        if (!result?.success) {
            throw new Error(result?.error || 'Failed to fetch/parse sitemap');
        }

        parsedUrls = result.urls || [];
        updateState({ sitemapUrls: parsedUrls }); // Update the application state
        // displaySitemapUrlsUI(parsedUrls); // Update UI directly or rely on state change listener if implemented
        logToConsole(`Successfully fetched and parsed ${parsedUrls.length} URLs.`, 'success');

    } catch (error) {
        console.error("Sitemap Fetch/Parse Failed:", error);
        logToConsole(`Sitemap Error: ${error.message}`, 'error');
        alert(`Failed to process sitemap: ${error.message}`);
        updateState({ sitemapUrls: [] }); // Clear sitemap in state on error
        // displaySitemapUrlsUI([]); // Clear UI
    } finally {
        showLoading(sitemapLoadingIndicator, false);
        disableElement(fetchSitemapBtn, false);
    }
}


// --- Delay Helper ---
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Outline Parser ---
export function getArticleOutlines(structureText) {
     if (!structureText) return [];
     return structureText.split('\n')
                         .map(line => line.trim())
                         .filter(line => line.length > 3 && !line.startsWith('#') && !line.startsWith('- ') && !line.startsWith('* '));
}


console.log("article-helpers.js loaded and functions exported.");