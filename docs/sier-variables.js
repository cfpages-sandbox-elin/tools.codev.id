// File: sier-variables.js
// Pusat semua asumsi, variabel, dan model perhitungan untuk proyek.

const projectConfig = {
    // ====================================================================
    // 1. ASUMSI DASAR & KONFIGURASI
    // ====================================================================
    assumptions: {
        cogs_rate: 0.30,       // 30% dari pendapatan F&B/ancillary
        tax_rate: 0.22,        // 22% tarif PPh Badan
        depreciation_years_building: 20,
        depreciation_years_equipment: 5,
        discount_rate: 0.12,   // 12% untuk perhitungan NPV & IRR
        contingency_rate: 0.10, // 10% dana darurat untuk investasi
    },

    // ====================================================================
    // 2. DATA KEUANGAN DRIVING RANGE
    // ====================================================================
    drivingRange: {
        capex: {
            land: 2000000000,
            construction: 1500000000,
            building: 700000000,
            equipment: 400000000,
        },
        revenueMonthly: {
            bays: 300000000,
            ancillary: 75000000,
        },
        opexMonthly: {
            salary: 55000000,
            rent: 33000000,
            utilities: 25000000,
            marketing: 15000000,
            maintenance: 12000000,
        },
    },

    // ====================================================================
    // 3. DATA KEUANGAN PADEL
    // ====================================================================
    padel: {
        capex: {
            land: 1500000000,
            construction: 1400000000,
            building: 800000000,
            equipment: 300000000,
        },
        revenueMonthly: {
            courts: 195000000,
            ancillary: 48750000,
        },
        opexMonthly: {
            salary: 70000000,
            rent: 25000000,
            utilities: 35000000,
            marketing: 15000000,
            maintenance: 10000000,
        },
    },

    // ====================================================================
    // 4. FUNGSI PERHITUNGAN (MODEL BISNIS)
    // ====================================================================
    calculations: {
        // Menghitung total investasi
        getTotalInvestment() {
            const drCapex = Object.values(projectConfig.drivingRange.capex).reduce((a, b) => a + b, 0);
            const padelCapex = Object.values(projectConfig.padel.capex).reduce((a, b) => a + b, 0);
            const subTotal = drCapex + padelCapex;
            const contingency = subTotal * projectConfig.assumptions.contingency_rate;
            return {
                total: subTotal + contingency,
                subTotal: subTotal,
                contingency: contingency,
                dr: drCapex,
                padel: padelCapex
            };
        },

        // Menghitung Laba Rugi untuk satu skenario
        calculatePnl(revenueMultiplier = 1, opexMultiplier = 1) {
            const drRevenue = Object.values(projectConfig.drivingRange.revenueMonthly).reduce((a, b) => a + b, 0);
            const padelRevenue = Object.values(projectConfig.padel.revenueMonthly).reduce((a, b) => a + b, 0);
            const annualRevenue = (drRevenue + padelRevenue) * 12 * revenueMultiplier;

            const ancillaryRevenue = (projectConfig.drivingRange.revenueMonthly.ancillary + projectConfig.padel.revenueMonthly.ancillary) * 12 * revenueMultiplier;
            const cogs = ancillaryRevenue * projectConfig.assumptions.cogs_rate;
            const grossProfit = annualRevenue - cogs;

            const drOpex = Object.values(projectConfig.drivingRange.opexMonthly).reduce((a, b) => a + b, 0);
            const padelOpex = Object.values(projectConfig.padel.opexMonthly).reduce((a, b) => a + b, 0);
            const annualOpex = (drOpex + padelOpex) * 12 * opexMultiplier;
            const ebitda = grossProfit - annualOpex;

            const totalBuildingCapex = projectConfig.drivingRange.capex.building + projectConfig.padel.capex.building;
            const totalEquipmentCapex = projectConfig.drivingRange.capex.equipment + projectConfig.padel.capex.equipment;
            const depreciation = (totalBuildingCapex / projectConfig.assumptions.depreciation_years_building) + (totalEquipmentCapex / projectConfig.assumptions.depreciation_years_equipment);
            
            const ebt = ebitda - depreciation;
            const tax = ebt > 0 ? ebt * projectConfig.assumptions.tax_rate : 0;
            const netProfit = ebt - tax;
            const cashFlowFromOps = netProfit + depreciation;
            
            return { annualRevenue, cogs, grossProfit, annualOpex, ebitda, depreciation, ebt, tax, netProfit, cashFlowFromOps };
        },

        // Menghitung semua metrik kelayakan
        getFeasibilityMetrics() {
            const totalInvestment = this.getTotalInvestment().total;
            const realisticPnl = this.calculatePnl();
            const cashFlow = realisticPnl.cashFlowFromOps;

            if (cashFlow <= 0) {
                return { paybackPeriod: Infinity, npv: -totalInvestment, irr: -Infinity };
            }

            const paybackPeriod = totalInvestment / cashFlow;

            const cashFlows = Array(10).fill(cashFlow); // Proyeksi 10 tahun
            const npv = cashFlows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + projectConfig.assumptions.discount_rate, i + 1), 0) - totalInvestment;
            
            let irr = 0;
            for (let i = 0; i < 1.0; i += 0.001) { // Batas IRR 100%
                let tempNpv = cashFlows.reduce((acc, cf, j) => acc + cf / Math.pow(1 + i, j + 1), 0) - totalInvestment;
                if (tempNpv < 0) {
                    irr = (i - 0.001);
                    break;
                }
            }

            return { paybackPeriod, npv, irr };
        }
    }
};