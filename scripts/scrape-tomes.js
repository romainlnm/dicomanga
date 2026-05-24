#!/usr/bin/env node
/* Scrape per-volume covers from Google Books and save them to images/tomes/.
 *
 * Usage:
 *   node scripts/scrape-tomes.js                # all manga that have a tomes[] array
 *   node scripts/scrape-tomes.js --id=2,15,169  # only those manga ids
 *   node scripts/scrape-tomes.js --force        # redownload even if file exists
 *   node scripts/scrape-tomes.js --dry-run      # log what would happen, no download
 *
 * Notes:
 *   - Google Books returns covers of variable quality; you should eyeball
 *     the result and replace the bad ones manually.
 *   - The script is idempotent: it skips files that already exist unless
 *     --force is passed.
 *   - Sleeps 250 ms between requests to stay polite.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'js', 'data.js');
const OUT_DIR = path.join(ROOT, 'images', 'tomes');

const args = process.argv.slice(2);
const flags = {
  ids: null,
  force: args.includes('--force'),
  dry: args.includes('--dry-run'),
  titleOverride: null,
  authorOverride: null
};
for (const a of args) {
  if (a.startsWith('--id=') || a.startsWith('--ids=')) {
    flags.ids = a.split('=')[1].split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isInteger);
  }
  if (a.startsWith('--title=')) {
    flags.titleOverride = a.slice('--title='.length);
  }
  if (a.startsWith('--author=')) {
    flags.authorOverride = a.slice('--author='.length);
  }
}

function loadMangas() {
  // Replace top-level const/let with var so the declarations land on the
  // VM context's global, otherwise we can't read them back.
  const code = fs.readFileSync(DATA_FILE, 'utf8')
    .replace(/^const\s+(mangas|genres)\s*=/m, 'var $1 =')
    .replace(/^const\s+(mangas|genres)\s*=/m, 'var $1 =');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code + '\n;', ctx);
  if (!Array.isArray(ctx.mangas)) {
    throw new Error('Could not extract mangas array from data.js');
  }
  return ctx.mangas;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJson(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'dico-manga-tome-scraper/1.0' }
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function downloadImage(url, dest) {
  // Google Books returns http URLs; force https for cleaner fetch
  const safeUrl = url.replace(/^http:/, 'https:');
  const r = await fetch(safeUrl, {
    headers: { 'User-Agent': 'dico-manga-tome-scraper/1.0' }
  });
  if (!r.ok) throw new Error(`Image HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSearchUrl(manga) {
  // Use Google Books' structured search: intitle + inauthor.
  // Don't include volume number here — we filter results by number afterward,
  // so a single search covers all tomes (less wasteful, more accurate).
  const title = (flags.titleOverride || manga.titre || '').replace(/\s+/g, ' ').trim();
  const author = (flags.authorOverride || manga.auteur || '').replace(/\s+/g, ' ').trim();
  const parts = [];
  if (title) parts.push(`intitle:${JSON.stringify(title)}`);
  if (author) parts.push(`inauthor:${JSON.stringify(author.split(' ').pop())}`);
  const q = parts.join('+');
  return `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=40&printType=books`;
}

function pickThumb(volumeInfo) {
  const thumb = volumeInfo?.imageLinks?.thumbnail
    || volumeInfo?.imageLinks?.smallThumbnail;
  if (!thumb) return null;
  return thumb.replace('&edge=curl', '').replace(/&zoom=\d+/, '&zoom=1');
}

function extractVolumeNum(volumeInfo) {
  const t = `${volumeInfo?.title || ''} ${volumeInfo?.subtitle || ''}`;
  // Look for "Vol. 3", "Volume 3", "Tome 3", "#3", "T. 3", " 3 " at end, etc.
  const patterns = [
    /(?:vol(?:ume)?\.?|tome|t\.?|book|#)\s*0*(\d+)/i,
    /,\s*0*(\d+)\s*$/,
    /\s0*(\d+)\s*$/
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

// Cache the search result per manga so we hit the API once instead of N times.
const searchCache = new Map();

// ---------- MangaDex fallback ----------
// We hit MangaDex only when Google Books fails. The cache below stores, per
// manga.id from data.js: either null (we already searched and found nothing
// usable) or { mdId, coversByVolume } where coversByVolume is a map of
// integer volume number -> URL of the .256.jpg thumbnail.
const mangadexCache = new Map();
const MD_API = 'https://api.mangadex.org';
const MD_UPLOADS = 'https://uploads.mangadex.org';

// Manual MangaDex overrides for series that the auto-search can't resolve to a
// single entry. Each entry maps a manga.id from data.js to a list of segments
// {mdId, globalStart, localStart, count} that together cover the full tome
// range. Used for serialised-in-parts works like JoJo where each Part has its
// own MangaDex manga record but our data.js numbers tomes globally.
const MD_OVERRIDES = {
  // JoJo's Bizarre Adventure — 131 tankōbon split across 8 Parts.
  97: [
    { mdId: '5a547d1d-576b-477f-8cb3-70a3b4187f8a', globalStart: 1,   localStart: 1, count: 5  }, // Part 1 Phantom Blood
    { mdId: '61079efc-d1c4-4565-bbe6-de58e1d75fdf', globalStart: 6,   localStart: 1, count: 7  }, // Part 2 Battle Tendency
    { mdId: '0d545e62-d4cd-4e65-a65c-a5c46b794918', globalStart: 13,  localStart: 1, count: 16 }, // Part 3 Stardust Crusaders
    { mdId: '5ed1f8fc-a119-4cbc-aeae-26ce2bd3f838', globalStart: 29,  localStart: 1, count: 18 }, // Part 4 Diamond is Unbreakable (skip MD vol 19, bonus)
    { mdId: '2725e983-81c3-4a62-8e97-5027c5996c2b', globalStart: 47,  localStart: 1, count: 17 }, // Part 5 Vento Aureo
    { mdId: 'ea57752d-acb7-469e-aa60-43e694ded9a9', globalStart: 64,  localStart: 1, count: 17 }, // Part 6 Stone Ocean
    { mdId: 'b30dfee3-9d1d-4e8d-bfbe-8fcabc3c96f6', globalStart: 81,  localStart: 1, count: 24 }, // Part 7 Steel Ball Run
    { mdId: 'c086153a-0162-412a-9914-a7b2633d0cd3', globalStart: 105, localStart: 1, count: 27 }, // Part 8 JoJolion
  ],
  // Kenichi: The Mightiest Disciple — auto-search picked the "Plus" spinoff.
  111: [
    { mdId: '9d563964-e935-47d4-812a-abfd2f625384', globalStart: 1, localStart: 1, count: 61 }
  ],
  // Hell Teacher Nube — auto-search picked "Nube PLUS" spinoff (1 wrong cover).
  149: [
    { mdId: 'aeccf180-8e12-4dc9-90a5-d9b5898e9933', globalStart: 1, localStart: 1, count: 31 }
  ]
};

function pickBestMdManga(items, manga) {
  const titleNorm = normalize(flags.titleOverride || manga.titre);
  const authorNorm = normalize(flags.authorOverride || manga.auteur);
  const firstWord = titleNorm.split(' ')[0];
  const scored = items.map(it => {
    const a = it.attributes || {};
    const titles = [
      ...Object.values(a.title || {}),
      ...(a.altTitles || []).flatMap(t => Object.values(t))
    ].map(normalize);
    const titleHit = titles.some(t => t.includes(titleNorm) || titleNorm.includes(t));
    const firstWordHit = titles.some(t => t.includes(firstWord));
    // Penalize obvious alternate versions / fan-color editions
    const allTitles = titles.join(' ');
    const isAltVersion = /\b(fan colored|colored|side story|revolution|gaiden|extra|spinoff)\b/.test(allTitles);
    // Prefer Japanese-origin works (real manga) over fan projects
    const isJapanese = a.originalLanguage === 'ja';
    // Author is reachable via relationships → name resolution, but we'd need an
    // extra request. Skip it for now; titles + altTitles + originalLanguage are
    // already strong enough in practice.
    const score =
      (titleHit ? 100 : 0)
      + (firstWordHit ? 20 : 0)
      + (isJapanese ? 5 : 0)
      + (isAltVersion ? -50 : 0);
    return { item: it, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  return scored[0]?.item || null;
}

async function findMangadexMangaId(manga) {
  const title = (flags.titleOverride || manga.titre || '').trim();
  if (!title) return null;
  // The title we have is sometimes the FR licensed title — try the user's
  // title first, then a stripped variant (remove parenthesized notes).
  const candidates = [title, title.replace(/\s*\(.*?\)\s*/g, '').trim()].filter((t, i, arr) => t && arr.indexOf(t) === i);
  for (const candidate of candidates) {
    try {
      const url = `${MD_API}/manga?title=${encodeURIComponent(candidate)}&limit=10&order%5Brelevance%5D=desc&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica`;
      const data = await fetchJson(url);
      const best = pickBestMdManga(data.data || [], manga);
      if (best) return best.id;
    } catch (e) { /* ignore */ }
    await sleep(200);
  }
  return null;
}

