// ===== LIENS D'ACHAT =====
// Amazon n'accepte que l'ISBN-10 dans ses URLs produit (/dp/…).
function isbn13to10(isbn13) {
  if (!/^978\d{10}$/.test(isbn13)) return null;
  const core = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * parseInt(core[i], 10);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? 'X' : String(check));
}

// Fiche produit directe quand l'ISBN du tome 1 est connu (js/achats.js),
// sinon recherche par titre chez le marchand.
function buildAchatLinks(manga) {
  if (currentLang === 'ja') {
    return [{ cls: 'amazon', label: 'Amazon', url: `https://www.amazon.co.jp/s?k=${encodeURIComponent(manga.titre + ' 漫画')}` }];
  }
  if (currentLang === 'en') {
    return [{ cls: 'amazon', label: 'Amazon', url: `https://www.amazon.com/s?k=${encodeURIComponent(manga.titre + ' manga')}` }];
  }
  const isbn = (typeof mangaIsbn !== 'undefined' && mangaIsbn[manga.id]) || null;
  const isbn10 = isbn ? isbn13to10(isbn) : null;
  const amazonUrl = isbn10 ? `https://www.amazon.fr/dp/${isbn10}`
    : isbn ? `https://www.amazon.fr/s?k=${isbn}`
    : `https://www.amazon.fr/s?k=${encodeURIComponent(manga.titre + ' manga')}`;
  const fnacUrl = `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${isbn || encodeURIComponent(manga.titre + ' manga')}`;
  return [
    { cls: 'amazon', label: 'Amazon', url: amazonUrl },
    { cls: 'fnac', label: 'Fnac', url: fnacUrl }
  ];
}

// ===== CHEMINS D'ASSETS =====
// Les pages statiques vivent sous /manga/ (et /manga/en/) alors que les
// chemins d'assets de data.js ("images/…") sont relatifs à la racine du
// site. Même logique que mangaUrl() : chemin absolu depuis ces pages.
function assetUrl(p) {
  if (!p || /^(https?:|data:|\/)/.test(p)) return p;
  return location.pathname.startsWith('/manga/') ? '/' + p : p;
}

// ===== THEME =====
// Géré par js/theme.js (sélecteur multi-thèmes partagé par toutes les pages)

// Initialiser le thème immédiatement

// ===== LANGUE =====
let currentLang = localStorage.getItem('lang') || 'fr';

// Petit helper i18n : TL(fr, en, ja)
function TL(fr, en, ja) {
  return currentLang === 'ja' ? ja : currentLang === 'en' ? en : fr;
}

// Genres en japonais (l'attribut data-genre reste en français : le CSS
// des couleurs de badge est indexé dessus)
const GENRE_JA = {
  'Shonen': '少年', 'Seinen': '青年', 'Shojo': '少女', 'Action': 'アクション',
  'Aventure': '冒険', 'Comédie': 'コメディ', 'Romance': 'ロマンス',
  'Fantasy': 'ファンタジー', 'Dark Fantasy': 'ダークファンタジー',
  'Thriller': 'スリラー', 'Horreur': 'ホラー', 'Sport': 'スポーツ',
  'Science-fiction': 'SF', 'Cyberpunk': 'サイバーパンク', 'Drame': 'ドラマ',
  'Mystère': 'ミステリー', 'Surnaturel': '超自然', 'Psychologique': '心理',
  'Tranche de vie': '日常', 'Arts martiaux': '格闘技', 'Historique': '歴史',
  'Musique': '音楽'
};
function genreLabel(g) {
  return currentLang === 'ja' ? (GENRE_JA[g] || g) : g;
}

function toggleLanguage() {
  const order = ['fr', 'en', 'ja'];
  currentLang = order[(order.indexOf(currentLang) + 1) % order.length];
  localStorage.setItem('lang', currentLang);
  updateLangToggleUI();
  updateBackButton();

  // Réafficher le manga avec la nouvelle langue
  const bodyId = document.body.dataset.mangaId;
  const urlParams = new URLSearchParams(window.location.search);
  const mangaId = bodyId || urlParams.get('id');
  if (mangaId) {
    afficherDetailManga(parseInt(mangaId));
  }

  showToast(TL('Français activé', 'English enabled', '日本語に切り替えました'));
}

