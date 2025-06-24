// --- Setup for PDF.js ---
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

// --- Element Selectors ---
const fileInput = document.getElementById('file-input');
const textInput = document.getElementById('text-input');
const generateBtn = document.getElementById('generate-btn');
const apiProviderSelect = document.getElementById('api-provider');
const modelSelect = document.getElementById('model');
const checkStatusBtn = document.getElementById('check-status-btn');
const statusMessage = document.getElementById('status-message');
const previewContainer = document.getElementById('preview-container');
const slideNavigation = document.getElementById('slide-navigation');
const prevSlideBtn = document.getElementById('prev-slide');
const nextSlideBtn = document.getElementById('next-slide');
const slideCounter = document.getElementById('slide-counter');
const pushToGslideBtn = document.getElementById('push-to-gslide-btn');
const jsonOutputContainer = document.getElementById('json-output');

// --- Global State ---
let slides = [];
let currentSlide = 0;
let editor;

// --- Model Mapping ---
const modelsByProvider = {
    google: ['gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-1.5-pro'],
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    deepseek: ['deepseek-chat', 'deepseek-coder'],
    xai: ['grok-1.5-flash']
};

// --- Monaco Editor Initialization ---
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.27.0/min/vs' }});
require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(jsonOutputContainer, {
        value: "{\n\t\"message\": \"JSON output will be displayed here.\"\n}",
        language: 'json',
        theme: 'vs-dark',
        readOnly: true
    });
});

// --- Functions ---

/**
 * Updates the model dropdown based on the selected provider.
 */
function updateModels() {
    const selectedProvider = apiProviderSelect.value;
    const models = modelsByProvider[selectedProvider] || [];
    modelSelect.innerHTML = models.map(model => `<option value="${model}">${model}</option>`).join('');
    statusMessage.textContent = ''; // Clear status on change
}

/**
 * Displays a specific slide in the preview container.
 * @param {number} index - The index of the slide to display.
 */
function displaySlide(index) {
    const slide = slides[index];
    let html = '<div class="w-full h-full p-8 flex flex-col justify-center items-center bg-white text-black text-left">';

    switch (slide.type) {
        case 'title':
            html += `<div class="text-center"><h1 class="text-4xl font-bold">${slide.content.title}</h1>`;
            if (slide.content.subtitle) {
                html += `<p class="text-xl mt-4">${slide.content.subtitle}</p>`;
            }
            html += `</div>`;
            break;
        case 'section_header':
            html += `<div class="text-center"><h2 class="text-5xl font-bold text-blue-600">${slide.content.title}</h2></div>`;
            break;
        case 'content':
            html += `<h2 class="text-3xl font-semibold self-start w-full mb-4">${slide.content.title}</h2>`;
            if (slide.content.points) {
                html += '<ul class="list-disc self-start pl-6 text-lg w-full">';
                slide.content.points.forEach(point => {
                    html += `<li class="mb-2">${point}</li>`;
                });
                html += '</ul>';
            }
            break;
        case 'comparison':
             html += `<h2 class="text-3xl font-semibold w-full text-center mb-4">${slide.content.title}</h2>`;
             html += `<div class="w-full grid grid-cols-2 gap-4">`;
             html += `<div><h3 class="text-xl font-bold mb-2">${slide.content.itemA.name}</h3><ul class="list-disc pl-5">`;
             slide.content.itemA.points.forEach(p => html += `<li>${p}</li>`);
             html += `</ul></div>`;
             html += `<div><h3 class="text-xl font-bold mb-2">${slide.content.itemB.name}</h3><ul class="list-disc pl-5">`;
             slide.content.itemB.points.forEach(p => html += `<li>${p}</li>`);
             html += `</ul></div>`;
             html += `</div>`;
            break;
        case 'pros_cons':
             html += `<h2 class="text-3xl font-semibold w-full text-center mb-4">${slide.content.title}</h2>`;
             html += `<div class="w-full grid grid-cols-2 gap-4">`;
             html += `<div><h3 class="text-xl font-bold text-green-600 mb-2">Pros</h3><ul class="list-disc pl-5">`;
             slide.content.pros.forEach(p => html += `<li>${p}</li>`);
             html += `</ul></div>`;
             html += `<div><h3 class="text-xl font-bold text-red-600 mb-2">Cons</h3><ul class="list-disc pl-5">`;
             slide.content.cons.forEach(p => html += `<li>${p}</li>`);
             html += `</ul></div>`;
             html += `</div>`;
            break;
        case 'timeline':
            html += `<h2 class="text-3xl font-semibold w-full mb-6">${slide.content.title}</h2>`;
            html += `<div class="relative border-l-4 border-blue-300 w-full">`;
            slide.content.events.forEach(event => {
                 html += `<div class="mb-8 ml-8"><h4 class="text-xl font-bold text-blue-600">${event.time}</h4><p>${event.description}</p></div>`;
            });
            html += `</div>`;
            break;
         case 'image':
            html += `<h2 class="text-3xl font-semibold mb-4">${slide.content.title}</h2>`;
            html += `<img src="${slide.content.imageUrl}" alt="${slide.content.title}" class="max-h-60 object-contain my-4">`;
            if (slide.content.caption) {
                html += `<p class="text-sm mt-2 italic">${slide.content.caption}</p>`;
            }
            break;
        case 'quote':
             html += `<div class="text-center"><blockquote class="text-2xl italic">" ${slide.content.text} "</blockquote>`;
             if(slide.content.author){
                html += `<cite class="block text-right mt-4">- ${slide.content.author}</cite>`;
             }
             html += `</div>`;
             break;
        case 'summary':
        case 'qa':
            html += `<div class="text-center"><h1 class="text-4xl font-bold">${slide.content.title}</h1>`;
            if (slide.content.subtitle) {
                html += `<p class="text-xl mt-4">${slide.content.subtitle}</p>`;
            }
             if (slide.content.points) {
                html += '<ul class="list-disc mt-6 text-lg inline-block text-left">';
                slide.content.points.forEach(point => {
                    html += `<li class="mb-2">${point}</li>`;
                });
                html += '</ul>';
            }
            html += `</div>`;
            break;
         default:
            html += `<p>Unsupported slide type: ${slide.type}</p><pre>${JSON.stringify(slide.content, null, 2)}</pre>`
    }
    html += '</div>';

    previewContainer.innerHTML = html;
    slideCounter.textContent = `Slide ${index + 1} of ${slides.length}`;
}

