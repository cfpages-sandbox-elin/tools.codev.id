// article-helpers.js v8.13 (better outline parser)
import { CLOUDFLARE_FUNCTION_URL } from './article-config.js';

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
    // ... (implementation same as before) ...
    const fullPayload = { action, ...payload };
    logToConsole(`Sending action '${action}' to backend...`, 'info');
    if (loadingIndicator) showLoading(loadingIndicator, true);
    if (buttonToDisable) disableElement(buttonToDisable, true); else disableActionButtons(true);
    try {
        const response = await fetch(CLOUDFLARE_FUNCTION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fullPayload) });
        const data = await response.json();
        if (!response.ok || !data.success) { const errorMsg = data.error || `Request failed with status ${response.status}`; if (response.status === 429) logToConsole(`Rate limit hit during action '${action}'.`, 'warn'); else if (response.status >= 500) logToConsole(`Server error (${response.status}) during action '${action}'.`, 'warn'); throw new Error(errorMsg); }
        logToConsole(`Action '${action}' successful.`, 'success');
        return data;
    } catch (error) { console.error(`Action '${action}' Failed:`, error); logToConsole(`Error during action '${action}': ${error.message}`, 'error'); return { success: false, error: error.message }; }
    finally { if (loadingIndicator) showLoading(loadingIndicator, false); if (buttonToDisable) disableElement(buttonToDisable, false); else disableActionButtons(false); }
}

// --- Model Helpers ---
export function findCheapestModel(models = []) {
    if (!models?.length) return ''; // Handle empty/null/undefined array

    const cheapKeywords = ['flash', 'mini', 'lite', 'fast', 'haiku', 'nano', '3.5-turbo'];
    // Helper to count keywords in a name string
    const countKeywords = (name) => cheapKeywords.filter(kw => name.includes(kw)).length;

    // Use reduce to find the model with the highest keyword count
    return models.reduce((bestModel, currentModel) => {
        // Compare scores: current vs the best found so far
        return countKeywords(currentModel) > countKeywords(bestModel)
            ? currentModel  // New best found
            : bestModel;    // Keep existing best (handles ties by preferring earlier)
    }, models[0]); // Start comparison with the first model as the initial best
}

// --- Image Prompt Construction ---
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

// --- Sitemap Fetching ---
// ***** FIX: Removed direct UI/State calls, now just returns result or throws error *****
export async function fetchAndParseSitemap(sitemapUrl) {
    // This function now only handles the backend call
    // The caller (in article-main.js) will handle UI updates and state management

    if (!sitemapUrl) {
        throw new Error('Sitemap URL is required.'); // Throw error instead of alerting
    }

    // No need for UI element access here anymore
    // logToConsole(`Fetching sitemap from URL: ${sitemapUrl}`, 'info'); // Logging done by caller

    try {
        // Call the backend function using callAI helper
        const result = await callAI('fetch_sitemap', { sitemapUrl: sitemapUrl }, null, null); // No specific UI elements needed here

        if (!result?.success) {
            throw new Error(result?.error || 'Failed to fetch/parse sitemap from backend');
        }

        // Return the successfully parsed URLs
        return result.urls || [];

    } catch (error) {
        console.error("Sitemap Fetch/Parse Helper Failed:", error);
        // Re-throw the error so the caller can handle it
        throw error;
    }
    // No finally block needed here for UI elements
}


// --- Delay Helper ---
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Outline Parser ---
export function getArticleOutlines(structureText) {
    if (!structureText) return [];
    logToConsole("Parsing article structure for outlines...", "info");

    // Simple detection: check for common HTML tags
    const isHtmlLikely = /<[a-z][\s\S]*>/i.test(structureText) && (structureText.includes('<h') || structureText.includes('<li') || structureText.includes('<p>'));

    let outlines = [];
    if (isHtmlLikely) {
        logToConsole("Detected HTML-like structure. Using DOM parser.", "debug");
        outlines = parseHtmlStructure(structureText);
    } else {
        logToConsole("Detected Markdown-like structure. Using Regex parser.", "debug");
        outlines = parseMarkdownStructure(structureText);
    }

    logToConsole(`Finished parsing. Found ${outlines.length} outlines.`, "info");
    if (outlines.length === 0) {
         logToConsole("Warning: No outlines were parsed from the structure text. Article generation might fail.", "warn");
    }
    return outlines;
}

// --- *** NEW: HTML Structure Parser *** ---
function parseHtmlStructure(htmlString) {
    const outlines = [];
    try {
        // Create a temporary container element (doesn't need to be added to DOM)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

        // Select potential heading and list item elements
        // Prioritize headings, then list items if headings are sparse? Or just combine? Let's combine for now.
        const nodes = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, li');

        nodes.forEach(node => {
            // Get text content, which strips inner tags
            let potentialOutline = node.textContent?.trim();

            // Clean and Add if valid
            if (potentialOutline) {
                // Remove potential list numbers/bullets if they are part of textContent
                potentialOutline = potentialOutline.replace(/^(\d+\.|[a-zA-Z]\.|[IVXLCDM]+\.|\*|-)\s*/, '').trim();
                // Further filter out very short lines or lines that look like comments/instructions
                if (potentialOutline.length > 3 && !potentialOutline.startsWith('(')) {
                   logToConsole(`Parsed HTML Outline: "${potentialOutline}"`, "debug");
                   outlines.push(potentialOutline);
                } else {
                    logToConsole(`Filtered out potential HTML outline: "${potentialOutline}"`, "debug");
                }
            }
        });
    } catch (error) {
        logToConsole(`Error parsing HTML structure: ${error.message}. Falling back to simple split.`, "error");
        // Fallback to basic line splitting if DOM parsing fails catastrophically
        return htmlString.split('\n').map(line => line.trim()).filter(line => line.length > 3);
    }
    return outlines;
}

// --- *** Markdown Structure Parser (from previous version) *** ---
function parseMarkdownStructure(markdownString) {
    const lines = markdownString.split('\n');
    const outlines = [];
    const headingRegex = /^(#{1,6})\s+(.*)/;
    const listRegex = /^(\s*)([-*]|\d+\.|[a-zA-Z]\.|[IVXLCDM]+\.)\s+(.*)/;
    const boldRegex = /^\s*\*\*(.*?)\*\*\s*$/;

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) return;

        let potentialOutline = null;
        let match = trimmedLine.match(headingRegex);
        if (match) { potentialOutline = match[2].trim(); }
        else {
            match = line.match(listRegex); // Use original line for list marker check
            if (match) { potentialOutline = match[3].trim(); }
            else {
                 match = trimmedLine.match(boldRegex);
                 if(match) { potentialOutline = match[1].trim(); }
            }
        }

        if (potentialOutline) {
             potentialOutline = potentialOutline.replace(/^\**|\**$/g, '').trim(); // Clean surrounding asterisks
             if (potentialOutline.length > 3 && !potentialOutline.startsWith('(')) {
                // logToConsole(`Parsed MD Outline: "${potentialOutline}"`, "debug"); // Already logged in main func
                outlines.push(potentialOutline);
             } else {
                 // logToConsole(`Filtered out potential MD outline: "${potentialOutline}"`, "debug");
             }
        }
    });
    return outlines;
}
// --- End Outline Parsers ---

console.log("article-helpers.js v8.13 loaded and functions exported.");