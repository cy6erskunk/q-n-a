import {
    authEnabled,
    initAuth,
    onSessionChange,
    getSession,
    getUser,
    signIn,
    signUp,
    signOut,
} from './auth.js';
import {
    dataApiEnabled,
    fetchProgress,
    saveProgressToCloud,
    deleteProgressFromCloud,
} from './api.js';

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

const CHECKMARK_SVG = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>';
const X_SVG = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>';

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isAuthenticated() {
    return Boolean(getSession());
}

function canSyncToCloud() {
    return authEnabled && dataApiEnabled && isAuthenticated();
}

// ─── Auth UI ───────────────────────────────────────────────

function setupAuthUI() {
    const authButton = document.getElementById('auth-button');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');
    const signOutButton = document.getElementById('sign-out-button');
    const authDialog = document.getElementById('auth-dialog');
    const closeAuth = document.getElementById('close-auth');
    const tabSignin = document.getElementById('tab-signin');
    const tabSignup = document.getElementById('tab-signup');
    const authForm = document.getElementById('auth-form');
    const nameField = document.getElementById('name-field');
    const authDialogTitle = document.getElementById('auth-dialog-title');
    const authSubmit = document.getElementById('auth-submit');
    const authError = document.getElementById('auth-error');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchBtn = document.getElementById('auth-switch-btn');

    if (!authEnabled) return;

    // Show the sign-in button
    authButton.classList.remove('hidden');

    let isSignUpMode = false;

    function setMode(signUp) {
        isSignUpMode = signUp;
        if (signUp) {
            tabSignup.classList.add('active');
            tabSignin.classList.remove('active');
            nameField.classList.remove('hidden');
            authDialogTitle.textContent = 'Sign Up';
            authSubmit.textContent = 'Sign Up';
            authSwitchText.textContent = 'Already have an account?';
            authSwitchBtn.textContent = 'Sign In';
            document.getElementById('auth-password').autocomplete = 'new-password';
        } else {
            tabSignin.classList.add('active');
            tabSignup.classList.remove('active');
            nameField.classList.add('hidden');
            authDialogTitle.textContent = 'Sign In';
            authSubmit.textContent = 'Sign In';
            authSwitchText.textContent = "Don't have an account?";
            authSwitchBtn.textContent = 'Sign Up';
            document.getElementById('auth-password').autocomplete = 'current-password';
        }
        authError.classList.add('hidden');
    }

    authButton.addEventListener('click', () => {
        setMode(false);
        authDialog.showModal();
    });

    closeAuth.addEventListener('click', () => authDialog.close());
    authDialog.addEventListener('click', (e) => {
        if (e.target === authDialog) authDialog.close();
    });

    tabSignin.addEventListener('click', () => setMode(false));
    tabSignup.addEventListener('click', () => setMode(true));
    authSwitchBtn.addEventListener('click', () => setMode(!isSignUpMode));

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authError.classList.add('hidden');
        authSubmit.disabled = true;
        authSubmit.textContent = isSignUpMode ? 'Signing up...' : 'Signing in...';

        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name').value;

        try {
            if (isSignUpMode) {
                await signUp(email, password, name || email.split('@')[0]);
            } else {
                await signIn(email, password);
            }
            authDialog.close();
            authForm.reset();
        } catch (err) {
            authError.textContent = err.message;
            authError.classList.remove('hidden');
        } finally {
            authSubmit.disabled = false;
            authSubmit.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
        }
    });

    signOutButton.addEventListener('click', async () => {
        await signOut();
    });

    // React to session changes
    onSessionChange((session) => {
        if (session) {
            authButton.classList.add('hidden');
            userInfo.classList.remove('hidden');
            userEmail.textContent = session.user?.email || '';
            onSignIn();
        } else {
            authButton.classList.remove('hidden');
            userInfo.classList.add('hidden');
            userEmail.textContent = '';
        }
    });
}

// ─── Cloud sync ────────────────────────────────────────────

