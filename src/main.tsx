import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register the PWA service worker on HTTP/HTTPS so the browser shows the native Install App prompt
if (
  typeof window !== 'undefined' &&
  (window.location.protocol === 'https:' ||
    window.location.protocol === 'http:')
) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(<App />);
