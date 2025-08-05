// File: sier-visual-impact.js
// BARU: Bertanggung jawab untuk merender bagian Analisis Dampak Ekonomi & Sosial.

const sierVisualImpact = {
    _renderImpactTable(model) {
        const tableBody = document.getElementById('economicImpactTableBody');
        if (!tableBody) return;

        // Ambil data dari kalkulasi finansial
        const { combined } = model;

        const totalCapex = combined.capexSchedule[0];
        const totalAnnualOpex = combined.opex[1];
        const totalAnnualTax = combined.incomeStatement.tax[1];

        const drStaff = Object.values(projectConfig.drivingRange.opexMonthly.salaries_wages).reduce((sum, role) => sum + role.count, 0);
        const padelStaff = Object.values(projectConfig.padel.scenarios.four_courts_combined.opexMonthly.salaries_wages).reduce((sum, role) => sum + role.count, 0);
        const meetingPointStaff = Object.values(projectConfig.meetingPoint.opexMonthly.salaries_wages).reduce((sum, role) => sum + role.count, 0);
        const totalStaff = drStaff + padelStaff + meetingPointStaff;

        const formatRp = (num) => `~Rp ${sierHelpers.toBillion(num)}`;

        const impactData = [
            { category: 'direct', item: 'Penciptaan Lapangan Kerja Langsung', desc: 'Pembukaan lowongan kerja untuk posisi manajerial, operasional, pelatih, hingga staf pendukung.', contribution: `~${totalStaff} orang` },
            { category: 'direct', item: 'Belanja Modal (CapEx)', desc: 'Menstimulasi sektor konstruksi, pemasok material bangunan, dan penyedia teknologi selama masa pembangunan.', contribution: formatRp(totalCapex) },
            { category: 'direct', item: 'Belanja Operasional (OpEx)', desc: 'Menciptakan permintaan berkelanjutan untuk pemasok F&B, jasa kebersihan, keamanan, dan pemeliharaan.', contribution: `${formatRp(totalAnnualOpex)} / tahun` },
            { category: 'direct', item: 'Kontribusi Pajak', desc: 'Menyumbang pendapatan negara melalui Pajak Penghasilan Badan dan pajak-pajak lainnya.', contribution: `${formatRp(totalAnnualTax)} / tahun` },
            { category: 'indirect', item: 'Multiplier Effect pada Pemasok', desc: 'Meningkatkan pendapatan bagi pemasok lokal (sayur, daging, minuman) dan penyedia jasa (laundry, teknisi).', contribution: 'Mendorong pertumbuhan UKM sekitar.' },
            { category: 'indirect', item: 'Peningkatan Okupansi & Belanja', desc: 'Potensi menarik pengunjung dari luar kota untuk event/turnamen, yang akan berbelanja di hotel dan restoran sekitar.', contribution: 'Mendukung sektor pariwisata & horeka.' },
            { category: 'indirect', item: 'Peningkatan Nilai Properti', desc: 'Kehadiran fasilitas rekreasi premium dapat meningkatkan daya tarik dan nilai properti di kawasan sekitarnya.', contribution: 'Meningkatkan aset kawasan.' },
            { category: 'social', item: 'Penyediaan Ruang Publik (Third Place)', desc: 'Menjadi pusat interaksi sosial dan pembentukan komunitas yang sehat bagi pekerja kawasan dan masyarakat umum.', contribution: 'Meningkatkan kualitas hidup.' },
            { category: 'social', item: 'Promosi Gaya Hidup Sehat', desc: 'Mendorong masyarakat untuk aktif berolahraga, baik golf maupun padel, yang sedang menjadi tren positif.', contribution: 'Meningkatkan kesehatan masyarakat.' },
            { category: 'social', item: 'Peningkatan Citra Kawasan SIER', desc: 'Mengubah persepsi SIER dari sekadar kawasan industri menjadi kawasan yang terintegrasi, modern, dan nyaman untuk bekerja & rekreasi.', contribution: 'Meningkatkan daya saing kawasan.' }
        ];

        let html = '';
        html += '<tr class="bg-gray-100"><td colspan="3" class="px-4 py-3 font-bold text-gray-700">I. Dampak Ekonomi Langsung (Direct Impact)</td></tr>';
        impactData.filter(d => d.category === 'direct').forEach(d => {
            html += `<tr class="bg-white border-b"><td class="px-4 py-4 font-semibold">${d.item}</td><td class="px-4 py-4 text-sm text-gray-600">${d.desc}</td><td class="px-4 py-4 font-bold text-green-700">${d.contribution}</td></tr>`;
        });
        html += '<tr class="bg-gray-100"><td colspan="3" class="px-4 py-3 font-bold text-gray-700">II. Dampak Ekonomi Tidak Langsung (Indirect Impact)</td></tr>';
        impactData.filter(d => d.category === 'indirect').forEach(d => {
            html += `<tr class="bg-white border-b"><td class="px-4 py-4 font-semibold">${d.item}</td><td class="px-4 py-4 text-sm text-gray-600">${d.desc}</td><td class="px-4 py-4 text-gray-700">${d.contribution}</td></tr>`;
        });
        html += '<tr class="bg-gray-100"><td colspan="3" class="px-4 py-3 font-bold text-gray-700">III. Dampak Sosial (Social Impact)</td></tr>';
        impactData.filter(d => d.category === 'social').forEach(d => {
            html += `<tr class="bg-white border-b"><td class="px-4 py-4 font-semibold">${d.item}</td><td class="px-4 py-4 text-sm text-gray-600">${d.desc}</td><td class="px-4 py-4 text-gray-700">${d.contribution}</td></tr>`;
        });

        tableBody.innerHTML = html;
    },

    _renderMultiplierDiagram() {
        const container = document.getElementById('multiplierEffectDiagram');
        if (!container) return;

        // Desain SVG menggunakan template literal untuk kemudahan
        container.innerHTML = `
            <svg width="100%" height="300" viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#9CA3AF" />
                    </marker>
                </defs>
                
                <!-- Center Box -->
                <rect x="225" y="125" width="150" height="50" rx="10" fill="#10B981" />
                <text x="300" y="155" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">Proyek SIER</text>

                <!-- Top Boxes -->
                <rect x="50" y="20" width="120" height="40" rx="5" fill="#F3F4F6" stroke="#E5E7EB" />
                <text x="110" y="45" font-family="Inter, sans-serif" font-size="12" fill="#374151" text-anchor="middle">Gaji Karyawan</text>
                <line x1="260" y1="125" x2="150" y2="60" stroke="#D1D5DB" stroke-width="2" marker-end="url(#arrow)" />

                <rect x="240" y="20" width="120" height="40" rx="5" fill="#F3F4F6" stroke="#E5E7EB" />
                <text x="300" y="45" font-family="Inter, sans-serif" font-size="12" fill="#374151" text-anchor="middle">Pembelian Pemasok</text>
                <line x1="300" y1="125" x2="300" y2="60" stroke="#D1D5DB" stroke-width="2" marker-end="url(#arrow)" />

                <rect x="430" y="20" width="120" height="40" rx="5" fill="#F3F4F6" stroke="#E5E7EB" />
                <text x="490" y="45" font-family="Inter, sans-serif" font-size="12" fill="#374151" text-anchor="middle">Pembayaran Pajak</text>
                <line x1="340" y1="125" x2="450" y2="60" stroke="#D1D5DB" stroke-width="2" marker-end="url(#arrow)" />

                <!-- Bottom Boxes -->
                <rect x="50" y="240" width="120" height="40" rx="5" fill="#FEF2F2" stroke="#FEE2E2" />
                <text x="110" y="265" font-family="Inter, sans-serif" font-size="12" fill="#991B1B" text-anchor="middle">Belanja di Warung</text>
                <line x1="110" y1="60" x2="110" y2="240" stroke="#D1D5DB" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#arrow)" />
                
                <rect x="240" y="240" width="120" height="40" rx="5" fill="#FEFBF2" stroke="#FEF9C3" />
                <text x="300" y="265" font-family="Inter, sans-serif" font-size="12" fill="#713F12" text-anchor="middle">Memicu Industri Lain</text>
                <line x1="300" y1="60" x2="300" y2="240" stroke="#D1D5DB" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#arrow)" />

                <rect x="430" y="240" width="120" height="40" rx="5" fill="#EFF6FF" stroke="#DBEAFE" />
                <text x="490" y="265" font-family="Inter, sans-serif" font-size="12" fill="#1E40AF" text-anchor="middle">Pendapatan Daerah</text>
                <line x1="490" y1="60" x2="490" y2="240" stroke="#D1D5DB" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#arrow)" />
            </svg>
        `;
    },

    render(model) {
        this._renderImpactTable(model);
        this._renderMultiplierDiagram();
        console.log("[sier-visual-impact] Analisis Dampak Ekonomi & Sosial: Berhasil dirender.");
    }
};

window.sierVisualImpact = sierVisualImpact;