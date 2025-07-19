// File: sier-chart.js
// Bertanggung jawab untuk membuat dan merender SEMUA chart di halaman.
// Bergantung pada `Chart` (dari CDN), `sierMath`, dan `sierHelpers`.

const sierChart = {
    /**
     * Helper utama untuk membuat/memperbarui instance Chart.js di canvas.
     * @param {string} canvasId - ID dari elemen <canvas>.
     * @param {object} chartConfig - Konfigurasi untuk Chart.js (type, data, options).
     * @returns {Chart|null} - Instance Chart yang baru dibuat atau null jika gagal.
     */
    createChart(canvasId, chartConfig) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas dengan ID '${canvasId}' tidak ditemukan.`);
            return null;
        }
        if (canvas.chartInstance) {
            canvas.chartInstance.destroy();
        }
        const ctx = canvas.getContext('2d');
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (c) => {
                            const value = c.raw || c.raw?.y || c.raw?.r || 0;
                            let total = 0;
                            if (['doughnut', 'pie'].includes(c.chart.config.type)) {
                                total = c.chart.data.datasets[0].data.reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
                            }
                            const percentage = total > 0 ? ` (${(value / total * 100).toFixed(1)}%)` : '';
                            const formattedValue = sierHelpers.formatNumber(value);
                            return `${c.label || ''}: ${formattedValue}${percentage}`;
                        }
                    }
                }
            }
        };

        const finalConfig = {
            ...chartConfig,
            options: { ...defaultOptions, ...chartConfig.options }
        };

        canvas.chartInstance = new Chart(ctx, finalConfig);
        return canvas.chartInstance;
    },

    /**
     * Merender semua chart di bagian demografi utama.
     */
    _renderDemographyCharts() {
        const summary = sierMath.getDemographySummary();
        if (!summary || !summary.totalPopulation) return;

        this.createChart('ringChart', { type: 'doughnut', data: { labels: ['Ring 1', 'Ring 2'], datasets: [{ data: [summary.totalRing1, summary.totalRing2], backgroundColor: ['#10B981', '#F59E0B'] }] } });
        this.createChart('ageDistributionChart', { type: 'bar', data: { labels: Object.keys(summary.totalsByAge), datasets: [{ label: 'Total Penduduk', data: Object.values(summary.totalsByAge), backgroundColor: 'rgba(59, 130, 246, 0.7)' }] }, options: { plugins: { legend: { display: false } } } });
        this.createChart('productiveRatioChart', { type: 'doughnut', data: { labels: ['Usia Produktif', 'Usia Non-Produktif'], datasets: [{ data: [summary.totalProductive, summary.totalNonProductive], backgroundColor: ['#2563EB', '#DC2626'] }] } });
        this.createChart('kecamatanChart', { type: 'bar', data: { labels: Object.keys(summary.totalsByKecamatan), datasets: [{ label: 'Total Populasi', data: Object.values(summary.totalsByKecamatan), backgroundColor: ['#8B5CF6', '#EC4899', '#F97316', '#14B8A6'] }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } } } });
    },

    /**
     * Merender semua chart di bagian analisis demografi detail.
     */
    _renderDetailedDemographyCharts() {
        const data = sierMath.getDetailedDemography();
        if (!data) return;

        this.createChart('ageDistributionByRingChart', { type: 'bar', data: { labels: data.ageLabels, datasets: [{ label: 'Ring 1', data: Object.values(data.byRing1), backgroundColor: 'rgba(22, 163, 74, 0.7)' }, { label: 'Ring 2', data: Object.values(data.byRing2), backgroundColor: 'rgba(245, 158, 11, 0.7)' }] } });
        
        const container = document.getElementById('kecamatanAgeChartsContainer');
        if (container) {
            container.innerHTML = "";
            const colors = ['rgba(59, 130, 246, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(236, 72, 153, 0.7)', 'rgba(20, 184, 166, 0.7)'];
            let colorIndex = 0;
            for (const kecamatanName in data.byKecamatan) {
                const chartId = `kecamatan-age-chart-${kecamatanName.replace(/\s/g, '-')}`;
                const chartWrapper = document.createElement('div');
                chartWrapper.className = 'relative h-80';
                chartWrapper.innerHTML = `<h4 class="text-lg font-semibold text-center mb-2 text-gray-700">${kecamatanName}</h4><canvas id="${chartId}"></canvas>`;
                container.appendChild(chartWrapper);
                this.createChart(chartId, { type: 'bar', data: { labels: data.ageLabels, datasets: [{ label: kecamatanName, data: Object.values(data.byKecamatan[kecamatanName]), backgroundColor: colors[colorIndex++ % colors.length] }] }, options: { plugins: { legend: { display: false } } } });
            }
        }
    },
    
    /**
     * Merender semua chart di bagian analisis pendapatan dan pasar.
     */
    _renderIncomeAndMarketCharts() {
        const data = sierMath.getIncomeAndMarketSummary();
        if (!data) return;
        
        const { kecamatanNames, byIncomeKecamatan, marketData, totalTargetByAge } = data;

        this.createChart('incomeDistributionByKecamatanChart', { type: 'bar', data: { labels: kecamatanNames, datasets: [{ label: 'Low Income', data: kecamatanNames.map(k => byIncomeKecamatan[k].low), backgroundColor: 'rgba(251, 191, 36, 0.7)' }, { label: 'Middle Income', data: kecamatanNames.map(k => byIncomeKecamatan[k].middle), backgroundColor: 'rgba(52, 211, 153, 0.7)' }, { label: 'High Income', data: kecamatanNames.map(k => byIncomeKecamatan[k].high), backgroundColor: 'rgba(96, 165, 250, 0.7)' }] } });
        this.createChart('marketPotentialByKecamatanChart', { type: 'bar', data: { labels: kecamatanNames, datasets: [{ label: 'Middle Income', data: kecamatanNames.map(k => marketData[k].middleIncome), backgroundColor: 'rgba(52, 211, 153, 0.8)', stack: 'market' }, { label: 'High Income', data: kecamatanNames.map(k => marketData[k].highIncome), backgroundColor: 'rgba(96, 165, 250, 0.8)', stack: 'market' }] }, options: { scales: { x: { stacked: true }, y: { stacked: true } } } });
        this.createChart('targetMarketAgeProfileChart', { type: 'doughnut', data: { labels: ['25-39 Thn', '40-54 Thn', '55-64 Thn'], datasets: [{ data: [totalTargetByAge.age25_39, totalTargetByAge.age40_54, totalTargetByAge.age55_64], backgroundColor: ['#2dd4bf', '#60a5fa', '#a78bfa'] }] } });

        const container = document.getElementById('kecamatanIncomeDonutsContainer');
        if (container) {
            container.innerHTML = '';
            const colors = ['rgba(251, 191, 36, 0.8)', 'rgba(52, 211, 153, 0.8)', 'rgba(96, 165, 250, 0.8)'];
            kecamatanNames.forEach(kecamatan => {
                const incomeData = byIncomeKecamatan[kecamatan];
                if ((incomeData.low + incomeData.middle + incomeData.high) > 0) {
                    const chartId = `income-donut-${kecamatan.replace(/\s/g, '-')}`;
                    const chartWrapper = document.createElement('div');
                    chartWrapper.className = 'text-center relative h-72';
                    chartWrapper.innerHTML = `<h4 class="text-md font-semibold text-gray-700 mb-2">${kecamatan}</h4><canvas id="${chartId}"></canvas>`;
                    container.appendChild(chartWrapper);
                    this.createChart(chartId, { type: 'doughnut', data: { labels: ['Low Income', 'Middle Income', 'High Income'], datasets: [{ data: [incomeData.low, incomeData.middle, incomeData.high], backgroundColor: colors }] }, options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } } } });
                }
            });
        }
    },
    
    /**
     * Merender semua chart di bagian analisis survei.
     */
    _renderSurveyCharts() {
        const data = sierMath.getSurveyAnalysis();
        if (!data || !data.hasData) return;
        
        const { aggregated, choiceVsAge, correlation, themeColors } = data;

        const container = document.getElementById('surveyChartsContainer');
        if (container) {
            container.innerHTML = '';
            const chartConfigs = [
                { id: 'survey-facility-chart', title: 'Preferensi Fasilitas Utama', type: 'doughnut', data: aggregated['Pilihan Fasilitas'] },
                { id: 'survey-padel-interest-chart', title: 'Tingkat Minat Terhadap PADEL', type: 'bar', data: aggregated['Minat PADEL'], options: { plugins: { legend: { display: false } } } },
                { id: 'survey-age-chart', title: 'Demografi Usia Responden', type: 'bar', data: aggregated['Kelompok Usia'], options: { plugins: { legend: { display: false } } } },
                { id: 'survey-padel-features-chart', title: 'Fitur Padel Paling Penting', type: 'bar', data: aggregated['Fitur Penting PADEL'], options: { indexAxis: 'y', plugins: { legend: { display: false } } } }
            ];

            chartConfigs.forEach(config => {
                const chartWrapper = document.createElement('div');
                chartWrapper.className = 'bg-white p-6 rounded-lg shadow-md relative h-96';
                chartWrapper.innerHTML = `<h3 class="text-xl font-semibold mb-4 text-gray-700">${config.title}</h3><canvas id="${config.id}"></canvas>`;
                container.appendChild(chartWrapper);
                this.createChart(config.id, {
                    type: config.type,
                    data: { labels: Object.keys(config.data), datasets: [{ data: Object.values(config.data), backgroundColor: themeColors }] },
                    options: config.options
                });
            });
        }
        
        this.createChart('choiceVsAgeChart', { type: 'bar', data: { labels: choiceVsAge.labels, datasets: choiceVsAge.datasets }, options: { scales: { x: { stacked: true }, y: { stacked: true } } } });
        this.createChart('interestCorrelationChart', { type: 'bubble', data: { datasets: [{ label: 'Jumlah Responden', data: correlation, backgroundColor: 'rgba(96, 165, 250, 0.7)' }] }, options: { plugins: { tooltip: { callbacks: { label: (c) => `${c.raw.r / 4} responden` } } }, scales: { x: { title: { display: true, text: 'Minat Driving Range (1=Rendah, 5=Tinggi)' }, min: 0, max: 6, ticks: { stepSize: 1 } }, y: { title: { display: true, text: 'Minat Padel (1=Rendah, 5=Tinggi)' }, min: 0, max: 6, ticks: { stepSize: 1 } } } } });
    },
    
    /**
     * Merender semua chart di bagian analisis kompetitor.
     */
    _renderCompetitorCharts() {
        if (!document.getElementById('competitorPriceChart')) return;
        const formatRp = (v) => 'Rp ' + sierHelpers.formatNumber(v);
        
        this.createChart('competitorPriceChart', { type: 'bar', data: { labels: ['Brawijaya', 'Ciputra', 'Le Grande', 'Graha Family', 'Pakuwon', 'Bukit Darmo'], datasets: [{ label: 'Harga (Guest/100 Bola)', data: [130000, 130000, 135000, 136000, 150000, 151500], backgroundColor: ['#22c55e', '#22c55e', '#3b82f6', '#3b82f6', '#ef4444', '#ef4444'] }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: formatRp } } } } });
        this.createChart('padelPriceChart', { type: 'bar', data: { labels: ['UNO', 'Puncak', 'Margomulyo', 'Playground', 'Homeground', 'Jungle', 'Graha'], datasets: [{ label: 'Harga (Peak / Jam)', data: [350000, 350000, 350000, 380000, 389000, 400000, 450000], backgroundColor: 'rgba(168, 85, 247, 0.7)' }] }, options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: formatRp } } } } });
    },

    /**
     * FUNGSI MASTER: Memanggil semua fungsi render chart.
     * Ini adalah satu-satunya fungsi yang perlu dipanggil dari luar.
     */
    renderAllCharts() {
        this._renderDemographyCharts();
        this._renderDetailedDemographyCharts();
        this._renderIncomeAndMarketCharts();
        this._renderSurveyCharts();
        this._renderCompetitorCharts();
    }
};

window.sierChart = sierChart;