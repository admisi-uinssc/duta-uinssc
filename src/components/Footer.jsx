'use client';

import Image from './Image';
import Link from './Link';

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
              <li><Link href="/pengumuman">Pengumuman</Link></li>
              <li><Link href="/benefits">Manfaat</Link></li>
              <li><Link href="/timeline">Jadwal</Link></li>
              <li><Link href="/requirements">Persyaratan</Link></li>
              <li><a href="https://drive.google.com/drive/folders/1WQUTBWazFp6GbT4r4wjIKTD6HNGKrgoH" target="_blank" rel="noopener noreferrer">Booklet Pendaftaran ↗</a></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Kontak Panitia</h4>
            <ul>
              <li>Jl. Perjuangan By Pass Sunyaragi</li>
              <li>Cirebon, Jawa Barat 45132</li>
              <li>Email: <a href="mailto:dutakampus@uinssc.ac.id" style={{ color: 'inherit' }}>dutakampus@uinssc.ac.id</a></li>
              <li>WhatsApp: <a href="https://wa.me/6285122927628" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>0851-2292-7628</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Media Sosial</h4>
            <div className="social-row">
              <a href="https://www.instagram.com/duta_uinssc" target="_blank" rel="noopener noreferrer" className="social-btn" title="Instagram @duta_uinssc">IG</a>
              <a href="https://www.tiktok.com/@duta.uin.ssc" target="_blank" rel="noopener noreferrer" className="social-btn" title="TikTok @duta.uin.ssc">TT</a>
              <a href="https://wa.me/6285122927628" target="_blank" rel="noopener noreferrer" className="social-btn" title="WhatsApp 0851-2292-7628">WA</a>
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
