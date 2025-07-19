// File: sier-visual-technical.js
// Merender konten untuk bagian Analisis Teknis & Operasional.

const sierVisualTechnical = {
    // Data untuk analisis teknis. Bisa juga dipindah ke sier-data.js jika lebih kompleks.
    technicalData: {
        drivingRange: {
            title: "1. Spesifikasi Teknis Driving Range",
            items: [
                { aspect: "Area & Kapasitas", detail: "Total 30 bay (lantai 1 & 2). Dimensi per bay: 3.5m (lebar) x 5m (panjang). Area lounge terintegrasi di belakang bay." },
                { aspect: "Matras Pukul", detail: "Menggunakan matras dual-surface premium (fairway & rough simulation) untuk latihan yang lebih realistis. Contoh merek: TrueStrike / Fiberbuilt." },
                { aspect: "Bola Golf", detail: "Bola apung (floating balls) 2-piece dengan kualitas & kompresi standar, tahan lama untuk penggunaan volume tinggi. Jumlah inventaris awal: 8.000 bola." },
                { aspect: "Jaring Pengaman (Netting)", detail: "Jaring berbahan High-Density Polyethylene (HDPE) yang tahan UV, tinggi 30-40m dengan tiang baja galvanis. Jarak aman dari SUTT harus diverifikasi dengan PLN." },
                { aspect: "Sistem Dispenser", detail: "Sistem dispenser bola otomatis terintegrasi dengan sistem pembayaran non-tunai (kartu tap/QRIS) untuk efisiensi operasional." },
                { aspect: "Teknologi (Opsional)", detail: "12 bay dilengkapi dengan teknologi Ball Tracker (misal: Toptracer) sebagai produk premium untuk analisis pukulan dan gamifikasi." }
            ]
        },
        padel: {
            title: "2. Spesifikasi Teknis Lapangan Padel",
            items: [
                { aspect: "Jumlah & Tipe Lapangan", detail: "4 Lapangan Padel Indoor, sesuai standar International Padel Federation (FIP). Dimensi lapangan: 10m x 20m." },
                { aspect: "Permukaan (Court)", detail: "Rumput sintetis monofilamen premium dengan standar World Padel Tour. Contoh merek: Mondo Supercourt, dengan isian pasir silika khusus." },
                { aspect: "Dinding Kaca", detail: "Kaca tempered setebal 12mm yang kokoh dan memberikan pantulan bola yang konsisten dan aman." },
                { aspect: "Penerangan", detail: "Sistem pencahayaan LED anti-silau (anti-glare) dengan tingkat terang > 500 lux, memastikan visibilitas optimal untuk permainan malam hari dan rekaman video." },
                { aspect: "Sistem Booking", detail: "Platform booking online terintegrasi (website/aplikasi) yang menampilkan ketersediaan real-time dan pembayaran online untuk mengurangi beban admin." }
            ]
        },
        humanResources: {
            title: "3. Rencana Kebutuhan Sumber Daya Manusia (SDM)",
            items: [
                { aspect: "Struktur Tim", detail: "1 Facility Manager, 2 Supervisor (Shift Pagi/Malam), 4 Staf Admin/Kasir, 2 Pelatih (Golf/Padel), 4 Staf Kebersihan & Keamanan." },
                { aspect: "Fokus Pelatihan", detail: "Pelatihan berstandar perhotelan dengan penekanan pada: (1) Keramahan & Proaktivitas, (2) Pengetahuan Produk (aturan dasar golf/padel), (3) Penanganan Keluhan, (4) Prosedur Kebersihan." },
                { aspect: "SOP Kunci", detail: "Pengembangan SOP untuk: (1) Proses check-in & booking, (2) Jadwal pembersihan toilet & fasilitas per jam, (3) Protokol keamanan & darurat, (4) Manajemen inventaris (bola, raket sewaan)." }
            ]
        }
    },

    /**
     * Fungsi utama untuk merender semua konten teknis.
     */
    render() {
        const container = document.getElementById('technicalAnalysisContainer');
        if (!container) {
            console.error("[sier-visual-technical] Kontainer 'technicalAnalysisContainer' tidak ditemukan.");
            return;
        }

        let htmlContent = '';

        // Fungsi helper untuk membuat satu bagian analisis
        const createSectionHtml = (sectionData) => {
            return `
                <div class="mb-8 pb-6 border-b">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">${sectionData.title}</h3>
                    <div class="space-y-3">
                        ${sectionData.items.map(item => `
                            <div class="p-3 bg-gray-50 rounded-md">
                                <p class="font-semibold text-gray-700">${item.aspect}</p>
                                <p class="text-sm text-gray-600 mt-1">${item.detail}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        };

        htmlContent += createSectionHtml(this.technicalData.drivingRange);
        htmlContent += createSectionHtml(this.technicalData.padel);
        htmlContent += createSectionHtml(this.technicalData.humanResources);

        container.innerHTML = htmlContent;
        console.log("[sier-visual-technical] Analisis Teknis & Operasional: Berhasil dirender.");
    }
};

// Lampirkan ke window object agar bisa diakses file lain
window.sierVisualTechnical = sierVisualTechnical;