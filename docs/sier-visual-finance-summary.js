// File: sier-visual-finance-summary.js fix translate lagi
const sierVisualFinanceSummary = {

    _createFeasibilityMetricsCard(metrics) {
        if (!metrics) {
            return '<div class="text-center text-red-500">Gagal memuat metrik kelayakan.</div>';
        }
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
        const categories = ['civil_construction', 'building', 'equipment', 'digital_systems', 'shared_facilities', 'other'];

        let tableHeaderHtml = '<tr><th class="p-2 text-left">Kategori Aset</th>';
        const unitKeys = Object.keys(individual);
        unitKeys.forEach(key => {
            const scenario = individual[key];
            const title = (scenario.scenarios && scenario.scenarios[key]) ? scenario.scenarios[key].title : (scenario.title || key.toUpperCase());
            tableHeaderHtml += `<th class="p-2 text-right">${title}</th>`;
        });
        tableHeaderHtml += '<th class="p-2 text-right font-bold bg-gray-200">Total Nilai Aset</th></tr>';

        const tableBodyHtml = categories.map(cat => {
            let rowHtml = `<tr><td class="p-2">${sierHelpers.safeTranslate(cat)}</td>`;
            let rowTotal = 0;
            unitKeys.forEach(key => {
                const value = individual[key].capexBreakdown[cat] || 0;
                rowTotal += value;
                rowHtml += `<td class="p-2 text-right font-mono text-xs">${value > 0 ? sierHelpers.formatNumber(Math.round(value)) : '-'}</td>`;
            });
            rowHtml += `<td class="p-2 text-right font-mono font-bold bg-gray-50">${sierHelpers.formatNumber(Math.round(rowTotal))}</td></tr>`;
            return rowHtml;
        }).join('');

        return `<div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase">${tableHeaderHtml}</thead><tbody class="divide-y">${tableBodyHtml}</tbody></table></div>`;
    },

    _createDetailedBreakdownTable(title, model, dataKey) {
        const { individual } = model;
        const years = 10;
        
        let headerHtml = '<tr><th class="p-2 text-left sticky left-0 bg-gray-100 z-10">Unit Bisnis</th>';
        for (let i = 1; i <= years; i++) { headerHtml += `<th class="p-2 text-center min-w-[100px]">Tahun ${i}</th>`; }
        headerHtml += '</tr>';

        let bodyHtml = '';
        const unitKeys = Object.keys(individual).filter(k => individual[k].pnl);
        unitKeys.forEach(key => {
            const unit = individual[key];
            const title = unit.title || key.toUpperCase();
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
                if (isNegativeConvention && value > 0) {
                    content = `(${displayValue})`;
                }

                tbody += `<td class="p-2 text-right font-mono text-xs ${value < 0 ? 'text-red-600' : ''}">${content}</td>`;
            }
            tbody += '</tr>';
        }
        
        return `<div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm whitespace-nowrap"><thead class="bg-gray-100 text-xs uppercase">${thead}</thead><tbody class="divide-y">${tbody}</tbody></table></div><p class="text-right text-xs text-gray-500 mt-1">*Semua angka dalam ribuan Rupiah (Rp '000)</p>`;
    },

    render(model) {
        const outputContainer = document.getElementById('financial-model-output');
        if (!outputContainer || !model || !model.combined) return;

        console.log(`[Finance Visual] Merender output finansial dengan rincian per unit.`);
        const { combined } = model;
        
        const metricsHtml = this._createFeasibilityMetricsCard(combined.feasibilityMetrics);
        const depreciationHtml = this._createDetailedDepreciationTable(model);
        const revenueHtml = this._createDetailedBreakdownTable('Rincian Pendapatan per Unit Bisnis', model, 'revenue');
        const opexHtml = this._createDetailedBreakdownTable('Rincian Biaya Operasional (OpEx) per Unit Bisnis', model, 'opex');
        const ebitdaHtml = this._createDetailedBreakdownTable('Kontribusi Laba Operasional (EBITDA) per Unit Bisnis', model, 'ebitda');

        const pnlHeaders = ["Pendapatan", "Biaya Operasional (OpEx)", "Penyusutan", "EBIT", "Biaya Bunga", "Laba Sebelum Pajak (EBT)", "Pajak", "Laba Bersih"];
        const pnlData = [ combined.revenue, combined.opex, combined.depreciation, combined.incomeStatement.ebit, combined.financing.interestPayments, combined.incomeStatement.ebt, combined.incomeStatement.tax, combined.incomeStatement.netIncome ];
        const pnlTableHtml = this._createProjectionTable(pnlHeaders, pnlData, 10);
        
        const cfHeaders = ["Laba Bersih", "+ Penyusutan", "Arus Kas dari Operasi (CFO)", "Investasi (CFI)", "- Pembayaran Pokok Pinjaman", "+ Penerimaan Pinjaman", "Arus Kas dari Pendanaan (CFF)", "Arus Kas Bersih", "Arus Kas Kumulatif"];
        const cfData = [ combined.incomeStatement.netIncome, combined.depreciation, combined.cashFlowStatement.cfo, combined.cashFlowStatement.cfi, combined.financing.principalPayments, [combined.financing.loanAmount, ...Array(10).fill(0)], combined.cashFlowStatement.cff, combined.cashFlowStatement.netCashFlow, combined.cashFlowStatement.cumulativeCashFlow ];
        const cfTableHtml = this._createProjectionTable(cfHeaders, cfData, 10);
        
        outputContainer.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-teal-600 pl-4">Ringkasan & Proyeksi Finansial</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-12">
                <div><h3 class="text-xl font-semibold mb-4 text-gray-700">Metrik Kelayakan Investasi (Proyek Gabungan)</h3>${metricsHtml}</div>
                <div><h3 class="text-xl font-semibold mb-3 text-gray-700">Rincian Alokasi Biaya Investasi (CapEx) per Unit</h3>${depreciationHtml}</div>
                ${revenueHtml}
                ${opexHtml}
                ${ebitdaHtml}
                <div><h3 class="text-xl font-semibold mb-4 text-gray-700">Proyeksi Laporan Laba Rugi (Gabungan)</h3>${pnlTableHtml}</div>
                <div><h3 class="text-xl font-semibold mb-4 text-gray-700">Proyeksi Laporan Arus Kas (Gabungan)</h3>${cfTableHtml}</div>
            </div>`;
    }
};

window.sierVisualFinanceSummary = sierVisualFinanceSummary;