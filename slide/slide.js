document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.getElementById('prev-slide');
    const nextButton = document.getElementById('next-slide');
    const slideCounter = document.getElementById('slide-counter');
    
    let currentSlide = 0;
    const totalSlides = slides.length;

    /**
     * Intelligently adjusts content ONLY if vertical overflow is detected within the main content area.
     * Slides that already fit are not modified.
     * @param {HTMLElement} slide - The slide element to check and potentially adjust.
     */
    function adjustContentToFit(slide) {
        const slideContent = slide.querySelector('.slide-content');
        if (!slideContent) return; // Exit if no content area

        // --- THE NEW, MORE RELIABLE CHECK ---
        // Only run the adjustment logic if the content is actually overflowing.
        if (slideContent.scrollHeight <= slideContent.clientHeight) {
            // console.log(`Slide ${slide.id} fits perfectly. No action taken.`);
            return; // EXIT. This slide is fine.
        }

        // If we reach here, the slide has overflow. Now we fix it.
        // console.warn(`Slide ${slide.id} has overflow. Applying adjustments...`);

        const scalableText = slideContent.querySelectorAll('h2, h3, p, li, div.text-2xl, div.text-xl, div.text-lg, .bar-chart-label, .bar-chart-value, .text-slate-100, .text-slate-200, .text-slate-300');
        const scalablePadding = slideContent.querySelectorAll('.bg-slate-800\\/50, .bar-chart-row');

        let attempts = 0;
        const maxAttempts = 40; // Allow for more gradual adjustments

        while (slideContent.scrollHeight > slideContent.clientHeight && attempts < maxAttempts) {
            
            // Make smaller, more gradual adjustments
            scalableText.forEach(el => {
                const currentSize = parseFloat(window.getComputedStyle(el).fontSize);
                if (currentSize > 15) { // Minimum font size for readability
                    el.style.fontSize = `${currentSize - 0.25}px`;
                }
            });
            
            scalablePadding.forEach(el => {
                const style = window.getComputedStyle(el);
                const currentPaddingTop = parseFloat(style.paddingTop);
                const currentPaddingBottom = parseFloat(style.paddingBottom);
                if (currentPaddingTop > 10) { el.style.paddingTop = `${currentPaddingTop - 0.5}px`; }
                if (currentPaddingBottom > 10) { el.style.paddingBottom = `${currentPaddingBottom - 0.5}px`; }
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
    console.log("Running smart auto-fit for all slides...");
    slides.forEach((slide) => {
        // Use a minimal timeout to ensure the browser has rendered the slide's initial state
        setTimeout(() => {
            adjustContentToFit(slide);
        }, 50); 
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