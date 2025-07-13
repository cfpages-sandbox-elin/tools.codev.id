const { PDFDocument: PDFLibPDFDocument, rgb } = PDFLib;

// Wrap all logic in an event listener to ensure the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if the necessary elements for the split tool exist before running the script
    if (!document.getElementById('file-upload')) {
        return; // Exit if we are not on a page with the split tool
    }

    let uploadedFile = null;
    let originalPdfArrayBuffer = null;
    let originalPageSize = { width: 0, height: 0, scale: 1 };
    let cutLines = []; // Array of {position: number, confirmed: boolean}
    let maxSliceHeightPixels = 0;
    let paddingPixels = 0;
    let activeDrag = null;
    let splitViewMode = false;
    let pdfCanvas = null;
    let pdfCanvasCtx = null;
    
    const fileInput = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name');
    const paperSizeSelect = document.getElementById('paper-size');
    const paddingSelect = document.getElementById('padding-select');
    const customPaddingInput = document.getElementById('custom-padding-input');
    const previewButton = document.getElementById('preview-button');
    const splitViewToggle = document.getElementById('split-view-toggle');
    const generateButton = document.getElementById('generate-button');
    const statusDiv = document.getElementById('status');
    const previewSection = document.getElementById('preview-section');
    const previewContainer = document.getElementById('preview-container');
    const pagesContainer = document.getElementById('pages-container');
    const downloadLink = document.getElementById('download-link');

    const paperDimensions = { 
        A4: { width: 595.28, height: 841.89 }, 
        A5: { width: 419.53, height: 595.28 }, 
        Letter: { width: 612, height: 792 }, 
        Legal: { width: 612, height: 1008 }, 
        F4: { width: 595.28, height: 935.43 } 
    };

    fileInput.addEventListener('change', handleFileSelect);
    previewButton.addEventListener('click', renderPreview);
    splitViewToggle.addEventListener('click', toggleSplitView);
    generateButton.addEventListener('click', createFinalPdf);
    paddingSelect.addEventListener('change', () => {
        customPaddingInput.classList.toggle('hidden', paddingSelect.value !== 'custom');
        if (pdfCanvas) {
            recalculateUnconfirmedLines();
            renderPages();
        }
    });
    paperSizeSelect.addEventListener('change', () => {
        if (pdfCanvas) {
            recalculateUnconfirmedLines();
            renderPages();
        }
    });

    function getPaddingValue() {
        return paddingSelect.value === 'custom' ? (parseFloat(customPaddingInput.value) || 0) : parseFloat(paddingSelect.value);
    }

    function handleFileSelect(e) {
        uploadedFile = e.target.files[0];
        if (uploadedFile) {
            fileNameDisplay.textContent = uploadedFile.name;
            previewButton.disabled = false;
            previewSection.classList.add('hidden');
            splitViewToggle.classList.add('hidden');
            generateButton.classList.add('hidden');
            downloadLink.classList.add('hidden');
            statusDiv.innerHTML = '';
            cutLines = [];
        }
    }

    async function renderPreview() {
        if (!uploadedFile) return;
        showStatus('loading', 'Loading and rendering PDF preview...');
        previewButton.disabled = true;
        
        try {
            originalPdfArrayBuffer = await uploadedFile.arrayBuffer();
            const pdfjsDoc = await pdfjsLib.getDocument({ data: originalPdfArrayBuffer.slice(0) }).promise;
            
            if (pdfjsDoc.numPages !== 1) {
                showStatus('error', 'Error: This tool only supports single-page PDFs.'); 
                return;
            }

            const page = await pdfjsDoc.getPage(1);
            const desiredWidth = 1000;
            const viewport = page.getViewport({ scale: 1 });
            const scale = desiredWidth / viewport.width;
            const scaledViewport = page.getViewport({ scale });

            originalPageSize = { width: viewport.width, height: viewport.height, scale: scale };
            
            pdfCanvas = document.createElement('canvas');
            pdfCanvas.width = scaledViewport.width;
            pdfCanvas.height = scaledViewport.height;
            pdfCanvasCtx = pdfCanvas.getContext('2d');
            
            await page.render({ canvasContext: pdfCanvasCtx, viewport: scaledViewport }).promise;

            calculateInitialCutLines();
            renderPages();
            
            previewSection.classList.remove('hidden');
            splitViewToggle.classList.remove('hidden');
            generateButton.classList.remove('hidden');
            downloadLink.classList.add('hidden');
            showStatus('success', `Preview generated. ${cutLines.length + 1} pages will be created.`);
        } catch (err) {
            showStatus('error', `Error rendering preview: ${err.message}`);
        } finally {
            previewButton.disabled = false;
        }
    }

    function calculateInitialCutLines() {
        const targetRatio = paperDimensions[paperSizeSelect.value].height / paperDimensions[paperSizeSelect.value].width;
        const paddingPoints = getPaddingValue();
        paddingPixels = paddingPoints * originalPageSize.scale;
        
        const targetHeightPoints = originalPageSize.width * targetRatio;
        const targetContentHeightPoints = targetHeightPoints - (2 * paddingPoints);

        if (targetContentHeightPoints <= 0) {
            showStatus('error', 'Padding is too large for the selected paper size.');
            cutLines = [];
            maxSliceHeightPixels = 0;
            return;
        }

        maxSliceHeightPixels = targetContentHeightPoints * originalPageSize.scale;
        const firstPageContentHeight = (targetHeightPoints - paddingPoints) * originalPageSize.scale;
        
        cutLines = [];
        let currentY = firstPageContentHeight;
        
        while (currentY < pdfCanvas.height - 10) {
            cutLines.push({ position: Math.round(currentY), confirmed: false });
            currentY += maxSliceHeightPixels;
        }
    }

    function recalculateUnconfirmedLines() {
        // This function logic can be complex and depends on specific user requirements for auto-adjustment.
        // For now, we'll keep the simplified logic from the original code which just recalculates everything.
        // A more advanced version might only reposition lines *after* the last confirmed one.
        calculateInitialCutLines(); // Re-run initial calculation
    }

    function renderPages() {
        pagesContainer.innerHTML = '';
        previewContainer.className = `relative w-full max-h-[80vh] overflow-y-auto border-2 border-slate-300 bg-slate-200 ${splitViewMode ? 'p-4 split-view-mode' : ''}`;
        
        const allPositions = [0, ...cutLines.map(c => c.position), pdfCanvas.height];
        
        for (let i = 0; i < allPositions.length - 1; i++) {
            const pageSection = document.createElement('div');
            pageSection.className = 'page-section';
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
            
            if (i > 0) {
                const topPadding = document.createElement('div');
                topPadding.className = 'page-padding';
                topPadding.style.top = '0';
                topPadding.style.height = `${paddingPixels}px`;
                pageSection.appendChild(topPadding);
            }
            
            const bottomPadding = document.createElement('div');
            bottomPadding.className = 'page-padding';
            bottomPadding.style.bottom = '0';
            bottomPadding.style.height = `${paddingPixels}px`;
            pageSection.appendChild(bottomPadding);
            
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
            renderPages();
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
        const confirmedCount = cutLines.filter(c => c.confirmed).length;
        const totalCount = cutLines.length;
        if (confirmedCount < totalCount) {
            showStatus('info', `${confirmedCount} of ${totalCount} cut lines confirmed. ${totalCount + 1} pages will be created.`);
        } else {
            showStatus('success', `All ${totalCount} cut lines confirmed. Ready to create final PDF.`);
        }
    }

    async function createFinalPdf() {
        if (!originalPdfArrayBuffer) return;
        showStatus('loading', 'Generating final PDF...');
        generateButton.disabled = true;

        try {
            const outputPdfDoc = await PDFLibPDFDocument.create();
            const [embeddedPage] = await outputPdfDoc.embedPdf(originalPdfArrayBuffer.slice(0));
            
            const targetSize = paperDimensions[paperSizeSelect.value];
            const paddingPoints = getPaddingValue();
            const cutPointsY = [0, ...cutLines.map(c => c.position / originalPageSize.scale), originalPageSize.height];
            const scaleFactor = targetSize.width / originalPageSize.width;

            for (let i = 0; i < cutPointsY.length - 1; i++) {
                const sliceStartY = cutPointsY[i];
                const sliceEndY = cutPointsY[i + 1];
                const newPage = outputPdfDoc.addPage([targetSize.width, targetSize.height]);
                
                let contentTopY = (i === 0) ? targetSize.height : targetSize.height - paddingPoints;
                const embeddedPageY = contentTopY - (originalPageSize.height - sliceStartY) * scaleFactor;
                
                newPage.drawPage(embeddedPage, {
                    x: 0, y: embeddedPageY,
                    width: targetSize.width, height: originalPageSize.height * scaleFactor,
                });
                
                const white = rgb(1, 1, 1);
                if (contentTopY < targetSize.height) {
                    newPage.drawRectangle({ x: 0, y: contentTopY, width: targetSize.width, height: targetSize.height - contentTopY, color: white });
                }
                const sliceHeight = (sliceEndY - sliceStartY) * scaleFactor;
                const contentBottomY = contentTopY - sliceHeight;
                if (contentBottomY > paddingPoints) {
                    newPage.drawRectangle({ x: 0, y: paddingPoints, width: targetSize.width, height: contentBottomY - paddingPoints, color: white });
                }
                newPage.drawRectangle({ x: 0, y: 0, width: targetSize.width, height: paddingPoints, color: white });
            }

            const pdfBytes = await outputPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            downloadLink.href = url;
            downloadLink.download = `${uploadedFile.name.replace(/\.pdf$/i, '')}-split.pdf`;
            downloadLink.classList.remove('hidden');
            
            showStatus('success', `PDF successfully created! ${cutPointsY.length - 1} pages generated.`);

        } catch (err) {
            showStatus('error', `Failed to create PDF: ${err.message}`);
        } finally {
            generateButton.disabled = false;
        }
    }

    function showStatus(type, message) {
        let color = type === 'error' ? 'text-red-600' : (type === 'success' ? 'text-green-600' : 'text-slate-600');
        const icon = type === 'loading' ? '<div class="spinner mx-auto"></div>' : '';
        statusDiv.innerHTML = `<div class="flex items-center justify-center space-x-2 ${color}">${icon}<p>${message}</p></div>`;
    }

    function getLineConstraints(lineIndex) {
        const targetRatio = paperDimensions[paperSizeSelect.value].height / paperDimensions[paperSizeSelect.value].width;
        const paddingPoints = getPaddingValue();
        const pageHeightPixels = (originalPageSize.width * targetRatio) * originalPageSize.scale;
        const paddingPixels = paddingPoints * originalPageSize.scale;
        const prevPosition = lineIndex > 0 ? cutLines[lineIndex - 1].position : 0;
        
        let maxContentHeight = pageHeightPixels - (lineIndex === 0 ? paddingPixels : 2 * paddingPixels);
        const minContentHeight = 100;
        
        return {
            minPosition: prevPosition + minContentHeight,
            maxPosition: prevPosition + maxContentHeight,
        };
    }
});