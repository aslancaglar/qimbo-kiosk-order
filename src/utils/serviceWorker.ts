
/**
 * Service worker registration and cache management
 */

// Check for service worker updates every 30 minutes (in milliseconds)
const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000;

export const registerServiceWorker = async (): Promise<void> => {
  // Only register if service workers are supported
  if ('serviceWorker' in navigator) {
    try {
      // Unregister any existing service workers first to avoid conflicts
      await unregisterServiceWorker();
      
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        // Set up a wider scope and update on reload
        scope: '/',
        updateViaCache: 'none'
      });
      
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
      // On service worker error, make sure we can still run without it
      console.warn('Continuing without service worker due to registration failure');
    }
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('All ServiceWorkers unregistered successfully');
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
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        // No registered service worker, try to register again
        await registerServiceWorker();
        return true;
      }
      
      // Update all registered service workers
      for (const registration of registrations) {
        if (registration.active) {
          registration.active.postMessage({ action: 'CHECK_UPDATE' });
        }
        await registration.update();
      }
      
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
    
    // 3. Clear module script cache by forcing a hard reload
    // This is more aggressive but should fix module loading issues
    const cacheBustUrl = new URL(window.location.href);
    cacheBustUrl.searchParams.set('cache_bust', Date.now().toString());
    
    // Set a flag in sessionStorage to avoid infinite reload loop
    if (!sessionStorage.getItem('cache_cleared')) {
      sessionStorage.setItem('cache_cleared', 'true');
      
      console.log('Performing hard reload to clear module cache');
      window.location.href = cacheBustUrl.toString();
      return true;
    } else {
      // Reset flag after one reload
      sessionStorage.removeItem('cache_cleared');
    }
    
    return success;
  } catch (error) {
    console.error('Failed to clear caches:', error);
    
    // As a last resort, try to force reload with cache busting
    if (!sessionStorage.getItem('force_reload')) {
      sessionStorage.setItem('force_reload', 'true');
      window.location.reload();
      return true;
    } else {
      sessionStorage.removeItem('force_reload');
      return false;
    }
  }
};
