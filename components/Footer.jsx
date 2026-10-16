'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Image src="/assets/logo-main.png" alt="Logo" width={48} height={48} className="footer-brand-logo" style={{ filter: 'brightness(0) invert(1) opacity(0.8)', height: 48, width: 'auto' }} />
            <h3>Duta Kampus</h3>
            <p>UIN Siber Syekh Nurjati Cirebon</p>
            <p className="footer-tagline">Situs resmi pendaftaran Duta Kampus UIN SSC.</p>
          </div>
          <div className="footer-col">
            <h4>Tautan</h4>
            <ul>
              <li><Link href="/about">Tentang</Link></li>
              <li><Link href="/benefits">Manfaat</Link></li>
              <li><Link href="/timeline">Jadwal</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Kontak Panitia</h4>
            <ul>
              <li>Jl. Perjuangan By Pass Sunyaragi</li>
              <li>Cirebon, Jawa Barat 45132</li>
              <li>Email: dutakampus@syekhnurjati.ac.id</li>
              <li>Telp: (0231) 481264</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Media Sosial</h4>
            <div className="social-row">
              <a href="#" className="social-btn">IG</a>
              <a href="#" className="social-btn">TT</a>
              <a href="#" className="social-btn">YT</a>
            </div>
          </div>
        </div>
        <div className="footer-divider"></div>
        <div className="footer-bottom" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <p>© 2026 UIN Siber Syekh Nurjati Cirebon</p>
        </div>
      </div>
    </footer>
  );
}
