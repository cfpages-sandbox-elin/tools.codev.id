// Configuration
const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE"; // Replace with your deployed Google Apps Script URL

// State
let ayahs = [];
let labels = [];
let selectedLabels = [];
let editingAyahId = null;
let parsedAyahData = null;

// DOM Elements
const elements = {
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
    parsedPreview: document.getElementById('parsedPreview')
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadAyahs();
    loadLabels();
    
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
    
    // Automatic parsing on paste
    elements.pasteInput.addEventListener('paste', () => {
        // Small delay to ensure pasted content is available
        setTimeout(() => {
            parsePastedAyah();
        }, 100);
    });
    
    // Handle Enter key in paste textarea
    elements.pasteInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line
            if (parsedAyahData) {
                saveAyah();
            } else {
                parsePastedAyah();
            }
        }
    });
});

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
        const response = await fetch(API_URL);
        const result = await response.json();
        
        if (result.status === 'success') {
            ayahs = result.data;
            displayAyahs(ayahs);
            populateSurahFilter();
        } else {
            showError('Failed to load ayahs');
        }
    } catch (error) {
        console.error('Error loading ayahs:', error);
        showError('Network error. Please try again.');
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
    elements.ayahModal.classList.remove('hidden');
    elements.pasteInput.focus();
}

function closeAyahModal() {
    elements.ayahModal.classList.add('hidden');
    resetAyahForm();
}

function openLabelsModal() {
    displayLabelsHierarchy();
    elements.labelsModal.classList.remove('hidden');
}

function closeLabelsModal() {
    elements.labelsModal.classList.add('hidden');
}

function resetAyahForm() {
    elements.pasteInput.value = '';
    elements.surahInput.value = '';
    elements.ayahInput.value = '';
    elements.arabicInput.value = '';
    elements.englishInput.value = '';
    elements.sourceInput.value = '';
    selectedLabels = [];
    parsedAyahData = null;
    updateSelectedLabels();
    
    // Hide parsed preview if it exists
    if (elements.parsedPreview) {
        elements.parsedPreview.innerHTML = '';
        elements.parsedPreview.classList.add('hidden');
    }
}

// Ayah Form Functions
function parsePastedAyah() {
    const pastedText = elements.pasteInput.value.trim();
    
    if (!pastedText) {
        showError('Please paste the ayah content');
        return;
    }
    
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
    elements.surahInput.value = `${surahNumber}. ${surahName}`;
    elements.ayahInput.value = ayahNumber;
    elements.arabicInput.value = arabicText;
    elements.englishInput.value = englishText;
    elements.sourceInput.value = sourceUrl;
    
    // Store parsed data
    parsedAyahData = {
        SURAH: `${surahNumber}. ${surahName}`,
        AYAH: ayahNumber,
        ARB: arabicText,
        ENG: englishText,
        SOURCE: sourceUrl
    };
    
    // Show parsed preview
    showParsedPreview();
    
    showSuccess('Ayah parsed successfully! Press Enter to save.');
}

function showParsedPreview() {
    if (!elements.parsedPreview) {
        // Create preview container if it doesn't exist
        const previewContainer = document.createElement('div');
        previewContainer.id = 'parsedPreview';
        previewContainer.className = 'mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200 hidden';
        
        // Insert after the paste textarea
        elements.pasteInput.parentNode.insertBefore(previewContainer, elements.pasteInput.nextSibling);
        elements.parsedPreview = previewContainer;
    }
    
    if (parsedAyahData) {
        elements.parsedPreview.innerHTML = `
            <h4 class="font-medium text-indigo-800 mb-2">Parsed Ayah Preview:</h4>
            <div class="text-sm">
                <p><strong>Surah:</strong> ${parsedAyahData.SURAH}</p>
                <p><strong>Ayah:</strong> ${parsedAyahData.AYAH}</p>
                <p><strong>Arabic:</strong> <span class="arabic-text">${parsedAyahData.ARB}</span></p>
                <p><strong>English:</strong> ${parsedAyahData.ENG}</p>
                <p><strong>Source:</strong> <a href="${parsedAyahData.SOURCE}" target="_blank" class="text-indigo-600 hover:underline">${parsedAyahData.SOURCE}</a></p>
            </div>
            <p class="mt-2 text-indigo-700 font-medium">Press Enter to save this ayah</p>
        `;
        elements.parsedPreview.classList.remove('hidden');
    } else {
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
    
    // Reset selects
    elements.parentLabelSelect.value = '';
    elements.childLabelSelect.innerHTML = '<option value="">Select Child Label</option>';
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
    
    // Reset input
    elements.newLabelInput.value = '';
    
    showSuccess('Label created successfully!');
}

function updateSelectedLabels() {
    elements.labelsContainer.innerHTML = '';
    
    selectedLabels.forEach(labelId => {
        const label = labels.find(l => l.id === labelId);
        if (label) {
            const isParent = !label.parentId;
            const labelTag = document.createElement('span');
            labelTag.className = `label-tag ${isParent ? 'parent-label' : 'child-label'} flex items-center`;
            labelTag.innerHTML = `
                ${label.name}
                <button class="ml-2 text-white hover:text-gray-200" data-id="${labelId}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            labelTag.querySelector('button').addEventListener('click', () => {
                selectedLabels = selectedLabels.filter(id => id !== labelId);
                updateSelectedLabels();
            });
            
            elements.labelsContainer.appendChild(labelTag);
        }
    });
}

async function saveAyah() {
    // Validate form
    if (!elements.surahInput.value.trim()) {
        showError('Please enter surah information');
        return;
    }
    
    if (!elements.ayahInput.value.trim()) {
        showError('Please enter ayah number');
        return;
    }
    
    if (!elements.arabicInput.value.trim()) {
        showError('Please enter Arabic text');
        return;
    }
    
    if (!elements.englishInput.value.trim()) {
        showError('Please enter English translation');
        return;
    }
    
    if (!elements.sourceInput.value.trim()) {
        showError('Please enter source URL');
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
    
    // Save to Google Sheet
    const success = await saveAyahToSheet(ayah);
    
    if (success) {
        showSuccess('Ayah saved successfully!');
        closeAyahModal();
        loadAyahs(); // Reload ayahs
    } else {
        showError('Failed to save ayah. Please try again.');
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
    elements.surahInput.value = ayah.SURAH || '';
    elements.ayahInput.value = ayah.AYAH || '';
    elements.arabicInput.value = ayah.ARB || '';
    elements.englishInput.value = ayah.ENG || '';
    elements.sourceInput.value = ayah.SOURCE || '';
    
    // Parse labels
    selectedLabels = ayah.LABEL ? ayah.LABEL.split(',').map(label => label.trim()) : [];
    updateSelectedLabels();
    
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