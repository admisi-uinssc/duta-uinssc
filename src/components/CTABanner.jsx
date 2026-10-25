'use client';

import { useEffect, useState } from 'react';
import Link from './Link';
import { Settings } from '../lib/settings';

export default function CTABanner() {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isClosed, setIsClosed] = useState(false);
  const [applicantCount, setApplicantCount] = useState('37+');

  useEffect(() => {
    const updateCountdown = () => {
      const closed = Settings.isRegistrationClosed();
      setIsClosed(closed);
      setApplicantCount(Settings.getApplicantCountDisplay());

      if (closed) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      const target = Settings.getDeadlineTime();
      const now = Date.now();
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
        setIsClosed(true);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="cta-banner">
      <div className="cta-banner-content">
        {isClosed ? (
          <div>
            <h2>Pendaftaran Resmi Ditutup · <span>Duta Kampus UIN SSC 2026</span></h2>
            <p style={{ maxWidth: '750px', margin: '0.75rem auto 1.5rem', color: '#cbd5e1', fontSize: '0.98rem', lineHeight: 1.6 }}>
              Terima kasih atas partisipasi dan dedikasi luar biasa dari <strong>{applicantCount} pendaftar</strong>. Tahap seleksi administrasi sedang berlangsung. Silakan masuk ke portal peserta untuk memantau status berkas Anda.
            </p>
            <div className="cta-buttons">
              <Link href="/login" className="btn btn-gold btn-lg">Masuk Portal Peserta</Link>
              <Link href="/timeline" className="btn btn-outline-gold btn-lg">Linimasa Seleksi</Link>
            </div>
          </div>
        ) : (
          <div>
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
        )}
      </div>
    </section>
  );
}
