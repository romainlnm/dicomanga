// GIF picker partagé (chat privé + public) — utilise l'API Giphy v1.
// La clé Giphy est publique (identifiant + rate-limit), pas un secret.
// Sécurisée côté Giphy par référent HTTP (à configurer sur developers.giphy.com).

const GIPHY_API_KEY = 'c4ZIJugjcibfUXPUbRcErA18sWh54iBE';
const GIPHY_API = 'https://api.giphy.com/v1/gifs';
const GIF_PICKER_LIMIT = 24;
const GIF_SEARCH_DEBOUNCE_MS = 350;

function buildGifPickerHtml(pickerKey) {
  return `<div class="gif-picker" data-key="${pickerKey}">
    <div class="gif-picker-search-wrap">
      <input type="search" class="gif-picker-search" placeholder="Rechercher un GIF…" aria-label="Rechercher un GIF" autocomplete="off">
    </div>
    <div class="gif-picker-grid" aria-busy="true"></div>
    <div class="gif-picker-empty" hidden>Aucun GIF trouvé</div>
    <div class="gif-picker-footer">via GIPHY</div>
  </div>`;
}

async function fetchGiphy(endpoint, params) {
  const url = new URL(`${GIPHY_API}/${endpoint}`);
  url.searchParams.set('api_key', GIPHY_API_KEY);
  url.searchParams.set('limit', String(GIF_PICKER_LIMIT));
  url.searchParams.set('rating', 'pg-13');
  url.searchParams.set('bundle', 'messaging_non_clips');
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`Giphy HTTP ${r.status}`);
  return r.json();
}

function renderGifGrid(picker, items) {
  const grid = picker.querySelector('.gif-picker-grid');
  const empty = picker.querySelector('.gif-picker-empty');
  if (!grid) return;
  grid.removeAttribute('aria-busy');
  if (!items || !items.length) {
    grid.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  grid.innerHTML = items.map(g => {
    const thumb = g.images?.fixed_height_small?.url || g.images?.preview_gif?.url || g.images?.fixed_height?.url;
    const full = g.images?.fixed_height?.url || g.images?.original?.url;
    if (!thumb || !full) return '';
    const w = parseInt(g.images?.fixed_height_small?.width || '100', 10);
    const h = parseInt(g.images?.fixed_height_small?.height || '100', 10);
    const title = (g.title || 'GIF').replace(/"/g, '&quot;');
    return `<button type="button" class="gif-pick" data-url="${full}" title="${title}" aria-label="${title}" style="aspect-ratio:${w}/${h}">
      <img src="${thumb}" alt="" loading="lazy">
    </button>`;
  }).join('');
}

async function loadTrending(picker) {
  try {
    const data = await fetchGiphy('trending', {});
    renderGifGrid(picker, data.data || []);
  } catch (e) {
    console.error('Giphy trending:', e);
    renderGifGrid(picker, []);
  }
}

async function loadSearch(picker, query) {
  try {
    const data = await fetchGiphy('search', { q: query });
    renderGifGrid(picker, data.data || []);
  } catch (e) {
    console.error('Giphy search:', e);
    renderGifGrid(picker, []);
  }
}

let gifSearchDebounce = null;

function wireGifPicker(picker, onPick) {
  picker.addEventListener('click', (e) => {
    const pick = e.target.closest('.gif-pick');
    if (pick && pick.dataset.url) {
      onPick(pick.dataset.url);
    }
  });
  const search = picker.querySelector('.gif-picker-search');
  if (search) {
    search.addEventListener('click', (e) => e.stopPropagation());
    search.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (gifSearchDebounce) clearTimeout(gifSearchDebounce);
      const grid = picker.querySelector('.gif-picker-grid');
      if (grid) grid.setAttribute('aria-busy', 'true');
      gifSearchDebounce = setTimeout(() => {
        if (!q) loadTrending(picker);
        else loadSearch(picker, q);
      }, GIF_SEARCH_DEBOUNCE_MS);
    });
  }
}

function toggleGifPicker(scope, btn) {
  const key = `gif-${scope}`;
  const existing = document.querySelector(`.gif-picker[data-key="${key}"]`);
  if (existing) { existing.remove(); return; }
  // Fermer tout autre picker (emoji ou autre GIF)
  document.querySelectorAll('.emoji-picker, .gif-picker').forEach(p => p.remove());
  const wrap = btn.closest('.chat-input-form');
  if (!wrap) return;
  wrap.insertAdjacentHTML('beforeend', buildGifPickerHtml(key));
  const picker = wrap.querySelector(`.gif-picker[data-key="${key}"]`);
  if (!picker) return;
  wireGifPicker(picker, (url) => {
    picker.remove();
    if (typeof sendChatGif === 'function') sendChatGif(scope, url);
  });
  loadTrending(picker);
  setTimeout(() => picker.querySelector('.gif-picker-search')?.focus(), 50);
}

// Fermeture sur clic en dehors (en plus du listener emoji-picker.js).
document.addEventListener('click', (e) => {
  if (e.target.closest('.gif-picker')) return;
  if (e.target.closest('.chat-gif-btn')) return;
  document.querySelectorAll('.gif-picker').forEach(p => p.remove());
});
