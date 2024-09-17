let questions = [];
let currentQuestionIndex = 0;
let score = 0;

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', startQuiz);

    // Load questions from JSON file
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data;
        })
        .catch(error => console.error('Error loading questions:', error));
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function startQuiz() {
    shuffleArray(questions);
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        endQuiz();
        return;
    }

    const question = questions[currentQuestionIndex];
    document.getElementById('question').textContent = question.question;
    
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    // Shuffle the answers for this question
    const shuffledAnswers = [...question.answers];
    shuffleArray(shuffledAnswers);
    
    shuffledAnswers.forEach(answer => {
        const button = document.createElement('button');
        button.textContent = answer.text;
        button.onclick = () => checkAnswer(answer);
        optionsContainer.appendChild(button);
    });

    document.getElementById('result').textContent = '';
    document.getElementById('explanation').textContent = '';
    document.getElementById('score').textContent = `Score: ${score} / ${currentQuestionIndex}`;
}

function checkAnswer(answer) {
    const resultElement = document.getElementById('result');
    const explanationElement = document.getElementById('explanation');
    const scoreElement = document.getElementById('score');

    if (answer.isCorrect) {
        resultElement.textContent = 'Correct! Well done!';
        resultElement.style.color = 'green';
        score++;
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
        <h1>Quiz Completed!</h1>
        <p>Final Score: ${score} / ${questions.length}</p>
        <button onclick="location.reload()">Restart Quiz</button>
    `;
}