// File: sier-variables.js
// Pusat semua asumsi, variabel, dan model perhitungan proyek (Versi Final dengan Asumsi Terpisah).

const projectConfig = {
    // ====================================================================
    // KAMUS TERJEMAHAN (BARU)
    // ====================================================================
    keyTranslations: {
        // Asumsi Global
        'tax_rate_profit': 'Tarif Pajak Penghasilan',
        'discount_rate_wacc': 'Tingkat Diskonto (WACC)',
        'contingency_rate': 'Dana Darurat (Kontingensi)',
        // Asumsi Umum Unit Bisnis
        'workdays_in_month': 'Hari Kerja per Bulan',
        'weekend_days_in_month': 'Hari Libur per Bulan',
        'operational_hours_per_day': 'Jam Operasional per Hari',
        'cogs_rate_fnb': 'HPP (COGS) F&B',
        // Asumsi Driving Range
        'bays': 'Jumlah Bay',
        'price_per_100_balls': 'Harga per 100 Bola',
        'occupancy_per_day': 'Okupansi per Bay per Hari',
        'weekday': 'Hari Kerja',
        'weekend': 'Akhir Pekan',
        'ancillary_revenue_per_visitor': 'Pendapatan Tambahan per Pengunjung',
        // Asumsi Padel
        'courts': 'Jumlah Lapangan',
        'price_per_hour': 'Harga Sewa per Jam',
        'weekday_offpeak': 'Hari Kerja (Jam Sepi)',
        'weekday_peak': 'Hari Kerja (Jam Sibuk)',
        'occupancy_rate': 'Tingkat Okupansi',
        'hours_distribution_per_day': 'Distribusi Jam per Hari',
        'offpeak': 'Jam Sepi',
        'peak': 'Jam Sibuk',
        'ancillary_revenue_per_hour_booked': 'Pendapatan Tambahan per Jam Booking',
        // Opex
        'salaries': 'Gaji & Upah',
        'rent_allocation': 'Alokasi Sewa Lahan',
        'utilities': 'Utilitas (Listrik, Air, dll)',
        'marketing': 'Pemasaran & Promosi',
        'maintenance': 'Perawatan & Perbaikan',
        'fnb_other_costs': 'Biaya Lain-lain F&B',
    },
    // ====================================================================
    // A. ASUMSI UMUM & GLOBAL
    // ====================================================================
    assumptions: {
        // Asumsi Makro
        tax_rate_profit: 0.22,    // 22% tarif PPh Badan
        discount_rate_wacc: 0.12, // 12% WACC untuk NPV & IRR
        contingency_rate: 0.10,   // 10% dana darurat
    },

    // ====================================================================
    // B. MODEL BISNIS DRIVING RANGE
    // ====================================================================
    drivingRange: {
        // Asumsi Spesifik Driving Range
        assumptions: {
            workdays_in_month: 22,
            weekend_days_in_month: 8,
            cogs_rate_fnb: 0.40, // Asumsi COGS F&B di DR lebih tinggi (40%)
            ancillary_revenue_per_visitor: 35000,
        },
        // Unit Operasional
        units: {
            bays: 30,
            price_per_100_balls: 120000,
            occupancy_per_day: { // Rata-rata sesi per bay per hari
                weekday: 2.0,
                weekend: 5.0,
            }
        },
        // Investasi (CapEx)
        capex: {
            land: 2000000000,
            construction: 1500000000,
            building: 700000000,
            equipment: 400000000,
        },
        // Biaya Operasional Bulanan (OpEx)
        opexMonthly: {
            salaries: 55000000,
            rent_allocation: 33000000,
            utilities: 25000000,
            marketing: 15000000,
            maintenance: 12000000,
            fnb_other_costs: 10000000,
        },
         // Depresiasi
        depreciation_years: {
            building: 20,
            construction: 15,
            equipment: 5,
        },
    },

    // ====================================================================
    // C. MODEL BISNIS PADEL
    // ====================================================================
    padel: {
        // Asumsi Spesifik Padel
        assumptions: {
            workdays_in_month: 22,
            weekend_days_in_month: 8,
            operational_hours_per_day: 18,
            cogs_rate_fnb: 0.30, // Asumsi COGS F&B di Padel lebih rendah (30%) karena menu lebih simpel
            ancillary_revenue_per_hour_booked: 50000,
        },
        // Unit Operasional
        units: {
            courts: 4,
            price_per_hour: {
                weekday_offpeak: 250000,
                weekday_peak: 350000,
                weekend: 400000,
            },
            occupancy_rate: {
                weekday_offpeak: 0.30,
                weekday_peak: 0.85,
                weekend: 0.90,
            },
            hours_distribution_per_day: {
                offpeak: 10,
                peak: 8,
            }
        },
        // Investasi (CapEx)
        capex: {
            land: 1500000000,
            construction: 1400000000,
            building: 800000000,
            equipment: 300000000,
        },
        // Biaya Operasional Bulanan (OpEx)
        opexMonthly: {
            salaries: 70000000,
            rent_allocation: 25000000,
            utilities: 35000000,
            marketing: 15000000,
            maintenance: 10000000,
            fnb_other_costs: 8000000,
        },
         // Depresiasi
        depreciation_years: {
            building: 20,
            construction: 15,
            equipment: 5,
        },
    },

    // ====================================================================
    // D. FUNGSI PERHITUNGAN (MODEL BISNIS)
    // ====================================================================
    calculations: {
        getMonthlyRevenueForUnit(unit) {
            const unitConfig = projectConfig[unit];
            if (unit === 'drivingRange') {
                const { assumptions: a, units: u } = unitConfig;
                const sessions_weekday = u.bays * u.occupancy_per_day.weekday;
                const sessions_weekend = u.bays * u.occupancy_per_day.weekend;
                const revenue_bays = (sessions_weekday * a.workdays_in_month + sessions_weekend * a.weekend_days_in_month) * u.price_per_100_balls;
                const total_visitors = (sessions_weekday * a.workdays_in_month) + (sessions_weekend * a.weekend_days_in_month);
                const revenue_fnb = total_visitors * a.ancillary_revenue_per_visitor;
                return { main: revenue_bays, ancillary: revenue_fnb, total: revenue_bays + revenue_fnb };
            }
            if (unit === 'padel') {
                const { assumptions: a, units: u } = unitConfig;
                const hours_wd_offpeak = u.courts * u.hours_distribution_per_day.offpeak * u.occupancy_rate.weekday_offpeak;
                const hours_wd_peak = u.courts * u.hours_distribution_per_day.peak * u.occupancy_rate.weekday_peak;
                const hours_we = u.courts * a.operational_hours_per_day * u.occupancy_rate.weekend;
                const revenue_courts_wd = (hours_wd_offpeak * u.price_per_hour.weekday_offpeak) + (hours_wd_peak * u.price_per_hour.weekday_peak);
                const revenue_courts_we = hours_we * u.price_per_hour.weekend;
                const revenue_courts = (revenue_courts_wd * a.workdays_in_month) + (revenue_courts_we * a.weekend_days_in_month);
                const total_hours_booked = (hours_wd_offpeak + hours_wd_peak) * a.workdays_in_month + hours_we * a.weekend_days_in_month;
                const revenue_fnb = total_hours_booked * a.ancillary_revenue_per_hour_booked;
                return { main: revenue_courts, ancillary: revenue_fnb, total: revenue_courts + revenue_fnb };
            }
            return { main: 0, ancillary: 0, total: 0 };
        },

        calculatePnlForUnit(unit, revenueMultiplier = 1, opexMultiplier = 1) {
            const unitConfig = projectConfig[unit];
            const monthlyRevenue = this.getMonthlyRevenueForUnit(unit);
            const annualRevenue = monthlyRevenue.total * 12 * revenueMultiplier;
            const annualAncillaryRevenue = monthlyRevenue.ancillary * 12 * revenueMultiplier;
            const cogs = annualAncillaryRevenue * unitConfig.assumptions.cogs_rate_fnb;
            const grossProfit = annualRevenue - cogs;
            const annualOpex = Object.values(unitConfig.opexMonthly).reduce((a, b) => a + b, 0) * 12 * opexMultiplier;
            const ebitda = grossProfit - annualOpex;
            const depr = (unitConfig.capex.building / unitConfig.depreciation_years.building) + (unitConfig.capex.construction / unitConfig.depreciation_years.construction) + (unitConfig.capex.equipment / unitConfig.depreciation_years.equipment);
            const ebt = ebitda - depr;
            const tax = ebt > 0 ? ebt * projectConfig.assumptions.tax_rate_profit : 0;
            const netProfit = ebt - tax;
            const cashFlowFromOps = netProfit + depr;
            return { annualRevenue, cogs, grossProfit, annualOpex, ebitda, depreciation: depr, ebt, tax, netProfit, cashFlowFromOps };
        },

        // Kalkulator gabungan sekarang hanya memanggil kalkulator per unit
        calculatePnlForCombined(revenueMultiplier = 1, opexMultiplier = 1) {
            const pnlDR = this.calculatePnlForUnit('drivingRange', revenueMultiplier, opexMultiplier);
            const pnlPadel = this.calculatePnlForUnit('padel', revenueMultiplier, opexMultiplier);
            const combined = {};
            for (const key in pnlDR) {
                combined[key] = pnlDR[key] + pnlPadel[key];
            }
            return combined;
        },

        getFeasibilityForUnit(unit) {
            const unitCapex = Object.values(projectConfig[unit].capex).reduce((a, b) => a + b, 0);
            const contingency = unitCapex * projectConfig.assumptions.contingency_rate;
            const totalInvestment = unitCapex + contingency;
            const pnl = this.calculatePnlForUnit(unit);
            const cashFlow = pnl.cashFlowFromOps;
            if (cashFlow <= 0) return { totalInvestment, paybackPeriod: Infinity, npv: -Infinity, irr: -Infinity };
            const paybackPeriod = totalInvestment / cashFlow;
            const cashFlows = Array(20).fill(cashFlow);
            const npv = cashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + projectConfig.assumptions.discount_rate_wacc, i + 1), 0) - totalInvestment;
            let irr = 0.0;
            for (let i = 0; i < 1.0; i += 0.001) {
                let tempNpv = cashFlows.reduce((acc, cf, j) => acc + cf / Math.pow(1 + i, j + 1), 0) - totalInvestment;
                if (tempNpv < 0) { irr = i > 0 ? i - 0.001 : 0; break; }
            }
            return { totalInvestment, paybackPeriod, npv, irr };
        },
        
        getFeasibilityForCombined() {
             const investmentDR = this.getFeasibilityForUnit('drivingRange').totalInvestment;
             const investmentPadel = this.getFeasibilityForUnit('padel').totalInvestment;
             const totalInvestment = investmentDR + investmentPadel;
             const pnl = this.calculatePnlForCombined();
             const cashFlow = pnl.cashFlowFromOps;
             // Sisa perhitungan sama dengan getFeasibilityForUnit
             if (cashFlow <= 0) return { totalInvestment, paybackPeriod: Infinity, npv: -Infinity, irr: -Infinity };
             const paybackPeriod = totalInvestment / cashFlow;
             const cashFlows = Array(20).fill(cashFlow);
             const npv = cashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + projectConfig.assumptions.discount_rate_wacc, i + 1), 0) - totalInvestment;
             let irr = 0.0;
             for (let i = 0; i < 1.0; i += 0.001) {
                 let tempNpv = cashFlows.reduce((acc, cf, j) => acc + cf / Math.pow(1 + i, j + 1), 0) - totalInvestment;
                 if (tempNpv < 0) { irr = i > 0 ? i - 0.001 : 0; break; }
             }
             return { totalInvestment, paybackPeriod, npv, irr };
        }
    }
};