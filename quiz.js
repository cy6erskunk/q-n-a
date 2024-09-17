const questions = [
  {
    question:
      "Minimum for a fencer to rest between two direct elimination bouts?",
    answers: [
      {
        isCorrect: false,
        text: "5 minutes",
        explanation:
          "Though this seems reasonable, the FIE rules state a minimum rest of 10 minutes between two direct elimination bouts (Article t.122).",
      },
      {
        isCorrect: true,
        text: "10 minutes",
        explanation:
          "This is correct. According to Article t.122, a fencer must rest for at least 10 minutes between two direct elimination bouts.",
      },
      {
        isCorrect: false,
        text: "15 minutes",
        explanation:
          "This would allow more recovery, but the minimum rest required by FIE rules is 10 minutes, not 15 (Article t.122).",
      },
      {
        isCorrect: false,
        text: "No minimum rest is required",
        explanation:
          "Incorrect. The FIE mandates a minimum of 10 minutes rest between direct elimination bouts (Article t.122).",
      },
    ],
  },
  {
    question: "Minimum for a fencer to rest between two pool bouts?",
    answers: [
      {
        isCorrect: true,
        text: "No minimum rest is required",
        explanation:
          "Correct. The FIE rules do not require any minimum rest period between pool bouts (Article t.38).",
      },
      {
        isCorrect: false,
        text: "5 minutes",
        explanation:
          "Incorrect. While this might seem like a reasonable rest period, the rules do not require any rest between pool bouts.",
      },
      {
        isCorrect: false,
        text: "10 minutes",
        explanation:
          "Incorrect. There is no rule requiring a specific rest time between pool bouts in the FIE rules.",
      },
      {
        isCorrect: false,
        text: "15 minutes",
        explanation:
          "Incorrect. Fencers are expected to be ready for the next pool bout without any mandatory rest period.",
      },
    ],
  },
  {
    question:
      "If two fencers in a pool have the same nationality, what should the referee check in relation to the bout order?",
    answers: [
      {
        isCorrect: true,
        text: "Ensure the bout takes place as early as possible",
        explanation:
          "Correct. According to Article o.13, if two fencers in a pool share the same nationality, their bout should be scheduled as early as possible.",
      },
      {
        isCorrect: false,
        text: "Ensure the bout is scheduled last",
        explanation:
          "Incorrect. The rule is that fencers of the same nationality should fence each other as early as possible, not last.",
      },
      {
        isCorrect: false,
        text: "The referee should allow the fencers to decide the bout order",
        explanation:
          "Incorrect. The referee must follow the rules and ensure the bout happens early in the pool, not leave it to the fencers' discretion.",
      },
      {
        isCorrect: false,
        text: "The referee does not need to check anything special",
        explanation:
          "Incorrect. The referee must make sure the bout between two same-nationality fencers is fenced early, per Article o.13.",
      },
    ],
  },
  {
    question:
      "What should the referee do if scores are equal at the end of regulation time in a pool bout?",
    answers: [
      {
        isCorrect: true,
        text: "Proceed with an additional minute",
        explanation:
          "Correct. When scores are tied at the end of regulation time in a pool bout, the referee will call for an additional minute, as per Article t.38.",
      },
      {
        isCorrect: false,
        text: "Call the bout a draw",
        explanation:
          "Incorrect. There are no draws in fencing pool bouts. The rules require an additional minute for a deciding hit.",
      },
      {
        isCorrect: false,
        text: "Award the victory based on who was leading earlier",
        explanation:
          "Incorrect. Victory cannot be awarded based on earlier leads. The bout must be decided in the additional minute.",
      },
      {
        isCorrect: false,
        text: "Announce both fencers as winners",
        explanation:
          "Incorrect. There must be a clear winner. An additional minute of fencing is required to determine this.",
      },
    ],
  },
  {
    question:
      "If after the additional minute at the end of regulation time, neither of the fencers has managed to score a valid hit, what should the referee mark down on the score-sheet if the score is 0-0?",
    answers: [
      {
        isCorrect: true,
        text: "V0 - 0",
        explanation:
          "Correct. According to Article t.38, if no hit is scored during the additional minute, the winner is determined by a draw, and the score is marked as V0 - 0.",
      },
      {
        isCorrect: false,
        text: "V1 - 0",
        explanation:
          "Incorrect. The score remains 0 - 0, but the victor is marked as 'V' on the score sheet, not given an extra hit.",
      },
      {
        isCorrect: false,
        text: "The score remains 0 - 0 without a winner",
        explanation:
          "Incorrect. The winner is determined by drawing lots, and they are marked as 'V'. There cannot be a draw.",
      },
      {
        isCorrect: false,
        text: "Both fencers lose",
        explanation:
          "Incorrect. One fencer will win based on the drawing of lots, per Article t.38, even if no valid hit is scored.",
      },
    ],
  },
  {
    question:
      "In a team match, if the order of relay bouts is changed, intentionally or unintentionally, what should the referee do?",
    answers: [
      {
        isCorrect: true,
        text: "Correct the bout order and continue the match",
        explanation:
          "Correct. According to Article o.44.3, the referee should fix the order and continue the match from the current state without repeating the bouts that were fenced out of order.",
      },
      {
        isCorrect: false,
        text: "Restart the match",
        explanation:
          "Incorrect. The match does not need to be restarted. Only the correct order of the bouts needs to be enforced.",
      },
      {
        isCorrect: false,
        text: "Disqualify the team that changed the order",
        explanation:
          "Incorrect. The team is not disqualified for this error; the referee simply corrects the order and continues the match.",
      },
      {
        isCorrect: false,
        text: "Allow the fencers to continue in the wrong order",
        explanation:
          "Incorrect. The referee must fix the bout order as soon as it is noticed, per Article o.44.3.",
      },
    ],
  },
  {
    question:
      "In a team match, if when the score is 9-5 in the second relay, the fencer in the lead scores a valid hit and at the same time the opponent receives a red card, what should the referee record on the score-sheet?",
    answers: [
      {
        isCorrect: true,
        text: "11-5",
        explanation:
          "Correct. The score would increase by 1 for the valid hit (making it 10-5) and 1 for the penalty from the red card, making the final score 11-5 (Article t.87).",
      },
      {
        isCorrect: false,
        text: "10-5",
        explanation:
          "Incorrect. The red card adds a penalty hit to the score, so the correct result should be 11-5, not 10-5.",
      },
      {
        isCorrect: false,
        text: "9-6",
        explanation:
          "Incorrect. The fencer leading should receive 2 points, one for the valid hit and one for the red card penalty, increasing their score to 11.",
      },
      {
        isCorrect: false,
        text: "10-6",
        explanation:
          "Incorrect. The leading fencer receives the valid hit and the penalty hit, so the correct score should be 11-5, not 10-6.",
      },
    ],
  },
  {
    question:
      "In a team match, when should the replacement of a team member by the reserve fencer be announced?",
    answers: [
      {
        isCorrect: true,
        text: "Before the start of the next relay",
        explanation:
          "Correct. Article o.44.1 requires that the substitution of a team member must be announced before the start of the next relay.",
      },
      {
        isCorrect: false,
        text: "During the rest between relays",
        explanation:
          "Incorrect. The substitution must be announced before the start of the next relay, not during the rest.",
      },
      {
        isCorrect: false,
        text: "After the injured fencer has left the piste",
        explanation:
          "Incorrect. The announcement must happen before the start of the next relay, not after the injured fencer has already left the piste.",
      },
      {
        isCorrect: false,
        text: "At the end of the match",
        explanation:
          "Incorrect. The substitution must be made before the next relay, not after the match has finished, as per Article o.44.1.",
      },
    ],
  },
  {
    question:
      "In a team competition, can a fencer who has been replaced fence again in the same match?",
    answers: [
      {
        isCorrect: true,
        text: "No",
        explanation:
          "Correct. According to Article o.44.1, once a fencer is replaced, they cannot return to fence again in the same match.",
      },
      {
        isCorrect: false,
        text: "Yes, if it was a strategic substitution",
        explanation:
          "Incorrect. Regardless of whether the substitution was strategic or for injury, the replaced fencer cannot return to fence in the same match.",
      },
      {
        isCorrect: false,
        text: "Yes, if the reserve fencer is injured",
        explanation:
          "Incorrect. Once a fencer has been replaced, they cannot return under any circumstances during the same match.",
      },
      {
        isCorrect: false,
        text: "Yes, if the team captain requests it",
        explanation:
          "Incorrect. The rules do not allow a fencer to return to the match once they have been substituted, as per Article o.44.1.",
      },
    ],
  },
  {
    question:
      "In a team competition can a fencer who was replaced for medical reason fence again in the same match?",
    answers: [
      {
        isCorrect: true,
        text: "No",
        explanation:
          "Correct. According to Article o.44.1, a fencer replaced for medical reasons is not allowed to return and fence again in the same match.",
      },
      {
        isCorrect: false,
        text: "Yes, if they recover before the match ends",
        explanation:
          "Incorrect. The rules do not permit a fencer who has been substituted, even for medical reasons, to return during the same match.",
      },
      {
        isCorrect: false,
        text: "Yes, but only in the final relay",
        explanation:
          "Incorrect. Regardless of the circumstances, a fencer replaced for medical reasons cannot return during the same match.",
      },
      {
        isCorrect: false,
        text: "Yes, if the team is losing",
        explanation:
          "Incorrect. A replaced fencer cannot return to fence again under any circumstances in the same match, per Article o.44.1.",
      },
    ],
  },
];

