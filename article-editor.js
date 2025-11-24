// article-editor.js (v1.0 - Block Editor)
import { getElement } from './article-ui.js';
import { logToConsole, showElement } from './article-helpers.js';
import { updateState, getState } from './article-state.js';

let draggedBlock = null;

// --- 1. Initialization ---

export function initStep3Editor(content, initialFormat) {
    const visualContainer = getElement('visualEditorContainer');
    const sourceHtml = getElement('sourceHtmlTextarea');
    const sourceMd = getElement('sourceMdTextarea');
    
    if (!visualContainer) return;

    // Normalize content to HTML for the visual editor
    let htmlContent = content;
    if (initialFormat === 'markdown') {
        htmlContent = markdownToHtml(content);
    }

    // Render the visual blocks
    renderVisualBlocks(htmlContent);
    
    // Update source textareas
    updateSourceViews();

    // Set default view to Visual
    setViewMode('visual');
}

// --- 2. Block Rendering ---

function renderVisualBlocks(htmlString) {
    const container = getElement('visualEditorContainer');
    container.innerHTML = '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    Array.from(doc.body.childNodes).forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            createEditorBlock(node, container);
        } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            // Wrap loose text in a paragraph
            const p = document.createElement('p');
            p.textContent = node.textContent;
            createEditorBlock(p, container);
        }
    });

    setupDragAndDrop(container);
}

function createEditorBlock(elementNode, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-block-wrapper group';
    wrapper.draggable = true;

    // Controls (Drag handle, Up, Down)
    const controls = document.createElement('div');
    controls.className = 'block-controls';
    controls.innerHTML = `
        <span class="drag-handle" title="Drag to move">⋮⋮</span>
        <div class="move-btns">
            <button class="move-btn up-btn" title="Move Up">▲</button>
            <button class="move-btn down-btn" title="Move Down">▼</button>
            <button class="move-btn delete-btn text-red-500" title="Delete Block">×</button>
        </div>
    `;

    // Content Area (Editable)
    const contentDiv = document.createElement('div');
    contentDiv.className = 'block-content prose max-w-none';
    contentDiv.contentEditable = true;
    
    // Clone the node to preserve inner HTML (b, i, etc)
    contentDiv.appendChild(elementNode.cloneNode(true));

    // Listeners for auto-syncing
    contentDiv.addEventListener('input', () => {
        updateSourceViews(); // Sync to source textareas
        syncToState();       // Sync to global state
    });

    // Control Listeners
    controls.querySelector('.up-btn').addEventListener('click', () => moveBlock(wrapper, -1));
    controls.querySelector('.down-btn').addEventListener('click', () => moveBlock(wrapper, 1));
    controls.querySelector('.delete-btn').addEventListener('click', () => {
        if(confirm('Delete this block?')) {
            wrapper.remove();
            updateSourceViews();
            syncToState();
        }
    });

    wrapper.appendChild(controls);
    wrapper.appendChild(contentDiv);
    container.appendChild(wrapper);
}

// --- 3. Toolbar Logic ---

export function setupEditorToolbar() {
    const buttons = document.querySelectorAll('.toolbar-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            const arg = btn.dataset.arg || null;
            
            if (command === 'createLink') {
                const url = prompt('Enter link URL:');
                if (url) document.execCommand(command, false, url);
            } else if (command === 'formatBlock') {
                document.execCommand(command, false, arg);
            } else {
                document.execCommand(command, false, arg);
            }
            updateSourceViews();
            syncToState();
        });
    });
}

// --- 4. View Switching & Sync ---

export function setViewMode(mode) {
    const visual = getElement('visualEditorWrapper');
    const htmlArea = getElement('sourceHtmlTextarea');
    const mdArea = getElement('sourceMdTextarea');
    const toolbar = getElement('editorToolbar');

    showElement(visual, mode === 'visual');
    showElement(htmlArea, mode === 'html');
    showElement(mdArea, mode === 'markdown');
    showElement(toolbar, mode === 'visual');

    // Button Active States
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        if (btn.dataset.mode === mode) btn.classList.add('bg-indigo-600', 'text-white');
        else btn.classList.remove('bg-indigo-600', 'text-white');
    });

    // If switching TO visual, re-render from source
    if (mode === 'visual') {
        // Check which source was active
        if (!htmlArea.classList.contains('hidden')) {
            renderVisualBlocks(htmlArea.value);
        } else if (!mdArea.classList.contains('hidden')) {
            renderVisualBlocks(markdownToHtml(mdArea.value));
        }
    }
}