// --- Event Listeners ---

apiProviderSelect.addEventListener('change', updateModels);

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    textInput.value = '';
    let text = '';
    previewContainer.innerHTML = '<p class="text-gray-500">Parsing document...</p>'

    try {
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const typedarray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(' ');
                }
                textInput.value = text;
                previewContainer.innerHTML = '<p class="text-gray-500">Document parsed. Ready to generate.</p>';
            };
            reader.readAsArrayBuffer(file);
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
             const reader = new FileReader();
             reader.onload = async (e) => {
                const arrayBuffer = e.target.result;
                const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                textInput.value = result.value;
                previewContainer.innerHTML = '<p class="text-gray-500">Document parsed. Ready to generate.</p>';
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                textInput.value = e.target.result;
                previewContainer.innerHTML = '<p class="text-gray-500">Document parsed. Ready to generate.</p>';
            };
            reader.readAsText(file);
        }
    } catch (error) {
        previewContainer.innerHTML = `<p class="text-red-500">Error parsing file: ${error.message}</p>`;
    }
});

checkStatusBtn.addEventListener('click', async () => {
    const provider = apiProviderSelect.value;
    const model = modelSelect.value;
    if (!model) {
        statusMessage.textContent = 'Please select a model first.';
        statusMessage.className = 'text-sm mt-2 text-yellow-600';
        return;
    }

    statusMessage.textContent = 'Checking...';
    statusMessage.className = 'text-sm mt-2 text-gray-500';

    try {
        const response = await fetch('/functions/ai-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check_status', providerKey: provider, model: model }),
        });
        const data = await response.json();
        if (data.success) {
            statusMessage.textContent = `Status: OK`;
            statusMessage.className = 'text-sm mt-2 text-green-600';
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        statusMessage.textContent = `Error: ${error.message}`;
        statusMessage.className = 'text-sm mt-2 text-red-600';
    }
});

