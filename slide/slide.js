// slide.js FINAL (dengan fungsi Download PDF + fix laman PDF sama 2)
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
    
    // --- FUNGSI BARU: DOWNLOAD PDF ---
    async function downloadPDF() {
        if (downloadButton.classList.contains('loading')) return;

        const originalIcon = downloadButton.innerHTML;
        downloadButton.innerHTML = '<i class="fas fa-spinner"></i>';
        downloadButton.classList.add('loading');

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        document.body.appendChild(tempContainer);

        try {
            if (slides.length === 0) return; // Keluar jika tidak ada slide

            // --- LANGKAH 1: Buat Halaman Pertama & Dapatkan Objek PDF ---
            // Kita proses slide pertama secara terpisah untuk menginisialisasi objek PDF.
            const firstSlideClone = slides[0].cloneNode(true);
            firstSlideClone.style.opacity = '1';
            firstSlideClone.style.visibility = 'visible';
            firstSlideClone.style.position = 'relative';
            firstSlideClone.style.transform = 'none';
            firstSlideClone.style.display = 'block';
            firstSlideClone.style.height = '720px';
            firstSlideClone.style.width = '1280px';
            tempContainer.appendChild(firstSlideClone);

            const options = {
                margin: 0,
                filename: 'SIER - Studi Kelayakan Proyek Olahraga.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'px', format: [1280, 720], orientation: 'landscape' }
            };

            // Dapatkan instance PDF setelah memproses elemen pertama.
            const pdf = await html2pdf().from(firstSlideClone).set(options).toPdf().get('pdf');
            tempContainer.innerHTML = ''; // Bersihkan setelah selesai

            // --- LANGKAH 2: Loop Sisa Slide & Tambahkan ke PDF yang Ada ---
            // Kita mulai loop dari slide kedua (index = 1)
            for (let i = 1; i < slides.length; i++) {
                const slide = slides[i];
                const clone = slide.cloneNode(true);
                
                clone.style.opacity = '1';
                clone.style.visibility = 'visible';
                clone.style.position = 'relative';
                clone.style.transform = 'none';
                clone.style.display = 'block';
                clone.style.height = '720px';
                clone.style.width = '1280px';
                
                tempContainer.appendChild(clone);

                // Ubah slide menjadi gambar menggunakan html2canvas (yang tersedia secara global)
                const canvas = await html2canvas(clone, options.html2canvas);
                const imgData = canvas.toDataURL('image/jpeg', 0.98);

                // Tambahkan halaman baru ke objek PDF yang sudah ada
                pdf.addPage();
                
                // Tambahkan gambar ke halaman baru tersebut
                pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
                
                tempContainer.innerHTML = ''; // Bersihkan container
            }

            // --- LANGKAH 3: Simpan PDF yang Sudah Lengkap ---
            pdf.save(options.filename);

        } catch (error) {
            console.error("Gagal membuat PDF:", error);
            alert("Terjadi kesalahan saat membuat PDF. Silakan periksa konsol untuk detail.");
        } finally {
            // Kembalikan tombol ke kondisi semula
            downloadButton.innerHTML = originalIcon;
            downloadButton.classList.remove('loading');
            
            // Hapus container sementara dari body
            document.body.removeChild(tempContainer);
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