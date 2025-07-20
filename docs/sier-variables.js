// File: sier-variables.js

// Objek konfigurasi utama yang menampung semua asumsi proyek.
const projectConfig = {};

// ====================================================================
// BAGIAN BARU: Parameter Fisik & Lokasi (Berdasarkan PDF & Pengukuran)
// Semua data di bawah ini berasal dari analisis gambar teknis dan Google Earth.
// ====================================================================
projectConfig.site_parameters = {
    driving_range: {
        // DIUBAH: Panjang bangunan tempat bay berada (dari PDF detail).
        building_length_m: 72,
        // Ini adalah jarak pukul efektif ke arah danau.
        field_length_m: 235,
        // Asumsi lebar per bay, bisa diubah.
        bay_width_m: 2.5,
        // Asumsi jumlah lantai/tingkat driving range.
        levels: 2,
    },
    padel: {
        total_available_area_m2: 1157, // Dari PDF "Layout Zonasi".
        area_per_court_m2: 260,        // Asumsi area per lapangan termasuk runoff.
    }
};


// ====================================================================
// Asumsi Finansial & Operasional Global
// ====================================================================
projectConfig.assumptions = {
    tax_rate_profit: 0.22,
    discount_rate_wacc: 0.12,
    contingency_rate: 0.10,
    depreciation_years: {
        building: 20,
        civil_construction: 15,
        equipment: 5,
        interior: 7,
    }
};


// ====================================================================
// Konfigurasi Unit Bisnis DRIVING RANGE
// ====================================================================
projectConfig.drivingRange = {
    operational_assumptions: { workdays_in_month: 22, weekend_days_in_month: 8, cogs_rate_fnb: 0.40 },
    revenue: {
        main_revenue: {
            // DIUBAH: Logika perhitungan bay sekarang berdasarkan parameter fisik bangunan.
            bays: Math.floor(projectConfig.site_parameters.driving_range.building_length_m / projectConfig.site_parameters.driving_range.bay_width_m) * projectConfig.site_parameters.driving_range.levels,
            price_per_100_balls: 120000,
            occupancy_rate_per_day: { weekday: 2.0, weekend: 5.0 }
        },
        ancillary_revenue: { fnb_avg_spend: 35000, pro_shop_sales: 15000000 }
    },
    opexMonthly: { salaries_wages: { manager: { count: 1, salary: 12000000 }, supervisor: { count: 2, salary: 7000000 }, admin_cashier: { count: 3, salary: 5000000 }, coach_trainer: { count: 2, salary: 6000000 }, cleaning_security: { count: 4, salary: 4000000 } }, utilities: { electricity_kwh_price: 1700, electricity_kwh_usage: 12000, water_etc: 5000000 }, marketing_promotion: 15000000, maintenance_repair: 12000000, rent_land: 33000000, other_operational: 10000000 },
    capex_assumptions: {
        // KLARIFIKASI: Angka ini adalah placeholder untuk pemodelan biaya dan bukan dari
        // gambar teknik sipil. Angka ini harus divalidasi oleh konsultan perencana.
        reclamation: { area_m2: 1000, lake_depth_m: 4.0, cost_per_m3: 350000, sheet_pile_perimeter_m: 140, cost_per_m_sheet_pile: 2500000 },
        piling: { points_count: 80, length_per_point_m: 16, cost_per_m_mini_pile: 275000, lump_sum_pile_cap: 250000000 },

        building: {
            // DIUBAH: Area bangunan sesuai PDF.
            dr_bays_area_m2: 4361,
            dr_bays_cost_per_m2: 2500000,
            cafe_area_m2: 267,
            cafe_cost_per_m2: 5000000
        },
        equipment: {
            // BARU: Logika Bay Premium vs Normal
            premium_bays: {
                percentage_of_total: 0.4, // Asumsi 40% dari total bay adalah premium
                cost_per_bay_ball_tracker: 120000000,
                cost_per_bay_dispenser: 25000000, // Biaya sistem dispenser per bay premium
            },
            normal_bays: {
                bay_equipment_cost_per_set: 5000000, // Biaya matras & partisi standar
            },
            floating_balls_count: 8000,
            floating_balls_cost_per_ball: 20000,
            ball_management_system_lump_sum: 200000000 // Sistem kolektor bola, dll.
        },
        safety_net: {
            // DIUBAH: Sesuai data baru dari gambar
            field_length_m: 227, // Garis ungu
            field_width_m: 73,   // Dihitung dari total panjang jaring (527 - 227 - 227)
            netting: {
                cost_per_m2: 150000,
            },
            poles: {
                spacing_m: 20,
                height_distribution: {
                    far_side_m: 12,
                    // DIUBAH: Ketinggian sisi kiri dan kanan disamakan
                    left_right_side_m: 8,
                },
                foundation_cost_per_pole: 25000000,
            }
        },
        other_costs: {
            mep_rate_of_building_cost: 0.25,
            permit_design_rate_of_physical_cost: 0.08
        }
    }
};

// ====================================================================
// Konfigurasi Unit Bisnis PADEL
// ====================================================================
projectConfig.padel = {
    operational_assumptions: { workdays_in_month: 22, weekend_days_in_month: 8, operational_hours_per_day: 18, cogs_rate_fnb: 0.30 },
    revenue: {
        main_revenue: {
            // DIUBAH: Jumlah lapangan sekarang dihitung secara dinamis.
            courts: Math.floor(projectConfig.site_parameters.padel.total_available_area_m2 / projectConfig.site_parameters.padel.area_per_court_m2),
            price_per_hour: { weekday_offpeak: 250000, weekday_peak: 350000, weekend: 400000 },
            occupancy_rate: { weekday_offpeak: 0.30, weekday_peak: 0.85, weekend: 0.90 },
            hours_distribution_per_day: { offpeak: 10, peak: 8 }
        },
        ancillary_revenue: { fnb_avg_spend: 50000, pro_shop_sales: 20000000 }
    },
    capex: { land_acquisition: 1500000000, civil_construction: 1000000000, building_main: 800000000, equipment_sport: 350000000, interior_finishing: 300000000, pre_operational: 100000000 },
    opexMonthly: { salaries_wages: { manager: { count: 1, salary: 10000000 }, supervisor: { count: 2, salary: 6500000 }, admin_cashier: { count: 4, salary: 5000000 }, cleaning_security: { count: 4, salary: 4000000 } }, utilities: { electricity_kwh_price: 1700, electricity_kwh_usage: 18000, water_etc: 5000000 }, marketing_promotion: 15000000, maintenance_repair: 10000000, rent_land: 25000000, other_operational: 8000000 }
};