// File: sier-visual-technical.js
// Merender konten untuk bagian Analisis Teknis & Operasional secara dinamis
// berdasarkan data dari projectConfig di sier-variables.js.

const sierVisualTechnical = {
    /**
     * Fungsi utama untuk merender semua konten teknis.
     */
    render() {
        const container = document.getElementById('technicalAnalysisContainer');
        if (!container) {
            console.error("[sier-visual-technical] Kontainer 'technicalAnalysisContainer' tidak ditemukan.");
            return;
        }

        // Ambil data langsung dari variabel global projectConfig
        const siteParams = projectConfig.site_parameters;
        const drConfig = projectConfig.drivingRange;
        const padelConfig = projectConfig.padel;

        // Hitung jumlah bay per lantai untuk ditampilkan di deskripsi
        const baysPerLevel = Math.floor(siteParams.driving_range.building_length_m / siteParams.driving_range.bay_width_m);

        // --- 1. Driving Range Section (Data Dinamis) ---
        const drivingRangeHtml = `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-bold text-gray-800 mb-4">1. Spesifikasi Teknis Driving Range</h3>
                <div class="space-y-3">
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Area & Kapasitas</p>
                        <p class="text-sm text-gray-600 mt-1">
                            Berdasarkan panjang bangunan efektif <strong>${siteParams.driving_range.building_length_m} meter</strong> dan asumsi lebar per bay <strong>${siteParams.driving_range.bay_width_m} meter</strong>, kapasitas maksimal adalah <strong>${baysPerLevel} bay per lantai</strong>. 
                            Dengan rencana <strong>${siteParams.driving_range.levels} lantai</strong>, total kapasitas menjadi <strong>${drConfig.revenue.main_revenue.bays} bay</strong>, dengan jarak pukul ke danau sejauh <strong>${siteParams.driving_range.field_length_m} meter</strong>.
                        </p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Matras Pukul & Bola Golf</p>
                        <p class="text-sm text-gray-600 mt-1">Menggunakan matras premium dual-surface dan <strong>${sierHelpers.formatNumber(drConfig.capex_assumptions.equipment.floating_balls_count)} bola apung</strong> berkualitas standar.</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Teknologi Ball Tracker</p>
                        <p class="text-sm text-gray-600 mt-1"><strong>${drConfig.capex_assumptions.equipment.ball_tracker_bays_count} bay</strong> akan dilengkapi dengan teknologi Ball Tracker (misal: Toptracer) sebagai produk premium.</p>
                    </div>
                </div>
            </div>
        `;

        // --- 2. Padel Section (Data Dinamis) ---
        const padelHtml = `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-bold text-gray-800 mb-4">2. Spesifikasi Teknis Lapangan Padel</h3>
                <div class="space-y-3">
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Jumlah & Tipe Lapangan</p>
                        <p class="text-sm text-gray-600 mt-1">Dengan total area tersedia <strong>${sierHelpers.formatNumber(siteParams.padel.total_available_area_m2)} m²</strong> dan asumsi <strong>${siteParams.padel.area_per_court_m2} m² per lapangan</strong>, dapat dibangun <strong>${padelConfig.revenue.main_revenue.courts} Lapangan</strong> Padel Indoor standar FIP.</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Permukaan, Dinding & Penerangan</p>
                        <p class="text-sm text-gray-600 mt-1">Menggunakan rumput sintetis standar World Padel Tour, kaca tempered 12mm, dan pencahayaan LED anti-silau > 500 lux.</p>
                    </div>
                </div>
            </div>
        `;

        // --- 3. Human Resources Section (Sama seperti sebelumnya, karena sudah dinamis) ---
        const drStaff = drConfig.opexMonthly.salaries_wages;
        const padelStaff = padelConfig.opexMonthly.salaries_wages;
        const totalManagers = drStaff.manager.count + padelStaff.manager.count;
        const totalSupervisors = drStaff.supervisor.count + padelStaff.supervisor.count;
        const totalAdminCashiers = drStaff.admin_cashier.count + padelStaff.admin_cashier.count;
        const totalCoaches = drConfig.opexMonthly.salaries_wages.coach_trainer.count + (padelConfig.opexMonthly.salaries_wages.coach_trainer ? padelConfig.opexMonthly.salaries_wages.coach_trainer.count : 0);
        const totalCleaningSecurity = drStaff.cleaning_security.count + padelStaff.cleaning_security.count;

        const hrHtml = `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-bold text-gray-800 mb-4">3. Rencana Kebutuhan Sumber Daya Manusia (SDM)</h3>
                <div class="space-y-3">
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Struktur Tim Gabungan</p>
                        <p class="text-sm text-gray-600 mt-1">Total estimasi: <strong>${totalManagers} Manajer</strong>, <strong>${totalSupervisors} Supervisor</strong>, <strong>${totalAdminCashiers} Admin/Kasir</strong>, <strong>${totalCoaches} Pelatih</strong>, dan <strong>${totalCleaningSecurity} Staf Kebersihan & Keamanan</strong>. Mungkin akan ada satu Facility Manager yang mengawasi kedua unit.</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Fokus Pelatihan & SOP</p>
                        <p class="text-sm text-gray-600 mt-1">Pelatihan akan berstandar perhotelan, berfokus pada keramahtamahan dan proaktivitas. SOP kunci akan dikembangkan untuk proses booking, jadwal kebersihan per jam, dan penanganan keluhan.</p>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = drivingRangeHtml + padelHtml + hrHtml;
        
        console.log("[sier-visual-technical] Analisis Teknis & Operasional: Berhasil dirender secara dinamis.");
    }
};

window.sierVisualTechnical = sierVisualTechnical;