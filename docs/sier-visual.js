// File: sier-visual.js
// Bertindak sebagai controller utama aplikasi.
// Menginisialisasi, mengelola event, dan memanggil semua modul render.

document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * Fungsi MASTER yang memanggil semua modul render.
     */
    function updateAllVisuals() {
        console.log("Memperbarui semua modul visual...");
        
        sierHelpers.tryToRender(sierVisualDemography.render.bind(sierVisualDemography));
        sierHelpers.tryToRender(sierVisualMarket.render.bind(sierVisualMarket));
        sierHelpers.tryToRender(sierVisualSurvey.render.bind(sierVisualSurvey));
        sierHelpers.tryToRender(sierVisualFinance.render.bind(sierVisualFinance));
        sierHelpers.tryToRender(sierVisualTechnical.render.bind(sierVisualTechnical));
        sierHelpers.tryToRender(sierVisualDigital.render.bind(sierVisualDigital));
        sierHelpers.tryToRender(sierChart.renderAllCharts.bind(sierChart));
    }

    /**
     * Menyiapkan semua event listener global untuk interaktivitas.
     */
    function setupEventListeners() {
        const mainContainer = document.body;
        
        const handleInputFinish = (inputField) => {
            const path = inputField.dataset.path;
            const value = parseFloat(inputField.value);
            if (path && !isNaN(value)) {
                sierMath.setValueByPath(projectConfig, path, value);
                updateAllVisuals(); // Panggil pembaruan global
            } else {
                updateAllVisuals(); // Reset jika input salah
            }
        };

        mainContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-icon')) {
                e.preventDefault();
                const container = e.target.closest('.group');
                if (!container) return;
                const display = container.querySelector('.value-display');
                if (display) display.classList.add('hidden');
                e.target.classList.add('hidden');
                const inputField = container.querySelector('.value-input');
                if (inputField) {
                    inputField.classList.remove('hidden');
                    inputField.focus();
                    inputField.select();
                }
            }
        });
        
        mainContainer.addEventListener('blur', (e) => {
             if (e.target.classList.contains('value-input')) handleInputFinish(e.target);
        }, true);

        mainContainer.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('value-input')) {
                if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } 
                else if (e.key === 'Escape') { 
                    e.preventDefault(); 
                    // Cukup blur, karena updateAllVisuals akan mereset ke nilai yang benar
                    e.target.blur(); 
                }
            }
        });
    }
    
    // Inisialisasi Aplikasi
    updateAllVisuals();
    setupEventListeners();
});