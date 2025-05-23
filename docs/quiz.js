let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answeredCorrectly = new Set();
let isExamMode = false;

const INITIAL_QUESTIONS_PER_ROUND = 5;
let EXAM_QUESTIONS_COUNT = 30;
let QUESTIONS_PER_ROUND = parseInt(localStorage.getItem('questionsPerRound')) || INITIAL_QUESTIONS_PER_ROUND;

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const startExamButton = document.getElementById('start-exam');
    const startExamEndButton = document.getElementById('start-exam-end');
    const nextRoundButton = document.getElementById('next-round-button');
    const resetQuizButton = document.getElementById('reset-quiz-button');
    const exitButton = document.getElementById('exit-button');
    const settingsButton = document.getElementById('settings-button');
    const closeSettings = document.getElementById('close-settings');
    const cancelSettings = document.getElementById('cancel-settings');
    const saveSettings = document.getElementById('save-settings');
    const questionsPerRoundInput = document.getElementById('questions-per-round');
    const questionsValue = document.getElementById('questions-value');
    const questionsCount = document.getElementById('questions-count');
    const examQuestionsCountInput = document.getElementById('exam-questions-count');
    const examQuestionsValue = document.getElementById('exam-questions-value');
    const examQuestionsCountDisplay = document.getElementById('exam-questions-count-display');
    const settingsDialog = document.getElementById('settings-dialog');

    // Initialize settings
    let initialQuestionsPerRound = QUESTIONS_PER_ROUND;
    let initialExamQuestionsCount = EXAM_QUESTIONS_COUNT;

    // Initialize exam questions slider value
    examQuestionsValue.textContent = examQuestionsCountInput.value;

    // Load saved settings if they exist
    if (localStorage.getItem('questionsPerRound')) {
        QUESTIONS_PER_ROUND = parseInt(localStorage.getItem('questionsPerRound'));
        initialQuestionsPerRound = QUESTIONS_PER_ROUND;
        questionsPerRoundInput.value = QUESTIONS_PER_ROUND;
        questionsValue.textContent = QUESTIONS_PER_ROUND;
        questionsCount.textContent = QUESTIONS_PER_ROUND;
    }

    if (localStorage.getItem('examQuestionsCount')) {
        const savedCount = parseInt(localStorage.getItem('examQuestionsCount'));
        EXAM_QUESTIONS_COUNT = savedCount;
        initialExamQuestionsCount = savedCount;
        examQuestionsCountInput.value = savedCount;
        examQuestionsValue.textContent = savedCount;
        examQuestionsCountDisplay.textContent = savedCount;
    }

    // Start exam mode from start screen
    startExamButton.addEventListener('click', () => {
        isExamMode = true;
        startQuiz();
    });

    // Start exam mode from end screen
    startExamEndButton.addEventListener('click', () => {
        isExamMode = true;
        startQuiz();
    });

    // Initial values are now set at the top with the rest of the settings

    startButton.addEventListener('click', () => {
        isExamMode = false;
        startQuiz();
    });

    nextRoundButton.addEventListener('click', () => {
        // Keep the current mode (exam or practice) when starting a new round
        startQuiz();
    });

    resetQuizButton.addEventListener('click', resetQuiz);
    exitButton.addEventListener('click', confirmExit);

    settingsButton.addEventListener('click', () => {
        initialQuestionsPerRound = QUESTIONS_PER_ROUND;
        questionsPerRoundInput.value = QUESTIONS_PER_ROUND;
        questionsValue.textContent = QUESTIONS_PER_ROUND;
        settingsDialog.showModal();
    });

    closeSettings.addEventListener('click', () => {
        resetToInitialValues();
        settingsDialog.close();
    });
    cancelSettings.addEventListener('click', () => {
        resetToInitialValues();
        settingsDialog.close();
    });
    saveSettings.addEventListener('click', () => {
        // Save practice questions count
        const newPracticeValue = parseInt(questionsPerRoundInput.value);
        if (newPracticeValue >= 1 && newPracticeValue <= 50) {
            QUESTIONS_PER_ROUND = newPracticeValue;
            questionsValue.textContent = newPracticeValue;
            questionsCount.textContent = newPracticeValue;
            localStorage.setItem('questionsPerRound', newPracticeValue);
        }

        // Save exam questions count
        const newExamValue = parseInt(examQuestionsCountInput.value);
        if (newExamValue >= 5 && newExamValue <= 100) {
            EXAM_QUESTIONS_COUNT = newExamValue;
            examQuestionsCountDisplay.textContent = newExamValue;
            localStorage.setItem('examQuestionsCount', newExamValue);
        }

        settingsDialog.close();
    });

    questionsPerRoundInput.addEventListener('input', (e) => {
        questionsValue.textContent = e.target.value;
    });

    examQuestionsCountInput.addEventListener('input', () => {
        examQuestionsValue.textContent = examQuestionsCountInput.value;
    });

    settingsDialog.addEventListener('click', (e) => {
        if (e.target === settingsDialog) {
            resetToInitialValues();
            settingsDialog.close();
        }
    });

    settingsDialog.addEventListener('cancel', (e) => {
        resetToInitialValues();
    });

    function resetToInitialValues() {
        QUESTIONS_PER_ROUND = initialQuestionsPerRound;
        questionsPerRoundInput.value = initialQuestionsPerRound;
        questionsValue.textContent = initialQuestionsPerRound;

        EXAM_QUESTIONS_COUNT = initialExamQuestionsCount;
        examQuestionsCountInput.value = initialExamQuestionsCount;
        examQuestionsValue.textContent = initialExamQuestionsCount;
        examQuestionsCountDisplay.textContent = initialExamQuestionsCount;
    }

    // Settings are now loaded at the top of the event listener

    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data;
            loadProgress();
        })
        .catch(error => console.error('Error loading questions:', error));
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function selectQuestions() {
    let unansweredQuestions = allQuestions.filter(q => !answeredCorrectly.has(q.question));
    shuffleArray(unansweredQuestions);

    currentQuestions = unansweredQuestions.slice(0, QUESTIONS_PER_ROUND);

    if (currentQuestions.length < QUESTIONS_PER_ROUND) {
        let answeredQuestions = allQuestions.filter(q => answeredCorrectly.has(q.question));
        shuffleArray(answeredQuestions);
        currentQuestions = currentQuestions.concat(
            answeredQuestions.slice(0, QUESTIONS_PER_ROUND - currentQuestions.length)
        );
    }

    shuffleArray(currentQuestions);
}

