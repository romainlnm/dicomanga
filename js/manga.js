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

// ===== LANGUE =====
let currentLang = localStorage.getItem('lang') || 'fr';

function toggleLanguage() {
  currentLang = currentLang === 'fr' ? 'en' : 'fr';
  localStorage.setItem('lang', currentLang);
  updateLangToggleUI();
  updateBackButton();

  // Réafficher le manga avec la nouvelle langue
  const urlParams = new URLSearchParams(window.location.search);
  const mangaId = urlParams.get('id');
  if (mangaId) {
    afficherDetailManga(parseInt(mangaId));
  }

  showToast(currentLang === 'fr' ? 'Français activé' : 'English enabled');
}

function updateLangToggleUI() {
  const langIcon = document.getElementById('langIcon');
  if (langIcon) {
    langIcon.textContent = currentLang.toUpperCase();
  }
}

function initLanguage() {
  currentLang = localStorage.getItem('lang') || 'fr';
  updateLangToggleUI();
  updateBackButton();
}

function updateBackButton() {
  const backBtn = document.querySelector('.back-btn');
  if (backBtn) {
    backBtn.textContent = currentLang === 'en' ? '← Back to library' : '← Retour à la bibliothèque';
  }
}

// ===== COVER SLIDER =====
function switchDetailCover(position) {
  const slider = document.getElementById('detail-slider');
  const label = document.getElementById('detail-slider-label');
  const buttons = document.querySelectorAll('.manga-detail-left .cover-slider-btn');

  if (position === 'last') {
    slider.classList.add('show-last');
    if (label) label.textContent = currentLang === 'en' ? 'Last volume' : 'Dernier tome';
    buttons[0].classList.remove('active');
    buttons[1].classList.add('active');
  } else {
    slider.classList.remove('show-last');
    if (label) label.textContent = currentLang === 'en' ? 'Volume 1' : 'Tome 1';
    buttons[0].classList.add('active');
    buttons[1].classList.remove('active');
  }
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Rendre la page visible
  const main = document.querySelector('main');
  if (main) {
    main.classList.add('loaded');
  }

  initLanguage();

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
        <h2>${currentLang === 'en' ? 'Manga not found' : 'Manga non trouvé'}</h2>
        <p>${currentLang === 'en' ? 'This manga does not exist in our database.' : 'Ce manga n\'existe pas dans notre base de données.'}</p>
        <a href="index.html" class="back-btn">${currentLang === 'en' ? 'Back to library' : 'Retour à la bibliothèque'}</a>
      </div>
    `;
    return;
  }

  // Mettre à jour le titre de la page
  document.title = `${manga.titre} - Dico.Manga`;

  // Vérifier si le manga a deux couvertures
  const hasTwoCovers = manga.statut === 'Terminé' && manga.couvertureLast;

  // Générer le HTML
  container.innerHTML = `
    <div class="manga-detail">
      <div class="manga-detail-left">
        ${hasTwoCovers ? `
          <div class="cover-slider">
            <div class="cover-slider-inner" id="detail-slider">
              <img src="${manga.couverture}" alt="${manga.titre} - Tome 1" class="manga-detail-cover" onerror="this.style.display='none'">
              <img src="${manga.couvertureLast}" alt="${manga.titre} - Dernier tome" class="manga-detail-cover" onerror="this.style.display='none'">
            </div>
            <span class="cover-slider-label" id="detail-slider-label">${currentLang === 'en' ? 'Volume 1' : 'Tome 1'}</span>
            <div class="cover-slider-nav">
              <button class="cover-slider-btn active" onclick="switchDetailCover('first')" title="${currentLang === 'en' ? 'First volume' : 'Premier tome'}">◀</button>
              <button class="cover-slider-btn" onclick="switchDetailCover('last')" title="${currentLang === 'en' ? 'Last volume' : 'Dernier tome'}">▶</button>
            </div>
          </div>
        ` : `
          <img
            src="${manga.couverture}"
            alt="${manga.titre}"
            class="manga-detail-cover"
            onerror="this.style.display='none'"
          >
        `}
      </div>

      <div class="manga-detail-info">
        <h1>${manga.titre}</h1>

        <div class="manga-actions">
          <button class="favorite-btn ${estFavori(manga.id) ? 'active' : ''}" onclick="toggleFavoriBtn(${manga.id})">
            <span id="favIcon">${estFavori(manga.id) ? '★' : '☆'}</span>
            <span id="favText">${estFavori(manga.id) ? (currentLang === 'en' ? 'In favorites' : 'Dans mes favoris') : (currentLang === 'en' ? 'Add to favorites' : 'Ajouter aux favoris')}</span>
          </button>
          <button class="alire-btn ${estALire(manga.id) ? 'active' : ''}" onclick="toggleALireBtn(${manga.id})">
            <span id="alireIcon">${estALire(manga.id) ? '📖' : '📚'}</span>
            <span id="alireText">${estALire(manga.id) ? (currentLang === 'en' ? 'In my list' : 'Dans ma liste') : (currentLang === 'en' ? 'To read' : 'À lire')}</span>
          </button>
          <button class="download-btn ${isOfflineAvailable(manga.id) ? 'downloaded' : ''}" onclick="downloadForOffline(${manga.id})">
            <span id="downloadIcon">${isOfflineAvailable(manga.id) ? '✓' : '↓'}</span>
            <span id="downloadText">${isOfflineAvailable(manga.id) ? (currentLang === 'en' ? 'Offline' : 'Hors-ligne') : (currentLang === 'en' ? 'Download' : 'Télécharger')}</span>
          </button>
          <button class="list-btn" onclick="ouvrirAjouterAListe(${manga.id})">
            <span>📋</span>
            <span>${currentLang === 'en' ? 'Add to list' : 'Ajouter à une liste'}</span>
          </button>
        </div>

        <div class="manga-meta">
          <div class="meta-item">
            <span class="meta-label">${currentLang === 'en' ? 'Author' : 'Auteur'}</span>
            <span class="meta-value">${manga.auteur}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">${currentLang === 'en' ? 'Year' : 'Année'}</span>
            <span class="meta-value">${manga.annee}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Volumes</span>
            <span class="meta-value">${manga.volumes}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">${currentLang === 'en' ? 'Status' : 'Statut'}</span>
            <span class="meta-value">${manga.statut}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Genres</span>
            <span class="meta-value">${manga.genre.join(', ')}</span>
          </div>
          ${manga.anime ? `
          <div class="meta-item anime-link">
            <span class="meta-label">${currentLang === 'en' ? 'Anime Adaptation' : 'Adaptation Anime'}</span>
            <a href="${manga.anime}" target="_blank" class="anime-btn">
              ▶ ${currentLang === 'en' ? 'Watch Anime' : 'Voir l\'anime'}
            </a>
          </div>
          ` : ''}
        </div>

        <!-- Résumé -->
        <div class="manga-section">
          <h2>${currentLang === 'en' ? 'Summary' : 'Résumé'}</h2>
          <p>${getMangaText(manga, 'resume')}</p>
        </div>

        <!-- Biographie de l'auteur -->
        <div class="manga-section">
          <h2>${currentLang === 'en' ? 'About the Author' : 'À propos de l\'auteur'}</h2>
          <p>${getMangaText(manga, 'bioAuteur')}</p>
        </div>

        ${renderTomesSection(manga)}

        <!-- Personnages -->
        <div class="manga-section">
          <h2>${currentLang === 'en' ? 'Main Characters' : 'Personnages principaux'}</h2>
          <div class="characters-grid">
            ${getMangaCharacters(manga).map(perso => `
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
          <h2>${currentLang === 'en' ? 'Our Review' : 'Notre avis'}</h2>
          <div class="rating-display">
            <span class="rating-number">${manga.note}</span>
            <span class="rating-stars">${'★'.repeat(manga.note)}${'☆'.repeat(10 - manga.note)}</span>
          </div>
          <p>${getMangaText(manga, 'avis')}</p>
        </div>

        <!-- Ma note personnelle -->
        <div class="manga-section user-rating-section">
          <h2>${currentLang === 'en' ? 'My Rating' : 'Ma note'}</h2>
          <div class="user-rating-container">
            <div class="user-rating-stars" id="userRatingStars">
              ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                <span class="user-star ${getUserRating(manga.id) >= n ? 'active' : ''}" data-rating="${n}" onclick="setUserRating(${manga.id}, ${n})">★</span>
              `).join('')}
            </div>
            <span class="user-rating-value" id="userRatingValue">${getUserRating(manga.id) ? getUserRating(manga.id) + '/10' : (currentLang === 'en' ? 'Not rated' : 'Non noté')}</span>
          </div>
        </div>

        <!-- Notes personnelles -->
        <div class="manga-section notes-section">
          <h2>${currentLang === 'en' ? 'My Notes' : 'Mes notes'}</h2>
          <textarea
            class="notes-textarea"
            id="notesTextarea"
            placeholder="${currentLang === 'en' ? 'Write your notes about this manga...' : 'Écris tes notes sur ce manga...'}"
            onchange="saveNote(${manga.id}, this.value)"
          >${getNote(manga.id)}</textarea>
          <div class="notes-footer">
            <span class="notes-hint">${currentLang === 'en' ? 'Auto-saved' : 'Sauvegarde automatique'}</span>
          </div>
        </div>

        ${manga.connexions && manga.connexions.length > 0 ? `
        <!-- Connexions / Même univers -->
        <div class="manga-section connexions-section">
          <h2>${currentLang === 'en' ? 'Same Universe' : 'Même univers'} : ${manga.univers}</h2>
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
          <h2>${currentLang === 'en' ? 'Similar Manga' : 'Mangas similaires'}</h2>
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

        ${typeof buildCommentsSection === 'function' ? buildCommentsSection(manga.id) : ''}
      </div>
    </div>
  `;

  if (typeof loadComments === 'function') {
    loadComments(manga.id);
  }
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

// ===== LISTES PERSONNALISÉES =====
function getCustomLists() {
  const lists = localStorage.getItem('mangaCustomLists');
  return lists ? JSON.parse(lists) : {};
}

function saveCustomLists(lists) {
  localStorage.setItem('mangaCustomLists', JSON.stringify(lists));
}

function getMangaCustomLists(mangaId) {
  const lists = getCustomLists();
  const result = [];
  for (const [name, mangaIds] of Object.entries(lists)) {
    if (mangaIds.includes(mangaId)) {
      result.push(name);
    }
  }
  return result;
}

function ouvrirAjouterAListe(mangaId) {
  // Créer la modal si elle n'existe pas
  let modal = document.getElementById('addToListModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'addToListModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => {
      if (e.target === modal) fermerAjouterAListe();
    };
    document.body.appendChild(modal);
  }

  const lists = getCustomLists();
  const listNames = Object.keys(lists);
  const mangaLists = getMangaCustomLists(mangaId);
  const manga = getMangaById(mangaId);

  modal.innerHTML = `
    <div class="modal-content modal-small">
      <div class="modal-header">
        <h2>${currentLang === 'en' ? 'Add to list' : 'Ajouter à une liste'}</h2>
        <button class="modal-close" onclick="fermerAjouterAListe()">✕</button>
      </div>
      <div class="modal-body">
        ${listNames.length === 0 ? `
          <p class="no-lists-message">${currentLang === 'en' ? 'No lists created yet.' : 'Aucune liste créée.'}</p>
          <p class="no-lists-hint">${currentLang === 'en' ? 'Create lists from the homepage (📋 button)' : 'Crée des listes depuis l\'accueil (bouton 📋)'}</p>
        ` : `
          <div class="lists-selection">
            ${listNames.map(name => {
              const isInList = mangaLists.includes(name);
              return `
                <div class="list-option ${isInList ? 'in-list' : ''}" onclick="toggleMangaInList('${name}', ${mangaId})">
                  <span class="list-option-check">${isInList ? '✓' : ''}</span>
                  <span class="list-option-name">${name}</span>
                  <span class="list-option-count">${lists[name].length} manga${lists[name].length > 1 ? 's' : ''}</span>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function fermerAjouterAListe() {
  const modal = document.getElementById('addToListModal');
  if (modal) {
    modal.classList.remove('open');
  }
}

function toggleMangaInList(listName, mangaId) {
  const lists = getCustomLists();
  const manga = getMangaById(mangaId);

  if (!lists[listName]) {
    lists[listName] = [];
  }

  const index = lists[listName].indexOf(mangaId);
  if (index === -1) {
    // Ajouter à la liste
    lists[listName].push(mangaId);
    showToast(`${manga.titre} ${currentLang === 'en' ? 'added to' : 'ajouté à'} "${listName}"`);
  } else {
    // Retirer de la liste
    lists[listName].splice(index, 1);
    showToast(`${manga.titre} ${currentLang === 'en' ? 'removed from' : 'retiré de'} "${listName}"`);
  }

  saveCustomLists(lists);

  // Rafraîchir la modal
  ouvrirAjouterAListe(mangaId);
}

// ===== TOMES (volumes individuels) =====
function formatTomeDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
    year: 'numeric', month: 'short'
  });
}

function buildTomesArray(manga) {
  // Si l'auteur a fourni des tomes détaillés, on les utilise
  if (Array.isArray(manga.tomes) && manga.tomes.length) {
    return manga.tomes.slice().sort((a, b) => (a.num || 0) - (b.num || 0));
  }
  // Sinon, on génère N placeholders à partir du nombre de volumes connus
  const count = parseInt(manga.volumes, 10);
  if (!count || count <= 0) return [];
  const out = [];
  for (let i = 1; i <= count; i++) {
    out.push({ num: i, cover: null, date: null, placeholder: true });
  }
  return out;
}

function renderTomesSection(manga) {
  const tomes = buildTomesArray(manga);
  if (!tomes.length) return '';
  const lang = currentLang || 'fr';
  const fallbackCover = manga.couverture || '';

  return `
    <div class="manga-section tomes-section">
      <h2>
        ${lang === 'en' ? 'Volumes' : 'Tomes'}
        <span class="tomes-count">${tomes.length}</span>
      </h2>
      <div class="tomes-scroll">
        ${tomes.map(t => {
          const cover = t.cover || fallbackCover;
          const dateLabel = t.date ? formatTomeDate(t.date, lang) : '';
          return `
            <div class="tome-card${t.placeholder ? ' tome-placeholder' : ''}">
              <div class="tome-cover-wrap">
                <img src="${cover}" alt="${lang === 'en' ? 'Volume' : 'Tome'} ${t.num}" class="tome-cover" onerror="this.onerror=null;this.src='${fallbackCover}';this.classList.add('tome-cover-fallback');">
                <span class="tome-num-badge">${t.num}</span>
              </div>
              <div class="tome-info">
                <span class="tome-num">${lang === 'en' ? 'Vol.' : 'Tome'} ${t.num}</span>
                ${dateLabel ? `<span class="tome-date">${dateLabel}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
