import React, { useState, useEffect } from 'react';
import Link from './Link';
import { Settings } from '../lib/settings';

const STORAGE_KEY = 'paduka_closed_modal_dismissed';

export default function RegistrationClosedModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [applicantCount, setApplicantCount] = useState('60+');

  useEffect(() => {
    // Hanya tampil jika pendaftaran ditutup dan belum ditutup di sesi ini
    const isClosed = Settings.isRegistrationClosed();
    if (!isClosed) return;

    setApplicantCount(Settings.getApplicantCountDisplay());

    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // Beri jeda halus 700ms setelah halaman dimuat sebelum pop-up muncul
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(10, 25, 47, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          padding: '2rem 1.75rem',
          boxShadow: '0 20px 45px rgba(10, 25, 47, 0.25)',
          position: 'relative',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Tombol Tutup X */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: '#f1f5f9',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 700,
            transition: 'all 0.2s'
          }}
        >
          ✕
        </button>

        {/* Brand Kicker */}
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.4rem'
          }}
        >
          Duta Kampus UIN SSC 2026
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--navy)',
            margin: '0 0 0.75rem',
            lineHeight: 1.25
          }}
        >
          Pendaftaran Ditutup
        </h2>

        {/* Natural Message */}
        <p
          style={{
            fontSize: '0.94rem',
            color: '#475569',
            lineHeight: 1.6,
            margin: '0 0 1.25rem'
          }}
        >
          Terima kasih banyak kepada <strong>{applicantCount} calon duta</strong> yang telah mendaftar. Saat ini panitia sedang memeriksa seluruh berkas yang masuk.
        </p>

        <p
          style={{
            fontSize: '0.84rem',
            color: '#64748b',
            lineHeight: 1.5,
            margin: '0 0 1.5rem',
            padding: '0.75rem 1rem',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}
        >
          Bagi calon duta yang sudah mendaftar, silakan masuk ke akun Anda untuk melihat kelengkapan berkas.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            href="/login"
            onClick={handleClose}
            className="btn btn-gold"
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.95rem',
              justifyContent: 'center',
              boxSizing: 'border-box'
            }}
          >
            Masuk Akun Peserta
          </Link>

          <button
            type="button"
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '10px',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
