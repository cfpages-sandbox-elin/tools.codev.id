// article-helpers.js
import { CLOUDFLARE_FUNCTION_URL } from './article-config.js';

// --- Logging ---
const consoleLogElement = document.getElementById('consoleLog');
export function logToConsole(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`); // Keep browser console log
    if (!consoleLogElement) return;
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.classList.add(`log-${type}`);
    // Basic escaping for safety
    const escapedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    logEntry.innerHTML = `[${timestamp}] ${escapedMessage}`; // Use innerHTML for potential formatting later if needed
    consoleLogElement.prepend(logEntry);
    // Trim log
    while (consoleLogElement.children.length > 150) { // Increased limit slightly
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

// Disable multiple buttons - assumes specific IDs exist
export function disableActionButtons(disabled = true) {
    const btnIds = ['generateSingleBtn', 'generatePlanBtn', 'generateArticleBtn', 'startBulkGenerationBtn', 'enableSpinningBtn', 'spinSelectedBtn', 'fetchSitemapBtn'];
    btnIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) disableElement(btn, disabled);
    });
}

// --- Text/String Helpers ---
export function sanitizeFilename(name) {
    if (!name) return `untitled-${Date.now()}.md`; // Fallback for empty names
    return name.toLowerCase()
               .replace(/[^a-z0-9\-\.]/g, '-') // Replace non-alphanumeric/hyphen/dot with hyphen
               .replace(/-+/g, '-') // Replace multiple hyphens
               .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
               .substring(0, 100) || `sanitized-${Date.now()}`; // Ensure not empty after sanitization
}

// Simple slugify - replace spaces, remove non-alphanumeric, lowercase
export function slugify(text) {
    if (!text) return '';
    return text.toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except hyphen
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// --- AI/API Call Helper ---
// Handles calls to the Cloudflare function, which then handles retries
export async function callAI(action, payload, loadingIndicator = null, buttonToDisable = null) {
    const fullPayload = { action, ...payload };
    logToConsole(`Sending action '${action}' to backend...`, 'info');
    if (loadingIndicator) showLoading(loadingIndicator, true);
    if (buttonToDisable) disableElement(buttonToDisable, true);
    else disableActionButtons(true); // Disable general buttons if no specific one

    try {
        const response = await fetch(CLOUDFLARE_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullPayload)
        });

        const data = await response.json(); // Attempt to parse JSON regardless of status

        if (!response.ok || !data.success) {
            const errorMsg = data.error || `Request failed with status ${response.status}`;
            // Log specific errors if available
            if (response.status === 429) {
                logToConsole(`Rate limit hit during action '${action}'. Backend should handle retries.`, 'warn');
            } else if (response.status >= 500) {
                 logToConsole(`Server error (${response.status}) during action '${action}'. Backend should handle retries.`, 'warn');
            }
            throw new Error(errorMsg); // Throw error to be caught below
        }

        logToConsole(`Action '${action}' successful.`, 'success');
        return data; // Return the full success response

    } catch (error) {
        console.error(`Action '${action}' Failed:`, error);
        logToConsole(`Error during action '${action}': ${error.message}`, 'error');
        // Don't alert here, let the calling function decide how to handle UI
        // alert(`Operation Failed: ${error.message}. Check console log.`);
        return { success: false, error: error.message }; // Return error object
    } finally {
         if (loadingIndicator) showLoading(loadingIndicator, false);
         if (buttonToDisable) disableElement(buttonToDisable, false);
         else disableActionButtons(false); // Re-enable general buttons
    }
}

// --- Model Helpers ---
export function findCheapestModel(models = []) {
    const cheapKeywords = ['flash', 'mini', 'lite', 'fast', 'haiku', 'nano', '3.5-turbo'];
    for (const keyword of cheapKeywords) {
        const found = models.find(m => m.includes(keyword));
        if (found) return found;
    }
    return models[0] || ''; // Fallback
}

// --- Delay Helper ---
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


console.log("article-helpers.js loaded");