#!/usr/bin/env node
/* Generate one static HTML page per manga in data.js, for SEO.
 *
 * Output:
 *   manga/{slug}.html       — French page, canonical
 *   manga/en/{slug}.html    — English page, hreflang alternate
 *   sitemap.xml             — lists every generated page + entry pages
 *   robots.txt              — points to sitemap
 *
 * Each generated page is a clone of manga.html with:
 *   - <title>, <meta description>, og:*, twitter:*, canonical
 *   - <link rel="alternate" hreflang> pointing to the FR/EN counterpart
 *   - JSON-LD (schema.org/ComicSeries)
 *   - All asset paths rewritten with the ../ prefix
 *   - <body data-manga-id="…" data-lang="…"> so manga.js boots on the right id
 *
 * manga.html?id=X still works as a fallback (old links).
 *
 * Usage:
 *   node scripts/generate-static.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'js', 'data.js');
const TEMPLATE_FILE = path.join(ROOT, 'manga.html');
const OUT_DIR_FR = path.join(ROOT, 'manga');
const OUT_DIR_EN = path.join(ROOT, 'manga', 'en');
const SITE_URL = 'https://dicomanga.com';

function loadMangas() {
  const code = fs.readFileSync(DATA_FILE, 'utf8')
    .replace(/^const\s+(mangas|genres)\s*=/m, 'var $1 =')
    .replace(/^const\s+(mangas|genres)\s*=/m, 'var $1 =');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code + '\n;', ctx);
  return ctx.mangas;
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’`"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildSlugMap(mangas) {
  const map = new Map();
  const seen = new Map();
  for (const m of mangas) {
    let base = slugify(m.titre) || `manga-${m.id}`;
    let s = base;
    let n = 2;
    while (seen.has(s)) s = `${base}-${n++}`;
    seen.set(s, m.id);
    map.set(m.id, s);
  }
  return map;
}

function truncate(s, max) {
  if (!s) return '';
  const flat = s.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max - 30 ? cut.slice(0, lastSpace) : cut) + '…';
}

function htmlEscape(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function jsonLd(manga, slug, lang) {
  const cover = manga.couverture ? `${SITE_URL}/${manga.couverture}` : null;
  const url = lang === 'fr'
    ? `${SITE_URL}/manga/${slug}.html`
    : `${SITE_URL}/manga/en/${slug}.html`;
  const desc = lang === 'fr' ? manga.resume : (manga.resume_en || manga.resume);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ComicSeries',
    name: manga.titre,
    url,
    inLanguage: lang === 'fr' ? 'fr' : 'en',
    author: manga.auteur ? { '@type': 'Person', name: manga.auteur } : undefined,
    description: truncate(desc, 500),
    image: cover || undefined,
    genre: Array.isArray(manga.genre) ? manga.genre : undefined,
    datePublished: manga.annee ? String(manga.annee) : undefined,
    numberOfBookEditions: manga.volumes || undefined,
    aggregateRating: Number.isFinite(manga.note) ? {
      '@type': 'AggregateRating',
      ratingValue: String(manga.note),
      bestRating: '10',
      worstRating: '0',
      ratingCount: '1'
    } : undefined
  };
  // Drop undefined keys for cleaner JSON
  const clean = JSON.parse(JSON.stringify(data));
  return JSON.stringify(clean, null, 2);
}

function buildHead(manga, slug, lang, template) {
  const titleSuffix = lang === 'fr' ? 'Dico.Manga' : 'Dico.Manga';
  const titleSep = lang === 'fr' ? '—' : '—';
  const title = `${manga.titre} ${titleSep} ${manga.auteur || ''} | ${titleSuffix}`.replace(/\s+/g, ' ');
  const desc = truncate(lang === 'fr' ? manga.resume : (manga.resume_en || manga.resume), 158);
  const cover = manga.couverture ? `${SITE_URL}/${manga.couverture}` : `${SITE_URL}/images/logo.svg`;
  const urlFr = `${SITE_URL}/manga/${slug}.html`;
  const urlEn = `${SITE_URL}/manga/en/${slug}.html`;
  const canonical = lang === 'fr' ? urlFr : urlEn;

  const tags = [
    `<title>${htmlEscape(title)}</title>`,
    `<meta name="description" content="${htmlEscape(desc)}">`,
    `<meta name="author" content="${htmlEscape(manga.auteur || '')}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<link rel="alternate" hreflang="fr" href="${urlFr}">`,
    `<link rel="alternate" hreflang="en" href="${urlEn}">`,
    `<link rel="alternate" hreflang="x-default" href="${urlFr}">`,
    `<meta property="og:type" content="book">`,
    `<meta property="og:title" content="${htmlEscape(manga.titre)}">`,
    `<meta property="og:description" content="${htmlEscape(desc)}">`,
    `<meta property="og:image" content="${cover}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:locale" content="${lang === 'fr' ? 'fr_FR' : 'en_US'}">`,
    `<meta property="og:site_name" content="Dico.Manga">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${htmlEscape(manga.titre)}">`,
    `<meta name="twitter:description" content="${htmlEscape(desc)}">`,
    `<meta name="twitter:image" content="${cover}">`,
    `<script type="application/ld+json">\n${jsonLd(manga, slug, lang)}\n</script>`
  ].join('\n  ');

  return tags;
}

// Rewrite root-relative asset paths from manga.html to ../ since we now
// live in /manga/ (or ../../ for /manga/en/). Only `href` and `src` are
// safe to touch — `content="..."` carries arbitrary text (descriptions,
// viewport meta, theme colors) so we leave it alone. Anything we inject
// ourselves (og:image, twitter:image, canonical) already uses an
// absolute https:// URL, so it's skipped here too.
function rewritePaths(html, depth) {
  const prefix = '../'.repeat(depth);
  return html.replace(
    /\b(href|src)="(?!https?:|\/\/|\/|#|mailto:|javascript:|data:)([^"]+)"/g,
    (_, attr, value) => `${attr}="${prefix}${value}"`
  );
}

function renderPage(manga, slug, lang, template) {
  // Drop the original <title>…</title> and any meta we may already have,
  // then re-inject the SEO head block right before </head>.
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);

  // Inject SEO tags right before </head>
  const seoHead = buildHead(manga, slug, lang, template);
  html = html.replace('</head>', `  ${seoHead}\n</head>`);

  // Tag <body> with manga id and language so manga.js boots on the right id
  // and translations.js can pick the language.
  html = html.replace(
    '<body>',
    `<body data-manga-id="${manga.id}" data-lang="${lang}">`
  );

  // Rewrite asset paths (manga.html sits at root; generated pages sit
  // one or two levels deeper).
  html = rewritePaths(html, lang === 'fr' ? 1 : 2);

  // Fix the Service Worker path — it must point to the site root '/sw.js',
  // not '../sw.js'. The rewriter spared the absolute '/sw.js' string but
  // since manga.html uses '/sw.js' (already root-relative), nothing to do.

  return html;
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function buildSitemap(mangas, slugs) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/calendrier.html`,
    `${SITE_URL}/stats.html`
  ];
  const entries = urls.map(u => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`);
  for (const m of mangas) {
    const s = slugs.get(m.id);
    entries.push(
      `  <url>`,
      `    <loc>${SITE_URL}/manga/${s}.html</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <xhtml:link rel="alternate" hreflang="fr" href="${SITE_URL}/manga/${s}.html"/>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/manga/en/${s}.html"/>`,
      `  </url>`,
      `  <url>`,
      `    <loc>${SITE_URL}/manga/en/${s}.html</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <xhtml:link rel="alternate" hreflang="fr" href="${SITE_URL}/manga/${s}.html"/>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/manga/en/${s}.html"/>`,
      `  </url>`
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
         `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
         `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
         entries.join('\n') + `\n</urlset>\n`;
}

function buildRobots() {
  return `User-agent: *\n` +
         `Allow: /\n` +
         `\n` +
         `Sitemap: ${SITE_URL}/sitemap.xml\n`;
}

function buildSlugIndex(mangas, slugs) {
  // Tiny lookup table that the app reads at runtime to rewrite
  // manga.html?id=X links into /manga/{slug}.html links.
  const obj = {};
  for (const m of mangas) obj[m.id] = slugs.get(m.id);
  return `// Auto-generated by scripts/generate-static.js — do not edit.\n` +
         `const mangaSlugs = ${JSON.stringify(obj, null, 2)};\n` +
         `\n` +
         `function mangaUrl(id) {\n` +
         `  const slug = mangaSlugs && mangaSlugs[id];\n` +
         `  if (!slug) return 'manga.html?id=' + id;\n` +
         `  // Absolute path works from any page: /manga/{slug}.html and\n` +
         `  // /manga/en/{slug}.html alike route to the same JS app.\n` +
         `  return (location.pathname.startsWith('/manga/') ? '/manga/' : 'manga/') + slug + '.html';\n` +
         `}\n`;
}

async function main() {
  const mangas = loadMangas();
  const slugs = buildSlugMap(mangas);
  const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

  fs.mkdirSync(OUT_DIR_FR, { recursive: true });
  fs.mkdirSync(OUT_DIR_EN, { recursive: true });

  let countFr = 0, countEn = 0;
  for (const m of mangas) {
    const slug = slugs.get(m.id);
    const fr = renderPage(m, slug, 'fr', template);
    const en = renderPage(m, slug, 'en', template);
    writeFile(path.join(OUT_DIR_FR, `${slug}.html`), fr);
    writeFile(path.join(OUT_DIR_EN, `${slug}.html`), en);
    countFr++; countEn++;
  }

  writeFile(path.join(ROOT, 'sitemap.xml'), buildSitemap(mangas, slugs));
  writeFile(path.join(ROOT, 'robots.txt'), buildRobots());
  writeFile(path.join(ROOT, 'js', 'manga-slugs.js'), buildSlugIndex(mangas, slugs));

  console.log(`Wrote ${countFr} FR pages → manga/`);
  console.log(`Wrote ${countEn} EN pages → manga/en/`);
  console.log(`Wrote sitemap.xml, robots.txt, js/manga-slugs.js`);

  // Print a few sample slugs so the user can spot-check
  const samples = mangas.slice(0, 5).map(m => `  ${m.id}: ${m.titre} → ${slugs.get(m.id)}`);
  console.log(`\nSample slugs:\n${samples.join('\n')}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
