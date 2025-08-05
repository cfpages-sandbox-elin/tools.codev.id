// File: sier-visual-sensitivity.js sensitivity tidak 0
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
        if (!container || !sensitivityData || !sensitivityData.combined) {
            if (container) container.innerHTML = `
                <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-rose-600 pl-4">Analisis Sensitivitas</h2>
                <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                    <p class="text-center text-gray-500">Data untuk analisis sensitivitas tidak dapat dimuat.</p>
                </div>`;
            return;
        }

        let html = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-rose-600 pl-4">Analisis Sensitivitas</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <p class="text-sm text-gray-600 mb-8">Analisis ini menguji seberapa besar perubahan pada asumsi utama (Pendapatan dan Biaya Investasi) akan memengaruhi kelayakan proyek. Ini membantu memahami tingkat risiko dari proyeksi finansial.</p>
        `;
        
        html += this._createSensitivityTable(sensitivityData.combined.irr, 'Sensitivitas IRR Proyek Gabungan (%)', true);
        html += this._createSensitivityTable(sensitivityData.combined.npv, 'Sensitivitas NPV Proyek Gabungan (Rp Juta)');

        html += '</div>';
        container.innerHTML = html;
    }
};

window.sierVisualSensitivity = sierVisualSensitivity;