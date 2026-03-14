// ===== THEME =====
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Initialiser le thème immédiatement
initTheme();

// ===== VARIABLES QUIZ =====
let questions = [];
let currentQuestion = 0;
let score = 0;
let timerInterval = null;
let timerEnabled = true;

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
  afficherMeilleurScore();
});

function afficherMeilleurScore() {
  const bestScore = localStorage.getItem('quizBestScore') || 0;
  document.getElementById('bestScore').textContent = bestScore;
}

// ===== GÉNÉRATION DU QUIZ =====
function initQuiz() {
  timerEnabled = document.getElementById('timerOption').checked;
  currentQuestion = 0;
  score = 0;

  questions = genererQuestions();

  // Afficher l'écran de jeu
  document.getElementById('quizStart').classList.add('quiz-hidden');
  document.getElementById('quizResult').classList.add('quiz-hidden');
  document.getElementById('quizGame').classList.remove('quiz-hidden');

  document.getElementById('currentScore').textContent = score;

  afficherQuestion();
}

function genererQuestions() {
  const questionsGenerees = [];
  const mangasUtilises = new Set();

  // Types de questions disponibles
  const types = ['image', 'indices', 'personnage', 'resume'];

  for (let i = 0; i < 10; i++) {
    const type = types[i % types.length];
    let manga;

    // Choisir un manga non utilisé
    do {
      manga = mangas[Math.floor(Math.random() * mangas.length)];
    } while (mangasUtilises.has(manga.id));

    mangasUtilises.add(manga.id);

    let question;
    switch (type) {
      case 'image':
        question = genererQuestionImage(manga);
        break;
      case 'indices':
        question = genererQuestionIndices(manga);
        break;
      case 'personnage':
        question = genererQuestionPersonnage(manga);
        break;
      case 'resume':
        question = genererQuestionResume(manga);
        break;
    }

    questionsGenerees.push(question);
  }

  return questionsGenerees;
}

function genererQuestionImage(manga) {
  const mauvaisesReponses = getMauvaisesReponses(manga, 3);

  return {
    type: 'image',
    manga: manga,
    question: 'Quel est ce manga ?',
    image: manga.couverture,
    bonneReponse: manga.titre,
    reponses: melangerTableau([manga.titre, ...mauvaisesReponses.map(m => m.titre)])
  };
}

function genererQuestionIndices(manga) {
  const mauvaisesReponses = getMauvaisesReponses(manga, 3);

  const indices = [
    `Genre: ${manga.genre[0]}`,
    `Année: ${manga.annee}`,
    `Auteur: ${manga.auteur.split(' ')[0]}...`
  ];

  return {
    type: 'indices',
    manga: manga,
    question: 'De quel manga s\'agit-il ?',
    indices: indices,
    bonneReponse: manga.titre,
    reponses: melangerTableau([manga.titre, ...mauvaisesReponses.map(m => m.titre)])
  };
}

function genererQuestionPersonnage(manga) {
  if (!manga.personnages || manga.personnages.length === 0) {
    return genererQuestionIndices(manga);
  }

  const personnage = manga.personnages[0];
  const mauvaisesReponses = getMauvaisesReponses(manga, 3);

  return {
    type: 'personnage',
    manga: manga,
    question: 'Dans quel manga trouve-t-on ce personnage ?',
    personnage: {
      nom: personnage.nom,
      description: personnage.description
    },
    bonneReponse: manga.titre,
    reponses: melangerTableau([manga.titre, ...mauvaisesReponses.map(m => m.titre)])
  };
}

function genererQuestionResume(manga) {
  const mauvaisesReponses = getMauvaisesReponses(manga, 3);

  // Prendre une partie du résumé et masquer des mots
  const mots = manga.resume.split(' ').slice(0, 20);
  const resumePartiel = mots.join(' ') + '...';

  return {
    type: 'resume',
    manga: manga,
    question: 'De quel manga est tiré ce résumé ?',
    resume: resumePartiel,
    bonneReponse: manga.titre,
    reponses: melangerTableau([manga.titre, ...mauvaisesReponses.map(m => m.titre)])
  };
}

function getMauvaisesReponses(mangaCorrect, nombre) {
  const autresMangas = mangas.filter(m => m.id !== mangaCorrect.id);
  const selectionnes = [];

  while (selectionnes.length < nombre && autresMangas.length > 0) {
    const index = Math.floor(Math.random() * autresMangas.length);
    selectionnes.push(autresMangas.splice(index, 1)[0]);
  }

  return selectionnes;
}

