// File: sier-math-analyzer.js
// Bertanggung jawab untuk analisis tingkat tinggi dari model finansial,
// seperti metrik kelayakan (NPV, IRR) dan analisis sensitivitas.

const sierMathAnalyzer = {
    getDepreciationDetailsForScenario(model) {
        const depRates = projectConfig.assumptions.depreciation_years;
        let combinedCapex = {
            civil_construction: 0, building: 0, equipment: 0, interior: 0,
            digital_systems: 0, shared_facilities: 0, other: 0
        };

        // Kumpulkan semua breakdown capex dari setiap unit di dalam model
        for (const unitKey in model.individual) {
            const unit = model.individual[unitKey];
            if (unit.capexBreakdown) {
                for (const catKey in unit.capexBreakdown) {
                    combinedCapex[catKey] = (combinedCapex[catKey] || 0) + (unit.capexBreakdown[catKey] || 0);
                }
            }
        }

        let details = [];
        for (const category in combinedCapex) {
            if (combinedCapex[category] > 0) {
                const lifespan = depRates[category] || 10;
                const annualDepreciation = combinedCapex[category] / lifespan;
                details.push({
                    category: sierHelpers.safeTranslate(category),
                    capexValue: combinedCapex[category],
                    lifespan: lifespan,
                    annualDepreciation: annualDepreciation
                });
            }
        }
        return details; // Hanya mengembalikan array detail
    },

    calculateFeasibilityMetrics(netCashFlows, wacc) {
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
        if (irr === -1.0) irr = 1.0;

        const profitabilityIndex = (npv - netCashFlows[0]) / initialInvestment;
        return { paybackPeriod, discountedPaybackPeriod, npv, irr, profitabilityIndex };
    },

    runSensitivityAnalysis(baseModel, finConfig) {
        const sensitivityParams = projectConfig.assumptions.sensitivity_analysis;
        if (!sensitivityParams || !baseModel || !baseModel.combined) return {};

        const { revenue_steps, investment_steps } = sensitivityParams;
        let results = { combined: { npv: {}, irr: {} } };
        const modelData = baseModel.combined;

        investment_steps.forEach(invStep => {
            results.combined.npv[invStep] = {};
            results.combined.irr[invStep] = {};

            revenue_steps.forEach(revStep => {
                let tempModel = JSON.parse(JSON.stringify(modelData));
                
                tempModel.capexSchedule = tempModel.capexSchedule.map(c => c * invStep);
                tempModel.revenue = tempModel.revenue.map(r => r * revStep);
                tempModel.depreciation = tempModel.depreciation.map(d => d * invStep);

                // Panggil fungsi dari Modeler untuk kalkulasi ulang
                const newFinancing = sierMathModeler._calculateLoanAmortization(tempModel.capexSchedule[0], finConfig, 10);
                const pnl = sierMathModeler._buildIncomeStatement({ ...tempModel, interest: newFinancing.interestPayments, projectionYears: 10 });
                const cf = sierMathModeler._buildCashFlowStatement({ incomeStatement: pnl, depreciation: tempModel.depreciation, capexSchedule: tempModel.capexSchedule, financing: newFinancing, projectionYears: 10 });
                const metrics = this.calculateFeasibilityMetrics(cf.netCashFlow, projectConfig.assumptions.discount_rate_wacc);

                results.combined.npv[invStep][revStep] = metrics.npv;
                results.combined.irr[invStep][revStep] = metrics.irr;
            });
        });

        return results;
    }
};

window.sierMathAnalyzer = sierMathAnalyzer;