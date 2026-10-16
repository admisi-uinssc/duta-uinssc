'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Auth } from '../../lib/auth';
import { formatDateTime } from '../../lib/db';
import UserDashboard from '../../components/UserDashboard';

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    Auth.logout();
    router.push('/login');
  };

  const handleRefresh = () => {
    const currentUser = Auth.getCurrentUser();
    if (currentUser) {
      setUser({ ...currentUser });
    }
  };

  if (loading || !user) return null;

  // IF APPROVED: RENDER USER DASHBOARD
  if (user.accountStatus === 'approved') {
    return <UserDashboard user={user} onLogout={handleLogout} />;
  }

  // IF NOT APPROVED (PENDING): RENDER STATUS SCREEN
  const status = user.accountStatus || 'pending';

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
      {/* Return to home link */}
      <div style={{ width: '100%', maxWidth: '640px', marginBottom: '1rem' }}>
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

      {/* Main Status Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Card Header */}
        <div
          style={{
            padding: '2rem 2rem 1.5rem',
            borderBottom: '1px solid var(--border-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src="/assets/logo-circle.png"
              alt="Logo UIN Siber Cirebon"
              width={48}
              height={48}
              style={{ objectFit: 'contain' }}
            />
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)', margin: '0 0 0.25rem' }}>
                Status Pengajuan Akun
              </h1>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-mid)', margin: 0 }}>
                Portal Pendaftar Seleksi Duta Kampus 2026
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleRefresh}
              className="btn btn-outline-gold btn-sm"
              style={{ borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Muat Ulang
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-sm"
              style={{
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                border: '1px solid var(--border)',
                background: 'none',
                color: 'var(--text-mid)',
                cursor: 'pointer'
              }}
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-soft)' }}>
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '10px',
              border: `1px solid ${
                status === 'approved'
                  ? '#bbf7d0'
                  : status === 'rejected'
                  ? '#fecaca'
                  : '#fde68a'
              }`,
              background:
                status === 'approved'
                  ? '#f0fdf4'
                  : status === 'rejected'
                  ? '#fef2f2'
                  : '#fffbeb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy)' }}>
                Status Verifikasi:
              </span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background:
                    status === 'approved'
                      ? '#dcfce7'
                      : status === 'rejected'
                      ? '#fee2e2'
                      : '#fef3c7',
                  color:
                    status === 'approved'
                      ? '#166534'
                      : status === 'rejected'
                      ? '#991b1b'
                      : '#92400e',
                  border: `1px solid ${
                    status === 'approved'
                      ? '#86efac'
                      : status === 'rejected'
                      ? '#fca5a5'
                      : '#fcd34d'
                  }`
                }}
              >
                {status === 'approved'
                  ? 'Disetujui'
                  : status === 'rejected'
                  ? 'Ditolak'
                  : 'Menunggu Verifikasi'}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>
              {status === 'approved'
                ? 'Akun Anda telah diverifikasi dan disetujui.'
                : status === 'rejected'
                ? 'Pengajuan akun tidak memenuhi ketentuan seleksi.'
                : 'Akun Anda dalam proses verifikasi panitia seleksi.'}
            </p>
          </div>
        </div>

        {/* Identity Details Table */}
        <div style={{ padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', margin: '0 0 1rem' }}>
            Data Identitas yang Diajukan
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              fontSize: '0.85rem',
              background: '#f8fafc',
              padding: '1.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border-soft)'
            }}
          >
            <div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '2px' }}>
                Nama Lengkap
              </div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {user.namaLengkap || user.name || '—'}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '2px' }}>
                Nomor Induk Mahasiswa (NIM)
              </div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {user.nim || '—'}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '2px' }}>
                Alamat Email
              </div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {user.email || '—'}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '2px' }}>
                Kewarganegaraan
              </div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {user.kewarganegaraan || '—'}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '2px' }}>
                Fakultas
              </div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {user.fakultas || '—'}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '2px' }}>
                Program Studi / Jurusan
              </div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {user.jurusan || '—'}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '2px' }}>
                Tempat, Tanggal Lahir
              </div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {user.tempatLahir ? `${user.tempatLahir}, ${user.tanggalLahir || ''}` : user.tanggalLahir || '—'}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '2px' }}>
                Jenis Kelamin
              </div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                {user.jenisKelamin || '—'}
              </div>
            </div>

            {user.createdAt && (
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <div style={{ color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '2px' }}>
                  Waktu Pengajuan
                </div>
                <div style={{ fontWeight: 500, color: 'var(--text-mid)', fontSize: '0.8rem' }}>
                  {formatDateTime(user.createdAt)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
