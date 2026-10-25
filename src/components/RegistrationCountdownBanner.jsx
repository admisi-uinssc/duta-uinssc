'use client';

import React, { useState, useEffect } from 'react';
import Link from './Link';

export default function RegistrationCountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, isExpired: false });

  useEffect(() => {
    // Target: 25 Oktober 2026 pukul 23:59:59 WIB
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
          isExpired: false,
        });
      } else {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, isExpired: true });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="top-countdown-banner" style={{
      background: 'linear-gradient(135deg, #091724 0%, #16324A 55%, #1a3954 100%)',
      borderTop: '1px solid rgba(196, 158, 89, 0.3)',
      borderBottom: '1px solid rgba(196, 158, 89, 0.35)',
      boxShadow: '0 8px 24px rgba(9, 23, 36, 0.35)',
      position: 'relative',
      zIndex: 10,
      width: '100%',
      padding: '1.25rem 0',
      overflow: 'hidden'
    }}>
      {/* Decorative subtle ambient lights */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '20%',
        width: '300px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(196, 158, 89, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div className="container" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1.25rem'
      }}>
        <div className="top-countdown-inner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          {/* Left Text / Badge */}
          <div className="top-countdown-info" style={{ minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 10px #22c55e', display: 'inline-block'
              }} />
              <span style={{
                fontSize: '0.72rem', fontWeight: 800, color: '#C49E59',
                letterSpacing: '0.8px', textTransform: 'uppercase'
              }}>
                PENDAFTARAN DIBUKA
              </span>
              <span style={{
                fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)',
                padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)'
              }}>
                Hingga 25 Okt 2026
              </span>
            </div>

            <h3 style={{
              margin: 0,
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.2px'
            }}>
              Hitung Mundur <span style={{ color: '#C49E59' }}>Penutupan Pendaftaran</span>
            </h3>
            <p style={{
              margin: '2px 0 0',
              fontSize: '0.8rem',
              color: '#cbd5e1'
            }}>
              Batas akhir pengunggahan berkas: <strong>25 Oktober 2026 pukul 23:59:59 WIB</strong>
            </p>
          </div>

          {/* Center: Digital Countdown Tiles */}
          <div className="top-countdown-digits" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {[
              { label: 'HARI', val: timeLeft.d },
              { label: 'JAM', val: timeLeft.h },
              { label: 'MENIT', val: timeLeft.m },
              { label: 'DETIK', val: timeLeft.s },
            ].map((unit, idx) => (
              <React.Fragment key={unit.label}>
                <div style={{
                  background: 'rgba(10, 26, 42, 0.85)',
                  border: '1.5px solid rgba(196, 158, 89, 0.45)',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  minWidth: '58px',
                  textAlign: 'center',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(8px)'
                }}>
                  <span style={{
                    display: 'block',
                    fontFamily: 'monospace, "Courier New", Courier',
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: '#F8E7C9',
                    lineHeight: 1.1
                  }}>
                    {String(unit.val).padStart(2, '0')}
                  </span>
                  <span style={{
                    display: 'block',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: '#94a3b8',
                    letterSpacing: '0.5px',
                    marginTop: '2px'
                  }}>
                    {unit.label}
                  </span>
                </div>
                {idx < 3 && (
                  <span style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: '#C49E59',
                    userSelect: 'none'
                  }}>
                    :
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Right: Quick Action CTA Buttons */}
          <div className="top-countdown-actions" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <Link
              href="/daftar"
              className="btn btn-gold btn-sm"
              style={{
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(196, 158, 89, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Daftar Sekarang</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>

            <a
              href="https://drive.google.com/drive/folders/1WQUTBWazFp6GbT4r4wjIKTD6HNGKrgoH"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-gold btn-sm"
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '0.58rem 1rem',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#F8E7C9'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>Booklet Panduan</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
