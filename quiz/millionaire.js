document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const quizContainer = document.getElementById('quiz-container');
  const resultsContainer = document.getElementById('results-container');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const restartBtn = document.getElementById('restart-btn');
  
  // State Management
  let currentQuestion = 0;
  let answers = [];
  let quizData = null;
  
  // Load quiz data
  fetch('millionaire.json')
    .then(response => response.json())
    .then(data => {
      quizData = data;
      initializeQuiz();
    })
    .catch(error => console.error('Error loading quiz data:', error));
  
  // Initialize Quiz
  function initializeQuiz() {
    // Load saved progress from localStorage
    const savedProgress = localStorage.getItem('millionaireQuizProgress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      currentQuestion = progress.currentQuestion;
      answers = progress.answers;
    }
    
    // Check if quiz is completed
    if (currentQuestion >= quizData.questions.length) {
      showResults();
    } else {
      displayQuestion();
      updateProgress();
    }
    
    // Add event listener to restart button
    restartBtn.addEventListener('click', restartQuiz);
  }
  
  // Display Current Question
  function displayQuestion() {
    const question = quizData.questions[currentQuestion];
    
    quizContainer.innerHTML = `
      <div class="mb-8">
        <h2 class="playfair text-2xl font-bold text-gray-800 mb-6">Question ${currentQuestion + 1}</h2>
        <p class="text-lg text-gray-700 mb-8">${question.text}</p>
        
        <div class="space-y-4">
          ${question.options.map((option, index) => `
            <div class="option-card bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-lg p-4 cursor-pointer" data-index="${index}">
              <div class="flex items-start">
                <div class="flex-shrink-0 mt-1">
                  <div class="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                    <span class="text-sm font-medium text-gray-500">${String.fromCharCode(65 + index)}</span>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-gray-700">${option.text}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="flex justify-between mt-10">
        <button id="prev-btn" class="text-gray-600 hover:text-gray-900 font-medium py-2 px-4 rounded-lg ${currentQuestion === 0 ? 'invisible' : ''}">
          <i class="fas fa-arrow-left mr-2"></i> Previous
        </button>
        <div id="next-container" class="hidden">
          <button id="next-btn" class="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300">
            Next <i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners to options
    const options = document.querySelectorAll('.option-card');
    options.forEach(option => {
      option.addEventListener('click', function() {
        // Remove previous selection
        options.forEach(opt => {
          opt.classList.remove('bg-teal-50', 'border-teal-500');
          const circle = opt.querySelector('div > div');
          circle.classList.remove('bg-teal-500', 'text-white');
          circle.classList.add('border-gray-300');
        });
        
        // Add selection to current option
        this.classList.add('bg-teal-50', 'border-teal-500');
        const circle = this.querySelector('div > div');
        circle.classList.remove('border-gray-300');
        circle.classList.add('bg-teal-500', 'text-white');
        
        // Store answer
        const selectedIndex = parseInt(this.getAttribute('data-index'));
        answers[currentQuestion] = selectedIndex;
        
        // Save progress
        saveProgress();
        
        // Show next button
        document.getElementById('next-container').classList.remove('hidden');
      });
    });
    
    // Add event listeners to navigation buttons
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', previousQuestion);
    }
    
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', nextQuestion);
    }
    
    // Restore previous selection if exists
    if (answers[currentQuestion] !== undefined) {
      const selectedIndex = answers[currentQuestion];
      const selectedOption = options[selectedIndex];
      if (selectedOption) {
        selectedOption.click();
      }
    }
  }
  
  // Navigation Functions
  function nextQuestion() {
    if (answers[currentQuestion] === undefined) return;
    
    currentQuestion++;
    saveProgress();
    
    if (currentQuestion < quizData.questions.length) {
      displayQuestion();
      updateProgress();
    } else {
      showResults();
    }
  }
  
  function previousQuestion() {
    if (currentQuestion > 0) {
      currentQuestion--;
      displayQuestion();
      updateProgress();
    }
  }
  
  // Update Progress Bar
  function updateProgress() {
    const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${currentQuestion + 1} of ${quizData.questions.length}`;
  }
  
  // Save Progress to localStorage
  function saveProgress() {
    const progress = {
      currentQuestion,
      answers
    };
    localStorage.setItem('millionaireQuizProgress', JSON.stringify(progress));
  }
  
  // Calculate and Show Results
  function showResults() {
    // Calculate genius type
    const geniusCounts = {
      dynamo: 0,
      blaze: 0,
      tempo: 0,
      steel: 0
    };
    
    answers.forEach(answerIndex => {
      if (answerIndex !== undefined) {
        const question = quizData.questions[answers.indexOf(answerIndex)];
        const selectedOption = question.options[answerIndex];
        geniusCounts[selectedOption.genius]++;
      }
    });
    
    // Find the genius type with highest count
    let maxCount = 0;
    let resultGenius = 'dynamo';
    
    for (const genius in geniusCounts) {
      if (geniusCounts[genius] > maxCount) {
        maxCount = geniusCounts[genius];
        resultGenius = genius;
      }
    }
    
    const geniusData = quizData.geniusTypes[resultGenius];
    
    // Display results
    resultsContainer.innerHTML = `
      <div class="text-center mb-10">
        <div class="inline-block bg-teal-100 text-teal-800 rounded-full px-4 py-1 text-sm font-medium mb-4">
          Your Genius Type
        </div>
        <h2 class="playfair text-3xl md:text-4xl font-bold text-gray-800 mb-2">${geniusData.name}</h2>
        <p class="text-gray-600 max-w-2xl mx-auto">${geniusData.description}</p>
      </div>
      
      <div class="grid md:grid-cols-2 gap-8 mb-10">
        <div class="bg-gray-50 rounded-xl p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4">Your Strengths</h3>
          <ul class="space-y-2">
            ${geniusData.strengths.map(strength => `
              <li class="flex items-start">
                <i class="fas fa-check-circle text-teal-500 mt-1 mr-3"></i>
                <span class="text-gray-700">${strength}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        
        <div class="bg-gray-50 rounded-xl p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4">Your Challenges</h3>
          <ul class="space-y-2">
            ${geniusData.challenges.map(challenge => `
              <li class="flex items-start">
                <i class="fas fa-exclamation-circle text-amber-500 mt-1 mr-3"></i>
                <span class="text-gray-700">${challenge}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
      
      <div class="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Your Personalized Success Plan</h3>
        <div class="space-y-4">
          ${geniusData.plan.map((step, index) => `
            <div class="flex">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold mr-4">
                ${index + 1}
              </div>
              <p class="text-gray-700 pt-1">${step}</p>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="bg-teal-50 border border-teal-100 rounded-xl p-6">
        <h3 class="text-lg font-bold text-teal-800 mb-2">Next Steps</h3>
        <p class="text-teal-700">Now that you know your genius type, focus on implementing your personalized plan. Remember to partner with complementary geniuses to cover your weak areas!</p>
      </div>
    `;
    
    // Show results container and hide quiz container
    quizContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    restartBtn.classList.remove('hidden');
    
    // Clear saved progress
    localStorage.removeItem('millionaireQuizProgress');
  }
  
  // Restart Quiz
  function restartQuiz() {
    currentQuestion = 0;
    answers = [];
    
    // Clear saved progress
    localStorage.removeItem('millionaireQuizProgress');
    
    // Reset UI
    quizContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    restartBtn.classList.add('hidden');
    
    // Start quiz
    displayQuestion();
    updateProgress();
  }
});