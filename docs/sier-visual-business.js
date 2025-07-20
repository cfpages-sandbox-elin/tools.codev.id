// File: sier-visual-business.js
// Merender semua elemen visual untuk bagian Analisis Bisnis & Strategi.
// Fokus pada BEP, skenario, dan kelayakan finansial yang lebih detail.

const sierVisualBusiness = {

    /**
     * Helper untuk membuat tabel perbandingan skenario.
     * @param {string} unitName - Nama unit bisnis ('Driving Range' atau 'Padel').
     * @param {object} data - Data hasil kalkulasi dari sierMath.getDetailedFinancialScenarios.
     */
    _createScenarioTable(unitName, data) {
        if (!data || !data.scenarios) return '<p>Data skenario tidak tersedia.</p>';

        const scenarios = ['pessimistic', 'normal', 'optimistic'];
        const scenarioLabels = {
            pessimistic: 'Pesimis',
            normal: 'Normal (Target)',
            optimistic: 'Optimis'
        };

        const rows = scenarios.map(key => {
            const s = data.scenarios[key];
            if (!s) return '';
            return `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3 font-semibold ${key === 'normal' ? 'text-blue-700' : ''}">${scenarioLabels[key]}</td>
                    <td class="p-3 text-center">${(s.avg_occupancy_rate * 100).toFixed(1)}%</td>
                    <td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(s.annual_revenue / 1000000))} jt</td>
                    <td class="p-3 text-right font-mono text-green-700">${sierHelpers.formatNumber(Math.round(s.annual_ebitda / 1000000))} jt</td>
                    <td class="p-3 text-center font-bold text-lg ${s.payback_period_years < 5 ? 'text-green-600' : 'text-amber-600'}">
                        ${s.payback_period_years.toFixed(2)}
                        <span class="block text-xs font-normal text-gray-500">Tahun</span>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <h4 class="font-semibold text-lg text-gray-800 mb-2">Perbandingan Skenario Finansial (${unitName})</h4>
            <div class="overflow-x-auto border rounded-lg">
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 text-xs uppercase text-gray-600">
                        <tr>
                            <th class="p-2 text-left">Skenario</th>
                            <th class="p-2 text-center">Rata-rata Okupansi</th>
                            <th class="p-2 text-right">Pendapatan / Tahun</th>
                            <th class="p-2 text-right">EBITDA / Tahun</th>
                            <th class="p-2 text-center">Payback Period</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    },

    /**
     * Fungsi render utama untuk modul ini.
     */
    render() {
        const container = document.getElementById('business-strategy-analysis');
        if (!container) return;

        // Ambil data kalkulasi detail untuk kedua unit
        const drData = sierMath.getDetailedFinancialScenarios('drivingRange');
        const padelData = sierMath.getDetailedFinancialScenarios('padel');

        const drTable = this._createScenarioTable('Driving Range', drData);
        const padelTable = this._createScenarioTable('Padel', padelData);

        // Render HTML lengkap ke dalam kontainer
        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-rose-600 pl-4">Analisis Bisnis & Strategi Kelayakan</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-12">
                
                <!-- Analisis Driving Range -->
                <div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">1. Analisis Kelayakan: Driving Range</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h5 class="font-semibold text-gray-800">Kapasitas Operasional Maksimum</h5>
                            <p class="text-sm text-gray-600 mt-1">
                                Dengan <strong>${drData.max_capacity.total_bays} bay</strong> beroperasi <strong>${drData.max_capacity.op_hours} jam/hari</strong>, dan durasi sesi <strong>${drData.max_capacity.session_duration} menit</strong>, kapasitas maksimum adalah:
                            </p>
                            <p class="text-center text-3xl font-bold text-blue-800 mt-2">${sierHelpers.formatNumber(Math.round(drData.max_capacity.sessions_per_year))}</p>
                            <p class="text-center text-sm text-gray-500">Sesi per Tahun</p>
                        </div>
                        <div class="p-4 bg-gray-50 border rounded-lg">
                            <h5 class="font-semibold text-gray-800">Target Break-Even Point (BEP)</h5>
                            <p class="text-sm text-gray-600 mt-1">
                                Untuk menutup biaya operasional tahunan sebesar <strong>Rp ${sierHelpers.formatNumber(Math.round(drData.scenarios.normal.annual_opex/1000000))} jt</strong>, dibutuhkan penjualan sekitar:
                            </p>
                            <p class="text-center text-3xl font-bold text-gray-800 mt-2">${sierHelpers.formatNumber(Math.round(drData.scenarios.normal.bep_sessions_per_year))}</p>
                            <p class="text-center text-sm text-gray-500">Sesi per Tahun (~${(drData.scenarios.normal.bep_occupancy_rate * 100).toFixed(1)}% Okupansi)</p>
                        </div>
                    </div>
                    ${drTable}
                    <p class="mt-4 text-sm text-gray-600">
                        <strong>Interpretasi:</strong> Dalam skenario normal, proyek Driving Range diperkirakan akan mencapai pengembalian modal dalam <strong>${drData.scenarios.normal.payback_period_years.toFixed(2)} tahun</strong>. Angka ini cukup sensitif terhadap tingkat okupansi, di mana skenario pesimis memperpanjang waktu pengembalian secara signifikan. Kunci sukses adalah memaksimalkan okupansi di akhir pekan.
                    </p>
                </div>

                <!-- Analisis Padel -->
                <div>
                    <h3 class="text-xl font-semibold mb-4 pt-8 border-t text-gray-700">2. Analisis Kelayakan: Lapangan Padel</h3>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <h5 class="font-semibold text-gray-800">Kapasitas Operasional Maksimum</h5>
                            <p class="text-sm text-gray-600 mt-1">
                                Dengan <strong>${padelData.max_capacity.total_courts} lapangan</strong> beroperasi <strong>${padelData.max_capacity.op_hours} jam/hari</strong> dengan <strong>${padelData.max_capacity.downtime} menit</strong> downtime/jam, kapasitas sewa maksimum adalah:
                            </p>
                            <p class="text-center text-3xl font-bold text-purple-800 mt-2">${sierHelpers.formatNumber(Math.round(padelData.max_capacity.hours_per_year))}</p>
                            <p class="text-center text-sm text-gray-500">Jam Sewa per Tahun</p>
                        </div>
                        <div class="p-4 bg-gray-50 border rounded-lg">
                             <h5 class="font-semibold text-gray-800">Target Break-Even Point (BEP)</h5>
                            <p class="text-sm text-gray-600 mt-1">
                                Untuk menutup biaya operasional tahunan sebesar <strong>Rp ${sierHelpers.formatNumber(Math.round(padelData.scenarios.normal.annual_opex/1000000))} jt</strong>, dibutuhkan penjualan sekitar:
                            </p>
                            <p class="text-center text-3xl font-bold text-gray-800 mt-2">${sierHelpers.formatNumber(Math.round(padelData.scenarios.normal.bep_hours_per_year))}</p>
                            <p class="text-center text-sm text-gray-500">Jam Sewa per Tahun (~${(padelData.scenarios.normal.bep_occupancy_rate * 100).toFixed(1)}% Okupansi)</p>
                        </div>
                    </div>
                    ${padelTable}
                    <p class="mt-4 text-sm text-gray-600">
                        <strong>Interpretasi:</strong> Proyek Padel menunjukkan potensi pengembalian modal yang sangat cepat, bahkan dalam skenario pesimis, dengan payback period di bawah <strong>${Math.ceil(padelData.scenarios.pessimistic.payback_period_years)} tahun</strong>. Hal ini didorong oleh permintaan pasar yang tinggi dan margin kontribusi per jam sewa yang kuat. Strategi *dynamic pricing* akan menjadi kunci untuk memaksimalkan profitabilitas.
                    </p>
                </div>

            </div>
        `;
        console.log("[sier-visual-business] Analisis strategi bisnis telah dirender.");
    }
};

window.sierVisualBusiness = sierVisualBusiness;