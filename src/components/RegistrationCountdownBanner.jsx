'use client';

import React, { useState, useEffect } from 'react';
import Link from './Link';

export default function RegistrationCountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const target = new Date(2026, 9, 25, 23, 59, 59).getTime();

    const updateTimer = () => {
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
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="top-countdown-banner" style={{
      background: '#16324A',
      borderBottom: '2px solid #C49E59',
      width: '100%',
      padding: '0.875rem 0',
      boxSizing: 'border-box'
    }}>
      <div className="container" style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 1.25rem'
      }}>
        <div className="top-countdown-inner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Label / Deadline (Clean, no eyebrow, no pills) */}
          <div className="top-countdown-info">
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Batas Akhir Pendaftaran Duta Kampus 2026
            </div>
            <div style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '2px' }}>
              25 Oktober 2026 · 23:59 WIB
            </div>
          </div>

          {/* Digital Timer */}
          <div className="top-countdown-digits" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            {[
              { label: 'Hari', val: timeLeft.d },
              { label: 'Jam', val: timeLeft.h },
              { label: 'Menit', val: timeLeft.m },
              { label: 'Detik', val: timeLeft.s },
            ].map((unit, idx) => (
              <React.Fragment key={unit.label}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(196, 158, 89, 0.4)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  minWidth: '52px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontFamily: 'monospace, -apple-system, sans-serif',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#C49E59',
                    lineHeight: 1.15
                  }}>
                    {String(unit.val).padStart(2, '0')}
                  </div>
                  <div style={{
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    color: '#94a3b8',
                    textTransform: 'uppercase'
                  }}>
                    {unit.label}
                  </div>
                </div>
                {idx < 3 && (
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(196, 158, 89, 0.7)' }}>:</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Action Links */}
          <div className="top-countdown-actions" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Link
              href="/daftar"
              className="btn btn-gold btn-sm"
              style={{
                fontWeight: 600,
                fontSize: '0.825rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px'
              }}
            >
              Daftar Sekarang
            </Link>

            <a
              href="https://drive.google.com/drive/folders/1WQUTBWazFp6GbT4r4wjIKTD6HNGKrgoH"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-gold btn-sm"
              style={{
                fontSize: '0.825rem',
                fontWeight: 600,
                padding: '0.5rem 0.85rem',
                borderRadius: '6px',
                color: '#F8E7C9'
              }}
            >
              Booklet
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
