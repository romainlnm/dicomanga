#!/usr/bin/env node
/* Récupère l'ISBN du tome 1 (édition française) de chaque manga via le
 * catalogue SRU de la BNF, et génère js/achats.js (map id -> ISBN-13).
 *
 * Usage:
 *   node scripts/scrape-isbn.js              # tous les mangas
 *   node scripts/scrape-isbn.js --id=2,15    # seulement ces ids
 *   node scripts/scrape-isbn.js --dry-run    # n'écrit pas js/achats.js
 *
 * Notes:
 *   - Source: http://catalogue.bnf.fr/api/SRU (officiel, sans clé), format
 *     unimarcxchange : zone 010$a = ISBN, 200$a/$h = titre/volume,
 *     225$a/$v et 461$t/$v = série/volume, 205$a = mention d'édition.
 *     Beaucoup de tomes (Ki-oon, Kana…) sont catalogués sous leur seul
 *     sous-titre ("Ryomen Sukuna"), la série n'apparaît qu'en 225/461.
 *   - Les mangas sans correspondance gardent le fallback recherche dans
 *     manga.js ; ils sont listés en fin d'exécution pour ajout manuel.
 *   - Sleep 400 ms entre les requêtes pour rester poli.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'js', 'data.js');
const OUT_FILE = path.join(ROOT, 'js', 'achats.js');
const SRU = 'http://catalogue.bnf.fr/api/SRU';

const args = process.argv.slice(2);
const flags = { ids: null, dry: args.includes('--dry-run') };
for (const a of args) {
  if (a.startsWith('--id=') || a.startsWith('--ids=')) {
    flags.ids = a.split('=')[1].split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isInteger);
  }
}

// Titre de l'édition française quand il diffère de celui du site (la BNF
// ne connaît que le titre FR). Un alias erroné ne produit simplement rien.
const FR_TITLES = {
  4: "L'attaque des titans",
  11: 'Card captor Sakura',
  30: 'Kaiju n° 8',
  32: "Kuroko's basket",
  45: 'Parasite',
  81: '01',
  87: 'Kenshin le vagabond',
  100: 'Inu-Yasha',
  112: 'Le prince du tennis',
  114: 'Rave',
  124: 'Ranma 1/2',
  127: 'Komi cherche ses mots',
  145: 'Valkyrie apocalypse',
  147: 'Negima !',
  154: 'Bonne nuit Punpun',
  163: 'Golden kamui'
};

function loadMangas() {
  const code = fs.readFileSync(DATA_FILE, 'utf8')
    .replace(/^const\s+(mangas|genres)\s*=/m, 'var $1 =')
    .replace(/^const\s+(mangas|genres)\s*=/m, 'var $1 =');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code + '\n;', ctx);
  if (!Array.isArray(ctx.mangas)) throw new Error('Could not extract mangas array from data.js');
  return ctx.mangas;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Nom de famille du premier auteur ("Reki Kawahara / abec" -> "kawahara")
function authorLastName(auteur) {
  const first = (auteur || '').split(/[\/,&]/)[0].trim();
  const parts = first.split(/\s+/);
  return parts[parts.length - 1] || '';
}

// Les livres d'avant 2007 n'ont qu'un ISBN-10 : conversion en ISBN-13.
function isbn10to13(isbn10) {
  if (!/^[0-9]{9}[0-9X]$/i.test(isbn10)) return null;
  const core = '978' + isbn10.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(core[i], 10) * (i % 2 ? 3 : 1);
  return core + ((10 - (sum % 10)) % 10);
}

async function sruQuery(cql, max = 50) {
  const url = `${SRU}?version=1.2&operation=searchRetrieve&query=${encodeURIComponent(cql)}&recordSchema=unimarcxchange&maximumRecords=${max}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'dico-manga-isbn/1.0' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

// Extrait les zones UNIMARC utiles de chaque notice
function parseRecords(xml) {
  const out = [];
  for (const chunk of xml.split('<srw:record>').slice(1)) {
    const fields = {};
    const re = /<mxc:datafield tag="(\d+)"[^>]*>([\s\S]*?)<\/mxc:datafield>/g;
    let m;
    while ((m = re.exec(chunk))) {
      const tag = m[1];
      const subs = {};
      for (const s of m[2].matchAll(/<mxc:subfield code="(.)">([^<]*)<\/mxc:subfield>/g)) {
        if (!(s[1] in subs)) subs[s[1]] = s[2];
      }
      if (!fields[tag]) fields[tag] = [];
      fields[tag].push(subs);
    }
    const f = (tag, code) => (fields[tag] || []).map(s => s[code]).find(Boolean) || '';

    let isbn = f('010', 'a').replace(/-/g, '');
    if (isbn.length === 10) isbn = isbn10to13(isbn) || '';
    const title = f('200', 'a');
    const vol = parseInt((f('200', 'h').match(/\d+/) || [])[0] || '', 10);
    const series = f('225', 'a') || f('461', 't');
    const seriesVol = parseInt(((f('225', 'v') || f('461', 'v')).match(/\d+/) || [])[0] || '', 10);
    const edition = f('205', 'a');
    const publisher = f('214', 'c') || f('210', 'c');
    // Auteur principal (200$f) : permet d'écarter les romans/spin-offs
    // d'autres auteurs ("d'après Gege Akutami" reste en $g).
    const mainAuthor = f('200', 'f');
    const date = parseInt((f('100', 'a').match(/d(\d{4})/) || [])[1] ||
      ((f('214', 'd') || f('210', 'd')).match(/(\d{4})/) || [])[1] || '0', 10);

    // Uniquement les éditions francophones (978-2…) ou France (979-10…) :
    // la BNF référence aussi des imports japonais/anglais.
    if (isbn && /^(9782|97910)/.test(isbn)) {
      out.push({ isbn, title, vol, series, seriesVol, edition, publisher, mainAuthor, date });
    }
  }
  return out;
}

// La notice correspond-elle au tome 1 de ce titre ?
function isTomeOne(rec, titre) {
  const nm = normalize(titre);
  // Série explicite : "Jujutsu kaisen" $v 01 (titre du tome = sous-titre)
  if (normalize(rec.series) === nm && rec.seriesVol === 1) return true;
  // Titre principal + numéro de partie : 200$a "One piece" $h 1
  if (normalize(rec.title) === nm && rec.vol === 1) return true;
  // Tout dans le titre : "Berserk. 1" (anciennes notices)
  const nt = normalize(rec.title);
  if (nt.startsWith(nm + ' ')) {
    const rest = nt.slice(nm.length).trim();
    // "( [^0-9]|$)" rejette les volumes doubles type "1 & 2"
    if (/^(tome |t |vol |volume |livre )?0*1( [^0-9]|$)/.test(rest)) return true;
  }
  return false;
}

// Éditions spéciales (prestige, collector…) : on préfère la standard.
function isSpecialEdition(rec) {
  return /prestige|anniversaire|collector|deluxe|originale|perfect|integrale|eternal|pilier/
    .test(normalize(rec.edition + ' ' + rec.title + ' ' + rec.series));
}

async function findIsbn(manga) {
  const lastName = authorLastName(manga.auteur);
  const titres = [manga.titre, FR_TITLES[manga.id]].filter(Boolean);
  // "{titre} 1" en premier : pour les longues séries, le tome 1 est sinon
  // noyé au-delà des 50 premières notices.
  const queries = titres.flatMap(t => [
    { cql: `bib.title any "${t} 1" and bib.author any "${lastName}"`, titre: t },
    { cql: `bib.title any "${t} 1"`, titre: t },
    { cql: `bib.title any "${t}" and bib.author any "${lastName}"`, titre: t },
    { cql: `bib.title any "${t}"`, titre: t }
  ]);
  // Auteur du manga d'abord (écarte romans/spin-offs), puis édition
  // standard (pas de club type France Loisirs, pas de collector), puis la
  // plus récente (plus de chances d'être encore en vente).
  const isClub = r => /france loisirs/i.test(r.publisher) ? 1 : 0;
  const nLast = normalize(lastName);
  const nFull = normalize((manga.auteur || '').split(/[\/,&]/)[0]);
  // 0 = auteur seul ("Gege Akutami"), 1 = co-crédité (roman "Gege Akutami,
  // Ballad Kitaguni"), 2 = absent — le manga original gagne sur ses dérivés.
  const byAuthor = r => {
    const ra = normalize(r.mainAuthor);
    if (ra === nFull) return 0;
    if (ra.includes(nLast)) return 1;
    return 2;
  };
  for (const { cql, titre } of queries) {
    let xml;
    try { xml = await sruQuery(cql); } catch (e) { continue; }
    const candidates = parseRecords(xml).filter(r => isTomeOne(r, titre));
    if (candidates.length) {
      candidates.sort((a, b) =>
        (byAuthor(a) - byAuthor(b)) ||
        (isClub(a) - isClub(b)) ||
        (isSpecialEdition(a) - isSpecialEdition(b)) ||
        (b.date - a.date));
      return candidates[0];
    }
    await sleep(400);
  }
  return null;
}

async function main() {
  const mangas = loadMangas().filter(m => !flags.ids || flags.ids.includes(m.id));
  // Conserver les ISBN déjà connus si le fichier existe
  const result = {};
  if (fs.existsSync(OUT_FILE)) {
    const m = fs.readFileSync(OUT_FILE, 'utf8').match(/const mangaIsbn = (\{[\s\S]*?\});/);
    if (m) Object.assign(result, JSON.parse(m[1]));
  }
  const missed = [];

  for (const manga of mangas) {
    const found = await findIsbn(manga);
    if (found) {
      result[manga.id] = found.isbn;
      const label = found.series ? `${found.series} ${found.seriesVol || ''} — ${found.title}` : found.title;
      console.log(`[OK]   ${manga.id} ${manga.titre} -> ${found.isbn} (${label.trim()}, ${found.date})`);
    } else {
      missed.push(manga);
      console.log(`[----] ${manga.id} ${manga.titre}`);
    }
    await sleep(400);
  }

  if (!flags.dry) {
    const body = '// Généré par scripts/scrape-isbn.js — ISBN-13 du tome 1 (édition FR, source BNF).\n' +
      '// Utilisé par js/manga.js pour des liens d\'achat directs ; les ids absents\n' +
      '// retombent sur une recherche par titre.\n' +
      'const mangaIsbn = ' + JSON.stringify(result, null, 2) + ';\n';
    fs.writeFileSync(OUT_FILE, body);
    console.log(`\nÉcrit ${OUT_FILE} (${Object.keys(result).length} ISBN)`);
  }
  if (missed.length) {
    console.log(`\nSans correspondance BNF (${missed.length}) :`);
    for (const m of missed) console.log(`  ${m.id} ${m.titre} — ${m.auteur}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
