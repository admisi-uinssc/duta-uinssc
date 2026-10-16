'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { Auth } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect to profil if already logged in
    const user = Auth.getCurrentUser();
    if (user) {
      router.push('/profil');
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const res = Auth.login(email, password);
      if (res.success) {
        window.location.href = '/profil';
      } else {
        setError(res.error);
      }
    } else {
      if (!name || !email || !password) {
        setError('Semua kolom wajib diisi.');
        return;
      }
      const res = Auth.register(name, email, password);
      if (res.success) {
        window.location.href = '/profil';
      } else {
        setError(res.error);
      }
    }
  };

  return (
    <>
      <Navbar />
      <main className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-alt)', padding: '2rem 1rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2rem', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 20px 40px rgba(22,50,74,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 className="heading-lg" style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>
              {isLogin ? 'Selamat Datang' : 'Buat Akun'}
            </h1>
            <p className="lead" style={{ fontSize: '0.9rem', marginBottom: 0 }}>
              {isLogin 
                ? 'Masuk ke portal Duta Kampus UIN Siber' 
                : 'Daftar untuk mengikuti seleksi Duta Kampus'}
            </p>
          </div>

          <div className="form-content">
            {error && (
              <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.2)', padding: '0.875rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>Nama Lengkap</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Ahmad Fauzi" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={{ padding: '0.875rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border-soft)', background: 'var(--bg-alt)', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.9rem' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-soft)'}
                  />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>Alamat Email</label>
                <input 
                  type="email" 
                  placeholder="nama@email.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                  style={{ padding: '0.875rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border-soft)', background: 'var(--bg-alt)', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.9rem' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-soft)'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>Kata Sandi</label>
                <input 
                  type="password" 
                  placeholder="Minimal 8 karakter" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required
                  style={{ padding: '0.875rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border-soft)', background: 'var(--bg-alt)', outline: 'none', transition: 'border-color 0.2s', fontSize: '0.9rem' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-soft)'}
                />
              </div>

              <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%', marginTop: '0.75rem', borderRadius: '12px', padding: '1rem', fontSize: '1rem', fontWeight: 700 }}>
                {isLogin ? 'Masuk ke Portal' : 'Buat Akun Sekarang'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {isLogin ? (
                <>Belum punya akun? <button type="button" onClick={() => {setIsLogin(false); setError('');}} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>Daftar di sini</button></>
              ) : (
                <>Sudah punya akun? <button type="button" onClick={() => {setIsLogin(true); setError('');}} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>Masuk di sini</button></>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
