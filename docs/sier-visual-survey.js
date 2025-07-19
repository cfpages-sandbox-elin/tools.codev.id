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
    }
};

window.sierVisualSurvey = sierVisualSurvey;