// --- File: pdf-numbering.js ---
document.addEventListener('DOMContentLoaded', () => {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;

    const numberingFileInput = document.getElementById('numbering-file-upload');
    if (!numberingFileInput) {
        return; // Exit if not on a page with the numbering tool
    }

    // UI Elements
    const optionsDiv = document.getElementById('numbering-options');
    const actionBar = document.getElementById('numbering-action-bar');
    const statusDiv = document.getElementById('numbering-status');
    const resultsDiv = document.getElementById('numbering-results');
    const previewContainer = document.getElementById('numbering-preview-container');
    const numberingButton = document.getElementById('numbering-button');

    // Option Inputs
    const positionSelect = document.getElementById('numbering-position');
    const styleSelect = document.getElementById('numbering-style');
    const marginInput = document.getElementById('numbering-margin');
    const sizeInput = document.getElementById('numbering-size');
    const colorInput = document.getElementById('numbering-color');
    const startInput = document.getElementById('numbering-start');
    const rangeInput = document.getElementById('numbering-range');
    const skipCoverCheckbox = document.getElementById('numbering-skip-cover');

    let uploadedFile = null;
    let uploadedPdfBuffer = null;
    let totalPages = 0;

    numberingFileInput.addEventListener('change', handleFileSelect);
    numberingButton.addEventListener('click', handleNumbering);

    // When style changes, update the other options to be user-friendly
    styleSelect.addEventListener('change', () => {
        const isWatermark = styleSelect.value === 'watermark';
        positionSelect.disabled = isWatermark;
        sizeInput.value = isWatermark ? 100 : 12;
        colorInput.value = isWatermark ? '#808080' : '#000000';
        marginInput.disabled = isWatermark;
        if (isWatermark) {
            positionSelect.value = 'bottom-center'; // Reset to avoid confusion
        }
    });

    function showStatus(type, message) {
        let color = type === 'error' ? 'text-red-600' : (type === 'success' ? 'text-green-600' : 'text-slate-600');
        const icon = type === 'loading' ? '<div class="spinner mx-auto"></div>' : '';
        statusDiv.innerHTML = `<div class="flex items-center justify-center space-x-2 ${color}">${icon}<p>${message}</p></div>`;
    }

    async function handleFileSelect(e) {
        uploadedFile = e.target.files[0];
        if (!uploadedFile) return;

        // Reset UI
        previewContainer.innerHTML = '';
        resultsDiv.innerHTML = '';
        optionsDiv.classList.add('hidden');
        actionBar.classList.add('hidden');
        totalPages = 0;
        showStatus('loading', 'Reading and processing PDF...');

        try {
            uploadedPdfBuffer = await uploadedFile.arrayBuffer();
            const pdfjsDoc = await pdfjsLib.getDocument({ data: uploadedPdfBuffer.slice(0) }).promise;
            totalPages = pdfjsDoc.numPages;

            showStatus('loading', `Rendering ${totalPages} page previews...`);

            const renderPromises = [];
            for (let i = 1; i <= totalPages; i++) {
                renderPromises.push(renderPagePreview(pdfjsDoc, i));
            }
            await Promise.all(renderPromises);

            optionsDiv.classList.remove('hidden');
            actionBar.classList.remove('hidden');
            showStatus('success', 'PDF loaded. Adjust options and add numbers.');

        } catch (err) {
            console.error("Error processing PDF for numbering:", err);
            showStatus('error', 'Could not process the PDF. It might be corrupted or protected.');
        }
    }

    async function renderPagePreview(pdfDoc, pageNum) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        const scale = 200 / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const card = document.createElement('div');
        card.className = 'border border-slate-200 rounded-lg p-1 bg-white shadow-sm';

        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

        const pageLabel = document.createElement('p');
        pageLabel.className = 'text-center text-xs text-slate-600 mt-2 font-medium';
        pageLabel.textContent = `Page ${pageNum}`;

        card.appendChild(canvas);
        card.appendChild(pageLabel);
        previewContainer.appendChild(card);
    }

    function parsePageRanges(rangeString, maxPage) {
        const pages = new Set();
        if (!rangeString) { // If blank, number all pages
            for (let i = 0; i < maxPage; i++) pages.add(i);
            return Array.from(pages);
        }
        const parts = rangeString.split(',');
        for (const part of parts) {
            const trimmedPart = part.trim();
            if (trimmedPart.includes('-')) {
                const [start, end] = trimmedPart.split('-').map(num => parseInt(num.trim(), 10));
                if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start && end <= maxPage) {
                    for (let i = start; i <= end; i++) pages.add(i - 1);
                }
            } else {
                const pageNum = parseInt(trimmedPart, 10);
                if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPage) pages.add(pageNum - 1);
            }
        }
        return Array.from(pages).sort((a, b) => a - b);
    }

    async function handleNumbering() {
        if (!uploadedPdfBuffer) return;

        showStatus('loading', 'Embedding page numbers...');
        numberingButton.disabled = true;
        resultsDiv.innerHTML = '';

        try {
            const pdfDoc = await PDFDocument.load(uploadedPdfBuffer);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            // Get options
            const style = styleSelect.value;
            const position = positionSelect.value;
            const margin = parseInt(marginInput.value, 10) || 0;
            const size = parseInt(sizeInput.value, 10) || 12;
            const startNum = parseInt(startInput.value, 10) || 1;
            const hexColor = colorInput.value;
            const r = parseInt(hexColor.slice(1, 3), 16) / 255;
            const g = parseInt(hexColor.slice(3, 5), 16) / 255;
            const b = parseInt(hexColor.slice(5, 7), 16) / 255;
            const color = rgb(r, g, b);
            const skipCover = skipCoverCheckbox.checked;

            let pagesToNumber = parsePageRanges(rangeInput.value.trim(), pages.length);

            // Filter out the first page if 'skip cover' is checked
            if (skipCover) {
                pagesToNumber = pagesToNumber.filter(p => p !== 0);
            }

            if (pagesToNumber.length === 0) {
                showStatus('error', 'No pages selected for numbering. Check your range or "Skip Cover" setting.');
                numberingButton.disabled = false;
                return;
            }
            
            let currentNumber = startNum;
            for (const pageIndex of pagesToNumber) {
                const page = pages[pageIndex];
                const { width, height } = page.getSize();
                const pageNumberText = String(currentNumber);
                currentNumber++;

                const textWidth = font.widthOfTextAtSize(pageNumberText, size);
                let x, y;

                if (style === 'watermark') {
                    const largeSize = Math.min(width, height) * 0.4;
                    const largeTextWidth = font.widthOfTextAtSize(pageNumberText, largeSize);
                    x = (width - largeTextWidth) / 2;
                    y = height / 2 - (largeSize / 3);
                    page.drawText(pageNumberText, { x, y, font, size: largeSize, color, opacity: 0.2 });
                } else {
                    if (position.includes('bottom')) {
                        y = margin;
                    } else { // top
                        y = height - size - margin;
                    }

                    if (position.includes('center')) {
                        x = (width - textWidth) / 2;
                    } else if (position.includes('left')) {
                        x = margin;
                    } else { // right
                        x = width - textWidth - margin;
                    }
                    page.drawText(pageNumberText, { x, y, font, size, color, opacity: 1.0 });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            const originalFileName = uploadedFile.name.replace(/\.pdf$/i, '');
            link.download = `${originalFileName}-numbered.pdf`;
            link.textContent = 'Download Numbered PDF';
            link.className = 'inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700';

            resultsDiv.appendChild(link);
            showStatus('success', 'Page numbers added successfully!');

        } catch (err) {
            console.error("Numbering Error:", err);
            showStatus('error', 'Failed to add page numbers. The file may be corrupted.');
        } finally {
            numberingButton.disabled = false;
        }
    }
});