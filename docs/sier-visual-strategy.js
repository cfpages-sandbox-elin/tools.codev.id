// File: sier-visual-strategy.js
// VERSI FINAL: Merender Analisis BEP dengan rincian biaya variabel bottom-up yang bisa diedit.

const sierVisualStrategy = {
    _createVariableCostTable(unitName, bepData) {
        const vcConfig = (unitName === 'drivingRange') 
            ? projectConfig.drivingRange.operational_assumptions.variable_costs_per_session 
            : projectConfig.padel.operational_assumptions.variable_costs_per_hour;
        
        const basePath = `${unitName}.operational_assumptions.${(unitName === 'drivingRange' ? 'variable_costs_per_session' : 'variable_costs_per_hour')}`;

        let rows = '';
        for (const key in vcConfig) {
            const label = sierTranslate.translate(key);
            const value = vcConfig[key];
            const path = `${basePath}.${key}`;
            
            // Dapatkan nilai yang sudah dihitung dari bepData untuk komponen listrik
            let calculatedValueDisplay = '';
            if (key.includes('electricity') || key.includes('lights')) {
                const electricityComponentKey = Object.keys(bepData.variableCostBreakdown).find(k => k.toLowerCase().includes('listrik'));
                calculatedValueDisplay = `<span class="text-xs text-gray-500 ml-2">(~Rp ${sierHelpers.formatNumber(Math.round(bepData.variableCostBreakdown[electricityComponentKey]))})</span>`;
            }

            rows += `
                <tr>
                    <td class="py-1 pl-4 text-gray-600 text-xs italic">- ${label}</td>
                    <td class="py-1 text-right">
                        ${sierEditable.createEditableNumber(value, path)}
                        ${calculatedValueDisplay}
                    </td>
                </tr>
            `;
        }

        return `
            <table class="w-full text-sm mt-1 mb-2">
                <tbody>
                    ${rows}
                    <tr class="border-t">
                        <td class="py-2 pl-4 text-gray-600 font-medium">Total Biaya Variabel</td>
                        <td class="py-2 text-right font-bold">Rp ${sierHelpers.formatNumber(Math.round(bepData.variableCostPerUnit))}</td>
                    </tr>
                </tbody>
            </table>
        `;
    },

    _renderDrivingRange() {
        const container = document.getElementById('driving-range-business-strategy');
        if (!container) return;
        const bepData = sierMath.calculateBEP('drivingRange');
        
        const html = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-rose-600 pl-4">Analisis Bisnis & Strategi: Driving Range</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-semibold mb-4 text-gray-700">1. Analisis Lanskap Operasional Kompetitor</h3>
                <!-- Konten statis -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"> <div class="bg-gray-50 p-4 rounded-lg border"> <h4 class="font-semibold text-gray-800">a. Kelemahan Kualitas Layanan & Kebersihan</h4> <ul class="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1"> <li><strong>Pain Point Utama:</strong> Ulasan pelanggan kompetitor premium sekalipun sering mengeluhkan kebersihan toilet, staf yang kurang ramah, dan fasilitas yang kurang terawat.</li> <li><strong>Strategi:</strong> Jadikan <strong>"Operational Excellence"</strong> sebagai pilar utama. Standar kebersihan hotel, staf proaktif, dan matras/bola yang selalu dalam kondisi prima akan menjadi pembeda yang kuat.</li> </ul> </div> <div class="bg-gray-50 p-4 rounded-lg border"> <h4 class="font-semibold text-gray-800">b. Kelemahan Digital & Booking</h4> <ul class="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1"> <li><strong>Pain Point Utama:</strong> Sebagian besar kompetitor tidak memiliki sistem booking online yang andal untuk driving range, mengandalkan sistem walk-in atau reservasi via telepon yang tidak efisien.</li> <li><strong>Strategi:</strong> Implementasikan sistem booking online yang memungkinkan pelanggan memilih bay dan waktu, terutama untuk bay premium berteknologi. Ini akan meningkatkan kenyamanan dan efisiensi.</li> </ul> </div> </div>

                <h3 class="text-xl font-semibold mb-4 pt-6 border-t mt-8 text-gray-700">2. Model Break-Even Point (BEP) - Driving Range</h3>
                <p class="text-gray-600 mb-2">Model ini menghitung berapa banyak penjualan sesi (100 bola) yang dibutuhkan untuk menutupi semua biaya tetap bulanan.</p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4">
                    <div>
                        <h4 class="font-semibold text-lg text-gray-800 mb-2">Asumsi Perhitungan</h4>
                        <table class="w-full text-sm">
                           <tbody class="align-top divide-y">
                               <tr>
                                   <td class="py-2 font-medium text-gray-600">Harga Jual / Sesi</td>
                                   <td class="py-2 text-right">${sierEditable.createEditableNumber(projectConfig.drivingRange.revenue.main_revenue.price_per_100_balls, 'drivingRange.revenue.main_revenue.price_per_100_balls', {format: 'currency'})}</td>
                               </tr>
                               <tr>
                                   <td class="py-2 font-medium text-gray-600" colspan="2">Biaya Variabel / Sesi (Bottom-Up)
                                    ${this._createVariableCostTable('drivingRange', bepData)}
                                   </td>
                               </tr>
                               <tr class="bg-gray-100">
                                   <td class="py-2 font-medium text-gray-600">Margin Kontribusi per Sesi</td>
                                   <td class="py-2 text-right font-bold text-lg text-green-600">Rp ${sierHelpers.formatNumber(Math.round(bepData.contributionMargin))}</td>
                               </tr>
                               <tr>
                                   <td class="py-2 font-medium text-gray-600">Total Biaya Tetap Bulanan</td>
                                   <td class="py-2 text-right font-bold">Rp ${sierHelpers.formatNumber(Math.round(bepData.totalFixedCostMonthly))}</td>
                               </tr>
                           </tbody>
                        </table>
                    </div>
                     <div>
                        <h4 class="font-semibold text-lg text-gray-800 mb-2">Hasil Kalkulasi BEP</h4>
                        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center h-full flex flex-col justify-center">
                            <p class="text-sm text-gray-600">${bepData.unitLabel} Minimum per Bulan</p>
                            <p class="text-4xl font-bold text-blue-700">~${sierHelpers.formatNumber(Math.ceil(bepData.bepInUnitsMonthly))}</p>
                            <p class="text-sm text-gray-600 mt-4">Target per Hari (Total)</p>
                            <p class="text-2xl font-bold text-blue-700">~${Math.ceil(bepData.bepInUnitsDaily)} ${bepData.unitLabel}</p>
                            <p class="text-sm text-gray-600 mt-1">(Rata-rata ~${bepData.bepPerAssetDaily.toFixed(1)} sesi per bay per hari)</p>
                        </div>
                    </div>
                </div>
                
                <h3 class="text-xl font-semibold mb-4 pt-6 border-t mt-8 text-gray-700">3. Strategi Akselerasi BEP dan Peningkatan Profitabilitas</h3>
                <!-- Konten statis -->
                <div class="space-y-4"> <div class="p-4 border rounded-lg hover:shadow-lg transition-shadow"> <h4 class="font-semibold text-gray-800">a. Program Keanggotaan & Paket Korporat</h4> <p class="text-sm text-gray-600 mt-1"><strong>Konsep:</strong> Membangun pendapatan berulang (recurring revenue) dan mengunci loyalitas pelanggan.</p> <ul class="text-sm mt-2 space-y-1"> <li><strong>Membership Bertingkat:</strong> Tawarkan paket (misal: Bulanan, Tahunan) dengan benefit jelas seperti harga bola lebih murah, prioritas booking bay premium, dan diskon F&B.</li> <li><strong>Paket Korporat:</strong> Targetkan perusahaan di kawasan SIER untuk entertainment klien atau employee benefit. Tawarkan paket bundling (sesi main + F&B). Ini sangat efektif untuk mengisi slot di hari kerja.</li> </ul> </div> <div class="p-4 border rounded-lg hover:shadow-lg transition-shadow"> <h4 class="font-semibold text-gray-800">b. Monetisasi Teknologi & Event</h4> <p class="text-sm text-gray-600 mt-1"><strong>Konsep:</strong> Mengubah bay premium berteknologi dari sekadar fasilitas menjadi sumber pendapatan aktif.</p> <ul class="text-sm mt-2 space-y-1"> <li><strong>Harga Premium:</strong> Terapkan harga sewa yang lebih tinggi untuk bay yang dilengkapi teknologi Ball Tracker (misal: harga per jam, bukan per bola).</li> <li><strong>Event & Kompetisi:</strong> Adakan kompetisi rutin berbasis teknologi seperti "Longest Drive" atau "Nearest to the Pin" dengan hadiah menarik. Ini akan menciptakan engagement dan pendapatan dari biaya pendaftaran.</li> </ul> </div> <div class="p-4 border rounded-lg hover:shadow-lg transition-shadow"> <h4 class="font-semibold text-gray-800">c. Kembangkan Akademi Golf & Program Pemula</h4> <p class="text-sm text-gray-600 mt-1"><strong>Konsep:</strong> Menciptakan pasar baru dan mengisi jam-jam sepi (off-peak hours).</p> <ul class="text-sm mt-2 space-y-1"> <li><strong>Paket "Learn to Golf":</strong> Tawarkan paket lengkap untuk pemula yang mencakup beberapa sesi latihan, sewa stik, dan bimbingan dasar dari pelatih.</li> <li><strong>Junior & Ladies' Academy:</strong> Buat program khusus untuk anak-anak (di akhir pekan) dan wanita (di pagi hari kerja) untuk menjangkau segmen pasar yang seringkali belum tergarap maksimal.</li> </ul> </div> </div>

            </div>
        `;
        container.innerHTML = html;
    },
    
    _renderPadel() {
        const container = document.getElementById('business-strategy-analysis');
        if (!container) return;
        const bepData = sierMath.calculateBEP('padel');
        const courts = projectConfig.padel.revenue.main_revenue.courts;

        const html = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-rose-600 pl-4">Analisis Bisnis & Strategi: Lapangan Padel</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <!-- ... Konten statis ... -->
                <h3 class="text-xl font-semibold mb-4 text-gray-700">1. Analisis Lanskap Kompetitor</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"> <div class="bg-gray-50 p-4 rounded-lg border"> <h4 class="font-semibold text-gray-800">a. Kehadiran & Kemudahan Online</h4> <ul class="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1"> <li><strong>Media Sosial (Instagram):</strong> Seberapa aktif mereka? Apakah mereka memposting konten menarik (turnamen, promo, tips bermain)? Ini adalah etalase utama mereka.</li> <li><strong>Platform Booking:</strong> Apakah pelanggan bisa memesan dan membayar secara online (misal via website, aplikasi seperti Ayo Indonesia, atau bahkan WhatsApp)? Proses yang rumit adalah penghalang besar.</li> <li><strong>Google Maps & Reviews:</strong> Apa kata pelanggan? Rating yang tinggi dan ulasan positif adalah bukti sosial yang kuat.</li> </ul> </div> <div class="bg-gray-50 p-4 rounded-lg border"> <h4 class="font-semibold text-gray-800">b. Jam Operasional & Harga</h4> <ul class="list-disc pl-5 mt-2 text-sm text-gray-600 space-y-1"> <li><strong>Jam Buka-Tutup:</strong> Umumnya kompetitor beroperasi dari pagi (06:00) hingga malam (24:00). Ini adalah standar industri saat ini.</li> <li><strong>Struktur Harga:</strong> Apakah harga flat sepanjang hari, atau mereka menggunakan *dynamic pricing* (lebih murah di jam sepi, lebih mahal di jam sibuk/weekend)?</li> <li><strong>Penawaran Tambahan:</strong> Apakah mereka menyediakan pelatih, penyewaan alat, atau fasilitas F&B yang menarik?</li> </ul> </div> </div>

                <h3 class="text-xl font-semibold mb-4 pt-6 border-t mt-8 text-gray-700">2. Model Break-Even Point (BEP) - Studi Kasus ${courts} Lapangan</h3>
                <p class="text-gray-600 mb-2">Model ini membantu menetapkan target operasional minimum (jam sewa terjual) untuk mencapai titik impas.</p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4">
                    <div>
                        <h4 class="font-semibold text-lg text-gray-800 mb-2">Asumsi Perhitungan</h4>
                        <table class="w-full text-sm">
                           <tbody class="align-top divide-y">
                               <tr>
                                   <td class="py-2 font-medium text-gray-600">Harga Sewa Rata-rata (Dihitung)</td>
                                   <td class="py-2 text-right font-bold">Rp ${sierHelpers.formatNumber(Math.round(bepData.pricePerUnit))} / jam</td>
                               </tr>
                               <tr>
                                   <td class="py-2 font-medium text-gray-600" colspan="2">Biaya Variabel / Jam (Bottom-Up)
                                    ${this._createVariableCostTable('padel', bepData)}
                                   </td>
                               </tr>
                               <tr class="bg-gray-100">
                                   <td class="py-2 font-medium text-gray-600">Margin Kontribusi per Jam</td>
                                   <td class="py-2 text-right font-bold text-lg text-green-600">Rp ${sierHelpers.formatNumber(Math.round(bepData.contributionMargin))}</td>
                               </tr>
                               <tr>
                                   <td class="py-2 font-medium text-gray-600">Total Biaya Tetap Bulanan</td>
                                   <td class.py-2 text-right font-bold">Rp ${sierHelpers.formatNumber(Math.round(bepData.totalFixedCostMonthly))}</td>
                               </tr>
                           </tbody>
                        </table>
                    </div>
                     <div>
                        <h4 class="font-semibold text-lg text-gray-800 mb-2">Hasil Kalkulasi BEP</h4>
                        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center h-full flex flex-col justify-center">
                            <p class="text-sm text-gray-600">${bepData.unitLabel} Minimum per Bulan</p>
                            <p class="text-4xl font-bold text-blue-700">~${sierHelpers.formatNumber(Math.ceil(bepData.bepInUnitsMonthly))}</p>
                            <p class="text-sm text-gray-600 mt-4">Target per Hari (untuk ${courts} Lapangan)</p>
                            <p class="text-2xl font-bold text-blue-700">~${Math.ceil(bepData.bepInUnitsDaily)} ${bepData.unitLabel}</p>
                            <p class="text-sm text-gray-600 mt-1">(Rata-rata ~${bepData.bepPerAssetDaily.toFixed(1)} jam per lapangan per hari)</p>
                        </div>
                    </div>
                </div>
                 
                <h3 class="text-xl font-semibold mb-4 pt-6 border-t mt-8 text-gray-700">3. Strategi Akselerasi BEP dan Peningkatan Profitabilitas</h3>
                <!-- Konten statis -->
                <div class="space-y-4"> <div class="p-4 border rounded-lg hover:shadow-lg transition-shadow"> <h4 class="font-semibold text-gray-800">a. Operasional 24 Jam: High-Risk, High-Reward</h4> <p class="text-sm text-gray-600 mt-1"><strong>Konsep:</strong> Menjadi satu-satunya lapangan padel 24 jam di area tersebut untuk menangkap pasar pekerja shift di kawasan industri SIER dan kaum "nokturnal".</p> <ul class="text-sm mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4"> <li class="flex items-start"><span class="text-green-500 mr-2">✓</span> <strong>Keunggulan:</strong> Diferensiasi pasar yang kuat, utilisasi aset maksimal, potensi pendapatan tambahan di jam subuh.</li> <li class="flex items-start"><span class="text-red-500 mr-2">✗</span> <strong>Kelemahan:</strong> Biaya operasional lebih tinggi (gaji shift malam, keamanan), permintaan mungkin sangat rendah antara jam 02:00-05:00.</li> </ul> <p class="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded"><strong>Rekomendasi:</strong> Uji coba dengan memperpanjang jam operasional hingga pukul 02:00 terlebih dahulu. Analisis data permintaan sebelum berkomitmen penuh ke 24 jam.</p> </div> <div class="p-4 border rounded-lg hover:shadow-lg transition-shadow"> <h4 class="font-semibold text-gray-800">b. Dynamic Pricing & Membership (Strategi Cerdas)</h4> <p class="text-sm text-gray-600 mt-1"><strong>Konsep:</strong> Mengoptimalkan pendapatan dari setiap jam yang tersedia dan membangun loyalitas pelanggan.</p> <ul class="text-sm mt-2 space-y-1"> <li><strong>Dynamic Pricing:</strong> Terapkan harga lebih murah untuk jam sepi (misal: 09:00-15:00 di hari kerja) untuk menarik mahasiswa atau pekerja fleksibel. Terapkan harga premium di jam sibuk.</li> <li><strong>Membership & Paket:</strong> Tawarkan paket bulanan/tahunan dengan benefit (prioritas booking, diskon F&B). Ini menciptakan arus kas yang stabil dan mengikat pelanggan.</li> </ul> </div> <div class="p-4 border rounded-lg hover:shadow-lg transition-shadow"> <h4 class="font-semibold text-gray-800">c. Fokus pada Komunitas & Kemitraan Korporat</h4> <p class="text-sm text-gray-600 mt-1"><strong>Konsep:</strong> Mengubah lapangan dari sekadar tempat sewa menjadi sebuah "hub" sosial dan B2B.</p> <ul class="text-sm mt-2 space-y-1"> <li><strong>Aktivasi Komunitas:</strong> Adakan turnamen rutin, liga internal, dan sesi coaching. Ini akan mengisi jadwal secara konsisten dan menciptakan word-of-mouth.</li> <li><strong>Kemitraan Korporat:</strong> Tawarkan paket khusus untuk perusahaan di SIER dan sekitarnya untuk acara *team building* atau jadwal rutin karyawan. Ini cara efektif untuk mengisi slot di hari kerja.</li> </ul> </div> </div>

            </div>
        `;
        container.innerHTML = html;
    },

    render() {
        this._renderDrivingRange();
        this._renderPadel();
    }
};

window.sierVisualStrategy = sierVisualStrategy;