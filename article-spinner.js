// article-spinner.js
// Contains logic for spintax generation and highlighting

import { getState } from './article-state.js';
import { logToConsole, callAI } from './article-helpers.js';
import { getElement } from './article-ui.js';
import { languageOptions } from './article-config.js'; // Import language options if needed for context

let selectedTextInfo = null; // Store { text: '...', range: Range }

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
    const spunArticleDisplay = getElement('spunArticleDisplay'); // Corrected ID
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
    const spunArticleDisplay = getElement('spunArticleDisplay'); // Corrected ID
    const loadingIndicator = getElement('spinActionLoadingIndicator');

    if (!selectedTextInfo || !selectedTextInfo.text || !spinSelectedBtn || !spunArticleDisplay) {
         logToConsole("Spin button clicked but no valid text/elements found.", "warn");
         return;
    }

    const textToSpin = selectedTextInfo.text;
    const state = getState(); // Get current language/tone settings

    // Get language/tone again for spinning context
    const language = state.language === 'custom' ? state.customLanguage : languageOptions[state.language]?.name || state.language;
    const dialect = state.dialect; // Assuming dialect is stored in state correctly
    const tone = state.tone === 'custom' ? state.customTone : state.tone;

    const prompt = `Take the following text and generate 2-4 variations that mean the same thing, suitable for spintax.
    - Language: ${language}${dialect ? ` (${dialect} dialect)` : ''}
    - Tone: ${tone} (Maintain this tone)
    - Output Format: Return ONLY the spintax string in the format {original|variation1|variation2|...}. Do not include the original text you were given unless it's one of the variations. Do not include any explanation or surrounding text.

    Text to Spin:
    ---
    ${textToSpin}
    ---`;

     const payload = {
        providerKey: state.textProvider, // Use main text provider
        model: state.textModel,       // Use main text model
        prompt: prompt
    };
     logToConsole(`--- Spinning Text Prompt ---\n${prompt}\n---------------------------------`);
    const result = await callAI('generate', payload, loadingIndicator, spinSelectedBtn); // Pass button to disable

    if (result?.success && result.text) {
        const spintaxResult = result.text.trim();
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

console.log("article-spinner.js loaded");