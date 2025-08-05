// File: sier-variables.js add sensitivity
const projectConfig = {};

projectConfig.site_parameters = {
    driving_range: {
        building_length_m: 98,
        field_length_m: 235,
        bay_width_m: 3.5,
        levels: 1,
    },
    padel: {
        total_available_area_m2: 1157,
        area_per_court_m2: 260,
        demolition_area_koperasi_m2: 293
    },
    shared_facilities: {
        parking_spots: 13,
        access_road_area_m2: 90
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
    financing_scenarios: {
        full_equity: {
            title: "100% Modal Sendiri (SIER)",
            equity_portion: 1.0,
            loan_portion: 0.0,
            interest_rate: 0,
            loan_period_years: 5,
        },
        debt_and_equity: {
            title: "60% Hutang & 40% Modal",
            equity_portion: 0.40,
            loan_portion: 0.60,
            interest_rate: 0.12,
            loan_period_years: 5,
        }
    },
    get financing() {
        return this.financing_scenarios.full_equity;
    },
    escalation: {
        tariff_increase_rate: 0.05,
        tariff_increase_every_x_years: 2,
        salary_increase_rate: 0.065,
    },
    scenario_modifiers: {
        pessimistic_revenue: 0.85,
        optimistic_revenue: 1.15,
        pessimistic_opex: 1.05,
        optimistic_opex: 0.98
    },
    sensitivity_analysis: {
        revenue_steps: [0.8, 0.9, 1.0, 1.1, 1.2, 1.3],
        investment_steps: [0.8, 0.9, 1.0, 1.1, 1.2]
    },
};

projectConfig.drivingRange = {
    scenarios: {
        include_lake_roof_net: false // Ubah ke 'false' untuk skenario tanpa jaring
    },
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
            price_per_ball: {
                weekday_50: 75000,
                weekday_100: 100000,
                weekend_50: 80000,
                weekend_100: 130000,
            },
            price_per_100_balls: 130000,
            occupancy_rate_per_day: { weekday: 2.0, weekend: 5.0 }
        },
        ancillary_revenue: { 
            fnb_avg_spend: 35000, 
            pro_shop_sales: 15000000,
            stick_rental: {
                individual: 50000,
                full_set: 200000,
            },
            membership: {
                annual_fee: 1000000,
                expected_members_of_potential: 0.01 // 1% dari potensi hunian
            }
        }
    },
    opexMonthly: { salaries_wages: { manager: { count: 1, salary: 12000000 }, supervisor: { count: 2, salary: 7000000 }, admin_cashier: { count: 3, salary: 5000000 }, coach_trainer: { count: 2, salary: 6000000 }, cleaning_security: { count: 4, salary: 4000000 } }, utilities: { electricity_kwh_price: 1700, electricity_kwh_usage: 12000, water_etc: 5000000 }, marketing_promotion: 15000000, maintenance_repair: 12000000, other_operational: 10000000 },
    capex_assumptions: {
        reclamation: { area_m2: 1000, lake_depth_m: 4.0, cost_per_m3: 350000, sheet_pile_perimeter_m: 140, cost_per_m_sheet_pile: 2500000 },
        piling: { points_count: 80, length_per_point_m: 16, cost_per_m_mini_pile: 275000, lump_sum_pile_cap: 250000000 },
        building: {
            dr_bays_area_m2: 4361,
            dr_bays_cost_per_m2: 2500000,
            cafe_area_m2: 267,
            cafe_cost_per_m2: 5000000,
            lockers_mushola_area_m2: 150,
            lockers_mushola_cost_per_m2: 3500000
        },
        equipment: {
            premium_bays: { percentage_of_total: 0.4, cost_per_bay_ball_tracker: 120000000, cost_per_bay_dispenser: 25000000, },
            normal_bays: { bay_equipment_cost_per_set: 5000000, },
            floating_balls_count: 8000,
            floating_balls_cost_per_ball: 20000,
            ball_management_system_lump_sum: 200000000
        },
        safety_net: {
            total_perimeter_m: 527,
            field_length_m: projectConfig.site_parameters.driving_range.field_length_m, 
            get field_width_m() { return this.total_perimeter_m - (this.field_length_m * 2); },
            netting: { cost_per_m2: 150000, },
            poles: { spacing_m: 20, height_distribution: { far_side_m: 12, left_right_side_m: 8 }, foundation_cost_per_pole: 25000000, }
            lake_roof_netting: {
                area_m2: 235 * 85,
                cost_per_m2: 125000
            }
        },
        plumbing_and_sanitary: {
            unit_costs: {
                toilet_bowl: 3500000,
                urinal: 2500000,
                sink: 2000000
            },
            male_toilet: {
                toilets: 4,
                urinals: 4,
                sinks: 4
            },
            female_toilet: {
                toilets: 4,
                sinks: 7
            }
        },
        bay_furniture: {
            cost_per_bay: 4500000
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
    scenarios: {
        two_courts_futsal_renovation: {
            title: "Skenario 1: 2 Lapangan (Renovasi Futsal)",
            description: "Memanfaatkan struktur bangunan eksisting lapangan futsal untuk efisiensi biaya dan kecepatan implementasi. Fokus pada validasi pasar awal.",
            num_courts: 2,
            operational_assumptions: {
                workdays_in_month: 22,
                weekend_days_in_month: 8,
                operational_hours_per_day: 15,
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
                    price_per_hour: {
                        weekday_offpeak: 250000,
                        weekday_peak: 350000,
                        weekend: 350000
                    },
                    occupancy_rate: {
                        weekday_offpeak: 0.30,
                        weekday_peak: 0.85,
                        weekend: 0.90
                    },
                    hours_distribution_per_day: {
                        offpeak: 9,
                        peak: 6
                    }
                },
                ancillary_revenue: {
                    fnb_avg_spend: 50000,
                    pro_shop_sales: 10000000,
                    equipment_rental: {
                        expected_renters_percentage: 0.90,
                        price_per_rental: 50000
                    }
                }
            },
            capex: {
                title: "Estimasi Biaya Investasi - Skenario 2 Lapangan",
                pre_operational: {
                    permits_and_consulting: 25000000,
                    initial_marketing: 30000000
                },
                renovation_futsal: {
                    minor_demolition_and_clearing: { lump_sum: 15000000 },
                    toilet_demolition_and_relocation: { lump_sum: 20000000 },
                    floor_repair_and_leveling: { area_m2: 500, cost_per_m2: 150000 },
                    interior_finishing_painting: { area_m2: 500, cost_per_m2: 200000 }
                },
                sport_courts_equipment: {
                    per_court_costs: {
                        steel_structure: 95000000,
                        tempered_glass_12mm: 140000000,
                        artificial_turf_carpet: 55000000,
                        lighting_system_8_lamps: 30000000,
                        net_and_posts: 7500000
                    },
                    initial_inventory: {
                        rental_rackets: { quantity: 10, unit_cost: 1000000 },
                        ball_tubes: { quantity: 25, unit_cost: 120000 }
                    }
                }
            },
            opexMonthly: {
                salaries_wages: {
                    manager: { count: 1, salary: 10000000 },
                    supervisor: { count: 1, salary: 6500000 },
                    admin_cashier: { count: 2, salary: 5000000 },
                    cleaning_security: { count: 2, salary: 4000000 }
                },
                utilities: {
                    electricity_kwh_price: 1700,
                    electricity_kwh_usage: 9000,
                    water_etc: 3000000
                },
                marketing_promotion: 10000000,
                maintenance_repair: 5000000,
                other_operational: 6000000
            }
        },
        four_courts_combined: {
            title: "Skenario 2: 4 Lapangan (Kombinasi Renovasi & Bangun Baru)",
            description: "Skenario ekspansi penuh yang menggabungkan renovasi dan pembangunan baru.",
            num_courts: 4,
            operational_assumptions: {
                workdays_in_month: 22,
                weekend_days_in_month: 8,
                operational_hours_per_day: 15,
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
                    price_per_hour: {
                        weekday_offpeak: 250000,
                        weekday_peak: 350000,
                        weekend: 350000
                    },
                    occupancy_rate: {
                        weekday_offpeak: 0.30,
                        weekday_peak: 0.85,
                        weekend: 0.90
                    },
                    hours_distribution_per_day: {
                        offpeak: 9,
                        peak: 6
                    }
                },
                ancillary_revenue: {
                    fnb_avg_spend: 50000,
                    pro_shop_sales: 20000000,
                    equipment_rental: {
                        expected_renters_percentage: 0.90,
                        price_per_rental: 50000
                    }
                }
            },
            capex: {
                title: "Estimasi Biaya Investasi - Skenario 4 Lapangan",
                pre_operational: {
                    permits_and_consulting: 40000000,
                    initial_marketing: 45000000
                },
                component_futsal_renovation: {
                    minor_demolition_and_clearing: { lump_sum: 15000000 },
                    toilet_demolition_and_relocation: { lump_sum: 20000000 },
                    floor_repair_and_leveling: { area_m2: 500, cost_per_m2: 150000 },
                    interior_finishing_painting: { area_m2: 500, cost_per_m2: 200000 }
                },
                component_koperasi_new_build: {
                    land_preparation_and_foundation: { area_m2: 600, cost_per_m2: 400000 },
                    building_structure_2_courts: { area_m2: 600, cost_per_m2: 2000000 },
                    interior_and_facade: { lump_sum: 250000000 }
                    building_demolition: { 
                        area_m2: projectConfig.site_parameters.padel.demolition_area_koperasi_m2, 
                        cost_per_m2: 250000
                    },
                    plumbing_and_sanitary: {
                        toilet_unit: 4,
                        area_m2: 3.2, // (4 unit toilet x (1.6m x 2.0m))
                        cost_per_m2: 7812500
                    }
                },
                sport_courts_equipment: {
                    per_court_costs: {
                        steel_structure: 95000000,
                        tempered_glass_12mm: 140000000,
                        artificial_turf_carpet: 55000000,
                        lighting_system_8_lamps: 30000000,
                        net_and_posts: 7500000
                    },
                    initial_inventory: {
                        rental_rackets: { quantity: 20, unit_cost: 1000000 },
                        ball_tubes: { quantity: 50, unit_cost: 120000 }
                    }
                }
            },
            opexMonthly: {
                salaries_wages: {
                    manager: { count: 1, salary: 10000000 },
                    supervisor: { count: 2, salary: 6500000 },
                    admin_cashier: { count: 4, salary: 5000000 },
                    cleaning_security: { count: 4, salary: 4000000 }
                },
                utilities: {
                    electricity_kwh_price: 1700,
                    electricity_kwh_usage: 18000,
                    water_etc: 5000000
                },
                marketing_promotion: 15000000,
                maintenance_repair: 10000000,
                other_operational: 8000000
            }
        }
    }
};

