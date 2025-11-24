// article-spinner.js (v9.09 - bulk)
import { getState, updateState } from './article-state.js';
import { logToConsole, callAI, delay, showElement, disableElement, showLoading } from './article-helpers.js';
import { getElement } from './article-ui.js';
import { getSpinnerVariationPrompt, getBatchSpinnerPrompt } from './article-prompts.js'; 

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

        const scrollBtn = getElement('scrollToStep5Btn');
        if (scrollBtn) showElement(scrollBtn, true);
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
            rowDiv.dataset.itemIndex = index;
            
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

    // 1. Collect all tasks (Column-wise priority)
    const generateQueue = [];
    for (let vIdx = 0; vIdx < variationColumnCount; vIdx++) {
        spinnerItems.forEach((item, index) => {
            if (item.type === 'content') {
                if (!item.variations[vIdx] || item.variations[vIdx].trim() === '') {
                    // Collect context (existing variations) for uniqueness
                    const existingVars = item.variations.filter((v, i) => i !== vIdx && v && v.trim() !== "");
                    generateQueue.push({ 
                        index, 
                        vIdx, 
                        original: item.original,
                        avoid: existingVars 
                    });
                }
            }
        });
    }

    if (generateQueue.length === 0) {
        alert("No empty variation boxes found.");
        return;
    }

    logToConsole(`Bulk generating ${generateQueue.length} variations...`, 'info');

    // 2. Setup Progress Bar
    const progressContainer = getElement('bulkSpinnerProgressContainer');
    const progressBar = getElement('bulkSpinnerProgressBar');
    showElement(progressContainer, true);
    let completedCount = 0;
    const updateProgress = () => {
        const pct = Math.round((completedCount / generateQueue.length) * 100);
        progressBar.style.width = `${pct}%`;
        progressBar.textContent = `${pct}% (${completedCount}/${generateQueue.length})`;
    };
    updateProgress();

    // 3. Process in Batches
    const BATCH_SIZE = 5; // Send 5 sentences at once
    
    for (let i = 0; i < generateQueue.length; i += BATCH_SIZE) {
        const batch = generateQueue.slice(i, i + BATCH_SIZE);
        
        // Prepare payload for AI
        // items structure: [{ text: "...", avoid: ["..."] }]
        const itemsForPrompt = batch.map(task => ({
            text: task.original,
            avoid: task.avoid
        }));

        const prompt = getBatchSpinnerPrompt(itemsForPrompt, state.language, state.tone);
        
        const payload = {
            providerKey: primaryProvider.provider,
            model: primaryProvider.model,
            prompt: prompt
        };

        // Visual feedback: set loading state for specific boxes
        batch.forEach(task => setBoxState(task.index, task.vIdx, 'loading'));

        try {
            const result = await callAI('generate', payload);
            
            let resultsArray = [];
            if (result?.success && result.text) {
                try {
                    // Try to parse JSON array
                    const jsonMatch = result.text.match(/\[.*\]/s);
                    if (jsonMatch) {
                        resultsArray = JSON.parse(jsonMatch[0]);
                    }
                } catch (e) {
                    logToConsole("JSON parse failed for batch. Falling back...", "warn");
                }
            }

            // 4. Map results back to UI
            batch.forEach((task, batchIndex) => {
                const generatedText = resultsArray[batchIndex];
                
                if (generatedText && typeof generatedText === 'string') {
                    const cleanText = generatedText.replace(/^"|"$/g, '').trim();
                    
                    // Update Data
                    spinnerItems[task.index].variations[task.vIdx] = cleanText;
                    
                    // Update UI
                    updateBoxValue(task.index, task.vIdx, cleanText);
                    setBoxState(task.index, task.vIdx, 'success');
                } else {
                    setBoxState(task.index, task.vIdx, 'error');
                    logToConsole(`Failed to generate for item ${task.index}`, "error");
                }
                completedCount++;
            });

        } catch (e) {
            console.error(e);
            batch.forEach(task => setBoxState(task.index, task.vIdx, 'error'));
            completedCount += batch.length;
        }

        updateProgress();
        saveSpinnerState(); // Save progress incrementally
        
        // Small delay to allow UI repaint and avoid rate limits
        await delay(300);
    }

    // Finish
    logToConsole("Bulk generation complete.", 'success');
    await delay(1000);
    showElement(progressContainer, false); // Hide progress bar
}

