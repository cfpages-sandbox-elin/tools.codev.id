// article-spinner.js (v9.05 - Atomic Anchor Protection)
import { getState } from './article-state.js';
import { logToConsole, callAI, delay, showElement, disableElement, showLoading } from './article-helpers.js';
import { getElement } from './article-ui.js';
import { getSpinnerVariationPrompt } from './article-prompts.js';

// --- Data Structure ---
let spinnerItems = []; 
let variationColumnCount = 1; 
let isSpinning = false;
let isPaused = false;
let stopSpinning = false;

// --- 1. Parser Logic (Recursive) ---

export function prepareSpinnerUI(htmlContent) {
    logToConsole("Parsing article with atomic anchor protection...", "info");
    spinnerItems = [];
    variationColumnCount = 1; 
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Start recursive processing from body
    processNodes(doc.body, 0);

    renderSpinnerGrid();
    logToConsole(`Parsed ${spinnerItems.filter(i => i.type === 'content').length} editable segments.`, "success");
}

// Recursive function to walk the DOM
function processNodes(parentNode, depth) {
    const childNodes = Array.from(parentNode.childNodes);
    let inlineBuffer = []; // To hold text, <b>, <i>, <a> etc. before hitting a block

    // Helper to flush inline buffer to Content Segments
    const flushBuffer = () => {
        if (inlineBuffer.length === 0) return;
        
        // 1. Join the buffer into a single raw HTML string
        const rawHtml = inlineBuffer.map(n => {
            return n.nodeType === Node.TEXT_NODE ? n.textContent : n.outerHTML;
        }).join('');

        // 2. Safely split into sentences (Protecting <a> tags)
        if (rawHtml.trim()) {
            const sentences = splitHtmlSentences(rawHtml);
            sentences.forEach(s => {
                if (s.trim()) {
                    spinnerItems.push({
                        type: 'content',
                        original: s.trim(),
                        variations: [''],
                        depth: depth
                    });
                }
            });
        }
        inlineBuffer = [];
    };

    childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent) {
                inlineBuffer.push(node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            // Note: <a> is intentionally excluded here so it goes into inlineBuffer
            const isBlock = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'hr'].includes(tagName);

            if (isBlock) {
                // 1. Flush any pending inline text before this block
                flushBuffer();

                // 2. Handle the Block
                let openTag = `<${tagName}`;
                Array.from(node.attributes).forEach(attr => openTag += ` ${attr.name}="${attr.value}"`);
                openTag += '>';

                // Add Open Tag Structure
                spinnerItems.push({ type: 'structure', html: openTag, depth: depth });

                // 3. Recurse into the block
                if (!['br', 'hr', 'img'].includes(tagName)) {
                    processNodes(node, depth + (tagName === 'ul' || tagName === 'ol' ? 1 : 0));
                    
                    // Add Close Tag Structure
                    spinnerItems.push({ type: 'structure', html: `</${tagName}>`, depth: depth });
                }

            } else {
                // Inline elements (b, i, span, a, strong, em) added to buffer
                inlineBuffer.push(node);
            }
        }
    });

    flushBuffer();
}

// --- Helper: Split HTML String into Sentences Safely (Updated) ---
function splitHtmlSentences(htmlString) {
    const atomicPlaceholders = [];
    const tagPlaceholders = [];

    // 1. Mask Atomic Elements (specifically <a> tags and their content)
    // We capture the whole <a ...>...</a> block so punctuation inside doesn't trigger split
    let maskedString = htmlString.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (match) => {
        atomicPlaceholders.push(match);
        return `__ATOMIC_${atomicPlaceholders.length - 1}__`;
    });

    // 2. Mask remaining standalone HTML tags (like <b>, </b>, <br>)
    maskedString = maskedString.replace(/<[^>]+>/g, (match) => {
        tagPlaceholders.push(match);
        return `__TAG_${tagPlaceholders.length - 1}__`;
    });

    // 3. Split by sentence delimiters
    // Regex looks for . ! ? followed by space or end of string
    const rawSentences = maskedString.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [maskedString];

    // 4. Restore tags and atomic blocks
    const restoredSentences = rawSentences.map(sentence => {
        // Restore generic tags first
        let s = sentence.replace(/__TAG_(\d+)__/g, (match, index) => {
            return tagPlaceholders[parseInt(index)];
        });
        // Restore atomic blocks (links) last to ensure they stay whole
        s = s.replace(/__ATOMIC_(\d+)__/g, (match, index) => {
            return atomicPlaceholders[parseInt(index)];
        });
        return s;
    });

    return restoredSentences;
}

// --- 2. Renderer Logic ---

function renderSpinnerGrid() {
    const container = getElement('spinnerContainer');
    if (!container) return;
    container.innerHTML = '';

    const mainBlock = document.createElement('div');
    mainBlock.className = 'spinner-block'; 

    spinnerItems.forEach((item, index) => {
        if (item.type === 'structure') {
            const div = document.createElement('div');
            div.className = `structure-tag depth-${item.depth}`;
            div.textContent = item.html;
            mainBlock.appendChild(div);
        } 
        else if (item.type === 'content') {
            const rowDiv = document.createElement('div');
            rowDiv.className = `segment-row depth-${item.depth}`;
            
            const origContainer = createBox(item.original, true, index, -1);
            rowDiv.appendChild(origContainer);

            for (let i = 0; i < variationColumnCount; i++) {
                const val = item.variations[i] || '';
                const varContainer = createBox(val, false, index, i);
                rowDiv.appendChild(varContainer);
            }
            
            mainBlock.appendChild(rowDiv);
        }
    });

    container.appendChild(mainBlock);
}

