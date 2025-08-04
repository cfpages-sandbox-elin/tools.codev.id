// File: sier-visual-demography.js
// Merender semua elemen visual non-chart terkait Demografi.

const sierVisualDemography = {
    _renderVisuals() {
        const summary = sierMathMarket.getDemographySummary();
        if (!summary || !summary.totalPopulation) return;

        document.getElementById('totalPenduduk').innerText = sierHelpers.formatNumber(summary.totalPopulation);
        document.getElementById('totalRing1').innerText = sierHelpers.formatNumber(summary.totalRing1);
        document.getElementById('totalRing2').innerText = sierHelpers.formatNumber(summary.totalRing2);
        document.getElementById('dependencyRatio').innerText = summary.dependencyRatio;
        
        const tableBody = document.getElementById('dataTableBody');
        if (tableBody) {
            tableBody.innerHTML = demographyData.map(row => `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-3 py-4 font-medium">${row.kecamatan}</td><td>${row.kelurahan}</td>
                    <td class="text-center">${sierHelpers.formatNumber(row.total)}</td><td class="text-center">${sierHelpers.formatNumber(row.usia0_14)}</td>
                    <td class="text-center">${sierHelpers.formatNumber(row.usia15_24)}</td><td class="text-center">${sierHelpers.formatNumber(row.usia25_39)}</td>
                    <td class="text-center">${sierHelpers.formatNumber(row.usia40_54)}</td><td class="text-center">${sierHelpers.formatNumber(row.usia55_64)}</td>
                    <td class="text-center">${sierHelpers.formatNumber(row.usia65_plus)}</td><td class="text-center">${row.ring}</td>
                </tr>`).join('');
        }
    },

    render() {
        this._renderVisuals();
    }
};

window.sierVisualDemography = sierVisualDemography;