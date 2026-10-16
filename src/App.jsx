import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import MobileNav from './components/MobileNav';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProfilDutaPage from './pages/ProfilDutaPage';
import BenefitsPage from './pages/BenefitsPage';
import GalleryPage from './pages/GalleryPage';
import TimelinePage from './pages/TimelinePage';
import RequirementsPage from './pages/RequirementsPage';
import FAQPage from './pages/FAQPage';
import DaftarPage from './pages/DaftarPage';
import LoginPage from './pages/LoginPage';
import ProfilPage from './pages/ProfilPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

import { smartSyncAll } from './lib/firebase';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const hideMobileNav = pathname === '/admin' || pathname === '/profil' || pathname === '/profil/';

  // Automatic Cloud Backend Sync (Source of Truth)
  useEffect(() => {
    try {
      const rawUsers = localStorage.getItem('dutauinssc_users');
      const rawApps = localStorage.getItem('dutauinssc_pendaftar');
      const isMissing = !rawUsers || rawUsers === '[]' || !rawApps || rawApps === '[]';
      smartSyncAll(isMissing).catch(() => {});
    } catch (e) {}
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/tentang" element={<AboutPage />} />
        <Route path="/tentang/profil-duta" element={<ProfilDutaPage />} />
        <Route path="/profil-duta" element={<ProfilDutaPage />} />
        <Route path="/benefits" element={<BenefitsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/requirements" element={<RequirementsPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/daftar" element={<DaftarPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {!hideMobileNav && <MobileNav />}
    </>
  );
}
