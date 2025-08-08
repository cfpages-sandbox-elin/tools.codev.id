document.getElementById('printForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const endOfPage = parseInt(document.getElementById('endOfPage').value);
    const skipPages = parseInt(document.getElementById('skipPages').value);
    const resultDiv = document.getElementById('result');

    if (isNaN(endOfPage) || isNaN(skipPages) || endOfPage <= 0 || skipPages <= 0) {
        resultDiv.textContent = 'Please enter valid positive numbers for both fields.';
        return;
    }

    let pages = [];
    let currentPage = 1;
    let print = true;

    while (currentPage <= endOfPage) {
        if (print) {
            for (let i = 0; i < skipPages && currentPage <= endOfPage; i++) {
                pages.push(currentPage);
                currentPage++;
            }
        } else {
            currentPage += skipPages;
        }
        print = !print;
    }

    resultDiv.textContent = pages.join(', ');
});