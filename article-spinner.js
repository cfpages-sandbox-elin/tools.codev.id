// article-spinner.js (v9.02 - better single prompt)
import { getState } from './article-state.js';
import { logToConsole, callAI, delay, showElement, disableElement, showLoading } from './article-helpers.js';
import { getElement } from './article-ui.js';
import { getSpintaxPrompt } from './article-prompts.js';

// --- Data Structure ---
let articleBlocks = [];
let variationColumnCount = 1; 
let isSpinning = false;
let isPaused = false;
let stopSpinning = false;

// --- 1. Parser Logic ---

export function prepareSpinnerUI(htmlContent) {
    logToConsole("Parsing article for structural spinning...", "info");
    articleBlocks = [];
    variationColumnCount = 1; 
    
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
                        original: li.innerHTML.trim(), 
                        variations: [''],
                        isListRequest: true 
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
            // Paragraph handling: Split into sentences
            const text = node.innerHTML.trim();
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

// --- 2. Renderer Logic ---

function renderSpinnerGrid() {
    const container = getElement('spinnerContainer');
    if (!container) return;
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

            // Column 1: Original
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

    const textarea = document.createElement('textarea');
    textarea.className = `segment-textarea ${isOriginal ? 'original' : 'variation'}`;
    textarea.value = content;

    const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight + 2) + 'px'; // +2 for border safety
    };

    textarea.addEventListener('input', autoResize);
    setTimeout(autoResize, 0);

    if (isOriginal) {
        textarea.addEventListener('input', (e) => {
             articleBlocks[blockIndex].segments[segIndex].original = e.target.value;
             autoResize();
        });
    } else {
        textarea.placeholder = "AI will generate here...";
        textarea.addEventListener('input', (e) => {
            if (!articleBlocks[blockIndex].segments[segIndex].variations[varIndex]) {
                articleBlocks[blockIndex].segments[segIndex].variations[varIndex] = '';
            }
            articleBlocks[blockIndex].segments[segIndex].variations[varIndex] = e.target.value;
            autoResize();
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

    // Generate Button
    if (!isOriginal) {
        const genBtn = document.createElement('button');
        genBtn.className = 'gen-btn';
        genBtn.innerHTML = content ? '🔄' : '⚡'; 
        genBtn.title = "Generate this variation";
        genBtn.onclick = () => generateSingleVariation(blockIndex, segIndex, varIndex, textarea, genBtn);
        actionsDiv.appendChild(genBtn);
    }

    container.appendChild(textarea);
    container.appendChild(actionsDiv);
    return container;
}

// --- 3. Interaction Logic ---

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
    renderSpinnerGrid(); 
}

export async function generateSingleVariation(blockIndex, segIndex, varIndex, textarea, btn) {
    const state = getState();
    const primaryProvider = state.textProviders[0];
    
    if (!primaryProvider || !primaryProvider.model) {
        alert("Please select an AI Model in the configuration section first.");
        return;
    }

    const segmentData = articleBlocks[blockIndex].segments[segIndex];
    const originalText = segmentData.original;
    
    const existingVariations = segmentData.variations
        .filter((val, idx) => idx !== varIndex && val && val.trim() !== "");

    // Visual Feedback
    btn.textContent = '⏳';
    disableElement(btn, true);
    textarea.classList.add('opacity-50');

    try {
        let prompt = `Task: Rewrite the following sentence in ${state.language} (${state.tone} tone).\n\n`;
        
        prompt += `CRITICAL INSTRUCTIONS (STRUCTURAL SHUFFLING):\n`;
        prompt += `1. Keep the EXACT meaning of the original.\n`;
        prompt += `2. RADICALLY CHANGE the sentence structure. Do not just replace synonyms.\n`;
        prompt += `3. SHUFFLE the positions of the Subject, Object, Place, and Time.\n`;
        prompt += `4. Switch between Active and Passive voice (e.g., "A ate B" -> "B was eaten by A").\n`;
        prompt += `5. Use Fronting (move the end of the sentence to the beginning).\n`;

        if (existingVariations.length > 0) {
            prompt += `\nCONTEXT (AVOID these structures):\n`;
            prompt += `The following variations already exist. You MUST generate a sentence structure DIFFERENT from these:\n`;
            existingVariations.forEach((v, i) => {
                prompt += `- ${v}\n`;
            });
        }

        prompt += `\nOriginal Sentence:\n"${originalText}"\n`;
        prompt += `\nOutput ONLY the new rewritten sentence. No explanations.`;

        const payload = {
            providerKey: primaryProvider.provider,
            model: primaryProvider.model,
            prompt: prompt
        };

        const result = await callAI('generate', payload);

        if (result?.success && result.text) {
            const newText = result.text.replace(/^"|"$/g, '').trim(); 
            textarea.value = newText;
            articleBlocks[blockIndex].segments[segIndex].variations[varIndex] = newText;
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

    // Process in chunks
    const CHUNK_SIZE = 5; 
    for (let i = 0; i < generateQueue.length; i += CHUNK_SIZE) {
        const chunk = generateQueue.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map(item => {
            // Note: Re-querying DOM here is necessary because render might have happened
            // Ideally we would have ID refs, but this works for this scale.
            const blocks = document.querySelectorAll('.spinner-block');
            if (!blocks[item.bIdx]) return null;
            
            const rows = blocks[item.bIdx].querySelectorAll('.segment-row');
            if (!rows[item.sIdx]) return null;

            const containers = rows[item.sIdx].querySelectorAll('.segment-box-container');
            const container = containers[item.vIdx + 1]; // +1 because index 0 is Original
            
            if (!container) return null;

            const textarea = container.querySelector('textarea');
            const btn = container.querySelector('.gen-btn');

            return generateSingleVariation(item.bIdx, item.sIdx, item.vIdx, textarea, btn);
        });

        await Promise.all(promises);
        await delay(500); 
    }
    logToConsole("Bulk generation complete.", 'success');
}

// --- 4. Compiler Logic (Step 5) ---

export function compileSpintax() {
    let finalSpintax = "";

    articleBlocks.forEach(block => {
        if (block.type === 'ul' || block.type === 'ol') {
            finalSpintax += block.startTag + '\n';
            block.segments.forEach(seg => {
                const vars = seg.variations.filter(v => v && v.trim() !== '');
                const spintax = vars.length > 0 
                    ? `{${seg.original}|${vars.join('|')}}` 
                    : seg.original;
                finalSpintax += `  <li>${spintax}</li>\n`;
            });
            finalSpintax += block.endTag + '\n\n';
        } else {
            finalSpintax += block.startTag; 
            
            block.segments.forEach(seg => {
                const vars = seg.variations.filter(v => v && v.trim() !== '');
                const spintax = vars.length > 0 
                    ? `{${seg.original}|${vars.join('|')}}` 
                    : seg.original;
                finalSpintax += spintax + " "; 
            });

            finalSpintax = finalSpintax.trim(); 
            finalSpintax += block.endTag + '\n\n';
        }
    });

    const outputArea = getElement('finalSpintaxOutput');
    if(outputArea) {
        outputArea.value = finalSpintax;
        showElement(getElement('step5Section'), true);
        getElement('step5Section').scrollIntoView({ behavior: 'smooth' });
    }
}