function startQuiz() {
    // Reset the UI
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('end-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    document.getElementById('settings-button').classList.add('hidden');

    // Clear any previous result messages
    const resultElement = document.getElementById('result');
    if (resultElement) {
        resultElement.textContent = '';
        resultElement.style.color = '';
    }

    // Reset quiz state
    currentQuestionIndex = 0;
    score = 0;

    // Set the number of questions based on mode
    QUESTIONS_PER_ROUND = isExamMode ? EXAM_QUESTIONS_COUNT : QUESTIONS_PER_ROUND;

    // Start the quiz
    selectQuestions();
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        endQuiz();
        return;
    }

    const question = currentQuestions[currentQuestionIndex];
    document.getElementById('question').textContent = question.question;

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    optionsContainer.style.color = ''; // Reset color

    // Update progress text
    const progressText = `Question ${currentQuestionIndex + 1} of ${QUESTIONS_PER_ROUND}`;
    document.getElementById('progress').textContent = progressText;

    // Reset UI elements
    document.getElementById('result').textContent = '';
    document.getElementById('explanation').textContent = '';

    // Only show score in practice mode
    if (!isExamMode) {
        document.getElementById('score').textContent = `Score: ${score} / ${currentQuestionIndex}`;
    } else {
        document.getElementById('score').textContent = '';
    }

    // Hide next step in exam mode
    if (isExamMode) {
        document.getElementById('next-step').classList.add('hidden');
    }

    const shuffledAnswers = [...question.answers];
    shuffleArray(shuffledAnswers);

    shuffledAnswers.forEach(answer => {
        const button = document.createElement('button');
        button.textContent = answer.text;
        button.onclick = () => checkAnswer(answer, question);
        optionsContainer.appendChild(button);
    });

    document.getElementById('result').textContent = '';
    document.getElementById('explanation').textContent = '';
    // Progress is already updated at the start of the function
    document.getElementById('progress').textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
}

