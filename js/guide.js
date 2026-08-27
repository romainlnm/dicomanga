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

function startGuide() {
  endGuide();
  guideIndex = 0;
  const overlay = document.createElement('div');
  overlay.className = 'guide-overlay';
  overlay.innerHTML = `
    <div class="guide-spotlight" id="guideSpotlight"></div>
    <div class="guide-companion" id="guideCompanion">
      <div class="guide-dicomi" id="guideDicomi">${GUIDE_MASCOT}</div>
      <div class="guide-bubble" id="guideBubble" role="dialog" aria-live="polite">
        <h3 id="guideTitle"></h3>
        <p id="guideText"></p>
        <div class="guide-actions">
          <button type="button" class="guide-btn-skip" id="guideSkip"></button>
          <div class="guide-dots" id="guideDots"></div>
          <button type="button" class="guide-btn-next" id="guideNext"></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.classList.add('guide-open');

  overlay.querySelector('#guideSkip').onclick = endGuide;
  overlay.querySelector('#guideNext').onclick = () => {
    const steps = guideSteps().filter(s => guideVisible(s.target));
    if (guideIndex >= steps.length - 1) { endGuide(); return; }
    guideIndex++;
    showGuideStep();
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.querySelector('#guideNext').click();
  });
  document.addEventListener('keydown', onGuideKey);
  window.addEventListener('resize', showGuideStep);
  guideEls = overlay;

  // Précharger toutes les poses pour des changements instantanés
  Object.values(GUIDE_POSES).forEach(src => { const im = new Image(); im.src = src; });

  // Position de départ : Dicomi décolle depuis son bouton (en bas à gauche)
  const comp = overlay.querySelector('#guideCompanion');
  comp.style.left = '20px';
  comp.style.top = (window.innerHeight - 200) + 'px';

  showGuideStep();
}

function onGuideKey(e) {
  if (e.key === 'Escape') { endGuide(); return; }
  if (e.key === 'ArrowRight' || e.key === 'Enter') {
    // Si un bouton du guide a le focus, son clic natif suffit (évite la double avance)
    if (e.key === 'Enter' && document.activeElement && document.activeElement.closest('.guide-bubble')) return;
    const next = document.getElementById('guideNext');
    if (next) next.click();
  }
}

function endGuide() {
  if (guideEls) { guideEls.remove(); guideEls = null; }
  document.body.classList.remove('guide-open');
  document.removeEventListener('keydown', onGuideKey);
  window.removeEventListener('resize', showGuideStep);
  localStorage.setItem(GUIDE_DONE_KEY, '1');
}

let guideFlyTimer = null;

function showGuideStep() {
  if (!guideEls) return;
  const fr = guideLang() === 'fr';
  const steps = guideSteps().filter(s => guideVisible(s.target));
  const step = steps[Math.min(guideIndex, steps.length - 1)];
  const last = guideIndex >= steps.length - 1;

  const spot = document.getElementById('guideSpotlight');
  const comp = document.getElementById('guideCompanion');

  // Changement d'expression : nouvelle pose + petit rebond de jeu vidéo
  const dicoImg = comp.querySelector('.guide-dicomi img');
  const poseSrc = GUIDE_POSES[step.pose || 'full'];
  comp.classList.toggle('guide-pose-full', (step.pose || 'full') === 'full');
  if (dicoImg && !dicoImg.src.endsWith(poseSrc)) {
    dicoImg.src = poseSrc;
    dicoImg.classList.remove('guide-pop');
    void dicoImg.offsetWidth; // relancer l'animation
    dicoImg.classList.add('guide-pop');
  }

  document.getElementById('guideTitle').textContent = step.title;
  document.getElementById('guideText').textContent = step.text;
  document.getElementById('guideSkip').textContent = fr ? 'Passer' : 'Skip';
  document.getElementById('guideNext').textContent = last ? (fr ? 'Terminer' : 'Done')
    : guideIndex === 0 ? (fr ? 'C’est parti !' : 'Let’s go!') : (fr ? 'Suivant' : 'Next');
  document.getElementById('guideDots').innerHTML = steps
    .map((_, i) => `<span class="guide-dot${i === guideIndex ? ' active' : ''}"></span>`).join('');

  const flyTo = (left, top) => {
    // Vol : légère inclinaison dans le sens du déplacement pendant la transition
    const fromLeft = parseFloat(comp.style.left) || 0;
    comp.classList.remove('guide-fly-left', 'guide-fly-right');
    comp.classList.add(left >= fromLeft ? 'guide-fly-right' : 'guide-fly-left');
    comp.style.left = left + 'px';
    comp.style.top = top + 'px';
    clearTimeout(guideFlyTimer);
    guideFlyTimer = setTimeout(() => {
      comp.classList.remove('guide-fly-left', 'guide-fly-right');
    }, 900);
  };

  const positionCompanion = () => {
    const isPhone = window.innerWidth <= 640;
    const gw = comp.offsetWidth || 400;
    const gh = comp.offsetHeight || 180;

    if (!step.target) {
      spot.style.opacity = '0';
      spot.style.width = '0'; spot.style.height = '0';
      flyTo(Math.max(12, (window.innerWidth - gw) / 2), Math.max(12, window.innerHeight * 0.4 - gh / 2));
      return;
    }
    const el = document.querySelector(step.target);
    const r = el.getBoundingClientRect();
    const pad = 8;
    // Projecteur borné au viewport (les très grands blocs, ex. la grille)
    const sx = Math.max(r.left - pad, 4);
    const sy = Math.max(r.top - pad, 4);
    const sw = Math.min(r.right + pad, window.innerWidth - 4) - sx;
    const sh = Math.min(r.bottom + pad, window.innerHeight - 4) - sy;
    spot.style.opacity = '1';
    spot.style.left = sx + 'px';
    spot.style.top = sy + 'px';
    spot.style.width = sw + 'px';
    spot.style.height = sh + 'px';

    if (isPhone) {
      // Sur téléphone : Dicomi + bulle posées au-dessus de la barre de nav
      flyTo(12, window.innerHeight - gh - 100);
      return;
    }
    // Desktop : sous la cible si possible, sinon au-dessus, sans sortir de l'écran
    let top = r.bottom + 20;
    if (top + gh > window.innerHeight - 14) top = Math.max(14, r.top - gh - 20);
    let left = Math.max(14, Math.min(r.left + r.width / 2 - gw / 2, window.innerWidth - gw - 14));
    flyTo(left, top);
  };

  if (step.target) {
    const el = document.querySelector(step.target);
    if (el.closest('header') || el.closest('.bottom-nav')) {
      // Éléments fixes/sticky : ne pas utiliser scrollIntoView (comportement erratique)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (el.getBoundingClientRect().height > window.innerHeight * 0.7) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Deux passes : pendant puis après la fin du défilement
    setTimeout(positionCompanion, 450);
    setTimeout(positionCompanion, 1100);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(positionCompanion, 60);
  }
}

// Bouton flottant : Dicomi + petite bulle d'invitation
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