function showSyncStatus(message) {
    const el = document.getElementById('sync-status');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

async function onSignIn() {
    if (!canSyncToCloud()) return;

    try {
        showSyncStatus('Syncing progress...');
        const cloudData = await fetchProgress();

        if (cloudData) {
            // Merge: union of local + cloud answered questions
            const cloudSet = new Set(cloudData.answered_correctly || []);
            const localSet = answeredCorrectly;
            const merged = new Set([...localSet, ...cloudSet]);

            const localOnly = [...localSet].filter(q => !cloudSet.has(q));
            const cloudOnly = [...cloudSet].filter(q => !localSet.has(q));

            answeredCorrectly = merged;

            // Use cloud settings if local hasn't been customized
            if (cloudData.questions_per_round && !localStorage.getItem('questionsPerRound')) {
                questionCountPerQuiz = cloudData.questions_per_round;
                initialQuestionCountPerQuiz = questionCountPerQuiz;
            }
            if (cloudData.exam_questions_count && !localStorage.getItem('examQuestionsCount')) {
                questionCountPerExam = cloudData.exam_questions_count;
                initialQuestionCountPerExam = questionCountPerExam;
            }

            // Upload merged data if local had questions cloud didn't
            if (localOnly.length > 0) {
                await saveCurrentProgressToCloud();
            }

            // Update localStorage with merged data
            saveProgressToLocal();
            updateSettingsUI();
        } else {
            // No cloud data — upload local progress
            await saveCurrentProgressToCloud();
        }

        updateLearningProgress();
        showSyncStatus('Progress synced');
    } catch (err) {
        console.error('Sync failed:', err);
        showSyncStatus('Sync failed');
    }
}

async function saveCurrentProgressToCloud() {
    if (!canSyncToCloud()) return;
    try {
        await saveProgressToCloud({
            answeredCorrectly: Array.from(answeredCorrectly),
            questionsPerRound: questionCountPerQuiz,
            examQuestionsCount: questionCountPerExam,
        });
    } catch (err) {
        console.error('Cloud save failed:', err);
    }
}

// ─── Local persistence ────────────────────────────────────

function saveProgressToLocal() {
    const progress = {
        answeredCorrectly: Array.from(answeredCorrectly),
    };
    localStorage.setItem('quizProgress', JSON.stringify(progress));
    localStorage.setItem('questionsPerRound', questionCountPerQuiz);
}

function loadProgressFromLocal() {
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        answeredCorrectly = new Set(progress.answeredCorrectly);
    }
}

// ─── Combined save/load ───────────────────────────────────

function saveProgress() {
    saveProgressToLocal();
    saveCurrentProgressToCloud();
}

function loadProgress() {
    loadProgressFromLocal();
    updateLearningProgress();
}

// ─── Settings UI helpers ──────────────────────────────────

function updateSettingsUI() {
    const questionsPerRoundInput = document.getElementById('questions-per-round');
    const questionsValue = document.getElementById('questions-value');
    const questionsCount = document.getElementById('questions-count');
    const examQuestionsCountInput = document.getElementById('exam-questions-count');
    const examQuestionsValue = document.getElementById('exam-questions-value');
    const examQuestionsCountDisplay = document.getElementById('exam-questions-count-display');

    questionsPerRoundInput.value = questionCountPerQuiz;
    questionsValue.textContent = questionCountPerQuiz;
    questionsCount.textContent = questionCountPerQuiz;
    examQuestionsCountInput.value = questionCountPerExam;
    examQuestionsValue.textContent = questionCountPerExam;
    examQuestionsCountDisplay.textContent = questionCountPerExam;
}