function getBoxElements(itemIndex, varIndex) {
    // Find row by data attribute directly
    const rowDiv = getElement('spinnerContainer').querySelector(`.segment-row[data-item-index="${itemIndex}"]`);
    
    if (!rowDiv) return null;
    
    const boxContainer = rowDiv.children[varIndex + 1]; 
    const textarea = boxContainer.querySelector('textarea');
    const btn = boxContainer.querySelector('.floating-gen-btn');
    return { textarea, btn };
}

function setBoxState(itemIndex, varIndex, state) {
    const els = getBoxElements(itemIndex, varIndex);
    if (!els) return;
    const { textarea, btn } = els;

    if (state === 'loading') {
        btn.textContent = '⏳';
        disableElement(btn, true);
        textarea.classList.add('opacity-50');
    } else if (state === 'success') {
        btn.innerHTML = '🔄';
        disableElement(btn, false);
        textarea.classList.remove('opacity-50');
    } else if (state === 'error') {
        btn.textContent = '❌';
        disableElement(btn, false);
        textarea.classList.remove('opacity-50');
    }
}

function updateBoxValue(itemIndex, varIndex, value) {
    const els = getBoxElements(itemIndex, varIndex);
    if (!els) return;
    els.textarea.value = value;
    els.textarea.dispatchEvent(new Event('input')); // Trigger resize/count
}

// --- 4. Compiler Logic ---

export function compileSpintax() {
    let finalSpintax = "";
    spinnerItems.forEach(item => {
        if (item.type === 'structure') {
            const tag = item.tagName || ''; // e.g., 'p', 'ul', 'li'
            
            if (item.isBlockStart) {
                // OPENING TAGS
                finalSpintax += item.html;
                
                // Only add newline after opening UL/OL
                if (['ul', 'ol'].includes(tag)) {
                    finalSpintax += '\n';
                }
                // P, H1-H6, LI remain inline (no newline added here)
            } 
            else if (item.isBlockEnd) {
                // CLOSING TAGS
                finalSpintax += item.html;

                if (['ul', 'ol'].includes(tag)) {
                    finalSpintax += '\n\n'; // Extra space after list ends
                } else if (tag === 'li') {
                    finalSpintax += '\n'; // Simple newline after list item
                } else {
                    // P, H1-H6, DIV, etc.
                    finalSpintax += '\n\n'; // Double newline to separate paragraphs
                }
            }
            else {
                // Self-closing or other structure (br, hr)
                finalSpintax += item.html + '\n';
            }
        } 
        else if (item.type === 'content') {
            const vars = item.variations.filter(v => v && v.trim() !== '');
            let spintaxSegment = "";
            
            if (vars.length > 0) {
                spintaxSegment = `{${item.original}|${vars.join('|')}}`;
            } else {
                spintaxSegment = item.original;
            }
            
            finalSpintax += spintaxSegment;
            finalSpintax += " "; 
        }
    });

    finalSpintax = finalSpintax.replace(/\s+<\/p>/gi, '</p>');
    finalSpintax = finalSpintax.replace(/\s+<\/h/gi, '</h');
    finalSpintax = finalSpintax.replace(/\s+<\/li>/gi, '</li>');
    finalSpintax = finalSpintax.replace(/\n{3,}/g, '\n\n');

    const outputArea = getElement('finalSpintaxOutput');
    if(outputArea) {
        outputArea.value = finalSpintax.trim();
        showElement(getElement('step5Section'), true);
        getElement('step5Section').scrollIntoView({ behavior: 'smooth' });
        
        // Hide the "Scroll to Step 5" button since we are there now
        showElement(getElement('scrollToStep5Btn'), false);
    }
}