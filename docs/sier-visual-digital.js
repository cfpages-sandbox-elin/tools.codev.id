// File: sier-visual-digital.js
// Merender konten untuk bagian Analisis Spesifikasi Teknologi Digital secara detail.

const sierVisualDigital = {
    render() {
        const container = document.getElementById('digital-tech-analysis-container');
        if (!container) return;

        const systems = projectConfig.digital_capex;
        let grandTotal = 0;
        let tableBodyHtml = '';

        // --- Tambahkan Data Ball Tracker Secara Dinamis ---
        const drEquipment = projectConfig.drivingRange.capex_assumptions.equipment;
        const totalBays = projectConfig.drivingRange.revenue.main_revenue.bays;
        const premiumBaysCount = Math.round(totalBays * drEquipment.premium_bays.percentage_of_total);
        systems.ball_tracker = {
            title: "Teknologi Ball Tracker",
            notes: "Hanya untuk Bay Premium di Driving Range.",
            items: [
                { name: "Sistem Pelacak Bola per Bay", quantity: premiumBaysCount, unit_cost: drEquipment.premium_bays.cost_per_bay_ball_tracker, brand_example: "Toptracer / InRange" }
            ]
        };

        // --- Loop Melalui Setiap Sistem untuk Membuat Tabel ---
        for (const systemKey in systems) {
            const system = systems[systemKey];
            let systemSubtotal = 0;
            
            // Baris header untuk sistem
            tableBodyHtml += `
                <tbody class="bg-gray-50">
                    <tr>
                        <td colspan="5" class="p-3 font-bold text-gray-800">${system.title}</td>
                    </tr>
                    <tr>
                        <td colspan="5" class="pt-0 px-3 pb-2 text-xs text-gray-500 italic">${system.notes}</td>
                    </tr>
                </tbody>
                <tbody class="divide-y">
            `;

            // Loop melalui setiap item dalam sistem
            system.items.forEach(item => {
                const subtotal = item.quantity * item.unit_cost;
                systemSubtotal += subtotal;
                tableBodyHtml += `
                    <tr>
                        <td class="px-3 py-2">${item.name} <em class="block text-xs text-gray-400">(${item.brand_example})</em></td>
                        <td class="px-3 py-2 text-center">${item.quantity}</td>
                        <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(item.unit_cost)}</td>
                        <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(subtotal)}</td>
                    </tr>
                `;
            });
            
            // Baris subtotal untuk sistem
            tableBodyHtml += `
                <tr class="bg-gray-100 font-semibold">
                    <td colspan="3" class="px-3 py-2 text-right">Subtotal untuk ${system.title}</td>
                    <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(systemSubtotal)}</td>
                </tr>
            </tbody>
            `;
            grandTotal += systemSubtotal;
        }

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-cyan-600 pl-4">Analisis Rinci Biaya Teknologi Digital (CapEx)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <p class="text-gray-600 mb-6">
                    Tabel ini merinci estimasi biaya modal untuk setiap komponen teknologi. Perhitungan ini menggunakan pendekatan bottom-up (kuantitas x harga satuan) untuk transparansi dan kemudahan penyesuaian.
                </p>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-200 text-gray-700 uppercase text-xs">
                            <tr>
                                <th class="p-3 text-left w-2/5">Komponen / Item</th>
                                <th class="p-3 text-center w-[15%]">Kuantitas</th>
                                <th class="p-3 text-right w-1/4">Harga Satuan (Rp)</th>
                                <th class="p-3 text-right w-1/4">Subtotal Biaya (Rp)</th>
                            </tr>
                        </thead>
                        ${tableBodyHtml}
                        <tfoot>
                            <tr class="bg-cyan-600 text-white font-bold text-base">
                                <td class="p-4" colspan="3">Total Estimasi Biaya Modal Teknologi Digital</td>
                                <td class="p-4 text-right font-mono">${sierHelpers.formatNumber(grandTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        console.log("[sier-visual-digital] Analisis Rinci Teknologi Digital: Berhasil dirender.");
    }
};

window.sierVisualDigital = sierVisualDigital;