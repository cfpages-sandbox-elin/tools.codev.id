// article-helpers.js v8.24 (better info + add 400 error + numbering heading)
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
    const fullPayload = { action, ...payload };
    logToConsole(`Sending action '${action}' to backend...`, 'info');
    if (loadingIndicator) showLoading(loadingIndicator, true);
    if (buttonToDisable) disableElement(buttonToDisable, true); else disableActionButtons(true);
    try {
        const response = await fetch(CLOUDFLARE_FUNCTION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fullPayload) });
        const data = await response.json();
        if (!response.ok || !data.success) {
            const errorMsg = data.error || `Request failed with status ${response.status}`;
            
            if ([400, 401, 403, 429].includes(response.status)) {
                logToConsole(`Configuration issue for action '${action}': ${errorMsg}`, 'warn');
            } else if (response.status >= 500) { 
                logToConsole(`Server error (${response.status}) during action '${action}'.`, 'error'); 
            }
            
            const structuredError = new Error(errorMsg);
            structuredError.status = response.status;
            throw structuredError;
        }
        logToConsole(`Action '${action}' successful.`, 'success');
        return data;
    } catch (error) {
        console.warn(`Action '${action}' resulted in a handled error:`, error);
        
        if (![400, 401, 403, 429].includes(error.status) && !(error.message.includes('Server error'))) {
            logToConsole(`Error during action '${action}': ${error.message}`, 'error');
        }
        return { success: false, error: error.message, status: error.status };
    }
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
    logToConsole("Starting HTML parsing...", "info");
    const sections = [];
    let currentSection = null;

    // Use DOMParser to parse the HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Get the body element, as that's where most visible content resides
    const body = doc.body;

    if (!body) {
        logToConsole("HTML parsing failed: Could not find body element.", "error");
        return sections; // Return empty sections if no body
    }

    // Traverse the DOM tree to extract text and identify inline tags
    traverseNodes(body);

    logToConsole(`Finished HTML parsing. Found ${sections.length} sections.`, "info");
    return sections;

    function traverseNodes(node) {
        // Skip script and style elements
        if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') {
            return;
        }

        // If it's a text node, process its content
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                // Need to find the closest block-level parent to determine context
                let parentElement = node.parentElement;
                while(parentElement && !isBlockLevelElement(parentElement)) {
                    parentElement = parentElement.parentElement;
                }

                if (parentElement) {
                     // Process sentences within this text node, considering its parent element context
                     processTextNodeContent(text, parentElement);
                } else {
                     // Handle text nodes without a block-level parent (less common)
                     logToConsole(`HTML Parsing: Found text node without block-level parent: "${text.substring(0, 50)}..."`, "warn");
                     // Maybe add to a default section?
                     if (!sections[0] || sections[0].heading !== 'Introduction') {
                          sections.unshift({ heading: 'Introduction', points: [] });
                     }
                      sections[0].points.push({ text: text, inlineSyntax: [] }); // Simplified for now
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // If it's an element node, check if it's a heading or other block-level element
            const tagName = node.tagName.toLowerCase();

            if (tagName.startsWith('h') && tagName.length === 2 && parseInt(tagName[1]) >= 1 && parseInt(tagName[1]) <= 6) {
                // Found a heading
                const headingText = node.textContent.trim();
                if (headingText) {
                    // Push previous section if exists
                    if (currentSection) {
                        sections.push(currentSection);
                    }
                    // Start new section
                    currentSection = { heading: headingText, points: [] };
                    logToConsole(`HTML Parsing: Found Heading: "${headingText}"`, "debug");
                }
                 // Continue traversing children of headings as they might contain inline elements
                 for (const childNode of node.childNodes) {
                     traverseNodes(childNode);
                 }

            } else if (isBlockLevelElement(node)) {
                 // Found another block-level element (like p, div, li, etc.)
                 // We'll process its children to find text nodes and inline elements.

                // If it's a list item, treat it as a point
                if (tagName === 'li') {
                     const pointText = node.textContent.trim();
                     if (pointText) {
                         const { cleanText, inlineSyntax } = extractInlineTags(node); // Pass the node to extract inline tags within it
                         if (currentSection) {
                             currentSection.points.push({ text: cleanText, inlineSyntax: inlineSyntax });
                             logToConsole(`HTML Parsing: Found List Item Point: "${cleanText.substring(0, 100)}..."`, "debug");
                         } else {
                             // Handle list items before a heading
                              if (!sections[0] || sections[0].heading !== 'Introduction') {
                                  sections.unshift({ heading: 'Introduction', points: [] });
                             }
                             sections[0].points.push({ text: cleanText, inlineSyntax: inlineSyntax });
                              logToConsole(`HTML Parsing: Found Introductory List Item Point: "${cleanText.substring(0, 100)}..."`, "debug");
                         }
                     }
                      // Don't traverse children for list items as we've processed the whole item's text content
                      return;
                } else if (tagName === 'p') {
                    // Handle paragraph content
                     const paragraphText = node.textContent.trim();
                     if (paragraphText) {
                          const { cleanText, inlineSyntax } = extractInlineTags(node); // Pass the node to extract inline tags within it
                           if (currentSection) {
                               currentSection.points.push({ text: cleanText, inlineSyntax: inlineSyntax, type: 'paragraph' });
                                logToConsole(`HTML Parsing: Found Paragraph: "${cleanText.substring(0, 100)}..."`, "debug");
                           } else {
                                // Handle paragraphs before a heading
                                 if (!sections[0] || sections[0].heading !== 'Introduction') {
                                     sections.unshift({ heading: 'Introduction', points: [] });
                                }
                                sections[0].points.push({ text: cleanText, inlineSyntax: inlineSyntax, type: 'paragraph' });
                                logToConsole(`HTML Parsing: Found Introductory Paragraph: "${cleanText.substring(0, 100)}..."`, "debug");
                           }
                     }
                     // Don't traverse children for paragraphs as we've processed the whole paragraph text content
                     return;
                }

                 // For other block-level elements, continue traversing children
                 for (const childNode of node.childNodes) {
                     traverseNodes(childNode);
                 }

            } else {
                // Found an inline element or other non-block element
                // Continue traversing its children
                for (const childNode of node.childNodes) {
                    traverseNodes(childNode);
                }
            }
        }
    }

    function isBlockLevelElement(node) {
         if (node.nodeType !== Node.ELEMENT_NODE) return false;
         const tagName = node.tagName.toLowerCase();
         // Common block-level tags (this list can be expanded)
         const blockTags = ['address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 'main', 'nav', 'noscript', 'ol', 'p', 'pre', 'section', 'table', 'tfoot', 'ul', 'video'];
         return blockTags.includes(tagName);
    }

    // --- Helper function to process text content within a node ---
    // This function will be responsible for:
    // 1. Splitting the text into sentences.
    // 2. Identifying and extracting inline tags within the sentence context.
    // 3. Creating sentence objects with clean text and inline syntax information.
    // 4. Adding these sentence objects as points to the current section.
    function processTextNodeContent(text, parentElement) {
         // This is a placeholder for now. We'll implement the sentence splitting
         // and inline tag extraction logic here, adapting it for HTML.

         // For now, just add the whole text as a point
         // Need to rethink how to get inline syntax for just this text node accurately.
         // The extractInlineTags function currently works on a node's entire content.
         if (currentSection) {
             // This is not quite right, as extractInlineTags will get tags from the whole parent.
             // We need to find a way to relate the text node to its inline tag ancestors and siblings.
             currentSection.points.push({ text: text, inlineSyntax: [] }); // Simplified
              logToConsole(`HTML Parsing: Added Text Node Content (simplified): "${text.substring(0, 100)}..."`, "debug");

         } else {
             // Handle text nodes before a heading
              if (!sections[0] || sections[0].heading !== 'Introduction') {
                  sections.unshift({ heading: 'Introduction', points: [] });
             }
              sections[0].points.push({ text: text, inlineSyntax: [] }); // Simplified
              logToConsole(`HTML Parsing: Added Introductory Text Node Content (simplified): "${text.substring(0, 100)}..."`, "debug");
         }

    }

    // --- Helper function to extract inline HTML tags ---
    // This function will traverse the children of a node and identify inline tags
    // within the text content, storing their tag name, content, and position.
    function extractInlineTags(node) {
        const inlineSyntax = [];
        let cleanText = '';
        let textIndex = 0;

        function traverseForInline(currentNode) {
             if (currentNode.nodeType === Node.TEXT_NODE) {
                 const text = currentNode.textContent;
                 cleanText += text;
                 // This is a simplified approach to position.
                 // A more robust approach would track the position within the *original* text stream
                 // or within the parent element's text content.
                 textIndex += text.length; // Update index for clean text
             } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
                 const tagName = currentNode.tagName.toLowerCase();
                 // Check if it's an inline element and not a block element within inline traversal
                 if (isInlineElement(currentNode)) {
                      // Store inline tag information
                      inlineSyntax.push({
                          type: tagName, // Use tag name as type
                          content: currentNode.textContent, // Content within the tag
                          // Placeholder index: This needs to be accurately calculated
                          // based on the position within the flattened text content.
                          index: textIndex // Using the index *before* processing the content of this inline tag
                      });
                     // Recursively traverse children of inline elements to get their text content
                     for (const childNode of currentNode.childNodes) {
                          traverseForInline(childNode);
                     }
                 } else {
                     // If it's a block-level element within the traversal of a potentially inline context,
                     // it indicates a boundary, stop traversing this branch for inline tags.
                     return;
                 }
             }
        }

        traverseForInline(node);

         // Sort inline syntax by index (placeholder index for now)
         // Once accurate indices are implemented, this will ensure correct order.
        inlineSyntax.sort((a, b) => a.index - b.index);

         // Note: Returning cleanText correctly with accurate inline positions is complex
         // and might require building the clean text and tracking positions simultaneously
         // during the traversal. For now, we're focusing on extracting the syntax.

        return { cleanText: node.textContent.trim(), inlineSyntax: inlineSyntax }; // Simplified cleanText for now
    }

     function isInlineElement(node) {
          if (node.nodeType !== Node.ELEMENT_NODE) return false;
          const tagName = node.tagName.toLowerCase();
          // Common inline-level tags (this list can be expanded)
          const inlineTags = ['a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'button', 'cite', 'code', 'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'map', 'object', 'q', 'samp', 'script', 'select', 'small', 'span', 'strong', 'sub', 'sup', 'textarea', 'time', 'tt', 'var'];
          return inlineTags.includes(tagName);
     }
}

