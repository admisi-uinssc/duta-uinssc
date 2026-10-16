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

  // Automatic Cloud Backend Sync: Always fetch fresh live data on any route change so HP and PC are 100% in sync with 0 cache issues
  useEffect(() => {
    smartSyncAll(true).catch(() => {});
  }, [pathname]);

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