function melangerTableau(tableau) {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

// ===== AFFICHAGE =====
function afficherQuestion() {
  const q = questions[currentQuestion];
  const questionArea = document.getElementById('questionArea');
  const answersArea = document.getElementById('answersArea');

  document.getElementById('questionNum').textContent = currentQuestion + 1;

  // Afficher la question selon le type
  let questionHTML = `<h2 class="quiz-question">${q.question}</h2>`;

  switch (q.type) {
    case 'image':
      questionHTML += `
        <div class="quiz-image-container">
          <img src="${q.image}" alt="Couverture mystère" class="quiz-image quiz-image-blur" id="quizImage"
               onerror="this.src='https://placehold.co/200x300/1a1a1a/e63946?text=?'">
        </div>
      `;
      break;

    case 'indices':
      questionHTML += `
        <div class="quiz-indices">
          ${q.indices.map((indice, i) => `<div class="quiz-indice"><span class="indice-num">${i + 1}</span> ${indice}</div>`).join('')}
        </div>
      `;
      break;

    case 'personnage':
      questionHTML += `
        <div class="quiz-personnage">
          <div class="personnage-nom">${q.personnage.nom}</div>
          <div class="personnage-desc">"${q.personnage.description}"</div>
        </div>
      `;
      break;

    case 'resume':
      questionHTML += `
        <div class="quiz-resume">
          <p>"${q.resume}"</p>
        </div>
      `;
      break;
  }

  questionArea.innerHTML = questionHTML;

  // Afficher les réponses
  answersArea.innerHTML = q.reponses.map((reponse, index) => `
    <button class="quiz-answer-btn" onclick="verifierReponse('${reponse.replace(/'/g, "\\'")}')">
      ${reponse}
    </button>
  `).join('');

  // Démarrer le timer si activé
  if (timerEnabled) {
    demarrerTimer();
  } else {
    document.getElementById('timerDisplay').style.display = 'none';
  }
}

function demarrerTimer() {
  let temps = 10;
  const timerValue = document.getElementById('timerValue');
  const timerDisplay = document.getElementById('timerDisplay');

  timerDisplay.style.display = 'block';
  timerValue.textContent = temps;
  timerDisplay.classList.remove('timer-warning');

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    temps--;
    timerValue.textContent = temps;

    if (temps <= 3) {
      timerDisplay.classList.add('timer-warning');
    }

    if (temps <= 0) {
      clearInterval(timerInterval);
      verifierReponse(null); // Temps écoulé
    }
  }, 1000);
}

function verifierReponse(reponse) {
  clearInterval(timerInterval);

  const q = questions[currentQuestion];
  const answersArea = document.getElementById('answersArea');
  const buttons = answersArea.querySelectorAll('.quiz-answer-btn');

  // Désactiver tous les boutons
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent.trim() === q.bonneReponse) {
      btn.classList.add('correct');
    } else if (btn.textContent.trim() === reponse) {
      btn.classList.add('incorrect');
    }
  });

  // Révéler l'image si c'est une question image
  if (q.type === 'image') {
    const img = document.getElementById('quizImage');
    if (img) img.classList.remove('quiz-image-blur');
  }

  // Mettre à jour le score
  if (reponse === q.bonneReponse) {
    score++;
    document.getElementById('currentScore').textContent = score;
  }

  // Passer à la question suivante après un délai
  setTimeout(() => {
    currentQuestion++;
    if (currentQuestion < 10) {
      afficherQuestion();
    } else {
      terminerQuiz();
    }
  }, 1500);
}

function terminerQuiz() {
  clearInterval(timerInterval);

  // Afficher l'écran de résultat
  document.getElementById('quizGame').classList.add('quiz-hidden');
  document.getElementById('quizResult').classList.remove('quiz-hidden');

  document.getElementById('finalScore').textContent = score;

  // Message selon le score
  let message = '';
  if (score === 10) {
    message = 'Parfait ! Tu es un vrai otaku !';
  } else if (score >= 8) {
    message = 'Excellent ! Tu connais bien tes mangas !';
  } else if (score >= 6) {
    message = 'Bien joué ! Continue à lire des mangas !';
  } else if (score >= 4) {
    message = 'Pas mal, mais tu peux faire mieux !';
  } else {
    message = 'Il est temps de découvrir plus de mangas !';
  }
  document.getElementById('resultMessage').textContent = message;

  // Sauvegarder le meilleur score
  sauvegarderMeilleurScore();
}

function sauvegarderMeilleurScore() {
  const bestScore = parseInt(localStorage.getItem('quizBestScore') || 0);
  if (score > bestScore) {
    localStorage.setItem('quizBestScore', score);
    document.getElementById('bestScore').textContent = score;
  }
}
