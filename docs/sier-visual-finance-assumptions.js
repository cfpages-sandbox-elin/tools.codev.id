// File: sier-visual-finance-assumptions.js (BARU)
// Bertanggung jawab untuk merender SEMUA kartu asumsi input yang dapat diedit.

const sierVisualFinanceAssumptions = {

    _createAssumptionCard(configObject, title, basePath, colorClass = 'gray') {
        if (!configObject || Object.keys(configObject).length === 0) return '';

        let rowsHtml = '';
        const processObject = (obj, pathPrefix) => {
            let html = '';
            for (const key in obj) {
                if (key === 'title' || key === 'description' || key === 'notes' || key === 'items' || typeof obj[key] === 'function') continue;
                
                const value = obj[key];
                const fullPath = `${pathPrefix}.${key}`;
                const label = sierHelpers.safeTranslate(key);

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    html += `<tr><td colspan="2" class="pt-3 pb-1 font-semibold text-gray-700 text-sm">${label}</td></tr>`;
                    html += processObject(value, fullPath);
                } else if (typeof value === 'number') {
                    const isPercent = (key.includes('_rate') || key.includes('_portion')) && value <= 1;
                    const formatOptions = isPercent ? { format: 'percent' } : {};
                    html += `<tr><td class="py-1.5 pl-4 text-gray-600">${label}</td><td class="py-1.5 text-right">${sierEditable.createEditableNumber(value, fullPath, formatOptions)}</td></tr>`;
                }
            }
            return html;
        };

        rowsHtml = processObject(configObject, basePath);
        if (!rowsHtml.trim()) return '';

        return `
            <div class="bg-white p-4 rounded-lg border">
                <h4 class="font-bold text-md text-${colorClass}-800 mb-2">${title}</h4>
                <table class="w-full text-sm">
                    <tbody class="divide-y divide-gray-200">${rowsHtml}</tbody>
                </table>
            </div>`;
    },

    _renderAssumptionsVisuals(scenarioConfig) {
        const container = document.getElementById('assumptions-container');
        if (!container) return;

        const { assumptions } = projectConfig;

        const createItemHtml = (label, value, path) => {
            const isPercent = (path.includes('_rate') || path.includes('_portion')) && value <= 1;
            const contentHtml = sierEditable.createEditableNumber(value, path, { format: isPercent ? 'percent' : '' });
            return `<div class="flex justify-between items-center py-1.5 border-b last:border-b-0"><span>${label}</span><div>${contentHtml}</div></div>`;
        };

        const financingKey = document.getElementById('financing-scenario-selector').value;
        const financingHtml = Object.keys(assumptions.financing_scenarios[financingKey]).filter(k => k !== 'title').map(key => createItemHtml(sierTranslate.translate(key), assumptions.financing_scenarios[financingKey][key], `assumptions.financing_scenarios.${financingKey}.${key}`)).join('');
        const escalationHtml = Object.keys(assumptions.escalation).map(key => createItemHtml(sierTranslate.translate(key), assumptions.escalation[key], `assumptions.escalation.${key}`)).join('');
        
        const globalAssumptionsHtml = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-gray-50 p-4 rounded-lg border"><h3 class="font-bold text-md text-gray-700 mb-2">Umum & Pajak</h3>
                    ${createItemHtml('Pajak Penghasilan', assumptions.tax_rate_profit, 'assumptions.tax_rate_profit')}
                    ${createItemHtml('Tingkat Diskonto (WACC)', assumptions.discount_rate_wacc, 'assumptions.discount_rate_wacc')}
                    ${createItemHtml('Dana Kontingensi', assumptions.contingency_rate, 'assumptions.contingency_rate')}
                </div>
                <div class="bg-gray-50 p-4 rounded-lg border"><h3 class="font-bold text-md text-gray-700 mb-2">Pendanaan (${assumptions.financing_scenarios[financingKey].title})</h3>${financingHtml}</div>
                <div class="bg-gray-50 p-4 rounded-lg border"><h3 class="font-bold text-md text-gray-700 mb-2">Peningkatan (Eskalasi)</h3>${escalationHtml}</div>
            </div>`;

        let operationalAssumptionsHtml = '<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-amber-500 pl-4 mt-12">Rincian Asumsi per Unit Bisnis</h2><div class="space-y-12">';
        
        if (scenarioConfig.dr && scenarioConfig.dr !== 'none') {
            const dr = projectConfig.drivingRange;
            operationalAssumptionsHtml += `<div><h3 class="text-xl font-bold text-blue-800 mb-4 pb-2 border-b">Asumsi: Driving Range</h3><div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                ${sierVisualFinanceAssumptions._createAssumptionCard(dr.operational_assumptions, 'Operasional', 'drivingRange.operational_assumptions', 'blue')}
                ${sierVisualFinanceAssumptions._createAssumptionCard(dr.revenue, 'Pendapatan (Revenue)', 'drivingRange.revenue', 'blue')}
                ${sierVisualFinanceAssumptions._createAssumptionCard(dr.opexMonthly, 'Biaya Operasional (OpEx)', 'drivingRange.opexMonthly', 'blue')}
                ${sierVisualFinanceAssumptions._createAssumptionCard(dr.capex_assumptions, 'Biaya Investasi (CapEx)', 'drivingRange.capex_assumptions', 'blue')}
            </div></div>`;
        }

        if (scenarioConfig.padel) {
            const padelKey = scenarioConfig.padel === '4courts' ? 'four_courts_combined' : 'two_courts_futsal_renovation';
            const padel = projectConfig.padel.scenarios[padelKey];
            operationalAssumptionsHtml += `<div><h3 class="text-xl font-bold text-purple-800 mb-4 pb-2 border-b">Asumsi: Padel (${padel.num_courts} Lapangan)</h3><div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                ${sierVisualFinanceAssumptions._createAssumptionCard(padel.operational_assumptions, 'Operasional', `padel.scenarios.${padelKey}.operational_assumptions`, 'purple')}
                ${sierVisualFinanceAssumptions._createAssumptionCard(padel.revenue, 'Pendapatan (Revenue)', `padel.scenarios.${padelKey}.revenue`, 'purple')}
                ${sierVisualFinanceAssumptions._createAssumptionCard(padel.opexMonthly, 'Biaya Operasional (OpEx)', `padel.scenarios.${padelKey}.opexMonthly`, 'purple')}
                ${sierVisualFinanceAssumptions._createAssumptionCard(padel.capex, 'Biaya Investasi (CapEx)', `padel.scenarios.${padelKey}.capex`, 'purple')}
            </div></div>`;
        }

        if (scenarioConfig.mp && scenarioConfig.mp !== 'none') {
            const mp = projectConfig.meetingPoint;
            operationalAssumptionsHtml += `<div><h3 class="text-xl font-bold text-cyan-800 mb-4 pb-2 border-b">Asumsi: Meeting Point</h3><div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                ${sierVisualFinanceAssumptions._createAssumptionCard(mp.operational_assumptions, 'Operasional', 'meetingPoint.operational_assumptions', 'cyan')}
                ${sierVisualFinanceAssumptions._createAssumptionCard(mp.revenue, 'Pendapatan (Revenue)', 'meetingPoint.revenue', 'cyan')}
                ${sierVisualFinanceAssumptions._createAssumptionCard(mp.opexMonthly, 'Biaya Operasional (OpEx)', 'meetingPoint.opexMonthly', 'cyan')}
                ${sierVisualFinanceAssumptions._createAssumptionCard(mp.capex_scenarios, 'Biaya Investasi (CapEx)', 'meetingPoint.capex_scenarios', 'cyan')}
            </div></div>`;
        }
        
        operationalAssumptionsHtml += '</div>';
        container.innerHTML = globalAssumptionsHtml + operationalAssumptionsHtml;
    },

    render(scenarioConfig) {
        const container = document.getElementById('financial-assumptions');
        if(container){
             this._renderAssumptionsVisuals(scenarioConfig);
             console.log("[sier-visual-finance-assumptions] Semua asumsi input telah dirender.");
        }
    }
};

window.sierVisualFinanceAssumptions = sierVisualFinanceAssumptions;