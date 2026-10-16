import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Link from './Link';
import { Auth } from '../lib/auth';

export default function MobileNav() {
  const [user, setUser] = useState(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setUser(Auth.getCurrentUser());
  }, [pathname]);

  const isActive = (route) => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  };

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Beranda</span>
      </Link>
      <Link href="/about" className={`mobile-nav-item ${isActive('/about') || isActive('/tentang') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Tentang</span>
      </Link>
      
      <Link href={user ? "/profil" : "/login"} className={`mobile-nav-item ${isActive('/profil') || isActive('/login') || isActive('/daftar') ? 'active' : ''}`}>
        {user ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
          </svg>
        )}
        <span>{user ? "Dashboard" : "Masuk"}</span>
      </Link>
      <Link href="/timeline" className={`mobile-nav-item ${isActive('/timeline') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>Timeline</span>
      </Link>
      <Link href="/faq" className={`mobile-nav-item ${isActive('/faq') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>FAQ</span>
      </Link>
    </nav>
  );
}
