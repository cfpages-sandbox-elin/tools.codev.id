// pdf-split.js file v1.0
const { PDFDocument: PDFLibPDFDocument, rgb } = PDFLib;
document.addEventListener('DOMContentLoaded', () => {
    // Check if the necessary elements for the split tool exist before running the script
    if (!document.getElementById('file-upload')) {
        return; // Exit if we are not on a page with the split tool
    }

    let uploadedFile = null;
    let originalPdfArrayBuffer = null;
    let originalPageSize = { width: 0, height: 0, scale: 1 };
    let cutLines = [];
    let pageStates = [];
    let maxSliceHeightPixels = 0;
    let marginPixels = 0;
    let activeDrag = null;
    let splitViewMode = false;
    let pdfCanvas = null;
    let pdfCanvasCtx = null;
    let isDragging = false;
    
    const fileInput = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name');
    const paperSizeSelect = document.getElementById('paper-size');
    const marginSelect = document.getElementById('margin-select');
    const customMarginInput = document.getElementById('custom-margin-input');
    const splitViewToggle = document.getElementById('split-view-toggle');
    const generateButton = document.getElementById('generate-button');
    const statusDiv = document.getElementById('status');
    const previewSection = document.getElementById('preview-section');
    const previewContainer = document.getElementById('preview-container');
    const pagesContainer = document.getElementById('pages-container');
    const downloadLink = document.getElementById('download-link');
    const addCutLineButton = document.getElementById('add-cut-line-button');

    const paperDimensions = { 
        A4: { width: 595.28, height: 841.89 }, 
        A5: { width: 419.53, height: 595.28 }, 
        Letter: { width: 612, height: 792 }, 
        Legal: { width: 612, height: 1008 }, 
        F4: { width: 595.28, height: 935.43 },
        FreeForm: { width: 0, height: 0 }
    };

    fileInput.addEventListener('change', handleFileSelect);
    splitViewToggle.addEventListener('click', toggleSplitView);
    generateButton.addEventListener('click', createFinalPdf);
    marginSelect.addEventListener('change', () => {
        customMarginInput.classList.toggle('hidden', marginSelect.value !== 'custom');
        if (pdfCanvas) {
            calculateInitialCutLines();
            renderPages();
            updateStatus();
        }
    });
    paperSizeSelect.addEventListener('change', () => {
        updateControlsForPaperSize();
        if (pdfCanvas) { // Recalculate lines for new paper size
            calculateInitialCutLines();
            renderPages();
            updateStatus();
        }
    });
    addCutLineButton.addEventListener('click', addCutLine);

    function getMarginValue() {
        return marginSelect.value === 'custom' ? (parseFloat(customMarginInput.value) || 0) : parseFloat(marginSelect.value);
    }

    async function handleFileSelect(e) {
        uploadedFile = e.target.files[0];
        if (uploadedFile) {
            fileNameDisplay.textContent = uploadedFile.name;
            previewSection.classList.add('hidden');
            splitViewToggle.classList.add('hidden');
            generateButton.classList.add('hidden');
            downloadLink.classList.add('hidden');
            addCutLineButton.classList.add('hidden');
            statusDiv.innerHTML = '';
            cutLines = [];
            pageStates = [];
            updateControlsForPaperSize();
            await renderPreview();
        }
    }

    async function renderPreview() {
        if (!uploadedFile) return;
        showStatus('progress', 'Loading PDF...');
        
        try {
            originalPdfArrayBuffer = await uploadedFile.arrayBuffer();
            const pdfjsDoc = await pdfjsLib.getDocument({ data: originalPdfArrayBuffer.slice(0) }).promise;
            if (pdfjsDoc.numPages !== 1) {
                showStatus('error', 'Error: This tool only supports single-page PDFs.'); 
                return;
            }
            showStatus('progress', 'Rendering preview...');
            const page = await pdfjsDoc.getPage(1);
            const desiredWidth = 1000;
            const viewport = page.getViewport({ scale: 1 });
            const scale = desiredWidth / viewport.width;
            const scaledViewport = page.getViewport({ scale });
            originalPageSize = { width: viewport.width, height: viewport.height, scale: scale };
            pdfCanvas = document.createElement('canvas');
            pdfCanvas.width = scaledViewport.width;
            pdfCanvas.height = scaledViewport.height;
            pdfCanvasCtx = pdfCanvas.getContext('2d', { willReadFrequently: true });
            const renderContext = { canvasContext: pdfCanvasCtx, viewport: scaledViewport };
            await page.render(renderContext).promise;
            calculateInitialCutLines();
            renderPages();
            previewSection.classList.remove('hidden');
            splitViewToggle.classList.remove('hidden');
            generateButton.classList.remove('hidden');
            addCutLineButton.classList.remove('hidden'); 
            downloadLink.classList.add('hidden');
            updateStatus();
        } catch (err) {
            showStatus('error', `Error rendering preview: ${err.message}`);
            console.error('Preview error:', err);
        }
    }

    function calculateInitialCutLines() {
        if (paperSizeSelect.value === 'FreeForm') {
            cutLines = [];
            pageStates = [{ omitted: false }]; // Start with one page (the whole document)
            maxSliceHeightPixels = 0; // Not applicable
            return;
        }

        const marginPoints = getMarginValue();
        marginPixels = marginPoints * originalPageSize.scale;
        const targetRatio = paperDimensions[paperSizeSelect.value].height / paperDimensions[paperSizeSelect.value].width;
        maxSliceHeightPixels = (originalPageSize.width * targetRatio) * originalPageSize.scale;
        if (maxSliceHeightPixels <= 0) {
            showStatus('error', 'Invalid paper dimensions.');
            cutLines = [];
            return;
        }
        if (cutLines.length === 0) {
            cutLines = [];
            let currentY = maxSliceHeightPixels;
            while (currentY < pdfCanvas.height - 10) {
                cutLines.push({ position: Math.round(currentY), confirmed: false });
                currentY += maxSliceHeightPixels;
            }
        }
        pageStates = Array(cutLines.length + 1).fill().map(() => ({ omitted: false }));
    }

    function updateControlsForPaperSize() {
        const isFreeForm = paperSizeSelect.value === 'FreeForm';
        // Hide the entire margin selection div for free form mode, as margins are not applicable.
        document.querySelector('label[for="margin-select"]').parentElement.classList.toggle('hidden', isFreeForm);
    }

    function checkAndAutoAddLines() {
        if (cutLines.length === 0) return;
        
        // Check if the last line is confirmed
        const lastLine = cutLines[cutLines.length - 1];
        if (!lastLine.confirmed) return;
        
        // Calculate remaining space after the last line
        const remainingHeight = pdfCanvas.height - lastLine.position;
        
        // If remaining height is more than a page size (plus some buffer), add a new line
        if (remainingHeight > maxSliceHeightPixels + 10) {
            // Add new lines until we've covered the remaining space
            let currentY = lastLine.position + maxSliceHeightPixels;
            
            while (currentY < pdfCanvas.height - 10) {
                cutLines.push({ position: Math.round(currentY), confirmed: false });
                currentY += maxSliceHeightPixels;
            }
            
            // Re-render to show the new lines
            renderPages();
            updateStatus();
        }
    }

    function addCutLine() {
        if (!pdfCanvas) return;
        
        const lastPosition = cutLines.length > 0 ? cutLines[cutLines.length - 1].position : 0;

        // Determine a sensible default height for the new slice
        const a4Ratio = paperDimensions.A4.height / paperDimensions.A4.width;
        const defaultStep = (originalPageSize.width * a4Ratio) * originalPageSize.scale;
        const stepToAdd = (paperSizeSelect.value === 'FreeForm' || maxSliceHeightPixels <= 0) 
            ? defaultStep 
            : maxSliceHeightPixels;

        let newPosition = lastPosition + (stepToAdd / 3); // Add the new line 1/3 of a page down
        if (newPosition >= pdfCanvas.height - 10) {
            newPosition = lastPosition + (pdfCanvas.height - lastPosition) / 2;
        }
        if (newPosition >= pdfCanvas.height - 10) {
            showStatus('info', 'Cannot add new line so close to the end.');
            return;
        }
        cutLines.push({ position: Math.round(newPosition), confirmed: false });
        cutLines.sort((a, b) => a.position - b.position);
        
        pageStates.push({ omitted: false });

        renderPages();
        updateStatus();
    }

    function toggleOmitPage(pageIndex) {
        if (pageStates[pageIndex]) {
            pageStates[pageIndex].omitted = !pageStates[pageIndex].omitted;
            renderPages();
            updateStatus();
        }
    }

    function renderPages() {
        pagesContainer.innerHTML = '';
        previewContainer.className = `relative w-full max-h-[80vh] overflow-y-auto border-2 border-slate-300 bg-slate-200 ${splitViewMode ? 'p-4 split-view-mode' : ''}`;
        
        const allPositions = [0, ...cutLines.map(c => c.position), pdfCanvas.height];
        
        for (let i = 0; i < allPositions.length - 1; i++) {
            const pageSection = document.createElement('div');
            pageSection.className = 'page-section';
            if (pageStates[i]?.omitted) {
                pageSection.classList.add('page-omitted');
            }
            const pageHeight = allPositions[i + 1] - allPositions[i];
            pageSection.style.height = `${pageHeight}px`;
            
            const sectionCanvas = document.createElement('canvas');
            sectionCanvas.width = pdfCanvas.width;
            sectionCanvas.height = pageHeight;
            sectionCanvas.getContext('2d').drawImage(pdfCanvas, 0, allPositions[i], pdfCanvas.width, pageHeight, 0, 0, pdfCanvas.width, pageHeight);
            pageSection.appendChild(sectionCanvas);
            
            const pageNumber = document.createElement('div');
            pageNumber.className = 'page-number';
            pageNumber.textContent = `Page ${i + 1}`;
            pageSection.appendChild(pageNumber);

            const omitButton = document.createElement('button');
            omitButton.className = 'page-omit-button';
            omitButton.title = pageStates[i]?.omitted ? 'Click to include this page' : 'Click to omit this page';
            omitButton.textContent = '❌';
            omitButton.onclick = () => toggleOmitPage(i);
            pageSection.appendChild(omitButton);
            
            if (paperSizeSelect.value !== 'FreeForm') {
                if (i > 0) {
                    const topMargin = document.createElement('div');
                    topMargin.className = 'page-margin';
                    topMargin.style.top = '0';
                    topMargin.style.height = `${marginPixels}px`;
                    pageSection.appendChild(topMargin);
                }
                const bottomMargin = document.createElement('div');
                bottomMargin.className = 'page-margin';
                bottomMargin.style.bottom = '0';
                bottomMargin.style.height = `${marginPixels}px`;
                pageSection.appendChild(bottomMargin);
            }

            if (i < allPositions.length - 2) {
                const cutLine = cutLines[i];
                const line = document.createElement('div');
                line.className = cutLine.confirmed ? 'cut-line-confirmed' : 'cut-line-initial';
                line.style.top = `${pageHeight - 2.5}px`;
                line.dataset.index = i;
                const handle = document.createElement('div');
                handle.className = 'cut-line-handle';
                handle.textContent = cutLine.confirmed ? `✓ Page ${i + 2}` : `Drag to adjust`;
                line.appendChild(handle);
                if (!cutLine.confirmed) line.addEventListener('mousedown', startDrag);
                line.addEventListener('click', toggleConfirmation);
                pageSection.appendChild(line);
            }            
            pagesContainer.appendChild(pageSection);
        }
    }

    function toggleSplitView() {
        splitViewMode = !splitViewMode;
        renderPages();
        splitViewToggle.textContent = splitViewMode ? 'Hide Split View' : 'Show Split View';
    }

    function toggleConfirmation(e) {
        if (e.target.classList.contains('cut-line-initial') || e.target.classList.contains('cut-line-confirmed')) {
            e.stopPropagation();
            const index = parseInt(e.currentTarget.dataset.index);
            cutLines[index].confirmed = !cutLines[index].confirmed;
            
            // If we just confirmed a line, reposition ONLY the next unconfirmed line
            if (cutLines[index].confirmed && index < cutLines.length - 1) {
                // Determine a sensible default height for the new slice
                const a4Ratio = paperDimensions.A4.height / paperDimensions.A4.width;
                const defaultStep = (originalPageSize.width * a4Ratio) * originalPageSize.scale;
                const stepToUse = (paperSizeSelect.value === 'FreeForm' || maxSliceHeightPixels <= 0) ? defaultStep : maxSliceHeightPixels;

                const nextLine = cutLines[index + 1];
                if (!nextLine.confirmed) {
                    // Position the next line one page height after this confirmed line
                    const newPosition = cutLines[index].position + stepToUse;
                    if (newPosition < pdfCanvas.height - 10) {
                        nextLine.position = Math.round(newPosition);
                    }
                }
            }
            
            // Always render pages to update the UI
            renderPages();
            
            // If we just confirmed a line, check if we need to auto-add more lines
            if (cutLines[index].confirmed) {
                checkAndAutoAddLines();
            }
            
            updateStatus();
        }
    }

    function startDrag(e) {
        previewContainer.classList.add('dragging');
        const line = e.target.closest('.cut-line-initial');
        if (!line) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const index = parseInt(line.dataset.index);
        isDragging = true; // Set flag
        activeDrag = {
            index,
            startY: e.clientY,
            startPosition: cutLines[index].position,
        };
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
    }

    function drag(e) {
        if (!activeDrag) return;
        
        const deltaY = e.clientY - activeDrag.startY;
        let newPosition = activeDrag.startPosition + deltaY;
        
        const constraints = getLineConstraints(activeDrag.index);
        newPosition = Math.max(constraints.minPosition, Math.min(constraints.maxPosition, newPosition));
        
        cutLines[activeDrag.index].position = Math.round(newPosition);
        renderPages();
    }

    function endDrag() {
        previewContainer.classList.remove('dragging');
        activeDrag = null;
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', endDrag);
        updateStatus();
    }

    function updateStatus() {
        const totalPages = cutLines.length + 1;
        const omittedCount = pageStates.filter(s => s.omitted).length;
        const finalPageCount = totalPages - omittedCount;
        showStatus('info', `${totalPages} pages will be created. ${omittedCount} omitted. Final PDF will have ${finalPageCount} pages.`);
    }

    async function createFinalPdf() {
        if (!originalPdfArrayBuffer) return;
        showStatus('loading', 'Generating final PDF...');
        generateButton.disabled = true;

        try {            
            const outputPdfDoc = await PDFLibPDFDocument.create();
            const [embeddedPage] = await outputPdfDoc.embedPdf(originalPdfArrayBuffer.slice(0));
            
            const targetSize = paperDimensions[paperSizeSelect.value];
            const marginPoints = getMarginValue();
            const cutPointsY = [0, ...cutLines.map(c => c.position / originalPageSize.scale), originalPageSize.height];
            const scaleFactor = targetSize.width / originalPageSize.width;

            let pagesGenerated = 0;

            if (paperSizeSelect.value === 'FreeForm') {
                // --- Free Form PDF Generation Logic ---
                for (let i = 0; i < cutPointsY.length - 1; i++) {
                    if (pageStates[i]?.omitted) continue;
                    pagesGenerated++;
                    const sliceStartY = cutPointsY[i];
                    const sliceEndY = cutPointsY[i + 1];
                    const sliceHeightPoints = sliceEndY - sliceStartY;

                    // Page size is determined by the slice itself
                    const newPage = outputPdfDoc.addPage([originalPageSize.width, sliceHeightPoints]);
                    
                    // Position the embedded page so that the correct slice is visible
                    const embeddedPageY = -(originalPageSize.height - sliceEndY);
                    newPage.drawPage(embeddedPage, { x: 0, y: embeddedPageY, width: originalPageSize.width, height: originalPageSize.height });
                }
            } else {
                // --- Standard Paper Size PDF Generation Logic ---
                for (let i = 0; i < cutPointsY.length - 1; i++) {
                    if (pageStates[i]?.omitted) continue;
                    pagesGenerated++;
                    const sliceStartY = cutPointsY[i];
                    const sliceEndY = cutPointsY[i + 1];
                    const newPage = outputPdfDoc.addPage([targetSize.width, targetSize.height]);
                
                    let contentTopY = (i === 0) ? targetSize.height : targetSize.height - marginPoints;
                    const embeddedPageY = contentTopY - (originalPageSize.height - sliceStartY) * scaleFactor;
                    newPage.drawPage(embeddedPage, { x: 0, y: embeddedPageY, width: targetSize.width, height: originalPageSize.height * scaleFactor });
                
                    const white = rgb(1, 1, 1);
                    if (contentTopY < targetSize.height) { newPage.drawRectangle({ x: 0, y: contentTopY, width: targetSize.width, height: targetSize.height - contentTopY, color: white }); }
                    const sliceHeight = (sliceEndY - sliceStartY) * scaleFactor;
                    const contentBottomY = contentTopY - sliceHeight;
                    if (contentBottomY > marginPoints) { newPage.drawRectangle({ x: 0, y: marginPoints, width: targetSize.width, height: contentBottomY - marginPoints, color: white }); }
                    newPage.drawRectangle({ x: 0, y: 0, width: targetSize.width, height: marginPoints, color: white });
                }
            }

            if (pagesGenerated === 0) {
                 showStatus('error', `No pages were generated. Did you omit all pages?`);
                 generateButton.disabled = false;
                 return;
            }

            const pdfBytes = await outputPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            downloadLink.href = url;
            downloadLink.download = `${uploadedFile.name.replace(/\.pdf$/i, '')}-split.pdf`;
            downloadLink.classList.remove('hidden');
            
            showStatus('success', `PDF successfully created! ${pagesGenerated} pages generated.`);

        } catch (err) {
            showStatus('error', `Failed to create PDF: ${err.message}`);
        } finally {
            generateButton.disabled = false;
        }
    }

    function showStatus(type, message) {
        if (type === 'progress') {
            // Simplified progress indicator since PDF.js doesn't provide reliable progress for single pages
            statusDiv.innerHTML = `
                <div class="flex items-center justify-center space-x-2 text-slate-600">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>`;
        } else if (type === 'loading') {
            statusDiv.innerHTML = `<div class="flex items-center justify-center space-x-2 text-slate-600"><div class="spinner"></div><p>${message}</p></div>`;
        } else {
            let color = type === 'error' ? 'text-red-600' : (type === 'success' ? 'text-green-600' : 'text-slate-600');
            statusDiv.innerHTML = `<div class="flex items-center justify-center space-x-2 ${color}"><p>${message}</p></div>`;
        }
    }

    function getLineConstraints(lineIndex) {
        const minSliceHeight = 20; // Prevent slices from being too small
        const prevPosition = lineIndex > 0 ? cutLines[lineIndex - 1].position : 0;
        const nextPosition = (lineIndex < cutLines.length - 1) ? cutLines[lineIndex + 1].position : pdfCanvas.height;

        let minPos = prevPosition + minSliceHeight;
        let maxPos = nextPosition - minSliceHeight;

        // For standard paper sizes, also constrain the max height of the slice
        if (paperSizeSelect.value !== 'FreeForm') {
            const targetRatio = paperDimensions[paperSizeSelect.value].height / paperDimensions[paperSizeSelect.value].width;
            const pageHeightPixels = (originalPageSize.width * targetRatio) * originalPageSize.scale;
            const marginPoints = getMarginValue();
            const marginPixelsValue = marginPoints * originalPageSize.scale;
            // A page slice can't be larger than the target page's content area.
            const maxContentHeight = pageHeightPixels - (lineIndex === 0 ? marginPixelsValue : 2 * marginPixelsValue);
            maxPos = Math.min(maxPos, prevPosition + maxContentHeight);
        }

        return { minPosition: minPos, maxPosition: maxPos };
    }
});