function createBox(content, isOriginal, itemIndex, varIndex) {
    const container = document.createElement('div');
    container.className = 'segment-box-container';

    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';

    const textarea = document.createElement('textarea');
    textarea.className = `segment-textarea ${isOriginal ? 'original' : 'variation'}`;
    textarea.value = content;

    const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight + 2) + 'px'; 
    };

    textarea.addEventListener('input', autoResize);
    setTimeout(autoResize, 0);

    // Generate Button (Floating inside wrapper)
    let genBtn = null;
    if (!isOriginal) {
        genBtn = document.createElement('button');
        genBtn.className = 'floating-gen-btn';
        genBtn.innerHTML = content ? '🔄' : '⚡'; 
        genBtn.title = "Generate this variation";
        genBtn.onclick = () => generateSingleVariation(itemIndex, varIndex, textarea, genBtn);
        wrapper.appendChild(genBtn);
    }

    if (isOriginal) {
        textarea.addEventListener('input', (e) => {
             spinnerItems[itemIndex].original = e.target.value;
             autoResize();
        });
    } else {
        textarea.placeholder = "AI will generate here...";
        textarea.addEventListener('input', (e) => {
            while(spinnerItems[itemIndex].variations.length <= varIndex) {
                spinnerItems[itemIndex].variations.push('');
            }
            spinnerItems[itemIndex].variations[varIndex] = e.target.value;
            
            if (genBtn) {
                genBtn.innerHTML = e.target.value ? '🔄' : '⚡';
            }
            autoResize();
        });
    }

    wrapper.appendChild(textarea);
    container.appendChild(wrapper);

    const tokenSpan = document.createElement('div');
    tokenSpan.className = 'token-count';
    tokenSpan.textContent = `~${Math.ceil(content.length / 4)} toks`;
    textarea.addEventListener('input', () => {
        tokenSpan.textContent = `~${Math.ceil(textarea.value.length / 4)} toks`;
    });
    container.appendChild(tokenSpan);

    return container;
}

// --- 3. Interaction Logic ---

export function addVariationColumn() {
    variationColumnCount++;
    spinnerItems.forEach(item => {
        if (item.type === 'content') {
            while (item.variations.length < variationColumnCount) {
                item.variations.push('');
            }
        }
    });
    renderSpinnerGrid(); 
}

export async function generateSingleVariation(itemIndex, varIndex, textarea, btn) {
    const state = getState();
    const primaryProvider = state.textProviders[0];
    
    if (!primaryProvider || !primaryProvider.model) {
        alert("Please select an AI Model in the configuration section first.");
        return;
    }

    const item = spinnerItems[itemIndex];
    const originalText = item.original;
    
    const existingVariations = item.variations
        .filter((val, idx) => idx !== varIndex && val && val.trim() !== "");

    btn.textContent = '⏳';
    disableElement(btn, true);
    textarea.classList.add('opacity-50');

    try {
        const prompt = getSpinnerVariationPrompt(originalText, existingVariations);

        const payload = {
            providerKey: primaryProvider.provider,
            model: primaryProvider.model,
            prompt: prompt
        };

        const result = await callAI('generate', payload);

        if (result?.success && result.text) {
            const newText = result.text.replace(/^"|"$/g, '').trim(); 
            textarea.value = newText;
            spinnerItems[itemIndex].variations[varIndex] = newText;
            textarea.dispatchEvent(new Event('input'));
            
            btn.innerHTML = '🔄'; 
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
    if (!confirm("This will generate variations for all empty boxes. Continue?")) return;

    const generateQueue = [];

    for (let vIdx = 0; vIdx < variationColumnCount; vIdx++) {
        spinnerItems.forEach((item, index) => {
            if (item.type === 'content') {
                if (!item.variations[vIdx] || item.variations[vIdx].trim() === '') {
                    generateQueue.push({ index, vIdx });
                }
            }
        });
    }

    logToConsole(`Bulk generating ${generateQueue.length} variations...`, 'info');

    const CHUNK_SIZE = 5; 
    for (let i = 0; i < generateQueue.length; i += CHUNK_SIZE) {
        const chunk = generateQueue.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map(q => {
            const mainBlock = getElement('spinnerContainer').querySelector('.spinner-block');
            const rowDiv = mainBlock.children[q.index]; 
            const boxContainer = rowDiv.children[q.vIdx + 1];
            const textarea = boxContainer.querySelector('textarea');
            const btn = boxContainer.querySelector('.floating-gen-btn');

            return generateSingleVariation(q.index, q.vIdx, textarea, btn);
        });

        await Promise.all(promises);
        await delay(500); 
    }
    logToConsole("Bulk generation complete.", 'success');
}

// --- 4. Compiler Logic (Step 5) ---

export function compileSpintax() {
    let finalSpintax = "";

    spinnerItems.forEach(item => {
        if (item.type === 'structure') {
            finalSpintax += item.html + '\n';
        } else if (item.type === 'content') {
            const vars = item.variations.filter(v => v && v.trim() !== '');
            if (vars.length > 0) {
                finalSpintax += `{${item.original}|${vars.join('|')}}`;
            } else {
                finalSpintax += item.original;
            }
            finalSpintax += " "; 
        }
    });

    const outputArea = getElement('finalSpintaxOutput');
    if(outputArea) {
        outputArea.value = finalSpintax;
        showElement(getElement('step5Section'), true);
        getElement('step5Section').scrollIntoView({ behavior: 'smooth' });
    }
}