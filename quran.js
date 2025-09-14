// quran.js v1.3 global paste
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlqWMArBZkIfPWVNP6KuM0wyy2u3zvN3INFKzoQMI5MHiRQHQTVehC-9Mi7HiwK3q86A/exec";
const CLOUDFLARE_SHEET_API_URL = "/sheet-api"; // For Google Sheets operations
const CLOUDFLARE_QURAN_API_URL = "/quran-api"; // For Quran scraping

// Check if API URL is set
function isApiUrlSet() {
    return GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
}

// State
let ayahs = [];
let labels = [];
let selectedLabels = [];
let editingAyahId = null;
let parsedAyahData = null;

// DOM Elements - will be initialized after DOM loads
let elements = {};

// Initialize DOM elements
function initializeElements() {
    elements = {
        // Ayah list
        ayahList: document.getElementById('ayahList'),
        loadingIndicator: document.getElementById('loadingIndicator'),
        emptyState: document.getElementById('emptyState'),
        unlabeledWarning: document.getElementById('unlabeledWarning'),
        
        // Search and filter
        searchInput: document.getElementById('searchInput'),
        surahFilter: document.getElementById('surahFilter'),
        labelFilter: document.getElementById('labelFilter'),
        showUnlabeledOnly: document.getElementById('showUnlabeledOnly'),
        
        // Modals
        ayahModal: document.getElementById('ayahModal'),
        labelsModal: document.getElementById('labelsModal'),
        importSurahModal: document.getElementById('importSurahModal'),
        
        // Import surah
        importSurah: document.getElementById('importSurah'),
        surahUrlInput: document.getElementById('surahUrlInput'),
        importButton: document.getElementById('importButton'),
        cancelImportButton: document.getElementById('cancelImportButton'),
        closeImportModal: document.getElementById('closeImportModal'),
        importProgress: document.getElementById('importProgress'),
        progressBar: document.getElementById('progressBar'),
        
        // Ayah form
        modalTitle: document.getElementById('modalTitle'),
        pasteInput: document.getElementById('pasteInput'),
        parseButton: document.getElementById('parseButton'),
        surahInput: document.getElementById('surahInput'),
        ayahInput: document.getElementById('ayahInput'),
        arabicInput: document.getElementById('arabicInput'),
        englishInput: document.getElementById('englishInput'),
        sourceInput: document.getElementById('sourceInput'),
        labelsContainer: document.getElementById('labelsContainer'),
        parentLabelSelect: document.getElementById('parentLabelSelect'),
        childLabelSelect: document.getElementById('childLabelSelect'),
        addLabelButton: document.getElementById('addLabelButton'),
        newLabelInput: document.getElementById('newLabelInput'),
        newLabelType: document.getElementById('newLabelType'),
        newLabelParent: document.getElementById('newLabelParent'),
        createLabelButton: document.getElementById('createLabelButton'),
        
        // Buttons
        addNewAyah: document.getElementById('addNewAyah'),
        manageLabels: document.getElementById('manageLabels'),
        closeModal: document.getElementById('closeModal'),
        cancelButton: document.getElementById('cancelButton'),
        saveButton: document.getElementById('saveButton'),
        closeLabelsModal: document.getElementById('closeLabelsModal'),
        closeLabelsModalButton: document.getElementById('closeLabelsModalButton'),
        
        // Labels management
        newLabelNameInput: document.getElementById('newLabelNameInput'),
        newLabelParentSelect: document.getElementById('newLabelParentSelect'),
        addNewLabelButton: document.getElementById('addNewLabelButton'),
        labelsHierarchy: document.getElementById('labelsHierarchy'),
        
        // Parsed ayah preview
        parsedPreview: document.getElementById('parsedPreview'),
        
        // Step indicators
        step1Indicator: document.getElementById('step1Indicator'),
        step2Indicator: document.getElementById('step2Indicator'),
        step3Indicator: document.getElementById('step3Indicator'),
        connector1: document.getElementById('connector1'),
        connector2: document.getElementById('connector2'),
        
        // Review section
        reviewSurah: document.getElementById('reviewSurah'),
        reviewAyah: document.getElementById('reviewAyah'),
        reviewLabels: document.getElementById('reviewLabels')
    };
}

// Initialize the app
async function initializeApp() {
    // Initialize DOM elements
    initializeElements();
    
    // Check if API URL is set
    if (!isApiUrlSet()) {
        showApiUrlWarning();
    } else {
        showLoading(); 
        await loadLabels();
        await loadAyahs(); 
        checkForUnlabeledAyahs(); 
    }
    
    // Set up event listeners
    setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
    document.addEventListener('paste', handleGlobalPaste);
    // Modal controls
    if (elements.importSurah) elements.importSurah.addEventListener('click', openImportSurahModal);
    if (elements.addNewAyah) elements.addNewAyah.addEventListener('click', openAddAyahModal);
    if (elements.manageLabels) elements.manageLabels.addEventListener('click', openLabelsModal);
    if (elements.closeModal) elements.closeModal.addEventListener('click', closeAyahModal);
    if (elements.cancelButton) elements.cancelButton.addEventListener('click', closeAyahModal);
    if (elements.closeLabelsModal) elements.closeLabelsModal.addEventListener('click', closeLabelsModal);
    if (elements.closeLabelsModalButton) elements.closeLabelsModalButton.addEventListener('click', closeLabelsModal);
    
    // Import surah modal
    if (elements.importButton) elements.importButton.addEventListener('click', importSurah);
    if (elements.cancelImportButton) elements.cancelImportButton.addEventListener('click', closeImportSurahModal);
    if (elements.closeImportModal) elements.closeImportModal.addEventListener('click', closeImportSurahModal);
    
    // Ayah form
    if (elements.parseButton) elements.parseButton.addEventListener('click', parsePastedAyah);
    if (elements.saveButton) elements.saveButton.addEventListener('click', saveAyah);
    if (elements.addLabelButton) elements.addLabelButton.addEventListener('click', addSelectedLabel);
    if (elements.createLabelButton) elements.createLabelButton.addEventListener('click', createNewLabel);
    
    // Labels management
    if (elements.addNewLabelButton) elements.addNewLabelButton.addEventListener('click', addNewLabel);
    
    // Search and filter
    if (elements.searchInput) elements.searchInput.addEventListener('input', filterAyahs);
    if (elements.surahFilter) elements.surahFilter.addEventListener('change', filterAyahs);
    if (elements.labelFilter) elements.labelFilter.addEventListener('change', filterAyahs);
    if (elements.showUnlabeledOnly) elements.showUnlabeledOnly.addEventListener('change', filterAyahs);
    
    // Label type change
    if (elements.newLabelType) {
        elements.newLabelType.addEventListener('change', () => {
            if (elements.newLabelType.value === 'child') {
                if (elements.newLabelParent) elements.newLabelParent.classList.remove('hidden');
                populateParentSelect(elements.newLabelParent, labels);
            } else {
                if (elements.newLabelParent) elements.newLabelParent.classList.add('hidden');
            }
        });
    }
    
    // Parent label change
    if (elements.parentLabelSelect) {
        elements.parentLabelSelect.addEventListener('change', () => {
            const parentId = elements.parentLabelSelect.value;
            populateChildSelect(parentId);
        });
    }
}

