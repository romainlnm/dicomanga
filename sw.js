// Service Worker pour Dico.Manga - Mode hors-ligne
const CACHE_NAME = 'dico-manga-v51';
const IMAGE_CACHE = 'dico-manga-img-v1';

// Fichiers à mettre en cache dès l'installation
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manga.html',
  '/calendrier.html',
  '/stats.html',
  '/privacy.html',
  '/manifest.json',
  '/css/style.css',
  '/js/theme.js',
  '/js/app.js',
  '/js/manga.js',
  '/js/manga-slugs.js',
  '/js/stats.js',
  '/js/calendar.js',
  '/js/calendar-2026.js',
  '/js/data.js',
  '/js/achats.js',
  '/js/translations.js',
  '/js/chat.js',
  '/js/auth.js',
  '/js/sync.js',
  '/js/supabase-config.js',
  '/js/comments.js',
  '/js/emoji-picker.js',
  '/images/logo.svg',
  '/images/favicon.svg',
  '/images/icon-192.png',
  '/images/icon-512.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Les couvertures/tomes/portraits ne changent presque jamais : on sert le
// cache immédiatement (affichage instantané, zéro réseau) et on rafraîchit
// en arrière-plan (stale-while-revalidate).
function handleImage(request) {
  return caches.open(IMAGE_CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      const fetchAndUpdate = fetch(request)
        .then((response) => {
          if (response.status === 200) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || fetchAndUpdate;
    })
  );
}

// HTML / JS / CSS : Network First, fallback cache (toujours frais en ligne,
// disponible hors-ligne).
function handleDefault(request) {
  return fetch(request)
    .then((response) => {
      if (response.status === 200) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
      }
      return response;
    })
    .catch(() => {
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        const acceptHeader = request.headers.get('accept') || '';
        if (acceptHeader.includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('', { status: 404, statusText: 'Not Found' });
      });
    });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Ne pas intercepter les requêtes vers d'autres domaines (Supabase, CDN…)
  if (url.origin !== location.origin) return;

  const isImage = event.request.destination === 'image' ||
    /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(url.pathname);

  event.respondWith(isImage ? handleImage(event.request) : handleDefault(event.request));
});
