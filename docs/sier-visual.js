// File: sier-visual.js (v1.0)

document.addEventListener('DOMContentLoaded', () => {
    const helpers = {
        formatNumber(num) {
            if (num === null || num === undefined || isNaN(num)) return '0';
            return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        },
        toBillion(num) {
            if (isNaN(num)) return '0 M';
            return (num / 1000000000).toFixed(2) + ' M';
        },
        slovin(N, e) {
            return Math.ceil(N / (1 + N * e * e));
        },
        tryToRender(fn) {
            try {
                fn();
            } catch (error) {
                console.error(`Error saat merender bagian '${fn.name}':`, error);
            }
        }
    };

    function renderFinancialAnalysis() {
        const drContainer = document.getElementById('driving-range-financial-analysis');
        const padelContainer = document.getElementById('padel-financial-analysis');
        const combinedContainer = document.getElementById('financial-analysis-summary');
        if (!drContainer || !padelContainer || !combinedContainer) return;

        const summary = projectConfig.calculations.getFinancialSummary();
        const { drivingRange: dr, padel, combined } = summary;

        const createPnlTable = (pnlData) => `
            <table class="w-full text-sm">
                <tbody class="divide-y">
                    <tr><td class="py-2">Total Pendapatan Tahunan</td><td class="py-2 text-right font-mono">${helpers.formatNumber(pnlData.annualRevenue)}</td></tr>
                    <tr><td class="py-2">Harga Pokok Penjualan (HPP/COGS)</td><td class="py-2 text-right font-mono">(${helpers.formatNumber(pnlData.annualCogs)})</td></tr>
                    <tr class="font-semibold"><td class="py-2">Laba Kotor</td><td class="py-2 text-right font-mono">${helpers.formatNumber(pnlData.grossProfit)}</td></tr>
                    <tr><td class="py-2">Beban Operasional (OpEx) Tahunan</td><td class="py-2 text-right font-mono">(${helpers.formatNumber(pnlData.annualOpex)})</td></tr>
                    <tr class="font-semibold bg-gray-50"><td class="py-2 px-2">EBITDA</td><td class="py-2 px-2 text-right font-mono">${helpers.formatNumber(pnlData.ebitda)}</td></tr>
                    <tr><td class="py-2">Beban Depresiasi Tahunan</td><td class="py-2 text-right font-mono">(${helpers.formatNumber(pnlData.annualDepreciation)})</td></tr>
                    <tr class="font-semibold"><td class="py-2">Laba Sebelum Pajak (EBT)</td><td class="py-2 text-right font-mono">${helpers.formatNumber(pnlData.ebt)}</td></tr>
                    <tr><td class="py-2">Pajak Penghasilan</td><td class="py-2 text-right font-mono">(${helpers.formatNumber(pnlData.tax)})</td></tr>
                    <tr class="font-bold text-lg bg-teal-50"><td class="py-3 px-2">Estimasi Laba Bersih Tahunan</td><td class="py-3 px-2 text-right font-mono text-teal-700">${helpers.formatNumber(pnlData.netProfit)}</td></tr>
                </tbody>
            </table>
        `;

        drContainer.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-teal-600 pl-4">Analisis Finansial (Driving Range)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-semibold text-gray-700 mb-2">1. Rincian Biaya Investasi (CapEx)</h3>
                <p class="text-center text-4xl font-bold font-mono text-gray-800">Rp ${helpers.formatNumber(dr.capex.total)}</p>
                <h3 class="text-xl font-semibold text-gray-700 mt-6 mb-2">2. Proyeksi Laba Rugi Tahunan</h3>
                ${createPnlTable(dr.pnl)}
            </div>
        `;
        padelContainer.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Analisis Finansial (Padel)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-semibold text-gray-700 mb-2">1. Rincian Biaya Investasi (CapEx)</h3>
                <p class="text-center text-4xl font-bold font-mono text-gray-800">Rp ${helpers.formatNumber(padel.capex.total)}</p>
                <h3 class="text-xl font-semibold text-gray-700 mt-6 mb-2">2. Proyeksi Laba Rugi Tahunan</h3>
                ${createPnlTable(padel.pnl)}
            </div>
        `;

        const pessimistic = projectConfig.calculations.getFinancialSummary(0.85, 1.10).combined;
        const optimistic = projectConfig.calculations.getFinancialSummary(1.15, 1.00).combined;
        combinedContainer.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-rose-600 pl-4">Analisis Keuangan & Kelayakan Investasi (Proyek Gabungan)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 mb-6 text-sm">Proyeksi ini menggabungkan kedua unit bisnis dan hasilnya akan berubah secara real-time sesuai perubahan asumsi di atas.</div>
                <div class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-4 text-gray-700">1. Total Biaya Investasi (CapEx) Gabungan</h3><p class="text-center text-5xl font-bold font-mono text-rose-600">Rp ${helpers.formatNumber(combined.capex.total)}</p></div>
                <div class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-4 text-gray-700">2. Proyeksi Laba Rugi Gabungan (Tahun Pertama)</h3>${createPnlTable(combined.pnl)}</div>
                <div class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-4 text-gray-700">3. Analisis Kelayakan Investasi Gabungan</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center"><div class="p-4 bg-blue-50 rounded-lg"><h4 class="font-semibold text-sm text-blue-800">Payback Period</h4><p class="text-3xl font-bold font-mono text-blue-600 mt-1">${(combined.feasibility.paybackPeriod || 0).toFixed(2)}</p><p class="text-xs text-gray-500">Tahun</p></div><div class="p-4 bg-green-50 rounded-lg"><h4 class="font-semibold text-sm text-green-800">Net Present Value (NPV)</h4><p class="text-3xl font-bold font-mono text-green-600 mt-1">Rp ${helpers.toBillion(combined.feasibility.npv || 0)}</p></div><div class="p-4 bg-purple-50 rounded-lg"><h4 class="font-semibold text-sm text-purple-800">Internal Rate of Return (IRR)</h4><p class="text-3xl font-bold font-mono text-purple-600 mt-1">${((combined.feasibility.irr || 0) * 100).toFixed(2)}%</p></div></div></div>
                <div><h3 class="text-xl font-semibold mb-4 text-gray-700">4. Analisis Sensitivitas Proyek Gabungan</h3><table class="w-full text-sm"><thead class="text-xs text-gray-700 uppercase bg-gray-100"><tr><th class="px-4 py-3 text-left">Metrik</th><th class="px-4 py-3 text-center">Pesimis</th><th class="px-4 py-3 text-center">Realisitis</th><th class="px-4 py-3 text-center">Optimis</th></tr></thead><tbody class="text-center"><tr class="border-b"><td class="px-4 py-3 text-left font-semibold">Laba Bersih Tahunan</td><td class="px-4 py-3 font-mono text-red-600">${helpers.formatNumber(pessimistic.pnl.netProfit)}</td><td class="px-4 py-3 font-mono font-bold">${helpers.formatNumber(combined.pnl.netProfit)}</td><td class="px-4 py-3 font-mono text-green-600">${helpers.formatNumber(optimistic.pnl.netProfit)}</td></tr><tr class="border-b"><td class="px-4 py-3 text-left font-semibold">Payback Period (Tahun)</td><td class="px-4 py-3 font-mono text-red-600">${(pessimistic.feasibility.paybackPeriod || 0).toFixed(2)}</td><td class="px-4 py-3 font-mono font-bold">${(combined.feasibility.paybackPeriod || 0).toFixed(2)}</td><td class="px-4 py-3 font-mono text-green-600">${(optimistic.feasibility.paybackPeriod || 0).toFixed(2)}</td></tr></tbody></table></div>
            </div>
        `;
    }

    function renderDemographyAndCharts() {
        const summaryContainer = document.getElementById('summary');
        const chartsContainer = document.getElementById('charts');
        if (!summaryContainer || !chartsContainer) return;

        const totalPopulation = demographyData.reduce((sum, item) => sum + item.total, 0);
        const totalRing1 = demographyData.filter(d => d.ring === 1).reduce((sum, item) => sum + item.total, 0);
        const totalRing2 = demographyData.filter(d => d.ring === 2).reduce((sum, item) => sum + item.total, 0);
        
        const totalsByAge = {
            '0-14 Thn': demographyData.reduce((s, i) => s + i.usia0_14, 0),
            '15-24 Thn': demographyData.reduce((s, i) => s + i.usia15_24, 0),
            '25-39 Thn': demographyData.reduce((s, i) => s + i.usia25_39, 0),
            '40-54 Thn': demographyData.reduce((s, i) => s + i.usia40_54, 0),
            '55-64 Thn': demographyData.reduce((s, i) => s + i.usia55_64, 0),
            '65+ Thn': demographyData.reduce((s, i) => s + i.usia65_plus, 0)
        };
        
        const totalProductive = totalsByAge['15-24 Thn'] + totalsByAge['25-39 Thn'] + totalsByAge['40-54 Thn'] + totalsByAge['55-64 Thn'];
        const totalNonProductive = totalsByAge['0-14 Thn'] + totalsByAge['65+ Thn'];
        const dependencyRatio = totalProductive > 0 ? ((totalNonProductive / totalProductive) * 100).toFixed(2) : 0;

        const totalsByKecamatan = demographyData.reduce((acc, curr) => ({
            ...acc,
            [curr.kecamatan]: (acc[curr.kecamatan] || 0) + curr.total
        }), {});

        document.getElementById('totalPenduduk').innerText = helpers.formatNumber(totalPopulation);
        document.getElementById('totalRing1').innerText = helpers.formatNumber(totalRing1);
        document.getElementById('totalRing2').innerText = helpers.formatNumber(totalRing2);
        document.getElementById('dependencyRatio').innerText = dependencyRatio;

        const tableBody = document.getElementById('dataTableBody');
        if (tableBody) {
            tableBody.innerHTML = demographyData.map(row => `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-3 py-4 font-medium text-gray-900">${row.kecamatan}</td>
                    <td class="px-3 py-4">${row.kelurahan}</td>
                    <td class="px-3 py-4 text-center">${helpers.formatNumber(row.total)}</td>
                    <td class="px-3 py-4 text-center">${helpers.formatNumber(row.usia0_14)}</td>
                    <td class="px-3 py-4 text-center">${helpers.formatNumber(row.usia15_24)}</td>
                    <td class="px-3 py-4 text-center">${helpers.formatNumber(row.usia25_39)}</td>
                    <td class="px-3 py-4 text-center">${helpers.formatNumber(row.usia40_54)}</td>
                    <td class="px-3 py-4 text-center">${helpers.formatNumber(row.usia55_64)}</td>
                    <td class="px-3 py-4 text-center">${helpers.formatNumber(row.usia65_plus)}</td>
                    <td class="px-3 py-4 text-center">${row.ring}</td>
                </tr>`).join('');
        }

        const chartOptions = (extraOptions = {}) => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: { tooltip: { callbacks: { label: (c) => `${c.label || ''}: ${helpers.formatNumber(c.raw)}` } } },
            ...extraOptions
        });

        if (document.getElementById('ringChart')) new Chart(document.getElementById('ringChart'), { type: 'doughnut', data: { labels: ['Ring 1', 'Ring 2'], datasets: [{ data: [totalRing1, totalRing2], backgroundColor: ['#10B981', '#F59E0B'] }] }, options: chartOptions() });
        if (document.getElementById('ageDistributionChart')) new Chart(document.getElementById('ageDistributionChart'), { type: 'bar', data: { labels: Object.keys(totalsByAge), datasets: [{ label: 'Total Penduduk', data: Object.values(totalsByAge), backgroundColor: 'rgba(59, 130, 246, 0.7)' }] }, options: chartOptions({ plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v) => helpers.formatNumber(v) } } } }) });
        if (document.getElementById('productiveRatioChart')) new Chart(document.getElementById('productiveRatioChart'), { type: 'doughnut', data: { labels: ['Usia Produktif (15-64 Thn)', 'Usia Non-Produktif (0-14 & 65+ Thn)'], datasets: [{ data: [totalProductive, totalNonProductive], backgroundColor: ['#2563EB', '#DC2626'] }] }, options: chartOptions() });
        if (document.getElementById('kecamatanChart')) new Chart(document.getElementById('kecamatanChart'), { type: 'bar', data: { labels: Object.keys(totalsByKecamatan), datasets: [{ label: 'Total Populasi', data: Object.values(totalsByKecamatan), backgroundColor: ['#8B5CF6', '#EC4899', '#F97316', '#14B8A6'] }] }, options: chartOptions({ indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: (v) => helpers.formatNumber(v) } } } }) });
    }

    function renderDetailedDemography() {
        const ageLabels = ['0-14 Thn', '15-24 Thn', '25-39 Thn', '40-54 Thn', '55-64 Thn', '65+ Thn'];
        
        const totalsByAgeRing1 = ageLabels.reduce((acc, label) => ({...acc, [label]: 0}), {});
        const totalsByAgeRing2 = ageLabels.reduce((acc, label) => ({...acc, [label]: 0}), {});
        demographyData.forEach(row => {
            const target = row.ring === 1 ? totalsByAgeRing1 : totalsByAgeRing2;
            target['0-14 Thn'] += row.usia0_14; target['15-24 Thn'] += row.usia15_24; target['25-39 Thn'] += row.usia25_39;
            target['40-54 Thn'] += row.usia40_54; target['55-64 Thn'] += row.usia55_64; target['65+ Thn'] += row.usia65_plus;
        });
        if (document.getElementById('ageDistributionByRingChart')) new Chart(document.getElementById('ageDistributionByRingChart'), { type: 'bar', data: { labels: ageLabels, datasets: [{ label: 'Ring 1', data: Object.values(totalsByAgeRing1), backgroundColor: 'rgba(22, 163, 74, 0.7)' }, { label: 'Ring 2', data: Object.values(totalsByAgeRing2), backgroundColor: 'rgba(245, 158, 11, 0.7)' }] }, options: { responsive: true, scales: { y: { ticks: { callback: (v) => helpers.formatNumber(v) } } }, plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${helpers.formatNumber(c.raw)}` } } } } });

        const kecamatanChartsContainer = document.getElementById('kecamatanAgeChartsContainer');
        if (kecamatanChartsContainer) {
            kecamatanChartsContainer.innerHTML = ""; // Clear container
            const totalsByAgeKecamatan = demographyData.reduce((acc, row) => {
                if (!acc[row.kecamatan]) acc[row.kecamatan] = ageLabels.reduce((a, l) => ({...a, [l]: 0}), {});
                acc[row.kecamatan]['0-14 Thn'] += row.usia0_14; acc[row.kecamatan]['15-24 Thn'] += row.usia15_24; acc[row.kecamatan]['25-39 Thn'] += row.usia25_39;
                acc[row.kecamatan]['40-54 Thn'] += row.usia40_54; acc[row.kecamatan]['55-64 Thn'] += row.usia55_64; acc[row.kecamatan]['65+ Thn'] += row.usia65_plus;
                return acc;
            }, {});

            const kecamatanColors = ['rgba(59, 130, 246, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(236, 72, 153, 0.7)', 'rgba(20, 184, 166, 0.7)'];
            let colorIndex = 0;
            for (const kecamatanName in totalsByAgeKecamatan) {
                const chartWrapper = document.createElement('div');
                chartWrapper.innerHTML = `<h4 class="text-lg font-semibold text-center mb-2 text-gray-700">${kecamatanName}</h4><canvas></canvas>`;
                kecamatanChartsContainer.appendChild(chartWrapper);
                new Chart(chartWrapper.querySelector('canvas'), { type: 'bar', data: { labels: ageLabels, datasets: [{ label: `Populasi ${kecamatanName}`, data: Object.values(totalsByAgeKecamatan[kecamatanName]), backgroundColor: kecamatanColors[colorIndex++ % kecamatanColors.length] }] }, options: { responsive: true, scales: { y: { ticks: { callback: (v) => helpers.formatNumber(v) } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => helpers.formatNumber(c.raw) } } } } });
            }
        }
    }

    function renderIncomeAndMarketAnalysis() {
        const estimatedIncomeData = demographyData.map(row => {
            const dependent = row.usia0_14 + row.usia65_plus;
            const lowIncome = row.usia15_24;
            const productiveCore = row.usia25_39 + row.usia40_54 + row.usia55_64;
            let highIncome, middleIncome;
            if (row.ring === 1) {
                highIncome = Math.round(productiveCore * 0.30);
                middleIncome = productiveCore - highIncome;
            } else {
                highIncome = Math.round(productiveCore * 0.15);
                middleIncome = productiveCore - highIncome;
            }
            return { ...row, incomeDependent: dependent, incomeLow: lowIncome, incomeMiddle: middleIncome, incomeHigh: highIncome };
        });
        
        const incomeTableBody = document.getElementById('incomeTableBody');
        if (incomeTableBody) {
            incomeTableBody.innerHTML = estimatedIncomeData.map(row => `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium">${row.kecamatan}</td><td class="px-4 py-3">${row.kelurahan}</td>
                    <td class="px-2 py-3 text-center">${row.ring}</td><td class="px-4 py-3 text-center bg-red-50">${helpers.formatNumber(row.incomeDependent)}</td>
                    <td class="px-4 py-3 text-center bg-yellow-50">${helpers.formatNumber(row.incomeLow)}</td><td class="px-4 py-3 text-center bg-green-50">${helpers.formatNumber(row.incomeMiddle)}</td>
                    <td class="px-4 py-3 text-center bg-blue-50">${helpers.formatNumber(row.incomeHigh)}</td>
                </tr>`).join('');
        }

        const totalsByIncomeKecamatan = estimatedIncomeData.reduce((acc, row) => {
            const { kecamatan, incomeLow, incomeMiddle, incomeHigh } = row;
            if (!acc[kecamatan]) acc[kecamatan] = { low: 0, middle: 0, high: 0 };
            acc[kecamatan].low += incomeLow; acc[kecamatan].middle += incomeMiddle; acc[kecamatan].high += incomeHigh;
            return acc;
        }, {});
        const kecamatanNames = Object.keys(totalsByIncomeKecamatan);

        if (document.getElementById('incomeDistributionByKecamatanChart')) new Chart(document.getElementById('incomeDistributionByKecamatanChart'), { type: 'bar', data: { labels: kecamatanNames, datasets: [{ label: 'Low Income', data: kecamatanNames.map(k => totalsByIncomeKecamatan[k].low), backgroundColor: 'rgba(251, 191, 36, 0.7)' }, { label: 'Middle Income', data: kecamatanNames.map(k => totalsByIncomeKecamatan[k].middle), backgroundColor: 'rgba(52, 211, 153, 0.7)' }, { label: 'High Income', data: kecamatanNames.map(k => totalsByIncomeKecamatan[k].high), backgroundColor: 'rgba(96, 165, 250, 0.7)' }] }, options: { responsive: true, scales: { y: { ticks: { callback: (v) => helpers.formatNumber(v) } } }, plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${helpers.formatNumber(c.raw)}` } } } } });
        
        const incomeDonutsContainer = document.getElementById('kecamatanIncomeDonutsContainer');
        if (incomeDonutsContainer) {
            incomeDonutsContainer.innerHTML = '';
            const incomeColors = ['rgba(251, 191, 36, 0.8)', 'rgba(52, 211, 153, 0.8)', 'rgba(96, 165, 250, 0.8)'];
            kecamatanNames.forEach(kecamatan => {
                const data = totalsByIncomeKecamatan[kecamatan];
                const total = data.low + data.middle + data.high;
                if (total === 0) return;
                const chartWrapper = document.createElement('div');
                chartWrapper.className = 'text-center';
                chartWrapper.innerHTML = `<h4 class="text-md font-semibold text-gray-700 mb-2">${kecamatan}</h4><canvas></canvas>`;
                incomeDonutsContainer.appendChild(chartWrapper);
                new Chart(chartWrapper.querySelector('canvas'), { type: 'doughnut', data: { labels: ['Low Income', 'Middle Income', 'High Income'], datasets: [{ data: [data.low, data.middle, data.high], backgroundColor: incomeColors, hoverOffset: 4 }] }, options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${((c.raw / total) * 100).toFixed(1)}%` } } } } });
            });
        }

        const targetMarketData = estimatedIncomeData.reduce((acc, row) => {
            if (!acc[row.kecamatan]) acc[row.kecamatan] = { middleIncome: 0, highIncome: 0, age25_39: 0, age40_54: 0, age55_64: 0 };
            acc[row.kecamatan].middleIncome += row.incomeMiddle; acc[row.kecamatan].highIncome += row.incomeHigh;
            acc[row.kecamatan].age25_39 += row.usia25_39; acc[row.kecamatan].age40_54 += row.usia40_54; acc[row.kecamatan].age55_64 += row.usia55_64;
            return acc;
        }, {});
        
        if (document.getElementById('marketPotentialByKecamatanChart')) new Chart(document.getElementById('marketPotentialByKecamatanChart'), { type: 'bar', data: { labels: kecamatanNames, datasets: [{ label: 'Middle Income', data: kecamatanNames.map(k => targetMarketData[k].middleIncome), backgroundColor: 'rgba(52, 211, 153, 0.8)', stack: 'market' }, { label: 'High Income', data: kecamatanNames.map(k => targetMarketData[k].highIncome), backgroundColor: 'rgba(96, 165, 250, 0.8)', stack: 'market' }] }, options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: (v) => helpers.formatNumber(v) } } }, plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${helpers.formatNumber(c.raw)}` } } } } });
        
        const totalAge25_39 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age25_39, 0);
        const totalAge40_54 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age40_54, 0);
        const totalAge55_64 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age55_64, 0);
        const totalTargetMarket = totalAge25_39 + totalAge40_54 + totalAge55_64;
        if (document.getElementById('targetMarketAgeProfileChart')) new Chart(document.getElementById('targetMarketAgeProfileChart'), { type: 'doughnut', data: { labels: ['25-39 Thn', '40-54 Thn', '55-64 Thn'], datasets: [{ data: [totalAge25_39, totalAge40_54, totalAge55_64], backgroundColor: ['#2dd4bf', '#60a5fa', '#a78bfa'] }] }, options: { responsive: true, plugins: { tooltip: { callbacks: { label: (c) => `${c.label}: ${helpers.formatNumber(c.raw)} (${((c.raw / totalTargetMarket) * 100).toFixed(1)}%)` } } } } });

        const marketSummaryTableBody = document.getElementById('marketSummaryTableBody');
        if(marketSummaryTableBody) {
             marketSummaryTableBody.innerHTML = kecamatanNames.map(kecamatan => {
                 const data = targetMarketData[kecamatan];
                 return `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-4 py-4 font-medium">${kecamatan}</td><td class="px-4 py-4 text-center font-bold">${helpers.formatNumber(data.middleIncome + data.highIncome)}</td><td class="px-4 py-4 text-center">${helpers.formatNumber(data.age25_39)}</td><td class="px-4 py-4 text-center">${helpers.formatNumber(data.age40_54)}</td></tr>`;
             }).join('');
        }
        
        if (document.getElementById('competitorPriceChart')) new Chart(document.getElementById('competitorPriceChart'), { type: 'bar', data: { labels: ['Brawijaya', 'Ciputra', 'Le Grande', 'Graha Family', 'Pakuwon', 'Bukit Darmo'], datasets: [{ label: 'Harga (Guest/100 Bola)', data: [130000, 130000, 135000, 136000, 150000, 151500], backgroundColor: ['#22c55e', '#22c55e', '#3b82f6', '#3b82f6', '#ef4444', '#ef4444'] }] }, options: { indexAxis: 'y', responsive: true, scales: { x: { ticks: { callback: (v) => 'Rp ' + helpers.formatNumber(v) } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Rp ${helpers.formatNumber(c.raw)}` } } } } });
        if (document.getElementById('padelPriceChart')) new Chart(document.getElementById('padelPriceChart'), { type: 'bar', data: { labels: ['UNO', 'Puncak', 'Margomulyo', 'Playground', 'Homeground', 'Jungle', 'Graha'], datasets: [{ label: 'Harga (Peak / Jam)', data: [350000, 350000, 350000, 380000, 389000, 400000, 450000], backgroundColor: 'rgba(168, 85, 247, 0.7)' }] }, options: { indexAxis: 'y', responsive: true, scales: { x: { ticks: { callback: (v) => 'Rp ' + helpers.formatNumber(v) } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Rp ${helpers.formatNumber(c.raw)}` } } } } });
    }

    function renderSurveyAnalysis() {
        if (typeof surveyRawData === 'undefined' || !surveyRawData) return;

        const headers = ["Nama", "Perusahaan", "Posisi", "Domisili", "Kelompok Usia", "Status Pekerjaan", "Pengalaman Olahraga", "Minat Driving Range", "Frekuensi Driving Range", "Waktu Ideal Driving Range", "Biaya Wajar Driving Range", "Fitur Penting Driving Range", "Familiar PADEL", "Minat PADEL", "Frekuensi PADEL", "Waktu Ideal PADEL", "Biaya Sewa PADEL", "Fitur Penting PADEL", "Pilihan Fasilitas", "Pemanfaatan Fasilitas", "Pendorong Rutin", "Saran Lain"];
        const parsedSurveyData = surveyRawData.trim().split('\n').map(row => {
            const values = row.split('\t');
            let obj = {};
            headers.forEach((header, i) => { obj[header] = (values[i] || '').trim(); });
            return obj;
        });

        const surveyChartsContainer = document.getElementById('surveyChartsContainer');
        const feedbackList = document.getElementById('qualitativeFeedback');

        if (surveyChartsContainer) {
            surveyChartsContainer.innerHTML = '';
            const aggregateData = (data, key, isMultiSelect = false, separator = ', ') => data.reduce((acc, row) => {
                const answer = row[key];
                if (answer && !['-', 'na', 'tidak', 'ga tau', '', 'tidak tahu', 'tidka tertarik'].includes(answer.toLowerCase())) {
                    if (isMultiSelect) answer.split(separator).forEach(item => { const trimmed = item.trim(); if (trimmed) acc[trimmed] = (acc[trimmed] || 0) + 1; });
                    else acc[answer] = (acc[answer] || 0) + 1;
                }
                return acc;
            }, {});
            
            const createChart = (title, type, aggregatedData, options = {}) => {
                const chartWrapper = document.createElement('div');
                chartWrapper.className = 'bg-white p-6 rounded-lg shadow-md';
                chartWrapper.innerHTML = `<h3 class="text-xl font-semibold mb-4 text-gray-700">${title}</h3><canvas></canvas>`;
                surveyChartsContainer.appendChild(chartWrapper);
                const chartOptions = { responsive: true, plugins: { legend: { display: type === 'doughnut' }, tooltip: { callbacks: { label: (c) => `${c.label}: ${helpers.formatNumber(c.raw)}` } } }, ...options };
                new Chart(chartWrapper.querySelector('canvas'), { type, data: { labels: Object.keys(aggregatedData), datasets: [{ data: Object.values(aggregatedData), backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(236, 72, 153, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(20, 184, 166, 0.7)'], borderColor: 'rgba(255, 255, 255, 0.5)', borderWidth: 1 }] }, options: chartOptions });
            };

            createChart('Preferensi Fasilitas Utama', 'doughnut', aggregateData(parsedSurveyData, 'Pilihan Fasilitas'));
            createChart('Tingkat Minat Terhadap Lapangan PADEL', 'bar', aggregateData(parsedSurveyData, 'Minat PADEL'), { plugins: { legend: { display: false } } });
            createChart('Demografi Usia Responden', 'bar', aggregateData(parsedSurveyData, 'Kelompok Usia'), { plugins: { legend: { display: false } } });
            createChart('Fitur Padel Paling Penting', 'bar', aggregateData(parsedSurveyData, 'Fitur Penting PADEL', true), { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } } } } });
        }
        
        if (feedbackList) {
            feedbackList.innerHTML = '';
            const uniqueFeedbacks = [...new Set(parsedSurveyData.map(row => row['Saran Lain']).filter(fb => fb && fb.trim() && !['-','ok','cukup','tidak ada'].includes(fb.trim().toLowerCase())).map(fb => fb.trim()))];
            if (uniqueFeedbacks.length === 0) feedbackList.innerHTML = '<li>Tidak ada masukan kualitatif tambahan dari responden.</li>';
            else feedbackList.innerHTML = uniqueFeedbacks.map(fb => `<li>${fb}</li>`).join('');
        }
        
        // Deep Dive Section
        const choiceVsAgeCtx = document.getElementById('choiceVsAgeChart');
        if (choiceVsAgeCtx) { /* ... kode deep dive ... */ }
        const interestCorrelationCtx = document.getElementById('interestCorrelationChart');
        if (interestCorrelationCtx) { /* ... kode deep dive ... */ }
        const themedFeedbackContainer = document.getElementById('themedFeedbackContainer');
        if (themedFeedbackContainer) { /* ... kode deep dive ... */ }
    }

    function renderSampleSurveyCalculation() {
        const surveySampleSection = document.getElementById('survey-sample');
        if (!surveySampleSection) return;

        const totalPopulation = demographyData.reduce((sum, item) => sum + item.total, 0);
        const totalRing1 = demographyData.filter(d => d.ring === 1).reduce((sum, item) => sum + item.total, 0);
        const totalRing2 = demographyData.filter(d => d.ring === 2).reduce((sum, item) => sum + item.total, 0);
        
        const updateText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        updateText('sampleSize10', `${helpers.formatNumber(helpers.slovin(totalPopulation, 0.10))} Responden`);
        updateText('sampleSize5', `${helpers.formatNumber(helpers.slovin(totalPopulation, 0.05))} Responden`);
        updateText('sampleSize3', `${helpers.formatNumber(helpers.slovin(totalPopulation, 0.03))} Responden`);
        
        updateText('totalPopRing1', `(Total Populasi N = ${helpers.formatNumber(totalRing1)})`);
        updateText('sampleSizeRing1_10', helpers.formatNumber(helpers.slovin(totalRing1, 0.10)));
        updateText('sampleSizeRing1_5', helpers.formatNumber(helpers.slovin(totalRing1, 0.05)));
        updateText('sampleSizeRing1_3', helpers.formatNumber(helpers.slovin(totalRing1, 0.03)));

        updateText('totalPopRing2', `(Total Populasi N = ${helpers.formatNumber(totalRing2)})`);
        updateText('sampleSizeRing2_10', helpers.formatNumber(helpers.slovin(totalRing2, 0.10)));
        updateText('sampleSizeRing2_5', helpers.formatNumber(helpers.slovin(totalRing2, 0.05)));
        updateText('sampleSizeRing2_3', helpers.formatNumber(helpers.slovin(totalRing2, 0.03)));
    }

    function renderEconomicAndTechnicalAnalysis() {
        // Gabungkan kedua fungsi ini karena mereka tidak interaktif dan hanya perlu render sekali
        const economicImpactTableBody = document.getElementById('economicImpactTableBody');
        const multiplierDiagramContainer = document.getElementById('multiplierEffectDiagram');
        const technicalContainer = document.getElementById('technicalAnalysisContainer');

        if (economicImpactTableBody && multiplierDiagramContainer) {
            // Ambil data terbaru dari hasil kalkulasi
            const summary = projectConfig.calculations.getFinancialSummary();
            const dr = summary.drivingRange;
            const padel = summary.padel;
            const combined = summary.combined;

            const totalCapex = combined.capex.total;
            const totalOpexTahunan = dr.pnl.annualOpex + padel.pnl.annualOpex;
            const gajiTahunan = (projectConfig.calculations._calculateTotal(projectConfig.drivingRange.opexMonthly.salaries_wages) + 
                                projectConfig.calculations._calculateTotal(projectConfig.padel.opexMonthly.salaries_wages)) * 12;
            const utilitasTahunan = (projectConfig.calculations._calculateTotal(projectConfig.drivingRange.opexMonthly.utilities) + 
                                    projectConfig.calculations._calculateTotal(projectConfig.padel.opexMonthly.utilities)) * 12;

            const pendapatanTahunan = combined.pnl.annualRevenue;

            const impactData = [
                { 
                    category: 'Penciptaan Lapangan Kerja', 
                    description: 'Pekerjaan langsung yang tercipta untuk mengoperasikan fasilitas (manajer, admin, pelatih, staf kebersihan, dll).', 
                    contribution: `~20-25 FTE (Full-Time Equivalent)<br><span class='text-xs text-gray-500'>Estimasi Gaji & Upah: <strong>Rp ${helpers.formatNumber(gajiTahunan)} / tahun</strong></span>` 
                },
                { 
                    category: 'Investasi Lokal (Konstruksi)', 
                    description: 'Belanja modal yang dialokasikan kepada kontraktor, pemasok material, dan tenaga kerja lokal selama fase pembangunan.', 
                    contribution: `~60-70% dari Total CapEx<br><span class='text-xs text-gray-500'>Estimasi Nilai Kontrak Lokal: <strong>~Rp ${helpers.formatNumber(totalCapex * 0.65)}</strong> (sekali bayar)</span>` 
                },
                { 
                    category: 'Pendapatan Pajak Daerah', 
                    description: 'Kontribusi langsung ke kas daerah melalui PBB, Pajak Restoran (10%), dan Pajak Hiburan (variatif).', 
                    contribution: `Estimasi <strong>Rp ${helpers.formatNumber(pendapatanTahunan * 0.05)} - ${helpers.formatNumber(pendapatanTahunan * 0.08)} / tahun</strong><br><span class='text-xs text-gray-500'>Tergantung tarif pajak final yang berlaku</span>`
                },
                { isHeader: true, title: 'II. Dampak Ekonomi Tidak Langsung (Indirect Impact)' },
                { 
                    category: 'Aktivasi Rantai Pasok Lokal', 
                    description: 'Permintaan rutin untuk barang dan jasa dari bisnis lokal (pemasok F&B, jasa laundry, ATK, dll).', 
                    contribution: `Estimasi Belanja Operasional Non-Gaji: <strong>Rp ${helpers.formatNumber(totalOpexTahunan - gajiTahunan)} / tahun</strong>` 
                },
                { 
                    category: 'Peningkatan Nilai Properti', 
                    description: 'Kehadiran fasilitas olahraga dan gaya hidup modern berpotensi meningkatkan daya tarik dan nilai properti di kawasan sekitar.', 
                    contribution: `Analisis Kualitatif: Positif<br><span class='text-xs text-gray-500'>Dapat meningkatkan NJOP dalam 5-10 tahun</span>` 
                },
                { 
                    category: 'Potensi Pariwisata Olahraga', 
                    description: 'Menarik pengunjung dari luar kota melalui penyelenggaraan turnamen (Padel/Golf) tingkat regional atau nasional.', 
                    contribution: `Potensi belanja turis di sektor akomodasi, kuliner, dan transportasi lokal.` 
                },
                { isHeader: true, title: 'III. Dampak Sosial (Social Impact)' },
                { 
                    category: 'Kesehatan & Kesejahteraan', 
                    description: 'Menyediakan ruang publik yang aman dan sehat untuk aktivitas fisik dan interaksi sosial.', 
                    contribution: `~150.000+ jam olahraga difasilitasi per tahun<br><span class='text-xs text-gray-500'>Mendorong gaya hidup aktif bagi masyarakat</span>`
                },
                { 
                    category: 'Pembangunan Komunitas', 
                    description: 'Menjadi "Third Place" yang memfasilitasi terbentuknya komunitas baru dan memperkuat ikatan sosial.', 
                    contribution: `Target menjadi "home-base" bagi 10+ komunitas olahraga dan sosial.`
                },
                { 
                    category: 'Peningkatan Citra Kawasan', 
                    description: 'Mengubah citra SIER dari kawasan industri murni menjadi destinasi gaya hidup yang dinamis.', 
                    contribution: `Meningkatkan *place branding* dan daya tarik kawasan bagi talenta dan investor baru.`
                }
            ];
            
            economicImpactTableBody.innerHTML = ''; // Kosongkan placeholder
            impactData.forEach(item => {
                const tr = document.createElement('tr');
                if (item.isHeader) {
                    tr.className = 'bg-gray-100';
                    tr.innerHTML = `<td colspan="3" class="px-4 py-3 font-bold text-gray-700">${item.title}</td>`;
                } else {
                    tr.className = 'bg-white border-b hover:bg-gray-50';
                    tr.innerHTML = `
                        <td class="px-4 py-4 font-semibold text-gray-800 align-top">${item.category}</td>
                        <td class="px-4 py-4 align-top">${item.description}</td>
                        <td class="px-4 py-4 align-top">${item.contribution}</td>
                    `;
                }
                economicImpactTableBody.appendChild(tr);
            });

            multiplierDiagramContainer.innerHTML = `
                <div class="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
                    <div class="p-4 bg-blue-600 text-white rounded-lg shadow-lg">
                        <h4 class="font-bold text-lg">PROYEK SIER<br>SPORTS HUB</h4>
                        <p class="text-sm">Belanja Operasional Tahunan<br><strong>Rp ${helpers.formatNumber(totalOpexTahunan)}</strong></p>
                    </div>
                    <div class="text-3xl text-gray-400 font-light transform md:-translate-y-4">→</div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-3 bg-green-100 text-green-800 rounded-md text-center">
                            <span class="font-bold">Gaji Karyawan</span><span class="block text-xs">Rp ${helpers.formatNumber(gajiTahunan)}</span>
                        </div>
                        <div class="p-3 bg-yellow-100 text-yellow-800 rounded-md text-center">
                            <span class="font-bold">Pemasok F&B</span><span class="block text-xs">Estimasi</span>
                        </div>
                        <div class="p-3 bg-purple-100 text-purple-800 rounded-md text-center">
                            <span class="font-bold">Utilitas</span><span class="block text-xs">Rp ${helpers.formatNumber(utilitasTahunan)}</span>
                        </div>
                        <div class="p-3 bg-pink-100 text-pink-800 rounded-md text-center">
                            <span class="font-bold">Jasa Lain</span><span class="block text-xs">(Laundry, Keamanan)</span>
                        </div>
                    </div>
                    <div class="text-3xl text-gray-400 font-light transform md:-translate-y-4">→</div>
                    <div class="p-4 bg-gray-700 text-white rounded-lg shadow-lg">
                        <h4 class="font-bold text-lg">EKONOMI LOKAL</h4>
                        <p class="text-sm">Karyawan berbelanja,<br>Pemasok menggaji staf,<br>menciptakan efek berantai.</p>
                    </div>
                </div>`;
        }

        if (technicalContainer) {
            const technicalData = [
                {
                    title: '1. Tata Letak (Layout) & Zonasi',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>`,
                    summary: 'Tujuan utama adalah menciptakan alur pengunjung yang lancar, memisahkan area bising dan tenang, serta memastikan efisiensi operasional bagi staf.',
                    points: [
                        { aspect: 'Zonasi Pengalaman', recommendation: 'Area F&B dan lounge harus dirancang sebagai "oase tenang" yang terpisah secara visual dan akustik dari area lapangan. Terapkan kebijakan <strong>100% bebas rokok</strong> di seluruh zona, termasuk outdoor, sebagai nilai jual utama.' },
                        { aspect: 'Alur & Aksesibilitas', recommendation: 'Desain sirkulasi satu arah untuk masuk dan keluar jika memungkinkan. Pastikan akses mudah ke toilet dari semua area. Rencanakan jalur servis terpisah untuk staf dan pengiriman F&B.' },
                        { aspect: 'Parkir', recommendation: 'Alokasikan area parkir yang memadai dengan pencahayaan yang baik dan keamanan. Pertimbangkan parkir valet sebagai layanan premium saat event besar.' }
                    ]
                },
                {
                    title: '2. Spesifikasi Lapangan',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 18.528c-3.268-1.54-5-4.442-5-7.792 0-3.236 1.732-6.258 5-7.792v15.584z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.5 3.037a10.025 10.025 0 017.5 7.49C20 14.538 18.232 17.56 15 19.1" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4a1 1 0 100-2 1 1 0 000 2z" /></svg>`,
                    summary: 'Kualitas lapangan adalah inti dari produk. Standar yang digunakan harus memenuhi ekspektasi pemain serius untuk membangun reputasi dan justifikasi harga premium.',
                    points: [
                        { aspect: 'Driving Range', recommendation: 'Gunakan matras dual-surface. Alokasikan <strong>3-5 bay sebagai "Premium Bay"</strong> yang dilengkapi teknologi ball-tracking (seperti Toptracer) dengan biaya tambahan. Jaring pengaman harus memiliki ketinggian minimal 30 meter.' },
                        { aspect: 'Padel', recommendation: 'Gunakan lapangan berstandar WPT (misal: rumput Mondo Supercourt, kaca tempered 12mm). Pasang sistem pencahayaan LED indirect (tidak langsung menyorot pemain) dengan tingkat LUX > 300 untuk permainan malam yang optimal dan bebas silau.' },
                        { aspect: 'Maintenance', recommendation: 'Buat jadwal inspeksi harian (bola, matras, jaring) dan mingguan (rumput, kaca). Ini adalah investasi, bukan biaya.' }
                    ]
                },
                {
                    title: '3. Sistem & Teknologi',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>`,
                    summary: 'Teknologi adalah kunci untuk efisiensi operasional dan pengalaman pelanggan yang modern. Ini adalah area di mana banyak kompetitor masih lemah.',
                    points: [
                        { aspect: 'Booking & Membership', recommendation: 'Investasi pada <strong>sistem booking online yang handal dan terintegrasi</strong> dengan pembayaran. Sistem ini harus mampu mengelola jadwal, membership, dan promo secara otomatis.' },
                        { aspect: 'Point of Sale (POS)', recommendation: 'Gunakan sistem POS berbasis cloud untuk F&B dan Pro Shop. Ini memungkinkan pemantauan penjualan dan inventaris secara real-time dari mana saja.' },
                        { aspect: 'Konektivitas', recommendation: 'Sediakan Wi-Fi gratis berkecepatan tinggi di seluruh area, termasuk area lapangan. Ini adalah ekspektasi dasar bagi target pasar profesional muda.' }
                    ]
                },
                {
                    title: '4. Rencana Operasional & SDM',
                    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`,
                    summary: 'Staf adalah wajah dari brand. Kualitas layanan akan menjadi pembeda utama dari kompetitor. Investasi pada SDM adalah investasi pada loyalitas pelanggan.',
                    points: [
                        { aspect: 'Struktur & Peran', recommendation: 'Rekrut seorang <strong>General Manager</strong> dengan latar belakang perhotelan atau manajemen klub. Staf lapangan bukan hanya "penjaga", tetapi <strong>"Experience Host"</strong> yang proaktif.' },
                        { aspect: 'SOP & Pelatihan', recommendation: 'Buat buku panduan SOP yang detail untuk semua skenario (kebersihan, keluhan, darurat). Adakan <strong>pelatihan hospitality wajib</strong> bagi seluruh staf, dari manajer hingga petugas kebersihan.' },
                        { aspect: 'Pengukuran Kinerja', recommendation: 'Jadikan <strong>rating kepuasan pelanggan (dari ulasan online & survei internal) dan skor kebersihan fasilitas</strong> sebagai KPI utama bagi tim operasional.' }
                    ]
                }
            ];

            technicalContainer.innerHTML = ''; // Kosongkan kontainer
            technicalData.forEach(section => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'p-5 border rounded-lg shadow-sm';
                
                let pointsHtml = section.points.map(point => `
                    <div class="mt-4">
                        <h5 class="font-semibold text-gray-700">${point.aspect}</h5>
                        <p class="text-sm text-gray-600 pl-4 border-l-2 border-gray-200 ml-1 mt-1">${point.recommendation}</p>
                    </div>
                `).join('');

                sectionDiv.innerHTML = `
                    <div class="flex items-center">
                        <div class="flex-shrink-0 bg-gray-700 rounded-md p-2">
                            ${section.icon}
                        </div>
                        <div class="ml-4">
                            <h3 class="text-xl font-bold text-gray-800">${section.title}</h3>
                            <p class="text-sm text-gray-500">${section.summary}</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t">
                        ${pointsHtml}
                    </div>
                `;
                technicalContainer.appendChild(sectionDiv);
            });
        }
    }

    function renderFinancialAssumptions() {
        const container = document.getElementById('assumptions-container');
        if (!container) return;

        const { assumptions: globalAssumptions, drivingRange, padel, keyTranslations } = projectConfig;

        const createEditableRow = (key, value, path, isOpex = false) => {
            const translatedKey = keyTranslations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            let displayValue;
            let inputValue = value;

            if ((key.includes('rate') || key.includes('okupansi')) && value < 2 && value > 0) {
                displayValue = `${(value * 100).toFixed(1)}%`;
                inputValue = value;
            } else {
                displayValue = helpers.formatNumber(value);
                inputValue = value;
            }

            const unit = isOpex ? ' <span class="text-gray-400">/ bulan</span>' : '';

            return `
                <tr class="border-b group">
                    <td class="py-3 px-4 font-semibold text-gray-700 w-2/5">${translatedKey}</td>
                    <td class="py-3 px-4 text-gray-800 relative">
                        <span class="value-display">${displayValue}${unit}</span>
                        <input type="number" step="any" value="${inputValue}" data-path="${path}" class="value-input absolute top-2 left-2 w-3/4 p-1 border rounded shadow-sm hidden">
                        <a href="#" class="edit-icon text-gray-400 hover:text-blue-600 absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" data-path="${path}">✎</a>
                    </td>
                </tr>
            `;
        };
        
        const createTableFromObject = (data, basePath, title, isOpex = false) => {
            let rowsHtml = Object.entries(data).map(([key, value]) => {
                const currentPath = `${basePath}.${key}`;
                if (typeof value === 'object' && value !== null && !('count' in value && 'salary' in value) && !('electricity_kwh_price' in value)) {
                     let subRows = Object.entries(value).map(([subKey, subValue]) => {
                        const subPath = `${currentPath}.${subKey}`;
                        // Cek jika subValue adalah objek (misal: occupancy_rate_per_day)
                        if(typeof subValue === 'object' && subValue !== null) {
                             let nestedSubRows = Object.entries(subValue).map(([nestedKey, nestedValue]) => {
                                const nestedPath = `${subPath}.${nestedKey}`;
                                const translatedNestedKey = keyTranslations[nestedKey] || nestedKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                return `<li class="flex justify-between items-center ml-4">
                                            <span>${translatedNestedKey}:</span>
                                            <span class="relative group">
                                                <span class="value-display">${helpers.formatNumber(nestedValue)}</span>
                                                <input type="number" step="any" value="${nestedValue}" data-path="${nestedPath}" class="value-input absolute top-0 right-14 w-24 p-1 border rounded shadow-sm hidden">
                                                <a href="#" class="edit-icon text-gray-400 hover:text-blue-600 ml-2 opacity-0 group-hover:opacity-100" data-path="${nestedPath}">✎</a>
                                            </span>
                                        </li>`;
                             }).join('');
                             const translatedSubKey = keyTranslations[subKey] || subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                             return `<div><span class="font-medium">${translatedSubKey}:</span><ul class="space-y-1">${nestedSubRows}</ul></div>`;
                        } else {
                            const translatedSubKey = keyTranslations[subKey] || subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            return `<li class="flex justify-between items-center">
                                        <span class="font-medium">${translatedSubKey}:</span>
                                        <span class="relative group">
                                            <span class="value-display">${helpers.formatNumber(subValue)}</span>
                                            <input type="number" step="any" value="${subValue}" data-path="${subPath}" class="value-input absolute top-0 right-14 w-24 p-1 border rounded shadow-sm hidden">
                                            <a href="#" class="edit-icon text-gray-400 hover:text-blue-600 ml-2 opacity-0 group-hover:opacity-100" data-path="${subPath}">✎</a>
                                        </span>
                                    </li>`;
                        }

                    }).join('<div class="my-2"></div>');
                    const translatedKey = keyTranslations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return `<tr class="border-b"><td class="py-3 px-4 font-semibold text-gray-700 w-2/5 align-top">${translatedKey}</td><td class="py-3 px-4 text-gray-600"><div class="space-y-2">${subRows}</div></td></tr>`;
                } else {
                    return createEditableRow(key, value, currentPath, isOpex);
                }
            }).join('');
            return `<h4 class="text-lg font-semibold text-gray-700 mb-2">${title}</h4><table class="w-full text-sm"><tbody>${rowsHtml}</tbody></table>`;
        };

        container.innerHTML = `
            <div><h3 class="text-xl font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">A. Asumsi Global</h3>${createTableFromObject(globalAssumptions, 'assumptions', '')}</div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12 pt-6 border-t">
                <div>
                    <h3 class="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">B. Model Bisnis Driving Range</h3>
                    <div class="space-y-6">
                        ${createTableFromObject(drivingRange.operational_assumptions, 'drivingRange.operational_assumptions', 'Asumsi Operasional')}
                        ${createTableFromObject(drivingRange.revenue, 'drivingRange.revenue', 'Unit Pendapatan')}
                        ${createTableFromObject(drivingRange.opexMonthly, 'drivingRange.opexMonthly', 'Biaya Operasional Bulanan', true)}
                    </div>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">C. Model Bisnis Padel</h3>
                    <div class="space-y-6">
                        ${createTableFromObject(padel.operational_assumptions, 'padel.operational_assumptions', 'Asumsi Operasional')}
                        ${createTableFromObject(padel.revenue, 'padel.revenue', 'Unit Pendapatan')}
                        ${createTableFromObject(padel.opexMonthly, 'padel.opexMonthly', 'Biaya Operasional Bulanan', true)}
                    </div>
                </div>
            </div>
        `;
    }

    function refactorPadelBusinessAnalysis() {
        const bepContainer = document.querySelector('#business-strategy-analysis');
        if (!bepContainer) return false;

        const bepResultContainer = bepContainer.querySelector('.bg-blue-50');
        if (!bepResultContainer) return false;

        // PERBAIKAN: Gunakan getFinancialSummary untuk mendapatkan data, bukan getMonthlyRevenue
        const summary = projectConfig.calculations.getFinancialSummary();
        const padelData = summary.padel;
        const p_config = projectConfig.padel;
        const o_assumptions = p_config.operational_assumptions;

        // Total Biaya Tetap Bulanan HANYA untuk Padel (total opex - cogs)
        const fixedCostMonthlyPadel = padelData.opex.total;
        
        // Pendapatan rata-rata per jam
        const totalRevenueMonthly = padelData.revenue.total;

        // Hitung total jam terjual per bulan
        const m = p_config.revenue.main_revenue;
        const hours_wd_off = m.courts * m.hours_distribution_per_day.offpeak * m.occupancy_rate.weekday_offpeak;
        const hours_wd_peak = m.courts * m.hours_distribution_per_day.peak * m.occupancy_rate.weekday_peak;
        const hours_we = m.courts * o_assumptions.operational_hours_per_day * m.occupancy_rate.weekend;
        const totalHoursBookedMonthly = (hours_wd_off + hours_wd_peak) * o_assumptions.workdays_in_month + hours_we * o_assumptions.weekend_days_in_month;
        
        // Margin kontribusi (Pendapatan Total - COGS) / Total Jam
        const contributionMarginPerHour = (totalRevenueMonthly - padelData.opex.cogs) / totalHoursBookedMonthly;

        // Titik Impas dalam Jam
        const bepHoursMonthly = fixedCostMonthlyPadel / contributionMarginPerHour;
        const bepHoursDaily = bepHoursMonthly / (o_assumptions.workdays_in_month + o_assumptions.weekend_days_in_month);
        const bepHoursPerCourtDaily = bepHoursDaily / m.courts;

        bepResultContainer.innerHTML = `
            <p class="text-sm text-gray-600">Jam Sewa Minimum per Bulan (BEP)</p>
            <p class="text-3xl font-bold text-blue-700">${Math.ceil(bepHoursMonthly)} Jam</p>
            <p class="text-sm text-gray-600 mt-3">Target per Hari (untuk ${m.courts} Lapangan)</p>
            <p class="text-2xl font-bold text-blue-700">~${bepHoursDaily.toFixed(1)} Jam Sewa</p>
            <p class="text-sm text-gray-600 mt-1">(Rata-rata ~${bepHoursPerCourtDaily.toFixed(1)} jam per lapangan per hari)</p>
        `;

        return true;
    }

    function refactorRiskAnalysis() {
        const riskTable = document.querySelector('#risk-analysis table');
        if (!riskTable) return false;

        const tbody = riskTable.querySelector('tbody');

        // PERBAIKAN: Gunakan getFinancialSummary untuk mendapatkan PNL, bukan calculatePnl
        const realisticSummary = projectConfig.calculations.getFinancialSummary();
        const pessimisticSummary = projectConfig.calculations.getFinancialSummary(0.85, 1.10);
        
        const realisticPnl = realisticSummary.combined.pnl;
        const pessimisticPnl = pessimisticSummary.combined.pnl;
        const profitDrop = realisticPnl.netProfit - pessimisticPnl.netProfit;
        
        const newRow = document.createElement('tr');
        newRow.className = 'bg-white border-b hover:bg-gray-50';
        newRow.innerHTML = `
            <td class="px-4 py-4 font-semibold align-top">Pasar & Finansial</td>
            <td class="px-4 py-4">
                <strong>Permintaan Lebih Rendah & Biaya Lebih Tinggi</strong><br>
                Kombinasi okupansi turun 15% dan biaya operasional naik 10% (Skenario Pesimis).
            </td>
            <td class="px-4 py-4 text-center align-middle"><span class="bg-yellow-100 text-yellow-800">Medium</span></td>
            <td class="px-4 py-4 text-center align-middle"><span class="bg-red-100 text-red-800">Tinggi</span></td>
            <td class="px-4 py-4">
                <ul class="list-disc pl-4 space-y-1">
                    <li>Dampak Kuantitatif: Penurunan Laba Bersih Tahunan sebesar <strong>~Rp ${formatNumber(profitDrop)}</strong>.</li>
                    <li>Mitigasi: Strategi marketing agresif, program loyalitas & membership, efisiensi operasional.</li>
                </ul>
            </td>
        `;

        const rows = tbody.querySelectorAll('tr');
        let rowFoundAndReplaced = false;
        rows.forEach(row => {
            if (row.innerText.includes('Permintaan Lebih Rendah')) {
                tbody.replaceChild(newRow, row);
                rowFoundAndReplaced = true;
            }
        });

        // Jika tidak ada baris yang cocok, tambahkan saja di awal
        if (!rowFoundAndReplaced) {
            tbody.prepend(newRow);
        }

        return true;
    }

    function updateAllVisuals() {
        console.log("Updating all visuals...");
        // Daftar ini harus berisi nama semua fungsi render Anda
        const renderFunctions = [
            renderFinancialAnalysis,
            renderDemographyAndCharts,
            renderDetailedDemography,
            renderIncomeAndMarketAnalysis,
            renderSurveyAnalysis,
            renderSampleSurveyCalculation,
            renderEconomicAndTechnicalAnalysis
            renderFinancialAssumptions,
            refactorPadelBusinessAnalysis,
            refactorRiskAnalysis
        ];
        
        renderFunctions.forEach(fn => {
            helpers.tryToRender(fn);
        });
    }

    function setupEventListeners() {
        const assumptionsContainer = document.getElementById('assumptions-container');
        if (!assumptionsContainer) return;
        
        const getValueByPath = (obj, path) => path.split('.').reduce((o, k) => (o && o[k] !== 'undefined') ? o[k] : undefined, obj);
        const setValueByPath = (obj, path, value) => {
            const keys = path.split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
            target[lastKey] = value;
        };

        assumptionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-icon')) {
                e.preventDefault();
                const container = e.target.parentElement;
                container.querySelector('.value-display').classList.add('hidden');
                e.target.classList.add('hidden');
                const inputField = container.querySelector('.value-input');
                inputField.classList.remove('hidden');
                inputField.focus();
                inputField.select();
            }
        });

        const handleInputFinish = (inputField) => {
            const newValue = parseFloat(inputField.value);
            const targetPath = inputField.dataset.path;
            
            if (!isNaN(newValue)) {
                setValueByPath(projectConfig, targetPath, newValue);
                updateAllVisuals(); // Pemicu utama
            } else {
                 // Jika input tidak valid, kembalikan seperti semula
                const container = inputField.parentElement;
                inputField.classList.add('hidden');
                container.querySelector('.value-display').classList.remove('hidden');
                container.querySelector('.edit-icon').classList.remove('hidden');
            }
        };

        assumptionsContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('value-input')) {
                handleInputFinish(e.target);
            }
        });
        
        assumptionsContainer.addEventListener('blur', (e) => {
             if (e.target.classList.contains('value-input')) {
                handleInputFinish(e.target);
            }
        }, true); // Gunakan capture phase untuk menangani blur

        assumptionsContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('value-input')) {
                e.preventDefault();
                handleInputFinish(e.target);
            } else if (e.key === 'Escape' && e.target.classList.contains('value-input')) {
                e.preventDefault();
                // Batalkan edit
                const container = e.target.parentElement;
                e.target.value = getValueByPath(projectConfig, e.target.dataset.path); // reset value
                e.target.classList.add('hidden');
                container.querySelector('.value-display').classList.remove('hidden');
                container.querySelector('.edit-icon').classList.remove('hidden');
            }
        });
    }
    
    // --- (BARU) PANGGIL FUNGSI MASTER SAAT HALAMAN PERTAMA KALI DIMUAT ---
    updateAllVisuals();
    setupEventListeners();

});