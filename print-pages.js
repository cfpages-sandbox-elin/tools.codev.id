// print-pages.js update tambah reverse order
document.getElementById('printForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const startPage = parseInt(document.getElementById('startPage').value);
    const endOfPage = parseInt(document.getElementById('endOfPage').value);
    const pagesToPrintAndSkip = parseInt(document.getElementById('skipPages').value);
    const reverseOrder = document.getElementById('reverseOrder').checked; // Get checkbox state
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

    // Logic for comma-separated numbers (for printing 1 or 2 pages per block)
    if (pagesToPrintAndSkip < 3) {
        let pages = [];
        while (currentPage <= endOfPage) {
            for (let i = 0; i < pagesToPrintAndSkip && currentPage <= endOfPage; i++) {
                pages.push(currentPage);
                currentPage++;
            }
            currentPage += pagesToPrintAndSkip;
        }

        // --- REVERSE LOGIC ---
        if (reverseOrder) {
            pages.reverse();
        }
        resultString = pages.join(', ');

    } else {
        // Logic for range notation (for printing 3+ pages per block)
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

        // --- REVERSE LOGIC ---
        if (reverseOrder) {
            pageRanges.reverse();
        }
        resultString = pageRanges.join(', ');
    }

    resultDiv.textContent = resultString;
});