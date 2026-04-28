// Service Worker pour Dico.Manga - Mode hors-ligne
const CACHE_NAME = 'dico-manga-v34';

// Fichiers à mettre en cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manga.html',
  '/stats.html',
  '/privacy.html',
  '/manifest.json',
  '/css/style.css',
  '/js/app.js',
  '/js/manga.js',
  '/js/stats.js',
  '/js/data.js',
  '/js/translations.js',
  '/js/chat.js',
  '/js/auth.js',
  '/js/sync.js',
  '/js/supabase-config.js',
  '/js/comments.js',
  '/images/logo.svg',
  '/images/favicon.svg'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache : Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // Ignorer les requêtes vers d'autres domaines (images externes)
  const url = new URL(event.request.url);

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la requête réussit, mettre en cache et retourner
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Ne mettre en cache que les ressources locales
            if (url.origin === location.origin) {
              cache.put(event.request, responseClone);
            }
          });
        }
        return response;
      })
      .catch(() => {
        // Si le réseau échoue, chercher dans le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Page hors-ligne par défaut pour les pages HTML
          const acceptHeader = event.request.headers.get('accept') || '';
          if (acceptHeader.includes('text/html')) {
            return caches.match('/index.html');
          }
          // Retourner une réponse vide pour les autres ressources non trouvées
          return new Response('', { status: 404, statusText: 'Not Found' });
        });
      })
  );
});
