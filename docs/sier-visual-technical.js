// File: sier-visual-technical.js
// VERSI FINAL: Menampilkan detail jaring dan membuat semua asumsi teknis bisa diedit.

const sierVisualTechnical = {
    render() {
        const container = document.getElementById('technicalAnalysisContainer');
        if (!container) return;

        // Ambil data konfigurasi
        const siteParams = projectConfig.site_parameters;
        const drConfig = projectConfig.drivingRange;
        const padelConfig = projectConfig.padel;
        const netConfig = drConfig.capex_assumptions.safety_net;

        // --- Lakukan semua perhitungan lokal di sini untuk ditampilkan ---
        const baysPerLevel = Math.floor(siteParams.driving_range.building_length_m / siteParams.driving_range.bay_width_m);
        const total_bays = drConfig.revenue.main_revenue.bays;
        const premium_bays_percentage = drConfig.capex_assumptions.equipment.premium_bays.percentage_of_total;
        const premium_bays_count = Math.round(total_bays * premium_bays_percentage);

        // Perhitungan Jaring Detail
        const poles_far = Math.ceil(netConfig.field_width_m / netConfig.poles.spacing_m);
        const poles_sides = Math.ceil(netConfig.field_length_m / netConfig.poles.spacing_m) * 2;
        const total_poles = poles_far + poles_sides;
        const area_far = netConfig.field_width_m * netConfig.poles.height_distribution.far_side_m;
        const area_sides = netConfig.field_length_m * netConfig.poles.height_distribution.left_right_side_m * 2;
        const total_net_area = area_far + area_sides;

        // --- 1. Driving Range Section (dengan angka editable) ---
        const drivingRangeHtml = `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-bold text-gray-800 mb-4">1. Spesifikasi Teknis Driving Range</h3>
                <div class="space-y-4">
                    <div class="p-4 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-700">Area & Kapasitas</p>
                        <p class="text-sm text-gray-600 mt-2">
                            Panjang bangunan: ${sierEditable.createEditableNumber(siteParams.driving_range.building_length_m, 'site_parameters.driving_range.building_length_m')} m, 
                            Lebar per bay: ${sierEditable.createEditableNumber(siteParams.driving_range.bay_width_m, 'site_parameters.driving_range.bay_width_m')} m, 
                            Jumlah lantai: ${sierEditable.createEditableNumber(siteParams.driving_range.levels, 'site_parameters.driving_range.levels')}.
                            <br>
                            Ini menghasilkan kapasitas <strong>${baysPerLevel} bay per lantai</strong>, dengan total <strong>${total_bays} bay</strong>.
                            Jarak pukul efektif ke danau: ${sierEditable.createEditableNumber(siteParams.driving_range.field_length_m, 'site_parameters.driving_range.field_length_m')} m.
                        </p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-700">Teknologi & Tipe Bay</p>
                        <p class="text-sm text-gray-600 mt-2">
                            Sebanyak ${sierEditable.createEditableNumber(premium_bays_percentage, 'drivingRange.capex_assumptions.equipment.premium_bays.percentage_of_total', { format: 'percent' })} dari total bay akan menjadi <strong>Bay Premium</strong> (sekitar <strong>${premium_bays_count} bay</strong>), dilengkapi Ball Tracker dan dispenser otomatis.
                        </p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-700">Jaring Pengaman</p>
                        <p class="text-sm text-gray-600 mt-2">
                            Dengan total keliling jaring ${sierEditable.createEditableNumber(netConfig.total_perimeter_m, 'drivingRange.capex_assumptions.safety_net.total_perimeter_m')} m dan jarak antar tiang ${sierEditable.createEditableNumber(netConfig.poles.spacing_m, 'drivingRange.capex_assumptions.safety_net.poles.spacing_m')} m, dibutuhkan sekitar <strong>${total_poles} tiang</strong>.
                            <br>
                            Ketinggian tiang bervariasi: ${sierEditable.createEditableNumber(netConfig.poles.height_distribution.far_side_m, 'drivingRange.capex_assumptions.safety_net.poles.height_distribution.far_side_m')} m di sisi terjauh dan ${sierEditable.createEditableNumber(netConfig.poles.height_distribution.left_right_side_m, 'drivingRange.capex_assumptions.safety_net.poles.height_distribution.left_right_side_m')} m di sisi kiri-kanan.
                            Total estimasi area jaring yang dibutuhkan adalah <strong>${sierHelpers.formatNumber(Math.round(total_net_area))} m²</strong>.
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // --- 2. Padel Section (dengan angka editable) ---
        const padelHtml = `
             <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-bold text-gray-800 mb-4">2. Spesifikasi Teknis Lapangan Padel</h3>
                <div class.space-y-4">
                    <div class="p-4 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-700">Jumlah & Tipe Lapangan</p>
                        <p class="text-sm text-gray-600 mt-2">Dengan total area tersedia ${sierEditable.createEditableNumber(siteParams.padel.total_available_area_m2, 'site_parameters.padel.total_available_area_m2')} m² dan asumsi ${sierEditable.createEditableNumber(siteParams.padel.area_per_court_m2, 'site_parameters.padel.area_per_court_m2')} m² per lapangan, dapat dibangun <strong>${padelConfig.revenue.main_revenue.courts} Lapangan</strong> Padel Indoor.</p>
                    </div>
                </div>
            </div>
        `;

        // --- 3. Human Resources Section (Statik, karena berasal dari Opex) ---
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
                <div class="space-y-4">
                    <div class="p-4 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-700">Struktur Tim Gabungan</p>
                        <p class="text-sm text-gray-600 mt-2">Total estimasi: <strong>${totalManagers} Manajer</strong>, <strong>${totalSupervisors} Supervisor</strong>, <strong>${totalAdminCashiers} Admin/Kasir</strong>, <strong>${totalCoaches} Pelatih</strong>, dan <strong>${totalCleaningSecurity} Staf Kebersihan & Keamanan</strong>. (Jumlah staf dapat diubah di bagian Asumsi Finansial).</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-700">Fokus Pelatihan & SOP</p>
                        <p class="text-sm text-gray-600 mt-2">Pelatihan akan berstandar perhotelan, berfokus pada keramahtamahan dan proaktivitas. SOP kunci akan dikembangkan untuk proses booking, jadwal kebersihan per jam, dan penanganan keluhan.</p>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = drivingRangeHtml + padelHtml + hrHtml;
        console.log("[sier-visual-technical] Analisis Teknis & Operasional: Berhasil dirender dengan detail jaring yang bisa diedit.");
    }
};

window.sierVisualTechnical = sierVisualTechnical;