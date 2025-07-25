// File: sier-visual-survey.js
// Merender semua elemen visual non-chart terkait Survei Pasar.

const sierVisualSurvey = {
    _renderVisuals(summary) { // Terima 'summary' sebagai argumen
        const surveySections = ['survey-analysis', 'survey-deep-dive', 'customer-personas'];

        if (!summary || !summary.hasData) {
            surveySections.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            return;
        }

        surveySections.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = '';
        });

        const feedbackList = document.getElementById('qualitativeFeedback');
        if (feedbackList) {
            const uniqueFeedbacks = [...new Set(summary.parsedData.map(row => row['Saran Lain']).filter(fb => fb && fb.trim() && !['-','ok','cukup','tidak ada'].includes(fb.trim().toLowerCase())).map(fb => fb.trim()))];
            feedbackList.innerHTML = uniqueFeedbacks.length > 0 ? uniqueFeedbacks.map(fb => `<li>${fb}</li>`).join('') : '<li>Tidak ada masukan kualitatif tambahan.</li>';
        }
    },

    _renderThemedFeedback(parsedData) {
        const container = document.getElementById('themedFeedbackContainer');
        if (!container) return;

        const themes = {
            'Kualitas Fasilitas & Lapangan': { keywords: ['kualitas', 'standar internasional', 'matras', 'bola', 'bersih', 'dead spot', 'silau', 'ventilasi', 'karpet', 'pasir', 'sirkulasi', 'rata'], feedbacks: [] },
            'Harga, Paket & Promosi': { keywords: ['harga', 'paket', 'promo', 'membership', 'terjangkau'], feedbacks: [] },
            'Fasilitas Pendukung (F&B, dll)': { keywords: ['f&b', 'kafe', 'restoran', 'lounge', 'shower', 'ganti', 'tunggu', 'amenities', 'musola', 'parkir', 'toilet'], feedbacks: [] },
            'Operasional & Layanan': { keywords: ['booking online', 'operasional', '24 jam', 'pelatih', 'coaching', 'penyewaan raket', 'staf'], feedbacks: [] },
            'Saran Fasilitas Lain': { keywords: ['tennis', 'futsal', 'gym', 'ice bath', 'ps'], feedbacks: [] },
            'Kebijakan Bebas Rokok': { keywords: ['rokok'], feedbacks: [] }
        };

        const otherFeedback = [];

        parsedData.forEach(row => {
            const feedback = (row['Saran Lain'] || '').trim();
            if (!feedback || ['-','ok','cukup','tidak ada', '.'].includes(feedback.toLowerCase())) return;

            const feedbackLc = feedback.toLowerCase();
            let matched = false;
            for (const themeName in themes) {
                if (themes[themeName].keywords.some(keyword => feedbackLc.includes(keyword))) {
                    themes[themeName].feedbacks.push(feedback);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                otherFeedback.push(feedback);
            }
        });
        
        if(otherFeedback.length > 0) {
            themes['Lain-lain & Umum'] = { keywords:[], feedbacks: otherFeedback };
        }

        container.innerHTML = '';
        let renderedThemesCount = 0;
        for (const themeName in themes) {
            const themeData = themes[themeName];
            if (themeData.feedbacks.length > 0) {
                renderedThemesCount++;
                const uniqueFeedbacks = [...new Set(themeData.feedbacks)];
                const themeHtml = `
                    <div>
                        <h5 class="font-bold text-gray-800">${themeName} <span class="text-sm font-normal text-gray-500">(${uniqueFeedbacks.length} saran)</span></h5>
                        <ul class="list-disc pl-6 mt-2 text-sm text-gray-600 space-y-2">
                            ${uniqueFeedbacks.map(fb => `<li>${fb}</li>`).join('')}
                        </ul>
                    </div>
                `;
                container.innerHTML += themeHtml;
            }
        }
        console.log(`[sier-visual-survey] Analisis Tematik: ${renderedThemesCount} tema berhasil dirender.`);
    },

    _renderSampleCalculations() {
        const summary = sierMath.getDemographySummary();
        if (!summary || !summary.totalPopulation) return;

        const updateText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        updateText('sampleSize10', `${sierHelpers.formatNumber(sierMath.slovin(summary.totalPopulation, 0.10))} Responden`);
        updateText('sampleSize5', `${sierHelpers.formatNumber(sierMath.slovin(summary.totalPopulation, 0.05))} Responden`);
        updateText('sampleSize3', `${sierHelpers.formatNumber(sierMath.slovin(summary.totalPopulation, 0.03))} Responden`);
        
        updateText('totalPopRing1', `(Total Populasi N = ${sierHelpers.formatNumber(summary.totalRing1)})`);
        updateText('sampleSizeRing1_10', sierHelpers.formatNumber(sierMath.slovin(summary.totalRing1, 0.10)));
        updateText('sampleSizeRing1_5', sierHelpers.formatNumber(sierMath.slovin(summary.totalRing1, 0.05)));
        updateText('sampleSizeRing1_3', sierHelpers.formatNumber(sierMath.slovin(summary.totalRing1, 0.03)));

        updateText('totalPopRing2', `(Total Populasi N = ${sierHelpers.formatNumber(summary.totalRing2)})`);
        updateText('sampleSizeRing2_10', sierHelpers.formatNumber(sierMath.slovin(summary.totalRing2, 0.10)));
        updateText('sampleSizeRing2_5', sierHelpers.formatNumber(sierMath.slovin(summary.totalRing2, 0.05)));
        updateText('sampleSizeRing2_3', sierHelpers.formatNumber(sierMath.slovin(summary.totalRing2, 0.03)));
    },

    render() {
        const summary = sierMath.getSurveyAnalysis();

        this._renderVisuals(summary);
        this._renderSampleCalculations();
        
        if(summary && summary.hasData) {
            this._renderThemedFeedback(summary.parsedData);
        }
    }
};

window.sierVisualSurvey = sierVisualSurvey;