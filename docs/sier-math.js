// File: sier-math.js
// Berisi semua logika perhitungan untuk proyek SIER Sports Hub.
// File ini adalah "otak" dari aplikasi, tidak ada interaksi DOM di sini.

const sierMath = {
    // ====================================================================
    // HELPER UTILITIES
    // ====================================================================
    getValueByPath(obj, path) {
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
    },
    setValueByPath(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
        target[lastKey] = value;
    },
    _calculateTotal(dataObject) {
        if (typeof dataObject !== 'object' || dataObject === null) return 0;
        return Object.values(dataObject).reduce((sum, value) => {
            if (typeof value === 'number') return sum + value;
            if (typeof value === 'object' && value !== null) {
                if ('count' in value && 'salary' in value) return sum + (value.count * value.salary);
                if ('electricity_kwh_price' in value && 'electricity_kwh_usage' in value) {
                    let utilitySum = value.electricity_kwh_price * value.electricity_kwh_usage;
                    for (const key in value) {
                        if (key !== 'electricity_kwh_price' && key !== 'electricity_kwh_usage' && typeof value[key] === 'number') {
                            utilitySum += value[key];
                        }
                    }
                    return sum + utilitySum;
                }
                return sum + this._calculateTotal(value);
            }
            return sum;
        }, 0);
    },

    // ====================================================================
    // DEMOGRAPHY & MARKET CALCULATIONS
    // ====================================================================
    getDemographySummary() {
        if (typeof demographyData === 'undefined') return {};
        const totalPopulation = demographyData.reduce((sum, item) => sum + item.total, 0);
        const totalRing1 = demographyData.filter(d => d.ring === 1).reduce((sum, i) => sum + i.total, 0);
        const totalRing2 = demographyData.filter(d => d.ring === 2).reduce((sum, i) => sum + i.total, 0);
        
        const totalsByAge = { '0-14 Thn': 0, '15-24 Thn': 0, '25-39 Thn': 0, '40-54 Thn': 0, '55-64 Thn': 0, '65+ Thn': 0 };
        demographyData.forEach(i => {
            totalsByAge['0-14 Thn'] += i['usia0-14']; 
            totalsByAge['15-24 Thn'] += i['usia15-24']; 
            totalsByAge['25-39 Thn'] += i['usia25-39'];
            totalsByAge['40-54 Thn'] += i['usia40-54']; 
            totalsByAge['55-64 Thn'] += i['usia55-64']; 
            totalsByAge['65+ Thn'] += i.usia65_plus;
        });
        
        const totalProductive = totalsByAge['15-24 Thn'] + totalsByAge['25-39 Thn'] + totalsByAge['40-54 Thn'] + totalsByAge['55-64 Thn'];
        const totalNonProductive = totalsByAge['0-14 Thn'] + totalsByAge['65+ Thn'];
        const dependencyRatio = totalProductive > 0 ? ((totalNonProductive / totalProductive) * 100).toFixed(2) : 0;
        
        const totalsByKecamatan = demographyData.reduce((acc, curr) => {
            acc[curr.kecamatan] = (acc[curr.kecamatan] || 0) + curr.total;
            return acc;
        }, {});

        return { totalPopulation, totalRing1, totalRing2, totalsByAge, totalProductive, totalNonProductive, dependencyRatio, totalsByKecamatan };
    },
    getDetailedDemography() {
        if (typeof demographyData === 'undefined') return null;
        const ageLabels = ['0-14 Thn', '15-24 Thn', '25-39 Thn', '40-54 Thn', '55-64 Thn', '65+ Thn'];
        const emptyAgeObject = () => ageLabels.reduce((acc, label) => ({...acc, [label]: 0}), {});

        const byRing1 = emptyAgeObject();
        const byRing2 = emptyAgeObject();
        const byKecamatan = {};

        demographyData.forEach(row => {
            const target = row.ring === 1 ? byRing1 : byRing2;
            if (!byKecamatan[row.kecamatan]) byKecamatan[row.kecamatan] = emptyAgeObject();
            
            ageLabels.forEach(label => {
                const key = `usia${label.toLowerCase().replace(' thn', '').replace('+', '_plus').replace(/\s/g, '').replace('-','_')}`;
                const dataKey = (label === '65+ Thn') ? 'usia65_plus' : `usia${label.split(' ')[0]}`;
                const dataValue = row[dataKey.replace('_','-')] || 0;
                
                target[label] += dataValue;
                byKecamatan[row.kecamatan][label] += dataValue;
            });
        });
        return { ageLabels, byRing1, byRing2, byKecamatan };
    },
    getIncomeAndMarketSummary() {
        if (typeof demographyData === 'undefined') return null;
        const estimatedIncomeData = demographyData.map(row => {
            const dependent = row['usia0-14'] + row.usia65_plus;
            const lowIncome = row['usia15-24'];
            const productiveCore = row['usia25-39'] + row['usia40-54'] + row['usia55-64'];
            let highIncome = (row.ring === 1) ? Math.round(productiveCore * 0.30) : Math.round(productiveCore * 0.15);
            let middleIncome = productiveCore - highIncome;
            return { ...row, incomeDependent: dependent, incomeLow: lowIncome, incomeMiddle: middleIncome, incomeHigh: highIncome };
        });

        const kecamatanNames = [...new Set(demographyData.map(d => d.kecamatan))];
        const byIncomeKecamatan = Object.fromEntries(kecamatanNames.map(k => [k, { low: 0, middle: 0, high: 0 }]));
        const marketData = Object.fromEntries(kecamatanNames.map(k => [k, { middleIncome: 0, highIncome: 0 }]));

        estimatedIncomeData.forEach(row => {
            byIncomeKecamatan[row.kecamatan].low += row.incomeLow;
            byIncomeKecamatan[row.kecamatan].middle += row.incomeMiddle;
            byIncomeKecamatan[row.kecamatan].high += row.incomeHigh;
            marketData[row.kecamatan].middleIncome += row.incomeMiddle;
            marketData[row.kecamatan].highIncome += row.incomeHigh;
        });

        const totalTargetByAge = demographyData.reduce((acc, row) => {
            acc.age25_39 += row['usia25-39']; acc.age40_54 += row['usia40-54']; acc.age55_64 += row['usia55-64'];
            return acc;
        }, { age25_39: 0, age40_54: 0, age55_64: 0 });

        return { estimatedIncomeData, byIncomeKecamatan, marketData, kecamatanNames, totalTargetByAge };
    },

    // ====================================================================
    // SURVEY & SAMPLING CALCULATIONS
    // ====================================================================
    slovin(N, e) {
        return Math.ceil(N / (1 + N * e * e));
    },
    getSurveyAnalysis() {
        if (typeof surveyRawData === 'undefined' || !surveyRawData) return { hasData: false };
        const headers = ["Nama", "Perusahaan", "Posisi", "Domisili", "Kelompok Usia", "Status Pekerjaan", "Pengalaman Olahraga", "Minat Driving Range", "Frekuensi Driving Range", "Waktu Ideal Driving Range", "Biaya Wajar Driving Range", "Fitur Penting Driving Range", "Familiar PADEL", "Minat PADEL", "Frekuensi PADEL", "Waktu Ideal PADEL", "Biaya Sewa PADEL", "Fitur Penting PADEL", "Pilihan Fasilitas", "Pemanfaatan Fasilitas", "Pendorong Rutin", "Saran Lain"];
        const parsedData = surveyRawData.trim().split('\n').map(row => {
            const values = row.split('\t');
            let obj = {};
            headers.forEach((header, i) => { obj[header] = (values[i] || '').trim(); });
            return obj;
        });
        
        const aggregate = (key, isMulti = false) => parsedData.reduce((acc, row) => {
            const answer = row[key];
            if (answer && !['-', 'na', 'tidak', ''].includes(answer.toLowerCase())) {
                if (isMulti) answer.split(', ').forEach(item => { const trimmed = item.trim(); if(trimmed) acc[trimmed] = (acc[trimmed] || 0) + 1; });
                else acc[answer] = (acc[answer] || 0) + 1;
            } return acc;
        }, {});
        
        const ageGroups = ['Di bawah 25 tahun', '25 - 35 tahun', '36 - 45 tahun', '46 - 55 tahun', 'Diatas 55 tahun'];
        const facilityChoices = ['Driving Range Golf', 'Lapangan PADEL', 'Keduanya sama menariknya bagi saya'];
        let choiceVsAgeData = facilityChoices.reduce((acc, choice) => ({ ...acc, [choice]: ageGroups.reduce((a, age) => ({ ...a, [age]: 0 }), {}) }), {});
        parsedData.forEach(row => {
            if (facilityChoices.includes(row['Pilihan Fasilitas']) && ageGroups.includes(row['Kelompok Usia'])) {
                choiceVsAgeData[row['Pilihan Fasilitas']][row['Kelompok Usia']]++;
            }
        });
        
        const interestMap = { 'Sangat Tertarik': 5, 'Tertarik': 4, 'Cukup Tertarik': 3, 'Kurang Tertarik': 2, 'Tidak Tertarik Sama Sekali': 1 };
        const correlationData = parsedData.reduce((acc, row) => {
            const golf = interestMap[row['Minat Driving Range']] || 0;
            const padel = interestMap[row['Minat PADEL']] || 0;
            if(golf > 0 && padel > 0) {
                const key = `${golf},${padel}`;
                acc[key] = (acc[key] || 0) + 1;
            } return acc;
        }, {});

        return {
            hasData: true, parsedData,
            aggregated: {
                'Pilihan Fasilitas': aggregate('Pilihan Fasilitas'), 'Minat PADEL': aggregate('Minat PADEL'),
                'Kelompok Usia': aggregate('Kelompok Usia'), 'Fitur Penting PADEL': aggregate('Fitur Penting PADEL', true)
            },
            choiceVsAge: { labels: facilityChoices, datasets: ageGroups.map((age, i) => ({ label: age, data: facilityChoices.map(c => choiceVsAgeData[c][age]), backgroundColor: ['#4ade80', '#818cf8', '#fb923c', '#60a5fa', '#f87171'][i] })) },
            correlation: Object.keys(correlationData).map(key => ({ x: parseInt(key.split(',')[0]), y: parseInt(key.split(',')[1]), r: correlationData[key] * 4 })),
            themeColors: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(236, 72, 153, 0.7)', 'rgba(139, 92, 246, 0.7)', 'rgba(20, 184, 166, 0.7)']
        };
    },

    // ====================================================================
    // CAPEX CALCULATIONS
    // ====================================================================
    _calculateDrCapex() {
        const a = projectConfig.drivingRange.capex_assumptions;
        const global = projectConfig.assumptions;
        const createRow = (category, component, calc, val, path) => ({ category, component, calculation: calc, value: val, path });

        const eq = a.equipment;
        const eqCosts = {
            ball_tracker: eq.ball_tracker_bays_count * eq.ball_tracker_cost_per_bay,
            dispenser: eq.ball_dispenser_system_lump_sum,
            bay_equipment: eq.bay_equipment_sets_count * eq.bay_equipment_cost_per_set,
            balls: eq.floating_balls_count * eq.floating_balls_cost_per_ball,
            management: eq.ball_management_system_lump_sum,
            safety_net: eq.safety_net_area_m2 * eq.safety_net_cost_per_m2,
        };
        const totalEquipmentCost = Object.values(eqCosts).reduce((s, v) => s + v, 0);
        
        const equipment_detail_rows = [
            createRow('Teknologi', 'Sistem Ball-Tracking', `${eq.ball_tracker_bays_count} bay @ ...`, eqCosts.ball_tracker, 'drivingRange.capex_assumptions.equipment.ball_tracker_cost_per_bay'),
            createRow('Teknologi', 'Sistem Dispenser Bola', 'Lump Sum', eqCosts.dispenser, 'drivingRange.capex_assumptions.equipment.ball_dispenser_system_lump_sum'),
            createRow('Operasional', 'Peralatan Bay (Matras & Partisi)', `${eq.bay_equipment_sets_count} set @ ...`, eqCosts.bay_equipment, 'drivingRange.capex_assumptions.equipment.bay_equipment_cost_per_set'),
            createRow('Operasional', 'Inventaris Bola Apung', `${eq.floating_balls_count} buah @ ...`, eqCosts.balls, 'drivingRange.capex_assumptions.equipment.floating_balls_cost_per_ball'),
            createRow('Operasional', 'Sistem Manajemen Bola', 'Lump Sum', eqCosts.management, 'drivingRange.capex_assumptions.equipment.ball_management_system_lump_sum'),
            createRow('Keamanan', 'Jaring Pengaman', `${eq.safety_net_area_m2} m² @ ...`, eqCosts.safety_net, 'drivingRange.capex_assumptions.equipment.safety_net_cost_per_m2'),
        ];
        
        const bld = a.building;
        const totalBuildingCost = (bld.dr_bays_area_m2 * bld.dr_bays_cost_per_m2) + (bld.cafe_area_m2 * bld.cafe_cost_per_m2);
        
        const rec = a.reclamation;
        const scenario_a_costs = {
            reclamation_work: rec.area_m2 * rec.lake_depth_m * rec.cost_per_m3,
            sheet_pile_work: rec.sheet_pile_perimeter_m * rec.cost_per_m_sheet_pile,
        };
        const physical_cost_a = scenario_a_costs.reclamation_work + scenario_a_costs.sheet_pile_work + totalBuildingCost + totalEquipmentCost;
        const mep_cost_a = totalBuildingCost * a.other_costs.mep_rate_of_building_cost;
        const permit_cost_a = physical_cost_a * a.other_costs.permit_design_rate_of_physical_cost;
        const subtotal_a = physical_cost_a + mep_cost_a + permit_cost_a;
        const contingency_a = subtotal_a * global.contingency_rate;

        const pil = a.piling;
        const scenario_b_costs = {
            piling_work: pil.points_count * pil.length_per_point_m * pil.cost_per_m_mini_pile,
            pile_cap_work: pil.lump_sum_pile_cap,
        };
        const physical_cost_b = scenario_b_costs.piling_work + scenario_b_costs.pile_cap_work + totalBuildingCost + totalEquipmentCost;
        const mep_cost_b = totalBuildingCost * a.other_costs.mep_rate_of_building_cost;
        const permit_cost_b = physical_cost_b * a.other_costs.permit_design_rate_of_physical_cost;
        const subtotal_b = physical_cost_b + mep_cost_b + permit_cost_b;
        const contingency_b = subtotal_b * global.contingency_rate;
        
        return {
            equipment_detail: { htmlRows: equipment_detail_rows, total: totalEquipmentCost },
            scenario_a: {
                description: 'Skenario ini melibatkan pengurukan sebagian danau untuk menciptakan daratan baru sebagai landasan konstruksi. Ini bersifat permanen dan memiliki dampak lingkungan yang signifikan.',
                htmlRows: [
                    {label: 'Pekerjaan Pengurukan', calculation: `${rec.area_m2} m² × ${rec.lake_depth_m} m @ ...`, value: scenario_a_costs.reclamation_work, path: 'drivingRange.capex_assumptions.reclamation.cost_per_m3'},
                    {label: 'Dinding Penahan Tanah', calculation: `${rec.sheet_pile_perimeter_m} m @ ...`, value: scenario_a_costs.sheet_pile_work, path: 'drivingRange.capex_assumptions.reclamation.cost_per_m_sheet_pile'},
                    {label: 'Total Pekerjaan Bangunan', calculation: 'Ref. Tabel Bangunan', value: totalBuildingCost},
                    {label: 'Total Peralatan & Teknologi', calculation: 'Ref. Tabel Peralatan', value: totalEquipmentCost},
                    {label: 'MEP', calculation: `${(a.other_costs.mep_rate_of_building_cost*100)}% dari biaya bangunan`, value: mep_cost_a, path: 'drivingRange.capex_assumptions.other_costs.mep_rate_of_building_cost'},
                    {label: 'Izin, Desain & Pengawasan', calculation: `${(a.other_costs.permit_design_rate_of_physical_cost*100)}% dari biaya fisik`, value: permit_cost_a, path: 'drivingRange.capex_assumptions.other_costs.permit_design_rate_of_physical_cost'},
                ],
                subtotal: subtotal_a, contingency: contingency_a, total: subtotal_a + contingency_a
            },
            scenario_b: {
                description: 'Skenario ini tidak menguruk danau, melainkan membangun struktur di atasnya dengan menggunakan pondasi tiang pancang. Skenario ini lebih ramah lingkungan.',
                 htmlRows: [
                    {label: 'Pekerjaan Tiang Pancang', calculation: `${pil.points_count} titik × ${pil.length_per_point_m} m @ ...`, value: scenario_b_costs.piling_work, path: 'drivingRange.capex_assumptions.piling.cost_per_m_mini_pile'},
                    {label: 'Pekerjaan Pile Cap & Tie Beam', calculation: `Lump Sum`, value: scenario_b_costs.pile_cap_work, path: 'drivingRange.capex_assumptions.piling.lump_sum_pile_cap'},
                    {label: 'Total Pekerjaan Bangunan', calculation: 'Ref. Tabel Bangunan', value: totalBuildingCost},
                    {label: 'Total Peralatan & Teknologi', calculation: 'Ref. Tabel Peralatan', value: totalEquipmentCost},
                    {label: 'MEP', calculation: `${(a.other_costs.mep_rate_of_building_cost*100)}% dari biaya bangunan`, value: mep_cost_b, path: 'drivingRange.capex_assumptions.other_costs.mep_rate_of_building_cost'},
                    {label: 'Izin, Desain & Pengawasan', calculation: `${(a.other_costs.permit_design_rate_of_physical_cost*100)}% dari biaya fisik`, value: permit_cost_b, path: 'drivingRange.capex_assumptions.other_costs.permit_design_rate_of_physical_cost'},
                ],
                subtotal: subtotal_b, contingency: contingency_b, total: subtotal_b + contingency_b
            }
        };
    },

    // ====================================================================
    // FINANCIAL ANALYSIS CALCULATIONS
    // ====================================================================
    _getUnitCalculations(unitName) {
        const unit = projectConfig[unitName];
        const global = projectConfig.assumptions;
        const o = unit.operational_assumptions; 

        let monthlyRevenueMain = 0;
        let fnbRevenueMonthly = 0;
        if (unitName === 'drivingRange') {
            const { main_revenue: m, ancillary_revenue: a } = unit.revenue;
            const sessions_wd = m.bays * m.occupancy_rate_per_day.weekday;
            const sessions_we = m.bays * m.occupancy_rate_per_day.weekend;
            const total_sessions = (sessions_wd * o.workdays_in_month) + (sessions_we * o.weekend_days_in_month);
            monthlyRevenueMain = total_sessions * m.price_per_100_balls;
            fnbRevenueMonthly = total_sessions * a.fnb_avg_spend;
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
        }
        
        const monthlyRevenueTotal = monthlyRevenueMain + fnbRevenueMonthly + unit.revenue.ancillary_revenue.pro_shop_sales;
        const opexMonthlyTotal = this._calculateTotal(unit.opexMonthly);
        const cogsMonthly = fnbRevenueMonthly * o.cogs_rate_fnb;

        const capexTotal = (unitName === 'drivingRange') ? this._calculateDrCapex().scenario_b.total : this._calculateTotal(unit.capex);
        
        const annualRevenue = monthlyRevenueTotal * 12;
        const annualCogs = cogsMonthly * 12;
        const annualOpex = opexMonthlyTotal * 12;
        const grossProfit = annualRevenue - annualCogs;
        const ebitda = grossProfit - annualOpex;
        
        // Simplifikasi Depresiasi untuk contoh
        const annualDepreciation = capexTotal / 15;

        const ebt = ebitda - annualDepreciation;
        const tax = ebt > 0 ? ebt * global.tax_rate_profit : 0;
        const netProfit = ebt - tax;
        const cashFlowFromOps = netProfit + annualDepreciation;

        return {
            capex: { total: capexTotal },
            pnl: { annualRevenue, annualCogs, annualOpex, grossProfit, ebitda, annualDepreciation, ebt, tax, netProfit, cashFlowFromOps },
        };
    },
    getFinancialSummary(revenueMultiplier = 1, opexMultiplier = 1) {
        // Logika ini perlu disesuaikan untuk menerapkan multiplier dengan benar
        const dr = this._getUnitCalculations('drivingRange');
        const padel = this._getUnitCalculations('padel');

        const combined = { capex: { total: dr.capex.total + padel.capex.total }, pnl: {} };
        for (const key in dr.pnl) {
            combined.pnl[key] = (dr.pnl[key] || 0) + (padel.pnl[key] || 0);
        }

        const totalInvestment = combined.capex.total;
        const cashFlow = combined.pnl.cashFlowFromOps;
        const paybackPeriod = cashFlow > 0 ? totalInvestment / cashFlow : Infinity;
        
        let npv = -totalInvestment;
        for(let i=1; i<=20; i++) {
            npv += cashFlow / Math.pow(1 + projectConfig.assumptions.discount_rate_wacc, i);
        }

        let irr = 0.0;
        // Simple IRR calculation
        for (let i = 0; i < 1.0; i += 0.001) {
            let tempNpv = -totalInvestment;
            for(let j=1; j<=20; j++) {
                tempNpv += cashFlow / Math.pow(1 + i, j);
            }
            if (tempNpv < 0) { irr = i > 0 ? i - 0.001 : 0; break; }
        }
        
        return {
            drivingRange: dr, padel: padel,
            combined: { ...combined, feasibility: { paybackPeriod, npv, irr } }
        };
    }
};

window.sierMath = sierMath;