// ─── DOMContentLoaded ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const startExamButton = document.getElementById('start-exam');
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

    nextRoundButton.addEventListener('click', () => {
        startQuiz();
    });

    resetQuizButton.addEventListener('click', resetQuiz);
    exitButton.addEventListener('click', confirmExit);

    const headerContent = document.getElementById('app-header').querySelector('.app-header-content');
    headerContent.addEventListener('click', goHome);
    headerContent.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goHome();
        }
    });

    settingsButton.addEventListener('click', () => {
        questionsPerRoundInput.value = questionCountPerQuiz;
        questionsValue.textContent = questionCountPerQuiz;
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

        initialQuestionCountPerQuiz = questionCountPerQuiz;
        initialQuestionCountPerExam = questionCountPerExam;

        // Sync settings to cloud
        saveCurrentProgressToCloud();

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

    // Set up auth UI (no-op if auth not configured)
    setupAuthUI();

    // Load questions, then progress, then try cloud sync
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data;
            loadProgress();
            // Initialize auth and sync (non-blocking)
            initAuth();
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
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('end-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    document.getElementById('settings-button').classList.add('hidden');

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

    // Update progress bar
    document.getElementById('progress-counter').textContent = `${currentQuestionIndex + 1} of ${currentQuestionsAmount}`;
    const progressPercentage = ((currentQuestionIndex + 1) / currentQuestionsAmount) * 100;
    document.getElementById('quiz-progress-fill').style.width = progressPercentage + '%';

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    const shuffledAnswers = [...question.answers];
    shuffleArray(shuffledAnswers);

    shuffledAnswers.forEach(answer => {
        const button = document.createElement('button');
        button.classList.add('option-btn');
        if (answer.isCorrect) button.dataset.correct = 'true';
        button.innerHTML = `<span class="option-radio"></span><span class="option-text">${escapeHtml(answer.text)}</span>`;
        button.onclick = () => checkAnswer(answer, question, button);
        optionsContainer.appendChild(button);
    });

    // Reset feedback
    document.getElementById('result').textContent = '';
    document.getElementById('explanation').textContent = '';
    document.getElementById('feedback-section').classList.add('hidden');
    document.getElementById('next-step').classList.add('hidden');
}

function checkAnswer(selectedOption, question, selectedButton) {
    const optionsContainer = document.getElementById('options');
    const buttons = optionsContainer.querySelectorAll('.option-btn');

    // Disable all buttons
    buttons.forEach(btn => {
        btn.disabled = true;
    });

    if (selectedOption.isCorrect) {
        score++;
    }

    if (!isExamMode) {
        // Find and highlight the correct answer by data attribute
        buttons.forEach(btn => {
            if (btn.dataset.correct === 'true') {
                btn.classList.add('correct');
                btn.querySelector('.option-radio').innerHTML = CHECKMARK_SVG;
            }
        });

        if (selectedOption.isCorrect) {
            answeredCorrectly.add(question.question);
        } else {
            selectedButton.classList.add('incorrect');
            selectedButton.querySelector('.option-radio').innerHTML = X_SVG;
        }

        // Show feedback
        const resultElement = document.getElementById('result');
        const explanationElement = document.getElementById('explanation');
        const feedbackSection = document.getElementById('feedback-section');

        feedbackSection.classList.remove('hidden');

        if (selectedOption.isCorrect) {
            resultElement.textContent = 'Correct!';
            resultElement.className = 'result-text correct';
        } else {
            resultElement.textContent = 'Incorrect';
            resultElement.className = 'result-text incorrect';
        }

        // Strip "Correct." / "Incorrect." prefix from explanation
        let explanation = selectedOption.explanation || '';
        explanation = explanation.replace(/^(Correct|Incorrect)\.?\s*/i, '');
        explanationElement.textContent = explanation;
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
        nextButton.textContent = currentQuestionIndex < currentQuestions.length ? 'Next Question' : 'Finish Session';
        nextButton.onclick = loadQuestion;
        saveProgress();
    }
}

function endQuiz() {
    const quizScreen = document.getElementById('quiz-screen');
    const endScreen = document.getElementById('end-screen');

    quizScreen.classList.add('hidden');
    endScreen.classList.remove('hidden');
    document.getElementById('settings-button').classList.remove('hidden');

    document.getElementById('results-title').textContent =
        isExamMode ? 'Exam Completed!' : 'Session Completed!';

    const totalQuestions = currentQuestionsAmount;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Update circular score indicator
    updateScoreCircle(percentage);

    // Update score text
    document.getElementById('final-score').innerHTML =
        `<strong>${score}</strong> correct out of <strong>${totalQuestions}</strong> questions`;

    // Score message
    let message = '';
    if (isExamMode) {
        if (percentage >= 80) {
            message = 'Excellent! You passed the exam with flying colors!';
        } else if (percentage >= 60) {
            message = 'Good job! You passed the exam!';
        } else {
            message = 'Keep practicing! You can try again.';
        }
    } else {
        if (percentage >= 80) {
            message = "Excellent! You're on your way to becoming a knowledgeable referee.";
        } else if (percentage >= 60) {
            message = "Good job! You're on your way to becoming a knowledgeable referee.";
        } else {
            message = "Keep practicing! You'll improve with more study sessions.";
        }
    }
    document.getElementById('score-message').textContent = message;

    document.getElementById('total-score').textContent =
        `Total Questions Answered Correctly: ${answeredCorrectly.size} / ${allQuestions.length}`;

    if (isExamMode) {
        isExamMode = false;
    }

    saveProgress();
}

function updateScoreCircle(percentage) {
    const circle = document.getElementById('score-fill');
    const circumference = 2 * Math.PI * 50;
    const offset = circumference * (1 - percentage / 100);

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;

    document.getElementById('score-percentage').textContent = percentage + '%';
}

function updateLearningProgress() {
    const progressInfo = document.getElementById('progress-info');
    const progressFill = document.getElementById('learning-progress-fill');
    const learned = answeredCorrectly.size;
    const total = allQuestions.length;

    progressInfo.textContent = `${learned} of ${total} questions learned`;

    const percentage = total > 0 ? (learned / total) * 100 : 0;
    progressFill.style.width = percentage + '%';
}

function resetQuiz() {
    answeredCorrectly.clear();
    localStorage.removeItem('quizProgress');
    localStorage.removeItem('examQuestionsCount');
    localStorage.removeItem('questionsPerRound');

    // Also clear cloud data if signed in
    if (canSyncToCloud()) {
        deleteProgressFromCloud().catch(err => console.error('Cloud delete failed:', err));
    }

    document.getElementById('settings-button').classList.remove('hidden');
    location.reload();
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
    updateLearningProgress();
}

function goHome() {
    const quizScreen = document.getElementById('quiz-screen');
    const endScreen = document.getElementById('end-screen');
    const startScreen = document.getElementById('start-screen');

    // Already on start screen
    if (!startScreen.classList.contains('hidden')) return;

    // During quiz, ask for confirmation
    if (!quizScreen.classList.contains('hidden')) {
        confirmExit();
        return;
    }

    // From end screen, go directly home
    if (!endScreen.classList.contains('hidden')) {
        exitQuiz();
    }
}
