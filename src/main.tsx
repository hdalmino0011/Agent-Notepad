import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register the PWA service worker immediately so the browser shows the native Install App prompt
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
