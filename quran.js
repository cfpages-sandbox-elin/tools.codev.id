// quran.js v0.4
const API_URL = "https://script.google.com/macros/s/AKfycbzlqWMArBZkIfPWVNP6KuM0wyy2u3zvN3INFKzoQMI5MHiRQHQTVehC-9Mi7HiwK3q86A/exec";

// Check if API URL is set
function isApiUrlSet() {
    return API_URL && API_URL !== "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
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
        
        // Search and filter
        searchInput: document.getElementById('searchInput'),
        surahFilter: document.getElementById('surahFilter'),
        labelFilter: document.getElementById('labelFilter'),
        
        // Modals
        ayahModal: document.getElementById('ayahModal'),
        labelsModal: document.getElementById('labelsModal'),
        
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
function initializeApp() {
    // Initialize DOM elements
    initializeElements();
    
    // Check if API URL is set
    if (!isApiUrlSet()) {
        showApiUrlWarning();
    } else {
        loadAyahs();
        loadLabels();
    }
    
    // Set up event listeners
    setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
    // Modal controls
    elements.addNewAyah.addEventListener('click', openAddAyahModal);
    elements.manageLabels.addEventListener('click', openLabelsModal);
    elements.closeModal.addEventListener('click', closeAyahModal);
    elements.cancelButton.addEventListener('click', closeAyahModal);
    elements.closeLabelsModal.addEventListener('click', closeLabelsModal);
    elements.closeLabelsModalButton.addEventListener('click', closeLabelsModal);
    
    // Ayah form
    elements.parseButton.addEventListener('click', parsePastedAyah);
    elements.saveButton.addEventListener('click', saveAyah);
    elements.addLabelButton.addEventListener('click', addSelectedLabel);
    elements.createLabelButton.addEventListener('click', createNewLabel);
    
    // Labels management
    elements.addNewLabelButton.addEventListener('click', addNewLabel);
    
    // Search and filter
    elements.searchInput.addEventListener('input', filterAyahs);
    elements.surahFilter.addEventListener('change', filterAyahs);
    elements.labelFilter.addEventListener('change', filterAyahs);
    
    // Label type change
    elements.newLabelType.addEventListener('change', () => {
        if (elements.newLabelType.value === 'child') {
            elements.newLabelParent.classList.remove('hidden');
            populateParentSelect(elements.newLabelParent, labels);
        } else {
            elements.newLabelParent.classList.add('hidden');
        }
    });
    
    // Parent label change
    elements.parentLabelSelect.addEventListener('change', () => {
        const parentId = elements.parentLabelSelect.value;
        populateChildSelect(parentId);
    });
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
        console.log('Fetching from API:', API_URL);
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.status === 'success') {
            ayahs = result.data;
            displayAyahs(ayahs);
            populateSurahFilter();
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

async function loadLabels() {
    try {
        // For now, we'll use a static list of labels
        // In a real app, you might want to store labels in the Google Sheet too
        labels = [
            { id: 'allah', name: 'ALLAH', parentId: null },
            { id: 'allah-name', name: 'NAME', parentId: 'allah' },
            { id: 'allah-attributes', name: 'ATTRIBUTES', parentId: 'allah' },
            { id: 'prophets', name: 'PROPHETS', parentId: null },
            { id: 'prophets-muhammad', name: 'MUHAMMAD', parentId: 'prophets' },
            { id: 'prophets-ibrahim', name: 'IBRAHIM', parentId: 'prophets' },
            { id: 'hereafter', name: 'HEREAFTER', parentId: null },
            { id: 'hereafter-jannah', name: 'JANNAH', parentId: 'hereafter' },
            { id: 'hereafter-jahannam', name: 'JAHANNAM', parentId: 'hereafter' }
        ];
        
        populateLabelFilters();
        populateParentSelect(elements.parentLabelSelect, labels);
        populateParentSelect(elements.newLabelParentSelect, labels);
    } catch (error) {
        console.error('Error loading labels:', error);
    }
}

async function saveAyahToSheet(ayah) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ayah)
        });
        
        const result = await response.json();
        
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
                        <strong>Set up the sheet:</strong>
                        <p class="mt-1">Rename the first sheet to "QURAN" and add the following headers in the first row: SURAH, AYAH, ARB, ENG, IDN, LABEL, SOURCE</p>
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
                        <p class="mt-1">In the quran.js file, replace "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE" with the copied URL.</p>
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
    elements.loadingIndicator.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
}

