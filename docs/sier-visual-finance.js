// File: sier-visual-finance.js
// VERSI FINAL - DENGAN RINCIAN REVENUE & PERBAIKAN LAYOUT

const sierVisualFinance = {
    _renderAssumptionsVisuals() {
        const container = document.getElementById('assumptions-container');
        if (!container) return;
        const { assumptions: globalAssumptions, drivingRange, padel } = projectConfig;

        const createTableRows = (data, basePath) => {
            return Object.entries(data).map(([key, value]) => {
                if (key === 'capex' || key === 'capex_assumptions') return '';
                const currentPath = `${basePath}.${key}`;
                const translatedKey = sierTranslate.translate(key);

                if (typeof value !== 'object' || value === null || ('count' in value && 'salary' in value) || ('electricity_kwh_price' in value)) {
                    let editControl;
                    if (typeof value === 'object' && value !== null) {
                        editControl = Object.entries(value).map(([subKey, subVal]) => {
                           const translatedSubKey = sierTranslate.translate(subKey);
                           return `<span class="font-medium">${translatedSubKey}:</span> ${sierHelpers.formatNumber(subVal)}`;
                        }).join(', ');
                    } else {
                        const isPercent = (key.includes('rate') || key.includes('okupansi')) && value < 2 && value > 0;
                        editControl = sierEditable.createEditableNumber(value, currentPath, { format: isPercent ? 'percent' : '' });
                    }
                    return `<tr class="border-b border-gray-200 hover:bg-gray-50"><td class="py-3 px-4 text-gray-600 w-1/5">${translatedKey}</td><td class="py-3 px-4 w-4/5">${editControl}</td></tr>`;
                } else {
                    let subRows = createTableRows(value, currentPath);
                    return `<tr class="border-b border-gray-200"><td class="py-3 px-4 text-gray-600 w-1/5 align-top font-medium">${translatedKey}</td><td class="py-3 px-4 w-4/5"><table class="w-full">${subRows}</table></td></tr>`;
                }
            }).join('');
        };

        const createBusinessModelSection = (title, data, basePath, theme) => {
            let bgColor;
            switch(theme) {
                case 'blue': bgColor = 'bg-blue-600'; break;
                case 'purple': bgColor = 'bg-purple-600'; break;
                default: bgColor = 'bg-gray-700'; break;
            }
            return `<div class="bg-white rounded-lg shadow-md overflow-hidden"><h3 class="text-xl font-bold text-white ${bgColor} p-4">${title}</h3><div class="p-4"><table class="w-full text-sm"><tbody class="divide-y divide-gray-200">${createTableRows(data, basePath)}</tbody></table></div></div>`;
        };
        
        container.innerHTML = `<div class="space-y-12">${createBusinessModelSection('A. Asumsi Global', globalAssumptions, 'assumptions', 'gray')}${createBusinessModelSection('B. Model Bisnis Driving Range', drivingRange, 'drivingRange', 'blue')}${createBusinessModelSection('C. Model Bisnis Padel', padel, 'padel', 'purple')}</div>`;
    },

    _renderCapexVisuals() {
        const container = document.getElementById('driving-range-capex-analysis');
        if (!container) return;
        const results = sierMath._calculateDrCapex();
        const { scenario_a, scenario_b } = results;
        const createRow = (label, calculation, value, path = '') => {
             let displayCalc = calculation;
            let editControl = '';
            if (path) {
                const rawValue = sierMath.getValueByPath(projectConfig, path);
                const isRate = path.includes('_rate');
                const displayValue = isRate ? `${(rawValue * 100).toFixed(1)}%` : sierHelpers.formatNumber(rawValue);
                displayCalc = calculation.replace('...', `<span class="value-display font-semibold text-gray-700">${displayValue}</span>`);
                editControl = `<div class="relative inline-flex items-center gap-x-2 group ml-2"><a href="#" class="edit-icon text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"/></svg></a><input type="number" step="any" value="${rawValue}" data-path="${path}" class="value-input hidden absolute top-1/2 -translate-y-1/2 left-0 w-full p-1 border rounded shadow-lg"></div>`;
            }
            return `<tr class="group"><td class="p-3">${label}</td><td class="p-3 text-gray-500 text-xs flex items-center">${displayCalc}${editControl}</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(value))}</td></tr>`;
        };
        const scenarioTableHtml = (title, data) => {
            const contingencyRate = projectConfig.assumptions.contingency_rate * 100;
            return `<div class="mb-10"><h3 class="text-2xl font-bold text-gray-800 mb-4">${title}</h3><p class="text-gray-600 mb-6">${data.description}</p><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100"><tr><th class="p-3 text-left w-1/5">Komponen</th><th class="p-3 text-left w-1/5">Asumsi</th><th class="p-3 text-right w-1/5">Biaya (Rp)</th></tr></thead><tbody class="divide-y">${data.htmlRows.map(r => createRow(r.label, r.calculation, r.value, r.path)).join('')}<tr class="bg-gray-200 font-bold"><td class="p-3" colspan="2">Subtotal Biaya Fisik & Lainnya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.subtotal))}</td></tr><tr class="bg-yellow-200 font-bold"><td class="p-3" colspan="2">Kontingensi (${contingencyRate}%)</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.contingency))}</td></tr><tr class="bg-amber-400 text-white font-bold text-lg"><td class="p-3" colspan="2">Total Estimasi Biaya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.total))}</td></tr></tbody></table></div></div>`;
        };
        container.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-amber-500 pl-4">Analisis Estimasi Biaya Investasi (CapEx): Driving Range</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8">${scenarioTableHtml('Skenario A: Konstruksi dengan Reklamasi', scenario_a)}${scenarioTableHtml('Skenario B: Konstruksi Apung dengan Pondasi Pancang', scenario_b)}</div>`;
    },

    // --- BARU: FUNGSI UNTUK MERENDER TABEL RINCIAN PENDAPATAN ---
    _createRevenueBreakdownSection(unitName, revenueData) {
        if (!revenueData || !revenueData.rows) return '';
        const formatRp = (num) => sierHelpers.formatNumber(Math.round(num));

        const tableRows = revenueData.rows.map(row => `
            <tr class="hover:bg-gray-50">
                <td class="p-2">${row.item}</td>
                <td class="p-2 text-xs text-gray-500">${row.calc}</td>
                <td class="p-2 text-right font-mono">${formatRp(row.perDay)}</td>
                <td class="p-2 text-right font-mono">${formatRp(row.perMonth)}</td>
                <td class="p-2 text-right font-mono">${formatRp(row.perMonth * 12)}</td>
            </tr>
        `).join('');

        return `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Rincian Pendapatan</h3>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-100 text-xs uppercase">
                            <tr>
                                <th class="p-2 text-left">Sumber Pendapatan</th>
                                <th class="p-2 text-left">Detail Perhitungan</th>
                                <th class="p-2 text-right">Per Hari (Avg)</th>
                                <th class="p-2 text-right">Per Bulan</th>
                                <th class="p-2 text-right">Per Tahun</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${tableRows}
                        </tbody>
                        <tfoot class="bg-gray-200 font-bold">
                            <tr>
                                <td class="p-2" colspan="2">Total Estimasi Pendapatan</td>
                                <td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly / 30)}</td>
                                <td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly)}</td>
                                <td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly * 12)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    },

    _createBEPSection(analysisData) { /* ... (fungsi ini tidak berubah, tetap sama) ... */ return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">A. Analisis Titik Impas Operasional (BEP)</h4><p class="text-sm text-gray-600 mb-3">Target penjualan minimum agar tidak rugi secara operasional (laba = 0).</p><div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div><table class="w-full text-sm"><tbody class="divide-y">${Object.entries(analysisData.bepAnalysis.fixedCostBreakdown).map(([key, value]) => `<tr><td class="py-1 text-gray-600">${key}</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(value))}</td></tr>`).join('')}</tbody><tfoot class="border-t-2"><tr class="font-bold"><td class="py-1">Total Biaya Tetap Bulanan</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(analysisData.bepAnalysis.totalFixedCostMonthly))}</td></tr></tfoot></table></div><div class="bg-white p-3 rounded-md shadow-sm text-center flex flex-col justify-center"><p class="text-sm font-semibold text-gray-700">Target BEP Bulanan</p><p class="text-4xl font-bold text-blue-700 mt-1">${sierHelpers.formatNumber(Math.ceil(analysisData.bepAnalysis.bepInUnitsMonthly))}</p><p class="text-sm text-gray-500">${analysisData.bepAnalysis.unitLabel}</p><p class="text-xs text-gray-500 mt-2">(~${Math.ceil(analysisData.bepAnalysis.bepInUnitsDaily)} ${analysisData.bepAnalysis.unitLabel} / hari)</p></div></div></div>`; },
    _createProfitabilitySection(analysisData) { /* ... (fungsi ini tidak berubah, tetap sama) ... */ return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">B. Analisis Profitabilitas & Target Balik Modal (Payback)</h4><p class="text-sm text-gray-600 mb-3">Proyeksi profitabilitas berdasarkan asumsi okupansi saat ini untuk mengukur waktu balik modal.</p><table class="w-full text-sm"><tbody class="divide-y"><tr><td class="py-2 text-gray-600">Total Investasi Awal (CapEx)</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(analysisData.profitabilityAnalysis.totalCapex))}</td></tr><tr><td class="py-2 text-gray-600">Proyeksi Pendapatan Tahunan</td><td class="py-2 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(analysisData.profitabilityAnalysis.annualRevenue))}</td></tr><tr class="text-green-700"><td class="py-2 font-semibold">Proyeksi Laba Bersih Tahunan</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(analysisData.profitabilityAnalysis.annualNetProfit))}</td></tr><tr class="text-green-700"><td class="py-2 font-semibold">Proyeksi Arus Kas Bersih Tahunan</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(analysisData.profitabilityAnalysis.annualCashFlow))}</td></tr></tbody><tfoot class="border-t-2"><tr class="font-bold text-lg text-green-600"><td class="py-2">Estimasi Waktu Balik Modal</td><td class="py-2 text-right font-mono">${analysisData.profitabilityAnalysis.paybackPeriod.toFixed(2)} Tahun</td></tr></tfoot></table></div>`; },
    _createScenarioSection(analysisData) { /* ... (fungsi ini tidak berubah, tetap sama) ... */ const mods = projectConfig.assumptions.scenario_modifiers; const formatPayback = (years) => years === Infinity ? '> 15 Thn' : `${years.toFixed(2)} Thn`; return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">C. Analisis Skenario</h4><p class="text-sm text-gray-600 mb-3">Mengukur dampak perubahan pendapatan terhadap profitabilitas dan waktu balik modal.</p><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"><div class="bg-red-50 p-3 rounded-md border border-red-200 text-center"><p class="font-bold text-red-800">Pesimis</p><p class="text-xs text-red-600">(${(mods.pessimistic_revenue * 100 - 100).toFixed(0)}% Revenue)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg ${analysisData.scenarioAnalysis.pessimistic.netProfit < 0 ? 'text-red-600' : 'text-gray-800'}">Rp ${sierHelpers.formatNumber(Math.round(analysisData.scenarioAnalysis.pessimistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-red-600">${formatPayback(analysisData.scenarioAnalysis.pessimistic.payback)}</p></div><div class="bg-blue-50 p-3 rounded-md border border-blue-200 text-center ring-2 ring-blue-500"><p class="font-bold text-blue-800">Realisitis (Basis)</p><p class="text-xs text-blue-600">(Target Awal)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg text-gray-800">Rp ${sierHelpers.formatNumber(Math.round(analysisData.scenarioAnalysis.realistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-blue-600">${formatPayback(analysisData.scenarioAnalysis.realistic.payback)}</p></div><div class="bg-green-50 p-3 rounded-md border border-green-200 text-center"><p class="font-bold text-green-800">Optimis</p><p class="text-xs text-green-600">(+${(mods.optimistic_revenue * 100 - 100).toFixed(0)}% Revenue)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg text-gray-800">Rp ${sierHelpers.formatNumber(Math.round(analysisData.scenarioAnalysis.optimistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-green-600">${formatPayback(analysisData.scenarioAnalysis.optimistic.payback)}</p></div></div></div>`; },

    _renderFinancialSummaryVisuals() {
        const drContainer = document.getElementById('driving-range-financial-analysis');
        const padelContainer = document.getElementById('padel-financial-analysis');
        const summaryContainer = document.getElementById('financial-analysis-summary');
        if (!drContainer || !padelContainer || !summaryContainer) return;

        const summary = sierMath.getFinancialSummary();
        const { drivingRange: dr, padel, combined } = summary;

        const drAnalysisData = sierMath.getStrategicAnalysis('drivingRange');
        const padelAnalysisData = sierMath.getStrategicAnalysis('padel');
        
        // BARU: Panggil fungsi kalkulasi rincian revenue
        const drRevenueData = sierMath._getDetailedRevenueBreakdown('drivingRange');
        const padelRevenueData = sierMath._getDetailedRevenueBreakdown('padel');

        const createPnlTable = (data) => `<div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-50"><tr class="text-left"><th class="px-4 py-2 w-4/5">Deskripsi</th><th class="px-4 py-2 text-right">Nilai (Tahun Pertama)</th></tr></thead><tbody class="divide-y"><tr><td class="px-4 py-2">Pendapatan (Revenue)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.pnl.annualRevenue))}</td></tr><tr><td class="px-4 py-2">Harga Pokok Penjualan (COGS)</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(data.pnl.annualCogs))})</td></tr><tr class="font-semibold"><td class="px-4 py-2">Laba Kotor (Gross Profit)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.pnl.grossProfit))}</td></tr><tr><td class="px-4 py-2">Biaya Operasional (OpEx)</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(data.pnl.annualOpex))})</td></tr><tr class="font-semibold"><td class="px-4 py-2">EBITDA</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.pnl.ebitda))}</td></tr><tr><td class="px-4 py-2">Depresiasi & Amortisasi</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(data.pnl.annualDepreciation))})</td></tr><tr class="font-semibold"><td class="px-4 py-2">Laba Sebelum Pajak (EBT)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.pnl.ebt))}</td></tr><tr><td class="px-4 py-2">Pajak Penghasilan</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(data.pnl.tax))})</td></tr><tr class="bg-teal-100 font-bold text-teal-800"><td class="px-4 py-3 text-base">Laba Bersih (Net Profit)</td><td class="px-4 py-3 text-right text-base font-mono">${sierHelpers.formatNumber(Math.round(data.pnl.netProfit))}</td></tr></tbody></table></div>`;

        // Render setiap bagian Driving Range dengan rincian revenue
        drContainer.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-amber-500 pl-4">Analisis Finansial Detail: Driving Range</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-8">${this._createRevenueBreakdownSection('drivingRange', drRevenueData)}<h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Laba Rugi (P&L)</h3>${createPnlTable(dr)}${this._createBEPSection(drAnalysisData)}${this._createProfitabilitySection(drAnalysisData)}${this._createScenarioSection(drAnalysisData)}</div>`;
        
        // Render setiap bagian Padel dengan rincian revenue
        padelContainer.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Analisis Finansial Detail: Padel</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-8">${this._createRevenueBreakdownSection('padel', padelRevenueData)}<h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Laba Rugi (P&L)</h3>${createPnlTable(padel)}${this._createBEPSection(padelAnalysisData)}${this._createProfitabilitySection(padelAnalysisData)}${this._createScenarioSection(padelAnalysisData)}</div>`;
        
        // Render bagian Gabungan (Combined)
        summaryContainer.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-teal-600 pl-4">Analisis Keuangan & Kelayakan Investasi (Proyek Gabungan)</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8"><div class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-3 text-gray-800">Ringkasan Biaya Investasi (CapEx)</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Driving Range</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(dr.capex.total)}</p></div><div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Padel</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(padel.capex.total)}</p></div><div class="bg-teal-600 text-white p-4 rounded-lg text-center"><p class="text-sm">Total Investasi Proyek</p><p class="text-2xl font-bold font-mono">${sierHelpers.toBillion(combined.capex.total)}</p></div></div></div><h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Laba Rugi (P&L) - Gabungan</h3>${createPnlTable(combined)}<div id="investment-feasibility" class="mt-8 pt-6 border-t"><h3 class="text-xl font-semibold mb-4 text-gray-800">Analisis Kelayakan Investasi (Proyek Gabungan)</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="bg-blue-100 p-4 rounded-lg text-center"><p class="text-sm text-blue-800">Payback Period</p><p class="text-3xl font-bold text-blue-700">${combined.feasibility.paybackPeriod.toFixed(2)}</p><p class="text-xs text-blue-600">Tahun</p></div><div class="bg-green-100 p-4 rounded-lg text-center"><p class="text-sm text-green-800">Net Present Value (NPV)</p><p class="text-3xl font-bold text-green-700">${sierHelpers.toBillion(combined.feasibility.npv)}</p><p class="text-xs text-green-600">(WACC ${projectConfig.assumptions.discount_rate_wacc * 100}%)</p></div><div class="bg-purple-100 p-4 rounded-lg text-center"><p class="text-sm text-purple-800">Internal Rate of Return (IRR)</p><p class="text-3xl font-bold text-purple-700">${(combined.feasibility.irr * 100).toFixed(2)}%</p><p class="text-xs text-purple-600">per Tahun</p></div></div></div></div>`;
    },

    render() {
        this._renderAssumptionsVisuals();
        this._renderCapexVisuals();
        this._renderFinancialSummaryVisuals();
    }
};

window.sierVisualFinance = sierVisualFinance;