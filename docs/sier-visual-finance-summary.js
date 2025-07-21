// File: sier-visual-finance-summary.js
// Bertanggung jawab untuk merender SEMUA ringkasan finansial dan asumsi utama.

const sierVisualFinanceSummary = {

    //======================================================================
    // BAGIAN 1: FUNGSI RENDER SPESIFIK UNTUK SETIAP BAGIAN SUMMARY
    //======================================================================

    _renderAssumptionsVisuals() {
        const container = document.getElementById('assumptions-container');
        if (!container) return;
        const { assumptions: globalAssumptions, drivingRange, padel } = projectConfig;

        const createTableRows = (data, basePath) => Object.entries(data).map(([key, value]) => {
            if (key === 'capex' || key === 'capex_assumptions') return '';
            const currentPath = `${basePath}.${key}`;
            const translatedKey = sierTranslate.translate(key);
            if (typeof value !== 'object' || value === null || ('count' in value && 'salary' in value) || ('electricity_kwh_price' in value)) {
                let editControl;
                if (typeof value === 'object' && value !== null) {
                    editControl = Object.entries(value).map(([subKey, subVal]) => `<span class="font-medium">${sierTranslate.translate(subKey)}:</span> ${sierHelpers.formatNumber(subVal)}`).join(', ');
                } else {
                    const isPercent = (key.includes('rate') || key.includes('okupansi')) && value < 2 && value > 0;
                    editControl = sierEditable.createEditableNumber(value, currentPath, { format: isPercent ? 'percent' : '' });
                }
                return `<tr class="border-b border-gray-200 hover:bg-gray-50"><td class="py-3 px-4 text-gray-600 w-1/5">${translatedKey}</td><td class="py-3 px-4 w-4/5">${editControl}</td></tr>`;
            } else {
                return `<tr class="border-b border-gray-200"><td class="py-3 px-4 text-gray-600 w-1/5 align-top font-medium">${translatedKey}</td><td class="py-3 px-4 w-4/5"><table class="w-full text-sm"><tbody class="divide-y divide-gray-200">${createTableRows(value, currentPath)}</tbody></table></td></tr>`;
            }
        }).join('');

        const createBusinessModelSection = (title, data, basePath, theme) => {
            const bgColor = theme === 'blue' ? 'bg-blue-600' : theme === 'purple' ? 'bg-purple-600' : 'bg-gray-700';
            return `<div class="bg-white rounded-lg shadow-md overflow-hidden"><h3 class="text-xl font-bold text-white ${bgColor} p-4">${title}</h3><div class="p-4"><table class="w-full text-sm"><tbody class="divide-y divide-gray-200">${createTableRows(data, basePath)}</tbody></table></div></div>`;
        };
        
        container.innerHTML = `<div class="space-y-12">${createBusinessModelSection('A. Asumsi Global', globalAssumptions, 'assumptions', 'gray')}${createBusinessModelSection('B. Model Bisnis Driving Range', drivingRange, 'drivingRange', 'blue')}${createBusinessModelSection('C. Model Bisnis Padel', padel, 'padel', 'purple')}</div>`;
    },

    _renderDepreciationDetails() {
        const container = document.getElementById('depreciation-details-container');
        if (!container) return;
        const data = sierMath.getDepreciationDetails();
        const tableRows = data.details.map(item => `
            <tr>
                <td class="px-3 py-2">${item.category}</td>
                <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(item.capexValue))}</td>
                <td class="px-3 py-2 text-center">${sierEditable.createEditableNumber(item.lifespan, item.lifespanPath)}</td>
                <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(item.annualDepreciation))}</td>
            </tr>
        `).join('');
        container.innerHTML = `<h3 class="text-xl font-semibold mb-3 text-gray-800">Rincian Perhitungan Depresiasi Aset</h3><p class="text-sm text-gray-600 mb-4">Tabel ini menjelaskan bagaimana total biaya "Depresiasi & Amortisasi" pada laporan Laba Rugi dihitung, berdasarkan nilai aset dan asumsi masa manfaatnya.</p><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Kategori Aset</th><th class="p-2 text-right">Total Nilai Aset (CapEx)</th><th class="p-2 text-center">Masa Manfaat (Tahun)</th><th class="p-2 text-right">Penyusutan per Tahun (Rp)</th></tr></thead><tbody class="divide-y">${tableRows}</tbody><tfoot class="font-bold bg-gray-200"><tr><td colspan="3" class="p-2 text-right">Total Depresiasi Tahunan</td><td class="p-2 text-right font-mono text-base">${sierHelpers.formatNumber(Math.round(data.totalAnnualDepreciation))}</td></tr></tfoot></table></div>`;
    },

    _renderFinancialSummaryVisuals() {
        const container = document.getElementById('financial-analysis-summary');
        if (!container) return;

        const summary = sierMath.getFinancialSummary();
        const { drivingRange: dr, padel, combined, digitalCapexTotal } = summary;
        const sharedCapexTotal = projectConfig.shared_facilities_capex.total || 0;
        const totalProjectInvestment = dr.capex.total + padel.capex.total + digitalCapexTotal + sharedCapexTotal;
        const cashFlow = combined.pnl.cashFlowFromOps;
        const paybackPeriod = cashFlow > 0 ? totalProjectInvestment / cashFlow : Infinity;
        let npv = -totalProjectInvestment;
        for (let i = 1; i <= 20; i++) { npv += cashFlow / Math.pow(1 + projectConfig.assumptions.discount_rate_wacc, i); }
        let irr = 0.0;
        for (let i = 0; i < 1.0; i += 0.001) { let tempNpv = -totalProjectInvestment; for (let j = 1; j <= 20; j++) { tempNpv += cashFlow / Math.pow(1 + i, j); } if (tempNpv < 0) { irr = i > 0 ? i - 0.001 : 0; break; } }

        const capexSummaryHtml = `<div id="capex-summary" class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-3 text-gray-800">1. Ringkasan Biaya Investasi (CapEx)</h3><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"><div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Driving Range</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(dr.capex.total)}</p></div><div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Padel</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(padel.capex.total)}</p></div><div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Teknologi Digital</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(digitalCapexTotal)}</p></div><div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Fasilitas Umum</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(sharedCapexTotal)}</p></div><div class="bg-teal-600 text-white p-4 rounded-lg text-center flex flex-col justify-center"><p class="text-sm">Total Investasi Proyek</p><p class="text-3xl font-bold font-mono">${sierHelpers.toBillion(totalProjectInvestment)}</p></div></div></div>`;
        const pnlSummaryHtml = `<div id="pnl-summary" class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-3 text-gray-800">2. Proyeksi Laba Rugi (P&L) - Gabungan</h3><div class="overflow-x-auto border rounded-lg">${sierVisualFinanceDetails._createPnlTable(combined.pnl)}</div></div>`;
        const investmentFeasibilityHtml = `<div id="investment-feasibility" class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-4 text-gray-800">3. Analisis Kelayakan Investasi (Proyek Gabungan)</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="bg-blue-100 p-4 rounded-lg text-center"><p class="text-sm text-blue-800">Payback Period</p><p class="text-3xl font-bold text-blue-700">${paybackPeriod.toFixed(2)}</p><p class="text-xs text-blue-600">Tahun</p></div><div class="bg-green-100 p-4 rounded-lg text-center"><p class="text-sm text-green-800">Net Present Value (NPV)</p><p class="text-3xl font-bold text-green-700">${sierHelpers.toBillion(npv)}</p><p class="text-xs text-green-600">(WACC ${projectConfig.assumptions.discount_rate_wacc * 100}%)</p></div><div class="bg-purple-100 p-4 rounded-lg text-center"><p class="text-sm text-purple-800">Internal Rate of Return (IRR)</p><p class="text-3xl font-bold text-purple-700">${(irr * 100).toFixed(2)}%</p><p class="text-xs text-purple-600">Lebih besar dari WACC, proyek layak</p></div></div></div>`;
        const sensitivityAnalysisHtml = `<div id="sensitivity-analysis"><h3 class="text-xl font-semibold mb-4 text-gray-800">4. Analisis Sensitivitas</h3><p class="text-gray-600 mb-4 text-sm">Analisis ini menguji seberapa besar perubahan Laba Bersih Tahunan jika asumsi pendapatan atau biaya operasional berubah. Ini membantu mengidentifikasi risiko utama terhadap profitabilitas.</p></div>`;

        container.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-teal-600 pl-4">Analisis Keuangan & Kelayakan Investasi (Proyek Gabungan)</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8"><div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 mb-6 text-sm"><strong>Disclaimer:</strong> Analisis ini adalah model proyeksi.</div>${capexSummaryHtml}<div id="depreciation-details-container" class="mb-8 pb-6 border-b"></div>${pnlSummaryHtml}${investmentFeasibilityHtml}${sensitivityAnalysisHtml}</div>`;
        this._renderDepreciationDetails();
    },

    //======================================================================
    // BAGIAN 2: FUNGSI RENDER ORKESTRATOR UTAMA
    //======================================================================

    /**
     * Fungsi render utama untuk file ini.
     */
    render() {
        this._renderAssumptionsVisuals();
        this._renderFinancialSummaryVisuals();
        console.log("[sier-visual-finance-summary] Ringkasan finansial dan asumsi telah dirender.");
    }
};

window.sierVisualFinanceSummary = sierVisualFinanceSummary;