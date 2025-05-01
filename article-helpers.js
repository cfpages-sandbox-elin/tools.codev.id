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
// Moved here as it's a general helper used by single and bulk modes
export function constructImagePrompt(sectionContent, sectionTitle = "article image", imageSettings = {}) {
     const {
        imageSubject = '',
        imageStyle = '',
        imageStyleModifiers = '',
        imageText = ''
     } = imageSettings; // Destructure settings passed from the caller

     const subject = imageSubject.trim() || sectionTitle; // Use section title/content if no subject provided
     const style = imageStyle;
     const modifiers = imageStyleModifiers.trim();
     const textToInclude = imageText.trim();

     // Construct prompt based on available info
     let prompt = `Create an image representing: ${subject}.`;
     if (style) prompt += ` Style: ${style}.`;
     if (modifiers) prompt += ` Details: ${modifiers}.`;
     if (textToInclude) prompt += ` Include the text: "${textToInclude}".`;

     // Add context from section content (keep it brief)
     const contextSnippet = typeof sectionContent === 'string' ? sectionContent.substring(0, 150) : ''; // Limit context length
     if (contextSnippet) prompt += ` Context: ${contextSnippet}...`;

     return prompt.trim(); // Return the final prompt
}

// --- Delay Helper ---
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Outline Parser ---
// Moved here as it might be used by different modules potentially
export function getArticleOutlines(structureText) {
     if (!structureText) return [];
     // Split by newline, trim, filter empty lines and basic comment/list markers
     return structureText.split('\n')
                         .map(line => line.trim())
                         .filter(line => line.length > 3 && !line.startsWith('#') && !line.startsWith('- ') && !line.startsWith('* '));
}


console.log("article-helpers.js loaded and functions exported.");