// --- Configuration ---
const MULTIPLIER_RANGE = { min: 1, max: 10 }; // Practice tables from x1 to x10
const FEEDBACK_DELAY_MS = 1000; // Pause duration after showing Correct/Incorrect (in milliseconds)
const TABLE_MIN = 10; // Minimum table to show (inclusive)
const TABLE_MAX = 40; // Maximum table to show (inclusive)

// --- State Variables ---
let selectedTables = []; // Array to store selected tables
let currentQuestion = null; // { factor1: number, factor2: number, answer: number }

// --- DOM References ---
const tableInfoElement = document.getElementById('table-info');
const questionFeedbackElement = document.getElementById('question-feedback');
const keyboardAreaElement = document.querySelector('.keyboard-area');
const tableSelectionScreen = document.getElementById('table-selection-screen');
const practiceScreen = document.getElementById('practice-screen');
const startPracticeBtn = document.getElementById('start-practice-btn');
const backToSelectionBtn = document.getElementById('back-to-selection-btn');
const tableButtonsContainer = document.querySelector('.table-buttons-container');

// --- Functions ---

/**
 * Creates table selection buttons from TABLE_MIN to TABLE_MAX
 */
function createTableButtons() {
    tableButtonsContainer.innerHTML = ''; // Clear any existing buttons
    
    for (let i = TABLE_MIN; i <= TABLE_MAX; i++) {
        const button = document.createElement('button');
        button.className = 'table-button';
        button.textContent = i;
        button.dataset.table = i;
        button.addEventListener('click', () => toggleTableSelection(i, button));
        tableButtonsContainer.appendChild(button);
    }
    
    // Initially disable the start button until tables are selected
    startPracticeBtn.disabled = true;
}

/**
 * Toggles selection of a table and updates the button's appearance
 */
function toggleTableSelection(tableNumber, buttonElement) {
    const index = selectedTables.indexOf(tableNumber);
    
    if (index === -1) {
        // Table not selected yet, add it
        selectedTables.push(tableNumber);
        buttonElement.classList.add('selected');
    } else {
        // Table already selected, remove it
        selectedTables.splice(index, 1);
        buttonElement.classList.remove('selected');
    }
    
    // Update start button state
    startPracticeBtn.disabled = selectedTables.length === 0;
    
    console.log("Selected tables:", selectedTables);
}

/**
 * Shuffles an array in place using the Fisher-Yates (Knuth) algorithm.
 * @param {Array} array The array to shuffle.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));
    // Swap element at i with element at j
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Updates the top bar to show which tables are being practiced.
 */
function updateTableInfo() {
    if (selectedTables.length === 1) {
        tableInfoElement.textContent = `Practicing: Table of ${selectedTables[0]}`;
    } else if (selectedTables.length > 1) {
        // Show "Tables of X, Y & Z" for 3 or fewer tables
        if (selectedTables.length <= 3) {
            tableInfoElement.textContent = `Practicing: Tables of ${selectedTables.join(', ')}`;
        } else {
            // Otherwise show "Tables of X, Y, Z + N more"
            const firstTables = selectedTables.slice(0, 2);
            const remaining = selectedTables.length - 2;
            tableInfoElement.textContent = `Practicing: Tables of ${firstTables.join(', ')} + ${remaining} more`;
        }
    } else {
        tableInfoElement.textContent = 'Select a table to start';
    }
}

/**
 * Generates a new random multiplication question based on selected tables.
 */
function generateQuestion() {
    const tableIndex = Math.floor(Math.random() * selectedTables.length);
    const factor1 = selectedTables[tableIndex]; // The table number
    const factor2 = Math.floor(Math.random() * (MULTIPLIER_RANGE.max - MULTIPLIER_RANGE.min + 1)) + MULTIPLIER_RANGE.min; // Random multiplier within range
    const answer = factor1 * factor2;

    currentQuestion = { factor1, factor2, answer };
    console.log("New Question:", currentQuestion);
}

/**
 * Generates a properly shuffled list containing ALL unique products
 * from the selected tables within the MULTIPLIER_RANGE.
 */
