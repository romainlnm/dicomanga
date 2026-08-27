// ===== GUIDE DE BIENVENUE =====
// Dicomi, la mascotte du site, guide les nouveaux visiteurs à travers le
// site : projecteur sur chaque zone + bulle d'explication. Se lance tout
// seul à la première visite (localStorage), rejouable via le bouton flottant.

const GUIDE_DONE_KEY = 'dicoGuideDone';

// Dicomi, la mascotte officielle (illustrations fournies par Romain, fond
// détouré). Une pose par étape, comme un personnage de jeu vidéo.
const GUIDE_POSES = {
  full:     'images/mascot/dicomi-full.png',
  ravie:    'images/mascot/dicomi-ravie.png',
  pense:    'images/mascot/dicomi-pense.png',
  tropbien: 'images/mascot/dicomi-tropbien.png',
  lecture:  'images/mascot/dicomi-lecture.png',
  coeur:    'images/mascot/dicomi-coeur.png',
  surprise: 'images/mascot/dicomi-surprise.png'
};
const GUIDE_MASCOT = `<img src="${GUIDE_POSES.full}" alt="" class="guide-mascot-svg" draggable="false">`;

function guideLang() {
  const l = (typeof currentLang !== 'undefined' && currentLang) || localStorage.getItem('lang') || 'fr';
  return l === 'fr' ? 'fr' : 'en';
}

function guideSteps() {
  const fr = guideLang() === 'fr';
  return [
    {
      target: null,
      pose: 'full',
      title: fr ? 'Bienvenue sur DicoManga !' : 'Welcome to DicoManga!',
      text: fr
        ? "Moi c'est Dicomi, la guide de tous les mondes manga ✨ Je te fais visiter ? C'est rapide, promis !"
        : "I'm Dicomi, your guide through every manga world ✨ Want a quick tour? It'll be fast, promise!"
    },
    {
      target: '.search-container',
      pose: 'pense',
      title: fr ? 'La recherche' : 'Search',
      text: fr
        ? 'Tape un titre, un auteur ou un genre — les résultats apparaissent instantanément. Tu peux même chercher à la voix 🎙️'
        : 'Type a title, author or genre — results appear instantly. Voice search works too 🎙️'
    },
    {
      target: '#genreDropdown',
      pose: 'surprise',
      title: fr ? 'Les filtres' : 'Filters',
      text: fr
        ? 'Filtre par genre ici, et ouvre les filtres avancés juste à côté pour trier par note, année ou statut.'
        : 'Filter by genre here, and open advanced filters next door to sort by rating, year or status.'
    },
    {
      target: '#mangaDuJourSection',
      pose: 'coeur',
      title: fr ? 'Le manga du jour' : 'Manga of the day',
      text: fr
        ? 'Chaque jour, une œuvre mise en avant pour te faire découvrir de nouvelles pépites.'
        : 'Every day, one featured work to help you discover hidden gems.'
    },
    {
      target: '.manga-grid',
      pose: 'lecture',
      title: fr ? 'La bibliothèque' : 'The library',
      text: fr
        ? "172 mangas t'attendent ! Clique sur une carte pour la fiche complète : tomes, personnages, avis, liens d'achat…"
        : '172 manga await! Click any card for the full page: volumes, characters, reviews, buy links…'
    },
    {
      target: '#collectionGroup',
      pose: 'tropbien',
      title: fr ? 'Ta collection' : 'Your collection',
      text: fr
        ? 'Tes favoris ⭐, ta liste à lire 📚 et tes listes personnalisées vivent ici. Crée un compte pour tout synchroniser.'
        : 'Your favorites ⭐, reading list 📚 and custom lists live here. Create an account to sync everything.'
    },
    {
      target: '#settingsBtn',
      pose: 'pense',
      title: fr ? 'Les réglages' : 'Settings',
      text: fr
        ? '16 thèmes (Néon Tokyo, Sakura, Terminal…), 4 langues et un studio de couleurs pour tout personnaliser.'
        : '16 themes (Neon Tokyo, Sakura, Terminal…), 4 languages and a color studio to make it yours.'
    },
    {
      target: window.innerWidth <= 768 ? '.bottom-nav' : 'a[href="calendrier.html"]',
      pose: 'surprise',
      title: fr ? 'Sorties & statistiques' : 'Releases & stats',
      text: fr
        ? 'Le calendrier des sorties 2026 et tes statistiques de lecture sont à un tap d\'ici.'
        : 'The 2026 release calendar and your reading stats are one tap away.'
    },
    {
      target: null,
      pose: 'ravie',
      title: fr ? 'À toi de jouer !' : 'Your turn!',
      text: fr
        ? 'Tu peux me retrouver en bas à gauche si tu veux revoir la visite. Bonne lecture ! 📖'
        : 'You can find me in the bottom-left corner to replay the tour anytime. Happy reading! 📖'
    }
  ];
}

