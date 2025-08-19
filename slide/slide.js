// slide.js auto fullscreen
document.addEventListener('DOMContentLoaded', function () {
    // --- ELEMENT SELECTORS ---
    const presentationContainer = document.getElementById('presentation-container');
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.getElementById('prev-slide');
    const nextButton = document.getElementById('next-slide');
    const slideCounter = document.getElementById('slide-counter');
    const fullscreenButton = document.getElementById('fullscreen-btn');
    
    // --- STATE VARIABLES ---
    let currentSlide = 0;
    const totalSlides = slides.length;

    // --- CORE FUNCTIONS ---
    function autoAssignSlideIds() {
        slides.forEach((slide, index) => {
            // The index starts at 0, so we add 1 for human-readable numbering (1, 2, 3...)
            slide.id = `slide${index + 1}`;
        });
        // Optional: Log to console to confirm it worked
        console.log(`Successfully assigned IDs to ${slides.length} slides.`);
    }

    function formatSlideTitles() {
        const titles = document.querySelectorAll('.slide-title');
        titles.forEach(title => {
            const originalHTML = title.innerHTML;
            if (originalHTML.includes(':') && !originalHTML.includes('<span')) {
                const parts = originalHTML.split(':');
                const prefix = parts[0];
                const mainTitle = parts.slice(1).join(':').trim();
                title.innerHTML = `<span class="title-prefix">${prefix}</span>${mainTitle}`;
            }
        });
    }

    function adjustContentToFit(slide) {
        const slideContent = slide.querySelector('.slide-content');
        if (!slideContent) return;

        if (slideContent.scrollHeight <= slideContent.clientHeight) {
            return; // Exit if the slide already fits.
        }

        const fontHierarchy = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm'];
        const paddingHierarchy = ['p-8', 'p-6', 'p-4']; // Using Tailwind's padding classes
        
        let attempts = 0;
        const maxAttempts = 20;

        while (slideContent.scrollHeight > slideContent.clientHeight && attempts < maxAttempts) {
            // Priority 1: Reduce font sizes class by class
            let fontAdjusted = false;
            for (let i = 0; i < fontHierarchy.length - 1; i++) {
                const currentClass = fontHierarchy[i];
                const smallerClass = fontHierarchy[i+1];
                const elements = slideContent.querySelectorAll(`.${currentClass}`);
                if (elements.length > 0) {
                    elements.forEach(el => {
                        el.classList.remove(currentClass);
                        el.classList.add(smallerClass);
                    });
                    fontAdjusted = true;
                    break; // Adjust one level at a time and re-check
                }
            }

            // Priority 2: Reduce padding if font adjustment is not enough or not possible
            if (!fontAdjusted) {
                let paddingAdjusted = false;
                for (let i = 0; i < paddingHierarchy.length - 1; i++) {
                     const currentClass = paddingHierarchy[i];
                     const smallerClass = paddingHierarchy[i+1];
                     const elements = slideContent.querySelectorAll(`.${currentClass}`);
                     if (elements.length > 0) {
                        elements.forEach(el => {
                           el.classList.remove(currentClass);
                           el.classList.add(smallerClass);
                        });
                        paddingAdjusted = true;
                        break;
                     }
                }
                // If no adjustments can be made, break the loop to prevent freezing
                if (!paddingAdjusted) break;
            }
            attempts++;
        }
    }

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        if (slides[index]) slides[index].classList.add('active');
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
        if (!document.fullscreenElement) {
            toggleFullScreen();
            return; 
        }

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

    /**
     * Toggles fullscreen mode for the presentation container.
     */
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            presentationContainer.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    // --- INITIALIZATION & EVENT LISTENERS ---
    
    autoAssignSlideIds();
    formatSlideTitles();

    slides.forEach(slide => {
        setTimeout(() => adjustContentToFit(slide), 50); 
    });

    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);
    fullscreenButton.addEventListener('click', toggleFullScreen);
    presentationContainer.addEventListener('dblclick', toggleFullScreen); // Double-click for convenience
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
        else if (e.key === 'ArrowLeft') prevSlide();
        else if (e.key === 'f' || e.key === 'F11') {
            e.preventDefault();
            toggleFullScreen();
        }
    });

    // 4. Show the first slide.
    showSlide(currentSlide);
});