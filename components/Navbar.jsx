'use client';

import { useState, useEffect } from 'react';
import Image from './Image';
import Link from './Link';
import { Auth } from '../lib/auth';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(Auth.getCurrentUser());
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 60);

      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setHidden(true); // Hide when scrolling down
      } else {
        setHidden(false); // Show when scrolling up
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${hidden ? 'hidden-nav' : ''}`} id="navbar">
      <div className="container nav-inner" style={{ maxWidth: '1440px' }}>
        <Link href="/" className="nav-logo">
          <Image src="/assets/logo-circle.png" alt="Logo" width={38} height={38} style={{ filter: 'drop-shadow(0 0 8px rgba(196,158,89,0.35))', height: 38, width: 'auto', borderRadius: '50%' }} />
          <div className="nav-logo-text">
            <span className="nav-logo-title desktop-only">Duta Kampus</span>
            <span className="nav-logo-title mobile-only" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', letterSpacing: '0.4px' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 800 }}>PADUKA</span> <span style={{ opacity: 0.4, fontWeight: 400 }}>|</span> dutauinssc
            </span>
            <span className="nav-logo-sub desktop-only">UIN Siber Syekh Nurjati Cirebon</span>
          </div>
        </Link>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`} style={{ marginLeft: 'auto', paddingRight: '2.5rem' }}>
          <li><Link href="/" className="nav-link" onClick={closeMenu}>Beranda</Link></li>
          <li className="nav-item-dropdown">
            <span className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              Tentang
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </span>
            <div className="nav-dropdown">
              <Link href="/about" className="nav-dropdown-item" onClick={closeMenu}>Program</Link>
              <Link href="/profil-duta" className="nav-dropdown-item" onClick={closeMenu}>Profil Duta Kampus</Link>
            </div>
          </li>
          <li><Link href="/gallery" className="nav-link" onClick={closeMenu}>Galeri</Link></li>
          <li><Link href="/timeline" className="nav-link" onClick={closeMenu}>Jadwal</Link></li>
          <li><Link href="/requirements" className="nav-link" onClick={closeMenu}>Persyaratan</Link></li>
          <li><Link href="/faq" className="nav-link" onClick={closeMenu}>FAQ</Link></li>
          <li>
            <Link href={user ? "/profil" : "/login"} className="nav-cta" onClick={closeMenu}>
              {user ? "Profil" : "Masuk"}
            </Link>
          </li>
        </ul>

        <div className="nav-right-group" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="desktop-only" style={{ display: 'flex', gap: '0.5rem' }}>
            <a href="https://uinssc.ac.id/" target="_blank" rel="noopener noreferrer" className="btn btn-outline-gold" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>UINSSC</a>
            <a href="https://ppid.uinssc.ac.id" target="_blank" rel="noopener noreferrer" className="btn btn-outline-gold" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>PPID</a>
          </div>
        </div>
      </div>
    </nav>
  );
}
