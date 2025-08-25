// proyek.js v0.1
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

    const calculateProject = () => {
        if (!projectData.harga_per_meter) return;

        const luas_bangunan = parseFloat(inputLuasBangunan.value) || 0;
        const hargaKey = selectHarga.value;
        const jumlahTermin = parseInt(inputTermin.value) || 1;
        const hargaData = projectData.harga_per_meter[hargaKey];

        const durasiBulan = eval(projectData.rumus_durasi_proyek_bulan);
        const komposisiTukang = {};
        for (const [posisi, rumus] of Object.entries(projectData.rumus_komposisi_tukang)) {
            komposisiTukang[posisi] = eval(rumus);
        }
        const biayaHarianTukang = (komposisiTukang.mandor * projectData.biaya_tukang_harian.mandor) +
                                (komposisiTukang.tukang_ahli * projectData.biaya_tukang_harian.tukang_ahli) +
                                (komposisiTukang.kenek_laden * projectData.biaya_tukang_harian.kenek_laden);
        const totalBiayaTukang = biayaHarianTukang * 25 * durasiBulan;

        const spesifikasi = projectData.spesifikasi_teknis[hargaKey];
        let totalBiayaMaterialKulak = 0;
        let totalBiayaMaterialPasar = 0;
        let rabKontraktorHTML = '';
        let rabKlienHTML = '';

        spesifikasi.forEach(item => {
            const volume = eval(item.rumus_kebutuhan);
            const hargaKulak = item.harga.kulak_rumus ? eval(item.harga.kulak_rumus) : item.harga.kulak;
            const hargaPasar = item.harga.pasar_rumus ? eval(item.harga.pasar_rumus) : item.harga.pasar;
            const subtotalKulak = volume * hargaKulak;
            const subtotalPasar = volume * hargaPasar;
            totalBiayaMaterialKulak += subtotalKulak;
            totalBiayaMaterialPasar += subtotalPasar;

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
        });

        const totalBiayaProyekInternal = totalBiayaMaterialKulak + totalBiayaTukang;
        const totalNilaiProyekKlien = luas_bangunan * hargaData.nilai;
        const profitEstimasi = totalNilaiProyekKlien - totalBiayaProyekInternal;
        const profitMargin = (profitEstimasi / totalNilaiProyekKlien) * 100 || 0;

        outputRingkasanKontraktor.innerHTML = `
            <div class="flex justify-between"><span class="font-medium">Estimasi Durasi:</span> <span class="font-semibold">${durasiBulan} bulan</span></div>
            <div class="flex justify-between"><span class="font-medium">Total Biaya Tukang:</span> <span>${formatRupiah(totalBiayaTukang)}</span></div>
            <div class="flex justify-between"><span class="font-medium">Total Biaya Material (Kulak):</span> <span>${formatRupiah(totalBiayaMaterialKulak)}</span></div>
            <hr class="my-2 border-t border-gray-200">
            <div class="flex justify-between"><span class="font-semibold text-lg text-gray-800">Total HPP Proyek:</span> <span class="font-bold text-lg text-blue-600">${formatRupiah(totalBiayaProyekInternal)}</span></div>
            <div class="flex justify-between"><span class="font-semibold text-lg text-gray-800">Estimasi Profit:</span> <span class="font-bold text-lg text-green-600">${formatRupiah(profitEstimasi)} (${profitMargin.toFixed(1)}%)</span></div>`;

        outputRingkasanKlien.innerHTML = `
            <div class="flex justify-between"><span class="font-medium">Estimasi Durasi:</span> <span class="font-semibold">${durasiBulan} bulan</span></div>
            <div class="flex justify-between"><span class="font-medium">Luas Bangunan:</span> <span>${luas_bangunan} m²</span></div>
            <div class="flex justify-between"><span class="font-medium">Harga per m²:</span> <span>${formatRupiah(hargaData.nilai)}</span></div>
            <hr class="my-2 border-t border-gray-200">
            <div class="flex justify-between"><span class="font-semibold text-lg text-gray-800">Total Nilai Proyek:</span> <span class="font-bold text-lg text-indigo-600">${formatRupiah(totalNilaiProyekKlien)}</span></div>`;

        outputRabTableKontraktor.innerHTML = rabKontraktorHTML + `
            <tr class="bg-gray-50">
                <td colspan="3" class="px-6 py-3 text-right text-sm font-bold text-gray-700">TOTAL BIAYA MATERIAL (KULAK)</td>
                <td class="px-6 py-3 text-left text-sm font-bold text-gray-900">${formatRupiah(totalBiayaMaterialKulak)}</td>
            </tr>`;
        outputRabTableKlien.innerHTML = rabKlienHTML + `
            <tr class="bg-gray-50">
                <td colspan="3" class="px-6 py-3 text-right text-sm font-semibold text-gray-600">ESTIMASI BIAYA MATERIAL (PASAR)</td>
                <td class="px-6 py-3 text-left text-sm font-semibold text-gray-800">${formatRupiah(totalBiayaMaterialPasar)}</td>
            </tr>`;

        const milestones = projectData.timeline_milestones;
        const progressPerTermin = 95 / jumlahTermin;
        let currentTermin = 1;
        let terminHTML_Content = `<div class="border-l-2 border-indigo-500 pl-4">
                            <h3 class="font-semibold text-lg">Termin ${currentTermin} (Uang Muka / DP - Progress 0% s/d ${progressPerTermin.toFixed(0)}%)</h3>
                            <p class="text-sm text-gray-600 mt-1">Pembayaran: <strong>${formatRupiah(totalNilaiProyekKlien / (jumlahTermin + 1))}</strong></p>
                            <ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">`;
        milestones.forEach(milestone => {
            const terminBatasAtas = currentTermin * progressPerTermin;
            if (milestone.persentase > terminBatasAtas && currentTermin < jumlahTermin) {
                terminHTML_Content += `</ul></div>`;
                currentTermin++;
                const batasBawah = ((currentTermin - 1) * progressPerTermin).toFixed(0);
                const batasAtas = (currentTermin * progressPerTermin).toFixed(0);
                terminHTML_Content += `<div class="border-l-2 border-indigo-500 pl-4 mt-6">
                                <h3 class="font-semibold text-lg">Termin ${currentTermin} (Progress >${batasBawah}% s/d ${batasAtas}%)</h3>
                                <p class="text-sm text-gray-600 mt-1">Pembayaran: <strong>${formatRupiah(totalNilaiProyekKlien / (jumlahTermin + 1))}</strong></p>
                                <ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">`;
            }
            terminHTML_Content += `<li><strong>${milestone.persentase}%:</strong> ${milestone.narasi_klien}</li>`;
        });
        terminHTML_Content += `</ul></div>`;
        terminHTML_Content += `<div class="border-l-2 border-green-500 pl-4 mt-6">
                        <h3 class="font-semibold text-lg">Termin Pelunasan (Retensi 5%)</h3>
                        <p class="text-sm text-gray-600 mt-1">Pembayaran: <strong>${formatRupiah(totalNilaiProyekKlien * 0.05)}</strong></p>
                        <ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">
                            <li><strong>100%:</strong> Pembayaran akhir setelah masa pemeliharaan (retensi) selama 3-6 bulan selesai.</li>
                        </ul>
                       </div>`;
        outputTimeline.innerHTML = terminHTML_Content;
    };

    const init = async () => {
        try {
            const response = await fetch('proyek.json');
            projectData = await response.json();
            
            setupTabs();

            for (const key in projectData.harga_per_meter) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = projectData.harga_per_meter[key].label;
                selectHarga.appendChild(option);
            }

            inputLuasBangunan.addEventListener('input', calculateProject);
            selectHarga.addEventListener('change', calculateProject);
            inputTermin.addEventListener('input', calculateProject);

            calculateProject();
        } catch (error) {
            console.error('Gagal memuat data proyek:', error);
            alert('Gagal memuat data proyek. Pastikan file proyek.json ada dan formatnya benar.');
        }
    };

    init();
});