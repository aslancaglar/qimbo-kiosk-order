
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set the viewport meta tag to cover the full screen and respect safe areas
if (document.querySelector('meta[name="viewport"]') === null) {
  const viewport = document.createElement('meta');
  viewport.name = 'viewport';
  viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
  document.head.appendChild(viewport);
}

createRoot(document.getElementById("root")!).render(<App />);
