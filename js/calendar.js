// Render the 2026 release calendar.
//
// Sources:
//   - calendar2026[]                 (scraped from Nautiljon, in calendar-2026.js)
//   - mangas[*].tomes[*].date        (manually curated dates in data.js)
//
// Both feed the same rendering pipeline. Entries are deduped by (mangaId, num):
// data.js takes precedence over the scraper since it's hand-checked.

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const TARGET_YEAR = 2026;

function buildEntries() {
  const byKey = new Map();
  const push = (e) => {
    const key = `${e.mangaId}-${e.num}`;
    if (!byKey.has(key) || e.priority > byKey.get(key).priority) byKey.set(key, e);
  };

  // 1) Scraped Nautiljon entries (lower priority)
  if (typeof calendar2026 !== 'undefined' && Array.isArray(calendar2026)) {
    for (const e of calendar2026) {
      if (!e.date || !e.date.startsWith(`${TARGET_YEAR}-`)) continue;
      const manga = mangas.find(m => m.id === e.mangaId);
      if (!manga) continue;
      push({
        mangaId: e.mangaId,
        num: e.num,
        date: e.date,
        title: manga.titre,
        cover: manga.couverture,
        priority: 1
      });
    }
  }

  // 2) Manually curated dates in data.js (higher priority — overwrites scraper)
  for (const manga of mangas) {
    if (!Array.isArray(manga.tomes)) continue;
    for (const t of manga.tomes) {
      if (!t.date || !t.date.startsWith(`${TARGET_YEAR}-`)) continue;
      push({
        mangaId: manga.id,
        num: t.num,
        date: t.date,
        title: manga.titre,
        cover: t.cover || manga.couverture,
        priority: 2
      });
    }
  }

  return [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function groupByMonth(entries) {
  const byMonth = new Map();
  for (const e of entries) {
    const month = parseInt(e.date.slice(5, 7), 10);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month).push(e);
  }
  return byMonth;
}

function formatDay(dateStr) {
  // "2026-04-08" → "08"
  return dateStr.slice(8, 10);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function isPast(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr < today;
}

function renderEntry(e) {
  const day = formatDay(e.date);
  const past = isPast(e.date) ? ' calendar-entry-past' : '';
  const link = (typeof mangaUrl === 'function') ? mangaUrl(e.mangaId) : `manga.html?id=${e.mangaId}`;
  return `
    <a class="calendar-entry${past}" href="${link}">
      <div class="calendar-entry-day">${day}</div>
      <img class="calendar-entry-cover" src="${escapeHtml(e.cover)}" alt="" loading="lazy"
           onerror="this.style.visibility='hidden'">
      <div class="calendar-entry-meta">
        <div class="calendar-entry-title">${escapeHtml(e.title)}</div>
        <div class="calendar-entry-tome">Tome ${e.num}</div>
      </div>
    </a>
  `;
}

function renderMonth(month, entries) {
  const items = entries.map(renderEntry).join('');
  return `
    <section class="calendar-month" id="month-${month}">
      <h2 class="calendar-month-title">${MONTH_NAMES_FR[month - 1]} <span class="calendar-month-count">${entries.length}</span></h2>
      <div class="calendar-entries">${items}</div>
    </section>
  `;
}

function renderSummary(entries, byMonth) {
  if (!entries.length) return '';
  const chips = MONTH_NAMES_FR.map((name, i) => {
    const m = i + 1;
    const count = byMonth.get(m)?.length || 0;
    if (!count) return '';
    return `<a class="calendar-chip" href="#month-${m}">${name} <b>${count}</b></a>`;
  }).join('');
  return `
    <p class="calendar-total">${entries.length} sortie${entries.length > 1 ? 's' : ''} prévue${entries.length > 1 ? 's' : ''} en ${TARGET_YEAR}</p>
    <div class="calendar-chips">${chips}</div>
  `;
}

function render() {
  const entries = buildEntries();
  const byMonth = groupByMonth(entries);
  const summaryEl = document.getElementById('calendarSummary');
  const contentEl = document.getElementById('calendarContent');

  if (!entries.length) {
    contentEl.innerHTML = '<p class="no-data">Aucune sortie 2026 connue pour le moment. Relance scripts/scrape-calendar.js pour rafraîchir.</p>';
    return;
  }

  summaryEl.innerHTML = renderSummary(entries, byMonth);

  const months = [...byMonth.keys()].sort((a, b) => a - b);
  contentEl.innerHTML = months.map(m => renderMonth(m, byMonth.get(m))).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  // app.js usually toggles `loaded` on <main> to fade it in; we don't load
  // app.js here, so do it ourselves.
  document.querySelector('main')?.classList.add('loaded');
});
