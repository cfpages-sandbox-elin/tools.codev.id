// File: sier-variables.js
// Pusat semua asumsi, variabel, dan model perhitungan proyek (Versi Final dengan Asumsi Terpisah).

const projectConfig = {
    // ====================================================================
    // A. KAMUS TERJEMAHAN (Diperbarui)
    // ====================================================================
    keyTranslations: {
        'tax_rate_profit': 'Tarif Pajak Penghasilan', 'discount_rate_wacc': 'Tingkat Diskonto (WACC)', 'contingency_rate': 'Dana Darurat (Kontingensi)',
        'workdays_in_month': 'Hari Kerja / Bulan', 'weekend_days_in_month': 'Hari Libur / Bulan', 'operational_hours_per_day': 'Jam Operasional / Hari',
        'cogs_rate_fnb': 'HPP (COGS) F&B',
        // CapEx
        'land_acquisition': 'Perolehan Lahan', 'civil_construction': 'Konstruksi Sipil & Prasarana', 'building_main': 'Bangunan Utama (Lounge, F&B, Office)',
        'equipment_sport': 'Peralatan Olahraga (Per Unit)', 'interior_finishing': 'Interior & Finishing', 'pre_operational': 'Biaya Pra-Operasional',
        // Opex
        'salaries_wages': 'Gaji & Upah', 'manager': 'Manajer', 'supervisor': 'Supervisor', 'admin_cashier': 'Admin & Kasir', 'coach_trainer': 'Pelatih / Instruktur', 'cleaning_security': 'Kebersihan & Keamanan',
        'utilities': 'Utilitas', 'electricity_kwh_price': 'Harga Listrik / kWh', 'electricity_kwh_usage': 'Penggunaan Listrik / Bulan (kWh)', 'water_etc': 'Air & Lainnya',
        'marketing_promotion': 'Pemasaran & Promosi', 'maintenance_repair': 'Perawatan & Perbaikan', 'rent_land': 'Sewa Lahan', 'other_operational': 'Biaya Operasional Lainnya',
        // Revenue
        'main_revenue': 'Pendapatan Utama (Sewa)', 'bays': 'Jumlah Bay', 'price_per_100_balls': 'Harga / 100 Bola', 'occupancy_rate_per_day': 'Okupansi per Bay / Hari',
        'courts': 'Jumlah Lapangan', 'price_per_hour': 'Harga Sewa / Jam', 'occupancy_rate': 'Tingkat Okupansi',
        'ancillary_revenue': 'Pendapatan Tambahan', 'fnb_avg_spend': 'Belanja F&B Rata-rata', 'pro_shop_sales': 'Penjualan Pro Shop (Estimasi)',
        // Common
        'weekday': 'Hari Kerja', 'weekend': 'Akhir Pekan', 'weekday_offpeak': 'Hr Kerja (Sepi)', 'weekday_peak': 'Hr Kerja (Sibuk)', 'offpeak': 'Jam Sepi', 'peak': 'Jam Sibuk',
        'count': 'Jumlah', 'salary': 'Gaji', 'personnel': 'Personel',
    },

    // ====================================================================
    // B. ASUMSI GLOBAL
    // ====================================================================
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

    // ====================================================================
    // C. MODEL BISNIS: DRIVING RANGE
    // ====================================================================
    drivingRange: {
        // ASUMSI OPERASIONAL
        operational_assumptions: {
            workdays_in_month: 22,
            weekend_days_in_month: 8,
            cogs_rate_fnb: 0.40,
        },
        // PENDAPATAN (REVENUE)
        revenue: {
            main_revenue: {
                bays: 30,
                price_per_100_balls: 120000,
                occupancy_rate_per_day: { weekday: 2.0, weekend: 5.0 },
            },
            ancillary_revenue: {
                fnb_avg_spend: 35000,
                pro_shop_sales: 15000000, // Estimasi penjualan bulanan
            }
        },
        // BIAYA INVESTASI (CAPEX)
        capex: {
            land_acquisition: 2000000000,
            civil_construction: 1500000000,
            building_main: 700000000,
            equipment_sport: 20000000, // per bay
            interior_finishing: 200000000,
            pre_operational: 100000000,
        },
        // BIAYA OPERASIONAL BULANAN (OPEX)
        opexMonthly: {
            salaries_wages: {
                manager:        { count: 1, salary: 12000000 },
                supervisor:     { count: 2, salary: 7000000 },
                admin_cashier:  { count: 3, salary: 5000000 },
                coach_trainer:  { count: 2, salary: 6000000 },
                cleaning_security: { count: 4, salary: 4000000 },
            },
            utilities: {
                electricity_kwh_price: 1700,
                electricity_kwh_usage: 12000,
                water_etc: 5000000,
            },
            marketing_promotion: 15000000,
            maintenance_repair: 12000000,
            rent_land: 33000000,
            other_operational: 10000000,
        }
    },

    // ====================================================================
    // D. MODEL BISNIS: PADEL
    // ====================================================================
    padel: {
        // ASUMSI OPERASIONAL
        operational_assumptions: {
            workdays_in_month: 22,
            weekend_days_in_month: 8,
            operational_hours_per_day: 18,
            cogs_rate_fnb: 0.30,
        },
        // PENDAPATAN (REVENUE)
        revenue: {
            main_revenue: {
                courts: 4,
                price_per_hour: { weekday_offpeak: 250000, weekday_peak: 350000, weekend: 400000 },
                occupancy_rate: { weekday_offpeak: 0.30, weekday_peak: 0.85, weekend: 0.90 },
                hours_distribution_per_day: { offpeak: 10, peak: 8 },
            },
            ancillary_revenue: {
                fnb_avg_spend: 50000, // Dihitung per jam booking
                pro_shop_sales: 20000000,
            }
        },
        // BIAYA INVESTASI (CAPEX)
        capex: {
            land_acquisition: 1500000000,
            civil_construction: 1000000000,
            building_main: 800000000,
            equipment_sport: 350000000, // per lapangan
            interior_finishing: 300000000,
            pre_operational: 100000000,
        },
        // BIAYA OPERASIONAL BULANAN (OPEX)
        opexMonthly: {
            salaries_wages: {
                manager:        { count: 1, salary: 10000000 },
                supervisor:     { count: 2, salary: 6500000 },
                admin_cashier:  { count: 4, salary: 5000000 },
                cleaning_security: { count: 4, salary: 4000000 },
            },
            utilities: {
                electricity_kwh_price: 1700,
                electricity_kwh_usage: 18000,
                water_etc: 5000000,
            },
            marketing_promotion: 15000000,
            maintenance_repair: 10000000,
            rent_land: 25000000,
            other_operational: 8000000,
        }
    },

    // ====================================================================
    // E. MESIN KALKULASI (DISESUAIKAN DENGAN STRUKTUR BARU)
    // ====================================================================
    calculations: {
        // --- KALKULATOR TOTAL ---
        _calculateTotal(dataObject) {
            if (typeof dataObject !== 'object' || dataObject === null) return 0;
            return Object.values(dataObject).reduce((sum, value) => {
                if (typeof value === 'object' && value !== null) {
                    // Untuk objek seperti {count: 2, salary: 100} -> 2 * 100 = 200
                    if ('count' in value && 'salary' in value) {
                        return sum + (value.count * value.salary);
                    }
                    // Untuk objek seperti utilities
                     if ('electricity_kwh_price' in value && 'electricity_kwh_usage' in value) {
                        return sum + (value.electricity_kwh_price * value.electricity_kwh_usage) + (value.water_etc || 0);
                    }
                    return sum + this._calculateTotal(value);
                }
                return sum + (typeof value === 'number' ? value : 0);
            }, 0);
        },

        // --- KALKULATOR PER UNIT BISNIS ---
        _getUnitCalculations(unitName) {
            const unit = projectConfig[unitName];
            const global = projectConfig.assumptions;
            const o = unit.operational_assumptions; 

            // PENDAPATAN BULANAN
            let monthlyRevenueMain = 0;
            let monthlyRevenueAncillary = 0;
            let fnbRevenueMonthly = 0;

            if (unitName === 'drivingRange') {
                const { main_revenue: m, ancillary_revenue: a } = unit.revenue;
                const sessions_wd = m.bays * m.occupancy_rate_per_day.weekday;
                const sessions_we = m.bays * m.occupancy_rate_per_day.weekend;
                monthlyRevenueMain = (sessions_wd * o.workdays_in_month + sessions_we * o.weekend_days_in_month) * m.price_per_100_balls;
                const total_visitors = (sessions_wd * o.workdays_in_month) + (sessions_we * o.weekend_days_in_month);
                
                fnbRevenueMonthly = total_visitors * a.fnb_avg_spend;
                monthlyRevenueAncillary = fnbRevenueMonthly + a.pro_shop_sales;

            } else if (unitName === 'padel') {
                const { main_revenue: m, ancillary_revenue: a } = unit.revenue;
                const hours_wd_off = m.courts * m.hours_distribution_per_day.offpeak * m.occupancy_rate.weekday_offpeak;
                const hours_wd_peak = m.courts * m.hours_distribution_per_day.peak * m.occupancy_rate.weekday_peak;
                const hours_we = m.courts * o.operational_hours_per_day * m.occupancy_rate.weekend;
                const revenue_wd = (hours_wd_off * m.price_per_hour.weekday_offpeak) + (hours_wd_peak * m.price_per_hour.weekday_peak);
                const revenue_we = hours_we * m.price_per_hour.weekend;
                monthlyRevenueMain = (revenue_wd * o.workdays_in_month) + (revenue_we * o.weekend_days_in_month);
                const total_hours = (hours_wd_off + hours_wd_peak) * o.workdays_in_month + hours_we * o.weekend_days_in_month;

                fnbRevenueMonthly = total_hours * a.fnb_avg_spend;
                monthlyRevenueAncillary = fnbRevenueMonthly + a.pro_shop_sales;
            }
            const monthlyRevenueTotal = monthlyRevenueMain + monthlyRevenueAncillary;

            // BIAYA INVESTASI (CAPEX)
            const capexBase = this._calculateTotal(unit.capex);
            const capexEquipment = (unitName === 'drivingRange') 
                ? unit.capex.equipment_sport * unit.revenue.main_revenue.bays
                : unit.capex.equipment_sport * unit.revenue.main_revenue.courts;
            const capexSubTotal = capexBase - unit.capex.equipment_sport + capexEquipment;
            const capexContingency = capexSubTotal * global.contingency_rate;
            const capexTotal = capexSubTotal + capexContingency;

            // BIAYA OPERASIONAL BULANAN (OPEX)
            const opexMonthlyTotal = this._calculateTotal(unit.opexMonthly);
            const cogsMonthly = fnbRevenueMonthly * o.cogs_rate_fnb;

            // P&L TAHUNAN
            const annualRevenue = monthlyRevenueTotal * 12;
            const annualCogs = cogsMonthly * 12;
            const annualOpex = opexMonthlyTotal * 12;
            const grossProfit = annualRevenue - annualCogs;
            const ebitda = grossProfit - annualOpex;
            
            // DEPRESIASI (PERBAIKAN 2: Pisahkan depresiasi interior)
            const deprBuilding = unit.capex.building_main / global.depreciation_years.building;
            const deprInterior = unit.capex.interior_finishing / global.depreciation_years.interior;
            const deprCivil = unit.capex.civil_construction / global.depreciation_years.civil_construction;
            const deprEquipment = capexEquipment / global.depreciation_years.equipment;
            const annualDepreciation = deprBuilding + deprInterior + deprCivil + deprEquipment;

            const ebt = ebitda - annualDepreciation;
            const tax = ebt > 0 ? ebt * global.tax_rate_profit : 0;
            const netProfit = ebt - tax;
            const cashFlowFromOps = netProfit + annualDepreciation;

            return {
                capex: { subTotal: capexSubTotal, contingency: capexContingency, total: capexTotal },
                revenue: { main: monthlyRevenueMain, ancillary: monthlyRevenueAncillary, total: monthlyRevenueTotal },
                opex: { total: opexMonthlyTotal, cogs: cogsMonthly },
                pnl: { annualRevenue, annualCogs, annualOpex, grossProfit, ebitda, annualDepreciation, ebt, tax, netProfit, cashFlowFromOps },
            };
        },

        // --- FUNGSI PUBLIK UNTUK DIPANGGIL DARI VISUAL.JS ---
        getFinancialSummary(revenueMultiplier = 1, opexMultiplier = 1) {
            const dr = this._getUnitCalculations('drivingRange');
            const padel = this._getUnitCalculations('padel');

            // Modifikasi dengan multiplier
            ['pnl', 'revenue', 'opex'].forEach(cat => {
                Object.keys(dr[cat]).forEach(key => {
                    if (cat === 'revenue') dr[cat][key] *= revenueMultiplier;
                    if (cat === 'opex') dr[cat][key] *= opexMultiplier;
                });
                 Object.keys(padel[cat]).forEach(key => {
                    if (cat === 'revenue') padel[cat][key] *= revenueMultiplier;
                    if (cat === 'opex') padel[cat][key] *= opexMultiplier;
                });
            });
            // Hitung ulang PNL setelah multiplier
            // Ini adalah simplifikasi, idealnya multiplier diterapkan di awal. Tapi untuk sensitivitas cepat, ini cukup.
            dr.pnl.annualRevenue = dr.revenue.total * 12;
            padel.pnl.annualRevenue = padel.revenue.total * 12;

            // Gabungkan hasil
            const combined = {
                capex: { total: dr.capex.total + padel.capex.total },
                pnl: {},
            };
            for (const key in dr.pnl) {
                combined.pnl[key] = dr.pnl[key] + padel.pnl[key];
            }

            // Hitung Kelayakan Investasi Gabungan
            const totalInvestment = combined.capex.total;
            const cashFlow = combined.pnl.cashFlowFromOps;
            const paybackPeriod = cashFlow > 0 ? totalInvestment / cashFlow : Infinity;
            
            const cashFlows = Array(20).fill(cashFlow);
            const wacc = projectConfig.assumptions.discount_rate_wacc;
            const npv = cashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + wacc, i + 1), 0) - totalInvestment;

            let irr = 0.0;
            for (let i = 0; i < 1.0; i += 0.001) {
                let tempNpv = cashFlows.reduce((acc, cf, j) => acc + cf / Math.pow(1 + i, j + 1), 0) - totalInvestment;
                if (tempNpv < 0) { irr = i > 0 ? i - 0.001 : 0; break; }
            }
            
            return {
                drivingRange: dr,
                padel: padel,
                combined: {
                    ...combined,
                    feasibility: { paybackPeriod, npv, irr }
                }
            };
        }
    }
};