// article-spinner.js (v9.06 - Groups + Horizontal Scroll + Delete)
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
    logToConsole("Parsing article...", "info");
    spinnerItems = [];
    variationColumnCount = 1; 
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    processNodes(doc.body, 0);
    renderSpinnerGrid();
    logToConsole(`Parsed ${spinnerItems.filter(i => i.type === 'content').length} segments.`, "success");
}

// Recursive function to walk the DOM
function processNodes(parentNode, depth) {
    const childNodes = Array.from(parentNode.childNodes);
    let inlineBuffer = []; 
    const flushBuffer = () => {
        if (inlineBuffer.length === 0) return;
        const rawHtml = inlineBuffer.map(n => n.nodeType === Node.TEXT_NODE ? n.textContent : n.outerHTML).join('');
        if (rawHtml.trim()) {
            const sentences = splitHtmlSentences(rawHtml);
            sentences.forEach(s => { if (s.trim()) {
                spinnerItems.push({ type: 'content', original: s.trim(), variations: [''], depth: depth });
            }});
        }
        inlineBuffer = [];
    };
    childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) { if (node.textContent) inlineBuffer.push(node); } 
        else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            const isBlock = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'hr'].includes(tagName);
            if (isBlock) {
                flushBuffer();
                let openTag = `<${tagName}`;
                Array.from(node.attributes).forEach(attr => openTag += ` ${attr.name}="${attr.value}"`);
                openTag += '>';
                spinnerItems.push({ type: 'structure', html: openTag, depth: depth, isBlockStart: true, tagName: tagName }); // Mark start
                if (!['br', 'hr', 'img'].includes(tagName)) {
                    processNodes(node, depth + (tagName === 'ul' || tagName === 'ol' ? 1 : 0));
                    spinnerItems.push({ type: 'structure', html: `</${tagName}>`, depth: depth, isBlockEnd: true }); // Mark end
                }
            } else { inlineBuffer.push(node); }
        }
    });
    flushBuffer();
}

// --- Helper: Split HTML String into Sentences Safely (Updated) ---
function splitHtmlSentences(htmlString) {
    const atomicPlaceholders = []; const tagPlaceholders = [];
    let maskedString = htmlString.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (match) => { atomicPlaceholders.push(match); return `__ATOMIC_${atomicPlaceholders.length - 1}__`; });
    maskedString = maskedString.replace(/<[^>]+>/g, (match) => { tagPlaceholders.push(match); return `__TAG_${tagPlaceholders.length - 1}__`; });
    const rawSentences = maskedString.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [maskedString];
    return rawSentences.map(sentence => {
        let s = sentence.replace(/__TAG_(\d+)__/g, (m, i) => tagPlaceholders[parseInt(i)]);
        s = s.replace(/__ATOMIC_(\d+)__/g, (m, i) => atomicPlaceholders[parseInt(i)]);
        return s;
    });
}

// --- 2. Renderer Logic ---

function renderSpinnerGrid() {
    const container = getElement('spinnerContainer');
    if (!container) return;
    container.innerHTML = '';

    let currentGroupDiv = null;
    let currentGroupBody = null;

    const startNewGroup = (tagLabel) => {
        const newGroupDiv = document.createElement('div');
        newGroupDiv.className = 'spinner-group';

        // Create Header
        const header = document.createElement('header');
        header.className = 'group-header';
        header.innerHTML = `
            <span class="group-tag">${tagLabel}</span>
            <svg class="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        `;
        
        header.addEventListener('click', () => {
            newGroupDiv.classList.toggle('collapsed');
        });
        
        newGroupDiv.appendChild(header);

        // Create Body
        const newGroupBody = document.createElement('div');
        newGroupBody.className = 'group-body';
        newGroupDiv.appendChild(newGroupBody);

        container.appendChild(newGroupDiv);

        // Update outer references so the loop knows where to put content
        currentGroupDiv = newGroupDiv;
        currentGroupBody = newGroupBody;
    };

    // If we have loose content at start, create a default group
    if (spinnerItems.length > 0 && !spinnerItems[0].isBlockStart) {
        startNewGroup('Intro / Text');
    }

    spinnerItems.forEach((item, index) => {
        // Detect Start of Top-Level Block
        if (item.type === 'structure' && item.isBlockStart && item.depth === 0) {
            startNewGroup(item.html); // Start new visual group
        }

        // Determine where to append
        const targetContainer = currentGroupBody || container;

        if (item.type === 'structure') {
            const div = document.createElement('div');
            div.className = `structure-tag depth-${item.depth}`;
            div.textContent = item.html;
            targetContainer.appendChild(div);
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
            
            targetContainer.appendChild(rowDiv);
        }
    });
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
        textarea.placeholder = "AI...";
        textarea.addEventListener('input', (e) => {
            while(spinnerItems[itemIndex].variations.length <= varIndex) {
                spinnerItems[itemIndex].variations.push('');
            }
            spinnerItems[itemIndex].variations[varIndex] = e.target.value;
            if (genBtn) genBtn.innerHTML = e.target.value ? '🔄' : '⚡';
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

export function removeVariationColumn() {
    if (variationColumnCount <= 1) {
        alert("You must have at least one variation column.");
        return;
    }
    if (!confirm(`Are you sure you want to delete the last column (Column ${variationColumnCount})? Data in this column will be lost.`)) {
        return;
    }

    variationColumnCount--;
    
    // Clean up data
    spinnerItems.forEach(item => {
        if (item.type === 'content') {
            // Remove items beyond the new count
            if (item.variations.length > variationColumnCount) {
                item.variations.length = variationColumnCount;
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
        const payload = { providerKey: primaryProvider.provider, model: primaryProvider.model, prompt: prompt };
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
            // Lookup via DOM logic (a bit brittle but works given we render strictly)
            // We find the spinner-group, then find the row inside.
            // Since spinnerItems are linear but DOM is grouped... 
            // It's safer to re-use single logic or just update state and re-render.
            // But we want animation.
            
            // Let's assume the user won't collapse groups WHILE generating.
            // We need to find the textarea corresponding to spinnerItems[q.index]
            
            // Find all textareas in the whole container
            const allTextareas = getElement('spinnerContainer').querySelectorAll('.segment-textarea');
            // Filter for those that are variations at specific indices? No.
            
            // Since DOM structure matches spinnerItems *order* (just wrapped in groups)
            // we can iterate. BUT structure items don't have textareas.
            // Let's filter items that are 'content' to map to textareas?
            // No, because structure items are divs.
            
            // Robust way: Store the DOM ID in the item during render? No.
            // Robust way: Just use the raw index.
            // The N-th "content" item in spinnerItems corresponds to the N-th ".segment-row" in the DOM.
            
            const contentItems = spinnerItems.filter(i => i.type === 'content');
            const contentIndex = contentItems.indexOf(spinnerItems[q.index]);
            
            const domRows = document.querySelectorAll('.segment-row');
            const targetRow = domRows[contentIndex];
            
            if (!targetRow) return null;
            
            const boxContainer = targetRow.children[q.vIdx + 1];
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