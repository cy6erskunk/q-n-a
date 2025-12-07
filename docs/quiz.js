let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answeredCorrectly = new Set();
let isExamMode = false;

const QUESTIONS_PER_QUIZ_DEFAULT = 5;
const QUESTIONS_PER_EXAM_DEFAULT = 30;
let questionCountPerExam = parseInt(localStorage.getItem('examQuestionsCount')) || QUESTIONS_PER_EXAM_DEFAULT;
let questionCountPerQuiz = parseInt(localStorage.getItem('questionsPerRound')) || QUESTIONS_PER_QUIZ_DEFAULT;
let currentQuestionsAmount = questionCountPerQuiz;
let initialQuestionCountPerQuiz = questionCountPerQuiz;
let initialQuestionCountPerExam = questionCountPerExam;

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const startExamButton = document.getElementById('start-exam');
    const resetQuizButton = document.getElementById('reset-quiz-button');
    const exitButton = document.getElementById('exit-button');
    const settingsButtons = document.querySelectorAll('.settings-button');
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

    examQuestionsValue.textContent = examQuestionsCountInput.value;

    questionsPerRoundInput.value = questionCountPerQuiz;
    questionsValue.textContent = questionCountPerQuiz;
    questionsCount.textContent = questionCountPerQuiz;

    examQuestionsCountInput.value = questionCountPerExam;
    examQuestionsValue.textContent = questionCountPerExam;
    examQuestionsCountDisplay.textContent = questionCountPerExam;

    startExamButton.addEventListener('click', () => {
        isExamMode = true;
        startQuiz();
    });

    startButton.addEventListener('click', () => {
        isExamMode = false;
        startQuiz();
    });

    resetQuizButton.addEventListener('click', resetQuiz);
    exitButton.addEventListener('click', confirmExit);

    settingsButtons.forEach(button => {
        button.addEventListener('click', () => {
            questionsPerRoundInput.value = questionCountPerQuiz;
            questionsValue.textContent = questionCountPerQuiz;
            settingsDialog.showModal();
        });
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
        const newPracticeValue = parseInt(questionsPerRoundInput.value);
        if (newPracticeValue >= 1 && newPracticeValue <= 50) {
            questionCountPerQuiz = newPracticeValue;
            questionsValue.textContent = newPracticeValue;
            questionsCount.textContent = newPracticeValue;
            localStorage.setItem('questionsPerRound', newPracticeValue);
        }

        const newExamValue = parseInt(examQuestionsCountInput.value);
        if (newExamValue >= 5 && newExamValue <= 100) {
            questionCountPerExam = newExamValue;
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
        questionCountPerQuiz = initialQuestionCountPerQuiz;
        questionsPerRoundInput.value = initialQuestionCountPerQuiz;
        questionsValue.textContent = initialQuestionCountPerQuiz;

        questionCountPerExam = initialQuestionCountPerExam;
        examQuestionsCountInput.value = initialQuestionCountPerExam;
        examQuestionsValue.textContent = initialQuestionCountPerExam;
        examQuestionsCountDisplay.textContent = initialQuestionCountPerExam;
    }

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

    currentQuestions = unansweredQuestions.slice(0, currentQuestionsAmount);

    if (currentQuestions.length < currentQuestionsAmount) {
        let answeredQuestions = allQuestions.filter(q => answeredCorrectly.has(q.question));
        shuffleArray(answeredQuestions);
        currentQuestions = currentQuestions.concat(
            answeredQuestions.slice(0, currentQuestionsAmount - currentQuestions.length)
        );
    }

    shuffleArray(currentQuestions);
}

function startQuiz() {
    // Reset start screen to initial state
    document.getElementById('welcome-heading').textContent = 'Welcome to the Fencing Quiz!';
    document.getElementById('welcome-text').classList.remove('hidden');
    document.getElementById('final-score').classList.add('hidden');
    document.getElementById('total-score').classList.add('hidden');
    document.getElementById('start-button').textContent = 'Start Quiz';

    // Hide start screen and show quiz screen
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');

    const resultElement = document.getElementById('result');
    if (resultElement) {
        resultElement.textContent = '';
        resultElement.style.color = '';
    }

    currentQuestionIndex = 0;
    score = 0;

    currentQuestionsAmount = isExamMode ? questionCountPerExam : questionCountPerQuiz;
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
    optionsContainer.style.color = '';

    const shuffledAnswers = [...question.answers];
    shuffleArray(shuffledAnswers);

    shuffledAnswers.forEach(answer => {
        const button = document.createElement('button');
        button.classList.add('btn', 'full-width-btn');
        button.textContent = answer.text;
        button.onclick = () => checkAnswer(answer, question);
        optionsContainer.appendChild(button);
    });

    document.getElementById('result').textContent = '';
    document.getElementById('explanation').textContent = '';

    if (!isExamMode) {
        document.getElementById('score').textContent = `Score: ${score} / ${currentQuestionIndex}`;
    } else {
        document.getElementById('score').textContent = '';
    }

    document.getElementById('next-step').classList.add('hidden');
    document.getElementById('progress').textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestionsAmount}`;
}

function checkAnswer(selectedOption, question) {
    const explanationElement = document.getElementById('explanation');
    const scoreElement = document.getElementById('score');
    const resultElement = document.getElementById('result');
    const optionsContainer = document.getElementById('options');

    if (selectedOption.isCorrect) {
        score++;
        if (!isExamMode) {
            optionsContainer.innerHTML = '';
            optionsContainer.textContent = selectedOption.text;
            optionsContainer.style.color = 'green';
            answeredCorrectly.add(question.question);
            resultElement.textContent = 'Correct!';
            resultElement.style.color = 'green';
            explanationElement.textContent = selectedOption.explanation || '';
        }
    } else if (!isExamMode) {
        optionsContainer.innerHTML = '';
        optionsContainer.textContent = selectedOption.text;
        optionsContainer.style.color = 'red';
        resultElement.textContent = 'Incorrect!';
        resultElement.style.color = 'red';
        explanationElement.textContent = selectedOption.explanation || '';
    }

    currentQuestionIndex++;

    if (isExamMode) {
        if (currentQuestionIndex < currentQuestions.length) {
            setTimeout(loadQuestion, 100);
        } else {
            endQuiz();
        }
    } else {
        document.getElementById('next-step').classList.remove('hidden');
        const nextButton = document.getElementById('next-button');
        nextButton.textContent = currentQuestionIndex < currentQuestions.length ? 'Next Question' : 'Finish Quiz';
        nextButton.onclick = loadQuestion;
        scoreElement.textContent = `Score: ${score} / ${currentQuestionIndex}`;
        saveProgress();
    }
}

function endQuiz() {
    const quizScreen = document.getElementById('quiz-screen');
    const startScreen = document.getElementById('start-screen');
    const finalScore = document.getElementById('final-score');
    const welcomeHeading = document.getElementById('welcome-heading');
    const welcomeText = document.getElementById('welcome-text');
    const startButton = document.getElementById('start-button');

    quizScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');

    // Update start screen to show results
    welcomeHeading.textContent = 'Round Completed!';
    welcomeText.classList.add('hidden');
    finalScore.classList.remove('hidden');
    document.getElementById('total-score').classList.remove('hidden');
    startButton.textContent = 'Start Next Round';

    if (isExamMode) {
        const percentage = Math.round((score / questionCountPerExam) * 100);
        let message = '';
        if (percentage >= 80) {
            message = 'Excellent! You passed the exam with flying colors!';
        } else if (percentage >= 60) {
            message = 'Good job! You passed the exam!';
        } else {
            message = 'Keep practicing! You can try again.';
        }
        finalScore.textContent = `You scored ${score} out of ${questionCountPerExam} (${percentage}%)\n${message}`;
        isExamMode = false;
    } else {
        finalScore.textContent = `You scored ${score} out of ${questionCountPerQuiz}`;
    }

    document.getElementById('total-score').textContent = `Total Questions Answered Correctly: ${answeredCorrectly.size} / ${allQuestions.length}`;

    saveProgress();
}

function resetQuiz() {
    answeredCorrectly.clear();
    localStorage.removeItem('quizProgress');
    localStorage.removeItem('examQuestionsCount');
    localStorage.removeItem('questionsPerRound');
    location.reload();
}

function saveProgress() {
    const progress = {
        answeredCorrectly: Array.from(answeredCorrectly)
    };
    localStorage.setItem('quizProgress', JSON.stringify(progress));
    localStorage.setItem('questionsPerRound', questionCountPerQuiz);
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

    // Reset start screen to initial state
    document.getElementById('welcome-heading').textContent = 'Welcome to the Fencing Quiz!';
    document.getElementById('welcome-text').classList.remove('hidden');
    document.getElementById('final-score').classList.add('hidden');
    document.getElementById('total-score').classList.add('hidden');
    document.getElementById('start-button').textContent = 'Start Quiz';

    document.getElementById('start-screen').classList.remove('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
}