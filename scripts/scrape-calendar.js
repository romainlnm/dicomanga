#!/usr/bin/env node
/* Scrape 2026 FR release dates from Nautiljon for every manga in data.js.
 *
 * Output: js/calendar-2026.js with a `const calendar2026 = [...]` array
 * of { mangaId, num, date, title, cover } entries (date in YYYY-MM-DD).
 *
 * Usage:
 *   node scripts/scrape-calendar.js                 # all mangas
 *   node scripts/scrape-calendar.js --id=12,21      # only those ids
 *   node scripts/scrape-calendar.js --year=2026     # default 2026
 *   node scripts/scrape-calendar.js --dry-run       # print only, no write
 *
 * Slug strategy:
 *   - prefer manga.nautiljon (manual override in data.js)
 *   - otherwise normalize: lowercase, strip accents, replace ' ' → '+',
 *     keep alphanum + '-+!'.
 *   - if the first guess 404s, try a couple of variants (no '!', no '+').
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'js', 'data.js');
const OUT_FILE = path.join(ROOT, 'js', 'calendar-2026.js');

const args = process.argv.slice(2);
const flags = {
  ids: null,
  year: 2026,
  dry: args.includes('--dry-run')
};
for (const a of args) {
  if (a.startsWith('--id=') || a.startsWith('--ids=')) {
    flags.ids = a.split('=')[1].split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isInteger);
  }
  if (a.startsWith('--year=')) {
    flags.year = parseInt(a.split('=')[1], 10) || 2026;
  }
}

function loadMangas() {
  const code = fs.readFileSync(DATA_FILE, 'utf8')
    .replace(/^const\s+(mangas|genres)\s*=/m, 'var $1 =')
    .replace(/^const\s+(mangas|genres)\s*=/m, 'var $1 =');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code + '\n;', ctx);
  return ctx.mangas;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Series whose Nautiljon slug can't be auto-derived from their data.js title.
// Add to this map as new 404s are encountered.
const MANUAL_SLUGS = {
  // 9:   'boruto+...',          // No known Nautiljon page for the main Boruto manga
  // 99:  'sword+art+online+...' // SAO has many manga adaptations, no umbrella page
};

function buildSlugCandidates(manga) {
  if (manga.nautiljon) return [manga.nautiljon];
  if (MANUAL_SLUGS[manga.id]) return [MANUAL_SLUGS[manga.id]];
  const base = normalize(manga.titre)
    .replace(/['"’`]/g, '')
    .replace(/[^a-z0-9\s\-+!]/g, '')
    .trim()
    .replace(/\s+/g, '+');
  const variants = new Set([base]);
  if (base.includes('!')) variants.add(base.replace(/!/g, ''));
  if (base.includes('+')) variants.add(base.replace(/\+/g, '-'));
  // "One Punch Man" → "one+punch+man" auto, but Nautiljon uses "one-punch+man".
  // Try replacing the first '+' with '-' as a heuristic for compound titles.
  const firstPlus = base.indexOf('+');
  if (firstPlus > 0) variants.add(base.slice(0, firstPlus) + '-' + base.slice(firstPlus + 1));
  variants.add(base.replace(/[-+!]/g, ''));
  return [...variants];
}

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'fr-FR,fr;q=0.9'
    }
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
}

async function tryFetchManga(manga) {
  for (const slug of buildSlugCandidates(manga)) {
    const url = `https://www.nautiljon.com/mangas/${slug}.html`;
    try {
      const html = await fetchHtml(url);
      if (html) return { slug, html };
    } catch (e) { /* try next */ }
    await sleep(150);
  }
  return null;
}

// Parse the volume listing area. Nautiljon shows "Dernier paru" (most recent
// released) and "À paraître" (upcoming) blocks at the top of the manga page,
// each formatted as:
//   <div class="acenter inline-block"><strong>...</strong><br/>
//     <a ... title="Vol. NN"><img/></a><br/>
//     <span class="infos_small">DD/MM/YYYY</span>
//   </div>
// We grep the whole page for any title="Vol. N" .. infos_small">DD/MM/YYYY
// pairing within a short window and keep dates matching the target year.
function parseUpcoming(html, year) {
  const out = [];
  const re = /title="Vol\.?\s*(\d+)"[\s\S]{0,500}?infos_small">(\d{2})\/(\d{2})\/(\d{4})/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const num = parseInt(m[1], 10);
    const yyyy = parseInt(m[4], 10);
    if (!num || yyyy !== year) continue;
    out.push({ num, date: `${m[4]}-${m[3]}-${m[2]}` });
  }
  const byNum = new Map();
  for (const e of out) {
    if (!byNum.has(e.num) || e.date < byNum.get(e.num).date) byNum.set(e.num, e);
  }
  return [...byNum.values()].sort((a, b) => a.num - b.num);
}

async function processManga(manga) {
  if (flags.ids && !flags.ids.includes(manga.id)) return [];
  const res = await tryFetchManga(manga);
  if (!res) {
    console.log(`[404] [${manga.id}] ${manga.titre}`);
    return [];
  }
  let upcoming = parseUpcoming(res.html, flags.year);
  // A "Terminé" series with a published volume count shouldn't have new
  // releases — anything we find is almost certainly a reissue (perfect /
  // colored edition). Drop those to keep the calendar focused on real
  // continuations.
  if (manga.statut === 'Terminé' && manga.volumes) {
    const maxVol = parseInt(manga.volumes, 10);
    upcoming = upcoming.filter(u => u.num > maxVol);
  }
  if (upcoming.length) {
    console.log(`[OK]  [${manga.id}] ${manga.titre} (${res.slug}): ${upcoming.map(u => `t.${u.num}/${u.date}`).join(', ')}`);
  } else {
    console.log(`[--]  [${manga.id}] ${manga.titre} (${res.slug}): no ${flags.year} releases`);
  }
  return upcoming.map(u => ({
    mangaId: manga.id,
    num: u.num,
    date: u.date,
    title: manga.titre,
    cover: `images/covers/${manga.id}.jpg`
  }));
}

function writeOutput(entries) {
  entries.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  const lines = entries.map(e =>
    `  { mangaId: ${e.mangaId}, num: ${e.num}, date: "${e.date}", title: ${JSON.stringify(e.title)} }`
  );
  const body = `// Auto-generated by scripts/scrape-calendar.js — do not edit by hand.\n` +
               `// Source: nautiljon.com (FR release dates)\n` +
               `// Generated: ${new Date().toISOString()}\n` +
               `const calendar2026 = [\n${lines.join(',\n')}\n];\n`;
  fs.writeFileSync(OUT_FILE, body);
  console.log(`\nWrote ${entries.length} entries → ${path.relative(ROOT, OUT_FILE)}`);
}

async function main() {
  const mangas = loadMangas();
  const targets = flags.ids
    ? mangas.filter(m => flags.ids.includes(m.id))
    : mangas;
  console.log(`Scraping ${targets.length} mangas for ${flags.year} FR releases…\n`);
  const all = [];
  for (const m of targets) {
    try {
      const rows = await processManga(m);
      all.push(...rows);
    } catch (e) {
      console.log(`[ERR] [${m.id}] ${m.titre}: ${e.message}`);
    }
    await sleep(400); // polite to nautiljon
  }
  if (flags.dry) {
    console.log(`\nDRY RUN — ${all.length} entries (not written).`);
  } else {
    writeOutput(all);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
