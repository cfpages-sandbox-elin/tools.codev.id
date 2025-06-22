// audio.js

// We wrap the entire script in this event listener.
// This ensures that the code will only run after the full HTML document,
// including the external FFmpeg script, has been loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {

    const { createFFmpeg, fetchFile } = FFmpeg;
    let ffmpeg;
    let audioFile = null;
    let splitPoints = []; // Stores split times in seconds

    // --- UI Elements ---
    const fileInput = document.getElementById('file-input');
    const fileSelectView = document.getElementById('file-select-view');
    const editorView = document.getElementById('editor-view');
    const audioPlayer = document.getElementById('audio-player');
    const progressBar = document.getElementById('progress-bar');
    const timelineMarkers = document.getElementById('timeline-markers');
    const splitButton = document.getElementById('split-button');
    const partsSection = document.getElementById('parts-section');
    const partsList = document.getElementById('parts-list');
    const downloadSelectedButton = document.getElementById('download-selected-button');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const fileNameDisplay = document.getElementById('file-name-display');
    const resetButton = document.getElementById('reset-button');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    // --- FFmpeg Initialization ---
    const initFFmpeg = async () => {
        if (!ffmpeg || !ffmpeg.isLoaded()) {
            showLoading('Loading FFmpeg Core...');
            ffmpeg = createFFmpeg({
                log: false,
                mainName: 'main',
                corePath: 'https://unpkg.com/@ffmpeg/core@0.12.0/dist/ffmpeg-core.js',
            });
            await ffmpeg.load();
            hideLoading();
        }
    };

    // --- UI Helper Functions ---
    const showLoading = (text) => {
        loadingText.textContent = text;
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');
    };

    const hideLoading = () => {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
    };

    // --- Event Listeners ---
    fileInput.addEventListener('change', handleFileSelect);
    resetButton.addEventListener('click', resetApp);

    audioPlayer.addEventListener('loadedmetadata', () => {
        splitButton.disabled = false;
    });

    audioPlayer.addEventListener('timeupdate', () => {
        if (audioPlayer.duration) {
            const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.value = percentage;
        }
    });

    progressBar.addEventListener('click', (e) => {
        if (!audioPlayer.duration) return;
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        audioPlayer.currentTime = (x / width) * audioPlayer.duration;
    });

    splitButton.addEventListener('click', addSplitPoint);
    downloadSelectedButton.addEventListener('click', downloadParts);
    selectAllCheckbox.addEventListener('change', (e) => {
        document.querySelectorAll('.part-checkbox').forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
        updateDownloadButtonState();
    });

    // --- Core Logic ---
    async function handleFileSelect(event) {
        audioFile = event.target.files[0];
        if (!audioFile) return;
        await initFFmpeg();
        const fileURL = URL.createObjectURL(audioFile);
        audioPlayer.src = fileURL;
        fileNameDisplay.textContent = audioFile.name;
        fileSelectView.classList.add('hidden');
        editorView.classList.remove('hidden');
    }

    function addSplitPoint() {
        const currentTime = audioPlayer.currentTime;
        if (currentTime > 0 && currentTime < audioPlayer.duration && !splitPoints.includes(currentTime)) {
            splitPoints.push(currentTime);
            splitPoints.sort((a, b) => a - b);
            renderParts();
        }
    }

    function renderParts() {
        partsList.innerHTML = '';
        timelineMarkers.innerHTML = '';
        const segments = getSegments();
        if (segments.length === 0) {
            partsSection.classList.add('hidden');
            return;
        }
        partsSection.classList.remove('hidden');
        segments.forEach((segment, index) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-3 bg-gray-100 rounded-lg';
            li.innerHTML = `
                <div class="flex items-center">
                    <input type="checkbox" class="part-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" data-index="${index}">
                    <label class="ml-3">
                        <span class="font-bold">Part ${index + 1}</span>
                        <span class="text-sm text-gray-600 ml-2">${formatTime(segment.start)} - ${formatTime(segment.end)}</span>
                    </label>
                </div>
                <button class="play-segment-btn text-blue-500 hover:text-blue-700" data-start="${segment.start}" data-end="${segment.end}">
                    <i class="fa-solid fa-play"></i>
                </button>
            `;
            partsList.appendChild(li);
            if (segment.start > 0) {
                const marker = document.createElement('div');
                marker.className = 'marker';
                marker.style.left = `${(segment.start / audioPlayer.duration) * 100}%`;
                timelineMarkers.appendChild(marker);
            }
        });
        document.querySelectorAll('.part-checkbox').forEach(cb => cb.addEventListener('change', updateDownloadButtonState));
        document.querySelectorAll('.play-segment-btn').forEach(btn => btn.addEventListener('click', playSegment));
        updateDownloadButtonState();
    }

    function getSegments() {
        if (splitPoints.length === 0) return [];
        const points = [0, ...splitPoints, audioPlayer.duration];
        const segments = [];
        for (let i = 0; i < points.length - 1; i++) {
            if (points[i].toFixed(4) < points[i+1].toFixed(4)) {
                segments.push({ start: points[i], end: points[i+1] });
            }
        }
        return segments;
    }

    async function downloadParts() {
        const selectedCheckboxes = document.querySelectorAll('.part-checkbox:checked');
        if (selectedCheckboxes.length === 0) return;
        showLoading('Preparing files for splitting...');
        try {
            const originalName = audioFile.name;
            ffmpeg.FS('writeFile', originalName, await fetchFile(audioFile));
            const segments = getSegments();
            const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
            const extension = originalName.substring(originalName.lastIndexOf('.'));
            for (let i = 0; i < selectedCheckboxes.length; i++) {
                const checkbox = selectedCheckboxes[i];
                const partIndex = parseInt(checkbox.dataset.index, 10);
                const partNumber = partIndex + 1;
                const segment = segments[partIndex];
                showLoading(`Splitting Part ${partNumber} of ${segments.length}...`);
                const outputName = `${baseName}-split-part-${partNumber}${extension}`;
                await ffmpeg.run('-i', originalName, '-ss', formatTime(segment.start), '-to', formatTime(segment.end), '-c', 'copy', outputName);
                const data = ffmpeg.FS('readFile', outputName);
                triggerDownload(data, outputName);
                ffmpeg.FS('unlink', outputName);
            }
            ffmpeg.FS('unlink', originalName);
        } catch (error) {
            console.error(error);
            alert("An error occurred during splitting. Check the console for details.");
        } finally {
            hideLoading();
        }
    }

    function triggerDownload(data, filename) {
        const blob = new Blob([data.buffer], { type: audioFile.type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function updateDownloadButtonState() {
        const anyChecked = document.querySelectorAll('.part-checkbox:checked').length > 0;
        downloadSelectedButton.disabled = !anyChecked;
    }

    function playSegment(event) {
        const button = event.currentTarget;
        const start = parseFloat(button.dataset.start);
        const end = parseFloat(button.dataset.end);
        audioPlayer.currentTime = start;
        audioPlayer.play();
        const checkTime = () => {
            if (audioPlayer.currentTime >= end || audioPlayer.paused) {
                audioPlayer.pause();
                audioPlayer.removeEventListener('timeupdate', checkTime);
            }
        };
        audioPlayer.addEventListener('timeupdate', checkTime);
    }

    function resetApp() {
        audioFile = null;
        splitPoints = [];
        if (audioPlayer.src) {
            URL.revokeObjectURL(audioPlayer.src);
        }
        audioPlayer.src = '';
        editorView.classList.add('hidden');
        fileSelectView.classList.remove('hidden');
        partsSection.classList.add('hidden');
        partsList.innerHTML = '';
        timelineMarkers.innerHTML = '';
        progressBar.value = 0;
        fileInput.value = '';
        splitButton.disabled = true;
    }

    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
    }
});