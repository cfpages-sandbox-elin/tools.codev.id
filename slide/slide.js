// slide.js FINAL (dengan fungsi Download PDF + fix laman PDF sama 4)
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
    
    // slide.js -> GANTI FUNGSI INI DENGAN VERSI FINAL YANG SUDAH TERUJI
    async function downloadPDF() {
        if (downloadButton.classList.contains('loading')) return;

        const originalIcon = downloadButton.innerHTML;
        downloadButton.innerHTML = '<i class="fas fa-spinner"></i>';
        downloadButton.classList.add('loading');

        const tempContainer = document.createElement('div');
        // Mencegah style dari luar mengganggu rendering
        Object.assign(tempContainer.style, {
            position: 'absolute',
            left: '-9999px',
            top: '0',
            margin: '0',
            padding: '0'
        });
        document.body.appendChild(tempContainer);

        try {
            if (slides.length === 0) throw new Error("Tidak ada slide untuk di-download.");

            // 1. BUAT DOKUMEN PDF KOSONG SECARA MANUAL
            // Kita akses konstruktor jsPDF dari bundle html2pdf. Ini cara yang benar.
            const { jsPDF } = html2pdf.jsPDF;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1280, 720]
            });

            // 2. LOOP SETIAP SLIDE UNTUK DIUBAH MENJADI GAMBAR
            for (let i = 0; i < slides.length; i++) {
                const slide = slides[i];
                const clone = slide.cloneNode(true);
                
                Object.assign(clone.style, {
                    opacity: '1',
                    visibility: 'visible',
                    position: 'relative',
                    transform: 'none',
                    display: 'block',
                    height: '720px',
                    width: '1280px',
                    margin: '0',
                    padding: '0'
                });
                
                tempContainer.appendChild(clone);

                // Beri waktu untuk browser merender (mencegah race condition)
                await new Promise(resolve => setTimeout(resolve, 50));

                // 3. UBAH CLONE MENJADI GAMBAR DENGAN KONTROL PENUH
                const canvas = await html2canvas(clone, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    // INI KUNCI UNTUK MENGHILANGKAN PADDING PUTIH:
                    // Kita secara eksplisit memberitahu area mana yang harus "difoto".
                    x: 0,
                    y: 0,
                    width: 1280,
                    height: 720
                });
                const imgData = canvas.toDataURL('image/jpeg', 0.98);

                // 4. TAMBAHKAN GAMBAR KE DOKUMEN PDF
                // Tambahkan halaman baru jika ini bukan slide pertama
                if (i > 0) {
                    pdf.addPage([1280, 720], 'landscape');
                }
                // Tempatkan gambar di halaman saat ini, di posisi 0,0
                pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);

                tempContainer.innerHTML = ''; // Bersihkan untuk slide berikutnya
            }

            // 5. SIMPAN PDF SETELAH SEMUA HALAMAN DITAMBAHKAN
            pdf.save('SIER - Studi Kelayakan Proyek Olahraga.pdf');

        } catch (error) {
            console.error("Gagal membuat PDF:", error);
            alert("Terjadi kesalahan saat membuat PDF. Silakan periksa konsol untuk detail.");
        } finally {
            downloadButton.innerHTML = originalIcon;
            downloadButton.classList.remove('loading');
            
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
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