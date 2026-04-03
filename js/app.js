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

// Initialiser le thème de couleur immédiatement
(function() {
  const savedColor = localStorage.getItem('colorTheme') || 'red';
  document.documentElement.setAttribute('data-color', savedColor);
})();

// ===== VARIABLES GLOBALES =====
let genreActif = 'Tous';
let lettreActive = 'Tous';
mangas.sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
let mangasFiltres = mangas;
let currentLang = localStorage.getItem('lang') || 'fr';

// ===== TRADUCTIONS =====
const translations = {
  fr: {
    siteSubtitle: "Un dictionnaire de mangas",
    searchPlaceholder: "Rechercher un manga, auteur, genre...",
    allGenres: "Tous les genres",
    favorites: "Mes Favoris",
    toRead: "Ma Liste À lire",
    compare: "Comparaison",
    recentlyViewed: "Récemment consultés",
    latestReleases: "Dernières sorties",
    library: "Bibliothèque",
    mangaOfDay: "Manga du jour",
    volumes: "volumes",
    all: "Tous",
    gridView: "Vue grille",
    listView: "Vue liste",
    quiz: "Quiz",
    stats: "Stats",
    noResults: "Aucun manga trouvé",
    author: "Auteur",
    year: "Année",
    status: "Statut",
    genres: "Genres",
    summary: "Résumé",
    characters: "Personnages principaux",
    ourReview: "Notre avis",
    similarManga: "Mangas similaires",
    myNotes: "Mes notes",
    notesPlaceholder: "Écris tes notes sur ce manga...",
    autoSave: "Sauvegarde automatique",
    addToFavorites: "Ajouter aux favoris",
    inFavorites: "Dans mes favoris",
    addToList: "À lire",
    inList: "Dans ma liste",
    watchAnime: "Voir l'anime",
    aboutAuthor: "À propos de l'auteur",
    sameUniverse: "Même univers",
    totalMangas: "mangas",
    totalAuthors: "auteurs",
    compareBtn: "Comparer",
    findNextManga: "Découvre ton prochain manga",
    topManga: "Top Mangas",
    findManga: "Trouve ton manga",
    randomManga: "Manga aléatoire",
    myStats: "Mes Stats",
    chooseManga: "Choisir un manga...",
    recommend: "Recommander",
    recoSubtitle: "Sélectionne un manga que tu adores et laisse la magie opérer",
    by: "Par",
    backToLibrary: "← Retour à la bibliothèque",
    myStatistics: "Mes Statistiques",
    ratedManga: "Mangas notés",
    averageRating: "Note moyenne",
    viewed: "Consultés",
    activeDays: "Jours actif",
    favoriteGenres: "Genres préférés",
    topAuthors: "Top 3 Auteurs",
    myPersonalRatings: "Mes notes personnelles",
    noGenresYet: "Ajoutez des mangas à vos favoris pour voir vos genres préférés.",
    noAuthorsYet: "Ajoutez des mangas à vos favoris pour voir vos auteurs préférés.",
    noRatingsYet: "Notez vos mangas sur leurs pages pour les voir ici.",
    myRating: "Ma note",
    manga: "manga",
    mangaPlural: "mangas",
    themeStudio: "Studio couleurs",
    accentColor: "Couleur d'accent",
    bgColor: "Couleur de fond",
    apply: "Appliquer",
    reset: "Réinitialiser",
    lastViewed: "Dernier vu",
    streak: "Streak",
    viewAllStats: "Voir toutes mes stats →",
    customLists: "Mes listes",
    createList: "Créer une liste",
    listName: "Nom de la liste",
    addToList: "Ajouter à une liste",
    removeFromList: "Retirer de la liste",
    noLists: "Aucune liste créée",
    deleteList: "Supprimer la liste",
    created: "créée",
    deleted: "supprimée",
    addedTo: "ajouté à",
    removedFrom: "retiré de",
    emptyList: "Cette liste est vide",
    listExists: "Cette liste existe déjà",
    enterListName: "Entre un nom de liste",
    discoveryTitle: "Trouve ton manga idéal",
    discoverySubtitle: "Réponds à quelques questions et découvre le manga fait pour toi",
    quizMood: "Quelle est ton humeur aujourd'hui ?",
    moodAction: "Envie d'action",
    moodEmotion: "Envie d'émotions",
    moodLaugh: "Envie de rire",
    moodThink: "Envie de réfléchir",
    moodEscape: "Envie d'évasion",
    moodThrill: "Envie de frissons",
    quizType: "Quel type de manga préfères-tu ?",
    typeShonen: "Action, amitié, dépassement",
    typeSeinen: "Mature, complexe, réaliste",
    typeShojo: "Romance, émotions, relations",
    typeAny: "Peu importe",
    typeAnyDesc: "Surprends-moi !",
    quizLength: "Quelle durée de lecture souhaites-tu ?",
    lengthShort: "Court",
    lengthShortDesc: "Moins de 10 tomes",
    lengthMedium: "Moyen",
    lengthMediumDesc: "10 à 30 tomes",
    lengthLong: "Long",
    lengthLongDesc: "Plus de 30 tomes",
    lengthAny: "Peu importe",
    lengthAnyDesc: "La qualité avant tout",
    previous: "Précédent",
    restart: "Recommencer",
    quizResultTitle: "Ton manga idéal :"
  },
  en: {
    siteSubtitle: "A manga dictionary",
    searchPlaceholder: "Search for manga, author, genre...",
    allGenres: "All genres",
    favorites: "My Favorites",
    toRead: "My Reading List",
    compare: "Compare",
    recentlyViewed: "Recently viewed",
    latestReleases: "Latest releases",
    library: "Library",
    mangaOfDay: "Manga of the day",
    volumes: "volumes",
    all: "All",
    gridView: "Grid view",
    listView: "List view",
    quiz: "Quiz",
    stats: "Stats",
    noResults: "No manga found",
    author: "Author",
    year: "Year",
    status: "Status",
    genres: "Genres",
    summary: "Summary",
    characters: "Main characters",
    ourReview: "Our review",
    similarManga: "Similar manga",
    myNotes: "My notes",
    notesPlaceholder: "Write your notes about this manga...",
    autoSave: "Auto-save",
    addToFavorites: "Add to favorites",
    inFavorites: "In my favorites",
    addToList: "To read",
    inList: "In my list",
    watchAnime: "Watch anime",
    aboutAuthor: "About the author",
    sameUniverse: "Same universe",
    totalMangas: "manga",
    totalAuthors: "authors",
    compareBtn: "Compare",
    findNextManga: "Find your next manga",
    topManga: "Top Manga",
    findManga: "Find your manga",
    randomManga: "Random Manga",
    myStats: "My Stats",
    chooseManga: "Choose a manga...",
    recommend: "Recommend",
    recoSubtitle: "Select a manga you love and let the magic happen",
    by: "By",
    backToLibrary: "← Back to library",
    myStatistics: "My Statistics",
    ratedManga: "Rated manga",
    averageRating: "Average rating",
    viewed: "Viewed",
    activeDays: "Active days",
    favoriteGenres: "Favorite genres",
    topAuthors: "Top 3 Authors",
    myPersonalRatings: "My personal ratings",
    noGenresYet: "Add manga to your favorites to see your favorite genres.",
    noAuthorsYet: "Add manga to your favorites to see your favorite authors.",
    noRatingsYet: "Rate manga on their pages to see them here.",
    myRating: "My rating",
    manga: "manga",
    mangaPlural: "manga",
    themeStudio: "Color studio",
    accentColor: "Accent color",
    bgColor: "Background color",
    apply: "Apply",
    reset: "Reset",
    lastViewed: "Last viewed",
    streak: "Streak",
    viewAllStats: "View all my stats →",
    customLists: "My lists",
    createList: "Create a list",
    listName: "List name",
    addToList: "Add to a list",
    removeFromList: "Remove from list",
    noLists: "No lists created",
    deleteList: "Delete list",
    created: "created",
    deleted: "deleted",
    addedTo: "added to",
    removedFrom: "removed from",
    emptyList: "This list is empty",
    listExists: "This list already exists",
    enterListName: "Enter a list name",
    discoveryTitle: "Find your perfect manga",
    discoverySubtitle: "Answer a few questions and discover the manga made for you",
    quizMood: "What's your mood today?",
    moodAction: "Want action",
    moodEmotion: "Want emotions",
    moodLaugh: "Want to laugh",
    moodThink: "Want to think",
    moodEscape: "Want to escape",
    moodThrill: "Want thrills",
    quizType: "What type of manga do you prefer?",
    typeShonen: "Action, friendship, growth",
    typeSeinen: "Mature, complex, realistic",
    typeShojo: "Romance, emotions, relationships",
    typeAny: "Any",
    typeAnyDesc: "Surprise me!",
    quizLength: "How long do you want to read?",
    lengthShort: "Short",
    lengthShortDesc: "Less than 10 volumes",
    lengthMedium: "Medium",
    lengthMediumDesc: "10 to 30 volumes",
    lengthLong: "Long",
    lengthLongDesc: "More than 30 volumes",
    lengthAny: "Any",
    lengthAnyDesc: "Quality first",
    previous: "Previous",
    restart: "Restart",
    quizResultTitle: "Your perfect manga:"
  },
  es: {
    siteSubtitle: "Un diccionario de manga",
    searchPlaceholder: "Buscar manga, autor, género...",
    allGenres: "Todos los géneros",
    favorites: "Mis Favoritos",
    toRead: "Mi Lista de Lectura",
    compare: "Comparar",
    recentlyViewed: "Vistos recientemente",
    latestReleases: "Últimos lanzamientos",
    library: "Biblioteca",
    mangaOfDay: "Manga del día",
    volumes: "tomos",
    all: "Todos",
    gridView: "Vista cuadrícula",
    listView: "Vista lista",
    quiz: "Quiz",
    stats: "Stats",
    noResults: "No se encontró ningún manga",
    author: "Autor",
    year: "Año",
    status: "Estado",
    genres: "Géneros",
    summary: "Resumen",
    characters: "Personajes principales",
    ourReview: "Nuestra opinión",
    similarManga: "Manga similares",
    myNotes: "Mis notas",
    notesPlaceholder: "Escribe tus notas sobre este manga...",
    autoSave: "Guardado automático",
    addToFavorites: "Añadir a favoritos",
    inFavorites: "En mis favoritos",
    addToList: "Por leer",
    inList: "En mi lista",
    watchAnime: "Ver anime",
    aboutAuthor: "Sobre el autor",
    sameUniverse: "Mismo universo",
    totalMangas: "manga",
    totalAuthors: "autores",
    by: "Por",
    backToLibrary: "← Volver a la biblioteca",
    myStatistics: "Mis Estadísticas",
    ratedManga: "Manga valorados",
    averageRating: "Nota media",
    viewed: "Vistos",
    activeDays: "Días activo",
    favoriteGenres: "Géneros favoritos",
    topAuthors: "Top 3 Autores",
    myPersonalRatings: "Mis notas personales",
    noGenresYet: "Añade manga a tus favoritos para ver tus géneros favoritos.",
    noAuthorsYet: "Añade manga a tus favoritos para ver tus autores favoritos.",
    noRatingsYet: "Valora manga en sus páginas para verlos aquí.",
    myRating: "Mi nota",
    manga: "manga",
    mangaPlural: "manga",
    themeStudio: "Estudio de colores",
    accentColor: "Color de acento",
    bgColor: "Color de fondo",
    apply: "Aplicar",
    reset: "Restablecer",
    lastViewed: "Último visto",
    streak: "Racha",
    viewAllStats: "Ver todas mis estadísticas →",
    customLists: "Mis listas",
    createList: "Crear una lista",
    listName: "Nombre de la lista",
    addToList: "Añadir a una lista",
    removeFromList: "Quitar de la lista",
    noLists: "No hay listas creadas",
    deleteList: "Eliminar lista",
    created: "creada",
    deleted: "eliminada",
    addedTo: "añadido a",
    removedFrom: "eliminado de",
    emptyList: "Esta lista está vacía",
    listExists: "Esta lista ya existe",
    enterListName: "Introduce un nombre de lista",
    discoveryTitle: "Encuentra tu manga ideal",
    discoverySubtitle: "Responde algunas preguntas y descubre el manga hecho para ti",
    quizMood: "¿Cuál es tu estado de ánimo hoy?",
    moodAction: "Quiero acción",
    moodEmotion: "Quiero emociones",
    moodLaugh: "Quiero reír",
    moodThink: "Quiero pensar",
    moodEscape: "Quiero escapar",
    moodThrill: "Quiero escalofríos",
    quizType: "¿Qué tipo de manga prefieres?",
    typeShonen: "Acción, amistad, superación",
    typeSeinen: "Maduro, complejo, realista",
    typeShojo: "Romance, emociones, relaciones",
    typeAny: "Cualquiera",
    typeAnyDesc: "¡Sorpréndeme!",
    quizLength: "¿Cuánto quieres leer?",
    lengthShort: "Corto",
    lengthShortDesc: "Menos de 10 tomos",
    lengthMedium: "Medio",
    lengthMediumDesc: "10 a 30 tomos",
    lengthLong: "Largo",
    lengthLongDesc: "Más de 30 tomos",
    lengthAny: "Cualquiera",
    lengthAnyDesc: "La calidad primero",
    previous: "Anterior",
    restart: "Reiniciar",
    quizResultTitle: "Tu manga ideal:"
  },
  ja: {
    siteSubtitle: "漫画辞典",
    searchPlaceholder: "漫画、作者、ジャンルを検索...",
    allGenres: "すべてのジャンル",
    favorites: "お気に入り",
    toRead: "読みたいリスト",
    compare: "比較",
    recentlyViewed: "最近見た作品",
    latestReleases: "最新リリース",
    library: "ライブラリ",
    mangaOfDay: "今日の漫画",
    volumes: "巻",
    all: "すべて",
    gridView: "グリッド表示",
    listView: "リスト表示",
    quiz: "クイズ",
    stats: "統計",
    noResults: "漫画が見つかりません",
    author: "作者",
    year: "年",
    status: "状態",
    genres: "ジャンル",
    summary: "あらすじ",
    characters: "主要キャラクター",
    ourReview: "レビュー",
    similarManga: "似た漫画",
    myNotes: "メモ",
    notesPlaceholder: "この漫画についてメモを書く...",
    autoSave: "自動保存",
    addToFavorites: "お気に入りに追加",
    inFavorites: "お気に入り中",
    addToList: "読む",
    inList: "リストに追加済み",
    watchAnime: "アニメを見る",
    aboutAuthor: "作者について",
    sameUniverse: "同じ世界",
    totalMangas: "作品",
    totalAuthors: "作者",
    by: "作者：",
    backToLibrary: "← ライブラリに戻る",
    myStatistics: "マイ統計",
    ratedManga: "評価した漫画",
    averageRating: "平均評価",
    viewed: "閲覧済み",
    activeDays: "アクティブ日数",
    favoriteGenres: "好きなジャンル",
    topAuthors: "トップ3作者",
    myPersonalRatings: "マイ評価",
    noGenresYet: "お気に入りに漫画を追加して、好きなジャンルを確認しましょう。",
    noAuthorsYet: "お気に入りに漫画を追加して、好きな作者を確認しましょう。",
    noRatingsYet: "漫画のページで評価すると、ここに表示されます。",
    myRating: "マイ評価",
    manga: "作品",
    mangaPlural: "作品",
    themeStudio: "カラースタジオ",
    accentColor: "アクセントカラー",
    bgColor: "背景色",
    apply: "適用",
    reset: "リセット",
    lastViewed: "最後に見た",
    streak: "連続日数",
    viewAllStats: "すべての統計を見る →",
    customLists: "マイリスト",
    createList: "リストを作成",
    listName: "リスト名",
    addToList: "リストに追加",
    removeFromList: "リストから削除",
    noLists: "リストがありません",
    deleteList: "リストを削除",
    created: "作成されました",
    deleted: "削除されました",
    addedTo: "に追加",
    removedFrom: "から削除",
    emptyList: "このリストは空です",
    listExists: "このリストは既に存在します",
    enterListName: "リスト名を入力してください",
    discoveryTitle: "理想の漫画を見つけよう",
    discoverySubtitle: "いくつかの質問に答えて、あなたにぴったりの漫画を発見しよう",
    quizMood: "今日の気分は？",
    moodAction: "アクションが見たい",
    moodEmotion: "感動したい",
    moodLaugh: "笑いたい",
    moodThink: "考えたい",
    moodEscape: "現実逃避したい",
    moodThrill: "ゾクゾクしたい",
    quizType: "どんなタイプの漫画が好き？",
    typeShonen: "アクション、友情、成長",
    typeSeinen: "大人向け、複雑、リアル",
    typeShojo: "恋愛、感情、人間関係",
    typeAny: "どれでも",
    typeAnyDesc: "驚かせて！",
    quizLength: "どのくらいの長さがいい？",
    lengthShort: "短い",
    lengthShortDesc: "10巻未満",
    lengthMedium: "中くらい",
    lengthMediumDesc: "10〜30巻",
    lengthLong: "長い",
    lengthLongDesc: "30巻以上",
    lengthAny: "どれでも",
    lengthAnyDesc: "質が一番",
    previous: "前へ",
    restart: "やり直す",
    quizResultTitle: "あなたの理想の漫画："
  }
};

