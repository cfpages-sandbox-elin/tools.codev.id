// File: sier-math-finance.js fix padel
// VERSI 3.0 LENGKAP - Arsitektur Modular Berbasis Skenario

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

    _safeTranslate(key) {
        if (typeof sierTranslate !== 'undefined' && sierTranslate.translate) {
            return sierTranslate.translate(key);
        }
        return (key || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
                    category: this._safeTranslate(category), 
                    capexValue: combinedCapex[category],
                    lifespan: lifespan,
                    lifespanPath: `assumptions.depreciation_years.${category}`,
                    annualDepreciation: annualDepreciation
                });
            }
        }
        return { details, totalAnnualDepreciation };
    },

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
        const depreciationDetails = this._getDepreciationDetailsForScenario(components);

        const incomeStatement = this._buildIncomeStatement({ ...combined, depreciation, interest: financing.interestPayments, projectionYears });
        const cashFlowStatement = this._buildCashFlowStatement({ incomeStatement, depreciation, capexSchedule: combined.capexSchedule, financing, projectionYears });
        const feasibilityMetrics = this._calculateFeasibilityMetrics(cashFlowStatement.netCashFlow, projectConfig.assumptions.discount_rate_wacc);
        
        combined.financing = financing;
        combined.depreciation = depreciation;
        combined.incomeStatement = incomeStatement;
        combined.cashFlowStatement = cashFlowStatement;
        combined.feasibilityMetrics = feasibilityMetrics;
        combined.depreciationDetails = depreciationDetails;

        return { individual: individualResults, combined: combined };
    },

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
        const global = projectConfig.assumptions;
        const createRow = (category, component, calc, val, path) => ({ category, component, calculation: calc, value: val, path });

        const net = a.safety_net;
        const poles_far = Math.ceil(net.field_width_m / net.poles.spacing_m);
        const poles_sides = Math.ceil(net.field_length_m / net.poles.spacing_m) * 2;
        const total_poles = poles_far + poles_sides;
        const pole_foundation_cost = total_poles * net.poles.foundation_cost_per_pole;
        const area_far = net.field_width_m * net.poles.height_distribution.far_side_m;
        const area_sides = net.field_length_m * net.poles.height_distribution.left_right_side_m * 2;
        const total_net_area = area_far + area_sides;
        const netting_material_cost = total_net_area * net.netting.cost_per_m2;
        const totalSafetyNetCost = pole_foundation_cost + netting_material_cost;

        const eq = a.equipment;
        const total_bays = projectConfig.drivingRange.revenue.main_revenue.bays;
        const premium_bays_count = Math.round(total_bays * eq.premium_bays.percentage_of_total);
        const normal_bays_count = total_bays - premium_bays_count;
        const eqCosts = {
            ball_tracker: premium_bays_count * eq.premium_bays.cost_per_bay_ball_tracker,
            dispenser: premium_bays_count * eq.premium_bays.cost_per_bay_dispenser,
            normal_bay_equip: normal_bays_count * eq.normal_bays.bay_equipment_cost_per_set,
            balls: eq.floating_balls_count * eq.floating_balls_cost_per_ball,
            management: eq.ball_management_system_lump_sum,
        };
        const totalEquipmentCost = Object.values(eqCosts).reduce((s, v) => s + v, 0);
        
        const equipment_detail_rows = [
            createRow('Teknologi', 'Sistem Ball-Tracking (Premium)', `${premium_bays_count} bay @ ...`, eqCosts.ball_tracker, 'drivingRange.capex_assumptions.equipment.premium_bays.cost_per_bay_ball_tracker'),
            createRow('Teknologi', 'Sistem Dispenser Bola (Premium)', `${premium_bays_count} bay @ ...`, eqCosts.dispenser, 'drivingRange.capex_assumptions.equipment.premium_bays.cost_per_bay_dispenser'),
            createRow('Operasional', 'Peralatan Bay Standar (Normal)', `${normal_bays_count} set @ ...`, eqCosts.normal_bay_equip, 'drivingRange.capex_assumptions.equipment.normal_bays.bay_equipment_cost_per_set'),
            createRow('Operasional', 'Inventaris Bola Apung', `${eq.floating_balls_count} buah @ ...`, eqCosts.balls, 'drivingRange.capex_assumptions.equipment.floating_balls_count'),
            createRow('Operasional', 'Sistem Manajemen Bola', 'Lump Sum', eqCosts.management, 'drivingRange.capex_assumptions.equipment.ball_management_system_lump_sum'),
            createRow('Keamanan', 'Pondasi Tiang Jaring', `${total_poles} tiang @ ...`, pole_foundation_cost, 'drivingRange.capex_assumptions.safety_net.poles.foundation_cost_per_pole'),
            createRow('Keamanan', 'Material & Pemasangan Jaring', `${sierHelpers.formatNumber(Math.round(total_net_area))} m² @ ...`, netting_material_cost, 'drivingRange.capex_assumptions.safety_net.netting.cost_per_m2'),
        ];
        
        const bld = a.building;
        const totalBuildingCost = (bld.dr_bays_area_m2 * bld.dr_bays_cost_per_m2) + (bld.cafe_area_m2 * bld.cafe_cost_per_m2) + (bld.lockers_mushola_area_m2 * bld.lockers_mushola_cost_per_m2);
        
        const calculateScenarioCosts = (foundationCosts) => {
            const mep = a.mep_systems;
            const hvac_cost = bld.cafe_area_m2 * mep.hvac_system.cost_per_m2_hvac;
            const plumbing_cost = mep.plumbing_system.lump_sum_cost;
            
            const physical_cost_base = foundationCosts + totalBuildingCost + totalEquipmentCost + totalSafetyNetCost;
            
            const electrical_cost = physical_cost_base * mep.electrical_system.rate_of_physical_cost;
            const total_mep_cost = hvac_cost + plumbing_cost + electrical_cost;

            const total_physical_cost = physical_cost_base + total_mep_cost;
            const permit_cost = total_physical_cost * a.other_costs.permit_design_rate_of_physical_cost;
            
            const subtotal = total_physical_cost + permit_cost;
            const contingency = subtotal * global.contingency_rate;

            return {
                mep_costs: { hvac_cost, plumbing_cost, electrical_cost },
                permit_cost,
                subtotal,
                contingency,
                total: subtotal + contingency
            };
        };

        const rec = a.reclamation;
        const scenario_a_foundation_cost = (rec.area_m2 * rec.lake_depth_m * rec.cost_per_m3) + (rec.sheet_pile_perimeter_m * rec.cost_per_m_sheet_pile);
        const scenario_a_results = calculateScenarioCosts(scenario_a_foundation_cost);

        const pil = a.piling;
        const scenario_b_foundation_cost = (pil.points_count * pil.length_per_point_m * pil.cost_per_m_mini_pile) + pil.lump_sum_pile_cap;
        const scenario_b_results = calculateScenarioCosts(scenario_b_foundation_cost);

        return {
            equipment_detail: { htmlRows: equipment_detail_rows, total: totalEquipmentCost + totalSafetyNetCost },
            scenario_a: {
                description: 'Skenario ini melibatkan pengurukan sebagian danau untuk menciptakan daratan baru sebagai landasan konstruksi. Ini bersifat permanen dan memiliki dampak lingkungan yang signifikan.',
                htmlRows: [
                    {label: 'Pekerjaan Pengurukan & Sheet Pile', calculation: 'Estimasi Biaya Fondasi Reklamasi', value: scenario_a_foundation_cost},
                    {label: 'Total Pekerjaan Bangunan', calculation: 'Estimasi Biaya Struktur Bangunan', value: totalBuildingCost},
                    {label: 'Total Peralatan & Jaring', calculation: 'Ref. Tabel Peralatan', value: totalEquipmentCost + totalSafetyNetCost},
                    {label: 'Sistem HVAC (AC)', calculation: `${bld.cafe_area_m2} m² @ ...`, value: scenario_a_results.mep_costs.hvac_cost, path: 'drivingRange.capex_assumptions.mep_systems.hvac_system.cost_per_m2_hvac'},
                    {label: 'Sistem Plumbing', calculation: `Lump Sum`, value: scenario_a_results.mep_costs.plumbing_cost, path: 'drivingRange.capex_assumptions.mep_systems.plumbing_system.lump_sum_cost'},
                    {label: 'Sistem Elektrikal', calculation: `${a.mep_systems.electrical_system.rate_of_physical_cost * 100}% dari biaya fisik dasar`, value: scenario_a_results.mep_costs.electrical_cost, path: 'drivingRange.capex_assumptions.mep_systems.electrical_system.rate_of_physical_cost'},
                    {label: 'Izin, Desain & Pengawasan', calculation: `${a.other_costs.permit_design_rate_of_physical_cost * 100}% dari biaya fisik`, value: scenario_a_results.permit_cost, path: 'drivingRange.capex_assumptions.other_costs.permit_design_rate_of_physical_cost'},
                ],
                subtotal: scenario_a_results.subtotal, contingency: scenario_a_results.contingency, total: scenario_a_results.total
            },
            scenario_b: {
                description: 'Skenario ini tidak menguruk danau, melainkan membangun struktur di atasnya dengan menggunakan pondasi tiang pancang. Skenario ini lebih ramah lingkungan.',
                htmlRows: [
                    {label: 'Pekerjaan Tiang Pancang & Pile Cap', calculation: 'Estimasi Biaya Fondasi Pancang', value: scenario_b_foundation_cost},
                    {label: 'Total Pekerjaan Bangunan', calculation: 'Estimasi Biaya Struktur Bangunan', value: totalBuildingCost},
                    {label: 'Total Peralatan & Jaring', calculation: 'Ref. Tabel Peralatan', value: totalEquipmentCost + totalSafetyNetCost},
                    {label: 'Sistem HVAC (AC)', calculation: `${bld.cafe_area_m2} m² @ ...`, value: scenario_b_results.mep_costs.hvac_cost, path: 'drivingRange.capex_assumptions.mep_systems.hvac_system.cost_per_m2_hvac'},
                    {label: 'Sistem Plumbing', calculation: `Lump Sum`, value: scenario_b_results.mep_costs.plumbing_cost, path: 'drivingRange.capex_assumptions.mep_systems.plumbing_system.lump_sum_cost'},
                    {label: 'Sistem Elektrikal', calculation: `${a.mep_systems.electrical_system.rate_of_physical_cost * 100}% dari biaya fisik dasar`, value: scenario_b_results.mep_costs.electrical_cost, path: 'drivingRange.capex_assumptions.mep_systems.electrical_system.rate_of_physical_cost'},
                    {label: 'Izin, Desain & Pengawasan', calculation: `${a.other_costs.permit_design_rate_of_physical_cost * 100}% dari biaya fisik`, value: scenario_b_results.permit_cost, path: 'drivingRange.capex_assumptions.other_costs.permit_design_rate_of_physical_cost'},
                ],
                subtotal: scenario_b_results.subtotal, contingency: scenario_b_results.contingency, total: scenario_b_results.total
            }
        };
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
    }
};

window.sierMathFinance = sierMathFinance;