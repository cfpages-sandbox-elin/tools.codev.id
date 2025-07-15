// file pdf-edit.js
document.addEventListener('DOMContentLoaded', () => {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;

    const editFileInput = document.getElementById('edit-file-upload');
    if (!editFileInput) return; // Exit if not on the edit tool page

    // Toolbar elements
    const toolbar = document.getElementById('edit-toolbar');
    const brushTool = document.getElementById('edit-tool-brush');
    const textTool = document.getElementById('edit-tool-text');
    const eraserTool = document.getElementById('edit-tool-eraser');
    const colorPicker = document.getElementById('edit-color-picker');
    const sizeSlider = document.getElementById('edit-size-slider');
    const sizeLabel = document.getElementById('edit-size-label');
    const saveButton = document.getElementById('edit-save-button');
    const eyedropperTool = document.getElementById('edit-tool-eyedropper');
    const fontSelect = document.getElementById('edit-font-select');
    
    // UI elements
    const statusDiv = document.getElementById('edit-status');
    const previewContainer = document.getElementById('edit-preview-container');

    let uploadedPdfBuffer = null;
    let baseCanvases = [];
    let overlayCanvases = [];
    let textEdits = [];
    let previousTool = 'brush';
    let isDrawing = false;
    let activeTool = 'brush'; // 'brush', 'text', 'eraser'
    let brushColor = '#ef4444';
    let brushSize = 5;
    let lastPos = { x: 0, y: 0 };

    // --- Event Listeners ---
    editFileInput.addEventListener('change', handleFileSelect);
    brushTool.addEventListener('click', () => setActiveTool('brush'));
    textTool.addEventListener('click', () => setActiveTool('text'));
    eraserTool.addEventListener('click', () => setActiveTool('eraser'));
    eyedropperTool.addEventListener('click', () => setActiveTool('eyedropper'));
    colorPicker.addEventListener('input', (e) => brushColor = e.target.value);
    sizeSlider.addEventListener('input', (e) => {
        brushSize = e.target.value;
        sizeLabel.textContent = brushSize;
    });
    saveButton.addEventListener('click', savePdf);


    function setActiveTool(tool) {
        if (tool === 'eyedropper' && activeTool !== 'eyedropper') {
            previousTool = activeTool;
        }
        activeTool = tool;
        brushTool.classList.toggle('active-tool', tool === 'brush');
        textTool.classList.toggle('active-tool', tool === 'text');
        eraserTool.classList.toggle('active-tool', tool === 'eraser');
        eyedropperTool.classList.toggle('active-tool', tool === 'eyedropper');
        previewContainer.style.cursor = tool === 'text' ? 'text' : 'crosshair';
    }

    function showStatus(type, message) {
        let color = type === 'error' ? 'text-red-600' : (type === 'success' ? 'text-green-600' : 'text-slate-600');
        const icon = type === 'loading' ? '<div class="spinner mx-auto"></div>' : '';
        statusDiv.innerHTML = `<div class="flex items-center justify-center space-x-2 ${color}">${icon}<p>${message}</p></div>`;
    }

    async function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        showStatus('loading', 'Reading and rendering PDF...');
        previewContainer.innerHTML = '';
        baseCanvases = [];
        overlayCanvases = [];
        textEdits = [];
        toolbar.classList.add('hidden');

        try {
            uploadedPdfBuffer = await file.arrayBuffer();
            const pdfjsDoc = await pdfjsLib.getDocument({ data: uploadedPdfBuffer.slice(0) }).promise;
            
            for (let i = 1; i <= pdfjsDoc.numPages; i++) {
                await renderPage(pdfjsDoc, i);
            }

            toolbar.classList.remove('hidden');
            showStatus('success', 'PDF loaded. Ready to edit.');

        } catch (err) {
            console.error("Edit tool error:", err);
            showStatus('error', 'Could not load PDF. It may be corrupted or protected.');
        }
    }

    async function renderPage(pdfDoc, pageNum) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for better quality

        // Create a wrapper for each page
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'page-wrapper';
        pageWrapper.style.width = `${viewport.width}px`;
        pageWrapper.style.height = `${viewport.height}px`;

        // Base canvas for the PDF page content
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = viewport.width;
        baseCanvas.height = viewport.height;
        const baseCtx = baseCanvas.getContext('2d');
        baseCanvases[pageNum - 1] = baseCanvas;

        // Overlay canvas for drawing
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.className = 'edit-overlay-canvas';
        overlayCanvas.width = viewport.width;
        overlayCanvas.height = viewport.height;
        overlayCanvases[pageNum - 1] = overlayCanvas;

        pageWrapper.appendChild(baseCanvas);
        pageWrapper.appendChild(overlayCanvas);
        previewContainer.appendChild(pageWrapper);

        // Render the PDF page content
        await page.render({ canvasContext: baseCtx, viewport: viewport }).promise;

        // Add event listeners to the overlay
        addDrawingListeners(overlayCanvas);
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    function addDrawingListeners(canvas) {
        canvas.addEventListener('mousedown', (e) => {
            if (activeTool === 'text') return;
            isDrawing = true;
            lastPos = getMousePos(canvas, e);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            const currentPos = getMousePos(canvas, e);
            drawOnCanvas(canvas, lastPos, currentPos);
            lastPos = currentPos;
        });

        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseleave', () => isDrawing = false);

        canvas.addEventListener('click', (e) => {
            const pos = getMousePos(canvas, e);
            const pageIndex = overlayCanvases.indexOf(canvas);

            if (activeTool === 'text') {
                const text = prompt('Enter text to add:');
                if (text) {
                    // Store the text edit object
                    textEdits.push({
                        text,
                        pos,
                        pageIndex,
                        font: fontSelect.value,
                        color: brushColor,
                        size: brushSize * 1.5 // Scale for better visual size
                    });
                    // Draw a preview on the overlay canvas
                    addTextToCanvas(canvas, text, pos, fontSelect.value, brushColor, brushSize * 1.5);
                }
            } else if (activeTool === 'eyedropper') {
                const baseCanvas = baseCanvases[pageIndex];
                const baseCtx = baseCanvas.getContext('2d');
                const p = baseCtx.getImageData(pos.x, pos.y, 1, 1).data;
                const hex = rgbToHex(p[0], p[1], p[2]);
                colorPicker.value = hex;
                brushColor = hex;
                // Switch back to the previous tool
                setActiveTool(previousTool);
            }
        });
    }

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function drawOnCanvas(canvas, from, to) {
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = activeTool === 'eraser' ? '#FFFFFF' : brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
    
    function addTextToCanvas(canvas, text, pos, font, color, size) {
        const ctx = canvas.getContext('2d');
        ctx.font = `${size}px "${font}"`; // Use selected font for preview
        ctx.fillStyle = color;
        ctx.textBaseline = 'top'; // Align text consistently
        ctx.fillText(text, pos.x, pos.y);
    }

    async function savePdf() {
        if (!uploadedPdfBuffer) return;
        showStatus('loading', 'Saving PDF...');
        saveButton.disabled = true;

        try {
            const pdfDoc = await PDFDocument.load(uploadedPdfBuffer);
            const pages = pdfDoc.getPages();
            const fontCache = new Map();

            // Helper to load/get fonts
            const getFont = async (fontName) => {
                if (fontCache.has(fontName)) return fontCache.get(fontName);

                let font;
                if (Object.values(StandardFonts).includes(fontName)) {
                    font = await pdfDoc.embedFont(fontName);
                } else {
                    // Fetch Google Font
                    const fontUrl = `https://fonts.gstatic.com/s/${fontName.toLowerCase().replace(/\s/g, '')}/v30/KFOlCnqEu92Fr1MmEU9fBBc4.ttf`; // A common variant URL, may need adjustment for other weights
                    try {
                        const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
                        font = await pdfDoc.embedFont(fontBytes);
                    } catch(e) {
                        console.warn(`Could not fetch font ${fontName}. Falling back to Helvetica.`, e);
                        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                    }
                }
                fontCache.set(fontName, font);
                return font;
            };

            // 1. Embed drawings from overlay canvases
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const overlay = overlayCanvases[i];
                if (!overlay) continue;

                const isOverlayEmpty = !overlay.getContext('2d')
                    .getImageData(0, 0, overlay.width, overlay.height).data
                    .some(channel => channel !== 0);

                if (isOverlayEmpty) continue;

                const overlayPng = await pdfDoc.embedPng(overlay.toDataURL());
                page.drawImage(overlayPng, {
                    x: 0,
                    y: 0,
                    width: page.getWidth(),
                    height: page.getHeight(),
                });
            }

            // 2. Embed text edits as real text
            for (const edit of textEdits) {
                const page = pages[edit.pageIndex];
                const font = await getFont(edit.font);

                // Convert hex color to RGB
                const r = parseInt(edit.color.slice(1, 3), 16) / 255;
                const g = parseInt(edit.color.slice(3, 5), 16) / 255;
                const b = parseInt(edit.color.slice(5, 7), 16) / 255;

                // pdf-lib's y-origin is bottom-left, canvas's is top-left
                const y = page.getHeight() - edit.pos.y;

                page.drawText(edit.text, {
                    x: edit.pos.x,
                    y: y,
                    font: font,
                    size: edit.size,
                    color: rgb(r, g, b),
                    lineHeight: edit.size * 1.2, // Add line height for better layout
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `edited-document.pdf`;
            link.textContent = 'Download Edited PDF';
            link.className = 'text-green-600 font-bold underline';

            showStatus('success', '');
            statusDiv.innerHTML = ''; // Clear status before adding link
            statusDiv.appendChild(link);
            
        } catch(err) {
            console.error("Save PDF Error:", err);
            showStatus('error', 'Failed to save the PDF.');
        } finally {
            saveButton.disabled = false;
        }
    }
});