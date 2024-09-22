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
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    document.getElementById('end-screen').style.display = 'none';
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
    const resultElement = document.getElementById('result');
    const explanationElement = document.getElementById('explanation');
    const scoreElement = document.getElementById('score');

    if (answer.isCorrect) {
        resultElement.textContent = 'Correct! Well done!';
        resultElement.style.color = 'green';
        score++;
        answeredCorrectly.add(question.question);
    } else {
        resultElement.textContent = 'Sorry, that\'s incorrect.';
        resultElement.style.color = 'red';
    }

    explanationElement.textContent = answer.explanation;
    currentQuestionIndex++;
    scoreElement.textContent = `Score: ${score} / ${currentQuestionIndex}`;

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next Question';
    nextButton.onclick = loadQuestion;
    optionsContainer.appendChild(nextButton);

    saveProgress();
}

function endQuiz() {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'block';
    
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
        answeredCorrectly: Array.from(answeredCorrectly),
        totalAnswered: allQuestions.length
    };
    localStorage.setItem('quizProgress', JSON.stringify(progress));
}

function loadProgress() {
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        answeredCorrectly = new Set(progress.answeredCorrectly);
        
        // Update the start screen with progress information
        const startScreen = document.getElementById('start-screen');
        const progressInfo = document.createElement('p');
        progressInfo.textContent = `You've correctly answered ${answeredCorrectly.size} out of ${progress.totalAnswered} questions.`;
        startScreen.insertBefore(progressInfo, startScreen.lastElementChild);
    }
}