function updateSourceViews() {
    const container = getElement('visualEditorContainer');
    let fullHtml = '';
    
    Array.from(container.children).forEach(wrapper => {
        const content = wrapper.querySelector('.block-content');
        // Get the inner HTML of the contenteditable div. 
        // Note: contenteditable often adds wrapper divs, we try to get the semantic tag inside if possible
        // But for simplicity in this block editor, we act as if the block-content IS the tag container.
        
        // Actually, extracting exactly what's inside:
        // Since we appended a clone node (e.g. <p>...</p>), innerHTML of block-content is <p>...</p>
        // However, contenteditable editing might change structure.
        // Simpler approach: Grab innerText if it's raw, or innerHTML.
        
        // Robust way: The user edits inside the <p>. 
        // Browser creates <div class="block-content"><p>Text</p></div>
        // We want the <p>Text</p>.
        fullHtml += content.innerHTML + '\n\n';
    });

    const htmlArea = getElement('sourceHtmlTextarea');
    const mdArea = getElement('sourceMdTextarea');
    
    if (htmlArea) htmlArea.value = fullHtml.trim();
    if (mdArea) mdArea.value = htmlToMarkdown(fullHtml.trim());
    
    // Also update the "Generate Article" textarea for spinners downstream
    const mainOutput = getElement('generated_article'); // Maps to generatedArticleTextarea
    if (mainOutput) {
        // Use whatever format was selected in Step 1 preferences if possible, 
        // otherwise default to what is currently dominant? 
        // Let's verify Step 1 format.
        const state = getState();
        if (state.format === 'markdown') {
            mainOutput.value = mdArea.value;
        } else {
            mainOutput.value = htmlArea.value;
        }
        // Trigger input event on main output to update counts
        mainOutput.dispatchEvent(new Event('input'));
    }
}

function syncToState() {
    const mainOutput = getElement('generated_article');
    if (mainOutput) {
        updateState({ generatedArticleContent: mainOutput.value });
    }
}

// --- 5. Drag and Drop Logic ---

function setupDragAndDrop(container) {
    let dragSrcEl = null;

    function handleDragStart(e) {
        this.style.opacity = '0.4';
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('over');
    }

    function handleDragLeave(e) {
        this.classList.remove('over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        if (dragSrcEl !== this) {
            // Swap DOM positions
            const parent = this.parentNode;
            const next = this.nextSibling === dragSrcEl ? this : this.nextSibling;
            parent.insertBefore(dragSrcEl, this);
            // If moving down
            // Simple swap logic is complex with insertBefore. 
            // Easier: Swap innerHTML? No, breaks listeners.
            // Better: Insert After.
            
            // For this simple implementation, standard sortable logic:
            // If index of dragSrc < index of this, insertAfter.
            // We basically moved dragSrcEl to position of `this`.
        }
        return false;
    }

    function handleDragEnd(e) {
        this.style.opacity = '1';
        Array.from(container.children).forEach(item => item.classList.remove('over'));
        updateSourceViews();
        syncToState();
    }

    Array.from(container.children).forEach(item => {
        item.addEventListener('dragstart', handleDragStart, false);
        item.addEventListener('dragenter', handleDragEnter, false);
        item.addEventListener('dragover', handleDragOver, false);
        item.addEventListener('dragleave', handleDragLeave, false);
        item.addEventListener('drop', handleDrop, false);
        item.addEventListener('dragend', handleDragEnd, false);
    });
}

function moveBlock(wrapper, direction) {
    const sibling = direction === -1 ? wrapper.previousElementSibling : wrapper.nextElementSibling;
    if (sibling) {
        const parent = wrapper.parentNode;
        if (direction === -1) {
            parent.insertBefore(wrapper, sibling);
        } else {
            parent.insertBefore(sibling, wrapper);
        }
        updateSourceViews();
        syncToState();
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// --- 6. Converters (Simple Regex-based) ---

function markdownToHtml(md) {
    // Very basic converter for preview purposes
    let html = md;
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>'); // naive list
    html = html.replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>'); // naive list
    // Fix naive list: join adjacent uls
    html = html.replace(/<\/ul>\s*<ul>/gim, '');
    
    html = html.replace(/\*\*(.*)\*\*/gim, '<b>$1</b>');
    html = html.replace(/\*(.*)\*/gim, '<i>$1</i>');
    html = html.replace(/\n/gim, '<br>');
    
    // Wrap text not in tags with p? 
    // For this editor, we assume AI gives structured MD.
    // Fallback for raw text
    return html;
}

function htmlToMarkdown(html) {
    // Basic converter
    let md = html;
    md = md.replace(/<h1>(.*?)<\/h1>/gim, '# $1\n');
    md = md.replace(/<h2>(.*?)<\/h2>/gim, '## $1\n');
    md = md.replace(/<h3>(.*?)<\/h3>/gim, '### $1\n');
    md = md.replace(/<b>(.*?)<\/b>/gim, '**$1**');
    md = md.replace(/<strong>(.*?)<\/strong>/gim, '**$1**');
    md = md.replace(/<i>(.*?)<\/i>/gim, '*$1*');
    md = md.replace(/<em>(.*?)<\/em>/gim, '*$1*');
    md = md.replace(/<ul>/gim, '');
    md = md.replace(/<\/ul>/gim, '');
    md = md.replace(/<li>(.*?)<\/li>/gim, '- $1\n');
    md = md.replace(/<p>(.*?)<\/p>/gim, '$1\n\n');
    md = md.replace(/<br>/gim, '\n');
    md = md.replace(/&nbsp;/gim, ' ');
    return md.trim();
}