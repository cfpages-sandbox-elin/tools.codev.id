// File: sier-visual.js (Versi Direfaktor & Tersentralisasi)

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPER FUNCTIONS ---
    function formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    }
    const toBillion = (num) => (num / 1000000000).toFixed(2) + ' M';
    const slovin = (N, e) => Math.ceil(N / (1 + N * e * e));
    function tryToRender(fn) {
        try { fn(); } catch (error) { console.error("Error saat merender bagian:", error.name, error.message, error.stack); }
    }

    // ====================================================================
    // BAGIAN 1: DATA DEMOGRAFI & ANALISIS DASAR
    // ====================================================================
    // File: sier-visual.js

    // ====================================================================
    // 1. DATA DEMOGRAFI & ANALISIS DASAR (VERSI FINAL LENGKAP)
    // ====================================================================
    tryToRender(function renderDemographyAndCharts() {
        // Pastikan section yang relevan ada di halaman
        const summaryContainer = document.getElementById('summary');
        const chartsContainer = document.getElementById('charts');
        if (!summaryContainer || !chartsContainer) {
            // console.log("Section demografi dasar tidak ditemukan, melewati render.");
            return;
        }
        
        // --- Data Processing ---
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

        // --- DOM Manipulation (Cards & Table) ---
        document.getElementById('totalPenduduk').innerText = formatNumber(totalPopulation);
        document.getElementById('totalRing1').innerText = formatNumber(totalRing1);
        document.getElementById('totalRing2').innerText = formatNumber(totalRing2);
        document.getElementById('dependencyRatio').innerText = dependencyRatio;

        const tableBody = document.getElementById('dataTableBody');
        if (tableBody) {
            tableBody.innerHTML = demographyData.map(row => `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-3 py-4 font-medium text-gray-900">${row.kecamatan}</td>
                    <td class="px-3 py-4">${row.kelurahan}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.total)}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.usia0_14)}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.usia15_24)}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.usia25_39)}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.usia40_54)}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.usia55_64)}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.usia65_plus)}</td>
                    <td class="px-3 py-4 text-center">${row.ring}</td>
                </tr>`).join('');
        }

        // --- Chart Rendering (LENGKAP) ---
        const chartOptions = (extraOptions = {}) => ({
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (c) => `${c.label || ''}: ${formatNumber(c.raw)}`
                    }
                }
            },
            ...extraOptions
        });

        // Chart 1: Komposisi Penduduk Berdasarkan Ring
        if (document.getElementById('ringChart')) {
            new Chart(document.getElementById('ringChart'), {
                type: 'doughnut',
                data: {
                    labels: ['Ring 1', 'Ring 2'],
                    datasets: [{ data: [totalRing1, totalRing2], backgroundColor: ['#10B981', '#F59E0B'] }]
                },
                options: chartOptions()
            });
        }

        // Chart 2: Distribusi Penduduk Berdasarkan Kelompok Usia
        if (document.getElementById('ageDistributionChart')) {
            new Chart(document.getElementById('ageDistributionChart'), {
                type: 'bar',
                data: {
                    labels: Object.keys(totalsByAge),
                    datasets: [{ label: 'Total Penduduk', data: Object.values(totalsByAge), backgroundColor: 'rgba(59, 130, 246, 0.7)' }]
                },
                options: chartOptions({
                    plugins: { legend: { display: false } },
                    scales: { y: { ticks: { callback: (v) => formatNumber(v) } } }
                })
            });
        }

        // Chart 3: Rasio Usia Produktif vs. Non-Produktif
        if (document.getElementById('productiveRatioChart')) {
            new Chart(document.getElementById('productiveRatioChart'), {
                type: 'doughnut',
                data: {
                    labels: ['Usia Produktif (15-64 Thn)', 'Usia Non-Produktif (0-14 & 65+ Thn)'],
                    datasets: [{ data: [totalProductive, totalNonProductive], backgroundColor: ['#2563EB', '#DC2626'] }]
                },
                options: chartOptions()
            });
        }

        // Chart 4: Total Populasi per Kecamatan
        if (document.getElementById('kecamatanChart')) {
            new Chart(document.getElementById('kecamatanChart'), {
                type: 'bar',
                data: {
                    labels: Object.keys(totalsByKecamatan),
                    datasets: [{ label: 'Total Populasi', data: Object.values(totalsByKecamatan), backgroundColor: ['#8B5CF6', '#EC4899', '#F97316', '#14B8A6'] }]
                },
                options: chartOptions({
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: { x: { ticks: { callback: (v) => formatNumber(v) } } }
                })
            });
        }
    });


    // ====================================================================
    // BAGIAN 2: ANALISIS DEMOGRAFI DETAIL (PER RING & PER KECAMATAN)
    // ====================================================================
    tryToRender(() => {
        // Logika untuk chart 'ageDistributionByRingChart' dan 'kecamatanAgeChartsContainer'
        const ageLabels = ['0-14 Thn', '15-24 Thn', '25-39 Thn', '40-54 Thn', '55-64 Thn', '65+ Thn'];
        
        // Data Per Ring
        const totalsByAgeRing1 = ageLabels.reduce((acc, label) => ({...acc, [label]: 0}), {});
        const totalsByAgeRing2 = ageLabels.reduce((acc, label) => ({...acc, [label]: 0}), {});
        demographyData.forEach(row => {
            const target = row.ring === 1 ? totalsByAgeRing1 : totalsByAgeRing2;
            target['0-14 Thn'] += row.usia0_14; target['15-24 Thn'] += row.usia15_24; target['25-39 Thn'] += row.usia25_39;
            target['40-54 Thn'] += row.usia40_54; target['55-64 Thn'] += row.usia55_64; target['65+ Thn'] += row.usia65_plus;
        });
        if (document.getElementById('ageDistributionByRingChart')) new Chart(document.getElementById('ageDistributionByRingChart'), { type: 'bar', data: { labels: ageLabels, datasets: [{ label: 'Ring 1', data: Object.values(totalsByAgeRing1), backgroundColor: 'rgba(22, 163, 74, 0.7)' }, { label: 'Ring 2', data: Object.values(totalsByAgeRing2), backgroundColor: 'rgba(245, 158, 11, 0.7)' }] }, options: { responsive: true, scales: { y: { ticks: { callback: (v) => formatNumber(v) } } }, plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatNumber(c.raw)}` } } } } });

        // Data Per Kecamatan
        const kecamatanChartsContainer = document.getElementById('kecamatanAgeChartsContainer');
        if (kecamatanChartsContainer) {
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
                new Chart(chartWrapper.querySelector('canvas'), { type: 'bar', data: { labels: ageLabels, datasets: [{ label: `Populasi ${kecamatanName}`, data: Object.values(totalsByAgeKecamatan[kecamatanName]), backgroundColor: kecamatanColors[colorIndex++ % kecamatanColors.length] }] }, options: { responsive: true, scales: { y: { ticks: { callback: (v) => formatNumber(v) } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => formatNumber(c.raw) } } } } });
            }
        }
    });


    // ====================================================================
    // BAGIAN 3: ANALISIS PENDAPATAN, POTENSI PASAR, & KOMPETITOR
    // ====================================================================
    tryToRender(() => {
        // Ini adalah fungsi gabungan untuk income, market potential, dan competitor charts.
        
        // --- DATA PREPARATION (Income & Market) ---
        const estimatedIncomeData = demographyData.map(row => {
            const dependent = row.usia0_14 + row.usia65_plus;
            const lowIncome = row.usia15_24;
            const productiveCore = row.usia25_39 + row.usia40_54 + row.usia55_64;
            let highIncome, middleIncome;
            if (row.ring === 1) { // Kawasan lebih mapan
                highIncome = Math.round(productiveCore * 0.30);
                middleIncome = productiveCore - highIncome;
            } else { // Kawasan berkembang
                highIncome = Math.round(productiveCore * 0.15);
                middleIncome = productiveCore - highIncome;
            }
            return { ...row, incomeDependent: dependent, incomeLow: lowIncome, incomeMiddle: middleIncome, incomeHigh: highIncome };
        });
        
        // --- A. Income Analysis ---
        const incomeTableBody = document.getElementById('incomeTableBody');
        if (incomeTableBody) {
            incomeTableBody.innerHTML = ''; // Kosongkan dulu
            estimatedIncomeData.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = 'bg-white border-b hover:bg-gray-50';
                tr.innerHTML = `
                    <td class="px-4 py-3 font-medium">${row.kecamatan}</td>
                    <td class="px-4 py-3">${row.kelurahan}</td>
                    <td class="px-2 py-3 text-center">${row.ring}</td>
                    <td class="px-4 py-3 text-center bg-red-50">${formatNumber(row.incomeDependent)}</td>
                    <td class="px-4 py-3 text-center bg-yellow-50">${formatNumber(row.incomeLow)}</td>
                    <td class="px-4 py-3 text-center bg-green-50">${formatNumber(row.incomeMiddle)}</td>
                    <td class="px-4 py-3 text-center bg-blue-50">${formatNumber(row.incomeHigh)}</td>
                `;
                incomeTableBody.appendChild(tr);
            });
        }

        const totalsByIncomeKecamatan = estimatedIncomeData.reduce((acc, row) => {
            const { kecamatan, incomeLow, incomeMiddle, incomeHigh } = row;
            if (!acc[kecamatan]) acc[kecamatan] = { low: 0, middle: 0, high: 0 };
            acc[kecamatan].low += incomeLow;
            acc[kecamatan].middle += incomeMiddle;
            acc[kecamatan].high += incomeHigh;
            return acc;
        }, {});
        const kecamatanNames = Object.keys(totalsByIncomeKecamatan);

        if (document.getElementById('incomeDistributionByKecamatanChart')) new Chart(document.getElementById('incomeDistributionByKecamatanChart'), { type: 'bar', data: { labels: kecamatanNames, datasets: [{ label: 'Low Income', data: kecamatanNames.map(k => totalsByIncomeKecamatan[k].low), backgroundColor: 'rgba(251, 191, 36, 0.7)' }, { label: 'Middle Income', data: kecamatanNames.map(k => totalsByIncomeKecamatan[k].middle), backgroundColor: 'rgba(52, 211, 153, 0.7)' }, { label: 'High Income', data: kecamatanNames.map(k => totalsByIncomeKecamatan[k].high), backgroundColor: 'rgba(96, 165, 250, 0.7)' }] }, options: { responsive: true, scales: { y: { ticks: { callback: (v) => formatNumber(v) } } }, plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatNumber(c.raw)}` } } } } });
        
        const incomeDonutsContainer = document.getElementById('kecamatanIncomeDonutsContainer');
        if (incomeDonutsContainer) {
            incomeDonutsContainer.innerHTML = ''; // Kosongkan dulu
            const incomeColors = ['rgba(251, 191, 36, 0.8)', 'rgba(52, 211, 153, 0.8)', 'rgba(96, 165, 250, 0.8)'];

            kecamatanNames.forEach(kecamatan => {
                const data = totalsByIncomeKecamatan[kecamatan];
                const total = data.low + data.middle + data.high;
                if (total === 0) return; // Lewati jika tidak ada data

                const chartWrapper = document.createElement('div');
                chartWrapper.className = 'text-center';
                chartWrapper.innerHTML = `
                    <h4 class="text-md font-semibold text-gray-700 mb-2">${kecamatan}</h4>
                    <canvas></canvas>
                `;
                incomeDonutsContainer.appendChild(chartWrapper);
                
                new Chart(chartWrapper.querySelector('canvas'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Low Income', 'Middle Income', 'High Income'],
                        datasets: [{
                            data: [data.low, data.middle, data.high],
                            backgroundColor: incomeColors,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
                            tooltip: { callbacks: { label: (c) => `${c.label}: ${((c.raw / total) * 100).toFixed(1)}%` } }
                        }
                    }
                });
            });
        }

        // --- B. Market Potential Analysis ---
        const targetMarketData = estimatedIncomeData.reduce((acc, row) => {
            if (!acc[row.kecamatan]) acc[row.kecamatan] = { middleIncome: 0, highIncome: 0, age25_39: 0, age40_54: 0, age55_64: 0 };
            acc[row.kecamatan].middleIncome += row.incomeMiddle; acc[row.kecamatan].highIncome += row.incomeHigh;
            acc[row.kecamatan].age25_39 += row.usia25_39; acc[row.kecamatan].age40_54 += row.usia40_54; acc[row.kecamatan].age55_64 += row.usia55_64;
            return acc;
        }, {});
        
        if (document.getElementById('marketPotentialByKecamatanChart')) new Chart(document.getElementById('marketPotentialByKecamatanChart'), { type: 'bar', data: { labels: kecamatanNames, datasets: [{ label: 'Middle Income', data: kecamatanNames.map(k => targetMarketData[k].middleIncome), backgroundColor: 'rgba(52, 211, 153, 0.8)', stack: 'market' }, { label: 'High Income', data: kecamatanNames.map(k => targetMarketData[k].highIncome), backgroundColor: 'rgba(96, 165, 250, 0.8)', stack: 'market' }] }, options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: (v) => formatNumber(v) } } }, plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatNumber(c.raw)}` } } } } });
        
        const totalAge25_39 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age25_39, 0);
        const totalAge40_54 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age40_54, 0);
        const totalAge55_64 = Object.values(targetMarketData).reduce((sum, item) => sum + item.age55_64, 0);
        const totalTargetMarket = totalAge25_39 + totalAge40_54 + totalAge55_64;
        if (document.getElementById('targetMarketAgeProfileChart')) new Chart(document.getElementById('targetMarketAgeProfileChart'), { type: 'doughnut', data: { labels: ['25-39 Thn', '40-54 Thn', '55-64 Thn'], datasets: [{ data: [totalAge25_39, totalAge40_54, totalAge55_64], backgroundColor: ['#2dd4bf', '#60a5fa', '#a78bfa'] }] }, options: { responsive: true, plugins: { tooltip: { callbacks: { label: (c) => `${c.label}: ${formatNumber(c.raw)} (${((c.raw / totalTargetMarket) * 100).toFixed(1)}%)` } } } } });

        const marketSummaryTableBody = document.getElementById('marketSummaryTableBody');
        if(marketSummaryTableBody) {
             marketSummaryTableBody.innerHTML = '';
             kecamatanNames.forEach(kecamatan => {
                 const data = targetMarketData[kecamatan];
                 const tr = document.createElement('tr');
                 tr.className = 'bg-white border-b hover:bg-gray-50';
                 tr.innerHTML = `<td class="px-4 py-4 font-medium">${kecamatan}</td><td class="px-4 py-4 text-center font-bold">${formatNumber(data.middleIncome + data.highIncome)}</td><td class="px-4 py-4 text-center">${formatNumber(data.age25_39)}</td><td class="px-4 py-4 text-center">${formatNumber(data.age40_54)}</td>`;
                 marketSummaryTableBody.appendChild(tr);
             });
        }
        
        // --- C. Competitor Price Charts ---
        if (document.getElementById('competitorPriceChart')) new Chart(document.getElementById('competitorPriceChart'), { type: 'bar', data: { labels: ['Brawijaya', 'Ciputra', 'Le Grande', 'Graha Family', 'Pakuwon', 'Bukit Darmo'], datasets: [{ label: 'Harga (Guest/100 Bola)', data: [130000, 130000, 135000, 136000, 150000, 151500], backgroundColor: ['#22c55e', '#22c55e', '#3b82f6', '#3b82f6', '#ef4444', '#ef4444'] }] }, options: { indexAxis: 'y', responsive: true, scales: { x: { ticks: { callback: (v) => 'Rp ' + formatNumber(v) } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Rp ${formatNumber(c.raw)}` } } } } });
        if (document.getElementById('padelPriceChart')) new Chart(document.getElementById('padelPriceChart'), { type: 'bar', data: { labels: ['UNO', 'Puncak', 'Margomulyo', 'Playground', 'Homeground', 'Jungle', 'Graha'], datasets: [{ label: 'Harga (Peak / Jam)', data: [350000, 350000, 350000, 380000, 389000, 400000, 450000], backgroundColor: 'rgba(168, 85, 247, 0.7)' }] }, options: { indexAxis: 'y', responsive: true, scales: { x: { ticks: { callback: (v) => 'Rp ' + formatNumber(v) } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Rp ${formatNumber(c.raw)}` } } } } });
    });


    // ====================================================================
    // BAGIAN 4: ANALISIS SURVEI (RAW DATA & DEEP DIVE)
    // ====================================================================
    tryToRender(() => {
        // Hentikan jika data mentah survei tidak tersedia
        if (typeof surveyRawData === 'undefined' || !surveyRawData) {
            console.warn("Data survei mentah (surveyRawData) tidak ditemukan. Melewatkan rendering bagian analisis survei.");
            return;
        }

        const headers = ["Nama", "Perusahaan", "Posisi", "Domisili", "Kelompok Usia", "Status Pekerjaan", "Pengalaman Olahraga", "Minat Driving Range", "Frekuensi Driving Range", "Waktu Ideal Driving Range", "Biaya Wajar Driving Range", "Fitur Penting Driving Range", "Familiar PADEL", "Minat PADEL", "Frekuensi PADEL", "Waktu Ideal PADEL", "Biaya Sewa PADEL", "Fitur Penting PADEL", "Pilihan Fasilitas", "Pemanfaatan Fasilitas", "Pendorong Rutin", "Saran Lain"];
        const parsedSurveyData = surveyRawData.trim().split('\n').map(row => {
            const values = row.split('\t');
            let obj = {};
            headers.forEach((header, i) => { obj[header] = (values[i] || '').trim(); });
            return obj;
        });

        const surveyChartsContainer = document.getElementById('surveyChartsContainer');
        const feedbackList = document.getElementById('qualitativeFeedback');

        // --- A. Survey Analysis (Basic) ---
        if (surveyChartsContainer) {
            surveyChartsContainer.innerHTML = ''; // Kosongkan kontainer sebelum mengisi

            // Fungsi untuk mengagregasi data dari kolom survei
            const aggregateData = (data, key, isMultiSelect = false, separator = ', ') => {
                return data.reduce((acc, row) => {
                    const answer = row[key];
                    if (answer && !['-', 'na', 'tidak', 'ga tau', '', 'tidak tahu', 'tidka tertarik'].includes(answer.toLowerCase())) {
                        if (isMultiSelect) {
                            answer.split(separator).forEach(item => {
                                const trimmed = item.trim();
                                if(trimmed) acc[trimmed] = (acc[trimmed] || 0) + 1;
                            });
                        } else {
                            acc[answer] = (acc[answer] || 0) + 1;
                        }
                    }
                    return acc;
                }, {});
            };
            
            // Helper untuk membuat chart dan menambahkannya ke DOM
            const createChart = (title, type, aggregatedData, options = {}) => {
                const chartWrapper = document.createElement('div');
                chartWrapper.className = 'bg-white p-6 rounded-lg shadow-md';
                chartWrapper.innerHTML = `
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">${title}</h3>
                    <canvas></canvas>
                `;
                surveyChartsContainer.appendChild(chartWrapper);
                const canvas = chartWrapper.querySelector('canvas');
                
                const chartOptions = {
                    responsive: true,
                    plugins: {
                        legend: { display: type === 'doughnut' },
                        tooltip: { callbacks: { label: (c) => `${c.label}: ${formatNumber(c.raw)}` } }
                    },
                    ...options
                };
                
                new Chart(canvas, {
                    type,
                    data: {
                        labels: Object.keys(aggregatedData),
                        datasets: [{
                            data: Object.values(aggregatedData),
                            backgroundColor: [
                                'rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 
                                'rgba(245, 158, 11, 0.7)', 'rgba(236, 72, 153, 0.7)',
                                'rgba(139, 92, 246, 0.7)', 'rgba(20, 184, 166, 0.7)'
                            ],
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            borderWidth: 1
                        }]
                    },
                    options: chartOptions
                });
            };

            // 1. Chart: Preferensi Fasilitas Utama
            const facilityData = aggregateData(parsedSurveyData, 'Pilihan Fasilitas');
            createChart('Preferensi Fasilitas Utama', 'doughnut', facilityData);

            // 2. Chart: Minat terhadap PADEL
            const padelInterestData = aggregateData(parsedSurveyData, 'Minat PADEL');
            createChart('Tingkat Minat Terhadap Lapangan PADEL', 'bar', padelInterestData, { plugins: { legend: { display: false } } });

            // 3. Chart: Demografi Usia Responden
            const ageData = aggregateData(parsedSurveyData, 'Kelompok Usia');
            createChart('Demografi Usia Responden', 'bar', ageData, { plugins: { legend: { display: false } } });

            // 4. Chart: Fitur Padel Paling Penting (Multi-select)
            const padelFeaturesData = aggregateData(parsedSurveyData, 'Fitur Penting PADEL', true);
            createChart('Fitur Padel Paling Penting Menurut Responden', 'bar', padelFeaturesData, { 
                indexAxis: 'y', 
                plugins: { legend: { display: false } },
                scales: { y: { ticks: { font: { size: 10 } } } }
            });
        }
        
        // Mengisi daftar masukan kualitatif
        if(feedbackList) {
            feedbackList.innerHTML = ''; // Kosongkan dulu
            const uniqueFeedbacks = new Set();
            parsedSurveyData.forEach(row => {
                const feedback = row['Saran Lain'];
                if (feedback && feedback.trim() !== '' && feedback.trim().toLowerCase() !== '-' && feedback.trim().toLowerCase() !== 'tidak ada' && feedback.trim().toLowerCase() !== 'cukup') {
                    uniqueFeedbacks.add(feedback.trim());
                }
            });
            
            if (uniqueFeedbacks.size === 0) {
                 const li = document.createElement('li');
                 li.textContent = 'Tidak ada masukan kualitatif tambahan dari responden.';
                 feedbackList.appendChild(li);
            } else {
                uniqueFeedbacks.forEach(feedbackText => {
                    const li = document.createElement('li');
                    li.textContent = feedbackText;
                    feedbackList.appendChild(li);
                });
            }
        }

        // --- B. Survey Deep Dive ---
        const choiceVsAgeCtx = document.getElementById('choiceVsAgeChart');
        if (choiceVsAgeCtx) {
            const ageGroups = ['Di bawah 25 tahun', '25 - 35 tahun', '36 - 45 tahun', '46 - 55 tahun'];
            const facilityChoices = ['Driving Range Golf', 'Lapangan PADEL', 'Keduanya sama menariknya bagi saya'];
            let choiceVsAgeData = facilityChoices.reduce((acc, choice) => ({ ...acc, [choice]: ageGroups.reduce((a, age) => ({ ...a, [age]: 0 }), {}) }), {});
            parsedSurveyData.forEach(row => {
                if (facilityChoices.includes(row['Pilihan Fasilitas']) && ageGroups.includes(row['Kelompok Usia'])) {
                    choiceVsAgeData[row['Pilihan Fasilitas']][row['Kelompok Usia']]++;
                }
            });
            const datasets = ageGroups.map((age, i) => ({ label: age, data: facilityChoices.map(c => choiceVsAgeData[c][age]), backgroundColor: ['#4ade80', '#818cf8', '#fb923c', '#60a5fa'][i] }));
            new Chart(choiceVsAgeCtx, { type: 'bar', data: { labels: facilityChoices, datasets }, options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } }, plugins: { tooltip: { mode: 'index' } } } });
        }

        const interestCorrelationCtx = document.getElementById('interestCorrelationChart');
        if(interestCorrelationCtx) {
            const interestMap = { 'Sangat Tertarik': 5, 'Tertarik': 4, 'Cukup Tertarik': 3, 'Kurang Tertarik': 2, 'Tidak Tertarik Sama Sekali': 1 };
            const correlation = parsedSurveyData.reduce((acc, row) => {
                const golf = interestMap[row['Minat Driving Range']] || 0;
                const padel = interestMap[row['Minat PADEL']] || 0;
                if(golf > 0 && padel > 0) {
                    const key = `${golf},${padel}`;
                    acc[key] = (acc[key] || 0) + 1;
                }
                return acc;
            }, {});
            const bubbleData = Object.keys(correlation).map(key => ({ x: parseInt(key.split(',')[0]), y: parseInt(key.split(',')[1]), r: correlation[key] * 3 }));
            new Chart(interestCorrelationCtx, { type: 'bubble', data: { datasets: [{ label: 'Jumlah Responden', data: bubbleData, backgroundColor: 'rgba(96, 165, 250, 0.7)' }] }, options: { scales: { x: { title: { display: true, text: 'Minat Driving Range (1=Rendah, 5=Tinggi)' }, min: 0, max: 6, ticks: { stepSize: 1 } }, y: { title: { display: true, text: 'Minat Padel (1=Rendah, 5=Tinggi)' }, min: 0, max: 6, ticks: { stepSize: 1 } } }, plugins: { tooltip: { callbacks: { label: (c) => `${c.raw.r / 3} responden` } } } } });
        }
        
        const themedFeedbackContainer = document.getElementById('themedFeedbackContainer');
        if(themedFeedbackContainer) {
            themedFeedbackContainer.innerHTML = ''; // Kosongkan kontainer

            // 1. Definisikan tema dan kata kunci terkait
            const themes = {
                'Fasilitas & Pengalaman Premium': {
                    keywords: ['kualitas', 'fasilitas', 'nyaman', 'kafe', 'bar', 'ice bath', 'bagus', 'executive', 'musola', 'standar', 'graha family', 'pakuwon', 'ciputra', 'bersih', 'sirkulasi', 'ventilasi'],
                    comments: [],
                    summary: 'Banyak responden menekankan pentingnya pengalaman premium di luar lapangan itu sendiri. Ini termasuk kualitas F&B, kebersihan fasilitas (terutama toilet & shower), dan suasana yang nyaman. Mereka tidak hanya mencari tempat berolahraga, tetapi juga tempat bersosialisasi.'
                },
                'Saran Fasilitas Alternatif & Renovasi': {
                    keywords: ['tennis', 'futsal', 'gym', 'indoor', 'renovasi'],
                    comments: [],
                    summary: 'Ada permintaan yang jelas untuk fasilitas lain, terutama lapangan Tenis Indoor. Ini menunjukkan adanya pasar yang merasa Padel sudah jenuh dan menginginkan alternatif olahraga raket yang terlindung dari cuaca.'
                },
                'Harga, Promosi & Keanggotaan': {
                    keywords: ['harga', 'murah', 'terjangkau', 'promo', 'membership', 'paket', 'korporat'],
                    comments: [],
                    summary: 'Aspek harga tetap menjadi pertimbangan penting. Responden menyarankan adanya paket-paket menarik, program membership, dan promosi untuk membuat fasilitas lebih mudah diakses dan mendorong kunjungan rutin.'
                },
                'Spesifikasi Teknis Lapangan': {
                    keywords: ['silau', 'pasir', 'rata', 'dead spot', 'panas', 'penerangan', 'matras'],
                    comments: [],
                    summary: 'Pemain yang lebih serius memberikan masukan teknis yang spesifik. Isu seperti pantulan bola yang tidak rata (dead spots), silau, dan kualitas pasir/rumput adalah faktor krusial yang menentukan kepuasan mereka.'
                },
                'Dukungan & Antusiasme Pembangunan': {
                    keywords: ['segera', 'semoga', 'momentum', 'dibangun', 'ditunggu', 'jarang'],
                    comments: [],
                    summary: 'Sebagian besar masukan menunjukkan antusiasme dan dukungan tinggi agar proyek ini segera direalisasikan. Ada persepsi bahwa ada celah pasar yang bisa diisi, terutama untuk Padel di Surabaya Timur.'
                },
                'Operasional & Aksesibilitas': {
                    keywords: ['jam', 'operasional', '24 jam', 'booking', 'lokasi', 'parkir', 'akses'],
                    comments: [],
                    summary: 'Kemudahan adalah kunci. Jam operasional yang fleksibel (termasuk potensi 24 jam), sistem booking online yang andal, dan lokasi yang mudah diakses menjadi faktor penting bagi responden.'
                }
            };

            const otherComments = [];

            // 2. Kelompokkan komentar ke dalam tema
            parsedSurveyData.forEach(row => {
                const comment = row['Saran Lain'];
                if (comment && comment.trim() !== '' && !['-','ok','cukup','tidak ada'].includes(comment.trim().toLowerCase())) {
                    let assigned = false;
                    const lowerCaseComment = comment.toLowerCase();
                    for (const themeName in themes) {
                        for (const keyword of themes[themeName].keywords) {
                            if (lowerCaseComment.includes(keyword)) {
                                themes[themeName].comments.push(comment);
                                assigned = true;
                                break; // Pindah ke komentar berikutnya setelah tema ditemukan
                            }
                        }
                        if (assigned) break;
                    }
                    if (!assigned) {
                        otherComments.push(comment);
                    }
                }
            });
            
            // Tambahkan komentar lain-lain jika ada
            if (otherComments.length > 0) {
                 themes['Lain-lain & Spesifik'] = {
                    comments: otherComments,
                    summary: 'Beberapa masukan unik atau spesifik dari responden.'
                 }
            }
            
            // 3. Render hasil tematik ke HTML
            const themeColors = ['blue', 'purple', 'green', 'orange', 'teal', 'rose', 'gray'];
            let colorIndex = 0;

            for (const themeName in themes) {
                const themeData = themes[themeName];
                if (themeData.comments.length > 0) {
                    const color = themeColors[colorIndex % themeColors.length];
                    colorIndex++;

                    const themeDiv = document.createElement('div');
                    themeDiv.className = `p-5 border-l-4 bg-${color}-50 border-${color}-400 rounded-r-lg mb-6`;
                    
                    let commentsHtml = themeData.comments.map(c => 
                        `<li class="mt-2 p-3 bg-white border border-gray-200 rounded-md text-gray-700 italic">“${c}”</li>`
                    ).join('');

                    themeDiv.innerHTML = `
                        <h4 class="text-lg font-bold text-${color}-800">${themeName}</h4>
                        <p class="mt-1 text-sm text-gray-600">${themeData.summary || ''}</p>
                        <ul class="mt-3 space-y-1">${commentsHtml}</ul>
                    `;
                    themedFeedbackContainer.appendChild(themeDiv);
                }
            }
        }
    });


    // ====================================================================
    // BAGIAN 5: PERHITUNGAN SAMPEL SURVEI
    // ====================================================================
    tryToRender(() => {
        const totalPopulation = demographyData.reduce((sum, item) => sum + item.total, 0);
        const totalRing1 = demographyData.filter(d => d.ring === 1).reduce((sum, item) => sum + item.total, 0);
        const totalRing2 = demographyData.filter(d => d.ring === 2).reduce((sum, item) => sum + item.total, 0);
        
        // Populasi Total
        if(document.getElementById('sampleSize10')) document.getElementById('sampleSize10').innerText = formatNumber(slovin(totalPopulation, 0.10)) + ' Responden';
        if(document.getElementById('sampleSize5')) document.getElementById('sampleSize5').innerText = formatNumber(slovin(totalPopulation, 0.05)) + ' Responden';
        if(document.getElementById('sampleSize3')) document.getElementById('sampleSize3').innerText = formatNumber(slovin(totalPopulation, 0.03)) + ' Responden';
        
        // Rincian Ring 1
        if(document.getElementById('totalPopRing1')) document.getElementById('totalPopRing1').innerText = `(Total Populasi N = ${formatNumber(totalRing1)})`;
        if(document.getElementById('sampleSizeRing1_10')) document.getElementById('sampleSizeRing1_10').innerText = formatNumber(slovin(totalRing1, 0.10));
        if(document.getElementById('sampleSizeRing1_5')) document.getElementById('sampleSizeRing1_5').innerText = formatNumber(slovin(totalRing1, 0.05));
        if(document.getElementById('sampleSizeRing1_3')) document.getElementById('sampleSizeRing1_3').innerText = formatNumber(slovin(totalRing1, 0.03));
        
        // Rincian Ring 2 (Ini bagian yang dilengkapi)
        if(document.getElementById('totalPopRing2')) document.getElementById('totalPopRing2').innerText = `(Total Populasi N = ${formatNumber(totalRing2)})`;
        if(document.getElementById('sampleSizeRing2_10')) document.getElementById('sampleSizeRing2_10').innerText = formatNumber(slovin(totalRing2, 0.10));
        if(document.getElementById('sampleSizeRing2_5')) document.getElementById('sampleSizeRing2_5').innerText = formatNumber(slovin(totalRing2, 0.05));
        if(document.getElementById('sampleSizeRing2_3')) document.getElementById('sampleSizeRing2_3').innerText = formatNumber(slovin(totalRing2, 0.03));
    });

    // ====================================================================
    // BAGIAN X: ANALISIS DAMPAK EKONOMI & SOSIAL (BARU)
    // ====================================================================
    tryToRender(() => {
        const economicImpactTableBody = document.getElementById('economicImpactTableBody');
        const multiplierDiagramContainer = document.getElementById('multiplierEffectDiagram');

        if (!economicImpactTableBody || !multiplierDiagramContainer) return;

        // Asumsi data dari analisis finansial (gabungan Driving Range & Padel)
        const totalCapex = 4600000000 + 4000000000; // DR + Padel
        const totalOpexBulanan = 140000000 + 155000000; // DR + Padel
        const gajiBulanan = 55000000 + 70000000;
        const utilitasBulanan = 25000000 + 35000000;
        const perawatanBulanan = 12000000 + 10000000;
        const pemasaranBulanan = 15000000 + 15000000;
        
        // Estimasi Pendapatan
        const pendapatanTahunan = (375000000 + 243750000) * 12;

        // Data untuk tabel
        const impactData = [
            // DIRECT IMPACT
            { 
                category: 'Penciptaan Lapangan Kerja', 
                description: 'Pekerjaan langsung yang tercipta untuk mengoperasikan fasilitas (manajer, admin, pelatih, staf kebersihan, dll).', 
                contribution: `~25-30 FTE (Full-Time Equivalent)<br><span class='text-xs text-gray-500'>Estimasi Gaji & Upah: <strong>Rp ${formatNumber(gajiBulanan * 12)} / tahun</strong></span>` 
            },
            { 
                category: 'Investasi Lokal (Konstruksi)', 
                description: 'Belanja modal yang dialokasikan kepada kontraktor, pemasok material, dan tenaga kerja lokal selama fase pembangunan.', 
                contribution: `~60-70% dari Total CapEx<br><span class='text-xs text-gray-500'>Estimasi Nilai Kontrak Lokal: <strong>~Rp ${formatNumber(totalCapex * 0.65)}</strong> (sekali bayar)</span>` 
            },
            { 
                category: 'Pendapatan Pajak Daerah', 
                description: 'Kontribusi langsung ke kas daerah melalui PBB, Pajak Restoran (10%), dan Pajak Hiburan (variatif).', 
                contribution: `Estimasi <strong>Rp ${formatNumber(pendapatanTahunan * 0.05)} - ${formatNumber(pendapatanTahunan * 0.08)} / tahun</strong><br><span class='text-xs text-gray-500'>Tergantung tarif pajak final yang berlaku</span>`
            },
            // INDIRECT IMPACT
            { isHeader: true, title: 'II. Dampak Ekonomi Tidak Langsung (Indirect Impact)' },
            { 
                category: 'Aktivasi Rantai Pasok Lokal', 
                description: 'Permintaan rutin untuk barang dan jasa dari bisnis lokal (pemasok F&B, jasa laundry, ATK, dll).', 
                contribution: `Estimasi Belanja Operasional Non-Gaji: <strong>Rp ${formatNumber((totalOpexBulanan - gajiBulanan) * 12)} / tahun</strong>` 
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
            // SOCIAL IMPACT
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
        
        // Render tabel
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

        // Render diagram multiplier effect
        multiplierDiagramContainer.innerHTML = `
            <div class="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
                <!-- Sumber -->
                <div class="p-4 bg-blue-600 text-white rounded-lg shadow-lg">
                    <h4 class="font-bold text-lg">PROYEK SIER<br>SPORTS HUB</h4>
                    <p class="text-sm">Belanja Operasional Tahunan<br><strong>Rp ${formatNumber(totalOpexBulanan * 12)}</strong></p>
                </div>
                
                <!-- Panah -->
                <div class="text-3xl text-gray-400 font-light transform md:-translate-y-4">→</div>

                <!-- Penerima Langsung -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-green-100 text-green-800 rounded-md text-center">
                        <span class="font-bold">Gaji Karyawan</span>
                        <span class="block text-xs">Rp ${formatNumber(gajiBulanan*12)}</span>
                    </div>
                    <div class="p-3 bg-yellow-100 text-yellow-800 rounded-md text-center">
                        <span class="font-bold">Pemasok F&B</span>
                        <span class="block text-xs">Estimasi</span>
                    </div>
                     <div class="p-3 bg-purple-100 text-purple-800 rounded-md text-center">
                        <span class="font-bold">Utilitas (PLN, PDAM)</span>
                        <span class="block text-xs">Rp ${formatNumber(utilitasBulanan*12)}</span>
                    </div>
                    <div class="p-3 bg-pink-100 text-pink-800 rounded-md text-center">
                        <span class="font-bold">Jasa Lain</span>
                        <span class="block text-xs">(Laundry, Keamanan)</span>
                    </div>
                </div>

                <!-- Panah -->
                <div class="text-3xl text-gray-400 font-light transform md:-translate-y-4">→</div>
                
                <!-- Dampak Lanjutan -->
                <div class="p-4 bg-gray-700 text-white rounded-lg shadow-lg">
                    <h4 class="font-bold text-lg">EKONOMI LOKAL</h4>
                    <p class="text-sm">Karyawan berbelanja,<br>Pemasok menggaji staf,<br>menciptakan efek berantai.</p>
                </div>
            </div>
        `;

    });

    // ====================================================================
    // BAGIAN XI: ANALISIS TEKNIS & OPERASIONAL (BARU)
    // ====================================================================
    tryToRender(() => {
        const container = document.getElementById('technicalAnalysisContainer');
        if (!container) return;

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

        container.innerHTML = ''; // Kosongkan kontainer
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
            container.appendChild(sectionDiv);
        });

    });

    // ====================================================================
    // REVITALISASI ANALISIS FINANSIAL: DRIVING RANGE (STANDALONE)
    // ====================================================================
/*     tryToRender(function renderDrivingRangeFinance() {
        const container = document.getElementById('driving-range-financial-analysis');
        if (!container) return;
        const pnl = projectConfig.calculations.calculatePnlForUnit('drivingRange');
        const feasibility = projectConfig.calculations.getFeasibilityForUnit('drivingRange');
        container.innerHTML = `<!-- Konten di-generate oleh JS -->`; // Reset
        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-teal-600 pl-4">Analisis Finansial & Proyeksi BEP (Driving Range - Standalone)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 mb-6"><strong>Disclaimer:</strong> Analisis untuk proyek Driving Range jika dibangun secara mandiri.</div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div><h3 class="text-xl font-semibold text-gray-700">1. Estimasi Biaya Investasi (CapEx)</h3><p class="text-center text-4xl font-bold font-mono text-gray-800 mt-2">Rp ${formatNumber(feasibility.totalInvestment)}</p><p class="text-center text-sm text-gray-500">(Termasuk dana darurat)</p></div>
                    <div><h3 class="text-xl font-semibold text-gray-700">2. Estimasi Laba Bersih Tahunan</h3><p class="text-center text-4xl font-bold font-mono text-green-700 mt-2">Rp ${formatNumber(pnl.netProfit)}</p></div>
                </div>
                <div class="mt-8 pt-8 border-t"><h3 class="text-xl font-semibold mb-4 text-gray-700">3. Perhitungan Kelayakan Investasi</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div class="p-4 bg-blue-50 rounded-lg"><h4 class="font-semibold text-sm text-blue-800">Payback Period</h4><p class="text-3xl font-bold font-mono text-blue-600 mt-2">${feasibility.paybackPeriod.toFixed(2)}</p><p class="text-xs text-gray-500">Tahun</p></div>
                        <div class="p-4 bg-green-50 rounded-lg"><h4 class="font-semibold text-sm text-green-800">Net Present Value (NPV)</h4><p class="text-3xl font-bold font-mono text-green-600 mt-2">Rp ${toBillion(feasibility.npv)}</p></div>
                        <div class="p-4 bg-purple-50 rounded-lg"><h4 class="font-semibold text-sm text-purple-800">Internal Rate of Return (IRR)</h4><p class="text-3xl font-bold font-mono text-purple-600 mt-2">${(feasibility.irr * 100).toFixed(2)}%</p></div>
                    </div>
                </div>
            </div>`;
    });
 */

    // ====================================================================
    // REVITALISASI ANALISIS FINANSIAL: PADEL (STANDALONE)
    // ====================================================================
/*     tryToRender(function renderPadelFinance() {
        const container = document.getElementById('padel-financial-analysis');
        if (!container) return;
        const pnl = projectConfig.calculations.calculatePnlForUnit('padel');
        const feasibility = projectConfig.calculations.getFeasibilityForUnit('padel');
        container.innerHTML = `<!-- Konten di-generate oleh JS -->`; // Reset
        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Analisis Finansial & Proyeksi BEP (Padel - Standalone)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 mb-6"><strong>Disclaimer:</strong> Analisis untuk proyek Padel jika dibangun secara mandiri.</div>
                 <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div><h3 class="text-xl font-semibold text-gray-700">1. Estimasi Biaya Investasi (CapEx)</h3><p class="text-center text-4xl font-bold font-mono text-gray-800 mt-2">Rp ${formatNumber(feasibility.totalInvestment)}</p><p class="text-center text-sm text-gray-500">(Termasuk dana darurat)</p></div>
                    <div><h3 class="text-xl font-semibold text-gray-700">2. Estimasi Laba Bersih Tahunan</h3><p class="text-center text-4xl font-bold font-mono text-green-700 mt-2">Rp ${formatNumber(pnl.netProfit)}</p></div>
                </div>
                <div class="mt-8 pt-8 border-t"><h3 class="text-xl font-semibold mb-4 text-gray-700">3. Perhitungan Kelayakan Investasi</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div class="p-4 bg-blue-50 rounded-lg"><h4 class="font-semibold text-sm text-blue-800">Payback Period</h4><p class="text-3xl font-bold font-mono text-blue-600 mt-2">${feasibility.paybackPeriod.toFixed(2)}</p><p class="text-xs text-gray-500">Tahun</p></div>
                        <div class="p-4 bg-green-50 rounded-lg"><h4 class="font-semibold text-sm text-green-800">Net Present Value (NPV)</h4><p class="text-3xl font-bold font-mono text-green-600 mt-2">Rp ${toBillion(feasibility.npv)}</p></div>
                        <div class="p-4 bg-purple-50 rounded-lg"><h4 class="font-semibold text-sm text-purple-800">Internal Rate of Return (IRR)</h4><p class="text-3xl font-bold font-mono text-purple-600 mt-2">${(feasibility.irr * 100).toFixed(2)}%</p></div>
                    </div>
                </div>
            </div>`;
    });

    tryToRender(function renderFinancialAnalysisCombined() {
        const container = document.getElementById('financial-analysis-summary');
        if (!container) return;
        // Panggil fungsi gabungan
        const pnl = projectConfig.calculations.calculatePnlForCombined();
        const feasibility = projectConfig.calculations.getFeasibilityForCombined();
        const investment = feasibility.totalInvestment;
        // Skenario sensitivitas
        const pesimisticPnl = projectConfig.calculations.calculatePnlForCombined(0.85, 1.10);
        const optimisticPnl = projectConfig.calculations.calculatePnlForCombined(1.15, 1.00);
        const pesimisticPayback = pesimisticPnl.cashFlowFromOps > 0 ? (investment / pesimisticPnl.cashFlowFromOps).toFixed(2) : "N/A";
        const optimisticPayback = (investment / optimisticPnl.cashFlowFromOps).toFixed(2);
        
        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-rose-600 pl-4">Analisis Keuangan & Kelayakan Investasi (Proyek Gabungan)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 mb-6 text-sm"><strong>Proyeksi Gabungan:</strong> Menampilkan sinergi finansial jika kedua fasilitas dibangun bersamaan.</div>
                <div id="capex-summary" class="mb-8 pb-6 border-b">
                     <h3 class="text-xl font-semibold mb-4 text-gray-700">1. Total Biaya Investasi (CapEx) Gabungan</h3>
                     <p class="text-center text-5xl font-bold font-mono text-rose-600 mt-2">Rp ${formatNumber(investment)}</p>
                     <p class="text-center text-sm text-gray-500">(Total CapEx Driving Range + Padel, termasuk dana darurat)</p>
                </div>
                <div id="pnl-summary" class="mb-8 pb-6 border-b">
                     <h3 class="text-xl font-semibold mb-4 text-gray-700">2. Proyeksi Laba Rugi (P&L) Gabungan - Tahun Pertama</h3>
                     <table class="w-full text-sm">
                        <tbody class="divide-y">
                            <tr><td class="py-2">Total Pendapatan</td><td class="py-2 text-right font-mono">${formatNumber(pnl.annualRevenue)}</td></tr>
                            <tr class="font-semibold bg-gray-50"><td class="py-2 px-2">EBITDA</td><td class="py-2 px-2 text-right font-mono">${formatNumber(pnl.ebitda)}</td></tr>
                            <tr class="font-bold text-lg bg-teal-50"><td class="py-3 px-2">Estimasi Laba Bersih</td><td class="py-3 px-2 text-right font-mono text-teal-700">${formatNumber(pnl.netProfit)}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div id="investment-feasibility" class="mb-8 pb-6 border-b">
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">3. Analisis Kelayakan Investasi Gabungan</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div class="p-4 bg-blue-50 rounded-lg"><h4 class="font-semibold text-sm text-blue-800">Payback Period</h4><p class="text-3xl font-bold font-mono text-blue-600 mt-1">${feasibility.paybackPeriod.toFixed(2)}</p><p class="text-xs text-gray-500">Tahun</p></div>
                        <div class="p-4 bg-green-50 rounded-lg"><h4 class="font-semibold text-sm text-green-800">Net Present Value (NPV)</h4><p class="text-3xl font-bold font-mono text-green-600 mt-1">Rp ${toBillion(feasibility.npv)}</p></div>
                        <div class="p-4 bg-purple-50 rounded-lg"><h4 class="font-semibold text-sm text-purple-800">Internal Rate of Return (IRR)</h4><p class="text-3xl font-bold font-mono text-purple-600 mt-1">${(feasibility.irr * 100).toFixed(2)}%</p></div>
                    </div>
                </div>
                <div id="sensitivity-analysis">
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">4. Analisis Sensitivitas Proyek Gabungan</h3>
                    <table class="w-full text-sm"><thead class="text-xs text-gray-700 uppercase bg-gray-100"><tr><th class="px-4 py-3 text-left">Metrik</th><th class="px-4 py-3 text-center">Pesimis</th><th class="px-4 py-3 text-center">Realisitis</th><th class="px-4 py-3 text-center">Optimis</th></tr></thead>
                    <tbody class="text-center"><tr class="border-b"><td class="px-4 py-3 text-left font-semibold">Laba Bersih Tahunan</td><td class="px-4 py-3 font-mono text-red-600">${formatNumber(pesimisticPnl.netProfit)}</td><td class="px-4 py-3 font-mono font-bold">${formatNumber(pnl.netProfit)}</td><td class="px-4 py-3 font-mono text-green-600">${formatNumber(optimisticPnl.netProfit)}</td></tr>
                    <tr class="border-b"><td class="px-4 py-3 text-left font-semibold">Payback Period (Tahun)</td><td class="px-4 py-3 font-mono text-red-600">${pesimisticPayback}</td><td class="px-4 py-3 font-mono font-bold">${feasibility.paybackPeriod.toFixed(2)}</td><td class="px-4 py-3 font-mono text-green-600">${optimisticPayback}</td></tr></tbody></table>
                </div>
            </div>`;
    }); */

    // ====================================================================
    // 1. VISUALISASI ASUMSI MODEL KEUANGAN
    // ====================================================================
    tryToRender(function renderFinancialAssumptions() {
        const container = document.getElementById('assumptions-container');
        if (!container) return;

        const { assumptions: globalAssumptions, drivingRange, padel, keyTranslations } = projectConfig;

        // Helper untuk membuat baris tabel yang dapat diedit
        const createEditableRow = (key, value, path, isOpex = false) => {
            const translatedKey = keyTranslations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            let displayValue;
            let inputValue = value;

            if ((key.includes('rate') || key.includes('okupansi')) && value < 2 && value > 0) {
                displayValue = `${(value * 100).toFixed(0)}%`;
                inputValue = value; // Input tetap dalam format desimal (e.g., 0.22)
            } else {
                displayValue = formatNumber(value);
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
        
        // Helper untuk membuat tabel dari objek data
        const createTable = (data, basePath, title, isOpex = false) => {
            let rowsHtml = Object.entries(data).map(([key, value]) => {
                const currentPath = `${basePath}.${key}`;
                if (typeof value === 'object' && value !== null) {
                    // Untuk objek bersarang seperti price_per_hour
                    let subRows = Object.entries(value).map(([subKey, subValue]) => {
                        const subPath = `${currentPath}.${subKey}`;
                        const translatedSubKey = keyTranslations[subKey] || subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return `<li class="flex justify-between">
                                    <span class="font-medium">${translatedSubKey}:</span>
                                    <span class="relative group">
                                        <span class="value-display">${formatNumber(subValue)}</span>
                                        <input type="number" step="any" value="${subValue}" data-path="${subPath}" class="value-input absolute top-0 right-14 w-24 p-1 border rounded shadow-sm hidden">
                                        <a href="#" class="edit-icon text-gray-400 hover:text-blue-600 ml-2 opacity-0 group-hover:opacity-100" data-path="${subPath}">✎</a>
                                    </span>
                                </li>`;
                    }).join('');
                    const translatedKey = keyTranslations[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return `<tr class="border-b"><td class="py-3 px-4 font-semibold text-gray-700 w-2/5">${translatedKey}</td><td class="py-3 px-4 text-gray-600"><ul class="space-y-1">${subRows}</ul></td></tr>`;
                } else {
                    return createEditableRow(key, value, currentPath, isOpex);
                }
            }).join('');
            return `<h4 class="text-lg font-semibold text-gray-700 mb-2">${title}</h4><table class="w-full text-sm"><tbody>${rowsHtml}</tbody></table>`;
        };

        container.innerHTML = `
            <div><h3 class="text-xl font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">A. Asumsi Global</h3>${createTable(globalAssumptions, 'assumptions', '')}</div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-12 pt-6 border-t">
                <div>
                    <h3 class="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">B. Model Bisnis Driving Range</h3>
                    <div class="space-y-6">
                        ${createTable(drivingRange.operational_assumptions, 'drivingRange.operational_assumptions', 'Asumsi Operasional')}
                        ${createTable(drivingRange.revenue, 'drivingRange.revenue', 'Unit Pendapatan')}
                        ${createTable(drivingRange.opexMonthly, 'drivingRange.opexMonthly', 'Biaya Operasional Bulanan', true)}
                    </div>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">C. Model Bisnis Padel</h3>
                    <div class="space-y-6">
                        ${createTable(padel.operational_assumptions, 'padel.operational_assumptions', 'Asumsi Operasional')}
                        ${createTable(padel.revenue, 'padel.revenue', 'Unit Pendapatan')}
                        ${createTable(padel.opexMonthly, 'padel.opexMonthly', 'Biaya Operasional Bulanan', true)}
                    </div>
                </div>
            </div>
        `;
    });

    // ====================================================================
    // BAGIAN XII: ANALISIS KEUANGAN & KELAYAKAN INVESTASI (VERSI BOTTOM UP)
    // ====================================================================
    tryToRender(function renderFinancialAnalysis() {
        const drContainer = document.getElementById('driving-range-financial-analysis');
        const padelContainer = document.getElementById('padel-financial-analysis');
        const combinedContainer = document.getElementById('financial-analysis-summary');

        if (!drContainer || !padelContainer || !combinedContainer) return;
        
        // 1. Panggil kalkulator terpusat untuk mendapatkan SEMUA data
        const summary = projectConfig.calculations.getFinancialSummary();
        const { drivingRange: dr, padel, combined } = summary;

        const toBillion = (num) => (num / 1000000000).toFixed(2) + ' M';

        // Fungsi helper untuk generate tabel P&L
        const createPnlTable = (pnlData) => `
            <table class="w-full text-sm">
                <tbody class="divide-y">
                    <tr><td class="py-2">Total Pendapatan Tahunan</td><td class="py-2 text-right font-mono">${formatNumber(pnlData.annualRevenue)}</td></tr>
                    <tr><td class="py-2">Harga Pokok Penjualan (HPP/COGS)</td><td class="py-2 text-right font-mono">(${formatNumber(pnlData.annualCogs)})</td></tr>
                    <tr class="font-semibold"><td class="py-2">Laba Kotor</td><td class="py-2 text-right font-mono">${formatNumber(pnlData.grossProfit)}</td></tr>
                    <tr><td class="py-2">Beban Operasional (OpEx) Tahunan</td><td class="py-2 text-right font-mono">(${formatNumber(pnlData.annualOpex)})</td></tr>
                    <tr class="font-semibold bg-gray-50"><td class="py-2 px-2">EBITDA</td><td class="py-2 px-2 text-right font-mono">${formatNumber(pnlData.ebitda)}</td></tr>
                    <tr><td class="py-2">Beban Depresiasi Tahunan</td><td class="py-2 text-right font-mono">(${formatNumber(pnlData.annualDepreciation)})</td></tr>
                    <tr class="font-semibold"><td class="py-2">Laba Sebelum Pajak (EBT)</td><td class="py-2 text-right font-mono">${formatNumber(pnlData.ebt)}</td></tr>
                    <tr><td class="py-2">Pajak Penghasilan</td><td class="py-2 text-right font-mono">(${formatNumber(pnlData.tax)})</td></tr>
                    <tr class="font-bold text-lg bg-teal-50"><td class="py-3 px-2">Estimasi Laba Bersih Tahunan</td><td class="py-3 px-2 text-right font-mono text-teal-700">${formatNumber(pnlData.netProfit)}</td></tr>
                </tbody>
            </table>
        `;

        // 2. Render bagian Driving Range
        drContainer.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-teal-600 pl-4">Analisis Finansial (Driving Range)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-semibold text-gray-700 mb-2">1. Rincian Biaya Investasi (CapEx)</h3>
                <p class="text-center text-4xl font-bold font-mono text-gray-800">Rp ${formatNumber(dr.capex.total)}</p>
                <h3 class="text-xl font-semibold text-gray-700 mt-6 mb-2">2. Proyeksi Laba Rugi Tahunan</h3>
                ${createPnlTable(dr.pnl)}
            </div>
        `;

        // 3. Render bagian Padel
        padelContainer.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Analisis Finansial (Padel)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-semibold text-gray-700 mb-2">1. Rincian Biaya Investasi (CapEx)</h3>
                <p class="text-center text-4xl font-bold font-mono text-gray-800">Rp ${formatNumber(padel.capex.total)}</p>
                <h3 class="text-xl font-semibold text-gray-700 mt-6 mb-2">2. Proyeksi Laba Rugi Tahunan</h3>
                ${createPnlTable(padel.pnl)}
            </div>
        `;

        // 4. Render bagian Gabungan (Summary)
        const pesimistic = projectConfig.calculations.getFinancialSummary(0.85, 1.10).combined;
        const optimistic = projectConfig.calculations.getFinancialSummary(1.15, 1.00).combined;

        combinedContainer.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-rose-600 pl-4">Analisis Keuangan & Kelayakan Investasi (Proyek Gabungan)</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 mb-6 text-sm">Proyeksi ini menggabungkan kedua unit bisnis dan hasilnya akan berubah secara real-time sesuai perubahan asumsi di atas.</div>
                
                <div class="mb-8 pb-6 border-b">
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">1. Total Biaya Investasi (CapEx) Gabungan</h3>
                    <p class="text-center text-5xl font-bold font-mono text-rose-600">Rp ${formatNumber(combined.capex.total)}</p>
                </div>
                
                <div class="mb-8 pb-6 border-b">
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">2. Proyeksi Laba Rugi Gabungan (Tahun Pertama)</h3>
                    ${createPnlTable(combined.pnl)}
                </div>

                <div class="mb-8 pb-6 border-b">
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">3. Analisis Kelayakan Investasi Gabungan</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div class="p-4 bg-blue-50 rounded-lg"><h4 class="font-semibold text-sm text-blue-800">Payback Period</h4><p class="text-3xl font-bold font-mono text-blue-600 mt-1">${(combined.feasibility.paybackPeriod || 0).toFixed(2)}</p><p class="text-xs text-gray-500">Tahun</p></div>
                        <div class="p-4 bg-green-50 rounded-lg"><h4 class="font-semibold text-sm text-green-800">Net Present Value (NPV)</h4><p class="text-3xl font-bold font-mono text-green-600 mt-1">Rp ${toBillion(combined.feasibility.npv || 0)}</p></div>
                        <div class="p-4 bg-purple-50 rounded-lg"><h4 class="font-semibold text-sm text-purple-800">Internal Rate of Return (IRR)</h4><p class="text-3xl font-bold font-mono text-purple-600 mt-1">${((combined.feasibility.irr || 0) * 100).toFixed(2)}%</p></div>
                    </div>
                </div>

                <div>
                    <h3 class="text-xl font-semibold mb-4 text-gray-700">4. Analisis Sensitivitas Proyek Gabungan</h3>
                    <table class="w-full text-sm">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th class="px-4 py-3 text-left">Metrik</th>
                                <th class="px-4 py-3 text-center">Pesimis</th>
                                <th class="px-4 py-3 text-center">Realisitis</th>
                                <th class="px-4 py-3 text-center">Optimis</th>
                            </tr>
                        </thead>
                        <tbody class="text-center">
                            <tr class="border-b">
                                <td class="px-4 py-3 text-left font-semibold">Laba Bersih Tahunan</td>
                                <td class="px-4 py-3 font-mono text-red-600">${formatNumber(pesimistic.pnl.netProfit)}</td>
                                <td class="px-4 py-3 font-mono font-bold">${formatNumber(combined.pnl.netProfit)}</td>
                                <td class="px-4 py-3 font-mono text-green-600">${formatNumber(optimistic.pnl.netProfit)}</td>
                            </tr>
                            <tr class="border-b">
                                <td class="px-4 py-3 text-left font-semibold">Payback Period (Tahun)</td>
                                <td class="px-4 py-3 font-mono text-red-600">${(pesimistic.feasibility.paybackPeriod || 0).toFixed(2)}</td>
                                <td class="px-4 py-3 font-mono font-bold">${(combined.feasibility.paybackPeriod || 0).toFixed(2)}</td>
                                <td class="px-4 py-3 font-mono text-green-600">${(optimistic.feasibility.paybackPeriod || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    // ====================================================================
    // REFAKTOR ANALISIS BISNIS PADEL DENGAN DATA TERPUSAT
    // ====================================================================
    tryToRender(function refactorPadelBusinessAnalysis() {
        const bepContainer = document.querySelector('#business-strategy-analysis');
        if (!bepContainer) return false;

        // Ambil elemen yang akan di-update
        const bepResultContainer = bepContainer.querySelector('.bg-blue-50');
        if (!bepResultContainer) return false;

        // Lakukan kalkulasi BEP hanya untuk Padel menggunakan data dari projectConfig
        const p = projectConfig.padel;
        const a = projectConfig.assumptions;

        // Total Biaya Tetap Bulanan HANYA untuk Padel
        const fixedCostMonthlyPadel = p.opexMonthly.salaries + p.opexMonthly.rent + p.opexMonthly.marketing + p.opexMonthly.fnb_other_costs;
        
        // Margin kontribusi rata-rata per jam
        // Kita bisa ambil pendekatan sederhana: Total Revenue Padel / Total Jam Booking Padel
        const monthlyRevenuePadel = projectConfig.calculations.getMonthlyRevenue().padel.total;
        
        const hours_weekday_offpeak = p.courts.count * p.courts.hours_distribution.offpeak_per_day * p.courts.occupancy.weekday_offpeak;
        const hours_weekday_peak = p.courts.count * p.courts.hours_distribution.peak_per_day * p.courts.occupancy.weekday_peak;
        const hours_weekend = p.courts.count * a.operational_hours_per_day * p.courts.occupancy.weekend;
        const totalHoursBookedMonthly = (hours_weekday_offpeak + hours_weekday_peak) * a.workdays_in_month + hours_weekend * a.weekend_days_in_month;
        
        const averageRevenuePerHour = monthlyRevenuePadel / totalHoursBookedMonthly;
        // Asumsi biaya variabel per jam (listrik, air)
        const variableCostPerHour = (p.opexMonthly.utilities + p.opexMonthly.maintenance) / totalHoursBookedMonthly;
        const contributionMarginPerHour = averageRevenuePerHour - variableCostPerHour;

        // Titik Impas dalam Jam
        const bepHoursMonthly = fixedCostMonthlyPadel / contributionMarginPerHour;
        const bepHoursDaily = bepHoursMonthly / (a.workdays_in_month + a.weekend_days_in_month);
        const bepHoursPerCourtDaily = bepHoursDaily / p.courts.count;

        // Update DOM
        bepResultContainer.innerHTML = `
            <p class="text-sm text-gray-600">Jam Sewa Minimum per Bulan (BEP)</p>
            <p class="text-3xl font-bold text-blue-700">${Math.ceil(bepHoursMonthly)} Jam</p>
            <p class="text-sm text-gray-600 mt-3">Target per Hari (untuk ${p.courts.count} Lapangan)</p>
            <p class="text-2xl font-bold text-blue-700">~${bepHoursDaily.toFixed(1)} Jam Sewa</p>
            <p class="text-sm text-gray-600 mt-1">(Rata-rata ~${bepHoursPerCourtDaily.toFixed(1)} jam per lapangan per hari)</p>
        `;

        return true;
    });

    // ====================================================================
    // REFAKTOR ANALISIS RISIKO DENGAN DAMPAK KUANTITATIF
    // ====================================================================
    tryToRender(function refactorRiskAnalysis() {
        const riskTable = document.querySelector('#risk-analysis table');
        if (!riskTable) return false;

        const tbody = riskTable.querySelector('tbody');

        // Kalkulasi dampak finansial dari skenario pesimis
        const realisticPnl = projectConfig.calculations.calculatePnl();
        const pesimisticPnl = projectConfig.calculations.calculatePnl(0.85, 1.10); // Sesuai skenario sensitivitas
        const profitDrop = realisticPnl.netProfit - pesimisticPnl.netProfit;
        
        // Buat baris baru untuk dampak kuantitatif
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

        // Hapus baris risiko lama yang relevan dan sisipkan yang baru
        // Ini contoh sederhana, Anda bisa membuatnya lebih canggih
        const rows = tbody.querySelectorAll('tr');
        if (rows.length > 0) {
            // Hapus baris "Permintaan Lebih Rendah dari Proyeksi"
            if (rows[0].innerText.includes('Permintaan Lebih Rendah')) {
                rows[0].remove();
            }
        }
        tbody.prepend(newRow); // Sisipkan baris baru yang lebih detail di paling atas

        return true;
    });

    function updateAllVisuals() {
        console.log("Updating all visuals...");
        // Daftar ini harus berisi nama semua fungsi render Anda
        const renderFunctions = [
            renderDemographyAndCharts,
            // renderDetailedDemography, // Jika Anda memisahkannya
            renderIncomeAndMarketAnalysis,
            renderSurveyAnalysis,
            // renderDeepDiveSurvey,
            renderSampleSurveyCalculation,
            renderEconomicImpact,
            renderTechnicalAnalysis,
            renderFinancialAssumptions,
            renderFinancialAnalysis,
            refactorPadelBusinessAnalysis,
            refactorRiskAnalysis
        ];
        
        // Ganti semua pemanggilan tryToRender() individu dengan loop ini
        renderFunctions.forEach(fn => {
             // Pastikan nama fungsinya benar dan ada di scope ini
            if (typeof fn === 'function') {
                tryToRender(fn);
            }
        });
    }

    // --- (BARU) LOGIKA UNTUK EDITING REAL-TIME ---
    const assumptionsContainer = document.getElementById('assumptions-container');
    if (assumptionsContainer) {
    
        // Fungsi untuk mengambil nilai dari objek bersarang menggunakan string path
        const getValueByPath = (obj, path) => path.split('.').reduce((o, k) => (o && o[k] !== 'undefined') ? o[k] : undefined, obj);

        // Fungsi untuk mengatur nilai pada objek bersarang menggunakan string path
        const setValueByPath = (obj, path, value) => {
            const keys = path.split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
            target[lastKey] = value;
        };

        // Event listener untuk ikon edit
        assumptionsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-icon')) {
                e.preventDefault();
                const targetPath = e.target.dataset.path;
                const valueSpan = e.target.previousElementSibling.previousElementSibling;
                const inputField = e.target.previousElementSibling;

                // Sembunyikan tampilan, tampilkan input
                valueSpan.classList.add('hidden');
                e.target.classList.add('hidden');
                inputField.classList.remove('hidden');
                inputField.focus();
                inputField.select();
            }
        });

        // Event listener untuk input (saat selesai edit)
        assumptionsContainer.addEventListener('change', function(e) {
             if (e.target.classList.contains('value-input')) {
                const inputField = e.target;
                const newValue = parseFloat(inputField.value);
                const targetPath = inputField.dataset.path;

                if (!isNaN(newValue)) {
                    // 1. Update nilai di objek projectConfig
                    setValueByPath(projectConfig, targetPath, newValue);
                    
                    // 2. Panggil fungsi render ulang utama
                    updateAllVisuals();
                } else {
                    // Jika input tidak valid, kembalikan seperti semula tanpa mengubah
                    const valueSpan = inputField.previousElementSibling;
                    const editIcon = inputField.nextElementSibling;
                    inputField.classList.add('hidden');
                    valueSpan.classList.remove('hidden');
                    editIcon.classList.remove('hidden');
                }
             }
        });
        
        // Juga tangani saat menekan tombol Enter
        assumptionsContainer.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.classList.contains('value-input')) {
                e.preventDefault();
                e.target.blur(); // Memicu event 'change' yang sudah kita buat
            }
        });
    }
    
    // --- (BARU) PANGGIL FUNGSI MASTER SAAT HALAMAN PERTAMA KALI DIMUAT ---
    updateAllVisuals();


});