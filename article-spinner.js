// article-spinner.js (v8.21 refactor prompts)

import { getState, updateState } from './article-state.js';
import { logToConsole, callAI, fetchAndParseSitemap, showLoading, disableElement, slugify, showElement } from './article-helpers.js';
import { getElement } from './article-ui.js'; // Keep this import for getElement
import { languageOptions } from './article-config.js'; // Import language options if needed for context
import { getSpintaxPrompt } from './article-prompts.js';

let selectedTextInfo = null; // Store { text: '...', range: Range }

// --- Pause/Stop Control Variables ---
let isSpinning = false;
let isPaused = false;
let stopSpinning = false;

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
    const spinSelectedBtn = getElement('spinSelectedBtn');
    const spunArticleDisplay = getElement('spunArticleDisplay');
    const loadingIndicator = getElement('spinActionLoadingIndicator');

    if (!selectedTextInfo || !selectedTextInfo.text || !spinSelectedBtn || !spunArticleDisplay) {
         logToConsole("Spin button clicked but no valid text/elements found.", "warn");
         return;
    }

    const textToSpin = selectedTextInfo.text;
    const state = getState(); // Get current language/tone settings
    
    // REFACTORED
    const prompt = getSpintaxPrompt(textToSpin, false);

     const payload = {
        providerKey: state.textProvider, // Use main text provider
        model: state.textModel,       // Use main text model
        prompt: prompt
    };
     logToConsole(`--- Spinning Text Prompt ---\n${prompt}\n---------------------------------`);
    const result = await callAI('generate', payload, loadingIndicator, spinSelectedBtn); // Pass button to disable

    if (result?.success && result.text) {
        let spintaxResult = result.text.trim();

        // Basic cleanup: remove leading/trailing curly braces if AI added them unexpectedly
        if (spintaxResult.startsWith('{') && spintaxResult.endsWith('}')) {
            // Check if it looks like valid spintax before removing braces
            if (spintaxResult.includes('|')) {
                // Keep braces if it's valid spintax
            } else {
                // If no pipe, it's likely not valid spintax, remove braces
                spintaxResult = spintaxResult.substring(1, spintaxResult.length - 1).trim();
            }
        } else {
            // If no braces, just use the result as a single option wrapped in braces
            spintaxResult = `{${spintaxResult}}`;
        }

        const selection = window.getSelection();
        if (selection && selectedTextInfo.range) {
            try {
                 // Restore the selection using the stored range before inserting
                 selection.removeAllRanges();
                 selection.addRange(selectedTextInfo.range);

                 // Use insertHTML if available for better structure preservation, else fallback
                 if (document.queryCommandSupported('insertHTML')) {
                    document.execCommand('insertHTML', false, spintaxResult);
                 } else if (document.queryCommandSupported('insertText')) {
                     logToConsole("insertHTML not supported, using insertText (might lose formatting).", "warn");
                     document.execCommand('insertText', false, spintaxResult);
                 } else {
                     // Manual fallback (less reliable)
                     selectedTextInfo.range.deleteContents();
                     selectedTextInfo.range.insertNode(document.createTextNode(spintaxResult));
                 }

                logToConsole(`Inserted spintax: ${spintaxResult}`, 'success');
                highlightSpintax(spunArticleDisplay); // Re-highlight after modification

            } catch (e) {
                logToConsole(`Error replacing selection with spintax: ${e}`, 'error');
                alert("Error applying spintax. The content might not have updated correctly.");
            } finally {
                 // Clear selection state after attempting replacement
                 selectedTextInfo = null;
                 disableElement(spinSelectedBtn, true); // Disable button after use
                 selection.removeAllRanges(); // Deselect text
            }
        } else {
             logToConsole("Could not restore selection range to insert spintax.", 'error');
             alert("Could not apply spintax. Please try selecting the text again.");
             disableElement(spinSelectedBtn, true);
        }
    } else {
         // callAI already showed an error message
         logToConsole("Spinning failed.", "error");
         disableElement(spinSelectedBtn, true);
    }
}