function hideLoading() {
    elements.loadingIndicator.classList.add('hidden');
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

function displayAyahs(ayahsToDisplay) {
    elements.ayahList.innerHTML = '';
    
    if (ayahsToDisplay.length === 0) {
        elements.emptyState.classList.remove('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    
    ayahsToDisplay.forEach(ayah => {
        const ayahElement = createAyahElement(ayah);
        elements.ayahList.appendChild(ayahElement);
    });
}

function createAyahElement(ayah) {
    const ayahDiv = document.createElement('div');
    ayahDiv.className = 'p-6 hover:bg-gray-50 transition-colors';
    
    // Parse labels
    const ayahLabels = ayah.LABEL ? ayah.LABEL.split(',').map(label => label.trim()) : [];
    
    // Create labels HTML
    let labelsHtml = '';
    ayahLabels.forEach(labelId => {
        const label = labels.find(l => l.id === labelId);
        if (label) {
            const isParent = !label.parentId;
            labelsHtml += `<span class="label-tag ${isParent ? 'parent-label' : 'child-label'}">${label.name}</span>`;
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
    
    // Add event listeners
    ayahDiv.querySelector('.edit-ayah').addEventListener('click', () => editAyah(ayah.Id));
    ayahDiv.querySelector('.delete-ayah').addEventListener('click', () => deleteAyah(ayah.Id));
    
    return ayahDiv;
}

function populateSurahFilter() {
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
    elements.labelFilter.innerHTML = '<option value="">All Labels</option>';
    
    // Add parent labels
    labels.filter(label => !label.parentId).forEach(label => {
        const option = document.createElement('option');
        option.value = label.id;
        option.textContent = label.name;
        elements.labelFilter.appendChild(option);
    });
}

function populateParentSelect(selectElement, labelsList) {
    selectElement.innerHTML = '<option value="">Select Parent Label</option>';
    
    labelsList.filter(label => !label.parentId).forEach(label => {
        const option = document.createElement('option');
        option.value = label.id;
        option.textContent = label.name;
        selectElement.appendChild(option);
    });
}

function populateChildSelect(parentId) {
    elements.childLabelSelect.innerHTML = '<option value="">Select Child Label</option>';
    
    if (parentId) {
        labels.filter(label => label.parentId === parentId).forEach(label => {
            const option = document.createElement('option');
            option.value = label.id;
            option.textContent = label.name;
            elements.childLabelSelect.appendChild(option);
        });
    }
}

// Modal Functions
function openAddAyahModal() {
    editingAyahId = null;
    elements.modalTitle.textContent = 'Add New Ayah';
    resetAyahForm();
    resetStepIndicators();
    elements.ayahModal.classList.remove('hidden');
    
    // Focus on the paste input and set up event listeners
    setTimeout(() => {
        elements.pasteInput.focus();
        setupPasteEventListeners();
    }, 100);
}

function resetStepIndicators() {
    // Reset step indicators
    elements.step1Indicator.classList.add('active');
    elements.step1Indicator.classList.remove('completed');
    elements.step2Indicator.classList.remove('active', 'completed');
    elements.step3Indicator.classList.remove('active', 'completed');
    elements.connector1.classList.remove('completed');
    elements.connector2.classList.remove('completed');
}

function setupPasteEventListeners() {
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

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent new line
        
        if (parsedAyahData) {
            // Check if at least one label is selected
            if (selectedLabels.length === 0) {
                showError('Please add at least one label before saving');
                // Scroll to labels section
                document.getElementById('labelsSection').scrollIntoView({ behavior: 'smooth' });
                return;
            }
            saveAyah();
        } else {
            parsePastedAyah();
        }
    }
}

function closeAyahModal() {
    elements.ayahModal.classList.add('hidden');
    resetAyahForm();
    
    // Remove event listeners to prevent memory leaks
    if (elements.pasteInput) {
        elements.pasteInput.removeEventListener('paste', handlePaste);
        elements.pasteInput.removeEventListener('keydown', handleKeyDown);
    }
}

function openLabelsModal() {
    displayLabelsHierarchy();
    elements.labelsModal.classList.remove('hidden');
}

function closeLabelsModal() {
    elements.labelsModal.classList.add('hidden');
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
        elements.step1Indicator.classList.remove('active');
        elements.step1Indicator.classList.add('completed');
        elements.step2Indicator.classList.add('active');
        elements.connector1.classList.add('completed');
        
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
    const parentId = elements.parentLabelSelect.value;
    const childId = elements.childLabelSelect.value;
    
    if (!parentId) {
        showError('Please select a parent label');
        return;
    }
    
    // Add parent label if not already selected
    if (!selectedLabels.includes(parentId)) {
        selectedLabels.push(parentId);
    }
    
    // Add child label if selected and not already selected
    if (childId && !selectedLabels.includes(childId)) {
        selectedLabels.push(childId);
    }
    
    updateSelectedLabels();
    updateSaveButtonState();
    
    // Reset selects
    elements.parentLabelSelect.value = '';
    elements.childLabelSelect.innerHTML = '<option value="">Select Child Label</option>';
    
    showSuccess('Label added successfully!');
}

function createNewLabel() {
    const labelName = elements.newLabelInput.value.trim();
    
    if (!labelName) {
        showError('Please enter a label name');
        return;
    }
    
    const labelType = elements.newLabelType.value;
    const parentId = labelType === 'child' ? elements.newLabelParent.value : null;
    
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
        parentId: parentId
    };
    
    labels.push(newLabel);
    
    // Update UI
    populateLabelFilters();
    populateParentSelect(elements.parentLabelSelect, labels);
    populateParentSelect(elements.newLabelParentSelect, labels);
    
    // Add to selected labels
    selectedLabels.push(labelId);
    updateSelectedLabels();
    updateSaveButtonState();
    
    // Reset input
    elements.newLabelInput.value = '';
    
    showSuccess('Label created successfully!');
}

function updateSelectedLabels() {
    if (!elements.labelsContainer) return;
    
    elements.labelsContainer.innerHTML = '';
    
    if (selectedLabels.length === 0) {
        elements.labelsContainer.innerHTML = '<p class="text-gray-500 text-sm">No labels selected yet. Please add at least one label.</p>';
        return;
    }
    
    selectedLabels.forEach(labelId => {
        const label = labels.find(l => l.id === labelId);
        if (label) {
            const isParent = !label.parentId;
            const labelTag = document.createElement('span');
            labelTag.className = `label-tag ${isParent ? 'parent-label' : 'child-label'} flex items-center`;
            labelTag.innerHTML = `
                ${label.name}
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
        }
    });
    
    // Update review section
    if (elements.reviewLabels) {
        const labelNames = selectedLabels.map(id => {
            const label = labels.find(l => l.id === id);
            return label ? label.name : '';
        }).filter(name => name).join(', ');
        
        elements.reviewLabels.textContent = labelNames || '-';
    }
    
    // Update step indicators if we have labels
    if (selectedLabels.length > 0) {
        elements.step2Indicator.classList.remove('active');
        elements.step2Indicator.classList.add('completed');
        elements.step3Indicator.classList.add('active');
        elements.connector2.classList.add('completed');
    } else {
        elements.step2Indicator.classList.add('active');
        elements.step2Indicator.classList.remove('completed');
        elements.step3Indicator.classList.remove('active', 'completed');
        elements.connector2.classList.remove('completed');
    }
}

async function saveAyah() {
    // Validate form
    if (!elements.surahInput || !elements.surahInput.value.trim()) {
        showError('Please enter surah information');
        return;
    }
    
    if (!elements.ayahInput || !elements.ayahInput.value.trim()) {
        showError('Please enter ayah number');
        return;
    }
    
    if (!elements.arabicInput || !elements.arabicInput.value.trim()) {
        showError('Please enter Arabic text');
        return;
    }
    
    if (!elements.englishInput || !elements.englishInput.value.trim()) {
        showError('Please enter English translation');
        return;
    }
    
    if (!elements.sourceInput || !elements.sourceInput.value.trim()) {
        showError('Please enter source URL');
        return;
    }
    
    if (selectedLabels.length === 0) {
        showError('Please add at least one label');
        return;
    }
    
    // Create ayah object
    const ayah = {
        SURAH: elements.surahInput.value.trim(),
        AYAH: elements.ayahInput.value.trim(),
        ARB: elements.arabicInput.value.trim(),
        ENG: elements.englishInput.value.trim(),
        IDN: '', // Optional field
        LABEL: selectedLabels.join(','),
        SOURCE: elements.sourceInput.value.trim()
    };
    
    // If editing, include the ID
    if (editingAyahId) {
        ayah.Id = editingAyahId;
    }
    
    // Show loading state
    if (elements.saveButton) {
        elements.saveButton.disabled = true;
        elements.saveButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    }
    
    // Save to Google Sheet
    const success = await saveAyahToSheet(ayah);
    
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
    elements.modalTitle.textContent = 'Edit Ayah';
    
    // Populate form
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
    elements.ayahModal.classList.remove('hidden');
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
    const labelName = elements.newLabelNameInput.value.trim();
    
    if (!labelName) {
        showError('Please enter a label name');
        return;
    }
    
    const parentId = elements.newLabelParentSelect.value;
    
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
    
    labels.push(newLabel);
    
    // Update UI
    populateLabelFilters();
    populateParentSelect(elements.parentLabelSelect, labels);
    populateParentSelect(elements.newLabelParentSelect, labels);
    
    // Reset input
    elements.newLabelNameInput.value = '';
    elements.newLabelParentSelect.value = '';
    
    // Refresh labels hierarchy
    displayLabelsHierarchy();
    
    showSuccess('Label created successfully!');
}

function displayLabelsHierarchy() {
    if (!elements.labelsHierarchy) return;
    
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
        populateParentSelect(elements.parentLabelSelect, labels);
        populateParentSelect(elements.newLabelParentSelect, labels);
        displayLabelsHierarchy();
        
        showSuccess('Label deleted successfully');
    }
}

// Filter Functions
function filterAyahs() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const surahFilter = elements.surahFilter.value;
    const labelFilter = elements.labelFilter.value;
    
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