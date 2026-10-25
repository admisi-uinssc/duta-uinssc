'use client';

import React, { useState, useEffect } from 'react';
import Link from './Link';
import { Settings } from '../lib/settings';

export default function RegistrationCountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isClosed, setIsClosed] = useState(false);
  const [applicantCount, setApplicantCount] = useState('60+');

  useEffect(() => {
    const updateTimer = () => {
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

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="top-countdown-banner" style={{
      background: '#16324A',
      borderBottom: '3px solid #C49E59',
      width: '100%',
      padding: isClosed ? '1.35rem 0' : '0.875rem 0',
      boxSizing: 'border-box'
    }}>
      <div className="container" style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 1.25rem'
      }}>
        {isClosed ? (
          /* ========================================================
             TAMPILAN OTOMATIS SAAT PENDAFTARAN DITUTUP
             (Diperbesar & Dipertegas - Tanpa Pill Badge)
             ======================================================== */
          <div className="top-countdown-closed-wrapper" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            padding: '0.35rem 0'
          }}>
            <div style={{ flex: '1 1 540px', minWidth: '280px' }}>
              <div style={{
                color: '#C49E59',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '0.25rem'
              }}>
                Duta Kampus UIN SSC 2026
              </div>

              <div style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '0.35rem',
                lineHeight: 1.25
              }}>
                Pendaftaran Telah Ditutup
              </div>

              <p style={{
                margin: 0,
                fontSize: '0.92rem',
                color: '#e2e8f0',
                lineHeight: 1.55,
                maxWidth: '820px'
              }}>
                Terima kasih banyak kepada <strong style={{ color: '#F8E7C9', fontWeight: 700 }}>{applicantCount} calon duta</strong> yang telah mendaftar. Saat ini panitia sedang memeriksa seluruh kelengkapan berkas.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                href="/login"
                className="btn btn-gold"
                style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  padding: '0.75rem 1.4rem',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap'
                }}
              >
                Masuk Akun Peserta
              </Link>

              <a
                href="https://drive.google.com/drive/folders/1WQUTBWazFp6GbT4r4wjIKTD6HNGKrgoH"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-gold"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  color: '#F8E7C9',
                  whiteSpace: 'nowrap'
                }}
              >
                Unduh Booklet
              </a>
            </div>
          </div>
        ) : (
          /* ========================================================
             TAMPILAN COUNTDOWN AKTIF MENUJU DEADLINE
             ======================================================== */
          <div className="top-countdown-inner" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {/* Label / Deadline */}
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
        )}
      </div>
    </section>
  );
}
