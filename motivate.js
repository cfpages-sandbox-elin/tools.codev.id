document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const welcomeScreen = document.getElementById('welcomeScreen');
    const questionContainer = document.getElementById('questionContainer');
    const resultsScreen = document.getElementById('resultsScreen');
    const startBtn = document.getElementById('startBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const restartBtn = document.getElementById('restartBtn');
    const saveBtn = document.getElementById('saveBtn');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const questionEmoji = document.getElementById('questionEmoji');
    const questionText = document.getElementById('questionText');
    const questionSubtext = document.getElementById('questionSubtext');
    const answerContainer = document.getElementById('answerContainer');
    const motivationResults = document.getElementById('motivationResults');

    // State
    let currentQuestionIndex = 0;
    let questions = [];
    let answers = {};

    // Initialize
    loadQuestions();
    setupEventListeners();

    // Functions
    function loadQuestions() {
        fetch('motivate.json')
            .then(response => response.json())
            .then(data => {
                questions = data.questions;
            })
            .catch(error => {
                console.error('Error loading questions:', error);
                // Fallback questions in case JSON fails to load
                questions = [
                    {
                        id: "name",
                        type: "text",
                        emoji: "👤",
                        text: "What's your name?",
                        subtext: "We'll personalize your experience based on your name."
                    }
                ];
            });
    }

    function setupEventListeners() {
        startBtn.addEventListener('click', startQuestionnaire);
        prevBtn.addEventListener('click', goToPreviousQuestion);
        nextBtn.addEventListener('click', goToNextQuestion);
        restartBtn.addEventListener('click', restartQuestionnaire);
        saveBtn.addEventListener('click', saveResults);
    }

    function startQuestionnaire() {
        welcomeScreen.classList.add('hidden');
        questionContainer.classList.remove('hidden');
        currentQuestionIndex = 0;
        answers = {};
        displayQuestion();
    }

    function displayQuestion() {
        if (currentQuestionIndex >= questions.length) {
            showResults();
            return;
        }

        const question = questions[currentQuestionIndex];
        questionEmoji.textContent = question.emoji;
        questionText.textContent = question.text;
        questionSubtext.textContent = question.subtext;

        // Clear previous answers
        answerContainer.innerHTML = '';

        // Create answer input based on question type
        switch (question.type) {
            case 'text':
                createTextInput(question);
                break;
            case 'textarea':
                createTextareaInput(question);
                break;
            case 'select':
                createSelectInput(question);
                break;
            case 'radio':
                createRadioInput(question);
                break;
            case 'checkbox':
                createCheckboxInput(question);
                break;
            default:
                createTextInput(question);
        }

        // Update progress
        updateProgress();

        // Update navigation buttons
        prevBtn.disabled = currentQuestionIndex === 0;
        nextBtn.disabled = false;

        // Add fade-in animation
        questionContainer.classList.remove('fade-in');
        void questionContainer.offsetWidth; // Trigger reflow
        questionContainer.classList.add('fade-in');
    }

    function createTextInput(question) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = question.id;
        input.className = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
        input.placeholder = 'Enter your answer here...';
        
        // Pre-fill if answer already exists
        if (answers[question.id]) {
            input.value = answers[question.id];
        }
        
        answerContainer.appendChild(input);
    }

    function createTextareaInput(question) {
        const textarea = document.createElement('textarea');
        textarea.id = question.id;
        textarea.className = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
        textarea.placeholder = 'Enter your answer here...';
        textarea.rows = 4;
        
        // Pre-fill if answer already exists
        if (answers[question.id]) {
            textarea.value = answers[question.id];
        }
        
        answerContainer.appendChild(textarea);
    }

    function createSelectInput(question) {
        const select = document.createElement('select');
        select.id = question.id;
        select.className = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Please select an option...';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);
        
        // Add options
        question.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            
            // Pre-select if answer already exists
            if (answers[question.id] === option.value) {
                optionElement.selected = true;
            }
            
            select.appendChild(optionElement);
        });
        
        answerContainer.appendChild(select);
    }

    function createRadioInput(question) {
        const radioGroup = document.createElement('div');
        radioGroup.className = 'space-y-3';
        
        question.options.forEach(option => {
            const radioContainer = document.createElement('div');
            radioContainer.className = 'flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = `${question.id}-${option.value}`;
            radio.name = question.id;
            radio.value = option.value;
            radio.className = 'mr-3';
            
            // Pre-select if answer already exists
            if (answers[question.id] === option.value) {
                radio.checked = true;
            }
            
            const label = document.createElement('label');
            label.htmlFor = `${question.id}-${option.value}`;
            label.className = 'cursor-pointer flex-grow';
            label.textContent = option.label;
            
            radioContainer.appendChild(radio);
            radioContainer.appendChild(label);
            radioGroup.appendChild(radioContainer);
            
            // Make the whole container clickable
            radioContainer.addEventListener('click', () => {
                radio.checked = true;
            });
        });
        
        answerContainer.appendChild(radioGroup);
    }

    function createCheckboxInput(question) {
        const checkboxGroup = document.createElement('div');
        checkboxGroup.className = 'space-y-3';
        
        question.options.forEach(option => {
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${question.id}-${option.value}`;
            checkbox.value = option.value;
            checkbox.className = 'mr-3';
            
            // Pre-select if answer already exists
            if (answers[question.id] && answers[question.id].includes(option.value)) {
                checkbox.checked = true;
            }
            
            const label = document.createElement('label');
            label.htmlFor = `${question.id}-${option.value}`;
            label.className = 'cursor-pointer flex-grow';
            label.textContent = option.label;
            
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(label);
            checkboxGroup.appendChild(checkboxContainer);
            
            // Make the whole container clickable
            checkboxContainer.addEventListener('click', () => {
                checkbox.checked = !checkbox.checked;
            });
        });
        
        answerContainer.appendChild(checkboxGroup);
    }

    function saveCurrentAnswer() {
        const question = questions[currentQuestionIndex];
        let answer;
        
        switch (question.type) {
            case 'text':
            case 'textarea':
            case 'select':
                answer = document.getElementById(question.id).value;
                break;
            case 'radio':
                const selectedRadio = document.querySelector(`input[name="${question.id}"]:checked`);
                answer = selectedRadio ? selectedRadio.value : '';
                break;
            case 'checkbox':
                const selectedCheckboxes = document.querySelectorAll(`input[id^="${question.id}-"]:checked`);
                answer = Array.from(selectedCheckboxes).map(cb => cb.value);
                break;
            default:
                answer = '';
        }
        
        if (answer) {
            answers[question.id] = answer;
        }
    }

    function goToPreviousQuestion() {
        if (currentQuestionIndex > 0) {
            saveCurrentAnswer();
            currentQuestionIndex--;
            displayQuestion();
        }
    }

    function goToNextQuestion() {
        saveCurrentAnswer();
        currentQuestionIndex++;
        displayQuestion();
    }

    function updateProgress() {
        const progress = (currentQuestionIndex / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    }

    function showResults() {
        questionContainer.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        
        // Generate personalized motivation results
        const results = generateMotivationResults();
        motivationResults.innerHTML = results;
        
        // Update progress to 100%
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
    }

    function generateMotivationResults() {
        const name = answers.name || 'there';
        const goal = answers.primary_goal || 'your goal';
        const benefits = answers.goal_benefits || 'personal growth';
        const impact = answers.impact_others || 'positive change';
        const uniqueQualities = answers.unique_qualities || 'your unique perspective';
        const strengths = answers.strengths || 'your abilities';
        const motivationChallenge = answers.motivation_challenge || 'staying motivated';
        const values = answers.personal_values || [];
        const motivationSources = answers.motivation_sources || [];
        
        // Create personalized motivation content based on answers
        let resultsHTML = `
            <div class="mb-6">
                <h3 class="text-xl font-semibold text-gray-800 mb-3">Hello, ${name}! 🌟</h3>
                <p class="text-gray-600">Based on your responses, here's your personalized motivation blueprint:</p>
            </div>
            
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-2">Your Core Motivation 💪</h4>
                <p class="text-gray-600">You're working toward <strong>${goal}</strong>, which will bring you <strong>${benefits}</strong>. This isn't just a goal—it's a reflection of who you are and what you value.</p>
            </div>
            
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-2">Why It Has To Be You 🎯</h4>
                <p class="text-gray-600">${uniqueQualities}. Your combination of ${strengths} makes you uniquely positioned to achieve this goal. No one else has your exact perspective, experiences, and determination.</p>
            </div>
            
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-2"> Your Impact On Others 🌍</h4>
                <p class="text-gray-600">When you achieve ${goal}, you'll create ${impact}. Your success will ripple outward, inspiring others and making a meaningful difference.</p>
            </div>
        `;
        
        // Add values-based motivation
        if (values.length > 0) {
            resultsHTML += `
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-2">Your Values As Fuel 💎</h4>
                    <p class="text-gray-600">Your core values of ${Array.isArray(values) ? values.join(', ') : values} are the foundation of your motivation. When you connect your daily actions to these values, you tap into a powerful source of intrinsic energy.</p>
                </div>
            `;
        }
        
        // Add motivation sources
        if (motivationSources.length > 0) {
            resultsHTML += `
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-2">Your Personal Motivation Sources 🔋</h4>
                    <p class="text-gray-600">You draw energy from ${Array.isArray(motivationSources) ? motivationSources.join(', ') : motivationSources}. Lean into these sources when you need a boost.</p>
                </div>
            `;
        }
        
        // Add challenge-specific advice
        resultsHTML += `
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-2">Overcoming Your Challenge 🧗</h4>
                <p class="text-gray-600">Your biggest challenge is ${motivationChallenge}. Remember that challenges are growth opportunities. When you face this obstacle, remind yourself of your bigger purpose and the benefits that await you.</p>
            </div>
            
            <div class="mb-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-2">Your Daily Motivation Practice 📅</h4>
                <p class="text-gray-600">Based on your energy patterns and routine, here's your personalized motivation practice:</p>
                <ul class="list-disc list-inside mt-2 text-gray-600">
                    <li>Start each day by connecting your tasks to ${goal}</li>
                    <li>Remind yourself of ${benefits} when motivation wanes</li>
                    <li>Visualize the ${impact} you'll create</li>
                    <li>Reflect on your progress weekly, celebrating small wins</li>
                </ul>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-blue-800 font-medium">Remember: Motivation isn't something you find—it's something you create. You have everything you need to succeed, and this journey is uniquely yours to own.</p>
            </div>
        `;
        
        return resultsHTML;
    }

    function restartQuestionnaire() {
        resultsScreen.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
        currentQuestionIndex = 0;
        answers = {};
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    }

    function saveResults() {
        // Create a text version of the results
        const name = answers.name || 'there';
        const resultsText = document.getElementById('motivationResults').innerText;
        const fullText = `Motivation Blueprint for ${name}\n\n${resultsText}`;
        
        // Create a blob and download
        const blob = new Blob([fullText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'motivation-blueprint.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});