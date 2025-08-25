// proyek.js v0.9 fix5 + chart
document.addEventListener('DOMContentLoaded', () => {
    // Definisi elemen UI
    const tabKontraktor = document.getElementById('tab-kontraktor');
    const tabKlien = document.getElementById('tab-klien');
    const viewKontraktor = document.getElementById('view-kontraktor');
    const viewKlien = document.getElementById('view-klien');

    const subtabRingkasanKontraktor = document.getElementById('subtab-ringkasan-kontraktor');
    const subtabRabKontraktor = document.getElementById('subtab-rab-kontraktor');
    const subtabTukangKontraktor = document.getElementById('subtab-tukang-kontraktor');
    const subtabRingkasanKlien = document.getElementById('subtab-ringkasan-klien');
    const subtabRabKlien = document.getElementById('subtab-rab-klien');
    const subtabTimelineKlien = document.getElementById('subtab-timeline-klien');

    const outputRingkasanKontraktor = document.getElementById('output-ringkasan-kontraktor');
    const outputRingkasanKlien = document.getElementById('output-ringkasan-klien');
    const inputLuasBangunan = document.getElementById('input-luas-bangunan');
    const selectHarga = document.getElementById('select-harga');
    const inputTermin = document.getElementById('input-termin');
    const selectHargaKlien = document.getElementById('select-harga-klien');
    const inputTerminKlien = document.getElementById('input-termin-klien');
    
    // Variabel spesifik untuk output
    const outputRabTableKontraktor = document.getElementById('output-rab-table-kontraktor');
    const outputRabTableKlien = document.getElementById('output-rab-table-klien');
    const outputTimeline = document.getElementById('output-timeline');

    let projectData = {};

    const setupSubTabs = () => {
        // Sub-tab Kontraktor
        const subtabContentsKontraktor = document.querySelectorAll('#view-kontraktor .subtab-content');
        
        subtabRingkasanKontraktor.addEventListener('click', () => {
            // Update tab status
            document.querySelectorAll('.subtab-kontraktor').forEach(tab => {
                tab.classList.replace('active-tab', 'inactive-tab');
            });
            subtabRingkasanKontraktor.classList.replace('inactive-tab', 'active-tab');
            
            // Update content visibility
            subtabContentsKontraktor.forEach(content => content.classList.add('hidden'));
            document.getElementById('subtab-content-ringkasan-kontraktor').classList.remove('hidden');
            
            // Re-render ringkasan
            if (projectData && projectData.harga_per_meter) {
                calculateProject();
            }
        });
        
        subtabRabKontraktor.addEventListener('click', () => {
            // Update tab status
            document.querySelectorAll('.subtab-kontraktor').forEach(tab => {
                tab.classList.replace('active-tab', 'inactive-tab');
            });
            subtabRabKontraktor.classList.replace('inactive-tab', 'active-tab');
            
            // Update content visibility
            subtabContentsKontraktor.forEach(content => content.classList.add('hidden'));
            document.getElementById('subtab-content-rab-kontraktor').classList.remove('hidden');
            
            // Re-render RAB
            if (projectData && projectData.harga_per_meter) {
                calculateProject();
            }
        });
        
        subtabTukangKontraktor.addEventListener('click', () => {
            // Update tab status
            document.querySelectorAll('.subtab-kontraktor').forEach(tab => {
                tab.classList.replace('active-tab', 'inactive-tab');
            });
            subtabTukangKontraktor.classList.replace('inactive-tab', 'active-tab');
            
            // Update content visibility
            subtabContentsKontraktor.forEach(content => content.classList.add('hidden'));
            document.getElementById('subtab-content-tukang-kontraktor').classList.remove('hidden');
            
            // Re-render tenaga kerja
            if (projectData && projectData.harga_per_meter) {
                calculateProject();
            }
        });
        
        // Sub-tab Klien
        const subtabContentsKlien = document.querySelectorAll('#view-klien .subtab-content');
        
        subtabRingkasanKlien.addEventListener('click', () => {
            // Update tab status
            document.querySelectorAll('.subtab-klien').forEach(tab => {
                tab.classList.replace('active-tab', 'inactive-tab');
            });
            subtabRingkasanKlien.classList.replace('inactive-tab', 'active-tab');
            
            // Update content visibility
            subtabContentsKlien.forEach(content => content.classList.add('hidden'));
            document.getElementById('subtab-content-ringkasan-klien').classList.remove('hidden');
            
            // Re-render ringkasan
            if (projectData && projectData.harga_per_meter) {
                calculateProject();
            }
        });
        
        subtabRabKlien.addEventListener('click', () => {
            // Update tab status
            document.querySelectorAll('.subtab-klien').forEach(tab => {
                tab.classList.replace('active-tab', 'inactive-tab');
            });
            subtabRabKlien.classList.replace('inactive-tab', 'active-tab');
            
            // Update content visibility
            subtabContentsKlien.forEach(content => content.classList.add('hidden'));
            document.getElementById('subtab-content-rab-klien').classList.remove('hidden');
            
            // Re-render RAB
            if (projectData && projectData.harga_per_meter) {
                calculateProject();
            }
        });
        
        subtabTimelineKlien.addEventListener('click', () => {
            // Update tab status
            document.querySelectorAll('.subtab-klien').forEach(tab => {
                tab.classList.replace('active-tab', 'inactive-tab');
            });
            subtabTimelineKlien.classList.replace('inactive-tab', 'active-tab');
            
            // Update content visibility
            subtabContentsKlien.forEach(content => content.classList.add('hidden'));
            document.getElementById('subtab-content-timeline-klien').classList.remove('hidden');
            
            // Re-render timeline
            if (projectData && projectData.harga_per_meter) {
                calculateProject();
            }
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

    function calculateDurations(luas_bangunan, data, hargaKey) {
        const spesifikasi = data.spesifikasi_teknis[hargaKey];
        let totalVolumeBeton_m3 = 0;
        
        const itemBeton = spesifikasi.find(item => item.nama.toLowerCase().includes("beton ready mix"));
        if (itemBeton) {
            totalVolumeBeton_m3 = eval(itemBeton.rumus_kebutuhan);
        } else {
            // Fallback untuk standar dan premium - gunakan perhitungan yang lebih realistis
            const itemSemen = spesifikasi.find(item => item.nama.toLowerCase().includes("semen"));
            if (itemSemen) {
                // Perbaiki konversi semen ke beton - lebih realistis
                // Asumsi: 1 sak semen (50kg) = 0.03m³ beton
                const volumeSemen_m3 = eval(itemSemen.rumus_kebutuhan) * 0.03;
                totalVolumeBeton_m3 = volumeSemen_m3;
            }
        }
        
        // Tambahkan faktor kualitas - bangunan higher quality perlu lebih beton
        const kualitasFaktor = {
            'standar': 1.0,
            'premium': 1.1,
            'deluxe': 1.3,
            'luxury': 1.5
        };
        totalVolumeBeton_m3 *= kualitasFaktor[hargaKey] || 1.0;
        
        const totalLuasDinding_m2 = luas_bangunan * 3.5;
        
        const produktivitas = data.produktivitas_kerja;
        
        // Adjust produktivitas berdasarkan kualitas - higher quality butuh lebih waktu
        const produktivitasFaktor = {
            'standar': 1.0,
            'premium': 1.1,
            'deluxe': 1.25,
            'luxury': 1.4
        };
        const produktivitasAdjust = produktivitasFaktor[hargaKey] || 1.0;
        
        const hariKerjaStruktur = totalVolumeBeton_m3 * produktivitas.struktur_hari_per_m3_beton * produktivitasAdjust;
        const hariKerjaDinding = totalLuasDinding_m2 * produktivitas.dinding_hari_per_m2_terpasang * produktivitasAdjust;
        const hariKerjaFinishing = luas_bangunan * produktivitas.finishing_hari_per_m2_bangunan * produktivitasAdjust;
        
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

            // --- INI ADALAH BAGIAN YANG DIPERBAIKI ---
            rabKontraktorHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.nama}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${volume.toFixed(2)} ${item.satuan}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatRupiah(hargaKulak)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">${formatRupiah(subtotalKulak)}</td>
                </tr>`;
                
            rabKlienHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.nama}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${volume.toFixed(2)} ${item.satuan}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatRupiah(hargaPasar)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatRupiah(subtotalPasar)}</td>
                </tr>`;
            // --- AKHIR BAGIAN YANG DIPERBAIKI ---
        });
        
        return { totalBiayaMaterialKulak, totalBiayaMaterialPasar, rabKontraktorHTML, rabKlienHTML };
    }

    function renderOutputs(results) {
        // --- RENDER BAGIAN KONTRAKTOR ---
        // Ringkasan singkat di sidebar
        document.getElementById('output-ringkasan-singkat-kontraktor').innerHTML = `
            <div class="flex justify-between"><span class="font-medium">Estimasi Durasi:</span> <span class="font-semibold">${results.durasiTotalBulan.toFixed(1)} bulan</span></div>
            <div class="flex justify-between"><span class="font-medium">Total Biaya Tukang:</span> <span>${formatRupiah(results.totalBiayaTukang)}</span></div>
            <div class="flex justify-between"><span class="font-medium">Total Biaya Material:</span> <span>${formatRupiah(results.totalBiayaMaterialKulak)}</span></div>
            <hr class="my-2 border-t border-gray-200">
            <div class="flex justify-between"><span class="font-semibold text-lg text-gray-800">Total HPP Proyek:</span> <span class="font-bold text-lg text-blue-600">${formatRupiah(results.totalBiayaProyekInternal)}</span></div>
            <div class="flex justify-between"><span class="font-semibold text-lg text-gray-800">Estimasi Profit:</span> <span class="font-bold text-lg text-green-600">${formatRupiah(results.profitEstimasi)} (${results.profitMargin.toFixed(1)}%)</span></div>
        `;
        
        // Cek sub-tab aktif untuk menentukan konten utama
        const activeSubtabKontraktor = document.querySelector('.subtab-kontraktor.active-tab').id;
        
        if (activeSubtabKontraktor === 'subtab-ringkasan-kontraktor') {
            // Render ringkasan di main content
            const ringkasanMain = document.getElementById('output-ringkasan-kontraktor-main');
            if (ringkasanMain) {
                ringkasanMain.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-blue-50 p-5 rounded-lg border border-blue-100">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-blue-100 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-blue-800">Biaya Material</h3>
                                    <p class="text-2xl font-bold text-blue-600 mt-1">${formatRupiah(results.totalBiayaMaterialKulak)}</p>
                                    <p class="text-sm text-blue-600 mt-1">Total harga kulak semua material</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-green-50 p-5 rounded-lg border border-green-100">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-green-100 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-green-800">Biaya Tenaga Kerja</h3>
                                    <p class="text-2xl font-bold text-green-600 mt-1">${formatRupiah(results.totalBiayaTukang)}</p>
                                    <p class="text-sm text-green-600 mt-1">Total biaya untuk semua tenaga kerja</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-purple-50 p-5 rounded-lg border border-purple-100">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-purple-100 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-purple-800">Total HPP Proyek</h3>
                                    <p class="text-2xl font-bold text-purple-600 mt-1">${formatRupiah(results.totalBiayaProyekInternal)}</p>
                                    <p class="text-sm text-purple-600 mt-1">Total biaya internal proyek</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-yellow-50 p-5 rounded-lg border border-yellow-100">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-yellow-100 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-yellow-800">Estimasi Profit</h3>
                                    <p class="text-2xl font-bold text-yellow-600 mt-1">${formatRupiah(results.profitEstimasi)}</p>
                                    <p class="text-sm text-yellow-600 mt-1">(${results.profitMargin.toFixed(1)}% dari nilai proyek)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 class="font-semibold text-gray-800 text-lg mb-4">Detail Biaya per Kategori</h3>
                        <div class="space-y-3">
                            ${getKategoriBiayaHTML(results.hargaKey, results.totalBiayaMaterialKulak, results.luas_bangunan)}
                        </div>
                    </div>
                    <div class="mt-8 bg-white p-6 rounded-lg border border-gray-200">
                        <h3 class="font-semibold text-gray-800 text-lg mb-4">Distribusi Biaya</h3>
                        <div class="h-64">
                            <canvas id="biayaChart"></canvas>
                        </div>
                    </div>
                `;
                
                // Render chart jika ada library chart
                renderBiayaChart(results);
            }
        } else if (activeSubtabKontraktor === 'subtab-rab-kontraktor') {
            // Render RAB table di main content
            const rabTable = document.getElementById('output-rab-table-kontraktor');
            if (rabTable) {
                rabTable.innerHTML = results.rabKontraktorHTML + `
                    <tr class="bg-gray-50">
                        <td colspan="3" class="px-6 py-3 text-right text-sm font-bold text-gray-700">TOTAL BIAYA MATERIAL (KULAK)</td>
                        <td class="px-6 py-3 text-left text-sm font-bold text-gray-900">${formatRupiah(results.totalBiayaMaterialKulak)}</td>
                    </tr>
                `;
            }
        } else if (activeSubtabKontraktor === 'subtab-tukang-kontraktor') {
            // Render tenaga kerja di main content
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
            
            // Render detail pekerjaan per minggu
            renderDetailPekerjaan(results);
        }
        
        // --- RENDER BAGIAN KLIEN ---
        // Ringkasan singkat di sidebar
        document.getElementById('output-ringkasan-singkat-klien').innerHTML = `
            <div class="flex justify-between"><span class="font-medium">Estimasi Durasi:</span> <span class="font-semibold">${results.durasiTotalBulan.toFixed(1)} bulan</span></div>
            <div class="flex justify-between"><span class="font-medium">Luas Bangunan:</span> <span>${results.luas_bangunan} m²</span></div>
            <div class="flex justify-between"><span class="font-medium">Harga per m²:</span> <span>${formatRupiah(results.hargaData.nilai)}</span></div>
            <hr class="my-2 border-t border-gray-200">
            <div class="flex justify-between"><span class="font-semibold text-lg text-gray-800">Total Nilai Proyek:</span> <span class="font-bold text-lg text-indigo-600">${formatRupiah(results.totalNilaiProyekKlien)}</span></div>
        `;
        
        // Cek sub-tab aktif untuk menentukan konten utama
        const activeSubtabKlien = document.querySelector('.subtab-klien.active-tab').id;
        
        if (activeSubtabKlien === 'subtab-ringkasan-klien') {
            // Render ringkasan di main content
            const ringkasanMain = document.getElementById('output-ringkasan-klien-main');
            if (ringkasanMain) {
                ringkasanMain.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-blue-50 p-5 rounded-lg border border-blue-100">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-blue-100 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-blue-800">Total Nilai Proyek</h3>
                                    <p class="text-2xl font-bold text-blue-600 mt-1">${formatRupiah(results.totalNilaiProyekKlien)}</p>
                                    <p class="text-sm text-blue-600 mt-1">Untuk ${results.luas_bangunan} m² dengan kualitas ${results.hargaKey}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-green-50 p-5 rounded-lg border border-green-100">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-green-100 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-green-800">Estimasi Durasi</h3>
                                    <p class="text-2xl font-bold text-green-600 mt-1">${results.durasiTotalBulan.toFixed(1)} bulan</p>
                                    <p class="text-sm text-green-600 mt-1">(~${Math.round(results.totalHariKerja)} hari kerja)</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-purple-50 p-5 rounded-lg border border-purple-100">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-purple-100 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-purple-800">Jumlah Termin</h3>
                                    <p class="text-2xl font-bold text-purple-600 mt-1">${results.jumlahTermin} + Retensi</p>
                                    <p class="text-sm text-purple-600 mt-1">Pembayaran setiap ${(100 / results.jumlahTermin).toFixed(1)}% progress</p>
                                    <p class="text-xs text-purple-500 mt-1">Retensi 5% dibayar terpisah setelah masa garansi</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-yellow-50 p-5 rounded-lg border border-yellow-100">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-yellow-100 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-yellow-800">Harga per m²</h3>
                                    <p class="text-2xl font-bold text-yellow-600 mt-1">${formatRupiah(results.hargaData.nilai)}</p>
                                    <p class="text-sm text-yellow-600 mt-1">Kualitas ${results.hargaKey}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 class="font-semibold text-gray-800 text-lg mb-4">Rencana Pembayaran</h3>
                        <div class="space-y-3">
                            ${getRencanaPembayaranHTML(results)}
                        </div>
                    </div>
                    <div class="mt-8 bg-white p-6 rounded-lg border border-gray-200">
                        <h3 class="font-semibold text-gray-800 text-lg mb-4">Distribusi Pembayaran</h3>
                        <div class="h-64">
                            <canvas id="pembayaranChart"></canvas>
                        </div>
                    </div>
                `;
                
                // Render chart jika ada library chart
                renderPembayaranChart(results);
            }
        } else if (activeSubtabKlien === 'subtab-rab-klien') {
            // Render RAB table di main content
            const rabTable = document.getElementById('output-rab-table-klien');
            if (rabTable) {
                rabTable.innerHTML = results.rabKlienHTML + `
                    <tr class="bg-gray-50">
                        <td colspan="3" class="px-6 py-3 text-right text-sm font-semibold text-gray-600">ESTIMASI BIAYA MATERIAL (PASAR)</td>
                        <td class="px-6 py-3 text-left text-sm font-semibold text-gray-800">${formatRupiah(results.totalBiayaMaterialPasar)}</td>
                    </tr>
                `;
            }
        } else if (activeSubtabKlien === 'subtab-timeline-klien') {
            // Render timeline di main content
            renderTimeline(results);
        }
    }

    function renderTimeline(results) {
        const milestones = projectData.timeline_milestones;
        // Progress dibagi ke jumlah termin
        const progressPerTermin = 100 / results.jumlahTermin;
        let terminHTML_Content = '';
        
        // Loop untuk setiap termin
        for (let i = 1; i <= results.jumlahTermin; i++) {
            const progressAwal = (i - 1) * progressPerTermin;
            const progressAkhir = i * progressPerTermin;
            
            // Hitung persentase pembayaran untuk termin ini
            let persentasePembayaran = 100 / results.jumlahTermin;
            let nominalPembayaran = results.totalNilaiProyekKlien * persentasePembayaran / 100;
            let nominalRetensi = 0;
            
            // Untuk termin terakhir, hitung retensi
            if (i === results.jumlahTermin) {
                // Jika persentase pembayaran kurang dari 2.5%, bagi rata
                if (persentasePembayaran < 2.5) {
                    persentasePembayaran = persentasePembayaran / 2;
                    nominalRetensi = results.totalNilaiProyekKlien * persentasePembayaran / 100;
                    nominalPembayaran = results.totalNilaiProyekKlien * persentasePembayaran / 100;
                } else {
                    // Jika tidak, retensi tetap 5%
                    nominalRetensi = results.totalNilaiProyekKlien * 0.05;
                    nominalPembayaran = nominalPembayaran - nominalRetensi;
                }
            }
            
            terminHTML_Content += `<div class="border-l-2 ${i === results.jumlahTermin ? 'border-green-500' : 'border-indigo-500'} pl-4 mt-6">
                                <h3 class="font-semibold text-lg">Termin ${i} (Progress ${progressAwal.toFixed(0)}% s/d ${progressAkhir.toFixed(0)}%)</h3>
                                <p class="text-sm text-gray-600 mt-1">Pembayaran: <strong>${formatRupiah(nominalPembayaran)}</strong> (${(nominalPembayaran / results.totalNilaiProyekKlien * 100).toFixed(1)}% dari total proyek)</p>`;
            
            // Jika ini termin terakhir dan ada retensi
            if (i === results.jumlahTermin && nominalRetensi > 0) {
                terminHTML_Content += `<p class="text-sm text-yellow-600 mt-1"><em>Termasuk retensi 5% (${formatRupiah(nominalRetensi)}) yang dibayar setelah masa garansi 3-6 bulan</em></p>`;
            }
            
            terminHTML_Content += `<ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">`;
            
            // Cari milestones yang termasuk dalam rentang progress ini
            const milestonesInTermin = milestones.filter(m => 
                m.persentase > progressAwal && m.persentase <= progressAkhir
            );
            
            milestonesInTermin.forEach(milestone => {
                terminHTML_Content += `<li><strong>${milestone.persentase}%:</strong> ${milestone.narasi_klien}</li>`;
            });
            
            // Tambahkan penjelasan khusus berdasarkan kualitas
            const kualitasPenjelasan = getKualitasPenjelasan(results.hargaKey, i);
            terminHTML_Content += `<li class="mt-2"><em>${kualitasPenjelasan}</em></li>`;
            
            terminHTML_Content += `</ul></div>`;
        }
        
        // Tambahkan bagian retensi terpisah
        const nominalRetensiTotal = results.totalNilaiProyekKlien * 0.05;
        terminHTML_Content += `<div class="border-l-2 border-red-500 pl-4 mt-6">
                        <h3 class="font-semibold text-lg">Retensi</h3>
                        <p class="text-sm text-gray-600 mt-1">Pembayaran: <strong>${formatRupiah(nominalRetensiTotal)}</strong> (5% dari total proyek)</p>
                        <ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">
                            <li><strong>100%:</strong> Pembayaran 5% retensi setelah 3-6 bulan konstruksi tidak ada masalah dalam bangunan.</li>
                            <li><em>Catatan: Retensi adalah jaminan kualitas yang dibayar setelah masa perawatan selesai.</em></li>
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

    function renderDetailPekerjaan(results) {
        const totalMinggu = Math.ceil(results.durasiTotalBulan * 4);
        const detailPekerjaanContainer = document.getElementById('output-detail-pekerjaan');
        
        if (!detailPekerjaanContainer) return;
        
        let html = '';
        
        // Ambil milestones dari projectData
        const milestones = projectData.timeline_milestones;
        
        // Buat timeline per minggu
        for (let minggu = 1; minggu <= totalMinggu; minggu++) {
            const persentaseProgress = Math.min(100, Math.round((minggu / totalMinggu) * 100));
            
            // Cari milestone yang sesuai dengan minggu ini
            const milestoneMingguIni = milestones.filter(m => 
                m.persentase >= persentaseProgress - 5 && m.persentase <= persentaseProgress + 5
            );
            
            // Tentukan fase berdasarkan persentase progress
            let fase = 'Persiapan';
            if (persentaseProgress >= 5 && persentaseProgress < 45) fase = 'Struktur';
            else if (persentaseProgress >= 45 && persentaseProgress < 70) fase = 'Dinding & Atap';
            else if (persentaseProgress >= 70) fase = 'Finishing';
            
            // Tentukan pekerjaan berdasarkan fase
            let pekerjaan = '';
            if (fase === 'Persiapan') {
                pekerjaan = 'Mobilisasi, pembersihan lahan, pengukuran';
            } else if (fase === 'Struktur') {
                pekerjaan = 'Pekerjaan pondasi, kolom, balok, dan plat lantai';
            } else if (fase === 'Dinding & Atap') {
                pekerjaan = 'Pemasangan dinding, plesteran, dan rangka atap';
            } else if (fase === 'Finishing') {
                pekerjaan = 'Pemasangan plafond, kusen, lantai, dan pengecatan';
            }
            
            html += `
                <div class="border-l-4 ${getMingguColor(minggu, totalMinggu)} pl-4 py-2">
                    <div class="flex justify-between items-center">
                        <h4 class="font-semibold">Minggu ${minggu} (Progress ~${persentaseProgress}%)</h4>
                        <span class="text-sm px-2 py-1 rounded ${getFaseBadgeClass(fase)}">${fase}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${pekerjaan}</p>
                    ${milestoneMingguIni.length > 0 ? `
                        <div class="mt-2 bg-yellow-50 p-2 rounded text-sm">
                            <strong>Milestone:</strong> ${milestoneMingguIni.map(m => m.nama_teknis).join(', ')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        detailPekerjaanContainer.innerHTML = html;
    }

    function renderBiayaChart(results) {
        // Cek apakah Chart.js tersedia
        if (typeof Chart === 'undefined') {
            console.log('Chart.js tidak tersedia');
            return;
        }
        
        // Hapus chart yang sudah ada
        const existingChart = Chart.getChart('biayaChart');
        if (existingChart) {
            existingChart.destroy();
        }
        
        // Siapkan data untuk chart
        const spesifikasi = projectData.spesifikasi_teknis[results.hargaKey];
        const kategoriBiaya = {};
        
        spesifikasi.forEach(item => {
            const kategori = item.kategori || 'Lainnya';
            // Create a function with luas_bangunan as a parameter and call it with eval
            const volume = (function(luas_bangunan) {
                return eval(item.rumus_kebutuhan);
            })(results.luas_bangunan);
            
            const harga = item.harga.kulak_rumus ? (function(luas_bangunan) {
                return eval(item.harga.kulak_rumus);
            })(results.luas_bangunan) : item.harga.kulak;
            
            const subtotal = volume * harga;
            
            if (!kategoriBiaya[kategori]) {
                kategoriBiaya[kategori] = 0;
            }
            kategoriBiaya[kategori] += subtotal;
        });
        
        const labels = Object.keys(kategoriBiaya);
        const data = Object.values(kategoriBiaya);
        
        // Buat chart
        const ctx = document.getElementById('biayaChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = formatRupiah(context.raw);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderPembayaranChart(results) {
        // Cek apakah Chart.js tersedia
        if (typeof Chart === 'undefined') {
            console.log('Chart.js tidak tersedia');
            return;
        }
        
        // Hapus chart yang sudah ada
        const existingChart = Chart.getChart('pembayaranChart');
        if (existingChart) {
            existingChart.destroy();
        }
        
        // Siapkan data untuk chart
        const labels = [];
        const data = [];
        const persentasePerTermin = 100 / results.jumlahTermin;
        
        for (let i = 1; i <= results.jumlahTermin; i++) {
            let persentasePembayaran = persentasePerTermin;
            
            // Untuk termin terakhir, hitung retensi
            if (i === results.jumlahTermin) {
                // Jika persentase pembayaran kurang dari 2.5%, bagi rata
                if (persentasePembayaran < 2.5) {
                    persentasePembayaran = persentasePembayaran / 2;
                } else {
                    // Jika tidak, kurangi 5% untuk retensi
                    persentasePembayaran = persentasePembayaran - 5;
                }
            }
            
            labels.push(`Termin ${i}`);
            data.push(persentasePembayaran);
        }
        
        // Tambahkan retensi sebagai item terpisah
        labels.push('Retensi');
        data.push(5);
        
        // Buat chart
        const ctx = document.getElementById('pembayaranChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Persentase Pembayaran',
                    data: data,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)',
                        'rgba(83, 102, 255, 0.7)',
                        'rgba(40, 159, 64, 0.7)',
                        'rgba(210, 99, 132, 0.7)',
                        'rgba(80, 206, 86, 0.7)',
                        'rgba(70, 192, 192, 0.7)',
                        'rgba(153, 50, 255, 0.7)',
                        'rgba(255, 120, 64, 0.7)',
                        'rgba(54, 140, 235, 0.7)',
                        'rgba(255, 70, 132, 0.7)',
                        'rgba(255, 180, 86, 0.7)',
                        'rgba(75, 160, 192, 0.7)',
                        'rgba(153, 80, 255, 0.7)',
                        'rgba(255, 50, 64, 0.7)',
                        'rgba(100, 100, 100, 0.7)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)',
                        'rgba(83, 102, 255, 1)',
                        'rgba(40, 159, 64, 1)',
                        'rgba(210, 99, 132, 1)',
                        'rgba(80, 206, 86, 1)',
                        'rgba(70, 192, 192, 1)',
                        'rgba(153, 50, 255, 1)',
                        'rgba(255, 120, 64, 1)',
                        'rgba(54, 140, 235, 1)',
                        'rgba(255, 70, 132, 1)',
                        'rgba(255, 180, 86, 1)',
                        'rgba(75, 160, 192, 1)',
                        'rgba(153, 80, 255, 1)',
                        'rgba(255, 50, 64, 1)',
                        'rgba(100, 100, 100, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 15,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const nominal = results.totalNilaiProyekKlien * value / 100;
                                let label = `${value}%: ${formatRupiah(nominal)}`;
                                
                                // Tambahkan keterangan khusus untuk retensi
                                if (context.dataIndex === data.length - 1) {
                                    label += ' (Dibayar setelah masa garansi)';
                                }
                                
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    function getKualitasPenjelasan(kualitas, termin) {
        const penjelasan = {
            'standar': [
                'Pembayaran untuk material standar seperti besi beton polos dan bata ringan.',
                'Pekerjaan struktur menggunakan sistem konvensional dengan campuran manual.',
                'Finishing menggunakan cat tembok standar dan keramik lantai 40x40.'
            ],
            'premium': [
                'Pembayaran untuk material premium seperti besi beton ulir dan bata ringan kualitas 1.',
                'Pekerjaan struktur menggunakan sistem yang lebih presisi dengan semen mortar.',
                'Finishing menggunakan cat tembok premium dan granit tile 60x60.'
            ],
            'deluxe': [
                'Pembayaran untuk material deluxe seperti beton ready mix K-300 dan marmer lokal.',
                'Pekerjaan struktur menggunakan beton cor siap pakai untuk kualitas lebih baik.',
                'Finishing menggunakan cat tembok high-end dan marmer lokal dengan pemasangan yang teliti.'
            ],
            'luxury': [
                'Pembayaran untuk material luxury seperti beton ready mix K-350 dan marmer import Italy.',
                'Pekerjaan struktur menggunakan beton cor siap pakai kualitas tinggi dan waterproofing membrane.',
                'Finishing menggunakan cat tembok import dan marmer Italy dengan pemasangan premium.'
            ]
        };
        
        // Ambil penjelasan berdasarkan termin (berputar jika melebihi jumlah penjelasan)
        const penjelasanKualitas = penjelasan[kualitas] || penjelasan['standar'];
        const indexPenjelasan = (termin - 1) % penjelasanKualitas.length;
        
        return penjelasanKualitas[indexPenjelasan];
    }

    function getKategoriBiayaHTML(hargaKey, totalBiayaMaterial, luas_bangunan) {
        const spesifikasi = projectData.spesifikasi_teknis[hargaKey];
        const kategoriBiaya = {};
        
        spesifikasi.forEach(item => {
            const kategori = item.kategori || 'Lainnya';
            // Create a function with luas_bangunan as a parameter and call it with eval
            const volume = (function(luas_bangunan) {
                return eval(item.rumus_kebutuhan);
            })(luas_bangunan);
            
            const harga = item.harga.kulak_rumus ? (function(luas_bangunan) {
                return eval(item.harga.kulak_rumus);
            })(luas_bangunan) : item.harga.kulak;
            
            const subtotal = volume * harga;
            
            if (!kategoriBiaya[kategori]) {
                kategoriBiaya[kategori] = 0;
            }
            kategoriBiaya[kategori] += subtotal;
        });
        
        let html = '';
        for (const [kategori, biaya] of Object.entries(kategoriBiaya)) {
            const persentase = (biaya / totalBiayaMaterial * 100).toFixed(1);
            html += `
                <div class="flex justify-between">
                    <span>${kategori}:</span>
                    <span class="font-medium">${formatRupiah(biaya)} (${persentase}%)</span>
                </div>
            `;
        }
        
        return html;
    }

    function getRencanaPembayaranHTML(results) {
        const persentasePerTermin = 100 / results.jumlahTermin;
        let html = '<div class="space-y-2">';
        
        for (let i = 1; i <= results.jumlahTermin; i++) {
            let persentasePembayaran = persentasePerTermin;
            let nominalPembayaran = results.totalNilaiProyekKlien * persentasePembayaran / 100;
            let nominalRetensi = 0;
            
            // Untuk termin terakhir, hitung retensi
            if (i === results.jumlahTermin) {
                // Jika persentase pembayaran kurang dari 2.5%, bagi rata
                if (persentasePembayaran < 2.5) {
                    persentasePembayaran = persentasePembayaran / 2;
                    nominalRetensi = results.totalNilaiProyekKlien * persentasePembayaran / 100;
                    nominalPembayaran = results.totalNilaiProyekKlien * persentasePembayaran / 100;
                } else {
                    // Jika tidak, retensi tetap 5%
                    nominalRetensi = results.totalNilaiProyekKlien * 0.05;
                    nominalPembayaran = nominalPembayaran - nominalRetensi;
                }
            }
            
            html += `
                <div class="flex justify-between">
                    <span>Termin ${i}:</span>
                    <span class="font-medium">${formatRupiah(nominalPembayaran)} (${(nominalPembayaran / results.totalNilaiProyekKlien * 100).toFixed(1)}%)</span>
                </div>
            `;
            
            if (i === results.jumlahTermin && nominalRetensi > 0) {
                html += `
                    <div class="text-sm text-yellow-600 ml-4">
                        <em>• Termasuk retensi 5% (${formatRupiah(nominalRetensi)}) yang dibayar setelah masa garansi</em>
                    </div>
                `;
            }
        }
        
        // Tambahkan retensi sebagai item terpisah
        const nominalRetensiTotal = results.totalNilaiProyekKlien * 0.05;
        html += `
            <div class="flex justify-between pt-2 border-t border-gray-200 mt-2">
                <span class="font-semibold">Retensi:</span>
                <span class="font-medium">${formatRupiah(nominalRetensiTotal)} (5%)</span>
            </div>
            <div class="text-sm text-gray-500 ml-4 mt-1">
                <em>Dibayar setelah 3-6 bulan konstruksi tidak ada masalah dalam bangunan</em>
            </div>
        `;
        
        html += '</div>';
        return html;
    }

    function getMingguColor(minggu, totalMinggu) {
        const persentase = minggu / totalMinggu;
        if (persentase < 0.25) return 'border-blue-500';
        if (persentase < 0.5) return 'border-green-500';
        if (persentase < 0.75) return 'border-yellow-500';
        return 'border-red-500';
    }

    function getFaseBadgeClass(fase) {
        switch(fase) {
            case 'Persiapan': return 'bg-blue-100 text-blue-800';
            case 'Struktur': return 'bg-green-100 text-green-800';
            case 'Dinding & Atap': return 'bg-yellow-100 text-yellow-800';
            case 'Finishing': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const calculateProject = () => {
        if (!projectData.harga_per_meter) return;
        
        // Tentukan input mana yang digunakan berdasarkan tab aktif
        const activeTab = document.querySelector('.tab.active-tab').id;
        const isKlienTab = activeTab === 'tab-klien';
        
        // 1. KUMPULKAN INPUT
        const luas_bangunan = parseFloat(inputLuasBangunan.value) || 0;
        const hargaKey = isKlienTab ? selectHargaKlien.value : selectHarga.value;
        const jumlahTermin = isKlienTab ? parseInt(inputTerminKlien.value) || 1 : parseInt(inputTermin.value) || 1;
        
        // 2. PANGGIL SPESIALIS UNTUK MENGHITUNG SETIAP BAGIAN
        const durations = calculateDurations(luas_bangunan, projectData, hargaKey);
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
            profitMargin,
            hargaKey // Tambahkan hargaKey untuk digunakan di render
        };
        
        // 5. RENDER SEMUA HASIL KE TAMPILAN
        renderOutputs(results);
    };

    const init = async () => {
        try {
            const response = await fetch('proyek.json');
            projectData = await response.json();
            
            // Setup Tabs utama
            const tabs = document.querySelectorAll('.tab');
            const views = document.querySelectorAll('.view-content');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.replace('active-tab', 'inactive-tab'));
                    tab.classList.replace('inactive-tab', 'active-tab');
                    const targetView = document.getElementById(tab.id.replace('tab-', 'view-'));
                    views.forEach(view => view.style.display = 'none');
                    targetView.style.display = tab.id === 'tab-asumsi' ? 'block' : 'grid';
                    
                    // Trigger recalculate saat tab berubah
                    if (projectData && projectData.harga_per_meter) {
                        calculateProject();
                    }
                });
            });
            
            // Setup Sub-tabs
            setupSubTabs();
            
            // Populate select harga untuk kontraktor dan klien
            for (const key in projectData.harga_per_meter) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = projectData.harga_per_meter[key].label;
                selectHarga.appendChild(option);
                
                // Duplikat untuk klien
                const optionKlien = document.createElement('option');
                optionKlien.value = key;
                optionKlien.textContent = projectData.harga_per_meter[key].label;
                selectHargaKlien.appendChild(optionKlien);
            }
            
            // Render input asumsi untuk pertama kali
            renderAssumptionInputs(); 
            
            // Tambah event listener untuk input utama
            inputLuasBangunan.addEventListener('input', calculateProject);
            selectHarga.addEventListener('change', calculateProject);
            inputTermin.addEventListener('input', calculateProject);
            
            // Tambah event listener untuk input klien
            selectHargaKlien.addEventListener('change', calculateProject);
            inputTerminKlien.addEventListener('input', function() {
                // Batasi maksimal 20 termin
                if (this.value > 20) {
                    this.value = 20;
                }
                calculateProject();
            });
            
            // Jalankan kalkulasi pertama kali
            calculateProject();
            
            // Pastikan sub-tab aktif ter-render dengan benar setelah halaman dimuat
            setTimeout(() => {
                // Untuk tab kontraktor
                const activeSubtabKontraktor = document.querySelector('.subtab-kontraktor.active-tab');
                if (activeSubtabKontraktor) {
                    activeSubtabKontraktor.click();
                }
                
                // Untuk tab klien
                const activeSubtabKlien = document.querySelector('.subtab-klien.active-tab');
                if (activeSubtabKlien) {
                    activeSubtabKlien.click();
                }
            }, 100);
            
        } catch (error) {
            console.error('Gagal memuat data proyek:', error);
            alert('Gagal memuat data proyek. Pastikan file proyek.json ada dan formatnya benar.');
        }
    };

    init();
});