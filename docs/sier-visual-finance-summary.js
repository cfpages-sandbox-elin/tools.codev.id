// File: sier-visual-finance-summary.js
// VERSI 2.2 FINAL - Merender output model finansial multi-tahun yang dinamis dan lengkap.

const sierVisualFinanceSummary = {

    /**
     * Membuat kartu-kartu metrik kelayakan investasi utama.
     * @param {object} metrics - Objek feasibilityMetrics dari sierMathFinance.
     * @returns {string} - String HTML untuk kartu metrik.
     */
    _createFeasibilityMetricsCard(metrics) {
        const { paybackPeriod, discountedPaybackPeriod, npv, irr, profitabilityIndex } = metrics;
        const formatYears = (val) => val === Infinity ? '> 10 Thn' : val.toFixed(2) + ' Thn';
        
        return `
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
                <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col justify-center">
                    <h5 class="text-sm font-semibold text-blue-800">Payback Period</h5>
                    <p class="text-2xl font-bold text-blue-700 mt-1">${formatYears(paybackPeriod)}</p>
                </div>
                <div class="p-3 bg-cyan-50 border border-cyan-200 rounded-lg flex flex-col justify-center">
                    <h5 class="text-sm font-semibold text-cyan-800">Discounted Payback</h5>
                    <p class="text-2xl font-bold text-cyan-700 mt-1">${formatYears(discountedPaybackPeriod)}</p>
                </div>
                <div class="p-3 bg-green-50 border border-green-200 rounded-lg flex flex-col justify-center">
                    <h5 class="text-sm font-semibold text-green-800">Net Present Value (NPV)</h5>
                    <p class="text-2xl font-bold text-green-700 mt-1">${sierHelpers.toBillion(npv)}</p>
                </div>
                <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg flex flex-col justify-center">
                    <h5 class="text-sm font-semibold text-purple-800">Internal Rate of Return (IRR)</h5>
                    <p class="text-2xl font-bold text-purple-700 mt-1">${(irr * 100).toFixed(2)}%</p>
                </div>
                <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-col justify-center">
                    <h5 class="text-sm font-semibold text-amber-800">Profitability Index (PI)</h5>
                    <p class="text-2xl font-bold text-amber-700 mt-1">${profitabilityIndex.toFixed(2)}</p>
                </div>
            </div>
        `;
    },

    /**
     * Membuat tabel rincian depresiasi aset yang dinamis.
     * @param {object} model - Objek model finansial lengkap dari sierMathFinance.
     * @returns {string} - String HTML untuk tabel depresiasi.
     */
    _createDepreciationDetailsTable(model) {
        const data = model.depreciationDetails;
        if (!data || !data.details || data.details.length === 0) {
            return '<p>Detail depresiasi tidak tersedia untuk skenario ini.</p>';
        }

        const tableRows = data.details.map(item => `
            <tr class="hover:bg-gray-50">
                <td class="px-3 py-2">${item.category}</td>
                <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(item.capexValue))}</td>
                <td class="px-3 py-2 text-center">${sierEditable.createEditableNumber(item.lifespan, item.lifespanPath)}</td>
                <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(item.annualDepreciation))}</td>
            </tr>
        `).join('');
        
        return `
            <p class="text-sm text-gray-600 mb-4">Tabel ini menjelaskan bagaimana total biaya "Penyusutan" pada laporan Laba Rugi dihitung, berdasarkan nilai total aset dan asumsi masa manfaatnya untuk skenario yang dipilih.</p>
            <div class="overflow-x-auto border rounded-lg">
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 text-xs uppercase">
                        <tr>
                            <th class="p-2 text-left">Kategori Aset</th>
                            <th class="p-2 text-right">Total Nilai Aset (CapEx)</th>
                            <th class="p-2 text-center">Masa Manfaat (Tahun)</th>
                            <th class="p-2 text-right">Penyusutan per Tahun (Rp)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">${tableRows}</tbody>
                    <tfoot class="font-bold bg-gray-200">
                        <tr>
                            <td colspan="3" class="p-2 text-right">Total Depresiasi Tahunan (Tahun 1-5)</td>
                            <td class="p-2 text-right font-mono text-base">${sierHelpers.formatNumber(Math.round(data.totalAnnualDepreciation))}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    },
    
    /**
     * Helper generik untuk membuat tabel proyeksi multi-tahun yang bisa di-scroll.
     * @param {string[]} headers - Array nama header untuk setiap baris.
     * @param {number[][]} dataRows - Array dari array, berisi data numerik per baris.
     * @param {number} years - Jumlah tahun proyeksi (misal: 10).
     * @returns {string} - String HTML untuk tabel proyeksi.
     */
    _createProjectionTable(headers, dataRows, years) {
        let thead = '<tr>';
        thead += `<th class="p-2 text-left sticky left-0 bg-gray-100 z-10 w-48 min-w-[192px]">Deskripsi</th>`;
        for (let i = 0; i <= years; i++) {
            thead += `<th class="p-2 text-center min-w-[120px]">${i === 0 ? 'Investasi' : `Tahun ${i}`}</th>`;
        }
        thead += '</tr>';

        let tbody = '';
        for (let i = 0; i < headers.length; i++) {
            const isNegativeConvention = headers[i].match(/biaya|pajak|investasi|pembayaran/i);
            const isBoldRow = headers[i].match(/ebit|laba bersih|arus kas/i);
            
            tbody += `<tr class="${isBoldRow ? 'font-semibold bg-gray-50' : ''} hover:bg-yellow-50">`;
            tbody += `<td class="p-2 sticky left-0 z-10 w-48 min-w-[192px] ${isBoldRow ? 'bg-gray-100' : 'bg-white'}">${headers[i]}</td>`;
            
            for (let j = 0; j <= years; j++) {
                const value = dataRows[i][j];
                const displayValue = (value === 0 && j > 0 && !headers[i].match(/kumulatif/i)) ? '-' : sierHelpers.formatNumber(Math.round(value / 1000));
                
                let content = displayValue;
                if (isNegativeConvention && value > 0) {
                    content = `(${displayValue})`;
                }

                tbody += `<td class="p-2 text-right font-mono text-xs ${value < 0 ? 'text-red-600' : ''}">${content}</td>`;
            }
            tbody += '</tr>';
        }
        
        return `<div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm whitespace-nowrap"><thead class="bg-gray-100 text-xs uppercase">${thead}</thead><tbody class="divide-y">${tbody}</tbody></table></div><p class="text-right text-xs text-gray-500 mt-1">*Semua angka dalam ribuan Rupiah (Rp '000)</p>`;
    },

    /**
     * Fungsi render utama yang dipanggil oleh controller.
     * @param {string} selectedScenario - Kunci skenario yang dipilih dari UI.
     */
    render(selectedScenario) {
        const outputContainer = document.getElementById('financial-model-output');
        if (!outputContainer) return;

        console.log(`[Finance Visual] Merender model untuk skenario: ${selectedScenario}`);
        const model = sierMathFinance.generateFullFinancialModel(selectedScenario);

        // 1. Render Metrik Kelayakan
        const metricsHtml = this._createFeasibilityMetricsCard(model.feasibilityMetrics);
        
        // 2. Render Rincian Depresiasi
        const depreciationHtml = this._createDepreciationDetailsTable(model);

        // 3. Render Tabel Laba Rugi
        const pnlHeaders = ["Pendapatan", "Biaya Operasional (OpEx)", "Penyusutan", "EBIT", "Biaya Bunga", "Laba Sebelum Pajak (EBT)", "Pajak", "Laba Bersih"];
        const pnlData = [ model.revenue, model.opex, model.depreciation, model.incomeStatement.ebit, model.financing.interestPayments, model.incomeStatement.ebt, model.incomeStatement.tax, model.incomeStatement.netIncome ];
        const pnlTableHtml = this._createProjectionTable(pnlHeaders, pnlData, 10);

        // 4. Render Tabel Arus Kas
        const cfHeaders = ["Laba Bersih", "+ Penyusutan", "Arus Kas dari Operasi (CFO)", "Investasi (CFI)", "- Pembayaran Pokok Pinjaman", "+ Penerimaan Pinjaman", "Arus Kas dari Pendanaan (CFF)", "Arus Kas Bersih", "Arus Kas Kumulatif"];
        const cfData = [ model.incomeStatement.netIncome, model.depreciation, model.cashFlowStatement.cfo, model.cashFlowStatement.cfi, model.financing.principalPayments, [model.financing.loanAmount, ...Array(10).fill(0)], model.cashFlowStatement.cff, model.cashFlowStatement.netCashFlow, model.cashFlowStatement.cumulativeCashFlow ];
        const cfTableHtml = this._createProjectionTable(cfHeaders, cfData, 10);

        // 5. Gabungkan semua HTML dan render ke dalam kontainer yang sudah ada di sier.html
        outputContainer.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-teal-600 pl-4">Ringkasan & Proyeksi Finansial</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-12">
                <div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">Metrik Kelayakan Investasi</h3>
                    ${metricsHtml}
                    <div class="mt-4 p-3 bg-green-50 border-l-4 border-green-400 text-sm text-green-800">
                        <strong>Kesimpulan:</strong> Berdasarkan metrik di atas, proyek dalam skenario ini dianggap <strong>Sangat Layak</strong> untuk dijalankan.
                    </div>
                </div>

                <div id="depreciation-details-container-rendered">
                    <h3 class="text-xl font-semibold mb-3 text-gray-700">Rincian Perhitungan Depresiasi Aset</h3>
                    ${depreciationHtml}
                </div>

                <div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">Proyeksi Laporan Laba Rugi (10 Tahun)</h3>
                    ${pnlTableHtml}
                </div>

                <div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">Proyeksi Laporan Arus Kas (10 Tahun)</h3>
                    ${cfTableHtml}
                </div>
            </div>`;
    }
};

window.sierVisualFinanceSummary = sierVisualFinanceSummary;