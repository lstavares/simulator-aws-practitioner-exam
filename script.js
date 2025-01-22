let questions = [];
let currentQuestionIndex = 0;
let selectedAnswers = {};
let timer = 5400;

// Carregar perguntas do arquivo JSON
fetch('https://lstavares.github.io/simulator-aws-practitioner-exam/questions.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        questions = selectRandomQuestions(data, 65);
        questions.forEach(q => updateCorrectAnswerAfterShuffle(q));
        sessionStorage.setItem("shuffledQuestions", JSON.stringify(questions));
        renderQuestion();
    })
    .catch(error => {
        console.error("Erro ao carregar o arquivo JSON:", error);
        alert("Não foi possível carregar as perguntas. Verifique o console para mais detalhes.");
    });

// Função para selecionar 65 perguntas aleatórias
function selectRandomQuestions(questionsArray, count) {
    shuffleArray(questionsArray);
    return questionsArray.slice(0, count);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Função para atualizar a posição do correctAnswer após embaralhar
function updateCorrectAnswerAfterShuffle(question) {
    let originalAnswers = question.options.map((option, index) => ({ option, index }));
    shuffleArray(originalAnswers);
    let shuffledOptions = originalAnswers.map(a => a.option);

    let newCorrectAnswer = question.correctAnswer.map(correctIndex => {
        let correctOptionText = question.options[correctIndex];
        return shuffledOptions.findIndex(option => option === correctOptionText);
    });

    question.options = shuffledOptions;
    question.correctAnswer = newCorrectAnswer;
}

function renderQuestion() {
    const questionBox = document.getElementById('question-box');
    const questionData = questions[currentQuestionIndex];

    let instructionText = questionData.multiple ? ` (Escolha ${questionData.correctAnswer.length} alternativas)` : "";

    questionBox.innerHTML = `
        <div class="question-number">Questão ${currentQuestionIndex + 1} de ${questions.length}</div>
        <div class="question-text">${questionData.question}${instructionText}</div>
        <div class="answers">
            ${questionData.options.map((option, index) => `
                <label>
                    <input type="${questionData.multiple ? 'checkbox' : 'radio'}" name="answer" value="${index}" ${selectedAnswers[currentQuestionIndex]?.includes(index) ? 'checked' : ''}>
                    ${option}
                </label>
            `).join('')}
        </div>
    `;

    document.getElementById('previous-btn').style.display = currentQuestionIndex === 0 ? 'none' : 'inline-block';
    document.getElementById('finish-btn').classList.toggle('hidden', currentQuestionIndex < questions.length - 1);
}

function saveAnswer() {
	const inputs = document.querySelectorAll('input[name="answer"]:checked');
	selectedAnswers[currentQuestionIndex] = Array.from(inputs).map(input => parseInt(input.value));
}

function nextQuestion() {
	saveAnswer();
	if (currentQuestionIndex < questions.length - 1) {
		currentQuestionIndex++;
		renderQuestion();
	}
}

function previousQuestion() {
	saveAnswer();
	if (currentQuestionIndex > 0) {
		currentQuestionIndex--;
		renderQuestion();
	}
}

function calculateScore() {
	let correctAnswers = 0;
	questions.forEach((q, index) => {
		const selected = selectedAnswers[index] || [];
		if (JSON.stringify(selected.sort()) === JSON.stringify(q.correctAnswer.sort())) {
			correctAnswers++;
		}
	});
	let percentage = (correctAnswers / questions.length) * 100;
	return percentage;
}

function finishSimulation() {
    const score = calculateScore();
    const isApproved = score >= 70;
    const resultMessage = isApproved ? "Parabéns, você foi aprovado!" : "Infelizmente, não atingiu a pontuação necessária.";

    const report = generateReport();

    // Exibir mensagem e relatório
    document.body.innerHTML = `
        <div class="container">
            <h1>Resultado da Prova</h1>
            <p>Pontuação: ${score.toFixed(2)}%</p>
            <p>${resultMessage}</p>
            <div class="report">${report}</div>
            <button onclick="window.location.reload()">Refazer Simulado</button>
        </div>
    `;
}

function generateReport() {
    let reportHTML = "<h2>Relatório de Respostas</h2>";
    reportHTML += "<ul>";

    questions.forEach((q, index) => {
        const selected = selectedAnswers[index] || [];
        const isCorrect = JSON.stringify(selected.sort()) === JSON.stringify(q.correctAnswer.sort());
        const correctOptions = q.correctAnswer.map(i => q.options[i]).join(", ");
        const selectedOptions = selected.map(i => q.options[i]).join(", ");

        reportHTML += `<li class="${isCorrect ? "correct" : "incorrect"}">`;
        reportHTML += `<strong>Questão ${index + 1}:</strong> ${q.question}<br>`;
        reportHTML += `<strong>Escolhido:</strong> ${selectedOptions || "Nenhuma"}<br>`;
        if (!isCorrect) {
            reportHTML += `<strong>Correto:</strong> ${correctOptions}<br>`;
        }
        reportHTML += "</li>";
    });

    reportHTML += "</ul>";
    return reportHTML;
}

function updateTimer() {
	const minutes = Math.floor(timer / 60);
	const seconds = timer % 60;
	document.getElementById('timer').innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
	timer--;
	if (timer < 0) {
		alert("Tempo esgotado!");
		finishSimulation();
	}
}

document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('previous-btn').addEventListener('click', previousQuestion);
document.getElementById('finish-btn').addEventListener('click', finishSimulation);
document.addEventListener('keydown', function(event) {
	if (event.key === 'Enter') {
		nextQuestion();
	}
});

setInterval(updateTimer, 1000);
renderQuestion();
