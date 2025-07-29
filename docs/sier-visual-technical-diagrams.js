// File: sier-visual-technical-diagrams.js
// VERSI 3.1: Memperbaiki error dan menambahkan fungsi render diagram detail.

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

    _stringToPoints(str) {
        return str.split(' ').map(pair => {
            const [x, y] = pair.split(',').map(Number);
            return { x, y };
        });
    },

    _pointsToString(points) {
        return points.map(p => `${p.x},${p.y}`).join(' ');
    },

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

    _saveCoordinates() {
        try {
            localStorage.setItem('sierSvgCoords', JSON.stringify(this.coords));
            console.log("Koordinat SVG berhasil disimpan ke localStorage.");
        } catch (e) {
            console.error("Gagal menyimpan koordinat ke localStorage.", e);
        }
    },

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

    _createPadelVis() {
        const container = document.getElementById('padel-conversion-vis');
        if (!container) return;
        container.innerHTML = `
            <svg viewBox="0 0 500 250" class="w-full h-auto">
                <rect x="1" y="1" width="498" height="248" fill="#f0fdf4" stroke="#dcfce7" stroke-width="2"/>
                <text x="250" y="25" font-size="14" font-weight="bold" text-anchor="middle" fill="#166534">Area Futsal Eksisting</text>
                
                <text x="250" y="50" font-size="12" text-anchor="middle" fill="#52525b">Lebar Total: ~15.8 m</text>
                <line x1="10" y1="60" x2="490" y2="60" stroke="#9ca3af" stroke-dasharray="2 2" />
                <path d="M10 55 L10 65" stroke="#9ca3af"/>
                <path d="M490 55 L490 65" stroke="#9ca3af"/>

                <text x="45" y="150" font-size="12" text-anchor="middle" fill="#52525b" transform="rotate(-90, 45, 150)">Panjang Total: ~41 m</text>
                <line x1="60" y1="70" x2="60" y2="230" stroke="#9ca3af" stroke-dasharray="2 2" />
                <path d="M55 70 L65 70" stroke="#9ca3af"/>
                <path d="M55 230 L65 230" stroke="#9ca3af"/>
                
                <!-- Padel Courts -->
                <g>
                    <rect x="80" y="75" width="180" height="150" fill="#a7f3d0" stroke="#15803d" stroke-width="1.5" />
                    <text x="170" y="145" font-size="12" font-weight="semibold" text-anchor="middle" fill="#14532d">Lapangan Padel 1</text>
                    <text x="170" y="165" font-size="10" text-anchor="middle" fill="#166534">(20m x 10m)</text>
                </g>
                <g>
                    <rect x="270" y="75" width="180" height="150" fill="#a7f3d0" stroke="#15803d" stroke-width="1.5" />
                    <text x="360" y="145" font-size="12" font-weight="semibold" text-anchor="middle" fill="#14532d">Lapangan Padel 2</text>
                    <text x="360" y="165" font-size="10" text-anchor="middle" fill="#166534">(20m x 10m)</text>
                </g>
                
                <!-- Labels Sisa Ruang -->
                <text x="200" y="240" font-size="10" text-anchor="middle" fill="#52525b">Total Panjang 2 Lapangan: 40m</text>
                <text x="350" y="70" font-size="10" text-anchor="middle" fill="#52525b">Lebar 1 Lapangan: 10m</text>
            </svg>
        `;
    },

    _createMeetingPointVis() {
        const container = document.getElementById('meeting-point-concept-vis');
        if (!container) return;
        container.innerHTML = `
            <svg viewBox="0 0 500 300" class="w-full h-auto">
                <rect x="1" y="1" width="498" height="298" fill="#f0f9ff" stroke="#e0f2fe" stroke-width="2"/>
                <text x="250" y="25" font-size="14" font-weight="bold" text-anchor="middle" fill="#0369a1">Konsep Denah "SIER Business Lounge"</text>

                <!-- Zona Kiri: Lounge & Kafe -->
                <rect x="20" y="50" width="220" height="230" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="1.5"/>
                <text x="130" y="160" font-size="16" font-weight="bold" text-anchor="middle" fill="#0c4a6e">Open Lounge & Cafe</text>
                <text x="130" y="180" font-size="10" text-anchor="middle" fill="#075985">(Area Kerja Fleksibel, Sofa, Bar Kopi)</text>
                
                <!-- Zona Kanan Atas: Meeting Pods -->
                <rect x="260" y="50" width="220" height="150" fill="#f3e8ff" stroke="#c084fc" stroke-width="1.5"/>
                <text x="370" y="70" font-size="14" font-weight="bold" text-anchor="middle" fill="#5b21b6">Privacy Zone</text>
                
                <rect x="270" y="90" width="60" height="50" fill="#faf5ff" stroke="#d8b4fe"/>
                <text x="300" y="118" font-size="9" text-anchor="middle" fill="#7e22ce">Pod 1<br>(2-4pax)</text>
                <rect x="340" y="90" width="60" height="50" fill="#faf5ff" stroke="#d8b4fe"/>
                <text x="370" y="118" font-size="9" text-anchor="middle" fill="#7e22ce">Pod 2<br>(2-4pax)</text>
                <rect x="410" y="90" width="60" height="50" fill="#faf5ff" stroke="#d8b4fe"/>
                <text x="440" y="118" font-size="9" text-anchor="middle" fill="#7e22ce">Pod 3<br>(2-4pax)</text>
                <rect x="270" y="150" width="200" height="40" fill="#faf5ff" stroke="#d8b4fe"/>
                <text x="370" y="175" font-size="10" text-anchor="middle" fill="#7e22ce">Meeting Room (6-8pax)</text>

                <!-- Zona Kanan Bawah: Fasilitas -->
                <rect x="260" y="210" width="220" height="70" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
                <text x="370" y="245" font-size="12" font-weight="semibold" text-anchor="middle" fill="#334155">Area Servis (Toilet, Dapur, Gudang)</text>
            </svg>
        `;
    },
    
    _setupUIControls() {
        // Toggle Overlay
        const toggleSwitch = document.getElementById('toggle-svg');
        if(toggleSwitch) {
            toggleSwitch.addEventListener('change', (e) => {
                const overlay = document.getElementById('svg-overlay');
                if(overlay) overlay.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        // Tombol Mode Edit
        const editButton = document.getElementById('edit-mode-btn');
        if(editButton) {
            editButton.addEventListener('click', (e) => {
                this.isEditing = !this.isEditing;
                e.target.textContent = this.isEditing ? 'Simpan & Keluar Mode Edit' : 'Mode Edit';
                e.target.classList.toggle('bg-green-500', this.isEditing);
                e.target.classList.toggle('hover:bg-green-600', this.isEditing);
                e.target.classList.toggle('bg-blue-500', !this.isEditing);
                e.target.classList.toggle('hover:bg-blue-600', !this.isEditing);
                
                const handleContainer = this.svg.querySelector('#handle-container');
                if (this.isEditing) {
                    const shapes = ['netPolygon', 'bayAreaPolygon', 'suttZonePolygon', 'fieldLengthLine', 'excavatorPath'];
                    handleContainer.innerHTML = shapes.map(shapeId => 
                        this._stringToPoints(this.coords[shapeId]).map((p, index) => 
                            `<circle class="handle" data-shape-id="${shapeId}" data-point-index="${index}" cx="${p.x}" cy="${p.y}" r="8" />`
                        ).join('')
                    ).join('');
                } else {
                    handleContainer.innerHTML = '';
                    this._saveCoordinates(); // Simpan saat keluar mode edit
                }
            });
        }

        // Mouse Events untuk Dragging
        const svgWrapper = document.getElementById('svg-wrapper');
        if(svgWrapper) {
            svgWrapper.addEventListener('mousedown', this._onMouseDown.bind(this));
            document.addEventListener('mousemove', this._onMouseMove.bind(this));
            document.addEventListener('mouseup', this._onMouseUp.bind(this));
        }
    },
    
    _getSVGPoint(e) {
        if (!this.svg) return { x: 0, y: 0 };
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
        const shapeId = this.activeElement.dataset.shapeId;

        if (this.activeElement.classList.contains('handle')) {
            const pointIndex = parseInt(this.activeElement.dataset.pointIndex);
            this.activeElement.setAttribute('cx', pt.x);
            this.activeElement.setAttribute('cy', pt.y);
            let points = this._stringToPoints(this.coords[shapeId]);
            points[pointIndex] = { x: pt.x, y: pt.y };
            this.coords[shapeId] = this._pointsToString(points);
            this._updateShape(shapeId);
        } else if (this.activeElement.classList.contains('draggable-shape')) {
             if (this.activeElement.tagName === 'g') {
                 const newX = pt.x - this.offset.x;
                 const newY = pt.y - this.offset.y;
                 this.activeElement.setAttribute('transform', `translate(${newX}, ${newY})`);
                 this.coords.markers[shapeId] = { ...this.coords.markers[shapeId], x: newX, y: newY };
             } else {
                const dx = pt.x - this.offset.x;
                const dy = pt.y - this.offset.y;
                let points = this._stringToPoints(this.coords[shapeId]);
                let newPoints = points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                this.coords[shapeId] = this._pointsToString(newPoints);
                this._updateShape(shapeId);
                this.offset.x = pt.x;
                this.offset.y = pt.y;
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
            // Tidak menyimpan otomatis di sini, tapi saat keluar mode edit
        }
    },

    renderAll() {
        this._loadCoordinates();
        this._renderSiteOverlay();
        this._setupUIControls();

        // Panggil render diagram detail lainnya
        this._createPadelVis();
        this._createMeetingPointVis();
        
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