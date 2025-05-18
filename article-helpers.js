// article-helpers.js v8.14 (better md parser)
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
async function fetchWithRetry(url, options) { console.warn("Using dummy fetchWithRetry"); return fetch(url, options); } // Dummy

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
export function getArticleOutlinesV2(structureText) {
    if (!structureText) return [];
    logToConsole("Parsing structure V2 (grouping enabled)...", "info");

    // Simple detection: check for common HTML tags
    const isHtmlLikely = /<[a-z][\s\S]*>/i.test(structureText) && (structureText.includes('<h') || structureText.includes('<li') || structureText.includes('<p>'));

    let outlines = [];
    if (isHtmlLikely) {
        logToConsole("Detected HTML-like structure. Using DOM parser V2.", "debug");
        outlines = parseHtmlStructureV2(structureText);
    } else {
        logToConsole("Detected Markdown-like structure. Using Regex parser V2.", "debug");
        outlines = parseMarkdownStructureV2(structureText);
    }

    logToConsole(`Finished parsing V2. Found ${outlines.length} primary outline sections.`, "info");
    if (outlines.length === 0) {
         logToConsole("Warning: No primary outlines parsed V2. Generation might use raw text or fail.", "warn");
    } else if (outlines.length > 15) { // Add a sanity check
        logToConsole(`Warning: Parsed ${outlines.length} primary sections. Structure might be too granular.`, "warn");
    }
    // Returns array of objects: [{ heading: "...", points: ["...", "..."] }, ...]
    return outlines;
}

// --- *** V2 HTML Parser - Grouping Logic *** ---
function parseHtmlStructureV2(htmlString) {
    const sections = [];
    let currentSection = null;

    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

        // Iterate through direct children or relevant tags
        // Querying all and then processing might be easier to handle nesting
        const nodes = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, ul, ol, li, p'); // Include p for potential points

        nodes.forEach(node => {
            const tagName = node.tagName.toLowerCase();
            const text = node.textContent?.trim();
            if (!text) return; // Skip empty nodes

            // Check if it's a primary heading tag (adjust levels as needed)
            if (['h1', 'h2', 'h3'].includes(tagName)) {
                // If a section was already open, push it
                if (currentSection) {
                    sections.push(currentSection);
                }
                // Start new section
                currentSection = { heading: text, points: [] };
                 logToConsole(`V2 HTML Parser: New Section - Heading: "${text}"`, "debug");
            }
            // Check if it's a list item and a section is active
            else if (tagName === 'li' && currentSection) {
                 let pointText = text.replace(/^(\d+\.|[a-zA-Z]\.|[IVXLCDM]+\.|\*|-)\s*/, '').trim(); // Clean list marker
                 if (pointText.length > 3) {
                     currentSection.points.push(pointText);
                     logToConsole(`V2 HTML Parser: Added Point - "${pointText}"`, "debug");
                 }
            }
             // Consider paragraphs as points if they follow a heading closely? (More complex)
             // else if (tagName === 'p' && currentSection && currentSection.points.length === 0) {
             //    // Maybe add if it seems like descriptive text for the heading? Heuristic needed.
             // }
        });

        // Push the last section if it exists
        if (currentSection) {
            sections.push(currentSection);
        }

    } catch (error) {
        logToConsole(`Error parsing HTML structure V2: ${error.message}.`, "error");
        // No reliable fallback for grouped parsing if HTML is broken
    }
    return sections;
}


