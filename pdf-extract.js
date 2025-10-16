// pdf-extract.js improve extract css
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
    
    // Function to render PDF thumbnails
    async function renderPdfThumbnails(file, fileIndex) {
        const fileContainer = document.createElement('div');
        fileContainer.className = 'file-container';
        fileContainer.id = `file-container-${fileIndex}`;
        
        // File name
        const fileName = document.createElement('p');
        fileName.className = 'font-medium text-sm text-slate-800 truncate';
        fileName.textContent = file.name;
        fileContainer.appendChild(fileName);
        
        // Page selection input
        const inputContainer = document.createElement('div');
        inputContainer.className = 'flex items-center mt-2';
        inputContainer.innerHTML = `
            <label for="pages-${fileIndex}" class="text-xs text-slate-600 mr-2">Pages:</label>
            <input type="text" id="pages-${fileIndex}" data-file-index="${fileIndex}" class="flex-grow pl-2 pr-2 py-1 text-sm border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 rounded-md" placeholder="e.g., 1, 3-5">
        `;
        fileContainer.appendChild(inputContainer);
        
        // Thumbnails container with wrapping layout
        const thumbnailsContainer = document.createElement('div');
        thumbnailsContainer.className = 'thumbnails-container';
        thumbnailsContainer.id = `thumbnails-${fileIndex}`;
        fileContainer.appendChild(thumbnailsContainer);
        
        extractFilesList.appendChild(fileContainer);
        
        // Load PDF and render thumbnails
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const numPages = pdf.numPages;
            
            // Render each page thumbnail
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 0.3 });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                await page.render(renderContext).promise;
                
                // Create page container
                const pageContainer = document.createElement('div');
                pageContainer.className = 'page-container';
                
                // Add canvas
                canvas.className = 'border border-gray-300 rounded cursor-pointer hover:border-teal-500';
                pageContainer.appendChild(canvas);
                
                // Add page number
                const pageNumLabel = document.createElement('div');
                pageNumLabel.className = 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center p-1';
                pageNumLabel.textContent = `Page ${pageNum}`;
                pageContainer.appendChild(pageNumLabel);
                
                // Add checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'absolute top-1 right-1 w-4 h-4';
                checkbox.dataset.fileIndex = fileIndex;
                checkbox.dataset.pageNum = pageNum;
                checkbox.id = `page-${fileIndex}-${pageNum}`;
                
                // Add label for checkbox
                const label = document.createElement('label');
                label.htmlFor = `page-${fileIndex}-${pageNum}`;
                label.className = 'absolute inset-0 cursor-pointer';
                
                pageContainer.appendChild(checkbox);
                pageContainer.appendChild(label);
                
                // Add event listeners
                checkbox.addEventListener('change', updatePageRangeInput);
                label.addEventListener('click', () => {
                    checkbox.checked = !checkbox.checked;
                    updatePageRangeInput.call(checkbox);
                });
                
                thumbnailsContainer.appendChild(pageContainer);
            }
        } catch (error) {
            console.error('Error rendering thumbnails:', error);
            const errorMsg = document.createElement('p');
            errorMsg.className = 'text-red-500 text-xs mt-2';
            errorMsg.textContent = 'Error loading PDF preview';
            fileContainer.appendChild(errorMsg);
        }
    }
    
    // Function to update page range input based on checkboxes
    function updatePageRangeInput() {
        const fileIndex = this.dataset.fileIndex;
        const input = document.getElementById(`pages-${fileIndex}`);
        const checkboxes = document.querySelectorAll(`input[data-file-index="${fileIndex}"][type="checkbox"]`);
        const selectedPages = [];
        
        checkboxes.forEach(cb => {
            if (cb.checked) {
                selectedPages.push(parseInt(cb.dataset.pageNum));
            }
        });
        
        // Format selected pages as a string
        if (selectedPages.length === 0) {
            input.value = '';
            return;
        }
        
        selectedPages.sort((a, b) => a - b);
        const ranges = [];
        let start = selectedPages[0];
        let end = start;
        
        for (let i = 1; i < selectedPages.length; i++) {
            if (selectedPages[i] === end + 1) {
                end = selectedPages[i];
            } else {
                if (start === end) {
                    ranges.push(start.toString());
                } else {
                    ranges.push(`${start}-${end}`);
                }
                start = selectedPages[i];
                end = start;
            }
        }
        
        if (start === end) {
            ranges.push(start.toString());
        } else {
            ranges.push(`${start}-${end}`);
        }
        
        input.value = ranges.join(',');
    }
    
    // Function to update checkboxes based on page range input
    function updateCheckboxesFromInput(fileIndex, rangeString) {
        const checkboxes = document.querySelectorAll(`input[data-file-index="${fileIndex}"][type="checkbox"]`);
        const maxPage = checkboxes.length;
        const pagesToSelect = parsePageRanges(rangeString, maxPage);
        
        checkboxes.forEach(cb => {
            cb.checked = pagesToSelect.includes(parseInt(cb.dataset.pageNum) - 1);
        });
    }
    
    // Add event listeners to page range inputs
    extractFilesList.addEventListener('input', (e) => {
        if (e.target.matches('input[data-file-index]')) {
            const fileIndex = e.target.dataset.fileIndex;
            updateCheckboxesFromInput(fileIndex, e.target.value);
        }
    });
    
    extractFileInput.addEventListener('change', async (e) => {
        showExtractStatus('loading', 'Reading and unzipping files...');
        extractButton.disabled = true;
        extractFilesList.innerHTML = '';
        extractResults.innerHTML = '';
        
        const inputFiles = Array.from(e.target.files);
        const finalPdfFiles = []; 
        for (const file of inputFiles) {
            if (file.name.toLowerCase().endsWith('.pdf')) {
                finalPdfFiles.push(file);
            } else if (file.name.toLowerCase().endsWith('.zip')) {
                try {
                    const jszip = new JSZip();
                    const zip = await jszip.loadAsync(file);
                    const pdfPromises = [];
                    zip.forEach((relativePath, zipEntry) => {
                        if (zipEntry.name.toLowerCase().endsWith('.pdf') && !zipEntry.dir && !zipEntry.name.startsWith('__MACOSX')) {
                            const promise = zipEntry.async('blob').then(blob => new File([blob], zipEntry.name, { type: 'application/pdf' }));
                            pdfPromises.push(promise);
                        }
                    });
                    const extractedPdfs = await Promise.all(pdfPromises);
                    finalPdfFiles.push(...extractedPdfs);
                } catch (err) {
                    console.error("Error unzipping file:", file.name, err);
                    showExtractStatus('error', `Could not read the zip file: ${file.name}`);
                    extractButton.disabled = false;
                    return;
                }
            }
        }
        finalPdfFiles.sort((a, b) => a.name.localeCompare(b.name));
        selectedFiles = finalPdfFiles;
        
        if (selectedFiles.length > 0) {
            // Render thumbnails for each file
            for (let i = 0; i < selectedFiles.length; i++) {
                await renderPdfThumbnails(selectedFiles[i], i);
            }
            
            extractButton.disabled = false;
            showExtractStatus('success', `${selectedFiles.length} PDF(s) loaded and ready.`);
        } else {
            extractButton.disabled = true;
            showExtractStatus('info', 'No PDF files were found in the upload.');
        }
    });
    
    extractButton.addEventListener('click', handleExtraction);
    
    function parsePageRanges(rangeString, maxPage) {
        const pages = new Set();
        if (!rangeString) return [];
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
    
    function showExtractStatus(type, message) {
        let color = type === 'error' ? 'text-red-600' : 
                    (type === 'success' ? 'text-green-600' : 
                    'text-slate-600');
        const icon = type === 'loading' ? '<div class="spinner mx-auto"></div>' : '';
        extractStatus.innerHTML = `<div class="flex items-center justify-center space-x-2 ${color}">${icon}<p>${message}</p></div>`;
    }
    
    // Function to trigger download
    function downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    async function handleExtraction() {
        if (selectedFiles.length === 0) return;
        showExtractStatus('loading', 'Processing files...');
        extractButton.disabled = true;
        extractResults.innerHTML = '';
        
        const generatedPdfs = [];
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const rangeInput = document.getElementById(`pages-${i}`);
            const rangeString = rangeInput.value;
            if (!rangeString) continue;
            
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFLibExtractDoc.load(arrayBuffer);
                const pagesToExtract = parsePageRanges(rangeString, pdfDoc.getPageCount());
                if (pagesToExtract.length === 0) {
                    console.warn(`Invalid page range for ${file.name}. Skipping.`);
                    continue;
                }
                const newPdfDoc = await PDFLibExtractDoc.create();
                const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToExtract);
                copiedPages.forEach(page => newPdfDoc.addPage(page));
                const pdfBytes = await newPdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const originalFileName = file.name.replace(/\.pdf$/i, '');
                const downloadName = `${originalFileName}-extracted.pdf`;
                generatedPdfs.push({ name: downloadName, blob: blob });
            } catch (err) {
                console.error(`Failed to process ${file.name}:`, err);
                showExtractStatus('error', `Could not process ${file.name}. It might be corrupted or protected.`);
            }
        }
        
        // After processing all files, download automatically
        if (generatedPdfs.length > 0) {
            if (generatedPdfs.length === 1) {
                // Download single PDF
                const pdf = generatedPdfs[0];
                downloadBlob(pdf.blob, pdf.name);
                showExtractStatus('success', 'Extraction complete! File downloaded automatically.');
            } else {
                // Create ZIP and download
                showExtractStatus('loading', 'Creating ZIP file...');
                const zip = new JSZip();
                generatedPdfs.forEach(pdf => {
                    zip.file(pdf.name, pdf.blob);
                });
                const zipBlob = await zip.generateAsync({ type: "blob" });
                downloadBlob(zipBlob, 'extracted-pdfs.zip');
                showExtractStatus('success', `Extraction complete! ZIP file downloaded automatically.`);
            }
        } else {
             showExtractStatus('info', 'No pages were extracted. Please check your page selections.');
        }
        extractButton.disabled = false;
    }
});