// article-spinner.js (v9.07 - Persistence + Compact UI)
import { getState, updateState } from './article-state.js';
import { logToConsole, callAI, delay, showElement, disableElement, showLoading } from './article-helpers.js';
import { getElement } from './article-ui.js';
import { getSpinnerVariationPrompt } from './article-prompts.js';

let spinnerItems = []; 
let variationColumnCount = 1; 
let isSpinning = false;
let isPaused = false;
let stopSpinning = false;

// --- State Management ---

function saveSpinnerState() {
    updateState({
        spinnerData: spinnerItems,
        spinnerVariationCount: variationColumnCount
    });
}

export function loadSpinnerData(state) {
    if (state.spinnerData && Array.isArray(state.spinnerData) && state.spinnerData.length > 0) {
        logToConsole("Restoring spinner state...", "info");
        spinnerItems = state.spinnerData;
        variationColumnCount = state.spinnerVariationCount || 1;
        
        renderSpinnerGrid();
        
        // Show the section
        const section = getElement('step4Section');
        if (section) showElement(section, true);
    }
}

// --- 1. Parser Logic ---

export function prepareSpinnerUI(htmlContent) {
    logToConsole("Parsing article...", "info");
    spinnerItems = [];
    variationColumnCount = 1; 
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    processNodes(doc.body, 0);
    renderSpinnerGrid();
    saveSpinnerState();
    logToConsole(`Parsed ${spinnerItems.filter(i => i.type === 'content').length} segments.`, "success");
}

function processNodes(parentNode, depth) {
    const childNodes = Array.from(parentNode.childNodes);
    let inlineBuffer = []; 

    const flushBuffer = () => {
        if (inlineBuffer.length === 0) return;
        const rawHtml = inlineBuffer.map(n => n.nodeType === Node.TEXT_NODE ? n.textContent : n.outerHTML).join('');
        
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
            if (node.textContent) inlineBuffer.push(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            const isBlock = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'hr'].includes(tagName);

            if (isBlock) {
                flushBuffer();
                let openTag = `<${tagName}`;
                Array.from(node.attributes).forEach(attr => openTag += ` ${attr.name}="${attr.value}"`);
                openTag += '>';

                spinnerItems.push({ type: 'structure', html: openTag, depth: depth, isBlockStart: true, tagName: tagName });

                if (!['br', 'hr', 'img'].includes(tagName)) {
                    processNodes(node, depth + (tagName === 'ul' || tagName === 'ol' ? 1 : 0));
                    spinnerItems.push({ type: 'structure', html: `</${tagName}>`, depth: depth, isBlockEnd: true });
                }
            } else {
                inlineBuffer.push(node);
            }
        }
    });
    flushBuffer();
}

function splitHtmlSentences(htmlString) {
    const atomicPlaceholders = [];
    const tagPlaceholders = [];

    let maskedString = htmlString.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (match) => {
        atomicPlaceholders.push(match);
        return `__ATOMIC_${atomicPlaceholders.length - 1}__`;
    });

    maskedString = maskedString.replace(/<[^>]+>/g, (match) => {
        tagPlaceholders.push(match);
        return `__TAG_${tagPlaceholders.length - 1}__`;
    });

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

        const header = document.createElement('header');
        header.className = 'group-header';
        header.innerHTML = `
            <span class="group-tag">&lt;${tagLabel}&gt;</span>
            <svg class="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        `;
        
        header.addEventListener('click', () => newGroupDiv.classList.toggle('collapsed'));
        newGroupDiv.appendChild(header);

        const newGroupBody = document.createElement('div');
        newGroupBody.className = 'group-body';
        newGroupDiv.appendChild(newGroupBody);

        container.appendChild(newGroupDiv);

        currentGroupDiv = newGroupDiv;
        currentGroupBody = newGroupBody;
    };

    if (spinnerItems.length > 0 && !spinnerItems[0].isBlockStart) {
        startNewGroup('Intro / Text');
    }

    spinnerItems.forEach((item, index) => {
        if (item.type === 'structure' && item.isBlockStart && item.depth === 0) {
            startNewGroup(item.tagName || item.html);
        }

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
             saveSpinnerState();
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
            saveSpinnerState();
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
    saveSpinnerState();
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
    
    spinnerItems.forEach(item => {
        if (item.type === 'content') {
            if (item.variations.length > variationColumnCount) {
                item.variations.length = variationColumnCount;
            }
        }
    });
    
    renderSpinnerGrid();
    saveSpinnerState(); // SAVE STATE
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
        saveSpinnerState();
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
            // DOM index matching... assumes order preservation
            // Safe way: iterate groups, then rows
            // Actually, simpler to just trigger logic and not update button visual strictly if DOM search fails
            // But for now, let's rely on data update + save.
            
            return generateSingleVariation(q.index, q.vIdx, { value: '', classList: { add:()=>{}, remove:()=>{} }, dispatchEvent: ()=>{} }, { textContent: '' })
                .then(() => {
                    // Since we passed dummy elements, we must force a re-render to show results visually
                    // optimization: only re-render at end? No, user wants progress.
                    // We can update state directly in logic, but we need UI update.
                    // Let's just re-render the grid after every chunk.
                });
        });

        await Promise.all(promises);
        renderSpinnerGrid(); // Refresh UI to show new data
        saveSpinnerState(); // SAVE STATE
        await delay(500); 
    }
    logToConsole("Bulk generation complete.", 'success');
}

// --- 4. Compiler Logic ---

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