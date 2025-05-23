let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answeredCorrectly = new Set();

const INITIAL_QUESTIONS_PER_ROUND = 5;
let QUESTIONS_PER_ROUND = parseInt(localStorage.getItem('questionsPerRound')) || INITIAL_QUESTIONS_PER_ROUND;

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
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
    const settingsDialog = document.getElementById('settings-dialog');

    let initialQuestionsPerRound = QUESTIONS_PER_ROUND;

    startButton.addEventListener('click', startQuiz);
    nextRoundButton.addEventListener('click', startQuiz);
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
        QUESTIONS_PER_ROUND = parseInt(questionsPerRoundInput.value);
        questionsCount.textContent = QUESTIONS_PER_ROUND;
        localStorage.setItem('questionsPerRound', QUESTIONS_PER_ROUND);
        settingsDialog.close();
    });

    questionsPerRoundInput.addEventListener('input', (e) => {
        questionsValue.textContent = e.target.value;
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
    }

    questionsCount.textContent = QUESTIONS_PER_ROUND;

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
    selectQuestions();
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    document.getElementById('end-screen').classList.add('hidden');
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
    document.getElementById('next-step').classList.add('hidden');

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
    document.getElementById('score').textContent = `Score: ${score} / ${currentQuestionIndex}`;
    document.getElementById('progress').textContent = `Question ${currentQuestionIndex + 1} of ${QUESTIONS_PER_ROUND}`;
}

function checkAnswer(answer, question) {
    const explanationElement = document.getElementById('explanation');
    const scoreElement = document.getElementById('score');


    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    optionsContainer.textContent = answer.text;

    if (answer.isCorrect) {
        optionsContainer.style.color = 'green';
        score++;
        answeredCorrectly.add(question.question);
    } else {
        optionsContainer.style.color = 'red';
    }

    explanationElement.textContent = answer.explanation;
    currentQuestionIndex++;
    scoreElement.textContent = `Score: ${score} / ${currentQuestionIndex}`;

    document.getElementById('next-step').classList.remove('hidden');
    const nextButton = document.getElementById('next-button');
    nextButton.textContent = currentQuestionIndex < currentQuestions.length ? 'Next Question' : 'Finish Quiz';
    nextButton.onclick = loadQuestion;

    saveProgress();
}

function endQuiz() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('end-screen').classList.remove('hidden');
    document.getElementById('final-score').textContent = `Your Score: ${score} / ${QUESTIONS_PER_ROUND}`;
    document.getElementById('total-score').textContent = `Total Questions Answered Correctly: ${answeredCorrectly.size} / ${allQuestions.length}`;
    saveProgress();
}

function resetQuiz() {
    answeredCorrectly.clear();
    localStorage.removeItem('quizProgress');
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
}