let guideIndex = 0;
let guideEls = null;

function guideVisible(sel) {
  if (!sel) return true;
  const el = document.querySelector(sel);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
}

let guideTyping = null; // interval de la machine à écrire

function startGuide() {
  endGuide();
  guideIndex = 0;
  const overlay = document.createElement('div');
  overlay.className = 'guide-overlay';
  overlay.innerHTML = `
    <div class="guide-spotlight" id="guideSpotlight"></div>
    <div class="guide-dicomi" id="guideDicomi">${GUIDE_MASCOT}</div>
    <div class="guide-banner" id="guideBanner" aria-hidden="true"></div>
    <div class="guide-dialogue" role="dialog" aria-live="polite">
      <div class="guide-dlg-top">
        <div class="guide-dots" id="guideDots"></div>
        <button type="button" class="guide-skip" id="guideSkip"></button>
      </div>
      <div class="guide-dlg-name">Dicomi</div>
      <p class="guide-dlg-text" id="guideText"></p>
      <div class="guide-dlg-next" id="guideNext" aria-hidden="true"></div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.classList.add('guide-open');

  overlay.querySelector('#guideSkip').onclick = (e) => { e.stopPropagation(); endGuide(); };
  // Comme dans le jeu : cliquer n'importe où avance (1er clic = texte complet,
  // 2e clic = réplique suivante)
  overlay.addEventListener('click', guideAdvance);
  document.addEventListener('keydown', onGuideKey);
  window.addEventListener('resize', showGuideStep);
  guideEls = overlay;

  // Précharger toutes les poses
  Object.values(GUIDE_POSES).forEach(src => { const im = new Image(); im.src = src; });

  // Dicomi décolle depuis son bouton
  const dico = overlay.querySelector('#guideDicomi');
  dico.style.left = '20px';
  dico.style.top = (window.innerHeight - 240) + 'px';

  showGuideStep();
}

function guideAdvance() {
  if (!guideEls) return;
  const steps = guideSteps().filter(s => guideVisible(s.target));
  const step = steps[Math.min(guideIndex, steps.length - 1)];
  const textEl = document.getElementById('guideText');
  if (guideTyping) {
    // Texte en cours d'écriture : l'afficher en entier
    clearInterval(guideTyping);
    guideTyping = null;
    textEl.textContent = step.text;
    document.querySelector('.guide-dialogue').classList.add('guide-dlg-done');
    return;
  }
  if (guideIndex >= steps.length - 1) { endGuide(); return; }
  guideIndex++;
  showGuideStep();
}

function onGuideKey(e) {
  if (e.key === 'Escape') { endGuide(); return; }
  if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    guideAdvance();
  }
}

function endGuide() {
  if (guideTyping) { clearInterval(guideTyping); guideTyping = null; }
  if (guideEls) { guideEls.remove(); guideEls = null; }
  document.body.classList.remove('guide-open');
  document.removeEventListener('keydown', onGuideKey);
  window.removeEventListener('resize', showGuideStep);
  localStorage.setItem(GUIDE_DONE_KEY, '1');
}

function showGuideStep() {
  if (!guideEls) return;
  const fr = guideLang() === 'fr';
  const steps = guideSteps().filter(s => guideVisible(s.target));
  const step = steps[Math.min(guideIndex, steps.length - 1)];
  const last = guideIndex >= steps.length - 1;

  const spot = document.getElementById('guideSpotlight');
  const dico = document.getElementById('guideDicomi');
  const dlg = document.querySelector('.guide-dialogue');

  // Pose + rebond de sprite
  const dicoImg = dico.querySelector('img');
  const poseSrc = GUIDE_POSES[step.pose || 'full'];
  dico.classList.toggle('guide-pose-full', (step.pose || 'full') === 'full');
  if (dicoImg && !dicoImg.src.endsWith(poseSrc)) {
    dicoImg.src = poseSrc;
    dicoImg.classList.remove('guide-pop');
    void dicoImg.offsetWidth;
    dicoImg.classList.add('guide-pop');
  }

  // Bannière de titre (façon "zone découverte")
  const banner = document.getElementById('guideBanner');
  banner.textContent = step.title;
  banner.classList.remove('show');
  void banner.offsetWidth;
  banner.classList.add('show');

  // Boutons / points
  document.getElementById('guideSkip').textContent = fr ? 'Passer la visite' : 'Skip the tour';
  document.getElementById('guideDots').innerHTML = steps
    .map((_, i) => `<span class="guide-dot${i === guideIndex ? ' active' : ''}"></span>`).join('');
  document.getElementById('guideNext').classList.toggle('guide-last', last);

  // Machine à écrire
  if (guideTyping) { clearInterval(guideTyping); guideTyping = null; }
  const textEl = document.getElementById('guideText');
  textEl.textContent = '';
  dlg.classList.remove('guide-dlg-done');
  let i = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    textEl.textContent = step.text;
    dlg.classList.add('guide-dlg-done');
  } else {
    guideTyping = setInterval(() => {
      i++;
      textEl.textContent = step.text.slice(0, i);
      if (i >= step.text.length) {
        clearInterval(guideTyping);
        guideTyping = null;
        dlg.classList.add('guide-dlg-done');
      }
    }, 20);
  }

  // Vol de Dicomi vers la cible
  const flyTo = (left, top) => {
    const fromLeft = parseFloat(dico.style.left) || 0;
    dico.classList.remove('guide-fly-left', 'guide-fly-right');
    dico.classList.add(left >= fromLeft ? 'guide-fly-right' : 'guide-fly-left');
    dico.style.left = left + 'px';
    dico.style.top = top + 'px';
    clearTimeout(guideFlyTimer);
    guideFlyTimer = setTimeout(() => dico.classList.remove('guide-fly-left', 'guide-fly-right'), 900);
  };

  const positionDicomi = () => {
    const w = dico.offsetWidth || 130;
    const h = dico.offsetHeight || 170;
    const dlgTop = window.innerHeight - (dlg.offsetHeight || 210) - 10;

    if (!step.target) {
      spot.style.opacity = '0';
      spot.style.width = '0'; spot.style.height = '0';
      flyTo((window.innerWidth - w) / 2, Math.max(14, dlgTop - h - 24));
      return;
    }
    const el = document.querySelector(step.target);
    const r = el.getBoundingClientRect();
    const pad = 8;
    const sx = Math.max(r.left - pad, 4);
    const sy = Math.max(r.top - pad, 4);
    const sw = Math.min(r.right + pad, window.innerWidth - 4) - sx;
    const sh = Math.min(r.bottom + pad, window.innerHeight - 4) - sy;
    spot.style.opacity = '1';
    spot.style.left = sx + 'px';
    spot.style.top = sy + 'px';
    spot.style.width = sw + 'px';
    spot.style.height = sh + 'px';

    // Elle se place sous la cible (au-dessus si pas la place), jamais sur le dialogue
    let top = sy + sh + 14;
    if (top + h > dlgTop) top = sy - h - 14;
    top = Math.max(10, Math.min(top, dlgTop - h - 6));
    let left = Math.max(12, Math.min(sx + sw / 2 - w / 2, window.innerWidth - w - 12));
    flyTo(left, top);
  };

  if (step.target) {
    const el = document.querySelector(step.target);
    if (el.closest('header') || el.closest('.bottom-nav')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (el.getBoundingClientRect().height > window.innerHeight * 0.7) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(positionDicomi, 450);
    setTimeout(positionDicomi, 1100);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(positionDicomi, 60);
  }
}

// Bouton flottant : Dicomi + bulle d'invitation
function createGuideFab() {
  const fr = guideLang() === 'fr';
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'guide-fab';
  fab.title = fr ? 'Faire la visite guidée avec Dicomi' : 'Take the guided tour with Dicomi';
  fab.setAttribute('aria-label', fab.title);
  fab.innerHTML = GUIDE_MASCOT + `<span class="guide-fab-hint">${fr ? 'On fait le tour ? ✨' : 'Wanna look around? ✨'}</span>`;
  fab.onclick = startGuide;
  document.body.appendChild(fab);
}

document.addEventListener('DOMContentLoaded', () => {
  createGuideFab();
  if (!localStorage.getItem(GUIDE_DONE_KEY)) {
    setTimeout(startGuide, 1400);
  }
});
