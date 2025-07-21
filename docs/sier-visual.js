// File: sier-visual.js
// Bertindak sebagai controller utama aplikasi.
// Menginisialisasi, mengelola event, dan memanggil semua modul render.

function generateTableOfContents() {
    const tocContainer = document.getElementById('toc-nav-list');
    const mainContent = document.querySelector('.container.mx-auto');
    if (!tocContainer || !mainContent) return;

    tocContainer.innerHTML = ''; // Kosongkan navigasi sebelum membuat yang baru
    const headings = mainContent.querySelectorAll('h2');

    headings.forEach(h2 => {
        const section = h2.closest('section');
        if (section && section.id) {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${section.id}`;
            // Ambil teks dari h2, buang nomor di depan jika ada (misal "1. ")
            link.textContent = h2.textContent.replace(/^\d+\.\s*/, '');
            link.className = 'block text-sm text-gray-600 hover:text-blue-600 hover:font-semibold transition-all py-1';
            listItem.appendChild(link);
            tocContainer.appendChild(listItem);
        }
    });
}

function processMarkdownFormatting() {
    console.log("Memulai proses format Markdown ke HTML...");
    const container = document.querySelector('.container.mx-auto');
    if (!container) return;

    const elementsToProcess = container.querySelectorAll('p, li, td, th, h3, h4, h5, dd, blockquote');

    const rules = [
        { regex: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
        { regex: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
        { regex: /~~(.*?)~~/g, replacement: '<del>$1</del>' },
        { regex: /`(.*?)`/g, replacement: '<code>$1</code>' }
    ];

    elementsToProcess.forEach(el => {
        if (el.children.length > 0) return;
        let content = el.innerHTML;
        rules.forEach(rule => {
            content = content.replace(rule.regex, rule.replacement);
        });
        el.innerHTML = content;
    });
    console.log(`Format Markdown selesai diproses pada ${elementsToProcess.length} elemen.`);
}

function checkRenderStatus() {
    console.group("===== STATUS RENDER HALAMAN =====");
    const logCheck = (description, checkPassed) => {
        const status = checkPassed ? '✅ Berhasil' : '❌ GAGAL';
        const color = checkPassed ? 'color: green;' : 'color: red; font-weight: bold;';
        console.log(`%c${status}%c - ${description}`, color, 'color: black;');
    };
    logCheck('Update Kartu Ringkasan (Total Penduduk)', document.getElementById('totalPenduduk') && document.getElementById('totalPenduduk').innerText !== '0');
    logCheck('Render Chart Komposisi Ring', document.getElementById('ringChart') && typeof Chart.getChart('ringChart') !== 'undefined');
    logCheck('Render Chart Distribusi Usia', document.getElementById('ageDistributionChart') && typeof Chart.getChart('ageDistributionChart') !== 'undefined');
    logCheck('Render Tabel Data Populasi Mentah', document.getElementById('dataTableBody') && document.getElementById('dataTableBody').children.length > 0);
    logCheck('Render Tabel Estimasi Pendapatan', document.getElementById('incomeTableBody') && document.getElementById('incomeTableBody').children.length > 0);
    logCheck('Render Chart Analisis Survei', document.getElementById('surveyChartsContainer') && document.getElementById('surveyChartsContainer').children.length > 0);
    logCheck('Render Analisis Tematik Masukan Kualitatif', document.getElementById('themedFeedbackContainer') && document.getElementById('themedFeedbackContainer').children.length > 0);
    logCheck('Render Rincian OpEx', document.getElementById('opex-details-container') && document.getElementById('opex-details-container').children.length > 0);
    console.groupEnd();
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
        sierHelpers.tryToRender(sierVisualImpact.render.bind(sierVisualImpact));
        sierHelpers.tryToRender(sierChart.renderAllCharts.bind(sierChart));

        // Panggil pemrosesan markdown setelah semua visual diperbarui
        processMarkdownFormatting();
    }

    /**
     * Menyiapkan semua event listener global untuk interaktivitas.
     */
    function setupEventListeners() {
        const mainContainer = document.body;

        const handleInputFinish = (inputField) => {
            const path = inputField.dataset.path;
            let value = parseFloat(inputField.value);

            if (inputField.dataset.format === 'percent') {
                value = value / 100;
            }

            if (path && !isNaN(value)) {
                sierMath.setValueByPath(projectConfig, path, value);
                updateAllVisuals(); // Panggil pembaruan global
            }
        };

        mainContainer.addEventListener('click', (e) => {
            const editIcon = e.target.closest('.edit-icon');
            if (editIcon) {
                e.preventDefault();
                const container = editIcon.closest('.group');
                if (!container) return;
                const display = container.querySelector('.value-display');
                if (display) display.classList.add('hidden');
                editIcon.classList.add('hidden');

                const inputField = container.querySelector('.value-input');
                if (inputField) {
                    inputField.classList.remove('hidden');
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
        }, true);

        mainContainer.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('value-input')) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    const path = e.target.dataset.path;
                    let originalValue = sierMath.getValueByPath(projectConfig, path);
                    e.target.value = originalValue;
                    e.target.blur();
                }
            }
        });
    }

    // --- Urutan Inisialisasi Aplikasi yang Benar ---
    updateAllVisuals();
    setupEventListeners();
    generateTableOfContents();
    setTimeout(checkRenderStatus, 500); // Jalankan pengecekan status setelah render selesai
});