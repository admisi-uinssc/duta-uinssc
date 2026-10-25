'use client';

import React, { useState, useEffect } from 'react';
import Link from './Link';
import { Settings } from '../lib/settings';

export default function RegistrationCountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isClosed, setIsClosed] = useState(false);
  const [applicantCount, setApplicantCount] = useState('37+');

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
      borderBottom: '2px solid #C49E59',
      width: '100%',
      padding: isClosed ? '1rem 0' : '0.875rem 0',
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
             (Pesan Profesional & Ucapan Terima Kasih untuk Pendaftar)
             ======================================================== */
          <div className="top-countdown-closed-wrapper" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  padding: '2px 9px',
                  borderRadius: '5px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase'
                }}>
                  Pendaftaran Resmi Ditutup
                </span>
                <span style={{ fontSize: '0.78rem', color: '#C49E59', fontWeight: 600 }}>
                  Tahap Seleksi Administrasi 2026
                </span>
              </div>

              <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem', lineHeight: 1.35 }}>
                Terima Kasih Atas Partisipasi Luar Biasa Seluruh Mahasiswa UIN SSC
              </div>

              <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5, maxWidth: '820px' }}>
                Panitia Seleksi menyampaikan apresiasi setinggi-tingginya kepada <strong style={{ color: '#F8E7C9' }}>{applicantCount} pendaftar</strong> yang telah berpartisipasi dan melengkapi berkas persyaratan. Tahap verifikasi administrasi saat ini sedang berlangsung.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <Link
                href="/login"
                className="btn btn-gold btn-sm"
                style={{
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                Masuk Portal Peserta
              </Link>

              <a
                href="https://drive.google.com/drive/folders/1WQUTBWazFp6GbT4r4wjIKTD6HNGKrgoH"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-gold btn-sm"
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  padding: '0.55rem 1rem',
                  borderRadius: '6px',
                  color: '#F8E7C9',
                  whiteSpace: 'nowrap'
                }}
              >
                Booklet Panduan
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
