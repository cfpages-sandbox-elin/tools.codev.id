// File: sier-visual-finance-summary.js pecah sier-math-finance.js
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
        const depreciationDetails = sierMathAnalyzer.getDepreciationDetailsForScenario(model);
        if (!depreciationDetails || depreciationDetails.length === 0) return '';
        
        const categories = Array.from(new Set(depreciationDetails.map(d => d.category)));
        const units = Object.keys(model.individual).filter(key => model.individual[key].capexSchedule[0] > 0);
        
        let headerHtml = '<tr><th class="p-2 text-left">Kategori Aset</th>';
        units.forEach(unitKey => {
            const titles = {dr: 'DR', padel4: 'Padel (4)', padel2: 'Padel (2)', mp: 'MP', digital: 'Digital'};
            headerHtml += `<th class="p-2 text-right">${titles[unitKey] || unitKey}</th>`;
        });
        headerHtml += '<th class="p-2 text-right font-bold bg-gray-200">Total Nilai Aset</th></tr>';

        let bodyHtml = '';
        categories.forEach(cat => {
            let rowHtml = `<tr><td class="p-2">${cat}</td>`;
            let rowTotal = 0;
            units.forEach(unitKey => {
                const breakdown = model.individual[unitKey].capexBreakdown;
                const categoryKey = Object.keys(projectConfig.assumptions.depreciation_years).find(key => sierHelpers.safeTranslate(key) === cat);
                const value = breakdown[categoryKey] || 0;
                rowTotal += value;
                rowHtml += `<td class="p-2 text-right font-mono text-xs">${value > 0 ? sierHelpers.formatNumber(Math.round(value)) : '-'}</td>`;
            });
            rowHtml += `<td class="p-2 text-right font-mono font-bold bg-gray-50">${sierHelpers.formatNumber(Math.round(rowTotal))}</td></tr>`;
            bodyHtml += rowHtml;
        });

        return `<div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase">${headerHtml}</thead><tbody class="divide-y">${bodyHtml}</tbody></table></div>`;
    },

    _createFinancialHighlightsTable(model) {
        const { combined } = model;
        const avg = (arr) => arr.length > 1 ? arr.slice(1).reduce((a, b) => a + b, 0) / (arr.length - 1) : 0;
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
            </tr>`).join('');
        return `<div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-200 text-xs uppercase"><tr><th class="p-2 text-left">Indikator Kunci</th><th class="p-2 text-right">Proyeksi Tahun Pertama</th><th class="p-2 text-right">Rata-rata per Tahun (10 Thn)</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
    },

    _createDetailedBreakdownTable(title, model, dataKey) {
        const { individual } = model;
        const years = 10;
        const unitTitles = { 'dr': 'Driving Range', 'padel4': 'Padel (4)', 'padel2': 'Padel (2)', 'mp': 'Meeting Point', 'shared': 'Fasilitas Umum', 'digital': 'Sistem Digital' };
        let headerHtml = '<tr><th class="p-2 text-left sticky left-0 bg-gray-100 z-10">Unit Bisnis</th>';
        for (let i = 1; i <= years; i++) { headerHtml += `<th class="p-2 text-center min-w-[100px]">Tahun ${i}</th>`; }
        headerHtml += '</tr>';
        let bodyHtml = '';
        const unitKeys = Object.keys(individual).filter(k => individual[k].pnl && individual[k].revenue.some(val => val > 0));
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
        for (let i = 0; i <= years; i++) { thead += `<th class="p-2 text-center min-w-[120px]">${i === 0 ? 'Investasi' : `Tahun ${i}`}</th>`; }
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

        projectionContainer.style.display = 'block'; // Pastikan div ini terlihat
        const { combined } = model;
        
        // --- RENDER KONTEN UNTUK BAGIAN PROYEKSI & RINCIAN DETAIL ---
        const revenueHtml = this._createDetailedBreakdownTable('Rincian Pendapatan per Unit Bisnis', model, 'revenue');
        const opexHtml = this._createDetailedBreakdownTable('Rincian Biaya Operasional (OpEx) per Unit Bisnis', model, 'opex');
        const pnlTableHtml = this._createProjectionTable(["Pendapatan", "Biaya Operasional (OpEx)", "Penyusutan", "EBIT", "Biaya Bunga", "Laba Sebelum Pajak (EBT)", "Pajak", "Laba Bersih"], [ combined.revenue, combined.opex, combined.depreciation, combined.incomeStatement.ebit, combined.financing.interestPayments, combined.incomeStatement.ebt, combined.incomeStatement.tax, combined.incomeStatement.netIncome ], 10);
        const cfTableHtml = this._createProjectionTable(["Laba Bersih", "+ Penyusutan", "Arus Kas dari Operasi (CFO)", "Investasi (CFI)", "- Pembayaran Pokok Pinjaman", "+ Penerimaan Pinjaman", "Arus Kas dari Pendanaan (CFF)", "Arus Kas Bersih", "Arus Kas Kumulatif"], [ combined.incomeStatement.netIncome, combined.depreciation, combined.cashFlowStatement.cfo, combined.cashFlowStatement.cfi, combined.financing.principalPayments, [combined.financing.loanAmount, ...Array(10).fill(0)], combined.cashFlowStatement.cff, combined.cashFlowStatement.netCashFlow, combined.cashFlowStatement.cumulativeCashFlow ], 10);

        projectionContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-12">
                ${revenueHtml}
                ${opexHtml}
                <div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">Proyeksi Laporan Laba Rugi (Gabungan)</h3>
                    ${pnlTableHtml}
                </div>
                <div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">Proyeksi Laporan Arus Kas (Gabungan)</h3>
                    ${cfTableHtml}
                </div>
            </div>
        `;

        // --- RENDER KONTEN UNTUK BAGIAN RINGKASAN & KELAYAKAN ---
        const metricsHtml = this._createFeasibilityMetricsCard(combined.feasibilityMetrics);
        const depreciationHtml = this._createDetailedDepreciationTable(model);
        const highlightsHtml = this._createFinancialHighlightsTable(model);
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