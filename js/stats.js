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

// ===== DONNEES =====
function getFavoris() {
  const favoris = localStorage.getItem('mangaFavoris');
  return favoris ? JSON.parse(favoris) : [];
}

function getALire() {
  const aLire = localStorage.getItem('mangaALire');
  return aLire ? JSON.parse(aLire) : [];
}


// ===== CALCULS STATISTIQUES =====
function getUserRatings() {
  const ratings = localStorage.getItem('mangaUserRatings');
  return ratings ? JSON.parse(ratings) : {};
}

function getHistorique() {
  return JSON.parse(localStorage.getItem('mangaHistorique') || '[]');
}

function calculerStats() {
  const favorisIds = getFavoris();
  const aLireIds = getALire();
  const userRatings = getUserRatings();
  const historique = getHistorique();

  // Total favoris et à lire
  document.getElementById('totalFavoris').textContent = favorisIds.length;
  document.getElementById('totalALire').textContent = aLireIds.length;

  // Mangas notés
  const ratingsEntries = Object.entries(userRatings).filter(([id, note]) => note > 0);
  document.getElementById('mangasNotes').textContent = ratingsEntries.length;

  // Note moyenne
  if (ratingsEntries.length > 0) {
    const totalNotes = ratingsEntries.reduce((sum, [id, note]) => sum + note, 0);
    const moyenne = (totalNotes / ratingsEntries.length).toFixed(1);
    document.getElementById('noteMoyenne').textContent = moyenne + '/10';
  } else {
    document.getElementById('noteMoyenne').textContent = '-';
  }

  // Mangas consultés
  document.getElementById('mangasVus').textContent = historique.length;

  // Calculer les jours d'activité (basé sur localStorage)
  const lastVisit = localStorage.getItem('lastVisitDate');
  const today = new Date().toDateString();
  let streak = parseInt(localStorage.getItem('visitStreak') || '0');

  if (lastVisit !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastVisit === yesterday.toDateString()) {
      streak++;
    } else if (lastVisit !== today) {
      streak = 1;
    }

    localStorage.setItem('lastVisitDate', today);
    localStorage.setItem('visitStreak', streak.toString());
  }

  document.getElementById('streakJours').textContent = streak;

  return { favorisIds, userRatings };
}

function getGenresPreferes() {
  const favorisIds = getFavoris();
  const favorisMangas = mangas.filter(m => favorisIds.includes(m.id));

  const genresCount = {};
  favorisMangas.forEach(manga => {
    manga.genre.forEach(g => {
      genresCount[g] = (genresCount[g] || 0) + 1;
    });
  });

  // Trier par nombre
  const sorted = Object.entries(genresCount).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 6); // Top 6 genres
}

function getAuteursPreferes() {
  const favorisIds = getFavoris();
  const favorisMangas = mangas.filter(m => favorisIds.includes(m.id));

  const auteursCount = {};
  favorisMangas.forEach(manga => {
    auteursCount[manga.auteur] = (auteursCount[manga.auteur] || 0) + 1;
  });

  // Trier par nombre
  const sorted = Object.entries(auteursCount).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 3); // Top 3
}

function getMangasNotes() {
  const userRatings = getUserRatings();
  const mangasNotes = [];

  Object.entries(userRatings).forEach(([id, note]) => {
    if (note > 0) {
      const manga = getMangaById(parseInt(id));
      if (manga) {
        mangasNotes.push({
          ...manga,
          userNote: note
        });
      }
    }
  });

  // Trier par note personnelle (plus haute en premier)
  return mangasNotes.sort((a, b) => b.userNote - a.userNote);
}

// ===== AFFICHAGE =====
function afficherGenresChart() {
  const container = document.getElementById('genresChart');
  const genres = getGenresPreferes();

  if (genres.length === 0) {
    container.innerHTML = '<p class="no-data">Ajoutez des mangas à vos favoris pour voir vos genres préférés.</p>';
    return;
  }

  const maxCount = genres[0][1];

  container.innerHTML = genres.map(([genre, count]) => {
    const percent = Math.round((count / maxCount) * 100);
    return `
      <div class="genre-bar-item">
        <div class="genre-bar-label">${genre}</div>
        <div class="genre-bar-container">
          <div class="genre-bar-fill" style="width: ${percent}%"></div>
        </div>
        <div class="genre-bar-count">${count}</div>
      </div>
    `;
  }).join('');
}

function afficherAuteurs() {
  const container = document.getElementById('auteursList');
  const auteurs = getAuteursPreferes();

  if (auteurs.length === 0) {
    container.innerHTML = '<p class="no-data">Ajoutez des mangas à vos favoris pour voir vos auteurs préférés.</p>';
    return;
  }

  const medailles = ['🥇', '🥈', '🥉'];

  container.innerHTML = auteurs.map(([auteur, count], index) => `
    <div class="auteur-item">
      <span class="auteur-rank">${medailles[index] || ''}</span>
      <span class="auteur-name">${auteur}</span>
      <span class="auteur-count">${count} manga${count > 1 ? 's' : ''}</span>
    </div>
  `).join('');
}

function afficherNotesPersonnelles() {
  const container = document.getElementById('notesGrid');
  const mangasNotes = getMangasNotes();

  if (mangasNotes.length === 0) {
    container.innerHTML = '<p class="no-data">Notez vos mangas sur leurs pages pour les voir ici.</p>';
    return;
  }

  container.innerHTML = mangasNotes.map(manga => `
    <div class="encours-card" onclick="window.location.href='manga.html?id=${manga.id}'">
      <img src="${manga.couverture}" alt="${manga.titre}" class="encours-cover" onerror="this.style.display='none'">
      <div class="encours-info">
        <h3 class="encours-title">${manga.titre}</h3>
        <div class="encours-progress">
          <div class="encours-bar">
            <div class="encours-fill" style="width: ${manga.userNote * 10}%"></div>
          </div>
          <span class="encours-text">Ma note: ${'★'.repeat(manga.userNote)}${'☆'.repeat(10 - manga.userNote)} ${manga.userNote}/10</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Rendre la page visible
  const main = document.querySelector('main');
  if (main) {
    main.classList.add('loaded');
  }

  calculerStats();
  afficherGenresChart();
  afficherAuteurs();
  afficherNotesPersonnelles();
});
