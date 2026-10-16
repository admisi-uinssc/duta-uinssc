import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRouter } from '../lib/router';
import Link from '../components/Link';
import Image from '../components/Image';
import { Auth } from '../lib/auth';
import RegisterAccountWizard from '../components/RegisterAccountWizard';

export default function LoginPage() {
  const router = useRouter();
  const location = useLocation();

  // Check query params if user came with ?mode=register or ?mode=daftar
  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('mode') === 'register' || searchParams.get('mode') === 'daftar';

  const [isLogin, setIsLogin] = useState(!initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isNotFound, setIsNotFound] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to profil
    const user = Auth.getCurrentUser();
    if (user) {
      router.push('/profil');
    }

    if (typeof window !== 'undefined') {
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      setIsIosDevice(isIos);

      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        setIsInstalled(true);
      }

      // Check if global prompt is already available
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }

      const handleBeforeInstall = (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
        setDeferredPrompt(e);
      };

      const handlePromptReady = () => {
        if (window.deferredPrompt) {
          setDeferredPrompt(window.deferredPrompt);
        }
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') window.deferredPrompt = null;
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('pwa-prompt-ready', handlePromptReady);
      window.addEventListener('appinstalled', handleAppInstalled);
      window.addEventListener('pwa-app-installed', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('pwa-prompt-ready', handlePromptReady);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('pwa-app-installed', handleAppInstalled);
      };
    }
  }, [router]);

  const handleInstallClick = async () => {
    // 1. If already installed in standalone mode
    const isStandalone = typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
    if (isStandalone || isInstalled) {
      alert('Aplikasi PADUKA sudah terpasang di layar utama HP Anda.');
      return;
    }

    // 2. Direct native OS prompt (Android, Chrome, Edge, Samsung Internet)
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.deferredPrompt : null);
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') window.deferredPrompt = null;
        return;
      } catch (err) {}
    }

    // 3. Simple fallback guidance (tanpa unduh file html / tanpa tutorial rumit)
    setShowInstallGuide(true);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsNotFound(false);
    setIsLoading(true);

    try {
      const res = await Auth.login(email, password);
      if (res.success) {
        router.push('/profil');
      } else {
        setError(res.error || 'Alamat email atau kata sandi tidak sesuai.');
        if (res.notFound) {
          setIsNotFound(true);
        }
      }
    } catch (err) {
      setError('Terjadi kendala saat menghubungkan ke database server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        boxSizing: 'border-box'
      }}
    >
      {/* Return to home subtle link */}
      <div style={{ width: '100%', maxWidth: isLogin ? '440px' : '580px', marginBottom: '1rem', transition: 'max-width 0.3s ease' }}>
        <Link
          href="/"
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-mid)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 500
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Kembali ke Beranda
        </Link>
      </div>

      {/* Main Container Card */}
      <div
        style={{
          width: '100%',
          maxWidth: isLogin ? '440px' : '580px',
          padding: '2.5rem 2rem',
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          transition: 'max-width 0.3s ease',
          boxSizing: 'border-box'
        }}
      >
        {/* Header / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <Image
              src="/assets/logo-circle.png"
              alt="Logo UIN Siber Cirebon"
              width={56}
              height={56}
              style={{ margin: '0 auto', display: 'block' }}
            />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--navy)', margin: '0 0 0.35rem' }}>
            {isLogin ? 'Masuk ke Portal Pendaftar' : 'Pendaftaran Akun Baru'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-mid)', margin: 0, lineHeight: 1.5 }}>
            {isLogin
              ? 'Silakan masuk menggunakan email dan kata sandi yang telah didaftarkan.'
              : 'Daftarkan akun untuk memulai proses pengajuan seleksi Duta Kampus 2026.'}
          </p>

          {/* Mode Switch Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '8px',
              marginTop: '1.25rem',
              border: '1px solid var(--border-soft)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: isLogin ? '#ffffff' : 'transparent',
                color: isLogin ? 'var(--navy)' : 'var(--text-mid)',
                fontWeight: isLogin ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: isLogin ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: !isLogin ? '#ffffff' : 'transparent',
                color: !isLogin ? 'var(--navy)' : 'var(--text-mid)',
                fontWeight: !isLogin ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: !isLogin ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Daftar Akun
            </button>
          </div>
        </div>

        {/* Content */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {error && (
              <div
                style={{
                  backgroundColor: '#fff5f5',
                  color: '#991b1b',
                  border: '1px solid #fed7d7',
                  borderLeft: '4px solid #dc2626',
                  padding: '0.85rem 1.1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  lineHeight: 1.45,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.06)'
                }}
              >
                <span style={{ fontWeight: 500 }}>{error}</span>
                {isNotFound && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setError('');
                      setIsNotFound(false);
                    }}
                    style={{
                      background: 'var(--navy)',
                      color: 'var(--gold)',
                      border: '1px solid var(--gold)',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Daftar Sekarang
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label htmlFor="loginEmailInput" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
                Alamat Email atau Username <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="loginEmailInput"
                type="text"
                placeholder="Masukkan alamat email atau username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: '0.8rem 0.95rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label htmlFor="loginPasswordInput" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
                Kata Sandi <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="loginPasswordInput"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 0.95rem',
                    paddingRight: '4.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    outline: 'none',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-mid)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              disabled={isLoading}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                borderRadius: '8px',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Memverifikasi Akun...' : 'Masuk'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-mid)' }}>
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.85rem',
                  textDecoration: 'underline'
                }}
              >
                Daftar akun di sini
              </button>
            </div>

            {/* PWA Mobile Portal Card - Strictly Aligned with Key Visual without Icons/Emoticons */}
            <div style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '0.72rem', 
                color: 'var(--text-light)', 
                marginBottom: '0.6rem', 
                fontWeight: 700, 
                letterSpacing: '0.75px', 
                textTransform: 'uppercase' 
              }}>
                Aplikasi Resmi PADUKA Mobile
              </div>
              <button
                type="button"
                id="unduhAplikasiBtn"
                onClick={handleInstallClick}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '8px',
                  background: isInstalled ? 'rgba(196, 158, 89, 0.08)' : 'var(--navy)',
                  color: isInstalled ? 'var(--navy)' : 'var(--gold)',
                  border: isInstalled ? '1px solid rgba(196, 158, 89, 0.4)' : '1px solid var(--gold)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '0.75px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: isInstalled ? 'none' : '0 4px 14px rgba(11, 19, 41, 0.15)',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{isInstalled ? 'Aplikasi PADUKA Sudah Terpasang' : 'Tambahkan ke Layar Utama'}</span>
              </button>

              {showInstallGuide && (
                <div 
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(11, 19, 41, 0.75)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    padding: '1.25rem'
                  }}
                  onClick={() => setShowInstallGuide(false)}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      maxWidth: '420px',
                      width: '100%',
                      padding: '1.5rem',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                      border: '1px solid rgba(196,158,89,0.3)',
                      position: 'relative'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <Image
                        src="/assets/logo-circle.png"
                        alt="PADUKA"
                        width={42}
                        height={42}
                        style={{ borderRadius: '50%', border: '2px solid var(--gold)' }}
                      />
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy)' }}>
                          Pasang Aplikasi PADUKA
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>
                          Duta Kampus UIN Siber Cirebon
                        </div>
                      </div>
                    </div>

                    {isInstalled ? (
                      <div style={{ padding: '0.85rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                          Aplikasi Siap Digunakan
                        </div>
                        <p style={{ fontSize: '0.825rem', color: '#15803d', margin: 0, lineHeight: 1.5 }}>
                          Aplikasi PADUKA sudah terpasang pada perangkat Anda. Anda dapat langsung membukanya melalui layar utama HP.
                        </p>
                      </div>
                    ) : isIosDevice ? (
                      <div style={{ padding: '0.5rem 0 1rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.4rem' }}>
                          Pasang di Layar Utama iPhone
                        </div>
                        <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                          Ketuk tombol <strong>Bagikan</strong> (ikon kotak panah ke atas di bilah bawah Safari), lalu pilih <strong>"Tambah ke Layar Utama"</strong>.
                        </p>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem 0 1rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.4rem' }}>
                          Pasang di Layar Utama HP
                        </div>
                        <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                          Ketuk menu titik tiga (<strong>⋮</strong>) di sudut kanan atas browser, lalu pilih <strong>"Instal aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowInstallGuide(false)}
                      className="btn btn-gold"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        borderRadius: '10px',
                        justifyContent: 'center',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <span>Mengerti</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        ) : (
          <RegisterAccountWizard onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
