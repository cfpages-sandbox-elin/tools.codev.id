// Use a different alias for PDFDocument to avoid conflicts if both scripts were to merge scopes.
const { PDFDocument: PDFLibExtractDoc } = PDFLib;

document.addEventListener('DOMContentLoaded', () => {
    // Check if the necessary elements for the extract tool exist
    const extractFileInput = document.getElementById('extract-file-upload');
    if (!extractFileInput) {
        return; // Exit if we are not on a page with the extract tool
    }

    const extractFilesList = document.getElementById('extract-files-list');
    const extractButton = document.getElementById('extract-button');
    const extractStatus = document.getElementById('extract-status');
    const extractResults = document.getElementById('extract-results');

    let selectedFiles = [];

    extractFileInput.addEventListener('change', (e) => {
        selectedFiles = Array.from(e.target.files);
        extractFilesList.innerHTML = '';
        extractResults.innerHTML = '';
        extractStatus.innerHTML = '';
        
        if (selectedFiles.length > 0) {
            selectedFiles.forEach((file, index) => {
                const fileElement = document.createElement('div');
                fileElement.className = 'p-4 border rounded-lg bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4 items-center';
                fileElement.innerHTML = `
                    <p class="font-medium text-slate-800 truncate col-span-1 md:col-span-1" title="${file.name}">${file.name}</p>
                    <div class="col-span-1 md:col-span-2">
                        <label for="pages-${index}" class="text-sm text-slate-600">Pages to extract (e.g., 1, 3-5, 8):</label>
                        <input type="text" id="pages-${index}" data-file-index="${index}" class="mt-1 w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md" placeholder="e.g., 1, 3-5, 8">
                    </div>
                `;
                extractFilesList.appendChild(fileElement);
            });
            extractButton.disabled = false;
        } else {
            extractButton.disabled = true;
        }
    });

    extractButton.addEventListener('click', handleExtraction);

    /**
     * Parses a page range string (e.g., "1, 3-5, 8") into an array of 0-indexed page numbers.
     * @param {string} rangeString The string to parse.
     * @param {number} maxPage The total number of pages in the PDF.
     * @returns {number[]} An array of 0-indexed page numbers.
     */
    function parsePageRanges(rangeString, maxPage) {
        const pages = new Set();
        if (!rangeString) return [];

        const parts = rangeString.split(',');
        for (const part of parts) {
            const trimmedPart = part.trim();
            if (trimmedPart.includes('-')) {
                const [start, end] = trimmedPart.split('-').map(num => parseInt(num.trim(), 10));
                if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start && end <= maxPage) {
                    for (let i = start; i <= end; i++) {
                        pages.add(i - 1); // Convert to 0-indexed
                    }
                }
            } else {
                const pageNum = parseInt(trimmedPart, 10);
                if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPage) {
                    pages.add(pageNum - 1); // Convert to 0-indexed
                }
            }
        }
        return Array.from(pages).sort((a, b) => a - b);
    }

    function showExtractStatus(type, message) {
        let color = type === 'error' ? 'text-red-600' : 
                    (type === 'success' ? 'text-green-600' : 
                    'text-slate-600');
        const icon = type === 'loading' ? '<div class="spinner mx-auto"></div>' : '';
        extractStatus.innerHTML = `<div class="flex items-center justify-center space-x-2 ${color}">${icon}<p>${message}</p></div>`;
    }

    async function handleExtraction() {
        if (selectedFiles.length === 0) return;

        showExtractStatus('loading', 'Processing files...');
        extractButton.disabled = true;
        extractResults.innerHTML = '';
        let filesProcessed = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const rangeInput = document.getElementById(`pages-${i}`);
            const rangeString = rangeInput.value;

            if (!rangeString) {
                showExtractStatus('info', `Skipping ${file.name}: No pages specified.`);
                continue;
            }
            
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFLibExtractDoc.load(arrayBuffer);
                const totalPages = pdfDoc.getPageCount();

                const pagesToExtract = parsePageRanges(rangeString, totalPages);

                if (pagesToExtract.length === 0) {
                    showExtractStatus('error', `Error with ${file.name}: Invalid or no pages selected. Please check your input (e.g., 1, 3-5).`);
                    continue; // Skip to next file
                }

                const newPdfDoc = await PDFLibExtractDoc.create();
                const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToExtract);
                copiedPages.forEach(page => newPdfDoc.addPage(page));

                const pdfBytes = await newPdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                const originalFileName = file.name.replace(/\.pdf$/i, '');
                const downloadName = `${originalFileName}-extracted.pdf`;
                
                const link = document.createElement('a');
                link.href = url;
                link.download = downloadName;
                link.className = 'block w-full text-center p-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors';
                link.textContent = `Download ${downloadName}`;
                extractResults.appendChild(link);
                filesProcessed++;

            } catch (err) {
                console.error(`Failed to process ${file.name}:`, err);
                showExtractStatus('error', `Could not process ${file.name}. It might be corrupted or password-protected.`);
            }
        }
        
        if(filesProcessed > 0) {
             showExtractStatus('success', `Extraction complete! ${filesProcessed} file(s) ready for download.`);
        } else {
             showExtractStatus('info', 'No files were processed.');
        }

        extractButton.disabled = false;
    }
});