// article-spinner.js (v9 html json reliability upgrade)
import { getState, updateState } from './article-state.js';
import { logToConsole, callAI, delay, fetchAndParseSitemap, showLoading, disableElement, slugify, showElement } from './article-helpers.js';
import { getElement } from './article-ui.js';
import { languageOptions } from './article-config.js';
import { getSpintaxPrompt } from './article-prompts.js';

let selectedTextInfo = null;
let isSpinning = false;
let isPaused = false;
let stopSpinning = false;
let articleBlocks = [];
let variationColumnCount = 1; // Default 1 variation column

export function prepareSpinnerUI(htmlContent) {
    logToConsole("Parsing article for structural spinning...", "info");
    articleBlocks = [];
    variationColumnCount = 1; // Reset
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Iterate through top-level elements in body
    Array.from(doc.body.childNodes).forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const tagName = node.tagName.toLowerCase();
        const block = {
            type: tagName,
            startTag: `<${tagName}>`,
            endTag: `</${tagName}>`,
            segments: []
        };

        // Attributes (like class or id) should be preserved in startTag
        if (node.attributes.length > 0) {
            const attrs = Array.from(node.attributes).map(a => `${a.name}="${a.value}"`).join(' ');
            block.startTag = `<${tagName} ${attrs}>`;
        }

        if (['ul', 'ol'].includes(tagName)) {
            // List handling: Each LI is a segment
            Array.from(node.children).forEach(li => {
                if (li.tagName.toLowerCase() === 'li') {
                    block.segments.push({
                        original: li.innerHTML.trim(), // Keep inner HTML of LI (e.g. bolding)
                        variations: [''],
                        isListRequest: true // Marker for rendering
                    });
                }
            });
        } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            // Heading handling: Whole text is one segment
            block.segments.push({
                original: node.innerHTML.trim(),
                variations: ['']
            });
        } else {
            // Paragraph/Div handling: Split into sentences
            // Regex splits by punctuation (.?!) followed by space or end of string.
            // Keeps the delimiter in the result.
            const text = node.innerHTML.trim();
            // Complex split to keep delimiters attached to the preceding sentence
            const rawSentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
            
            rawSentences.forEach(s => {
                if(s.trim()) {
                    block.segments.push({
                        original: s.trim(),
                        variations: ['']
                    });
                }
            });
        }

        if (block.segments.length > 0) {
            articleBlocks.push(block);
        }
    });

    renderSpinnerGrid();
    logToConsole(`Parsed ${articleBlocks.length} blocks. Ready for spinning.`, "success");
}

function renderSpinnerGrid() {
    const container = getElement('spinnerContainer');
    container.innerHTML = '';

    articleBlocks.forEach((block, blockIndex) => {
        const blockDiv = document.createElement('div');
        blockDiv.className = 'spinner-block';

        // Start Tag visual
        const startTagDiv = document.createElement('div');
        startTagDiv.className = 'spinner-tag';
        startTagDiv.textContent = block.startTag;
        blockDiv.appendChild(startTagDiv);

        // Segments
        block.segments.forEach((segment, segIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'segment-row';

            // Column 1: Original (Read-only/Reference)
            const origContainer = createBox(segment.original, true, blockIndex, segIndex, -1);
            rowDiv.appendChild(origContainer);

            // Dynamic Variation Columns
            for (let i = 0; i < variationColumnCount; i++) {
                const val = segment.variations[i] || '';
                const varContainer = createBox(val, false, blockIndex, segIndex, i);
                rowDiv.appendChild(varContainer);
            }

            blockDiv.appendChild(rowDiv);
        });

        // End Tag visual
        const endTagDiv = document.createElement('div');
        endTagDiv.className = 'spinner-tag-end';
        endTagDiv.textContent = block.endTag;
        blockDiv.appendChild(endTagDiv);

        container.appendChild(blockDiv);
    });
}

