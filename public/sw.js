
// Cache version - increment this when deploying new versions
const CACHE_NAME = 'restaurant-app-v4';

// Assets to cache on install
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon.svg',
  '/manifest.json',
  '/notification.mp3',
  '/placeholder.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
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
  
  // Clear old versions of caches immediately
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

// Fetch event - serve from cache, fall back to network, with network-first strategy for HTML
self.addEventListener('fetch', (event) => {
  // Skip for API requests, supabase calls, etc.
  if (event.request.url.includes('/rest/v1/') || 
      event.request.url.includes('/auth/') ||
      event.request.method !== 'GET') {
    return;
  }
  
  // For HTML pages, use network-first strategy to ensure fresh content
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }
  
  // For other assets, try cache first, then network
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
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});

// Add PWA offline page fetch capability
self.addEventListener('fetch', function(event) {
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && 
       event.request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(event.request).catch(error => {
        // Return the offline page
        return caches.match('/');
      })
    );
  }
});
