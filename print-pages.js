// print-pages.js update tambah gak ruh
document.getElementById('printForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const startPage = parseInt(document.getElementById('startPage').value);
    const endOfPage = parseInt(document.getElementById('endOfPage').value);
    const pagesToPrintAndSkip = parseInt(document.getElementById('skipPages').value);
    const resultDiv = document.getElementById('result');

    // Validation
    if (isNaN(startPage) || isNaN(endOfPage) || isNaN(pagesToPrintAndSkip) || startPage <= 0 || endOfPage <= 0 || pagesToPrintAndSkip <= 0) {
        resultDiv.textContent = 'Please enter valid positive numbers for all fields.';
        return;
    }
    if (startPage > endOfPage) {
        resultDiv.textContent = 'Start Page cannot be greater than End of Page.';
        return;
    }

    let resultString = '';
    let currentPage = startPage;

    // --- LOGIC SWITCH ---
    // If printing 1 or 2 pages per block, use comma-separated numbers for brevity.
    if (pagesToPrintAndSkip < 3) {
        let pages = [];
        while (currentPage <= endOfPage) {
            // Add the pages to be printed in this block
            for (let i = 0; i < pagesToPrintAndSkip && currentPage <= endOfPage; i++) {
                pages.push(currentPage);
                currentPage++;
            }
            // Skip the next block of pages
            currentPage += pagesToPrintAndSkip;
        }
        resultString = pages.join(', ');

    } else {
        // If printing 3 or more pages per block, use range notation (e.g., "1-5").
        let pageRanges = [];
        while (currentPage <= endOfPage) {
            const startRange = currentPage;
            let endRange = startRange + pagesToPrintAndSkip - 1;

            if (endRange > endOfPage) {
                endRange = endOfPage;
            }
            
            pageRanges.push(`${startRange}-${endRange}`);
            
            currentPage = endRange + pagesToPrintAndSkip + 1;
        }
        resultString = pageRanges.join(', ');
    }

    resultDiv.textContent = resultString;
});