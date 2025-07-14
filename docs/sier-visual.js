// File: sier-visual.js (Versi Diperbaiki dan Disederhanakan)

document.addEventListener('DOMContentLoaded', () => {

    // --- HELPER FUNCTIONS ---
    function formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    }

    const slovin = (N, e) => Math.ceil(N / (1 + N * e * e));
    
    // --- WRAPPER UNTUK MENCEGAH ERROR JIKA ELEMEN TIDAK DITEMUKAN ---
    function tryToRender(fn) {
        try {
            fn();
        } catch (error) {
            console.error("Error saat merender bagian:", error);
            // Error ini wajar jika section HTML terkait tidak ada.
        }
    }
    

    // ====================================================================
    // BAGIAN 1: DATA DEMOGRAFI & ANALISIS DASAR
    // ====================================================================
    tryToRender(() => {
        // Data Processing
        const totalPopulation = demographyData.reduce((sum, item) => sum + item.total, 0);
        const totalRing1 = demographyData.filter(d => d.ring === 1).reduce((sum, item) => sum + item.total, 0);
        const totalRing2 = demographyData.filter(d => d.ring === 2).reduce((sum, item) => sum + item.total, 0);
        const totalsByAge = {
            '0-14 Thn': demographyData.reduce((sum, item) => sum + item.usia0_14, 0),
            '15-24 Thn': demographyData.reduce((sum, item) => sum + item.usia15_24, 0),
            '25-39 Thn': demographyData.reduce((sum, item) => sum + item.usia25_39, 0),
            '40-54 Thn': demographyData.reduce((sum, item) => sum + item.usia40_54, 0),
            '55-64 Thn': demographyData.reduce((sum, item) => sum + item.usia55_64, 0),
            '65+ Thn': demographyData.reduce((sum, item) => sum + item.usia65_plus, 0),
        };
        const totalProductive = totalsByAge['15-24 Thn'] + totalsByAge['25-39 Thn'] + totalsByAge['40-54 Thn'] + totalsByAge['55-64 Thn'];
        const totalNonProductive = totalsByAge['0-14 Thn'] + totalsByAge['65+ Thn'];
        const dependencyRatio = totalProductive > 0 ? ((totalNonProductive / totalProductive) * 100).toFixed(2) : 0;
        const totalsByKecamatan = demographyData.reduce((acc, curr) => {
            acc[curr.kecamatan] = (acc[curr.kecamatan] || 0) + curr.total;
            return acc;
        }, {});

        // DOM Manipulation
        document.getElementById('totalPenduduk').innerText = formatNumber(totalPopulation);
        document.getElementById('totalRing1').innerText = formatNumber(totalRing1);
        document.getElementById('totalRing2').innerText = formatNumber(totalRing2);
        document.getElementById('dependencyRatio').innerText = dependencyRatio;

        const tableBody = document.getElementById('dataTableBody');
        if(tableBody) {
            tableBody.innerHTML = '';
            demographyData.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = 'bg-white border-b hover:bg-gray-50';
                tr.innerHTML = `
                    <td class="px-3 py-4 font-medium text-gray-900">${row.kecamatan}</td><td class="px-3 py-4">${row.kelurahan}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.total)}</td><td class="px-3 py-4 text-center">${formatNumber(row.usia0_14)}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.usia15_24)}</td><td class="px-3 py-4 text-center">${formatNumber(row.usia25_39)}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.usia40_54)}</td><td class="px-3 py-4 text-center">${formatNumber(row.usia55_64)}</td>
                    <td class="px-3 py-4 text-center">${formatNumber(row.usia65_plus)}</td><td class="px-3 py-4 text-center">${row.ring}</td>
                `;
                tableBody.appendChild(tr);
            });
        }

        // Render Charts
        if (document.getElementById('ringChart')) new Chart(document.getElementById('ringChart'), { type: 'doughnut', data: { labels: ['Ring 1', 'Ring 2'], datasets: [{ data: [totalRing1, totalRing2], backgroundColor: ['#10B981', '#F59E0B'] }] }, options: { responsive: true, plugins: { tooltip: { callbacks: { label: (c) => `${c.label}: ${formatNumber(c.raw)}` } } } } });
        if (document.getElementById('ageDistributionChart')) new Chart(document.getElementById('ageDistributionChart'), { type: 'bar', data: { labels: Object.keys(totalsByAge), datasets: [{ label: 'Total Penduduk', data: Object.values(totalsByAge), backgroundColor: 'rgba(59, 130, 246, 0.7)' }] }, options: { responsive: true, scales: { y: { ticks: { callback: (v) => formatNumber(v) } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatNumber(c.raw)}` } } } } });
        if (document.getElementById('productiveRatioChart')) new Chart(document.getElementById('productiveRatioChart'), { type: 'doughnut', data: { labels: ['Usia Produktif (15-64 Thn)', 'Usia Non-Produktif (0-14 & 65+ Thn)'], datasets: [{ data: [totalProductive, totalNonProductive], backgroundColor: ['#2563EB', '#DC2626'] }] }, options: { responsive: true, plugins: { tooltip: { callbacks: { label: (c) => `${c.label}: ${formatNumber(c.raw)}` } } } } });
        if (document.getElementById('kecamatanChart')) new Chart(document.getElementById('kecamatanChart'), { type: 'bar', data: { labels: Object.keys(totalsByKecamatan), datasets: [{ label: 'Total Populasi', data: Object.values(totalsByKecamatan), backgroundColor: ['#8B5CF6', '#EC4899', '#F97316', '#14B8A6'] }] }, options: { indexAxis: 'y', responsive: true, scales: { x: { ticks: { callback: (v) => formatNumber(v) } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatNumber(c.raw)}` } } } } });
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
        if(incomeTableBody) { /* ... render table logic ... */ } // Logika tabel pendapatan bisa dimasukkan jika diperlukan

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
        if(incomeDonutsContainer) { /* ... render donuts logic ... */ } // Logika donat pendapatan bisa dimasukkan jika diperlukan

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

});