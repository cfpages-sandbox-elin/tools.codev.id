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

        const baysPerLevel = Math.floor(siteParams.driving_range.building_length_m / siteParams.driving_range.bay_width_m);

    // Hitung breakdown bay untuk ditampilkan
    const total_bays = drConfig.revenue.main_revenue.bays;
    const premium_bays_percentage = drConfig.capex_assumptions.equipment.premium_bays.percentage_of_total * 100;
    const premium_bays_count = Math.round(total_bays * drConfig.capex_assumptions.equipment.premium_bays.percentage_of_total);

    // --- 1. Driving Range Section (Data Dinamis) ---
    const drivingRangeHtml = `
        <div class="mb-8 pb-6 border-b">
            <h3 class="text-xl font-bold text-gray-800 mb-4">1. Spesifikasi Teknis Driving Range</h3>
            <div class="space-y-3">
                <div class="p-3 bg-gray-50 rounded-md">
                    <p class="font-semibold text-gray-700">Area & Kapasitas</p>
                    <p class="text-sm text-gray-600 mt-1">
                        Bangunan utama seluas <strong>${sierHelpers.formatNumber(drConfig.capex_assumptions.building.dr_bays_area_m2)} m²</strong>. Dengan panjang bangunan <strong>${siteParams.driving_range.building_length_m} m</strong> dan lebar bay <strong>${siteParams.driving_range.bay_width_m} m</strong>, kapasitas maksimal adalah <strong>${baysPerLevel} bay per lantai</strong>. 
                        Dengan rencana <strong>${siteParams.driving_range.levels} lantai</strong>, total kapasitas menjadi <strong>${total_bays} bay</strong>. Jarak pukul efektif ke danau adalah <strong>${siteParams.driving_range.field_length_m} m</strong>.
                    </p>
                </div>
                <div class="p-3 bg-gray-50 rounded-md">
                    <p class="font-semibold text-gray-700">Teknologi & Tipe Bay</p>
                    <p class="text-sm text-gray-600 mt-1">
                        Sebanyak <strong>${premium_bays_percentage}% (${premium_bays_count} bay)</strong> akan menjadi <strong>Bay Premium</strong>, dilengkapi dengan teknologi Ball Tracker dan sistem dispenser bola otomatis. Sisanya adalah <strong>Bay Normal</strong> dengan matras dan partisi standar.
                    </p>
                </div>
                <div class="p-3 bg-gray-50 rounded-md">
                    <p class="font-semibold text-gray-700">Jaring Pengaman</p>
                    <p class="text-sm text-gray-600 mt-1">
                        Danau akan dikelilingi jaring pengaman di tiga sisi dengan total panjang <strong>${drConfig.capex_assumptions.safety_net.field_width_m + (drConfig.capex_assumptions.safety_net.field_length_m * 2)} m</strong>, dan ketinggian tiang variatif antara <strong>${drConfig.capex_assumptions.safety_net.poles.height_distribution.left_right_side_m}m</strong> hingga <strong>${drConfig.capex_assumptions.safety_net.poles.height_distribution.far_side_m}m</strong>.
                    </p>
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