
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker, clearAppCache, checkForUpdates } from './utils/serviceWorker';

// Make cache clearing and update checking functions available globally for debugging
if (process.env.NODE_ENV !== 'production') {
  (window as any).clearAppCache = clearAppCache;
  (window as any).checkForUpdates = checkForUpdates;
}

// Performance measurements
if (process.env.NODE_ENV !== 'production') {
  console.log('React version:', React.version);
  console.time('App render');
}

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

// Setup frequent update checks
const checkInterval = 1 * 60 * 1000; // 1 minute (reduced from 2 minutes)
// Check for updates after initial load
window.addEventListener('load', () => {
  setTimeout(() => {
    checkForUpdates().catch(console.error);
  }, 5000); // Check after 5 seconds (reduced from 10 seconds)
  
  // Setup regular checking interval
  setInterval(() => {
    checkForUpdates().catch(console.error);
  }, checkInterval);
});

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
