// slide.js FINAL (Download PDF + fix styling zai 6 + fullscreen mode + screenshot api
document.addEventListener('DOMContentLoaded', function () {
    // --- ELEMENT SELECTORS ---
    const presentationContainer = document.getElementById('presentation-container');
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.getElementById('prev-slide');
    const nextButton = document.getElementById('next-slide');
    const slideCounter = document.getElementById('slide-counter');
    const fullscreenButton = document.getElementById('fullscreen-btn');
    const downloadButton = document.getElementById('download-btn'); // Tombol baru
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    
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
        if (!slideContent || slideContent.scrollHeight <= slideContent.clientHeight) return;
        const scalableText = slideContent.querySelectorAll('h2, h3, p, li, div.text-2xl, div.text-xl, div.text-lg, .bar-chart-label, .bar-chart-value, .text-slate-100, .text-slate-200, .text-slate-300');
        const scalablePadding = slideContent.querySelectorAll('.bg-slate-800\\/50, .bar-chart-row');
        let attempts = 0; const maxAttempts = 40;
        while (slideContent.scrollHeight > slideContent.clientHeight && attempts < maxAttempts) {
            scalableText.forEach(el => { const currentSize = parseFloat(window.getComputedStyle(el).fontSize); if (currentSize > 15) el.style.fontSize = `${currentSize - 0.25}px`; });
            scalablePadding.forEach(el => { const style = window.getComputedStyle(el); const currentPaddingTop = parseFloat(style.paddingTop); const currentPaddingBottom = parseFloat(style.paddingBottom); if (currentPaddingTop > 10) el.style.paddingTop = `${currentPaddingTop - 0.5}px`; if (currentPaddingBottom > 10) el.style.paddingBottom = `${currentPaddingBottom - 0.5}px`; });
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

    function nextSlide() { if (!document.fullscreenElement) { toggleFullScreen(); return; } if (currentSlide < totalSlides - 1) { currentSlide++; showSlide(currentSlide); } }
    function prevSlide() { if (currentSlide > 0) { currentSlide--; showSlide(currentSlide); } }
    function toggleFullScreen() { if (!document.fullscreenElement) { presentationContainer.requestFullscreen().catch(err => { alert(`Error: ${err.message}`); }); } else { document.exitFullscreen(); } }
    function openLightbox(src) { lightboxImg.src = src; lightbox.classList.add('visible'); }
    function closeLightbox() { lightbox.classList.remove('visible'); }
    
    function waitForAssets(element) {
        const images = Array.from(element.querySelectorAll('img'));
        const promises = images.map(img => {
            return new Promise((resolve, reject) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = resolve;
                    img.onerror = reject;
                }
            });
        });

        // Kita juga tambahkan jeda singkat untuk memberi kesempatan font dan background-image render.
        // Ini adalah jaring pengaman terakhir.
        promises.push(new Promise(resolve => setTimeout(resolve, 300)));

        return Promise.all(promises);
    }

    async function downloadPDF() {
        if (document.body.classList.contains('pdf-generating')) return;
        console.log("--- MEMULAI PROSES GENERATE PDF ---");
        const downloadButton = document.getElementById('download-btn');
        const originalIcon = downloadButton.innerHTML;
        
        document.body.classList.add('pdf-generating');
        downloadButton.innerHTML = '<i class="fas fa-spinner"></i>';
        downloadButton.classList.add('loading');
        
        try {
            const slides = document.querySelectorAll('.slide');
            if (slides.length === 0) throw new Error("Tidak ada elemen .slide yang ditemukan.");
            
            // Create a new PDF document
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1366, 768]
            });
            console.log("Objek jsPDF berhasil dibuat.");
            
            // Store the current active slide
            const originalActiveSlide = currentSlide;
            
            // Enter fullscreen mode
            const presentationContainer = document.getElementById('presentation-container');
            await presentationContainer.requestFullscreen();
            // Wait for fullscreen to activate
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Array to store screenshot data
            const screenshots = [];
            
            for (let i = 0; i < slides.length; i++) {
                console.log(`[Slide ${i + 1}/${slides.length}] Memulai proses...`);
                
                // Make the slide we want to capture active
                showSlide(i);
                
                // Wait a bit for the slide to become fully visible and render
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log(`[Slide ${i + 1}] Mengambil screenshot...`);
                
                // Use the Screen Capture API to take a screenshot
                try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            cursor: "never"
                        },
                        audio: false
                    });
                    
                    // Create a video element to capture the stream
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.play();
                    
                    // Wait for the video to be ready
                    await new Promise(resolve => {
                        video.onloadedmetadata = resolve;
                    });
                    
                    // Create a canvas to capture the video frame
                    const canvas = document.createElement('canvas');
                    canvas.width = 1366;
                    canvas.height = 768;
                    const ctx = canvas.getContext('2d');
                    
                    // Draw the video frame to the canvas
                    ctx.drawImage(video, 0, 0, 1366, 768);
                    
                    // Get the image data
                    const imgData = canvas.toDataURL('image/jpeg', 0.98);
                    screenshots.push(imgData);
                    
                    // Stop the stream
                    stream.getTracks().forEach(track => track.stop());
                    
                    console.log(`[Slide ${i + 1}] Screenshot berhasil.`);
                } catch (err) {
                    console.error(`[Slide ${i + 1}] Gagal mengambil screenshot:`, err);
                    
                    // Fallback to html2canvas with better CORS handling
                    console.log(`[Slide ${i + 1}] Menggunakan metode fallback...`);
                    
                    // Create a wrapper div to ensure proper styling
                    const wrapper = document.createElement('div');
                    wrapper.style.position = 'fixed';
                    wrapper.style.top = '0';
                    wrapper.style.left = '0';
                    wrapper.style.width = '100vw';
                    wrapper.style.height = '100vh';
                    wrapper.style.backgroundColor = '#0a192f';
                    wrapper.style.zIndex = '9999';
                    wrapper.style.display = 'flex';
                    wrapper.style.justifyContent = 'center';
                    wrapper.style.alignItems = 'center';
                    wrapper.style.fontFamily = "'Poppins', sans-serif";
                    
                    // Clone the slide with all its styles
                    const slideClone = slides[i].cloneNode(true);
                    slideClone.style.position = 'relative';
                    slideClone.style.width = '1366px';
                    slideClone.style.height = '768px';
                    slideClone.style.transform = 'none';
                    slideClone.style.opacity = '1';
                    slideClone.style.visibility = 'visible';
                    
                    wrapper.appendChild(slideClone);
                    document.body.appendChild(wrapper);
                    
                    // Wait for the wrapper to be added to the DOM
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Capture the wrapper
                    const fallbackCanvas = await html2canvas(wrapper, {
                        scale: 1,
                        useCORS: true,
                        logging: false,
                        width: 1366,
                        height: 768,
                        backgroundColor: null,
                        letterRendering: true,
                        foreignObjectRendering: true,
                        allowTaint: true,
                        proxy: 'https://api.allorigins.win/raw?url=' // Proxy for external resources
                    });
                    
                    // Remove the wrapper
                    document.body.removeChild(wrapper);
                    
                    if (!fallbackCanvas) {
                        throw new Error(`[Slide ${i+1}] Gagal menghasilkan canvas.`);
                    }
                    const fallbackImgData = fallbackCanvas.toDataURL('image/jpeg', 0.98);
                    screenshots.push(fallbackImgData);
                    console.log(`[Slide ${i + 1}] Fallback berhasil.`);
                }
            }
            
            // Add all screenshots to the PDF
            for (let i = 0; i < screenshots.length; i++) {
                if (i > 0) {
                    pdf.addPage([1366, 768], 'landscape');
                }
                pdf.addImage(screenshots[i], 'JPEG', 0, 0, 1366, 768);
                console.log(`[Slide ${i + 1}] Berhasil ditambahkan ke PDF.`);
            }
            
            console.log("Semua slide telah diproses. Menyimpan file PDF...");
            pdf.save('SIER - Studi Kelayakan Proyek Olahraga.pdf');
            console.log("--- PROSES PDF BERHASIL ---");
        } catch (error) {
            console.error("--- PROSES PDF GAGAL ---", {
                message: error.message,
                stack: error.stack,
                errorObject: error
            });
            alert("Terjadi kesalahan kritis saat membuat PDF. Silakan buka konsol (F12) untuk melihat detail teknis.");
        } finally {
            console.log("Membersihkan sumber daya...");
            document.body.classList.remove('pdf-generating');
            downloadButton.innerHTML = originalIcon;
            downloadButton.classList.remove('loading');
            
            // Exit fullscreen
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            
            // Restore the original active slide
            showSlide(originalActiveSlide);
            console.log("Pembersihan selesai.");
        }
    }

    // --- INITIALIZATION & EVENT LISTENERS ---
    
    autoAssignSlideIds();
    formatSlideTitles();
    slides.forEach((slide) => setTimeout(() => adjustContentToFit(slide), 50));
    
    function initializeImageListeners() {
        const images = document.querySelectorAll('.slide-content img');
        images.forEach(img => {
            if (!img.classList.contains('zoom-image')) img.classList.add('zoom-image');
            img.onclick = (e) => { e.stopPropagation(); openLightbox(e.target.src); };
        });
    }
    initializeImageListeners();

    // Tambahkan event listener untuk tombol baru
    downloadButton.addEventListener('click', downloadPDF);

    // Event listener lainnya (tidak berubah)
    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);
    fullscreenButton.addEventListener('click', toggleFullScreen);
    presentationContainer.addEventListener('dblclick', toggleFullScreen);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
        else if (e.key === 'ArrowLeft') prevSlide();
        else if (e.key === 'f' || e.key === 'F11') { e.preventDefault(); toggleFullScreen(); }
        else if (e.key === 'Escape' && lightbox.classList.contains('visible')) closeLightbox();
    });
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

    showSlide(currentSlide);
});