function createBox(content, isOriginal, blockIndex, segIndex, varIndex) {
    const container = document.createElement('div');
    container.className = 'segment-box-container';

    // Prefix visual for lists
    let prefix = '';
    if (articleBlocks[blockIndex].type === 'ul') prefix = '• ';
    if (articleBlocks[blockIndex].type === 'ol') prefix = `${segIndex + 1}. `;

    const textarea = document.createElement('textarea');
    textarea.className = `segment-textarea ${isOriginal ? 'original' : 'variation'}`;
    textarea.value = content;
    
    if (isOriginal) {
        // If it's original, we might want to allow editing to fix splitting errors, 
        // but updating state needs to be handled. For now, let's allow edit.
        textarea.addEventListener('input', (e) => {
             articleBlocks[blockIndex].segments[segIndex].original = e.target.value;
        });
    } else {
        textarea.placeholder = "AI will generate here...";
        textarea.addEventListener('input', (e) => {
            // Ensure array index exists
            if (!articleBlocks[blockIndex].segments[segIndex].variations[varIndex]) {
                articleBlocks[blockIndex].segments[segIndex].variations[varIndex] = '';
            }
            articleBlocks[blockIndex].segments[segIndex].variations[varIndex] = e.target.value;
        });
    }

    // Actions Bar
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'segment-actions';

    // Token Count
    const tokenSpan = document.createElement('span');
    tokenSpan.className = 'token-count';
    tokenSpan.textContent = `~${Math.ceil(content.length / 4)} toks`;
    textarea.addEventListener('input', () => {
        tokenSpan.textContent = `~${Math.ceil(textarea.value.length / 4)} toks`;
    });

    actionsDiv.appendChild(tokenSpan);

    // Generate Button (Only for variations)
    if (!isOriginal) {
        const genBtn = document.createElement('button');
        genBtn.className = 'gen-btn';
        genBtn.innerHTML = content ? '🔄' : '⚡'; // Refresh if content exists, Bolt if empty
        genBtn.title = "Generate this variation";
        genBtn.onclick = () => generateSingleVariation(blockIndex, segIndex, varIndex, textarea, genBtn);
        actionsDiv.appendChild(genBtn);
    }

    container.appendChild(textarea);
    container.appendChild(actionsDiv);
    return container;
}

export function addVariationColumn() {
    variationColumnCount++;
    // Update data structure to ensure arrays are big enough
    articleBlocks.forEach(block => {
        block.segments.forEach(seg => {
            if (seg.variations.length < variationColumnCount) {
                seg.variations.push('');
            }
        });
    });
    renderSpinnerGrid(); // Re-render UI
}

export async function generateSingleVariation(blockIndex, segIndex, varIndex, textarea, btn) {
    const state = getState();
    const primaryProvider = state.textProviders[0];
    
    if (!primaryProvider || !primaryProvider.model) {
        alert("Please select an AI Model in the configuration section first.");
        return;
    }

    const originalText = articleBlocks[blockIndex].segments[segIndex].original;
    
    // Visual Feedback
    btn.textContent = '⏳';
    disableElement(btn, true);
    textarea.classList.add('opacity-50');

    try {
        // Construct a prompt specific to rewriting a single sentence/fragment
        const prompt = `Rewrite the following text in ${state.language} (${state.tone} tone). Keep the meaning but change words/structure. Output ONLY the rewritten text.
        
        Original: "${originalText}"`;

        const payload = {
            providerKey: primaryProvider.provider,
            model: primaryProvider.model,
            prompt: prompt
        };

        const result = await callAI('generate', payload);

        if (result?.success && result.text) {
            const newText = result.text.replace(/^"|"$/g, '').trim(); // Remove quotes if AI adds them
            textarea.value = newText;
            // Update State
            articleBlocks[blockIndex].segments[segIndex].variations[varIndex] = newText;
            
            // Trigger input event to update token count
            textarea.dispatchEvent(new Event('input'));
            
            btn.textContent = '🔄'; // Reset to refresh icon
        } else {
            btn.textContent = '❌';
        }
    } catch (e) {
        console.error(e);
        btn.textContent = '❌';
    } finally {
        disableElement(btn, false);
        textarea.classList.remove('opacity-50');
    }
}

