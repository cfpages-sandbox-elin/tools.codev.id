// File: sier-variables.js
// Pusat semua asumsi, variabel, dan model perhitungan proyek (Versi Bottom-Up).

const projectConfig = {
    // ====================================================================
    // A. ASUMSI DASAR OPERASIONAL & KEUANGAN
    // ====================================================================
    assumptions: {
        // Asumsi Umum
        workdays_in_month: 22,
        weekend_days_in_month: 8,
        operational_hours_per_day: 18, // Misal dari jam 06:00 - 24:00
        
        // Asumsi Keuangan
        cogs_rate_fnb: 0.35,      // 35% dari pendapatan F&B
        tax_rate_profit: 0.22,    // 22% tarif PPh Badan
        depreciation_years: {
            building: 20,
            construction: 15,
            equipment: 5,
        },
        discount_rate_wacc: 0.12, // 12% WACC untuk NPV & IRR
        contingency_rate: 0.10,   // 10% dana darurat
    },

    // ====================================================================
    // B. MODEL BISNIS DRIVING RANGE
    // ====================================================================
    drivingRange: {
        // Unit Operasional
        bays: {
            count: 30,
            price_per_100_balls: 120000,
            occupancy: { // Berapa kali satu bay terjual dalam sehari
                weekday: 2.0, // Rata-rata 2 sesi per bay
                weekend: 5.0, // Rata-rata 5 sesi per bay
            }
        },
        // Asumsi Biaya & Investasi
        capex: {
            land: 2000000000,
            construction: 1500000000, // Struktur bay, netting, dll.
            building: 700000000,      // Lounge, office, toilet
            equipment: 400000000,     // Bola, matras, dispenser, F&B
        },
        opexMonthly: {
            salaries: 55000000,
            rent: 33000000,
            utilities: 25000000,
            marketing: 15000000,
            maintenance: 12000000,
            fnb_other_costs: 10000000, // Biaya operasional F&B di luar COGS
        },
        // Pendapatan Tambahan
        ancillary_revenue_per_visitor_fnb: 35000, // Rata-rata pengunjung beli F&B senilai 35rb
    },

    // ====================================================================
    // C. MODEL BISNIS PADEL
    // ====================================================================
    padel: {
        // Unit Operasional
        courts: {
            count: 4,
            price_per_hour: {
                weekday_offpeak: 250000,
                weekday_peak: 350000,
                weekend: 400000,
            },
            occupancy: { // Persentase jam terisi
                weekday_offpeak: 0.30, // 30% terisi di jam 06:00-16:00
                weekday_peak: 0.85,    // 85% terisi di jam 16:00-24:00
                weekend: 0.90,         // 90% terisi di weekend
            },
            hours_distribution: {
                offpeak_per_day: 10, // 06:00 - 16:00
                peak_per_day: 8,     // 16:00 - 24:00
            }
        },
        // Asumsi Biaya & Investasi
        capex: {
            land: 1500000000,
            construction: 1400000000, // 4 lapangan premium
            building: 800000000,      // Lounge, office, F&B, toilet
            equipment: 300000000,     // AC, Furnitur, Sistem Booking
        },
        opexMonthly: {
            salaries: 70000000,
            rent: 25000000,
            utilities: 35000000,
            marketing: 15000000,
            maintenance: 10000000,
            fnb_other_costs: 8000000,
        },
        // Pendapatan Tambahan
        ancillary_revenue_per_hour_booked: 50000, // Rata-rata per jam booking, ada pendapatan F&B 50rb
    },

    // ====================================================================
    // D. FUNGSI PERHITUNGAN (MODEL BISNIS)
    // ====================================================================
    calculations: {
        // Menghitung OMSET bulanan dari asumsi dasar
        getMonthlyRevenue() {
            // -- Driving Range --
            const dr = projectConfig.drivingRange;
            const a = projectConfig.assumptions;
            const dr_sessions_weekday = dr.bays.count * dr.bays.occupancy.weekday;
            const dr_sessions_weekend = dr.bays.count * dr.bays.occupancy.weekend;
            const dr_revenue_bays = (dr_sessions_weekday * a.workdays_in_month + dr_sessions_weekend * a.weekend_days_in_month) * dr.bays.price_per_100_balls;
            const dr_total_visitors = (dr_sessions_weekday * a.workdays_in_month) + (dr_sessions_weekend * a.weekend_days_in_month);
            const dr_revenue_fnb = dr_total_visitors * dr.ancillary_revenue_per_visitor_fnb;

            // -- Padel --
            const p = projectConfig.padel;
            const hours_weekday_offpeak = p.courts.count * p.courts.hours_distribution.offpeak_per_day * p.courts.occupancy.weekday_offpeak;
            const hours_weekday_peak = p.courts.count * p.courts.hours_distribution.peak_per_day * p.courts.occupancy.weekday_peak;
            const hours_weekend = p.courts.count * a.operational_hours_per_day * p.courts.occupancy.weekend;
            
            const padel_revenue_courts_weekday = (hours_weekday_offpeak * p.courts.price_per_hour.weekday_offpeak) + (hours_weekday_peak * p.courts.price_per_hour.weekday_peak);
            const padel_revenue_courts_weekend = hours_weekend * p.courts.price_per_hour.weekend;
            const padel_revenue_courts = (padel_revenue_courts_weekday * a.workdays_in_month) + (padel_revenue_courts_weekend * a.weekend_days_in_month);
            
            const total_hours_booked_monthly = (hours_weekday_offpeak + hours_weekday_peak) * a.workdays_in_month + hours_weekend * a.weekend_days_in_month;
            const padel_revenue_fnb = total_hours_booked_monthly * p.ancillary_revenue_per_hour_booked;

            return {
                drivingRange: {
                    bays: dr_revenue_bays,
                    fnb: dr_revenue_fnb,
                    total: dr_revenue_bays + dr_revenue_fnb
                },
                padel: {
                    courts: padel_revenue_courts,
                    fnb: padel_revenue_fnb,
                    total: padel_revenue_courts + padel_revenue_fnb
                },
                grandTotal: dr_revenue_bays + dr_revenue_fnb + padel_revenue_courts + padel_revenue_fnb
            };
        },

        // Menghitung total investasi dari data CapEx
        getTotalInvestment() {
            const drCapex = Object.values(projectConfig.drivingRange.capex).reduce((a, b) => a + b, 0);
            const padelCapex = Object.values(projectConfig.padel.capex).reduce((a, b) => a + b, 0);
            const subTotal = drCapex + padelCapex;
            const contingency = subTotal * projectConfig.assumptions.contingency_rate;
            return {
                total: subTotal + contingency,
                subTotal: subTotal,
                contingency: contingency,
                dr: {
                    total: drCapex,
                    ...projectConfig.drivingRange.capex
                },
                padel: {
                    total: padelCapex,
                    ...projectConfig.padel.capex
                }
            };
        },

        // Menghitung P&L tahunan berdasarkan skenario
        calculatePnl(revenueMultiplier = 1, opexMultiplier = 1) {
            const monthlyRevenue = this.getMonthlyRevenue();
            const annualRevenue = monthlyRevenue.grandTotal * 12 * revenueMultiplier;
            
            const annualAncillaryRevenue = (monthlyRevenue.drivingRange.fnb + monthlyRevenue.padel.fnb) * 12 * revenueMultiplier;
            const cogs = annualAncillaryRevenue * projectConfig.assumptions.cogs_rate_fnb;
            const grossProfit = annualRevenue - cogs;

            const drOpex = Object.values(projectConfig.drivingRange.opexMonthly).reduce((a, b) => a + b, 0);
            const padelOpex = Object.values(projectConfig.padel.opexMonthly).reduce((a, b) => a + b, 0);
            const annualOpex = (drOpex + padelOpex) * 12 * opexMultiplier;
            const ebitda = grossProfit - annualOpex;

            const investment = this.getTotalInvestment();
            const depr_building = (investment.dr.building + investment.padel.building) / projectConfig.assumptions.depreciation_years.building;
            const depr_construction = (investment.dr.construction + investment.padel.construction) / projectConfig.assumptions.depreciation_years.construction;
            const depr_equipment = (investment.dr.equipment + investment.padel.equipment) / projectConfig.assumptions.depreciation_years.equipment;
            const depreciation = depr_building + depr_construction + depr_equipment;

            const ebt = ebitda - depreciation;
            const tax = ebt > 0 ? ebt * projectConfig.assumptions.tax_rate_profit : 0;
            const netProfit = ebt - tax;
            const cashFlowFromOps = netProfit + depreciation;
            
            return { annualRevenue, cogs, grossProfit, annualOpex, ebitda, depreciation, ebt, tax, netProfit, cashFlowFromOps };
        },

        // Menghitung metrik kelayakan investasi
        getFeasibilityMetrics() {
            const totalInvestment = this.getTotalInvestment().total;
            const realisticPnl = this.calculatePnl();
            const cashFlow = realisticPnl.cashFlowFromOps;

            if (cashFlow <= 0) return { paybackPeriod: Infinity, npv: -totalInvestment, irr: -Infinity };
            
            const paybackPeriod = totalInvestment / cashFlow;
            const cashFlows = Array(20).fill(cashFlow); // Proyeksi 20 tahun agar lebih akurat
            const npv = cashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + projectConfig.assumptions.discount_rate_wacc, i + 1), 0) - totalInvestment;
            
            let irr = 0.0;
            for (let i = 0; i < 1.0; i += 0.001) { // Batas IRR 100%
                let tempNpv = cashFlows.reduce((acc, cf, j) => acc + cf / Math.pow(1 + i, j + 1), 0) - totalInvestment;
                if (tempNpv < 0) {
                    irr = i > 0 ? (i - 0.001) : 0;
                    break;
                }
            }
            return { paybackPeriod, npv, irr };
        }
    }
};