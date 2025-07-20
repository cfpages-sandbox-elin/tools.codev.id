// File: sier-visual-digital.js
// Merender konten untuk bagian Analisis Spesifikasi Teknologi Digital.

const sierVisualDigital = {
    render() {
        const container = document.getElementById('digital-tech-analysis-container');
        if (!container) return; // Keluar jika kontainer tidak ditemukan di HTML

        const systems = projectConfig.digital_systems;
        const drEquipment = projectConfig.drivingRange.capex_assumptions.equipment;
        const totalBays = projectConfig.drivingRange.revenue.main_revenue.bays;
        const premiumBaysCount = Math.round(totalBays * drEquipment.premium_bays.percentage_of_total);
        const ballTrackerCost = premiumBaysCount * drEquipment.premium_bays.cost_per_bay_ball_tracker;

        const tableRows = `
            <tr>
                <td class="p-3 font-semibold align-top">Sistem Booking Online</td>
                <td class="p-3 align-top">${systems.booking_system.description}<br><em class="text-xs text-gray-500">Contoh: ${systems.booking_system.vendor_examples}</em></td>
                <td class="p-3 text-right align-top font-mono">${sierHelpers.formatNumber(systems.booking_system.estimated_cost)}</td>
            </tr>
            <tr>
                <td class="p-3 font-semibold align-top">Sistem Kasir (POS)</td>
                <td class="p-3 align-top">${systems.pos_system.description}<br><em class="text-xs text-gray-500">Contoh: ${systems.pos_system.vendor_examples}</em></td>
                <td class="p-3 text-right align-top font-mono">${sierHelpers.formatNumber(systems.pos_system.estimated_cost)}</td>
            </tr>
            <tr>
                <td class="p-3 font-semibold align-top">Teknologi Ball Tracker</td>
                <td class="p-3 align-top">Sistem pelacak bola untuk ${premiumBaysCount} Bay Premium.<br><em class="text-xs text-gray-500">Data diambil dari perhitungan CapEx Driving Range.</em></td>
                <td class="p-3 text-right align-top font-mono">${sierHelpers.formatNumber(ballTrackerCost)}</td>
            </tr>
            <tr>
                <td class="p-3 font-semibold align-top">Jaringan Internet & WiFi</td>
                <td class="p-3 align-top">${systems.wifi_network.description}<br><em class="text-xs text-gray-500">Contoh: ${systems.wifi_network.vendor_examples}</em></td>
                <td class="p-3 text-right align-top font-mono">${sierHelpers.formatNumber(systems.wifi_network.estimated_cost)}</td>
            </tr>
             <tr>
                <td class="p-3 font-semibold align-top">Sistem Keamanan CCTV</td>
                <td class="p-3 align-top">${systems.cctv_security.description}<br><em class="text-xs text-gray-500">Contoh: ${systems.cctv_security.vendor_examples}</em></td>
                <td class="p-3 text-right align-top font-mono">${sierHelpers.formatNumber(systems.cctv_security.estimated_cost)}</td>
            </tr>
        `;

        const totalCost = systems.booking_system.estimated_cost +
                          systems.pos_system.estimated_cost +
                          ballTrackerCost +
                          systems.wifi_network.estimated_cost +
                          systems.cctv_security.estimated_cost;

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-cyan-600 pl-4">Analisis Spesifikasi Teknologi Digital</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <p class="text-gray-600 mb-6">
                    Tabel ini merinci komponen teknologi utama yang dibutuhkan untuk mendukung operasional modern dan memberikan pengalaman pelanggan yang unggul. Biaya ini merupakan bagian dari total investasi (CapEx).
                </p>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="p-3 text-left w-1/4">Sistem</th>
                                <th class="p-3 text-left w-1/2">Deskripsi & Fitur Kunci</th>
                                <th class="p-3 text-right w-1/4">Estimasi Biaya (Rp)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${tableRows}
                        </tbody>
                        <tfoot>
                            <tr class="bg-gray-200 font-bold text-base">
                                <td class="p-3" colspan="2">Total Estimasi Biaya Teknologi Digital</td>
                                <td class="p-3 text-right font-mono">${sierHelpers.formatNumber(totalCost)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        console.log("[sier-visual-digital] Analisis Teknologi Digital: Berhasil dirender.");
    }
};

window.sierVisualDigital = sierVisualDigital;