function updateLangToggleUI() {
  document.documentElement.lang = currentLang;
  const langIcon = document.getElementById('langIcon');
  if (langIcon) {
    langIcon.textContent = currentLang.toUpperCase();
  }
}

function initLanguage() {
  // Static EN pages (/manga/en/...) tag <body data-lang="en"> so the
  // first paint matches the URL. localStorage only kicks in when the
  // page is language-neutral (manga.html?id=X) — sauf pour le japonais,
  // qui n'a pas de pages statiques : le choix de l'utilisateur gagne.
  const stored = localStorage.getItem('lang');
  const bodyLang = document.body.dataset.lang;
  currentLang = stored === 'ja' ? 'ja' : (bodyLang || stored || 'fr');
  if (!['fr', 'en', 'ja'].includes(currentLang)) currentLang = 'fr';
  updateLangToggleUI();
  updateBackButton();
}

function updateBackButton() {
  const backBtn = document.querySelector('.back-btn');
  if (backBtn) {
    backBtn.textContent = TL('← Retour à la bibliothèque', '← Back to library', '← ライブラリに戻る');
  }
}

// ===== COVER SLIDER =====
function switchDetailCover(position) {
  const slider = document.getElementById('detail-slider');
  const label = document.getElementById('detail-slider-label');
  const buttons = document.querySelectorAll('.manga-detail-left .cover-slider-btn');

  if (position === 'last') {
    slider.classList.add('show-last');
    if (label) label.textContent = TL('Dernier tome', 'Last volume', '最終巻');
    buttons[0].classList.remove('active');
    buttons[1].classList.add('active');
  } else {
    slider.classList.remove('show-last');
    if (label) label.textContent = TL('Tome 1', 'Volume 1', '第1巻');
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

  // Static pages (manga/{slug}.html and manga/en/{slug}.html) expose the
  // id via <body data-manga-id="…">. Fall back to ?id=X for legacy URLs.
  const bodyId = document.body.dataset.mangaId;
  const urlParams = new URLSearchParams(window.location.search);
  const mangaId = bodyId || urlParams.get('id');

  if (mangaId) {
    const id = parseInt(mangaId);
    afficherDetailManga(id);
    ajouterHistorique(id);
  } else {
    window.location.href = assetUrl('index.html');
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
        <h2>${TL('Manga non trouvé', 'Manga not found', '漫画が見つかりません')}</h2>
        <p>${TL('Ce manga n\'existe pas dans notre base de données.', 'This manga does not exist in our database.', 'この漫画はデータベースに存在しません。')}</p>
        <a href="index.html" class="back-btn">${TL('Retour à la bibliothèque', 'Back to library', 'ライブラリに戻る')}</a>
      </div>
    `;
    return;
  }

  // Mettre à jour le titre de la page
  document.title = `${getMangaText(manga, 'titre')} - Dico.Manga`;

  // Vérifier si le manga a deux couvertures
  const hasTwoCovers = manga.statut === 'Terminé' && manga.couvertureLast;

  // Statut → pastille (même rendu que les cartes de l'accueil)
  const isOngoing = /en cours/i.test(manga.statut || '');
  const statutLabel = isOngoing
    ? TL('En cours', 'Ongoing', '連載中')
    : TL('Terminé', 'Completed', '完結');

  // Générer le HTML
  container.innerHTML = `
    <div class="manga-detail">
      <div class="manga-detail-backdrop" style="background-image: url('${assetUrl(manga.couverture)}')" aria-hidden="true"></div>
      <div class="manga-detail-left">
        ${hasTwoCovers ? `
          <div class="cover-slider">
            <div class="cover-slider-inner" id="detail-slider">
              <img src="${assetUrl(manga.couverture)}" alt="${manga.titre} - Tome 1" class="manga-detail-cover" fetchpriority="high" decoding="async" onerror="this.style.display='none'">
              <img src="${assetUrl(manga.couvertureLast)}" alt="${manga.titre} - Dernier tome" class="manga-detail-cover" decoding="async" onerror="this.style.display='none'">
            </div>
            <span class="cover-slider-label" id="detail-slider-label">${TL('Tome 1', 'Volume 1', '第1巻')}</span>
            <div class="cover-slider-nav">
              <button class="cover-slider-btn active" onclick="switchDetailCover('first')" title="${TL('Premier tome', 'First volume', '第1巻')}">◀</button>
              <button class="cover-slider-btn" onclick="switchDetailCover('last')" title="${TL('Dernier tome', 'Last volume', '最終巻')}">▶</button>
            </div>
          </div>
        ` : `
          <img
            src="${assetUrl(manga.couverture)}"
            alt="${manga.titre}"
            class="manga-detail-cover"
            fetchpriority="high"
            decoding="async"
            onerror="this.style.display='none'"
          >
        `}
      </div>

      <div class="manga-detail-info">
        <h1 class="title-neon" onclick="cycleTitleStyle(this)" title="Click to try another style">${getMangaText(manga, 'titre')}</h1>

        <div class="detail-badges">
          ${manga.statut ? `<span class="card-status ${isOngoing ? 'ongoing' : 'completed'}"><span class="card-status-dot"></span>${statutLabel}</span>` : ''}
          ${manga.genre.map(g => `<span class="card-genre-badge" data-genre="${g}">${genreLabel(g)}</span>`).join('')}
        </div>

        <div class="manga-actions">
          <button class="favorite-btn ${estFavori(manga.id) ? 'active' : ''}" onclick="toggleFavoriBtn(${manga.id})">
            <span id="favIcon">${estFavori(manga.id) ? '★' : '☆'}</span>
            <span id="favText">${estFavori(manga.id) ? (TL('Dans mes favoris', 'In favorites', 'お気に入り済み')) : (TL('Ajouter aux favoris', 'Add to favorites', 'お気に入りに追加'))}</span>
          </button>
          <button class="alire-btn ${estALire(manga.id) ? 'active' : ''}" onclick="toggleALireBtn(${manga.id})">
            <span id="alireIcon">${estALire(manga.id) ? '📖' : '📚'}</span>
            <span id="alireText">${estALire(manga.id) ? (TL('Dans ma liste', 'In my list', 'リスト追加済み')) : (TL('À lire', 'To read', '読みたい'))}</span>
          </button>
          <button class="download-btn ${isOfflineAvailable(manga.id) ? 'downloaded' : ''}" onclick="downloadForOffline(${manga.id})">
            <span id="downloadIcon">${isOfflineAvailable(manga.id) ? '✓' : '↓'}</span>
            <span id="downloadText">${isOfflineAvailable(manga.id) ? (TL('Hors-ligne', 'Offline', 'オフライン')) : (TL('Télécharger', 'Download', 'ダウンロード'))}</span>
          </button>
          <button class="list-btn" onclick="ouvrirAjouterAListe(${manga.id})">
            <span>📋</span>
            <span>${TL('Ajouter à une liste', 'Add to list', 'リストに追加')}</span>
          </button>
        </div>

        <div class="manga-meta">
          <div class="meta-item">
            <span class="meta-label">${TL('Auteur', 'Author', '作者')}</span>
            <span class="meta-value">${manga.auteur}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">${TL('Année', 'Year', '年')}</span>
            <span class="meta-value">${manga.annee}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">${TL('Volumes', 'Volumes', '巻数')}</span>
            <span class="meta-value">${manga.volumes}</span>
          </div>
          <div class="meta-item anime-link">
            <span class="meta-label">${TL('Voir l\'anime', 'Watch the anime', 'アニメを見る')}</span>
            <div class="anime-btns">
              <a href="https://hianimes.se/search?keyword=${encodeURIComponent(manga.titre)}" target="_blank" rel="noopener" class="anime-btn anime-btn-hianime">
                ▶ Hianime
              </a>
              <a href="https://franime.fr/search?query=${encodeURIComponent(manga.titre)}" target="_blank" rel="noopener" class="anime-btn anime-btn-franime">
                ▶ Franime
              </a>
            </div>
          </div>
          <div class="meta-item achat-link">
            <span class="meta-label">${TL('Acheter le manga', 'Buy the manga', '漫画を購入')}</span>
            <div class="achat-btns">
              ${buildAchatLinks(manga).map(l => `
              <a href="${l.url}" target="_blank" rel="noopener" class="achat-btn achat-btn-${l.cls}">
                🛒 ${l.label}
              </a>`).join('')}
            </div>
          </div>
        </div>

        <!-- Résumé -->
        <div class="manga-section">
          <h2>${TL('Résumé', 'Summary', 'あらすじ')}</h2>
          <p>${getMangaText(manga, 'resume')}</p>
        </div>

        <!-- Biographie de l'auteur -->
        <div class="manga-section">
          <h2>${TL('À propos de l\'auteur', 'About the Author', '作者について')}</h2>
          <p>${getMangaText(manga, 'bioAuteur')}</p>
        </div>

        ${renderTomesSection(manga)}

        <!-- Personnages -->
        <div class="manga-section">
          <h2>${TL('Personnages principaux', 'Main Characters', '主な登場人物')}</h2>
          <div class="characters-grid">
            ${getMangaCharacters(manga).map(perso => `
              <div class="character-card">
                ${perso.image
                  ? `<img src="${assetUrl(perso.image)}" alt="${perso.nom}" class="character-img" loading="lazy" decoding="async" onerror="this.style.display='none'">`
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
          <h2>${TL('Notre avis', 'Our Review', 'レビュー')}</h2>
          <div class="rating-display">
            <span class="rating-number">${manga.note}</span>
            <span class="rating-stars">${'★'.repeat(manga.note)}${'☆'.repeat(10 - manga.note)}</span>
          </div>
          <p>${getMangaText(manga, 'avis')}</p>
        </div>

        <!-- Ma note personnelle -->
        <div class="manga-section user-rating-section">
          <h2>${TL('Ma note', 'My Rating', 'マイ評価')}</h2>
          <div class="user-rating-container">
            <div class="user-rating-stars" id="userRatingStars">
              ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                <span class="user-star ${getUserRating(manga.id) >= n ? 'active' : ''}" data-rating="${n}" onclick="setUserRating(${manga.id}, ${n})">★</span>
              `).join('')}
            </div>
            <span class="user-rating-value" id="userRatingValue">${getUserRating(manga.id) ? getUserRating(manga.id) + '/10' : (TL('Non noté', 'Not rated', '未評価'))}</span>
          </div>
        </div>

        <!-- Notes personnelles -->
        <div class="manga-section notes-section">
          <h2>${TL('Mes notes', 'My Notes', 'マイメモ')}</h2>
          <textarea
            class="notes-textarea"
            id="notesTextarea"
            placeholder="${TL('Écris tes notes sur ce manga...', 'Write your notes about this manga...', 'この漫画についてメモを書こう…')}"
            onchange="saveNote(${manga.id}, this.value)"
          >${getNote(manga.id)}</textarea>
          <div class="notes-footer">
            <span class="notes-hint">${TL('Sauvegarde automatique', 'Auto-saved', '自動保存')}</span>
          </div>
        </div>

        ${manga.connexions && manga.connexions.length > 0 ? `
        <!-- Connexions / Même univers -->
        <div class="manga-section connexions-section">
          <h2>${TL('Même univers', 'Same Universe', '同じ世界観')} : ${manga.univers}</h2>
          <div class="connexions-grid">
            ${manga.connexions.map(connexionId => {
              const connexionManga = getMangaById(connexionId);
              if (!connexionManga) return '';
              return `
                <div class="connexion-card" onclick="window.location.href=mangaUrl(${connexionManga.id})">
                  <img src="${assetUrl(connexionManga.couverture)}" alt="${connexionManga.titre}" class="connexion-cover" loading="lazy" decoding="async" onerror="this.style.display='none'">
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
          <h2>${TL('Mangas similaires', 'Similar Manga', '似ている漫画')}</h2>
          <div class="similar-grid">
            ${getRecommandations(manga).map(rec => `
              <div class="similar-card" onclick="window.location.href=mangaUrl(${rec.id})">
                <img src="${assetUrl(rec.couverture)}" alt="${rec.titre}" class="similar-cover" loading="lazy" decoding="async" onerror="this.style.display='none'">
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

  // Initialiser l'état des flèches du carrousel de tomes
  initTomesArrows();
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
    text.textContent = TL('Dans ma liste', 'In my list', 'リスト追加済み');
    showToast(currentLang === 'ja' ? `${manga.titre}を読みたいリストに追加しました 📚` : currentLang === 'en' ? `${manga.titre} added to your list 📚` : `${manga.titre} ajouté à la liste 📚`);
  } else {
    aLire.splice(index, 1);
    btn.classList.remove('active');
    icon.textContent = '📚';
    text.textContent = TL('À lire', 'To read', '読みたい');
    showToast(currentLang === 'ja' ? `${manga.titre}をリストから削除しました` : currentLang === 'en' ? `${manga.titre} removed from your list` : `${manga.titre} retiré de la liste`);
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
    text.textContent = TL('Dans mes favoris', 'In favorites', 'お気に入り済み');
    showToast(currentLang === 'ja' ? `${manga.titre}をお気に入りに追加しました ★` : currentLang === 'en' ? `${manga.titre} added to favorites ★` : `${manga.titre} ajouté aux favoris ★`);
  } else {
    favoris.splice(index, 1);
    btn.classList.remove('active');
    icon.textContent = '☆';
    text.textContent = TL('Ajouter aux favoris', 'Add to favorites', 'お気に入りに追加');
    showToast(currentLang === 'ja' ? `${manga.titre}をお気に入りから削除しました` : currentLang === 'en' ? `${manga.titre} removed from favorites` : `${manga.titre} retiré des favoris`);
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
  showToast(currentLang === 'ja' ? `${manga.titre}を${rating}/10と評価しました` : currentLang === 'en' ? `${manga.titre} rated ${rating}/10` : `${manga.titre} noté ${rating}/10`);
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
  showToast(TL('Notes sauvegardées', 'Notes saved', 'メモを保存しました'));
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
    showToast(currentLang === 'ja' ? `${manga.titre}は既にオフラインで利用できます` : currentLang === 'en' ? `${manga.titre} is already available offline` : `${manga.titre} est déjà disponible hors-ligne`);
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

  showToast(currentLang === 'ja' ? `${manga.titre}をオフライン保存しました` : currentLang === 'en' ? `${manga.titre} available offline` : `${manga.titre} disponible hors-ligne`);
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
        <h2>${TL('Ajouter à une liste', 'Add to list', 'リストに追加')}</h2>
        <button class="modal-close" onclick="fermerAjouterAListe()">✕</button>
      </div>
      <div class="modal-body">
        ${listNames.length === 0 ? `
          <p class="no-lists-message">${TL('Aucune liste créée.', 'No lists created yet.', 'まだリストがありません。')}</p>
          <p class="no-lists-hint">${TL('Crée des listes depuis l\'accueil (bouton 📋)', 'Create lists from the homepage (📋 button)', 'ホームの📋ボタンからリストを作成できます')}</p>
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
    showToast(currentLang === 'ja' ? `${manga.titre}を「${listName}」に追加しました` : `${manga.titre} ${TL('ajouté à', 'added to', '')} "${listName}"`);
  } else {
    // Retirer de la liste
    lists[listName].splice(index, 1);
    showToast(currentLang === 'ja' ? `${manga.titre}を「${listName}」から削除しました` : `${manga.titre} ${TL('retiré de', 'removed from', '')} "${listName}"`);
  }

  saveCustomLists(lists);

  // Rafraîchir la modal
  ouvrirAjouterAListe(mangaId);
}

// ===== TOMES LUS =====
function getReadTomes(mangaId) {
  const all = JSON.parse(localStorage.getItem('mangaReadTomes') || '{}');
  return new Set((all[mangaId] || []).map(n => parseInt(n, 10)));
}

function setReadTomes(mangaId, set) {
  const all = JSON.parse(localStorage.getItem('mangaReadTomes') || '{}');
  const arr = [...set].sort((a, b) => a - b);
  if (arr.length === 0) {
    delete all[mangaId];
  } else {
    all[mangaId] = arr;
  }
  if (typeof saveReadTomesWithSync === 'function') {
    saveReadTomesWithSync(all);
  } else {
    localStorage.setItem('mangaReadTomes', JSON.stringify(all));
  }
}

function toggleTomeRead(mangaId, num) {
  const set = getReadTomes(mangaId);
  if (set.has(num)) set.delete(num); else set.add(num);
  setReadTomes(mangaId, set);

  // MAJ visuelle locale sans tout re-render
  const card = document.querySelector(`.tome-card[data-tome="${num}"]`);
  if (card) {
    card.classList.toggle('tome-read', set.has(num));
    const btn = card.querySelector('.tome-read-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', set.has(num) ? 'true' : 'false');
      btn.textContent = set.has(num) ? '✓' : '○';
    }
  }
  updateTomesProgress(mangaId);
}

function updateTomesProgress(mangaId) {
  const section = document.querySelector('.tomes-section');
  if (!section) return;
  const total = section.querySelectorAll('.tome-card').length;
  const set = getReadTomes(mangaId);
  // Ne compte que les tomes vraiment présents (couverture chargée)
  const visibleNums = new Set(
    Array.from(section.querySelectorAll('.tome-card'))
      .map(c => parseInt(c.dataset.tome, 10))
  );
  const readVisible = [...set].filter(n => visibleNums.has(n));
  const el = document.getElementById('tomesProgress');
  if (el) el.textContent = `${readVisible.length} / ${total}`;
}

// ===== TOMES (volumes individuels) =====
function formatTomeDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'fr-FR', {
    year: 'numeric', month: 'short'
  });
}

function buildTomesArray(manga) {
  // Si l'auteur a fourni des tomes détaillés, on les utilise
  if (Array.isArray(manga.tomes) && manga.tomes.length) {
    return manga.tomes.slice().sort((a, b) => (a.num || 0) - (b.num || 0));
  }
  // Sinon on génère N entrées en pointant vers le chemin conventionnel
  // images/tomes/{id}-NN.jpg ; si l'image est absente, le onerror du <img>
  // fait retomber sur la couverture principale.
  const count = parseInt(manga.volumes, 10);
  if (!count || count <= 0) return [];
  const out = [];
  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(2, '0');
    out.push({
      num: i,
      cover: `images/tomes/${manga.id}-${num}.jpg`,
      date: null
    });
  }
  return out;
}