export async function handleBulkGenerate() {
    const state = getState();
    const primaryProvider = state.textProviders[0];
    
    if (!primaryProvider) { alert("No AI provider."); return; }
    if (!confirm("This will generate variations for all empty boxes in the visible columns. Continue?")) return;

    const generateQueue = [];

    // Collect all empty variation slots
    articleBlocks.forEach((block, bIdx) => {
        block.segments.forEach((seg, sIdx) => {
            for (let vIdx = 0; vIdx < variationColumnCount; vIdx++) {
                if (!seg.variations[vIdx] || seg.variations[vIdx].trim() === '') {
                    generateQueue.push({ bIdx, sIdx, vIdx });
                }
            }
        });
    });

    logToConsole(`Bulk generating ${generateQueue.length} variations...`, 'info');

    // Process in chunks to avoid hitting rate limits instantly
    const CHUNK_SIZE = 5; 
    for (let i = 0; i < generateQueue.length; i += CHUNK_SIZE) {
        const chunk = generateQueue.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map(item => {
            // Find the DOM elements to update visual state
            // Note: This is a bit hacky, ideally we bind ID, but relying on re-render is expensive.
            // We will just call the logic function directly.
            // In a real app, we'd update state then re-render. 
            // To keep it simple, we trigger the button click logic programmatically if possible,
            // or just call the API helper.
            
            // Re-selecting the element for visual updates:
            const blocks = document.querySelectorAll('.spinner-block');
            const rows = blocks[item.bIdx].querySelectorAll('.segment-row');
            const containers = rows[item.sIdx].querySelectorAll('.segment-box-container');
            // Index 0 is Original, so Var 0 is Index 1
            const container = containers[item.vIdx + 1]; 
            const textarea = container.querySelector('textarea');
            const btn = container.querySelector('.gen-btn');

            return generateSingleVariation(item.bIdx, item.sIdx, item.vIdx, textarea, btn);
        });

        await Promise.all(promises);
        await delay(500); // Delay between chunks
    }
    logToConsole("Bulk generation complete.", 'success');
}

export function compileSpintax() {
    let finalSpintax = "";

    articleBlocks.forEach(block => {
        // Open Tag
        if (block.type === 'ul' || block.type === 'ol') {
            finalSpintax += block.startTag + '\n';
            block.segments.forEach(seg => {
                // For lists, the variations are the inner content of LI
                const vars = seg.variations.filter(v => v.trim() !== '');
                const spintax = vars.length > 0 
                    ? `{${seg.original}|${vars.join('|')}}` 
                    : seg.original;
                finalSpintax += `  <li>${spintax}</li>\n`;
            });
            finalSpintax += block.endTag + '\n\n';
        } else {
            // Normal Paragraphs / Headings
            finalSpintax += block.startTag; // e.g. <p>
            
            block.segments.forEach(seg => {
                const vars = seg.variations.filter(v => v.trim() !== '');
                const spintax = vars.length > 0 
                    ? `{${seg.original}|${vars.join('|')}}` 
                    : seg.original;
                // Add space after sentence, unless it's the last one (simplification)
                finalSpintax += spintax + " "; 
            });

            finalSpintax = finalSpintax.trim(); // Remove trailing space
            finalSpintax += block.endTag + '\n\n';
        }
    });

    const outputArea = getElement('finalSpintaxOutput');
    outputArea.value = finalSpintax;
    showElement(getElement('step5Section'), true);
    
    // Scroll to step 5
    getElement('step5Section').scrollIntoView({ behavior: 'smooth' });
}

function constructSpintax(originalText, variationsArray) {
    if (!Array.isArray(variationsArray) || variationsArray.length === 0) {
        return originalText; // Return original if AI response is invalid
    }
    // Filter out duplicates and the original text itself
    const uniqueVariations = [...new Set(variationsArray)].filter(v => v.trim() !== originalText.trim());
    const allOptions = [originalText.trim(), ...uniqueVariations];
    return `{${allOptions.join('|')}}`;
}

async function callAISafe(textToSpin, providerConfig) {
    const prompt = getSpintaxPrompt(textToSpin);
    const payload = {
        providerKey: providerConfig.provider,
        model: providerConfig.model,
        prompt: prompt
    };

    const result = await callAI('generate', payload, null, null);

    if (result?.success && result.text) {
        try {
            // Attempt to find a JSON array within the response
            const jsonMatch = result.text.match(/\[.*\]/s);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return constructSpintax(textToSpin, parsed);
            }
            throw new Error("No JSON array found in AI response.");
        } catch (e) {
            logToConsole(`Failed to parse JSON from AI, falling back. Error: ${e.message}`, 'warn');
            return textToSpin; // Fallback to original text if JSON parsing fails
        }
    }
    logToConsole(`AI spinning failed for text. Appending original: "${textToSpin}"`, 'error');
    return textToSpin; // Fallback for failed AI call
}

