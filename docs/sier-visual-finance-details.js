// File: sier-visual-finance-details.js tambah operasional assumption
// VERSI 3.0 LENGKAP - Menampilkan detail per unit bisnis & rincian asumsi input.

const sierVisualFinanceDetails = {
    _renderUnitSummaries(individualResults) {
        let html = '';
        const titles = {
            dr: 'Driving Range',
            padel4: 'Padel (4 Lapangan)',
            padel2: 'Padel (2 Lapangan)',
            mp: 'Meeting Point',
            shared: 'Fasilitas Umum',
            digital: 'Sistem Digital'
        };

        for (const key in individualResults) {
            const unit = individualResults[key];
            const initialCapex = unit.capexSchedule[0];
            // Hitung rata-rata dari tahun 1-10, abaikan tahun 0
            const avgAnnualRevenue = unit.revenue.length > 1 ? unit.revenue.slice(1).reduce((a, b) => a + b, 0) / 10 : 0;
            const avgAnnualOpex = unit.opex.length > 1 ? unit.opex.slice(1).reduce((a, b) => a + b, 0) / 10 : 0;
            const avgAnnualProfitContribution = avgAnnualRevenue - avgAnnualOpex;

            // Jangan render kartu untuk unit tanpa revenue/opex (misal: digital)
            if (initialCapex === 0 && avgAnnualRevenue === 0) continue;

            html += `
                <div class="bg-white p-4 rounded-lg shadow-md border-l-4 border-gray-400">
                    <h4 class="text-lg font-bold text-gray-800">${titles[key] || key}</h4>
                    <table class="w-full text-sm mt-2">
                        <tbody>
                            <tr><td class="py-1">Investasi Awal (CapEx)</td><td class="py-1 text-right font-mono font-semibold">Rp ${sierHelpers.formatNumber(Math.round(initialCapex))}</td></tr>
                            ${avgAnnualRevenue > 0 ? `
                            <tr><td class="py-1">Rata-rata Pendapatan/Tahun</td><td class="py-1 text-right font-mono">Rp ${sierHelpers.formatNumber(Math.round(avgAnnualRevenue))}</td></tr>
                            <tr><td class="py-1">Rata-rata Biaya/Tahun</td><td class="py-1 text-right font-mono">(${sierHelpers.formatNumber(Math.round(avgAnnualOpex))})</td></tr>
                            <tr class="font-bold border-t"><td class="py-1">Kontribusi Laba Kotor Rata-rata</td><td class="py-1 text-right font-mono text-green-700">Rp ${sierHelpers.formatNumber(Math.round(avgAnnualProfitContribution))}</td></tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            `;
        }

        return `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-gray-500 pl-4">Ringkasan per Komponen Proyek</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">${html}</div>
        `;
    },

    _renderOpexDetailsVisuals(model, scenarioKey) {
        const container = document.getElementById('opex-details-container');
        if (!container) return;

        let tablesHtml = [];

        const createUnitOpexTable = (unitName, title, scenarioKey = null) => {
            const unitConfig = projectConfig[unitName];
            const opexData = scenarioKey ? unitConfig.scenarios[scenarioKey].opexMonthly : unitConfig.opexMonthly;
            if (!opexData) return ''; // Lewati jika tidak ada data opex

            let grandTotalOpex = 0;
            const staffData = opexData.salaries_wages;
            let staffTableRows = '', totalStaffCost = 0;
            for (const role in staffData) {
                const roleData = staffData[role];
                const totalRoleCost = roleData.count * roleData.salary;
                totalStaffCost += totalRoleCost;
                staffTableRows += `<tr><td class="px-3 py-2">${sierTranslate.translate(role)}</td><td class="px-3 py-2 text-center">${roleData.count}</td><td class="px-3 py-2 text-right">${sierHelpers.formatNumber(roleData.salary)}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalRoleCost))}</td></tr>`;
            }
            grandTotalOpex += totalStaffCost;
            const staffTableHtml = `<h4 class="font-semibold text-gray-800 mb-2">1. Gaji & Upah (SDM)</h4><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Posisi</th><th class="p-2 text-center">Jumlah</th><th class="p-2 text-right">Gaji/Bulan</th><th class="p-2 text-right">Total</th></tr></thead><tbody class="divide-y">${staffTableRows}</tbody><tfoot class="font-bold bg-gray-100"><tr><td colspan="3" class="p-2 text-right">Subtotal</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalStaffCost))}</td></tr></tfoot></table></div>`;

            const utilData = opexData.utilities;
            let totalUtilCost = (utilData.electricity_kwh_price * utilData.electricity_kwh_usage) + utilData.water_etc;
            grandTotalOpex += totalUtilCost;
            const utilTableHtml = `<h4 class="font-semibold text-gray-800 mt-6 mb-2">2. Utilitas</h4><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Komponen</th><th class="p-2 text-right">Asumsi</th><th class="p-2 text-right">Total</th></tr></thead><tbody class="divide-y"><tr><td class="p-2">Listrik</td><td class="p-2 text-right">${utilData.electricity_kwh_usage} kWh @ ...</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(utilData.electricity_kwh_price * utilData.electricity_kwh_usage))}</td></tr><tr><td class="p-2">Air & Lainnya</td><td class="p-2 text-right">Lump Sum</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(utilData.water_etc)}</td></tr></tbody><tfoot class="font-bold bg-gray-100"><tr><td colspan="2" class="p-2 text-right">Subtotal</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalUtilCost))}</td></tr></tfoot></table></div>`;

            const otherDataKeys = ['marketing_promotion', 'maintenance_repair', 'other_operational'];
            let otherTableRows = '', totalOtherCost = 0;
            otherDataKeys.forEach(key => { const cost = opexData[key]; if (cost !== undefined) { totalOtherCost += cost; otherTableRows += `<tr><td class="p-2">${sierTranslate.translate(key)}</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(cost)}</td></tr>`; } });
            grandTotalOpex += totalOtherCost;
            const otherTableHtml = `<h4 class="font-semibold text-gray-800 mt-6 mb-2">3. Biaya Operasional Lainnya</h4><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Kategori</th><th class="p-2 text-right">Biaya/Bulan</th></tr></thead><tbody class="divide-y">${otherTableRows}</tbody><tfoot class="font-bold bg-gray-100"><tr><td class="p-2 text-right">Subtotal</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalOtherCost))}</td></tr></tfoot></table></div>`;

            return `<div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-bold mb-4 text-center">${title}</h3>
                        ${staffTableHtml}${utilTableHtml}${otherTableHtml}
                        <div class="mt-6 bg-gray-200 text-gray-800 font-bold p-3 rounded-lg flex justify-between items-center text-lg">
                            <span>Total OpEx Bulanan (Basis)</span>
                            <span class="font-mono">Rp ${sierHelpers.formatNumber(Math.round(grandTotalOpex))}</span>
                        </div>
                    </div>`;
        };
        
        // Logika Kondisional: Tampilkan tabel OpEx hanya untuk unit yang ada di skenario
        if (scenarioKey.includes('dr')) tablesHtml.push(createUnitOpexTable('drivingRange', 'Driving Range'));
        if (scenarioKey.includes('padel4')) tablesHtml.push(createUnitOpexTable('padel', 'Padel (4 Lapangan)', 'four_courts_combined'));
        if (scenarioKey.includes('padel2')) tablesHtml.push(createUnitOpexTable('padel', 'Padel (2 Lapangan)', 'two_courts_futsal_renovation'));
        if (scenarioKey.includes('mp')) tablesHtml.push(createUnitOpexTable('meetingPoint', 'Meeting Point'));

        if (tablesHtml.length > 0) {
             container.innerHTML = `
                <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-amber-500 pl-4">Rincian Estimasi Biaya Operasional (OpEx) Bulanan</h2>
                <div class="grid grid-cols-1 ${tablesHtml.length > 1 ? 'lg:grid-cols-2' : ''} gap-8">${tablesHtml.join('')}</div>`;
        } else {
            container.innerHTML = '';
        }
    },

    _createOperationalAssumptionsCard(config, title, basePath, colorClass = 'gray') {
        let rowsHtml = '';
        const opAssumptions = config.operational_assumptions || {};
        const revAssumptions = config.revenue || {};

        const processObject = (obj, pathPrefix, level = 0) => {
            let html = '';
            for (const key in obj) {
                const value = obj[key];
                const fullPath = `${pathPrefix}.${key}`;
                const label = sierTranslate.translate(key);
                
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Render sebagai sub-header jika objek bersarang
                    html += `<tr><td colspan="2" class="pt-3 pb-1 font-semibold text-${colorClass}-700">${label}</td></tr>`;
                    html += processObject(value, fullPath, level + 1);
                } else if (typeof value === 'number') {
                    // Render sebagai baris biasa yang bisa diedit
                    const isPercent = key.includes('_rate') || key.includes('_portion');
                    html += `
                        <tr>
                            <td class="py-1 pl-4 text-gray-600">${label}</td>
                            <td class="py-1 text-right">
                                ${sierEditable.createEditableNumber(value, fullPath, { format: isPercent ? 'percent' : '' })}
                            </td>
                        </tr>
                    `;
                }
            }
            return html;
        };

        rowsHtml += processObject(opAssumptions, `${basePath}.operational_assumptions`);
        rowsHtml += processObject(revAssumptions, `${basePath}.revenue`);

        return `
            <div class="bg-${colorClass}-50 p-4 rounded-lg border border-${colorClass}-200">
                <h4 class="font-bold text-lg text-${colorClass}-800 mb-2">${title}</h4>
                <table class="w-full text-sm">
                    <tbody class="divide-y divide-${colorClass}-200">${rowsHtml}</tbody>
                </table>
            </div>
        `;
    },

    _renderAssumptionsVisuals(scenarioKey) {
        const container = document.getElementById('assumptions-container');
        if (!container) return;

        const { assumptions } = projectConfig;

        const createItemHtml = (label, value, path, description = '', isPercent = false) => {
            const contentHtml = sierEditable.createEditableNumber(value, path, { format: isPercent ? 'percent' : '' });
            return `<div class="grid grid-cols-1 md:grid-cols-2 items-center gap-x-4 gap-y-1 py-4 border-b last:border-b-0">
                        <div>
                            <h4 class="font-semibold text-gray-800">${label}</h4>
                            ${description ? `<p class="text-xs text-gray-500 mt-1">${description}</p>` : ''}
                        </div>
                        <div class="md:text-right">${contentHtml}</div>
                    </div>`;
        };
        
        const financingHtml = Object.keys(assumptions.financing).map(key => {
            return createItemHtml(
                sierTranslate.translate(key),
                assumptions.financing[key],
                `assumptions.financing.${key}`,
                '', true
            );
        }).join('');

        const escalationHtml = Object.keys(assumptions.escalation).map(key => {
            const isRate = key.includes('rate');
            return createItemHtml(
                sierTranslate.translate(key),
                assumptions.escalation[key],
                `assumptions.escalation.${key}`,
                '', isRate
            );
        }).join('');

        const globalAssumptionsHtml = `
            <div class="space-y-6">
                <div class="bg-gray-50 p-4 rounded-lg border">
                    <h3 class="font-bold text-lg text-gray-700 mb-2">Asumsi Umum & Pajak</h3>
                    ${createItemHtml('Pajak Penghasilan Badan', assumptions.tax_rate_profit, 'assumptions.tax_rate_profit', '', true)}
                    ${createItemHtml('Tingkat Diskonto (WACC)', assumptions.discount_rate_wacc, 'assumptions.discount_rate_wacc', '', true)}
                    ${createItemHtml('Dana Kontingensi', assumptions.contingency_rate, 'assumptions.contingency_rate', '', true)}
                </div>
                <div class="bg-gray-50 p-4 rounded-lg border">
                    <h3 class="font-bold text-lg text-gray-700 mb-2">Asumsi Pendanaan</h3>
                    <!-- Konten ini akan otomatis diperbarui oleh dropdown -->
                    <p class="text-center p-4 text-gray-500 italic">Pilih skenario pendanaan dari dropdown di atas.</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg border">
                    <h3 class="font-bold text-lg text-gray-700 mb-2">Asumsi Peningkatan (Eskalasi)</h3>
                    ${escalationHtml}
                </div>
            </div>`;

        // --- 2. Render Asumsi Operasional (DINAMIS SESUAI SKENARIO) ---
        let operationalAssumptionsHtml = '<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-amber-500 pl-4 mt-12">Asumsi Operasional (Sesuai Skenario Proyek)</h2><div class="grid grid-cols-1 lg:grid-cols-2 gap-6">';
        
        if (scenarioKey.includes('dr')) {
            operationalAssumptionsHtml += this._createOperationalAssumptionsCard(projectConfig.drivingRange, 'Driving Range', 'drivingRange', 'blue');
        }
        if (scenarioKey.includes('padel4')) {
            operationalAssumptionsHtml += this._createOperationalAssumptionsCard(projectConfig.padel.scenarios.four_courts_combined, 'Padel (4 Lapangan)', 'padel.scenarios.four_courts_combined', 'purple');
        }
        if (scenarioKey.includes('padel2')) {
             operationalAssumptionsHtml += this._createOperationalAssumptionsCard(projectConfig.padel.scenarios.two_courts_futsal_renovation, 'Padel (2 Lapangan)', 'padel.scenarios.two_courts_futsal_renovation', 'purple');
        }
        if (scenarioKey.includes('mp')) {
            operationalAssumptionsHtml += this._createOperationalAssumptionsCard(projectConfig.meetingPoint, 'Meeting Point', 'meetingPoint', 'cyan');
        }
        operationalAssumptionsHtml += '</div>';

        // Gabungkan semuanya
        container.innerHTML = globalAssumptionsHtml + operationalAssumptionsHtml;
    },

    _renderDrCapexDetailsVisuals() {
        const container = document.getElementById('driving-range-capex-details-container');
        if (!container) return;
        const results = sierMathFinance._calculateDrCapex();
        if (!results) return;
        const { equipment_detail, scenario_a, scenario_b } = results;
        const createRow = (item) => `<tr><td class="p-2">${item.category}</td><td class="p-2">${item.component}</td><td class="p-2 text-xs text-gray-500">${item.calculation}</td><td class="p-2 text-right font-mono">${sierEditable.createEditableNumber(sierMathFinance.getValueByPath(projectConfig, item.path), item.path, {format: 'currency'})}</td></tr>`;
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

        // DEFINISIKAN FUNGSI HELPER DI DALAM SCOPE INI
        const createScenarioTable = (scenarioConfig) => {
            if (!scenarioConfig || !scenarioConfig.capex) {
                return '<p>Data konfigurasi skenario Padel tidak valid.</p>';
            }

            const capexData = scenarioConfig.capex; // Ambil data CapEx yang benar
            let tableBodyHtml = '';
            let grandTotal = 0;
            const numCourts = scenarioConfig.num_courts; // Ambil num_courts dari level yang benar

            const processCategory = (categoryData, categoryName) => {
                tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">${sierTranslate.translate(categoryName)}</td></tbody><tbody class="divide-y">`;
                for (const key in categoryData) {
                    const item = categoryData[key];
                    if (typeof item === 'object' && item !== null) {
                        const itemTotal = item.area_m2 ? item.area_m2 * item.cost_per_m2 : item.lump_sum;
                        const detail = item.area_m2 ? `${item.area_m2} m² @ Rp ${sierHelpers.formatNumber(item.cost_per_m2)}` : 'Lump Sum';
                        grandTotal += itemTotal;
                        tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">${sierTranslate.translate(key)}</td><td class="px-3 py-2 text-gray-500 text-xs">${detail}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(itemTotal))}</td></tr>`;
                    } else if (typeof item === 'number') {
                        grandTotal += item;
                        tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">${sierTranslate.translate(key)}</td><td class="px-3 py-2 text-gray-500 text-xs">Lump Sum</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(item))}</td></tr>`;
                    }
                }
                tableBodyHtml += `</tbody>`;
            };

            for (const category in capexData) {
                if (typeof capexData[category] === 'object' && category !== 'title' && category !== 'notes') {
                    if (category === 'sport_courts_equipment') {
                        tableBodyHtml += `<tbody class="bg-gray-50"><td colspan="3" class="p-3 font-bold text-gray-800">${sierTranslate.translate(category)}</td></tbody><tbody class="divide-y">`;
                        let perCourtTotal = sierMathFinance._calculateTotal(capexData.sport_courts_equipment.per_court_costs);
                        let allCourtsTotal = perCourtTotal * numCourts;
                        let inventoryTotal = sierMathFinance._calculateTotal(capexData.sport_courts_equipment.initial_inventory);
                        grandTotal += allCourtsTotal + inventoryTotal;
                        tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">Total Biaya Lapangan</td><td class="px-3 py-2 text-gray-500 text-xs">${numCourts} lapangan</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(allCourtsTotal)}</td></tr>`;
                        tableBodyHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">Inventaris Awal</td><td class="px-3 py-2 text-gray-500 text-xs">Raket & Bola</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(inventoryTotal)}</td></tr>`;
                        tableBodyHtml += `</tbody>`;
                    } else {
                        processCategory(capexData[category], category);
                    }
                }
            }

            const subtotal = grandTotal;
            const contingency = subtotal * projectConfig.assumptions.contingency_rate;
            const finalTotal = subtotal + contingency;

            return `<div class="mb-12"><h3 class="text-xl font-semibold mb-2 text-gray-800">${scenarioConfig.title}</h3><p class="text-gray-600 mb-4 text-sm">${scenarioConfig.description}</p><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-200 text-xs uppercase"><tr><th class="p-2 text-left w-1/2">Komponen Biaya</th><th class="p-2 text-left w-1/4">Detail Perhitungan</th><th class="p-2 text-right w-1/4">Estimasi Biaya (Rp)</th></tr></thead>${tableBodyHtml}<tfoot class="font-bold"><tr class="bg-gray-200"><td class="p-3 text-right" colspan="2">Subtotal Biaya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(subtotal))}</td></tr><tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${(projectConfig.assumptions.contingency_rate * 100)}%)</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr><tr class="bg-purple-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(finalTotal))}</td></tr></tfoot></table></div></div>`;
        };

        // PANGGIL FUNGSI HELPER YANG SUDAH DIDEFINISIKAN DI ATAS
        const scenarioTwoCourtsHtml = createScenarioTable(projectConfig.padel.scenarios.two_courts_futsal_renovation);
        const scenarioFourCourtsHtml = createScenarioTable(projectConfig.padel.scenarios.four_courts_combined);

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Padel</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                ${scenarioTwoCourtsHtml}
                ${scenarioFourCourtsHtml}
                <div class="p-4 bg-purple-50 border-l-4 border-purple-400 text-sm text-purple-800">
                    <strong>Rekomendasi:</strong> <strong>Skenario 1 (2 Lapangan Renovasi)</strong> adalah yang tercepat dan termurah untuk validasi pasar. <strong>Skenario 2 (4 Lapangan Kombinasi)</strong> adalah target ekspansi jangka panjang jika permintaan terbukti sangat tinggi.
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

    _renderInputAssumptionDetails(model, scenarioKey) {
        const clearContainer = (id) => { const el = document.getElementById(id); if (el) el.innerHTML = ''; };
        clearContainer('opex-details-container');
        clearContainer('driving-range-capex-details-container');
        clearContainer('padel-capex-details-container');
        clearContainer('shared-capex-details-container');
        clearContainer('meeting-point-capex-details-container');

        this._renderOpexDetailsVisuals(model, scenarioKey);
        if (scenarioKey.includes('dr')) this._renderDrCapexDetailsVisuals();
        if (scenarioKey.includes('padel')) this._renderPadelCapexDetailsVisuals();
        if (scenarioKey.includes('mp')) this._renderMeetingPointCapexDetailsVisuals();
        if (scenarioKey !== 'padel2_mp') this._renderSharedCapexVisuals();
    },

    render(model, scenarioKey) {
        const unitSummariesHtml = this._renderUnitSummaries(model.individual);
        const assumptionsContainer = document.getElementById('financial-assumptions');
        if (assumptionsContainer) {
            let summaryDiv = document.getElementById('unit-summaries-section');
            if (!summaryDiv) {
                summaryDiv = document.createElement('div');
                summaryDiv.id = 'unit-summaries-section';
                assumptionsContainer.parentNode.insertBefore(summaryDiv, assumptionsContainer);
            }
            summaryDiv.innerHTML = unitSummariesHtml;
        }

        this._renderAssumptionsVisuals(scenarioKey);
        this._renderInputAssumptionDetails(model, scenarioKey);
        console.log("[sier-visual-finance-details] Rincian per unit dan semua asumsi input telah dirender.");
    }
};

window.sierVisualFinanceDetails = sierVisualFinanceDetails;