async function fetchAllMdCovers(mdId) {
  // The /cover endpoint is paginated (max 100 per page).
  const all = [];
  let offset = 0;
  const limit = 100;
  for (let safety = 0; safety < 10; safety++) {
    const url = `${MD_API}/cover?manga%5B%5D=${mdId}&limit=${limit}&offset=${offset}&order%5Bvolume%5D=asc`;
    const data = await fetchJson(url);
    const items = data.data || [];
    all.push(...items);
    if (items.length < limit) break;
    offset += limit;
    await sleep(200);
  }
  return all;
}

// Prefer Japanese (original) cover, then French, then English, then anything else.
const MD_LOCALE_PRIORITY = ['ja', 'fr', 'en'];

function pickBestCoverForVolume(covers) {
  if (!covers.length) return null;
  const byLocale = new Map();
  for (const c of covers) {
    const loc = c.attributes?.locale || 'xx';
    if (!byLocale.has(loc)) byLocale.set(loc, c);
  }
  for (const loc of MD_LOCALE_PRIORITY) {
    if (byLocale.has(loc)) return byLocale.get(loc);
  }
  return covers[0];
}

function coversToVolumeMap(covers, mdId) {
  // Group covers by integer volume number, then pick best per volume.
  // Skip half-volumes ("12.5"), specials, "none", etc.
  const byVolume = new Map();
  for (const c of covers) {
    const vRaw = String(c.attributes?.volume || '');
    if (!/^\d+$/.test(vRaw)) continue;
    const v = parseInt(vRaw, 10);
    if (v < 1) continue;
    if (!byVolume.has(v)) byVolume.set(v, []);
    byVolume.get(v).push(c);
  }
  const urlByVolume = new Map();
  for (const [v, list] of byVolume) {
    const best = pickBestCoverForVolume(list);
    if (best?.attributes?.fileName) {
      urlByVolume.set(v, `${MD_UPLOADS}/covers/${mdId}/${best.attributes.fileName}.256.jpg`);
    }
  }
  return urlByVolume;
}

