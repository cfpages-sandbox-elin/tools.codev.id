// File: sier-visual. renderall
// VERSI 3.1 FINAL - Bertindak sebagai controller utama aplikasi.

function applyAutomaticCaptionsAndNumbering() {
    const allHeadings = document.querySelectorAll('h2, h3, h4, h5');

    // Penomoran Otomatis untuk Tabel
    const tablePrefix = 'Tabel';
    const allDataTables = Array.from(document.querySelectorAll('table:has(thead)'))
        .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    
    allDataTables.forEach((table, index) => {
        const existingCaption = table.querySelector('caption.auto-caption');
        if (existingCaption) existingCaption.remove();

        let bestHeadingText = 'Data Tabel';
        let lastFoundHeading = null;
        allHeadings.forEach(heading => {
            if (heading.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING) {
                lastFoundHeading = heading;
            }
        });
        if (lastFoundHeading) {
            bestHeadingText = lastFoundHeading.textContent.trim().replace(/^\d+\.\s*/, '');
        }

        const caption = table.createCaption();
        caption.className = 'auto-caption text-left text-sm text-gray-700 p-2 bg-gray-50 font-semibold';
        caption.innerHTML = `<strong>${tablePrefix} ${index + 1}:</strong> ${bestHeadingText}`;
        if (table.firstChild) table.insertBefore(caption, table.firstChild);
    });

    // Penomoran Otomatis untuk Chart/Visual
    const visualPrefix = 'Gambar';
    const visualSelectors = [ 'div:has(> canvas)', '#site-layout-container', '#padel-conversion-vis', '#meeting-point-concept-vis', '#coworking-map-container', '#multiplierEffectDiagram' ];
    const allVisualElements = Array.from(document.querySelectorAll(visualSelectors.join(', ')))
        .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

    allVisualElements.forEach((element, index) => {
        let figureWrapper = element.parentElement.tagName === 'FIGURE' && element.parentElement.classList.contains('auto-caption-wrapper') ? element.parentElement : null;

        if (!figureWrapper) {
            figureWrapper = document.createElement('figure');
            figureWrapper.className = 'auto-caption-wrapper';
            element.parentNode.insertBefore(figureWrapper, element);
            figureWrapper.appendChild(element);
        }

        const existingCaption = figureWrapper.querySelector('figcaption.auto-caption');
        if (existingCaption) existingCaption.remove();

        let bestHeadingText = 'Visualisasi Data';
        let lastFoundHeading = null;
        allHeadings.forEach(heading => {
            if (heading.compareDocumentPosition(figureWrapper) & Node.DOCUMENT_POSITION_FOLLOWING) {
                lastFoundHeading = heading;
            }
        });
        if (lastFoundHeading) {
            bestHeadingText = lastFoundHeading.textContent.trim().replace(/^\d+\.\s*/, '');
        }
        
        const figcaption = document.createElement('figcaption');
        figcaption.className = 'auto-caption text-center text-sm text-gray-600 mt-3 italic';
        figcaption.innerHTML = `<strong>${visualPrefix} ${index + 1}:</strong> ${bestHeadingText}`;
        figureWrapper.appendChild(figcaption);
    });

    console.log(`[AutoCaption] Selesai. ${allDataTables.length} tabel dan ${allVisualElements.length} visual telah diberi caption.`);
}

