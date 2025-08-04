// File: sier-math-finance.js
// VERSI 3.0 LENGKAP - Arsitektur Modular Berbasis Skenario

const sierMathFinance = {
    /**
     * Helper untuk mengambil nilai dari objek bersarang menggunakan path string.
     * @param {object} obj - Objek sumber.
     * @param {string} path - Path ke nilai (misal: 'drivingRange.revenue.bays').
     * @returns {*} Nilai yang ditemukan atau undefined.
     */
    getValueByPath(obj, path) {
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
    },

    /**
     * Helper untuk menetapkan nilai ke objek bersarang menggunakan path string.
     * @param {object} obj - Objek target.
     * @param {string} path - Path ke nilai.
     * @param {*} value - Nilai yang akan ditetapkan.
     */
    setValueByPath(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
        target[lastKey] = value;
    },

    /**
     * FUNGSI MASTER: Membangun model finansial dengan merakit modul-modul yang relevan.
     * @param {string} scenarioKey - Kunci skenario (misal: 'dr_padel4_mp').
     * @returns {object} - Objek berisi hasil `individual` per unit dan hasil `combined`.
     */
    buildFinancialModelForScenario(scenarioKey) {
        let components = [];
        if (scenarioKey.includes('dr')) components.push('dr');
        if (scenarioKey.includes('padel4')) components.push('padel4');
        if (scenarioKey.includes('padel2')) components.push('padel2');
        if (scenarioKey.includes('mp')) components.push('mp');
        // Fasilitas bersama & digital ditambahkan jika ada proyek fisik
        if (components.length > 0) {
            components.push('shared');
            components.push('digital');
        }

        const projectionYears = 10;
        let individualResults = {};
        let combined = {
            capexSchedule: Array(projectionYears + 1).fill(0),
            revenue: Array(projectionYears + 1).fill(0),
            opex: Array(projectionYears + 1).fill(0),
        };

        // 1. Hitung finansial untuk setiap komponen secara terpisah
        components.forEach(compKey => {
            const unitFinancials = this._getFinancialsForComponent(compKey, projectionYears);
            individualResults[compKey] = unitFinancials;

            // 2. Agregasi hasil ke model gabungan
            for (let i = 0; i <= projectionYears; i++) {
                combined.capexSchedule[i] += unitFinancials.capexSchedule[i];
                combined.revenue[i] += unitFinancials.revenue[i];
                combined.opex[i] += unitFinancials.opex[i];
            }
        });

        // 3. Lakukan perhitungan gabungan
        const initialInvestment = combined.capexSchedule[0];
        const financing = this._calculateLoanAmortization(initialInvestment, projectConfig.assumptions.financing, projectionYears);
        
        const depreciation = this._calculateMultiYearDepreciation(combined.capexSchedule, projectionYears);

        const incomeStatement = this._buildIncomeStatement({ ...combined, depreciation, interest: financing.interestPayments, projectionYears });
        const cashFlowStatement = this._buildCashFlowStatement({ incomeStatement, depreciation, capexSchedule: combined.capexSchedule, financing, projectionYears });
        const feasibilityMetrics = this._calculateFeasibilityMetrics(cashFlowStatement.netCashFlow, projectConfig.assumptions.discount_rate_wacc);
        
        combined.financing = financing;
        combined.depreciation = depreciation;
        combined.incomeStatement = incomeStatement;
        combined.cashFlowStatement = cashFlowStatement;
        combined.feasibilityMetrics = feasibilityMetrics;

        return { individual: individualResults, combined: combined };
    },

    /**
     * Kalkulator individual untuk setiap komponen/modul bisnis.
     */
    _getFinancialsForComponent(compKey, years) {
        let capexSchedule = Array(years + 1).fill(0);
        let revenue = Array(years + 1).fill(0);
        let opex = Array(years + 1).fill(0);
        const esc = projectConfig.assumptions.escalation;

        let baseAnnualRevenue = 0;
        let baseOpex = { salaries: 0, other: 0 };
        const extractOpex = (opexConfig) => {
            if (!opexConfig) return { salaries: 0, other: 0 };
            let salaries = this._calculateTotal(opexConfig.salaries_wages || {});
            let other = 0;
            for (const key in opexConfig) { if (key !== 'salaries_wages') other += this._calculateTotal(opexConfig[key]); }
            return { salaries: salaries * 12, other: other * 12 };
        };

        switch (compKey) {
            case 'dr':
                capexSchedule[0] = this._calculateDrCapex().scenario_b.total;
                baseAnnualRevenue = this._getUnitCalculations('drivingRange').pnl.annualRevenue;
                baseOpex = extractOpex(projectConfig.drivingRange.opexMonthly);
                break;
            case 'padel4':
                capexSchedule[0] = this._calculateTotal(projectConfig.padel.scenarios.four_courts_combined.capex);
                baseAnnualRevenue = this._getUnitCalculations('padel', 'four_courts_combined').pnl.annualRevenue;
                baseOpex = extractOpex(projectConfig.padel.scenarios.four_courts_combined.opexMonthly);
                break;
            case 'padel2':
                capexSchedule[0] = this._calculateTotal(projectConfig.padel.scenarios.two_courts_futsal_renovation.capex);
                baseAnnualRevenue = this._getUnitCalculations('padel', 'two_courts_futsal_renovation').pnl.annualRevenue;
                baseOpex = extractOpex(projectConfig.padel.scenarios.two_courts_futsal_renovation.opexMonthly);
                break;
            case 'mp':
                capexSchedule[0] = this._calculateTotal(projectConfig.meetingPoint.capex_scenario_a);
                baseAnnualRevenue = this._calculateTotal(projectConfig.meetingPoint.revenue) * 12;
                baseOpex = extractOpex(projectConfig.meetingPoint.opexMonthly);
                break;
            case 'shared':
                capexSchedule[0] = this._calculateTotal(projectConfig.shared_facilities_capex);
                break;
            case 'digital':
                 capexSchedule[0] = this._calculateTotal(projectConfig.digital_capex);
                break;
        }
        
        // Proyeksi Multi-Tahun untuk komponen ini
        for (let year = 1; year <= years; year++) {
            const tariffFactor = Math.pow(1 + esc.tariff_increase_rate, Math.floor((year - 1) / esc.tariff_increase_every_x_years));
            revenue[year] = baseAnnualRevenue * tariffFactor;

            const salaryFactor = Math.pow(1 + esc.salary_increase_rate, year - 1);
            const otherFactor = Math.pow(1 + 0.021, year - 1); // Inflasi umum dari sheet
            opex[year] = (baseOpex.salaries * salaryFactor) + (baseOpex.other * otherFactor);
        }
        
        // Tambahkan rekondisi jika relevan
        if (compKey === 'padel4' || compKey === 'padel2' || compKey === 'mp') {
             capexSchedule[5] += capexSchedule[0] * 0.40;
        }

        return { capexSchedule, revenue, opex };
    },

    _calculateLoanAmortization(totalInvestment, finConfig, years) {
        const loanAmount = totalInvestment * finConfig.loan_portion;
        if (loanAmount <= 0) return { loanAmount: 0, annualPayment: 0, interestPayments: Array(years + 1).fill(0), principalPayments: Array(years + 1).fill(0) };
        
        const r = finConfig.interest_rate / 12;
        const n = finConfig.loan_period_years * 12;
        const monthlyPayment = n > 0 ? (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
        const annualPayment = monthlyPayment * 12;

        let beginningBalance = loanAmount;
        let interestPayments = Array(years + 1).fill(0);
        let principalPayments = Array(years + 1).fill(0);

        for (let year = 1; year <= finConfig.loan_period_years; year++) {
            let yearlyInterest = 0;
            let yearlyPrincipal = 0;
            for(let month = 1; month <= 12; month++) {
                let interestForMonth = beginningBalance * r;
                let principalForMonth = monthlyPayment - interestForMonth;
                yearlyInterest += interestForMonth;
                yearlyPrincipal += principalForMonth;
                beginningBalance -= principalForMonth;
                if(beginningBalance < 0) beginningBalance = 0;
            }
            interestPayments[year] = yearlyInterest;
            principalPayments[year] = yearlyPrincipal;
        }

        return { loanAmount, annualPayment, interestPayments, principalPayments };
    },

    _calculateMultiYearDepreciation(capexSchedule, years) {
        let projectedDepreciation = Array(years + 1).fill(0);
        const lifespan = 10;
        const initialDepreciation = capexSchedule[0] / lifespan;
        for (let year = 1; year <= Math.min(years, lifespan); year++) {
            projectedDepreciation[year] += initialDepreciation;
        }
        if (capexSchedule[5] > 0) {
            const recondDepreciation = capexSchedule[5] / lifespan;
            for (let year = 6; year <= years; year++) {
                projectedDepreciation[year] += recondDepreciation;
            }
        }
        return projectedDepreciation;
    },

    _buildIncomeStatement({ revenue, opex, depreciation, interest, projectionYears }) {
        let pnl = { ebit: [], ebt: [], tax: [], netIncome: [] };
        const taxRate = projectConfig.assumptions.tax_rate_profit;
        for (let year = 1; year <= projectionYears; year++) {
            const ebit = revenue[year] - opex[year] - depreciation[year];
            const ebt = ebit - interest[year];
            const tax = ebt > 0 ? ebt * taxRate : 0;
            const netIncome = ebt - tax;
            pnl.ebit.push(ebit); pnl.ebt.push(ebt); pnl.tax.push(tax); pnl.netIncome.push(netIncome);
        }
        for (const key in pnl) { pnl[key].unshift(0); }
        return pnl;
    },

    _buildCashFlowStatement({ incomeStatement, depreciation, capexSchedule, financing, projectionYears }) {
        let cfs = { cfo: [0], cfi: [0], cff: [0], netCashFlow: [0], cumulativeCashFlow: [0] };
        const equity = capexSchedule[0] * projectConfig.assumptions.financing.equity_portion;
        cfs.cfi[0] = -capexSchedule[0];
        cfs.cff[0] = financing.loanAmount;
        cfs.netCashFlow[0] = -equity;
        cfs.cumulativeCashFlow[0] = cfs.netCashFlow[0];

        for (let year = 1; year <= projectionYears; year++) {
            const cfo = incomeStatement.netIncome[year] + depreciation[year];
            const cfi = -capexSchedule[year];
            const cff = -financing.principalPayments[year];
            const netCf = cfo + cfi + cff;
            cfs.cfo.push(cfo); cfs.cfi.push(cfi); cfs.cff.push(financing.principalPayments[year]);
            cfs.netCashFlow.push(netCf);
            cfs.cumulativeCashFlow.push(cfs.cumulativeCashFlow[year - 1] + netCf);
        }
        return cfs;
    },

    _calculateFeasibilityMetrics(netCashFlows, wacc) {
        const initialInvestment = -netCashFlows[0];
        if (initialInvestment <= 0) return { paybackPeriod: 0, discountedPaybackPeriod: 0, npv: 0, irr: Infinity, profitabilityIndex: Infinity };
        
        let paybackPeriod = Infinity, discountedPaybackPeriod = Infinity, npv = netCashFlows[0], irr = -1.0;
        let cumulative = 0, discountedCumulative = 0;

        for (let i = 1; i < netCashFlows.length; i++) {
            cumulative += netCashFlows[i];
            if (cumulative >= initialInvestment && paybackPeriod === Infinity) {
                paybackPeriod = i - 1 + (initialInvestment - (cumulative - netCashFlows[i])) / netCashFlows[i];
            }
            const discountedCf = netCashFlows[i] / Math.pow(1 + wacc, i);
            discountedCumulative += discountedCf;
            if (discountedCumulative >= initialInvestment && discountedPaybackPeriod === Infinity) {
                 const prevCumulative = discountedCumulative - discountedCf;
                 discountedPaybackPeriod = i - 1 + (initialInvestment - prevCumulative) / discountedCf;
            }
            npv += discountedCf;
        }
        
        for (let rate = 0; rate < 1; rate += 0.001) {
            let tempNpv = netCashFlows[0];
            for (let i = 1; i < netCashFlows.length; i++) { tempNpv += netCashFlows[i] / Math.pow(1 + rate, i); }
            if (tempNpv < 0) { irr = rate > 0 ? rate - 0.001 : 0; break; }
        }
        if (irr === -1.0) irr = 1.0; // Jika tidak pernah negatif, IRR sangat tinggi

        const profitabilityIndex = (npv - netCashFlows[0]) / initialInvestment;
        return { paybackPeriod, discountedPaybackPeriod, npv, irr, profitabilityIndex };
    },

    _calculateTotal(dataObject) {
        if (typeof dataObject !== 'object' || dataObject === null) return 0;
        return Object.values(dataObject).reduce((sum, value) => {
            if (typeof value === 'number') return sum + value;
            if (typeof value === 'object' && value !== null) {
                return sum + (value.count * value.salary || value.quantity * value.unit_cost || value.lump_sum || (value.area_m2 * value.cost_per_m2) || this._calculateTotal(value));
            }
            return sum;
        }, 0);
    },

    _calculateDrCapex() {
        const a = projectConfig.drivingRange.capex_assumptions;
        const totalBuildingCost = this._calculateTotal(a.building);
        const totalEquipmentCost = this._calculateTotal(a.equipment);
        const totalSafetyNetCost = this._calculateTotal(a.safety_net);
        const foundationCost = this._calculateTotal(a.piling);
        const mepCost = this._calculateTotal(a.mep_systems);
        const physicalCost = foundationCost + totalBuildingCost + totalEquipmentCost + totalSafetyNetCost + mepCost;
        const permitCost = physicalCost * a.other_costs.permit_design_rate_of_physical_cost;
        return { scenario_b: { total: physicalCost + permitCost } };
    },

    _getUnitCalculations(unitName, padelScenarioKey = 'four_courts_combined') {
        const unit = projectConfig[unitName];
        if (!unit) return { pnl: { annualRevenue: 0 } };
        let numAssets = 0, revenueConf = unit.revenue;
        if(unitName === 'padel') {
             numAssets = unit.scenarios[padelScenarioKey].num_courts;
        } else {
             numAssets = unit.revenue.main_revenue.bays;
        }
        const o = unit.operational_assumptions;
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
        return { pnl: { annualRevenue: monthlyRevenueTotal * 12 } };
    }
};

window.sierMathFinance = sierMathFinance;