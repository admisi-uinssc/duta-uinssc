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

      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, [router]);

  const handleInstallClick = async () => {
    // 1. If on iOS, initiate immediate download of the PADUKA iOS WebClip Configuration Profile
    if (isIosDevice) {
      try {
        const currentUrl = typeof window !== 'undefined' ? window.location.origin + '/' : 'https://duta.uinssc.ac.id/';
        const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>PADUKA</string>
            <key>PayloadDescription</key>
            <string>Aplikasi Resmi PADUKA Duta Kampus UIN Siber Cirebon</string>
            <key>PayloadDisplayName</key>
            <string>PADUKA WebClip</string>
            <key>PayloadIdentifier</key>
            <string>id.ac.uinssc.paduka.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>D92E47B0-3C89-4EA2-BA6B-92DF203B7C10</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${currentUrl}</string>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>PADUKA | dutauinssc</string>
    <key>PayloadIdentifier</key>
    <string>id.ac.uinssc.paduka</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>4F2A1098-95D2-47C8-8542-C119842F53AE</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;
        const blob = new Blob([plist], { type: 'application/x-apple-aspen-config' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'PADUKA.mobileconfig';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      } catch (err) {}

      setShowInstallGuide(true);
      return;
    }

    // 2. If Android / Chromium with native PWA install prompt available
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        return;
      } catch (e) {}
    }

    // 3. Fallback: trigger download of direct standalone web launcher file
    try {
      const launcherHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/"><title>PADUKA</title></head><body><script>window.location.replace('/');</script></body></html>`;
      const blob = new Blob([launcherHtml], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'PADUKA-Duta-UINSSC.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch (e) {}

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
                  textAlign: 'center'
                }}
              >
                {isInstalled ? 'Aplikasi PADUKA Terpasang di Perangkat' : 'Unduh Aplikasi PADUKA'}
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
                      maxWidth: '460px',
                      width: '100%',
                      padding: '1.75rem',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                      border: '1px solid rgba(196,158,89,0.3)',
                      position: 'relative'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <Image
                        src="/assets/logo-circle.png"
                        alt="PADUKA"
                        width={44}
                        height={44}
                        style={{ borderRadius: '50%', border: '2px solid var(--gold)' }}
                      />
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy)' }}>
                          Unduh Aplikasi PADUKA
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>
                          Portal Aplikasi Duta Kampus UINSSC
                        </div>
                      </div>
                    </div>

                    {isInstalled ? (
                      <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                          Aplikasi Siap Digunakan
                        </div>
                        <p style={{ fontSize: '0.825rem', color: '#15803d', margin: 0, lineHeight: 1.5 }}>
                          Aplikasi PADUKA sudah aktif dan terpasang pada perangkat Anda. Anda dapat langsung membukanya melalui layar utama.
                        </p>
                      </div>
                    ) : isIosDevice ? (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem' }}>
                          Langkah Pemasangan di iPhone / iPad (iOS):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem', color: '#334155', lineHeight: 1.5 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</span>
                            <span>Buka peramban <strong>Safari</strong> dan ketuk ikon <strong>Bagikan (Share)</strong> di bilah bawah.</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</span>
                            <span>Gulir ke bawah lalu pilih opsi <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>3</span>
                            <span>Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Ikon aplikasi PADUKA akan langsung muncul di beranda HP Anda.</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem' }}>
                          Langkah Pemasangan di Android / Peramban:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem', color: '#334155', lineHeight: 1.5 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</span>
                            <span>Ketuk ikon menu titik tiga (<strong>⋮</strong>) di sudut kanan atas peramban Google Chrome / browser Anda.</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</span>
                            <span>Pilih opsi <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>3</span>
                            <span>Konfirmasi pemasangan. Aplikasi PADUKA akan langsung terpasang dan dapat dibuka secara instan.</span>
                          </div>
                        </div>
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
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>Selesai & Mengerti</span>
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
