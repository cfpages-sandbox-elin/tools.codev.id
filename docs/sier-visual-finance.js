// File: sier-visual-finance.js
// Merender semua elemen visual non-chart terkait Keuangan, Asumsi & Investasi.

const sierVisualFinance = {

    /**
     * Merender tabel asumsi yang interaktif.
     */
    _renderAssumptionsVisuals() {
        const container = document.getElementById('assumptions-container');
        if (!container) return;

        const { assumptions: globalAssumptions, drivingRange, padel } = projectConfig;

        const createTableFromObject = (data, basePath) => {
            return Object.entries(data).map(([key, value]) => {
                if (key === 'capex' || key === 'capex_assumptions') return '';

                const currentPath = `${basePath}.${key}`;
                const translatedKey = sierTranslate.translate(key);

                if (typeof value !== 'object' || value === null || ('count' in value && 'salary' in value) || ('electricity_kwh_price' in value)) {
                    let displayValue;
                    if (typeof value === 'object' && value !== null) {
                        displayValue = Object.entries(value).map(([subKey, subVal]) => {
                            const translatedSubKey = sierTranslate.translate(subKey);
                            return `<span class="font-medium">${translatedSubKey}:</span> ${sierHelpers.formatNumber(subVal)}`;
                        }).join(', ');
                    } else {
                        if ((key.includes('rate') || key.includes('okupansi')) && value < 2 && value > 0) {
                            displayValue = `${(value * 100).toFixed(1)}%`;
                        } else {
                            displayValue = sierHelpers.formatNumber(value);
                        }
                    }
                    // Tambahkan kontrol edit hanya jika nilai adalah angka tunggal
                    const isEditableNumber = typeof value === 'number';
                    const editControls = isEditableNumber ? `<input type="number" step="any" value="${value}" data-path="${currentPath}" class="value-input absolute top-2 left-2 w-3/4 p-1 border rounded shadow-sm hidden"><a href="#" class="edit-icon text-gray-400 hover:text-blue-600 absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">✎</a>` : '';
                    return `<tr class="border-b group"><td class="py-3 px-4 font-semibold text-gray-700 w-2/5">${translatedKey}</td><td class="py-3 px-4 text-gray-800 relative"><span class="value-display">${displayValue}</span>${editControls}</td></tr>`;
                } else {
                    let subRows = createTableFromObject(value, currentPath);
                    return `<tr class="border-b"><td class="py-3 px-4 font-semibold text-gray-700 w-2/5 align-top">${translatedKey}</td><td class="py-3 px-4 text-gray-600"><table class="w-full">${subRows}</table></td></tr>`;
                }
            }).join('');
        };

        container.innerHTML = `
            <div><h3 class="text-xl font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">A. Asumsi Global</h3><table class="w-full text-sm"><tbody>${createTableFromObject(globalAssumptions, 'assumptions')}</tbody></table></div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12 pt-6 border-t">
                <div><h3 class="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">B. Model Bisnis Driving Range</h3><div class="space-y-6"><table class="w-full text-sm"><tbody>${createTableFromObject(drivingRange, 'drivingRange')}</tbody></table></div></div>
                <div><h3 class="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">C. Model Bisnis Padel</h3><div class="space-y-6"><table class="w-full text-sm"><tbody>${createTableFromObject(padel, 'padel')}</tbody></table></div></div>
            </div>`;
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
                editControl = `<input type="number" step="any" value="${rawValue}" data-path="${path}" class="value-input hidden w-32 p-1 border rounded shadow-sm"><a href="#" class="edit-icon text-gray-400 hover:text-blue-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">✎</a>`;
            }
            return `<tr class="group"><td class="p-3">${label}</td><td class="p-3 text-gray-500 text-xs">${displayCalc}${editControl}</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(value))}</td></tr>`;
        };

        const scenarioTableHtml = (title, data) => {
            const contingencyRate = projectConfig.assumptions.contingency_rate * 100;
            return `
            <div class="mb-10">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">${title}</h3>
                <p class="text-gray-600 mb-6">${data.description}</p>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-100"><tr><th class="p-3 text-left w-2/5">Komponen</th><th class="p-3 text-left w-2/5">Asumsi</th><th class="p-3 text-right w-1/5">Biaya (Rp)</th></tr></thead>
                        <tbody class="divide-y">
                            ${data.htmlRows.map(r => createRow(r.label, r.calculation, r.value, r.path)).join('')}
                            <tr class="bg-gray-200 font-bold"><td class="p-3" colspan="2">Subtotal Biaya Fisik & Lainnya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.subtotal))}</td></tr>
                            <tr class="bg-yellow-200 font-bold"><td class="p-3" colspan="2">Kontingensi (${contingencyRate}%)</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.contingency))}</td></tr>
                            <tr class="bg-amber-400 text-white font-bold text-lg"><td class="p-3" colspan="2">Total Estimasi Biaya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.total))}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
        };
        
        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-amber-500 pl-4">Analisis Estimasi Biaya Investasi (CapEx): Driving Range</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                ${scenarioTableHtml('Skenario A: Konstruksi dengan Reklamasi', scenario_a)}
                ${scenarioTableHtml('Skenario B: Konstruksi Apung dengan Pondasi Pancang', scenario_b)}
            </div>`;
    },

    /**
     * BARU: Fungsi untuk membuat tabel P&L dan metrik kelayakan.
     * Menggantikan placeholder yang sebelumnya ada.
     */
    _renderFinancialSummaryVisuals() {
        const drContainer = document.getElementById('driving-range-financial-analysis');
        const padelContainer = document.getElementById('padel-financial-analysis');
        const summaryContainer = document.getElementById('financial-analysis-summary');
        if (!drContainer || !padelContainer || !summaryContainer) return;

        const summary = sierMath.getFinancialSummary();
        const { drivingRange: dr, padel, combined } = summary;

        // Helper untuk membuat tabel P&L
        const createPnlTable = (title, data) => `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-semibold mb-3 text-gray-800">${title}</h3>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50"><tr class="text-left"><th class="px-4 py-2 w-3/5">Deskripsi</th><th class="px-4 py-2 text-right">Nilai (Tahun Pertama)</th></tr></thead>
                        <tbody class="divide-y">
                            <tr><td class="px-4 py-2">Pendapatan (Revenue)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.pnl.annualRevenue))}</td></tr>
                            <tr><td class="px-4 py-2">Harga Pokok Penjualan (COGS)</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(data.pnl.annualCogs))})</td></tr>
                            <tr class="font-semibold"><td class="px-4 py-2">Laba Kotor (Gross Profit)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.pnl.grossProfit))}</td></tr>
                            <tr><td class="px-4 py-2">Biaya Operasional (OpEx)</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(data.pnl.annualOpex))})</td></tr>
                            <tr class="font-semibold"><td class="px-4 py-2">EBITDA</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.pnl.ebitda))}</td></tr>
                            <tr><td class="px-4 py-2">Depresiasi & Amortisasi</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(data.pnl.annualDepreciation))})</td></tr>
                            <tr class="font-semibold"><td class="px-4 py-2">Laba Sebelum Pajak (EBT)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.pnl.ebt))}</td></tr>
                            <tr><td class="px-4 py-2">Pajak Penghasilan</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(data.pnl.tax))})</td></tr>
                            <tr class="bg-teal-100 font-bold text-teal-800"><td class="px-4 py-3 text-base">Laba Bersih (Net Profit)</td><td class="px-4 py-3 text-right text-base font-mono">${sierHelpers.formatNumber(Math.round(data.pnl.netProfit))}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Render setiap bagian
        drContainer.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-amber-500 pl-4">Analisis Finansial (Driving Range)</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8">${createPnlTable('Proyeksi Laba Rugi - Driving Range', dr)}</div>`;
        padelContainer.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Analisis Finansial (Padel)</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8">${createPnlTable('Proyeksi Laba Rugi - Padel', padel)}</div>`;

        // Render bagian Gabungan
        summaryContainer.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-teal-600 pl-4">Analisis Keuangan & Kelayakan Investasi (Proyek Gabungan)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <!-- CapEx Summary -->
                <div class="mb-8 pb-6 border-b">
                    <h3 class="text-xl font-semibold mb-3 text-gray-800">Ringkasan Biaya Investasi (CapEx)</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Driving Range</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(dr.capex.total)}</p></div>
                        <div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Padel</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(padel.capex.total)}</p></div>
                        <div class="bg-teal-600 text-white p-4 rounded-lg text-center"><p class="text-sm">Total Investasi Proyek</p><p class="text-2xl font-bold font-mono">${sierHelpers.toBillion(combined.capex.total)}</p></div>
                    </div>
                </div>
                
                ${createPnlTable('Proyeksi Laba Rugi - Proyek Gabungan', combined)}
                
                <!-- Investment Feasibility -->
                <div id="investment-feasibility" class="mb-8 pb-6 border-b">
                     <h3 class="text-xl font-semibold mb-4 text-gray-800">Analisis Kelayakan Investasi</h3>
                     <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-blue-100 p-4 rounded-lg text-center"><p class="text-sm text-blue-800">Payback Period</p><p class="text-3xl font-bold text-blue-700">${combined.feasibility.paybackPeriod.toFixed(2)}</p><p class="text-xs text-blue-600">Tahun</p></div>
                        <div class="bg-green-100 p-4 rounded-lg text-center"><p class="text-sm text-green-800">Net Present Value (NPV)</p><p class="text-3xl font-bold text-green-700">${sierHelpers.toBillion(combined.feasibility.npv)}</p><p class="text-xs text-green-600">(WACC ${projectConfig.assumptions.discount_rate_wacc * 100}%)</p></div>
                        <div class="bg-purple-100 p-4 rounded-lg text-center"><p class="text-sm text-purple-800">Internal Rate of Return (IRR)</p><p class="text-3xl font-bold text-purple-700">${(combined.feasibility.irr * 100).toFixed(2)}%</p><p class="text-xs text-purple-600">per Tahun</p></div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Fungsi MASTER untuk modul ini.
     */
    render() {
        this._renderAssumptionsVisuals();
        this._renderCapexVisuals();
        this._renderFinancialSummaryVisuals();
    }
};

window.sierVisualFinance = sierVisualFinance;