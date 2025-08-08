document.getElementById('printForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const startPage = parseInt(document.getElementById('startPage').value);
    const endOfPage = parseInt(document.getElementById('endOfPage').value);
    const pagesToPrintAndSkip = parseInt(document.getElementById('skipPages').value); // Renamed for clarity
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

    let pageRanges = [];
    let currentPage = startPage;

    while (currentPage <= endOfPage) {
        // Determine the start and end of the current block to be printed
        const startRange = currentPage;
        let endRange = startRange + pagesToPrintAndSkip - 1;

        // Ensure the range does not exceed the end of the document
        if (endRange > endOfPage) {
            endRange = endOfPage;
        }

        // Format the range string
        if (startRange === endRange) {
            pageRanges.push(`${startRange}`);
        } else {
            pageRanges.push(`${startRange}-${endRange}`);
        }
        
        // Jump to the start of the *next* block to be printed.
        // This is done by taking the end of the current printed block (endRange),
        // and skipping a number of pages equal to pagesToPrintAndSkip.
        currentPage = endRange + pagesToPrintAndSkip + 1;
    }

    resultDiv.textContent = pageRanges.join(', ');
});