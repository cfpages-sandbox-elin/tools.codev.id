// File: sier-visual-strategy.js
// VERSI FINAL: Merender Analisis Strategis Komprehensif (BEP, Payback, Skenario).

const sierVisualStrategy = {

    _createBEPSection(unitName, analysisData) {
        const { bepAnalysis } = analysisData;
        const assets = (unitName === 'drivingRange') 
            ? projectConfig.drivingRange.revenue.main_revenue.bays 
            : projectConfig.padel.revenue.main_revenue.courts;
        const assetLabel = (unitName === 'drivingRange') ? 'Bay' : 'Lapangan';
        
        return `
            <div class="bg-gray-50 p-4 rounded-lg border">
                <h4 class="font-semibold text-gray-800 mb-2">A. Analisis Titik Impas Operasional (BEP)</h4>
                <p class="text-sm text-gray-600 mb-3">Ini adalah target penjualan **minimum** agar tidak rugi secara operasional (laba = 0). Ini **tidak** termasuk pengembalian investasi awal.</p>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <!-- Rincian Biaya -->
                    <div>
                        <table class="w-full text-sm">
                            <tbody class="divide-y">
                                ${Object.entries(bepAnalysis.fixedCostBreakdown).map(([key, value]) => `
                                    <tr><td class="py-1 text-gray-600">${key}</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(value))}</td></tr>
                                `).join('')}
                            </tbody>
                            <tfoot class="border-t-2"><tr class="font-bold"><td class="py-1">Total Biaya Tetap Bulanan</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(bepAnalysis.totalFixedCostMonthly))}</td></tr></tfoot>
                        </table>
                    </div>
                    <!-- Target BEP -->
                    <div class="bg-white p-3 rounded-md shadow-sm text-center flex flex-col justify-center">
                        <p class="text-sm font-semibold text-gray-700">Target BEP Bulanan</p>
                        <p class="text-4xl font-bold text-blue-700 mt-1">${sierHelpers.formatNumber(Math.ceil(bepAnalysis.bepInUnitsMonthly))}</p>
                        <p class="text-sm text-gray-500">${bepAnalysis.unitLabel}</p>
                        <p class="text-xs text-gray-500 mt-2">(Rata-rata ~${Math.ceil(bepAnalysis.bepInUnitsDaily)} ${bepAnalysis.unitLabel} / hari)</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    _createProfitabilitySection(unitName, analysisData) {
        const { profitabilityAnalysis } = analysisData;
        return `
            <div class="bg-gray-50 p-4 rounded-lg border">
                <h4 class="font-semibold text-gray-800 mb-2">B. Analisis Profitabilitas & Target Balik Modal (Payback)</h4>
                <p class="text-sm text-gray-600 mb-3">Untuk bisa balik modal, bisnis harus beroperasi **di atas BEP** untuk menghasilkan laba. Berikut adalah proyeksi berdasarkan asumsi okupansi saat ini.</p>
                <table class="w-full text-sm">
                    <tbody class="divide-y">
                        <tr><td class="py-2 text-gray-600">Total Investasi Awal (CapEx)</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.totalCapex))}</td></tr>
                        <tr><td class="py-2 text-gray-600">Proyeksi Pendapatan Tahunan</td><td class="py-2 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.annualRevenue))}</td></tr>
                        <tr class="text-green-700"><td class="py-2 font-semibold">Proyeksi Laba Bersih Tahunan</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.annualNetProfit))}</td></tr>
                        <tr class="text-green-700"><td class="py-2 font-semibold">Proyeksi Arus Kas Bersih Tahunan</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.annualCashFlow))}</td></tr>
                    </tbody>
                    <tfoot class="border-t-2">
                        <tr class="font-bold text-lg text-green-600">
                            <td class="py-2">Estimasi Waktu Balik Modal</td>
                            <td class="py-2 text-right font-mono">${profitabilityAnalysis.paybackPeriod.toFixed(2)} Tahun</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    },

    _createScenarioSection(unitName, analysisData) {
        const { scenarioAnalysis } = analysisData;
        const mods = projectConfig.assumptions.scenario_modifiers;

        const formatPayback = (years) => years === Infinity ? '> 15 Thn' : `${years.toFixed(2)} Thn`;

        return `
            <div class="bg-gray-50 p-4 rounded-lg border">
                <h4 class="font-semibold text-gray-800 mb-2">C. Analisis Skenario</h4>
                <p class="text-sm text-gray-600 mb-3">Mengukur dampak perubahan pendapatan terhadap profitabilitas dan waktu balik modal.</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <!-- Pesimis -->
                    <div class="bg-red-50 p-3 rounded-md border border-red-200 text-center">
                        <p class="font-bold text-red-800">Pesimis</p>
                        <p class="text-xs text-red-600">(${(mods.pessimistic_revenue * 100 - 100).toFixed(0)}% Revenue)</p>
                        <hr class="my-2">
                        <p class="text-sm text-gray-600">Laba Bersih/Thn</p>
                        <p class="font-semibold text-lg ${scenarioAnalysis.pessimistic.netProfit < 0 ? 'text-red-600' : 'text-gray-800'}">Rp ${sierHelpers.formatNumber(Math.round(scenarioAnalysis.pessimistic.netProfit))}</p>
                        <p class="text-sm text-gray-600 mt-2">Balik Modal</p>
                        <p class="font-semibold text-lg text-red-600">${formatPayback(scenarioAnalysis.pessimistic.payback)}</p>
                    </div>
                    <!-- Realistis -->
                    <div class="bg-blue-50 p-3 rounded-md border border-blue-200 text-center ring-2 ring-blue-500">
                        <p class="font-bold text-blue-800">Realisitis (Basis)</p>
                        <p class="text-xs text-blue-600">(Target Awal)</p>
                        <hr class="my-2">
                        <p class="text-sm text-gray-600">Laba Bersih/Thn</p>
                        <p class="font-semibold text-lg text-gray-800">Rp ${sierHelpers.formatNumber(Math.round(scenarioAnalysis.realistic.netProfit))}</p>
                        <p class="text-sm text-gray-600 mt-2">Balik Modal</p>
                        <p class="font-semibold text-lg text-blue-600">${formatPayback(scenarioAnalysis.realistic.payback)}</p>
                    </div>
                    <!-- Optimis -->
                    <div class="bg-green-50 p-3 rounded-md border border-green-200 text-center">
                        <p class="font-bold text-green-800">Optimis</p>
                        <p class="text-xs text-green-600">(+${(mods.optimistic_revenue * 100 - 100).toFixed(0)}% Revenue)</p>
                        <hr class="my-2">
                        <p class="text-sm text-gray-600">Laba Bersih/Thn</p>
                        <p class="font-semibold text-lg text-gray-800">Rp ${sierHelpers.formatNumber(Math.round(scenarioAnalysis.optimistic.netProfit))}</p>
                        <p class="text-sm text-gray-600 mt-2">Balik Modal</p>
                        <p class="font-semibold text-lg text-green-600">${formatPayback(scenarioAnalysis.optimistic.payback)}</p>
                    </div>
                </div>
            </div>
        `;
    },

    _renderUnitStrategy(unitName, containerId, title) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const analysisData = sierMath.getStrategicAnalysis(unitName);

        const bepSection = this._createBEPSection(unitName, analysisData);
        const profitabilitySection = this._createProfitabilitySection(unitName, analysisData);
        const scenarioSection = this._createScenarioSection(unitName, analysisData);

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-rose-600 pl-4">${title}</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <div class="space-y-8">
                    ${bepSection}
                    ${profitabilitySection}
                    ${scenarioSection}
                </div>
            </div>
        `;
    },

    render() {
        this._renderUnitStrategy('drivingRange', 'driving-range-business-strategy', 'Analisis Bisnis & Strategi: Driving Range');
        this._renderUnitStrategy('padel', 'business-strategy-analysis', 'Analisis Bisnis & Strategi: Lapangan Padel');
    }
};

window.sierVisualStrategy = sierVisualStrategy;