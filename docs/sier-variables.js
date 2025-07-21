// File: sier-variables.js
// VERSI TERVALIDASI - 20 Juli 2025

// Objek konfigurasi utama yang menampung semua asumsi proyek.
const projectConfig = {};

projectConfig.site_parameters = {
    driving_range: {
        building_length_m: 98,
        field_length_m: 235,
        bay_width_m: 3.5,
        levels: 2,
    },
    padel: {
        total_available_area_m2: 1157,
        area_per_court_m2: 260,
    }
};

projectConfig.digital_capex = {
    booking_system: {
        title: "Sistem Booking Online",
        notes: "Platform terpusat untuk Padel & Driving Range.",
        items: [
            { name: "Pengembangan & Lisensi Awal (Tahun Pertama)", quantity: 1, unit_cost: 75000000, brand_example: "Custom Dev / Ayo Indonesia" }
        ]
    },
    pos_system: {
        title: "Sistem Kasir (Point of Sale)",
        notes: "Sistem terpusat untuk F&B dan Pro Shop dengan beberapa titik hardware.",
        items: [
            { name: "Lisensi Software POS (Tahunan)", quantity: 1, unit_cost: 3000000, brand_example: "MokaPOS / Majoo" },
            { name: "Tablet Kasir Utama", quantity: 2, unit_cost: 5000000, brand_example: "Samsung Galaxy Tab / iPad" },
            { name: "Printer Struk Thermal", quantity: 2, unit_cost: 1500000, brand_example: "Epson / Star Micronics" },
            { name: "Cash Drawer (Laci Uang)", quantity: 2, unit_cost: 1000000, brand_example: "-" },
            { name: "Handheld Terminal (untuk F&B)", quantity: 2, unit_cost: 3500000, brand_example: "Sunmi / iMin" }
        ]
    },
    cctv_security: {
        title: "Sistem Keamanan CCTV",
        notes: "Mencakup area parkir, lounge, koridor, dan kasir.",
        items: [
            { name: "Kamera Indoor Dome 4MP", quantity: 8, unit_cost: 1200000, brand_example: "Hikvision / Dahua" },
            { name: "Kamera Outdoor Bullet 4MP", quantity: 8, unit_cost: 1500000, brand_example: "Hikvision / Dahua" },
            { name: "Network Video Recorder (NVR) 16 Channel + HDD", quantity: 1, unit_cost: 8000000, brand_example: "Hikvision" },
            { name: "Biaya Instalasi & Material", quantity: 1, unit_cost: 10000000, brand_example: "-" }
        ]
    },
    wifi_network: {
        title: "Infrastruktur Jaringan & WiFi",
        notes: "Menyediakan koneksi untuk operasional (POS, Ball Tracker) dan tamu.",
        items: [
            { name: "Access Point Indoor WiFi 6", quantity: 4, unit_cost: 2500000, brand_example: "Ubiquiti UniFi / TP-Link Omada" },
            { name: "Access Point Outdoor WiFi 6", quantity: 2, unit_cost: 3500000, brand_example: "Ubiquiti UniFi / TP-Link Omada" },
            { name: "Managed Switch & Router", quantity: 1, unit_cost: 8000000, brand_example: "MikroTik / Ubiquiti" },
            { name: "Biaya Instalasi & Kabel", quantity: 1, unit_cost: 5000000, brand_example: "-" }
        ]
    }
};

