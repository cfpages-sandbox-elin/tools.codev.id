// File: sier-math-finance.js sensitivity tidak 0 2
const sierMathFinance = {
    getValueByPath(obj, path) {
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
    },

    setValueByPath(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
        target[lastKey] = value;
    },

    _getDepreciationDetailsForScenario(components) {
        const depRates = projectConfig.assumptions.depreciation_years;
        let combinedCapex = {
            civil_construction: 0, building: 0, equipment: 0, interior: 0,
            digital_systems: 0, shared_facilities: 0, other: 0
        };

        components.forEach(compKey => {
            const capex = this._getFinancialsForComponent(compKey, 1).capexSchedule[0];
            if (compKey === 'dr') {
                const drDetails = this._calculateDrCapex().scenario_b;
                combinedCapex.civil_construction += drDetails.htmlRows.find(r => r.label.includes('Tiang Pancang')).value;
                combinedCapex.building += drDetails.htmlRows.find(r => r.label.includes('Bangunan')).value;
                combinedCapex.equipment += drDetails.htmlRows.find(r => r.label.includes('Peralatan')).value;
            } else if (compKey.includes('padel')) {
                const scenarioKey = compKey === 'padel4' ? 'four_courts_combined' : 'two_courts_futsal_renovation';
                const padelCapexConf = projectConfig.padel.scenarios[scenarioKey].capex;
                combinedCapex.building += this._calculateTotal(padelCapexConf.component_koperasi_new_build || {}) + this._calculateTotal(padelCapexConf.component_futsal_renovation || {});
                combinedCapex.equipment += this._calculateTotal(padelCapexConf.sport_courts_equipment || {});
                combinedCapex.other += this._calculateTotal(padelCapexConf.pre_operational || {});
            } else if (compKey === 'mp') {
                 const mpCapexConf = projectConfig.meetingPoint.capex_scenario_a;
                 combinedCapex.building += this._calculateTotal(mpCapexConf.renovation_costs || {});
                 combinedCapex.equipment += this._calculateTotal(mpCapexConf.equipment_and_furniture || {});
                 combinedCapex.other += this._calculateTotal(mpCapexConf.pre_operational || {});
            } else if (compKey === 'digital') {
                combinedCapex.digital_systems += capex;
            } else if (compKey === 'shared') {
                combinedCapex.shared_facilities += capex;
            }
        });

        let details = [];
        let totalAnnualDepreciation = 0;

        for (const category in combinedCapex) {
            if (combinedCapex[category] > 0) {
                const lifespan = depRates[category] || 10;
                const annualDepreciation = combinedCapex[category] / lifespan;
                totalAnnualDepreciation += annualDepreciation;
                
                details.push({
                    // GUNAKAN FUNGSI AMAN YANG BARU
                    category: sierHelpers.safeTranslate(category),
                    capexValue: combinedCapex[category],
                    lifespan: lifespan,
                    lifespanPath: `assumptions.depreciation_years.${category}`,
                    annualDepreciation: annualDepreciation
                });
            }
        }
        return { details, totalAnnualDepreciation };
    },

    _getFinancialsForComponent(compKey, years) {
        let capexSchedule = Array(years + 1).fill(0);
        let revenue = Array(years + 1).fill(0);
        let opex = Array(years + 1).fill(0);
        let capexBreakdown = { civil_construction: 0, building: 0, equipment: 0, interior: 0, digital_systems: 0, shared_facilities: 0, other: 0 };
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

        const getPadelScenarioKey = () => {
             if (compKey.includes('padel4')) return 'four_courts_combined';
             if (compKey.includes('padel2')) return 'two_courts_futsal_renovation';
             return null;
        }

        // --- PENGUMPULAN DATA DASAR ---
        switch (true) {
            case compKey === 'dr':
                const drCapexDetails = this._calculateDrCapex();
                capexSchedule[0] = drCapexDetails.total;
                const drBreakdown = drCapexDetails.breakdown;
                capexBreakdown.civil_construction += drBreakdown.civil_construction;
                capexBreakdown.building += drBreakdown.building;
                capexBreakdown.equipment += drBreakdown.equipment_and_tech + drBreakdown.furniture_and_interior;
                capexBreakdown.other += drBreakdown.other;
                
                baseAnnualRevenue = this._getUnitCalculations('drivingRange').pnl.annualRevenue;
                baseOpex = extractOpex(projectConfig.drivingRange.opexMonthly);
                break;

            case compKey.includes('padel'):
                const padelScenarioKey = getPadelScenarioKey();
                const padelScenario = projectConfig.padel.scenarios[padelScenarioKey];
                const padelBaseCapex = this._calculatePadelCapex(padelScenarioKey);
                capexSchedule[0] = padelBaseCapex * (1 + projectConfig.assumptions.contingency_rate);
                const padelCapexConf = padelScenario.capex;
                capexBreakdown.building += this._calculateTotal(padelCapexConf.component_koperasi_new_build || {}) + this._calculateTotal(padelCapexConf.component_futsal_renovation || {});
                capexBreakdown.equipment += this._calculateTotal(padelCapexConf.sport_courts_equipment || {});
                capexBreakdown.other += this._calculateTotal(padelCapexConf.pre_operational || {});
                baseAnnualRevenue = this._getUnitCalculations('padel', padelScenarioKey).pnl.annualRevenue;
                baseOpex = extractOpex(padelScenario.opexMonthly);
                break;

            case compKey === 'mp':
                const baseMpCapex = this._calculateMeetingPointCapex('renovate', 'concept_1_pods');
                capexSchedule[0] = baseMpCapex * (1 + projectConfig.assumptions.contingency_rate);
                const constructionCosts = this._calculateTotal(projectConfig.meetingPoint.capex_scenarios.construction_scenarios.renovate.base_costs);
                const conceptCosts = baseMpCapex - constructionCosts;
                capexBreakdown.building += constructionCosts;
                capexBreakdown.equipment += conceptCosts;
                baseAnnualRevenue = this._calculateTotal(projectConfig.meetingPoint.revenue) * 12;
                baseOpex = extractOpex(projectConfig.meetingPoint.opexMonthly);
                break;

            case compKey === 'shared':
                capexSchedule[0] = this._calculateTotal(projectConfig.shared_facilities_capex) * (1 + projectConfig.assumptions.contingency_rate);
                capexBreakdown.shared_facilities = capexSchedule[0];
                break;

            case compKey === 'digital':
                 capexSchedule[0] = this._calculateTotal(projectConfig.digital_capex) * (1 + projectConfig.assumptions.contingency_rate);
                 capexBreakdown.digital_systems = capexSchedule[0];
                break;
        }
        
        // --- PROYEKSI MULTI-TAHUN PER KOMPONEN ---
        for (let year = 1; year <= years; year++) {
            const tariffFactor = Math.pow(1 + esc.tariff_increase_rate, Math.floor((year - 1) / esc.tariff_increase_every_x_years));
            revenue[year] = baseAnnualRevenue * tariffFactor;
            const salaryFactor = Math.pow(1 + esc.salary_increase_rate, year - 1);
            const otherFactor = Math.pow(1 + 0.021, year - 1);
            opex[year] = (baseOpex.salaries * salaryFactor) + (baseOpex.other * otherFactor);
        }
        
        // Rekondisi untuk beberapa aset
        if (compKey.includes('padel') || compKey === 'mp') {
             capexSchedule[5] += capexSchedule[0] * 0.40;
        }

        // Kalkulasi depresiasi untuk komponen ini saja
        const depreciation = this._calculateMultiYearDepreciation(capexSchedule, years, capexBreakdown);
        
        return { capexSchedule, capexBreakdown, revenue, opex, depreciation };
    },

    buildFinancialModelForScenario(scenarioKey) {
        // === LANGKAH 1: TENTUKAN KOMPONEN AKTIF BERDASARKAN SKENARIO ===
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
        let totalCapex = 0;

        // === LANGKAH 2: HITUNG PROYEKSI DASAR (CAPEX, REVENUE, OPEX, DEPRESIASI) UNTUK TIAP UNIT SECARA TERPISAH ===
        components.forEach(compKey => {
            const unitFinancials = this._getFinancialsForComponent(compKey, projectionYears);
            individualResults[compKey] = unitFinancials;
            
            // Akumulasikan total investasi awal untuk perhitungan pinjaman
            totalCapex += unitFinancials.capexSchedule[0];
        });

        // === LANGKAH 3: HITUNG BIAYA BERSAMA (PINJAMAN & BUNGA) BERDASARKAN TOTAL INVESTASI ===
        const financing = this._calculateLoanAmortization(totalCapex, projectConfig.assumptions.financing, projectionYears);

        // === LANGKAH 4: FINALKAN LAPORAN LABA RUGI UNTUK TIAP UNIT DENGAN MENGALOKASIKAN BIAYA BERSAMA ===
        Object.keys(individualResults).forEach(key => {
            const unit = individualResults[key];
            const unitCapex = unit.capexSchedule[0];
            // Tentukan porsi unit ini dari total investasi untuk alokasi bunga
            const interestAllocationRatio = totalCapex > 0 ? (unitCapex / totalCapex) : 0;
            
            // Inisialisasi struktur P&L lengkap untuk unit ini
            unit.pnl = {
                revenue: unit.revenue,
                opex: unit.opex,
                ebitda: Array(projectionYears + 1).fill(0),
                depreciation: unit.depreciation,
                ebit: Array(projectionYears + 1).fill(0),
                interest: Array(projectionYears + 1).fill(0),
                ebt: Array(projectionYears + 1).fill(0),
                tax: Array(projectionYears + 1).fill(0),
                netIncome: Array(projectionYears + 1).fill(0)
            };
            
            // Hitung P&L tahun per tahun untuk unit ini
            for (let year = 1; year <= projectionYears; year++) {
                unit.pnl.ebitda[year] = unit.revenue[year] - unit.opex[year];
                unit.pnl.ebit[year] = unit.pnl.ebitda[year] - unit.pnl.depreciation[year];
                // Alokasikan bunga berdasarkan porsi investasi
                unit.pnl.interest[year] = financing.interestPayments[year] * interestAllocationRatio;
                unit.pnl.ebt[year] = unit.pnl.ebit[year] - unit.pnl.interest[year];
                unit.pnl.tax[year] = unit.pnl.ebt[year] > 0 ? unit.pnl.ebt[year] * projectConfig.assumptions.tax_rate_profit : 0;
                unit.pnl.netIncome[year] = unit.pnl.ebt[year] - unit.pnl.tax[year];
            }
        });

        // === LANGKAH 5: BUAT MODEL GABUNGAN DENGAN MENJUMLAHKAN SEMUA HASIL INDIVIDUAL YANG SUDAH FINAL ===
        let combined = this._createCombinedModel(individualResults, financing, projectionYears);
        
        // === LANGKAH 6: KEMBALIKAN HASIL LENGKAP (INDIVIDUAL DAN GABUNGAN) ===
        return { individual: individualResults, combined: combined };
    },

    buildFinancialModelForScenario(scenarioKey) {
        let components = [];
        if (scenarioKey.includes('dr')) components.push('dr');
        if (scenarioKey.includes('padel4')) components.push('padel4');
        if (scenarioKey.includes('padel2')) components.push('padel2');
        if (scenarioKey.includes('mp')) components.push('mp');
        if (components.length > 0) {
            components.push('shared');
            components.push('digital');
        }

        const projectionYears = 10;
        let individualResults = {};
        let totalCapex = 0;

        // 1. Hitung finansial untuk setiap komponen secara terpisah
        components.forEach(compKey => {
            const unitFinancials = this._getFinancialsForComponent(compKey, projectionYears);
            individualResults[compKey] = unitFinancials;
            totalCapex += unitFinancials.capexSchedule[0];
        });

        // 2. Hitung biaya bersama (bunga)
        const financing = this._calculateLoanAmortization(totalCapex, projectConfig.assumptions.financing, projectionYears);

        // 3. Proyeksikan Laba Rugi per unit dengan alokasi bunga
        Object.keys(individualResults).forEach(key => {
            const unit = individualResults[key];
            const unitCapex = unit.capexSchedule[0];
            const interestAllocationRatio = totalCapex > 0 ? (unitCapex / totalCapex) : 0;
            
            unit.pnl = {
                revenue: unit.revenue,
                opex: unit.opex,
                ebitda: Array(projectionYears + 1).fill(0),
                depreciation: unit.depreciation,
                ebit: Array(projectionYears + 1).fill(0),
                interest: Array(projectionYears + 1).fill(0),
                ebt: Array(projectionYears + 1).fill(0),
                tax: Array(projectionYears + 1).fill(0),
                netIncome: Array(projectionYears + 1).fill(0)
            };

            for (let year = 1; year <= projectionYears; year++) {
                unit.pnl.ebitda[year] = unit.revenue[year] - unit.opex[year];
                unit.pnl.ebit[year] = unit.pnl.ebitda[year] - unit.pnl.depreciation[year];
                unit.pnl.interest[year] = financing.interestPayments[year] * interestAllocationRatio;
                unit.pnl.ebt[year] = unit.pnl.ebit[year] - unit.pnl.interest[year];
                unit.pnl.tax[year] = unit.pnl.ebt[year] > 0 ? unit.pnl.ebt[year] * projectConfig.assumptions.tax_rate_profit : 0;
                unit.pnl.netIncome[year] = unit.pnl.ebt[year] - unit.pnl.tax[year];
            }
        });

        // 4. Buat model gabungan dengan menjumlahkan hasil individual
        let combined = this._createCombinedModel(individualResults, financing, projectionYears);
        
        return { individual: individualResults, combined: combined };
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

    _createCombinedModel(individualResults, financing, projectionYears) {
        let combined = {
            capexSchedule: Array(projectionYears + 1).fill(0),
            revenue: Array(projectionYears + 1).fill(0),
            opex: Array(projectionYears + 1).fill(0),
            depreciation: Array(projectionYears + 1).fill(0),
        };
        for(const key in individualResults) {
            const unit = individualResults[key];
            for(let i=0; i<=projectionYears; i++) {
                combined.capexSchedule[i] += unit.capexSchedule[i];
                combined.revenue[i] += unit.revenue[i];
                combined.opex[i] += unit.opex[i];
                combined.depreciation[i] += unit.depreciation[i];
            }
        }
        const incomeStatement = this._buildIncomeStatement({ ...combined, interest: financing.interestPayments, projectionYears });
        const cashFlowStatement = this._buildCashFlowStatement({ incomeStatement, depreciation: combined.depreciation, capexSchedule: combined.capexSchedule, financing, projectionYears });
        const feasibilityMetrics = this._calculateFeasibilityMetrics(cashFlowStatement.netCashFlow, projectConfig.assumptions.discount_rate_wacc);
        return { ...combined, financing, incomeStatement, cashFlowStatement, feasibilityMetrics };
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

    _calculateMultiYearDepreciation(capexSchedule, years, capexBreakdown) {
        let projectedDepreciation = Array(years + 1).fill(0);
        const depRates = projectConfig.assumptions.depreciation_years;

        // Hitung depresiasi dari investasi awal (Tahun 0)
        let initialAnnualDepreciation = 0;
        for (const category in capexBreakdown) {
            if (capexBreakdown[category] > 0) {
                const lifespan = depRates[category] || 10; // Default 10 tahun
                initialAnnualDepreciation += capexBreakdown[category] / lifespan;
            }
        }
        for (let year = 1; year <= years; year++) {
            projectedDepreciation[year] += initialAnnualDepreciation;
        }

        if (capexSchedule[5] > 0) {
            const recondDepreciation = capexSchedule[5] / 10; // Asumsi masa manfaat 10 tahun untuk rekondisi
            for (let year = 6; year <= years; year++) {
                projectedDepreciation[year] += recondDepreciation;
            }
        }
        return projectedDepreciation;
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
                if (value.count && value.salary) return sum + (value.count * value.salary);
                if (value.quantity && value.unit_cost) return sum + (value.quantity * value.unit_cost);
                if (value.area_m2 && value.cost_per_m2) return sum + (value.area_m2 * value.cost_per_m2);
                if (value.toilet_unit && value.area_m2_per_toilet && value.cost_per_m2) return sum + (value.toilet_unit * value.area_m2_per_toilet * value.cost_per_m2);
                if (value.lump_sum) return sum + value.lump_sum;
                return sum + this._calculateTotal(value);
            }
            return sum;
        }, 0);
    },

    _calculateDrCapex() {
        const a = projectConfig.drivingRange.capex_assumptions;
        const global = projectConfig.assumptions;
        const rev = projectConfig.drivingRange.revenue.main_revenue;
        const drScenarios = projectConfig.drivingRange.scenarios;

        // --- 1. Hitung setiap komponen biaya secara terpisah ---

        // a. Peralatan Inti (Bay & Bola)
        const eq = a.equipment;
        const total_bays = rev.bays;
        const premium_bays_count = Math.round(total_bays * eq.premium_bays.percentage_of_total);
        const normal_bays_count = total_bays - premium_bays_count;
        const totalEquipmentCost = (premium_bays_count * eq.premium_bays.cost_per_bay_ball_tracker) +
                                (premium_bays_count * eq.premium_bays.cost_per_bay_dispenser) +
                                (normal_bays_count * eq.normal_bays.bay_equipment_cost_per_set) +
                                (eq.floating_balls_count * eq.floating_balls_cost_per_ball) +
                                eq.ball_management_system_lump_sum;

        // b. Jaring Pengaman (Perimeter + Atap Opsional)
        const net = a.safety_net;
        const totalPerimeterNetCost = (Math.ceil(net.field_width_m / net.poles.spacing_m) * net.poles.foundation_cost_per_pole) + // Sisi jauh
                                    (Math.ceil(net.field_length_m / net.poles.spacing_m) * 2 * net.poles.foundation_cost_per_pole) + // Dua sisi panjang
                                    ((net.field_width_m * net.poles.height_distribution.far_side_m) * net.netting.cost_per_m2) + // Net sisi jauh
                                    ((net.field_length_m * net.poles.height_distribution.left_right_side_m * 2) * net.netting.cost_per_m2); // Net dua sisi
        let lakeRoofNetCost = 0;
        if (drScenarios.include_lake_roof_net) {
            lakeRoofNetCost = net.lake_roof_netting.area_m2 * net.lake_roof_netting.cost_per_m2;
        }
        const totalSafetyNetCost = totalPerimeterNetCost + lakeRoofNetCost;

        // c. Furnitur, Sanitasi, dan Bangunan
        const totalBayFurnitureCost = total_bays * a.bay_furniture.cost_per_bay;
        const sanitary = a.plumbing_and_sanitary;
        const costs = sanitary.unit_costs;
        const totalSanitaryCost = (sanitary.male_toilet.toilets * costs.toilet_bowl) + (sanitary.male_toilet.urinals * costs.urinal) + (sanitary.male_toilet.sinks * costs.sink) + (sanitary.female_toilet.toilets * costs.toilet_bowl) + (sanitary.female_toilet.sinks * costs.sink);
        const bld = a.building;
        const totalBuildingCost = (bld.dr_bays_area_m2 * bld.dr_bays_cost_per_m2) + (bld.cafe_area_m2 * bld.cafe_cost_per_m2) + (bld.lockers_mushola_area_m2 * bld.lockers_mushola_cost_per_m2);

        // --- 2. Fungsi Helper untuk agregasi ---
        const calculateScenarioCosts = (foundationCosts) => {
            const mep = a.mep_systems;
            const total_mep_cost = (bld.cafe_area_m2 * mep.hvac_system.cost_per_m2_hvac) +
                                (mep.plumbing_system.lump_sum_cost + totalSanitaryCost);

            const physical_cost_base = foundationCosts + totalBuildingCost + totalEquipmentCost + totalSafetyNetCost + totalBayFurnitureCost;
            const electrical_cost = physical_cost_base * mep.electrical_system.rate_of_physical_cost;
            const total_physical_cost = physical_cost_base + total_mep_cost + electrical_cost;
            const permit_cost = total_physical_cost * a.other_costs.permit_design_rate_of_physical_cost;
            const subtotal = total_physical_cost + permit_cost;
            const contingency = subtotal * global.contingency_rate;

            return {
                total: subtotal + contingency,
                // RINCIAN BREAKDOWN YANG JAUH LEBIH DETAIL
                breakdown: {
                    civil_construction: foundationCosts + totalSafetyNetCost, // Jaring adalah struktur sipil
                    building: totalBuildingCost,
                    equipment_and_tech: totalEquipmentCost, // HANYA peralatan inti
                    furniture_and_interior: totalBayFurnitureCost,
                    other: total_mep_cost + electrical_cost + permit_cost + contingency
                }
            };
        };

        // --- 3. Hitung Skenario Konstruksi ---
        const pil = a.piling;
        const scenario_b_foundation_cost = (pil.points_count * pil.length_per_point_m * pil.cost_per_m_mini_pile) + pil.lump_sum_pile_cap;
        const scenario_b_results = calculateScenarioCosts(scenario_b_foundation_cost);
        
        // Kita hanya mengembalikan skenario B (Tiang Pancang) yang lebih realistis
        return {
            total: scenario_b_results.total,
            breakdown: scenario_b_results.breakdown
        };
    },

    _calculatePadelCapex(scenarioKey) {
        const scenario = projectConfig.padel.scenarios[scenarioKey];
        if (!scenario || !scenario.capex) {
            console.warn(`Konfigurasi skenario Padel untuk '${scenarioKey}' tidak ditemukan.`);
            return 0;
        }

        const capex = scenario.capex;
        let grandTotal = 0;

        grandTotal += this._calculateTotal(capex.pre_operational || {});

        if (capex.component_futsal_renovation) {
            grandTotal += this._calculateTotal(capex.component_futsal_renovation);
        }

        if (capex.component_koperasi_new_build) {
            const buildData = capex.component_koperasi_new_build;
            grandTotal += this._calculateTotal(buildData.land_preparation_and_foundation || {});
            grandTotal += this._calculateTotal(buildData.building_structure_2_courts || {});
            grandTotal += this._calculateTotal(buildData.interior_and_facade || {});
            grandTotal += this._calculateTotal(buildData.building_demolition || {});
            
            // PERBAIKAN LOGIKA DI SINI
            if (buildData.plumbing_and_sanitary) {
                const ps = buildData.plumbing_and_sanitary;
                grandTotal += (ps.toilet_unit * ps.area_m2 * ps.cost_per_m2);
            }
        }

        if (capex.sport_courts_equipment) {
            const numCourts = scenario.num_courts;
            const equipment = capex.sport_courts_equipment;
            if (equipment.per_court_costs) {
                grandTotal += this._calculateTotal(equipment.per_court_costs) * numCourts;
            }
            if (equipment.initial_inventory) {
                grandTotal += this._calculateTotal(equipment.initial_inventory);
            }
        }

        return grandTotal;
    },

    _calculateMeetingPointCapex(constructionScenarioKey = 'renovate', conceptScenarioKey = 'concept_1_pods') {
        const mpConfig = projectConfig.meetingPoint;
        if (!mpConfig || !mpConfig.capex_scenarios.construction_scenarios[constructionScenarioKey] || !mpConfig.capex_scenarios.concept_scenarios[conceptScenarioKey]) {
            console.warn("Meeting Point config is missing or invalid for the selected scenarios.");
            return 0;
        }

        const unitCosts = mpConfig.unit_costs;
        let totalCapex = 0;

        // 1. Hitung biaya dari skenario konstruksi yang dipilih
        const constructionData = mpConfig.capex_scenarios.construction_scenarios[constructionScenarioKey].base_costs;
        totalCapex += this._calculateTotal(constructionData);

        // 2. Hitung biaya dari skenario konsep interior yang dipilih
        const conceptData = mpConfig.capex_scenarios.concept_scenarios[conceptScenarioKey].items;
        const conceptCostMap = {
            chairs: unitCosts.chair,
            tables_2pax: unitCosts.table_2pax,
            tables_4pax: unitCosts.table_4pax,
            sofas: unitCosts.sofa,
            coffee_tables: unitCosts.coffee_table,
            meeting_pods: unitCosts.meeting_pod,
            vip_partitions: unitCosts.vip_partition,
            vip_tables: unitCosts.vip_table,
            vip_chairs: unitCosts.vip_chair,
            kitchen: unitCosts.kitchen_equipment_lump_sum,
            toilet: unitCosts.toilet_unit_lump_sum
        };

        for (const itemKey in conceptData) {
            const count = conceptData[itemKey];
            if (count > 0 && conceptCostMap[itemKey]) {
                totalCapex += count * conceptCostMap[itemKey];
            }
        }
        
        return totalCapex;
    },

    _getUnitCalculations(unitName, padelScenarioKey = 'four_courts_combined') {
        const unit = projectConfig[unitName];
        if (!unit) return { pnl: { annualRevenue: 0 } };

        let numAssets, revenueConf, o;

        if (unitName === 'padel') {
            const scenarioConfig = unit.scenarios[padelScenarioKey];
            if (!scenarioConfig) return { pnl: { annualRevenue: 0 } };
            numAssets = scenarioConfig.num_courts;
            revenueConf = scenarioConfig.revenue;
            o = scenarioConfig.operational_assumptions;
        } else { // Untuk Driving Range dan unit lainnya
            numAssets = unit.revenue.main_revenue.bays;
            revenueConf = unit.revenue;
            o = unit.operational_assumptions;
        }

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
    },

    runSensitivityAnalysis(baseModel) {
        const sensitivityParams = projectConfig.assumptions.sensitivity_analysis;
        if (!sensitivityParams || !baseModel || !baseModel.combined) {
            console.warn("Parameter sensitivitas atau model gabungan tidak ditemukan.");
            return {};
        }

        const { revenue_steps, investment_steps } = sensitivityParams;
        let results = {
            combined: {
                npv: {},
                irr: {}
            }
        };
        const modelData = baseModel.combined;

        investment_steps.forEach(invStep => {
            results.combined.npv[invStep] = {};
            results.combined.irr[invStep] = {};

            revenue_steps.forEach(revStep => {
                let tempModel = JSON.parse(JSON.stringify(modelData));
                
                // Terapkan faktor sensitivitas
                tempModel.capexSchedule = tempModel.capexSchedule.map(c => c * invStep);
                tempModel.revenue = tempModel.revenue.map(r => r * revStep);
                tempModel.depreciation = tempModel.depreciation.map(d => d * invStep);

                // Kalkulasi ulang seluruh rantai finansial dengan data sementara
                const newFinancing = this._calculateLoanAmortization(tempModel.capexSchedule[0], projectConfig.assumptions.financing, 10);
                const pnl = this._buildIncomeStatement({ ...tempModel, interest: newFinancing.interestPayments, projectionYears: 10 });
                const cf = this._buildCashFlowStatement({ incomeStatement: pnl, depreciation: tempModel.depreciation, capexSchedule: tempModel.capexSchedule, financing: newFinancing, projectionYears: 10 });
                const metrics = this._calculateFeasibilityMetrics(cf.netCashFlow, projectConfig.assumptions.discount_rate_wacc);

                results.combined.npv[invStep][revStep] = metrics.npv;
                results.combined.irr[invStep][revStep] = metrics.irr;
            });
        });

        return results;
    },
};


window.sierMathFinance = sierMathFinance;