const langFlags = {
  fr: '🇫🇷',
  en: '🇬🇧',
  es: '🇪🇸',
  ja: '🇯🇵'
};

// Traduction des genres (clé = français, valeur = traductions)
const genreTranslations = {
  'Tous': { en: 'All', es: 'Todos', ja: 'すべて' },
  'Shonen': { en: 'Shonen', es: 'Shonen', ja: '少年' },
  'Seinen': { en: 'Seinen', es: 'Seinen', ja: '青年' },
  'Shojo': { en: 'Shojo', es: 'Shojo', ja: '少女' },
  'Action': { en: 'Action', es: 'Acción', ja: 'アクション' },
  'Aventure': { en: 'Adventure', es: 'Aventura', ja: '冒険' },
  'Comédie': { en: 'Comedy', es: 'Comedia', ja: 'コメディ' },
  'Romance': { en: 'Romance', es: 'Romance', ja: 'ロマンス' },
  'Fantasy': { en: 'Fantasy', es: 'Fantasía', ja: 'ファンタジー' },
  'Thriller': { en: 'Thriller', es: 'Thriller', ja: 'スリラー' },
  'Horreur': { en: 'Horror', es: 'Horror', ja: 'ホラー' },
  'Sport': { en: 'Sports', es: 'Deportes', ja: 'スポーツ' },
  'Science-fiction': { en: 'Sci-Fi', es: 'Ciencia ficción', ja: 'SF' },
  'Cyberpunk': { en: 'Cyberpunk', es: 'Cyberpunk', ja: 'サイバーパンク' },
  'Dark Fantasy': { en: 'Dark Fantasy', es: 'Dark Fantasy', ja: 'ダークファンタジー' },
  'Surnaturel': { en: 'Supernatural', es: 'Sobrenatural', ja: '超自然' },
  'Ninja': { en: 'Ninja', es: 'Ninja', ja: '忍者' },
  'Magical Girl': { en: 'Magical Girl', es: 'Magical Girl', ja: '魔法少女' },
  'Psychologique': { en: 'Psychological', es: 'Psicológico', ja: '心理' },
  'Drame': { en: 'Drama', es: 'Drama', ja: 'ドラマ' },
  'Tranche de vie': { en: 'Slice of Life', es: 'Recuentos de la vida', ja: '日常' },
  'Mystère': { en: 'Mystery', es: 'Misterio', ja: 'ミステリー' },
  'Historique': { en: 'Historical', es: 'Histórico', ja: '歴史' },
  'Musique': { en: 'Music', es: 'Música', ja: '音楽' },
  'Isekai': { en: 'Isekai', es: 'Isekai', ja: '異世界' },
  'Mecha': { en: 'Mecha', es: 'Mecha', ja: 'メカ' },
  'Arts martiaux': { en: 'Martial Arts', es: 'Artes marciales', ja: '格闘技' },
  'Ecchi': { en: 'Ecchi', es: 'Ecchi', ja: 'エッチ' },
  'Mature': { en: 'Mature', es: 'Maduro', ja: '成人向け' }
};

function translateGenre(genre) {
  if (currentLang === 'fr') return genre;
  return genreTranslations[genre]?.[currentLang] || genre;
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Ne s'exécute que sur la page index (vérifie si la grille existe)
  const mangaGrid = document.getElementById('mangaGrid');
  if (!mangaGrid) {
    return;
  }

  // IMPORTANT: Rendre la page visible en premier
  initAnimations();

  initLanguage();
  afficherStats();
  genererFiltres();
  genererAlphabetSidebar();
  afficherMangas(mangas);
  setupRecherche();
  initVoiceSearch();
  restaurerPosition();
  afficherFavoris();
  afficherALire();
  afficherActualites();
  afficherMangaDuJour();
  afficherHistorique();
  initStatsWidget();
  updateCustomListsCount();
  initColorTheme();
  initViewMode();
  initCardSize();

  // Nouvelles fonctionnalités
  initPullToRefresh();
  initSwipeGestures();
  initFont();
  loadCustomTheme();
  afficherClassement('all');
  initRecommandations();
});

// ===== SAUVEGARDE ET RESTAURATION DE LA POSITION =====
function sauvegarderPosition() {
  sessionStorage.setItem('scrollPosition', window.scrollY);
}

function restaurerPosition() {
  const scrollPosition = sessionStorage.getItem('scrollPosition');
  if (scrollPosition) {
    window.scrollTo(0, parseInt(scrollPosition));
    sessionStorage.removeItem('scrollPosition');
  }
}

function allerVersManga(id) {
  sauvegarderPosition();
  window.location.href = 'manga.html?id=' + id;
}

// ===== STATISTIQUES =====
function afficherStats() {
  document.getElementById('totalMangas').textContent = mangas.length;

  const auteursUniques = new Set(mangas.map(m => m.auteur));
  document.getElementById('totalAuteurs').textContent = auteursUniques.size;
}

// ===== GÉNÉRATION DES FILTRES =====
function genererFiltres() {
  const dropdown = document.getElementById('genreDropdown');
  const dropdownBtn = document.getElementById('dropdownBtn');
  const dropdownMenu = document.getElementById('dropdownMenu');

  // Générer les items du menu
  genres.forEach(genre => {
    const btn = document.createElement('button');
    btn.className = `dropdown-item ${genre === 'Tous' ? 'active' : ''}`;
    btn.textContent = genre;
    btn.onclick = (e) => {
      e.stopPropagation();
      filtrerMangas(genre, btn);
      dropdown.classList.remove('open');
    };
    dropdownMenu.appendChild(btn);
  });

  // Toggle du dropdown
  dropdownBtn.onclick = () => {
    dropdown.classList.toggle('open');
  };

  // Fermer le dropdown en cliquant ailleurs
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}

// ===== FILTRAGE PAR GENRE =====
function filtrerMangas(genre, btnElement) {
  genreActif = genre;

  // Mettre à jour le texte du dropdown
  document.getElementById('selectedGenre').textContent = genre === 'Tous' ? 'Tous les genres' : genre;

  // Mettre à jour les boutons actifs
  document.querySelectorAll('.dropdown-item').forEach(btn => {
    btn.classList.remove('active');
  });
  btnElement.classList.add('active');

  // Appliquer tous les filtres
  const searchTerm = document.getElementById('searchInput').value;
  appliquerFiltres(searchTerm);
}

// ===== AFFICHAGE DES MANGAS =====
function afficherMangas(listMangas) {
  const grid = document.getElementById('mangaGrid');
  const noResults = document.getElementById('noResults');

  if (listMangas.length === 0) {
    grid.style.display = 'none';
    noResults.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  noResults.style.display = 'none';

  // Afficher les skeleton cards d'abord
  const skeletonCount = Math.min(listMangas.length, 12);
  grid.innerHTML = Array(skeletonCount).fill(0).map((_, index) => `
    <div class="skeleton-card" style="animation-delay: ${index * 0.05}s">
      <div class="skeleton-cover"></div>
      <div class="skeleton-info">
        <div class="skeleton-text title"></div>
        <div class="skeleton-text author"></div>
        <div class="skeleton-text genres"></div>
        <div class="skeleton-text rating"></div>
      </div>
    </div>
  `).join('');

  // Remplacer par les vraies cartes apres un court delai
  setTimeout(() => {
    grid.innerHTML = listMangas.map((manga, index) => {
      // Appliquer le highlighting si recherche active
      const displayTitle = currentSearchTerm ? highlightMatch(manga.titre, currentSearchTerm) : manga.titre;
      const displayAuthor = currentSearchTerm ? highlightMatch(manga.auteur, currentSearchTerm) : manga.auteur;

      return `
      <div class="manga-card ${modeComparaison ? 'compare-mode' : ''}" data-genre="${manga.genre[0]}" data-index="${index}" data-id="${manga.id}" onclick="${modeComparaison ? '' : 'allerVersManga(' + manga.id + ')'}">
        ${modeComparaison ? `
          <div class="compare-checkbox ${mangasAComparer.includes(manga.id) ? 'checked' : ''}" data-id="${manga.id}" onclick="ajouterComparaison(${manga.id}, event)">
            <span>✓</span>
          </div>
        ` : ''}
        <img
          src="${manga.couverture}"
          alt="${manga.titre}"
          class="manga-cover"
          onerror="this.style.display='none'"
        >
        <div class="manga-info">
          <h3 class="manga-title">${displayTitle}</h3>
          <p class="manga-author">${displayAuthor}</p>
          <div class="manga-genres">
            ${manga.genre.slice(0, 2).map(g => `<span class="genre-tag" data-genre="${g}">${g}</span>`).join('')}
          </div>
          <div class="manga-rating">
            <span class="stars">${'★'.repeat(Math.round(manga.note/2))}${'☆'.repeat(5 - Math.round(manga.note/2))}</span>
            <span>${manga.note}/10</span>
          </div>
        </div>
      </div>
    `}).join('');

    // Animer les cartes en stagger
    animerCartesStagger();
  }, 300);
}

// ===== RECHERCHE =====
function setupRecherche() {
  const searchInput = document.getElementById('searchInput');
  let timeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const terme = e.target.value.toLowerCase();
      appliquerFiltres(terme);
    }, 300);
  });
}

// Masquer/afficher les sections selon si une recherche est active
function toggleSectionsOnSearch(searchTerm) {
  const sectionsToHide = [
    'mangaDuJourSection',
    'statsWidgetSection',
    'actualitesSection',
    'historiqueSection',
    'recommendationsSection',
    'classementsSection'
  ];

  const isSearching = searchTerm && searchTerm.trim().length > 0;

  sectionsToHide.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      if (isSearching) {
        section.style.display = 'none';
      } else {
        // Restaurer l'affichage par défaut (sauf historique qui a sa propre logique)
        if (sectionId === 'historiqueSection') {
          // L'historique a sa propre logique d'affichage
          afficherHistorique();
        } else {
          section.style.display = '';
        }
      }
    }
  });
}

// ===== RECHERCHE VOCALE =====
let recognition = null;
let isListening = false;

function initVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    // Le navigateur ne supporte pas la reconnaissance vocale
    const voiceBtn = document.getElementById('voiceSearchBtn');
    if (voiceBtn) {
      voiceBtn.style.display = 'none';
    }
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = currentLang === 'ja' ? 'ja-JP' : currentLang === 'es' ? 'es-ES' : currentLang === 'en' ? 'en-US' : 'fr-FR';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = function() {
    isListening = true;
    const voiceBtn = document.getElementById('voiceSearchBtn');
    if (voiceBtn) {
      voiceBtn.classList.add('listening');
    }
  };

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = transcript;
      // Déclencher la recherche
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  recognition.onerror = function(event) {
    isListening = false;
    const voiceBtn = document.getElementById('voiceSearchBtn');
    if (voiceBtn) {
      voiceBtn.classList.remove('listening');
    }

    if (event.error === 'not-allowed') {
      showToast('Accès au microphone refusé', 'error');
    } else if (event.error === 'no-speech') {
      showToast('Aucune voix détectée', 'error');
    } else {
      showToast('Erreur de reconnaissance vocale', 'error');
    }
  };

  recognition.onend = function() {
    isListening = false;
    const voiceBtn = document.getElementById('voiceSearchBtn');
    if (voiceBtn) {
      voiceBtn.classList.remove('listening');
    }
  };
}

function toggleVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast('La reconnaissance vocale n\'est pas supportée par votre navigateur', 'error');
    return;
  }

  if (!recognition) {
    initVoiceSearch();
  }

  if (isListening) {
    recognition.stop();
  } else {
    // Mettre à jour la langue avant de démarrer
    recognition.lang = currentLang === 'ja' ? 'ja-JP' : currentLang === 'es' ? 'es-ES' : currentLang === 'en' ? 'en-US' : 'fr-FR';
    recognition.start();
  }
}

// ===== SIDEBAR ALPHABÉTIQUE =====
function genererAlphabetSidebar() {
  const container = document.getElementById('alphabetSidebar');
  const alphabet = ['Tous', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  // Trouver les lettres qui ont des mangas
  const lettresAvecMangas = new Set(
    mangas.map(m => m.titre.charAt(0).toUpperCase())
  );

  alphabet.forEach(lettre => {
    const btn = document.createElement('button');
    btn.className = 'alphabet-btn';
    if (lettre === 'Tous') {
      btn.textContent = '∀';
      btn.title = 'Tous les mangas';
      btn.classList.add('active');
    } else {
      btn.textContent = lettre;
      if (!lettresAvecMangas.has(lettre)) {
        btn.classList.add('disabled');
      }
    }
    btn.onclick = () => filtrerParLettre(lettre, btn);
    container.appendChild(btn);
  });
}

function filtrerParLettre(lettre, btnElement) {
  if (btnElement.classList.contains('disabled')) return;

  lettreActive = lettre;

  // Mettre à jour les boutons actifs
  document.querySelectorAll('.alphabet-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  btnElement.classList.add('active');

  // Appliquer les filtres
  const searchTerm = document.getElementById('searchInput').value;
  appliquerFiltres(searchTerm);
}

// ===== RECHERCHE FLOUE (FUZZY SEARCH) =====
// Variable pour stocker le terme de recherche actuel (pour le highlighting)
let currentSearchTerm = '';

// Calcule la distance de Levenshtein entre deux chaînes
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calcule un score de similarité entre 0 et 1
function fuzzyScore(query, target) {
  if (!query || !target) return 0;

  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  // Match exact = score parfait
  if (t === q) return 1;

  // Contient la query exacte = très bon score
  if (t.includes(q)) {
    // Bonus si ça commence par la query
    if (t.startsWith(q)) return 0.95;
    return 0.85;
  }

  // Vérifier si un mot commence par la query
  const words = t.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q)) return 0.75;
  }

  // Calcul basé sur Levenshtein pour les typos
  const distance = levenshteinDistance(q, t);
  const maxLen = Math.max(q.length, t.length);

  // Score basé sur la distance relative
  const similarity = 1 - (distance / maxLen);

  // Seuil minimum de similarité
  if (similarity < 0.3) return 0;

  // Ajuster le score pour les recherches floues
  return similarity * 0.6;
}

// Recherche floue dans une liste de mangas
function fuzzySearchMangas(query, list, threshold = 0.3) {
  if (!query || query.trim() === '') return list;

  const q = query.toLowerCase().trim();

  const results = list.map(manga => {
    // Calculer les scores pour titre, auteur et genres
    const titleScore = fuzzyScore(q, manga.titre);
    const authorScore = fuzzyScore(q, manga.auteur) * 0.9; // Légèrement moins prioritaire
    const genreScores = manga.genre.map(g => fuzzyScore(q, g) * 0.8);
    const maxGenreScore = Math.max(...genreScores, 0);

    // Prendre le meilleur score
    const bestScore = Math.max(titleScore, authorScore, maxGenreScore);

    return { manga, score: bestScore };
  });

  // Filtrer par seuil et trier par score décroissant
  return results
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(r => r.manga);
}

// Met en surbrillance les correspondances dans le texte
function highlightMatch(text, query) {
  if (!query || query.trim() === '') return text;

  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();

  // Recherche de la correspondance exacte d'abord
  const index = t.indexOf(q);
  if (index !== -1) {
    const before = text.substring(0, index);
    const match = text.substring(index, index + q.length);
    const after = text.substring(index + q.length);
    return `${before}<mark class="search-highlight">${match}</mark>${after}`;
  }

  // Recherche du début de mot correspondant
  const words = text.split(/(\s+)/);
  const highlighted = words.map(word => {
    if (word.toLowerCase().startsWith(q)) {
      const match = word.substring(0, q.length);
      const rest = word.substring(q.length);
      return `<mark class="search-highlight">${match}</mark>${rest}`;
    }
    return word;
  }).join('');

  if (highlighted !== text) return highlighted;

  return text;
}

function appliquerFiltres(searchTerm = '') {
  // Gérer l'affichage des sections selon la recherche
  toggleSectionsOnSearch(searchTerm);

  // Commencer avec tous les mangas
  mangasFiltres = mangas;

  // Filtrer par genre
  if (genreActif !== 'Tous') {
    mangasFiltres = mangasFiltres.filter(m => m.genre.includes(genreActif));
  }

  // Filtrer par lettre
  if (lettreActive !== 'Tous') {
    mangasFiltres = mangasFiltres.filter(m =>
      m.titre.charAt(0).toUpperCase() === lettreActive
    );
  }

  // Filtrer par recherche floue
  if (searchTerm) {
    currentSearchTerm = searchTerm;
    mangasFiltres = fuzzySearchMangas(searchTerm, mangasFiltres);
  } else {
    currentSearchTerm = '';
  }

  afficherMangas(mangasFiltres);
}

// ===== MANGA ALEATOIRE =====
function mangaAleatoire() {
  const randomIndex = Math.floor(Math.random() * mangas.length);
  const randomManga = mangas[randomIndex];
  window.location.href = 'manga.html?id=' + randomManga.id;
}

// ===== SYSTEME DE FAVORIS =====
function getFavoris() {
  const favoris = localStorage.getItem('mangaFavoris');
  return favoris ? JSON.parse(favoris) : [];
}

function toggleFavori(id) {
  let favoris = getFavoris();
  const index = favoris.indexOf(id);
  const manga = getMangaById(id);
  const titre = manga ? manga.titre : 'Manga';

  if (index === -1) {
    favoris.push(id);
    showToast(`${titre} ajouté aux favoris ★`);
  } else {
    favoris.splice(index, 1);
    showToast(`${titre} retiré des favoris`);
  }

  localStorage.setItem('mangaFavoris', JSON.stringify(favoris));
  return favoris.includes(id);
}

function estFavori(id) {
  return getFavoris().includes(id);
}

function afficherFavoris() {
  const favorisIds = getFavoris();
  const grid = document.getElementById('favoritesGrid');
  const count = document.getElementById('favCount');

  // Mettre à jour le compteur
  if (count) {
    count.textContent = favorisIds.length;
  }

  if (!grid) return;

  if (favorisIds.length === 0) {
    grid.innerHTML = '<p class="no-favorites">Aucun favori pour le moment.<br>Ajoutez des mangas en cliquant sur ★ sur leur page.</p>';
    return;
  }

  const favorisMangas = mangas.filter(m => favorisIds.includes(m.id));

  grid.innerHTML = favorisMangas.map(manga => `
    <div class="manga-card visible" data-genre="${manga.genre[0]}" onclick="allerVersManga(${manga.id})">
      <img
        src="${manga.couverture}"
        alt="${manga.titre}"
        class="manga-cover"
        onerror="this.style.display='none'"
      >
      <div class="manga-info">
        <h3 class="manga-title">${manga.titre}</h3>
        <p class="manga-author">${manga.auteur}</p>
        <div class="manga-genres">
          ${manga.genre.slice(0, 2).map(g => `<span class="genre-tag" data-genre="${g}">${g}</span>`).join('')}
        </div>
        <div class="manga-rating">
          <span class="stars">${'★'.repeat(Math.round(manga.note/2))}${'☆'.repeat(5 - Math.round(manga.note/2))}</span>
          <span>${manga.note}/10</span>
        </div>
      </div>
    </div>
  `).join('');
}

function ouvrirFavoris() {
  afficherFavoris();
  const modal = document.getElementById('favoritesModal');
  modal.classList.remove('closing');
  modal.classList.add('open');
}

function fermerFavoris(event) {
  if (event.target === event.currentTarget) {
    fermerModalAvecAnimation('favoritesModal');
  }
}

function fermerFavorisBtn() {
  fermerModalAvecAnimation('favoritesModal');
}

// ===== MODAL QUIZ =====
function ouvrirQuiz() {
  restartQuiz();
  const modal = document.getElementById('quizModal');
  modal.classList.remove('closing');
  modal.classList.add('open');
}

function fermerQuiz(event) {
  if (event.target === event.currentTarget) {
    fermerModalAvecAnimation('quizModal');
  }
}

function fermerQuizBtn() {
  fermerModalAvecAnimation('quizModal');
}

// ===== SYSTEME "À LIRE" =====
function getALire() {
  const aLire = localStorage.getItem('mangaALire');
  return aLire ? JSON.parse(aLire) : [];
}

function toggleALire(id) {
  let aLire = getALire();
  const index = aLire.indexOf(id);
  const manga = getMangaById(id);
  const titre = manga ? manga.titre : 'Manga';

  if (index === -1) {
    aLire.push(id);
    showToast(`${titre} ajouté à la liste 📚`);
  } else {
    aLire.splice(index, 1);
    showToast(`${titre} retiré de la liste`);
  }

  localStorage.setItem('mangaALire', JSON.stringify(aLire));
  return aLire.includes(id);
}

function estALire(id) {
  return getALire().includes(id);
}

function afficherALire() {
  const aLireIds = getALire();
  const grid = document.getElementById('alireGrid');
  const count = document.getElementById('alireCount');

  if (count) {
    count.textContent = aLireIds.length;
  }

  if (!grid) return;

  if (aLireIds.length === 0) {
    grid.innerHTML = '<p class="no-favorites">Aucun manga dans votre liste.<br>Ajoutez des mangas en cliquant sur 📚 sur leur page.</p>';
    return;
  }

  const aLireMangas = mangas.filter(m => aLireIds.includes(m.id));

  grid.innerHTML = aLireMangas.map(manga => `
    <div class="manga-card visible" data-genre="${manga.genre[0]}" onclick="allerVersManga(${manga.id})">
      <img
        src="${manga.couverture}"
        alt="${manga.titre}"
        class="manga-cover"
        onerror="this.style.display='none'"
      >
      <div class="manga-info">
        <h3 class="manga-title">${manga.titre}</h3>
        <p class="manga-author">${manga.auteur}</p>
        <div class="manga-genres">
          ${manga.genre.slice(0, 2).map(g => `<span class="genre-tag" data-genre="${g}">${g}</span>`).join('')}
        </div>
        <div class="manga-rating">
          <span class="stars">${'★'.repeat(Math.round(manga.note/2))}${'☆'.repeat(5 - Math.round(manga.note/2))}</span>
          <span>${manga.note}/10</span>
        </div>
      </div>
    </div>
  `).join('');
}

function ouvrirALire() {
  afficherALire();
  const modal = document.getElementById('alireModal');
  modal.classList.remove('closing');
  modal.classList.add('open');
}

function fermerALire(event) {
  if (event.target === event.currentTarget) {
    fermerModalAvecAnimation('alireModal');
  }
}

function fermerALireBtn() {
  fermerModalAvecAnimation('alireModal');
}

// ===== LISTES PERSONNALISÉES =====
function getCustomLists() {
  const lists = localStorage.getItem('mangaCustomLists');
  return lists ? JSON.parse(lists) : {};
}

function saveCustomLists(lists) {
  localStorage.setItem('mangaCustomLists', JSON.stringify(lists));
}

function createCustomList(name) {
  if (!name || name.trim() === '') return false;

  const lists = getCustomLists();
  const trimmedName = name.trim();

  if (lists[trimmedName]) {
    showToast(t('listExists') || 'Cette liste existe déjà', 'error');
    return false;
  }

  lists[trimmedName] = [];
  saveCustomLists(lists);
  showToast(`${t('customLists')}: "${trimmedName}" ${t('created') || 'créée'}`);
  return true;
}

function deleteCustomList(name) {
  const lists = getCustomLists();
  if (lists[name]) {
    delete lists[name];
    saveCustomLists(lists);
    showToast(`${t('customLists')}: "${name}" ${t('deleted') || 'supprimée'}`);
    return true;
  }
  return false;
}