function renderTomesSection(manga) {
  const tomes = buildTomesArray(manga);
  if (!tomes.length) return '';
  const lang = currentLang || 'fr';
  const prevLabel = TL('Tomes précédents', 'Previous volumes', '前の巻');
  const nextLabel = TL('Tomes suivants', 'Next volumes', '次の巻');
  const readSet = getReadTomes(manga.id);
  const readLabel = TL('Marquer comme lu', 'Mark as read', '既読にする');
  const unreadLabel = TL('Marquer comme non lu', 'Mark as unread', '未読にする');

  // On rend tous les tomes ; ceux dont la couverture ne charge pas
  // seront retirés du DOM via l'onerror (voir handleTomeImageError).
  return `
    <div class="manga-section tomes-section" data-manga-id="${manga.id}">
      <h2>
        ${TL('Tomes', 'Volumes', '巻一覧')}
        <span class="tomes-count" id="tomesCount">${tomes.length}</span>
        <span class="tomes-progress" id="tomesProgress">${readSet.size} / ${tomes.length}</span>
      </h2>
      <div class="tomes-carousel">
        <button type="button" class="tomes-arrow tomes-prev" aria-label="${prevLabel}" onclick="scrollTomes(this, -1)">‹</button>
        <div class="tomes-scroll" onscroll="updateTomesArrows(this)">
          ${tomes.map(t => {
            if (!t.cover) return '';
            const dateLabel = t.date ? formatTomeDate(t.date, lang) : '';
            const isRead = readSet.has(t.num);
            const ariaLabel = isRead ? unreadLabel : readLabel;
            return `
              <div class="tome-card${isRead ? ' tome-read' : ''}" data-tome="${t.num}">
                <div class="tome-cover-wrap">
                  <img src="${assetUrl(t.cover)}" alt="${TL('Tome', 'Volume', '巻')} ${t.num}" class="tome-cover" loading="lazy" decoding="async" onerror="handleTomeImageError(this)">
                  <span class="tome-num-badge">${t.num}</span>
                  <button type="button" class="tome-read-toggle" aria-pressed="${isRead}" aria-label="${ariaLabel}" title="${ariaLabel}" onclick="event.stopPropagation();toggleTomeRead(${manga.id}, ${t.num})">${isRead ? '✓' : '○'}</button>
                </div>
                <div class="tome-info">
                  <span class="tome-num">${lang === 'ja' ? `第${t.num}巻` : `${lang === 'en' ? 'Vol.' : 'Tome'} ${t.num}`}</span>
                  ${dateLabel ? `<span class="tome-date">${dateLabel}</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <button type="button" class="tomes-arrow tomes-next" aria-label="${nextLabel}" onclick="scrollTomes(this, 1)">›</button>
      </div>
    </div>
  `;
}

// Quand l'image d'un tome ne charge pas, on retire la carte du DOM
// et on met à jour le compteur + la progression.
function handleTomeImageError(img) {
  const card = img.closest('.tome-card');
  const section = img.closest('.tomes-section');
  if (!card || !section) return;
  const mangaId = parseInt(section.dataset.mangaId, 10);
  const tomeNum = parseInt(card.dataset.tome, 10);
  card.remove();

  // MAJ compteur (= nombre de cartes restantes dans la section)
  const remaining = section.querySelectorAll('.tome-card').length;
  const countEl = section.querySelector('#tomesCount');
  if (countEl) countEl.textContent = remaining;

  // MAJ progression : on ne compte plus ce tome dans le total
  const readSet = getReadTomes(mangaId);
  // On retire ce tome du set si jamais il y était (le tome n'existe pas vraiment)
  if (readSet.has(tomeNum)) {
    readSet.delete(tomeNum);
    setReadTomes(mangaId, readSet);
  }
  const progressEl = section.querySelector('#tomesProgress');
  if (progressEl) progressEl.textContent = `${readSet.size} / ${remaining}`;

  // Si plus aucun tome → on cache la section entière
  if (remaining === 0) {
    section.style.display = 'none';
    return;
  }

  // MAJ flèches du carrousel
  const scroll = section.querySelector('.tomes-scroll');
  if (scroll) updateTomesArrows(scroll);
}

// Met à jour la visibilité des flèches selon la position du scroll
function updateTomesArrows(scrollEl) {
  const carousel = scrollEl.closest('.tomes-carousel');
  if (!carousel) return;
  const prev = carousel.querySelector('.tomes-prev');
  const next = carousel.querySelector('.tomes-next');
  const max = scrollEl.scrollWidth - scrollEl.clientWidth;
  const atStart = scrollEl.scrollLeft <= 4;
  const atEnd = scrollEl.scrollLeft >= max - 4;
  const fits = max <= 4; // tout tient dans la vue, pas besoin de flèches
  if (prev) prev.classList.toggle('hidden', atStart || fits);
  if (next) next.classList.toggle('hidden', atEnd || fits);
}

function scrollTomes(button, direction) {
  const carousel = button.closest('.tomes-carousel');
  if (!carousel) return;
  const scrollEl = carousel.querySelector('.tomes-scroll');
  if (!scrollEl) return;
  // Avance d'environ 80% de la largeur visible (laisse un demi-tome de chevauchement)
  const step = Math.max(200, Math.floor(scrollEl.clientWidth * 0.8));
  scrollEl.scrollBy({ left: direction * step, behavior: 'smooth' });
}

// Au chargement de la page, calculer l'état initial des flèches après render
function initTomesArrows() {
  document.querySelectorAll('.tomes-scroll').forEach(updateTomesArrows);
}
window.addEventListener('resize', initTomesArrows);

// Cycle through title styles on click (preview helper)
const TITLE_STYLES = ['title-neon', 'title-marker', 'title-badge', 'title-glitch'];
function cycleTitleStyle(el) {
  const current = TITLE_STYLES.find(c => el.classList.contains(c)) || TITLE_STYLES[0];
  const next = TITLE_STYLES[(TITLE_STYLES.indexOf(current) + 1) % TITLE_STYLES.length];
  el.classList.remove(...TITLE_STYLES);
  el.classList.add(next);
}
