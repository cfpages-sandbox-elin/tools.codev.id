// File: sier-math-costing.js major overhaul
const sierMathCosting = {
    _calculateTotal(dataObject) {
        if (typeof dataObject !== 'object' || dataObject === null) return 0;
        return Object.values(dataObject).reduce((sum, value) => {
            if (typeof value === 'number') return sum + value;
            if (typeof value === 'object' && value !== null) {
                if (value.count && value.salary) return sum + (value.count * value.salary);
                if (value.quantity && value.unit_cost) return sum + (value.quantity * value.unit_cost);
                if (value.area_m2 && value.cost_per_m2) return sum + (value.area_m2 * value.cost_per_m2);
                if (value.toilet_unit && value.area_m2_per_toilet && value.cost_per_m2) return sum + (value.toilet_unit * value.area_m2_per_toilet * value.cost_per_m2);
                if (value.lump_sum) return sum + value.lump_sum;
                return sum + sierMathCosting._calculateTotal(value);
            }
            return sum;
        }, 0);
    },

    calculateDrCapex() {
        const a = projectConfig.drivingRange.capex_assumptions;
        const site = projectConfig.site_parameters.driving_range;
        const global = projectConfig.assumptions;
        const total_bays = Math.floor(site.building_length_m / site.bay_width_m) * site.levels;

        // Kategori Biaya
        const breakdown = {
            civil_construction: 0,
            building: 0,
            equipment: 0,
            interior: 0,
            other: 0
        };

        // 1. Pekerjaan Sipil & Pondasi
        const pil = a.piling;
        breakdown.civil_construction += (pil.points_count * pil.length_per_point_m * pil.cost_per_m_mini_pile) + pil.lump_sum_pile_cap;

        // 2. Konstruksi Bangunan
        const bld = a.building;
        const bayArea = bld.dr_bays_length_m * bld.dr_bays_width_m;
        breakdown.building += bayArea * bld.dr_bays_cost_per_m2;

        // 3. Peralatan & Teknologi
        const eq = a.equipment;
        const premium_bays_count = Math.round(total_bays * eq.premium_bays.percentage_of_total);
        const normal_bays_count = total_bays - premium_bays_count;
        breakdown.equipment += (premium_bays_count * eq.premium_bays.cost_per_bay_ball_tracker);
        breakdown.equipment += (premium_bays_count * eq.premium_bays.cost_per_bay_dispenser);
        breakdown.equipment += (normal_bays_count * eq.normal_bays.bay_equipment_cost_per_set);
        breakdown.equipment += (eq.floating_balls_count * eq.floating_balls_cost_per_ball);
        breakdown.equipment += eq.ball_management_system_lump_sum;

        // 4. Jaring Pengaman (dianggap bagian Sipil)
        const net = a.safety_net;
        const polesCount = Math.ceil(net.total_perimeter_m / net.poles.spacing_m);
        const netArea = (site.field_length_m * net.poles.height_distribution.left_right_side_m * 2) + (net.field_width_m * net.poles.height_distribution.far_side_m);
        breakdown.civil_construction += (polesCount * net.poles.foundation_cost_per_pole);
        breakdown.civil_construction += (netArea * net.netting.cost_per_m2);

        // 5. Interior & Sanitasi
        const san = a.plumbing_and_sanitary;
        breakdown.interior += (total_bays * a.bay_furniture.cost_per_bay);
        breakdown.interior += sierHelpers.calculateTotal(san); // Menggunakan helper

        // 6. Sistem MEP & Biaya Lainnya (Other)
        const physicalSubtotal = breakdown.civil_construction + breakdown.building + breakdown.equipment + breakdown.interior;
        const mep = a.mep_systems;
        const electricalCost = physicalSubtotal * mep.electrical_system.rate_of_physical_cost;
        const plumbingCost = mep.plumbing_system.lump_sum_cost;
        const totalPhysicalAndMEP = physicalSubtotal + electricalCost + plumbingCost;
        const permitCost = totalPhysicalAndMEP * a.other_costs.permit_design_rate_of_physical_cost;
        
        breakdown.other += electricalCost;
        breakdown.other += plumbingCost;
        breakdown.other += permitCost;

        // Hitung total dari breakdown
        const subtotal = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
        const contingency = subtotal * global.contingency_rate;
        breakdown.other += contingency; // Masukkan kontingensi ke 'other'
        
        const grandTotal = subtotal + contingency;

        return { total: grandTotal, breakdown: breakdown };
    },

    calculatePadelCapex(scenarioKey) {
        const scenario = projectConfig.padel.scenarios[scenarioKey];
        if (!scenario || !scenario.capex) return 0;
        
        const capex = scenario.capex;
        let grandTotal = 0;
        
        grandTotal += this._calculateTotal(capex.pre_operational || {});
        grandTotal += this._calculateTotal(capex.component_futsal_renovation || {});
        grandTotal += this._calculateTotal(capex.component_koperasi_new_build || {});
        
        if (capex.sport_courts_equipment) {
            const numCourts = scenario.num_courts;
            const equipment = capex.sport_courts_equipment;
            if (equipment.per_court_costs) {
                grandTotal += this._calculateTotal(equipment.per_court_costs) * numCourts;
            }
            if (equipment.initial_inventory) {
                grandTotal += this._calculateTotal(equipment.initial_inventory);
            }
        }
        
        return grandTotal;
    },

    calculateMeetingPointCapex(constructionScenarioKey, conceptScenarioKey) {
        const mpConfig = projectConfig.meetingPoint;
        let totalCapex = 0;

        // Hitung biaya konstruksi dasar jika scenarioKey bukan 'none'
        if (constructionScenarioKey !== 'none' && mpConfig.capex_scenarios.construction_scenarios[constructionScenarioKey]) {
            totalCapex += this._calculateTotal(mpConfig.capex_scenarios.construction_scenarios[constructionScenarioKey].base_costs);
        }
        
        // Hitung biaya konsep jika scenarioKey bukan 'none'
        if (conceptScenarioKey !== 'none' && mpConfig.capex_scenarios.concept_scenarios[conceptScenarioKey]) {
            const unitCosts = mpConfig.unit_costs;
            const conceptData = mpConfig.capex_scenarios.concept_scenarios[conceptScenarioKey].items;
            const conceptCostMap = {
                chairs: unitCosts.chair, table_2pax: unitCosts.table_2pax, tables_4pax: unitCosts.table_4pax,
                sofas: unitCosts.sofa, coffee_tables: unitCosts.coffee_table, meeting_pods: unitCosts.meeting_pod,
                vip_partitions: unitCosts.vip_partition, vip_tables: unitCosts.vip_table, vip_chairs: unitCosts.vip_chair,
                kitchen: unitCosts.kitchen_equipment_lump_sum, toilet: unitCosts.toilet_unit_lump_sum
            };
            for (const itemKey in conceptData) {
                const count = conceptData[itemKey];
                if (count > 0 && conceptCostMap[itemKey]) {
                    totalCapex += count * conceptCostMap[itemKey];
                }
            }
        }
        
        return totalCapex;
    },

    getUnitRevenue(unitName, padelScenarioKey = 'four_courts_combined') {
        const unit = projectConfig[unitName];
        if (!unit) return 0;

        let numAssets, revenueConf, o;

        if (unitName === 'padel') {
            const scenarioConfig = unit.scenarios[padelScenarioKey];
            if (!scenarioConfig) return 0;
            numAssets = scenarioConfig.num_courts;
            revenueConf = scenarioConfig.revenue;
            o = scenarioConfig.operational_assumptions;
        } else {
            numAssets = unit.revenue.main_revenue.bays;
            revenueConf = unit.revenue;
            o = unit.operational_assumptions;
        }

        const m = revenueConf.main_revenue;
        const a = revenueConf.ancillary_revenue;
        let monthlyRevenueMain = 0, fnbRevenueMonthly = 0;

        if (unitName === 'drivingRange') {
            const sessions_wd = numAssets * m.occupancy_rate_per_day.weekday;
            const sessions_we = numAssets * m.occupancy_rate_per_day.weekend;
            const total_sessions = (sessions_wd * o.workdays_in_month) + (sessions_we * o.weekend_days_in_month);
            monthlyRevenueMain = total_sessions * m.price_per_100_balls;
            fnbRevenueMonthly = total_sessions * a.fnb_avg_spend;
        } else if (unitName === 'padel') {
            const hours_wd_off = numAssets * m.hours_distribution_per_day.offpeak * m.occupancy_rate.weekday_offpeak;
            const hours_wd_peak = numAssets * m.hours_distribution_per_day.peak * m.occupancy_rate.weekday_peak;
            const hours_we = numAssets * o.operational_hours_per_day * m.occupancy_rate.weekend;
            const revenue_wd = (hours_wd_off * m.price_per_hour.weekday_offpeak) + (hours_wd_peak * m.price_per_hour.weekday_peak);
            const revenue_we = hours_we * m.price_per_hour.weekend;
            monthlyRevenueMain = (revenue_wd * o.workdays_in_month) + (revenue_we * o.weekend_days_in_month);
            const total_hours = (hours_wd_off + hours_wd_peak) * o.workdays_in_month + hours_we * o.weekend_days_in_month;
            fnbRevenueMonthly = total_hours * a.fnb_avg_spend;
        }
        const monthlyRevenueTotal = monthlyRevenueMain + fnbRevenueMonthly + (a.pro_shop_sales || 0);
        return monthlyRevenueTotal * 12;
    }
};

window.sierMathCosting = sierMathCosting;