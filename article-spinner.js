// article-spinner.js (v9.03 - new ver)
import { getState } from './article-state.js';
import { logToConsole, callAI, delay, showElement, disableElement, showLoading } from './article-helpers.js';
import { getElement } from './article-ui.js';
import { getSpinnerVariationPrompt } from './article-prompts.js';

// --- Data Structure ---
// instead of blocks, we now have a flat list of "Items" that represent the flow
// Item types: 'structure' (tags) | 'content' (editable text)
let spinnerItems = []; 
let variationColumnCount = 1; 
let isSpinning = false;
let isPaused = false;
let stopSpinning = false;

// --- 1. Parser Logic (Recursive) ---

export function prepareSpinnerUI(htmlContent) {
    logToConsole("Parsing article with recursive nesting strategy...", "info");
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
    let inlineBuffer = []; // To hold text, <b>, <i>, etc. before hitting a block

    // Helper to flush inline buffer to a Content Segment
    const flushBuffer = () => {
        if (inlineBuffer.length === 0) return;
        
        // Join the buffer HTML
        const rawHtml = inlineBuffer.map(n => {
            return n.nodeType === Node.TEXT_NODE ? n.textContent : n.outerHTML;
        }).join('');

        // Split into sentences if it's a long block, or keep as is for list items
        // For simplicity and stability with HTML tags, we generally avoid splitting 
        // if it contains HTML tags, OR we use a smarter regex. 
        // For v9.03, we will TREAT THE BUFFER AS ONE SEGMENT to protect tag integrity (like <b>).
        // Splitting <li><b>Bold</b> text</li> is very hard to do safely without breaking tags.
        
        if (rawHtml.trim()) {
            spinnerItems.push({
                type: 'content',
                original: rawHtml.trim(),
                variations: [''],
                depth: depth
            });
        }
        inlineBuffer = [];
    };

    childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim()) {
                inlineBuffer.push(node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
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
                // If it's a self-closing tag like <br>, don't recurse
                if (!['br', 'hr', 'img'].includes(tagName)) {
                    processNodes(node, depth + (tagName === 'ul' || tagName === 'ol' ? 1 : 0));
                    
                    // Add Close Tag Structure
                    spinnerItems.push({ type: 'structure', html: `</${tagName}>`, depth: depth });
                }

            } else {
                // It's an inline element (b, i, span, a, strong, em)
                // Add it to the buffer to be part of the text box
                inlineBuffer.push(node);
            }
        }
    });

    // Final flush for any trailing text in this node
    flushBuffer();
}

// --- 2. Renderer Logic ---

function renderSpinnerGrid() {
    const container = getElement('spinnerContainer');
    if (!container) return;
    container.innerHTML = '';

    // We wrap the whole thing in a main block style or just render flow
    const mainBlock = document.createElement('div');
    mainBlock.className = 'spinner-block'; // Use the dashed box style for the container

    spinnerItems.forEach((item, index) => {
        if (item.type === 'structure') {
            const div = document.createElement('div');
            div.className = `structure-tag depth-${item.depth}`;
            div.textContent = item.html;
            // Visual tweak: make </li> and </ul> align nicely
            if (item.html.startsWith('</')) {
                // div.style.marginTop = '-5px'; 
            }
            mainBlock.appendChild(div);
        } 
        else if (item.type === 'content') {
            // It's a content row
            const rowDiv = document.createElement('div');
            rowDiv.className = `segment-row depth-${item.depth}`;
            
            // Original Box
            const origContainer = createBox(item.original, true, index, -1);
            rowDiv.appendChild(origContainer);

            // Variation Columns
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

    const textarea = document.createElement('textarea');
    textarea.className = `segment-textarea ${isOriginal ? 'original' : 'variation'}`;
    textarea.value = content;

    const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight + 2) + 'px'; 
    };

    textarea.addEventListener('input', autoResize);
    setTimeout(autoResize, 0);

    if (isOriginal) {
        textarea.addEventListener('input', (e) => {
             spinnerItems[itemIndex].original = e.target.value;
             autoResize();
        });
    } else {
        textarea.placeholder = "AI will generate here...";
        textarea.addEventListener('input', (e) => {
            // Ensure array size
            while(spinnerItems[itemIndex].variations.length <= varIndex) {
                spinnerItems[itemIndex].variations.push('');
            }
            spinnerItems[itemIndex].variations[varIndex] = e.target.value;
            autoResize();
        });
    }

    // Actions Bar
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'segment-actions';

    const tokenSpan = document.createElement('span');
    tokenSpan.className = 'token-count';
    tokenSpan.textContent = `~${Math.ceil(content.length / 4)} toks`;
    textarea.addEventListener('input', () => {
        tokenSpan.textContent = `~${Math.ceil(textarea.value.length / 4)} toks`;
    });
    actionsDiv.appendChild(tokenSpan);

    if (!isOriginal) {
        const genBtn = document.createElement('button');
        genBtn.className = 'gen-btn';
        genBtn.innerHTML = content ? '🔄' : '⚡'; 
        genBtn.title = "Generate this variation";
        genBtn.onclick = () => generateSingleVariation(itemIndex, varIndex, textarea, genBtn);
        actionsDiv.appendChild(genBtn);
    }

    container.appendChild(textarea);
    container.appendChild(actionsDiv);
    return container;
}

// --- 3. Interaction Logic ---

export function addVariationColumn() {
    variationColumnCount++;
    // Ensure data structure is ready
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
    
    // Context Awareness
    const existingVariations = item.variations
        .filter((val, idx) => idx !== varIndex && val && val.trim() !== "");

    btn.textContent = '⏳';
    disableElement(btn, true);
    textarea.classList.add('opacity-50');

    try {
        // CHANGED: Use the centralized prompt function
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
            btn.textContent = '🔄'; 
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

    // Column-first priority
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
            // Re-query for safety
            const allRows = document.querySelectorAll('.segment-row'); 
            // Note: Because 'structure' items take up indices in spinnerItems but are NOT segment-rows in DOM if we aren't careful...
            // Actually, renderSpinnerGrid renders structure divs and segment-row divs in strict order.
            // BUT, let's be safer. We know the item index. We can find the textarea by traversing spinnerItems visually?
            // The easiest way is to just find the N-th .segment-row? NO, because structure items are in the list.
            
            // Better: Recalculate DOM position.
            // Or easier: Just call the API logic and update State, then update Value if element exists.
            
            // Let's try to find the element.
            // spinnerItems[q.index] corresponds to the child at index `q.index` inside `.spinner-block`
            const container = getElement('spinnerContainer').querySelector('.spinner-block');
            const rowDiv = container.children[q.index]; 
            
            // Inside rowDiv, the textareas are: 0=Orig, 1=Var0, 2=Var1...
            // So VarIndex V corresponds to child V+1.
            const boxContainer = rowDiv.children[q.vIdx + 1];
            const textarea = boxContainer.querySelector('textarea');
            const btn = boxContainer.querySelector('.gen-btn');

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
            // Add a space for safety if it's sentence flow, but HTML tags usually handle spacing.
            // For strict HTML preservation, we don't add arbitrary spaces unless it was there.
            // But usually a space after text is good.
            // finalSpintax += " "; 
        }
    });

    const outputArea = getElement('finalSpintaxOutput');
    if(outputArea) {
        outputArea.value = finalSpintax;
        showElement(getElement('step5Section'), true);
        getElement('step5Section').scrollIntoView({ behavior: 'smooth' });
    }
}