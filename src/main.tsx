
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { registerServiceWorker } from './utils/serviceWorker';

// Performance measurements
if (process.env.NODE_ENV !== 'production') {
  console.log('React version:', React.version);
  console.time('App render');
}

// Create root with concurrent mode
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// Render with error boundary and BrowserRouter
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker for production
registerServiceWorker().catch(console.error);

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
