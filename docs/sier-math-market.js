// File: sier-math-market.js
// Berisi semua logika perhitungan terkait Analisis Pasar: demografi, pendapatan, dll.

const sierMathMarket = {
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
            acc.age25_39 += row.usia25_39; 
            acc.age40_54 += row.usia40_54; 
            acc.age55_64 += row.usia55_64;
            return acc;
        }, { age25_39: 0, age40_54: 0, age55_64: 0 });

        return { estimatedIncomeData, byIncomeKecamatan, marketData, kecamatanNames, totalTargetByAge };
    }
};

window.sierMathMarket = sierMathMarket;