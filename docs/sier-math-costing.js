// File: sier-math-costing.js hihih
const sierMathCosting = {

    // Fungsi _calculateTotal tetap di sini karena sangat erat kaitannya dengan perhitungan biaya
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
                return sum + this._calculateTotal(value);
            }
            return sum;
        }, 0);
    },

    calculateDrCapex() {
        const a = projectConfig.drivingRange.capex_assumptions;
        const global = projectConfig.assumptions;
        const rev = projectConfig.drivingRange.revenue.main_revenue;
        const drScenarios = projectConfig.drivingRange.scenarios;
        const total_bays = rev.bays;

        const eq = a.equipment;
        const premium_bays_count = Math.round(total_bays * eq.premium_bays.percentage_of_total);
        const normal_bays_count = total_bays - premium_bays_count;
        const totalEquipmentCost = (premium_bays_count * eq.premium_bays.cost_per_bay_ball_tracker) +
                                (premium_bays_count * eq.premium_bays.cost_per_bay_dispenser) +
                                (normal_bays_count * eq.normal_bays.bay_equipment_cost_per_set) +
                                (eq.floating_balls_count * eq.floating_balls_cost_per_ball) +
                                eq.ball_management_system_lump_sum;

        const net = a.safety_net;
        const totalPerimeterNetCost = (Math.ceil(net.field_width_m / net.poles.spacing_m) * net.poles.foundation_cost_per_pole) + (Math.ceil(net.field_length_m / net.poles.spacing_m) * 2 * net.poles.foundation_cost_per_pole) + ((net.field_width_m * net.poles.height_distribution.far_side_m) * net.netting.cost_per_m2) + ((net.field_length_m * net.poles.height_distribution.left_right_side_m * 2) * net.netting.cost_per_m2);
        const totalSafetyNetCost = totalPerimeterNetCost + (drScenarios.include_lake_roof_net ? (net.lake_roof_netting.area_m2 * net.lake_roof_netting.cost_per_m2) : 0);

        const totalBayFurnitureCost = total_bays * a.bay_furniture.cost_per_bay;
        const sanitary = a.plumbing_and_sanitary;
        const costs = sanitary.unit_costs;
        const totalSanitaryCost = (sanitary.male_toilet.toilets * costs.toilet_bowl) + (sanitary.male_toilet.urinals * costs.urinal) + (sanitary.male_toilet.sinks * costs.sink) + (sanitary.female_toilet.toilets * costs.toilet_bowl) + (sanitary.female_toilet.sinks * costs.sink);
        const bld = a.building;
        const totalBuildingCost = (bld.dr_bays_area_m2 * bld.dr_bays_cost_per_m2) + (bld.cafe_area_m2 * bld.cafe_cost_per_m2) + (bld.lockers_mushola_area_m2 * bld.lockers_mushola_cost_per_m2);

        const calculateScenarioCosts = (foundationCosts) => {
            const mep = a.mep_systems;
            const physical_cost_base = foundationCosts + totalBuildingCost + totalEquipmentCost + totalSafetyNetCost + totalBayFurnitureCost + totalSanitaryCost;
            const electrical_cost = physical_cost_base * mep.electrical_system.rate_of_physical_cost;
            const total_physical_cost = physical_cost_base + mep.plumbing_system.lump_sum_cost + electrical_cost;
            const permit_cost = total_physical_cost * a.other_costs.permit_design_rate_of_physical_cost;
            const subtotal = total_physical_cost + permit_cost;
            const contingency = subtotal * global.contingency_rate;

            return {
                total: subtotal + contingency,
                breakdown: {
                    civil_construction: foundationCosts + totalSafetyNetCost,
                    building: totalBuildingCost,
                    equipment_and_tech: totalEquipmentCost,
                    furniture_and_interior: totalBayFurnitureCost + totalSanitaryCost,
                    other: mep.plumbing_system.lump_sum_cost + electrical_cost + permit_cost + contingency
                }
            };
        };

        const pil = a.piling;
        const foundation_cost = (pil.points_count * pil.length_per_point_m * pil.cost_per_m_mini_pile) + pil.lump_sum_pile_cap;
        const results = calculateScenarioCosts(foundation_cost);
        
        return { total: results.total, breakdown: results.breakdown };
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
            // PERBAIKAN: Gunakan variabel 'equipment' lokal, bukan 'eq'
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
        if (!mpConfig || !mpConfig.capex_scenarios.construction_scenarios[constructionScenarioKey] || !mpConfig.capex_scenarios.concept_scenarios[conceptScenarioKey]) return 0;

        const unitCosts = mpConfig.unit_costs;
        let totalCapex = this._calculateTotal(mpConfig.capex_scenarios.construction_scenarios[constructionScenarioKey].base_costs);
        
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