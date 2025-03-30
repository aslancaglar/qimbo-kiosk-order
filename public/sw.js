
// Cache version - increment this when deploying new versions
const CACHE_NAME = 'restaurant-app-v4';

// Assets to cache on install - minimal critical assets only
const CACHE_ASSETS = [
  '/favicon.ico',
  '/notification.mp3',
  '/placeholder.svg'
];

// Install event - cache minimal assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install - caching disabled');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Only cache minimal assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching minimal assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .catch(err => console.error('[ServiceWorker] Cache install error:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate - removing old caches');
  
  // Clear all old versions of caches immediately
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
    console.log('[ServiceWorker] Clearing all caches per request');
    self.skipWaiting();
    event.waitUntil(
      caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
          console.log('[ServiceWorker] Clearing cache', key);
          return caches.delete(key);
        }));
      }).then(() => {
        // Notify clients that cache is cleared
        self.clients.matchAll().then(clients => {
          clients.forEach(client => client.postMessage({
            action: 'CACHE_CLEARED'
          }));
        });
      })
    );
  } else if (event.data && event.data.action === 'CHECK_UPDATE') {
    // Force check for updates
    console.log('[ServiceWorker] Checking for updates');
    self.skipWaiting();
    self.clients.claim();
  }
});

// Fetch event - use network-first strategy for ALL requests to prevent caching
self.addEventListener('fetch', (event) => {
  // Skip for non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Use network-first strategy for all requests
  event.respondWith(
    fetch(event.request, {
      // Add cache-busting headers
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // Don't use any cached version
      cache: 'no-store'
    })
    .then(response => {
      return response;
    })
    .catch(() => {
      // If network fails, try to serve from cache as fallback
      return caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('[ServiceWorker] Serving from cache as fallback:', event.request.url);
            return cachedResponse;
          }
          
          // For HTML, try to serve the index as fallback
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
          
          return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
    })
  );
});
