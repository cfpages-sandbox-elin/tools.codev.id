// File: sier-visual.js

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPER FUNCTIONS ---

    // Helper function to format numbers with dots
    function formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    }

    // Slovin's Formula for sample size calculation
    const slovin = (N, e) => Math.ceil(N / (1 + N * e * e));

    // --- DATA PROCESSING (Demographics) ---

    // 1. Total Population
    const totalPopulation = demographyData.reduce((sum, item) => sum + item.total, 0);

    // 2. Total by Ring
    const totalRing1 = demographyData.filter(d => d.ring === 1).reduce((sum, item) => sum + item.total, 0);
    const totalRing2 = demographyData.filter(d => d.ring === 2).reduce((sum, item) => sum + item.total, 0);

    // 3. Total by Age Group
    const totalsByAge = {
        '0-14 Thn': demographyData.reduce((sum, item) => sum + item.usia0_14, 0),
        '15-24 Thn': demographyData.reduce((sum, item) => sum + item.usia15_24, 0),
        '25-39 Thn': demographyData.reduce((sum, item) => sum + item.usia25_39, 0),
        '40-54 Thn': demographyData.reduce((sum, item) => sum + item.usia40_54, 0),
        '55-64 Thn': demographyData.reduce((sum, item) => sum + item.usia55_64, 0),
        '65+ Thn': demographyData.reduce((sum, item) => sum + item.usia65_plus, 0),
    };

    // 4. Total Productive vs Non-Productive & Dependency Ratio
    const totalProductive = totalsByAge['15-24 Thn'] + totalsByAge['25-39 Thn'] + totalsByAge['40-54 Thn'] + totalsByAge['55-64 Thn'];
    const totalNonProductive = totalsByAge['0-14 Thn'] + totalsByAge['65+ Thn'];
    const dependencyRatio = totalProductive > 0 ? ((totalNonProductive / totalProductive) * 100).toFixed(2) : 0;

    // 5. Total by Kecamatan
    const totalsByKecamatan = demographyData.reduce((acc, curr) => {
        if (!acc[curr.kecamatan]) {
            acc[curr.kecamatan] = 0;
        }
        acc[curr.kecamatan] += curr.total;
        return acc;
    }, {});


    // --- DOM MANIPULATION (Fill Summary Cards & Tables) ---

    // Fill Summary Cards
    document.getElementById('totalPenduduk').innerText = formatNumber(totalPopulation);
    document.getElementById('totalRing1').innerText = formatNumber(totalRing1);
    document.getElementById('totalRing2').innerText = formatNumber(totalRing2);
    document.getElementById('dependencyRatio').innerText = dependencyRatio;

    // Fill Demographics Data Table
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = ''; // Clear existing
    demographyData.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'bg-white border-b hover:bg-gray-50';
        tr.innerHTML = `
            <td class="px-3 py-4 font-medium text-gray-900 whitespace-nowrap">${row.kecamatan}</td>
            <td class="px-3 py-4">${row.kelurahan}</td>
            <td class="px-3 py-4 text-center">${formatNumber(row.total)}</td>
            <td class="px-3 py-4 text-center">${formatNumber(row.usia0_14)}</td>
            <td class="px-3 py-4 text-center">${formatNumber(row.usia15_24)}</td>
            <td class="px-3 py-4 text-center">${formatNumber(row.usia25_39)}</td>
            <td class="px-3 py-4 text-center">${formatNumber(row.usia40_54)}</td>
            <td class="px-3 py-4 text-center">${formatNumber(row.usia55_64)}</td>
            <td class="px-3 py-4 text-center">${formatNumber(row.usia65_plus)}</td>
            <td class="px-3 py-4 text-center">${row.ring}</td>
        `;
        tableBody.appendChild(tr);
    });


    // --- RENDER DEMOGRAPHIC CHARTS ---

    // Chart 1: Ring Chart
    new Chart(document.getElementById('ringChart'), {
        type: 'doughnut',
        data: {
            labels: ['Ring 1', 'Ring 2'],
            datasets: [{
                label: 'Total Populasi',
                data: [totalRing1, totalRing2],
                backgroundColor: ['#10B981', '#F59E0B'], // green-500, yellow-500
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${formatNumber(context.raw)}` } }
            }
        }
    });

    // Chart 2: Age Distribution Chart
    new Chart(document.getElementById('ageDistributionChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(totalsByAge),
            datasets: [{
                label: 'Total Penduduk',
                data: Object.values(totalsByAge),
                backgroundColor: 'rgba(59, 130, 246, 0.7)', // blue-500 with opacity
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { callback: (value) => formatNumber(value) } } },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatNumber(context.raw)}` } }
            }
        }
    });

    // Chart 3: Productive Ratio Chart
    new Chart(document.getElementById('productiveRatioChart'), {
        type: 'doughnut',
        data: {
            labels: ['Usia Produktif (15-64 Thn)', 'Usia Non-Produktif (0-14 & 65+ Thn)'],
            datasets: [{
                label: 'Populasi',
                data: [totalProductive, totalNonProductive],
                backgroundColor: ['#2563EB', '#DC2626'], // blue-700, red-600
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${formatNumber(context.raw)}` } }
            }
        }
    });

    // Chart 4: Kecamatan Chart (Horizontal Bar)
    new Chart(document.getElementById('kecamatanChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(totalsByKecamatan),
            datasets: [{
                label: 'Total Populasi',
                data: Object.values(totalsByKecamatan),
                backgroundColor: ['#8B5CF6', '#EC4899', '#F97316', '#14B8A6'], // violet, pink, orange, teal
                borderColor: '#ffffff',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y', // This makes the bar chart horizontal
            responsive: true,
            scales: { x: { beginAtZero: true, ticks: { callback: (value) => formatNumber(value) } } },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatNumber(context.raw)}` } }
            }
        }
    });


    // --- DETAILED AGE ANALYSIS ---
    (function renderDetailedAgeAnalysis() {
        const ageLabels = ['0-14 Thn', '15-24 Thn', '25-39 Thn', '40-54 Thn', '55-64 Thn', '65+ Thn'];
        
        // Data Processing for Age per Ring
        const totalsByAgeRing1 = { '0-14 Thn': 0, '15-24 Thn': 0, '25-39 Thn': 0, '40-54 Thn': 0, '55-64 Thn': 0, '65+ Thn': 0 };
        const totalsByAgeRing2 = { '0-14 Thn': 0, '15-24 Thn': 0, '25-39 Thn': 0, '40-54 Thn': 0, '55-64 Thn': 0, '65+ Thn': 0 };

        demographyData.forEach(row => {
            const target = row.ring === 1 ? totalsByAgeRing1 : totalsByAgeRing2;
            target['0-14 Thn'] += row.usia0_14;
            target['15-24 Thn'] += row.usia15_24;
            target['25-39 Thn'] += row.usia25_39;
            target['40-54 Thn'] += row.usia40_54;
            target['55-64 Thn'] += row.usia55_64;
            target['65+ Thn'] += row.usia65_plus;
        });

        // Charting for Age per Ring (Grouped Bar)
        new Chart(document.getElementById('ageDistributionByRingChart'), {
            type: 'bar',
            data: {
                labels: ageLabels,
                datasets: [
                    { label: 'Ring 1', data: Object.values(totalsByAgeRing1), backgroundColor: 'rgba(22, 163, 74, 0.7)' },
                    { label: 'Ring 2', data: Object.values(totalsByAgeRing2), backgroundColor: 'rgba(245, 158, 11, 0.7)' }
                ]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true, ticks: { callback: (value) => formatNumber(value) } } },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatNumber(context.raw)}` } }
                }
            }
        });

        // Data Processing for Age per Kecamatan
        const totalsByAgeKecamatan = demographyData.reduce((acc, row) => {
            const { kecamatan } = row;
            if (!acc[kecamatan]) {
                acc[kecamatan] = { '0-14 Thn': 0, '15-24 Thn': 0, '25-39 Thn': 0, '40-54 Thn': 0, '55-64 Thn': 0, '65+ Thn': 0 };
            }
            acc[kecamatan]['0-14 Thn'] += row.usia0_14;
            acc[kecamatan]['15-24 Thn'] += row.usia15_24;
            acc[kecamatan]['25-39 Thn'] += row.usia25_39;
            acc[kecamatan]['40-54 Thn'] += row.usia40_54;
            acc[kecamatan]['55-64 Thn'] += row.usia55_64;
            acc[kecamatan]['65+ Thn'] += row.usia65_plus;
            return acc;
        }, {});

        // Charting for Each Kecamatan (Dynamically)
        const kecamatanChartsContainer = document.getElementById('kecamatanAgeChartsContainer');
        const kecamatanColors = ['rgba(59, 130, 246, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(236, 72, 153, 0.7)', 'rgba(20, 184, 166, 0.7)'];
        let colorIndex = 0;

        for (const kecamatanName in totalsByAgeKecamatan) {
            const chartWrapper = document.createElement('div');
            chartWrapper.innerHTML = `
                <h4 class="text-lg font-semibold text-center mb-2 text-gray-700">${kecamatanName}</h4>
                <canvas id="chart-kecamatan-${kecamatanName.replace(/\s+/g, '-').toLowerCase()}"></canvas>
            `;
            kecamatanChartsContainer.appendChild(chartWrapper);

            new Chart(chartWrapper.querySelector('canvas'), {
                type: 'bar',
                data: {
                    labels: ageLabels,
                    datasets: [{
                        label: `Populasi ${kecamatanName}`,
                        data: Object.values(totalsByAgeKecamatan[kecamatanName]),
                        backgroundColor: kecamatanColors[colorIndex % kecamatanColors.length],
                        borderColor: kecamatanColors[colorIndex % kecamatanColors.length].replace('0.7', '1'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true, ticks: { callback: (value) => formatNumber(value) } } },
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (context) => formatNumber(context.raw) } }
                    }
                }
            });
            colorIndex++;
        }
    })();


    // --- INCOME ANALYSIS ---
    (function renderIncomeAnalysis() {
        function calculateIncomeDistribution(data) {
            return data.map(row => {
                const dependent = row.usia0_14 + row.usia65_plus;
                let lowIncome = row.usia15_24;
                const productivePopulation = row.usia25_39 + row.usia40_54;
                const preRetirementPopulation = row.usia55_64;

                let highIncome, middleIncome;
                if (row.ring === 1) {
                    highIncome = Math.round(productivePopulation * 0.35) + Math.round(preRetirementPopulation * 0.20);
                    middleIncome = Math.round(productivePopulation * 0.65) + Math.round(preRetirementPopulation * 0.80);
                } else {
                    highIncome = Math.round(productivePopulation * 0.15) + Math.round(preRetirementPopulation * 0.05);
                    middleIncome = Math.round(productivePopulation * 0.85) + Math.round(preRetirementPopulation * 0.95);
                }
                return { ...row, incomeDependent: dependent, incomeLow: lowIncome, incomeMiddle: middleIncome, incomeHigh: highIncome };
            });
        }

        function renderIncomeTable(incomeData) {
            const tableBody = document.getElementById('incomeTableBody');
            tableBody.innerHTML = '';
            let currentKecamatan = null;
            let kecamatanTotals = { dependent: 0, low: 0, middle: 0, high: 0 };

            const appendSummaryRow = (kecamatanName, totals) => {
                const tr = document.createElement('tr');
                tr.className = 'bg-gray-100 font-bold text-gray-800 border-t-2 border-b-2 border-gray-300';
                tr.innerHTML = `
                    <td colspan="3" class="px-4 py-3 text-right">Total ${kecamatanName}</td>
                    <td class="px-4 py-3 text-center">${formatNumber(totals.dependent)}</td>
                    <td class="px-4 py-3 text-center">${formatNumber(totals.low)}</td>
                    <td class="px-4 py-3 text-center">${formatNumber(totals.middle)}</td>
                    <td class="px-4 py-3 text-center">${formatNumber(totals.high)}</td>
                `;
                tableBody.appendChild(tr);
            };

            incomeData.forEach((row, index) => {
                if (row.kecamatan !== currentKecamatan && currentKecamatan !== null) {
                    appendSummaryRow(currentKecamatan, kecamatanTotals);
                    kecamatanTotals = { dependent: 0, low: 0, middle: 0, high: 0 };
                }
                currentKecamatan = row.kecamatan;
                kecamatanTotals.dependent += row.incomeDependent;
                kecamatanTotals.low += row.incomeLow;
                kecamatanTotals.middle += row.incomeMiddle;
                kecamatanTotals.high += row.incomeHigh;

                const tr = document.createElement('tr');
                tr.className = 'bg-white border-b hover:bg-gray-50';
                tr.innerHTML = `
                    <td class="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">${row.kecamatan}</td>
                    <td class="px-4 py-4">${row.kelurahan}</td>
                    <td class="px-2 py-4 text-center">${row.ring}</td>
                    <td class="px-4 py-4 text-center">${formatNumber(row.incomeDependent)}</td>
                    <td class="px-4 py-4 text-center">${formatNumber(row.incomeLow)}</td>
                    <td class="px-4 py-4 text-center">${formatNumber(row.incomeMiddle)}</td>
                    <td class="px-4 py-4 text-center">${formatNumber(row.incomeHigh)}</td>
                `;
                tableBody.appendChild(tr);
                if (index === incomeData.length - 1) {
                    appendSummaryRow(currentKecamatan, kecamatanTotals);
                }
            });
        }

        const estimatedIncomeData = calculateIncomeDistribution(demographyData);
        renderIncomeTable(estimatedIncomeData);

        const totalsByIncomeKecamatan = estimatedIncomeData.reduce((acc, row) => {
            const { kecamatan, incomeLow, incomeMiddle, incomeHigh } = row;
            if (!acc[kecamatan]) {
                acc[kecamatan] = { low: 0, middle: 0, high: 0 };
            }
            acc[kecamatan].low += incomeLow;
            acc[kecamatan].middle += incomeMiddle;
            acc[kecamatan].high += incomeHigh;
            return acc;
        }, {});

        const kecamatanNames = Object.keys(totalsByIncomeKecamatan);

        // Charting for Bar Chart Income Comparison
        new Chart(document.getElementById('incomeDistributionByKecamatanChart'), {
            type: 'bar',
            data: {
                labels: kecamatanNames,
                datasets: [
                    { label: 'Low Income', data: kecamatanNames.map(name => totalsByIncomeKecamatan[name].low), backgroundColor: 'rgba(251, 191, 36, 0.7)'},
                    { label: 'Middle Income', data: kecamatanNames.map(name => totalsByIncomeKecamatan[name].middle), backgroundColor: 'rgba(52, 211, 153, 0.7)' },
                    { label: 'High Income', data: kecamatanNames.map(name => totalsByIncomeKecamatan[name].high), backgroundColor: 'rgba(96, 165, 250, 0.7)' }
                ]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true, stacked: false, ticks: { callback: (value) => formatNumber(value) } } },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatNumber(context.raw)}` } }
                }
            }
        });

        // Charting for Donut Chart Income Profile per Kecamatan
        const incomeDonutsContainer = document.getElementById('kecamatanIncomeDonutsContainer');
        const incomeLabels = ['Low Income', 'Middle Income', 'High Income'];
        const incomeColors = ['#FBBF24', '#34D399', '#60A5FA'];

        for (const kecamatanName of kecamatanNames) {
            const data = totalsByIncomeKecamatan[kecamatanName];
            const chartData = [data.low, data.middle, data.high];
            const totalIncomePopulation = chartData.reduce((a, b) => a + b, 0);

            const chartWrapper = document.createElement('div');
            chartWrapper.innerHTML = `<h4 class="text-lg font-semibold text-center mb-2 text-gray-700">${kecamatanName}</h4><canvas></canvas>`;
            incomeDonutsContainer.appendChild(chartWrapper);

            new Chart(chartWrapper.querySelector('canvas'), {
                type: 'doughnut',
                data: {
                    labels: incomeLabels,
                    datasets: [{ data: chartData, backgroundColor: incomeColors, hoverOffset: 4 }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const percentage = ((context.raw / totalIncomePopulation) * 100).toFixed(1);
                                    return `${context.label}: ${formatNumber(context.raw)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    })();

    // --- MARKET POTENTIAL ANALYSIS ---
    (function renderMarketPotentialAnalysis() {
        // Asumsi: Fungsi calculateIncomeDistribution sudah ada dan dapat diakses
        // atau kita definisikan ulang di sini untuk cakupan lokal.
        // Untuk amannya, kita definisikan ulang fungsi kalkulasi di sini.
        function calculateIncomeDistribution(data) {
             return data.map(row => {
                const productivePopulation = row.usia25_39 + row.usia40_54;
                const preRetirementPopulation = row.usia55_64;
                
                let highIncome, middleIncome;

                if (row.ring === 1) {
                    highIncome = Math.round(productivePopulation * 0.35) + Math.round(preRetirementPopulation * 0.20);
                    middleIncome = Math.round(productivePopulation * 0.65) + Math.round(preRetirementPopulation * 0.80);
                } else { // Ring 2
                    highIncome = Math.round(productivePopulation * 0.15) + Math.round(preRetirementPopulation * 0.05);
                    middleIncome = Math.round(productivePopulation * 0.85) + Math.round(preRetirementPopulation * 0.95);
                }
                return { ...row, incomeMiddle: middleIncome, incomeHigh: highIncome };
            });
        }
        
        const estimatedIncomeData = calculateIncomeDistribution(demographyData);

        // 1. Agregasi data untuk Analisis Pasar
        const targetMarketData = estimatedIncomeData.reduce((acc, row) => {
            const { kecamatan } = row;
            if (!acc[kecamatan]) {
                acc[kecamatan] = {
                    middleIncome: 0,
                    highIncome: 0,
                    age25_39: 0,
                    age40_54: 0,
                    age55_64: 0,
                };
            }
            acc[kecamatan].middleIncome += row.incomeMiddle;
            acc[kecamatan].highIncome += row.incomeHigh;
            // Populasi yang menjadi basis perhitungan Middle & High Income
            acc[kecamatan].age25_39 += row.usia25_39;
            acc[kecamatan].age40_54 += row.usia40_54;
            acc[kecamatan].age55_64 += row.usia55_64;
            return acc;
        }, {});

        const marketKecamatanNames = Object.keys(targetMarketData);

        // 2. Render Chart: Ukuran Pasar per Kecamatan (Stacked Bar)
        new Chart(document.getElementById('marketPotentialByKecamatanChart'), {
            type: 'bar',
            data: {
                labels: marketKecamatanNames,
                datasets: [
                    {
                        label: 'Middle Income',
                        data: marketKecamatanNames.map(name => targetMarketData[name].middleIncome),
                        backgroundColor: 'rgba(52, 211, 153, 0.8)', // emerald-400
                        stack: 'market'
                    },
                    {
                        label: 'High Income',
                        data: marketKecamatanNames.map(name => targetMarketData[name].highIncome),
                        backgroundColor: 'rgba(96, 165, 250, 0.8)', // blue-400
                        stack: 'market'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true, ticks: { callback: (value) => formatNumber(value) } }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: { label: (context) => `${context.dataset.label}: ${formatNumber(context.raw)}` }
                    }
                }
            }
        });

        // 3. Render Chart: Profil Usia Pasar Target (Doughnut)
        const totalAge25_39 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age25_39, 0);
        const totalAge40_54 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age40_54, 0);
        const totalAge55_64 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age55_64, 0);
        const totalTargetMarket = totalAge25_39 + totalAge40_54 + totalAge55_64;

        new Chart(document.getElementById('targetMarketAgeProfileChart'), {
            type: 'doughnut',
            data: {
                labels: ['25-39 Thn (Produktif Muda)', '40-54 Thn (Produktif Matang)', '55-64 Thn (Pra-Pensiun)'],
                datasets: [{
                    data: [totalAge25_39, totalAge40_54, totalAge55_64],
                    backgroundColor: ['#2dd4bf', '#60a5fa', '#a78bfa'], // teal, blue, violet
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const percentage = ((value / totalTargetMarket) * 100).toFixed(1);
                                return `${label}: ${formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // 4. Render Tabel Ringkasan Pasar
        const summaryTableBody = document.getElementById('marketSummaryTableBody');
        summaryTableBody.innerHTML = '';
        marketKecamatanNames.forEach(kecamatan => {
            const data = targetMarketData[kecamatan];
            const totalPotential = data.middleIncome + data.highIncome;
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b hover:bg-gray-50';
            tr.innerHTML = `
                <td class="px-4 py-4 font-medium text-gray-900">${kecamatan}</td>
                <td class="px-4 py-4 text-center font-bold">${formatNumber(totalPotential)}</td>
                <td class="px-4 py-4 text-center">${formatNumber(data.age25_39)}</td>
                <td class="px-4 py-4 text-center">${formatNumber(data.age40_54)}</td>
            `;
            summaryTableBody.appendChild(tr);
        });
    })();

    // --- SURVEY ANALYSIS (N=86 Raw Data) ---
    (function renderFullSurveyAnalysis() {
        const headers = ["Nama", "Perusahaan", "Posisi", "Domisili", "Kelompok Usia", "Status Pekerjaan", "Pengalaman Olahraga", "Minat Driving Range", "Frekuensi Driving Range", "Waktu Ideal Driving Range", "Biaya Wajar Driving Range", "Fitur Penting Driving Range", "Familiar PADEL", "Minat PADEL", "Frekuensi PADEL", "Waktu Ideal PADEL", "Biaya Sewa PADEL", "Fitur Penting PADEL", "Pilihan Fasilitas", "Pemanfaatan Fasilitas", "Pendorong Rutin", "Saran Lain"];
        
        const parsedSurveyData = surveyRawData.trim().split('\n').map(row => {
            const values = row.split('\t');
            let obj = {};
            headers.forEach((header, i) => { obj[header] = (values[i] || '').trim(); });
            return obj;
        });

        function aggregateData(data, key, isMultiSelect = false, separator = ', ') {
            const aggregation = {};
            data.forEach(row => {
                const answer = row[key];
                if (answer && !['tidak tahu', 'tidak', 'na', 'ga tau', '-'].includes(answer.toLowerCase())) {
                    if (isMultiSelect) {
                        answer.split(separator).forEach(item => {
                            const trimmedItem = item.trim();
                            if(trimmedItem) aggregation[trimmedItem] = (aggregation[trimmedItem] || 0) + 1;
                        });
                    } else {
                        aggregation[answer] = (aggregation[answer] || 0) + 1;
                    }
                }
            });
            return aggregation;
        }

        function createChart(title, type, aggregatedData, colorPalette) {
            const container = document.getElementById('surveyChartsContainer');
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'bg-white p-6 rounded-lg shadow-md';
            chartWrapper.innerHTML = `<h3 class="text-xl font-semibold mb-4 text-gray-700">${title}</h3><canvas></canvas>`;
            container.appendChild(chartWrapper);

            const ctx = chartWrapper.querySelector('canvas');
            const labels = Object.keys(aggregatedData);
            const data = Object.values(aggregatedData);

            if (type === 'bar' || type === 'horizontalBar') {
                const sorted = labels.map((label, index) => ({ label, value: data[index] })).sort((a, b) => b.value - a.value);
                labels.length = 0; data.length = 0;
                sorted.forEach(item => { labels.push(item.label); data.push(item.value); });
            }
            
            const chartConfig = {
                type: (type === 'horizontalBar') ? 'bar' : type,
                data: {
                    labels: labels,
                    datasets: [{ label: title, data: data, backgroundColor: labels.map((_, i) => colorPalette[i % colorPalette.length]) }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: (type === 'pie' || type === 'doughnut') } },
                    indexAxis: type === 'horizontalBar' ? 'y' : 'x',
                }
            };
            new Chart(ctx, chartConfig);
        }

        function normalizeLocation(location) {
            const loc = location.toLowerCase();
            if (loc.includes('timur') || loc.includes('tkmur') || loc.includes('rungkut')) return 'Surabaya Timur';
            if (loc.includes('selatan')) return 'Surabaya Selatan';
            if (loc.includes('barat')) return 'Surabaya Barat';
            if (loc.includes('pusat')) return 'Surabaya Pusat';
            if (loc.includes('sidoarjo') || loc.includes('darjo')) return 'Sidoarjo';
            if (loc.includes('sby') || loc.includes('surabaya')) return 'Surabaya (Lainnya)';
            return 'Lainnya';
        }

        const palettes = {
            cool: ['#54A2E5', '#63B3ED', '#76C8F2', '#89D9F7', '#9CEBFA'],
            warm: ['#FF6384', '#FF9F40', '#FFCD56', '#F7A35C', '#E8C1A0'],
            vibrant: ['#4BC0C0', '#9966FF', '#FF9F89', '#E4572E', '#29335C'],
            pastel: ['#A1EAFB', '#C7CEEA', '#FFD8BE', '#FFC8A2', '#F6EAC2']
        };

        const processedDomicile = parsedSurveyData.map(d => ({ ...d, "Domisili": normalizeLocation(d["Domisili"]) }));

        createChart('Kelompok Usia Responden', 'pie', aggregateData(parsedSurveyData, 'Kelompok Usia'), palettes.cool);
        createChart('Status Pekerjaan Responden', 'pie', aggregateData(parsedSurveyData, 'Status Pekerjaan'), palettes.warm);
        createChart('Domisili Utama Responden', 'bar', aggregateData(processedDomicile, 'Domisili'), palettes.vibrant);
        createChart('Minat Driving Range Baru', 'pie', aggregateData(parsedSurveyData, 'Minat Driving Range'), palettes.cool);
        createChart('Fitur Terpenting di Driving Range', 'horizontalBar', aggregateData(parsedSurveyData, 'Fitur Penting Driving Range', true), palettes.pastel);
        createChart('Minat Lapangan Padel Baru', 'pie', aggregateData(parsedSurveyData, 'Minat PADEL'), palettes.vibrant);
        createChart('Fitur Terpenting di Fasilitas Padel', 'horizontalBar', aggregateData(parsedSurveyData, 'Fitur Penting PADEL', true), palettes.warm);
        createChart('Fasilitas Pilihan Utama', 'pie', aggregateData(parsedSurveyData, 'Pilihan Fasilitas'), palettes.pastel);
        createChart('Faktor Pendorong Penggunaan Rutin', 'horizontalBar', aggregateData(parsedSurveyData, 'Pendorong Rutin', true), palettes.warm);

        const feedbackList = document.getElementById('qualitativeFeedback');
        const irrelevantFeedback = ['tidak ada', '-', 'cukup', 'ok', '.', 'tidak', 'na', 'ga tau'];
        parsedSurveyData.forEach(row => {
            const feedback = row['Saran Lain'];
            if (feedback && !irrelevantFeedback.includes(feedback.toLowerCase())) {
                const li = document.createElement('li');
                li.className = 'pb-2 border-b border-gray-100';
                li.textContent = feedback;
                feedbackList.appendChild(li);
            }
        });
    })();

    // --- MINAT SURVEY ANALYSIS (Hardcoded data) ---
    (function renderMinatSurveyAnalysis() {
        // Chart 1: Preferensi Fasilitas (Pie)
        new Chart(document.getElementById('preferensiFasilitasChart'), {
            type: 'pie',
            data: {
                labels: surveyDataMinat.preferensiFasilitas.labels,
                datasets: [{ data: surveyDataMinat.preferensiFasilitas.data, backgroundColor: ['#F59E0B', '#8B5CF6', '#10B981'], hoverOffset: 4 }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} responden` } } } }
        });

        // Chart 2: Tingkat Minat Padel (Bar)
        new Chart(document.getElementById('minatPadelChart'), {
            type: 'bar',
            data: { labels: surveyDataMinat.minatPadel.labels, datasets: [{ label: 'Jumlah Responden', data: surveyDataMinat.minatPadel.data, backgroundColor: '#8B5CF6' }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
        });

        // Chart 3: Frekuensi Penggunaan Padel (Bar)
        new Chart(document.getElementById('frekuensiPadelChart'), {
            type: 'bar',
            data: { labels: surveyDataMinat.frekuensiPadel.labels, datasets: [{ label: 'Jumlah Responden', data: surveyDataMinat.frekuensiPadel.data, backgroundColor: '#10B981' }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
        });

        // Chart 4: Waktu Ideal Padel (Bar)
        new Chart(document.getElementById('waktuIdealPadelChart'), {
            type: 'bar',
            data: { labels: surveyDataMinat.waktuIdeal.labels, datasets: [{ label: 'Jumlah Pilihan', data: surveyDataMinat.waktuIdeal.data, backgroundColor: '#3B82F6' }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
        });
    })();

    // --- MARKET POTENTIAL & COMPETITOR ANALYSIS CHARTS ---
    (function renderStrategyCharts() {
        // Chart: Competitor Price (Driving Range)
        new Chart(document.getElementById('competitorPriceChart'), {
            type: 'bar',
            data: {
                labels: ['Brawijaya', 'Ciputra', 'Le Grande', 'Graha Family', 'Pakuwon', 'Bukit Darmo'],
                datasets: [{
                    label: 'Benchmark Harga (Guest/100 Bola)',
                    data: [130000, 130000, 135000, 136000, 150000, 151500],
                    backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(34, 197, 94, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(239, 68, 68, 0.7)'],
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: { x: { beginAtZero: true, ticks: { callback: (value) => 'Rp ' + formatNumber(value) }}},
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` Harga: Rp ${formatNumber(context.raw)}` }}}
            }
        });

        // Chart: Competitor Price (Padel)
        new Chart(document.getElementById('padelPriceChart'), {
            type: 'bar',
            data: {
                labels: ['UNO', 'Puncak', 'Margomulyo', 'Playground', 'Homeground', 'Jungle', 'Graha'],
                datasets: [{
                    label: 'Benchmark Harga (Peak / Jam)',
                    data: [350000, 350000, 350000, 380000, 389000, 400000, 450000],
                    backgroundColor: 'rgba(168, 85, 247, 0.7)',
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: { x: { beginAtZero: true, ticks: { callback: (value) => 'Rp ' + formatNumber(value) }}},
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` Harga: Rp ${formatNumber(context.raw)}` }}}
            }
        });

        // Data for Market Potential Charts
        const estimatedIncomeData = demographyData.map(row => {
            const productivePopulation = row.usia25_39 + row.usia40_54 + row.usia55_64;
            let middleIncome, highIncome;
            if (row.ring === 1) {
                middleIncome = Math.round(productivePopulation * 0.70);
                highIncome = Math.round(productivePopulation * 0.30);
            } else {
                middleIncome = Math.round(productivePopulation * 0.85);
                highIncome = Math.round(productivePopulation * 0.15);
            }
            return {...row, incomeMiddle: middleIncome, incomeHigh: highIncome };
        });

        const targetMarketData = estimatedIncomeData.reduce((acc, row) => {
            if (!acc[row.kecamatan]) {
                acc[row.kecamatan] = { middleIncome: 0, highIncome: 0, age25_39: 0, age40_54: 0, age55_64: 0, };
            }
            acc[row.kecamatan].middleIncome += row.incomeMiddle;
            acc[row.kecamatan].highIncome += row.incomeHigh;
            acc[row.kecamatan].age25_39 += row.usia25_39;
            acc[row.kecamatan].age40_54 += row.usia40_54;
            acc[row.kecamatan].age55_64 += row.usia55_64;
            return acc;
        }, {});

        const marketKecamatanNames = Object.keys(targetMarketData);

        // Chart: Market Potential by Kecamatan (Stacked Bar)
        new Chart(document.getElementById('marketPotentialByKecamatanChart'), {
            type: 'bar',
            data: {
                labels: marketKecamatanNames,
                datasets: [
                    { label: 'Middle Income', data: marketKecamatanNames.map(name => targetMarketData[name].middleIncome), backgroundColor: 'rgba(52, 211, 153, 0.8)', stack: 'market'},
                    { label: 'High Income', data: marketKecamatanNames.map(name => targetMarketData[name].highIncome), backgroundColor: 'rgba(96, 165, 250, 0.8)', stack: 'market' }
                ]
            },
            options: {
                responsive: true,
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { callback: (value) => formatNumber(value) }}},
                plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatNumber(context.raw)}` }}}
            }
        });

        // Chart: Target Market Age Profile (Doughnut)
        const totalAge25_39 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age25_39, 0);
        const totalAge40_54 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age40_54, 0);
        const totalAge55_64 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age55_64, 0);
        const totalTargetMarket = totalAge25_39 + totalAge40_54 + totalAge55_64;
        
        new Chart(document.getElementById('targetMarketAgeProfileChart'), {
            type: 'doughnut',
            data: {
                labels: ['25-39 Thn (Produktif Muda)', '40-54 Thn (Produktif Matang)', '55-64 Thn (Pra-Pensiun)'],
                datasets: [{ data: [totalAge25_39, totalAge40_54, totalAge55_64], backgroundColor: ['#2dd4bf', '#60a5fa', '#a78bfa'], hoverOffset: 4 }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: { label: (ctx) => `${ctx.label}: ${formatNumber(ctx.raw)} (${((ctx.raw / totalTargetMarket) * 100).toFixed(1)}%)` }
                    }
                }
            }
        });
        
        // Fill Market Summary Table
        const summaryTableBody = document.getElementById('marketSummaryTableBody');
        summaryTableBody.innerHTML = '';
        marketKecamatanNames.forEach(kecamatan => {
            const data = targetMarketData[kecamatan];
            const tr = document.createElement('tr');
            tr.className = 'bg-white border-b hover:bg-gray-50';
            tr.innerHTML = `
                <td class="px-4 py-4 font-medium text-gray-900">${kecamatan}</td>
                <td class="px-4 py-4 text-center font-bold">${formatNumber(data.middleIncome + data.highIncome)}</td>
                <td class="px-4 py-4 text-center">${formatNumber(data.age25_39)}</td>
                <td class="px-4 py-4 text-center">${formatNumber(data.age40_54)}</td>
            `;
            summaryTableBody.appendChild(tr);
        });
    })();

    // --- SURVEY SAMPLE SIZE CALCULATION ---
    (function calculateSurveySamples() {
        const marginOfError10 = 0.10;
        const marginOfError5 = 0.05;
        const marginOfError3 = 0.03;

        document.getElementById('sampleSize10').innerText = formatNumber(slovin(totalPopulation, marginOfError10)) + ' Responden';
        document.getElementById('sampleSize5').innerText = formatNumber(slovin(totalPopulation, marginOfError5)) + ' Responden';
        document.getElementById('sampleSize3').innerText = formatNumber(slovin(totalPopulation, marginOfError3)) + ' Responden';

        document.getElementById('totalPopRing1').innerText = `(Total Populasi N = ${formatNumber(totalRing1)})`;
        document.getElementById('sampleSizeRing1_10').innerText = formatNumber(slovin(totalRing1, marginOfError10));
        document.getElementById('sampleSizeRing1_5').innerText = formatNumber(slovin(totalRing1, marginOfError5));
        document.getElementById('sampleSizeRing1_3').innerText = formatNumber(slovin(totalRing1, marginOfError3));

        document.getElementById('totalPopRing2').innerText = `(Total Populasi N = ${formatNumber(totalRing2)})`;
        document.getElementById('sampleSizeRing2_10').innerText = formatNumber(slovin(totalRing2, marginOfError10));
        document.getElementById('sampleSizeRing2_5').innerText = formatNumber(slovin(totalRing2, marginOfError5));
        document.getElementById('sampleSizeRing2_3').innerText = formatNumber(slovin(totalRing2, marginOfError3));
    })();



});