// --- Automatic Article Spinning ---
export async function handleSpinArticle(generatedTextarea, spunDisplay) {
    logToConsole("Starting HTML-aware article spinning...", "info");
    isSpinning = true; isPaused = false; stopSpinning = false;

    const state = getState();
    const primaryProvider = state.textProviders[0];
    if (!primaryProvider || !primaryProvider.provider || !primaryProvider.model) {
        alert("Please configure a valid AI Provider and select a model before spinning.");
        logToConsole("Spinning failed: No primary provider configured.", "error");
        return;
    }

    const articleHtml = generatedTextarea.value;
    spunDisplay.innerHTML = ''; // Clear display

    const loadingIndicator = getElement('spinActionLoadingIndicator');
    const spinArticleBtn = getElement('enableSpinningBtn');
    const pauseSpinBtn = getElement('pauseSpinBtn');
    const stopSpinBtn = getElement('stopSpinBtn');

    disableElement(spinArticleBtn, true);
    disableElement(pauseSpinBtn, false);
    disableElement(stopSpinBtn, false);
    showLoading(loadingIndicator, true);

    // Use DOMParser to safely handle HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(articleHtml, 'text/html');
    const allNodes = doc.body.querySelectorAll('*'); // Get all elements

    // Process nodes sequentially to update the display progressively
    for (const node of allNodes) {
        // Find text nodes that are direct children of the current element
        const childTextNodes = Array.from(node.childNodes).filter(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0);

        for (const textNode of childTextNodes) {
            if (stopSpinning) break;
            await checkPause(); // Handle pause/resume
            if (stopSpinning) break;

            const originalText = textNode.textContent;
            const parentTag = node.tagName.toLowerCase();
            const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(parentTag);

            if (isHeading) {
                // For headings, spin the entire text content as one block
                const spintaxResult = await callAISafe(originalText.trim(), primaryProvider);
                textNode.textContent = spintaxResult;
            } else {
                // For other elements, split text into sentences
                const sentences = originalText.match(/([^\.!\?]+[\.!\?]+)|([^\.!\?]+$)/g) || [];
                let newTextContent = '';
                for (const sentence of sentences) {
                    const trimmedSentence = sentence.trim();
                    if (!trimmedSentence) continue;

                    const punctuationMatch = trimmedSentence.match(/[\.!\?]+$/);
                    const punctuation = punctuationMatch ? punctuationMatch[0] : '';
                    const sentenceToSpin = trimmedSentence.replace(/[\.!\?]+$/, '').trim();

                    if (sentenceToSpin) {
                        const spintaxResult = await callAISafe(sentenceToSpin, primaryProvider);
                        newTextContent += spintaxResult + punctuation + ' ';
                    } else {
                        newTextContent += punctuation + ' '; // Append only punctuation if that's all there was
                    }
                    spunDisplay.innerHTML = doc.body.innerHTML; // Update UI progressively
                    await delay(50);
                }
                textNode.textContent = newTextContent;
            }
            spunDisplay.innerHTML = doc.body.innerHTML; // Update UI after processing a text node
        }
        if (stopSpinning) break;
    }

    spunDisplay.innerHTML = doc.body.innerHTML; // Final update
    finishSpinning(spinArticleBtn, pauseSpinBtn, stopSpinBtn, loadingIndicator, spunDisplay);
}

function finishSpinning(spinBtn, pauseBtn, stopBtn, loader, display) {
    isSpinning = false;
    isPaused = false;
    stopSpinning = false;

    disableElement(spinBtn, false);
    disableElement(pauseBtn, true);
    disableElement(stopBtn, true);
    showLoading(loader, false);
    logToConsole("Automatic article spinning finished.", "info");
    highlightSpintax(display);
}

// --- Spintax Highlighting ---
export function highlightSpintax(element) {
    if (!element) return;
    // Clear previous highlighting spans first
    element.querySelectorAll('.spintax-level-1, .spintax-level-2, .spintax-level-3, .spintax-pipe').forEach(el => {
        if (el.parentNode) { // Check if element is still in DOM
             el.outerHTML = el.innerHTML; // Replace span with its content
        }
    });

    let html = element.innerHTML;
    // Temporarily replace HTML tags to avoid messing them up
    const tagMap = {};
    let tagIndex = 0;
    html = html.replace(/<[^>]+>/g, (match) => {
        const placeholder = `__TAG${tagIndex}__`;
        tagMap[placeholder] = match;
        tagIndex++;
        return placeholder;
    });

    // Replace pipes first
    html = html.replace(/\|/g, '<span class="spintax-pipe">|</span>');

    let level = 0;
    let coloredHtml = '';
    for (let i = 0; i < html.length; i++) {
        if (html[i] === '{') {
            level++;
            const colorClass = `spintax-level-${level % 3 + 1}`;
            coloredHtml += `<span class="${colorClass}">{</span>`;
        } else if (html[i] === '}') {
             if (level > 0) {
                 const colorClass = `spintax-level-${level % 3 + 1}`;
                 coloredHtml += `<span class="${colorClass}">}</span>`;
                 level--;
             } else {
                 coloredHtml += '}'; // Avoid closing unopened spans
             }
        } else {
            coloredHtml += html[i];
        }
    }

     // Restore HTML tags
    coloredHtml = coloredHtml.replace(/__TAG\d+__/g, (placeholder) => tagMap[placeholder] || placeholder);

    element.innerHTML = coloredHtml;
}

