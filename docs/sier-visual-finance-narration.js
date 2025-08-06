// File: sier-visual-finance-narration.js (File Baru)
const sierVisualFinanceNarration = {
    
    getDrCapexNarration: () => `
        <p class="text-gray-600 mb-4 text-sm">
            Tabel ini merinci total biaya investasi untuk Driving Range, memecah setiap komponen biaya dari asumsi dasar hingga total akhir untuk transparansi penuh. 
            Setiap kategori memiliki subtotal untuk memudahkan verifikasi. Biaya terbesar berasal dari **Konstruksi Bangunan Bay** dan **Peralatan & Teknologi Inti** 
            seperti sistem Ball Tracker.
        </p>
    `,

    getPadelCapexNarration: (scenarioTitle) => `
        <p class="text-gray-600 mb-4 text-sm">
            Berikut adalah rincian biaya investasi untuk skenario Padel yang dipilih: **${scenarioTitle}**. 
            Perhitungan mencakup biaya pra-operasional, pekerjaan konstruksi (baik renovasi maupun bangun baru), serta pengadaan semua peralatan lapangan dan inventaris awal.
        </p>
    `,

    getOpexNarration: () => `
        <p class="text-gray-600 mb-6">
            Tabel ini merinci estimasi biaya operasional bulanan yang dibutuhkan untuk menjalankan setiap unit bisnis. Komponen biaya terbesar secara konsisten adalah **Gaji & Upah (SDM)**, 
            diikuti oleh **Utilitas** dan **Pemasaran**. Angka-angka ini menjadi dasar untuk perhitungan Break-Even Point (BEP) dan proyeksi profitabilitas.
        </p>
    `,

    getFinancialSummaryNarration: () => `
        <p class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm mb-8">
            <strong>Disclaimer:</strong> Analisis ini adalah model proyeksi berdasarkan serangkaian asumsi yang wajar. Angka aktual dapat bervariasi 
            tergantung pada kondisi pasar, efisiensi operasional, dan strategi final yang diimplementasikan. Tujuannya adalah untuk memberikan 
            gambaran kelayakan dan skala finansial proyek.
        </p>
    `,
};

window.sierVisualFinanceNarration = sierVisualFinanceNarration;