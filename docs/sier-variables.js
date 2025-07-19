const projectConfig = {
    assumptions: {
        tax_rate_profit: 0.22,
        discount_rate_wacc: 0.12,
        contingency_rate: 0.10,
        depreciation_years: {
            building: 20,
            civil_construction: 15,
            equipment: 5,
            interior: 7,
        }
    },
    drivingRange: {
        operational_assumptions: { workdays_in_month: 22, weekend_days_in_month: 8, cogs_rate_fnb: 0.40 },
        revenue: { main_revenue: { bays: 30, price_per_100_balls: 120000, occupancy_rate_per_day: { weekday: 2.0, weekend: 5.0 } }, ancillary_revenue: { fnb_avg_spend: 35000, pro_shop_sales: 15000000 } },
        opexMonthly: { salaries_wages: { manager: { count: 1, salary: 12000000 }, supervisor: { count: 2, salary: 7000000 }, admin_cashier: { count: 3, salary: 5000000 }, coach_trainer: { count: 2, salary: 6000000 }, cleaning_security: { count: 4, salary: 4000000 } }, utilities: { electricity_kwh_price: 1700, electricity_kwh_usage: 12000, water_etc: 5000000 }, marketing_promotion: 15000000, maintenance_repair: 12000000, rent_land: 33000000, other_operational: 10000000 },
        capex_assumptions: {
            reclamation: { area_m2: 4000, lake_depth_m: 4.0, cost_per_m3: 350000, sheet_pile_perimeter_m: 250, cost_per_m_sheet_pile: 2500000 },
            piling: { points_count: 160, length_per_point_m: 16, cost_per_m_mini_pile: 275000, lump_sum_pile_cap: 450000000 },
            building: { dr_bays_area_m2: 3204, dr_bays_cost_per_m2: 2500000, cafe_area_m2: 267, cafe_cost_per_m2: 5000000 },
            equipment: { ball_tracker_bays_count: 12, ball_tracker_cost_per_bay: 120000000, ball_dispenser_system_lump_sum: 300000000, bay_equipment_sets_count: 12, bay_equipment_cost_per_set: 25000000, floating_balls_count: 8000, floating_balls_cost_per_ball: 20000, ball_management_system_lump_sum: 200000000, safety_net_area_m2: 2500, safety_net_cost_per_m2: 150000 },
            other_costs: { mep_rate_of_building_cost: 0.25, permit_design_rate_of_physical_cost: 0.08 }
        }
    },
    padel: {
        operational_assumptions: { workdays_in_month: 22, weekend_days_in_month: 8, operational_hours_per_day: 18, cogs_rate_fnb: 0.30 },
        revenue: { main_revenue: { courts: 4, price_per_hour: { weekday_offpeak: 250000, weekday_peak: 350000, weekend: 400000 }, occupancy_rate: { weekday_offpeak: 0.30, weekday_peak: 0.85, weekend: 0.90 }, hours_distribution_per_day: { offpeak: 10, peak: 8 } }, ancillary_revenue: { fnb_avg_spend: 50000, pro_shop_sales: 20000000 } },
        capex: { land_acquisition: 1500000000, civil_construction: 1000000000, building_main: 800000000, equipment_sport: 350000000, interior_finishing: 300000000, pre_operational: 100000000 },
        opexMonthly: { salaries_wages: { manager: { count: 1, salary: 10000000 }, supervisor: { count: 2, salary: 6500000 }, admin_cashier: { count: 4, salary: 5000000 }, cleaning_security: { count: 4, salary: 4000000 } }, utilities: { electricity_kwh_price: 1700, electricity_kwh_usage: 18000, water_etc: 5000000 }, marketing_promotion: 15000000, maintenance_repair: 10000000, rent_land: 25000000, other_operational: 8000000 }
    },
};