function checkAnswer(selectedOption, question) {
    const explanationElement = document.getElementById('explanation');
    const scoreElement = document.getElementById('score');
    const resultElement = document.getElementById('result');
    const optionsContainer = document.getElementById('options');

    // Update score if answer is correct
    if (selectedOption.isCorrect) {
        score++;
        if (!isExamMode) {
            // Show feedback for practice mode
            optionsContainer.innerHTML = '';
            optionsContainer.textContent = selectedOption.text;
            optionsContainer.style.color = 'green';
            answeredCorrectly.add(question.question);
            resultElement.textContent = 'Correct!';
            resultElement.style.color = 'green';
            explanationElement.textContent = selectedOption.explanation || '';
        }
    } else if (!isExamMode) {
        // Show feedback for incorrect answer in practice mode
        optionsContainer.innerHTML = '';
        optionsContainer.textContent = selectedOption.text;
        optionsContainer.style.color = 'red';
        resultElement.textContent = 'Incorrect!';
        resultElement.style.color = 'red';
        explanationElement.textContent = selectedOption.explanation || '';
    }

    // Move to next question or end quiz
    currentQuestionIndex++;

    if (isExamMode) {
        // In exam mode, automatically move to next question or end quiz
        if (currentQuestionIndex < currentQuestions.length) {
            // No need to update scoreElement here - loadQuestion will handle the progress
            // Small delay to show the question change
            setTimeout(loadQuestion, 100);
        } else {
            endQuiz();
        }
    } else {
        // In practice mode, show next button and score
        const nextStep = document.getElementById('next-step');
        nextStep.classList.remove('hidden');
        const nextButton = document.getElementById('next-button');
        nextButton.textContent = currentQuestionIndex < currentQuestions.length ? 'Next Question' : 'Finish Quiz';
        nextButton.onclick = loadQuestion;
        scoreElement.textContent = `Score: ${score} / ${currentQuestionIndex}`;
        saveProgress();
    }
}

function endQuiz() {
    const quizScreen = document.getElementById('quiz-screen');
    const endScreen = document.getElementById('end-screen');
    const finalScore = document.getElementById('final-score');

    // Hide quiz screen and show end screen
    quizScreen.classList.add('hidden');
    endScreen.classList.remove('hidden');
    document.getElementById('settings-button').classList.remove('hidden');

    if (isExamMode) {
        const percentage = Math.round((score / EXAM_QUESTIONS_COUNT) * 100);
        finalScore.textContent = `You scored ${score} out of ${EXAM_QUESTIONS_COUNT} (${percentage}%)`;

        // Clear any existing messages
        const existingMessages = document.querySelectorAll('#end-screen p:not(#final-score):not(#total-score)');
        existingMessages.forEach(msg => msg.remove());

        // Add pass/fail message
        const message = document.createElement('p');
        if (percentage >= 80) {
            message.textContent = 'Excellent! You passed the exam with flying colors!';
        } else if (percentage >= 60) {
            message.textContent = 'Good job! You passed the exam!';
        } else {
            message.textContent = 'Keep practicing! You can try again.';
        }
        finalScore.parentNode.insertBefore(message, finalScore.nextSibling);

        // Reset exam mode
        isExamMode = false;
    } else {
        finalScore.textContent = `You scored ${score} out of ${QUESTIONS_PER_ROUND}`;
    }

    // Update total score
    document.getElementById('total-score').textContent = `Total Questions Answered Correctly: ${answeredCorrectly.size} / ${allQuestions.length}`;

    saveProgress();
}

function resetQuiz() {
    answeredCorrectly.clear();
    localStorage.removeItem('quizProgress');
    document.getElementById('settings-button').classList.remove('hidden');
    location.reload();
}

function saveProgress() {
    const progress = {
        answeredCorrectly: Array.from(answeredCorrectly)
    };
    localStorage.setItem('quizProgress', JSON.stringify(progress));
    localStorage.setItem('questionsPerRound', QUESTIONS_PER_ROUND);
}

function loadProgress() {
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        answeredCorrectly = new Set(progress.answeredCorrectly);

        const progressInfo = document.getElementById('progress-info');
        progressInfo.textContent = `You've correctly answered ${answeredCorrectly.size} out of ${allQuestions.length} questions.`;
    }
}

function confirmExit() {
    if (confirm("Are you sure you want to exit?")) {
        exitQuiz();
    }
}

function exitQuiz() {
    currentQuestions = [];
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('end-screen').classList.add('hidden');
    document.getElementById('settings-button').classList.remove('hidden');
}