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
  // Global Asset Protection: cegah klik kanan (contextmenu) pada gambar, video, dan media
  document.addEventListener('contextmenu', (e) => {
    const target = e.target;
    if (
      target &&
      (target.tagName === 'IMG' ||
        target.tagName === 'VIDEO' ||
        target.closest('img') ||
        target.closest('video') ||
        target.closest('.ambassador-img-wrapper') ||
        target.closest('.gallery-item') ||
        target.closest('.promo-image-wrapper') ||
        target.closest('.slide-img'))
    ) {
      e.preventDefault();
      return false;
    }
  }, { capture: true });

  // Cegah drag and drop gambar / video ke desktop atau browser tab baru
  document.addEventListener('dragstart', (e) => {
    const target = e.target;
    if (
      target &&
      (target.tagName === 'IMG' ||
        target.tagName === 'VIDEO' ||
        target.closest('img') ||
        target.closest('video'))
    ) {
      e.preventDefault();
      return false;
    }
  }, { capture: true });

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

