// file pdf-edit.js add image +fix
document.addEventListener('DOMContentLoaded', () => {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;

    const editFileInput = document.getElementById('edit-file-upload');
    if (!editFileInput) return; // Exit if not on the edit tool page

    // Toolbar elements
    const toolbar = document.getElementById('edit-toolbar');
    const brushTool = document.getElementById('edit-tool-brush');
    const textTool = document.getElementById('edit-tool-text');
    const imageUploadInput = document.getElementById('edit-image-upload');
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
    let imageEdits = [];
    let previousTool = 'brush';
    let isDrawing = false;
    let activeTool = 'brush'; // 'brush', 'text', 'eraser', 'eyedropper'
    let brushColor = '#ef4444';
    let brushSize = 5;
    let lastPos = { x: 0, y: 0 };

    // --- Event Listeners ---
    editFileInput.addEventListener('change', handleFileSelect);
    brushTool.addEventListener('click', () => setActiveTool('brush'));
    textTool.addEventListener('click', () => setActiveTool('text'));
    eraserTool.addEventListener('click', () => setActiveTool('eraser'));
    eyedropperTool.addEventListener('click', () => setActiveTool('eyedropper'));
    imageUploadInput.addEventListener('change', handleImageUpload);
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
        imageEdits = [];
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
        const viewport = page.getViewport({ scale: 1.5 });

        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'page-wrapper';
        pageWrapper.style.width = `${viewport.width}px`;
        pageWrapper.style.height = `${viewport.height}px`;
        pageWrapper.dataset.pageIndex = pageNum - 1;

        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = viewport.width;
        baseCanvas.height = viewport.height;
        baseCanvases[pageNum - 1] = baseCanvas;

        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.className = 'edit-overlay-canvas';
        overlayCanvas.width = viewport.width;
        overlayCanvas.height = viewport.height;
        overlayCanvases[pageNum - 1] = overlayCanvas;

        pageWrapper.appendChild(baseCanvas);
        pageWrapper.appendChild(overlayCanvas);
        previewContainer.appendChild(pageWrapper);

        await page.render({ canvasContext: baseCanvas.getContext('2d'), viewport: viewport }).promise;
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
                    textEdits.push({ text, pos, pageIndex, font: fontSelect.value, color: brushColor, size: brushSize * 1.5 });
                    addTextToCanvas(canvas, text, pos, fontSelect.value, brushColor, brushSize * 1.5);
                }
            } else if (activeTool === 'eyedropper') {
                const baseCtx = baseCanvases[pageIndex].getContext('2d');
                const p = baseCtx.getImageData(pos.x, pos.y, 1, 1).data;
                const hex = rgbToHex(p[0], p[1], p[2]);
                colorPicker.value = hex;
                brushColor = hex;
                setActiveTool(previousTool);
            }
        });
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const img = new Image();
            img.onload = () => {
                const pageWrappers = [...document.querySelectorAll('.page-wrapper')];
                let targetPageWrapper = pageWrappers.find(pw => {
                    const rect = pw.getBoundingClientRect();
                    return rect.top < window.innerHeight && rect.bottom > 0;
                }) || pageWrappers[0];

                if (!targetPageWrapper) {
                     showStatus('error', 'Could not find a page to add the image to.');
                     return;
                }

                const pageIndex = parseInt(targetPageWrapper.dataset.pageIndex, 10);
                const initialWidth = 200;
                const aspectRatio = img.height / img.width;

                const edit = {
                    id: `img-${Date.now()}`,
                    pageIndex,
                    dataUrl,
                    x: 50,
                    y: 50,
                    width: initialWidth,
                    height: initialWidth * aspectRatio,
                    aspectRatio: aspectRatio,
                };
                imageEdits.push(edit);
                createImageOnPage(edit);
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }

    function createImageOnPage(edit) {
        const pageWrapper = document.querySelector(`.page-wrapper[data-page-index="${edit.pageIndex}"]`);
        if (!pageWrapper) return;
        
        const wrapper = document.createElement('div');
        wrapper.id = edit.id;
        wrapper.className = 'edit-object-wrapper';
        wrapper.style.left = `${edit.x}px`;
        wrapper.style.top = `${edit.y}px`;
        wrapper.style.width = `${edit.width}px`;
        wrapper.style.height = `${edit.height}px`;

        const img = document.createElement('img');
        img.src = edit.dataUrl;
        wrapper.appendChild(img);

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle br';
        wrapper.appendChild(resizeHandle);
        
        pageWrapper.appendChild(wrapper);
        
        addMoveAndResizeListeners(wrapper, edit);
    }
    
    function addMoveAndResizeListeners(element, edit) {
        let isDragging = false, isResizing = false;
        let startX, startY, startLeft, startTop, startWidth, startHeight;

        const onMouseDown = (e) => {
            e.stopPropagation();
            isDragging = true;
            element.classList.add('selected');
            startX = e.clientX;
            startY = e.clientY;
            startLeft = element.offsetLeft;
            startTop = element.offsetTop;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onResizeMouseDown = (e) => {
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = element.offsetWidth;
            startHeight = element.offsetHeight;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        
        const onMouseMove = (e) => {
            if (isDragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                element.style.left = `${startLeft + dx}px`;
                element.style.top = `${startTop + dy}px`;
            } else if (isResizing) {
                const dx = e.clientX - startX;
                const newWidth = startWidth + dx;
                if (newWidth > 20) {
                    element.style.width = `${newWidth}px`;
                    element.style.height = `${newWidth * edit.aspectRatio}px`;
                }
            }
        };

        const onMouseUp = () => {
            if (isDragging || isResizing) {
                const currentEdit = imageEdits.find(item => item.id === edit.id);
                if (currentEdit) {
                    currentEdit.x = element.offsetLeft;
                    currentEdit.y = element.offsetTop;
                    currentEdit.width = element.offsetWidth;
                    currentEdit.height = element.offsetHeight;
                }
            }
            isDragging = false;
            isResizing = false;
            element.classList.remove('selected');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        element.addEventListener('mousedown', onMouseDown);
        element.querySelector('.resize-handle').addEventListener('mousedown', onResizeMouseDown);
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
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }
    
    function addTextToCanvas(canvas, text, pos, font, color, size) {
        const ctx = canvas.getContext('2d');
        ctx.font = `${size}px "${font}"`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
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

            const getFont = async (fontName) => {
                if (fontCache.has(fontName)) return fontCache.get(fontName);
                let font;
                try {
                    if (Object.values(StandardFonts).includes(fontName)) {
                        font = await pdfDoc.embedFont(fontName);
                    } else {
                        const fontUrl = `https://fonts.gstatic.com/s/${fontName.toLowerCase().replace(/\s/g, '')}/v30/KFOlCnqEu92Fr1MmEU9fBBc4.ttf`;
                        const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
                        font = await pdfDoc.embedFont(fontBytes);
                    }
                } catch(e) {
                    console.warn(`Could not fetch font ${fontName}. Falling back to Helvetica.`, e);
                    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                }
                fontCache.set(fontName, font);
                return font;
            };

            // Layer 1: Drawings
            for (let i = 0; i < pages.length; i++) {
                const overlay = overlayCanvases[i];
                if (!overlay) continue;
                const isOverlayEmpty = !overlay.getContext('2d').getImageData(0, 0, overlay.width, overlay.height).data.some(channel => channel !== 0);
                if (isOverlayEmpty) continue;
                const overlayPng = await pdfDoc.embedPng(overlay.toDataURL());
                pages[i].drawImage(overlayPng, { x: 0, y: 0, width: pages[i].getWidth(), height: pages[i].getHeight() });
            }

            // Layer 2: Images
            for (const edit of imageEdits) {
                const page = pages[edit.pageIndex];
                const imageBytes = await fetch(edit.dataUrl).then(res => res.arrayBuffer());
                const embeddedImg = edit.dataUrl.startsWith('data:image/png') ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
                const scale = page.getWidth() / baseCanvases[edit.pageIndex].width;
                const x = edit.x * scale;
                const y = page.getHeight() - (edit.y * scale) - (edit.height * scale);
                const width = edit.width * scale;
                const height = edit.height * scale;
                page.drawImage(embeddedImg, { x, y, width, height });
            }

            // Layer 3: Text
            for (const edit of textEdits) {
                const page = pages[edit.pageIndex];
                const font = await getFont(edit.font);
                const r = parseInt(edit.color.slice(1, 3), 16) / 255;
                const g = parseInt(edit.color.slice(3, 5), 16) / 255;
                const b = parseInt(edit.color.slice(5, 7), 16) / 255;
                const scale = page.getWidth() / baseCanvases[edit.pageIndex].width;
                const x = edit.pos.x * scale;
                const y = page.getHeight() - (edit.pos.y * scale);
                const size = edit.size * scale;
                page.drawText(edit.text, { x, y: y - size, font, size, color: rgb(r, g, b) });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `edited-document.pdf`;
            link.textContent = 'Download Edited PDF';
            link.className = 'text-green-600 font-bold underline';
            statusDiv.innerHTML = '';
            statusDiv.appendChild(link);
            
        } catch(err) {
            console.error("Save PDF Error:", err);
            showStatus('error', 'Failed to save the PDF. Could not embed resources.');
        } finally {
            saveButton.disabled = false;
        }
    }
});