// --- *** V2 Markdown Parser - Grouping Logic *** ---
function parseMarkdownStructureV2(markdownString) {
    logToConsole("Starting Markdown parsing V2...", "info");
    const lines = markdownString.split('\n');
    const sections = [];
    let currentSection = null;
    let paragraphBuffer = []; // To accumulate lines of a paragraph

    // Regex for primary headings (Markdown # or Bolded List Item like "- **I. ...**")
    const primaryHeadingRegex = /^(?:(#{1,4})\s+(.*)|(\s*[-*]\s*\*\*)(.*?)(\*\*))/;
    // Regex for secondary points (indented list items)
    const pointRegex = /^(\s+)([-*]|\d+\.|[a-zA-Z]\.|[IVXLCDM]+\.)\s+(.*)/;

    // Regex for inline syntax
    const inlineSyntaxRegex = /(\*\*[^\*]+\*\*)|(__[^_]+__)|(\*[^\*]+\*)|(_[^_]+_)|(`[^`]+`)|(\[(.+?)\]\((.+?)\))/g;

    lines.forEach(line => {
        const trimmedLine = line.trim();

        if (trimmedLine.length === 0) {
            // An empty line often indicates a paragraph break
            if (paragraphBuffer.length > 0) {
                processParagraphBuffer();
            }
            return;
        }

        let primaryMatch = line.match(primaryHeadingRegex);

        if (primaryMatch) {
            // Process any pending paragraph buffer before starting a new section
            if (paragraphBuffer.length > 0) {
                processParagraphBuffer();
            }

            // Extract heading text (group 2 for #, group 4 for bolded list)
            const headingText = (primaryMatch[2] || primaryMatch[4])?.trim();

            if (headingText && headingText.length > 1) { // Basic validation
                // Push previous section if exists
                if (currentSection) {
                    sections.push(currentSection);
                }
                // Start new section
                currentSection = { heading: headingText, points: [] };
                logToConsole(`Markdown V2: Found Heading: "${headingText}"`, "debug");
            }
            return; // This line was a heading, move to the next
        }

        let pointMatch = line.match(pointRegex);
        if (pointMatch) {
             // Process any pending paragraph buffer before adding a point
             if (paragraphBuffer.length > 0) {
                 processParagraphBuffer();
             }

            if (currentSection) {
                const pointText = pointMatch[3].trim();
                 if (pointText) {
                     // Extract inline syntax from the point text
                     const { cleanText, inlineSyntax } = extractInlineSyntax(pointText);
                     currentSection.points.push({ text: cleanText, inlineSyntax: inlineSyntax });
                     logToConsole(`Markdown V2: Found Point: "${cleanText}"`, "debug");
                 }
            } else {
                 // Handle points before any heading (e.g., initial list) - maybe treat as a section?
                 // For now, log a warning or add to a default section if needed.
                 logToConsole(`Markdown V2: Found Point before first heading: "${trimmedLine}"`, "warn");
                 // Optionally add to a default "Introduction" section or similar
                 if (!sections[0] || sections[0].heading !== 'Introduction') {
                      sections.unshift({ heading: 'Introduction', points: [] });
                 }
                 const pointText = pointMatch[3].trim();
                  if (pointText) {
                      const { cleanText, inlineSyntax } = extractInlineSyntax(pointText);
                      sections[0].points.push({ text: cleanText, inlineSyntax: inlineSyntax });
                  }
            }
            return; // This line was a point, move to the next
        }

        // If the line is not a heading or a point, consider it part of a paragraph
        paragraphBuffer.push(line);
    });

    // Process any remaining paragraph buffer after the loop
    if (paragraphBuffer.length > 0) {
        processParagraphBuffer();
    }

    // Push the last section if it exists
    if (currentSection) {
        sections.push(currentSection);
    }

     logToConsole(`Finished Markdown parsing V2. Found ${sections.length} sections.`, "info");
    return sections;

    // --- Helper function to process accumulated paragraph lines ---
    function processParagraphBuffer() {
        const paragraphText = paragraphBuffer.join('\n').trim();
        if (paragraphText) {
            // Extract inline syntax from the paragraph text
            const { cleanText, inlineSyntax } = extractInlineSyntax(paragraphText);

            // Decide where to add the paragraph.
            // If there's a current section, add it as a point (or a special paragraph type?)
            // For now, let's add paragraphs as points to the current section if one exists.
            // If no current section, it's an introductory paragraph.
            if (currentSection) {
                 currentSection.points.push({ text: cleanText, inlineSyntax: inlineSyntax, type: 'paragraph' }); // Added type for clarity
                 logToConsole(`Markdown V2: Added Paragraph to section "${currentSection.heading}": "${cleanText.substring(0, 100)}..."`, "debug");
            } else {
                // Add to a default "Introduction" section if it doesn't exist
                if (!sections[0] || sections[0].heading !== 'Introduction') {
                     sections.unshift({ heading: 'Introduction', points: [] });
                }
                sections[0].points.push({ text: cleanText, inlineSyntax: inlineSyntax, type: 'paragraph' });
                logToConsole(`Markdown V2: Added Introductory Paragraph: "${cleanText.substring(0, 100)}..."`, "debug");
            }
        }
        paragraphBuffer = []; // Clear the buffer
    }

    // --- Helper function to extract inline syntax ---
    function extractInlineSyntax(text) {
        const inlineSyntax = [];
        let cleanText = text;
        let match;

        // Use a loop with exec() to find all matches
        while ((match = inlineSyntaxRegex.exec(text)) !== null) {
            const fullMatch = match[0];
            const index = match.index;

            // Determine the type of syntax and the text it applies to
            let type = 'unknown';
            let content = fullMatch; // Default to the full match

            if (match[1] || match[2]) { // Bold
                type = 'bold';
                content = fullMatch.replace(/\*\*/g, '').replace(/__/g, '');
            } else if (match[3] || match[4]) { // Italic
                type = 'italic';
                 content = fullMatch.replace(/\*/g, '').replace(/_/g, '');
            } else if (match[5]) { // Code span
                type = 'code';
                 content = fullMatch.replace(/`/g, '');
            } else if (match[6]) { // Link [text](url)
                type = 'link';
                content = match[7]; // The link text
                inlineSyntax.push({
                     type: 'link-url',
                     content: match[8], // The URL
                     index: index + match[0].indexOf('(') + 1 // Position of the URL
                });
            }

             inlineSyntax.push({
                 type: type,
                 content: content,
                 index: index
             });
        }

        // Create clean text by removing the syntax markers (This is a simplified approach)
        // A more robust approach would be to build the clean text character by character,
        // skipping the syntax markers, to handle nested syntax correctly.
        // For now, let's do a simple regex replacement for common markers.
        cleanText = text
            .replace(/\*\*/g, '') // Remove bold markers
            .replace(/__/g, '')
            .replace(/\*/g, '')  // Remove italic markers
            .replace(/_/g, '')
            .replace(/`/g, '');  // Remove code span markers
         // Simple link syntax removal - might need refinement for complex cases
         cleanText = cleanText.replace(/\[(.+?)\]\((.+?)\)/g, '$1');


        // Sort inline syntax by index for easier reapplication later
        inlineSyntax.sort((a, b) => a.index - b.index);


        return { cleanText, inlineSyntax };
    }

}

console.log("article-helpers.js v8.14 better md parser.");