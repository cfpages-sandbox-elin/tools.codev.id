// File: sier-visual-market.js
// Merender semua elemen visual non-chart terkait Analisis Pasar & Pendapatan.

const sierVisualMarket = {
    _renderVisuals() {
        const summary = sierMath.getIncomeAndMarketSummary();
        if (!summary) return;

        const { estimatedIncomeData, marketData, kecamatanNames } = summary;

        const incomeTableBody = document.getElementById('incomeTableBody');
        if (incomeTableBody) {
            incomeTableBody.innerHTML = estimatedIncomeData.map(row => `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium">${row.kecamatan}</td><td class="px-4 py-3">${row.kelurahan}</td>
                    <td class="px-2 py-3 text-center">${row.ring}</td><td class="px-4 py-3 text-center bg-red-50">${sierHelpers.formatNumber(row.incomeDependent)}</td>
                    <td class="px-4 py-3 text-center bg-yellow-50">${sierHelpers.formatNumber(row.incomeLow)}</td><td class="px-4 py-3 text-center bg-green-50">${sierHelpers.formatNumber(row.incomeMiddle)}</td>
                    <td class="px-4 py-3 text-center bg-blue-50">${sierHelpers.formatNumber(row.incomeHigh)}</td>
                </tr>`).join('');
        }

        const marketSummaryTableBody = document.getElementById('marketSummaryTableBody');
        if (marketSummaryTableBody) {
            marketSummaryTableBody.innerHTML = kecamatanNames.map(kecamatan => {
                const data = marketData[kecamatan];
                const totalPotential = data.middleIncome + data.highIncome;
                const ageData = demographyData.filter(d => d.kecamatan === kecamatan).reduce((acc, curr) => {
                    acc.age25_39 += curr.usia25_39;
                    acc.age40_54 += curr.usia40_54;
                    return acc;
                }, { age25_39: 0, age40_54: 0 });
                return `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-4 py-4 font-medium">${kecamatan}</td><td class="px-4 py-4 text-center font-bold">${sierHelpers.formatNumber(totalPotential)}</td><td class="px-4 py-4 text-center">${sierHelpers.formatNumber(ageData.age25_39)}</td><td class="px-4 py-4 text-center">${sierHelpers.formatNumber(ageData.age40_54)}</td></tr>`;
            }).join('');
        }
    },

    render() {
        this._renderVisuals();
        sierChart.renderAllIncomeAndMarketCharts();
        sierChart.renderAllCompetitorCharts();
    }
};

window.sierVisualMarket = sierVisualMarket;