projectConfig.shared_facilities_capex = {
    title: "Biaya Investasi Fasilitas Umum (Shared)",
    notes: "Biaya ini digunakan bersama oleh Driving Range dan Padel, dan dialokasikan sebagai biaya proyek umum. Ini adalah fasilitas yang berdiri sendiri terpisah dari bangunan utama DR dan Padel.",
    cafe: {
        title: "Kafe & Titik Pertemuan (267 m²)",
        area_m2: 267,
        items: {
            construction: { description: "Konstruksi & Finishing Interior", quantity: 267, unit: "m²", unit_cost: 4000000 },
            kitchen_equipment: { description: "Peralatan Dapur & Bar Profesional", lump_sum: 150000000 },
            furniture: { description: "Furnitur (Meja, Kursi, Sofa)", lump_sum: 80000000 }
        }
    },
    parking_area: {
        title: "Area Parkir (607.5 m²)",
        area_m2: 607.5,
        items: {
            paving: { description: "Perkerasan (Paving Block/Aspal)", quantity: 607.5, unit: "m²", unit_cost: 250000 },
            lighting: { description: "Tiang Lampu & Instalasi Penerangan", quantity: 10, unit: "titik", unit_cost: 5000000 },
            marking: { description: "Pengecatan Marka Parkir", lump_sum: 10000000 }
        }
    },
    road_access: {
        title: "Akses Jalan (217.5 m²)",
        area_m2: 217.5,
        items: {
            paving: { description: "Perkerasan Jalan Akses", quantity: 217.5, unit: "m²", unit_cost: 300000 }
        }
    }
};

