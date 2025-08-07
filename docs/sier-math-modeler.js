// File: sier-math-modeler.js dr capex 0 fix 3
const sierMathModeler = {

    _getFinancialsForComponent(compKey, years, mpScenarioDetail = null) {
        let capexSchedule = Array(years + 1).fill(0);
        let revenue = Array(years + 1).fill(0);
        let opex = Array(years + 1).fill(0);

        let capexBreakdown = { civil_construction: 0, building: 0, equipment: 0, interior: 0, digital_systems: 0, shared_facilities: 0, other: 0 };

        const esc = projectConfig.assumptions.escalation;
        let baseAnnualRevenue = 0;
        let baseOpex = { salaries: 0, other: 0 };

        const extractOpex = (opexConfig) => {
            if (!opexConfig) return { salaries: 0, other: 0 };
            let salaries = sierMathCosting._calculateTotal(opexConfig.salaries_wages || {});
            let other = 0;
            for (const key in opexConfig) { if (key !== 'salaries_wages') other += sierMathCosting._calculateTotal(opexConfig[key]); }
            return { salaries: salaries * 12, other: other * 12 };
        };

        const getPadelScenarioKey = () => {
            if (compKey.includes('padel4')) return 'four_courts_combined';
            if (compKey.includes('padel2')) return 'two_courts_futsal_renovation';
            return null;
        }

        switch (true) {
            case compKey === 'dr':
                const drCapexDetails = sierMathCosting.calculateDrCapex();
                capexSchedule[0] = drCapexDetails.total;
                
                const drBreakdown = drCapexDetails.breakdown;
                capexBreakdown.civil_construction += drBreakdown.civil_construction || 0;
                capexBreakdown.building += drBreakdown.building || 0;
                capexBreakdown.equipment += drBreakdown.equipment || 0;
                capexBreakdown.interior += drBreakdown.interior || 0;
                capexBreakdown.other += drBreakdown.other || 0;

                baseAnnualRevenue = sierMathCosting.getUnitRevenue('drivingRange');
                baseOpex = extractOpex(projectConfig.drivingRange.opexMonthly);
                break;

            case compKey.includes('padel'):
                const padelScenarioKey = getPadelScenarioKey();
                const padelScenario = projectConfig.padel.scenarios[padelScenarioKey];
                const padelBaseCapex = sierMathCosting.calculatePadelCapex(padelScenarioKey);
                capexSchedule[0] = padelBaseCapex * (1 + projectConfig.assumptions.contingency_rate);
                
                const padelCapexConf = padelScenario.capex;
                capexBreakdown.building += sierMathCosting._calculateTotal(padelCapexConf.component_koperasi_new_build || {}) + sierMathCosting._calculateTotal(padelCapexConf.component_futsal_renovation || {});
                capexBreakdown.equipment += sierMathCosting._calculateTotal(padelCapexConf.sport_courts_equipment || {});
                capexBreakdown.other += sierMathCosting._calculateTotal(padelCapexConf.pre_operational || {});

                baseAnnualRevenue = sierMathCosting.getUnitRevenue('padel', padelScenarioKey);
                baseOpex = extractOpex(padelScenario.opexMonthly);
                break;
            
            case compKey === 'mp':
                const parts = mpScenarioDetail.split('_');
                const constructionKey = parts.shift();
                const conceptKey = parts.join('_');
                const baseMpCapex = sierMathCosting.calculateMeetingPointCapex(constructionKey, conceptKey);
                capexSchedule[0] = baseMpCapex * (1 + projectConfig.assumptions.contingency_rate);
                
                const constructionCosts = sierMathCosting._calculateTotal(projectConfig.meetingPoint.capex_scenarios.construction_scenarios[constructionKey].base_costs);
                capexBreakdown.building += constructionCosts;
                capexBreakdown.equipment += (baseMpCapex - constructionCosts);

                baseAnnualRevenue = sierMathCosting._calculateTotal(projectConfig.meetingPoint.revenue) * 12;
                baseOpex = extractOpex(projectConfig.meetingPoint.opexMonthly);
                break;
            
            case compKey === 'digital':
                capexSchedule[0] = sierMathCosting._calculateTotal(projectConfig.digital_capex) * (1 + projectConfig.assumptions.contingency_rate);
                capexBreakdown.digital_systems += capexSchedule[0];
                break;
        }
        
        for (let year = 1; year <= years; year++) {
            const tariffFactor = Math.pow(1 + esc.tariff_increase_rate, Math.floor((year - 1) / esc.tariff_increase_every_x_years));
            revenue[year] = baseAnnualRevenue * tariffFactor;
            const salaryFactor = Math.pow(1 + esc.salary_increase_rate, year - 1);
            const otherFactor = Math.pow(1 + 0.021, year - 1);
            opex[year] = (baseOpex.salaries * salaryFactor) + (baseOpex.other * otherFactor);
        }
        
        if (compKey.includes('padel') || compKey === 'mp') {
            capexSchedule[5] += capexSchedule[0] * 0.40;
        }

        const depreciation = this._calculateMultiYearDepreciation(capexSchedule, years, capexBreakdown);
        return { capexSchedule, capexBreakdown, revenue, opex, depreciation };
    },

    _calculateMultiYearDepreciation(capexSchedule, years, capexBreakdown) {
        let projectedDepreciation = Array(years + 1).fill(0);
        const depRates = projectConfig.assumptions.depreciation_years;
        let initialAnnualDepreciation = 0;
        for (const category in capexBreakdown) {
            if (capexBreakdown[category] > 0) {
                const lifespan = depRates[category] || 10;
                initialAnnualDepreciation += capexBreakdown[category] / lifespan;
            }
        }
        for (let year = 1; year <= years; year++) {
            projectedDepreciation[year] += initialAnnualDepreciation;
        }
        if (capexSchedule[5] > 0) {
            const recondDepreciation = capexSchedule[5] / 10;
            for (let year = 6; year <= years; year++) {
                projectedDepreciation[year] += recondDepreciation;
            }
        }
        return projectedDepreciation;
    },

    _calculateLoanAmortization(totalInvestment, finConfig, years) {
        const loanAmount = totalInvestment * finConfig.loan_portion;
        if (loanAmount <= 0) return { loanAmount: 0, annualPayment: 0, interestPayments: Array(years + 1).fill(0), principalPayments: Array(years + 1).fill(0) };
        
        const r = finConfig.interest_rate / 12;
        const n = finConfig.loan_period_years * 12;
        const monthlyPayment = n > 0 ? (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
        
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
        return { loanAmount, annualPayment: monthlyPayment * 12, interestPayments, principalPayments };
    },

    _buildIncomeStatement({ revenue, opex, depreciation, interest, projectionYears }) {
        let pnl = { ebit: [], ebt: [], tax: [], netIncome: [] };
        const taxRate = projectConfig.assumptions.tax_rate_profit;
        for (let year = 1; year <= projectionYears; year++) {
            const ebit = (revenue[year] || 0) - (opex[year] || 0) - (depreciation[year] || 0);
            const ebt = ebit - (interest[year] || 0);
            const tax = ebt > 0 ? ebt * taxRate : 0;
            pnl.ebit.push(ebit);
            pnl.ebt.push(ebt);
            pnl.tax.push(tax);
            pnl.netIncome.push(ebt - tax);
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
        cfs.cumulativeCashFlow[0] = -equity;

        for (let year = 1; year <= projectionYears; year++) {
            cfs.cfo[year] = (incomeStatement.netIncome[year] || 0) + (depreciation[year] || 0);
            cfs.cfi[year] = -(capexSchedule[year] || 0);
            cfs.cff[year] = -(financing.principalPayments[year] || 0);
            cfs.netCashFlow[year] = cfs.cfo[year] + cfs.cfi[year] + cfs.cff[year];
            cfs.cumulativeCashFlow[year] = cfs.cumulativeCashFlow[year - 1] + cfs.netCashFlow[year];
        }
        return cfs;
    },

    _createCombinedModel(individualResults, financing, projectionYears) {
        let combined = {
            capexSchedule: Array(projectionYears + 1).fill(0),
            revenue: Array(projectionYears + 1).fill(0),
            opex: Array(projectionYears + 1).fill(0),
            depreciation: Array(projectionYears + 1).fill(0),
        };
        for(const key in individualResults) {
            for(let i=0; i<=projectionYears; i++) {
                combined.capexSchedule[i] += individualResults[key].capexSchedule[i] || 0;
                combined.revenue[i] += individualResults[key].revenue[i] || 0;
                combined.opex[i] += individualResults[key].opex[i] || 0;
                combined.depreciation[i] += individualResults[key].depreciation[i] || 0;
            }
        }
        const incomeStatement = this._buildIncomeStatement({ ...combined, interest: financing.interestPayments, projectionYears });
        const cashFlowStatement = this._buildCashFlowStatement({ incomeStatement, depreciation: combined.depreciation, capexSchedule: combined.capexSchedule, financing, projectionYears });
        const feasibilityMetrics = sierMathAnalyzer.calculateFeasibilityMetrics(cashFlowStatement.netCashFlow, projectConfig.assumptions.discount_rate_wacc);
        return { ...combined, financing, incomeStatement, cashFlowStatement, feasibilityMetrics };
    },

    buildFinancialModelForScenario(scenarioConfig) {
        let components = [];
        if (scenarioConfig.dr && scenarioConfig.dr !== 'none') components.push('dr');
        if (scenarioConfig.padel === '4courts') components.push('padel4');
        else if (scenarioConfig.padel === '2courts') components.push('padel2');
        if (scenarioConfig.mp && scenarioConfig.mp !== 'none') components.push('mp');
        if (components.length > 0) components.push('digital');

        const projectionYears = 10;
        let individualResults = {};
        let totalCapex = 0;

        components.forEach(compKey => {
            const unitFinancials = this._getFinancialsForComponent(compKey, projectionYears, scenarioConfig.mp);
            individualResults[compKey] = unitFinancials;
            totalCapex += (unitFinancials.capexSchedule[0] || 0);
        });

        const financing = this._calculateLoanAmortization(totalCapex, projectConfig.assumptions.financing, projectionYears);

        Object.keys(individualResults).forEach(key => {
            const unit = individualResults[key];
            const unitCapex = unit.capexSchedule[0] || 0;
            const interestAllocationRatio = totalCapex > 0 ? (unitCapex / totalCapex) : 0;
            const interest = financing.interestPayments.map(p => p * interestAllocationRatio);
            
            const pnlData = {
                revenue: unit.revenue, opex: unit.opex, depreciation: unit.depreciation,
                interest: interest, projectionYears
            };
            unit.pnl = this._buildIncomeStatement(pnlData);
        });

        const combined = this._createCombinedModel(individualResults, financing, projectionYears);
        return { individual: individualResults, combined: combined };
    }
};

window.sierMathModeler = sierMathModeler;