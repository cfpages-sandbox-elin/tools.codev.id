// File: sier-visual-meeting-point.js
// Bertanggung jawab untuk merender semua visualisasi terkait
// analisis kompetitor Meeting Point & Coworking Space.

const sierVisualMeetingPoint = {

    /**
     * Merender tabel ringkasan profil kompetitor meeting point.
     * Mengisi <tbody> dengan id 'meetingPointCompetitorTableBody'.
     */
    _renderProfileSummaryTable() {
        const tableBody = document.getElementById('meetingPointCompetitorTableBody');
        if (!tableBody || typeof competitorData === 'undefined') {
            console.error("Elemen tabel 'meetingPointCompetitorTableBody' atau data kompetitor tidak ditemukan.");
            return;
        }

        let html = '';
        competitorData.forEach(c => {
            html += `
                <tr class="bg-white border-b hover:bg-gray-50 align-top">
                    <td class="px-4 py-4">
                        <div class="font-semibold text-gray-900">${c.name}</div>
                        <div class="text-xs text-gray-500 mt-1">${c.location}</div>
                    </td>
                    <td class="px-4 py-4 text-xs">${c.productsAndCapacity.replace(/^- /gm, '• ').replace(/\n/g, '<br>')}</td>
                    <td class="px-4 py-4 text-xs">${c.uniqueSellingPoints.replace(/^- /gm, '• ').replace(/\n/g, '<br>')}</td>
                    <td class="px-4 py-4 text-xs italic text-gray-600">${c.reviewSummary}</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    },
    
    /**
     * Merender tabel benchmark harga produk.
     * Mengisi <tbody> dengan id 'meetingPointPriceTableBody'.
     */
    _renderPriceBenchmarkTable() {
        const tableBody = document.getElementById('meetingPointPriceTableBody');
        if (!tableBody || typeof competitorData === 'undefined') return;

        let html = '';
        competitorData.forEach(c => {
            const prices = c.productsAndPrice;
            // Menggunakan regex untuk mengekstrak harga dengan lebih andal
            const getPrice = (regex) => {
                const match = prices.match(regex);
                if (match && match[1]) return match[1].trim();
                return prices.includes('Gratis') ? 'Gratis' : '-';
            };

            const hotDeskPrice = getPrice(/Hot Desk: (.*?)(?:\n|$)/i);
            const meetingRoomPrice = getPrice(/Meeting Room: (.*?)(?:\n|$)/i);
            const privateOfficePrice = getPrice(/Private Office: (.*?)(?:\n|$)/i);
            const virtualOfficePrice = getPrice(/Virtual Office: (.*?)(?:\n|$)/i);

            html += `
                <tr class="bg-white border-b hover:bg-gray-50 text-center align-top">
                    <td class="px-3 py-4 font-semibold text-left">${c.name}</td>
                    <td class="px-3 py-4 text-xs">${hotDeskPrice}</td>
                    <td class="px-3 py-4 text-xs">${meetingRoomPrice}</td>
                    <td class="px-3 py-4 text-xs">${privateOfficePrice}</td>
                    <td class="px-3 py-4 text-xs">${virtualOfficePrice}</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    },

    /**
     * Merender matriks perbandingan fasilitas.
     * Mengisi <tbody> dengan id 'meetingPointFacilityTableBody'.
     */
    _renderFacilityMatrix() {
        const tableBody = document.getElementById('meetingPointFacilityTableBody');
        if (!tableBody || typeof competitorData === 'undefined') return;

        const check = '✔️';
        const cross = '<span class="text-gray-300">➖</span>';
        let html = '';

        competitorData.forEach(c => {
            const allText = (c.includedFacilities + " " + c.uniqueSellingPoints).toLowerCase();
            const hasDrinks = allText.includes('kopi') || allText.includes('teh') || allText.includes('mineral');
            const hasPrintScan = allText.includes('cetak') || allText.includes('pindai');
            const hasLounge = allText.includes('lounge');
            const isPremiumLocation = allText.includes('premium') || c.location.includes('Tower') || c.location.includes('Centre') || c.location.includes('Plaza');
            const hasCafe = allText.includes('kafe') || allText.includes('food station');
            
            html += `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-3 py-4 font-semibold text-left">${c.name}</td>
                    <td>${hasDrinks ? check : cross}</td>
                    <td>${hasPrintScan ? check : cross}</td>
                    <td>${hasLounge ? check : cross}</td>
                    <td>${isPremiumLocation ? check : cross}</td>
                    <td>${hasCafe ? check : cross}</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    },
    
    /**
     * Merender peta posisi kompetitif (Positioning Map).
     * Mengisi <div> dengan id 'coworking-map-container'.
     */
    _renderPositioningMap() {
        const container = document.getElementById('coworking-map-container');
        if (!container) return;

        // Kosongkan container dari render sebelumnya (jika ada)
        // Kita hanya ingin menghapus titik-titik, bukan elemen statis seperti garis sumbu
        const existingPoints = container.querySelectorAll('.competitor-point, .sier-point');
        existingPoints.forEach(p => p.remove());


        const competitorPositions = {
            // format: name: [x, y, color]
            // Sumbu X: -100 (Sangat Komunal) to 100 (Sangat Korporat)
            // Sumbu Y: -100 (Sangat Terjangkau) to 100 (Sangat Premium)
            "GoWork": [80, 85, 'bg-blue-600'],
            "Regus": [95, 95, 'bg-black'],
            "vOffice": [70, 70, 'bg-blue-500'],
            "TIFAhub": [60, 65, 'bg-gray-700'],
            "Spazio": [50, 60, 'bg-sky-500'],
            "Kolega": [30, 20, 'bg-indigo-500'],
            "SUB Co": [-80, 10, 'bg-orange-600'],
            "Koridor (Diskominfo)": [-70, -95, 'bg-red-600'],
            "Urban Office": [0, -10, 'bg-teal-500'],
            "Revio Space": [-20, -85, 'bg-lime-600'],
            "Paco Coworking Space": [-30, -70, 'bg-amber-500'],
            "Satu Atap": [-85, -40, 'bg-rose-500'],
            "Visma": [-90, -30, 'bg-fuchsia-600'],
            "C2O Library & Collabtive": [-95, -90, 'bg-emerald-700'],
            "Omah Wani": [-90, -80, 'bg-green-600'],
            "The Startup Connect": [10, 5, 'bg-purple-600'],
        };
        
        // Target Proyek SIER diidentifikasi berada di kuadran "Profesional & Korporat" dengan harga "Premium Value" (tidak semahal pemain top-tier).
        const sierTarget = { name: 'PROYEK SIER', pos: [75, 40], color: 'bg-yellow-400 border-2 border-black animate-pulse' };

        // Render Competitor Points
        for (const name in competitorPositions) {
            const [x, y, color] = competitorPositions[name];
            const left = 50 + (x / 2); // Konversi rentang -100/100 ke 0-100%
            const topValue = 50 - (y / 2); // Konversi rentang -100/100 ke 0-100% (dibalik karena top:0 adalah atas)
            
            const pointWrapper = document.createElement('div');
            pointWrapper.className = 'competitor-point absolute';
            pointWrapper.style.left = `${left}%`;
            pointWrapper.style.top = `${topValue}%`;
            pointWrapper.style.transform = 'translate(-50%, -50%)';
            pointWrapper.innerHTML = `
                <div class="w-3 h-3 ${color} rounded-full group cursor-pointer"></div>
                <span class="absolute left-1/2 top-full mt-1 px-2 py-1 bg-white text-gray-800 text-[10px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10" style="transform: translateX(-50%);">${name}</span>
            `;
            container.appendChild(pointWrapper);
        }

        // Render SIER Target Point
        const [sierX, sierY] = sierTarget.pos;
        const sierLeft = 50 + (sierX / 2);
        const sierTop = 50 - (sierY / 2);

        const sierPointWrapper = document.createElement('div');
        sierPointWrapper.className = 'sier-point absolute';
        sierPointWrapper.style.left = `${sierLeft}%`;
        sierPointWrapper.style.top = `${sierTop}%`;
        sierPointWrapper.style.transform = 'translate(-50%, -50%)';
        sierPointWrapper.style.zIndex = '20';
        sierPointWrapper.innerHTML = `
            <div class="w-5 h-5 ${sierTarget.color} rounded-full flex items-center justify-center group cursor-pointer">
                 <span class="text-black font-bold text-xs">★</span>
            </div>
            <span class="absolute left-1/2 top-full mt-1 px-2 py-1 bg-yellow-400 text-black text-[10px] font-bold rounded shadow-lg whitespace-nowrap" style="transform: translateX(-50%);">${sierTarget.name}</span>
        `;
        container.appendChild(sierPointWrapper);
    },

    /**
     * Fungsi master untuk merender semua visualisasi kompetitor meeting point.
     * Ini adalah satu-satunya fungsi yang perlu dipanggil dari luar.
     */
    renderAll() {
        console.log("Merender modul Analisis Kompetitor Meeting Point...");
        sierHelpers.tryToRender(this._renderProfileSummaryTable.bind(this));
        sierHelpers.tryToRender(this._renderPriceBenchmarkTable.bind(this));
        sierHelpers.tryToRender(this._renderFacilityMatrix.bind(this));
        sierHelpers.tryToRender(this._renderPositioningMap.bind(this));
    }
};

// Pastikan untuk memanggil sierVisualMeetingPoint.renderAll() dari file controller utama Anda (misal: sier-visual.js)
// setelah DOM sepenuhnya dimuat.