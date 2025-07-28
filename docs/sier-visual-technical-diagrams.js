// File: sier-visual-technical-diagrams.js
// VERSI TERINTEGRASI: Membuat overlay satelit dan diagram skematik detail.

const sierVisualTechnicalDiagrams = {

    /**
     * Membuat overlay SVG di atas citra satelit.
     */
    _renderSiteOverlay() {
        const container = document.getElementById('site-layout-container');
        if (!container) return;

        const viewBoxWidth = 1000;
        const viewBoxHeight = 558;

        const coords = {
            netPolygon: "30,195 240,195 240,110 440,110 440,195 970,195 970,510 30,510 30,195",
            bayArea: { x: 880, y: 220, width: 50, height: 250 },
            fieldLength: { x1: 270, y1: 340, x2: 880, y2: 340 },
            excavatorPath: "30,220 220,220 220,135 460,135 460,220 860,220 860,490 30,490 30,220",
            suttZone: { x: 50, y: 250, width: 60, height: 180 },
            meetingPoint: { x: 495, y: 80, label: "1" },
            padelLocation1: { x: 580, y: 95, label: "2" },
            padelLocation2: { x: 855, y: 110, label: "3" },
        };

        const svgContent = `
            <svg viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="#000000" flood-opacity="0.7"/>
                    </filter>
                </defs>
                <polyline points="${coords.excavatorPath}" fill="none" stroke="#3b82f6" stroke-width="4" stroke-dasharray="10, 8" stroke-linejoin="round" stroke-linecap="round" style="filter: url(#shadow);" />
                <polygon points="${coords.netPolygon}" fill="rgba(22, 163, 74, 0.15)" stroke="#16a34a" stroke-width="4" stroke-linejoin="round" style="filter: url(#shadow);" />
                <rect x="${coords.bayArea.x}" y="${coords.bayArea.y}" width="${coords.bayArea.width}" height="${coords.bayArea.height}" fill="rgba(250, 204, 21, 0.4)" stroke="#facc15" stroke-width="3" style="filter: url(#shadow);" />
                <line x1="${coords.fieldLength.x1}" y1="${coords.fieldLength.y1}" x2="${coords.fieldLength.x2}" y2="${coords.fieldLength.y2}" stroke="#a855f7" stroke-width="4" style="filter: url(#shadow);" />
                <rect x="${coords.suttZone.x}" y="${coords.suttZone.y}" width="${coords.suttZone.width}" height="${coords.suttZone.height}" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" stroke-width="3" style="filter: url(#shadow);" />
                ${['meetingPoint', 'padelLocation1', 'padelLocation2'].map(key => `
                    <g transform="translate(${coords[key].x}, ${coords[key].y})">
                        <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#000000" stroke-width="2" style="filter: url(#shadow);" />
                        <text x="0" y="5" font-family="sans-serif" font-size="16" font-weight="bold" fill="#000000" text-anchor="middle">${coords[key].label}</text>
                    </g>
                `).join('')}
            </svg>
        `;

        const legendContent = `
            <div class="mt-4 p-4 border-t-2 border-gray-200">
                <h4 class="font-bold text-lg mb-3">Legenda Denah Proyek</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                    <div>
                        <div class="flex items-center mb-2"><span class="w-5 h-5 rounded-full bg-white border-2 border-black flex items-center justify-center font-bold mr-2">1</span> <strong>Meeting Point (Gedung Arsip)</strong></div>
                        <div class="flex items-center mb-2"><span class="w-5 h-5 rounded-full bg-white border-2 border-black flex items-center justify-center font-bold mr-2">2</span> <strong>Lokasi Padel #1 (Renovasi Futsal)</strong></div>
                        <div class="flex items-center mb-2"><span class="w-5 h-5 rounded-full bg-white border-2 border-black flex items-center justify-center font-bold mr-2">3</span> <strong>Lokasi Padel #2 (Gedung Koperasi)</strong></div>
                    </div>
                    <div>
                        <div class="flex items-center mb-2"><span class="w-5 h-5 block" style="background-color: #facc15;"></span><span class="ml-2">Area Bay Driving Range</span></div>
                        <div class="flex items-center mb-2"><span class="w-5 h-5 block" style="border-bottom: 4px solid #a855f7;"></span><span class="ml-2">Jarak Lapangan Driving Range</span></div>
                        <div class="flex items-center mb-2"><span class="w-5 h-5 block" style="border-bottom: 4px solid #16a34a;"></span><span class="ml-2">Jaring Pengaman Driving Range</span></div>
                    </div>
                     <div>
                        <div class="flex items-center mb-2"><span class="w-5 h-5 block" style="border-bottom: 4px solid #ef4444;"></span><span class="ml-2">Zona Terlarang (Jarak Aman SUTT)</span></div>
                        <div class="flex items-center mb-2"><span class="w-5 h-5 block" style="border-bottom: 4px dotted #3b82f6;"></span><span class="ml-2">Jalur Manuver Excavator (Konflik)</span></div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = `
            <div style="position: relative; width: 100%; max-width: 1000px; margin: auto; border: 1px solid #ccc; background: #000;">
                <img src="/img/citra-satelit-proyek-sier.png" alt="Citra Satelit Lokasi Proyek SIER" style="display: block; width: 100%; height: auto;">
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">${svgContent}</div>
            </div>
            ${legendContent}
        `;
    },
    
    _createPadelVis() {
        const container = document.getElementById('padel-conversion-vis');
        if (!container) return;

        const width = 600;
        const height = 250;
        const scale = 12;

        const buildingW = 15.8 * scale;
        const buildingL = 41 * scale;
        const padelCourtW = 10 * scale;
        const padelCourtL = 20 * scale;
        
        const svgContent = `
            <svg viewBox="0 0 ${width} ${height}">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4b5563" />
                    </marker>
                </defs>
                <rect x="50" y="50" width="${buildingL}" height="${buildingW}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2" />
                <text x="55" y="40" font-family="sans-serif" font-size="14" fill="#374151">Area Gedung Futsal Eksisting</text>
                <rect x="55" y="65" width="${padelCourtL}" height="${padelCourtW}" fill="#a7f3d0" stroke="#047857" stroke-width="1.5" />
                <text x="100" y="110" font-family="sans-serif" font-size="14" fill="#065f46" font-weight="bold">Padel Court #1</text>
                <rect x="${55 + padelCourtL + 10}" y="65" width="${padelCourtL}" height="${padelCourtW}" fill="#a7f3d0" stroke="#047857" stroke-width="1.5" />
                <text x="315" y="110" font-family="sans-serif" font-size="14" fill="#065f46" font-weight="bold">Padel Court #2</text>
                <line x1="50" y1="${50 + buildingW + 15}" x2="${50 + buildingL}" y2="${50 + buildingW + 15}" stroke="#4b5563" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
                <text x="${(50 + 50 + buildingL)/2}" y="${50 + buildingW + 30}" font-family="sans-serif" font-size="12" fill="#4b5563" text-anchor="middle">Total Panjang Efektif: ~41m</text>
                <line x1="${50 + buildingL + 15}" y1="50" x2="${50 + buildingL + 15}" y2="${50 + buildingW}" stroke="#4b5563" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
                <text x="${50 + buildingL + 20}" y="${50 + (buildingW/2) + 4}" font-family="sans-serif" font-size="12" fill="#4b5563">Lebar: ~15.8m</text>
            </svg>
        `;
        container.innerHTML = svgContent;
    },
    
    _createMeetingPointVis() {
        const container = document.getElementById('meeting-point-concept-vis');
        if (!container) return;

        const width = 600;
        const height = 300;

        const svgContent = `
            <svg viewBox="0 0 ${width} ${height}">
                <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="#f9fafb" stroke="#e5e7eb" stroke-width="2" rx="10" />
                <text x="25" y="35" font-family="sans-serif" font-size="16" fill="#1f2937" font-weight="bold">Konsep "SIER Business Lounge"</text>
                <rect x="25" y="60" width="300" height="200" fill="#eff6ff" stroke="#93c5fd" stroke-dasharray="4,4" rx="5"/>
                <text x="35" y="80" font-family="sans-serif" font-size="14" fill="#1e40af" font-weight="semibold">1. Open Lounge (Area Kafe)</text>
                <text x="45" y="110" font-family="sans-serif" font-size="24">☕</text>
                <text x="75" y="115" font-family="sans-serif" font-size="12" fill="#374151">Area duduk nyaman</text>
                <text x="45" y="150" font-family="sans-serif" font-size="24">💻</text>
                <text x="75" y="155" font-family="sans-serif" font-size="12" fill="#374151">Meja komunal & Wi-Fi cepat</text>
                <rect x="340" y="60" width="230" height="200" fill="#fdf2f8" stroke="#f9a8d4" stroke-dasharray="4,4" rx="5"/>
                <text x="350" y="80" font-family="sans-serif" font-size="14" fill="#831843" font-weight="semibold">2. Privacy Zone</text>
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
    
    renderAll() {
        this._renderSiteOverlay();
        this._createPadelVis();
        this._createMeetingPointVis();
        console.log("[sier-visual-technical-diagrams] Semua diagram (overlay + skematik) telah dirender.");
    }
};

window.sierVisualTechnicalDiagrams = sierVisualTechnicalDiagrams;