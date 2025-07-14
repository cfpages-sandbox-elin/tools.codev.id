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
        F4: { width: 595.28, height: 935.43 } 
    };

    fileInput.addEventListener('change', handleFileSelect);
    splitViewToggle.addEventListener('click', toggleSplitView);
    generateButton.addEventListener('click', createFinalPdf);
    marginSelect.addEventListener('change', () => {
        customMarginInput.classList.toggle('hidden', marginSelect.value !== 'custom');
        if (pdfCanvas) {
            recalculateUnconfirmedLines();
            renderPages(); // The visual margin guides will update
        }
    });
    paperSizeSelect.addEventListener('change', () => {
        if (pdfCanvas) {
            recalculateUnconfirmedLines();
            renderPages();
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
            
            // --- Start of changes ---
            // Disable all buttons and clean up the UI
            previewSection.classList.add('hidden');
            splitViewToggle.classList.add('hidden');
            generateButton.classList.add('hidden');
            downloadLink.classList.add('hidden');
            addCutLineButton.classList.add('hidden');
            statusDiv.innerHTML = '';
            cutLines = [];
            
            // Automatically start the preview generation
            await renderPreview();
            // --- End of changes ---
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
            // Add willReadFrequently to address the performance warning
            pdfCanvasCtx = pdfCanvas.getContext('2d', { willReadFrequently: true });
            
            const renderContext = {
                canvasContext: pdfCanvasCtx,
                viewport: scaledViewport
            };
            
            // Since PDF.js progress tracking isn't reliable for single page renders,
            // we'll show a simple loading state
            const renderTask = page.render(renderContext);

            await renderTask.promise;

            calculateInitialCutLines();
            renderPages();
            
            previewSection.classList.remove('hidden');
            splitViewToggle.classList.remove('hidden');
            generateButton.classList.remove('hidden');
            addCutLineButton.classList.remove('hidden');
            downloadLink.classList.add('hidden');
            
            showStatus('success', `Preview generated. ${cutLines.length + 1} pages will be created.`);

        } catch (err) {
            showStatus('error', `Error rendering preview: ${err.message}`);
            console.error('Preview error:', err);  // Add console logging for debugging
        }
    }

    function calculateInitialCutLines() {
        // Don't recalculate if we're dragging
        if (isDragging) return;
        
        const marginPoints = getMarginValue();
        marginPixels = marginPoints * originalPageSize.scale;

        const targetRatio = paperDimensions[paperSizeSelect.value].height / paperDimensions[paperSizeSelect.value].width;
        maxSliceHeightPixels = (originalPageSize.width * targetRatio) * originalPageSize.scale;

        if (maxSliceHeightPixels <= 0) {
            showStatus('error', 'Invalid paper dimensions.');
            cutLines = [];
            return;
        }
        
        // Only recalculate positions if there are no lines yet
        if (cutLines.length === 0) {
            cutLines = [];
            let currentY = maxSliceHeightPixels;
            
            while (currentY < pdfCanvas.height - 10) {
                cutLines.push({ position: Math.round(currentY), confirmed: false });
                currentY += maxSliceHeightPixels;
            }
        }
    }

    function recalculateUnconfirmedLines() {
        // This function logic can be complex and depends on specific user requirements for auto-adjustment.
        // For now, we'll keep the simplified logic from the original code which just recalculates everything.
        // A more advanced version might only reposition lines *after* the last confirmed one.
        calculateInitialCutLines(); // Re-run initial calculation
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

        // Find the position of the last cut line. If none exist, start from 0.
        const lastPosition = cutLines.length > 0 ? cutLines[cutLines.length - 1].position : 0;
        
        // Calculate a sensible default position for the new line:
        // Halfway between the last line and the bottom of the page.
        // Or a fixed distance if that's too far. Let's use 1/3 of the default page height.
        let newPosition = lastPosition + (maxSliceHeightPixels / 3);

        // Ensure the new line is not placed off the canvas
        if (newPosition >= pdfCanvas.height - 10) {
            newPosition = lastPosition + (pdfCanvas.height - lastPosition) / 2;
        }
        if (newPosition >= pdfCanvas.height - 10) {
            showStatus('info', 'Cannot add new line so close to the end.');
            return;
        }

        cutLines.push({ position: Math.round(newPosition), confirmed: false });
        
        // IMPORTANT: Sort the lines by position in case the new line was added out of order
        // after the user dragged other lines around.
        cutLines.sort((a, b) => a.position - b.position);

        renderPages();
        updateStatus();
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
            
            // If we just confirmed a line, reposition following unconfirmed lines
            if (cutLines[index].confirmed) {
                repositionFollowingLines(index);
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
        renderPages(); // Keep the original renderPages call
    }

    function repositionFollowingLines(startIndex) {
        // Only reposition unconfirmed lines that come after the given index
        let lastPosition = cutLines[startIndex].position;
        
        for (let i = startIndex + 1; i < cutLines.length; i++) {
            if (!cutLines[i].confirmed) {
                // Position this line one page height after the previous line
                const newPosition = lastPosition + maxSliceHeightPixels;
                
                // Only update if the new position would be valid
                if (newPosition < pdfCanvas.height - 10) {
                    cutLines[i].position = Math.round(newPosition);
                    lastPosition = newPosition;
                }
            } else {
                // If we hit a confirmed line, use its position as the new reference
                lastPosition = cutLines[i].position;
            }
        }
    }

    function endDrag() {
        previewContainer.classList.remove('dragging');
        isDragging = false; // Clear flag
        
        if (activeDrag) {
            // Reposition any following unconfirmed lines
            repositionFollowingLines(activeDrag.index);
            activeDrag = null;
            
            // Now render everything with the updated positions
            renderPages();
        }
        
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
            const marginPoints = getMarginValue();
            const cutPointsY = [0, ...cutLines.map(c => c.position / originalPageSize.scale), originalPageSize.height];
            const scaleFactor = targetSize.width / originalPageSize.width;

            for (let i = 0; i < cutPointsY.length - 1; i++) {
                const sliceStartY = cutPointsY[i];
                const sliceEndY = cutPointsY[i + 1];
                const newPage = outputPdfDoc.addPage([targetSize.width, targetSize.height]);
                
                let contentTopY = (i === 0) ? targetSize.height : targetSize.height - marginPoints;
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
                if (contentBottomY > marginPoints) {
                    newPage.drawRectangle({ x: 0, y: marginPoints, width: targetSize.width, height: contentBottomY - marginPoints, color: white });
                }
                newPage.drawRectangle({ x: 0, y: 0, width: targetSize.width, height: marginPoints, color: white });
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
        const targetRatio = paperDimensions[paperSizeSelect.value].height / paperDimensions[paperSizeSelect.value].width;
        const marginPoints = getMarginValue();
        const pageHeightPixels = (originalPageSize.width * targetRatio) * originalPageSize.scale;
        const marginPixels = marginPoints * originalPageSize.scale;
        const prevPosition = lineIndex > 0 ? cutLines[lineIndex - 1].position : 0;
        
        let maxContentHeight = pageHeightPixels - (lineIndex === 0 ? marginPixels : 2 * marginPixels);
        const minContentHeight = 100;
        
        return {
            minPosition: prevPosition + minContentHeight,
            maxPosition: prevPosition + maxContentHeight,
        };
    }
});