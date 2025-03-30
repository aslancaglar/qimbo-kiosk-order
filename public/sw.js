
// Cache version - change this when assets change
const CACHE_NAME = 'restaurant-app-v2';

// Assets to cache on install
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/notification.mp3',
  '/placeholder.svg'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(CACHE_ASSETS);
      })
      .catch(err => console.error('[ServiceWorker] Cache install error:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  
  // Ensure service worker takes control immediately
  return self.clients.claim();
});

// Message handler for cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'CLEAR_CACHES') {
    self.skipWaiting();
    event.waitUntil(
      caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
          console.log('[ServiceWorker] Clearing cache', key);
          return caches.delete(key);
        }));
      })
    );
  }
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip for API requests, supabase calls, etc.
  if (event.request.url.includes('/rest/v1/') || 
      event.request.url.includes('/auth/') ||
      event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Otherwise, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache responses that aren't successful
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // For successful responses, clone and cache
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          })
          .catch(err => {
            console.error('[ServiceWorker] Fetch failed:', err);
            // Offline fallback if available
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});
