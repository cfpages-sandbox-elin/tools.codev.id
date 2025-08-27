// pdf-merge.js
const { PDFDocument: PDFLibMergeDoc } = PDFLib;
document.addEventListener('DOMContentLoaded', () => {
    // Check if the necessary elements for the merge tool exist
    const mergeFileInput = document.getElementById('merge-file-upload');
    if (!mergeFileInput) {
        return; // Exit if we are not on a page with the merge tool
    }
    
    const mergeFilesList = document.getElementById('merge-files-list');
    const mergeButton = document.getElementById('merge-button');
    const mergeStatus = document.getElementById('merge-status');
    
    let pdfFiles = []; // Array of { file: File, name: string, order: number }
    let draggedElement = null;
    
    // Add event listeners
    mergeFileInput.addEventListener('change', handleFileUpload);
    mergeButton.addEventListener('click', mergePdfs);
    
    // Function to handle file upload
    async function handleFileUpload(e) {
        showMergeStatus('loading', 'Reading files...');
        mergeButton.disabled = true;
        mergeFilesList.innerHTML = '';
        pdfFiles = [];
        
        const inputFiles = Array.from(e.target.files);
        const finalPdfFiles = [];
        
        // Process files (PDFs and ZIPs)
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
                    showMergeStatus('error', `Could not read the zip file: ${file.name}`);
                    return;
                }
            }
        }
        
        // Sort files alphabetically
        finalPdfFiles.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add files to the list
        for (let i = 0; i < finalPdfFiles.length; i++) {
            pdfFiles.push({
                file: finalPdfFiles[i],
                name: finalPdfFiles[i].name,
                order: i
            });
            
            // Create file card
            const fileCard = await createFileCard(finalPdfFiles[i], i);
            mergeFilesList.appendChild(fileCard);
        }
        
        if (pdfFiles.length > 0) {
            mergeButton.disabled = false;
            showMergeStatus('success', `${pdfFiles.length} PDF(s) loaded. Arrange them in the desired order.`);
        } else {
            showMergeStatus('info', 'No PDF files were found in the upload.');
        }
    }
    
    // Function to create a file card with thumbnail
    async function createFileCard(file, index) {
        const card = document.createElement('div');
        card.className = 'relative bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden group';
        card.dataset.index = index;
        card.draggable = true;
        
        // Add drag event listeners
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);
        
        // Create thumbnail
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'h-32 bg-slate-100 flex items-center justify-center';
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.5 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            await page.render(renderContext).promise;
            
            thumbnailContainer.appendChild(canvas);
        } catch (error) {
            // Fallback to PDF icon if rendering fails
            const pdfIcon = document.createElement('div');
            pdfIcon.className = 'text-red-500 text-4xl';
            pdfIcon.innerHTML = '📄';
            thumbnailContainer.appendChild(pdfIcon);
        }
        
        // Create file info
        const fileInfo = document.createElement('div');
        fileInfo.className = 'p-3';
        
        const fileName = document.createElement('p');
        fileName.className = 'text-sm font-medium text-slate-800 truncate';
        fileName.textContent = file.name;
        fileInfo.appendChild(fileName);
        
        const fileSize = document.createElement('p');
        fileSize.className = 'text-xs text-slate-500';
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.appendChild(fileSize);
        
        // Create controls
        const controls = document.createElement('div');
        controls.className = 'flex justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity';
        
        const moveUpBtn = document.createElement('button');
        moveUpBtn.className = 'px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700';
        moveUpBtn.innerHTML = '↑';
        moveUpBtn.addEventListener('click', () => moveFile(index, -1));
        
        const moveDownBtn = document.createElement('button');
        moveDownBtn.className = 'px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700';
        moveDownBtn.innerHTML = '↓';
        moveDownBtn.addEventListener('click', () => moveFile(index, 1));
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-700';
        removeBtn.innerHTML = '✕';
        removeBtn.addEventListener('click', () => removeFile(index));
        
        controls.appendChild(moveUpBtn);
        controls.appendChild(moveDownBtn);
        controls.appendChild(removeBtn);
        
        // Assemble the card
        card.appendChild(thumbnailContainer);
        card.appendChild(fileInfo);
        card.appendChild(controls);
        
        return card;
    }
    
    // Drag and drop functions
    function handleDragStart(e) {
        draggedElement = this;
        this.classList.add('opacity-50');
    }
    
    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        
        this.classList.add('border-blue-500', 'border-2');
        
        return false;
    }
    
    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        if (draggedElement !== this) {
            const draggedIndex = parseInt(draggedElement.dataset.index);
            const targetIndex = parseInt(this.dataset.index);
            
            // Reorder files array
            const draggedFile = pdfFiles[draggedIndex];
            pdfFiles.splice(draggedIndex, 1);
            pdfFiles.splice(targetIndex, 0, draggedFile);
            
            // Update order property
            pdfFiles.forEach((file, index) => {
                file.order = index;
            });
            
            // Re-render the list
            renderFilesList();
        }
        
        return false;
    }
    
    function handleDragEnd(e) {
        this.classList.remove('opacity-50');
        
        // Remove border from all elements
        const cards = mergeFilesList.querySelectorAll('.relative');
        cards.forEach(card => {
            card.classList.remove('border-blue-500', 'border-2');
        });
    }
    
    // Function to move file up or down
    function moveFile(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= pdfFiles.length) return;
        
        // Swap in array
        [pdfFiles[index], pdfFiles[newIndex]] = [pdfFiles[newIndex], pdfFiles[index]];
        
        // Update order property
        pdfFiles.forEach((file, i) => {
            file.order = i;
        });
        
        // Re-render the list
        renderFilesList();
    }
    
    // Function to remove file
    function removeFile(index) {
        pdfFiles.splice(index, 1);
        
        // Update order property
        pdfFiles.forEach((file, i) => {
            file.order = i;
        });
        
        // Re-render the list
        renderFilesList();
        
        if (pdfFiles.length === 0) {
            mergeButton.disabled = true;
            showMergeStatus('info', 'No files to merge.');
        }
    }
    
    // Function to re-render the files list
    async function renderFilesList() {
        mergeFilesList.innerHTML = '';
        
        // Sort files by order
        pdfFiles.sort((a, b) => a.order - b.order);
        
        // Re-create cards
        for (let i = 0; i < pdfFiles.length; i++) {
            const card = await createFileCard(pdfFiles[i].file, i);
            mergeFilesList.appendChild(card);
        }
    }
    
    // Function to merge PDFs
    async function mergePdfs() {
        if (pdfFiles.length === 0) return;
        
        showMergeStatus('loading', 'Merging PDFs...');
        mergeButton.disabled = true;
        
        try {
            // Create a new PDF document
            const mergedPdf = await PDFLibMergeDoc.create();
            
            // Process each PDF in order
            for (const pdfFile of pdfFiles) {
                const arrayBuffer = await pdfFile.file.arrayBuffer();
                const pdf = await PDFLibMergeDoc.load(arrayBuffer);
                
                // Copy all pages from the current PDF to the merged PDF
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }
            
            // Save the merged PDF
            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            // Trigger download
            downloadBlob(blob, 'merged-document.pdf');
            
            showMergeStatus('success', 'PDFs merged successfully! Download started.');
        } catch (error) {
            console.error('Error merging PDFs:', error);
            showMergeStatus('error', 'Failed to merge PDFs. Please try again.');
        } finally {
            mergeButton.disabled = false;
        }
    }
    
    // Function to show status message
    function showMergeStatus(type, message) {
        let color = type === 'error' ? 'text-red-600' : 
                    (type === 'success' ? 'text-green-600' : 
                    'text-slate-600');
        const icon = type === 'loading' ? '<div class="spinner mx-auto"></div>' : '';
        mergeStatus.innerHTML = `<div class="flex items-center justify-center space-x-2 ${color}">${icon}<p>${message}</p></div>`;
    }
    
    // Function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
});