projectConfig.maintenance_plan = {
    driving_range: {
        title: "Pemeliharaan Driving Range",
        items: [
            {
                name: "Penggantian Bola Golf Apung",
                notes: "Stok bola diganti total setiap 12 bulan karena aus/hilang.",
                lifespan_months: 12,
                calculation: { type: "quantity_x_unit_cost", quantity_ref: "drivingRange.capex_assumptions.equipment.floating_balls_count", unit_cost_ref: "drivingRange.capex_assumptions.equipment.floating_balls_cost_per_ball" }
            },
            {
                name: "Penggantian Matras Bay (Normal)",
                notes: "Matras di bay normal diganti setiap 24 bulan.",
                lifespan_months: 24,
                calculation: { type: "quantity_x_unit_cost", quantity_calc: "normal_bays", unit_cost: 2500000 }
            },
            {
                name: "Perawatan Sistem Ball Tracker",
                notes: "Biaya servis tahunan, diasumsikan 5% dari total biaya CAPEX Ball Tracker.",
                lifespan_months: 12,
                calculation: { type: "percentage_of_capex", percentage: 0.05, capex_source: "ball_tracker_cost" }
            },
            {
                name: "Perbaikan & Perawatan Jaring",
                notes: "Alokasi dana tahunan untuk perbaikan minor, asumsi 10% dari biaya material jaring.",
                lifespan_months: 12,
                calculation: { type: "percentage_of_capex", percentage: 0.10, capex_source: "netting_material_cost" }
            }
        ]
    },
    padel: {
        title: "Pemeliharaan Lapangan Padel",
        items: [
            {
                name: "Perawatan & Penambahan Pasir Silika",
                notes: "Penambahan pasir untuk menjaga kualitas pantulan setiap 6 bulan.",
                lifespan_months: 6,
                calculation: { type: "area_x_rate_x_price", unit_count_ref: "padel.revenue.main_revenue.courts", area_m2_per_unit: 180, rate_kg_per_m2: 5, price_per_kg: 10000 }
            },
            {
                name: "Pembersihan Dinding Kaca Profesional",
                notes: "Layanan pembersihan bulanan.",
                lifespan_months: 1,
                calculation: { type: "quantity_x_unit_cost", quantity_ref: "padel.revenue.main_revenue.courts", unit_cost: 500000 }
            }
        ]
    },
    general: {
        title: "Pemeliharaan Umum & Fasilitas",
        items: [
            { name: "Servis AC & HVAC", notes: "Servis rutin setiap 3 bulan.", lifespan_months: 3, calculation: { type: "lump_sum", cost: 5000000 } },
            { name: "Perawatan Lanskap & Taman", notes: "Biaya bulanan untuk jasa pertamanan.", lifespan_months: 1, calculation: { type: "lump_sum", cost: 3000000 } },
            { name: "Pengecatan & Perbaikan Minor Gedung", notes: "Dana alokasi tahunan untuk perbaikan kecil.", lifespan_months: 12, calculation: { type: "lump_sum", cost: 20000000 } }
        ]
    }
};

projectConfig.assumptions = {
    tax_rate_profit: 0.22,
    discount_rate_wacc: 0.12,
    contingency_rate: 0.10,
    depreciation_years: {
        building: 20,
        civil_construction: 15,
        equipment: 5,
        interior: 7,
    },
    scenario_modifiers: {
        pessimistic_revenue: 0.85,
        optimistic_revenue: 1.15,
        pessimistic_opex: 1.05,
        optimistic_opex: 0.98
    }
};

projectConfig.drivingRange = {
    operational_assumptions: { 
        workdays_in_month: 22, 
        weekend_days_in_month: 8, 
        cogs_rate_fnb: 0.40,
        operational_hours_per_day: 16,
        avg_session_duration_minutes: 50,
        variable_costs_per_session: {
            electricity_dispenser_kwh: 0.05,
            ball_wear_cost_per_100_hits: 8000,
            cleaning_supplies: 500
        }
    },
    revenue: {
        main_revenue: {
            bays: Math.floor(projectConfig.site_parameters.driving_range.building_length_m / projectConfig.site_parameters.driving_range.bay_width_m) * projectConfig.site_parameters.driving_range.levels,
            price_per_100_balls: 135000,
            occupancy_rate_per_day: { weekday: 2.0, weekend: 5.0 }
        },
        ancillary_revenue: { fnb_avg_spend: 35000, pro_shop_sales: 15000000 }
    },
    opexMonthly: { salaries_wages: { manager: { count: 1, salary: 12000000 }, supervisor: { count: 2, salary: 7000000 }, admin_cashier: { count: 3, salary: 5000000 }, coach_trainer: { count: 2, salary: 6000000 }, cleaning_security: { count: 4, salary: 4000000 } }, utilities: { electricity_kwh_price: 1700, electricity_kwh_usage: 12000, water_etc: 5000000 }, marketing_promotion: 15000000, maintenance_repair: 12000000, other_operational: 10000000 },
    capex_assumptions: {
        reclamation: { area_m2: 1000, lake_depth_m: 4.0, cost_per_m3: 350000, sheet_pile_perimeter_m: 140, cost_per_m_sheet_pile: 2500000 },
        piling: { points_count: 80, length_per_point_m: 16, cost_per_m_mini_pile: 275000, lump_sum_pile_cap: 250000000 },
        building: {
            dr_bays_area_m2: 4361,
            dr_bays_cost_per_m2: 2500000,
            cafe_area_m2: 267,
            cafe_cost_per_m2: 5000000
        },
        equipment: {
            premium_bays: {
                percentage_of_total: 0.4,
                cost_per_bay_ball_tracker: 120000000,
                cost_per_bay_dispenser: 25000000,
            },
            normal_bays: {
                bay_equipment_cost_per_set: 5000000,
            },
            floating_balls_count: 8000,
            floating_balls_cost_per_ball: 20000,
            ball_management_system_lump_sum: 200000000
        },
        safety_net: {
            total_perimeter_m: 527,
            field_length_m: projectConfig.site_parameters.driving_range.field_length_m, 
            get field_width_m() { return this.total_perimeter_m - (this.field_length_m * 2); },
            netting: { cost_per_m2: 150000, },
            poles: {
                spacing_m: 20,
                height_distribution: { far_side_m: 12, left_right_side_m: 8 },
                foundation_cost_per_pole: 25000000,
            }
        },
        mep_systems: {
            hvac_system: { cost_per_m2_hvac: 750000, },
            electrical_system: { rate_of_physical_cost: 0.15, },
            plumbing_system: { lump_sum_cost: 150000000, }
        },
        other_costs: { permit_design_rate_of_physical_cost: 0.08 }
    }
};