async function loadMangadexCoversFromOverride(manga) {
  const segments = MD_OVERRIDES[manga.id];
  const coverUrlByVolume = new Map();
  for (const seg of segments) {
    let local;
    try {
      const covers = await fetchAllMdCovers(seg.mdId);
      local = coversToVolumeMap(covers, seg.mdId);
    } catch (e) {
      continue;
    }
    // Remap localVolume -> globalVolume using the segment offset.
    for (let i = 0; i < seg.count; i++) {
      const localVol = seg.localStart + i;
      const globalVol = seg.globalStart + i;
      const url = local.get(localVol);
      if (url) coverUrlByVolume.set(globalVol, url);
    }
    await sleep(200);
  }
  return { mdId: 'override', coverUrlByVolume };
}

async function loadMangadexCovers(manga) {
  if (mangadexCache.has(manga.id)) return mangadexCache.get(manga.id);
  if (MD_OVERRIDES[manga.id]) {
    const result = await loadMangadexCoversFromOverride(manga);
    mangadexCache.set(manga.id, result);
    return result;
  }
  const mdId = await findMangadexMangaId(manga);
  if (!mdId) {
    mangadexCache.set(manga.id, null);
    return null;
  }
  await sleep(200);
  let covers;
  try {
    covers = await fetchAllMdCovers(mdId);
  } catch (e) {
    mangadexCache.set(manga.id, null);
    return null;
  }
  const result = { mdId, coverUrlByVolume: coversToVolumeMap(covers, mdId) };
  mangadexCache.set(manga.id, result);
  return result;
}

async function findMangadexCoverUrl(manga, num) {
  const entry = await loadMangadexCovers(manga);
  if (!entry) return null;
  return entry.coverUrlByVolume.get(num) || null;
}

