// File: sier-visual-technical-diagrams.js
// VERSI 3.0: Overlay SVG yang presisi mengikuti perspektif citra satelit.

const sierVisualTechnicalDiagrams = {
    // Properti untuk menyimpan state
    isEditing: false,
    isDragging: false,
    activeElement: null,
    offset: { x: 0, y: 0 },
    svg: null, // Referensi ke elemen SVG utama

    // Koordinat default, akan ditimpa oleh localStorage jika ada
    coords: {
        netPolygon: "35,190 240,190 240,110 445,110 445,190 910,215 910,505 35,505",
        bayAreaPolygon: "860,240 900,225 935,465 895,480",
        suttZonePolygon: "60,260 120,250 145,420 85,430",
        fieldLengthLine: "270,345 865,345", // Format baru: x1,y1 x2,y2
        excavatorPath: "45,210 220,210 220,130 465,130 465,210 850,230 850,485 45,485",
        markers: {
            meetingPoint: { x: 495, y: 80, label: "1" },
            padelLocation1: { x: 580, y: 95, label: "2" },
            padelLocation2: { x: 855, y: 110, label: "3" },
        }
    },

    /**
     * Mengubah string 'x1,y1 x2,y2 ...' menjadi array objek [{x, y}, {x, y}]
     */
    _stringToPoints(str) {
        return str.split(' ').map(pair => {
            const [x, y] = pair.split(',').map(Number);
            return { x, y };
        });
    },

    /**
     * Mengubah array objek menjadi string 'x1,y1 x2,y2 ...'
     */
    _pointsToString(points) {
        return points.map(p => `${p.x},${p.y}`).join(' ');
    },

    /**
     * Memuat koordinat dari localStorage.
     */
    _loadCoordinates() {
        const savedCoords = localStorage.getItem('sierSvgCoords');
        if (savedCoords) {
            try {
                this.coords = JSON.parse(savedCoords);
                console.log("Koordinat SVG berhasil dimuat dari localStorage.");
            } catch (e) {
                console.error("Gagal mem-parsing koordinat dari localStorage, menggunakan default.", e);
            }
        }
    },

    /**
     * Menyimpan koordinat ke localStorage.
     */
    _saveCoordinates() {
        try {
            localStorage.setItem('sierSvgCoords', JSON.stringify(this.coords));
            console.log("Koordinat SVG berhasil disimpan ke localStorage.");
        } catch (e) {
            console.error("Gagal menyimpan koordinat ke localStorage.", e);
        }
    },
    
    /**
     * Merender ulang SATU BENTUK SPESIFIK berdasarkan data terbaru.
     */
    _updateShape(shapeId) {
        const shapeElement = this.svg.querySelector(`[data-shape-id="${shapeId}"]`);
        if (!shapeElement) return;

        if (shapeElement.tagName === 'polygon' || shapeElement.tagName === 'polyline') {
            shapeElement.setAttribute('points', this.coords[shapeId]);
        } else if (shapeElement.tagName === 'line') {
            const [p1, p2] = this._stringToPoints(this.coords[shapeId]);
            shapeElement.setAttribute('x1', p1.x);
            shapeElement.setAttribute('y1', p1.y);
            shapeElement.setAttribute('x2', p2.x);
            shapeElement.setAttribute('y2', p2.y);
        }
    },
    
    /**
     * Fungsi utama untuk merender denah proyek dan handle editornya.
     */
    _renderSiteOverlay() {
        const container = document.getElementById('site-layout-container');
        if (!container) return;
        
        const viewBoxWidth = 927;
        const viewBoxHeight = 551;

        const createShape = (type, id, points, style) => {
            const pointStr = Array.isArray(points) ? this._pointsToString(points) : points;
            if (type === 'line') {
                 const [p1, p2] = this._stringToPoints(pointStr);
                 return `<line data-shape-id="${id}" class="draggable-shape" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" ${style} />`;
            }
            return `<${type} data-shape-id="${id}" class="draggable-shape" points="${pointStr}" ${style} />`;
        };

        const createHandles = (shapeId) => {
            if (!this.isEditing) return '';
            const points = this._stringToPoints(this.coords[shapeId]);
            return points.map((p, index) => 
                `<circle class="handle" data-shape-id="${shapeId}" data-point-index="${index}" cx="${p.x}" cy="${p.y}" r="8" />`
            ).join('');
        };
        
        const shapes = [
            { type: 'polyline', id: 'excavatorPath', style: 'fill="none" stroke="#3b82f6" stroke-width="4" stroke-dasharray="10, 8" style="filter: url(#shadow);"' },
            { type: 'polygon', id: 'netPolygon', style: 'fill="rgba(22, 163, 74, 0.15)" stroke="#16a34a" stroke-width="4" style="filter: url(#shadow);"' },
            { type: 'polygon', id: 'bayAreaPolygon', style: 'fill="rgba(250, 204, 21, 0.4)" stroke="#facc15" stroke-width="3" style="filter: url(#shadow);"' },
            { type: 'line', id: 'fieldLengthLine', style: 'stroke="#a855f7" stroke-width="4" style="filter: url(#shadow);"' },
            { type: 'polygon', id: 'suttZonePolygon', style: 'fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" stroke-width="3" style="filter: url(#shadow);"' }
        ];

        const svgContent = `
            <svg id="interactive-svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" style="width: 100%; height: 100%; user-select: none;">
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="1.5" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity="0.8"/>
                    </filter>
                </defs>
                ${shapes.map(s => createShape(s.type, s.id, this.coords[s.id], s.style)).join('')}
                ${Object.entries(this.coords.markers).map(([key, m]) => 
                    `<g class="draggable-shape" data-shape-id="${key}" transform="translate(${m.x}, ${m.y})">
                        <circle cx="0" cy="0" r="14" fill="#fff" stroke="#000" stroke-width="2" style="filter: url(#shadow);" />
                        <text x="0" y="5" font-size="16" font-weight="bold" text-anchor="middle">${m.label}</text>
                    </g>`
                ).join('')}
                <g id="handle-container">
                    ${shapes.map(s => createHandles(s.id)).join('')}
                </g>
            </svg>
        `;
        
        // Render UI kontrol dan SVG
        container.innerHTML = `
            <div id="svg-controls" class="p-2 bg-gray-200 rounded-t-lg flex items-center justify-between">
                <div class="flex items-center">
                    <label for="toggle-svg" class="text-sm font-medium mr-2">Tampilkan Overlay:</label>
                    <label class="switch"><input type="checkbox" id="toggle-svg" checked><span class="slider round"></span></label>
                </div>
                <button id="edit-mode-btn" class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">Mode Edit</button>
            </div>
            <div id="svg-wrapper" style="position: relative; width: 100%; max-width: 1000px; margin: auto; border: 1px solid #ccc;">
                <img src="/img/citra-satelit-proyek-sier.png" alt="Citra Satelit Lokasi Proyek SIER" style="display: block; width: 100%; height: auto;">
                <div id="svg-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">${svgContent}</div>
            </div>
        `;
        
        this.svg = document.getElementById('interactive-svg');
    },
    
    /**
     * Mengatur semua event listener untuk UI dan interaksi SVG.
     */
    _setupUIControls() {
        // Toggle Overlay
        document.getElementById('toggle-svg').addEventListener('change', (e) => {
            document.getElementById('svg-overlay').style.display = e.target.checked ? 'block' : 'none';
        });

        // Tombol Mode Edit
        document.getElementById('edit-mode-btn').addEventListener('click', (e) => {
            this.isEditing = !this.isEditing;
            e.target.textContent = this.isEditing ? 'Simpan & Keluar Mode Edit' : 'Mode Edit';
            e.target.classList.toggle('bg-green-500', this.isEditing);
            e.target.classList.toggle('hover:bg-green-600', this.isEditing);
            e.target.classList.toggle('bg-blue-500', !this.isEditing);
            e.target.classList.toggle('hover:bg-blue-600', !this.isEditing);
            
            // Re-render hanya handle, bukan seluruh SVG
            const handleContainer = this.svg.querySelector('#handle-container');
            if (this.isEditing) {
                const shapes = ['netPolygon', 'bayAreaPolygon', 'suttZonePolygon', 'fieldLengthLine', 'excavatorPath'];
                const points = this._stringToPoints(this.coords['netPolygon']);
                handleContainer.innerHTML = shapes.map(shapeId => 
                    this._stringToPoints(this.coords[shapeId]).map((p, index) => 
                        `<circle class="handle" data-shape-id="${shapeId}" data-point-index="${index}" cx="${p.x}" cy="${p.y}" r="8" />`
                    ).join('')
                ).join('');
            } else {
                handleContainer.innerHTML = '';
            }
        });

        // Mouse Events untuk Dragging
        const svgWrapper = document.getElementById('svg-wrapper');
        svgWrapper.addEventListener('mousedown', this._onMouseDown.bind(this));
        document.addEventListener('mousemove', this._onMouseMove.bind(this));
        document.addEventListener('mouseup', this._onMouseUp.bind(this));
    },

    /**
     * Konversi koordinat layar ke koordinat SVG.
     */
    _getSVGPoint(e) {
        const pt = this.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(this.svg.getScreenCTM().inverse());
    },

    _onMouseDown(e) {
        if (!this.isEditing) return;
        
        const target = e.target;
        if (target.classList.contains('handle') || target.closest('.draggable-shape')) {
            e.preventDefault();
            this.isDragging = true;
            this.activeElement = target.classList.contains('handle') ? target : target.closest('.draggable-shape');
            
            const pt = this._getSVGPoint(e);
            if (this.activeElement.tagName === 'g') { // Marker
                 const transform = this.activeElement.transform.baseVal[0];
                 this.offset.x = pt.x - transform.matrix.e;
                 this.offset.y = pt.y - transform.matrix.f;
            } else {
                 this.offset.x = pt.x;
                 this.offset.y = pt.y;
            }
        }
    },

    _onMouseMove(e) {
        if (!this.isDragging || !this.activeElement) return;
        
        e.preventDefault();
        const pt = this._getSVGPoint(e);
        const newX = pt.x - this.offset.x;
        const newY = pt.y - this.offset.y;

        const shapeId = this.activeElement.dataset.shapeId;

        // Jika menggeser handle (titik sudut)
        if (this.activeElement.classList.contains('handle')) {
            const pointIndex = parseInt(this.activeElement.dataset.pointIndex);
            this.activeElement.setAttribute('cx', pt.x);
            this.activeElement.setAttribute('cy', pt.y);
            
            let points = this._stringToPoints(this.coords[shapeId]);
            points[pointIndex] = { x: pt.x, y: pt.y };
            this.coords[shapeId] = this._pointsToString(points);
            this._updateShape(shapeId);
        }
        // Jika menggeser seluruh bentuk
        else if (this.activeElement.classList.contains('draggable-shape')) {
             if (this.activeElement.tagName === 'g') { // Marker
                 this.activeElement.setAttribute('transform', `translate(${newX}, ${newY})`);
                 this.coords.markers[shapeId] = { ...this.coords.markers[shapeId], x: newX, y: newY };
             } else { // Polygon, Polyline, Line
                const dx = pt.x - this.offset.x;
                const dy = pt.y - this.offset.y;
                let points = this._stringToPoints(this.coords[shapeId]);
                let newPoints = points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                this.coords[shapeId] = this._pointsToString(newPoints);
                this._updateShape(shapeId);
                this.offset.x = pt.x; // Update offset untuk pergerakan selanjutnya
                this.offset.y = pt.y;

                // Geser juga handle-nya
                this.svg.querySelectorAll(`.handle[data-shape-id="${shapeId}"]`).forEach(handle => {
                    handle.setAttribute('cx', parseFloat(handle.getAttribute('cx')) + dx);
                    handle.setAttribute('cy', parseFloat(handle.getAttribute('cy')) + dy);
                });
             }
        }
    },

    _onMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.activeElement = null;
            this._saveCoordinates(); // Simpan setelah selesai menggeser
        }
    },

    renderAll() {
        this._loadCoordinates();
        this._renderSiteOverlay();
        this._setupUIControls(); // Harus dipanggil setelah render

        // Kita tetap panggil render diagram detail lainnya
        this._createPadelVis();
        this._createMeetingPointVis();
        
        // Menambahkan style untuk UI editor
        const style = document.createElement('style');
        style.textContent = `
            .handle { fill: #3b82f6; stroke: #fff; stroke-width: 2px; cursor: move; }
            .handle:hover { fill: #2563eb; }
            .draggable-shape { cursor: grab; }
            .draggable-shape:active { cursor: grabbing; }
            .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; }
            input:checked + .slider { background-color: #2196F3; }
            input:checked + .slider:before { transform: translateX(20px); }
            .slider.round { border-radius: 24px; }
            .slider.round:before { border-radius: 50%; }
        `;
        document.head.appendChild(style);
        
        console.log("[sier-visual-technical-diagrams] Interactive editor dan diagram detail telah dirender.");
    }
};

window.sierVisualTechnicalDiagrams = sierVisualTechnicalDiagrams;