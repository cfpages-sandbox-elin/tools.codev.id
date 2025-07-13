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

    extractFileInput.addEventListener('change', async (e) => {
        showExtractStatus('loading', 'Reading files...');
        extractButton.disabled = true;
        extractFilesList.innerHTML = '';
        extractResults.innerHTML = '';

        const inputFiles = Array.from(e.target.files);
        const pdfFiles = [];
        
        // This function will process all uploaded files, including unzipping.
        const processFiles = async () => {
            for (const file of inputFiles) {
                if (file.name.toLowerCase().endsWith('.pdf')) {
                    pdfFiles.push(file);
                } else if (file.name.toLowerCase().endsWith('.zip')) {
                    try {
                        const jszip = new JSZip();
                        const zip = await jszip.loadAsync(file);
                        const zipPdfPromises = [];

                        zip.forEach((relativePath, zipEntry) => {
                            // Check if the file is a PDF and not in a __MACOSX folder or a directory
                            if (zipEntry.name.toLowerCase().endsWith('.pdf') && !zipEntry.dir && !zipEntry.name.startsWith('__MACOSX')) {
                                // Create a promise to extract the PDF blob
                                const promise = zipEntry.async('blob').then(blob => {
                                    // Re-create a File object to ensure it has a .name property
                                    // and can be handled like a regularly uploaded file.
                                    return new File([blob], zipEntry.name, { type: 'application/pdf' });
                                });
                                zipPdfPromises.push(promise);
                            }
                        });
                        
                        // Wait for all PDFs in this zip to be extracted
                        const extractedPdfs = await Promise.all(zipPdfPromises);
                        pdfFiles.push(...extractedPdfs);

                    } catch (err) {
                        console.error("Error unzipping file:", file.name, err);
                        showExtractStatus('error', `Could not read the zip file: ${file.name}`);
                        return; // Stop processing on zip error
                    }
                }
            }
        };

        await processFiles();

        // Sort files alphabetically for consistent order
        pdfFiles.sort((a, b) => a.name.localeCompare(b.name));
        selectedFiles = pdfFiles;

        if (selectedFiles.length > 0) {
            selectedFiles.forEach((file, index) => {
                const fileElement = document.createElement('div');
                fileElement.className = 'p-3 border rounded-lg bg-slate-50 flex items-center justify-between space-x-4';
                fileElement.innerHTML = `
                    <p class="font-medium text-slate-800 truncate flex-1" title="${file.name}">${file.name}</p>
                    <div class="flex-shrink-0">
                        <label for="pages-${index}" class="text-xs text-slate-600 block mb-1 text-right">Pages (e.g., 1, 3-5):</label>
                        <input type="text" id="pages-${index}" data-file-index="${index}" class="w-48 pl-3 pr-3 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md" placeholder="1, 3-5">
                    </div>
                `;
                extractFilesList.appendChild(fileElement);
            });
            extractButton.disabled = false;
            showExtractStatus('success', `${selectedFiles.length} PDF(s) loaded and ready.`);
        } else {
            extractButton.disabled = true;
            showExtractStatus('info', 'No PDF files were found.');
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
        
        // After processing all files, create download links
        if (generatedPdfs.length > 0) {
            if (generatedPdfs.length === 1) {
                // If only one file, provide a direct download link
                const pdf = generatedPdfs[0];
                const url = URL.createObjectURL(pdf.blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = pdf.name;
                link.className = 'inline-block px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors';
                link.textContent = `Download ${pdf.name}`;
                extractResults.appendChild(link);
                showExtractStatus('success', 'Extraction complete! 1 file is ready for download.');
            } else {
                // If multiple files, create a zip and a "Download All" button
                showExtractStatus('loading', 'Creating ZIP file...');
                const zip = new JSZip();
                generatedPdfs.forEach(pdf => {
                    zip.file(pdf.name, pdf.blob);
                });

                const zipBlob = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(zipBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = 'extracted-pdfs.zip';
                link.className = 'inline-block px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors';
                link.textContent = `Download All (${generatedPdfs.length} files) as ZIP`;
                extractResults.appendChild(link);
                showExtractStatus('success', `Extraction complete! ZIP file is ready for download.`);
            }
        } else {
             showExtractStatus('info', 'No pages were extracted. Please check your page selections.');
        }

        extractButton.disabled = false;
    }
});