let questions = [];
let currentQuestionIndex = 0;
let score = 0;

// Load questions from JSON file
fetch('questions.json')
    .then(response => response.json())
    .then(data => {
        questions = data;
        loadQuestion();
    })
    .catch(error => console.error('Error loading questions:', error));

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        endQuiz();
        return;
    }

    const question = questions[currentQuestionIndex];
    document.getElementById('question').textContent = question.question;
    
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    question.answers.forEach(answer => {
        const button = document.createElement('button');
        button.textContent = answer.text;
        button.onclick = () => checkAnswer(answer);
        optionsContainer.appendChild(button);
    });

    document.getElementById('result').textContent = '';
    document.getElementById('explanation').textContent = '';
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
    const container = document.querySelector('.container');
    container.innerHTML = `
        <h1>Quiz Completed!</h1>
        <p>Final Score: ${score} / ${questions.length}</p>
    `;
}