// File: sier-visual-finance.js
// VERSI LENGKAP DAN FINAL - 21 Juli 2025

const sierVisualFinance = {
    /**
     * Helper internal untuk membuat tabel Laba Rugi (P&L).
     * @param {object} pnlData - Objek P&L dari hasil kalkulasi sierMath.
     * @returns {string} - HTML string untuk tabel P&L.
     */
    _createPnlTable(pnlData) {
        return `<table class="w-full text-sm">
            <thead class="bg-gray-50"><tr class="text-left"><th class="px-4 py-2 w-4/5">Deskripsi</th><th class="px-4 py-2 text-right">Nilai (Tahun Pertama)</th></tr></thead>
            <tbody class="divide-y">
                <tr><td class="px-4 py-2">Pendapatan (Revenue)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(pnlData.annualRevenue))}</td></tr>
                <tr><td class="px-4 py-2">Harga Pokok Penjualan (COGS)</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(pnlData.annualCogs))})</td></tr>
                <tr class="font-semibold"><td class="px-4 py-2">Laba Kotor (Gross Profit)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(pnlData.grossProfit))}</td></tr>
                <tr><td class="px-4 py-2">Biaya Operasional (OpEx)</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(pnlData.annualOpex))})</td></tr>
                <tr class="font-semibold"><td class="px-4 py-2">EBITDA</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(pnlData.ebitda))}</td></tr>
                <tr><td class="px-4 py-2">Depresiasi & Amortisasi</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(pnlData.annualDepreciation))})</td></tr>
                <tr class="font-semibold"><td class="px-4 py-2">Laba Sebelum Pajak (EBT)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(pnlData.ebt))}</td></tr>
                <tr><td class="px-4 py-2">Pajak Penghasilan (${(projectConfig.assumptions.tax_rate_profit * 100)}%)</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(pnlData.tax))})</td></tr>
                <tr class="bg-teal-100 font-bold text-teal-800"><td class="px-4 py-3 text-base">Laba Bersih (Net Profit)</td><td class="px-4 py-3 text-right text-base font-mono">${sierHelpers.formatNumber(Math.round(pnlData.netProfit))}</td></tr>
            </tbody>
        </table>`;
    },

    /**
     * Helper internal untuk membuat bagian rincian pendapatan.
     * @param {string} unitName - 'drivingRange' atau 'padel'.
     * @param {object} revenueData - Data dari sierMath._getDetailedRevenueBreakdown.
     * @returns {string} - HTML string untuk bagian rincian pendapatan.
     */
    _createRevenueBreakdownSection(unitName, revenueData) {
        if (!revenueData || !revenueData.rows) return '';
        const formatRp = (num) => sierHelpers.formatNumber(Math.round(num));
        const tableRows = revenueData.rows.map(row => `
            <tr class="hover:bg-gray-50">
                <td class="p-2">${row.item}</td><td class="p-2 text-xs text-gray-500">${row.calc}</td>
                <td class="p-2 text-right font-mono">${formatRp(row.perDay)}</td><td class="p-2 text-right font-mono">${formatRp(row.perMonth)}</td>
                <td class="p-2 text-right font-mono">${formatRp(row.perMonth * 12)}</td>
            </tr>
        `).join('');
        return `<div class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Rincian Pendapatan</h3><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Sumber Pendapatan</th><th class="p-2 text-left">Detail Perhitungan</th><th class="p-2 text-right">Per Hari (Avg)</th><th class="p-2 text-right">Per Bulan</th><th class="p-2 text-right">Per Tahun</th></tr></thead><tbody class="divide-y">${tableRows}</tbody><tfoot class="bg-gray-200 font-bold"><tr><td class="p-2" colspan="2">Total Estimasi Pendapatan</td><td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly / 30)}</td><td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly)}</td><td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly * 12)}</td></tr></tfoot></table></div></div>`;
    },

    /**
     * Helper internal untuk membuat bagian analisis BEP.
     * @param {string} unitName - 'drivingRange' atau 'padel'.
     * @param {object} analysisData - Data dari sierMath.getStrategicAnalysis.
     * @returns {string} - HTML string untuk bagian BEP.
     */
    _createBEPSection(unitName, analysisData) {
        const { bepAnalysis } = analysisData;
        const totalVariableCost = Object.values(bepAnalysis.variableCostBreakdown).reduce((sum, val) => sum + val, 0);
        return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">A. Analisis Titik Impas Operasional (BEP)</h4><p class="text-sm text-gray-600 mb-3">Target penjualan minimum agar tidak rugi secara operasional (laba = 0), dihitung dengan membagi Biaya Tetap dengan Margin Kontribusi (Harga Jual - Biaya Variabel).</p><div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4"><div><h5 class="font-medium text-gray-700 mb-1">Biaya Tetap Bulanan</h5><table class="w-full text-xs">${Object.entries(bepAnalysis.fixedCostBreakdown).map(([key, value]) => `<tr><td class="py-1 pr-2">${key}</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(value))}</td></tr>`).join('')}<tfoot class="border-t-2"><tr class="font-semibold"><td class="py-1 pr-2">Total Biaya Tetap</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(bepAnalysis.totalFixedCostMonthly))}</td></tr></tfoot></table></div><div><h5 class="font-medium text-gray-700 mb-1">Biaya Variabel per ${bepAnalysis.unitLabel}</h5><table class="w-full text-xs">${Object.entries(bepAnalysis.variableCostBreakdown).map(([key, value]) => `<tr><td class="py-1 pr-2">${key}</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(value))}</td></tr>`).join('')}<tfoot class="border-t-2"><tr class="font-semibold"><td class="py-1 pr-2">Total Biaya Variabel</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(totalVariableCost))}</td></tr></tfoot></table></div><div class="lg:col-span-2 mt-4 bg-white p-3 rounded-md shadow-sm text-center"><p class="text-sm font-semibold text-gray-700">Target Break-Even Point Bulanan</p><p class="text-4xl font-bold text-blue-700 mt-1">${sierHelpers.formatNumber(Math.ceil(bepAnalysis.bepInUnitsMonthly))}</p><p class="text-sm text-gray-500">${bepAnalysis.unitLabel}</p><p class="text-xs text-gray-500 mt-2">(Rata-rata ~${Math.ceil(bepAnalysis.bepInUnitsDaily)} ${bepAnalysis.unitLabel} / hari untuk mencapai BEP)</p></div></div></div>`;
    },

    /**
     * Helper internal untuk membuat bagian analisis profitabilitas.
     * @param {string} unitName - 'drivingRange' atau 'padel'.
     * @param {object} analysisData - Data dari sierMath.getStrategicAnalysis.
     * @returns {string} - HTML string untuk bagian profitabilitas.
     */
    _createProfitabilitySection(unitName, analysisData) {
        const { profitabilityAnalysis } = analysisData;
        return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">B. Analisis Profitabilitas & Target Balik Modal (Payback)</h4><p class="text-sm text-gray-600 mb-3">Proyeksi profitabilitas berdasarkan asumsi okupansi saat ini untuk mengukur waktu balik modal.</p><table class="w-full text-sm"><tbody class="divide-y"><tr><td class="py-2 text-gray-600">Total Investasi Awal (CapEx)</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.totalCapex))}</td></tr><tr><td class="py-2 text-gray-600">Proyeksi Pendapatan Tahunan</td><td class="py-2 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.annualRevenue))}</td></tr><tr class="text-green-700"><td class="py-2 font-semibold">Proyeksi Laba Bersih Tahunan</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.annualNetProfit))}</td></tr><tr class="text-green-700"><td class="py-2 font-semibold">Proyeksi Arus Kas Bersih Tahunan</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.annualCashFlow))}</td></tr></tbody><tfoot class="border-t-2"><tr class="font-bold text-lg text-green-600"><td class="py-2">Estimasi Waktu Balik Modal</td><td class="py-2 text-right font-mono">${profitabilityAnalysis.paybackPeriod.toFixed(2)} Tahun</td></tr></tfoot></table></div>`;
    },

    /**
     * Helper internal untuk membuat bagian analisis skenario.
     * @param {string} unitName - 'drivingRange' atau 'padel'.
     * @param {object} analysisData - Data dari sierMath.getStrategicAnalysis.
     * @returns {string} - HTML string untuk bagian skenario.
     */
    _createScenarioSection(unitName, analysisData) {
        const { scenarioAnalysis } = analysisData;
        const mods = projectConfig.assumptions.scenario_modifiers;
        const formatPayback = (years) => years === Infinity ? '> 15 Thn' : `${years.toFixed(2)} Thn`;
        return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">C. Analisis Skenario</h4><p class="text-sm text-gray-600 mb-3">Mengukur dampak perubahan pendapatan terhadap profitabilitas dan waktu balik modal.</p><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"><div class="bg-red-50 p-3 rounded-md border border-red-200 text-center"><p class="font-bold text-red-800">Pesimis</p><p class="text-xs text-red-600">(${(mods.pessimistic_revenue * 100 - 100).toFixed(0)}% Revenue)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg ${scenarioAnalysis.pessimistic.netProfit < 0 ? 'text-red-600' : 'text-gray-800'}">Rp ${sierHelpers.formatNumber(Math.round(scenarioAnalysis.pessimistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-red-600">${formatPayback(scenarioAnalysis.pessimistic.payback)}</p></div><div class="bg-blue-50 p-3 rounded-md border border-blue-200 text-center ring-2 ring-blue-500"><p class="font-bold text-blue-800">Realisitis (Basis)</p><p class="text-xs text-blue-600">(Target Awal)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg text-gray-800">Rp ${sierHelpers.formatNumber(Math.round(scenarioAnalysis.realistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-blue-600">${formatPayback(scenarioAnalysis.realistic.payback)}</p></div><div class="bg-green-50 p-3 rounded-md border border-green-200 text-center"><p class="font-bold text-green-800">Optimis</p><p class="text-xs text-green-600">(+${(mods.optimistic_revenue * 100 - 100).toFixed(0)}% Revenue)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg text-gray-800">Rp ${sierHelpers.formatNumber(Math.round(scenarioAnalysis.optimistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-green-600">${formatPayback(scenarioAnalysis.optimistic.payback)}</p></div></div></div>`;
    },

    /**
     * Merender bagian asumsi.
     */
    _renderAssumptionsVisuals() {
        const container = document.getElementById('assumptions-container');
        if (!container) return;
        const { assumptions: globalAssumptions, drivingRange, padel } = projectConfig;

        const createTableRows = (data, basePath) => Object.entries(data).map(([key, value]) => {
            if (key === 'capex' || key === 'capex_assumptions') return '';
            const currentPath = `${basePath}.${key}`;
            const translatedKey = sierTranslate.translate(key);
            if (typeof value !== 'object' || value === null || ('count' in value && 'salary' in value) || ('electricity_kwh_price' in value)) {
                let editControl;
                if (typeof value === 'object' && value !== null) {
                    editControl = Object.entries(value).map(([subKey, subVal]) => `<span class="font-medium">${sierTranslate.translate(subKey)}:</span> ${sierHelpers.formatNumber(subVal)}`).join(', ');
                } else {
                    const isPercent = (key.includes('rate') || key.includes('okupansi')) && value < 2 && value > 0;
                    editControl = sierEditable.createEditableNumber(value, currentPath, { format: isPercent ? 'percent' : '' });
                }
                return `<tr class="border-b border-gray-200 hover:bg-gray-50"><td class="py-3 px-4 text-gray-600 w-1/5">${translatedKey}</td><td class="py-3 px-4 w-4/5">${editControl}</td></tr>`;
            } else {
                return `<tr class="border-b border-gray-200"><td class="py-3 px-4 text-gray-600 w-1/5 align-top font-medium">${translatedKey}</td><td class="py-3 px-4 w-4/5"><table class="w-full text-sm"><tbody class="divide-y divide-gray-200">${createTableRows(value, currentPath)}</tbody></table></td></tr>`;
            }
        }).join('');

        const createBusinessModelSection = (title, data, basePath, theme) => {
            const bgColor = theme === 'blue' ? 'bg-blue-600' : theme === 'purple' ? 'bg-purple-600' : 'bg-gray-700';
            return `<div class="bg-white rounded-lg shadow-md overflow-hidden"><h3 class="text-xl font-bold text-white ${bgColor} p-4">${title}</h3><div class="p-4"><table class="w-full text-sm"><tbody class="divide-y divide-gray-200">${createTableRows(data, basePath)}</tbody></table></div></div>`;
        };
        
        container.innerHTML = `<div class="space-y-12">${createBusinessModelSection('A. Asumsi Global', globalAssumptions, 'assumptions', 'gray')}${createBusinessModelSection('B. Model Bisnis Driving Range', drivingRange, 'drivingRange', 'blue')}${createBusinessModelSection('C. Model Bisnis Padel', padel, 'padel', 'purple')}</div>`;
    },

    _renderOpexDetailsVisuals() {
        const container = document.getElementById('opex-details-container');
        if (!container) return;

        const createUnitOpexTable = (unitName) => {
            const unitConfig = projectConfig[unitName];
            const opexData = unitConfig.opexMonthly;
            let grandTotalOpex = 0;
            const staffData = opexData.salaries_wages;
            let staffTableRows = '';
            let totalStaffCost = 0;
            for (const role in staffData) {
                const roleData = staffData[role];
                const totalRoleCost = roleData.count * roleData.salary;
                totalStaffCost += totalRoleCost;
                staffTableRows += `<tr><td class="px-3 py-2">${sierTranslate.translate(role)}</td><td class="px-3 py-2 text-center">${sierEditable.createEditableNumber(roleData.count, `${unitName}.opexMonthly.salaries_wages.${role}.count`)}</td><td class="px-3 py-2 text-right">${sierEditable.createEditableNumber(roleData.salary, `${unitName}.opexMonthly.salaries_wages.${role}.salary`, {format: 'currency'})}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalRoleCost))}</td></tr>`;
            }
            grandTotalOpex += totalStaffCost;
            const staffTableHtml = `<h4 class="font-semibold text-gray-800 mb-2">1. Gaji & Upah (SDM)</h4><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Posisi</th><th class="p-2 text-center">Jumlah Staf</th><th class="p-2 text-right">Gaji/Orang (Rp)</th><th class="p-2 text-right">Total Biaya (Rp)</th></tr></thead><tbody class="divide-y">${staffTableRows}</tbody><tfoot class="font-bold bg-gray-100"><tr><td colspan="3" class="p-2 text-right">Subtotal Biaya SDM</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalStaffCost))}</td></tr></tfoot></table></div>`;
            const utilData = opexData.utilities;
            let totalUtilCost = (utilData.electricity_kwh_price * utilData.electricity_kwh_usage) + utilData.water_etc;
            grandTotalOpex += totalUtilCost;
            const utilTableHtml = `<h4 class="font-semibold text-gray-800 mt-6 mb-2">2. Utilitas</h4><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Komponen</th><th class="p-2 text-right">Asumsi</th><th class="p-2 text-right">Total Biaya (Rp)</th></tr></thead><tbody class="divide-y"><tr><td class="p-2">Listrik</td><td class="p-2 text-right">${sierEditable.createEditableNumber(utilData.electricity_kwh_usage, `${unitName}.opexMonthly.utilities.electricity_kwh_usage`)} kWh @ ${sierEditable.createEditableNumber(utilData.electricity_kwh_price, `${unitName}.opexMonthly.utilities.electricity_kwh_price`, {format: 'currency'})}</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(utilData.electricity_kwh_price * utilData.electricity_kwh_usage))}</td></tr><tr><td class="p-2">Air & Lainnya</td><td class="p-2 text-right">Lump Sum</td><td class="p-2 text-right font-mono">${sierEditable.createEditableNumber(utilData.water_etc, `${unitName}.opexMonthly.utilities.water_etc`, {format: 'currency'})}</td></tr></tbody><tfoot class="font-bold bg-gray-100"><tr><td colspan="2" class="p-2 text-right">Subtotal Biaya Utilitas</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalUtilCost))}</td></tr></tfoot></table></div>`;
            const otherDataKeys = ['marketing_promotion', 'maintenance_repair', 'other_operational'];
            let otherTableRows = '';
            let totalOtherCost = 0;
            otherDataKeys.forEach(key => { const cost = opexData[key]; totalOtherCost += cost; otherTableRows += `<tr><td class="p-2">${sierTranslate.translate(key)}</td><td class="p-2 text-right font-mono">${sierEditable.createEditableNumber(cost, `${unitName}.opexMonthly.${key}`, {format: 'currency'})}</td></tr>`; });
            grandTotalOpex += totalOtherCost;
            const otherTableHtml = `<h4 class="font-semibold text-gray-800 mt-6 mb-2">3. Biaya Operasional Lainnya</h4><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Kategori Biaya</th><th class="p-2 text-right">Estimasi Biaya Bulanan (Rp)</th></tr></thead><tbody class="divide-y">${otherTableRows}</tbody><tfoot class="font-bold bg-gray-100"><tr><td class="p-2 text-right">Subtotal Biaya Lainnya</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalOtherCost))}</td></tr></tfoot></table></div>`;
            return `<div class="bg-white p-6 rounded-lg shadow-md">${staffTableHtml}${utilTableHtml}${otherTableHtml}<div class="mt-6 bg-gray-200 text-gray-800 font-bold p-3 rounded-lg flex justify-between items-center text-lg"><span>Total Estimasi Biaya Operasional Bulanan</span><span class="font-mono">Rp ${sierHelpers.formatNumber(Math.round(grandTotalOpex))}</span></div></div>`;
        };
        container.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-amber-500 pl-4">Rincian Estimasi Biaya Operasional (OpEx) Bulanan</h2><div class="grid grid-cols-1 lg:grid-cols-2 gap-8"><div><h3 class="text-xl font-bold mb-4 text-center text-blue-700">Driving Range</h3>${createUnitOpexTable('drivingRange')}</div><div><h3 class="text-xl font-bold mb-4 text-center text-purple-700">Padel</h3>${createUnitOpexTable('padel')}</div></div>`;
    },

    _renderDrCapexDetailsVisuals() {
        const container = document.getElementById('driving-range-capex-details-container');
        if (!container) return;

        // Panggil kalkulasi dari sierMath
        const results = sierMath._calculateDrCapex();
        const { equipment_detail, scenario_a, scenario_b } = results;

        // Helper untuk membuat baris tabel yang bisa diedit
        const createRow = (item) => `
            <tr>
                <td class="p-2">${item.category}</td>
                <td class="p-2">${item.component}</td>
                <td class="p-2 text-xs text-gray-500">${item.calculation}</td>
                <td class="p-2 text-right font-mono">${sierEditable.createEditableNumber(sierMath.getValueByPath(projectConfig, item.path), item.path, {format: 'currency'})}</td>
            </tr>
        `;

        // Buat tabel untuk Peralatan & Jaring
        const equipmentTable = `
            <h3 class="text-xl font-semibold mb-3 text-gray-800">Rincian Biaya Peralatan & Jaring Pengaman</h3>
            <div class="overflow-x-auto border rounded-lg mb-8">
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 text-xs uppercase">
                        <tr>
                            <th class="p-2 text-left">Kategori</th>
                            <th class="p-2 text-left">Komponen</th>
                            <th class="p-2 text-left">Detail</th>
                            <th class="p-2 text-right">Biaya Satuan (Rp)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${equipment_detail.htmlRows.map(createRow).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Buat tabel untuk Skenario Konstruksi
        const scenarioTableHtml = (data, title, description) => {
            const contingencyRate = projectConfig.assumptions.contingency_rate;
            let rowsHtml = '';
            data.htmlRows.forEach(row => {
                rowsHtml += `
                    <tr>
                        <td class="p-3">${row.label}</td>
                        <td class="p-3 text-gray-500 text-xs">${row.calculation}</td>
                        <td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(row.value))}</td>
                    </tr>
                `;
            });

            return `
                <div class="mb-10">
                    <h3 class="text-xl font-semibold mb-3 text-gray-800">${title}</h3>
                    <p class="text-gray-600 mb-4 text-sm">${description}</p>
                    <div class="overflow-x-auto border rounded-lg">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-100 text-xs uppercase">
                                <tr><th class="p-2 text-left">Komponen Biaya</th><th class="p-2 text-left">Perhitungan</th><th class="p-2 text-right">Estimasi Biaya (Rp)</th></tr>
                            </thead>
                            <tbody class="divide-y">
                                ${rowsHtml}
                                <tr class="bg-gray-200 font-bold"><td class="p-3" colspan="2">Subtotal Biaya Fisik & Lainnya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.subtotal))}</td></tr>
                                <tr class="bg-yellow-200 font-bold"><td class="p-3" colspan="2">Kontingensi (${sierEditable.createEditableNumber(contingencyRate, 'assumptions.contingency_rate', {format: 'percent'})})</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.contingency))}</td></tr>
                                <tr class="bg-blue-600 text-white font-bold text-lg"><td class="p-3" colspan="2">Total Estimasi Investasi (Skenario Ini)</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.total))}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        };
        
        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-blue-500 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Driving Range</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                ${equipmentTable}
                ${scenarioTableHtml(scenario_a, 'Skenario A: Konstruksi dengan Reklamasi', 'Melibatkan pengurukan danau untuk menciptakan daratan baru. Dampak lingkungan signifikan, biaya material tinggi.')}
                ${scenarioTableHtml(scenario_b, 'Skenario B: Konstruksi Apung dengan Tiang Pancang', 'Membangun di atas danau menggunakan pondasi tiang pancang. Lebih ramah lingkungan, namun memerlukan keahlian konstruksi spesifik.')}
                 <div class="p-4 bg-blue-50 border-l-4 border-blue-400 text-sm text-blue-800">
                    <strong>Catatan:</strong> Model finansial utama menggunakan <strong>Skenario B (Tiang Pancang)</strong> sebagai basis perhitungan karena dianggap lebih realistis dan ramah lingkungan.
                </div>
            </div>
        `;
    },

    _renderPadelCapexDetailsVisuals() {
        const container = document.getElementById('padel-capex-details-container');
        if (!container) return;

        const padelCapex = projectConfig.padel.capex;
        const numCourts = projectConfig.padel.revenue.main_revenue.courts;
        let tableBodyHtml = '';
        let grandTotal = 0;

        // Helper untuk baris kategori
        const addCategoryRow = (title) => {
            tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">${sierTranslate.translate(title)}</td></tbody>`;
        };

        // Helper untuk baris item yang bisa diedit
        const addItemRow = (label, value, path) => {
            const itemTotal = value;
            grandTotal += itemTotal;
            tableBodyHtml += `
                <tr>
                    <td class="px-3 py-2 text-gray-600 pl-8">${sierTranslate.translate(label)}</td>
                    <td class="px-3 py-2 text-gray-500 text-xs">Lump Sum</td>
                    <td class="px-3 py-2 text-right font-mono">${sierEditable.createEditableNumber(itemTotal, path, {format: 'currency'})}</td>
                </tr>
            `;
        };
        
        // Render Biaya Pra-Operasional & Konstruksi Sipil
        addCategoryRow('pre_operational');
        addItemRow('permits_and_consulting', padelCapex.pre_operational.permits_and_consulting, 'padel.capex.pre_operational.permits_and_consulting');
        addItemRow('initial_marketing', padelCapex.pre_operational.initial_marketing, 'padel.capex.pre_operational.initial_marketing');

        addCategoryRow('civil_construction');
        addItemRow('land_preparation', padelCapex.civil_construction.land_preparation, 'padel.capex.civil_construction.land_preparation');
        const foundationTotal = padelCapex.civil_construction.foundation_works_per_court * numCourts;
        grandTotal += foundationTotal;
        tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">Pondasi Lapangan</td><td class="px-3 py-2 text-gray-500 text-xs">${numCourts} lpgn @ ${sierEditable.createEditableNumber(padelCapex.civil_construction.foundation_works_per_court, 'padel.capex.civil_construction.foundation_works_per_court', {format: 'currency'})}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(foundationTotal)}</td></tr>`;
        
        addCategoryRow('building_structure');
        addItemRow('main_building_structure_cost', padelCapex.building_structure.main_building_structure_cost, 'padel.capex.building_structure.main_building_structure_cost');
        
        // Render Detail Peralatan Lapangan
        addCategoryRow('sport_courts_equipment');
        const courtsData = padelCapex.sport_courts_equipment;
        let perCourtTotal = 0;
        for (const itemKey in courtsData.per_court_costs) {
            const itemValue = courtsData.per_court_costs[itemKey];
            perCourtTotal += itemValue;
            tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">- ${sierTranslate.translate(itemKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">Biaya per lapangan</td><td class="px-3 py-2 text-right font-mono">${sierEditable.createEditableNumber(itemValue, `padel.capex.sport_courts_equipment.per_court_costs.${itemKey}`, {format: 'currency'})}</td></tr>`;
        }
        tableBodyHtml += `<tr class="font-semibold bg-gray-100"><td class="px-3 py-2 text-right" colspan="2">Subtotal Biaya per Lapangan</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(perCourtTotal)}</td></tr>`;
        const allCourtsTotal = perCourtTotal * numCourts;
        grandTotal += allCourtsTotal;
        tableBodyHtml += `<tr class="font-bold"><td class="px-3 py-2 text-right" colspan="2">Total untuk ${numCourts} Lapangan</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(allCourtsTotal)}</td></tr>`;
        
        // Render Inventaris Awal
        const inventoryData = courtsData.initial_inventory;
        let inventoryTotal = 0;
        for (const itemKey in inventoryData) {
            const item = inventoryData[itemKey];
            const itemTotal = item.quantity * item.unit_cost;
            inventoryTotal += itemTotal;
            tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">- ${sierTranslate.translate(itemKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">${sierEditable.createEditableNumber(item.quantity, `padel.capex.sport_courts_equipment.initial_inventory.${itemKey}.quantity`)} unit @ ${sierEditable.createEditableNumber(item.unit_cost, `padel.capex.sport_courts_equipment.initial_inventory.${itemKey}.unit_cost`, {format: 'currency'})}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(itemTotal)}</td></tr>`;
        }
        grandTotal += inventoryTotal;

        // Hitung kontingensi dan total akhir
        const contingencyRate = projectConfig.assumptions.contingency_rate;
        const contingency = grandTotal * contingencyRate;
        const finalTotal = grandTotal + contingency;

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Padel</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-200 text-xs uppercase">
                            <tr><th class="p-2 text-left w-1/2">Komponen Biaya</th><th class="p-2 text-left w-1/4">Detail Perhitungan</th><th class="p-2 text-right w-1/4">Estimasi Biaya (Rp)</th></tr>
                        </thead>
                        ${tableBodyHtml}
                        <tfoot class="font-bold">
                            <tr class="bg-gray-200"><td class="p-3 text-right" colspan="2">Subtotal Biaya Fisik & Pra-Operasional</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotal))}</td></tr>
                            <tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${sierEditable.createEditableNumber(contingencyRate, 'assumptions.contingency_rate', {format: 'percent'})})</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr>
                            <tr class="bg-purple-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi Padel</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(finalTotal))}</td></tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    },

    _renderSharedCapexVisuals() {
        const container = document.getElementById('shared-capex-details-container');
        if (!container) return;
        
        const sharedCapex = projectConfig.shared_facilities_capex;
        let tableBodyHtml = '';
        let grandTotal = 0;
        
        // 1. Hitung biaya bangunan & interior
        const bniData = sharedCapex.building_and_interior;
        const totalArea = Object.values(bniData.area_m2).reduce((sum, area) => sum + area, 0);
        const bniTotalCost = totalArea * bniData.construction_and_finishing_cost_per_m2;
        grandTotal += bniTotalCost;

        tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">Bangunan & Interior</td></tbody>`;
        for (const areaKey in bniData.area_m2) {
             tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">- Area ${sierTranslate.translate(areaKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">${sierEditable.createEditableNumber(bniData.area_m2[areaKey], `shared_facilities_capex.building_and_interior.area_m2.${areaKey}`)} m²</td><td></td></tr>`;
        }
        tableBodyHtml += `<tr class="font-semibold"><td class="px-3 py-2 text-right" colspan="2">Total Area (${sierHelpers.formatNumber(totalArea)} m²) @ ${sierEditable.createEditableNumber(bniData.construction_and_finishing_cost_per_m2, 'shared_facilities_capex.building_and_interior.construction_and_finishing_cost_per_m2', {format: 'currency'})}/m²</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(bniTotalCost)}</td></tr>`;
        
        // 2. Hitung biaya peralatan & furnitur
        const enfData = sharedCapex.equipment_and_furniture;
        let enfTotalCost = 0;
        tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">Peralatan & Furnitur</td></tbody>`;
        for (const itemKey in enfData) {
            const item = enfData[itemKey];
            let itemTotal;
            let detailHtml;
            if (typeof item === 'number') {
                itemTotal = item;
                detailHtml = `Lump Sum`;
                enfTotalCost += itemTotal;
                 tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">- ${sierTranslate.translate(itemKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">${detailHtml}</td><td class="px-3 py-2 text-right font-mono">${sierEditable.createEditableNumber(item, `shared_facilities_capex.equipment_and_furniture.${itemKey}`, {format: 'currency'})}</td></tr>`;
            } else {
                itemTotal = item.quantity * item.unit_cost;
                detailHtml = `${sierEditable.createEditableNumber(item.quantity, `shared_facilities_capex.equipment_and_furniture.${itemKey}.quantity`)} unit @ ${sierEditable.createEditableNumber(item.unit_cost, `shared_facilities_capex.equipment_and_furniture.${itemKey}.unit_cost`, {format: 'currency'})}`;
                enfTotalCost += itemTotal;
                tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">- ${sierTranslate.translate(itemKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">${detailHtml}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(itemTotal)}</td></tr>`;
            }
        }
        grandTotal += enfTotalCost;

        // Hitung total akhir
        const contingencyRate = projectConfig.assumptions.contingency_rate;
        const contingency = grandTotal * contingencyRate;
        const finalTotal = grandTotal + contingency;

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-emerald-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Fasilitas Umum</h2>
             <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <p class="text-gray-600 mb-6">${sharedCapex.notes}</p>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                         <thead class="bg-gray-200 text-xs uppercase">
                            <tr><th class="p-2 text-left w-1/2">Komponen Biaya</th><th class="p-2 text-left w-1/4">Detail Perhitungan</th><th class="p-2 text-right w-1/4">Estimasi Biaya (Rp)</th></tr>
                        </thead>
                        ${tableBodyHtml}
                         <tfoot class="font-bold">
                            <tr class="bg-gray-200"><td class="p-3 text-right" colspan="2">Subtotal Biaya Fisik</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotal))}</td></tr>
                            <tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${sierEditable.createEditableNumber(contingencyRate, 'assumptions.contingency_rate', {format: 'percent'})})</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr>
                            <tr class="bg-emerald-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi Fasilitas Umum</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(finalTotal))}</td></tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

        // Simpan total untuk digunakan di summary
        projectConfig.shared_facilities_capex.total = finalTotal;
    },

    _createRevenueBreakdownSection(unitName, revenueData) {
        if (!revenueData || !revenueData.rows) return '';
        const formatRp = (num) => sierHelpers.formatNumber(Math.round(num));

        const tableRows = revenueData.rows.map(row => `
            <tr class="hover:bg-gray-50">
                <td class="p-2">${row.item}</td>
                <td class="p-2 text-xs text-gray-500">${row.calc}</td>
                <td class="p-2 text-right font-mono">${formatRp(row.perDay)}</td>
                <td class="p-2 text-right font-mono">${formatRp(row.perMonth)}</td>
                <td class="p-2 text-right font-mono">${formatRp(row.perMonth * 12)}</td>
            </tr>
        `).join('');

        return `
            <div class="mb-8 pb-6 border-b">
                <h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Rincian Pendapatan</h3>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-100 text-xs uppercase">
                            <tr>
                                <th class="p-2 text-left">Sumber Pendapatan</th>
                                <th class="p-2 text-left">Detail Perhitungan</th>
                                <th class="p-2 text-right">Per Hari (Avg)</th>
                                <th class="p-2 text-right">Per Bulan</th>
                                <th class="p-2 text-right">Per Tahun</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${tableRows}
                        </tbody>
                        <tfoot class="bg-gray-200 font-bold">
                            <tr>
                                <td class="p-2" colspan="2">Total Estimasi Pendapatan</td>
                                <td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly / 30)}</td>
                                <td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly)}</td>
                                <td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly * 12)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    },

    _createBEPSection(analysisData) {
        const bep = analysisData.bepAnalysis;

        const fixedCostTable = Object.entries(bep.fixedCostBreakdown).map(([key, value]) => `<tr><td class="py-1 pr-2">${key}</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(value))}</td></tr>`).join('');
        
        const variableCostTable = Object.entries(bep.variableCostBreakdown).map(([key, value]) => `<tr><td class="py-1 pr-2">${key}</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(value))}</td></tr>`).join('');
        const totalVariableCost = Object.values(bep.variableCostBreakdown).reduce((sum, val) => sum + val, 0);

        return `
            <div class="bg-gray-50 p-4 rounded-lg border">
                <h4 class="font-semibold text-gray-800 mb-2">A. Analisis Titik Impas Operasional (BEP)</h4>
                <p class="text-sm text-gray-600 mb-3">Target penjualan minimum agar tidak rugi secara operasional (laba = 0), dihitung dengan membagi Biaya Tetap dengan Margin Kontribusi (Harga Jual - Biaya Variabel).</p>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
                    
                    <!-- Kolom Biaya Tetap -->
                    <div>
                        <h5 class="font-medium text-gray-700 mb-1">Biaya Tetap Bulanan</h5>
                        <table class="w-full text-xs">${fixedCostTable}
                            <tfoot class="border-t-2"><tr class="font-semibold"><td class="py-1 pr-2">Total Biaya Tetap</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(bep.totalFixedCostMonthly))}</td></tr></tfoot>
                        </table>
                    </div>

                    <!-- Kolom Biaya Variabel -->
                    <div>
                        <h5 class="font-medium text-gray-700 mb-1">Biaya Variabel per ${bep.unitLabel}</h5>
                         <table class="w-full text-xs">${variableCostTable}
                            <tfoot class="border-t-2"><tr class="font-semibold"><td class="py-1 pr-2">Total Biaya Variabel</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(totalVariableCost))}</td></tr></tfoot>
                        </table>
                    </div>
                    
                    <!-- Kolom Hasil BEP (Gabung 2 kolom) -->
                    <div class="lg:col-span-2 mt-4 bg-white p-3 rounded-md shadow-sm text-center">
                        <p class="text-sm font-semibold text-gray-700">Target Break-Even Point Bulanan</p>
                        <p class="text-4xl font-bold text-blue-700 mt-1">${sierHelpers.formatNumber(Math.ceil(bep.bepInUnitsMonthly))}</p>
                        <p class="text-sm text-gray-500">${bep.unitLabel}</p>
                        <p class="text-xs text-gray-500 mt-2">(Rata-rata ~${Math.ceil(bep.bepInUnitsDaily)} ${bep.unitLabel} / hari untuk mencapai BEP)</p>
                    </div>

                </div>
            </div>
        `;
    },
    _createProfitabilitySection(analysisData) { /* ... (fungsi ini tidak berubah, tetap sama) ... */ return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">B. Analisis Profitabilitas & Target Balik Modal (Payback)</h4><p class="text-sm text-gray-600 mb-3">Proyeksi profitabilitas berdasarkan asumsi okupansi saat ini untuk mengukur waktu balik modal.</p><table class="w-full text-sm"><tbody class="divide-y"><tr><td class="py-2 text-gray-600">Total Investasi Awal (CapEx)</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(analysisData.profitabilityAnalysis.totalCapex))}</td></tr><tr><td class="py-2 text-gray-600">Proyeksi Pendapatan Tahunan</td><td class="py-2 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(analysisData.profitabilityAnalysis.annualRevenue))}</td></tr><tr class="text-green-700"><td class="py-2 font-semibold">Proyeksi Laba Bersih Tahunan</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(analysisData.profitabilityAnalysis.annualNetProfit))}</td></tr><tr class="text-green-700"><td class="py-2 font-semibold">Proyeksi Arus Kas Bersih Tahunan</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(analysisData.profitabilityAnalysis.annualCashFlow))}</td></tr></tbody><tfoot class="border-t-2"><tr class="font-bold text-lg text-green-600"><td class="py-2">Estimasi Waktu Balik Modal</td><td class="py-2 text-right font-mono">${analysisData.profitabilityAnalysis.paybackPeriod.toFixed(2)} Tahun</td></tr></tfoot></table></div>`; },
    _createScenarioSection(analysisData) { /* ... (fungsi ini tidak berubah, tetap sama) ... */ const mods = projectConfig.assumptions.scenario_modifiers; const formatPayback = (years) => years === Infinity ? '> 15 Thn' : `${years.toFixed(2)} Thn`; return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">C. Analisis Skenario</h4><p class="text-sm text-gray-600 mb-3">Mengukur dampak perubahan pendapatan terhadap profitabilitas dan waktu balik modal.</p><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"><div class="bg-red-50 p-3 rounded-md border border-red-200 text-center"><p class="font-bold text-red-800">Pesimis</p><p class="text-xs text-red-600">(${(mods.pessimistic_revenue * 100 - 100).toFixed(0)}% Revenue)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg ${analysisData.scenarioAnalysis.pessimistic.netProfit < 0 ? 'text-red-600' : 'text-gray-800'}">Rp ${sierHelpers.formatNumber(Math.round(analysisData.scenarioAnalysis.pessimistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-red-600">${formatPayback(analysisData.scenarioAnalysis.pessimistic.payback)}</p></div><div class="bg-blue-50 p-3 rounded-md border border-blue-200 text-center ring-2 ring-blue-500"><p class="font-bold text-blue-800">Realisitis (Basis)</p><p class="text-xs text-blue-600">(Target Awal)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg text-gray-800">Rp ${sierHelpers.formatNumber(Math.round(analysisData.scenarioAnalysis.realistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-blue-600">${formatPayback(analysisData.scenarioAnalysis.realistic.payback)}</p></div><div class="bg-green-50 p-3 rounded-md border border-green-200 text-center"><p class="font-bold text-green-800">Optimis</p><p class="text-xs text-green-600">(+${(mods.optimistic_revenue * 100 - 100).toFixed(0)}% Revenue)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg text-gray-800">Rp ${sierHelpers.formatNumber(Math.round(analysisData.scenarioAnalysis.optimistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-green-600">${formatPayback(analysisData.scenarioAnalysis.optimistic.payback)}</p></div></div></div>`; },

    _renderDepreciationDetails() {
        const container = document.getElementById('depreciation-details-container');
        if (!container) return;

        const data = sierMath.getDepreciationDetails();

        const tableRows = data.details.map(item => `
            <tr>
                <td class="px-3 py-2">${item.category}</td>
                <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(item.capexValue))}</td>
                <td class="px-3 py-2 text-center">${sierEditable.createEditableNumber(item.lifespan, item.lifespanPath)}</td>
                <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(item.annualDepreciation))}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <h3 class="text-xl font-semibold mb-3 text-gray-800">Rincian Perhitungan Depresiasi Aset</h3>
            <p class="text-sm text-gray-600 mb-4">Tabel ini menjelaskan bagaimana total biaya "Depresiasi & Amortisasi" pada laporan Laba Rugi dihitung, berdasarkan nilai aset dan asumsi masa manfaatnya.</p>
            <div class="overflow-x-auto border rounded-lg">
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 text-xs uppercase">
                        <tr>
                            <th class="p-2 text-left">Kategori Aset</th>
                            <th class="p-2 text-right">Total Nilai Aset (CapEx)</th>
                            <th class="p-2 text-center">Masa Manfaat (Tahun)</th>
                            <th class="p-2 text-right">Penyusutan per Tahun (Rp)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${tableRows}
                    </tbody>
                    <tfoot class="font-bold bg-gray-200">
                        <tr>
                            <td colspan="3" class="p-2 text-right">Total Depresiasi Tahunan</td>
                            <td class="p-2 text-right font-mono text-base">${sierHelpers.formatNumber(Math.round(data.totalAnnualDepreciation))}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    },

    _createPnlTable(pnlData) {
        return `<table class="w-full text-sm">
            <thead class="bg-gray-50"><tr class="text-left"><th class="px-4 py-2 w-4/5">Deskripsi</th><th class="px-4 py-2 text-right">Nilai (Tahun Pertama)</th></tr></thead>
            <tbody class="divide-y">
                <tr><td class="px-4 py-2">Pendapatan (Revenue)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(pnlData.annualRevenue))}</td></tr>
                <tr><td class="px-4 py-2">Harga Pokok Penjualan (COGS)</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(pnlData.annualCogs))})</td></tr>
                <tr class="font-semibold"><td class="px-4 py-2">Laba Kotor (Gross Profit)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(pnlData.grossProfit))}</td></tr>
                <tr><td class="px-4 py-2">Biaya Operasional (OpEx)</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(pnlData.annualOpex))})</td></tr>
                <tr class="font-semibold"><td class="px-4 py-2">EBITDA</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(pnlData.ebitda))}</td></tr>
                <tr><td class="px-4 py-2">Depresiasi & Amortisasi</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(pnlData.annualDepreciation))})</td></tr>
                <tr class="font-semibold"><td class="px-4 py-2">Laba Sebelum Pajak (EBT)</td><td class="px-4 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(pnlData.ebt))}</td></tr>
                <tr><td class="px-4 py-2">Pajak Penghasilan (${(projectConfig.assumptions.tax_rate_profit * 100)}%)</td><td class="px-4 py-2 text-right font-mono">(${sierHelpers.formatNumber(Math.round(pnlData.tax))})</td></tr>
                <tr class="bg-teal-100 font-bold text-teal-800"><td class="px-4 py-3 text-base">Laba Bersih (Net Profit)</td><td class="px-4 py-3 text-right text-base font-mono">${sierHelpers.formatNumber(Math.round(pnlData.netProfit))}</td></tr>
            </tbody>
        </table>`;
    },

    _renderFinancialSummaryVisuals() {
        const summaryContainer = document.getElementById('financial-analysis-summary');
        if (!summaryContainer) return;

        const summary = sierMath.getFinancialSummary();
        const { drivingRange: dr, padel, combined, digitalCapexTotal } = summary;
        const sharedCapexTotal = projectConfig.shared_facilities_capex.total || 0;
        const totalProjectInvestment = dr.capex.total + padel.capex.total + digitalCapexTotal + sharedCapexTotal;

        const cashFlow = combined.pnl.cashFlowFromOps;
        const paybackPeriod = cashFlow > 0 ? totalProjectInvestment / cashFlow : Infinity;
        let npv = -totalProjectInvestment;
        for (let i = 1; i <= 20; i++) { npv += cashFlow / Math.pow(1 + projectConfig.assumptions.discount_rate_wacc, i); }
        let irr = 0.0;
        for (let i = 0; i < 1.0; i += 0.001) { let tempNpv = -totalProjectInvestment; for (let j = 1; j <= 20; j++) { tempNpv += cashFlow / Math.pow(1 + i, j); } if (tempNpv < 0) { irr = i > 0 ? i - 0.001 : 0; break; } }

        const capexSummaryHtml = `<div id="capex-summary" class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-3 text-gray-800">1. Ringkasan Biaya Investasi (CapEx)</h3><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"><div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Driving Range</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(dr.capex.total)}</p></div><div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Padel</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(padel.capex.total)}</p></div><div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Teknologi Digital</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(digitalCapexTotal)}</p></div><div class="bg-gray-100 p-4 rounded-lg text-center"><p class="text-sm text-gray-600">CapEx Fasilitas Umum</p><p class="text-2xl font-bold font-mono text-gray-800">${sierHelpers.toBillion(sharedCapexTotal)}</p></div><div class="bg-teal-600 text-white p-4 rounded-lg text-center flex flex-col justify-center"><p class="text-sm">Total Investasi Proyek</p><p class="text-3xl font-bold font-mono">${sierHelpers.toBillion(totalProjectInvestment)}</p></div></div></div>`;
        const pnlSummaryHtml = `<div id="pnl-summary" class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-3 text-gray-800">2. Proyeksi Laba Rugi (P&L) - Gabungan</h3><div class="overflow-x-auto border rounded-lg">${this._createPnlTable(combined.pnl)}</div></div>`;
        const investmentFeasibilityHtml = `<div id="investment-feasibility" class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-4 text-gray-800">3. Analisis Kelayakan Investasi (Proyek Gabungan)</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="bg-blue-100 p-4 rounded-lg text-center"><p class="text-sm text-blue-800">Payback Period</p><p class="text-3xl font-bold text-blue-700">${paybackPeriod.toFixed(2)}</p><p class="text-xs text-blue-600">Tahun</p></div><div class="bg-green-100 p-4 rounded-lg text-center"><p class="text-sm text-green-800">Net Present Value (NPV)</p><p class="text-3xl font-bold text-green-700">${sierHelpers.toBillion(npv)}</p><p class="text-xs text-green-600">(WACC ${projectConfig.assumptions.discount_rate_wacc * 100}%)</p></div><div class="bg-purple-100 p-4 rounded-lg text-center"><p class="text-sm text-purple-800">Internal Rate of Return (IRR)</p><p class="text-3xl font-bold text-purple-700">${(irr * 100).toFixed(2)}%</p><p class="text-xs text-purple-600">Lebih besar dari WACC, proyek layak</p></div></div></div>`;
        const sensitivityAnalysisHtml = `<div id="sensitivity-analysis"><h3 class="text-xl font-semibold mb-4 text-gray-800">4. Analisis Sensitivitas</h3><p class="text-gray-600 mb-4 text-sm">Analisis ini menguji seberapa besar perubahan Laba Bersih Tahunan jika asumsi pendapatan atau biaya operasional berubah. Ini membantu mengidentifikasi risiko utama terhadap profitabilitas.</p></div>`;

        summaryContainer.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-teal-600 pl-4">Analisis Keuangan & Kelayakan Investasi (Proyek Gabungan)</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8"><div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 mb-6 text-sm"><strong>Disclaimer:</strong> Analisis ini adalah model proyeksi.</div>${capexSummaryHtml}<div id="depreciation-details-container" class="mb-8 pb-6 border-b"></div>${pnlSummaryHtml}${investmentFeasibilityHtml}${sensitivityAnalysisHtml}</div>`;
        this._renderDepreciationDetails();
    },

    /**
     * Fungsi render utama yang memanggil semua fungsi render parsial dalam urutan yang benar.
     */
    render() {
        // 1. Render semua bagian detail terlebih dahulu
        this._renderAssumptionsVisuals();
        this._renderDrCapexDetailsVisuals();
        this._renderPadelCapexDetailsVisuals();
        this._renderOpexDetailsVisuals();
        this._renderSharedCapexVisuals();

        // 2. Render analisis per unit bisnis
        const drAnalysisData = sierMath.getStrategicAnalysis('drivingRange');
        const padelAnalysisData = sierMath.getStrategicAnalysis('padel');
        const drContainer = document.getElementById('driving-range-financial-analysis');
        const padelContainer = document.getElementById('padel-financial-analysis');

        if (drContainer) {
            const drPnlTable = this._createPnlTable(sierMath._getUnitCalculations('drivingRange').pnl);
            drContainer.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-blue-500 pl-4">Analisis Finansial Detail: Driving Range</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-8">${this._createRevenueBreakdownSection('drivingRange', sierMath._getDetailedRevenueBreakdown('drivingRange'))}<h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Laba Rugi (P&L)</h3><div class="overflow-x-auto border rounded-lg">${drPnlTable}</div><div class="mt-8 space-y-6">${this._createBEPSection('drivingRange', drAnalysisData)}${this._createProfitabilitySection('drivingRange', drAnalysisData)}${this._createScenarioSection('drivingRange', drAnalysisData)}</div></div>`;
        }
        if (padelContainer) {
            const padelPnlTable = this._createPnlTable(sierMath._getUnitCalculations('padel').pnl);
            padelContainer.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Analisis Finansial Detail: Padel</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-8">${this._createRevenueBreakdownSection('padel', sierMath._getDetailedRevenueBreakdown('padel'))}<h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Laba Rugi (P&L)</h3><div class="overflow-x-auto border rounded-lg">${padelPnlTable}</div><div class="mt-8 space-y-6">${this._createBEPSection('padel', padelAnalysisData)}${this._createProfitabilitySection('padel', padelAnalysisData)}${this._createScenarioSection('padel', padelAnalysisData)}</div></div>`;
        }
        
        // 3. Render ringkasan keuangan gabungan terakhir, setelah semua data dihitung
        this._renderFinancialSummaryVisuals();

        console.log("[sier-visual-finance] Semua visual finansial telah dirender.");
    }
};

window.sierVisualFinance = sierVisualFinance;