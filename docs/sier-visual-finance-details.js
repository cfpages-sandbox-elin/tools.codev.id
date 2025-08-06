// File: sier-visual-finance-details.js bikin komplit skenario
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
                <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                    ${sierVisualFinanceNarration.getOpexNarration()}
                    <div class="grid grid-cols-1 ${tablesHtml.length > 1 ? 'lg:grid-cols-2' : ''} gap-8">${tablesHtml.join('')}</div>
                </div>`;
        } else {
            container.innerHTML = '';
        }
    },

    _createOperationalAssumptionsCard(config, title, basePath, colorClass = 'gray') {
        let rowsHtml = '';
        
        const processObject = (obj, pathPrefix) => {
            let html = '';
            for (const key in obj) {
                const value = obj[key];
                const fullPath = `${pathPrefix}.${key}`;
                const label = sierHelpers.safeTranslate(key);
                
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    html += `<tr><td colspan="2" class="pt-3 pb-1 font-semibold text-${colorClass}-700">${label}</td></tr>`;
                    html += processObject(value, fullPath);
                } else if (typeof value === 'number') {
                    // --- PERBAIKAN BUG PERSENTASE DI SINI ---
                    // Angka hanya dianggap persen jika mengandung '_rate' ATAU '_portion' DAN nilainya di bawah 1.
                    const isPercent = (key.includes('_rate') || key.includes('_portion')) && value < 1;
                    const formatOptions = isPercent ? { format: 'percent' } : (value >= 1000 ? { format: 'currency' } : {});

                    html += `<tr><td class="py-1 pl-4 text-gray-600">${label}</td><td class="py-1 text-right">${sierEditable.createEditableNumber(value, fullPath, formatOptions)}</td></tr>`;
                }
            }
            return html;
        };

        rowsHtml += processObject(config, basePath);

        return `<div class="bg-${colorClass}-50 p-4 rounded-lg border border-${colorClass}-200"><h4 class="font-bold text-lg text-${colorClass}-800 mb-2">${config.title || title}</h4><table class="w-full text-sm"><tbody class="divide-y divide-${colorClass}-200">${rowsHtml}</tbody></table></div>`;
    },

    _renderAssumptionsVisuals(scenarioKey) {
        const container = document.getElementById('assumptions-container');
        if (!container) return;

        const { assumptions } = projectConfig;

        const createItemHtml = (label, value, path, description = '', isPercent = false) => {
            const contentHtml = sierEditable.createEditableNumber(value, path, { format: isPercent ? 'percent' : '' });
            return `<div class="grid grid-cols-1 md:grid-cols-2 items-center gap-x-4 gap-y-1 py-2 border-b last:border-b-0"><div class="flex flex-col"><span>${label}</span>${description ? `<em class="text-xs text-gray-400">${description}</em>` : ''}</div><div class="md:text-right">${contentHtml}</div></div>`;
        };
        
        const financingHtml = Object.keys(assumptions.financing).map(key => {
            if (key === 'title') return ''; // Jangan tampilkan judul
            const isRateOrPortion = key.includes('rate') || key.includes('portion');
            return createItemHtml(
                sierTranslate.translate(key),
                assumptions.financing[key],
                `assumptions.financing.${key}`,
                '',
                isRateOrPortion
            );
        }).join('');

        const escalationHtml = Object.keys(assumptions.escalation).map(key => {
            const isRate = key.includes('rate');
            return createItemHtml(sierTranslate.translate(key), assumptions.escalation[key], `assumptions.escalation.${key}`, '', isRate);
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
                    <!-- GANTI PLACEHOLDER DENGAN KONTEN DINAMIS -->
                    ${financingHtml}
                </div>
                <div class="bg-gray-50 p-4 rounded-lg border">
                    <h3 class="font-bold text-lg text-gray-700 mb-2">Asumsi Peningkatan (Eskalasi)</h3>
                    ${escalationHtml}
                </div>
            </div>`;

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
        if (projectConfig.shared_revenue) {
            operationalAssumptionsHtml += this._createOperationalAssumptionsCard(projectConfig.shared_revenue, 'Pendapatan Bersama', 'shared_revenue', 'green');
        }

        operationalAssumptionsHtml += '</div>';
        container.innerHTML = globalAssumptionsHtml + operationalAssumptionsHtml;
    },

    _renderDrCapexDetailsVisuals() {
        const container = document.getElementById('driving-range-capex-details-container');
        if (!container) return;

        const a = projectConfig.drivingRange.capex_assumptions;
        const site = projectConfig.site_parameters.driving_range;
        const global = projectConfig.assumptions;
        const total_bays = Math.floor(site.building_length_m / site.bay_width_m) * site.levels;

        let tableBodyHtml = '';
        let grandSubtotal = 0;

        const createSection = (title, items) => {
            let sectionHtml = `<tbody class="bg-gray-100"><td colspan="3" class="p-3 font-bold text-gray-800">${title}</td></tbody>`;
            let sectionSubtotal = 0;
            items.forEach(item => {
                const itemCost = item.cost || 0;
                if (itemCost > 0) {
                    sectionSubtotal += itemCost;
                    sectionHtml += `<tr class="hover:bg-gray-50"><td class="px-3 py-2 pl-8">${item.label}</td><td class="px-3 py-2 text-gray-600 text-xs">${item.detail}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(itemCost))}</td></tr>`;
                }
            });
            if (sectionSubtotal > 0) {
                sectionHtml += `<tr class="font-semibold bg-gray-200"><td class="px-3 py-2 text-right" colspan="2">Subtotal ${title}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(sectionSubtotal))}</td></tr>`;
                grandSubtotal += sectionSubtotal;
                return sectionHtml;
            }
            return '';
        };

        // --- Definisikan dan render setiap seksi secara berurutan ---

        const pil = a.piling;
        tableBodyHtml += createSection('1. Pekerjaan Sipil & Pondasi', [
            { label: 'Pondasi Tiang Pancang', detail: `${pil.points_count} titik × ${pil.length_per_point_m}m @ Rp ${sierHelpers.formatNumber(pil.cost_per_m_mini_pile)}/m + Pile Cap`, cost: (pil.points_count * pil.length_per_point_m * pil.cost_per_m_mini_pile) + pil.lump_sum_pile_cap }
        ]);

        const bld = a.building;
        const bayLength = bld.dr_bays_length_m;
        const bayWidth = bld.dr_bays_width_m;
        const bayArea = bayLength * bayWidth;
        tableBodyHtml += createSection('2. Konstruksi Bangunan', [
            { label: 'Struktur Bay Driving Range', detail: `(${bayLength}m × ${bayWidth}m) = ${bayArea} m² × Rp ${sierHelpers.formatNumber(bld.dr_bays_cost_per_m2)}/m²`, cost: bayArea * bld.dr_bays_cost_per_m2 }
        ]);
        
        const eq = a.equipment;
        const premium_bays_count = Math.round(total_bays * eq.premium_bays.percentage_of_total);
        const normal_bays_count = total_bays - premium_bays_count;
        tableBodyHtml += createSection('3. Peralatan & Teknologi Inti', [
            { label: 'Sistem Ball Tracker', detail: `${premium_bays_count} bay × Rp ${sierHelpers.formatNumber(eq.premium_bays.cost_per_bay_ball_tracker)}/bay`, cost: premium_bays_count * eq.premium_bays.cost_per_bay_ball_tracker },
            { label: 'Dispenser Bola Otomatis', detail: `${premium_bays_count} bay × Rp ${sierHelpers.formatNumber(eq.premium_bays.cost_per_bay_dispenser)}/bay`, cost: premium_bays_count * eq.premium_bays.cost_per_bay_dispenser },
            { label: 'Peralatan Bay Normal', detail: `${normal_bays_count} bay × Rp ${sierHelpers.formatNumber(eq.normal_bays.bay_equipment_cost_per_set)}/set`, cost: normal_bays_count * eq.normal_bays.bay_equipment_cost_per_set },
            { label: 'Bola Apung (Floating Balls)', detail: `${sierHelpers.formatNumber(eq.floating_balls_count)} buah × Rp ${sierHelpers.formatNumber(eq.floating_balls_cost_per_ball)}/bola`, cost: eq.floating_balls_count * eq.floating_balls_cost_per_ball },
            { label: 'Sistem Manajemen Bola', detail: 'Lump Sum', cost: eq.ball_management_system_lump_sum }
        ]);

        const net = a.safety_net;
        const polesCount = Math.ceil(net.total_perimeter_m / net.poles.spacing_m);
        const netArea = (site.field_length_m * net.poles.height_distribution.left_right_side_m * 2) + (net.field_width_m * net.poles.height_distribution.far_side_m);
        tableBodyHtml += createSection('4. Jaring Pengaman (Safety Net)', [
            { label: 'Pondasi & Tiang Penyangga', detail: `${polesCount} tiang × Rp ${sierHelpers.formatNumber(net.poles.foundation_cost_per_pole)}/tiang`, cost: polesCount * net.poles.foundation_cost_per_pole },
            { label: 'Material Jaring', detail: `Estimasi ${sierHelpers.formatNumber(netArea)} m² × Rp ${sierHelpers.formatNumber(net.netting.cost_per_m2)}/m²`, cost: netArea * net.netting.cost_per_m2 }
        ]);
        
        const san = a.plumbing_and_sanitary;
        tableBodyHtml += createSection('5. Interior, Furnitur & Sanitasi', [
            { label: 'Furnitur Bay & Loker', detail: `${total_bays} bay × Rp ${sierHelpers.formatNumber(a.bay_furniture.cost_per_bay)}/bay`, cost: total_bays * a.bay_furniture.cost_per_bay },
            { label: 'Unit Sanitasi (Toilet, Wastafel)', detail: 'Jumlah unit × harga satuan', cost: (san.male_toilet.toilets + san.female_toilet.toilets) * san.unit_costs.toilet_bowl + san.male_toilet.urinals * san.unit_costs.urinal + (san.male_toilet.sinks + san.female_toilet.sinks) * san.unit_costs.sink }
        ]);
        
        const mep = a.mep_systems;
        const electricalCost = grandSubtotal * mep.electrical_system.rate_of_physical_cost;
        const permitCost = grandSubtotal * a.other_costs.permit_design_rate_of_physical_cost;
        
        tableBodyHtml += createSection('6. Sistem MEP & Biaya Lain-lain', [
            { label: 'Sistem Plumbing', detail: 'Lump Sum', cost: mep.plumbing_system.lump_sum_cost },
            { label: 'Sistem Elektrikal', detail: `${(mep.electrical_system.rate_of_physical_cost * 100)}% dari Subtotal Fisik`, cost: electricalCost },
            { label: 'Izin & Konsultan Desain', detail: `${(a.other_costs.permit_design_rate_of_physical_cost * 100)}% dari Subtotal Fisik`, cost: permitCost }
        ]);

        const contingency = grandSubtotal * global.contingency_rate;
        const grandTotal = grandSubtotal + contingency;

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-blue-500 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Driving Range</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                ${sierVisualFinanceNarration.getDrCapexNarration()}
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-200 text-xs uppercase">
                            <tr><th class="p-2 text-left w-1/3">Komponen Biaya</th><th class="p-2 text-left w-1/2">Detail Perhitungan</th><th class="p-2 text-right w-1/6">Estimasi Biaya (Rp)</th></tr>
                        </thead>
                        <tbody class="divide-y">${tableBodyHtml}</tbody>
                        <tfoot class="font-bold">
                            <tr class="bg-gray-300"><td class="p-3 text-right" colspan="2">Total Subtotal Biaya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandSubtotal))}</td></tr>
                            <tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${(global.contingency_rate * 100)}%)</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr>
                            <tr class="bg-blue-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotal))}</td></tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    },

    _renderPadelCapexDetailsVisuals(scenarioKey) {
        const container = document.getElementById('padel-capex-details-container');
        if (!container) return;

        const padelScenarioKey = scenarioKey.includes('padel4') ? 'four_courts_combined' : 'two_courts_futsal_renovation';
        const scenarioConfig = projectConfig.padel.scenarios[padelScenarioKey];
        if (!scenarioConfig) return;

        let tableBodyHtml = '';
        let grandSubtotal = 0;

        const createSection = (title, items) => {
            let sectionHtml = `<tbody class="bg-gray-100"><td colspan="3" class="p-3 font-bold text-gray-800">${title}</td></tbody>`;
            let sectionSubtotal = 0;
            items.forEach(item => {
                const itemCost = item.cost || 0;
                if (itemCost > 0) { // Hanya tampilkan baris yang ada biayanya
                    sectionSubtotal += itemCost;
                    sectionHtml += `<tr class="hover:bg-gray-50"><td class="px-3 py-2 pl-8">${item.label}</td><td class="px-3 py-2 text-gray-600 text-xs">${item.detail}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(itemCost))}</td></tr>`;
                }
            });
            if (sectionSubtotal > 0) {
                sectionHtml += `<tr class="font-semibold bg-gray-200"><td class="px-3 py-2 text-right" colspan="2">Subtotal ${title}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(sectionSubtotal))}</td></tr>`;
                grandSubtotal += sectionSubtotal;
                return sectionHtml;
            }
            return ''; // Jangan render seksi jika kosong
        };

        const capex = scenarioConfig.capex;
        
        tableBodyHtml += createSection('1. Biaya Pra-Operasional & Umum', [
            { label: 'Izin & Konsultan', detail: 'Lump Sum', cost: capex.pre_operational.permits_and_consulting },
            { label: 'Pemasaran Awal', detail: 'Lump Sum', cost: capex.pre_operational.initial_marketing },
            { label: 'Mobilisasi Alat & Tim', detail: 'Lump Sum', cost: capex.pre_operational.mobilization },
            { label: 'Biaya Umum Proyek', detail: 'Lump Sum', cost: capex.pre_operational.construction_overhead },
            { label: 'Tenaga Kerja & Alat Bantu Umum', detail: 'Lump Sum', cost: capex.pre_operational.general_labor_tools }
        ]);

        let section2Html = `<tbody class="bg-gray-100"><td colspan="3" class="p-3 font-bold text-gray-800">2. Pekerjaan Konstruksi & Sipil</td></tbody>`;
        let section2GrandSubtotal = 0;

        // Hanya render bagian ini jika ada data renovasi
        const renovation = capex.component_futsal_renovation || {};
        if (Object.keys(renovation).length > 0) {
            let renovationSubtotal = 0;
            section2Html += `<tr class="bg-gray-50 font-semibold"><td class="px-3 py-2 pl-8" colspan="3">2.1 Pekerjaan Renovasi (Area Futsal)</td></tr>`;
            
            const renovationItems = [
                { label: 'Pembongkaran & Pembersihan Lahan', detail: 'Lump Sum', cost: renovation.minor_demolition_and_clearing?.lump_sum },
                { label: 'Renovasi Toilet', detail: 'Lump Sum', cost: renovation.toilet_demolition_and_relocation?.lump_sum },
                { label: 'Perbaikan & Leveling Lantai', detail: `${renovation.floor_repair_and_leveling?.area_m2 || 0} m² @ Rp ${sierHelpers.formatNumber(renovation.floor_repair_and_leveling?.cost_per_m2 || 0)}`, cost: (renovation.floor_repair_and_leveling?.area_m2 || 0) * (renovation.floor_repair_and_leveling?.cost_per_m2 || 0) },
                { label: 'Kipas Industri / Exhaust', detail: `${renovation.industrial_fans?.quantity || 0} unit @ Rp ${sierHelpers.formatNumber(renovation.industrial_fans?.unit_cost || 0)}`, cost: (renovation.industrial_fans?.quantity || 0) * (renovation.industrial_fans?.unit_cost || 0) }
            ];

            renovationItems.forEach(item => {
                if (item.cost) {
                    renovationSubtotal += item.cost;
                    section2Html += `<tr class="hover:bg-gray-50"><td class="px-3 py-2 pl-12">${item.label}</td><td class="px-3 py-2 text-gray-500 text-xs">${item.detail}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(item.cost))}</td></tr>`;
                }
            });
            section2Html += `<tr class="font-semibold bg-gray-100"><td class="px-3 py-2 text-right" colspan="2">Subtotal Renovasi</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(renovationSubtotal))}</td></tr>`;
            section2GrandSubtotal += renovationSubtotal;
        }

        // Hanya render bagian ini jika ada data bangun baru (untuk skenario 4 lapangan)
        const newBuild = capex.component_koperasi_new_build || {};
        if (Object.keys(newBuild).length > 0) {
            let newBuildSubtotal = 0;
            section2Html += `<tr class="bg-gray-50 font-semibold"><td class="px-3 py-2 pl-8" colspan="3">2.2 Pekerjaan Bangun Baru (Area Koperasi)</td></tr>`;
            
            const sanitaryNew = newBuild.plumbing_and_sanitary || {};
            const newBuildItems = [
                { label: 'Pembongkaran Gedung Koperasi', detail: `${newBuild.building_demolition?.area_m2 || 0} m² @ Rp ${sierHelpers.formatNumber(newBuild.building_demolition?.cost_per_m2 || 0)}`, cost: (newBuild.building_demolition?.area_m2 || 0) * (newBuild.building_demolition?.cost_per_m2 || 0) },
                { label: 'Pondasi Bangunan Baru', detail: `${newBuild.land_preparation_and_foundation?.area_m2 || 0} m² @ Rp ${sierHelpers.formatNumber(newBuild.land_preparation_and_foundation?.cost_per_m2 || 0)}`, cost: (newBuild.land_preparation_and_foundation?.area_m2 || 0) * (newBuild.land_preparation_and_foundation?.cost_per_m2 || 0) },
                { label: 'Struktur Bangunan Baru', detail: `${newBuild.building_structure_2_courts?.area_m2 || 0} m² @ Rp ${sierHelpers.formatNumber(newBuild.building_structure_2_courts?.cost_per_m2 || 0)}`, cost: (newBuild.building_structure_2_courts?.area_m2 || 0) * (newBuild.building_structure_2_courts?.cost_per_m2 || 0) },
                { label: 'Pembangunan Toilet Baru', detail: `${sanitaryNew.toilet_unit || 0} unit`, cost: (sanitaryNew.toilet_unit || 0) * (sanitaryNew.area_m2_per_toilet || 0) * (sanitaryNew.cost_per_m2 || 0)},
                { label: 'Kipas Industri / Exhaust', detail: `${newBuild.industrial_fans?.quantity || 0} unit @ Rp ${sierHelpers.formatNumber(newBuild.industrial_fans?.unit_cost || 0)}`, cost: (newBuild.industrial_fans?.quantity || 0) * (newBuild.industrial_fans?.unit_cost || 0) }
            ];

            newBuildItems.forEach(item => {
                if (item.cost) {
                    newBuildSubtotal += item.cost;
                    section2Html += `<tr class="hover:bg-gray-50"><td class="px-3 py-2 pl-12">${item.label}</td><td class="px-3 py-2 text-gray-500 text-xs">${item.detail}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(item.cost))}</td></tr>`;
                }
            });
            section2Html += `<tr class="font-semibold bg-gray-100"><td class="px-3 py-2 text-right" colspan="2">Subtotal Bangun Baru</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(newBuildSubtotal))}</td></tr>`;
            section2GrandSubtotal += newBuildSubtotal;
        }
        
        section2Html += `<tr class="font-semibold bg-gray-200"><td class="px-3 py-2 text-right" colspan="2">Subtotal Pekerjaan Konstruksi & Sipil</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(section2GrandSubtotal))}</td></tr>`;
        
        tableBodyHtml += section2Html;
        grandSubtotal += section2GrandSubtotal;
        
        let section3Html = `<tbody class="bg-gray-100"><td colspan="3" class="p-3 font-bold text-gray-800">3. Peralatan Lapangan & Inventaris</td></tbody>`;
        let section3Subtotal = 0;
        const eq = capex.sport_courts_equipment;
        const perCourtCosts = eq.per_court_costs;
        let singleCourtSubtotal = 0;
        
        // Kalkulasi dan render rincian per 1 lapangan
        const perCourtItems = [
            { key: 'civil_works_concrete', label: 'Lantai Beton Finishing Halus' },
            { key: 'steel_structure', label: 'Struktur Baja Frame' },
            { key: 'tempered_glass_10mm', label: 'Kaca Tempered 10mm + Pasang' },
            { key: 'synthetic_turf', label: 'Rumput Sintetis (UV Protected)' },
            { key: 'silica_sand_infill', label: 'Infill Pasir Silika Premium' },
            { key: 'lighting_and_electrical', label: 'Sistem Lampu & Panel Listrik' },
            { key: 'net_and_gate', label: 'Net Padel & Pintu Akses' }
        ];

        perCourtItems.forEach(item => {
            const costData = perCourtCosts[item.key];
            if (!costData) return;
            let cost = 0;
            let detail = 'Lump Sum';
            if (costData.lump_sum) { cost = costData.lump_sum; }
            else if (costData.area_m2) { cost = costData.area_m2 * costData.cost_per_m2; detail = `${costData.area_m2} m² @ ${sierHelpers.formatNumber(costData.cost_per_m2)}`; }
            else if (costData.quantity) { cost = costData.quantity * costData.unit_cost; detail = `${costData.quantity} unit @ ${sierHelpers.formatNumber(costData.unit_cost)}`; }
            
            singleCourtSubtotal += cost;
            section3Html += `<tr class="hover:bg-gray-50"><td class="px-3 py-2 pl-12 text-gray-800">${item.label}</td><td class="px-3 py-2 text-gray-600 text-xs">${detail}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(cost))}</td></tr>`;
        });

        section3Html += `<tr class="font-semibold bg-gray-50"><td class="px-3 py-2 text-right" colspan="2">Subtotal Biaya per 1 Lapangan</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(singleCourtSubtotal))}</td></tr>`;
        
        const numCourts = scenarioConfig.num_courts;
        const totalCourtCost = singleCourtSubtotal * numCourts;
        section3Subtotal += totalCourtCost;
        section3Html += `<tr class="font-bold bg-white"><td class="px-3 py-2 pl-8">Total Biaya Struktur (${numCourts} Lapangan)</td><td class="px-3 py-2 text-gray-600 text-xs">${numCourts} lapangan × Rp ${sierHelpers.formatNumber(Math.round(singleCourtSubtotal))}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalCourtCost))}</td></tr>`;

        const rentalCost = (eq.initial_inventory.rental_rackets.quantity * eq.initial_inventory.rental_rackets.unit_cost) || 0;
        section3Subtotal += rentalCost;
        section3Html += `
            <tr class="bg-white hover:bg-gray-50">
                <td class="px-3 py-2 pl-8">Inventaris: Raket Sewa</td>
                <td class="px-3 py-2 text-gray-600 text-xs">${eq.initial_inventory.rental_rackets.quantity} buah</td>
                <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(rentalCost))}</td>
            </tr>`;

        const ballCost = (eq.initial_inventory.ball_tubes.quantity * eq.initial_inventory.ball_tubes.unit_cost) || 0;
        section3Subtotal += ballCost;
        section3Html += `
            <tr class="bg-white hover:bg-gray-50">
                <td class="px-3 py-2 pl-8">Inventaris: Tabung Bola</td>
                <td class="px-3 py-2 text-gray-600 text-xs">${eq.initial_inventory.ball_tubes.quantity} buah</td>
                <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(ballCost))}</td>
            </tr>`;
        
        // Tambahkan baris Subtotal untuk seluruh Seksi 3
        section3Html += `
            <tr class="font-semibold bg-gray-200">
                <td class="px-3 py-2 text-right" colspan="2">Subtotal Peralatan Lapangan & Inventaris</td>
                <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(section3Subtotal))}</td>
            </tr>`;
        
        tableBodyHtml += section3Html;
        grandSubtotal += section3Subtotal;

        const contingency = grandSubtotal * projectConfig.assumptions.contingency_rate;
        const grandTotal = grandSubtotal + contingency;

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Padel</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                ${sierVisualFinanceNarration.getPadelCapexNarration(scenarioConfig.title)}
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-200 text-xs uppercase">
                            <tr><th class="p-2 text-left w-1/3">Komponen Biaya</th><th class="p-2 text-left w-1/2">Detail Perhitungan</th><th class="p-2 text-right w-1/6">Estimasi Biaya (Rp)</th></tr>
                        </thead>
                        <tbody class="divide-y">${tableBodyHtml}</tbody>
                        <tfoot class="font-bold">
                            <tr class="bg-gray-300"><td class="p-3 text-right" colspan="2">Total Subtotal Biaya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandSubtotal))}</td></tr>
                            <tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${(projectConfig.assumptions.contingency_rate * 100)}%)</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr>
                            <tr class="bg-purple-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotal))}</td></tr>
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

    _renderMeetingPointCapexDetailsVisuals(scenarioKey) {
        const container = document.getElementById('meeting-point-capex-details-container');
        if (!container) return;

        const mpConfig = projectConfig.meetingPoint;
        const unitCosts = mpConfig.unit_costs;

        // Helper untuk membuat tabel rincian untuk SATU skenario konsep
        const createConceptTable = (scenarioKey) => {
            const scenario = mpConfig.capex_scenarios.concept_scenarios[scenarioKey];
            if (!scenario) return '';

            const items = scenario.items;
            let subtotal = 0;
            const costMap = {
                chairs: unitCosts.chair, tables_2pax: unitCosts.table_2pax, tables_4pax: unitCosts.table_4pax,
                sofas: unitCosts.sofa, coffee_tables: unitCosts.coffee_table, meeting_pods: unitCosts.meeting_pod,
                vip_partitions: unitCosts.vip_partition, vip_tables: unitCosts.vip_table, vip_chairs: unitCosts.vip_chair,
                kitchen: unitCosts.kitchen_equipment_lump_sum, toilet: unitCosts.toilet_unit_lump_sum
            };

            let rowsHtml = '';
            for (const key in items) {
                const count = items[key];
                if (count > 0 && costMap[key]) {
                    const cost = count * costMap[key];
                    subtotal += cost;
                    rowsHtml += `
                        <tr>
                            <td class="px-3 py-2 text-gray-600 pl-8">${sierHelpers.safeTranslate(key)}</td>
                            <td class="px-3 py-2 text-center">${count}</td>
                            <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(costMap[key])}</td>
                            <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(cost)}</td>
                        </tr>
                    `;
                }
            }
            return `
                <div class="mb-8">
                    <h4 class="font-semibold text-lg text-gray-800 mb-2">${scenario.title}</h4>
                    <div class="overflow-x-auto border rounded-lg">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-100 text-xs uppercase">
                                <tr>
                                    <th class="p-2 text-left">Komponen Interior/Furnitur</th>
                                    <th class="p-2 text-center">Jumlah</th>
                                    <th class="p-2 text-right">Biaya Satuan (Rp)</th>
                                    <th class="p-2 text-right">Subtotal (Rp)</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">${rowsHtml}</tbody>
                            <tfoot class="font-bold bg-gray-200">
                                <tr>
                                    <td colspan="3" class="p-2 text-right">Total Biaya Konsep Interior</td>
                                    <td class="p-2 text-right font-mono">${sierHelpers.formatNumber(subtotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        };
        const createConstructionTable = (scenarioKey) => {
            const scenario = mpConfig.capex_scenarios.construction_scenarios[scenarioKey];
            if (!scenario) return '';

            const baseCosts = scenario.base_costs;
            let subtotal = 0;
            let rowsHtml = '';

            // Loop ini sekarang akan berjalan sampai selesai untuk SEMUA item
            for (const key in baseCosts) {
                const item = baseCosts[key];
                const label = sierHelpers.safeTranslate(key);
            
                if (item && typeof item === 'object' && item.items) {
                    let categoryTotal = 0;
                    rowsHtml += `<tr class="bg-gray-50 font-semibold"><td class="px-3 py-2" colspan="3">${item.title || label}</td></tr>`;
                    
                    for (const subKey in item.items) {
                        const subItem = item.items[subKey];
                        const subLabel = sierHelpers.safeTranslate(subKey);
                        let itemTotal = 0;
                        let detailHtml = '';

                        if (subItem.lump_sum) {
                            itemTotal = subItem.lump_sum;
                            detailHtml = 'Lump Sum';
                        } else if (subItem.area_m2 && subItem.cost_per_m2) {
                            itemTotal = subItem.area_m2 * subItem.cost_per_m2;
                            detailHtml = `${subItem.area_m2} m² @ Rp ${sierHelpers.formatNumber(subItem.cost_per_m2)}`;
                        }
                        
                        categoryTotal += itemTotal;
                        rowsHtml += `
                            <tr>
                                <td class="px-3 py-2 text-gray-600 pl-8">${subLabel}</td>
                                <td class="px-3 py-2 text-gray-500 text-xs">${detailHtml}</td>
                                <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(itemTotal)}</td>
                            </tr>
                        `;
                    }
                    subtotal += categoryTotal;
                } 
                else {
                    let itemTotal = 0;
                    let detailHtml = '';
                    if (typeof item === 'number') {
                        itemTotal = item;
                        detailHtml = 'Lump Sum';
                    } else if (item.lump_sum) {
                        itemTotal = item.lump_sum;
                        detailHtml = 'Lump Sum';
                    } else if (item.area_m2 && item.cost_per_m2) {
                        itemTotal = item.area_m2 * item.cost_per_m2;
                        detailHtml = `${item.area_m2} m² @ Rp ${sierHelpers.formatNumber(item.cost_per_m2)}`;
                    }
                    subtotal += itemTotal;
                    rowsHtml += `
                        <tr>
                            <td class="px-3 py-2 text-gray-600">${label}</td>
                            <td class="px-3 py-2 text-gray-500 text-xs">${detailHtml}</td>
                            <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(itemTotal)}</td>
                        </tr>
                    `;
                }
            } // <-- LOOP BERAKHIR DI SINI

            return `
                <div class="mb-8">
                    <h4 class="font-semibold text-lg text-gray-800 mb-2">${scenario.title}</h4>
                    <div class="overflow-x-auto border rounded-lg">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-100 text-xs uppercase">
                                <tr>
                                    <th class="p-2 text-left">Komponen Biaya Konstruksi</th>
                                    <th class="p-2 text-left">Detail</th>
                                    <th class="p-2 text-right">Subtotal (Rp)</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">${rowsHtml}</tbody>
                            <tfoot class="font-bold bg-gray-200">
                                <tr>
                                    <td colspan="2" class="p-2 text-right">Total Biaya Dasar Konstruksi</td>
                                    <td class="p-2 text-right font-mono">${sierHelpers.formatNumber(subtotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            `;
        };

        const constructionRenovateHtml = createConstructionTable('renovate');
        const constructionRebuildHtml = createConstructionTable('rebuild');
        const concept1Html = createConceptTable('concept_1_pods');
        const concept2Html = createConceptTable('concept_2_open');
        const concept3Html = createConceptTable('concept_3_vip');

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-cyan-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Meeting Point</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 class="text-xl font-bold mb-4 text-gray-700 border-b pb-2">Langkah 1: Rincian Biaya Dasar Konstruksi</h3>
                ${constructionRenovateHtml} ${constructionRebuildHtml}
                <h3 class="text-xl font-bold mb-4 text-gray-700 border-b pb-2 mt-12">Langkah 2: Rincian Biaya Konsep Interior</h3>
                ${concept1Html} ${concept2Html} ${concept3Html}
                
                <!-- AWAL BAGIAN BARU: KALKULATOR TOTAL BIAYA -->
                <div id="mp-interactive-calculator" class="mt-12 pt-8 border-t-4 border-double">
                    <h3 class="text-xl font-bold mb-4 text-gray-700">Langkah 3: Hitung Total Biaya Investasi Meeting Point</h3>
                    <div class="bg-gray-50 p-6 rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <!-- Selector Metode Konstruksi -->
                        <div>
                            <label for="mp-construction-method" class="block text-sm font-medium text-gray-700">Pilih Metode Konstruksi:</label>
                            <select id="mp-construction-method" class="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                <option value="renovate">Metode 1: Renovasi Gedung Arsip</option>
                                <option value="rebuild">Metode 2: Bongkar & Bangun Ulang</option>
                            </select>
                        </div>
                        <!-- Selector Konsep Interior -->
                        <div>
                            <label for="mp-concept-choice" class="block text-sm font-medium text-gray-700">Pilih Konsep Interior:</label>
                            <select id="mp-concept-choice" class="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                <option value="concept_1_pods">Konsep 1: Business Lounge & Pods</option>
                                <option value="concept_2_open">Konsep 2: Open Space & Coworking</option>
                                <option value="concept_3_vip">Konsep 3: Area Meeting dengan Ruang VIP</option>
                            </select>
                        </div>
                        <!-- Total Biaya -->
                        <div class="text-center md:text-right">
                            <p class="text-sm font-medium text-gray-700">Total Estimasi Investasi (termasuk kontingensi):</p>
                            <p id="mp-capex-total" class="text-3xl font-bold text-cyan-700 mt-1">Rp 0</p>
                        </div>
                    </div>
                </div>
                <!-- AKHIR BAGIAN BARU -->
            </div>
        `;

        // --- Logika Interaktif untuk Kalkulator ---
        const updateTotal = () => {
            const constructionKey = document.getElementById('mp-construction-method').value;
            const conceptKey = document.getElementById('mp-concept-choice').value;
            const totalDisplay = document.getElementById('mp-capex-total');

            const baseCost = sierMathFinance._calculateMeetingPointCapex(constructionKey, conceptKey);
            const totalWithContingency = baseCost * (1 + projectConfig.assumptions.contingency_rate);
            
            totalDisplay.innerText = `Rp ${sierHelpers.formatNumber(Math.round(totalWithContingency))}`;
        };

        document.getElementById('mp-construction-method').addEventListener('change', updateTotal);
        document.getElementById('mp-concept-choice').addEventListener('change', updateTotal);

        // Panggil sekali untuk inisialisasi
        updateTotal();
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
        if (scenarioKey.includes('padel')) this._renderPadelCapexDetailsVisuals(scenarioKey);
        if (scenarioKey.includes('mp')) this._renderMeetingPointCapexDetailsVisuals();
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