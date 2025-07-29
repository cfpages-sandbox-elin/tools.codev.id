// File: sier-visual-finance-details.js
// Bertanggung jawab untuk merender SEMUA rincian finansial (OpEx, CapEx, Analisis).

const sierVisualFinanceDetails = {
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
                <tr class="bg-teal-100 font-bold text-teal-800"><td class="px-4 py-3 text-base">Laba Bersih (Net Profit)</td><td class="px-4 py-3 text-base font-mono">${sierHelpers.formatNumber(Math.round(pnlData.netProfit))}</td></tr>
            </tbody>
        </table>`;
    },

    _createRevenueBreakdownSection(unitName) {
        const unit = projectConfig[unitName];
        if (!unit) return '';

        const o = unit.operational_assumptions;
        const m = unit.revenue.main_revenue;
        const a = unit.revenue.ancillary_revenue;
        const formatRp = (num) => sierHelpers.formatNumber(Math.round(num));

        let tableRows = '';
        let totalMonthlyRevenue = 0;
        let totalMonthlySessions = 0; // Untuk F&B

        if (unitName === 'drivingRange') {
            const maxSessionsPerBay = o.operational_hours_per_day / (o.avg_session_duration_minutes / 60);
            
            // Hari Kerja
            const sessionsPerBayWD = m.occupancy_rate_per_day.weekday;
            const occupancyRateWD = sessionsPerBayWD / maxSessionsPerBay;
            const totalSessionsWD = m.bays * sessionsPerBayWD;
            const revPerDayWD = totalSessionsWD * m.price_per_100_balls;
            const revPerMonthWD = revPerDayWD * o.workdays_in_month;
            totalMonthlySessions += totalSessionsWD * o.workdays_in_month;

            tableRows += `
                <tr class="hover:bg-gray-50">
                    <td class="p-2">Pendapatan Hari Kerja</td>
                    <td class="p-2 text-xs text-gray-500">(${m.bays} bay × ${maxSessionsPerBay.toFixed(1)} sesi/bay) × <strong>${(occupancyRateWD * 100).toFixed(1)}%</strong> okupansi</td>
                    <td class="p-2 text-right font-mono">${formatRp(revPerDayWD)}</td>
                    <td class="p-2 text-right font-mono">${formatRp(revPerMonthWD)}</td>
                </tr>`;

            // Akhir Pekan
            const sessionsPerBayWE = m.occupancy_rate_per_day.weekend;
            const occupancyRateWE = sessionsPerBayWE / maxSessionsPerBay;
            const totalSessionsWE = m.bays * sessionsPerBayWE;
            const revPerDayWE = totalSessionsWE * m.price_per_100_balls;
            const revPerMonthWE = revPerDayWE * o.weekend_days_in_month;
            totalMonthlySessions += totalSessionsWE * o.weekend_days_in_month;
            
            tableRows += `
                <tr class="hover:bg-gray-50">
                    <td class="p-2">Pendapatan Akhir Pekan</td>
                    <td class="p-2 text-xs text-gray-500">(${m.bays} bay × ${maxSessionsPerBay.toFixed(1)} sesi/bay) × <strong>${(occupancyRateWE * 100).toFixed(1)}%</strong> okupansi</td>
                    <td class="p-2 text-right font-mono">${formatRp(revPerDayWE)}</td>
                    <td class="p-2 text-right font-mono">${formatRp(revPerMonthWE)}</td>
                </tr>`;

            totalMonthlyRevenue = revPerMonthWD + revPerMonthWE;

        } else if (unitName === 'padel') {
            const numCourts = m.courts;

            // Weekday Off-Peak
            const maxHoursWDO = numCourts * m.hours_distribution_per_day.offpeak;
            const actualHoursWDO = maxHoursWDO * m.occupancy_rate.weekday_offpeak;
            const revPerDayWDO = actualHoursWDO * m.price_per_hour.weekday_offpeak;
            const revPerMonthWDO = revPerDayWDO * o.workdays_in_month;
            totalMonthlySessions += actualHoursWDO * o.workdays_in_month;
            tableRows += `
                <tr class="hover:bg-gray-50">
                    <td class="p-2">Sewa Hr Kerja (Off-Peak)</td>
                    <td class="p-2 text-xs text-gray-500">(${numCourts} lpgn × ${m.hours_distribution_per_day.offpeak} jam) × <strong>${(m.occupancy_rate.weekday_offpeak * 100).toFixed(0)}%</strong> okupansi</td>
                    <td class="p-2 text-right font-mono">${formatRp(revPerDayWDO)}</td>
                    <td class="p-2 text-right font-mono">${formatRp(revPerMonthWDO)}</td>
                </tr>`;

            // Weekday Peak
            const maxHoursWDP = numCourts * m.hours_distribution_per_day.peak;
            const actualHoursWDP = maxHoursWDP * m.occupancy_rate.weekday_peak;
            const revPerDayWDP = actualHoursWDP * m.price_per_hour.weekday_peak;
            const revPerMonthWDP = revPerDayWDP * o.workdays_in_month;
            totalMonthlySessions += actualHoursWDP * o.workdays_in_month;
            tableRows += `
                <tr class="hover:bg-gray-50">
                    <td class="p-2">Sewa Hr Kerja (Peak)</td>
                    <td class="p-2 text-xs text-gray-500">(${numCourts} lpgn × ${m.hours_distribution_per_day.peak} jam) × <strong>${(m.occupancy_rate.weekday_peak * 100).toFixed(0)}%</strong> okupansi</td>
                    <td class="p-2 text-right font-mono">${formatRp(revPerDayWDP)}</td>
                    <td class="p-2 text-right font-mono">${formatRp(revPerMonthWDP)}</td>
                </tr>`;

            // Weekend
            const maxHoursWE = numCourts * o.operational_hours_per_day;
            const actualHoursWE = maxHoursWE * m.occupancy_rate.weekend;
            const revPerDayWE = actualHoursWE * m.price_per_hour.weekend;
            const revPerMonthWE = revPerDayWE * o.weekend_days_in_month;
            totalMonthlySessions += actualHoursWE * o.weekend_days_in_month;
            tableRows += `
                <tr class="hover:bg-gray-50">
                    <td class="p-2">Sewa Akhir Pekan</td>
                    <td class="p-2 text-xs text-gray-500">(${numCourts} lpgn × ${o.operational_hours_per_day} jam) × <strong>${(m.occupancy_rate.weekend * 100).toFixed(0)}%</strong> okupansi</td>
                    <td class="p-2 text-right font-mono">${formatRp(revPerDayWE)}</td>
                    <td class="p-2 text-right font-mono">${formatRp(revPerMonthWE)}</td>
                </tr>`;
            
            totalMonthlyRevenue = revPerMonthWDO + revPerMonthWDP + revPerMonthWE;
        }

        // Ancillary Revenue (berlaku untuk keduanya)
        const fnb_rev_month = totalMonthlySessions * a.fnb_avg_spend;
        const pro_shop_rev_month = a.pro_shop_sales;
        totalMonthlyRevenue += fnb_rev_month + pro_shop_rev_month;
        
        const unitLabel = (unitName === 'drivingRange') ? 'sesi' : 'jam';
        tableRows += `
            <tr class="hover:bg-gray-50 bg-gray-50">
                <td class="p-2">Penjualan F&B</td>
                <td class="p-2 text-xs text-gray-500">~${formatRp(totalMonthlySessions)} ${unitLabel}/bulan × Rp ${formatRp(a.fnb_avg_spend)}</td>
                <td class="p-2 text-right font-mono">${formatRp(fnb_rev_month / 30)}</td>
                <td class="p-2 text-right font-mono">${formatRp(fnb_rev_month)}</td>
            </tr>
            <tr class="hover:bg-gray-50 bg-gray-50">
                <td class="p-2">Penjualan Pro Shop</td>
                <td class="p-2 text-xs text-gray-500">Estimasi bulanan</td>
                <td class="p-2 text-right font-mono">${formatRp(pro_shop_rev_month / 30)}</td>
                <td class="p-2 text-right font-mono">${formatRp(pro_shop_rev_month)}</td>
            </tr>`;
        
        return `<div class="mb-8 pb-6 border-b"><h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Rincian Pendapatan</h3><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Sumber Pendapatan</th><th class="p-2 text-left">Detail Perhitungan (Kapasitas × Okupansi)</th><th class="p-2 text-right">Per Hari (Avg)</th><th class="p-2 text-right">Per Bulan</th></tr></thead><tbody class="divide-y">${tableRows}</tbody><tfoot class="bg-gray-200 font-bold"><tr><td class="p-2" colspan="2">Total Estimasi Pendapatan</td><td class="p-2 text-right font-mono">${formatRp(totalMonthlyRevenue / 30)}</td><td class="p-2 text-right font-mono">${formatRp(totalMonthlyRevenue)}</td></tr></tfoot></table></div></div>`;
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

        const createScenarioTable = (capexConfig) => {
            let tableBodyHtml = '';
            let grandTotal = 0;
            const numCourts = capexConfig.num_courts || projectConfig.padel.revenue.main_revenue.courts;

            const addCategoryRow = (title) => { tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">${sierTranslate.translate(title)}</td></tbody><tbody class="divide-y">`; };
            const addItemRow = (label, detail, value) => {
                grandTotal += value;
                tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">${label}</td><td class="px-3 py-2 text-gray-500 text-xs">${detail}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(value))}</td></tr>`;
            };

            const processCategory = (categoryData, categoryName) => {
                addCategoryRow(categoryName);
                for (const key in categoryData) {
                    const item = categoryData[key];
                    if (typeof item === 'object' && item !== null) { // Untuk item dengan sub-properties
                        const itemTotal = item.area_m2 ? item.area_m2 * item.cost_per_m2 : item.lump_sum;
                        const detail = item.area_m2 ? `${item.area_m2} m² @ Rp ${sierHelpers.formatNumber(item.cost_per_m2)}` : 'Lump Sum';
                        addItemRow(sierTranslate.translate(key), detail, itemTotal);
                    } else { // Untuk item flat
                         addItemRow(sierTranslate.translate(key), 'Lump Sum', item);
                    }
                }
            };
            
            if (capexConfig.pre_operational) processCategory(capexConfig.pre_operational, 'pre_operational');
            if (capexConfig.renovation) processCategory(capexConfig.renovation, 'renovation');
            if (capexConfig.demolition_and_construction) processCategory(capexConfig.demolition_and_construction, 'demolition_and_construction');
            if (capexConfig.sport_courts_equipment) {
                 addCategoryRow('sport_courts_equipment');
                 // ... logika untuk sport_courts_equipment tetap sama ...
                let perCourtTotal = sierMath._calculateTotal(capexConfig.sport_courts_equipment.per_court_costs);
                let allCourtsTotal = perCourtTotal * numCourts;
                let inventoryTotal = sierMath._calculateTotal(capexConfig.sport_courts_equipment.initial_inventory);
                grandTotal += allCourtsTotal + inventoryTotal;
                tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">Total Biaya Lapangan</td><td class="px-3 py-2 text-gray-500 text-xs">${numCourts} lapangan</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(allCourtsTotal)}</td></tr>`;
                tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">Inventaris Awal</td><td class="px-3 py-2 text-gray-500 text-xs">Raket & Bola</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(inventoryTotal)}</td></tr>`;
            }
             
            tableBodyHtml += `</tbody>`;
            const subtotal = grandTotal;
            const contingency = subtotal * projectConfig.assumptions.contingency_rate;
            const finalTotal = subtotal + contingency;

            return `<div class="mb-12"><h3 class="text-xl font-semibold mb-2 text-gray-800">${capexConfig.title}</h3><p class="text-gray-600 mb-4 text-sm">${capexConfig.notes}</p><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-200 text-xs uppercase"><tr><th class="p-2 text-left w-1/2">Komponen Biaya</th><th class="p-2 text-left w-1/4">Detail Perhitungan</th><th class="p-2 text-right w-1/4">Estimasi Biaya (Rp)</th></tr></thead>${tableBodyHtml}<tfoot class="font-bold"><tr class="bg-gray-200"><td class="p-3 text-right" colspan="2">Subtotal Biaya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(subtotal))}</td></tr><tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${(projectConfig.assumptions.contingency_rate * 100)}%)</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr><tr class="bg-purple-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(finalTotal))}</td></tr></tfoot></table></div></div>`;
        };

        const scenarioA_Html = createScenarioTable(projectConfig.padel.capex_scenario_a);
        const scenarioB_Html = createScenarioTable(projectConfig.padel.capex_scenario_b);
        const scenarioC_Html = createScenarioTable(projectConfig.padel.capex_scenario_c);


        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Padel</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                ${scenarioA_Html}
                ${scenarioB_Html}
                ${scenarioC_Html}
                 <div class="p-4 bg-purple-50 border-l-4 border-purple-400 text-sm text-purple-800">
                    <strong>Rekomendasi:</strong> <strong>Skenario B (Renovasi Futsal)</strong> adalah yang tercepat dan termurah untuk validasi pasar. <strong>Skenario C (Bangun Ulang Koperasi)</strong> memberikan keseimbangan antara biaya dan kualitas bangunan yang ideal. <strong>Skenario A (4 Lapangan)</strong> adalah target ekspansi jangka panjang jika permintaan terbukti sangat tinggi.
                </div>
            </div>`;
    },

    _renderSharedCapexVisuals() {
        const container = document.getElementById('shared-capex-details-container');
        if (!container) return;
        const sharedCapex = projectConfig.shared_facilities_capex;
        let tableBodyHtml = '', grandTotal = 0;

        for (const categoryKey in sharedCapex) {
            const categoryData = sharedCapex[categoryKey];
            if (typeof categoryData !== 'object' || !categoryData.title) continue;

            let categoryTotal = 0;
            tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">${categoryData.title}</td></tbody>`;
            for (const itemKey in categoryData.items) {
                const item = categoryData.items[itemKey];
                let itemTotal = item.lump_sum ? item.lump_sum : item.quantity * item.unit_cost;
                let detailHtml = item.lump_sum ? 'Lump Sum' : `${item.quantity} ${item.unit} @ Rp ${sierHelpers.formatNumber(item.unit_cost)}`;
                categoryTotal += itemTotal;
                tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">${item.description}</td><td class="px-3 py-2 text-gray-500 text-xs">${detailHtml}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(itemTotal)}</td></tr>`;
            }
            grandTotal += categoryTotal;
            tableBodyHtml += `<tr class="font-semibold bg-gray-100"><td class="px-3 py-2 text-right" colspan="2">Subtotal ${categoryData.title}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(categoryTotal)}</td></tr>`;
        }
        const contingency = grandTotal * projectConfig.assumptions.contingency_rate;
        const finalTotal = grandTotal + contingency;

        container.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-emerald-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Fasilitas Umum</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8"><p class="text-gray-600 mb-6">${sharedCapex.notes}</p><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-200 text-xs uppercase"><tr><th class="p-2 text-left w-2/5">Komponen Biaya</th><th class="p-2 text-left w-2/5">Detail Perhitungan</th><th class="p-2 text-right w-1/5">Biaya (Rp)</th></tr></thead>${tableBodyHtml}<tfoot class="font-bold"><tr class="bg-gray-200"><td class="p-3 text-right" colspan="2">Subtotal</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotal))}</td></tr><tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${(projectConfig.assumptions.contingency_rate * 100)}%)</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr><tr class="bg-emerald-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(finalTotal))}</td></tr></tfoot></table></div></div>`;
    },

    _renderMeetingPointCapexDetailsVisuals() {
        const container = document.getElementById('meeting-point-capex-details-container'); // Anda perlu membuat div ini di HTML
        if (!container) return;
        
        const createScenarioTable = (capexConfig) => {
            // (Fungsi helper createScenarioTable mirip dengan yang di Padel bisa dibuat di sini)
            let tableBodyHtml = '';
            let grandTotal = 0;
            
            const processCategory = (categoryData, categoryName) => {
                tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">${sierTranslate.translate(categoryName)}</td></tbody><tbody class="divide-y">`;
                for (const key in categoryData) {
                    const item = categoryData[key];
                    const itemTotal = item.lump_sum ? item.lump_sum : (item.area_m2 * item.cost_per_m2);
                    const detail = item.lump_sum ? 'Lump Sum' : `${item.area_m2} m² @ Rp ${sierHelpers.formatNumber(item.cost_per_m2)}`;
                    grandTotal += itemTotal;
                    tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">${sierTranslate.translate(key)}</td><td class="px-3 py-2 text-gray-500 text-xs">${detail}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(itemTotal))}</td></tr>`;
                }
                tableBodyHtml += `</tbody>`;
            };

            for(const category in capexConfig) {
                if(typeof capexConfig[category] === 'object' && category !== 'title' && category !== 'notes') {
                    processCategory(capexConfig[category], category);
                }
            }

            const subtotal = grandTotal;
            const contingency = subtotal * projectConfig.assumptions.contingency_rate;
            const finalTotal = subtotal + contingency;

            return `<div class="mb-12"><h3 class="text-xl font-semibold mb-2 text-gray-800">${capexConfig.title}</h3><p class="text-gray-600 mb-4 text-sm">${capexConfig.notes}</p><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-200 text-xs uppercase"><tr><th class="p-2 text-left w-1/2">Komponen Biaya</th><th class="p-2 text-left w-1/4">Detail Perhitungan</th><th class="p-2 text-right w-1/4">Estimasi Biaya (Rp)</th></tr></thead>${tableBodyHtml}<tfoot class="font-bold"><tr class="bg-gray-200"><td class="p-3 text-right" colspan="2">Subtotal Biaya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(subtotal))}</td></tr><tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${(projectConfig.assumptions.contingency_rate * 100)}%)</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr><tr class="bg-cyan-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(finalTotal))}</td></tr></tfoot></table></div></div>`;
        }

        const scenarioA_Html = createScenarioTable(projectConfig.meetingPoint.capex_scenario_a);
        const scenarioB_Html = createScenarioTable(projectConfig.meetingPoint.capex_scenario_b);

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-cyan-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Meeting Point</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                ${scenarioA_Html}
                ${scenarioB_Html}
            </div>`;
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
        
        // Panggil fungsi yang sudah di-refactor
        const revenueHtml = this._createRevenueBreakdownSection(unitName);
        
        const pnlTableHtml = this._createPnlTable(unitCalculations.pnl);
        const bepHtml = this._createBEPSection(strategicAnalysis);
        const profitabilityHtml = this._createProfitabilitySection(strategicAnalysis);
        const scenarioHtml = this._createScenarioSection(strategicAnalysis);

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 ${borderColor} pl-4">${title}</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8 space-y-8">
                ${revenueHtml}
                <h3 class="text-xl font-semibold mb-3 text-gray-800">Proyeksi Laba Rugi (P&L)</h3>
                <div class="overflow-x-auto border rounded-lg">${pnlTableHtml}</div>
                <div class="mt-8 space-y-6">
                    ${bepHtml}
                    ${profitabilityHtml}
                    ${scenarioHtml}
                </div>
            </div>`;
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
        this._renderMeetingPointCapexDetailsVisuals();
        console.log("[sier-visual-finance-details] SEMUA detail finansial (OpEx, CapEx, Analisis) telah dirender.");
    }
};

window.sierVisualFinanceDetails = sierVisualFinanceDetails;