// File: sier-visual-finance-breakdowns.js major overhaul

const sierVisualFinanceBreakdowns = {
    
    _renderOpexDetailsVisuals(model, scenarioConfig) {
        const container = document.getElementById('opex-details-container');
        if (!container) return;
        let tablesHtml = [];
        const createUnitOpexTable = (unitName, title, padelScenarioKey = null) => {
            const unitConfig = projectConfig[unitName];
            const opexData = padelScenarioKey ? unitConfig.scenarios[padelScenarioKey].opexMonthly : unitConfig.opexMonthly;
            if (!opexData) return '';

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
        
        if (scenarioConfig.dr && scenarioConfig.dr !== 'none') tablesHtml.push(createUnitOpexTable('drivingRange', 'Driving Range'));
        if (scenarioConfig.padel === '4courts') tablesHtml.push(createUnitOpexTable('padel', 'Padel (4 Lapangan)', 'four_courts_combined'));
        if (scenarioConfig.padel === '2courts') tablesHtml.push(createUnitOpexTable('padel', 'Padel (2 Lapangan)', 'two_courts_futsal_renovation'));
        if (scenarioConfig.mp && scenarioConfig.mp !== 'none') tablesHtml.push(createUnitOpexTable('meetingPoint', 'Meeting Point'));

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
        
        const physicalSubtotal = grandSubtotal;
        const mep = a.mep_systems;
        const electricalCost = physicalSubtotal * mep.electrical_system.rate_of_physical_cost;
        const permitCost = (physicalSubtotal + mep.plumbing_system.lump_sum_cost + electricalCost) * a.other_costs.permit_design_rate_of_physical_cost;
        
        tableBodyHtml += createSection('6. Sistem MEP & Biaya Lain-lain', [
            { label: 'Sistem Plumbing', detail: 'Lump Sum', cost: mep.plumbing_system.lump_sum_cost },
            { label: 'Sistem Elektrikal', detail: `${sierHelpers.formatPercent(mep.electrical_system.rate_of_physical_cost)} dari Subtotal Fisik`, cost: electricalCost },
            { label: 'Izin & Konsultan Desain', detail: `${sierHelpers.formatPercent(a.other_costs.permit_design_rate_of_physical_cost)} dari Total Fisik + MEP`, cost: permitCost }
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
                            <tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${sierHelpers.formatPercent(global.contingency_rate)})</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr>
                            <tr class="bg-blue-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotal))}</td></tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    },

    _renderPadelCapexDetailsVisuals(scenarioConfig) {
        const container = document.getElementById('padel-capex-details-container');
        if (!container) return;

        // 1. Tentukan skenario Padel yang aktif
        const activePadelScenarioKey = scenarioConfig.padel === '4courts' ? 'four_courts_combined' : 'two_courts_futsal_renovation';
        const activePadelConfig = projectConfig.padel.scenarios[activePadelScenarioKey];
        if (!activePadelConfig) {
            container.innerHTML = ''; // Kosongkan jika tidak ada skenario padel aktif
            return;
        }

        let tableBodyHtml = '';
        let grandSubtotal = 0;

        // Helper untuk membuat string detail yang informatif
        const buildDetailString = (itemData, itemKey) => {
            if (!itemData) return 'Lump Sum';
            if (itemData.area_m2 && itemData.cost_per_m2) {
                return `${sierHelpers.formatNumber(itemData.area_m2)} m² × Rp ${sierHelpers.formatNumber(itemData.cost_per_m2)}/m²`;
            }
            if (itemData.quantity && itemData.unit_cost) {
                return `${sierHelpers.formatNumber(itemData.quantity)} unit × Rp ${sierHelpers.formatNumber(itemData.unit_cost)}/unit`;
            }
            if (itemData.toilet_unit && itemData.area_m2_per_toilet && itemData.cost_per_m2) {
                return `${itemData.toilet_unit} unit × ${itemData.area_m2_per_toilet} m²/unit @ ...`;
            }
            if (typeof itemData === 'number') {
                return `Lump Sum`;
            }
            return 'Detail Bervariasi';
        };

        const capex = activePadelConfig.capex;
        
        // --- Bagian 1: Biaya Pra-Operasional ---
        let preOpSubtotal = sierHelpers.calculateTotal(capex.pre_operational || {});
        if (preOpSubtotal > 0) {
            tableBodyHtml += `<tbody class="bg-gray-100"><td colspan="3" class="p-3 font-bold text-gray-800">1. Biaya Pra-Operasional & Umum</td></tbody>`;
            for (const key in capex.pre_operational) {
                const cost = capex.pre_operational[key];
                tableBodyHtml += `<tr class="hover:bg-gray-50"><td class="px-3 py-2 pl-8">${sierHelpers.safeTranslate(key)}</td><td class="px-3 py-2 text-gray-600 text-xs">Lump Sum</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(cost))}</td></tr>`;
            }
            tableBodyHtml += `<tr class="font-semibold bg-gray-200"><td class="px-3 py-2 text-right" colspan="2">Subtotal Pra-Operasional</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(preOpSubtotal))}</td></tr>`;
            grandSubtotal += preOpSubtotal;
        }

        // --- Bagian 2: Pekerjaan Konstruksi & Sipil ---
        let constructionGrandSubtotal = 0;
        let constructionHtml = '';
        const futsalRenovation = capex.component_futsal_renovation || capex.renovation_futsal || {};
        const koperasiNewBuild = capex.component_koperasi_new_build || {};

        if (Object.keys(futsalRenovation).length > 0 || Object.keys(koperasiNewBuild).length > 0) {
            constructionHtml += `<tbody class="bg-gray-100"><td colspan="3" class="p-3 font-bold text-gray-800">2. Pekerjaan Konstruksi & Sipil</td></tbody>`;
        }

        // Sub-bagian: Renovasi Futsal
        let futsalSubtotal = sierHelpers.calculateTotal(futsalRenovation);
        if (futsalSubtotal > 0) {
            constructionHtml += `<tr class="bg-gray-50 font-semibold"><td class="px-3 py-2 pl-8" colspan="3">2.1 Pekerjaan Renovasi (Area Futsal)</td></tr>`;
            for (const key in futsalRenovation) {
                const item = futsalRenovation[key];
                const cost = sierHelpers.calculateTotal({[key]: item});
                constructionHtml += `<tr><td class="px-3 py-2 pl-12">${sierHelpers.safeTranslate(key)}</td><td class="px-3 py-2 text-gray-500 text-xs">${buildDetailString(item, key)}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(cost))}</td></tr>`;
            }
            constructionGrandSubtotal += futsalSubtotal;
        }

        // Sub-bagian: Bangun Baru Koperasi
        let newBuildSubtotal = sierHelpers.calculateTotal(koperasiNewBuild);
        if (newBuildSubtotal > 0) {
            constructionHtml += `<tr class="bg-gray-50 font-semibold"><td class="px-3 py-2 pl-8" colspan="3">2.2 Pekerjaan Bangun Baru (Area Koperasi)</td></tr>`;
            for (const key in koperasiNewBuild) {
                const item = koperasiNewBuild[key];
                const cost = sierHelpers.calculateTotal({[key]: item});
                constructionHtml += `<tr><td class="px-3 py-2 pl-12">${sierHelpers.safeTranslate(key)}</td><td class="px-3 py-2 text-gray-500 text-xs">${buildDetailString(item, key)}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(cost))}</td></tr>`;
            }
            constructionGrandSubtotal += newBuildSubtotal;
        }

        if (constructionGrandSubtotal > 0) {
            constructionHtml += `<tr class="font-semibold bg-gray-200"><td class="px-3 py-2 text-right" colspan="2">Subtotal Pekerjaan Konstruksi & Sipil</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(constructionGrandSubtotal))}</td></tr>`;
            tableBodyHtml += constructionHtml;
            grandSubtotal += constructionGrandSubtotal;
        }

        // --- Bagian 3: Peralatan Lapangan & Inventaris ---
        const equipmentConfig = capex.sport_courts_equipment;
        let equipmentGrandSubtotal = 0;
        let equipmentHtml = '';
        
        if (equipmentConfig) {
            equipmentHtml += `<tbody class="bg-gray-100"><td colspan="3" class="p-3 font-bold text-gray-800">3. Peralatan Lapangan & Inventaris</td></tbody>`;

            // Sub-bagian: Biaya per Lapangan
            const perCourtCosts = equipmentConfig.per_court_costs || {};
            const singleCourtSubtotal = sierHelpers.calculateTotal(perCourtCosts);
            if(singleCourtSubtotal > 0) {
                equipmentHtml += `<tr class="bg-gray-50 font-semibold"><td class="px-3 py-2 pl-8" colspan="3">3.1 Rincian Biaya Struktur & Komponen per 1 Lapangan</td></tr>`;
                for (const key in perCourtCosts) {
                    const item = perCourtCosts[key];
                    const cost = sierHelpers.calculateTotal({[key]: item});
                    equipmentHtml += `<tr class="hover:bg-gray-50"><td class="px-3 py-2 pl-12 text-gray-800">${sierHelpers.safeTranslate(key)}</td><td class="px-3 py-2 text-gray-600 text-xs">${buildDetailString(item, key)}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(cost))}</td></tr>`;
                }
                equipmentHtml += `<tr class="font-semibold bg-gray-100"><td class="px-3 py-2 text-right" colspan="2">Subtotal Biaya per 1 Lapangan</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(singleCourtSubtotal))}</td></tr>`;

                const numCourts = activePadelConfig.num_courts;
                const totalCourtCost = singleCourtSubtotal * numCourts;
                equipmentHtml += `<tr class="font-bold bg-white"><td class="px-3 py-2 pl-8">Total Biaya Struktur (${numCourts} Lapangan)</td><td class="px-3 py-2 text-gray-600 text-xs">${numCourts} × Rp ${sierHelpers.formatNumber(Math.round(singleCourtSubtotal))}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(totalCourtCost))}</td></tr>`;
                equipmentGrandSubtotal += totalCourtCost;
            }

            // Sub-bagian: Inventaris Awal
            const initialInventory = equipmentConfig.initial_inventory || {};
            const inventoryCost = sierHelpers.calculateTotal(initialInventory);
            if (inventoryCost > 0) {
                equipmentHtml += `<tr class="bg-gray-50 font-semibold"><td class="px-3 py-2 pl-8" colspan="3">3.2 Inventaris Awal</td></tr>`;
                for(const key in initialInventory) {
                    const item = initialInventory[key];
                    const cost = sierHelpers.calculateTotal({[key]: item});
                    equipmentHtml += `
                        <tr class="bg-white hover:bg-gray-50">
                            <td class="px-3 py-2 pl-12">${sierHelpers.safeTranslate(key)}</td>
                            <td class="px-3 py-2 text-gray-600 text-xs">${buildDetailString(item, key)}</td>
                            <td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(cost))}</td>
                        </tr>`;
                }
                equipmentGrandSubtotal += inventoryCost;
            }

            equipmentHtml += `<tr class="font-semibold bg-gray-200"><td class="px-3 py-2 text-right" colspan="2">Subtotal Peralatan Lapangan & Inventaris</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(equipmentGrandSubtotal))}</td></tr>`;
            tableBodyHtml += equipmentHtml;
            grandSubtotal += equipmentGrandSubtotal;
        }

        // --- Bagian Akhir: Total & Kontingensi ---
        const contingency = grandSubtotal * projectConfig.assumptions.contingency_rate;
        const grandTotal = grandSubtotal + contingency;

        container.innerHTML = `
            <h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-purple-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Padel</h2>
            <div class="bg-white p-6 rounded-lg shadow-md mb-8">
                ${sierVisualFinanceNarration.getPadelCapexNarration(activePadelConfig.title)}
                <div class="overflow-x-auto border rounded-lg mt-6">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-200 text-xs uppercase">
                            <tr><th class="p-2 text-left w-1/3">Komponen Biaya</th><th class="p-2 text-left w-1/2">Detail Perhitungan</th><th class="p-2 text-right w-1/6">Estimasi Biaya (Rp)</th></tr>
                        </thead>
                        <tbody class="divide-y">${tableBodyHtml}</tbody>
                        <tfoot class="font-bold">
                            <tr class="bg-gray-300"><td class="p-3 text-right" colspan="2">Total Subtotal Biaya</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandSubtotal))}</td></tr>
                            <tr class="bg-yellow-200"><td class="p-3 text-right" colspan="2">Kontingensi (${sierHelpers.formatPercent(projectConfig.assumptions.contingency_rate)})</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(contingency))}</td></tr>
                            <tr class="bg-purple-600 text-white text-lg"><td class="p-3 text-right" colspan="2">Total Estimasi Investasi</td><td class="p-3 text-right font-mono">${sierHelpers.formatNumber(Math.round(grandTotal))}</td></tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    },

    _renderMeetingPointCapexDetailsVisuals() {
        const container = document.getElementById('meeting-point-capex-details-container');
        if (!container) return;

        const mpConfig = projectConfig.meetingPoint;
        const unitCosts = mpConfig.unit_costs;

        const createConceptTable = (conceptKey) => {
            const scenario = mpConfig.capex_scenarios.concept_scenarios[conceptKey];
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
                    rowsHtml += `<tr><td class="px-3 py-2 text-gray-600 pl-8">${sierHelpers.safeTranslate(key)}</td><td class="px-3 py-2 text-center">${count}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(costMap[key])}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(cost)}</td></tr>`;
                }
            }
            return `<div class="mb-8"><h4 class="font-semibold text-lg text-gray-800 mb-2">${scenario.title}</h4><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Komponen</th><th class="p-2 text-center">Jumlah</th><th class="p-2 text-right">Biaya/Unit</th><th class="p-2 text-right">Subtotal</th></tr></thead><tbody class="divide-y">${rowsHtml}</tbody><tfoot class="font-bold bg-gray-200"><tr><td colspan="3" class="p-2 text-right">Total Biaya Konsep</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(subtotal)}</td></tr></tfoot></table></div></div>`;
        };
        
        const createConstructionTable = (constructionKey) => {
            const scenario = mpConfig.capex_scenarios.construction_scenarios[constructionKey];
            if (!scenario) return '';
            const baseCosts = scenario.base_costs;
            let subtotal = 0;
            let rowsHtml = '';

            const processItems = (items) => {
                let html = '';
                for (const key in items) {
                    const item = items[key];
                    const cost = sierHelpers.calculateTotal({[key]: item});
                    subtotal += cost;

                    let detail = 'Lump Sum';
                    if (item.area_m2 && item.cost_per_m2) {
                        detail = `${item.area_m2} m² × Rp ${sierHelpers.formatNumber(item.cost_per_m2)}/m²`;
                    } else if (item.lump_sum) {
                        detail = `Rp ${sierHelpers.formatNumber(item.lump_sum)}`;
                    }

                    if(item.items) { // Jika ada sub-item, tampilkan sebagai judul
                        html += `<tr class="bg-gray-50"><td class="px-3 py-2 text-gray-700 font-semibold" colspan="3">${sierHelpers.safeTranslate(key)}</td></tr>`;
                        // Rekursif panggil untuk sub-item
                        for(const subKey in item.items){
                            const subItem = item.items[subKey];
                            const subCost = sierHelpers.calculateTotal({[subKey]: subItem});
                            let subDetail = subItem.area_m2 ? `${subItem.area_m2} m² × Rp ${sierHelpers.formatNumber(subItem.cost_per_m2)}/m²` : `Lump Sum`;
                            html += `<tr><td class="px-3 py-2 text-gray-600 pl-8">${sierHelpers.safeTranslate(subKey)}</td><td class="px-3 py-2 text-gray-500 text-xs">${subDetail}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(subCost))}</td></tr>`;
                        }
                    } else {
                        html += `<tr><td class="px-3 py-2 text-gray-600">${sierHelpers.safeTranslate(key)}</td><td class="px-3 py-2 text-gray-500 text-xs">${detail}</td><td class="px-3 py-2 text-right font-mono">${sierHelpers.formatNumber(Math.round(cost))}</td></tr>`;
                    }
                }
                return html;
            };
            
            rowsHtml = processItems(baseCosts);

            return `<div class="mb-8"><h4 class="font-semibold text-lg text-gray-800 mb-2">${scenario.title}</h4><div class="overflow-x-auto border rounded-lg"><table class="w-full text-sm"><thead class="bg-gray-100 text-xs uppercase"><tr><th class="p-2 text-left">Komponen Biaya</th><th class="p-2 text-left">Detail</th><th class="p-2 text-right">Subtotal</th></tr></thead><tbody class="divide-y">${rowsHtml}</tbody><tfoot class="font-bold bg-gray-200"><tr><td colspan="2" class="p-2 text-right">Total Biaya Konstruksi</td><td class="p-2 text-right font-mono">${sierHelpers.formatNumber(subtotal)}</td></tr></tfoot></table></div></div>`;
        };

        const constructionRenovateHtml = createConstructionTable('renovate');
        const constructionRebuildHtml = createConstructionTable('rebuild');
        const concept1Html = createConceptTable('concept_1_pods');
        const concept2Html = createConceptTable('concept_2_open');
        const concept3Html = createConceptTable('concept_3_vip');

        container.innerHTML = `<h2 class="text-2xl font-semibold mb-6 text-gray-800 border-l-4 border-cyan-600 pl-4">Rincian Estimasi Biaya Investasi (CapEx): Meeting Point</h2><div class="bg-white p-6 rounded-lg shadow-md mb-8"><h3 class="text-xl font-bold mb-4 text-gray-700 border-b pb-2">Langkah 1: Rincian Biaya Dasar Konstruksi</h3>${constructionRenovateHtml} ${constructionRebuildHtml}<h3 class="text-xl font-bold mb-4 text-gray-700 border-b pb-2 mt-12">Langkah 2: Rincian Biaya Konsep Interior</h3>${concept1Html} ${concept2Html} ${concept3Html}<div id="mp-interactive-calculator" class="mt-12 pt-8 border-t-4 border-double"><h3 class="text-xl font-bold mb-4 text-gray-700">Langkah 3: Hitung Total Biaya Investasi</h3><div class="bg-gray-50 p-6 rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-6 items-center"><div><label for="mp-construction-method" class="block text-sm font-medium text-gray-700">Pilih Metode Konstruksi:</label><select id="mp-construction-method" class="mt-1 block w-full p-2 border border-gray-300 rounded-md"><option value="renovate">Renovasi</option><option value="rebuild">Bangun Ulang</option></select></div><div><label for="mp-concept-choice" class="block text-sm font-medium text-gray-700">Pilih Konsep Interior:</label><select id="mp-concept-choice" class="mt-1 block w-full p-2 border border-gray-300 rounded-md"><option value="concept_1_pods">Konsep 1: Pods</option><option value="concept_2_open">Konsep 2: Open Space</option><option value="concept_3_vip">Konsep 3: VIP</option></select></div><div class="text-center md:text-right"><p class="text-sm font-medium text-gray-700">Total Estimasi (inc. kontingensi):</p><p id="mp-capex-total" class="text-3xl font-bold text-cyan-700 mt-1">Rp 0</p></div></div></div></div>`;

        const updateTotal = () => {
            const constructionKey = document.getElementById('mp-construction-method').value;
            const conceptKey = document.getElementById('mp-concept-choice').value;
            const totalDisplay = document.getElementById('mp-capex-total');

            // Kalkulasi terpisah
            const constructionCost = sierHelpers.calculateTotal(mpConfig.capex_scenarios.construction_scenarios[constructionKey].base_costs);
            const conceptCost = sierMathCosting.calculateMeetingPointCapex('none', conceptKey); // Dibuat agar hanya menghitung konsep

            const subtotal = constructionCost + conceptCost;
            const contingency = subtotal * projectConfig.assumptions.contingency_rate;
            const totalWithContingency = subtotal + contingency;
            
            // Tampilkan dengan rincian
            totalDisplay.innerHTML = `
                <div class="text-right">
                    <span class="text-sm font-normal block">Dasar Konstruksi: Rp ${sierHelpers.formatNumber(Math.round(constructionCost))}</span>
                    <span class="text-sm font-normal block">Konsep Interior: Rp ${sierHelpers.formatNumber(Math.round(conceptCost))}</span>
                    <span class="text-sm font-normal block text-yellow-600">Kontingensi: + Rp ${sierHelpers.formatNumber(Math.round(contingency))}</span>
                    <hr class="my-1">
                    <span class="text-2xl font-bold text-cyan-700 block">Rp ${sierHelpers.formatNumber(Math.round(totalWithContingency))}</span>
                </div>
            `;
        };

        document.getElementById('mp-construction-method').addEventListener('change', updateTotal);
        document.getElementById('mp-concept-choice').addEventListener('change', updateTotal);
        updateTotal();
    },

    render(model, scenarioConfig) {
        const clearContainer = (id) => { const el = document.getElementById(id); if (el) el.innerHTML = ''; };
        
        clearContainer('opex-details-container');
        clearContainer('driving-range-capex-details-container');
        clearContainer('padel-capex-details-container');
        clearContainer('meeting-point-capex-details-container');

        this._renderOpexDetailsVisuals(model, scenarioConfig);
        if (scenarioConfig.dr && scenarioConfig.dr !== 'none') this._renderDrCapexDetailsVisuals();
        if (scenarioConfig.padel) this._renderPadelCapexDetailsVisuals(scenarioConfig);
        if (scenarioConfig.mp && scenarioConfig.mp !== 'none') this._renderMeetingPointCapexDetailsVisuals();
        
        console.log("[sier-visual-finance-breakdowns] Semua tabel rincian biaya telah dirender.");
    }
};

window.sierVisualFinanceBreakdowns = sierVisualFinanceBreakdowns;