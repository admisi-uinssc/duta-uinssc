import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Styles
import './styles/globals.css';
import './styles/landing.css';
import './styles/form.css';
import './styles/admin.css';

const basename = typeof window !== 'undefined' && window.location.pathname.startsWith('/duta-uinssc') 
  ? '/duta-uinssc' 
  : '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Capture native PWA install prompt globally so it is always ready on demand
if (typeof window !== 'undefined') {
  window.deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    window.dispatchEvent(new Event('pwa-prompt-ready'));
  });
  window.addEventListener('appinstalled', () => {
    window.deferredPrompt = null;
    window.dispatchEvent(new Event('pwa-app-installed'));
  });
}

// Register Service Worker for PWA mobile install with active update listener
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = (basename === '/' ? '' : basename) + '/sw.js';
    navigator.serviceWorker.register(swPath).then((reg) => {
      // Actively check for GitHub / server updates on load
      reg.update().catch(() => {});

      // Check on window focus as well
      window.addEventListener('focus', () => {
        reg.update().catch(() => {});
      });

      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          };
        }
      };
    }).catch(() => {});

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

