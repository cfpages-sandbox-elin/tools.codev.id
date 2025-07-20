// File: sier-editable.js
// Bertanggung jawab untuk membuat elemen HTML yang bisa diedit.

const sierEditable = {
    /**
     * Membuat elemen HTML untuk angka yang dapat diedit.
     * @param {number} value - Nilai angka yang akan ditampilkan.
     * @param {string} path - Path ke nilai ini di dalam objek projectConfig (mis. 'assumptions.tax_rate_profit').
     * @param {object} options - Opsi tambahan seperti format. { format: 'percent' | 'currency' }
     * @returns {string} - String HTML lengkap untuk elemen yang dapat diedit.
     */
    createEditableNumber(value, path, options = {}) {
        if (value === undefined || path === undefined) {
            return '<span class="text-red-500">Error: Data tidak valid</span>';
        }

        let displayValue;
        switch (options.format) {
            case 'percent':
                displayValue = `${(value * 100).toFixed(1)}%`;
                break;
            case 'currency':
                displayValue = `Rp ${sierHelpers.formatNumber(value)}`;
                break;
            default:
                displayValue = sierHelpers.formatNumber(value);
                break;
        }

        // Struktur HTML terpusat untuk semua angka yang bisa diedit
        return `
            <div class="relative inline-flex items-center gap-x-2 group">
                <a href="#" class="edit-icon text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"/></svg>
                </a>
                <span class="value-display font-semibold text-gray-800">${displayValue}</span>
                <input type="number" step="any" value="${value}" data-path="${path}" class="value-input absolute top-1/2 -translate-y-1/2 left-0 w-full p-1 border rounded shadow-lg hidden">
           </div>
        `;
    }
};

window.sierEditable = sierEditable;