function addToCustomList(listName, mangaId) {
  const lists = getCustomLists();
  if (!lists[listName]) {
    lists[listName] = [];
  }

  if (!lists[listName].includes(mangaId)) {
    lists[listName].push(mangaId);
    saveCustomLists(lists);
    const manga = getMangaById(mangaId);
    showToast(`${manga?.titre || 'Manga'} ${t('addedTo') || 'ajouté à'} "${listName}"`);
    return true;
  }
  return false;
}

function removeFromCustomList(listName, mangaId) {
  const lists = getCustomLists();
  if (lists[listName]) {
    const index = lists[listName].indexOf(mangaId);
    if (index !== -1) {
      lists[listName].splice(index, 1);
      saveCustomLists(lists);
      const manga = getMangaById(mangaId);
      showToast(`${manga?.titre || 'Manga'} ${t('removedFrom') || 'retiré de'} "${listName}"`);
      return true;
    }
  }
  return false;
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

function ouvrirCustomLists() {
  afficherCustomLists();
  const modal = document.getElementById('customListsModal');
  if (modal) {
    modal.classList.remove('closing');
    modal.classList.add('open');
  }
}

function fermerCustomLists(event) {
  if (event.target === event.currentTarget) {
    fermerModalAvecAnimation('customListsModal');
  }
}

function fermerCustomListsBtn() {
  fermerModalAvecAnimation('customListsModal');
}

function afficherCustomLists() {
  const grid = document.getElementById('customListsGrid');
  if (!grid) return;

  const lists = getCustomLists();
  const listNames = Object.keys(lists);

  if (listNames.length === 0) {
    grid.innerHTML = `<p class="no-favorites">${t('noLists')}</p>`;
    return;
  }

  grid.innerHTML = listNames.map(name => {
    const mangaIds = lists[name];
    const previewMangas = mangaIds.slice(0, 3).map(id => getMangaById(id)).filter(m => m);

    return `
      <div class="custom-list-card" onclick="afficherListeDetail('${name}')">
        <div class="custom-list-header">
          <h3 class="custom-list-name">${name}</h3>
          <button class="custom-list-delete" onclick="supprimerListe('${name}', event)" title="${t('deleteList')}">🗑️</button>
        </div>
        <div class="custom-list-preview">
          ${previewMangas.map(m => `<img src="${m.couverture}" alt="${m.titre}" onerror="this.style.display='none'">`).join('')}
          ${mangaIds.length > 3 ? `<span class="custom-list-more">+${mangaIds.length - 3}</span>` : ''}
        </div>
        <span class="custom-list-count">${mangaIds.length} manga${mangaIds.length > 1 ? 's' : ''}</span>
      </div>
    `;
  }).join('');
}

function supprimerListe(name, event) {
  event.stopPropagation();
  if (confirm(`${t('deleteList')} "${name}" ?`)) {
    deleteCustomList(name);
    afficherCustomLists();
    updateCustomListsCount();
  }
}

function afficherListeDetail(name) {
  const lists = getCustomLists();
  const mangaIds = lists[name] || [];
  const grid = document.getElementById('customListsGrid');

  if (mangaIds.length === 0) {
    grid.innerHTML = `
      <button class="back-to-lists" onclick="afficherCustomLists()">← ${t('customLists')}</button>
      <h3 style="margin: 20px 0;">${name}</h3>
      <p class="no-favorites">${t('emptyList') || 'Cette liste est vide'}</p>
    `;
    return;
  }

  const mangasList = mangaIds.map(id => getMangaById(id)).filter(m => m);

  grid.innerHTML = `
    <button class="back-to-lists" onclick="afficherCustomLists()">← ${t('customLists')}</button>
    <h3 style="margin: 20px 0;">${name} (${mangasList.length})</h3>
    <div class="custom-list-mangas">
      ${mangasList.map(manga => `
        <div class="manga-card visible" data-genre="${manga.genre[0]}" onclick="allerVersManga(${manga.id})">
          <button class="remove-from-list-btn" onclick="retirerDeListe('${name}', ${manga.id}, event)" title="${t('removeFromList')}">✕</button>
          <img src="${manga.couverture}" alt="${manga.titre}" class="manga-cover" onerror="this.style.display='none'">
          <div class="manga-info">
            <h3 class="manga-title">${manga.titre}</h3>
            <p class="manga-author">${manga.auteur}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function retirerDeListe(listName, mangaId, event) {
  event.stopPropagation();
  removeFromCustomList(listName, mangaId);
  afficherListeDetail(listName);
  updateCustomListsCount();
}

function creerNouvelleListe() {
  const input = document.getElementById('newListName');
  if (!input) {
    console.error('Input newListName not found');
    return;
  }

  const listName = input.value.trim();
  if (!listName) {
    showToast(t('enterListName') || 'Entre un nom de liste', 'error');
    input.focus();
    return;
  }

  if (createCustomList(listName)) {
    input.value = '';
    afficherCustomLists();
    updateCustomListsCount();
  }
}

function updateCustomListsCount() {
  const count = document.getElementById('customListsCount');
  if (count) {
    const lists = getCustomLists();
    count.textContent = Object.keys(lists).length;
  }
}

// ===== SYSTEME DE COMPARAISON =====
let modeComparaison = false;
let mangasAComparer = [];

function toggleModeComparaison() {
  modeComparaison = !modeComparaison;
  const btn = document.querySelector('.compare-toggle');
  const text = document.getElementById('compareText');

  if (modeComparaison) {
    btn.classList.add('active');
    text.textContent = 'Annuler';
    mangasAComparer = [];
    afficherMangas(mangasFiltres);
  } else {
    btn.classList.remove('active');
    text.textContent = 'Comparer';
    mangasAComparer = [];
    afficherMangas(mangasFiltres);
  }
}

function ajouterComparaison(id, event) {
  event.stopPropagation();

  const index = mangasAComparer.indexOf(id);
  if (index === -1) {
    if (mangasAComparer.length < 3) {
      mangasAComparer.push(id);
    }
  } else {
    mangasAComparer.splice(index, 1);
  }

  // Mettre à jour les checkboxes
  document.querySelectorAll('.compare-checkbox').forEach(cb => {
    const mangaId = parseInt(cb.dataset.id);
    cb.classList.toggle('checked', mangasAComparer.includes(mangaId));
  });

  // Afficher le bouton de comparaison si 2+ mangas sélectionnés
  const compareBtn = document.getElementById('compareText');
  if (mangasAComparer.length >= 2) {
    compareBtn.textContent = `Comparer (${mangasAComparer.length})`;
    document.querySelector('.compare-toggle').onclick = afficherComparaison;
  } else {
    compareBtn.textContent = 'Annuler';
    document.querySelector('.compare-toggle').onclick = toggleModeComparaison;
  }
}

function afficherComparaison() {
  if (mangasAComparer.length < 2) return;

  const mangasSelectionnes = mangas.filter(m => mangasAComparer.includes(m.id));
  const grid = document.getElementById('comparaisonGrid');

  grid.innerHTML = `
    <table class="comparison-table">
      <thead>
        <tr>
          <th></th>
          ${mangasSelectionnes.map(m => `<th><img src="${m.couverture}" alt="${m.titre}" class="compare-cover"><br>${m.titre}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="compare-label">Auteur</td>
          ${mangasSelectionnes.map(m => `<td>${m.auteur}</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-label">Année</td>
          ${mangasSelectionnes.map(m => `<td>${m.annee}</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-label">Volumes</td>
          ${mangasSelectionnes.map(m => `<td>${m.volumes}</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-label">Statut</td>
          ${mangasSelectionnes.map(m => `<td>${m.statut}</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-label">Genres</td>
          ${mangasSelectionnes.map(m => `<td>${m.genre.join(', ')}</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-label">Note</td>
          ${mangasSelectionnes.map(m => `<td><span class="stars">${'★'.repeat(m.note)}${'☆'.repeat(10 - m.note)}</span> ${m.note}/10</td>`).join('')}
        </tr>
        <tr>
          <td class="compare-label">Résumé</td>
          ${mangasSelectionnes.map(m => `<td class="compare-resume">${m.resume.substring(0, 200)}...</td>`).join('')}
        </tr>
      </tbody>
    </table>
  `;

  const modal = document.getElementById('comparaisonModal');
  modal.classList.remove('closing');
  modal.classList.add('open');
}

function fermerComparaison(event) {
  if (event.target === event.currentTarget) {
    fermerModalAvecAnimation('comparaisonModal', toggleModeComparaison);
  }
}

function fermerComparaisonBtn() {
  fermerModalAvecAnimation('comparaisonModal', toggleModeComparaison);
}

// ===== ACTUALITES / DERNIERES SORTIES =====
function afficherActualites() {
  const carousel = document.getElementById('actualitesCarousel');
  if (!carousel) return;

  // Filtrer les mangas avec des dernières sorties
  const mangasAvecSorties = mangas.filter(m => m.dernierTome);

  if (mangasAvecSorties.length === 0) {
    document.getElementById('actualitesSection').style.display = 'none';
    return;
  }

  // Trier par date de sortie (plus récent en premier)
  mangasAvecSorties.sort((a, b) => {
    const dateA = new Date(a.dernierTome.date);
    const dateB = new Date(b.dernierTome.date);
    return dateB - dateA;
  });

  // Prendre les 6 dernières
  const dernieresSorties = mangasAvecSorties.slice(0, 6);

  carousel.innerHTML = dernieresSorties.map(manga => `
    <div class="actualite-card" onclick="allerVersManga(${manga.id})">
      <img
        src="${manga.couverture}"
        alt="${manga.titre}"
        class="actualite-cover"
        onerror="this.style.display='none'"
      >
      <div class="actualite-info">
        <h3 class="actualite-title">${manga.titre}</h3>
        <p class="actualite-tome">Tome ${manga.dernierTome.numero}</p>
        <p class="actualite-date">${formatDate(manga.dernierTome.date)}</p>
      </div>
    </div>
  `).join('');
}

function formatDate(dateStr) {
  const [year, month] = dateStr.split('-');
  const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${mois[parseInt(month) - 1]} ${year}`;
}

// ===== HISTORIQUE =====
function afficherHistorique() {
  const section = document.getElementById('historiqueSection');
  const carousel = document.getElementById('historiqueCarousel');
  if (!section || !carousel) return;

  const historique = JSON.parse(localStorage.getItem('mangaHistorique') || '[]');

  if (historique.length === 0) {
    section.style.display = 'none';
    return;
  }

  // Récupérer les mangas correspondants
  const mangasHistorique = historique
    .map(id => getMangaById(id))
    .filter(m => m !== undefined);

  if (mangasHistorique.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  carousel.innerHTML = mangasHistorique.map(manga => `
    <div class="historique-card" onclick="allerVersManga(${manga.id})">
      <img
        src="${manga.couverture}"
        alt="${manga.titre}"
        class="historique-cover"
        onerror="this.style.display='none'"
      >
      <div class="historique-info">
        <h3 class="historique-title">${manga.titre}</h3>
        <p class="historique-auteur">${manga.auteur}</p>
      </div>
    </div>
  `).join('');
}

// ===== WIDGET STATS (ACCUEIL) =====
function initStatsWidget() {
  const section = document.getElementById('statsWidgetSection');
  if (!section) return;

  // Mettre à jour les compteurs
  const favoris = getFavoris();
  const aLire = getALire();
  const historique = JSON.parse(localStorage.getItem('mangaHistorique') || '[]');

  // Favoris count
  const favCountEl = document.getElementById('widgetFavCount');
  if (favCountEl) favCountEl.textContent = favoris.length;

  // À lire count
  const aLireCountEl = document.getElementById('widgetALireCount');
  if (aLireCountEl) aLireCountEl.textContent = aLire.length;

  // Dernier vu
  const lastViewedEl = document.getElementById('widgetLastViewedTitle');
  const lastViewedContainer = document.getElementById('widgetLastViewed');
  if (lastViewedEl && historique.length > 0) {
    const lastManga = getMangaById(historique[0]);
    if (lastManga) {
      // Tronquer le titre si trop long
      const maxLen = 12;
      const displayTitle = lastManga.titre.length > maxLen
        ? lastManga.titre.substring(0, maxLen) + '...'
        : lastManga.titre;
      lastViewedEl.textContent = displayTitle;

      // Rendre cliquable
      if (lastViewedContainer) {
        lastViewedContainer.onclick = () => allerVersManga(lastManga.id);
      }
    }
  }

  // Streak (jours consécutifs)
  const streakEl = document.getElementById('widgetStreak');
  if (streakEl) {
    const streak = calculateStreak();
    streakEl.textContent = streak;
  }

  // Enregistrer la visite d'aujourd'hui pour le streak
  recordDailyVisit();
}

// Calcule le streak (jours consécutifs de visite)
function calculateStreak() {
  const visits = JSON.parse(localStorage.getItem('mangaVisitDays') || '[]');
  if (visits.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Vérifier si aujourd'hui est dans la liste
  if (!visits.includes(todayStr)) {
    // Vérifier si hier était le dernier jour
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!visits.includes(yesterdayStr)) {
      return 0; // Streak cassé
    }
  }

  // Compter les jours consécutifs
  let streak = 0;
  const sortedVisits = [...visits].sort().reverse();

  let checkDate = new Date(today);
  for (const visitStr of sortedVisits) {
    const checkStr = checkDate.toISOString().split('T')[0];
    if (visitStr === checkStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (visitStr < checkStr) {
      break;
    }
  }

  return streak;
}

// Enregistre une visite quotidienne
function recordDailyVisit() {
  const visits = JSON.parse(localStorage.getItem('mangaVisitDays') || '[]');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  if (!visits.includes(todayStr)) {
    visits.push(todayStr);
    // Garder seulement les 365 derniers jours
    const recentVisits = visits.slice(-365);
    localStorage.setItem('mangaVisitDays', JSON.stringify(recentVisits));
  }
}

// ===== LANGUE =====
function initLanguage() {
  currentLang = localStorage.getItem('lang') || 'fr';
  applyTranslations();
  updateLangUI();
  updateLangToggleUI();
}

function toggleLangPicker() {
  const picker = document.getElementById('langPicker');
  if (picker) {
    picker.classList.toggle('active');
  }
}

// Fermer le lang picker en cliquant ailleurs
document.addEventListener('click', (e) => {
  const picker = document.getElementById('langPicker');
  const btn = document.getElementById('langPickerBtn');
  if (picker && btn && !picker.contains(e.target) && !btn.contains(e.target)) {
    picker.classList.remove('active');
  }
});

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
  updateLangUI();

  // Mettre à jour le manga du jour avec la nouvelle langue
  afficherMangaDuJour();

  // Fermer le picker
  const picker = document.getElementById('langPicker');
  if (picker) picker.classList.remove('active');

  showToast(lang === 'fr' ? 'Langue changée' : lang === 'en' ? 'Language changed' : lang === 'es' ? 'Idioma cambiado' : '言語を変更しました');
}

function toggleLanguage() {
  const newLang = currentLang === 'fr' ? 'en' : 'fr';
  currentLang = newLang;
  localStorage.setItem('lang', newLang);
  applyTranslations();
  updateLangToggleUI();

  // Réafficher les mangas et le manga du jour avec la nouvelle langue
  afficherMangas(mangas);
  afficherMangaDuJour();

  showToast(newLang === 'fr' ? 'Français activé' : 'English enabled');
}

function updateLangToggleUI() {
  const langIcon = document.getElementById('langIcon');
  if (langIcon) {
    langIcon.textContent = currentLang.toUpperCase();
  }
}

function updateLangUI() {
  // Mettre à jour le drapeau du bouton
  const flagEl = document.getElementById('langFlag');
  if (flagEl) {
    flagEl.textContent = langFlags[currentLang];
  }

  // Mettre à jour les options actives
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === currentLang);
  });
}

function t(key) {
  return translations[currentLang]?.[key] || translations['fr'][key] || key;
}

function applyTranslations() {
  // Éléments avec data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[currentLang]?.[key]) {
      // Garder les emojis si présents
      const emoji = el.textContent.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[★☆📚⚖️]/gu);
      el.textContent = translations[currentLang][key] + (emoji ? ' ' + emoji.join('') : '');
    }
  });

  // Éléments avec data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (translations[currentLang]?.[key]) {
      el.placeholder = translations[currentLang][key];
    }
  });

  // Mettre à jour les éléments spécifiques
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t('searchPlaceholder');

  const selectedGenre = document.getElementById('selectedGenre');
  if (selectedGenre && selectedGenre.textContent.includes('genre')) {
    selectedGenre.textContent = t('allGenres');
  }

  // Titres de sections
  document.querySelectorAll('.section-title').forEach(el => {
    if (el.textContent === 'Dernières sorties' || el.textContent === 'Latest releases' || el.textContent === 'Últimos lanzamientos' || el.textContent === '最新リリース') {
      el.textContent = t('latestReleases');
    }
    if (el.textContent === 'Récemment consultés' || el.textContent === 'Recently viewed' || el.textContent === 'Vistos recientemente' || el.textContent === '最近見た作品') {
      el.textContent = t('recentlyViewed');
    }
    if (el.textContent === 'Bibliothèque' || el.textContent === 'Library' || el.textContent === 'Biblioteca' || el.textContent === 'ライブラリ') {
      el.textContent = t('library');
    }
  });

  // Sous-titre du logo
  const logoSubtitle = document.querySelector('.logo span');
  if (logoSubtitle) {
    logoSubtitle.textContent = t('siteSubtitle');
  }

  // Badge manga du jour
  const mdjBadge = document.querySelector('.mdj-badge');
  if (mdjBadge) {
    mdjBadge.textContent = t('mangaOfDay');
  }
}

// ===== THÈME DE COULEUR =====
function initColorTheme() {
  const savedColor = localStorage.getItem('colorTheme') || 'red';
  setColorTheme(savedColor, false);
}

function toggleThemeStudio() {
  const panel = document.getElementById('themeStudioPanel');
  if (panel) {
    panel.classList.toggle('active');
  }
}

// Fermer le theme studio en cliquant ailleurs
document.addEventListener('click', (e) => {
  const panel = document.getElementById('themeStudioPanel');
  const btn = document.getElementById('themeStudioBtn');
  if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
    panel.classList.remove('active');
  }
});

function setColorTheme(color, save = true) {
  document.documentElement.setAttribute('data-color', color);

  // Mettre à jour les boutons actifs
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.classList.toggle('active', dot.dataset.color === color);
  });

  if (save) {
    localStorage.setItem('colorTheme', color);
    showToast(`Thème ${color} activé`);
  }
}

// ===== MODE D'AFFICHAGE (GRILLE/LISTE) =====
function initViewMode() {
  const savedMode = localStorage.getItem('viewMode') || 'grid';
  setViewMode(savedMode, false);
}

function setViewMode(mode, save = true) {
  const grid = document.getElementById('mangaGrid');
  if (!grid) return;

  // Ajouter la classe de transition
  grid.classList.add('view-changing');

  // Changer la vue apres un court delai pour l'animation
  setTimeout(() => {
    grid.classList.remove('view-list');
    if (mode === 'list') {
      grid.classList.add('view-list');
    }

    // Retirer la classe de transition et reanimer les cartes
    setTimeout(() => {
      grid.classList.remove('view-changing');
      animerCartesStagger();
    }, 50);
  }, 150);

  // Mettre à jour les boutons actifs
  document.getElementById('gridViewBtn')?.classList.toggle('active', mode === 'grid');
  document.getElementById('listViewBtn')?.classList.toggle('active', mode === 'list');

  if (save) {
    localStorage.setItem('viewMode', mode);
  }
}

// ===== TAILLE DES CARTES =====
function initCardSize() {
  const savedSize = localStorage.getItem('cardSize') || 'medium';
  setCardSize(savedSize, false);
}

function setCardSize(size, save = true) {
  const grid = document.getElementById('mangaGrid');
  if (!grid) return;

  grid.classList.remove('size-small', 'size-medium', 'size-large');
  grid.classList.add(`size-${size}`);

  // Mettre à jour les boutons actifs
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });

  if (save) {
    localStorage.setItem('cardSize', size);
  }
}

// ===== MANGA DU JOUR =====
function afficherMangaDuJour() {
  const section = document.getElementById('mangaDuJourSection');
  const content = document.getElementById('mangaDuJourContent');

  if (!section || !content) return;

  // Générer un seed basé sur la date du jour
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // Fonction de random avec seed
  function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Sélectionner le manga du jour
  const index = Math.floor(seededRandom(seed) * mangas.length);
  const manga = mangas[index];

  // Utiliser le résumé traduit si disponible
  const resume = (currentLang === 'en' && manga.resume_en) ? manga.resume_en : manga.resume;

  content.innerHTML = `
    <img src="${manga.couverture}" alt="${manga.titre}" class="mdj-cover"
         onerror="this.style.display='none'">
    <div class="mdj-info">
      <h2 class="mdj-title">${manga.titre}</h2>
      <p class="mdj-author">${t('by')} ${manga.auteur}</p>
      <p class="mdj-resume">${resume}</p>
      <div class="mdj-meta">
        <span>${manga.annee}</span>
        <span>${manga.volumes} ${t('volumes')}</span>
        <span>★ ${manga.note}/10</span>
        <span>${translateGenre(manga.genre[0])}</span>
      </div>
    </div>
  `;

  // Rendre cliquable
  section.onclick = () => allerVersManga(manga.id);
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
  // Supprimer un toast existant
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animation d'entrée
  setTimeout(() => toast.classList.add('show'), 10);

  // Disparition après 2.5s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ===== RACCOURCIS CLAVIER =====
let keyboardFocusIndex = -1;

document.addEventListener('keydown', (e) => {
  // Ignorer si on est dans un champ de saisie
  const isInputFocused = document.activeElement.tagName === 'INPUT' ||
                         document.activeElement.tagName === 'TEXTAREA' ||
                         document.activeElement.tagName === 'SELECT';

  // "/" pour focus sur la recherche
  if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  }

  // "Escape" pour fermer les modals ou quitter le focus clavier
  if (e.key === 'Escape') {
    // D'abord fermer les modals ouvertes
    const modals = ['favoritesModal', 'alireModal', 'comparaisonModal', 'customListsModal', 'addToListModal'];
    let modalClosed = false;
    modals.forEach(id => {
      const modal = document.getElementById(id);
      if (modal && (modal.classList.contains('active') || modal.classList.contains('open'))) {
        modal.classList.remove('active', 'open');
        document.body.style.overflow = '';
        modalClosed = true;
      }
    });

    // Si aucune modal fermée, retirer le focus clavier
    if (!modalClosed && keyboardFocusIndex >= 0) {
      clearKeyboardFocus();
    }

    // Fermer le dropdown des genres
    const dropdown = document.getElementById('genreDropdown');
    if (dropdown) dropdown.classList.remove('open');
  }

  // Ne pas traiter les autres raccourcis si dans un champ de saisie
  if (isInputFocused) return;

  // "G" pour ouvrir/fermer le filtre genres
  if (e.key === 'g' || e.key === 'G') {
    const dropdown = document.getElementById('genreDropdown');
    if (dropdown) {
      e.preventDefault();
      dropdown.classList.toggle('open');
      showKeyboardHint('G');
    }
  }

  // Flèches pour naviguer entre les cartes
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    const grid = document.getElementById('mangaGrid');
    if (grid && grid.offsetParent !== null) {
      e.preventDefault();
      naviguerCartes(e.key);
    }
  }

  // "Enter" pour ouvrir la carte sélectionnée
  if (e.key === 'Enter' && keyboardFocusIndex >= 0) {
    e.preventDefault();
    ouvrirCarteFocus();
  }

  // "F" pour ajouter aux favoris la carte sélectionnée
  if ((e.key === 'f' || e.key === 'F') && keyboardFocusIndex >= 0) {
    e.preventDefault();
    const cards = document.querySelectorAll('#mangaGrid .manga-card');
    if (cards[keyboardFocusIndex]) {
      const mangaId = parseInt(cards[keyboardFocusIndex].dataset.id);
      if (mangaId) {
        toggleFavori(mangaId);
        showKeyboardHint('★');
      }
    }
  }
});

// Navigation entre les cartes avec les flèches
function naviguerCartes(direction) {
  const grid = document.getElementById('mangaGrid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.manga-card'));
  if (cards.length === 0) return;

  // Calculer le nombre de colonnes
  const gridStyle = window.getComputedStyle(grid);
  const gridColumns = gridStyle.gridTemplateColumns.split(' ').length;

  // Retirer le focus actuel
  cards.forEach(card => card.classList.remove('keyboard-focus'));

  // Calculer le nouvel index
  let newIndex = keyboardFocusIndex;

  switch (direction) {
    case 'ArrowRight':
      newIndex = keyboardFocusIndex < 0 ? 0 : Math.min(keyboardFocusIndex + 1, cards.length - 1);
      break;
    case 'ArrowLeft':
      newIndex = keyboardFocusIndex < 0 ? 0 : Math.max(keyboardFocusIndex - 1, 0);
      break;
    case 'ArrowDown':
      if (keyboardFocusIndex < 0) {
        newIndex = 0;
      } else {
        newIndex = Math.min(keyboardFocusIndex + gridColumns, cards.length - 1);
      }
      break;
    case 'ArrowUp':
      if (keyboardFocusIndex < 0) {
        newIndex = 0;
      } else {
        newIndex = Math.max(keyboardFocusIndex - gridColumns, 0);
      }
      break;
  }

  keyboardFocusIndex = newIndex;

  // Appliquer le nouveau focus
  if (cards[keyboardFocusIndex]) {
    cards[keyboardFocusIndex].classList.add('keyboard-focus');
    cards[keyboardFocusIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Ouvre la carte actuellement focus
function ouvrirCarteFocus() {
  const cards = document.querySelectorAll('#mangaGrid .manga-card');
  if (cards[keyboardFocusIndex]) {
    const mangaId = cards[keyboardFocusIndex].dataset.id;
    if (mangaId) {
      allerVersManga(mangaId);
    }
  }
}

// Retirer le focus clavier
function clearKeyboardFocus() {
  keyboardFocusIndex = -1;
  document.querySelectorAll('.manga-card.keyboard-focus').forEach(card => {
    card.classList.remove('keyboard-focus');
  });
}

// Affiche un indicateur visuel du raccourci
function showKeyboardHint(key) {
  // Supprimer un hint existant
  const existingHint = document.querySelector('.keyboard-hint');
  if (existingHint) existingHint.remove();

  const hint = document.createElement('div');
  hint.className = 'keyboard-hint';
  hint.innerHTML = `<span class="keyboard-hint-key">${key}</span>`;
  document.body.appendChild(hint);

  // Animation d'entrée
  setTimeout(() => hint.classList.add('show'), 10);

  // Disparition après 600ms
  setTimeout(() => {
    hint.classList.remove('show');
    setTimeout(() => hint.remove(), 300);
  }, 600);
}

// ===== LAZY LOADING DES IMAGES =====
function initLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    }, { rootMargin: '50px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// ===== PRÉCHARGEMENT AU SURVOL =====
function preloadImage(url) {
  const img = new Image();
  img.src = url;
}

document.addEventListener('mouseover', (e) => {
  const card = e.target.closest('.manga-card, .actualite-card, .historique-card');
  if (card) {
    const img = card.querySelector('img');
    if (img && img.dataset.src) {
      preloadImage(img.dataset.src);
    }
  }
});

// ===== ANIMATIONS =====
// Initialise toutes les animations au chargement
function initAnimations() {
  // Animation du contenu principal - rendre visible immédiatement
  const main = document.querySelector('main');
  if (main) {
    main.classList.add('loaded');
  }

  // Rendre toutes les sections visibles immédiatement
  const sectionsToAnimate = document.querySelectorAll('.actualites, .historique, .content-with-sidebar, .classements, .recommendations-hero');
  sectionsToAnimate.forEach(section => {
    section.classList.add('visible');
  });

  // Animer les cartes initiales
  animerCartesStagger();
}

// Anime les cartes manga avec un effet stagger (une apres l'autre)
function animerCartesStagger() {
  const cards = document.querySelectorAll('.manga-card:not(.visible)');

  if (cards.length === 0) return;

  // Utiliser IntersectionObserver pour animer seulement les cartes visibles
  if ('IntersectionObserver' in window) {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const index = parseInt(card.dataset.index) || 0;
          // Limiter le delai max a 500ms pour les performances
          const delay = Math.min(index * 30, 300);

          setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
            card.classList.add('visible');
          }, delay);

          cardObserver.unobserve(card);
        }
      });
    }, { threshold: 0.1, rootMargin: '100px' });

    cards.forEach(card => {
      cardObserver.observe(card);
    });
  } else {
    // Fallback: animer toutes les cartes avec stagger
    cards.forEach((card, index) => {
      const delay = Math.min(index * 30, 300);
      setTimeout(() => {
        card.classList.add('visible');
      }, delay);
    });
  }
}

// Ferme une modale avec animation
function fermerModalAvecAnimation(modalId, callback = null) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  // Ajouter la classe de fermeture pour l'animation
  modal.classList.add('closing');
  modal.classList.remove('open');

  // Attendre la fin de l'animation avant de nettoyer
  setTimeout(() => {
    modal.classList.remove('closing');
    if (callback && typeof callback === 'function') {
      callback();
    }
  }, 300);
}

// ===== PULL TO REFRESH (Mobile) =====
let pullStartY = 0;
let pullDistance = 0;
let isPulling = false;
const PULL_THRESHOLD = 100;

function initPullToRefresh() {
  // Seulement sur mobile
  if (!('ontouchstart' in window)) return;

  const body = document.body;
  const indicator = document.getElementById('pullIndicator');
  if (!indicator) return;

  body.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      pullStartY = e.touches[0].clientY;
      isPulling = true;
    }
  }, { passive: true });

  body.addEventListener('touchmove', (e) => {
    if (!isPulling || window.scrollY > 0) return;

    pullDistance = e.touches[0].clientY - pullStartY;

    if (pullDistance > 0 && pullDistance < PULL_THRESHOLD * 2) {
      indicator.classList.add('visible');

      if (pullDistance >= PULL_THRESHOLD) {
        indicator.classList.add('ready');
      } else {
        indicator.classList.remove('ready');
      }
    }
  }, { passive: true });

  body.addEventListener('touchend', () => {
    if (pullDistance >= PULL_THRESHOLD) {
      indicator.classList.remove('ready');
      indicator.classList.add('refreshing');

      // Simuler un rafraîchissement
      setTimeout(() => {
        indicator.classList.remove('refreshing', 'visible');
        // Rafraîchir les données
        afficherMangas(mangasFiltres);
        afficherHistorique();
        afficherActualites();
        showToast('Page actualisée');
      }, 1000);
    } else {
      indicator.classList.remove('visible', 'ready');
    }

    pullDistance = 0;
    isPulling = false;
  });
}

// ===== SWIPE GESTURES (Mobile) =====
let swipeStartX = 0;
let swipeStartY = 0;
const SWIPE_THRESHOLD = 100;

function initSwipeGestures() {
  // Seulement sur mobile et page manga
  if (!('ontouchstart' in window)) return;

  const body = document.body;
  const leftHint = document.getElementById('swipeLeft');
  const rightHint = document.getElementById('swipeRight');

  if (!leftHint || !rightHint) return;

  body.addEventListener('touchstart', (e) => {
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
  }, { passive: true });

  body.addEventListener('touchmove', (e) => {
    const diffX = e.touches[0].clientX - swipeStartX;
    const diffY = Math.abs(e.touches[0].clientY - swipeStartY);

    // Ignorer si mouvement vertical trop important
    if (diffY > 50) return;

    if (diffX > 50) {
      leftHint.classList.add('visible');
      rightHint.classList.remove('visible');
    } else if (diffX < -50) {
      rightHint.classList.add('visible');
      leftHint.classList.remove('visible');
    }
  }, { passive: true });

  body.addEventListener('touchend', (e) => {
    leftHint.classList.remove('visible');
    rightHint.classList.remove('visible');

    const diffX = e.changedTouches[0].clientX - swipeStartX;
    const diffY = Math.abs(e.changedTouches[0].clientY - swipeStartY);

    // Ignorer si mouvement vertical trop important
    if (diffY > 100) return;

    if (Math.abs(diffX) >= SWIPE_THRESHOLD) {
      // Swipe détecté - navigation dans historique
      if (diffX > 0) {
        // Swipe vers la droite - retour
        window.history.back();
      } else {
        // Swipe vers la gauche - avancer
        window.history.forward();
      }
    }
  });
}

// ===== SELECTEUR DE POLICE =====
function initFont() {
  const savedFont = localStorage.getItem('font') || 'system';
  setFont(savedFont, false);
}

function toggleFontPicker() {
  const picker = document.getElementById('fontPicker');
  if (picker) {
    picker.classList.toggle('active');
    // Fermer les autres pickers
    document.getElementById('colorPicker')?.classList.remove('active');
    document.getElementById('langPicker')?.classList.remove('active');
    document.getElementById('customThemePanel')?.classList.remove('active');
  }
}

// Fermer le font picker en cliquant ailleurs
document.addEventListener('click', (e) => {
  const picker = document.getElementById('fontPicker');
  const btn = document.getElementById('fontPickerBtn');
  if (picker && btn && !picker.contains(e.target) && !btn.contains(e.target)) {
    picker.classList.remove('active');
  }
});

function setFont(font, save = true) {
  document.documentElement.setAttribute('data-font', font);

  // Mettre à jour les options actives
  document.querySelectorAll('.font-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.font === font);
  });

  // Fermer le picker
  const picker = document.getElementById('fontPicker');
  if (picker) picker.classList.remove('active');

  if (save) {
    localStorage.setItem('font', font);
    showToast('Police changée');
  }
}

// ===== THEME PERSONNALISE =====

function syncColorInput(inputId) {
  const textInput = document.getElementById(inputId + 'Text');
  const colorInput = document.getElementById(inputId);
  if (textInput && colorInput) {
    const value = textInput.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      colorInput.value = value;
    }
  }
}

function updateCustomTheme() {
  const accentInput = document.getElementById('customAccent');
  const bgInput = document.getElementById('customBg');
  const accentText = document.getElementById('customAccentText');
  const bgText = document.getElementById('customBgText');

  if (accentInput && accentText) {
    accentText.value = accentInput.value;
  }
  if (bgInput && bgText) {
    bgText.value = bgInput.value;
  }
}

function applyCustomTheme() {
  const accentColor = document.getElementById('customAccent')?.value || '#e63946';
  const bgColor = document.getElementById('customBg')?.value || '#121212';

  // Appliquer les couleurs personnalisées
  document.documentElement.style.setProperty('--accent', accentColor);
  document.documentElement.style.setProperty('--accent-light', accentColor + '20');
  document.documentElement.style.setProperty('--accent-glow', accentColor + '40');
  document.documentElement.style.setProperty('--bg-primary', bgColor);

  // Calculer les variations de bg
  const bgLighter = lightenColor(bgColor, 10);
  document.documentElement.style.setProperty('--bg-secondary', bgLighter);
  document.documentElement.style.setProperty('--bg-card', bgLighter);

  // Sauvegarder
  localStorage.setItem('customTheme', JSON.stringify({ accent: accentColor, bg: bgColor }));
  document.documentElement.setAttribute('data-color', 'custom');

  // Fermer le panel
  document.getElementById('themeStudioPanel')?.classList.remove('active');

  showToast('Thème personnalisé appliqué');
}

function resetCustomTheme() {
  localStorage.removeItem('customTheme');
  document.documentElement.style.removeProperty('--accent');
  document.documentElement.style.removeProperty('--accent-light');
  document.documentElement.style.removeProperty('--accent-glow');
  document.documentElement.style.removeProperty('--bg-primary');
  document.documentElement.style.removeProperty('--bg-secondary');
  document.documentElement.style.removeProperty('--bg-card');

  // Réappliquer le thème de couleur par défaut
  const savedColor = localStorage.getItem('colorTheme') || 'red';
  setColorTheme(savedColor);

  document.getElementById('themeStudioPanel')?.classList.remove('active');
  showToast('Thème réinitialisé');
}

function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function loadCustomTheme() {
  const saved = localStorage.getItem('customTheme');
  if (saved) {
    try {
      const theme = JSON.parse(saved);
      const accentInput = document.getElementById('customAccent');
      const accentText = document.getElementById('customAccentText');
      const bgInput = document.getElementById('customBg');
      const bgText = document.getElementById('customBgText');

      if (accentInput) accentInput.value = theme.accent;
      if (accentText) accentText.value = theme.accent;
      if (bgInput) bgInput.value = theme.bg;
      if (bgText) bgText.value = theme.bg;

      if (localStorage.getItem('colorTheme') === 'custom') {
        applyCustomTheme();
      }
    } catch (e) {
      console.warn('Erreur chargement thème personnalisé:', e);
    }
  }
}

// ===== CLASSEMENTS =====
function afficherClassement(category = 'all') {
  const grid = document.getElementById('classementGrid');
  const tabs = document.querySelectorAll('.classement-tab');

  if (!grid) return;

  // Mettre à jour l'onglet actif
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.category === category);
  });

  let mangasTries = [...mangas];

  // Filtrer selon la catégorie
  switch (category) {
    case 'shonen':
      mangasTries = mangasTries.filter(m => m.genre.some(g => g.toLowerCase() === 'shonen' || g.toLowerCase() === 'shōnen'));
      break;
    case 'seinen':
      mangasTries = mangasTries.filter(m => m.genre.some(g => g.toLowerCase() === 'seinen'));
      break;
    case 'shojo':
      mangasTries = mangasTries.filter(m => m.genre.some(g => g.toLowerCase() === 'shojo' || g.toLowerCase() === 'shōjo'));
      break;
    case 'action':
      mangasTries = mangasTries.filter(m => m.genre.some(g => g.toLowerCase() === 'action'));
      break;
    case 'recent':
      mangasTries = mangasTries.sort((a, b) => b.annee - a.annee);
      break;
    default:
      // Tri par note par défaut
      break;
  }

  // Trier par note (sauf pour recent)
  if (category !== 'recent') {
    mangasTries.sort((a, b) => b.note - a.note);
  }

  // Prendre le top 6
  const top6 = mangasTries.slice(0, 6);

  grid.innerHTML = top6.map((manga, index) => {
    const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
    return `
      <div class="classement-card" onclick="allerVersManga(${manga.id})">
        <div class="classement-rank ${rankClass}">${index + 1}</div>
        <img src="${manga.couverture}" alt="${manga.titre}" class="classement-cover"
             onerror="this.style.display='none'">
        <div class="classement-info">
          <div class="classement-title">${manga.titre}</div>
          <div class="classement-meta">${manga.auteur} · ${manga.annee}</div>
          <div class="classement-note">★ ${manga.note}/10</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== RECOMMANDATIONS AMELIOREES =====
function initRecommandations() {
  const select = document.getElementById('recoSelect');
  if (!select) return;

  // Remplir le select avec tous les mangas
  mangas.forEach(manga => {
    const option = document.createElement('option');
    option.value = manga.id;
    option.textContent = manga.titre;
    select.appendChild(option);
  });
}

function genererRecommandations() {
  const select = document.getElementById('recoSelect');
  const result = document.getElementById('recoResult');

  if (!select || !result) return;

  const mangaId = parseInt(select.value);
  if (!mangaId) {
    showToast('Sélectionne d\'abord un manga', 'error');
    return;
  }

  const mangaSource = getMangaById(mangaId);
  if (!mangaSource) return;

  // Trouver les mangas similaires
  const recommandations = mangas
    .filter(m => m.id !== mangaId)
    .map(m => {
      let score = 0;

      // Points pour les genres en commun
      const genresCommuns = m.genre.filter(g => mangaSource.genre.includes(g));
      score += genresCommuns.length * 3;

      // Points si même auteur
      if (m.auteur === mangaSource.auteur) score += 5;

      // Points si note similaire
      if (Math.abs(m.note - mangaSource.note) <= 1) score += 2;

      // Points si même période
      if (Math.abs(m.annee - mangaSource.annee) <= 5) score += 1;

      // Points si même univers
      if (m.univers && m.univers === mangaSource.univers) score += 10;

      return { ...m, score, genresCommuns };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (recommandations.length === 0) {
    result.innerHTML = '<p class="no-data">🔍 Aucune recommandation trouvée pour ce manga.</p>';
    result.style.display = 'block';
    return;
  }

  result.innerHTML = `
    <h3>
      Si tu aimes <span class="reco-source-badge">📖 ${mangaSource.titre}</span> tu aimeras :
    </h3>
    <div class="reco-grid">
      ${recommandations.map((rec, index) => `
        <div class="manga-card" onclick="allerVersManga(${rec.id})" style="animation-delay: ${index * 0.1}s">
          <img src="${rec.couverture}" alt="${rec.titre}" class="manga-cover"
               onerror="this.style.display='none'">
          <div class="manga-info">
            <h3 class="manga-title">${rec.titre}</h3>
            <p class="manga-author">${rec.auteur}</p>
            <div class="manga-genres">
              ${rec.genresCommuns.slice(0, 2).map(g => `<span class="genre-tag">${g}</span>`).join('')}
            </div>
            <div class="manga-rating">
              <span class="stars">${'★'.repeat(Math.round(rec.note/2))}${'☆'.repeat(5 - Math.round(rec.note/2))}</span>
              <span>${rec.note}/10</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  result.style.display = 'block';

  // Scroll vers les résultats
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== QUIZ DÉCOUVERTE =====
let quizAnswers = {
  mood: null,
  type: null,
  length: null
};
let currentQuizStep = 1;
const totalQuizSteps = 3;

// Mapping des humeurs vers les genres
const moodToGenres = {
  action: ['Action', 'Aventure', 'Arts martiaux', 'Sport'],
  emotion: ['Drame', 'Romance', 'Tranche de vie', 'Psychologique'],
  laugh: ['Comédie', 'Parodie', 'Tranche de vie'],
  think: ['Psychologique', 'Thriller', 'Mystère', 'Seinen', 'Philosophique'],
  escape: ['Fantasy', 'Science-fiction', 'Aventure', 'Isekai', 'Surnaturel'],
  thrill: ['Horreur', 'Thriller', 'Mystère', 'Dark Fantasy', 'Survival']
};

function selectQuizOption(button) {
  const step = button.closest('.quiz-step');
  const options = step.querySelectorAll('.quiz-option');

  // Retirer la sélection précédente
  options.forEach(opt => opt.classList.remove('selected'));

  // Sélectionner cette option
  button.classList.add('selected');

  // Sauvegarder la réponse
  const value = button.dataset.value;
  if (currentQuizStep === 1) {
    quizAnswers.mood = value;
  } else if (currentQuizStep === 2) {
    quizAnswers.type = value;
  } else if (currentQuizStep === 3) {
    quizAnswers.length = value;
  }

  // Passer à l'étape suivante après un court délai
  setTimeout(() => {
    if (currentQuizStep < totalQuizSteps) {
      nextQuizStep();
    } else {
      showQuizResults();
    }
  }, 300);
}

function nextQuizStep() {
  if (currentQuizStep >= totalQuizSteps) return;

  const currentStep = document.querySelector(`.quiz-step[data-step="${currentQuizStep}"]`);
  const nextStep = document.querySelector(`.quiz-step[data-step="${currentQuizStep + 1}"]`);

  if (currentStep && nextStep) {
    currentStep.classList.remove('active');
    nextStep.classList.add('active');
    currentQuizStep++;
    updateQuizProgress();
  }
}

function prevQuizStep() {
  if (currentQuizStep <= 1) return;

  const currentStep = document.querySelector(`.quiz-step[data-step="${currentQuizStep}"]`);
  const prevStep = document.querySelector(`.quiz-step[data-step="${currentQuizStep - 1}"]`);

  if (currentStep && prevStep) {
    currentStep.classList.remove('active');
    prevStep.classList.add('active');
    currentQuizStep--;
    updateQuizProgress();
  }
}

function updateQuizProgress() {
  const progressBar = document.getElementById('quizProgressBar');
  const progressText = document.getElementById('quizProgressText');
  const prevBtn = document.getElementById('quizPrevBtn');

  const progress = (currentQuizStep / totalQuizSteps) * 100;

  if (progressBar) {
    progressBar.style.setProperty('--progress', `${progress}%`);
  }
  if (progressText) {
    progressText.textContent = `${currentQuizStep}/${totalQuizSteps}`;
  }
  if (prevBtn) {
    prevBtn.style.display = currentQuizStep > 1 ? 'block' : 'none';
  }
}

function showQuizResults() {
  const container = document.getElementById('quizContainer');
  const result = document.getElementById('quizResult');
  const resultGrid = document.getElementById('quizResultGrid');
  const restartBtn = document.getElementById('quizRestartBtn');
  const prevBtn = document.getElementById('quizPrevBtn');
  const progressBar = document.querySelector('.quiz-progress');

  // Cacher le quiz et afficher les résultats
  if (container) container.style.display = 'none';
  if (progressBar) progressBar.style.display = 'none';
  if (prevBtn) prevBtn.style.display = 'none';
  if (restartBtn) restartBtn.style.display = 'inline-flex';

  // Trouver les mangas correspondants
  const matches = findQuizMatches();

  if (matches.length === 0) {
    resultGrid.innerHTML = '<p class="no-data">Aucun manga ne correspond à tes critères. Essaie d\'autres réponses !</p>';
  } else {
    resultGrid.innerHTML = matches.slice(0, 3).map((match, index) => `
      <div class="manga-card" onclick="allerVersManga(${match.manga.id})" style="position: relative;">
        <span class="quiz-match-score">${match.score}% match</span>
        <img src="${match.manga.couverture}" alt="${match.manga.titre}" class="manga-cover"
             onerror="this.style.display='none'">
        <div class="manga-info">
          <h3 class="manga-title">${match.manga.titre}</h3>
          <p class="manga-author">${match.manga.auteur}</p>
          <div class="manga-genres">
            ${match.manga.genre.slice(0, 2).map(g => `<span class="genre-tag">${g}</span>`).join('')}
          </div>
          <div class="manga-rating">
            <span class="stars">${'★'.repeat(Math.round(match.manga.note/2))}${'☆'.repeat(5 - Math.round(match.manga.note/2))}</span>
            <span>${match.manga.note}/10</span>
          </div>
          <p class="manga-volumes">${match.manga.volumes} tomes • ${match.manga.statut}</p>
        </div>
      </div>
    `).join('');
  }

  if (result) {
    result.style.display = 'block';
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function findQuizMatches() {
  const results = mangas.map(manga => {
    let score = 0;
    let maxScore = 0;

    // Score pour l'humeur (genres correspondants)
    if (quizAnswers.mood && moodToGenres[quizAnswers.mood]) {
      maxScore += 40;
      const targetGenres = moodToGenres[quizAnswers.mood];
      const matchingGenres = manga.genre.filter(g => targetGenres.includes(g));
      score += matchingGenres.length * 15;
      if (matchingGenres.length > 0) score += 10; // Bonus si au moins un match
    }

    // Score pour le type de manga
    if (quizAnswers.type && quizAnswers.type !== 'any') {
      maxScore += 30;
      const typeMapping = {
        shonen: 'Shonen',
        seinen: 'Seinen',
        shojo: 'Shojo'
      };
      if (manga.genre.includes(typeMapping[quizAnswers.type])) {
        score += 30;
      }
    } else if (quizAnswers.type === 'any') {
      maxScore += 30;
      score += 15; // Score neutre
    }

    // Score pour la durée
    if (quizAnswers.length && quizAnswers.length !== 'any') {
      maxScore += 30;
      const volumes = manga.volumes;
      if (quizAnswers.length === 'short' && volumes < 10) {
        score += 30;
      } else if (quizAnswers.length === 'medium' && volumes >= 10 && volumes <= 30) {
        score += 30;
      } else if (quizAnswers.length === 'long' && volumes > 30) {
        score += 30;
      }
    } else if (quizAnswers.length === 'any') {
      maxScore += 30;
      score += 15; // Score neutre
    }

    // Bonus pour les mangas bien notés
    score += manga.note * 2;
    maxScore += 20;

    // Calculer le pourcentage
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return {
      manga,
      score: Math.min(percentage, 100)
    };
  });

  // Filtrer et trier
  return results
    .filter(r => r.score >= 40)
    .sort((a, b) => b.score - a.score);
}

function restartQuiz() {
  // Réinitialiser les réponses
  quizAnswers = { mood: null, type: null, length: null };
  currentQuizStep = 1;

  // Réinitialiser l'affichage
  const container = document.getElementById('quizContainer');
  const result = document.getElementById('quizResult');
  const restartBtn = document.getElementById('quizRestartBtn');
  const prevBtn = document.getElementById('quizPrevBtn');
  const progressBar = document.querySelector('.quiz-progress');
  const steps = document.querySelectorAll('.quiz-step');
  const options = document.querySelectorAll('.quiz-option');

  if (container) container.style.display = 'block';
  if (result) result.style.display = 'none';
  if (restartBtn) restartBtn.style.display = 'none';
  if (prevBtn) prevBtn.style.display = 'none';
  if (progressBar) progressBar.style.display = 'flex';

  // Réinitialiser les étapes
  steps.forEach((step, index) => {
    step.classList.toggle('active', index === 0);
  });

  // Réinitialiser les sélections
  options.forEach(opt => opt.classList.remove('selected'));

  updateQuizProgress();
}

// ===== MODE HORS-LIGNE AMELIORE =====
function downloadMangaForOffline(mangaId) {
  const manga = getMangaById(mangaId);
  if (!manga) return;

  const progressDiv = document.getElementById('downloadProgress');
  const progressFill = document.getElementById('downloadFill');
  const progressText = document.getElementById('downloadText');

  if (!progressDiv || !progressFill || !progressText) return;

  progressDiv.classList.add('active');
  progressText.textContent = `Téléchargement de ${manga.titre}...`;

  // Simuler le téléchargement
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    progressFill.style.width = progress + '%';

    if (progress >= 100) {
      clearInterval(interval);

      // Sauvegarder dans localStorage
      const offlineMangas = JSON.parse(localStorage.getItem('offlineMangas') || '[]');
      if (!offlineMangas.includes(mangaId)) {
        offlineMangas.push(mangaId);
        localStorage.setItem('offlineMangas', JSON.stringify(offlineMangas));
      }

      // Sauvegarder les données du manga
      const mangaData = JSON.parse(localStorage.getItem('offlineMangaData') || '{}');
      mangaData[mangaId] = manga;
      localStorage.setItem('offlineMangaData', JSON.stringify(mangaData));

      progressText.textContent = 'Téléchargement terminé !';

      setTimeout(() => {
        progressDiv.classList.remove('active');
        showToast(`${manga.titre} disponible hors-ligne`);
      }, 1000);
    }
  }, 100);
}

function isOfflineAvailable(mangaId) {
  const offlineMangas = JSON.parse(localStorage.getItem('offlineMangas') || '[]');
  return offlineMangas.includes(mangaId);
}

// ===== PAGE TRANSITIONS =====
function initPageTransitions() {
  // Ajouter l'animation d'entrée au chargement
  const main = document.querySelector('main');
  if (main) {
    const direction = sessionStorage.getItem('pageDirection') || 'forward';
    main.classList.add(direction === 'back' ? 'page-transition-in-reverse' : 'page-transition-in');
    sessionStorage.removeItem('pageDirection');
  }

  // Intercepter les clics sur les liens internes
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;

    e.preventDefault();

    const main = document.querySelector('main');
    if (main) {
      main.classList.remove('page-transition-in', 'page-transition-in-reverse');
      main.classList.add('page-transition-out');

      setTimeout(() => {
        sessionStorage.setItem('pageDirection', 'forward');
        window.location.href = href;
      }, 250);
    } else {
      window.location.href = href;
    }
  });
}

function allerVersMangaAvecTransition(id, direction = 'forward') {
  const main = document.querySelector('main');
  if (main) {
    main.classList.remove('page-transition-in', 'page-transition-in-reverse');
    main.classList.add('page-transition-out');

    setTimeout(() => {
      sessionStorage.setItem('pageDirection', direction);
      window.location.href = `manga.html?id=${id}`;
    }, 250);
  } else {
    window.location.href = `manga.html?id=${id}`;
  }
}

// ===== KEYBOARD SHORTCUTS =====
const keyboardShortcuts = {
  '/': { action: () => document.getElementById('searchInput')?.focus(), desc: 'Rechercher' },
  'r': { action: () => mangaAleatoire(), desc: 'Aléatoire', pages: ['index'] },
  'f': { action: () => toggleFavoriRaccourci(), desc: 'Favori', pages: ['manga'] },
  'l': { action: () => toggleALireRaccourci(), desc: 'À lire', pages: ['manga'] },
  'ArrowLeft': { action: () => naviguerManga('prev'), desc: '←', pages: ['manga'] },
  'ArrowRight': { action: () => naviguerManga('next'), desc: '→', pages: ['manga'] },
  '?': { action: () => toggleShortcutsHelp(), desc: 'Aide' },
  'Escape': { action: () => fermerTout(), desc: 'Fermer' }
};

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignorer si on tape dans un input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }

    const shortcut = keyboardShortcuts[e.key];
    if (!shortcut) return;

    // Vérifier si le raccourci est disponible sur cette page
    const currentPage = window.location.pathname.includes('manga.html') ? 'manga' :
                        window.location.pathname.includes('stats.html') ? 'stats' : 'index';

    if (shortcut.pages && !shortcut.pages.includes(currentPage)) return;

    e.preventDefault();
    shortcut.action();
  });
}

function toggleFavoriRaccourci() {
  const urlParams = new URLSearchParams(window.location.search);
  const mangaId = parseInt(urlParams.get('id'));
  if (mangaId && typeof toggleFavoriBtn === 'function') {
    toggleFavoriBtn(mangaId);
  }
}

function toggleALireRaccourci() {
  const urlParams = new URLSearchParams(window.location.search);
  const mangaId = parseInt(urlParams.get('id'));
  if (mangaId && typeof toggleALireBtn === 'function') {
    toggleALireBtn(mangaId);
  }
}

function naviguerManga(direction) {
  const urlParams = new URLSearchParams(window.location.search);
  const currentId = parseInt(urlParams.get('id'));
  if (!currentId) return;

  const currentIndex = mangas.findIndex(m => m.id === currentId);
  if (currentIndex === -1) return;

  let newIndex;
  if (direction === 'prev') {
    newIndex = currentIndex > 0 ? currentIndex - 1 : mangas.length - 1;
  } else {
    newIndex = currentIndex < mangas.length - 1 ? currentIndex + 1 : 0;
  }

  allerVersMangaAvecTransition(mangas[newIndex].id, direction === 'prev' ? 'back' : 'forward');
}

let shortcutsHelpVisible = false;
function toggleShortcutsHelp() {
  let toast = document.querySelector('.shortcuts-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'shortcuts-toast';

    const currentPage = window.location.pathname.includes('manga.html') ? 'manga' : 'index';
    const shortcuts = [
      { key: '/', desc: 'Rechercher' },
      { key: '?', desc: 'Aide' },
      { key: 'Esc', desc: 'Fermer' }
    ];

    if (currentPage === 'index') {
      shortcuts.push({ key: 'R', desc: 'Aléatoire' });
    } else if (currentPage === 'manga') {
      shortcuts.push({ key: 'F', desc: 'Favori' });
      shortcuts.push({ key: 'L', desc: 'À lire' });
      shortcuts.push({ key: '←/→', desc: 'Naviguer' });
    }

    toast.innerHTML = shortcuts.map(s => `
      <div class="shortcut-item">
        <span class="shortcut-key">${s.key}</span>
        <span>${s.desc}</span>
      </div>
    `).join('');

    document.body.appendChild(toast);
  }

  shortcutsHelpVisible = !shortcutsHelpVisible;
  toast.classList.toggle('show', shortcutsHelpVisible);

  if (shortcutsHelpVisible) {
    setTimeout(() => {
      toast.classList.remove('show');
      shortcutsHelpVisible = false;
    }, 4000);
  }
}

function fermerTout() {
  // Fermer les modales
  document.getElementById('favoritesModal')?.classList.remove('active');
  document.getElementById('alireModal')?.classList.remove('active');
  document.getElementById('comparaisonModal')?.classList.remove('active');
  document.getElementById('themeStudioPanel')?.classList.remove('active');

  // Fermer l'aide raccourcis
  document.querySelector('.shortcuts-toast')?.classList.remove('show');
  shortcutsHelpVisible = false;
}

// ===== BADGES SYSTEM =====
const badgeDefinitions = [
  { id: 'first_favorite', icon: '⭐', condition: () => getFavoris().length >= 1 },
  { id: 'collector_10', icon: '📚', condition: () => getFavoris().length >= 10 },
  { id: 'collector_25', icon: '🏆', condition: () => getFavoris().length >= 25 },
  { id: 'first_rating', icon: '✍️', condition: () => Object.keys(JSON.parse(localStorage.getItem('mangaUserRatings') || '{}')).length >= 1 },
  { id: 'critic_10', icon: '🎯', condition: () => Object.keys(JSON.parse(localStorage.getItem('mangaUserRatings') || '{}')).length >= 10 },
  { id: 'critic_25', icon: '🎭', condition: () => Object.keys(JSON.parse(localStorage.getItem('mangaUserRatings') || '{}')).length >= 25 },
  { id: 'reader_list', icon: '📖', condition: () => getALire().length >= 5 },
  { id: 'explorer_20', icon: '🔍', condition: () => JSON.parse(localStorage.getItem('totalViewed') || '0') >= 20 },
  { id: 'explorer_50', icon: '🗺️', condition: () => JSON.parse(localStorage.getItem('totalViewed') || '0') >= 50 },
  { id: 'streak_3', icon: '🔥', condition: () => parseInt(localStorage.getItem('visitStreak') || '0') >= 3 },
  { id: 'streak_7', icon: '💪', condition: () => parseInt(localStorage.getItem('visitStreak') || '0') >= 7 },
  { id: 'streak_30', icon: '👑', condition: () => parseInt(localStorage.getItem('visitStreak') || '0') >= 30 },
  { id: 'night_owl', icon: '🦉', condition: () => { const h = new Date().getHours(); return h >= 0 && h < 5; } },
  { id: 'perfectionist', icon: '💯', condition: () => Object.values(JSON.parse(localStorage.getItem('mangaUserRatings') || '{}')).some(r => r === 10) },
  { id: 'theme_changer', icon: '🎨', condition: () => localStorage.getItem('badgeTrigger_theme') === 'true' }
];

const badgeTranslations = {
  fr: {
    badgesTitle: 'Mes Badges',
    badgeUnlocked: 'Badge débloqué !',
    unlockedOn: 'Débloqué le',
    badges: {
      first_favorite: { name: 'Premier coup de coeur', desc: 'Ajouter un premier favori' },
      collector_10: { name: 'Collectionneur', desc: 'Avoir 10 favoris' },
      collector_25: { name: 'Grand collectionneur', desc: 'Avoir 25 favoris' },
      first_rating: { name: 'Critique débutant', desc: 'Noter un premier manga' },
      critic_10: { name: 'Critique averti', desc: 'Noter 10 mangas' },
      critic_25: { name: 'Critique expert', desc: 'Noter 25 mangas' },
      reader_list: { name: 'Liste de lecture', desc: 'Ajouter 5 mangas à lire' },
      explorer_20: { name: 'Explorateur', desc: 'Consulter 20 mangas' },
      explorer_50: { name: 'Grand explorateur', desc: 'Consulter 50 mangas' },
      streak_3: { name: 'En forme', desc: '3 jours consécutifs' },
      streak_7: { name: 'Assidu', desc: '7 jours consécutifs' },
      streak_30: { name: 'Légendaire', desc: '30 jours consécutifs' },
      night_owl: { name: 'Oiseau de nuit', desc: 'Visiter entre minuit et 5h' },
      perfectionist: { name: 'Perfectionniste', desc: 'Donner une note de 10/10' },
      theme_changer: { name: 'Styliste', desc: 'Changer la couleur du thème' }
    }
  },
  en: {
    badgesTitle: 'My Badges',
    badgeUnlocked: 'Badge unlocked!',
    unlockedOn: 'Unlocked on',
    badges: {
      first_favorite: { name: 'First Favorite', desc: 'Add your first favorite' },
      collector_10: { name: 'Collector', desc: 'Have 10 favorites' },
      collector_25: { name: 'Grand Collector', desc: 'Have 25 favorites' },
      first_rating: { name: 'Beginner Critic', desc: 'Rate your first manga' },
      critic_10: { name: 'Experienced Critic', desc: 'Rate 10 manga' },
      critic_25: { name: 'Expert Critic', desc: 'Rate 25 manga' },
      reader_list: { name: 'Reading List', desc: 'Add 5 manga to read' },
      explorer_20: { name: 'Explorer', desc: 'View 20 manga' },
      explorer_50: { name: 'Grand Explorer', desc: 'View 50 manga' },
      streak_3: { name: 'On Fire', desc: '3 consecutive days' },
      streak_7: { name: 'Dedicated', desc: '7 consecutive days' },
      streak_30: { name: 'Legendary', desc: '30 consecutive days' },
      night_owl: { name: 'Night Owl', desc: 'Visit between midnight and 5am' },
      perfectionist: { name: 'Perfectionist', desc: 'Give a 10/10 rating' },
      theme_changer: { name: 'Stylist', desc: 'Change the theme color' }
    }
  },
  es: {
    badgesTitle: 'Mis Insignias',
    badgeUnlocked: '¡Insignia desbloqueada!',
    unlockedOn: 'Desbloqueado el',
    badges: {
      first_favorite: { name: 'Primer favorito', desc: 'Añadir un primer favorito' },
      collector_10: { name: 'Coleccionista', desc: 'Tener 10 favoritos' },
      collector_25: { name: 'Gran coleccionista', desc: 'Tener 25 favoritos' },
      first_rating: { name: 'Crítico principiante', desc: 'Valorar un primer manga' },
      critic_10: { name: 'Crítico experimentado', desc: 'Valorar 10 mangas' },
      critic_25: { name: 'Crítico experto', desc: 'Valorar 25 mangas' },
      reader_list: { name: 'Lista de lectura', desc: 'Añadir 5 mangas para leer' },
      explorer_20: { name: 'Explorador', desc: 'Consultar 20 mangas' },
      explorer_50: { name: 'Gran explorador', desc: 'Consultar 50 mangas' },
      streak_3: { name: 'En racha', desc: '3 días consecutivos' },
      streak_7: { name: 'Dedicado', desc: '7 días consecutivos' },
      streak_30: { name: 'Legendario', desc: '30 días consecutivos' },
      night_owl: { name: 'Ave nocturna', desc: 'Visitar entre medianoche y 5am' },
      perfectionist: { name: 'Perfeccionista', desc: 'Dar una nota de 10/10' },
      theme_changer: { name: 'Estilista', desc: 'Cambiar el color del tema' }
    }
  },
  ja: {
    badgesTitle: 'マイバッジ',
    badgeUnlocked: 'バッジ獲得！',
    unlockedOn: '獲得日',
    badges: {
      first_favorite: { name: '初めてのお気に入り', desc: '最初のお気に入りを追加' },
      collector_10: { name: 'コレクター', desc: 'お気に入り10件' },
      collector_25: { name: 'グランドコレクター', desc: 'お気に入り25件' },
      first_rating: { name: '初心者批評家', desc: '最初の漫画を評価' },
      critic_10: { name: '熟練批評家', desc: '10作品を評価' },
      critic_25: { name: '専門批評家', desc: '25作品を評価' },
      reader_list: { name: '読書リスト', desc: '読みたい漫画を5件追加' },
      explorer_20: { name: '探検家', desc: '20作品を閲覧' },
      explorer_50: { name: 'グランド探検家', desc: '50作品を閲覧' },
      streak_3: { name: '好調', desc: '3日連続' },
      streak_7: { name: '熱心', desc: '7日連続' },
      streak_30: { name: '伝説的', desc: '30日連続' },
      night_owl: { name: '夜更かし', desc: '深夜0時から5時の間に訪問' },
      perfectionist: { name: '完璧主義者', desc: '10/10の評価を付ける' },
      theme_changer: { name: 'スタイリスト', desc: 'テーマカラーを変更' }
    }
  }
};

function getBadgeName(badgeId, lang) {
  const t = badgeTranslations[lang] || badgeTranslations.fr;
  return t.badges[badgeId]?.name || badgeId;
}

function getBadgeDesc(badgeId, lang) {
  const t = badgeTranslations[lang] || badgeTranslations.fr;
  return t.badges[badgeId]?.desc || '';
}

function getBadges() {
  return JSON.parse(localStorage.getItem('unlockedBadges') || '{}');
}

function saveBadge(badgeId) {
  const badges = getBadges();
  if (!badges[badgeId]) {
    badges[badgeId] = new Date().toISOString();
    localStorage.setItem('unlockedBadges', JSON.stringify(badges));
    return true;
  }
  return false;
}

function checkBadges() {
  badgeDefinitions.forEach(badge => {
    if (badge.condition()) {
      const isNew = saveBadge(badge.id);
      if (isNew) {
        showBadgeNotification(badge);
      }
    }
  });
}

function showBadgeNotification(badge) {
  // Créer l'overlay
  let overlay = document.querySelector('.badge-notification-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'badge-notification-overlay';
    document.body.appendChild(overlay);
  }

  // Créer la notification
  let notification = document.querySelector('.badge-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'badge-notification';
    document.body.appendChild(notification);
  }

  const lang = currentLang || 'fr';
  const t = badgeTranslations[lang] || badgeTranslations.fr;

  notification.innerHTML = `
    <span class="badge-notification-icon">${badge.icon}</span>
    <div class="badge-notification-title">${t.badgeUnlocked}</div>
    <div class="badge-notification-name">${getBadgeName(badge.id, lang)}</div>
    <div class="badge-notification-desc">${getBadgeDesc(badge.id, lang)}</div>
  `;

  // Afficher
  setTimeout(() => {
    overlay.classList.add('show');
    notification.classList.add('show');
  }, 100);

  // Masquer après 3 secondes
  setTimeout(() => {
    overlay.classList.remove('show');
    notification.classList.remove('show');
  }, 3500);

  // Clic pour fermer
  overlay.onclick = () => {
    overlay.classList.remove('show');
    notification.classList.remove('show');
  };
}

function renderBadgesSection() {
  const container = document.getElementById('badgesContainer');
  if (!container) return;

  const unlockedBadges = getBadges();
  const lang = currentLang || 'fr';
  const t = badgeTranslations[lang] || badgeTranslations.fr;

  container.innerHTML = `
    <h2 class="section-title">${t.badgesTitle}</h2>
    <div class="badges-grid">
      ${badgeDefinitions.map(badge => {
        const isUnlocked = !!unlockedBadges[badge.id];
        const unlockDate = isUnlocked ? new Date(unlockedBadges[badge.id]).toLocaleDateString(lang) : '';
        return `
          <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <span class="badge-icon">${badge.icon}</span>
            <div class="badge-name">${getBadgeName(badge.id, lang)}</div>
            <div class="badge-desc">${getBadgeDesc(badge.id, lang)}</div>
            ${isUnlocked ? `<div class="badge-date">${t.unlockedOn} ${unlockDate}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Compteur de mangas vus (pour les badges)
function incrementViewCount() {
  const count = parseInt(localStorage.getItem('totalViewed') || '0');
  localStorage.setItem('totalViewed', (count + 1).toString());
}

// Trigger badge thème
const originalSetColorTheme = setColorTheme;
setColorTheme = function(color, save = true) {
  originalSetColorTheme(color, save);
  if (save) {
    localStorage.setItem('badgeTrigger_theme', 'true');
    checkBadges();
  }
};

// Vérifier les badges périodiquement
function initBadges() {
  checkBadges();
  // Vérifier toutes les 30 secondes
  setInterval(checkBadges, 30000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initPageTransitions();
  initKeyboardShortcuts();
  initBadges();
});
