// File: sier-visual.js
// Bertindak sebagai controller utama aplikasi.
// Menginisialisasi, mengelola event, dan memanggil semua modul render.

function generateTableOfContents() {
        const tocContainer = document.getElementById('toc-nav-list');
        const mainContent = document.getElementById('main-content');
        if (!tocContainer || !mainContent) return;

        tocContainer.innerHTML = ''; // Kosongkan navigasi sebelum membuat yang baru
        const headings = mainContent.querySelectorAll('h2');

        headings.forEach(h2 => {
            const section = h2.closest('section');
            if (section && section.id) {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = `#${section.id}`;
                link.textContent = h2.textContent;
                link.className = 'block text-sm text-gray-600 hover:text-blue-600 hover:font-semibold transition-all py-1';
                listItem.appendChild(link);
                tocContainer.appendChild(listItem);
            }
        });
    }

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
        sierHelpers.tryToRender(sierVisualMaintenance.render.bind(sierVisualMaintenance));
        sierHelpers.tryToRender(sierVisualStrategy.render.bind(sierVisualStrategy));
        sierHelpers.tryToRender(sierChart.renderAllCharts.bind(sierChart));
    }

    /**
     * Menyiapkan semua event listener global untuk interaktivitas.
     */
    function setupEventListeners() {
        const mainContainer = document.body;
        
        const handleInputFinish = (inputField) => {
            const path = inputField.dataset.path;
            let value = parseFloat(inputField.value);

            // Jika input adalah persentase, bagi dengan 100
            if (inputField.dataset.format === 'percent') {
                value = value / 100;
            }

            if (path && !isNaN(value)) {
                sierMath.setValueByPath(projectConfig, path, value);
                updateAllVisuals(); // Panggil pembaruan global
            }
        };

        mainContainer.addEventListener('click', (e) => {
            // Target adalah ikon pensil atau SVG di dalamnya
            const editIcon = e.target.closest('.edit-icon');
            if (editIcon) {
                e.preventDefault(); // <<< INI PERBAIKAN UTAMANYA
                const container = editIcon.closest('.group');
                if (!container) return;
                const display = container.querySelector('.value-display');
                if (display) display.classList.add('hidden');
                editIcon.classList.add('hidden');

                const inputField = container.querySelector('.value-input');
                if (inputField) {
                    inputField.classList.remove('hidden');
                    // Jika formatnya persen, tampilkan sebagai angka biasa (misal 0.1 jadi 10)
                    if (inputField.dataset.format === 'percent') {
                        inputField.value = parseFloat(inputField.value) * 100;
                    }
                    inputField.focus();
                    inputField.select();
                }
            }
        });
        
        mainContainer.addEventListener('blur', (e) => {
             if (e.target.classList.contains('value-input')) {
                handleInputFinish(e.target);
             }
        }, true); // Gunakan capture phase untuk memastikan blur dieksekusi

        mainContainer.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('value-input')) {
                if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } 
                else if (e.key === 'Escape') { 
                    e.preventDefault(); 
                    // Reset nilai input sebelum blur untuk membatalkan
                    const path = e.target.dataset.path;
                    let originalValue = sierMath.getValueByPath(projectConfig, path);
                    e.target.value = originalValue;
                    e.target.blur(); 
                }
            }
        });
    }
    
    // Inisialisasi Aplikasi
    updateAllVisuals();
    setupEventListeners();
    generateTableOfContents();
});