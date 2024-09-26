let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answeredCorrectly = new Set();

const QUESTIONS_PER_ROUND = 5;

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', startQuiz);

    const nextRoundButton = document.getElementById('next-round-button');
    nextRoundButton.addEventListener('click', startQuiz);

    const resetQuizButton = document.getElementById('reset-quiz-button');
    resetQuizButton.addEventListener('click', resetQuiz);

    const exitButton = document.getElementById('exit-button');
    exitButton.addEventListener('click', confirmExit);

    // Load questions from JSON file
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

    // If we don't have enough unanswered questions, add some answered ones
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
    
    // Shuffle the answers for this question
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
}

function loadProgress() {
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        answeredCorrectly = new Set(progress.answeredCorrectly);
        
        // Update the start screen with progress information
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