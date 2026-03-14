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

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Rendre la page visible
  const main = document.querySelector('main');
  if (main) {
    main.classList.add('loaded');
  }

  const urlParams = new URLSearchParams(window.location.search);
  const mangaId = urlParams.get('id');

  if (mangaId) {
    const id = parseInt(mangaId);
    afficherDetailManga(id);
    ajouterHistorique(id);
  } else {
    window.location.href = 'index.html';
  }
});

// ===== HISTORIQUE =====
function ajouterHistorique(id) {
  const MAX_HISTORIQUE = 10;
  let historique = JSON.parse(localStorage.getItem('mangaHistorique') || '[]');

  // Retirer l'ID s'il existe déjà (pour le remettre en premier)
  historique = historique.filter(h => h !== id);

  // Ajouter en début de liste
  historique.unshift(id);

  // Limiter à MAX_HISTORIQUE éléments
  if (historique.length > MAX_HISTORIQUE) {
    historique = historique.slice(0, MAX_HISTORIQUE);
  }

  localStorage.setItem('mangaHistorique', JSON.stringify(historique));
}

// ===== AFFICHAGE DÉTAIL MANGA =====
function afficherDetailManga(id) {
  const manga = getMangaById(id);
  const container = document.getElementById('mangaDetail');

  if (!manga) {
    container.innerHTML = `
      <div class="no-results">
        <h2>Manga non trouvé</h2>
        <p>Ce manga n'existe pas dans notre base de données.</p>
        <a href="index.html" class="back-btn">Retour à la bibliothèque</a>
      </div>
    `;
    return;
  }

  // Mettre à jour le titre de la page
  document.title = `${manga.titre} - Dico.Manga`;

  // Générer le HTML
  container.innerHTML = `
    <div class="manga-detail">
      <div class="manga-detail-left">
        <img
          src="${manga.couverture}"
          alt="${manga.titre}"
          class="manga-detail-cover"
          onerror="this.style.display='none'"
        >
      </div>

      <div class="manga-detail-info">
        <h1>${manga.titre}</h1>

        <div class="manga-actions">
          <button class="favorite-btn ${estFavori(manga.id) ? 'active' : ''}" onclick="toggleFavoriBtn(${manga.id})">
            <span id="favIcon">${estFavori(manga.id) ? '★' : '☆'}</span>
            <span id="favText">${estFavori(manga.id) ? 'Dans mes favoris' : 'Ajouter aux favoris'}</span>
          </button>
          <button class="alire-btn ${estALire(manga.id) ? 'active' : ''}" onclick="toggleALireBtn(${manga.id})">
            <span id="alireIcon">${estALire(manga.id) ? '📖' : '📚'}</span>
            <span id="alireText">${estALire(manga.id) ? 'Dans ma liste' : 'À lire'}</span>
          </button>
          <button class="download-btn ${isOfflineAvailable(manga.id) ? 'downloaded' : ''}" onclick="downloadForOffline(${manga.id})">
            <span id="downloadIcon">${isOfflineAvailable(manga.id) ? '✓' : '↓'}</span>
            <span id="downloadText">${isOfflineAvailable(manga.id) ? 'Hors-ligne' : 'Télécharger'}</span>
          </button>
        </div>

        <div class="manga-meta">
          <div class="meta-item">
            <span class="meta-label">Auteur</span>
            <span class="meta-value">${manga.auteur}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Année</span>
            <span class="meta-value">${manga.annee}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Volumes</span>
            <span class="meta-value">${manga.volumes}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Statut</span>
            <span class="meta-value">${manga.statut}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Genres</span>
            <span class="meta-value">${manga.genre.join(', ')}</span>
          </div>
          ${manga.anime ? `
          <div class="meta-item anime-link">
            <span class="meta-label">Adaptation Anime</span>
            <a href="${manga.anime}" target="_blank" class="anime-btn">
              ▶ Voir l'anime
            </a>
          </div>
          ` : ''}
        </div>

        <!-- Résumé -->
        <div class="manga-section">
          <h2>Résumé</h2>
          <p>${manga.resume}</p>
        </div>

        <!-- Biographie de l'auteur -->
        <div class="manga-section">
          <h2>À propos de l'auteur</h2>
          <p>${manga.bioAuteur}</p>
        </div>

        <!-- Personnages -->
        <div class="manga-section">
          <h2>Personnages principaux</h2>
          <div class="characters-grid">
            ${manga.personnages.map(perso => `
              <div class="character-card">
                ${perso.image
                  ? `<img src="${perso.image}" alt="${perso.nom}" class="character-img" onerror="this.style.display='none'">`
                  : ``
                }
                <h3 class="character-name">${perso.nom}</h3>
                <p class="character-desc">${perso.description}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Avis général -->
        <div class="manga-section review-section">
          <h2>Notre avis</h2>
          <div class="rating-display">
            <span class="rating-number">${manga.note}</span>
            <span class="rating-stars">${'★'.repeat(manga.note)}${'☆'.repeat(10 - manga.note)}</span>
          </div>
          <p>${manga.avis}</p>
        </div>

        <!-- Ma note personnelle -->
        <div class="manga-section user-rating-section">
          <h2>Ma note</h2>
          <div class="user-rating-container">
            <div class="user-rating-stars" id="userRatingStars">
              ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                <span class="user-star ${getUserRating(manga.id) >= n ? 'active' : ''}" data-rating="${n}" onclick="setUserRating(${manga.id}, ${n})">★</span>
              `).join('')}
            </div>
            <span class="user-rating-value" id="userRatingValue">${getUserRating(manga.id) ? getUserRating(manga.id) + '/10' : 'Non noté'}</span>
          </div>
        </div>

        <!-- Notes personnelles -->
        <div class="manga-section notes-section">
          <h2>Mes notes</h2>
          <textarea
            class="notes-textarea"
            id="notesTextarea"
            placeholder="Écris tes notes sur ce manga..."
            onchange="saveNote(${manga.id}, this.value)"
          >${getNote(manga.id)}</textarea>
          <div class="notes-footer">
            <span class="notes-hint">Sauvegarde automatique</span>
          </div>
        </div>

        ${manga.connexions && manga.connexions.length > 0 ? `
        <!-- Connexions / Même univers -->
        <div class="manga-section connexions-section">
          <h2>Même univers : ${manga.univers}</h2>
          <div class="connexions-grid">
            ${manga.connexions.map(connexionId => {
              const connexionManga = getMangaById(connexionId);
              if (!connexionManga) return '';
              return `
                <div class="connexion-card" onclick="window.location.href='manga.html?id=${connexionManga.id}'">
                  <img src="${connexionManga.couverture}" alt="${connexionManga.titre}" class="connexion-cover" onerror="this.style.display='none'">
                  <div class="connexion-info">
                    <h3 class="connexion-title">${connexionManga.titre}</h3>
                    <p class="connexion-univers">${connexionManga.univers || ''}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Recommandations -->
        <div class="manga-section">
          <h2>Mangas similaires</h2>
          <div class="similar-grid">
            ${getRecommandations(manga).map(rec => `
              <div class="similar-card" onclick="window.location.href='manga.html?id=${rec.id}'">
                <img src="${rec.couverture}" alt="${rec.titre}" class="similar-cover" onerror="this.style.display='none'">
                <div class="similar-info">
                  <h3 class="similar-title">${rec.titre}</h3>
                  <p class="similar-genres">${rec.genre.slice(0, 2).join(', ')}</p>
                  <p class="similar-note">★ ${rec.note}/10</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===== FAVORIS =====
function getFavoris() {
  const favoris = localStorage.getItem('mangaFavoris');
  return favoris ? JSON.parse(favoris) : [];
}

function estFavori(id) {
  return getFavoris().includes(id);
}

// ===== A LIRE =====
function getALire() {
  const aLire = localStorage.getItem('mangaALire');
  return aLire ? JSON.parse(aLire) : [];
}

function estALire(id) {
  return getALire().includes(id);
}

function toggleALireBtn(id) {
  let aLire = getALire();
  const index = aLire.indexOf(id);
  const btn = document.querySelector('.alire-btn');
  const icon = document.getElementById('alireIcon');
  const text = document.getElementById('alireText');
  const manga = getMangaById(id);

  if (index === -1) {
    aLire.push(id);
    btn.classList.add('active');
    icon.textContent = '📖';
    text.textContent = 'Dans ma liste';
    showToast(`${manga.titre} ajouté à la liste 📚`);
  } else {
    aLire.splice(index, 1);
    btn.classList.remove('active');
    icon.textContent = '📚';
    text.textContent = 'À lire';
    showToast(`${manga.titre} retiré de la liste`);
  }

  localStorage.setItem('mangaALire', JSON.stringify(aLire));
}

function toggleFavoriBtn(id) {
  let favoris = getFavoris();
  const index = favoris.indexOf(id);
  const btn = document.querySelector('.favorite-btn');
  const icon = document.getElementById('favIcon');
  const text = document.getElementById('favText');
  const manga = getMangaById(id);

  if (index === -1) {
    favoris.push(id);
    btn.classList.add('active');
    icon.textContent = '★';
    text.textContent = 'Dans mes favoris';
    showToast(`${manga.titre} ajouté aux favoris ★`);
  } else {
    favoris.splice(index, 1);
    btn.classList.remove('active');
    icon.textContent = '☆';
    text.textContent = 'Ajouter aux favoris';
    showToast(`${manga.titre} retiré des favoris`);
  }

  localStorage.setItem('mangaFavoris', JSON.stringify(favoris));
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ===== NOTATION PERSONNELLE =====
function getUserRating(id) {
  const ratings = localStorage.getItem('mangaUserRatings');
  const data = ratings ? JSON.parse(ratings) : {};
  return data[id] || 0;
}

function setUserRating(id, rating) {
  const ratings = localStorage.getItem('mangaUserRatings');
  const data = ratings ? JSON.parse(ratings) : {};
  data[id] = rating;
  localStorage.setItem('mangaUserRatings', JSON.stringify(data));

  // Mettre a jour l'affichage des etoiles
  const starsContainer = document.getElementById('userRatingStars');
  const stars = starsContainer.querySelectorAll('.user-star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });

  // Mettre a jour la valeur affichee
  const valueDisplay = document.getElementById('userRatingValue');
  valueDisplay.textContent = rating + '/10';

  const manga = getMangaById(id);
  showToast(`${manga.titre} noté ${rating}/10`);
}

// ===== NOTES PERSONNELLES =====
function getNote(id) {
  const notes = localStorage.getItem('mangaNotes');
  const data = notes ? JSON.parse(notes) : {};
  return data[id] || '';
}

function saveNote(id, text) {
  const notes = localStorage.getItem('mangaNotes');
  const data = notes ? JSON.parse(notes) : {};
  data[id] = text;
  localStorage.setItem('mangaNotes', JSON.stringify(data));
  showToast('Notes sauvegardées');
}

// ===== MODE HORS-LIGNE =====
function isOfflineAvailable(mangaId) {
  const offlineMangas = JSON.parse(localStorage.getItem('offlineMangas') || '[]');
  return offlineMangas.includes(mangaId);
}

function downloadForOffline(mangaId) {
  const manga = getMangaById(mangaId);
  if (!manga) return;

  // Vérifier si déjà téléchargé
  if (isOfflineAvailable(mangaId)) {
    showToast(`${manga.titre} est déjà disponible hors-ligne`);
    return;
  }

  // Sauvegarder dans localStorage
  const offlineMangas = JSON.parse(localStorage.getItem('offlineMangas') || '[]');
  offlineMangas.push(mangaId);
  localStorage.setItem('offlineMangas', JSON.stringify(offlineMangas));

  // Sauvegarder les données du manga
  const mangaData = JSON.parse(localStorage.getItem('offlineMangaData') || '{}');
  mangaData[mangaId] = manga;
  localStorage.setItem('offlineMangaData', JSON.stringify(mangaData));

  // Mettre à jour l'UI
  const btn = document.querySelector('.download-btn');
  const icon = document.getElementById('downloadIcon');
  const text = document.getElementById('downloadText');

  if (btn && icon && text) {
    btn.classList.add('downloaded');
    icon.textContent = '✓';
    text.textContent = 'Hors-ligne';
  }

  showToast(`${manga.titre} disponible hors-ligne`);
}

// ===== RECOMMANDATIONS =====
function getRecommandations(mangaActuel) {
  // Trouver des mangas avec des genres similaires
  const recommandations = mangas
    .filter(m => m.id !== mangaActuel.id)
    .map(m => {
      const genresCommuns = m.genre.filter(g => mangaActuel.genre.includes(g));
      return { ...m, score: genresCommuns.length };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score || b.note - a.note)
    .slice(0, 4);

  return recommandations;
}
