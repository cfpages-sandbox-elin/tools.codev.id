document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.getElementById('prev-slide');
    const nextButton = document.getElementById('next-slide');
    const slideCounter = document.getElementById('slide-counter');
    
    let currentSlide = 0;
    const totalSlides = slides.length;

    /**
     * Dynamically adjusts the font size and padding of elements within a slide
     * to ensure the content fits within the slide's visible height.
     * @param {HTMLElement} slide - The slide element to adjust.
     */
    function adjustContentToFit(slide) {
        const contentContainer = slide.querySelector('.slide-content');
        if (!contentContainer) return;

        // Selectors for elements that can be scaled down.
        const scalableTextSelectors = '.slide-title, h2, h3, p, li, div.text-2xl, div.text-xl, div.text-lg';
        const scalablePaddingSelectors = '.slide-content, .bg-slate-800\\/50';

        const scalableText = contentContainer.querySelectorAll(scalableTextSelectors);
        const scalablePadding = contentContainer.querySelectorAll(scalablePaddingSelectors);
        
        let attempts = 0;
        const maxAttempts = 25; // Safety break to prevent infinite loops.

        // Loop only if content is overflowing.
        while (contentContainer.scrollHeight > contentContainer.clientHeight && attempts < maxAttempts) {
            
            // Reduce font size of all scalable text elements.
            scalableText.forEach(el => {
                const currentSize = parseFloat(window.getComputedStyle(el).fontSize);
                if (currentSize > 12) { // Set a minimum font size.
                    el.style.fontSize = `${currentSize - 0.5}px`;
                }
            });

            // Reduce padding of all scalable container elements.
            scalablePadding.forEach(el => {
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

    // Apply the auto-fitting logic to every slide upon loading.
    console.log("Running auto-fit for all slides...");
    slides.forEach(slide => {
        adjustContentToFit(slide);
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