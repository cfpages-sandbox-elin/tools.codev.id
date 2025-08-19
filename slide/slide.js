document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.getElementById('prev-slide');
    const nextButton = document.getElementById('next-slide');
    const slideCounter = document.getElementById('slide-counter');
    
    let currentSlide = 0;
    const totalSlides = slides.length;

    /**
     * Dynamically adjusts content to prevent the header from overlapping the main content area.
     * This version correctly compares the position of the header and the content.
     * @param {HTMLElement} slide - The slide element to adjust.
     */
    function adjustContentToFit(slide) {
        const slideHeader = slide.querySelector('.slide-header');
        const slideContent = slide.querySelector('.slide-content');
        
        if (!slideHeader || !slideContent) {
            return;
        }

        const slideTitle = slide.querySelector('.slide-title');
        const scalableContentText = slideContent.querySelectorAll('h2, h3, p, li, div.text-2xl, div.text-xl, div.text-lg, .bar-chart-label, .bar-chart-value');
        const scalableContentPadding = slideContent.querySelectorAll('.bg-slate-800\\/50, .bar-chart-row');

        let attempts = 0;
        const maxAttempts = 30; // Safety break.

        // Check for overlap: Is the bottom of the header crashing into the top of the content?
        // We add a 20px buffer for visual spacing.
        while ((slideHeader.offsetTop + slideHeader.offsetHeight + 20) > slideContent.offsetTop && attempts < maxAttempts) {

            // Action 1: Slightly reduce title font size.
            if (slideTitle) {
                const currentTitleSize = parseFloat(window.getComputedStyle(slideTitle).fontSize);
                if (currentTitleSize > 24) { // Minimum title size.
                    slideTitle.style.fontSize = `${currentTitleSize - 1}px`;
                }
            }

            // Action 2: Slightly reduce content text font sizes.
            scalableContentText.forEach(el => {
                const currentSize = parseFloat(window.getComputedStyle(el).fontSize);
                if (currentSize > 14) { // Minimum content text size.
                    el.style.fontSize = `${currentSize - 0.5}px`;
                }
            });
            
            // Action 3: Slightly reduce padding within content boxes.
             scalableContentPadding.forEach(el => {
                const style = window.getComputedStyle(el);
                const currentPaddingTop = parseFloat(style.paddingTop);
                const currentPaddingBottom = parseFloat(style.paddingBottom);
                if (currentPaddingTop > 8) { el.style.paddingTop = `${currentPaddingTop - 1}px`; }
                if (currentPaddingBottom > 8) { el.style.paddingBottom = `${currentPaddingBottom - 1}px`; }
            });

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
    console.log("Running auto-fit for all slides to prevent overlaps...");
    slides.forEach((slide, index) => {
        // A short delay for the browser to render things correctly before measuring.
        setTimeout(() => {
            adjustContentToFit(slide);
        }, 0);
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