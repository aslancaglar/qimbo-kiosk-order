
/**
 * Service worker registration for asset caching
 */

export const registerServiceWorker = async (): Promise<void> => {
  // Only register in production and if service workers are supported
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('ServiceWorker registration successful with scope:', registration.scope);
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
 * Clear all application caches to ensure latest content is loaded
 */
export const clearAppCache = async (): Promise<boolean> => {
  if ('caches' in window) {
    try {
      // Get all cache keys
      const cacheKeys = await caches.keys();
      
      // Delete all caches
      await Promise.all(
        cacheKeys.map(cacheName => caches.delete(cacheName))
      );
      
      console.log('Successfully cleared all application caches');
      
      // Reload the page to ensure fresh content
      window.location.reload();
      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  } else {
    console.warn('Cache API not supported in this browser');
    return false;
  }
};
