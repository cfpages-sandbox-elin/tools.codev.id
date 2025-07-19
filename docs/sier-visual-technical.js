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
        const drConfig = projectConfig.drivingRange;
        const padelConfig = projectConfig.padel;

        // --- 1. Driving Range Section (Data Dinamis) ---
        const drivingRangeHtml = `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-bold text-gray-800 mb-4">1. Spesifikasi Teknis Driving Range</h3>
                <div class="space-y-3">
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Area & Kapasitas</p>
                        <p class="text-sm text-gray-600 mt-1">Total <strong>${drConfig.revenue.main_revenue.bays} bay</strong> (lantai 1 & 2). Dimensi per bay: 3.5m (lebar) x 5m (panjang). Area lounge terintegrasi di belakang bay.</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Matras Pukul</p>
                        <p class="text-sm text-gray-600 mt-1">Menggunakan matras dual-surface premium (fairway & rough simulation) untuk latihan yang lebih realistis. Contoh merek: TrueStrike / Fiberbuilt.</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Bola Golf</p>
                        <p class="text-sm text-gray-600 mt-1">Bola apung (floating balls) 2-piece dengan kualitas & kompresi standar, tahan lama untuk penggunaan volume tinggi. Jumlah inventaris awal: <strong>${sierHelpers.formatNumber(drConfig.capex_assumptions.equipment.floating_balls_count)} bola</strong>.</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Jaring Pengaman (Netting)</p>
                        <p class="text-sm text-gray-600 mt-1">Jaring berbahan High-Density Polyethylene (HDPE) yang tahan UV, tinggi 30-40m dengan tiang baja galvanis. Jarak aman dari SUTT harus diverifikasi dengan PLN.</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Teknologi Ball Tracker</p>
                        <p class="text-sm text-gray-600 mt-1"><strong>${drConfig.capex_assumptions.equipment.ball_tracker_bays_count} bay</strong> akan dilengkapi dengan teknologi Ball Tracker (misal: Toptracer) sebagai produk premium untuk analisis pukulan dan gamifikasi.</p>
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
                        <p class="text-sm text-gray-600 mt-1"><strong>${padelConfig.revenue.main_revenue.courts} Lapangan</strong> Padel Indoor, sesuai standar International Padel Federation (FIP). Dimensi lapangan: 10m x 20m.</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Permukaan (Court)</p>
                        <p class="text-sm text-gray-600 mt-1">Rumput sintetis monofilamen premium dengan standar World Padel Tour. Contoh merek: Mondo Supercourt, dengan isian pasir silika khusus.</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-md">
                        <p class="font-semibold text-gray-700">Dinding Kaca & Penerangan</p>
                        <p class="text-sm text-gray-600 mt-1">Kaca tempered setebal 12mm dan sistem pencahayaan LED anti-silau > 500 lux untuk memastikan pantulan bola konsisten dan visibilitas optimal.</p>
                    </div>
                </div>
            </div>
        `;

        // --- 3. Human Resources Section (Data Dinamis) ---
        // Kalkulasi total SDM dari kedua unit bisnis
        const drStaff = drConfig.opexMonthly.salaries_wages;
        const padelStaff = padelConfig.opexMonthly.salaries_wages;
        const totalManagers = drStaff.manager.count + padelStaff.manager.count;
        const totalSupervisors = drStaff.supervisor.count + padelStaff.supervisor.count;
        const totalAdminCashiers = drStaff.admin_cashier.count + padelStaff.admin_cashier.count;
        const totalCoaches = drStaff.coach_trainer.count + (padelStaff.coach_trainer ? padelStaff.coach_trainer.count : 0);
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

        // Gabungkan semua bagian dan render ke dalam kontainer
        container.innerHTML = drivingRangeHtml + padelHtml + hrHtml;
        
        console.log("[sier-visual-technical] Analisis Teknis & Operasional: Berhasil dirender secara dinamis.");
    }
};

// Lampirkan ke window object agar bisa diakses file lain
window.sierVisualTechnical = sierVisualTechnical;