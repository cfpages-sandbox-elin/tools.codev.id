// File: sier-visual-survey.js
// Merender semua elemen visual non-chart terkait Survei Pasar.

const sierVisualSurvey = {
    _renderVisuals() {
        const summary = sierMath.getSurveyAnalysis();
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

    /**
     * FUNGSI BARU: Melakukan analisis tematik dan merendernya.
     * @param {Array} parsedData - Data survei yang sudah diparsing dari sierMath.
     */
    _renderThemedFeedback(parsedData) {
        const container = document.getElementById('themedFeedbackContainer');
        if (!container) return;

        // 1. Definisikan tema dan kata kunci (lowercase)
        const themes = {
            'Kualitas Fasilitas & Lapangan': { keywords: ['kualitas', 'standar internasional', 'matras', 'bola', 'bersih', 'dead spot', 'silau', 'ventilasi', 'karpet', 'pasir', 'sirkulasi'], feedbacks: [] },
            'Harga, Paket & Promosi': { keywords: ['harga', 'paket', 'promo', 'membership', 'terjangkau'], feedbacks: [] },
            'Fasilitas Pendukung (F&B, dll)': { keywords: ['f&b', 'kafe', 'restoran', 'lounge', 'shower', 'ganti', 'tunggu', 'amenities', 'musola', 'parkir'], feedbacks: [] },
            'Operasional & Layanan': { keywords: ['booking online', 'operasional', '24 jam', 'pelatih', 'coaching', 'penyewaan raket', 'staf'], feedbacks: [] },
            'Saran Fasilitas Lain': { keywords: ['tennis', 'futsal', 'gym', 'ice bath'], feedbacks: [] },
            'Kebijakan Bebas Rokok': { keywords: ['rokok'], feedbacks: [] }
        };

        const otherFeedback = [];

        // 2. Kelompokkan setiap masukan ke dalam tema
        parsedData.forEach(row => {
            const feedback = (row['Saran Lain'] || '').trim();
            if (!feedback || ['-', 'ok', 'cukup', 'tidak ada', '.'].includes(feedback.toLowerCase())) return;

            const feedbackLc = feedback.toLowerCase();
            let matched = false;
            for (const themeName in themes) {
                for (const keyword of themes[themeName].keywords) {
                    if (feedbackLc.includes(keyword)) {
                        themes[themeName].feedbacks.push(feedback);
                        matched = true;
                        break; 
                    }
                }
                if (matched) break;
            }

            if (!matched) {
                otherFeedback.push(feedback);
            }
        });
        
        // Gabungkan 'Lainnya' jika ada
        if(otherFeedback.length > 0) {
            themes['Lain-lain & Umum'] = { keywords:[], feedbacks: otherFeedback };
        }

        // 3. Render hasil pengelompokan ke HTML
        container.innerHTML = ''; // Kosongkan kontainer
        for (const themeName in themes) {
            const themeData = themes[themeName];
            if (themeData.feedbacks.length > 0) {
                const uniqueFeedbacks = [...new Set(themeData.feedbacks)]; // Tampilkan hanya feedback unik
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
        this._renderVisuals();
        this._renderSampleCalculations();
        
        // Panggil fungsi analisis tematik yang baru
        const summary = sierMath.getSurveyAnalysis();
        if(summary && summary.hasData) {
            this._renderThemedFeedback(summary.parsedData);
        }
    }
};

window.sierVisualSurvey = sierVisualSurvey;