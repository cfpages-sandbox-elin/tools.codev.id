// File: sier-helpers.js fix translate lagi
const sierHelpers = {
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return num.toString().replace(/\b(\d+)(\.\d+)?\b/g, (match, p1, p2) => {
            return p1.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + (p2 || '');
        });
    },

    formatPercent(num, decimals = 1) {
        if (num === null || num === undefined || isNaN(num)) return '0.0%';
        return (num * 100).toFixed(decimals) + '%';
    },

    toBillion(num) {
        if (isNaN(num)) return '0 M';
        return (num / 1000000000).toFixed(2) + ' M';
    },

    safeTranslate(key) {
        if (typeof sierTranslate !== 'undefined' && sierTranslate.translate) {
            return sierTranslate.translate(key);
        }
        // Fallback jika sierTranslate gagal dimuat
        return (key || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },

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