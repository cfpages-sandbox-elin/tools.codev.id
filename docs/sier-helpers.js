// File: sier-helpers.js
// Berisi fungsi-fungsi utilitas umum (helpers) yang digunakan di seluruh proyek.

const sierHelpers = {
    /**
     * Memformat angka menjadi format ribuan dengan titik.
     * @param {number} num - Angka yang akan diformat.
     * @returns {string} - Angka dalam format string (mis. 1.234.567).
     */
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return num.toString().replace(/\b(\d+)(\.\d+)?\b/g, (match, p1, p2) => {
            return p1.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + (p2 || '');
        });
    },

    /**
     * Mengonversi angka besar menjadi format Miliar.
     * @param {number} num - Angka yang akan dikonversi.
     * @returns {string} - Angka dalam format string Miliar (mis. '1.23 M').
     */
    toBillion(num) {
        if (isNaN(num)) return '0 M';
        return (num / 1000000000).toFixed(2) + ' M';
    },

    /**
     * Menjalankan fungsi rendering dengan penanganan error.
     * @param {function} fn - Fungsi render yang akan dijalankan.
     */
    tryToRender(fn) {
        try {
            if (typeof fn === 'function') fn();
        } catch (error) {
            console.error(`Error saat merender bagian '${fn.name || 'anonymous'}':`, error);
        }
    }
};

// Lampirkan ke window object agar bisa diakses file lain
window.sierHelpers = sierHelpers;