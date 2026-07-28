// ===== THÈMES =====
// Système de thèmes partagé par toutes les pages (remplace les copies de
// initTheme/toggleTheme qui vivaient dans app.js, manga.js, stats.js et les
// scripts inline). Le bouton historique ☀️ ouvre désormais un menu.
// Les palettes vivent dans css/style.css ([data-theme="…"]).

const THEMES = [
  { id: 'dark',       icon: '🌙', fr: 'Sombre',        en: 'Dark' },
  { id: 'light',      icon: '☀️', fr: 'Clair',         en: 'Light' },
  { id: 'neon',       icon: '🌃', fr: 'Néon Tokyo',    en: 'Neon Tokyo' },
  { id: 'washi',      icon: '🏮', fr: 'Librairie',     en: 'Bookstore' },
  { id: 'glass',      icon: '🧊', fr: 'Verre dépoli',  en: 'Frosted glass' },
  { id: 'mono',       icon: '📰', fr: 'Magazine',      en: 'Magazine' },
  { id: 'sakura',     icon: '🌸', fr: 'Sakura',        en: 'Sakura' },
  { id: 'ocean',      icon: '🌊', fr: 'Océan',         en: 'Ocean' },
  { id: 'foret',      icon: '🌲', fr: 'Forêt',         en: 'Forest' },
  { id: 'crepuscule', icon: '🌆', fr: 'Crépuscule',    en: 'Sunset' },
  { id: 'terminal',   icon: '👾', fr: 'Terminal',      en: 'Terminal' },
  { id: 'retro',      icon: '📺', fr: 'Rétro 70s',     en: 'Retro 70s' },
  { id: 'encre',      icon: '🖋️', fr: 'Encre',         en: 'Ink' },
  { id: 'cafe',       icon: '☕', fr: 'Café',          en: 'Coffee' },
  { id: 'arctique',   icon: '❄️', fr: 'Arctique',      en: 'Arctic' },
  { id: 'royal',      icon: '👑', fr: 'Royal',         en: 'Royal' }
];

// Thèmes à fond clair : certains styles historiques (privacy.html) utilisent
// la classe body.light-mode, on la maintient pour eux.
const LIGHT_THEMES = ['light', 'washi', 'mono', 'sakura', 'retro', 'arctique'];

function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id);
  // Le studio de couleurs (data-color, géré par app.js) ne s'applique
  // qu'aux thèmes historiques Sombre/Clair ; les autres thèmes imposent
  // leur propre couleur d'accent.
  if (id === 'dark' || id === 'light') {
    document.documentElement.setAttribute('data-color', localStorage.getItem('colorTheme') || 'red');
  } else {
    document.documentElement.removeAttribute('data-color');
  }
  if (document.body) document.body.classList.toggle('light-mode', LIGHT_THEMES.includes(id));
  const icon = document.getElementById('themeIcon');
  const t = THEMES.find(x => x.id === id);
  if (icon && t) icon.textContent = t.icon;
}

function initTheme() {
  // ?theme=neon permet de partager/tester un thème par URL
  const param = new URLSearchParams(location.search).get('theme');
  let theme = param || localStorage.getItem('theme') || 'dark';
  if (!THEMES.some(t => t.id === theme)) theme = 'dark';
  if (param && THEMES.some(t => t.id === param)) localStorage.setItem('theme', param);
  applyTheme(theme);
}

function setTheme(id) {
  localStorage.setItem('theme', id);
  applyTheme(id);
  closeThemeMenu();
}

function closeThemeMenu() {
  const menu = document.getElementById('themeMenu');
  if (menu) menu.remove();
  document.removeEventListener('click', onThemeMenuOutsideClick, true);
  document.removeEventListener('keydown', onThemeMenuEscape);
}

function onThemeMenuOutsideClick(e) {
  const menu = document.getElementById('themeMenu');
  const btn = document.getElementById('themeToggle');
  if (menu && !menu.contains(e.target) && !(btn && btn.contains(e.target))) {
    closeThemeMenu();
  }
}

function onThemeMenuEscape(e) {
  if (e.key === 'Escape') closeThemeMenu();
}

// Conserve son nom historique : tous les boutons ont onclick="toggleTheme()"
function toggleTheme() {
  if (document.getElementById('themeMenu')) { closeThemeMenu(); return; }
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const lang = (typeof currentLang !== 'undefined' && currentLang === 'en') ? 'en' : 'fr';
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const menu = document.createElement('div');
  menu.id = 'themeMenu';
  menu.className = 'theme-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = THEMES.map(t => `
    <button type="button" role="menuitem" class="theme-menu-item${t.id === current ? ' active' : ''}" onclick="setTheme('${t.id}')">
      <span class="theme-menu-icon">${t.icon}</span> ${lang === 'en' ? t.en : t.fr}
    </button>`).join('');
  document.body.appendChild(menu);
  const r = btn.getBoundingClientRect();
  menu.style.top = `${r.bottom + 8}px`;
  // Aligné sur le bouton, sans déborder de l'écran
  menu.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8))}px`;
  document.addEventListener('click', onThemeMenuOutsideClick, true);
  document.addEventListener('keydown', onThemeMenuEscape);
}

// ===== MENU RÉGLAGES (⚙️) =====
// Partagé par toutes les pages (vivait dans app.js, déplacé ici pour que
// manga/calendrier/stats aient le même menu que l'accueil).
function toggleSettingsMenu(event) {
  if (event) event.stopPropagation();
  const wrap = document.getElementById('settingsWrapper');
  if (wrap) wrap.classList.toggle('open');
}
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('settingsWrapper');
  if (!wrap || !wrap.classList.contains('open')) return;
  // Ne pas fermer si on interagit avec le sous-menu thème (rendu au niveau body)
  const themeMenu = document.getElementById('themeMenu');
  if (wrap.contains(e.target) || (themeMenu && themeMenu.contains(e.target))) return;
  wrap.classList.remove('open');
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const wrap = document.getElementById('settingsWrapper');
  if (wrap) wrap.classList.remove('open');
});

// Bascule de langue minimale pour les pages sans machinerie i18n complète
// (stats.html : les traductions sont appliquées au chargement par stats.js,
// un simple reload suffit donc à changer de langue).
function toggleLanguageBasic() {
  const next = (localStorage.getItem('lang') || 'fr') === 'fr' ? 'en' : 'fr';
  localStorage.setItem('lang', next);
  location.reload();
}
document.addEventListener('DOMContentLoaded', () => {
  const icon = document.getElementById('langIcon');
  if (icon) icon.textContent = (localStorage.getItem('lang') || 'fr').toUpperCase();
});

initTheme();
