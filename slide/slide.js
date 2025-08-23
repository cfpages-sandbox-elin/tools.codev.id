// slide.js FINAL (Download PDF + fix styling zai 8 + ask permission first + DYNAMIC SCRIPT LOAD)
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
    // The only script needed by the current downloadPDF function is jsPDF.
    const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

    // --- STATE VARIABLES ---
    let currentSlide = 0;
    const totalSlides = slides.length;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if the script is already on the page
            if (document.querySelector(`script[src="${src}"]`)) {
                console.log(`Script already loaded: ${src}`);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`Script successfully loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`Failed to load script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    // --- CORE FUNCTIONS ---
    function autoAssignSlideIds() {
        slides.forEach((slide, index) => {
            slide.id = `slide${index + 1}`;
        });
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
    
    async function downloadPDF() {
        if (document.body.classList.contains('pdf-generating')) return;
        console.log("--- MEMULAI PROSES GENERATE PDF ---");
        const downloadButton = document.getElementById('download-btn');
        const originalIcon = downloadButton.innerHTML;
        const fileName = `${document.title}.pdf`;

        document.body.classList.add('pdf-generating');
        downloadButton.innerHTML = '<i class="fas fa-spinner"></i>';
        downloadButton.classList.add('loading');
        
        try {
            const slides = document.querySelectorAll('.slide');
            if (slides.length === 0) throw new Error("Tidak ada elemen .slide yang ditemukan.");
            
            // This line now safely assumes jsPDF is loaded
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1366, 768]
            });
            console.log("Objek jsPDF berhasil dibuat.");
            
            const originalActiveSlide = currentSlide;
            
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
            
            showSlide(originalActiveSlide);
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

    // --- MODIFIED: The download button now calls the new handler function ---
    downloadButton.addEventListener('click', handleDownloadClick);

    // Other event listeners (unchanged)
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