let currentQuestionIndex = 0;
let score = 0;

function loadQuestion() {
  const question = questions[currentQuestionIndex];
  document.getElementById("question").textContent = question.question;

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";

  question.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.textContent = answer.text;
    button.onclick = () => checkAnswer(answer);
    optionsContainer.appendChild(button);
  });

  document.getElementById("result").textContent = "";
  document.getElementById("explanation").textContent = "";
}

function checkAnswer(answer) {
  const resultElement = document.getElementById("result");
  const explanationElement = document.getElementById("explanation");
  const scoreElement = document.getElementById("score");

  if (answer.isCorrect) {
    resultElement.textContent = "Correct! Well done!";
    resultElement.style.color = "green";
    score++;
  } else {
    resultElement.textContent = "Sorry, that's incorrect.";
    resultElement.style.color = "red";
  }

  explanationElement.textContent = answer.explanation;
  currentQuestionIndex++;
  scoreElement.textContent = `Score: ${score} / ${currentQuestionIndex}`;

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";

  if (currentQuestionIndex < questions.length) {
    const nextButton = document.createElement("button");
    nextButton.textContent = "Next Question";
    nextButton.onclick = loadQuestion;
    optionsContainer.appendChild(nextButton);
  } else {
    resultElement.textContent = "Quiz Completed!";
    explanationElement.textContent = `Final Score: ${score} / ${questions.length}`;
  }
}

// Start the quiz when the page loads
window.onload = loadQuestion;