generateBtn.addEventListener('click', async () => {
    const sourceText = textInput.value;
    if (!sourceText.trim()) {
        alert('Please provide some text content or upload a document.');
        return;
    }

    const provider = apiProviderSelect.value;
    const model = modelSelect.value;

    if (!model) {
        alert('Please select a model.');
        return;
    }
    
    const prompt = `
        Based on the following source text, create a JSON structure for a slide presentation.
        The JSON must be an array of slide objects, and nothing else.
        Analyze the text to create a logical, engaging, and varied presentation.

        Here are the available slide types and their JSON schemas. Use them appropriately.

        1.  **title**: The main title slide. Use only for the first slide.
            Schema: { "type": "title", "content": { "title": "...", "subtitle": "..." } }

        2.  **section_header**: To introduce a new major section.
            Schema: { "type": "section_header", "content": { "title": "..." } }

        3.  **content**: A standard slide with a title and bullet points. This should be common.
            Schema: { "type": "content", "content": { "title": "...", "points": ["...", "...", "..."] } }
        
        4.  **comparison**: Compare two items side-by-side. Use when the text presents a clear comparison.
            Schema: { "type": "comparison", "content": { "title": "...", "itemA": { "name": "...", "points": ["..."] }, "itemB": { "name": "...", "points": ["..."] } } }
        
        5.  **pros_cons**: A specific comparison for advantages and disadvantages.
            Schema: { "type": "pros_cons", "content": { "title": "...", "pros": ["...", "..."], "cons": ["...", "..."] } }

        6.  **timeline**: For chronological events or steps in a sequence.
            Schema: { "type": "timeline", "content": { "title": "...", "events": [{ "time": "...", "description": "..." }, { "time": "...", "description": "..." }] } }

        7.  **quote**: To highlight a powerful quote from the text.
            Schema: { "type": "quote", "content": { "text": "...", "author": "..." } }
        
        8.  **image**: For when the text describes something visual. **Important**: For the "imageUrl", use a placeholder from "https://placehold.co/600x400?text=AI+Placeholder".
            Schema: { "type": "image", "content": { "title": "...", "imageUrl": "https://placehold.co/600x400?text=AI+Placeholder", "caption": "..." } }

        9.  **summary**: A concluding slide with key takeaways. Use for the second to last slide.
            Schema: { "type": "summary", "content": { "title": "Key Takeaways", "points": ["...", "...", "..."] } }

        10. **qa**: The final slide.
            Schema: { "type": "qa", "content": { "title": "Q&A", "subtitle": "Thank You" } }

        Your task is to convert the following text into a JSON array of these slide objects.
        Ensure a logical flow: start with a 'title', use 'section_header' where appropriate, vary the content slides with 'comparison', 'timeline', etc., and end with 'summary' and 'qa'.
        The number of slides should be appropriate for the text length.

        Source Text:
        ---
        ${sourceText.substring(0, 8000)}
        ---
        
        Return ONLY the JSON array. Do not include any other text, explanations, or markdown formatting like \`\`\`json.
    `;

    try {
        previewContainer.innerHTML = '<div class="text-center"><p class="text-lg">Generating slides...</p><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mt-4"></div></div>';
        
        const response = await fetch('/functions/ai-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate', providerKey: provider, model: model, prompt: prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate slides.');
        }
        
        const data = await response.json();
        let rawJson = data.text;
        
        const arrayStartIndex = rawJson.indexOf('[');
        const arrayEndIndex = rawJson.lastIndexOf(']');
        if (arrayStartIndex === -1 || arrayEndIndex === -1) {
            throw new Error("AI did not return a valid JSON array.");
        }
        rawJson = rawJson.substring(arrayStartIndex, arrayEndIndex + 1);
        
        slides = JSON.parse(rawJson);
        editor.setValue(JSON.stringify(slides, null, 2));

        if (slides && slides.length > 0) {
            currentSlide = 0;
            displaySlide(currentSlide);
            slideNavigation.classList.remove('hidden');
            pushToGslideBtn.classList.remove('hidden');
        } else {
            throw new Error("AI returned an empty array.");
        }

    } catch (error) {
        console.error('Generation Error:', error);
        previewContainer.innerHTML = `<p class="text-red-500 p-4"><b>Error:</b> ${error.message}. <br><br>Please check the 'Generated JSON' tab for the raw AI output that may have caused the parsing issue.</p>`;
        editor.setValue(JSON.stringify({ error: error.message, rawResponse: slides }, null, 2));
        slideNavigation.classList.add('hidden');
        pushToGslideBtn.classList.add('hidden');
    }
});

prevSlideBtn.addEventListener('click', () => {
    if (currentSlide > 0) {
        currentSlide--;
        displaySlide(currentSlide);
    }
});

nextSlideBtn.addEventListener('click', () => {
    if (currentSlide < slides.length - 1) {
        currentSlide++;
        displaySlide(currentSlide);
    }
});

pushToGslideBtn.addEventListener('click', () => {
    const googleSlideUrl = document.getElementById('google-slide-url').value;
    if (!googleSlideUrl) {
        alert('Please provide the Google Slide URL.');
        return;
    }
    alert('Pushing to Google Slides is not yet implemented.');
});
        
// --- Initial Page Load Setup ---
updateModels();