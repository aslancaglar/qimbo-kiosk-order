
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker, clearAppCache, checkForUpdates, unregisterServiceWorker } from './utils/serviceWorker';

// Make cache clearing and update checking functions available globally for debugging
if (process.env.NODE_ENV !== 'production') {
  (window as any).clearAppCache = clearAppCache;
  (window as any).checkForUpdates = checkForUpdates;
  (window as any).unregisterServiceWorker = unregisterServiceWorker;
}

// Global error handler for script loading failures
window.addEventListener('error', (event) => {
  const error = event.error || new Error(event.message);
  if (event.message?.includes('module script failed') || event.message?.includes('importing module')) {
    console.error('Module loading error detected:', error);
    
    // Try to recover by clearing cache and reloading
    if (!sessionStorage.getItem('module_error_recovery')) {
      console.log('Attempting recovery from module loading error...');
      sessionStorage.setItem('module_error_recovery', 'true');
      
      // Unregister service worker and clear cache before reload
      unregisterServiceWorker().then(() => {
        clearAppCache();
      });
    } else {
      // If we've already tried recovery once, don't try again to avoid loops
      console.error('Module loading error persists after recovery attempt.');
      sessionStorage.removeItem('module_error_recovery');
      
      // Show a user-friendly error message
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.innerHTML = `
          <div style="padding: 2rem; text-align: center; font-family: system-ui, sans-serif;">
            <h2 style="color: #e11d48;">Unable to load application</h2>
            <p>We're experiencing technical difficulties. Please try:</p>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 1rem 0;">
                <button onclick="window.location.reload(true)" style="padding: 0.5rem 1rem; background: #2563eb; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
                  Refresh the page
                </button>
              </li>
              <li style="margin: 1rem 0;">
                <button onclick="localStorage.clear(); window.location.href='/'" style="padding: 0.5rem 1rem; background: #4b5563; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
                  Clear data & restart
                </button>
              </li>
            </ul>
          </div>
        `;
      }
    }
  }
}, true);

// Performance measurements
if (process.env.NODE_ENV !== 'production') {
  console.log('React version:', React.version);
  console.time('App render');
}

try {
  // Create root with concurrent mode
  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

  // Render with error boundary
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Register service worker
  registerServiceWorker().catch(console.error);

  // Setup periodic update checks in production
  if (process.env.NODE_ENV === 'production') {
    // Check for updates after initial load
    window.addEventListener('load', () => {
      setTimeout(() => {
        checkForUpdates().catch(console.error);
      }, 10000); // Check after 10 seconds
    });
  }
} catch (error) {
  console.error('Fatal error during app initialization:', error);
  // Attempt recovery
  clearAppCache();
}

// End performance measurement
if (process.env.NODE_ENV !== 'production') {
  window.addEventListener('load', () => {
    console.timeEnd('App render');
    
    // Log core web vitals
    setTimeout(() => {
      if ('performance' in window) {
        const perfEntries = performance.getEntriesByType('navigation');
        if (perfEntries.length > 0) {
          const timing = perfEntries[0] as PerformanceNavigationTiming;
          console.log('Load time:', Math.round(timing.loadEventEnd - timing.startTime), 'ms');
          console.log('DOM Content Loaded:', Math.round(timing.domContentLoadedEventEnd - timing.startTime), 'ms');
        }
      }
    }, 1000);
  });
}
