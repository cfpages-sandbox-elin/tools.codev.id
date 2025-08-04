// File: sier-math-survey.js
// Berisi semua logika perhitungan terkait Analisis Survei Pasar Primer.

const sierMathSurvey = {
    slovin(N, e) {
        if (N <= 0 || e <= 0) return 0;
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
    }
};

window.sierMathSurvey = sierMathSurvey;