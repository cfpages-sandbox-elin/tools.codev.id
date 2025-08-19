document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.getElementById('prev-slide');
    const nextButton = document.getElementById('next-slide');
    const slideCounter = document.getElementById('slide-counter');
    
    let currentSlide = 0;
    const totalSlides = slides.length;

    function showSlide(index) {
        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });

        // Show the target slide
        if (slides[index]) {
            slides[index].classList.add('active');
        }

        // Update counter
        slideCounter.textContent = `${index + 1} / ${totalSlides}`;
        
        // Update button states
        updateNavButtons();
    }

    function updateNavButtons() {
        // Previous Button
        if (currentSlide === 0) {
            prevButton.style.opacity = '0.3';
            prevButton.style.cursor = 'not-allowed';
        } else {
            prevButton.style.opacity = '1';
            prevButton.style.cursor = 'pointer';
        }
        
        // Next Button
        if (currentSlide === totalSlides - 1) {
            nextButton.style.opacity = '0.3';
            nextButton.style.cursor = 'not-allowed';
        } else {
            nextButton.style.opacity = '1';
            nextButton.style.cursor = 'pointer';
        }
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

    // Event Listeners for buttons
    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);

    // Event Listeners for keyboard arrows
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') {
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            prevSlide();
        }
    });

    // Initial load
    showSlide(currentSlide);
});