// --- Automatic Article Spinning ---
export async function handleSpinArticle(generatedTextarea, spunDisplay) {
    logToConsole("Starting automatic article spinning...", "info");
    isSpinning = true;
    isPaused = false;
    stopSpinning = false;

    const articleText = generatedTextarea.value;
    spunDisplay.textContent = ''; // Clear the spun display area

    const loadingIndicator = getElement('spinActionLoadingIndicator');
    const spinArticleBtn = getElement('enableSpinningBtn'); // Spin Article button
    const pauseSpinBtn = getElement('pauseSpinBtn'); // New Pause button
    const stopSpinBtn = getElement('stopSpinBtn'); // New Stop button

    disableElement(spinArticleBtn, true); // Disable Spin Article button
    disableElement(pauseSpinBtn, false); // Enable Pause button
    disableElement(stopSpinBtn, false); // Enable Stop button
    showLoading(loadingIndicator, true); // Show loading indicator

    // Refined Sentence Extraction
    // This regex attempts to split by . ! ? followed by a space or end of string ($),
    // but avoids splitting if a dot is NOT followed by a space (like in URLs).
    // It also handles cases where a sentence might start without a preceding space.
    const sentences = articleText.match(/([^.!?]+[.!?]+(?=\s|$)|[^.!?]+$)/g) || [];

    let processedText = '';

    for (let i = 0; i < sentences.length; i++) {
        let sentence = sentences[i];

        // Check for stop request at the beginning of each sentence processing
        if (stopSpinning) {
            logToConsole("Spinning stopped by user.", "info");
            break; // Exit loop if stop is requested
        }

        // Pause logic
        if (isPaused) {
            logToConsole("Spinning paused...", "info");
            disableElement(pauseSpinBtn, false);
            disableElement(stopSpinBtn, false);
            await new Promise(resolve => {
                const interval = setInterval(() => {
                    if (!isPaused) {
                        clearInterval(interval);
                        logToConsole("Spinning resumed.", "info");
                        resolve();
                    }
                     if (stopSpinning) {
                         clearInterval(interval);
                         logToConsole("Spinning stopped by user during pause.", "info");
                         resolve();
                     }
                }, 100); // Check every 100ms
            });
             if (stopSpinning) break; // Check again after resuming
        }

        // More careful sentence boundary check based on context
        // If it's not the very first sentence and there's no space before it in the original text,
        // it's likely not a new sentence. This is a heuristic and might need further tuning.
        const originalIndex = articleText.indexOf(sentence, processedText.length);
        if (i > 0 && originalIndex > 0 && articleText[originalIndex - 1] !== ' ' && articleText[originalIndex - 1] !== '\n') {
            // If no space before and not the first sentence, append to the previous one (heuristics)
            spunDisplay.textContent += sentence; // Append without adding a space
            processedText += sentence;
            logToConsole(`Appended potential non-sentence part: "${sentence}"`, 'debug');
            continue; // Skip spinning this part as a separate sentence
        }

        sentence = sentence.trim();
        if (!sentence) continue;

        // Extract punctuation at the end of the sentence
        const punctuationMatch = sentence.match(/[.!?]+$/);
        const punctuation = punctuationMatch ? punctuationMatch[0] : '';
        const sentenceWithoutPunctuation = sentence.replace(/[.!?]+$/, '').trim();

        if (!sentenceWithoutPunctuation) {
             // If only punctuation was found, just append it and continue
             spunDisplay.textContent += punctuation + ' ';
             processedText += punctuation + ' ';
             continue;
        }

        const state = getState();
        const prompt = getSpintaxPrompt(sentenceWithoutPunctuation, true); // REFACTORED

        const payload = {
            providerKey: state.textProvider,
            model: state.textModel,
            prompt: prompt
        };

        logToConsole(`--- Spinning Sentence ---`, 'info');
        logToConsole(`Original: "${sentence}"`, 'debug');
        logToConsole(`Prompting AI for: "${sentenceWithoutPunctuation}"`, 'debug');

        const result = await callAI('generate', payload); // No need to pass button/indicator here, handled by the main function

        if (result?.success && result.text) {
            let spintaxResult = result.text.trim();

            // Basic cleanup: remove leading/trailing curly braces if AI added them unexpectedly
            if (spintaxResult.startsWith('{') && spintaxResult.endsWith('}')) {
                 // Check if it looks like valid spintax before removing braces
                 if (spintaxResult.includes('|')) {
                     // Keep braces if it's valid spintax
                 } else {
                     // If no pipe, it's likely not valid spintax, remove braces
                     spintaxResult = spintaxResult.substring(1, spintaxResult.length - 1).trim();
                 }
            } else {
                // If no braces, just use the result as a single option wrapped in braces
                 spintaxResult = `{${spintaxResult}}`;
            }


            // Append the generated spintax followed by the original punctuation and a space
            spunDisplay.textContent += spintaxResult + punctuation + ' ';
            processedText += spintaxResult + punctuation + ' ';
            logToConsole(`Appended Spintax + Punctuation: "${spintaxResult}${punctuation}"`, 'success');

        } else {
             // If AI call failed, append the original sentence as is
             spunDisplay.textContent += sentence + ' ';
             processedText += sentence + ' ';
             logToConsole(`AI spinning failed for sentence. Appending original: "${sentence}"`, 'error');
        }

        // Add a small delay to show progress and avoid overwhelming the UI/AI
        if (!stopSpinning && !isPaused) { // Only delay if not stopping or pausing
            await new Promise(resolve => setTimeout(resolve, 100)); // Adjust delay as needed
        }
    }

    isSpinning = false;
    isPaused = false;
    stopSpinning = false; // Reset stop flag

    disableElement(spinArticleBtn, false); // Re-enable Spin Article button
    disableElement(pauseSpinBtn, true); // Disable Pause button
    disableElement(stopSpinBtn, true); // Disable Stop button
    showLoading(loadingIndicator, false); // Hide loading indicator
    logToConsole("Automatic article spinning finished.", "info");
    highlightSpintax(spunDisplay); // Highlight spintax in the final output
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

console.log("article-spinner.js v8.21 loaded"); // v8.21 refactor prompts