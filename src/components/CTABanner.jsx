'use client';

import { useEffect, useState } from 'react';
import Link from './Link';

export default function CTABanner() {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    // Target countdown: Batas akhir pendaftaran (25 Oktober 2026 pukul 23:59:59)
    const target = new Date(2026, 9, 25, 23, 59, 59).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="cta-banner">
      <div className="cta-banner-content">
        <h2>Wujudkan Perubahan Nyata Bersama <span>Duta Kampus UIN SSC</span></h2>
        
        <div className="countdown-row">
          {[['Hari', timeLeft.d], ['Jam', timeLeft.h], ['Menit', timeLeft.m], ['Detik', timeLeft.s]].map(([label, val], idx, arr) => (
            <div key={label} style={{ display: 'flex' }}>
              <div className="cd-block">
                <span className="cd-num">{val.toString().padStart(2, '0')}</span>
                <span className="cd-label">{label}</span>
              </div>
              {idx < arr.length - 1 && <div className="cd-sep">:</div>}
            </div>
          ))}
        </div>
        <div className="cta-buttons">
          <Link href="/login" className="btn btn-gold btn-lg">Ajukan Akun & Daftar</Link>
          <Link href="/requirements" className="btn btn-outline-gold btn-lg">Baca Syarat</Link>
        </div>
      </div>
    </section>
  );
}