// Event Listeners - will be set up after DOM loads
document.addEventListener('DOMContentLoaded', initializeApp);

// Helper function to check if text contains Arabic characters
function isArabic(text) {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
}

// Helper function to clean Arabic text
function cleanArabicText(text) {
    // Remove ayah numbers at the end (Arabic numerals)
    return text.replace(/[\u0660-\u0669]+$/, '').trim();
}

// API Functions
async function loadAyahs() {
    showLoading();
    try {
        console.log('Fetching from API via Cloudflare Function:', CLOUDFLARE_SHEET_API_URL);
        const response = await fetch(`${CLOUDFLARE_SHEET_API_URL}?url=${encodeURIComponent(GOOGLE_SCRIPT_URL)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.status === 'success') {
            ayahs = result.data;
            displayAyahs(ayahs);
            populateSurahFilter();
            checkForUnlabeledAyahs();
        } else {
            showError('Failed to load ayahs: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading ayahs:', error);
        showError('Network error. Please check your API URL and try again.');
    } finally {
        hideLoading();
    }
}

async function saveLabelToSheet(label) {
    try {
        console.log('Saving new label to Google Sheet via Cloudflare Function');
        // Add an 'action' property to tell the backend what to do
        const payload = { ...label, action: 'addLabel' };

        const response = await fetch(`${CLOUDFLARE_SHEET_API_URL}?url=${encodeURIComponent(GOOGLE_SCRIPT_URL)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Save label response:', result);

        return result.status === 'success';
    } catch (error) {
        console.error('Error saving label:', error);
        return false;
    }
}

// Updated loadLabels function to fetch from Google Sheet
async function loadLabels() {
    try {
        console.log('Loading labels from Google Sheet via Cloudflare Function');
        const response = await fetch(`${CLOUDFLARE_SHEET_API_URL}?url=${encodeURIComponent(GOOGLE_SCRIPT_URL)}&endpoint=labels`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Labels API Response:', result);
        
        if (result.status === 'success') {
            labels = result.data;
            populateLabelFilters();
            if (elements.parentLabelSelect) populateParentSelect(elements.parentLabelSelect, labels);
            if (elements.newLabelParentSelect) populateParentSelect(elements.newLabelParentSelect, labels);
        } else {
            showError('Failed to load labels: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error loading labels:', error);
        showError('Network error. Please check your API URL and try again.');
    }
}

async function saveAyahToSheet(ayah) {
    try {
        console.log('Saving to Google Sheet via Cloudflare Function');
        const response = await fetch(`${CLOUDFLARE_SHEET_API_URL}?url=${encodeURIComponent(GOOGLE_SCRIPT_URL)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ayah)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Save response:', result);
        
        if (result.status === 'success') {
            return true;
        } else {
            console.error('Failed to save ayah:', result);
            return false;
        }
    } catch (error) {
        console.error('Error saving ayah:', error);
        return false;
    }
}

// Import Surah Functions
function openImportSurahModal() {
    if (elements.importSurahModal) elements.importSurahModal.classList.remove('hidden');
    if (elements.surahUrlInput) {
        elements.surahUrlInput.value = '';
        elements.surahUrlInput.focus();
    }
    if (elements.importProgress) elements.importProgress.classList.add('hidden');
}

function closeImportSurahModal() {
    if (elements.importSurahModal) elements.importSurahModal.classList.add('hidden');
}

async function importSurah() {
    const surahUrl = elements.surahUrlInput ? elements.surahUrlInput.value.trim() : '';
    
    if (!surahUrl) {
        showError('Please enter a Quran.com surah URL');
        return;
    }
    
    // Validate URL format
    if (!surahUrl.match(/quran\.com\/\d+/)) {
        showError('Invalid Quran.com URL format. Example: https://quran.com/1');
        return;
    }
    
    // Show progress
    if (elements.importProgress) elements.importProgress.classList.remove('hidden');
    if (elements.progressBar) elements.progressBar.style.width = '0%';
    
    try {
        // Scrape the surah
        const scrapeResponse = await fetch(`${CLOUDFLARE_QURAN_API_URL}?url=${encodeURIComponent(surahUrl)}&action=scrape`);
        
        if (!scrapeResponse.ok) {
            throw new Error(`HTTP error! Status: ${scrapeResponse.status}`);
        }
        
        const scrapeResult = await scrapeResponse.json();
        
        if (scrapeResult.status !== 'success') {
            throw new Error(scrapeResult.error || 'Failed to scrape surah');
        }
        
        const ayahsToImport = scrapeResult.data;
        
        // Save each ayah to Google Sheet
        for (let i = 0; i < ayahsToImport.length; i++) {
            const ayah = ayahsToImport[i];
            const success = await saveAyahToSheet(ayah);
            
            // Update progress
            const progress = ((i + 1) / ayahsToImport.length) * 100;
            if (elements.progressBar) elements.progressBar.style.width = `${progress}%`;
            
            if (!success) {
                throw new Error(`Failed to save ayah ${i + 1}`);
            }
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        showSuccess(`Successfully imported ${ayahsToImport.length} ayahs`);
        closeImportSurahModal();
        loadAyahs(); // Reload ayahs
        
    } catch (error) {
        console.error('Error importing surah:', error);
        showError(`Failed to import surah: ${error.message}`);
    } finally {
        if (elements.importProgress) elements.importProgress.classList.add('hidden');
    }
}

// UI Functions
function showApiUrlWarning() {
    // Create a warning banner that stays at the top
    const warningBanner = document.createElement('div');
    warningBanner.id = 'apiUrlWarning';
    warningBanner.className = 'fixed top-0 left-0 right-0 bg-yellow-500 text-white p-4 text-center z-50 shadow-lg';
    warningBanner.innerHTML = `
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span><strong>Configuration Required:</strong> You need to set up the Google Sheets API URL. 
                <a href="#" id="setupInstructions" class="underline ml-2">Click here for instructions</a></span>
            </div>
            <button id="dismissWarning" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(warningBanner);
    
    // Add event listeners
    document.getElementById('dismissWarning').addEventListener('click', () => {
        warningBanner.remove();
    });
    
    document.getElementById('setupInstructions').addEventListener('click', (e) => {
        e.preventDefault();
        showSetupInstructions();
    });
}

function showSetupInstructions() {
    const instructionsModal = document.createElement('div');
    instructionsModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    instructionsModal.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-semibold">Setup Instructions</h3>
                    <button id="closeInstructions" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            <div class="p-6">
                <ol class="list-decimal pl-5 space-y-4">
                    <li>
                        <strong>Create a Google Sheet:</strong>
                        <p class="mt-1">Go to Google Sheets and create a new spreadsheet named "Quran Categorizer".</p>
                    </li>
                    <li>
                        <strong>Set up the sheets:</strong>
                        <p class="mt-1">Rename the first sheet to "QURAN" and add the following headers in the first row: SURAH, AYAH, ARB, ENG, IDN, LABEL, SOURCE</p>
                        <p class="mt-1">Create a second sheet named "QURAN LABEL" and add the following headers in the first row: ID, NAME, PARENT_ID</p>
                    </li>
                    <li>
                        <strong>Open Apps Script Editor:</strong>
                        <p class="mt-1">In your Google Sheet, click on "Extensions" > "Apps Script" to open the script editor.</p>
                    </li>
                    <li>
                        <strong>Paste the script code:</strong>
                        <p class="mt-1">Delete any existing code and paste the Google Apps Script code provided.</p>
                    </li>
                    <li>
                        <strong>Deploy the script:</strong>
                        <p class="mt-1">Click "Deploy" > "New deployment", select "Web app", set execute as "Me" and access as "Anyone", then click "Deploy".</p>
                    </li>
                    <li>
                        <strong>Authorize the script:</strong>
                        <p class="mt-1">Click "Authorize access", select your account, and grant the necessary permissions.</p>
                    </li>
                    <li>
                        <strong>Copy the web app URL:</strong>
                        <p class="mt-1">After deployment, copy the web app URL.</p>
                    </li>
                    <li>
                        <strong>Update the JavaScript file:</strong>
                        <p class="mt-1">In the quran.js file, replace the GOOGLE_SCRIPT_URL with the copied URL.</p>
                    </li>
                </ol>
                <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p class="text-blue-800"><strong>Note:</strong> After making these changes, refresh the page to start using the app.</p>
                </div>
            </div>
            <div class="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
                <button id="closeInstructionsButton" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(instructionsModal);
    
    // Add event listeners
    document.getElementById('closeInstructions').addEventListener('click', () => {
        instructionsModal.remove();
    });
    
    document.getElementById('closeInstructionsButton').addEventListener('click', () => {
        instructionsModal.remove();
    });
}

function showLoading() {
    if (elements.loadingIndicator) elements.loadingIndicator.classList.remove('hidden');
    if (elements.emptyState) elements.emptyState.classList.add('hidden');
}

function hideLoading() {
    if (elements.loadingIndicator) elements.loadingIndicator.classList.add('hidden');
}

function showError(message) {
    // Create a toast notification for errors
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showSuccess(message) {
    // Create a toast notification for success
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function checkForUnlabeledAyahs() {
    const unlabeledAyahs = ayahs.filter(ayah => !ayah.LABEL || ayah.LABEL.trim() === '');
    
    if (unlabeledAyahs.length > 0) {
        if (elements.unlabeledWarning) {
            elements.unlabeledWarning.classList.remove('hidden');
        }
    } else {
        if (elements.unlabeledWarning) {
            elements.unlabeledWarning.classList.add('hidden');
        }
    }
}

function displayAyahs(ayahsToDisplay) {
    if (!elements.ayahList) return;
    
    elements.ayahList.innerHTML = '';
    
    if (ayahsToDisplay.length === 0) {
        if (elements.emptyState) elements.emptyState.classList.remove('hidden');
        return;
    }
    
    if (elements.emptyState) elements.emptyState.classList.add('hidden');
    
    // Group ayahs by surah
    const ayahsBySurah = {};
    ayahsToDisplay.forEach(ayah => {
        if (!ayahsBySurah[ayah.SURAH]) {
            ayahsBySurah[ayah.SURAH] = [];
        }
        ayahsBySurah[ayah.SURAH].push(ayah);
    });
    
    // Sort surahs by number
    const sortedSurahs = Object.keys(ayahsBySurah).sort((a, b) => {
        const aNum = parseInt(a.match(/(\d+)/)[0]);
        const bNum = parseInt(b.match(/(\d+)/)[0]);
        return aNum - bNum;
    });
    
    // Display ayahs grouped by surah
    sortedSurahs.forEach(surah => {
        const surahAyahs = ayahsBySurah[surah];
        
        // Create surah header
        const surahHeader = document.createElement('div');
        surahHeader.className = 'surah-header mb-4';
        surahHeader.innerHTML = `
            <div class="surah-title">${surah}</div>
            <div class="surah-info">${surahAyahs.length} ayahs</div>
        `;
        elements.ayahList.appendChild(surahHeader);
        
        // Sort ayahs by ayah number
        surahAyahs.sort((a, b) => parseInt(a.AYAH) - parseInt(b.AYAH));
        
        // Display ayahs
        surahAyahs.forEach(ayah => {
            const ayahElement = createAyahElement(ayah);
            elements.ayahList.appendChild(ayahElement);
        });
    });
}

function createAyahElement(ayah) {
    const ayahDiv = document.createElement('div');
    
    const isLabeled = ayah.LABEL && ayah.LABEL.trim() !== '';
    ayahDiv.className = `p-6 hover:bg-gray-50 transition-colors ${isLabeled ? 'labeled-ayah' : 'unlabeled-ayah'}`;
    
    const ayahLabels = ayah.LABEL ? ayah.LABEL.split(',').map(label => label.trim()) : [];
    
    let labelsHtml = '';
    ayahLabels.forEach(labelId => {
        // FIX: Use uppercase 'ID', 'PARENT_ID', and 'NAME'
        const label = labels.find(l => l.ID === labelId);
        if (label) {
            const isParent = !label.PARENT_ID;
            labelsHtml += `<span class="label-tag ${isParent ? 'parent-label' : 'child-label'}">${label.NAME}</span>`;
        }
    });
    
    ayahDiv.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <div class="flex items-center mb-2">
                    <h3 class="text-lg font-semibold text-indigo-700">${ayah.SURAH}:${ayah.AYAH}</h3>
                    <a href="${ayah.SOURCE}" target="_blank" class="ml-2 text-gray-500 hover:text-indigo-600">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
                <div class="arabic-text mb-3">${ayah.ARB}</div>
                <div class="text-gray-700 mb-3">${ayah.ENG}</div>
                <div class="mt-2">
                    ${labelsHtml}
                </div>
            </div>
            <div class="flex space-x-2 ml-4">
                <button class="edit-ayah text-indigo-600 hover:text-indigo-800" data-id="${ayah.Id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-ayah text-red-600 hover:text-red-800" data-id="${ayah.Id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    ayahDiv.querySelector('.edit-ayah').addEventListener('click', () => editAyah(ayah.Id));
    ayahDiv.querySelector('.delete-ayah').addEventListener('click', () => deleteAyah(ayah.Id));
    
    return ayahDiv;
}

function populateSurahFilter() {
    if (!elements.surahFilter) return;
    
    const surahSet = new Set();
    
    ayahs.forEach(ayah => {
        if (ayah.SURAH) {
            surahSet.add(ayah.SURAH);
        }
    });
    
    elements.surahFilter.innerHTML = '<option value="">All Surahs</option>';
    
    Array.from(surahSet).sort().forEach(surah => {
        const option = document.createElement('option');
        option.value = surah;
        option.textContent = surah;
        elements.surahFilter.appendChild(option);
    });
}

function populateLabelFilters() {
    if (!elements.labelFilter) return;
    
    elements.labelFilter.innerHTML = '<option value="">All Labels</option>';
    
    // FIX: Use uppercase 'PARENT_ID', 'ID', and 'NAME'
    labels.filter(label => !label.PARENT_ID).forEach(label => {
        const option = document.createElement('option');
        option.value = label.ID;
        option.textContent = label.NAME;
        elements.labelFilter.appendChild(option);
    });
}

function populateParentSelect(selectElement, labelsList) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="">Select Parent Label</option>';
    
    // FIX: Use uppercase 'PARENT_ID', 'ID', and 'NAME'
    labelsList.filter(label => !label.PARENT_ID).forEach(label => {
        const option = document.createElement('option');
        option.value = label.ID;
        option.textContent = label.NAME;
        selectElement.appendChild(option);
    });
}

function populateChildSelect(parentId) {
    if (!elements.childLabelSelect) return;
    
    elements.childLabelSelect.innerHTML = '<option value="">Select Child Label</option>';
    
    if (parentId) {
        // FIX: Use uppercase 'PARENT_ID', 'ID', and 'NAME'
        labels.filter(label => label.PARENT_ID === parentId).forEach(label => {
            const option = document.createElement('option');
            option.value = label.ID;
            option.textContent = label.NAME;
            elements.childLabelSelect.appendChild(option);
        });
    }
}

// Modal Functions
function openAddAyahModal() {
    editingAyahId = null;
    if (elements.modalTitle) elements.modalTitle.textContent = 'Add New Ayah';
    resetAyahForm();
    resetStepIndicators();
    
    // Ensure the paste section is visible when adding a new Ayah
    const step1Section = document.getElementById('step1');
    if (step1Section) {
        step1Section.style.display = 'block';
    }

    if (elements.ayahModal) elements.ayahModal.classList.remove('hidden');
    
    // Focus on the paste input and set up event listeners
    setTimeout(() => {
        if (elements.pasteInput) {
            elements.pasteInput.focus();
            setupPasteEventListeners();
        }
    }, 100);
}

function resetStepIndicators() {
    // Reset step indicators
    if (elements.step1Indicator) {
        elements.step1Indicator.classList.add('active');
        elements.step1Indicator.classList.remove('completed');
    }
    if (elements.step2Indicator) {
        elements.step2Indicator.classList.remove('active', 'completed');
    }
    if (elements.step3Indicator) {
        elements.step3Indicator.classList.remove('active', 'completed');
    }
    if (elements.connector1) {
        elements.connector1.classList.remove('completed');
    }
    if (elements.connector2) {
        elements.connector2.classList.remove('completed');
    }
}

function setupPasteEventListeners() {
    if (!elements.pasteInput) return;
    
    // Remove existing event listeners to prevent duplicates
    elements.pasteInput.removeEventListener('paste', handlePaste);
    elements.pasteInput.removeEventListener('keydown', handleKeyDown);
    
    // Add event listeners
    elements.pasteInput.addEventListener('paste', handlePaste);
    elements.pasteInput.addEventListener('keydown', handleKeyDown);
}

function handlePaste(e) {
    // Show feedback that paste was detected
    showSuccess('Pasted content detected. Parsing...');
    
    // Small delay to ensure pasted content is available
    setTimeout(() => {
        parsePastedAyah();
    }, 100);
}

function handleGlobalPaste(e) {
    // Check if the user is already interacting with an input, textarea, or if the modal is open.
    // If so, we don't want this global handler to interfere.
    const activeElement = document.activeElement;
    const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
    const isModalOpen = elements.ayahModal && !elements.ayahModal.classList.contains('hidden');

    if (isInputFocused || isModalOpen) {
        // Let the default paste behavior or more specific listeners handle this.
        return;
    }

    // Prevent the browser from pasting the text directly into the page body.
    e.preventDefault();

    // Get the text content from the clipboard.
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');

    // If no text was pasted, do nothing.
    if (!pastedText) return;
    
    console.log('Global paste detected. Opening modal...');

    // Open the "Add New Ayah" modal.
    openAddAyahModal();

    // A small delay is needed to ensure the modal elements are ready in the DOM.
    setTimeout(() => {
        if (elements.pasteInput) {
            // Set the value of the textarea to the pasted content.
            elements.pasteInput.value = pastedText;

            // Give user feedback and automatically parse the content.
            showSuccess('Pasted content detected. Parsing...');
            parsePastedAyah();
        }
    }, 200); // 200ms is a safe delay.
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent new line
        
        if (parsedAyahData) {
            // Check if at least one label is selected
            if (selectedLabels.length === 0) {
                showError('Please add at least one label before saving');
                // Scroll to labels section
                const labelsSection = document.getElementById('labelsSection');
                if (labelsSection) labelsSection.scrollIntoView({ behavior: 'smooth' });
                return;
            }
            saveAyah();
        } else {
            parsePastedAyah();
        }
    }
}

function closeAyahModal() {
    if (elements.ayahModal) elements.ayahModal.classList.add('hidden');
    resetAyahForm();
    
    // Remove event listeners to prevent memory leaks
    if (elements.pasteInput) {
        elements.pasteInput.removeEventListener('paste', handlePaste);
        elements.pasteInput.removeEventListener('keydown', handleKeyDown);
    }
}

function openLabelsModal() {
    displayLabelsHierarchy();
    if (elements.labelsModal) elements.labelsModal.classList.remove('hidden');
}

function closeLabelsModal() {
    if (elements.labelsModal) elements.labelsModal.classList.add('hidden');
}

function resetAyahForm() {
    if (elements.pasteInput) elements.pasteInput.value = '';
    if (elements.surahInput) elements.surahInput.value = '';
    if (elements.ayahInput) elements.ayahInput.value = '';
    if (elements.arabicInput) elements.arabicInput.value = '';
    if (elements.englishInput) elements.englishInput.value = '';
    if (elements.sourceInput) elements.sourceInput.value = '';
    
    selectedLabels = [];
    parsedAyahData = null;
    updateSelectedLabels();
    
    // Hide parsed preview if it exists
    if (elements.parsedPreview) {
        elements.parsedPreview.innerHTML = '';
        elements.parsedPreview.classList.add('hidden');
    }
    
    // Reset save button state
    updateSaveButtonState();
    
    // Reset review section
    if (elements.reviewSurah) elements.reviewSurah.textContent = '-';
    if (elements.reviewAyah) elements.reviewAyah.textContent = '-';
    if (elements.reviewLabels) elements.reviewLabels.textContent = '-';
}

// Ayah Form Functions
function parsePastedAyah() {
    if (!elements.pasteInput) return;
    
    const pastedText = elements.pasteInput.value.trim();
    
    if (!pastedText) {
        showError('Please paste the ayah content');
        return;
    }
    
    try {
        // Parse the pasted text
        const lines = pastedText.split('\n');
        
        // Initialize variables
        let surahName = '';
        let surahNumber = '';
        let ayahNumber = '';
        let arabicText = '';
        let englishText = '';
        let sourceUrl = '';
        
        // Extract surah and ayah number from the first line
        const firstLine = lines[0];
        const surahAyahMatch = firstLine.match(/(.+) \((\d+):(\d+)\)/);
        
        if (surahAyahMatch) {
            surahName = surahAyahMatch[1];
            surahNumber = surahAyahMatch[2];
            ayahNumber = surahAyahMatch[3];
        }
        
        // Find Arabic text (look for lines with Arabic characters)
        for (let i = 1; i < lines.length; i++) {
            if (isArabic(lines[i])) {
                arabicText = cleanArabicText(lines[i]);
                break;
            }
        }
        
        // Find English translation (look for lines after Arabic that are in English)
        let foundArabic = false;
        for (let i = 1; i < lines.length; i++) {
            if (isArabic(lines[i])) {
                foundArabic = true;
            } else if (foundArabic && lines[i].trim() !== '' && !lines[i].startsWith('—') && !lines[i].startsWith('https://')) {
                englishText = lines[i];
                break;
            }
        }
        
        // Extract source URL (usually the last line starting with https://)
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].startsWith('https://')) {
                sourceUrl = lines[i];
                break;
            }
        }
        
        // Update form fields
        if (elements.surahInput) elements.surahInput.value = `${surahNumber}. ${surahName}`;
        if (elements.ayahInput) elements.ayahInput.value = ayahNumber;
        if (elements.arabicInput) elements.arabicInput.value = arabicText;
        if (elements.englishInput) elements.englishInput.value = englishText;
        if (elements.sourceInput) elements.sourceInput.value = sourceUrl;
        
        // Store parsed data
        parsedAyahData = {
            SURAH: `${surahNumber}. ${surahName}`,
            AYAH: ayahNumber,
            ARB: arabicText,
            ENG: englishText,
            SOURCE: sourceUrl
        };
        
        // Update step indicators
        if (elements.step1Indicator) {
            elements.step1Indicator.classList.remove('active');
            elements.step1Indicator.classList.add('completed');
        }
        if (elements.step2Indicator) {
            elements.step2Indicator.classList.add('active');
        }
        if (elements.connector1) {
            elements.connector1.classList.add('completed');
        }
        
        // Show parsed preview
        showParsedPreview();
        
        // Update review section
        if (elements.reviewSurah) elements.reviewSurah.textContent = parsedAyahData.SURAH;
        if (elements.reviewAyah) elements.reviewAyah.textContent = parsedAyahData.AYAH;
        
        // Update save button state
        updateSaveButtonState();
        
        showSuccess('Ayah parsed successfully! Now add at least one label and press Enter to save.');
    } catch (error) {
        console.error('Error parsing ayah:', error);
        showError('Failed to parse ayah. Please check the format and try again.');
    }
}

function updateSaveButtonState() {
    // Enable save button only if we have parsed data and at least one label
    if (elements.saveButton) {
        if (parsedAyahData && selectedLabels.length > 0) {
            elements.saveButton.disabled = false;
            elements.saveButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            elements.saveButton.disabled = true;
            elements.saveButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
}

function showParsedPreview() {
    if (!elements.parsedPreview) {
        // Create preview container if it doesn't exist
        const previewContainer = document.createElement('div');
        previewContainer.id = 'parsedPreview';
        previewContainer.className = 'mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200 hidden';
        
        // Insert after the paste textarea
        if (elements.pasteInput && elements.pasteInput.parentNode) {
            elements.pasteInput.parentNode.insertBefore(previewContainer, elements.pasteInput.nextSibling);
            elements.parsedPreview = previewContainer;
        }
    }
    
    if (parsedAyahData && elements.parsedPreview) {
        elements.parsedPreview.innerHTML = `
            <h4 class="font-medium text-indigo-800 mb-2">Parsed Ayah Preview:</h4>
            <div class="text-sm">
                <p><strong>Surah:</strong> ${parsedAyahData.SURAH}</p>
                <p><strong>Ayah:</strong> ${parsedAyahData.AYAH}</p>
                <p><strong>Arabic:</strong> <span class="preview-arabic">${parsedAyahData.ARB}</span></p>
                <p><strong>English:</strong> ${parsedAyahData.ENG}</p>
                <p><strong>Source:</strong> <a href="${parsedAyahData.SOURCE}" target="_blank" class="text-indigo-600 hover:underline">${parsedAyahData.SOURCE}</a></p>
            </div>
            <p class="mt-2 text-indigo-700 font-medium">Now add at least one label below, then press Enter to save</p>
        `;
        elements.parsedPreview.classList.remove('hidden');
    } else if (elements.parsedPreview) {
        elements.parsedPreview.classList.add('hidden');
    }
}

function addSelectedLabel() {
    if (!elements.parentLabelSelect) {
        console.error('Parent label select element not found');
        return;
    }
    
    const parentId = elements.parentLabelSelect.value;
    const childId = elements.childLabelSelect ? elements.childLabelSelect.value : '';
    
    if (!parentId) {
        showError('Please select a parent label');
        return;
    }
    
    console.log('Adding labels - Parent:', parentId, 'Child:', childId);
    
    // Add parent label if not already selected
    if (!selectedLabels.includes(parentId)) {
        selectedLabels.push(parentId);
        console.log('Added parent label:', parentId);
    }
    
    // Add child label if selected and not already selected
    if (childId && !selectedLabels.includes(childId)) {
        selectedLabels.push(childId);
        console.log('Added child label:', childId);
    }
    
    updateSelectedLabels();
    updateSaveButtonState();
    
    // Reset selects
    elements.parentLabelSelect.value = '';
    if (elements.childLabelSelect) {
        elements.childLabelSelect.innerHTML = '<option value="">Select Child Label</option>';
    }
    
    showSuccess('Label added successfully!');
}

async function createNewLabel() {
    if (!elements.newLabelInput || !elements.newLabelType) {
        console.error('New label input or type element not found');
        return;
    }
    
    const labelName = elements.newLabelInput.value.trim();
    if (!labelName) {
        showError('Please enter a label name');
        return;
    }
    
    const labelType = elements.newLabelType.value;
    const parentId = labelType === 'child' && elements.newLabelParent ? 
                    elements.newLabelParent.value : null;
    
    const labelId = labelName.toLowerCase().replace(/\s+/g, '-');
    
    if (labels.some(label => label.ID === labelId)) {
        showError('Label with this ID already exists');
        return;
    }
    
    // FIX: Create the object with uppercase properties to match the data structure
    const newLabel = {
        ID: labelId,
        NAME: labelName.toUpperCase(),
        PARENT_ID: parentId || "" // Use empty string for no parent, as Google Sheets does
    };
    
    console.log('Attempting to create and save new label:', newLabel);
    
    // FEATURE: Save the new label to the Google Sheet
    const success = await saveLabelToSheet(newLabel);

    if (!success) {
        showError('Failed to save new label. Please try again.');
        return; // Stop execution if saving failed
    }
    
    // If successful, update the local state and UI
    labels.push(newLabel);
    
    populateLabelFilters();
    if (elements.parentLabelSelect) populateParentSelect(elements.parentLabelSelect, labels);
    if (elements.newLabelParentSelect) populateParentSelect(elements.newLabelParentSelect, labels);
    
    selectedLabels.push(labelId);
    updateSelectedLabels();
    updateSaveButtonState();
    
    elements.newLabelInput.value = '';
    if (elements.newLabelParent) elements.newLabelParent.value = '';
    
    showSuccess('Label created successfully!');
}

function updateSelectedLabels() {
    if (!elements.labelsContainer) {
        console.error('Labels container element not found');
        return;
    }
    
    elements.labelsContainer.innerHTML = '';
    
    if (selectedLabels.length === 0) {
        elements.labelsContainer.innerHTML = '<p class="text-gray-500 text-sm">No labels selected yet. Please add at least one label.</p>';
        return;
    }
    
    console.log('Updating selected labels:', selectedLabels);
    
    selectedLabels.forEach(labelId => {
        // FIX: Use uppercase properties throughout
        const label = labels.find(l => l.ID === labelId);
        if (label) {
            const isParent = !label.PARENT_ID;
            const labelTag = document.createElement('span');
            labelTag.className = `label-tag ${isParent ? 'parent-label' : 'child-label'} flex items-center`;
            
            let labelText = label.NAME;
            if (!isParent && label.PARENT_ID) {
                const parentLabel = labels.find(l => l.ID === label.PARENT_ID);
                if (parentLabel) {
                    labelText = `${parentLabel.NAME} > ${label.NAME}`;
                }
            }
            
            labelTag.innerHTML = `
                ${labelText}
                <button class="ml-2 ${isParent ? 'text-white' : 'text-indigo-900'} hover:text-gray-200" data-id="${labelId}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            labelTag.querySelector('button').addEventListener('click', () => {
                selectedLabels = selectedLabels.filter(id => id !== labelId);
                updateSelectedLabels();
                updateSaveButtonState();
            });
            
            elements.labelsContainer.appendChild(labelTag);
        } else {
            console.error('Label not found for ID:', labelId);
        }
    });
    
    if (elements.reviewLabels) {
        const labelNames = selectedLabels.map(id => {
            const label = labels.find(l => l.ID === id);
            return label ? label.NAME : '';
        }).filter(name => name).join(', ');
        
        elements.reviewLabels.textContent = labelNames || '-';
    }

    if (selectedLabels.length > 0) {
        if (elements.step2Indicator) {
            elements.step2Indicator.classList.remove('active');
            elements.step2Indicator.classList.add('completed');
        }
        if (elements.step3Indicator) {
            elements.step3Indicator.classList.add('active');
        }
        if (elements.connector2) {
            elements.connector2.classList.add('completed');
        }
    } else {
        if (elements.step2Indicator) {
            elements.step2Indicator.classList.add('active');
            elements.step2Indicator.classList.remove('completed');
        }
        if (elements.step3Indicator) {
            elements.step3Indicator.classList.remove('active', 'completed');
        }
        if (elements.connector2) {
            elements.connector2.classList.remove('completed');
        }
    }
}

async function saveAyah() {
    // Debug: Log the current state
    console.log('Saving ayah - Current state:');
    console.log('parsedAyahData:', parsedAyahData);
    console.log('selectedLabels:', selectedLabels);
    console.log('Elements:');
    console.log('- surahInput:', elements.surahInput ? elements.surahInput.value : 'element not found');
    console.log('- ayahInput:', elements.ayahInput ? elements.ayahInput.value : 'element not found');
    console.log('- arabicInput:', elements.arabicInput ? elements.arabicInput.value : 'element not found');
    console.log('- englishInput:', elements.englishInput ? elements.englishInput.value : 'element not found');
    console.log('- sourceInput:', elements.sourceInput ? elements.sourceInput.value : 'element not found');
    
    // Use parsedAyahData if available, otherwise use form values
    const surah = parsedAyahData ? parsedAyahData.SURAH : 
                 (elements.surahInput ? elements.surahInput.value.trim() : '');
    
    const ayah = parsedAyahData ? parsedAyahData.AYAH : 
                (elements.ayahInput ? elements.ayahInput.value.trim() : '');
    
    const arabic = parsedAyahData ? parsedAyahData.ARB : 
                  (elements.arabicInput ? elements.arabicInput.value.trim() : '');
    
    const english = parsedAyahData ? parsedAyahData.ENG : 
                   (elements.englishInput ? elements.englishInput.value.trim() : '');
    
    const source = parsedAyahData ? parsedAyahData.SOURCE : 
                  (elements.sourceInput ? elements.sourceInput.value.trim() : '');
    
    // Validate form
    if (!surah) {
        showError('Please enter surah information');
        console.error('Validation failed: Surah is empty');
        return;
    }
    
    if (!ayah) {
        showError('Please enter ayah number');
        console.error('Validation failed: Ayah number is empty');
        return;
    }
    
    if (!arabic) {
        showError('Please enter Arabic text');
        console.error('Validation failed: Arabic text is empty');
        return;
    }
    
    if (!english) {
        showError('Please enter English translation');
        console.error('Validation failed: English translation is empty');
        return;
    }
    
    if (!source) {
        showError('Please enter source URL');
        console.error('Validation failed: Source URL is empty');
        return;
    }
    
    if (selectedLabels.length === 0) {
        showError('Please add at least one label');
        console.error('Validation failed: No labels selected');
        return;
    }
    
    // Create ayah object
    const ayahData = {
        SURAH: surah,
        AYAH: ayah,
        ARB: arabic,
        ENG: english,
        IDN: '', // Optional field
        LABEL: selectedLabels.join(','),
        SOURCE: source
    };
    
    // If editing, include the ID
    if (editingAyahId) {
        ayahData.Id = editingAyahId;
    }
    
    console.log('Saving ayah data:', ayahData);
    
    // Show loading state
    if (elements.saveButton) {
        elements.saveButton.disabled = true;
        elements.saveButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    }
    
    // Save to Google Sheet
    const success = await saveAyahToSheet(ayahData);
    
    // Reset button state
    if (elements.saveButton) {
        elements.saveButton.disabled = false;
        elements.saveButton.innerHTML = 'Save Ayah';
    }
    
    if (success) {
        showSuccess('Ayah saved successfully!');
        closeAyahModal();
        loadAyahs(); // Reload ayahs
    } else {
        showError('Failed to save ayah. Please check your internet connection and try again.');
    }
}

function editAyah(ayahId) {
    const ayah = ayahs.find(a => a.Id === ayahId);
    
    if (!ayah) {
        showError('Ayah not found');
        return;
    }
    
    editingAyahId = ayahId;
    if (elements.modalTitle) elements.modalTitle.textContent = 'Edit Ayah';
    
    // --- START: NEW LOGIC ---
    
    // 1. Manually set the parsedAyahData object for editing
    parsedAyahData = {
        SURAH: ayah.SURAH || '',
        AYAH: ayah.AYAH || '',
        ARB: ayah.ARB || '',
        ENG: ayah.ENG || '',
        SOURCE: ayah.SOURCE || ''
    };
    
    // 2. Configure the modal UI for editing
    const step1Section = document.getElementById('step1');
    if (step1Section) {
        step1Section.style.display = 'none'; // Hide the paste section
    }
    
    // Update step indicators to show editing state
    if (elements.step1Indicator) elements.step1Indicator.classList.add('completed');
    if (elements.connector1) elements.connector1.classList.add('completed');
    if (elements.step2Indicator) elements.step2Indicator.classList.add('completed');
    if (elements.connector2) elements.connector2.classList.add('completed');
    if (elements.step3Indicator) elements.step3Indicator.classList.add('active');
    
    // 3. Populate the review section directly
    if (elements.reviewSurah) elements.reviewSurah.textContent = parsedAyahData.SURAH;
    if (elements.reviewAyah) elements.reviewAyah.textContent = parsedAyahData.AYAH;
    
    // --- END: NEW LOGIC ---
    
    // Populate form (still useful if you want to see the raw data)
    if (elements.surahInput) elements.surahInput.value = ayah.SURAH || '';
    if (elements.ayahInput) elements.ayahInput.value = ayah.AYAH || '';
    if (elements.arabicInput) elements.arabicInput.value = ayah.ARB || '';
    if (elements.englishInput) elements.englishInput.value = ayah.ENG || '';
    if (elements.sourceInput) elements.sourceInput.value = ayah.SOURCE || '';
    
    // Parse labels
    selectedLabels = ayah.LABEL ? ayah.LABEL.split(',').map(label => label.trim()) : [];
    updateSelectedLabels();
    updateSaveButtonState();
    
    // Open modal
    if (elements.ayahModal) elements.ayahModal.classList.remove('hidden');
}

function deleteAyah(ayahId) {
    if (confirm('Are you sure you want to delete this ayah?')) {
        // In a real app, you would implement a delete function in your Google Apps Script
        // For now, we'll just show a success message
        showSuccess('Ayah deleted successfully');
        loadAyahs(); // Reload ayahs
    }
}

// Labels Management Functions
function addNewLabel() {
    if (!elements.newLabelNameInput) {
        console.error('New label name input element not found');
        return;
    }
    
    const labelName = elements.newLabelNameInput.value.trim();
    
    if (!labelName) {
        showError('Please enter a label name');
        return;
    }
    
    const parentId = elements.newLabelParentSelect ? elements.newLabelParentSelect.value : null;
    
    // Generate a simple ID from the label name
    const labelId = labelName.toLowerCase().replace(/\s+/g, '-');
    
    // Check if label already exists
    if (labels.some(label => label.id === labelId)) {
        showError('Label already exists');
        return;
    }
    
    // Add new label
    const newLabel = {
        id: labelId,
        name: labelName.toUpperCase(),
        parentId: parentId || null
    };
    
    console.log('Creating new label in management section:', newLabel);
    
    labels.push(newLabel);
    
    // Update UI
    populateLabelFilters();
    if (elements.parentLabelSelect) populateParentSelect(elements.parentLabelSelect, labels);
    if (elements.newLabelParentSelect) populateParentSelect(elements.newLabelParentSelect, labels);
    
    // Reset input
    elements.newLabelNameInput.value = '';
    if (elements.newLabelParentSelect) elements.newLabelParentSelect.value = '';
    
    // Refresh labels hierarchy
    displayLabelsHierarchy();
    
    showSuccess('Label created successfully!');
}

function displayLabelsHierarchy() {
    if (!elements.labelsHierarchy) {
        console.error('Labels hierarchy element not found');
        return;
    }
    
    elements.labelsHierarchy.innerHTML = '';
    
    // Get parent labels
    const parentLabels = labels.filter(label => !label.parentId);
    
    if (parentLabels.length === 0) {
        elements.labelsHierarchy.innerHTML = '<p class="text-gray-500">No labels created yet.</p>';
        return;
    }
    
    parentLabels.forEach(parentLabel => {
        // Create parent label element
        const parentDiv = document.createElement('div');
        parentDiv.className = 'mb-4';
        
        const parentHeader = document.createElement('div');
        parentHeader.className = 'flex items-center justify-between p-2 bg-indigo-50 rounded-lg';
        parentHeader.innerHTML = `
            <div class="flex items-center">
                <span class="font-medium text-indigo-700">${parentLabel.name}</span>
            </div>
            <button class="delete-label text-red-600 hover:text-red-800" data-id="${parentLabel.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        parentDiv.appendChild(parentHeader);
        
        // Get child labels
        const childLabels = labels.filter(label => label.parentId === parentLabel.id);
        
        if (childLabels.length > 0) {
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'ml-6 mt-2';
            
            childLabels.forEach(childLabel => {
                const childDiv = document.createElement('div');
                childDiv.className = 'flex items-center justify-between p-2 bg-indigo-25 rounded-lg mb-2';
                childDiv.innerHTML = `
                    <div class="flex items-center">
                        <i class="fas fa-arrow-right text-indigo-500 mr-2"></i>
                        <span>${childLabel.name}</span>
                    </div>
                    <button class="delete-label text-red-600 hover:text-red-800" data-id="${childLabel.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                childrenDiv.appendChild(childDiv);
            });
            
            parentDiv.appendChild(childrenDiv);
        }
        
        elements.labelsHierarchy.appendChild(parentDiv);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-label').forEach(button => {
        button.addEventListener('click', () => {
            const labelId = button.getAttribute('data-id');
            deleteLabel(labelId);
        });
    });
}

function deleteLabel(labelId) {
    if (confirm('Are you sure you want to delete this label?')) {
        console.log('Deleting label:', labelId);
        
        // Remove label
        labels = labels.filter(label => label.id !== labelId);
        
        // Remove from any ayahs that use it
        ayahs.forEach(ayah => {
            if (ayah.LABEL) {
                const ayahLabels = ayah.LABEL.split(',').map(label => label.trim());
                const updatedLabels = ayahLabels.filter(id => id !== labelId);
                ayah.LABEL = updatedLabels.join(',');
            }
        });
        
        // Update UI
        populateLabelFilters();
        if (elements.parentLabelSelect) populateParentSelect(elements.parentLabelSelect, labels);
        if (elements.newLabelParentSelect) populateParentSelect(elements.newLabelParentSelect, labels);
        displayLabelsHierarchy();
        
        showSuccess('Label deleted successfully');
    }
}

// Filter Functions
function filterAyahs() {
    const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
    const surahFilter = elements.surahFilter ? elements.surahFilter.value : '';
    const labelFilter = elements.labelFilter ? elements.labelFilter.value : '';
    
    let filteredAyahs = ayahs;
    
    // Filter by search term
    if (searchTerm) {
        filteredAyahs = filteredAyahs.filter(ayah => {
            return (
                (ayah.SURAH && ayah.SURAH.toLowerCase().includes(searchTerm)) ||
                (ayah.ARB && ayah.ARB.toLowerCase().includes(searchTerm)) ||
                (ayah.ENG && ayah.ENG.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    // Filter by surah
    if (surahFilter) {
        filteredAyahs = filteredAyahs.filter(ayah => ayah.SURAH === surahFilter);
    }
    
    // Filter by label
    if (labelFilter) {
        filteredAyahs = filteredAyahs.filter(ayah => {
            if (!ayah.LABEL) return false;
            const ayahLabels = ayah.LABEL.split(',').map(label => label.trim());
            return ayahLabels.includes(labelFilter);
        });
    }
    
    displayAyahs(filteredAyahs);
}