projectConfig.padel = {
    operational_assumptions: { 
        workdays_in_month: 22, 
        weekend_days_in_month: 8, 
        operational_hours_per_day: 18, 
        cogs_rate_fnb: 0.30,
        downtime_per_hour_minutes: 10,
        variable_costs_per_hour: {
            court_lights_kw: 4.5,
            ball_replacement_cost_per_hour: 5000,
            cleaning_supplies: 2500
        }
    },
    revenue: {
        main_revenue: {
            courts: Math.floor(projectConfig.site_parameters.padel.total_available_area_m2 / projectConfig.site_parameters.padel.area_per_court_m2),
            price_per_hour: { weekday_offpeak: 250000, weekday_peak: 350000, weekend: 400000 },
            occupancy_rate: { weekday_offpeak: 0.30, weekday_peak: 0.85, weekend: 0.90 },
            hours_distribution_per_day: { offpeak: 10, peak: 8 }
        },
        ancillary_revenue: { fnb_avg_spend: 50000, pro_shop_sales: 20000000 }
    },
    capex: {
        pre_operational: {
            permits_and_consulting: 50000000,
            initial_marketing: 50000000
        },
        civil_construction: { 
            land_preparation: 1500000000, // Asumsi ini mungkin termasuk pondasi dasar
            foundation_works_per_court: 25000000 // Pondasi spesifik untuk struktur lapangan
        },
        building_structure: { // Struktur atap dan penutup bangunan utama
             main_building_structure_cost: 800000000 
        },
        sport_courts_equipment: {
            notes: "Biaya untuk membangun dan melengkapi lapangan Padel dari nol.",
            per_court_costs: {
                steel_structure: 95000000,
                tempered_glass_12mm: 140000000,
                artificial_turf_carpet: 55000000,
                lighting_system_8_lamps: 30000000,
                net_and_posts: 7500000
            },
            initial_inventory: {
                rental_rackets: {
                    quantity: 20,
                    unit_cost: 1000000
                },
                ball_tubes: {
                    quantity: 50, // 50 tabung @ 3 bola
                    unit_cost: 120000
                }
            }
        }
    },
    opexMonthly: { salaries_wages: { manager: { count: 1, salary: 10000000 }, supervisor: { count: 2, salary: 6500000 }, admin_cashier: { count: 4, salary: 5000000 }, cleaning_security: { count: 4, salary: 4000000 } }, utilities: { electricity_kwh_price: 1700, electricity_kwh_usage: 18000, water_etc: 5000000 }, marketing_promotion: 15000000, maintenance_repair: 10000000, other_operational: 8000000 }
};

projectConfig.shared_facilities_capex = {
    title: "Biaya Investasi Fasilitas Umum (Shared)",
    notes: "Biaya ini digunakan bersama oleh Driving Range dan Padel, dan dialokasikan sebagai biaya proyek umum.",
    building_and_interior: {
        area_m2: {
            lobby_reception: 50,
            pro_shop: 40,
            lockers_showers_toilets: 80,
            mushola: 30
        },
        construction_and_finishing_cost_per_m2: 4500000
    },
    equipment_and_furniture: {
        lobby_reception_furniture: 50000000,
        pro_shop_fixtures_and_displays: 30000000,
        lockers: {
            quantity: 50,
            unit_cost: 1500000
        },
        mushola_fittings_and_carpets: 15000000
    }
};