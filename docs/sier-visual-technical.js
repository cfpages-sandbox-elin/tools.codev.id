// File: sier-visual-technical.js
// VERSI DIPERBARUI: Menampilkan Parameter Desain Dasar & Spesifikasi Turunan

const sierVisualTechnical = {
    render() {
        const container = document.getElementById('technical-operational-analysis');
        if (!container || !container.parentElement) return;

        // Ambil data konfigurasi
        const siteParams = projectConfig.site_parameters;
        const drConfig = projectConfig.drivingRange;
        const padelConfig = projectConfig.padel;

        // --- 1. Parameter Desain Dasar (Informasi Baru) ---
        const baseParamsHtml = `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-bold text-gray-800 mb-4">1. Parameter Desain Dasar</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Driving Range -->
                    <div class="p-4 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-700">Driving Range</p>
                        <table class="w-full text-sm mt-2"><tbody>
                            <tr><td class="py-1">Panjang Bangunan</td><td class="py-1 text-right">${sierEditable.createEditableNumber(siteParams.driving_range.building_length_m, 'site_parameters.driving_range.building_length_m')} m</td></tr>
                            <tr><td class="py-1">Lebar per Bay</td><td class="py-1 text-right">${sierEditable.createEditableNumber(siteParams.driving_range.bay_width_m, 'site_parameters.driving_range.bay_width_m')} m</td></tr>
                            <tr><td class="py-1">Jumlah Lantai</td><td class="py-1 text-right">${sierEditable.createEditableNumber(siteParams.driving_range.levels, 'site_parameters.driving_range.levels')}</td></tr>
                            <tr><td class="py-1">Jarak Pukul Efektif</td><td class="py-1 text-right">${sierEditable.createEditableNumber(siteParams.driving_range.field_length_m, 'site_parameters.driving_range.field_length_m')} m</td></tr>
                        </tbody></table>
                    </div>
                    <!-- Padel -->
                    <div class="p-4 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-700">Lapangan Padel</p>
                         <table class="w-full text-sm mt-2"><tbody>
                            <tr><td class="py-1">Total Area Tersedia</td><td class="py-1 text-right">${sierEditable.createEditableNumber(siteParams.padel.total_available_area_m2, 'site_parameters.padel.total_available_area_m2')} m²</td></tr>
                            <tr><td class="py-1">Kebutuhan Area per Lapangan</td><td class="py-1 text-right">${sierEditable.createEditableNumber(siteParams.padel.area_per_court_m2, 'site_parameters.padel.area_per_court_m2')} m²</td></tr>
                        </tbody></table>
                    </div>
                </div>
            </div>
        `;

        // --- 2. Spesifikasi Teknis Turunan (Informasi Lama yang Ditingkatkan) ---
        const baysPerLevel = Math.floor(siteParams.driving_range.building_length_m / siteParams.driving_range.bay_width_m);
        const total_bays = drConfig.revenue.main_revenue.bays;
        const premium_bays_percentage = drConfig.capex_assumptions.equipment.premium_bays.percentage_of_total;
        const premium_bays_count = Math.round(total_bays * premium_bays_percentage);

        const derivedSpecsHtml = `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-bold text-gray-800 mb-4">2. Spesifikasi Teknis Turunan</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Kapasitas -->
                    <div class="p-4 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-700">Kapasitas Fasilitas</p>
                        <p class="text-sm text-gray-600 mt-2">
                            - <strong>Driving Range:</strong> Menghasilkan <strong>${baysPerLevel} bay per lantai</strong>, dengan total <strong>${total_bays} bay</strong>.<br>
                            - <strong>Padel:</strong> Menghasilkan total <strong>${padelConfig.revenue.main_revenue.courts} lapangan</strong> Padel Indoor.
                        </p>
                    </div>
                     <!-- Tipe Bay -->
                    <div class="p-4 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-700">Tipe Bay & Teknologi</p>
                        <p class="text-sm text-gray-600 mt-2">
                            Sebanyak ${sierEditable.createEditableNumber(premium_bays_percentage, 'drivingRange.capex_assumptions.equipment.premium_bays.percentage_of_total', { format: 'percent' })} dari total bay akan menjadi <strong>Bay Premium</strong> (sekitar <strong>${premium_bays_count} bay</strong>), dilengkapi teknologi Ball Tracker.
                        </p>
                    </div>
                </div>
            </div>
        `;

        // --- 3. Rencana SDM (Struktur Tim) ---
        const drStaff = drConfig.opexMonthly.salaries_wages;
        const padelStaff = padelConfig.opexMonthly.salaries_wages;
        const totalStaff = Object.values(drStaff).reduce((sum, role) => sum + role.count, 0) + Object.values(padelStaff).reduce((sum, role) => sum + role.count, 0);

        const hrHtml = `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-bold text-gray-800 mb-4">3. Rencana Kebutuhan Sumber Daya Manusia (SDM)</h3>
                <div class="p-4 bg-gray-50 rounded-lg border">
                    <p class="font-semibold text-gray-700">Struktur Tim Gabungan</p>
                    <p class="text-sm text-gray-600 mt-2">Total estimasi kebutuhan staf untuk kedua fasilitas adalah sekitar <strong>${totalStaff} orang</strong>. Rincian posisi dan gaji dapat dilihat pada tabel detail Biaya Operasional di bagian Analisis Finansial.</p>
                </div>
            </div>
        `;

        // Gabungkan semua bagian dan render ke kontainer utama
        const parentContainer = container.parentElement;
        parentContainer.innerHTML = `
            <p class="text-gray-600 mb-6">
                Keberhasilan sebuah ide bergantung pada eksekusi teknis dan operasional yang unggul. Analisis ini membedah elemen-elemen teknis krusial dari proyek, mulai dari parameter desain dasar hingga rencana sumber daya manusia, untuk memastikan fasilitas yang dibangun tidak hanya memenuhi, tetapi melampaui ekspektasi pasar.
            </p>
            <div id="technicalAnalysisContainer" class="space-y-8">
                ${baseParamsHtml}
                ${derivedSpecsHtml}
                ${hrHtml}
            </div>
        `;
        console.log("[sier-visual-technical] Analisis Teknis & Operasional: Berhasil dirender ulang dengan parameter dasar.");
    }
};

window.sierVisualTechnical = sierVisualTechnical;