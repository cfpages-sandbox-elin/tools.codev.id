// article-spinner.js (v8.24 html json reliability upgrade)
import { getState, updateState } from './article-state.js';
import { logToConsole, callAI, delay, fetchAndParseSitemap, showLoading, disableElement, slugify, showElement } from './article-helpers.js';
import { getElement } from './article-ui.js';
import { languageOptions } from './article-config.js';
import { getSpintaxPrompt } from './article-prompts.js';

let selectedTextInfo = null;
let isSpinning = false;
let isPaused = false;
let stopSpinning = false;

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