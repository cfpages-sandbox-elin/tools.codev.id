// print-pages.js
document.getElementById('printForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const endOfPage = parseInt(document.getElementById('endOfPage').value);
    const skipPages = parseInt(document.getElementById('skipPages').value);
    const resultDiv = document.getElementById('result');

    if (isNaN(endOfPage) || isNaN(skipPages) || endOfPage <= 0 || skipPages <= 0) {
        resultDiv.textContent = 'Please enter valid positive numbers for both fields.';
        return;
    }

    let pageRanges = [];
    let currentPage = 1;

    while (currentPage <= endOfPage) {
        const startRange = currentPage;
        let endRange = currentPage + skipPages - 1;

        if (endRange > endOfPage) {
            endRange = endOfPage;
        }

        if (startRange === endRange) {
            pageRanges.push(`${startRange}`);
        } else {
            pageRanges.push(`${startRange}-${endRange}`);
        }

        currentPage = endRange + skipPages + 1;
    }

    resultDiv.textContent = pageRanges.join(', ');
});