function generateAnswerOptions() {
    const options = new Set(); // Use a Set to automatically handle unique values

    // Iterate through each selected table
    selectedTables.forEach(tableNum => {
        // Calculate all products within the defined range for this table
        for (let i = MULTIPLIER_RANGE.min; i <= MULTIPLIER_RANGE.max; i++) {
            options.add(tableNum * i);
        }
    });

    // Convert the Set of unique products to an array
    let optionsArray = Array.from(options);

    // Shuffle the array using the reliable Fisher-Yates algorithm
    shuffleArray(optionsArray);

    // Ensure the *current correct answer* is definitely included (Safety check)
    if (!optionsArray.includes(currentQuestion.answer)) {
        console.warn("Correct answer wasn't in the initial set, adding it.");
        let replaced = false;
        // Try to replace a random *incorrect* option first
        let attempts = 0;
        while(!replaced && attempts < optionsArray.length * 2){
             let randomIndex = Math.floor(Math.random() * optionsArray.length);
             if(optionsArray[randomIndex] !== currentQuestion.answer){
                optionsArray[randomIndex] = currentQuestion.answer;
                replaced = true;
             }
             attempts++;
        }
        // If replacement failed (e.g., array only contained correct answer somehow), just ensure it's there
        if(!replaced && !optionsArray.includes(currentQuestion.answer)){
            optionsArray.push(currentQuestion.answer);
        }
        // Re-shuffle after potential modification
        shuffleArray(optionsArray);
    }

    console.log(`Generated ${optionsArray.length} unique answer options.`);
    return optionsArray;
}

/**
 * Displays the current question text.
 */
function displayQuestionText() {
     questionFeedbackElement.textContent = `${currentQuestion.factor1} x ${currentQuestion.factor2} = ?`;
     questionFeedbackElement.className = 'central-display';
}

/**
 * Creates and displays the answer buttons for the current question.
 */
function displayAnswerButtons() {
    // 1. Clear previous buttons
    keyboardAreaElement.innerHTML = '';

    // 2. Generate and display new buttons
    const answerOptions = generateAnswerOptions();
    console.log("Answer Options:", answerOptions);

    // If we have too many options, limit to a reasonable number
    const displayOptions = answerOptions.length > 16 ? 
                          answerOptions.slice(0, 16) : 
                          answerOptions;
    
    // Ensure the correct answer is included in our limited set
    if (!displayOptions.includes(currentQuestion.answer)) {
        // Replace a random option with the correct answer
        const randomIndex = Math.floor(Math.random() * displayOptions.length);
        displayOptions[randomIndex] = currentQuestion.answer;
        // Re-shuffle to avoid the answer always being in the same position
        shuffleArray(displayOptions);
    }

    displayOptions.forEach(option => {
        const button = document.createElement('button');
        button.className = 'key-button';
        button.textContent = option;
        button.onclick = () => handleAnswer(option);
        keyboardAreaElement.appendChild(button);
    });
}

/**
 * Shows the next question (generates, displays text, displays buttons).
 */
function showNextQuestion() {
    generateQuestion();
    displayQuestionText();
    displayAnswerButtons();
}

/**
 * Handles the user clicking an answer button.
 */
function handleAnswer(selectedAnswer) {
    // Disable buttons temporarily
    disableKeyboard();

    if (selectedAnswer === currentQuestion.answer) {
        // --- Correct Answer ---
        questionFeedbackElement.textContent = 'Correct!';
        questionFeedbackElement.className = 'central-display feedback-correct';
        setTimeout(showNextQuestion, FEEDBACK_DELAY_MS);

    } else {
        // --- Incorrect Answer ---
        questionFeedbackElement.textContent = 'Try again...';
        questionFeedbackElement.className = 'central-display feedback-incorrect';
        setTimeout(() => {
            displayQuestionText();
            enableKeyboard();
        }, FEEDBACK_DELAY_MS);
    }
}

/**
 * Helper function to disable all answer buttons.
 */
function disableKeyboard() {
    const buttons = keyboardAreaElement.querySelectorAll('.key-button');
    buttons.forEach(button => {
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
        button.classList.add('disabled-state');
    });
}

/**
 * Helper function to re-enable all answer buttons.
 */
function enableKeyboard() {
    const buttons = keyboardAreaElement.querySelectorAll('.key-button');
    buttons.forEach(button => {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.classList.remove('disabled-state');
    });
}

/**
 * Starts the practice session with selected tables
 */
function startPractice() {
    // Hide selection screen, show practice screen
    tableSelectionScreen.classList.remove('active');
    practiceScreen.classList.add('active');
    
    // Update info and start first question
    updateTableInfo();
    showNextQuestion();
}

/**
 * Returns to table selection screen
 */
function backToSelection() {
    // Hide practice screen, show selection screen
    practiceScreen.classList.remove('active');
    tableSelectionScreen.classList.add('active');
}

/**
 * Initializes the game.
 */
function initGame() {
    // Create table selection buttons
    createTableButtons();
    
    // Set up event listeners
    startPracticeBtn.addEventListener('click', startPractice);
    backToSelectionBtn.addEventListener('click', backToSelection);
}

// --- Start the Game ---
document.addEventListener('DOMContentLoaded', initGame);