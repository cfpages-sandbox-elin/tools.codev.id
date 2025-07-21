// File: sier-visual-finance-details.js
// Bertanggung jawab untuk merender SEMUA rincian finansial (OpEx, CapEx, Analisis).

const sierVisualFinanceDetails = {

    //======================================================================
    // BAGIAN 1: FUNGSI-FUNGSI HELPER UNTUK MEMBUAT KOMPONEN VISUAL
    //======================================================================

    _createPnlTable(pnlData) {
        if (!pnlData) return '<p class="text-red-500">Data P&L tidak tersedia.</p>';
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

    _createRevenueBreakdownSection(revenueData) {
        if (!revenueData || !revenueData.rows) return '';
        const formatRp = (num) => sierHelpers.formatNumber(Math.round(num));
        const tableRows = revenueData.rows.map(row => `
            <tr class="hover:bg-gray-50">
                <td class="p-2">${row.item}</td><td class="p-2 text-xs text-gray-500">${row.calc}</td>
                <td class="p-2 text-right font-mono">${formatRp(row.perDay)}</td><td class="p-2 text-right font-mono">${formatRp(row.perMonth)}</td>
                <td class="p-2 text-right font-mono">${formatRp(row.perMonth * 12)}</td>
            </tr>`).join('');
        return `<div class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Rincian Pendapatan</h3><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Sumber Pendapatan</th><th class="p-2 text-left">Detail Perhitungan</th><th class="p-2 text-right">Per Hari (Avg)</th><th class="p-2 text-right">Per Bulan</th><th class="p-2 text-right">Per Tahun</th></tr></thead><tbody class="divide-y">${tableRows}</tbody><tfoot class="bg-gray-200 font-bold"><tr><td class="p-2" colspan="2">Total Estimasi Pendapatan</td><td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly / 30)}</td><td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly)}</td><td class="p-2 text-right font-mono">${formatRp(revenueData.total_monthly * 12)}</td></tr></tfoot></table></div></div>`;
    },

    _createBEPSection(analysisData) {
        if (!analysisData || !analysisData.bepAnalysis) return '';
        const { bepAnalysis } = analysisData;
        const totalVariableCost = Object.values(bepAnalysis.variableCostBreakdown).reduce((sum, val) => sum + val, 0);
        return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">A. Analisis Titik Impas Operasional (BEP)</h4><p class="text-sm text-gray-600 mb-3">Target penjualan minimum agar tidak rugi secara operasional (laba = 0), dihitung dengan membagi Biaya Tetap dengan Margin Kontribusi (Harga Jual - Biaya Variabel).</p><div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4"><div><h5 class="font-medium text-gray-700 mb-1">Biaya Tetap Bulanan</h5><table class="w-full text-xs">${Object.entries(bepAnalysis.fixedCostBreakdown).map(([key, value]) => `<tr><td class="py-1 pr-2">${key}</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(value))}</td></tr>`).join('')}<tfoot class="border-t-2"><tr class="font-semibold"><td class="py-1 pr-2">Total Biaya Tetap</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(bepAnalysis.totalFixedCostMonthly))}</td></tr></tfoot></table></div><div><h5 class="font-medium text-gray-700 mb-1">Biaya Variabel per ${bepAnalysis.unitLabel}</h5><table class="w-full text-xs">${Object.entries(bepAnalysis.variableCostBreakdown).map(([key, value]) => `<tr><td class="py-1 pr-2">${key}</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(value))}</td></tr>`).join('')}<tfoot class="border-t-2"><tr class="font-semibold"><td class="py-1 pr-2">Total Biaya Variabel</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(totalVariableCost))}</td></tr></tfoot></table></div><div class="lg:col-span-2 mt-4 bg-white p-3 rounded-md shadow-sm text-center"><p class="text-sm font-semibold text-gray-700">Target Break-Even Point Bulanan</p><p class="text-4xl font-bold text-blue-700 mt-1">${sierHelpers.formatNumber(Math.ceil(bepAnalysis.bepInUnitsMonthly))}</p><p class="text-sm text-gray-500">${bepAnalysis.unitLabel}</p><p class="text-xs text-gray-500 mt-2">(Rata-rata ~${Math.ceil(bepAnalysis.bepInUnitsDaily)} ${bepAnalysis.unitLabel} / hari untuk mencapai BEP)</p></div></div></div>`;
    },

    _createProfitabilitySection(analysisData) {
        if (!analysisData || !analysisData.profitabilityAnalysis) return '';
        const { profitabilityAnalysis } = analysisData;
        return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">B. Analisis Profitabilitas & Target Balik Modal (Payback)</h4><p class="text-sm text-gray-600 mb-3">Proyeksi profitabilitas berdasarkan asumsi okupansi saat ini untuk mengukur waktu balik modal.</p><table class="w-full text-sm"><tbody class="divide-y"><tr><td class="py-2 text-gray-600">Total Investasi Awal (CapEx)</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.totalCapex))}</td></tr><tr><td class="py-2 text-gray-600">Proyeksi Pendapatan Tahunan</td><td class="py-2 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.annualRevenue))}</td></tr><tr class="text-green-700"><td class="py-2 font-semibold">Proyeksi Laba Bersih Tahunan</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.annualNetProfit))}</td></tr><tr class="text-green-700"><td class="py-2 font-semibold">Proyeksi Arus Kas Bersih Tahunan</td><td class="py-2 text-right font-mono font-bold">Rp ${sierHelpers.formatNumber(Math.round(profitabilityAnalysis.annualCashFlow))}</td></tr></tbody><tfoot class="border-t-2"><tr class="font-bold text-lg text-green-600"><td class="py-2">Estimasi Waktu Balik Modal</td><td class="py-2 text-right font-mono">${profitabilityAnalysis.paybackPeriod.toFixed(2)} Tahun</td></tr></tfoot></table></div>`;
    },

    _createScenarioSection(analysisData) {
        if (!analysisData || !analysisData.scenarioAnalysis) return '';
        const { scenarioAnalysis } = analysisData;
        const mods = projectConfig.assumptions.scenario_modifiers;
        const formatPayback = (years) => years === Infinity ? '> 15 Thn' : `${years.toFixed(2)} Thn`;
        return `<div class="bg-gray-50 p-4 rounded-lg border"><h4 class="font-semibold text-gray-800 mb-2">C. Analisis Skenario</h4><p class="text-sm text-gray-600 mb-3">Mengukur dampak perubahan pendapatan terhadap profitabilitas dan waktu balik modal.</p><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"><div class="bg-red-50 p-3 rounded-md border border-red-200 text-center"><p class="font-bold text-red-800">Pesimis</p><p class="text-xs text-red-600">(${(mods.pessimistic_revenue * 100 - 100).toFixed(0)}% Revenue)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg ${scenarioAnalysis.pessimistic.netProfit < 0 ? 'text-red-600' : 'text-gray-800'}">Rp ${sierHelpers.formatNumber(Math.round(scenarioAnalysis.pessimistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-red-600">${formatPayback(scenarioAnalysis.pessimistic.payback)}</p></div><div class="bg-blue-50 p-3 rounded-md border border-blue-200 text-center ring-2 ring-blue-500"><p class="font-bold text-blue-800">Realisitis (Basis)</p><p class="text-xs text-blue-600">(Target Awal)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg text-gray-800">Rp ${sierHelpers.formatNumber(Math.round(scenarioAnalysis.realistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-blue-600">${formatPayback(scenarioAnalysis.realistic.payback)}</p></div><div class="bg-green-50 p-3 rounded-md border border-green-200 text-center"><p class="font-bold text-green-800">Optimis</p><p class="text-xs text-green-600">(+${(mods.optimistic_revenue * 100 - 100).toFixed(0)}% Revenue)</p><hr class="my-2"><p class="text-sm text-gray-600">Laba Bersih/Thn</p><p class="font-semibold text-lg text-gray-800">Rp ${sierHelpers.formatNumber(Math.round(scenarioAnalysis.optimistic.netProfit))}</p><p class="text-sm text-gray-600 mt-2">Balik Modal</p><p class="font-semibold text-lg text-green-600">${formatPayback(scenarioAnalysis.optimistic.payback)}</p></div></div></div>`;
    },

    _renderOpexDetailsVisuals() {
        const container = document.getElementById('opex-details-container');
        if (!container) return;
        const createUnitOpexTable = (unitName) => {
            const unitConfig = projectConfig[unitName];
            if (!unitConfig || !unitConfig.opexMonthly) return '<p>Data OpEx tidak ditemukan.</p>';
            const opexData = unitConfig.opexMonthly;
            let grandTotalOpex = 0;
            const staffData = opexData.salaries_wages;
            let staffTableRows = '', totalStaffCost = 0;
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
            let otherTableRows = '', totalOtherCost = 0;
            otherDataKeys.forEach(key => { const cost = opexData[key]; if (cost !== undefined) { totalOtherCost += cost; otherTableRows += `<tr><td class="p-2">${sierTranslate.translate(key)}</td><td class="p-2 text-right font-mono">${sierEditable.createEditableNumber(cost, `${unitName}.opexMonthly.${key}`, {format: 'currency'})}</td></tr>`; } });
            grandTotalOpex += totalOtherCost;
            const otherTableHtml = `<h4 class="font-semibold text-gray-800 mt-6 mb-2">3. Biaya Operasional Lainnya</h4><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Kategori Biaya</th><th class="p-2 text-right">Estimasi Biaya Bulanan (Rp)</th></tr></thead><tbody class="divide-y">${otherTableRows}</tbody><tfoot class="font-bold bg-gray-100"><tr><td class="p-2 text-right">Subtotal Biaya Lainnya</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalOtherCost))}</td></tr></tfoot></table></div>`;
            return `<div class="bg-white p-6 rounded-lg shadow-md">${staffTableHtml}${utilTableHtml}${otherTableHtml}<div class="mt-6 bg-gray-200 text-gray-800 font-bold p-3 rounded-lg flex justify-between items-center text-lg"><span>Total Estimasi Biaya Operasional Bulanan</span><span class="font-mono">Rp ${sierHelpers.formatNumber(Math.round(grandTotalOpex))}</span></div></div>`;
        };
        container.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-amber-500 pl-4">Rincian Estimasi Biaya Operasional (OpEx) Bulanan</h2><div class="grid grid-cols-1 lg:grid-cols-2 gap-8"><div><h3 class="text-xl font-bold mb-4 text-center text-blue-700">Driving Range</h3>${createUnitOpexTable('drivingRange')}</div><div><h3 class="text-xl font-bold mb-4 text-center text-purple-700">Padel</h3>${createUnitOpexTable('padel')}</div></div>`;
    },

    _renderDrCapexDetailsVisuals() {
        const container = document.getElementById('driving-range-capex-details-container');
        if (!container) return;
        const results = sierMath._calculateDrCapex();
        if (!results) return;
        const { equipment_detail, scenario_a, scenario_b } = results;
        const createRow = (item) => `<tr><td class="p-2">${item.category}</td><td class="p-2">${item.component}</td><td class="p-2 text-xs text-gray-500">${item.calculation}</td><td class="p-2 text-right font-mono">${sierEditable.createEditableNumber(sierMath.getValueByPath(projectConfig, item.path), item.path, {format: 'currency'})}</td></tr>`;
        const equipmentTable = `<h3 class="text-xl font-semibold mb-3 text-gray-800">Rincian Biaya Peralatan & Jaring Pengaman</h3><div class="overflow-x-auto border rounded-lg mb-8"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Kategori</th><th class="p-2 text-left">Komponen</th><th class="p-2 text-left">Detail</th><th class="p-2 text-right">Biaya Satuan (Rp)</th></tr></thead><tbody class="divide-y">${equipment_detail.htmlRows.map(createRow).join('')}</tbody></table></div>`;
        const scenarioTableHtml = (data, title, description) => {
            if(!data) return '';
            const contingencyRate = projectConfig.assumptions.contingency_rate;
            let rowsHtml = data.htmlRows.map(row => `<tr><td class="p-3">${row.label}</td><td class="p-3 text-gray-500 text-xs">${row.calculation}</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(row.value))}</td></tr>`).join('');
            return `<div class="mb-10"><h3 class="text-xl font-semibold mb-3 text-gray-800">${title}</h3><p class="text-gray-600 mb-4 text-sm">${description}</p><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Komponen Biaya</th><th class="p-2 text-left">Perhitungan</th><th class="p-2 text-right">Estimasi Biaya (Rp)</th></tr></thead><tbody class="divide-y">${rowsHtml}<tr class="bg-gray-200 font-bold"><td class="p-3" colspan="2">Subtotal Biaya Fisik & Lainnya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.subtotal))}</td></tr><tr class="bg-yellow-200 font-bold"><td class="p-3" colspan="2">Kontingensi (${sierEditable.createEditableNumber(contingencyRate, 'assumptions.contingency_rate', {format: 'percent'})})</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.contingency))}</td></tr><tr class="bg-blue-600 text-white font-bold text-lg"><td class="p-3" colspan="2">Total Estimasi Investasi (Skenario Ini)</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(data.total))}</td></tr></tbody></table></div></div>`;
        };
        container.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-blue-500 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Driving Range</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8">${equipmentTable}${scenarioTableHtml(scenario_a, 'Skenario A: Konstruksi dengan Reklamasi', 'Melibatkan pengurukan danau untuk menciptakan daratan baru. Dampak lingkungan signifikan, biaya material tinggi.')}${scenarioTableHtml(scenario_b, 'Skenario B: Konstruksi Apung dengan Tiang Pancang', 'Membangun di atas danau menggunakan pondasi tiang pancang. Lebih ramah lingkungan, namun memerlukan keahlian konstruksi spesifik.')}<div class="p-4 bg-blue-50 border-l-4 border-blue-400 text-sm text-blue-800"><strong>Catatan:</strong> Model finansial utama menggunakan <strong>Skenario B (Tiang Pancang)</strong> sebagai basis perhitungan karena dianggap lebih realistis dan ramah lingkungan.</div></div>`;
    },

    _renderPadelCapexDetailsVisuals() {
        const container = document.getElementById('padel-capex-details-container');
        if (!container) return;
        const padelCapex = projectConfig.padel.capex;
        const numCourts = projectConfig.padel.revenue.main_revenue.courts;
        let tableBodyHtml = '', grandTotal = 0;
        const addCategoryRow = (title) => { tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">${sierTranslate.translate(title)}</td></tbody>`; };
        const addItemRow = (label, value, path) => { const itemTotal = value; grandTotal += itemTotal; tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">${sierTranslate.translate(label)}</td><td class="px-3 py-2 text-gray-500 text-xs">Lump Sum</td><td class="px-3 py-2 text-right font-mono">${sierEditable.createEditableNumber(itemTotal, path, {format: 'currency'})}</td></tr>`; };
        addCategoryRow('pre_operational'); addItemRow('permits_and_consulting', padelCapex.pre_operational.permits_and_consulting, 'padel.capex.pre_operational.permits_and_consulting'); addItemRow('initial_marketing', padelCapex.pre_operational.initial_marketing, 'padel.capex.pre_operational.initial_marketing');
        addCategoryRow('civil_construction'); addItemRow('land_preparation', padelCapex.civil_construction.land_preparation, 'padel.capex.civil_construction.land_preparation');
        const foundationTotal = padelCapex.civil_construction.foundation_works_per_court * numCourts; grandTotal += foundationTotal; tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">Pondasi Lapangan</td><td class="px-3 py-2 text-gray-500 text-xs">${numCourts} lpgn @ ${sierEditable.createEditableNumber(padelCapex.civil_construction.foundation_works_per_court, 'padel.capex.civil_construction.foundation_works_per_court', {format: 'currency'})}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(foundationTotal)}</td></tr>`;
        addCategoryRow('building_structure'); addItemRow('main_building_structure_cost', padelCapex.building_structure.main_building_structure_cost, 'padel.capex.building_structure.main_building_structure_cost');
        addCategoryRow('sport_courts_equipment'); const courtsData = padelCapex.sport_courts_equipment; let perCourtTotal = 0;
        for (const itemKey in courtsData.per_court_costs) { const itemValue = courtsData.per_court_costs[itemKey]; perCourtTotal += itemValue; tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">- ${sierTranslate.translate(itemKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">Biaya per lapangan</td><td class="px-3 py-2 text-right font-mono">${sierEditable.createEditableNumber(itemValue, `padel.capex.sport_courts_equipment.per_court_costs.${itemKey}`, {format: 'currency'})}</td></tr>`; }
        tableBodyHtml += `<tr class="font-semibold bg-gray-100"><td class="px-3 py-2 text-right" colspan="2">Subtotal Biaya per Lapangan</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(perCourtTotal)}</td></tr>`;
        const allCourtsTotal = perCourtTotal * numCourts; grandTotal += allCourtsTotal; tableBodyHtml += `<tr class="font-bold"><td class="px-3 py-2 text-right" colspan="2">Total untuk ${numCourts} Lapangan</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(allCourtsTotal)}</td></tr>`;
        const inventoryData = courtsData.initial_inventory; let inventoryTotal = 0;
        for (const itemKey in inventoryData) { const item = inventoryData[itemKey]; const itemTotal = item.quantity * item.unit_cost; inventoryTotal += itemTotal; tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">- ${sierTranslate.translate(itemKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">${sierEditable.createEditableNumber(item.quantity, `padel.capex.sport_courts_equipment.initial_inventory.${itemKey}.quantity`)} unit @ ${sierEditable.createEditableNumber(item.unit_cost, `padel.capex.sport_courts_equipment.initial_inventory.${itemKey}.unit_cost`, {format: 'currency'})}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(itemTotal)}</td></tr>`; }
        grandTotal += inventoryTotal;
        const contingencyRate = projectConfig.assumptions.contingency_rate; const contingency = grandTotal * contingencyRate; const finalTotal = grandTotal + contingency;
        container.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Padel</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8"><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-200 text-xs uppercase"><tr><th class="p-2 text-left w-1/2">Komponen Biaya</th><th class="p-2 text-left w-1/4">Detail Perhitungan</th><th class="p-2 text-right w-1/4">Estimasi Biaya (Rp)</th></tr></thead>${tableBodyHtml}<tfoot class="font-bold"><tr class="bg-gray-200"><td class="p-3 text-right" colspan="2">Subtotal Biaya Fisik & Pra-Operasional</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotal))}</td></tr><tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${sierEditable.createEditableNumber(contingencyRate, 'assumptions.contingency_rate', {format: 'percent'})})</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr><tr class="bg-purple-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi Padel</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(finalTotal))}</td></tr></tfoot></table></div></div>`;
    },

    _renderSharedCapexVisuals() {
        const container = document.getElementById('shared-capex-details-container');
        if (!container) return;
        const sharedCapex = projectConfig.shared_facilities_capex;
        let tableBodyHtml = '', grandTotal = 0;
        const bniData = sharedCapex.building_and_interior;
        const totalArea = Object.values(bniData.area_m2).reduce((sum, area) => sum + area, 0);
        const bniTotalCost = totalArea * bniData.construction_and_finishing_cost_per_m2;
        grandTotal += bniTotalCost;
        tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">Bangunan & Interior</td></tbody>`;
        for (const areaKey in bniData.area_m2) { tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">- Area ${sierTranslate.translate(areaKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">${sierEditable.createEditableNumber(bniData.area_m2[areaKey], `shared_facilities_capex.building_and_interior.area_m2.${areaKey}`)} m²</td><td></td></tr>`; }
        tableBodyHtml += `<tr class="font-semibold"><td class="px-3 py-2 text-right" colspan="2">Total Area (${sierHelpers.formatNumber(totalArea)} m²) @ ${sierEditable.createEditableNumber(bniData.construction_and_finishing_cost_per_m2, 'shared_facilities_capex.building_and_interior.construction_and_finishing_cost_per_m2', {format: 'currency'})}/m²</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(bniTotalCost)}</td></tr>`;
        const enfData = sharedCapex.equipment_and_furniture; let enfTotalCost = 0;
        tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">Peralatan & Furnitur</td></tbody>`;
        for (const itemKey in enfData) {
            const item = enfData[itemKey]; let itemTotal, detailHtml;
            if (typeof item === 'number') { itemTotal = item; detailHtml = `Lump Sum`; enfTotalCost += itemTotal; tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">- ${sierTranslate.translate(itemKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">${detailHtml}</td><td class="px-3 py-2 text-right font-mono">${sierEditable.createEditableNumber(item, `shared_facilities_capex.equipment_and_furniture.${itemKey}`, {format: 'currency'})}</td></tr>`; }
            else { itemTotal = item.quantity * item.unit_cost; detailHtml = `${sierEditable.createEditableNumber(item.quantity, `shared_facilities_capex.equipment_and_furniture.${itemKey}.quantity`)} unit @ ${sierEditable.createEditableNumber(item.unit_cost, `shared_facilities_capex.equipment_and_furniture.${itemKey}.unit_cost`, {format: 'currency'})}`; enfTotalCost += itemTotal; tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">- ${sierTranslate.translate(itemKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">${detailHtml}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(itemTotal)}</td></tr>`; }
        }
        grandTotal += enfTotalCost;
        const contingencyRate = projectConfig.assumptions.contingency_rate; const contingency = grandTotal * contingencyRate; const finalTotal = grandTotal + contingency;
        container.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-emerald-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Fasilitas Umum</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8"><p class="text-gray-600 mb-6">${sharedCapex.notes}</p><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-200 text-xs uppercase"><tr><th class="p-2 text-left w-1/2">Komponen Biaya</th><th class="p-2 text-left w-1/4">Detail Perhitungan</th><th class="p-2 text-right w-1/4">Estimasi Biaya (Rp)</th></tr></thead>${tableBodyHtml}<tfoot class="font-bold"><tr class="bg-gray-200"><td class="p-3 text-right" colspan="2">Subtotal Biaya Fisik</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotal))}</td></tr><tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${sierEditable.createEditableNumber(contingencyRate, 'assumptions.contingency_rate', {format: 'percent'})})</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr><tr class="bg-emerald-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi Fasilitas Umum</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(finalTotal))}</td></tr></tfoot></table></div></div>`;
    },

    _renderUnitFinancialDetail(unitName) {
        const config = {
            drivingRange: { containerId: 'driving-range-financial-analysis', title: 'Analisis Finansial Detail: Driving Range', borderColor: 'border-blue-500' },
            padel: { containerId: 'padel-financial-analysis', title: 'Analisis Finansial Detail: Padel', borderColor: 'border-purple-600' }
        };
        const { containerId, title, borderColor } = config[unitName];
        const container = document.getElementById(containerId);
        if (!container) return;
        const unitCalculations = sierMath._getUnitCalculations(unitName);
        const strategicAnalysis = sierMath.getStrategicAnalysis(unitName);
        const revenueBreakdown = sierMath._getDetailedRevenueBreakdown(unitName);
        const revenueHtml = this._createRevenueBreakdownSection(revenueBreakdown);
        const pnlTableHtml = this._createPnlTable(unitCalculations.pnl);
        const bepHtml = this._createBEPSection(strategicAnalysis);
        const profitabilityHtml = this._createProfitabilitySection(strategicAnalysis);
        const scenarioHtml = this._createScenarioSection(strategicAnalysis);
        container.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 ${borderColor} pl-4">${title}</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-8">${revenueHtml}<h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Laba Rugi (P&L)</h3><div class="overflow-x-auto border rounded-lg">${pnlTableHtml}</div><div class="mt-8 space-y-6">${bepHtml}${profitabilityHtml}${scenarioHtml}</div></div>`;
    },

    /**
     * Fungsi render orkestrator untuk file ini.
     */
    render() {
        this._renderOpexDetailsVisuals();
        this._renderDrCapexDetailsVisuals();
        this._renderPadelCapexDetailsVisuals();
        this._renderSharedCapexVisuals();
        this._renderUnitFinancialDetail('drivingRange');
        this._renderUnitFinancialDetail('padel');
        console.log("[sier-visual-finance-details] SEMUA detail finansial (OpEx, CapEx, Analisis) telah dirender.");
    }
};

window.sierVisualFinanceDetails = sierVisualFinanceDetails;