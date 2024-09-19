let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let answeredCorrectly = new Set();

const QUESTIONS_PER_ROUND = 5;

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', startQuiz);

    // Load questions from JSON file
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data;
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
}

function endQuiz() {
    const quizScreen = document.getElementById('quiz-screen');
    quizScreen.innerHTML = `
        <h1>Round Completed!</h1>
        <p>Your Score: ${score} / ${QUESTIONS_PER_ROUND}</p>
        <p>Total Questions Answered Correctly: ${answeredCorrectly.size} / ${allQuestions.length}</p>
        <button onclick="startQuiz()">Start Next Round</button>
        <button onclick="resetQuiz()">Reset Quiz</button>
    `;
}

function resetQuiz() {
    answeredCorrectly.clear();
    location.reload();
}