document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.getElementById('prev-slide');
    const nextButton = document.getElementById('next-slide');
    const slideCounter = document.getElementById('slide-counter');
    
    let currentSlide = 0;
    const totalSlides = slides.length;

    /**
     * Intelligently adjusts content ONLY if an overlap is detected between the header and the main content.
     * Slides that already fit perfectly are ignored.
     * @param {HTMLElement} slide - The slide element to check and potentially adjust.
     */
    function adjustContentToFit(slide) {
        const slideHeader = slide.querySelector('.slide-header');
        const slideContent = slide.querySelector('.slide-content');
        
        if (!slideHeader || !slideContent) {
            return; // Exit if the necessary elements aren't on the slide.
        }

        const buffer = 20; // The minimum desired pixel gap between header and content.
        
        // --- The CRITICAL CHECK ---
        // First, check if there is an actual overlap.
        // If the bottom of the header is safely above the top of the content, the slide is fine.
        if ((slideHeader.offsetTop + slideHeader.offsetHeight + buffer) <= slideContent.offsetTop) {
            // console.log(`Slide ${slide.id} is OK. No adjustments needed.`);
            return; // EXIT THE FUNCTION. Do not touch this slide.
        }

        // If the code reaches here, it means an overlap was detected.
        // Now, we proceed with the iterative adjustments.
        // console.log(`Slide ${slide.id} has an overlap. Starting adjustments...`);

        const slideTitle = slide.querySelector('.slide-title');
        const scalableContentText = slideContent.querySelectorAll('h2, h3, p, li, div.text-2xl, div.text-xl, div.text-lg, .bar-chart-label, .bar-chart-value');
        const scalableContentPadding = slideContent.querySelectorAll('.bg-slate-800\\/50, .bar-chart-row');

        let attempts = 0;
        const maxAttempts = 30;

        // Loop to fix the detected overlap.
        while ((slideHeader.offsetTop + slideHeader.offsetHeight + buffer) > slideContent.offsetTop && attempts < maxAttempts) {
            
            // First priority: reduce padding inside content boxes.
            scalableContentPadding.forEach(el => {
                const style = window.getComputedStyle(el);
                const currentPaddingTop = parseFloat(style.paddingTop);
                if (currentPaddingTop > 10) { el.style.paddingTop = `${currentPaddingTop - 1}px`; }
                const currentPaddingBottom = parseFloat(style.paddingBottom);
                if (currentPaddingBottom > 10) { el.style.paddingBottom = `${currentPaddingBottom - 1}px`; }
            });

            // Second priority: reduce content text font size.
            scalableContentText.forEach(el => {
                const currentSize = parseFloat(window.getComputedStyle(el).fontSize);
                if (currentSize > 14) { // Minimum font size for content
                    el.style.fontSize = `${currentSize - 0.4}px`;
                }
            });
            
            // Last resort: reduce the main title font size.
            if (slideTitle) {
                const currentTitleSize = parseFloat(window.getComputedStyle(slideTitle).fontSize);
                if (currentTitleSize > 24) { // Minimum font size for title
                    slideTitle.style.fontSize = `${currentTitleSize - 0.5}px`;
                }
            }
            attempts++;
        }
    }

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        if (slides[index]) {
            slides[index].classList.add('active');
        }
        slideCounter.textContent = `${index + 1} / ${totalSlides}`;
        updateNavButtons();
    }

    function updateNavButtons() {
        prevButton.style.opacity = (currentSlide === 0) ? '0.3' : '1';
        prevButton.style.cursor = (currentSlide === 0) ? 'not-allowed' : 'pointer';
        nextButton.style.opacity = (currentSlide === totalSlides - 1) ? '0.3' : '1';
        nextButton.style.cursor = (currentSlide === totalSlides - 1) ? 'not-allowed' : 'pointer';
    }

    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            showSlide(currentSlide);
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            showSlide(currentSlide);
        }
    }

    // --- INITIALIZATION ---

    // Apply the smart auto-fitting logic to every slide upon loading.
    console.log("Running smart auto-fit for all slides...");
    slides.forEach(slide => {
        // A minimal delay can help ensure the browser has calculated layouts before we measure them.
        setTimeout(() => {
            adjustContentToFit(slide);
        }, 10);
    });
    console.log("Auto-fit complete.");

    // Add Event Listeners
    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') nextSlide();
        else if (e.key === 'ArrowLeft') prevSlide();
    });

    // Show the first slide
    showSlide(currentSlide);
});