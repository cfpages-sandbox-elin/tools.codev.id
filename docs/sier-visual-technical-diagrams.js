// File: sier-visual-technical-diagrams.js
// Bertanggung jawab untuk membuat visualisasi denah teknis menggunakan SVG.

const sierVisualTechnicalDiagrams = {

    /**
     * Membuat visualisasi denah untuk Driving Range.
     */
    _createDrivingRangeVis() {
        const container = document.getElementById('driving-range-layout-vis');
        if (!container) return;

        const width = 600;
        const height = 400;
        const scale = 1.2; // Skala untuk menyesuaikan ukuran elemen

        // Definisi elemen berdasarkan skala
        const lake = { x: 10, y: 10, width: width - 20, height: height - 20 };
        const bay = { x: 450, y: 100, width: 60, height: 200 };
        const netPolygon = "100,30 50,370 420,380 440,80 100,30";
        const excavatorPath = "80,50 60,350 400,360 410,100";
        const sutZone = { x: 20, y: 100, width: 20, height: 200 };
        const fieldLengthLine = { x1: 150, y1: 200, x2: 440, y2: 200 };

        const svgContent = `
            <svg viewBox="0 0 ${width} ${height}" style="background-color: #e0f2fe;">
                <!-- Danau -->
                <rect x="0" y="0" width="${width}" height="${height}" fill="#7dd3fc" />

                <!-- Elemen Denah -->
                <polygon points="${netPolygon}" fill="none" stroke="#16a34a" stroke-width="3" />
                <rect x="${bay.x}" y="${bay.y}" width="${bay.width}" height="${bay.height}" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
                <rect x="${sutZone.x}" y="${sutZone.y}" width="${sutZone.width}" height="${sutZone.height}" fill="#fecaca" />
                
                <polyline points="${excavatorPath}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,5" />

                <!-- Garis & Label Dimensi -->
                <line x1="${fieldLengthLine.x1}" y1="${fieldLengthLine.y1}" x2="${fieldLengthLine.x2}" y2="${fieldLengthLine.y2}" stroke="#a855f7" stroke-width="2" />
                <text x="${(fieldLengthLine.x1 + fieldLengthLine.x2) / 2}" y="${fieldLengthLine.y1 - 10}" font-family="sans-serif" font-size="12" fill="#a855f7" text-anchor="middle">Panjang Lapangan: 227m</text>

                <!-- Label -->
                <text x="${bay.x + 5}" y="${bay.y + 20}" font-family="sans-serif" font-size="12" fill="#78350f">Bay (12x85m)</text>
                <text x="${sutZone.x - 2}" y="${sutZone.y - 5}" font-family="sans-serif" font-size="12" fill="#b91c1c" transform="rotate(-90, ${sutZone.x}, ${sutZone.y-5})">Zona Aman SUTT</text>
                <text x="160" y="50" font-family="sans-serif" font-size="12" fill="#14532d">Jaring Pengaman</text>
                <text x="100" y="80" font-family="sans-serif" font-size="12" fill="#1d4ed8" font-style="italic">Jalur Excavator</text>
                
                 <!-- Legend -->
                <g transform="translate(${width - 150}, ${height - 70})">
                    <rect x="0" y="0" width="140" height="65" fill="rgba(255,255,255,0.8)" stroke="#9ca3af" rx="5"/>
                    <g transform="translate(10, 15)">
                        <rect x="0" y="0" width="10" height="10" fill="#facc15"/>
                        <text x="15" y="9" font-size="10">Area Bay</text>
                    </g>
                     <g transform="translate(10, 30)">
                        <rect x="0" y="0" width="10" height="10" fill="#16a34a"/>
                        <text x="15" y="9" font-size="10">Jaring (Konflik)</text>
                    </g>
                    <g transform="translate(10, 45)">
                        <rect x="0" y="0" width="10" height="10" fill="#fecaca"/>
                        <text x="15" y="9" font-size="10">Zona SUTT</text>
                    </g>
                </g>
            </svg>
        `;
        container.innerHTML = svgContent;
    },

    /**
     * Membuat visualisasi konversi Futsal ke Padel.
     */
    _createPadelVis() {
        const container = document.getElementById('padel-conversion-vis');
        if (!container) return;

        const width = 600;
        const height = 250;
        const scale = 12;

        // Dimensi dalam pixel
        const buildingW = 15.8 * scale;
        const buildingL = 41 * scale; // Total panjang efektif
        const padelCourtW = 10 * scale;
        const padelCourtL = 20 * scale;
        
        const svgContent = `
            <svg viewBox="0 0 ${width} ${height}">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4b5563" />
                    </marker>
                </defs>

                <!-- Latar Belakang Gedung -->
                <rect x="50" y="50" width="${buildingL}" height="${buildingW}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2" />
                <text x="55" y="40" font-family="sans-serif" font-size="14" fill="#374151">Area Gedung Futsal Eksisting</text>
                
                <!-- Lapangan Padel 1 -->
                <rect x="55" y="65" width="${padelCourtL}" height="${padelCourtW}" fill="#a7f3d0" stroke="#047857" stroke-width="1.5" />
                <text x="100" y="110" font-family="sans-serif" font-size="14" fill="#065f46" font-weight="bold">Padel Court #1</text>
                
                <!-- Lapangan Padel 2 -->
                <rect x="${55 + padelCourtL + 10}" y="65" width="${padelCourtL}" height="${padelCourtW}" fill="#a7f3d0" stroke="#047857" stroke-width="1.5" />
                <text x="315" y="110" font-family="sans-serif" font-size="14" fill="#065f46" font-weight="bold">Padel Court #2</text>

                <!-- Dimensi -->
                <line x1="50" y1="${50 + buildingW + 15}" x2="${50 + buildingL}" y2="${50 + buildingW + 15}" stroke="#4b5563" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
                <text x="${(50 + 50 + buildingL)/2}" y="${50 + buildingW + 30}" font-family="sans-serif" font-size="12" fill="#4b5563" text-anchor="middle">Total Panjang Efektif: ~41m</text>
                
                <line x1="${50 + buildingL + 15}" y1="50" x2="${50 + buildingL + 15}" y2="${50 + buildingW}" stroke="#4b5563" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
                <text x="${50 + buildingL + 20}" y="${50 + (buildingW/2) + 4}" font-family="sans-serif" font-size="12" fill="#4b5563">Lebar: ~15.8m</text>
            </svg>
        `;
        container.innerHTML = svgContent;
    },

    /**
     * Membuat visualisasi konsep untuk Meeting Point.
     */
    _createMeetingPointVis() {
        const container = document.getElementById('meeting-point-concept-vis');
        if (!container) return;

        const width = 600;
        const height = 300;

        const svgContent = `
            <svg viewBox="0 0 ${width} ${height}">
                <!-- Outline Gedung -->
                <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="#f9fafb" stroke="#e5e7eb" stroke-width="2" rx="10" />
                <text x="25" y="35" font-family="sans-serif" font-size="16" fill="#1f2937" font-weight="bold">Konsep "SIER Business Lounge"</text>

                <!-- Zona Kiri: Open Lounge -->
                <rect x="25" y="60" width="300" height="200" fill="#eff6ff" stroke="#93c5fd" stroke-dasharray="4,4" rx="5"/>
                <text x="35" y="80" font-family="sans-serif" font-size="14" fill="#1e40af" font-weight="semibold">1. Open Lounge (Area Kafe)</text>
                <text x="45" y="110" font-family="sans-serif" font-size="24">☕</text>
                <text x="75" y="115" font-family="sans-serif" font-size="12" fill="#374151">Area duduk nyaman</text>
                <text x="45" y="150" font-family="sans-serif" font-size="24">💻</text>
                <text x="75" y="155" font-family="sans-serif" font-size="12" fill="#374151">Meja komunal & Wi-Fi cepat</text>

                <!-- Zona Kanan: Privacy Zone -->
                <rect x="340" y="60" width="230" height="200" fill="#fdf2f8" stroke="#f9a8d4" stroke-dasharray="4,4" rx="5"/>
                <text x="350" y="80" font-family="sans-serif" font-size="14" fill="#831843" font-weight="semibold">2. Privacy Zone</text>

                <!-- Meeting Pods -->
                <g>
                    <rect x="355" y="100" width="100" height="60" fill="#ffffff" stroke="#e5e7eb" rx="5" />
                    <text x="365" y="135" font-family="sans-serif" font-size="12" fill="#374151">Meeting Pod 1</text>
                    <text x="390" y="120" font-family="sans-serif" font-size="14">👥</text>
                </g>
                 <g>
                    <rect x="465" y="100" width="100" height="60" fill="#ffffff" stroke="#e5e7eb" rx="5" />
                    <text x="475" y="135" font-family="sans-serif" font-size="12" fill="#374151">Meeting Pod 2</text>
                    <text x="500" y="120" font-family="sans-serif" font-size="14">👥</text>
                </g>
                 <g>
                    <rect x="355" y="170" width="210" height="70" fill="#ffffff" stroke="#e5e7eb" rx="5" />
                    <text x="365" y="210" font-family="sans-serif" font-size="12" fill="#374151">Meeting Room (6-8 orang)</text>
                    <text x="440" y="195" font-family="sans-serif" font-size="14">🗣️</text>
                </g>
            </svg>
        `;
        container.innerHTML = svgContent;
    },

    /**
     * Fungsi utama untuk merender semua visualisasi teknis.
     */
    renderAll() {
        this._createDrivingRangeVis();
        this._createPadelVis();
        this._createMeetingPointVis();
        console.log("[sier-visual-technical-diagrams] Semua diagram teknis telah dirender.");
    }
};

window.sierVisualTechnicalDiagrams = sierVisualTechnicalDiagrams;