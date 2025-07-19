// File: sier-translate.js
// Berisi kamus dan logika untuk menerjemahkan kunci variabel internal
// menjadi label yang mudah dibaca oleh pengguna.

const sierTranslate = {
    // Kamus utama untuk terjemahan
    keyTranslations: {
        'tax_rate_profit': 'Tarif Pajak Penghasilan',
        'discount_rate_wacc': 'Tingkat Diskonto (WACC)',
        'contingency_rate': 'Dana Darurat (Kontingensi)',
        'workdays_in_month': 'Hari Kerja / Bulan',
        'weekend_days_in_month': 'Hari Libur / Bulan',
        'operational_hours_per_day': 'Jam Operasional / Hari',
        'cogs_rate_fnb': 'HPP (COGS) F&B',
        // CapEx
        'reclamation': 'Reklamasi',
        'piling': 'Pondasi Pancang',
        'building': 'Konstruksi Bangunan',
        'equipment': 'Peralatan & Teknologi',
        'other_costs': 'Biaya Lain-lain',
        'area_m2': 'Area',
        'lake_depth_m': 'Asumsi Kedalaman Danau',
        'cost_per_m3': 'Harga Material Uruk/m³',
        'sheet_pile_perimeter_m': 'Perimeter Sheet Pile',
        'cost_per_m_sheet_pile': 'Harga Sheet Pile/m',
        'points_count': 'Jumlah Titik Pancang',
        'length_per_point_m': 'Panjang/Titik',
        'cost_per_m_mini_pile': 'Harga Mini Pile/m',
        'lump_sum_pile_cap': 'Pile Cap & Tie Beam (Lump Sum)',
        'dr_bays_area_m2': 'Area Bay Driving Range',
        'dr_bays_cost_per_m2': 'Harga Konstruksi Bay/m²',
        'cafe_area_m2': 'Area Kafe',
        'cafe_cost_per_m2': 'Harga Konstruksi Kafe/m²',
        'ball_tracker_bays_count': 'Jumlah Bay Ball-Tracker',
        'ball_tracker_cost_per_bay': 'Harga Sistem/Bay',
        'ball_dispenser_system_lump_sum': 'Sistem Dispenser Bola',
        'bay_equipment_sets_count': 'Jumlah Set Peralatan Bay',
        'bay_equipment_cost_per_set': 'Harga/Set',
        'floating_balls_count': 'Jumlah Bola Apung',
        'floating_balls_cost_per_ball': 'Harga/Bola',
        'ball_management_system_lump_sum': 'Sistem Manajemen Bola',
        'safety_net_area_m2': 'Area Jaring Pengaman',
        'safety_net_cost_per_m2': 'Harga Jaring/m²',
        'mep_rate_of_building_cost': 'Rate MEP dari Biaya Bangunan',
        'permit_design_rate_of_physical_cost': 'Rate Izin & Desain dari Biaya Fisik',
        // Opex
        'salaries_wages': 'Gaji & Upah',
        'manager': 'Manajer',
        'supervisor': 'Supervisor',
        'admin_cashier': 'Admin & Kasir',
        'coach_trainer': 'Pelatih / Instruktur',
        'cleaning_security': 'Kebersihan & Keamanan',
        'utilities': 'Utilitas',
        'electricity_kwh_price': 'Harga Listrik / kWh',
        'electricity_kwh_usage': 'Penggunaan Listrik / Bulan (kWh)',
        'water_etc': 'Air & Lainnya',
        'marketing_promotion': 'Pemasaran & Promosi',
        'maintenance_repair': 'Perawatan & Perbaikan',
        'rent_land': 'Sewa Lahan',
        'other_operational': 'Biaya Operasional Lainnya',
        // Revenue
        'main_revenue': 'Pendapatan Utama (Sewa)',
        'bays': 'Jumlah Bay',
        'price_per_100_balls': 'Harga / 100 Bola',
        'occupancy_rate_per_day': 'Okupansi per Bay / Hari',
        'courts': 'Jumlah Lapangan',
        'price_per_hour': 'Harga Sewa / Jam',
        'occupancy_rate': 'Tingkat Okupansi',
        'ancillary_revenue': 'Pendapatan Tambahan',
        'fnb_avg_spend': 'Belanja F&B Rata-rata',
        'pro_shop_sales': 'Penjualan Pro Shop (Estimasi)',
        // Common
        'weekday': 'Hari Kerja',
        'weekend': 'Akhir Pekan',
        'weekday_offpeak': 'Hr Kerja (Sepi)',
        'weekday_peak': 'Hr Kerja (Sibuk)',
        'offpeak': 'Jam Sepi',
        'peak': 'Jam Sibuk',
        'count': 'Jumlah',
        'salary': 'Gaji',
    },

    /**
     * Menerjemahkan kunci teknis menjadi label yang mudah dibaca.
     * @param {string} key - Kunci yang akan diterjemahkan (mis. 'tax_rate_profit').
     * @returns {string} - Label yang sudah diterjemahkan (mis. 'Tarif Pajak Penghasilan').
     */
    translate(key) {
        if (this.keyTranslations[key]) {
            return this.keyTranslations[key];
        }
        // Fallback: jika tidak ditemukan, format kunci secara otomatis.
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
};

// Lampirkan ke window object agar bisa diakses file lain
window.sierTranslate = sierTranslate;