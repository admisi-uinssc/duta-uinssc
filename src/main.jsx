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