// --- *** V2 Markdown Parser - Grouping Logic *** ---
function parseMarkdownStructureV2(markdownString) {
    logToConsole("Starting Markdown parsing V2...", "info");
    const lines = markdownString.split('\n');
    const sections = [];
    let currentSection = null;
    let paragraphBuffer = [];

    const primaryHeadingRegex = /^(?:(#{1,4})\s+(.*)|(\s*[-*]\s*\*\*)(.*?)(\*\*)|(\d+\.\s+)(.*))/;
    const pointRegex = /^(\s+)([-*]|\d+\.|[a-zA-Z]\.|[IVXLCDM]+\.)\s+(.*)/;
    const inlineSyntaxRegex = /(\*\*[^\*]+\*\*)|(__[^_]+__)|(\*[^\*]+\*)|(_[^_]+_)|(`[^`]+`)|(\[(.+?)\]\((.+?)\))/g;

    lines.forEach(line => {
        const trimmedLine = line.trim();

        if (trimmedLine.length === 0) {
            if (paragraphBuffer.length > 0) {
                processParagraphBuffer();
            }
            return;
        }

        let primaryMatch = line.match(primaryHeadingRegex);

        if (primaryMatch) {
            if (paragraphBuffer.length > 0) {
                processParagraphBuffer();
            }

            const headingText = (primaryMatch[2] || primaryMatch[4] || primaryMatch[7])?.trim();

            if (headingText && headingText.length > 1) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = { heading: headingText, points: [] };
                logToConsole(`Markdown V2: Found Heading: "${headingText}"`, "debug");
            }
            return;
        }

        let pointMatch = line.match(pointRegex);
        if (pointMatch) {
             if (paragraphBuffer.length > 0) {
                 processParagraphBuffer();
             }

            if (currentSection) {
                const pointText = pointMatch[3].trim();
                 if (pointText) {
                     const { cleanText, inlineSyntax } = extractInlineSyntax(pointText);
                     currentSection.points.push({ text: cleanText, inlineSyntax: inlineSyntax });
                     logToConsole(`Markdown V2: Found Point: "${cleanText}"`, "debug");
                 }
            } else {
                 logToConsole(`Markdown V2: Found Point before first heading: "${trimmedLine}"`, "warn");
                 if (!sections[0] || sections[0].heading !== 'Introduction') {
                      sections.unshift({ heading: 'Introduction', points: [] });
                 }
                 const pointText = pointMatch[3].trim();
                  if (pointText) {
                      const { cleanText, inlineSyntax } = extractInlineSyntax(pointText);
                      sections[0].points.push({ text: cleanText, inlineSyntax: inlineSyntax });
                  }
            }
            return;
        }

        paragraphBuffer.push(line);
    });

    if (paragraphBuffer.length > 0) {
        processParagraphBuffer();
    }

    if (currentSection) {
        sections.push(currentSection);
    }

     logToConsole(`Finished Markdown parsing V2. Found ${sections.length} sections.`, "info");
    return sections;

    // --- Helper functions (processParagraphBuffer, extractInlineSyntax) remain unchanged ---
    function processParagraphBuffer() {
        const paragraphText = paragraphBuffer.join('\n').trim();
        if (paragraphText) {
            const { cleanText, inlineSyntax } = extractInlineSyntax(paragraphText);
            if (currentSection) {
                 currentSection.points.push({ text: cleanText, inlineSyntax: inlineSyntax, type: 'paragraph' });
                 logToConsole(`Markdown V2: Added Paragraph to section "${currentSection.heading}": "${cleanText.substring(0, 100)}..."`, "debug");
            } else {
                if (!sections[0] || sections[0].heading !== 'Introduction') {
                     sections.unshift({ heading: 'Introduction', points: [] });
                }
                sections[0].points.push({ text: cleanText, inlineSyntax: inlineSyntax, type: 'paragraph' });
                logToConsole(`Markdown V2: Added Introductory Paragraph: "${cleanText.substring(0, 100)}..."`, "debug");
            }
        }
        paragraphBuffer = [];
    }

    function extractInlineSyntax(text) {
        const inlineSyntax = [];
        let cleanText = text;
        let match;
        while ((match = inlineSyntaxRegex.exec(text)) !== null) {
            const fullMatch = match[0];
            const index = match.index;
            let type = 'unknown';
            let content = fullMatch;
            if (match[1] || match[2]) {
                type = 'bold';
                content = fullMatch.replace(/\*\*/g, '').replace(/__/g, '');
            } else if (match[3] || match[4]) {
                type = 'italic';
                 content = fullMatch.replace(/\*/g, '').replace(/_/g, '');
            } else if (match[5]) {
                type = 'code';
                 content = fullMatch.replace(/`/g, '');
            } else if (match[6]) {
                type = 'link';
                content = match[7];
                inlineSyntax.push({
                     type: 'link-url',
                     content: match[8],
                     index: index + match[0].indexOf('(') + 1
                });
            }
             inlineSyntax.push({ type: type, content: content, index: index });
        }
        cleanText = text
            .replace(/\*\*/g, '')
            .replace(/__/g, '')
            .replace(/\*/g, '')
            .replace(/_/g, '')
            .replace(/`/g, '');
         cleanText = cleanText.replace(/\[(.+?)\]\((.+?)\)/g, '$1');
        inlineSyntax.sort((a, b) => a.index - b.index);
        return { cleanText, inlineSyntax };
    }
}

console.log("article-helpers.js v8.15 better html parser.");