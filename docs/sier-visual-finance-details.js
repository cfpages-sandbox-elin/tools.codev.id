// File: sier-visual-finance-details.js dr capex detil
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

        // --- 1. Ambil semua asumsi dasar dari projectConfig ---
        const a = projectConfig.drivingRange.capex_assumptions;
        const site = projectConfig.site_parameters.driving_range;
        const global = projectConfig.assumptions;
        const total_bays = Math.floor(site.building_length_m / site.bay_width_m) * site.levels;

        let tableBodyHtml = '';
        let physicalCostSubtotal = 0;

        // --- 2. Fungsi Helper untuk membuat baris tabel ---
        const createRow = (label, detail, cost, isSubtotal = false, isHeader = false) => {
            if (isHeader) {
                return `<tbody class="bg-gray-100"><td colspan="3" class="p-3 font-bold text-gray-800">${label}</td></tbody>`;
            }
            physicalCostSubtotal += isSubtotal ? 0 : cost;
            return `
                <tr class="${isSubtotal ? 'font-semibold bg-gray-50' : 'hover:bg-gray-50'}">
                    <td class="px-3 py-2 pl-8">${label}</td>
                    <td class="px-3 py-2 text-gray-600 text-xs">${detail}</td>
                    <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(cost))}</td>
                </tr>
            `;
        };

        // --- 3. Bangun setiap bagian tabel secara terperinci ---

        // BAGIAN 1: PEKERJAAN SIPIL & PONDASI
        tableBodyHtml += createRow('1. Pekerjaan Sipil & Pondasi', '', 0, false, true);
        const pil = a.piling;
        const pilingCost = (pil.points_count * pil.length_per_point_m * pil.cost_per_m_mini_pile) + pil.lump_sum_pile_cap;
        tableBodyHtml += createRow('Pondasi Tiang Pancang', `${pil.points_count} titik × ${pil.length_per_point_m}m @ Rp ${sierHelpers.formatNumber(pil.cost_per_m_mini_pile)}/m + Pile Cap`, pilingCost);
        
        // BAGIAN 2: KONSTRUKSI BANGUNAN
        tableBodyHtml += createRow('2. Konstruksi Bangunan', '', 0, false, true);
        const bld = a.building;
        const bayConstructionCost = bld.dr_bays_area_m2 * bld.dr_bays_cost_per_m2;
        tableBodyHtml += createRow('Konstruksi Bay Driving Range', `${bld.dr_bays_area_m2} m² × Rp ${sierHelpers.formatNumber(bld.dr_bays_cost_per_m2)}/m²`, bayConstructionCost);
        const cafeConstructionCost = bld.cafe_area_m2 * bld.cafe_cost_per_m2;
        tableBodyHtml += createRow('Konstruksi Kafe & Lounge', `${bld.cafe_area_m2} m² × Rp ${sierHelpers.formatNumber(bld.cafe_cost_per_m2)}/m²`, cafeConstructionCost);
        const lockersConstructionCost = bld.lockers_mushola_area_m2 * bld.lockers_mushola_cost_per_m2;
        tableBodyHtml += createRow('Konstruksi Loker & Mushola', `${bld.lockers_mushola_area_m2} m² × Rp ${sierHelpers.formatNumber(bld.lockers_mushola_cost_per_m2)}/m²`, lockersConstructionCost);

        // BAGIAN 3: PERALATAN & TEKNOLOGI INTI
        tableBodyHtml += createRow('3. Peralatan & Teknologi Inti', '', 0, false, true);
        const eq = a.equipment;
        const premium_bays_count = Math.round(total_bays * eq.premium_bays.percentage_of_total);
        const normal_bays_count = total_bays - premium_bays_count;
        const ballTrackerCost = premium_bays_count * eq.premium_bays.cost_per_bay_ball_tracker;
        tableBodyHtml += createRow('Sistem Ball Tracker', `${premium_bays_count} bay × Rp ${sierHelpers.formatNumber(eq.premium_bays.cost_per_bay_ball_tracker)}/bay`, ballTrackerCost);
        const dispenserCost = premium_bays_count * eq.premium_bays.cost_per_bay_dispenser;
        tableBodyHtml += createRow('Dispenser Bola Otomatis', `${premium_bays_count} bay × Rp ${sierHelpers.formatNumber(eq.premium_bays.cost_per_bay_dispenser)}/bay`, dispenserCost);
        const normalBayEquipCost = normal_bays_count * eq.normal_bays.bay_equipment_cost_per_set;
        tableBodyHtml += createRow('Peralatan Bay Normal', `${normal_bays_count} bay × Rp ${sierHelpers.formatNumber(eq.normal_bays.bay_equipment_cost_per_set)}/set`, normalBayEquipCost);
        const ballsCost = eq.floating_balls_count * eq.floating_balls_cost_per_ball;
        tableBodyHtml += createRow('Bola Apung (Floating Balls)', `${eq.floating_balls_count} buah × Rp ${sierHelpers.formatNumber(eq.floating_balls_cost_per_ball)}/bola`, ballsCost);
        tableBodyHtml += createRow('Sistem Manajemen Bola', 'Lump Sum', eq.ball_management_system_lump_sum);

        // BAGIAN 4: JARING PENGAMAN
        tableBodyHtml += createRow('4. Jaring Pengaman (Safety Net)', '', 0, false, true);
        const net = a.safety_net;
        const polesCount = Math.ceil(net.total_perimeter_m / net.poles.spacing_m);
        const polesFoundationCost = polesCount * net.poles.foundation_cost_per_pole;
        tableBodyHtml += createRow('Pondasi & Tiang Penyangga', `${polesCount} tiang × Rp ${sierHelpers.formatNumber(net.poles.foundation_cost_per_pole)}/tiang`, polesFoundationCost);
        const netArea = (site.field_length_m * net.poles.height_distribution.left_right_side_m * 2) + (net.field_width_m * net.poles.height_distribution.far_side_m);
        const nettingCost = netArea * net.netting.cost_per_m2;
        tableBodyHtml += createRow('Material Jaring', `Estimasi ${netArea} m² × Rp ${sierHelpers.formatNumber(net.netting.cost_per_m2)}/m²`, nettingCost);

        // BAGIAN 5: INTERIOR, FURNITUR & SANITASI
        tableBodyHtml += createRow('5. Interior, Furnitur & Sanitasi', '', 0, false, true);
        const furnitureCost = total_bays * a.bay_furniture.cost_per_bay;
        tableBodyHtml += createRow('Furnitur Bay', `${total_bays} bay × Rp ${sierHelpers.formatNumber(a.bay_furniture.cost_per_bay)}/bay`, furnitureCost);
        const san = a.plumbing_and_sanitary;
        const sanCost = (san.male_toilet.toilets + san.female_toilet.toilets) * san.unit_costs.toilet_bowl + san.male_toilet.urinals * san.unit_costs.urinal + (san.male_toilet.sinks + san.female_toilet.sinks) * san.unit_costs.sink;
        tableBodyHtml += createRow('Unit Sanitasi (Toilet, Wastafel)', 'Jumlah unit × harga satuan', sanCost);
        
        // HITUNG SUBTOTAL SEBELUM MEP & LAIN-LAIN
        tableBodyHtml += createRow('Subtotal Biaya Fisik & Peralatan', '', physicalCostSubtotal, true);

        // BAGIAN 6: MEP, Izin, & Desain
        tableBodyHtml += createRow('6. Sistem MEP & Biaya Lain-lain', '', 0, false, true);
        const mep = a.mep_systems;
        const hvacCost = bld.cafe_area_m2 * mep.hvac_system.cost_per_m2_hvac;
        tableBodyHtml += createRow('Sistem HVAC (AC)', `${bld.cafe_area_m2} m² × Rp ${sierHelpers.formatNumber(mep.hvac_system.cost_per_m2_hvac)}/m²`, hvacCost);
        const plumbingCost = mep.plumbing_system.lump_sum_cost;
        tableBodyHtml += createRow('Sistem Plumbing', 'Lump Sum', plumbingCost);
        const electricalCost = physicalCostSubtotal * mep.electrical_system.rate_of_physical_cost;
        tableBodyHtml += createRow('Sistem Elektrikal', `${(mep.electrical_system.rate_of_physical_cost * 100)}% dari Biaya Fisik`, electricalCost);
        const permitCost = physicalCostSubtotal * a.other_costs.permit_design_rate_of_physical_cost;
        tableBodyHtml += createRow('Izin & Konsultan Desain', `${(a.other_costs.permit_design_rate_of_physical_cost * 100)}% dari Biaya Fisik`, permitCost);

        // --- 4. Hitung Total Akhir ---
        const subtotal = physicalCostSubtotal + hvacCost + plumbingCost + electricalCost + permitCost;
        const contingency = subtotal * global.contingency_rate;
        const grandTotal = subtotal + contingency;

        // --- 5. Render HTML ke Container ---
        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-blue-500 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Driving Range</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                <p class="text-gray-600 mb-4 text-sm">Tabel ini merinci total biaya investasi untuk Driving Range, memecah setiap komponen biaya dari asumsi dasar hingga total akhir untuk transparansi penuh.</p>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-200 text-xs uppercase">
                            <tr>
                                <th class="p-2 text-left w-1/3">Komponen Biaya</th>
                                <th class="p-2 text-left w-1/2">Detail Perhitungan</th>
                                <th class="p-2 text-right w-1/6">Estimasi Biaya (Rp)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${tableBodyHtml}
                        </tbody>
                        <tfoot class="font-bold">
                            <tr class="bg-gray-200">
                                <td class="p-3 text-right" colspan="2">Subtotal Biaya</td>
                                <td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(subtotal))}</td>
                            </tr>
                            <tr class="bg-yellow-200">
                                <td class="p-3 text-right" colspan="2">Kontingensi (${(global.contingency_rate * 100)}%)</td>
                                <td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td>
                            </tr>
                            <tr class="bg-blue-600 text-white text-lg">
                                <td class="p-3 text-right" colspan="2">Total Estimasi Investasi</td>
                                <td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotal))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    },

    _renderPadelCapexDetailsVisuals(scenarioKey) {
        const container = document.getElementById('padel-capex-details-container');
        if (!container) return;

        // Fungsi helper untuk membuat tabel tetap sama
        const createScenarioTable = (scenarioConfig) => {
            if (!scenarioConfig || !scenarioConfig.capex) return '<p>Data tidak valid.</p>';
            const capexData = scenarioConfig.capex;
            let tableBodyHtml = '';
            let grandTotal = 0;
            const numCourts = scenarioConfig.num_courts;
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

        // --- AWAL PERUBAHAN LOGIKA ---
        let capexDetailsHtml = '';
        // Cek skenario mana yang aktif dan panggil helper yang sesuai
        if (scenarioKey.includes('padel2')) {
            capexDetailsHtml = createScenarioTable(projectConfig.padel.scenarios.two_courts_futsal_renovation);
        } else if (scenarioKey.includes('padel4')) {
            capexDetailsHtml = createScenarioTable(projectConfig.padel.scenarios.four_courts_combined);
        }
        // --- AKHIR PERUBAHAN LOGIKA ---

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Padel</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                ${capexDetailsHtml}
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

            for (const key in baseCosts) {
                const item = baseCosts[key];
                const label = sierHelpers.safeTranslate(key);
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
                <p class="text-gray-600 mb-6">Total biaya dihitung dengan menggabungkan satu <strong>Metode Konstruksi</strong> (biaya dasar) dengan satu <strong>Konsep Desain</strong> (biaya interior).</p>
                
                <h3 class="text-xl font-bold mb-4 text-gray-700 border-b pb-2">Langkah 1: Pilih Biaya Dasar Konstruksi</h3>
                ${constructionRenovateHtml}
                ${constructionRebuildHtml}
                
                <h3 class="text-xl font-bold mb-4 text-gray-700 border-b pb-2 mt-12">Langkah 2: Tambahkan Biaya Konsep Interior</h3>
                ${concept1Html}
                ${concept2Html}
                ${concept3Html}
            </div>
        `;
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