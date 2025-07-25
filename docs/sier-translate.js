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
        'capex': 'Biaya Investasi (CapEx)',
        'opexMonthly': 'Biaya Operasional Bulanan',
        'civil_construction': 'Konstruksi Sipil & Pondasi',
        'interior': 'Interior & Finishing',
        'other': 'Lain-lain (Izin, Desain, dll)',
        'depreciation_years': 'Masa Penyusutan Aset (Tahun)',
        'scenario_modifiers': 'Pengubah Skenario',
        'pessimistic_revenue': 'Pendapatan Pesimis',
        'optimistic_revenue': 'Pendapatan Optimis',
        'pessimistic_opex': 'Biaya Operasional Pesimis',
        'optimistic_opex': 'Biaya Operasional Optimis',
        'avg_session_duration_minutes': 'Durasi Sesi Rata-rata (menit)',
        'variable_costs_per_session': 'Biaya Variabel per Sesi',
        'electricity_dispenser_kwh': 'Konsumsi Listrik Dispenser (kWh)',
        'ball_wear_cost_per_100_hits': 'Biaya Keausan Bola (per 100 bola)',
        'cleaning_supplies': 'Perlengkapan Kebersihan',
        'downtime_per_hour_minutes': 'Waktu Henti per Jam (menit)',
        'variable_costs_per_hour': 'Biaya Variabel per Jam',
        'court_lights_kw': 'Konsumsi Listrik Lampu Lapangan (kW)',
        'ball_replacement_cost_per_hour': 'Biaya Penggantian Bola per Jam',
        'safety_net': 'Jaring Pengaman',
        'total_perimeter_m': 'Total Keliling Jaring (m)',
        'field_length_m': 'Panjang Lapangan (m)',
        'field_width_m': 'Lebar Lapangan (m)',
        'netting': 'Material Jaring',
        'poles': 'Tiang Penyangga',
        'spacing_m': 'Jarak Antar Tiang (m)',
        'height_distribution': 'Distribusi Ketinggian Tiang',
        'far_side_m': 'Sisi Jauh (m)',
        'left_right_side_m': 'Sisi Kiri & Kanan (m)',
        'foundation_cost_per_pole': 'Biaya Pondasi per Tiang',
        'mep_systems': 'Sistem Mekanikal, Elektrikal, Plumbing (MEP)',
        'hvac_system': 'Sistem HVAC (AC)',
        'electrical_system': 'Sistem Elektrikal',
        'plumbing_system': 'Sistem Plumbing',
        'cost_per_m2_hvac': 'Biaya HVAC per m²',
        'rate_of_physical_cost': 'Rate dari Biaya Fisik',
        'lump_sum_cost': 'Biaya Lump Sum',
        'premium_bays': 'Bay Premium',
        'percentage_of_total': 'Persentase dari Total',
        'cost_per_bay_ball_tracker': 'Biaya Ball Tracker per Bay',
        'cost_per_bay_dispenser': 'Biaya Dispenser Otomatis per Bay',
        'normal_bays': 'Bay Normal',
        'bay_equipment_cost_per_set': 'Biaya Peralatan per Set',
        'hours_distribution_per_day': 'Distribusi Jam per Hari',
        'pre_operational': 'Biaya Pra-Operasional',
        'sport_courts': 'Konstruksi Lapangan Olahraga',
        'land_preparation': 'Persiapan Lahan',
        'foundation_works': 'Pekerjaan Pondasi',
        'main_structure': 'Struktur Utama Bangunan',
        'finishing_lounge_etc': 'Finishing, Lounge, dll'
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