// --- Text Selection Handling ---
export function handleSelection() {
    const spunArticleDisplay = getElement('spunArticleDisplay');
    const spinSelectedBtn = getElement('spinSelectedBtn');
    if (!spunArticleDisplay || !spinSelectedBtn) return;

    const selection = window.getSelection();
    selectedTextInfo = null; // Reset selection info
    disableElement(spinSelectedBtn, true); // Disable button by default

    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // Ensure selection is within our editable div and not empty
        if (spunArticleDisplay.contains(range.commonAncestorContainer) && !range.collapsed) {
            const text = selection.toString().trim();
            if (text.length > 0) {
                selectedTextInfo = { text: text, range: range.cloneRange() }; // Store range
                disableElement(spinSelectedBtn, false); // Enable button
                // logToConsole(`Selected for spinning: "${text}"`, 'info'); // Optional: reduce logs
                return;
            }
        }
    }
}

// --- Spin Selected Text ---
export async function handleSpinSelectedText() {
    if (!selectedTextInfo || !selectedTextInfo.text) {
         logToConsole("Spin button clicked but no valid text found.", "warn");
         return;
    }
    const state = getState();
    const primaryProvider = state.textProviders[0];
    if (!primaryProvider || !primaryProvider.provider || !primaryProvider.model) {
        alert("Please configure a valid AI Provider and select a model before spinning.");
        logToConsole("Spinning failed: No primary provider configured.", "error");
        return;
    }
    const spinSelectedBtn = getElement('spinSelectedBtn');
    const spunArticleDisplay = getElement('spunArticleDisplay');
    const loadingIndicator = getElement('spinActionLoadingIndicator');

    const textToSpin = selectedTextInfo.text;
    const spintaxResult = await callAISafe(textToSpin, primaryProvider);

    const selection = window.getSelection();
    if (selection && selectedTextInfo.range) {
        try {
             selection.removeAllRanges();
             selection.addRange(selectedTextInfo.range);
             document.execCommand('insertHTML', false, spintaxResult);
             logToConsole(`Inserted spintax: ${spintaxResult}`, 'success');
             highlightSpintax(spunArticleDisplay);
        } catch (e) {
            logToConsole(`Error replacing selection with spintax: ${e}`, 'error');
        } finally {
             selectedTextInfo = null;
             disableElement(spinSelectedBtn, true);
             selection.removeAllRanges();
        }
    }
}

async function checkPause() {
    if (isPaused) {
        logToConsole("Spinning paused...", "info");
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (!isPaused || stopSpinning) {
                    clearInterval(interval);
                    if (!stopSpinning) logToConsole("Spinning resumed.", "info");
                    resolve();
                }
            }, 100);
        });
    }
}

// --- Pause Spinning ---
export function pauseSpinning() {
    const pauseSpinBtn = getElement('pauseSpinBtn');
    if (isSpinning && !isPaused) {
        isPaused = true;
        logToConsole("Spinning paused.", "info");
        if(pauseSpinBtn) {
            pauseSpinBtn.textContent = 'Resume Spinning';
        }
    } else if (isSpinning && isPaused) {
        isPaused = false;
        logToConsole("Spinning resumed.", "info");
         if(pauseSpinBtn) {
            pauseSpinBtn.textContent = 'Pause Spinning';
        }
    }
}

// --- Stop Spinning ---
export function stopSpinningProcess() {
    if (isSpinning) {
        stopSpinning = true;
        isPaused = false; // Ensure not paused if stopping
        logToConsole("Spinning will stop shortly.", "info");
         const pauseSpinBtn = getElement('pauseSpinBtn');
         if(pauseSpinBtn) {
             pauseSpinBtn.textContent = 'Pause Spinning'; // Reset button text
         }
         const stopSpinBtn = getElement('stopSpinBtn');
         if(stopSpinBtn) {
             disableElement(stopSpinBtn, true); // Optionally disable stop button once clicked
         }
          const spinArticleBtn = getElement('enableSpinningBtn');
         if(spinArticleBtn) {
             disableElement(spinArticleBtn, false); // Re-enable spin button immediately
         }
    }
}

console.log("article-spinner.js v8.24 loaded");