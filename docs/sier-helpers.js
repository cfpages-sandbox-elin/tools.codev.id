// File: sier-helpers.js bikin kartu assumption
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
    },

    getValueByPath(obj, path) {
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
    },

    setValueByPath(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
        target[lastKey] = value;
    },

    calculateTotal(dataObject) {
        if (typeof dataObject !== 'object' || dataObject === null) return 0;
        return Object.values(dataObject).reduce((sum, value) => {
            if (typeof value === 'number') return sum + value;
            if (typeof value === 'object' && value !== null) {
                if (value.count && value.salary) return sum + (value.count * value.salary);
                if (value.quantity && value.unit_cost) return sum + (value.quantity * value.unit_cost);
                if (value.area_m2 && value.cost_per_m2) return sum + (value.area_m2 * value.cost_per_m2);
                if (value.toilet_unit && value.area_m2_per_toilet && value.cost_per_m2) return sum + (value.toilet_unit * value.area_m2_per_toilet * value.cost_per_m2);
                if (value.lump_sum) return sum + value.lump_sum;
                return sum + this.calculateTotal(value);
            }
            return sum;
        }, 0);
    }
};

// Lampirkan ke window object agar bisa diakses file lain
window.sierHelpers = sierHelpers;