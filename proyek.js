document.addEventListener('DOMContentLoaded', () => {
    // Definisi elemen UI
    const inputLuasBangunan = document.getElementById('input-luas-bangunan');
    const selectHarga = document.getElementById('select-harga');
    const inputTermin = document.getElementById('input-termin');
    const outputRingkasan = document.getElementById('output-ringkasan');
    const outputRabTable = document.getElementById('output-rab-table');
    const outputTimeline = document.getElementById('output-timeline');

    let projectData = {};

    // Fungsi untuk memformat angka menjadi Rupiah
    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

    // Fungsi utama untuk kalkulasi
    const calculateProject = () => {
        if (!projectData.harga_per_meter) return; // Pastikan data sudah ter-load

        const luas_bangunan = parseFloat(inputLuasBangunan.value) || 0;
        const hargaKey = selectHarga.value;
        const jumlahTermin = parseInt(inputTermin.value) || 1;
        const hargaData = projectData.harga_per_meter[hargaKey];

        // 1. Kalkulasi Ringkasan Proyek
        const totalNilaiProyek = luas_bangunan * hargaData.nilai;
        const komposisiTukang = {};
        for (const [posisi, rumus] of Object.entries(projectData.rumus_komposisi_tukang)) {
            komposisiTukang[posisi] = eval(rumus);
        }

        outputRingkasan.innerHTML = `
            <div class="flex justify-between"><span class="font-medium">Nilai Proyek:</span> <span class="font-bold text-lg">${formatRupiah(totalNilaiProyek)}</span></div>
            <div class="flex justify-between"><span class="font-medium">Mandor:</span> <span>${komposisiTukang.mandor} orang</span></div>
            <div class="flex justify-between"><span class="font-medium">Tukang Ahli:</span> <span>${komposisiTukang.tukang_ahli} orang</span></div>
            <div class="flex justify-between"><span class="font-medium">Kenek/Laden:</span> <span>${komposisiTukang.kenek_laden} orang</span></div>
        `;

        // 2. Kalkulasi RAB Material
        const spesifikasi = projectData.spesifikasi_teknis[hargaKey];
        let totalBiayaMaterial = 0;
        outputRabTable.innerHTML = '';
        spesifikasi.forEach(item => {
            const volume = eval(item.rumus_kebutuhan);
            const subtotal = volume * item.harga_satuan;
            totalBiayaMaterial += subtotal;
            outputRabTable.innerHTML += `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.nama}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${volume.toFixed(2)} ${item.satuan}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatRupiah(item.harga_satuan)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatRupiah(subtotal)}</td>
                </tr>
            `;
        });
        
        // 3. Generate Timeline & Termin
        outputTimeline.innerHTML = '';
        const milestones = projectData.timeline_milestones;
        const progressPerTermin = 95 / jumlahTermin;

        let currentTermin = 1;
        let terminHTML = `<div class="border-l-2 border-indigo-500 pl-4">
                            <h3 class="font-semibold text-lg">Termin ${currentTermin} (DP - Progress 0% s/d ${progressPerTermin.toFixed(0)}%)</h3>
                            <ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">`;
        
        milestones.forEach(milestone => {
            const terminBatasAtas = currentTermin * progressPerTermin;
            if (milestone.persentase > terminBatasAtas && currentTermin < jumlahTermin) {
                terminHTML += `</ul></div>`; // Tutup termin sebelumnya
                currentTermin++;
                const batasBawah = ((currentTermin - 1) * progressPerTermin).toFixed(0);
                const batasAtas = (currentTermin * progressPerTermin).toFixed(0);
                terminHTML += `<div class="border-l-2 border-indigo-500 pl-4 mt-4">
                                <h3 class="font-semibold text-lg">Termin ${currentTermin} (Progress ${batasBawah}% s/d ${batasAtas}%)</h3>
                                <ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">`;
            }
            terminHTML += `<li><strong>${milestone.persentase}%:</strong> ${milestone.narasi_klien}</li>`;
        });

        terminHTML += `</ul></div>`; // Tutup termin terakhir
        // Tambahkan Retensi
        terminHTML += `<div class="border-l-2 border-green-500 pl-4 mt-4">
                        <h3 class="font-semibold text-lg">Termin Pelunasan & Retensi (5%)</h3>
                        <ul class="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">
                            <li><strong>100%:</strong> Pembayaran akhir setelah masa pemeliharaan (retensi) selama 3-6 bulan selesai.</li>
                        </ul>
                       </div>`;

        outputTimeline.innerHTML = terminHTML;
    };

    // Fungsi Inisialisasi
    const init = async () => {
        try {
            const response = await fetch('proyek.json');
            projectData = await response.json();

            // Populate select harga
            for (const key in projectData.harga_per_meter) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = projectData.harga_per_meter[key].label;
                selectHarga.appendChild(option);
            }

            // Tambah event listener
            inputLuasBangunan.addEventListener('input', calculateProject);
            selectHarga.addEventListener('change', calculateProject);
            inputTermin.addEventListener('input', calculateProject);

            // Kalkulasi pertama kali
            calculateProject();
        } catch (error) {
            console.error('Gagal memuat data proyek:', error);
            alert('Gagal memuat data proyek. Pastikan file proyek.json ada dan formatnya benar.');
        }
    };

    init();
});