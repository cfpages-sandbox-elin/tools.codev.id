// File: sier-visual-sensitivity.js munculkan sensitivity
const sierVisualSensitivity = {

    _createSensitivityTable(data, title, isIrr = false) {
        if (!data) return '';
        const params = projectConfig.assumptions.sensitivity_analysis;

        const formatValue = (val) => {
            if (isIrr) return sierHelpers.formatPercent(val, 2);
            return sierHelpers.formatNumber(Math.round(val / 1000000)); // Dalam Juta Rupiah
        };

        let headerHtml = '<tr><th class="p-2 border bg-gray-200">Perubahan Investasi</th>';
        params.revenue_steps.forEach(step => {
            headerHtml += `<th class="p-2 border bg-blue-100">${sierHelpers.formatPercent(step, 0)}</th>`;
        });
        headerHtml += '</tr>';

        let bodyHtml = '';
        params.investment_steps.forEach(invStep => {
            bodyHtml += `<tr><td class="p-2 border text-center font-bold bg-blue-100">${sierHelpers.formatPercent(invStep, 0)}</td>`;
            params.revenue_steps.forEach(revStep => {
                // PERBAIKAN UTAMA: Langsung baca dari matriks data
                const value = data[invStep] && data[invStep][revStep] !== undefined ? data[invStep][revStep] : (isIrr ? 0 : -1);

                let bgColor = 'bg-white';
                if (isIrr) {
                    if (value > 0.20) bgColor = 'bg-green-200';
                    else if (value > projectConfig.assumptions.discount_rate_wacc) bgColor = 'bg-yellow-200';
                    else bgColor = 'bg-red-200';
                } else {
                    if (value > 0) bgColor = 'bg-green-200';
                    else bgColor = 'bg-red-200';
                }

                bodyHtml += `<td class="p-2 border text-center font-mono ${bgColor}">${formatValue(value)}</td>`;
            });
            bodyHtml += '</tr>';
        });

        return `
            <div class="mb-12">
                <h3 class="text-xl font-semibold mb-3 text-gray-700">${title}</h3>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm border-collapse">
                        <thead>
                            <tr><th class="p-1" colspan="${params.revenue_steps.length + 1}">Perubahan Pendapatan</th></tr>
                            ${headerHtml}
                        </thead>
                        <tbody>${bodyHtml}</tbody>
                    </table>
                </div>
                ${!isIrr ? '<p class="text-xs text-gray-500 mt-1 text-right">*Dalam Juta Rupiah</p>' : ''}
            </div>
        `;
    },

    render(sensitivityData) {
        const container = document.getElementById('sensitivity-analysis-container');
        if (!container || !sensitivityData) return;

        let html = '<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-rose-600 pl-4">Analisis Sensitivitas</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8">';
        
        // Gabungan
        html += this._createSensitivityTable(sensitivityData.combined, 'IRR Proyek Gabungan (%)', true);
        html += this._createSensitivityTable(sensitivityData.combined, 'NPV Proyek Gabungan (Rp Juta)');

        // Individual (jika ada)
        for (const key in sensitivityData) {
            if (key !== 'combined') {
                const title = projectConfig[key]?.title || key.toUpperCase();
                html += this._createSensitivityTable(sensitivityData[key], `IRR ${title} (%)`, true);
                html += this._createSensitivityTable(sensitivityData[key], `NPV ${title} (Rp Juta)`);
            }
        }

        html += '</div>';
        container.innerHTML = html;
    }
};

window.sierVisualSensitivity = sierVisualSensitivity;