projectConfig.meetingPoint = {
    unit_costs: {
        chair: 1200000,
        table_2pax: 1800000,
        table_4pax: 2500000,
        sofa: 7500000,
        coffee_table: 2000000,
        meeting_pod: 35000000,
        vip_partition: 15000000,
        vip_table: 8000000,
        vip_chair: 2500000,
        kitchen_equipment_lump_sum: 75000000,
        toilet_unit_lump_sum: 30000000
    },
    operational_assumptions: {
        workdays_in_month: 22,
        weekend_days_in_month: 8,
        cogs_rate_fnb: 0.45
    },
    revenue: {
        meeting_rooms: {
            small_pod_4pax: { count: 4, price_per_hour: 150000, occupancy_rate: 0.30 },
            medium_room_8pax: { count: 2, price_per_hour: 250000, occupancy_rate: 0.35 },
            training_room_20pax: { count: 1, price_per_hour: 500000, occupancy_rate: 0.25 }
        },
        coworking: {
            daily_pass_seats: { count: 15, price_per_day: 100000, occupancy_rate: 0.40 }
        },
        virtual_office: {
            packages: { count: 50, avg_price_per_month: 350000 }
        },
        ancillary: {
            fnb_lounge_sales_monthly: 30000000
        }
    },
    opexMonthly: {
        salaries_wages: {
            community_manager: { count: 1, salary: 9000000 },
            front_desk_admin: { count: 2, salary: 5000000 },
            barista_staff: { count: 2, salary: 4500000 },
            cleaning_security: { count: 2, salary: 4000000 }
        },
        utilities: {
            electricity_kwh_price: 1700,
            electricity_kwh_usage: 8000,
            internet_dedicated: 5000000,
            water_etc: 3000000
        },
        marketing_promotion: 10000000,
        maintenance_repair: 5000000,
        other_operational: 7000000
    },
    capex_scenarios: {
        construction_scenarios: {
            renovate: {
                title: "Metode 1: Renovasi Gedung Arsip",
                base_costs: {
                    permits_and_consulting: 40000000,
                    structural_reinforcement: { lump_sum: 150000000 },
                    mep_upgrade_hvac: { area_m2: 109, cost_per_m2: 750000 },
                    facade_modernization: { lump_sum: 200000000 }
                }
            },
            rebuild: {
                title: "Metode 2: Bongkar & Bangun Ulang",
                base_costs: {
                    permits_and_consulting: 75000000,
                    building_demolition: { 
                        area_m2: 109,
                        cost_per_m2: 250000
                    },
                    foundation_and_structure: { area_m2: 109, cost_per_m2: 3000000 },
                    architecture_facade: { area_m2: 109, cost_per_m2: 2000000 }
                }
            }
        },        
        concept_scenarios: {
            concept_1_pods: {
                title: "Konsep 1: Business Lounge dengan Meeting Pods (Alternatif 01)",
                items: {
                    chairs: 20,
                    tables_4pax: 4,
                    tables_2pax: 2,
                    sofas: 2,
                    coffee_tables: 1,
                    meeting_pods: 4,
                    vip_rooms: 0,
                    kitchen: 1,
                    toilet: 1
                }
            },
            concept_2_open: {
                title: "Konsep 2: Open Space & Coworking (Alternatif 02)",
                items: {
                    chairs: 28,
                    tables_4pax: 6,
                    tables_2pax: 2,
                    sofas: 0,
                    coffee_tables: 0,
                    meeting_pods: 0,
                    vip_rooms: 0,
                    kitchen: 1,
                    toilet: 1
                }
            },
            concept_3_vip: {
                title: "Konsep 3: Area Meeting dengan Ruang VIP (Alternatif 03)",
                items: {
                    chairs: 16,
                    tables_4pax: 3,
                    tables_2pax: 2,
                    sofas: 0,
                    coffee_tables: 0,
                    meeting_pods: 0,
                    vip_rooms: 3,
                    vip_partitions: 3, // Dihitung terpisah dari renovasi
                    vip_tables: 3,
                    vip_chairs: 12,
                    kitchen: 1,
                    toilet: 1
                }
            }
        }
    }
};

projectConfig.shared_revenue = {
    title: "Pendapatan Bersama (Shared)",
    notes: "Pendapatan yang dihasilkan dari fasilitas umum yang digunakan oleh semua pengunjung.",
    parking_revenue: {
        spots: 13,
        avg_rate_per_day: 6000,
        occupancy_rate: 0.50,
        workdays_in_month: 22,
        weekend_days_in_month: 8
    }
};