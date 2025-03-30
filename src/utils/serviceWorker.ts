
/**
 * Service worker registration and cache management
 */

// Check for service worker updates every 30 minutes (in milliseconds)
const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000;

export const registerServiceWorker = async (): Promise<void> => {
  // Only register if service workers are supported
  if ('serviceWorker' in navigator) {
    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registration successful with scope:', registration.scope);
      
      // Set up periodic update checks in production
      if (process.env.NODE_ENV === 'production') {
        setInterval(() => {
          registration.update().catch(error => {
            console.error('Error checking for ServiceWorker updates:', error);
          });
        }, UPDATE_CHECK_INTERVAL);
      }
      
      // Set up update found handler
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user or auto-refresh
              console.log('New content is available, refreshing...');
              window.location.reload();
            }
          });
        }
      });
      
      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'CACHE_CLEARED') {
          console.log('Cache has been cleared by service worker');
        }
      });
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('ServiceWorker unregistered successfully');
    } catch (error) {
      console.error('Error unregistering ServiceWorker:', error);
    }
  }
};

/**
 * Check for service worker updates manually
 */
export const checkForUpdates = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Send message to service worker to check for updates
      if (registration.active) {
        registration.active.postMessage({ action: 'CHECK_UPDATE' });
      }
      
      // Trigger update check
      await registration.update();
      console.log('Checked for service worker updates');
      return true;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }
  return false;
};

/**
 * Clear all application caches to ensure latest content is loaded
 */
export const clearAppCache = async (): Promise<boolean> => {
  // Try different cache clearing approaches for maximum compatibility
  let success = false;
  
  try {
    // 1. Clear Cache API caches
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map(cacheName => caches.delete(cacheName))
      );
      success = true;
      console.log('Successfully cleared Cache API caches');
    }
    
    // 2. Notify service worker to clear caches if active
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ 
        action: 'CLEAR_CACHES' 
      });
      success = true;
    }
    
    // 3. For Safari and other browsers that might handle caching differently
    // Set no-cache headers for future requests
    if ('fetch' in window) {
      // Create a no-op fetch with cache-busting headers to update browser's notion of the resource
      fetch(window.location.href, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).catch(() => {}); // Ignore errors, this is just to help with cache busting
    }
    
    // 4. Force reload the page with cache bypass
    setTimeout(() => {
      window.location.reload();
    }, 300);
    
    return success;
  } catch (error) {
    console.error('Failed to clear caches:', error);
    
    // As a last resort, try to force reload with cache busting
    window.location.href = window.location.href + (window.location.href.includes('?') ? '&' : '?') + 'nocache=' + Date.now();
    
    return false;
  }
};
