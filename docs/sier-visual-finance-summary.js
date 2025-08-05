// File: sier-visual-finance-summary.js tambah data summary + tampil
const sierVisualFinanceSummary = {
    _createFeasibilityMetricsCard(metrics) {
        if (!metrics) return '<p>Gagal memuat metrik.</p>';
        const { paybackPeriod, discountedPaybackPeriod, npv, irr, profitabilityIndex } = metrics;
        const formatYears = (val) => val === Infinity ? '> 10 Thn' : val.toFixed(2) + ' Thn';
        
        return `
            <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
                <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col justify-center"><h5 class="text-sm font-semibold text-blue-800">Payback Period</h5><p class="text-2xl font-bold text-blue-700 mt-1">${formatYears(paybackPeriod)}</p></div>
                <div class="p-3 bg-cyan-50 border border-cyan-200 rounded-lg flex flex-col justify-center"><h5 class="text-sm font-semibold text-cyan-800">Discounted Payback</h5><p class="text-2xl font-bold text-cyan-700 mt-1">${formatYears(discountedPaybackPeriod)}</p></div>
                <div class="p-3 bg-green-50 border border-green-200 rounded-lg flex flex-col justify-center"><h5 class="text-sm font-semibold text-green-800">Net Present Value (NPV)</h5><p class="text-2xl font-bold text-green-700 mt-1">${sierHelpers.toBillion(npv)}</p></div>
                <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg flex flex-col justify-center"><h5 class="text-sm font-semibold text-purple-800">Internal Rate of Return (IRR)</h5><p class="text-2xl font-bold text-purple-700 mt-1">${(irr * 100).toFixed(2)}%</p></div>
                <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-col justify-center"><h5 class="text-sm font-semibold text-amber-800">Profitability Index (PI)</h5><p class="text-2xl font-bold text-amber-700 mt-1">${profitabilityIndex.toFixed(2)}</p></div>
            </div>
        `;
    },

    _createDetailedDepreciationTable(model) {
        const { individual } = model;
        const categories = { 'dr': 'Driving Range', 'padel4': 'Padel (4)', 'padel2': 'Padel (2)', 'mp': 'Meeting Point', 'shared': 'Fasilitas Umum', 'digital': 'Sistem Digital' };
        const assetTypes = ['civil_construction', 'building', 'equipment', 'digital_systems', 'shared_facilities', 'other'];
        let tableHeaderHtml = '<tr><th class="p-2 text-left">Kategori Aset</th>';
        const activeUnitKeys = Object.keys(individual).filter(key => categories[key]);
        activeUnitKeys.forEach(key => { tableHeaderHtml += `<th class="p-2 text-right">${categories[key]}</th>`; });
        tableHeaderHtml += '<th class="p-2 text-right font-bold bg-gray-200">Total Nilai Aset</th></tr>';
        const tableBodyHtml = assetTypes.map(cat => {
            let rowHtml = `<tr><td class="p-2">${sierHelpers.safeTranslate(cat)}</td>`;
            let rowTotal = 0;
            activeUnitKeys.forEach(key => {
                const value = individual[key].capexBreakdown[cat] || 0;
                rowTotal += value;
                rowHtml += `<td class="p-2 text-right font-mono text-xs">${value > 0 ? sierHelpers.formatNumber(Math.round(value)) : '-'}</td>`;
            });
            if (rowTotal === 0) return '';
            rowHtml += `<td class="p-2 text-right font-mono font-bold bg-gray-50">${sierHelpers.formatNumber(Math.round(rowTotal))}</td></tr>`;
            return rowHtml;
        }).join('');
        return `<div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase">${tableHeaderHtml}</thead><tbody class="divide-y">${tableBodyHtml}</tbody></table></div>`;
    },

    _createFinancialHighlightsTable(model) {
        const { combined } = model;
        const avg = (arr) => arr.slice(1).reduce((a, b) => a + b, 0) / (arr.length - 1);

        const data = [
            { label: "Pendapatan", year1: combined.revenue[1], average: avg(combined.revenue) },
            { label: "Biaya Operasional (OpEx)", year1: combined.opex[1], average: avg(combined.opex), isNegative: true },
            { label: "EBITDA", year1: combined.revenue[1] - combined.opex[1], average: avg(combined.revenue) - avg(combined.opex), isBold: true },
            { label: "Laba Bersih", year1: combined.incomeStatement.netIncome[1], average: avg(combined.incomeStatement.netIncome) },
            { label: "Arus Kas Bersih (dari Operasi)", year1: combined.cashFlowStatement.cfo[1], average: avg(combined.cashFlowStatement.cfo) }
        ];

        const rowsHtml = data.map(d => `
            <tr class="${d.isBold ? 'font-bold bg-gray-100' : 'bg-white'} border-b">
                <td class="px-4 py-3">${d.label}</td>
                <td class="px-4 py-3 text-right font-mono ${d.isNegative ? 'text-red-600' : ''}">${d.isNegative ? '(' : ''}${sierHelpers.formatNumber(Math.round(d.year1))}${d.isNegative ? ')' : ''}</td>
                <td class="px-4 py-3 text-right font-mono ${d.isNegative ? 'text-red-600' : ''}">${d.isNegative ? '(' : ''}${sierHelpers.formatNumber(Math.round(d.average))}${d.isNegative ? ')' : ''}</td>
            </tr>
        `).join('');

        return `
            <div class="overflow-x-auto border rounded-lg">
                <table class="w-full text-sm">
                    <thead class="bg-gray-200 text-xs uppercase">
                        <tr>
                            <th class="p-2 text-left">Indikator Kunci</th>
                            <th class="p-2 text-right">Proyeksi Tahun Pertama</th>
                            <th class="p-2 text-right">Rata-rata per Tahun (10 Thn)</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    },

    _createDetailedBreakdownTable(title, model, dataKey) {
        const { individual } = model;
        const years = 10;
        const unitTitles = { 'dr': 'Driving Range', 'padel4': 'Padel (4)', 'padel2': 'Padel (2)', 'mp': 'Meeting Point', 'shared': 'Fasilitas Umum', 'digital': 'Sistem Digital' };
        
        let headerHtml = '<tr><th class="p-2 text-left sticky left-0 bg-gray-100 z-10">Unit Bisnis</th>';
        for (let i = 1; i <= years; i++) { headerHtml += `<th class="p-2 text-center min-w-[100px]">Tahun ${i}</th>`; }
        headerHtml += '</tr>';

        let bodyHtml = '';
        const unitKeys = Object.keys(individual).filter(k => individual[k].pnl && individual[k].revenue.some(val => val > 0)); // Hanya tampilkan unit dengan pendapatan
        unitKeys.forEach(key => {
            const unit = individual[key];
            const title = unitTitles[key] || key.toUpperCase();
            bodyHtml += `<tr class="hover:bg-yellow-50"><td class="p-2 sticky left-0 bg-white z-10 font-semibold">${title}</td>`;
            for (let i = 1; i <= years; i++) {
                const value = unit.pnl[dataKey][i];
                bodyHtml += `<td class="p-2 text-right font-mono text-xs">${sierHelpers.formatNumber(Math.round(value / 1000))}</td>`;
            }
            bodyHtml += `</tr>`;
        });

        bodyHtml += `<tr class="font-bold bg-gray-200"><td class="p-2 sticky left-0 bg-gray-200 z-10">Total Gabungan</td>`;
        for (let i = 1; i <= years; i++) {
            let yearTotal = 0;
            unitKeys.forEach(key => { yearTotal += individual[key].pnl[dataKey][i]; });
            bodyHtml += `<td class="p-2 text-right font-mono text-xs">${sierHelpers.formatNumber(Math.round(yearTotal / 1000))}</td>`;
        }
        bodyHtml += `</tr>`;

        return `<div><h3 class="text-xl font-semibold mb-3 text-gray-700">${title}</h3><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm whitespace-nowrap"><thead class="bg-gray-100 text-xs uppercase">${headerHtml}</thead><tbody class="divide-y">${bodyHtml}</tbody></table></div><p class="text-right text-xs text-gray-500 mt-1">*Semua angka dalam ribuan Rupiah (Rp '000)</p></div>`;
    },

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
                const displayValue = (value === 0 && j > 0 && !headers[i].match(/kumulatif|bunga/i)) ? '-' : sierHelpers.formatNumber(Math.round(value / 1000));
                let content = displayValue;
                if (isNegativeConvention && value > 0) content = `(${displayValue})`;
                tbody += `<td class="p-2 text-right font-mono text-xs ${value < 0 ? 'text-red-600' : ''}">${content}</td>`;
            }
            tbody += '</tr>';
        }
        
        return `<div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm whitespace-nowrap"><thead class="bg-gray-100 text-xs uppercase">${thead}</thead><tbody class="divide-y">${tbody}</tbody></table></div><p class="text-right text-xs text-gray-500 mt-1">*Semua angka dalam ribuan Rupiah (Rp '000)</p>`;
    },

    render(model) {
        const projectionContainer = document.getElementById('financial-model-output');
        const summaryContainer = document.getElementById('financial-analysis-summary');

        if (!projectionContainer || !summaryContainer || !model || !model.combined) {
            console.error("Satu atau lebih container finansial atau data model tidak ditemukan.");
            return;
        }

        const { combined } = model;
        
        // KOSONGKAN CONTAINER PROYEKSI KARENA SEMUA AKAN PINDAH KE SUMMARY
        projectionContainer.innerHTML = '';
        projectionContainer.style.display = 'none'; // Sembunyikan div yang tidak terpakai

        // RENDER SEMUA KONTEN KE DALAM SUMMARY CONTAINER
        const metricsHtml = this._createFeasibilityMetricsCard(combined.feasibilityMetrics);
        const depreciationHtml = this._createDetailedDepreciationTable(model);
        const highlightsHtml = this._createFinancialHighlightsTable(model); // Panggil fungsi baru
        const sensitivityPlaceholderHtml = '<div id="sensitivity-analysis-container"><!-- Konten analisis sensitivitas --></div>';

        summaryContainer.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-amber-500 pl-4">Analisis Keuangan & Kelayakan Investasi Proyek</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-12">
                <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm">
                    <strong>Disclaimer:</strong> Analisis ini adalah model proyeksi...
                </div>

                <div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">1. Ringkasan Alokasi Biaya Investasi (CapEx)</h3>
                    ${depreciationHtml}
                </div>
                
                <div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">2. Ringkasan Kinerja Keuangan (Proyeksi Gabungan)</h3>
                    ${highlightsHtml}
                </div>

                <div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">3. Metrik Kelayakan Investasi (Proyek Gabungan)</h3>
                    ${metricsHtml}
                </div>

                ${sensitivityPlaceholderHtml}
            </div>
        `;
    }
};

window.sierVisualFinanceSummary = sierVisualFinanceSummary;