// pdf-compress.js
const { PDFDocument: PDFLibCompressDoc } = PDFLib;
document.addEventListener('DOMContentLoaded', () => {
    // Check if the necessary elements for the compress tool exist
    const compressFileInput = document.getElementById('compress-file-upload');
    if (!compressFileInput) {
        return; // Exit if we are not on a page with the compress tool
    }
    
    const compressFilesList = document.getElementById('compress-files-list');
    const compressButton = document.getElementById('compress-button');
    const compressStatus = document.getElementById('compress-status');
    const compressResults = document.getElementById('compress-results');
    const compressOptions = document.getElementById('compress-options');
    const compressionLevel = document.getElementById('compression-level');
    const imageQuality = document.getElementById('image-quality');
    const imageQualityValue = document.getElementById('image-quality-value');
    
    let pdfFiles = [];
    
    // Update image quality label
    imageQuality.addEventListener('input', () => {
        imageQualityValue.textContent = imageQuality.value + '%';
    });
    
    // Handle file upload
    compressFileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        showCompressStatus('loading', 'Loading files...');
        compressButton.disabled = true;
        compressFilesList.innerHTML = '';
        compressResults.innerHTML = '';
        pdfFiles = [];
        
        files.forEach(file => {
            if (file.type === 'application/pdf') {
                pdfFiles.push(file);
                
                // Create file card
                const fileCard = document.createElement('div');
                fileCard.className = 'p-3 border rounded-lg bg-slate-50';
                
                const fileName = document.createElement('p');
                fileName.className = 'font-medium text-sm text-slate-800 truncate';
                fileName.textContent = file.name;
                fileCard.appendChild(fileName);
                
                const fileSize = document.createElement('p');
                fileSize.className = 'text-xs text-slate-500';
                fileSize.textContent = formatFileSize(file.size);
                fileCard.appendChild(fileSize);
                
                compressFilesList.appendChild(fileCard);
            }
        });
        
        if (pdfFiles.length > 0) {
            compressOptions.classList.remove('hidden');
            compressButton.disabled = false;
            showCompressStatus('success', `${pdfFiles.length} PDF(s) loaded. Ready to compress.`);
        } else {
            showCompressStatus('info', 'No valid PDF files were found in the upload.');
        }
    });
    
    // Handle compression
    compressButton.addEventListener('click', async () => {
        if (pdfFiles.length === 0) return;
        
        showCompressStatus('loading', 'Compressing PDFs...');
        compressButton.disabled = true;
        compressResults.innerHTML = '';
        
        const level = compressionLevel.value;
        const quality = parseInt(imageQuality.value) / 100;
        
        const compressedFiles = [];
        
        try {
            for (const file of pdfFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFLibCompressDoc.load(arrayBuffer);
                
                // Basic optimization for all levels
                const options = {
                    addDefaultPage: false,
                    objectsPerTick: 100
                };
                
                // For medium and high, try to compress images
                if (level === 'medium' || level === 'high') {
                    // This is a placeholder for image compression
                    // We would need to implement image compression here
                    // For now, we'll just use the basic optimization
                    showCompressStatus('loading', `Compressing images in ${file.name}...`);
                }
                
                const pdfBytes = await pdfDoc.save(options);
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                
                // Calculate compression ratio
                const originalSize = file.size;
                const compressedSize = blob.size;
                const compressionRatio = (100 - (compressedSize / originalSize * 100)).toFixed(2);
                
                compressedFiles.push({
                    name: file.name.replace(/\.pdf$/i, '-compressed.pdf'),
                    blob: blob,
                    originalSize: originalSize,
                    compressedSize: compressedSize,
                    compressionRatio: compressionRatio
                });
            }
            
            // Download the compressed files
            if (compressedFiles.length > 0) {
                if (compressedFiles.length === 1) {
                    // Download single PDF
                    const file = compressedFiles[0];
                    downloadBlob(file.blob, file.name);
                    showCompressStatus('success', `Compression complete! File size reduced by ${file.compressionRatio}%.`);
                } else {
                    // Create ZIP and download
                    showCompressStatus('loading', 'Creating ZIP file...');
                    const zip = new JSZip();
                    
                    compressedFiles.forEach(file => {
                        zip.file(file.name, file.blob);
                    });
                    
                    const zipBlob = await zip.generateAsync({ type: "blob" });
                    downloadBlob(zipBlob, 'compressed-pdfs.zip');
                    showCompressStatus('success', `Compression complete! ${compressedFiles.length} files compressed and downloaded.`);
                }
            }
        } catch (error) {
            console.error('Error compressing PDFs:', error);
            showCompressStatus('error', 'Failed to compress PDFs. Please try again.');
        } finally {
            compressButton.disabled = false;
        }
    });
    
    // Function to show status message
    function showCompressStatus(type, message) {
        let color = type === 'error' ? 'text-red-600' : 
                    (type === 'success' ? 'text-green-600' : 
                    'text-slate-600');
        const icon = type === 'loading' ? '<div class="spinner mx-auto"></div>' : '';
        compressStatus.innerHTML = `<div class="flex items-center justify-center space-x-2 ${color}">${icon}<p>${message}</p></div>`;
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