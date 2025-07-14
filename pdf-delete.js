--- START OF FILE pdf-delete.js ---

document.addEventListener('DOMContentLoaded', () => {
    const { PDFDocument } = PDFLib;

    // Check if the necessary elements for the delete tool exist
    const deleteFileInput = document.getElementById('delete-file-upload');
    if (!deleteFileInput) {
        return; // Exit if we are not on a page with the delete tool
    }

    const deletePreviewContainer = document.getElementById('delete-preview-container');
    const deleteStatus = document.getElementById('delete-status');
    const deleteButton = document.getElementById('delete-button');
    const deleteActionBar = document.getElementById('delete-action-bar');
    const deleteResults = document.getElementById('delete-results');

    let uploadedFile = null;
    let uploadedPdfBuffer = null;
    let pagesToDelete = new Set();
    let totalPages = 0;

    deleteFileInput.addEventListener('change', handleFileSelect);
    deleteButton.addEventListener('click', handleDeletePages);

    function showDeleteStatus(type, message) {
        let color = type === 'error' ? 'text-red-600' :
                    (type === 'success' ? 'text-green-600' :
                    'text-slate-600');
        const icon = type === 'loading' ? '<div class="spinner mx-auto"></div>' : '';
        deleteStatus.innerHTML = `<div class="flex items-center justify-center space-x-2 ${color}">${icon}<p>${message}</p></div>`;
    }

    async function handleFileSelect(e) {
        uploadedFile = e.target.files[0];
        if (!uploadedFile) return;

        // Reset UI
        deletePreviewContainer.innerHTML = '';
        deleteResults.innerHTML = '';
        deleteActionBar.classList.add('hidden');
        pagesToDelete.clear();
        totalPages = 0;
        updateDeleteButtonState();
        showDeleteStatus('loading', 'Reading and processing PDF...');

        try {
            uploadedPdfBuffer = await uploadedFile.arrayBuffer();
            const pdfjsDoc = await pdfjsLib.getDocument({ data: uploadedPdfBuffer.slice(0) }).promise;
            totalPages = pdfjsDoc.numPages;

            showDeleteStatus('loading', `Rendering ${totalPages} page previews...`);
            
            const renderPromises = [];
            for (let i = 1; i <= totalPages; i++) {
                renderPromises.push(renderPagePreview(pdfjsDoc, i));
            }
            await Promise.all(renderPromises);

            deleteActionBar.classList.remove('hidden');
            showDeleteStatus('success', 'PDF loaded. Click on pages to select them for deletion.');

        } catch (err) {
            console.error("Error processing PDF:", err);
            showDeleteStatus('error', 'Could not process the PDF. It might be corrupted or protected.');
        }
    }

    async function renderPagePreview(pdfDoc, pageNum) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        const scale = 200 / viewport.width; // Render at a fixed width
        const scaledViewport = page.getViewport({ scale });

        const card = document.createElement('div');
        card.className = 'page-preview-card';
        card.dataset.pageIndex = pageNum - 1; // Use 0-based index for logic

        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');

        const renderContext = { canvasContext: ctx, viewport: scaledViewport };
        await page.render(renderContext).promise;

        const pageLabel = document.createElement('p');
        pageLabel.className = 'text-center text-xs text-slate-600 mt-2 font-medium';
        pageLabel.textContent = `Page ${pageNum}`;
        
        card.appendChild(canvas);
        card.appendChild(pageLabel);
        
        card.addEventListener('click', () => {
            const pageIndex = parseInt(card.dataset.pageIndex, 10);
            card.classList.toggle('selected');

            if (pagesToDelete.has(pageIndex)) {
                pagesToDelete.delete(pageIndex);
            } else {
                pagesToDelete.add(pageIndex);
            }
            updateDeleteButtonState();
        });

        deletePreviewContainer.appendChild(card);
    }

    function updateDeleteButtonState() {
        const numSelected = pagesToDelete.size;
        if (numSelected === 0) {
            deleteButton.disabled = true;
            deleteButton.textContent = 'Select Pages to Delete';
        } else if (numSelected === totalPages) {
            deleteButton.disabled = true;
            deleteButton.textContent = 'Cannot Delete All Pages';
        } else {
            deleteButton.disabled = false;
            deleteButton.textContent = `Delete ${numSelected} Selected Page(s)`;
        }
    }

    async function handleDeletePages() {
        if (pagesToDelete.size === 0 || pagesToDelete.size === totalPages) return;

        showDeleteStatus('loading', 'Creating new PDF...');
        deleteButton.disabled = true;
        deleteResults.innerHTML = '';

        try {
            const originalDoc = await PDFDocument.load(uploadedPdfBuffer);
            const newDoc = await PDFDocument.create();

            const indicesToKeep = [];
            for (let i = 0; i < originalDoc.getPageCount(); i++) {
                if (!pagesToDelete.has(i)) {
                    indicesToKeep.push(i);
                }
            }

            const copiedPages = await newDoc.copyPages(originalDoc, indicesToKeep);
            copiedPages.forEach(page => newDoc.addPage(page));

            const pdfBytes = await newDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const originalFileName = uploadedFile.name.replace(/\.pdf$/i, '');
            const downloadName = `${originalFileName}-deleted.pdf`;

            const link = document.createElement('a');
            link.href = url;
            link.download = downloadName;
            link.className = 'inline-block px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors';
            link.textContent = `Download ${downloadName}`;
            deleteResults.appendChild(link);
            
            showDeleteStatus('success', `New PDF created with ${indicesToKeep.length} pages.`);

        } catch (err) {
            console.error("Error deleting pages:", err);
            showDeleteStatus('error', 'An error occurred while creating the new PDF.');
        } finally {
            deleteButton.disabled = false;
            updateDeleteButtonState();
        }
    }
});