function generateTableOfContents() {
    const tocContainer = document.getElementById('toc-nav-list');
    const mainContent = document.querySelector('.container.mx-auto');
    if (!tocContainer || !mainContent) return;

    tocContainer.innerHTML = '';
    const headings = mainContent.querySelectorAll('h2');

    headings.forEach(h2 => {
        const section = h2.closest('section');
        if (section && section.id) {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${section.id}`;
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
    const rules = [ { regex: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' }, { regex: /\*(.*?)\*/g, replacement: '<em>$1</em>' } ];
    elementsToProcess.forEach(el => {
        if (el.children.length === 0) {
            let content = el.innerHTML;
            rules.forEach(rule => { content = content.replace(rule.regex, rule.replacement); });
            el.innerHTML = content;
        }
    });
}

function populateFinancingSelector() {
    const selector = document.getElementById('financing-scenario-selector');
    const scenarios = projectConfig.assumptions.financing_scenarios;
    const currentScenarioKey = Object.keys(scenarios).find(key => 
        scenarios[key].title === projectConfig.assumptions.financing.title
    );

    if (!selector || !scenarios) return;
    selector.innerHTML = ''; // Kosongkan opsi default

    for (const key in scenarios) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = scenarios[key].title;
        if (key === currentScenarioKey) {
            option.selected = true;
        }
        selector.appendChild(option);
    }
}

function checkRenderStatus() {
    console.group("===== STATUS RENDER HALAMAN =====");
    const logCheck = (description, checkPassed) => {
        const status = checkPassed ? '✅ Berhasil' : '❌ GAGAL';
        const color = checkPassed ? 'color: green;' : 'color: red; font-weight: bold;';
        console.log(`%c${status}%c - ${description}`, color, 'color: black;');
    };
    logCheck('Update Kartu Ringkasan Demografi', document.getElementById('totalPenduduk') && document.getElementById('totalPenduduk').innerText !== '0');
    logCheck('Render Chart Analisis Survei', document.getElementById('surveyChartsContainer') && document.getElementById('surveyChartsContainer').children.length > 0);
    logCheck('Render Model Finansial (Output)', document.getElementById('financial-model-output') && !document.getElementById('financial-model-output').innerText.includes('Memuat'));
    logCheck('Render Rincian Biaya (Details)', document.getElementById('opex-details-container') && document.getElementById('opex-details-container').children.length > 0);
    console.groupEnd();
}


document.addEventListener('DOMContentLoaded', () => {
    function renderAll() {
        const projectScenarioKey = document.getElementById('scenario-selector').value;
        const financingScenarioKey = document.getElementById('financing-scenario-selector').value;

        if (!projectScenarioKey || !financingScenarioKey) {
            console.error("Skenario tidak valid!");
            return;
        }

        // 1. Perbarui konfigurasi aktif berdasarkan pilihan UI
        projectConfig.assumptions.financing = projectConfig.assumptions.financing_scenarios[financingScenarioKey];
        console.log(`[Controller] Merender ulang. Proyek: ${projectScenarioKey}, Pendanaan: ${financingScenarioKey}`);

        // 2. HITUNG MODEL FINANSIAL LENGKAP SEKALI SAJA
        const model = sierMathFinance.buildFinancialModelForScenario(projectScenarioKey);

        // 3. Render semua modul visual dengan MENGIRIMKAN data yang sudah dihitung
        
        // Modul non-finansial yang tidak butuh data model
        sierHelpers.tryToRender(() => sierVisualDemography.render());
        sierHelpers.tryToRender(() => sierVisualMarket.render());
        sierHelpers.tryToRender(() => sierVisualSurvey.render());
        sierHelpers.tryToRender(() => sierVisualTechnical.render());
        sierHelpers.tryToRender(() => sierVisualTechnicalDiagrams.renderAll());
        sierHelpers.tryToRender(() => sierVisualDigital.render());
        sierHelpers.tryToRender(() => sierVisualMaintenance.render());
        sierHelpers.tryToRender(() => sierVisualMeetingPoint.renderAll());
        sierHelpers.tryToRender(() => sierChart.renderAllCharts());

        // Modul yang BUTUH data model
        sierHelpers.tryToRender(() => sierVisualImpact.render(model)); // Kirim model ke sini
        sierHelpers.tryToRender(() => sierVisualFinanceSummary.render(model));
        sierHelpers.tryToRender(() => sierVisualFinanceDetails.render(model, projectScenarioKey));
        
        // 4. Lakukan post-processing
        processMarkdownFormatting();
        applyAutomaticCaptionsAndNumbering();
    }

    function setupEventListeners() {
        const mainContainer = document.body;

        const handleInputFinish = (inputField) => {
            const path = inputField.dataset.path;
            let value = parseFloat(inputField.value);

            if (inputField.dataset.format === 'percent') {
                value = value / 100;
            }

            if (path && !isNaN(value)) {
                sierMathFinance.setValueByPath(projectConfig, path, value);
                renderFinancials(document.getElementById('scenario-selector').value);
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
                    let originalValue = sierMathFinance.getValueByPath(projectConfig, path);
                    e.target.value = originalValue;
                    e.target.blur();
                }
            }
        });

        const projectSelector = document.getElementById('scenario-selector');
        if (projectSelector) {
            projectSelector.addEventListener('change', renderAll);
        }
        
        const financingSelector = document.getElementById('financing-scenario-selector');
        if (financingSelector) {
            financingSelector.addEventListener('change', renderAll);
        }
    }

    // --- URUTAN INISIALISASI APLIKASI ---
    populateFinancingSelector();
    setupEventListeners();
    generateTableOfContents();
    renderAll();
    setTimeout(checkRenderStatus, 1000);
});