// File: sier-visual-maintenance.js
// Merender tabel Rencana Pemeliharaan & Biaya Operasional.

const sierVisualMaintenance = {
    // Fungsi helper untuk mengambil nilai dari path string
    _getValueByPath(path) {
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : o, projectConfig);
    },

    render() {
        const container = document.getElementById('maintenance-plan-container');
        if (!container) return;

        const plan = projectConfig.maintenance_plan;
        let grandTotalMonthlyCost = 0;
        let tableBodyHtml = '';

        // Pre-calculate values needed for cost basis
        const totalBays = projectConfig.drivingRange.revenue.main_revenue.bays;
        const premiumBaysCount = Math.round(totalBays * projectConfig.drivingRange.capex_assumptions.equipment.premium_bays.percentage_of_total);
        const normalBaysCount = totalBays - premiumBaysCount;
        const ballTrackerCapex = premiumBaysCount * projectConfig.drivingRange.capex_assumptions.equipment.premium_bays.cost_per_bay_ball_tracker;
        const netCapex = (projectConfig.drivingRange.capex_assumptions.safety_net.field_width_m * projectConfig.drivingRange.capex_assumptions.safety_net.poles.height_distribution.far_side_m +
                       projectConfig.drivingRange.capex_assumptions.safety_net.field_length_m * projectConfig.drivingRange.capex_assumptions.safety_net.poles.height_distribution.left_right_side_m * 2) * 
                       projectConfig.drivingRange.capex_assumptions.safety_net.netting.cost_per_m2;

        const preCalculated = {
            normal_bays: normalBaysCount,
            ball_tracker_cost: ballTrackerCapex,
            netting_material_cost: netCapex
        };

        for (const categoryKey in plan) {
            const category = plan[categoryKey];
            tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="5" class="p-3 font-bold text-gray-800">${category.title}</td></tbody><tbody class="divide-y">`;

            category.items.forEach(item => {
                let costPerCycle = 0;
                const basis = item.cost_basis;

                if (basis.quantity_ref && basis.unit_cost_ref) {
                    costPerCycle = this._getValueByPath(basis.quantity_ref) * this._getValueByPath(basis.unit_cost_ref);
                } else if (basis.quantity_calc && basis.unit_cost) {
                    costPerCycle = preCalculated[basis.quantity_calc] * basis.unit_cost;
                } else if (basis.percentage_of_capex && basis.capex_ref) {
                    costPerCycle = preCalculated[basis.capex_ref] * basis.percentage_of_capex;
                } else if (basis.quantity_ref && basis.unit_cost) {
                    costPerCycle = this._getValueByPath(basis.quantity_ref) * basis.unit_cost;
                } else {
                    costPerCycle = basis.quantity * basis.unit_cost;
                }
                
                const monthlyCost = costPerCycle / item.lifespan_months;
                grandTotalMonthlyCost += monthlyCost;

                tableBodyHtml += `
                    <tr>
                        <td class="px-3 py-2">${item.name}<em class="block text-xs text-gray-400">${item.notes}</em></td>
                        <td class="px-3 py-2 text-center">${item.lifespan_months} bulan</td>
                        <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(costPerCycle))}</td>
                        <td class="px-3 py-2 text-right font-mono text-blue-600 font-semibold">${sierHelpers.formatNumber(Math.round(monthlyCost))}</td>
                    </tr>
                `;
            });

            tableBodyHtml += `</tbody>`;
        }
        
        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-orange-600 pl-4">Rencana & Estimasi Biaya Pemeliharaan (OpEx)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                 <p class="text-gray-600 mb-6">
                    Tabel ini merinci biaya operasional pemeliharaan rutin untuk menjaga kualitas aset. Perhitungan ini memecah pos 'Maintenance & Repair' menjadi komponen yang terukur berdasarkan masa pakai (lifespan) dan biaya penggantian/servis per siklus.
                </p>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-200 text-gray-700 uppercase text-xs">
                            <tr>
                                <th class="p-3 text-left w-2/5">Item Pemeliharaan</th>
                                <th class="p-3 text-center w-[15%]">Frekuensi</th>
                                <th class="p-3 text-right w-1/4">Biaya per Siklus (Rp)</th>
                                <th class="p-3 text-right w-1/4">Estimasi Biaya per Bulan (Rp)</th>
                            </tr>
                        </thead>
                        ${tableBodyHtml}
                        <tfoot>
                            <tr class="bg-orange-600 text-white font-bold text-base">
                                <td class="p-4" colspan="3">Total Estimasi Biaya Pemeliharaan per Bulan</td>
                                <td class="p-4 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotalMonthlyCost))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        console.log("[sier-visual-maintenance] Rencana Pemeliharaan: Berhasil dirender.");
    }
};

window.sierVisualMaintenance = sierVisualMaintenance;