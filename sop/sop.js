// Load SOP dari file markdown
async function loadSOP(sopName) {
  const response = await fetch(`sop/${sopName}.md`);
  const markdown = await response.text();
  
  // Konversi markdown ke HTML
  const converter = new showdown.Converter();
  const html = converter.makeHtml(markdown);
  
  // Tampilkan konten
  document.getElementById('sop-content').innerHTML = html;
  document.getElementById('sop-content').classList.remove('hidden');
  document.getElementById('signature-section').classList.remove('hidden');
  
  // Tambahkan interaksi checkbox
  addCheckboxListeners();
  
  // Setup tanda tangan digital
  setupSignaturePad();
}

// Event listener untuk dropdown
document.getElementById('sop-selector').addEventListener('change', (e) => {
  if (e.target.value) {
    loadSOP(e.target.value);
  }
});

// Fungsi checkbox
function addCheckboxListeners() {
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      // Simpan status ke localStorage
      localStorage.setItem(checkbox.id, checkbox.checked);
    });
    
    // Load status tersimpan
    const saved = localStorage.getItem(checkbox.id);
    if (saved !== null) {
      checkbox.checked = (saved === 'true');
    }
  });
}

// Setup tanda tangan digital
function setupSignaturePad() {
  const canvas = document.getElementById('signature-pad');
  const ctx = canvas.getContext('2d');
  let isDrawing = false;

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);

  function startDrawing(e) {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  }

  function draw(e) {
    if (!isDrawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }

  function stopDrawing() {
    isDrawing = false;
  }

  // Hapus tanda tangan
  document.getElementById('clear-signature').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Simpan tanda tangan
  document.getElementById('save-signature').addEventListener('click', () => {
    const dataURL = canvas.toDataURL();
    localStorage.setItem('supervisor-signature', dataURL);
    alert('Tanda tangan disimpan!');
  });
}