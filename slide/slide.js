// slide.js v1.0 auto format md luas
document.addEventListener('DOMContentLoaded', function () {
    // --- ELEMENT SELECTORS ---
    const presentationContainer = document.getElementById('presentation-container');
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.getElementById('prev-slide');
    const nextButton = document.getElementById('next-slide');
    const slideCounter = document.getElementById('slide-counter');
    const fullscreenButton = document.getElementById('fullscreen-btn');
    const downloadButton = document.getElementById('download-btn');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    
    // --- DEPENDENCY URL ---
    const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

    // --- STATE VARIABLES ---
    let currentSlide = 0;
    const totalSlides = slides.length;
    // --- NEW: Define isMobile check in a shared scope ---
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // --- MOBILE GESTURE STATE ---
    let touchStartX = 0;
    let touchStartY = 0;

    // --- DYNAMIC SCRIPT LOADER ---
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    // --- CORE FUNCTIONS ---
    function formatMarkdownFormatting() {
        const elements = document.querySelectorAll('.slide-content p, .slide-content li, .slide-content h3, .slide-content h4, .slide-content div');
        
        elements.forEach(el => {
            // Cek untuk menghindari pemrosesan ulang elemen yang sudah memiliki anak elemen kompleks
            if (el.children.length > 1) { 
                // Jika elemen sudah punya banyak anak (misal: div dengan banyak p di dalamnya),
                // kita proses anaknya satu per satu untuk keamanan.
                Array.from(el.childNodes).forEach(child => {
                    if (child.nodeType === 3) { // Hanya proses Text Nodes
                        const wrapper = document.createElement('span');
                        wrapper.innerHTML = child.textContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                        wrapper.innerHTML = child.textContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
                        el.replaceChild(wrapper, child);
                    }
                });
            } else {
                 // Jika elemen sederhana, proses langsung innerHTML-nya
                let html = el.innerHTML;
                html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
                el.innerHTML = html;
            }
        });
    }

    function autoAssignSlideIds() {
        slides.forEach((slide, index) => {
            slide.id = `slide${index + 1}`;
        });
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

    // --- MODIFIED: Navigation functions with device-specific logic ---
    function nextSlide() { 
        // --- RESTORED: Desktop-only fullscreen logic ---
        if (!isMobile && !document.fullscreenElement) {
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

    function toggleFullScreen() { 
        if (!document.fullscreenElement) { 
            presentationContainer.requestFullscreen().catch(err => { alert(`Error: ${err.message}`); }); 
        } else { 
            document.exitFullscreen(); 
        } 
    }

    function openLightbox(src) { lightboxImg.src = src; lightbox.classList.add('visible'); }
    function closeLightbox() { lightbox.classList.remove('visible'); }
    
    async function downloadPDF() {
        if (document.body.classList.contains('pdf-generating')) return;
        console.log("--- MEMULAI PROSES GENERATE PDF ---");
        const downloadButton = document.getElementById('download-btn');
        const originalIcon = downloadButton.innerHTML;
        const fileName = `${document.title}.pdf`;

        // --- FIX: Declare the variable here, in the function's top-level scope ---
        let originalActiveSlide;

        document.body.classList.add('pdf-generating');
        downloadButton.innerHTML = '<i class="fas fa-spinner"></i>';
        downloadButton.classList.add('loading');
        
        try {
            const slides = document.querySelectorAll('.slide');
            if (slides.length === 0) throw new Error("Tidak ada elemen .slide yang ditemukan.");
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1366, 768]
            });
            console.log("Objek jsPDF berhasil dibuat.");
            
            originalActiveSlide = currentSlide;
            
            alert("Anda akan diminta untuk memilih sumber tangkapan layar. Silakan pilih 'Tab ini' atau 'Browser Tab' untuk menghindari menangkap elemen desktop.");
            
            let stream;
            try {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "never", width: { ideal: 1366 }, height: { ideal: 768 } },
                    audio: false,
                    preferCurrentTab: true
                });
            } catch (err) {
                console.error("Gagal mendapatkan izin tangkapan layar:", err);
                throw new Error("Anda harus memberikan izin untuk melanjutkan.");
            }
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            await new Promise(resolve => { video.onloadedmetadata = resolve; });
            
            const canvas = document.createElement('canvas');
            canvas.width = 1366;
            canvas.height = 768;
            const ctx = canvas.getContext('2d');
            
            await presentationContainer.requestFullscreen();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const screenshots = [];
            
            for (let i = 0; i < slides.length; i++) {
                console.log(`[Slide ${i + 1}/${slides.length}] Memulai proses...`);
                showSlide(i);
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log(`[Slide ${i + 1}] Mengambil screenshot...`);
                ctx.drawImage(video, 0, 0, 1366, 768);
                const imgData = canvas.toDataURL('image/jpeg', 0.98);
                screenshots.push(imgData);
                console.log(`[Slide ${i + 1}] Screenshot berhasil.`);
            }
            
            stream.getTracks().forEach(track => track.stop());
            
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            
            for (let i = 0; i < screenshots.length; i++) {
                if (i > 0) {
                    pdf.addPage([1366, 768], 'landscape');
                }
                pdf.addImage(screenshots[i], 'JPEG', 0, 0, 1366, 768);
                console.log(`[Slide ${i + 1}] Berhasil ditambahkan ke PDF.`);
            }
            
            console.log(`Semua slide telah diproses. Menyimpan file PDF sebagai: ${fileName}`);
            pdf.save(fileName);
            console.log("--- PROSES PDF BERHASIL ---");
        } catch (error) {
            console.error("--- PROSES PDF GAGAL ---", { message: error.message, stack: error.stack, errorObject: error });
            alert("Terjadi kesalahan kritis saat membuat PDF. Silakan buka konsol (F12) untuk melihat detail teknis.");
        } finally {
            console.log("Membersihkan sumber daya...");
            document.body.classList.remove('pdf-generating');
            downloadButton.innerHTML = originalIcon;
            downloadButton.classList.remove('loading');
            
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            
            if (originalActiveSlide !== undefined) {
                showSlide(originalActiveSlide);
            }
            console.log("Pembersihan selesai.");
        }
    }

    async function handleDownloadClick() {
        try {
            // First, load the script and wait for it to be ready
            await loadScript(JSPDF_URL);
            // Once the script is loaded, window.jspdf is available, so we can proceed
            await downloadPDF();
        } catch (error) {
            alert('Could not load the required PDF library. Please check your internet connection and try again.');
            console.error(error);
        }
    }

    // --- MOBILE GESTURE HANDLING ---
    function initializeMobileControls() {
        // The check remains the same, but now it uses the globally scoped `isMobile` variable
        if (!isMobile) return;

        console.log("Mobile controls enabled.");

        function handleTouchStart(e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }

        function handleTouchEnd(e) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            const swipeThreshold = 50;
            const tapThreshold = 10;

            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                return;
            }

            // Swipe Logic
            if (Math.abs(deltaX) > swipeThreshold) {
                if (deltaX < 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            } 
            // Tap Logic
            else if (Math.abs(deltaX) < tapThreshold) {
                const containerWidth = presentationContainer.offsetWidth;
                if (touchStartX > containerWidth / 2) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        }

        presentationContainer.addEventListener('touchstart', handleTouchStart);
        presentationContainer.addEventListener('touchend', handleTouchEnd);
    }


    // --- INITIALIZATION & EVENT LISTENERS ---
    formatMarkdownFormatting();
    autoAssignSlideIds();
    formatSlideTitles();
    
    function initializeImageListeners() {
        const images = document.querySelectorAll('.slide-content img');
        images.forEach(img => {
            if (!img.classList.contains('zoom-image')) img.classList.add('zoom-image');
            img.onclick = (e) => { e.stopPropagation(); openLightbox(e.target.src); };
        });
    }
    initializeImageListeners();

    // Event listeners
    downloadButton.addEventListener('click', handleDownloadClick);
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

    // Activate mobile controls and show the first slide
    initializeMobileControls();
    showSlide(currentSlide);
});