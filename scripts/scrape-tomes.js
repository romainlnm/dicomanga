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
  const r = await fetch(safeUrl);
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

async function loadSearchResults(manga) {
  if (searchCache.has(manga.id)) return searchCache.get(manga.id);
  const items = await fetchAllResults(manga);
  // Pre-filter: title must roughly contain the manga title's first word.
  // Author match is preferred but not required (some Google entries miss it).
  const titleNorm = normalize(flags.titleOverride || manga.titre);
  const authorNorm = normalize(flags.authorOverride || manga.auteur);
  const firstTitleWord = titleNorm.split(' ')[0];
  const filtered = items.filter(it => {
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
  const items = await loadSearchResults(manga);
  // Look for the item whose detected volume number equals num
  for (const item of items) {
    const detected = extractVolumeNum(item.volumeInfo);
    if (detected === num) {
      const thumb = pickThumb(item.volumeInfo);
      if (thumb) return thumb;
    }
  }
  // Fallback: ciblage individuel sur ce tome (utile quand la recherche
  // globale n'inclut pas les volumes les plus récents).
  return await findCoverUrlForVolume(manga, num);
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