async function fetchAllResults(manga) {
  const all = [];
  // 1) Strict: intitle + inauthor
  try {
    const r = await fetchJson(buildSearchUrl(manga));
    if (r.items) all.push(...r.items);
  } catch (e) { /* ignore */ }
  await sleep(150);
  // 2) Loose: title only (catches entries with weird author fields)
  try {
    const title = (flags.titleOverride || manga.titre || '').trim();
    if (title) {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(`intitle:${JSON.stringify(title)}`)}&maxResults=40&printType=books`;
      const r = await fetchJson(url);
      if (r.items) all.push(...r.items);
    }
  } catch (e) { /* ignore */ }
  await sleep(150);
  // 3) Plain text search (sometimes returns more for less mainstream titles)
  try {
    const title = (flags.titleOverride || manga.titre || '').trim();
    const author = (flags.authorOverride || manga.auteur || '').trim();
    const q = encodeURIComponent(`${title} ${author} manga`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=40&printType=books`;
    const r = await fetchJson(url);
    if (r.items) all.push(...r.items);
  } catch (e) { /* ignore */ }
  // Dedupe by Google Books id
  const seen = new Set();
  return all.filter(it => {
    if (!it.id || seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
}

// Known-junk publishers and title fragments that Google Books returns for
// generic-sounding manga titles like "Kingdom" or "Reborn".
const PUBLISHER_BLACKLIST = [
  'forgotten books',
  'classic reprint',
  'fb&c',
  'sagwan press',
  'palala press',
  'theclassics.us',
  'wentworth press',
  'andesite press',
  'armory',
  'scholastic',
  'geronimo stilton'
];
const TITLE_BLACKLIST = [
  'statutes of',
  'transactions of',
  'royal society',
  'ophthalmological',
  'parliament',
  'accounts and papers',
  'armory life',
  'bloodshot',
  'after-school kindness',
  'kindness crew',
  'scorpio reborn',
  'kingdom of god',
  'sunrise in the sunrise kingdom',
  'human geography',
  'eccentric doctor',
  'panorama of the kingdom',
  'how to rebuild',
  'rebuilt the kingdom',
  'statistical abstract',
  'laws of the kingdom',
  'kingdom of fantasy',
  'inventing patirus',
  'gonhara kingdom',
  'encyclopedia of library',
  'dragon ball z',
  'dragon ball super',
  'dragonball z',
  'dragonball super',
  'dragon ball culture',
  'into the fire',
  'saga of goku',
  'overlord',
  'register of educational',
  'heaven s glory',
  'kingdom glory',
  'dream kingdom',
  'kingdom of man',
  'kingdom of kaos',
  'kingdom of mists',
  'kingdom of bones',
  'kingdom of liars',
  'kingdom of wrenly',
  'kingdom hearts',
  'berserk of gluttony',
  'deluxe edition',
  'maximum berserk'
];

function isJunk(volumeInfo) {
  const pub = normalize(volumeInfo?.publisher);
  if (PUBLISHER_BLACKLIST.some(p => pub.includes(p))) return true;
  const t = `${normalize(volumeInfo?.title)} ${normalize(volumeInfo?.subtitle)}`;
  if (TITLE_BLACKLIST.some(p => t.includes(p))) return true;
  return false;
}

async function loadSearchResults(manga) {
  if (searchCache.has(manga.id)) return searchCache.get(manga.id);
  const items = await fetchAllResults(manga);
  // Pre-filter: title must roughly contain the manga title's first word.
  // Author match is preferred but not required (some Google entries miss it).
  const titleNorm = normalize(flags.titleOverride || manga.titre);
  const authorNorm = normalize(flags.authorOverride || manga.auteur);
  const firstTitleWord = titleNorm.split(' ')[0];
  const filtered = items.filter(it => {
    if (isJunk(it.volumeInfo)) return false;
    const itemTitle = normalize(it.volumeInfo?.title);
    const itemSub = normalize(it.volumeInfo?.subtitle);
    const allTitle = `${itemTitle} ${itemSub}`;
    return firstTitleWord && allTitle.includes(firstTitleWord);
  }).map(it => {
    // Score : higher when title has more matching words AND author matches
    const itemTitle = normalize(it.volumeInfo?.title);
    const itemSub = normalize(it.volumeInfo?.subtitle);
    const allTitle = `${itemTitle} ${itemSub}`;
    const itemAuthors = normalize((it.volumeInfo?.authors || []).join(' '));
    const titleWords = titleNorm.split(' ').filter(w => w.length > 2);
    const titleScore = titleWords.filter(w => allTitle.includes(w)).length;
    const authorMatch = authorNorm && authorNorm.split(' ').some(w => w.length > 3 && itemAuthors.includes(w));
    return { item: it, score: titleScore * 10 + (authorMatch ? 5 : 0) };
  }).sort((a, b) => b.score - a.score).map(x => x.item);
  searchCache.set(manga.id, filtered);
  return filtered;
}

async function findCoverUrl(manga, num) {
  // Series with an explicit MD override skip Google Books — the override
  // exists precisely because GB's matches were wrong (e.g. US deluxe re-edition
  // numbering for JoJo). Go straight to MangaDex with the correct mapping.
  if (MD_OVERRIDES[manga.id]) {
    return await findMangadexCoverUrl(manga, num);
  }
  const items = await loadSearchResults(manga);
  // Look for the item whose detected volume number equals num
  for (const item of items) {
    const detected = extractVolumeNum(item.volumeInfo);
    if (detected === num) {
      const thumb = pickThumb(item.volumeInfo);
      if (thumb) return thumb;
    }
  }
  // Fallback 1: ciblage individuel sur ce tome (utile quand la recherche
  // globale n'inclut pas les volumes les plus récents).
  const gb = await findCoverUrlForVolume(manga, num);
  if (gb) return gb;
  // Fallback 2: MangaDex. Plus fiable pour les séries que Google Books indexe
  // mal (mainstream JP only ou titres ambigus).
  return await findMangadexCoverUrl(manga, num);
}

async function findCoverUrlForVolume(manga, num) {
  const title = (flags.titleOverride || manga.titre || '').trim();
  if (!title) return null;
  const titleNorm = normalize(title);
  const firstWord = titleNorm.split(' ')[0];
  // Plusieurs tentatives de query pour ce tome précis
  const queries = [
    `intitle:${JSON.stringify(title)}+intitle:${JSON.stringify('vol ' + num)}`,
    `intitle:${JSON.stringify(title)}+intitle:${JSON.stringify(String(num))}`,
    `${title} vol ${num}`,
    `${title} ${num}`
  ];
  for (const q of queries) {
    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20&printType=books`;
      const data = await fetchJson(url);
      const items = data.items || [];
      for (const it of items) {
        if (isJunk(it.volumeInfo)) continue;
        const itemTitle = normalize(it.volumeInfo?.title);
        const itemSub = normalize(it.volumeInfo?.subtitle);
        const allTitle = `${itemTitle} ${itemSub}`;
        if (!allTitle.includes(firstWord)) continue;
        const detected = extractVolumeNum(it.volumeInfo);
        if (detected === num) {
          const thumb = pickThumb(it.volumeInfo);
          if (thumb) return thumb;
        }
      }
    } catch (e) { /* ignore */ }
    await sleep(150);
  }
  return null;
}

function getTomesList(manga) {
  if (Array.isArray(manga.tomes) && manga.tomes.length) return manga.tomes;
  const count = parseInt(manga.volumes, 10);
  if (!count || count <= 0) return [];
  const out = [];
  for (let i = 1; i <= count; i++) out.push({ num: i });
  return out;
}

async function processManga(manga) {
  const tomes = getTomesList(manga);
  if (!tomes.length) return;
  if (flags.ids && !flags.ids.includes(manga.id)) return;

  console.log(`\n=== [${manga.id}] ${manga.titre} (${tomes.length} tomes) ===`);

  for (const t of tomes) {
    const fileName = `${manga.id}-${pad2(t.num)}.jpg`;
    const dest = path.join(OUT_DIR, fileName);
    if (!flags.force && fs.existsSync(dest)) {
      console.log(`[SKIP] ${fileName} already exists`);
      continue;
    }

    try {
      const url = await findCoverUrl(manga, t.num);
      if (!url) {
        console.log(`[NOT FOUND] tome ${t.num}`);
        await sleep(250);
        continue;
      }
      if (flags.dry) {
        console.log(`[DRY] tome ${t.num} -> ${url}`);
      } else {
        const size = await downloadImage(url, dest);
        console.log(`[OK] tome ${t.num} -> ${fileName} (${(size / 1024).toFixed(1)} kB)`);
      }
    } catch (e) {
      console.log(`[ERROR] tome ${t.num}: ${e.message}`);
    }
    await sleep(250);
  }
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const mangas = loadMangas();
  const todo = mangas.filter(m => getTomesList(m).length > 0);
  console.log(`Found ${mangas.length} mangas, ${todo.length} have at least one tome.`);
  if (flags.ids) console.log(`Filtering to ids: ${flags.ids.join(', ')}`);
  if (flags.dry) console.log('DRY RUN — no files will be written.');

  for (const m of todo) {
    await processManga(m);
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
