// File: sier-math.js
// Berisi semua logika perhitungan untuk proyek SIER Sports Hub.
// File ini adalah "otak" dari aplikasi, tidak ada interaksi DOM di sini.

const sierMath = {
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
            totalsByAge['0-14 Thn'] += i.usia0_14;
            totalsByAge['15-24 Thn'] += i.usia15_24;
            totalsByAge['25-39 Thn'] += i.usia25_39;
            totalsByAge['40-54 Thn'] += i.usia40_54;
            totalsByAge['55-64 Thn'] += i.usia55_64;
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
                const key = `usia${label.toLowerCase().replace(' thn', '').replace('+', '_plus').replace(/\s/g, '').replace('-', '_')}`;
                
                target[label] += row[key] || 0;
                byKecamatan[row.kecamatan][label] += row[key] || 0;
            });
        });
        return { ageLabels, byRing1, byRing2, byKecamatan };
    },
    getIncomeAndMarketSummary() {
        if (typeof demographyData === 'undefined') return null;
        const estimatedIncomeData = demographyData.map(row => {
            const dependent = row.usia0_14 + row.usia65_plus;
            const lowIncome = row.usia15_24;
            const productiveCore = row.usia25_39 + row.usia40_54 + row.usia55_64;
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
            // FIX: Menggunakan dot notation yang benar.
            acc.age25_39 += row.usia25_39; 
            acc.age40_54 += row.usia40_54; 
            acc.age55_64 += row.usia55_64;
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

    /**
     * BARU: Menghitung rincian CapEx untuk sebuah unit bisnis (DR atau Padel).
     * @param {string} unitName - 'drivingRange' atau 'padel'
     * @returns {object} - Objek berisi total dan rincian CapEx per kategori aset.
     */
    _getDetailedCapex(unitName) {
        const p = projectConfig[unitName];
        let breakdown = { civil_construction: 0, building: 0, equipment: 0, interior: 0, other: 0 };

        if (unitName === 'drivingRange') {
            // Menggunakan skenario B (piling) sebagai basis.
            const drCapex = this._calculateDrCapex().scenario_b;
            const ca = p.capex_assumptions;
            
            // Alokasikan biaya ke kategori yang sesuai
            breakdown.civil_construction = drCapex.htmlRows.find(r => r.label.includes('Tiang Pancang')).value;
            breakdown.building = drCapex.htmlRows.find(r => r.label.includes('Pekerjaan Bangunan')).value;
            breakdown.equipment = drCapex.htmlRows.find(r => r.label.includes('Peralatan & Jaring')).value;
            // MEP dan Izin dialokasikan ke 'other' untuk simplisitas
            breakdown.other = drCapex.total - breakdown.civil_construction - breakdown.building - breakdown.equipment;

        } else if (unitName === 'padel') {
            // Padel sudah terstruktur dengan baik di variables.js
            breakdown.civil_construction = this._calculateTotal(p.capex.civil_construction);
            breakdown.building = this._calculateTotal(p.capex.building);
            breakdown.equipment = this._calculateTotal(p.capex.equipment);
            breakdown.interior = this._calculateTotal(p.capex.interior);
            breakdown.other = this._calculateTotal(p.capex.other);
        }

        const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
        return { total, breakdown };
    },

    /**
     * BARU: Menghitung total depresiasi tahunan berdasarkan rincian CapEx.
     * @param {object} capexBreakdown - Rincian CapEx dari _getDetailedCapex.
     * @returns {number} - Total depresiasi tahunan.
     */
    _calculateAnnualDepreciation(capexBreakdown) {
        const depRates = projectConfig.assumptions.depreciation_years;
        let totalDepreciation = 0;

        for (const category in capexBreakdown) {
            if (depRates[category] && depRates[category] > 0) {
                totalDepreciation += capexBreakdown[category] / depRates[category];
            }
        }
        // Biaya lain-lain (other) seperti izin diasumsikan diamortisasi selama 5 tahun.
        totalDepreciation += (capexBreakdown.other || 0) / 5;
        return totalDepreciation;
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
        
        // --- Perhitungan Biaya Bangunan & Total (Sama seperti sebelumnya) ---
        const bld = a.building;
        const totalBuildingCost = (bld.dr_bays_area_m2 * bld.dr_bays_cost_per_m2) + (bld.cafe_area_m2 * bld.cafe_cost_per_m2);
        
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

    _getUnitCalculations(unitName, revenueMultiplier = 1, opexMultiplier = 1) {
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
        
        // Terapkan multiplier
        const adjustedMonthlyRevenue = monthlyRevenueTotal * revenueMultiplier;
        const adjustedOpexMonthly = this._calculateTotal(unit.opexMonthly) * opexMultiplier;
        
        const annualRevenue = adjustedMonthlyRevenue * 12;
        const cogsMonthly = (fnbRevenueMonthly * o.cogs_rate_fnb) * revenueMultiplier; // COGS ikut revenue
        const annualCogs = cogsMonthly * 12;
        const annualOpex = adjustedOpexMonthly * 12;
        
        const grossProfit = annualRevenue - annualCogs;
        const ebitda = grossProfit - annualOpex;
        
        // Kalkulasi CapEx dan Depresiasi yang AKURAT
        const capex = this._getDetailedCapex(unitName);
        const annualDepreciation = this._calculateAnnualDepreciation(capex.breakdown);

        const ebt = ebitda - annualDepreciation;
        const tax = ebt > 0 ? ebt * global.tax_rate_profit : 0;
        const netProfit = ebt - tax;
        const cashFlowFromOps = netProfit + annualDepreciation;

        return {
            capex: capex,
            pnl: { annualRevenue, annualCogs, annualOpex, grossProfit, ebitda, annualDepreciation, ebt, tax, netProfit, cashFlowFromOps },
        };
    },

    _calculateDigitalCapexTotal() {
        const digitalCapex = projectConfig.digital_capex;
        let total = 0;
        for (const systemKey in digitalCapex) {
            const system = digitalCapex[systemKey];
            if (system.items) {
                total += system.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
            }
        }
        // --- BARU: Tambahkan biaya ball tracker yang ada di sistem lain ---
        const drEquipment = projectConfig.drivingRange.capex_assumptions.equipment;
        const totalBays = projectConfig.drivingRange.revenue.main_revenue.bays;
        const premiumBaysCount = Math.round(totalBays * drEquipment.premium_bays.percentage_of_total);
        total += premiumBaysCount * drEquipment.premium_bays.cost_per_bay_ball_tracker;
        return total;
    },

    getDepreciationDetails() {
        const drCapex = this._getUnitCalculations('drivingRange').capex.breakdown;
        const padelCapex = this._getUnitCalculations('padel').capex.breakdown;
        const digitalCapex = this._calculateDigitalCapexTotal();
        const depRates = projectConfig.assumptions.depreciation_years;

        // Gabungkan semua CAPEX berdasarkan kategori
        const combinedCapex = {
            civil_construction: (drCapex.civil_construction || 0) + (padelCapex.civil_construction || 0),
            building: (drCapex.building || 0) + (padelCapex.building || 0),
            equipment: (drCapex.equipment || 0) + (padelCapex.equipment || 0),
            interior: (drCapex.interior || 0) + (padelCapex.interior || 0),
            other: (drCapex.other || 0) + (padelCapex.other || 0),
            digital_systems: digitalCapex // Kategori baru untuk teknologi
        };

        let details = [];
        let totalAnnualDepreciation = 0;

        for (const category in combinedCapex) {
            if (combinedCapex[category] > 0) {
                // Gunakan masa manfaat 5 tahun sebagai default untuk 'other' dan 'digital' jika tidak ditentukan
                const lifespan = depRates[category] || 5; 
                const annualDepreciation = combinedCapex[category] / lifespan;
                totalAnnualDepreciation += annualDepreciation;
                
                details.push({
                    category: sierTranslate.translate(category),
                    capexValue: combinedCapex[category],
                    lifespan: lifespan,
                    lifespanPath: `assumptions.depreciation_years.${category}`,
                    annualDepreciation: annualDepreciation
                });
            }
        }

        return { details, totalAnnualDepreciation };
    },

    getFinancialSummary(revenueMultiplier = 1, opexMultiplier = 1) {
        const dr = this._getUnitCalculations('drivingRange', revenueMultiplier, opexMultiplier);
        const padel = this._getUnitCalculations('padel', revenueMultiplier, opexMultiplier);
        
        // --- BARIS BARU: Hitung CAPEX dan Depresiasi Teknologi ---
        const digitalCapexTotal = this._calculateDigitalCapexTotal();
        const annualDigitalDepreciation = digitalCapexTotal / 5; // Asumsi masa manfaat 5 tahun

        // --- MODIFIKASI: Tambahkan biaya digital ke total gabungan ---
        const combined = { 
            capex: { 
                total: dr.capex.total + padel.capex.total + digitalCapexTotal // Ditambah CAPEX digital
            }, 
            pnl: {} 
        };

        for (const key in dr.pnl) {
            combined.pnl[key] = (dr.pnl[key] || 0) + (padel.pnl[key] || 0);
        }
        
        // --- MODIFIKASI: Tambahkan depresiasi digital ke total depresiasi ---
        combined.pnl.annualDepreciation += annualDigitalDepreciation;
        // Hitung ulang metrik yang terpengaruh oleh depresiasi
        combined.pnl.ebt = combined.pnl.ebitda - combined.pnl.annualDepreciation;
        combined.pnl.tax = combined.pnl.ebt > 0 ? combined.pnl.ebt * projectConfig.assumptions.tax_rate_profit : 0;
        combined.pnl.netProfit = combined.pnl.ebt - combined.pnl.tax;
        combined.pnl.cashFlowFromOps = combined.pnl.netProfit + combined.pnl.annualDepreciation;


        const totalInvestment = combined.capex.total; // Sekarang menggunakan total yang sudah benar
        const cashFlow = combined.pnl.cashFlowFromOps;
        const paybackPeriod = cashFlow > 0 ? totalInvestment / cashFlow : Infinity;
        
        let npv = -totalInvestment;
        for(let i=1; i<=20; i++) {
            npv += cashFlow / Math.pow(1 + projectConfig.assumptions.discount_rate_wacc, i);
        }

        let irr = 0.0;
        for (let i = 0; i < 1.0; i += 0.001) {
            let tempNpv = -totalInvestment;
            for(let j=1; j<=20; j++) {
                tempNpv += cashFlow / Math.pow(1 + i, j);
            }
            if (tempNpv < 0) { irr = i > 0 ? i - 0.001 : 0; break; }
        }
        
        return {
            drivingRange: dr, padel: padel, digitalCapexTotal: digitalCapexTotal,
            combined: { ...combined, feasibility: { paybackPeriod, npv, irr } }
        };
    },

    _getDetailedRevenueBreakdown(unitName) {
        const unit = projectConfig[unitName];
        const o = unit.operational_assumptions;
        const m = unit.revenue.main_revenue;
        const a = unit.revenue.ancillary_revenue;
        let breakdown = {};

        if (unitName === 'drivingRange') {
            const daily_sessions_wd = m.bays * m.occupancy_rate_per_day.weekday;
            const daily_sessions_we = m.bays * m.occupancy_rate_per_day.weekend;
            
            const rev_wd_day = daily_sessions_wd * m.price_per_100_balls;
            const rev_we_day = daily_sessions_we * m.price_per_100_balls;
            
            const rev_wd_month = rev_wd_day * o.workdays_in_month;
            const rev_we_month = rev_we_day * o.weekend_days_in_month;
            const total_main_rev_month = rev_wd_month + rev_we_month;

            const total_sessions_month = (daily_sessions_wd * o.workdays_in_month) + (daily_sessions_we * o.weekend_days_in_month);
            const fnb_rev_month = total_sessions_month * a.fnb_avg_spend;
            
            breakdown = {
                rows: [
                    { item: 'Pendapatan Hari Kerja', calc: `${sierHelpers.formatNumber(daily_sessions_wd.toFixed(1))} sesi/hari @ Rp ${sierHelpers.formatNumber(m.price_per_100_balls)}`, perDay: rev_wd_day, perMonth: rev_wd_month },
                    { item: 'Pendapatan Akhir Pekan', calc: `${sierHelpers.formatNumber(daily_sessions_we.toFixed(1))} sesi/hari @ Rp ${sierHelpers.formatNumber(m.price_per_100_balls)}`, perDay: rev_we_day, perMonth: rev_we_month },
                    { item: 'Penjualan F&B', calc: `~${sierHelpers.formatNumber(total_sessions_month.toFixed(0))} sesi/bulan @ Rp ${sierHelpers.formatNumber(a.fnb_avg_spend)}`, perDay: fnb_rev_month / 30, perMonth: fnb_rev_month },
                    { item: 'Penjualan Pro Shop', calc: 'Estimasi bulanan', perDay: a.pro_shop_sales / 30, perMonth: a.pro_shop_sales }
                ],
                total_monthly: total_main_rev_month + fnb_rev_month + a.pro_shop_sales
            };
        } else if (unitName === 'padel') {
            const hours_wd_off = m.courts * m.hours_distribution_per_day.offpeak * m.occupancy_rate.weekday_offpeak;
            const hours_wd_peak = m.courts * m.hours_distribution_per_day.peak * m.occupancy_rate.weekday_peak;
            const hours_we = m.courts * o.operational_hours_per_day * m.occupancy_rate.weekend;
            
            const rev_wd_off_day = hours_wd_off * m.price_per_hour.weekday_offpeak;
            const rev_wd_peak_day = hours_wd_peak * m.price_per_hour.weekday_peak;
            const rev_we_day = hours_we * m.price_per_hour.weekend;

            const total_main_rev_month = (rev_wd_off_day + rev_wd_peak_day) * o.workdays_in_month + rev_we_day * o.weekend_days_in_month;
            const total_hours_month = (hours_wd_off + hours_wd_peak) * o.workdays_in_month + hours_we * o.weekend_days_in_month;
            const fnb_rev_month = total_hours_month * a.fnb_avg_spend;
            
            breakdown = {
                rows: [
                    { item: 'Sewa Hr Kerja (Off-Peak)', calc: `${hours_wd_off.toFixed(1)} jam/hari @ Rp ${sierHelpers.formatNumber(m.price_per_hour.weekday_offpeak)}`, perDay: rev_wd_off_day, perMonth: rev_wd_off_day * o.workdays_in_month },
                    { item: 'Sewa Hr Kerja (Peak)', calc: `${hours_wd_peak.toFixed(1)} jam/hari @ Rp ${sierHelpers.formatNumber(m.price_per_hour.weekday_peak)}`, perDay: rev_wd_peak_day, perMonth: rev_wd_peak_day * o.workdays_in_month },
                    { item: 'Sewa Akhir Pekan', calc: `${hours_we.toFixed(1)} jam/hari @ Rp ${sierHelpers.formatNumber(m.price_per_hour.weekend)}`, perDay: rev_we_day, perMonth: rev_we_day * o.weekend_days_in_month },
                    { item: 'Penjualan F&B', calc: `~${sierHelpers.formatNumber(total_hours_month.toFixed(0))} jam/bulan @ Rp ${sierHelpers.formatNumber(a.fnb_avg_spend)}`, perDay: fnb_rev_month / 30, perMonth: fnb_rev_month },
                    { item: 'Penjualan Pro Shop', calc: 'Estimasi bulanan', perDay: a.pro_shop_sales / 30, perMonth: a.pro_shop_sales }
                ],
                total_monthly: total_main_rev_month + fnb_rev_month + a.pro_shop_sales
            };
        }
        return breakdown;
    },

    /**
     * DIUBAH TOTAL: Menghitung Break-Even Point dengan pendekatan Bottom-Up untuk biaya variabel.
     * @param {string} unitName - 'drivingRange' atau 'padel'
     * @returns {object} - Objek berisi semua data BEP yang sudah dihitung.
     */
    calculateBEP(unitName) {
        const unit = projectConfig[unitName];
        if (!unit) return {};

        const fixedCostBreakdown = {};
        for (const key in unit.opexMonthly) {
            const translatedKey = sierTranslate.translate(key);
            const value = unit.opexMonthly[key];
            fixedCostBreakdown[translatedKey] = (typeof value === 'number') ? value : this._calculateTotal(value);
        }
        const totalFixedCostMonthly = Object.values(fixedCostBreakdown).reduce((sum, val) => sum + val, 0);
        
        let pricePerUnit = 0, variableCostPerUnit = 0, unitLabel = '', variableCostBreakdown = {};
        const kwhPrice = projectConfig.drivingRange.opexMonthly.utilities.electricity_kwh_price;
        if (unitName === 'drivingRange') {
            const vc = unit.operational_assumptions.variable_costs_per_session;
            const electricityCost = vc.electricity_dispenser_kwh * kwhPrice;
            variableCostBreakdown = { 'Listrik (Dispenser)': electricityCost, 'Keausan Bola': vc.ball_wear_cost_per_100_hits, 'Pembersih Bay': vc.cleaning_supplies };
            variableCostPerUnit = Object.values(variableCostBreakdown).reduce((sum, val) => sum + val, 0);
            pricePerUnit = unit.revenue.main_revenue.price_per_100_balls;
            unitLabel = 'Sesi';
        } else {
            const vc = unit.operational_assumptions.variable_costs_per_hour;
            const electricityCost = vc.court_lights_kw * kwhPrice;
            variableCostBreakdown = { 'Penggantian Bola': vc.ball_replacement_cost_per_hour, 'Pembersih Lapangan': vc.cleaning_supplies, 'Listrik (Lampu Lapangan)': electricityCost };
            variableCostPerUnit = Object.values(variableCostBreakdown).reduce((sum, val) => sum + val, 0);
            const prices = unit.revenue.main_revenue.price_per_hour;
            pricePerUnit = (prices.weekday_offpeak + prices.weekday_peak + prices.weekend) / 3;
            unitLabel = 'Jam Sewa';
        }

        const contributionMargin = pricePerUnit - variableCostPerUnit;
        if (contributionMargin <= 0) return { bepInUnitsMonthly: Infinity };

        const bepInUnitsMonthly = totalFixedCostMonthly / contributionMargin;
        const bepInUnitsDaily = bepInUnitsMonthly / 30;

        return { totalFixedCostMonthly, fixedCostBreakdown, variableCostBreakdown, contributionMargin, bepInUnitsMonthly, bepInUnitsDaily, unitLabel };
    },

    /**
     * FUNGSI MASTER BARU/REFACTOR: Menghitung semua analisis strategis untuk satu unit bisnis.
     * Menggabungkan logika BEP, Profitabilitas, dan Skenario menjadi satu.
     * @param {string} unitName - 'drivingRange' atau 'padel'
     * @returns {object} - Objek komprehensif berisi semua data analisis.
     */
    getStrategicAnalysis(unitName) {
        const bepAnalysis = this.calculateBEP(unitName);
        const mods = projectConfig.assumptions.scenario_modifiers;

        // Hitung 3 skenario
        const realistic = this._getUnitCalculations(unitName, 1.0, 1.0);
        const pessimistic = this._getUnitCalculations(unitName, mods.pessimistic_revenue, mods.pessimistic_opex);
        const optimistic = this._getUnitCalculations(unitName, mods.optimistic_revenue, mods.optimistic_opex);
        
        // Fungsi helper untuk menghitung payback period dari data
        const getPayback = (data) => data.pnl.cashFlowFromOps > 0 ? data.capex.total / data.pnl.cashFlowFromOps : Infinity;

        return {
            bepAnalysis: bepAnalysis,
            profitabilityAnalysis: {
                totalCapex: realistic.capex.total,
                annualRevenue: realistic.pnl.annualRevenue,
                annualNetProfit: realistic.pnl.netProfit,
                annualCashFlow: realistic.pnl.cashFlowFromOps,
                paybackPeriod: getPayback(realistic)
            },
            scenarioAnalysis: {
                realistic: {
                    netProfit: realistic.pnl.netProfit,
                    payback: getPayback(realistic)
                },
                pessimistic: {
                    netProfit: pessimistic.pnl.netProfit,
                    payback: getPayback(pessimistic)
                },
                optimistic: {
                    netProfit: optimistic.pnl.netProfit,
                    payback: getPayback(optimistic)
                }
            }
        };
    }
};

window.sierMath = sierMath;