// proyek.js v0.5 refactor
document.addEventListener('DOMContentLoaded', () => {
    // Definisi elemen UI
    const tabKontraktor = document.getElementById('tab-kontraktor');
    const tabKlien = document.getElementById('tab-klien');
    const viewKontraktor = document.getElementById('view-kontraktor');
    const viewKlien = document.getElementById('view-klien');

    const outputRingkasanKontraktor = document.getElementById('output-ringkasan-kontraktor');
    const outputRingkasanKlien = document.getElementById('output-ringkasan-klien');
    const inputLuasBangunan = document.getElementById('input-luas-bangunan');
    const selectHarga = document.getElementById('select-harga');
    const inputTermin = document.getElementById('input-termin');
    
    // Variabel spesifik untuk output
    const outputRabTableKontraktor = document.getElementById('output-rab-table-kontraktor');
    const outputRabTableKlien = document.getElementById('output-rab-table-klien');
    const outputTimeline = document.getElementById('output-timeline');

    let projectData = {};

    const setupTabs = () => {
        tabKontraktor.addEventListener('click', () => {
            viewKontraktor.style.display = 'grid';
            viewKlien.style.display = 'none';
            tabKontraktor.classList.replace('inactive-tab', 'active-tab');
            tabKlien.classList.replace('active-tab', 'inactive-tab');
        });

        tabKlien.addEventListener('click', () => {
            viewKontraktor.style.display = 'none';
            viewKlien.style.display = 'grid';
            tabKlien.classList.replace('inactive-tab', 'active-tab');
            tabKontraktor.classList.replace('active-tab', 'inactive-tab');
        });
    };

    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

    const updateNestedObject = (obj, path, value) => {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const lastObj = keys.reduce((o, key, i) => {
             // Jika key adalah angka (indeks array), pastikan kita bekerja dengan array
             const isArrayIndex = !isNaN(parseInt(key, 10)) && isFinite(key);
             if (isArrayIndex) {
                 return o[parseInt(key, 10)];
             }
             return o[key];
        }, obj);
        
        // Handle jika key adalah indeks array
        const finalKey = !isNaN(parseInt(lastKey, 10)) && isFinite(lastKey) ? parseInt(lastKey, 10) : lastKey;
        lastObj[finalKey] = value;
    };

    function calculateDurations(luas_bangunan, data) {
        const spesifikasi = data.spesifikasi_teknis[data.harga_per_meter.standar.label.includes('Standar') ? 'standar' : selectHarga.value]; // Fallback to standar if key not found
        let totalVolumeBeton_m3 = 0;
        const itemBeton = spesifikasi.find(item => item.nama.toLowerCase().includes("beton ready mix"));
        if (itemBeton) {
            totalVolumeBeton_m3 = eval(itemBeton.rumus_kebutuhan);
        } else {
            const itemSemen = spesifikasi.find(item => item.nama.toLowerCase().includes("semen"));
            if (itemSemen) {
                totalVolumeBeton_m3 = eval(itemSemen.rumus_kebutuhan) / 8;
            }
        }
        const totalLuasDinding_m2 = luas_bangunan * 3.5;
        
        const produktivitas = data.produktivitas_kerja;
        const hariKerjaStruktur = totalVolumeBeton_m3 * produktivitas.struktur_hari_per_m3_beton;
        const hariKerjaDinding = totalLuasDinding_m2 * produktivitas.dinding_hari_per_m2_terpasang;
        const hariKerjaFinishing = luas_bangunan * produktivitas.finishing_hari_per_m2_bangunan;

        const overlap = data.logika_overlap_durasi;
        const startStruktur = 0;
        const endStruktur = hariKerjaStruktur;
        const startDinding = endStruktur * overlap.struktur_selesai_untuk_mulai_dinding_persen;
        const endDinding = startDinding + hariKerjaDinding;
        const startFinishing = startDinding + (hariKerjaDinding * overlap.dinding_selesai_untuk_mulai_finishing_persen);
        const endFinishing = startFinishing + hariKerjaFinishing;

        const totalHariKerja = Math.max(endStruktur, endDinding, endFinishing) + 10;
        const durasiTotalBulan = totalHariKerja / 25;

        return { durasiTotalBulan, totalHariKerja };
    }

    function calculateLaborCost(luas_bangunan, durations, data) {
        let totalBiayaTukang = 0;
        let rencanaTukangHTML = '';

        for (const [key, fase] of Object.entries(data.fase_proyek)) {
            const durasiFaseBulan = durations.durasiTotalBulan * fase.persentase_durasi;
            const durasiFaseHari = durasiFaseBulan * 25;
            const timFase = {};
            for (const [posisi, rumus] of Object.entries(fase.komposisi_tukang_rumus)) {
                timFase[posisi] = eval(rumus);
            }
            const biayaHarianFase = (timFase.mandor * data.biaya_tukang_harian.mandor) +
                                    (timFase.tukang_ahli * data.biaya_tukang_harian.tukang_ahli) +
                                    (timFase.kenek_laden * data.biaya_tukang_harian.kenek_laden);
            const totalBiayaFase = biayaHarianFase * durasiFaseHari;
            totalBiayaTukang += totalBiayaFase;

            rencanaTukangHTML += `
                <div class="border-t pt-4 border-gray-200">
                    <h3 class="font-semibold text-lg text-gray-800">${fase.nama}</h3>
                    <div class="text-sm text-gray-600 mt-2 space-y-2">
                        <div class="flex justify-between"><span>Estimasi Durasi:</span> <span class="font-medium">${durasiFaseBulan.toFixed(1)} bulan (~${Math.round(durasiFaseHari)} hari kerja)</span></div>
                        <div class="flex justify-between"><span>Tim yang Dibutuhkan:</span> <span class="font-medium">${timFase.mandor}M, ${timFase.tukang_ahli}T, ${timFase.kenek_laden}K</span></div>
                        <div class="flex justify-between"><span>Biaya Borongan Fase (Estimasi):</span> <span class="font-semibold text-gray-800">${formatRupiah(totalBiayaFase)}</span></div>
                    </div>
                </div>`;
        }
        return { totalBiayaTukang, rencanaTukangHTML };
    }

    function calculateMaterialCost(luas_bangunan, spesifikasi) {
        let totalBiayaMaterialKulak = 0, totalBiayaMaterialPasar = 0;
        let rabKontraktorHTML = '', rabKlienHTML = '';

        spesifikasi.forEach(item => {
            const volume = eval(item.rumus_kebutuhan);
            const hargaKulak = item.harga.kulak_rumus ? eval(item.harga.kulak_rumus) : item.harga.kulak;
            const hargaPasar = item.harga.pasar_rumus ? eval(item.harga.pasar_rumus) : item.harga.pasar;
            const subtotalKulak = volume * hargaKulak;
            const subtotalPasar = volume * hargaPasar;
            totalBiayaMaterialKulak += subtotalKulak;
            totalBiayaMaterialPasar += subtotalPasar;

            rabKontraktorHTML += `<tr>...</tr>`; // (Salin-tempel dari versi sebelumnya)
            rabKlienHTML += `<tr>...</tr>`; // (Salin-tempel dari versi sebelumnya)
        });
        
        return { totalBiayaMaterialKulak, totalBiayaMaterialPasar, rabKontraktorHTML, rabKlienHTML };
    }

    function renderOutputs(results) {
        // --- RENDER BAGIAN KONTRAKTOR ---
        document.getElementById('output-ringkasan-kontraktor').innerHTML = `
            <div class="flex justify-between"><span class="font-medium">Estimasi Durasi:</span> <span class="font-semibold">${results.durasiTotalBulan.toFixed(1)} bulan</span></div>
            <div class="flex justify-between"><span class="font-medium">Total Biaya Tukang:</span> <span>${formatRupiah(results.totalBiayaTukang)}</span></div>
            <div class="flex justify-between"><span class="font-medium">Total Biaya Material (Kulak):</span> <span>${formatRupiah(results.totalBiayaMaterialKulak)}</span></div>
            <hr class="my-2 border-t border-gray-200">
            <div class="flex justify-between"><span class="font-semibold text-lg text-gray-800">Total HPP Proyek:</span> <span class="font-bold text-lg text-blue-600">${formatRupiah(results.totalBiayaProyekInternal)}</span></div>
            <div class="flex justify-between"><span class="font-semibold text-lg text-gray-800">Estimasi Profit:</span> <span class="font-bold text-lg text-green-600">${formatRupiah(results.profitEstimasi)} (${results.profitMargin.toFixed(1)}%)</span></div>
        `;

        document.getElementById('output-rencana-tukang').innerHTML = results.rencanaTukangHTML;

        document.getElementById('output-total-durasi').innerHTML = `
            <div class="flex justify-between text-base">
                <span class="font-semibold text-gray-800">TOTAL ESTIMASI PROYEK:</span>
                <div class="text-right">
                    <p class="font-bold text-lg text-indigo-600">${results.durasiTotalBulan.toFixed(1)} bulan</p>
                    <p class="text-sm text-gray-600">(~${Math.round(results.totalHariKerja)} hari kerja)</p>
                </div>
            </div>
        `;

        document.getElementById('output-rab-table-kontraktor').innerHTML = results.rabKontraktorHTML + `
            <tr class="bg-gray-50">
                <td colspan="3" class="px-6 py-3 text-right text-sm font-bold text-gray-700">TOTAL BIAYA MATERIAL (KULAK)</td>
                <td class="px-6 py-3 text-left text-sm font-bold text-gray-900">${formatRupiah(results.totalBiayaMaterialKulak)}</td>
            </tr>
        `;

        // --- RENDER BAGIAN KLIEN ---
        document.getElementById('output-ringkasan-klien').innerHTML = `
            <div class="flex justify-between"><span class="font-medium">Estimasi Durasi:</span> <span class="font-semibold">${results.durasiTotalBulan.toFixed(1)} bulan</span></div>
            <div class="flex justify-between"><span class="font-medium">Luas Bangunan:</span> <span>${results.luas_bangunan} m²</span></div>
            <div class="flex justify-between"><span class="font-medium">Harga per m²:</span> <span>${formatRupiah(results.hargaData.nilai)}</span></div>
            <hr class="my-2 border-t border-gray-200">
            <div class="flex justify-between"><span class="font-semibold text-lg text-gray-800">Total Nilai Proyek:</span> <span class="font-bold text-lg text-indigo-600">${formatRupiah(results.totalNilaiProyekKlien)}</span></div>
        `;

        document.getElementById('output-rab-table-klien').innerHTML = results.rabKlienHTML + `
            <tr class="bg-gray-50">
                <td colspan="3" class="px-6 py-3 text-right text-sm font-semibold text-gray-600">ESTIMASI BIAYA MATERIAL (PASAR)</td>
                <td class="px-6 py-3 text-left text-sm font-semibold text-gray-800">${formatRupiah(results.totalBiayaMaterialPasar)}</td>
            </tr>
        `;

        // Render Timeline & Termin Dinamis
        const milestones = projectData.timeline_milestones;
        const progressPerTermin = 95 / results.jumlahTermin;
        let currentTermin = 1;
        let terminHTML_Content = `<div class="border-l-2 border-indigo-500 pl-4">
                            <h3 class="font-semibold text-lg">Termin ${currentTermin} (Uang Muka / DP - Progress 0% s/d ${progressPerTermin.toFixed(0)}%)</h3>
                            <p class="text-sm text-gray-600 mt-1">Pembayaran: <strong>${formatRupiah(results.totalNilaiProyekKlien / (results.jumlahTermin + 1))}</strong></p>
                            <ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">`;
        
        milestones.forEach(milestone => {
            const terminBatasAtas = currentTermin * progressPerTermin;
            if (milestone.persentase > terminBatasAtas && currentTermin < results.jumlahTermin) {
                terminHTML_Content += `</ul></div>`;
                currentTermin++;
                const batasBawah = ((currentTermin - 1) * progressPerTermin).toFixed(0);
                const batasAtas = (currentTermin * progressPerTermin).toFixed(0);
                terminHTML_Content += `<div class="border-l-2 border-indigo-500 pl-4 mt-6">
                                <h3 class="font-semibold text-lg">Termin ${currentTermin} (Progress >${batasBawah}% s/d ${batasAtas}%)</h3>
                                <p class="text-sm text-gray-600 mt-1">Pembayaran: <strong>${formatRupiah(results.totalNilaiProyekKlien / (results.jumlahTermin + 1))}</strong></p>
                                <ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">`;
            }
            terminHTML_Content += `<li><strong>${milestone.persentase}%:</strong> ${milestone.narasi_klien}</li>`;
        });
        
        terminHTML_Content += `</ul></div>`;
        terminHTML_Content += `<div class="border-l-2 border-green-500 pl-4 mt-6">
                        <h3 class="font-semibold text-lg">Termin Pelunasan (Retensi 5%)</h3>
                        <p class="text-sm text-gray-600 mt-1">Pembayaran: <strong>${formatRupiah(results.totalNilaiProyekKlien * 0.05)}</strong></p>
                        <ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">
                            <li><strong>100%:</strong> Pembayaran akhir setelah masa pemeliharaan (retensi) selama 3-6 bulan selesai.</li>
                        </ul>
                    </div>`;
                    
        document.getElementById('output-timeline').innerHTML = terminHTML_Content;
    }

    function renderAssumptionInputs() {
        // Render Biaya Tukang
        const tukangContainer = document.getElementById('assumptions-biaya-tukang');
        tukangContainer.innerHTML = '';
        for (const [posisi, harga] of Object.entries(projectData.biaya_tukang_harian)) {
            tukangContainer.innerHTML += `
                <div>
                    <label class="block text-sm font-medium text-gray-700 capitalize">${posisi.replace('_', ' ')}</label>
                    <input type="number" class="mt-1 w-full rounded-md border-gray-300" 
                           data-path="biaya_tukang_harian.${posisi}" value="${harga}">
                </div>`;
        }
        
        // Render Produktivitas
        const produktivitasContainer = document.getElementById('assumptions-produktivitas');
        produktivitasContainer.innerHTML = '';
        for (const [key, val] of Object.entries(projectData.produktivitas_kerja)) {
             produktivitasContainer.innerHTML += `
                <div>
                    <label class="block text-sm font-medium text-gray-700 capitalize">${key.replace(/_/g, ' ')}</label>
                    <input type="number" step="0.01" class="mt-1 w-full rounded-md border-gray-300" 
                           data-path="produktivitas_kerja.${key}" value="${val}">
                </div>`;
        }

        // Render Overlap
        const overlapContainer = document.getElementById('assumptions-overlap');
        overlapContainer.innerHTML = '';
        for (const [key, val] of Object.entries(projectData.logika_overlap_durasi)) {
             overlapContainer.innerHTML += `
                <div>
                    <label class="block text-sm font-medium text-gray-700 capitalize">${key.replace(/_/g, ' ')}</label>
                    <input type="number" step="0.01" class="mt-1 w-full rounded-md border-gray-300" 
                           data-path="logika_overlap_durasi.${key}" value="${val}">
                </div>`;
        }

        // Render Harga Material
        const materialContainer = document.getElementById('assumptions-harga-material');
        materialContainer.innerHTML = '';
        for (const [kualitas, items] of Object.entries(projectData.spesifikasi_teknis)) {
            let itemsHTML = `<div class="md:col-span-1 lg:col-span-1"><h4 class="text-lg font-semibold capitalize border-b pb-2 mb-3">${kualitas}</h4><div class="space-y-4">`;
            items.forEach((item, index) => {
                itemsHTML += `
                    <div>
                        <p class="text-sm font-medium text-gray-800">${item.nama}</p>
                        <div class="flex space-x-2 mt-1">
                            <input type="number" placeholder="Kulak" class="w-1/2 rounded-md border-gray-300" 
                                   data-path="spesifikasi_teknis.${kualitas}.${index}.harga.kulak" 
                                   value="${item.harga.kulak || ''}" ${item.harga.kulak_rumus ? 'disabled' : ''}>
                            <input type="number" placeholder="Pasar" class="w-1/2 rounded-md border-gray-300" 
                                   data-path="spesifikasi_teknis.${kualitas}.${index}.harga.pasar" 
                                   value="${item.harga.pasar || ''}" ${item.harga.pasar_rumus ? 'disabled' : ''}>
                        </div>
                    </div>
                `;
            });
            itemsHTML += `</div></div>`;
            materialContainer.innerHTML += itemsHTML;
        }

        // Tambah satu event listener untuk semua input di tab asumsi
        document.getElementById('view-asumsi').addEventListener('input', (event) => {
            if (event.target.tagName === 'INPUT') {
                const path = event.target.dataset.path;
                const value = parseFloat(event.target.value) || 0;
                if (path) {
                    updateNestedObject(projectData, path, value);
                    calculateProject(); // Kalkulasi ulang setiap ada perubahan
                }
            }
        });
    }

    const calculateProject = () => {
        if (!projectData.harga_per_meter) return;

        // 1. KUMPULKAN INPUT
        const luas_bangunan = parseFloat(inputLuasBangunan.value) || 0;
        const hargaKey = selectHarga.value;
        const jumlahTermin = parseInt(inputTermin.value) || 1;
        
        // 2. PANGGIL SPESIALIS UNTUK MENGHITUNG SETIAP BAGIAN
        const durations = calculateDurations(luas_bangunan, projectData);
        const labor = calculateLaborCost(luas_bangunan, durations, projectData);
        const materials = calculateMaterialCost(luas_bangunan, projectData.spesifikasi_teknis[hargaKey]);
        
        // 3. HITUNG TOTAL & PROFIT
        const hargaData = projectData.harga_per_meter[hargaKey];
        const totalNilaiProyekKlien = luas_bangunan * hargaData.nilai;
        const totalBiayaProyekInternal = materials.totalBiayaMaterialKulak + labor.totalBiayaTukang;
        const profitEstimasi = totalNilaiProyekKlien - totalBiayaProyekInternal;
        const profitMargin = (profitEstimasi / totalNilaiProyekKlien) * 100 || 0;

        // 4. KUMPULKAN SEMUA HASIL UNTUK DI-RENDER
        const results = {
            ...durations,
            ...labor,
            ...materials,
            luas_bangunan,
            jumlahTermin,
            hargaData,
            totalNilaiProyekKlien,
            totalBiayaProyekInternal,
            profitEstimasi,
            profitMargin
        };

        // 5. RENDER SEMUA HASIL KE TAMPILAN
        renderOutputs(results);
    };

    const init = async () => {
        try {
            const response = await fetch('proyek.json');
            projectData = await response.json();
            
            // Setup Tabs
            const tabs = document.querySelectorAll('.tab');
            const views = document.querySelectorAll('.view-content');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.replace('active-tab', 'inactive-tab'));
                    tab.classList.replace('inactive-tab', 'active-tab');
                    const targetView = document.getElementById(tab.id.replace('tab-', 'view-'));
                    views.forEach(view => view.style.display = 'none');
                    targetView.style.display = tab.id === 'tab-asumsi' ? 'block' : 'grid';
                });
            });

            // Populate select harga
            for (const key in projectData.harga_per_meter) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = projectData.harga_per_meter[key].label;
                selectHarga.appendChild(option);
            }
            
            // Render input asumsi untuk pertama kali
            renderAssumptionInputs(); 

            // Tambah event listener untuk input utama
            inputLuasBangunan.addEventListener('input', calculateProject);
            selectHarga.addEventListener('change', calculateProject);
            inputTermin.addEventListener('input', calculateProject);

            // Jalankan kalkulasi pertama kali
            calculateProject();
            
        } catch (error) {
            console.error('Gagal memuat data proyek:', error);
            alert('Gagal memuat data proyek. Pastikan file proyek.json ada dan formatnya benar.');
        }
    };

    init();
});