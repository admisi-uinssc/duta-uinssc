import React, { useState, useEffect } from 'react';
import Link from './Link';
import Image from './Image';
import { Auth } from '../lib/auth';
import { DB, formatDateTime } from '../lib/db';
import { DOSSIER_DOCUMENTS, evaluateDossierCompleteness, DEFAULT_MESSAGES } from '../lib/dossier';

export default function UserDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('beranda'); // 'beranda' | 'pendaftaran' | 'riwayat'
  const [saveNotice, setSaveNotice] = useState('');
  const [formAlert, setFormAlert] = useState({ show: false, message: '', type: 'info' });
  const [currentUser, setCurrentUser] = useState(user);

  const triggerAlert = (message, type = 'info') => {
    setFormAlert({ show: true, message, type });
    window.scrollTo({ top: 300, behavior: 'smooth' });
    setTimeout(() => setFormAlert({ show: false, message: '', type: 'info' }), 6000);
  };

  // Form state for Pendaftaran Duta (10 Dokumen Resmi & Profil Lengkap)
  const [formData, setFormData] = useState({
    namaLengkap: user.namaLengkap || user.name || '',
    nim: user.nim || '',
    fakultas: user.fakultas || '',
    jurusan: user.jurusan || '',
    semester: user.semester || '4',
    jenisKelamin: user.jenisKelamin || 'Laki-laki',
    tempatLahir: user.tempatLahir || '',
    tanggalLahir: user.tanggalLahir || '',
    noHp: user.noHp || '',
    alamat: user.alamat || '',
    ipk: user.ipk || '',
    prestasi: user.prestasi || '',
    organisasi: user.organisasi || '',
    motivasi: user.motivasi || '',
    visi: user.visi || '',
    // 10 Berkas Dokumen Persyaratan
    docSuratPernyataan: user.docSuratPernyataan || '',
    docCv: user.docCv || '',
    docSuratRekomendasi: user.docSuratRekomendasi || '',
    docSertifikatPrestasi: user.docSertifikatPrestasi || '',
    docFotoLengkap: user.docFotoLengkap || '',
    docMotivationLetter: user.docMotivationLetter || '',
    docBuktiFollow: user.docBuktiFollow || '',
    docKtm: user.docKtm || '',
    docTranskripNilai: user.docTranskripNilai || '',
    docBuktiDiterima: user.docBuktiDiterima || '',
  });

  const [isSubmitted, setIsSubmitted] = useState(user.berkasSubmitted || false);

  // Sync state from storage to keep live with admin approvals
  useEffect(() => {
    const refreshUserData = () => {
      const users = Auth.getUsers();
      const fresh = users.find(u => u.email.toLowerCase() === (user.email || '').toLowerCase());
      if (fresh) {
        setCurrentUser(fresh);
        if (fresh.berkasSubmitted) {
          setIsSubmitted(true);
        }
      }
      const existingInDb = DB.getAll().find(
        (item) => (item.email || '').toLowerCase() === (user.email || '').toLowerCase()
      );
      if (existingInDb) {
        setIsSubmitted(true);
        setFormData(prev => ({
          ...prev,
          ...existingInDb,
        }));
      }
    };

    refreshUserData();
    window.addEventListener('storage', refreshUserData);
    return () => window.removeEventListener('storage', refreshUserData);
  }, [user.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (docKey, file) => {
    if (!file) return;
    const fileSummary = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
    setFormData(prev => ({ ...prev, [docKey]: fileSummary }));
    setSaveNotice(`Berkas ${file.name} berhasil dilampirkan.`);
    setTimeout(() => setSaveNotice(''), 3000);
  };

  const handleRemoveFile = (docKey) => {
    setFormData(prev => ({ ...prev, [docKey]: '' }));
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    const users = Auth.getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...formData };
      Auth.saveUsers(users);
      setCurrentUser(users[idx]);
    }
    setSaveNotice('Draf formulir dan dokumen pendaftaran berhasil disimpan.');
    setTimeout(() => setSaveNotice(''), 3500);
  };

  const handleSubmitApplication = (e) => {
    e.preventDefault();
    if (!formData.ipk || !formData.motivasi) {
      triggerAlert('Mohon lengkapi data nilai IPK dan esai motivasi sebelum mengirim pendaftaran.', 'danger');
      return;
    }

    // Validasi 10 Dokumen
    const isSem1 = String(formData.semester || '').trim() === '1';
    const missingDocs = DOSSIER_DOCUMENTS.filter(doc => {
      if (doc.required && !formData[doc.key]) return true;
      if (doc.id === 'buktiDiterima' && isSem1 && !formData[doc.key]) return true;
      return false;
    });

    if (missingDocs.length > 0) {
      triggerAlert(
        `Mohon lengkapi ${missingDocs.length} berkas wajib berikut: ${missingDocs.map(d => d.label).join(', ')}.`,
        'danger'
      );
      return;
    }

    // Save or update in DB
    const existing = DB.getAll().find(i => (i.email || '').toLowerCase() === user.email.toLowerCase());
    if (existing) {
      DB.save(DB.getAll().map(i => i.email.toLowerCase() === user.email.toLowerCase() ? {
        ...i,
        ...formData,
        prodi: formData.jurusan || formData.fakultas,
        status: 'pending',
        selectionStage: 'review',
        updatedAt: new Date().toISOString()
      } : i));
    } else {
      DB.add({
        ...formData,
        email: user.email,
        prodi: formData.jurusan || formData.fakultas,
        status: 'pending',
        selectionStage: 'review',
      });
    }

    // Update user status in Auth
    const users = Auth.getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (idx !== -1) {
      users[idx] = { 
        ...users[idx], 
        ...formData, 
        berkasSubmitted: true, 
        selectionStage: users[idx].selectionStage || 'review',
        status: 'Tahap Seleksi Berkas' 
      };
      Auth.saveUsers(users);
      setCurrentUser(users[idx]);
    }

    setIsSubmitted(true);
    setSaveNotice('Pendaftaran Duta Kampus dan 10 berkas dokumen persyaratan berhasil dikirimkan.');
    setActiveTab('riwayat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dossierStatus = evaluateDossierCompleteness(formData);
  const selectionStage = currentUser.selectionStage || (isSubmitted ? 'review' : 'none');
  const selectionMessage = currentUser.selectionMessage;

  return (
    <div className="user-dashboard-container">
      {/* SIDEBAR (Desktop) */}
      <aside className="user-dashboard-sidebar">
        {/* Brand Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <Image
            src="/assets/logo-circle.png"
            alt="Logo UIN Siber Cirebon"
            width={38}
            height={38}
            style={{ borderRadius: '50%' }}
          />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.2px', color: '#ffffff' }}>
              Portal Peserta
            </div>
            <div style={{ fontSize: '0.75rem', color: '#C49E59', fontWeight: 600 }}>
              Duta Kampus 2026
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          <button
            type="button"
            onClick={() => setActiveTab('beranda')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'beranda' ? 'rgba(196, 158, 89, 0.18)' : 'transparent',
              color: activeTab === 'beranda' ? '#C49E59' : '#cbd5e1',
              fontWeight: activeTab === 'beranda' ? 600 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Beranda
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pendaftaran')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'pendaftaran' ? 'rgba(196, 158, 89, 0.18)' : 'transparent',
              color: activeTab === 'pendaftaran' ? '#C49E59' : '#cbd5e1',
              fontWeight: activeTab === 'pendaftaran' ? 600 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Pendaftaran Duta
            {dossierStatus.isComplete && (
              <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'riwayat' ? 'rgba(196, 158, 89, 0.18)' : 'transparent',
              color: activeTab === 'riwayat' ? '#C49E59' : '#cbd5e1',
              fontWeight: activeTab === 'riwayat' ? 600 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Riwayat Pendaftaran
            {selectionStage === 'lolos' && (
              <span style={{ marginLeft: 'auto', background: '#22c55e', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                Lolos
              </span>
            )}
          </button>
        </nav>

        {/* User Card & Logout (Sidebar Footer) */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C49E59, #b58d4a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              {(formData.namaLengkap || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {formData.namaLengkap || user.name || 'Calon Duta'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '0.55rem',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="user-dashboard-main">
        {/* DESKTOP TOPBAR */}
        <header
          className="user-dashboard-desktop-header"
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '1rem 2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 40
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#16324A', margin: 0 }}>
              {activeTab === 'beranda' && 'Beranda Peserta'}
              {activeTab === 'pendaftaran' && 'Pendaftaran Duta & Kelengkapan Berkas'}
              {activeTab === 'riwayat' && 'Riwayat & Tahapan Seleksi'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
              Universitas Islam Negeri Siber Syekh Nurjati Cirebon
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Live Document Completeness Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: dossierStatus.bg,
                border: `1px solid ${dossierStatus.border}`,
                fontSize: '0.8rem',
                fontWeight: 600,
                color: dossierStatus.color
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dossierStatus.color }} />
              <span>Kelengkapan Berkas: {dossierStatus.percent}%</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: '#f1f5f9',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#475569'
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              Akun Aktif
            </div>
          </div>
        </header>

        {/* MOBILE TOPBAR */}
        <div className="user-dashboard-mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Image
              src="/assets/logo-circle.png"
              alt="Logo"
              width={30}
              height={30}
              style={{ borderRadius: '50%' }}
            />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                Portal Calon Duta
              </div>
              <div style={{ fontSize: '0.68rem', color: '#C49E59' }}>
                UIN SSC 2026
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Keluar
          </button>
        </div>

        {/* TOAST / NOTICE */}
        {saveNotice && (
          <div
            style={{
              position: 'fixed',
              top: '1rem',
              right: '1rem',
              zIndex: 9999,
              background: '#16324A',
              color: '#ffffff',
              padding: '0.875rem 1.25rem',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              borderLeft: '4px solid #C49E59',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>{saveNotice}</span>
          </div>
        )}

        {/* TAB CONTENTS (FULL WIDTH ON DESKTOP, COMFORTABLE ON HP) */}
        <main style={{ padding: '1.75rem 2.5rem', flex: 1, width: '100%', boxSizing: 'border-box' }}>
          {/* TAB 1: BERANDA */}
          {activeTab === 'beranda' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* === HASIL KELULUSAN SELEKSI BERKAS (JIKA ADMIN ACC / TOLAK) === */}
              {selectionStage === 'lolos' && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                    border: '2px solid #86efac',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 8px 24px rgba(22, 101, 52, 0.08)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        background: '#166534',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}
                    >
                      LOLOS SELEKSI BERKAS
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>
                      Tahap Administrasi
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#14532d', margin: '0 0 0.75rem' }}>
                    Selamat, {formData.namaLengkap}! Anda Dinyatakan Lolos Seleksi Berkas
                  </h3>

                  <p style={{ fontSize: '0.95rem', color: '#166534', lineHeight: 1.6, margin: '0 0 1.5rem', maxWidth: '850px' }}>
                    {selectionMessage || DEFAULT_MESSAGES.lolos}
                  </p>

                  <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', maxWidth: '650px' }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#14532d', marginBottom: '0.35rem' }}>
                      Petunjuk Tahapan Lanjutan:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.825rem', color: '#166534', lineHeight: 1.6 }}>
                      <li>Bergabung ke grup koordinasi calon duta kampus melalui tautan yang dikirimkan ke WhatsApp Anda ({formData.noHp || 'kontak terdaftar'}).</li>
                      <li>Persiapkan pakaian formal universitas (almamater) untuk sesi wawancara dan uji bakat.</li>
                      <li>Pantau pembaruan jadwal pada menu Riwayat Pendaftaran.</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('riwayat')}
                    className="btn btn-gold"
                    style={{ padding: '0.8rem 1.75rem', fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span>Lihat Linimasa Lengkap</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              )}

              {selectionStage === 'tidak_lolos' && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 4px 16px rgba(153, 27, 27, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        background: '#991b1b',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        letterSpacing: '0.5px'
                      }}
                    >
                      PENGUMUMAN SELEKSI BERKAS
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#991b1b', margin: '0 0 0.5rem' }}>
                    Hasil Penilaian Administrasi Berkas
                  </h3>

                  <p style={{ fontSize: '0.925rem', color: '#7f1d1d', lineHeight: 1.6, margin: '0 0 1rem', maxWidth: '850px' }}>
                    {selectionMessage || DEFAULT_MESSAGES.tidak_lolos}
                  </p>

                  <div style={{ fontSize: '0.825rem', color: '#b91c1c' }}>
                    Tetap pantau portal kegiatan kampus UIN Siber Syekh Nurjati Cirebon untuk kesempatan dan program pengembangan lainnya.
                  </div>
                </div>
              )}

              {/* Card 1: Lengkapi Dokumen */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: 'var(--shadow-sm)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#166534',
                        border: '1px solid #86efac',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px'
                      }}
                    >
                      Akun Terverifikasi
                    </span>

                    <span
                      style={{
                        background: dossierStatus.bg,
                        color: dossierStatus.color,
                        border: `1px solid ${dossierStatus.border}`,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px'
                      }}
                    >
                      {dossierStatus.statusLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Terkumpul: <strong>{dossierStatus.filledCount} dari {dossierStatus.totalCount} komponen</strong>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16324A', margin: '0 0 0.5rem' }}>
                  Lengkapi dokumen sebelum mendaftar.
                </h3>
                <p style={{ fontSize: '0.925rem', color: '#475569', lineHeight: 1.6, margin: '0 0 1.5rem', maxWidth: '850px' }}>
                  Profil dan dokumen wajib dilengkapi untuk melanjutkan pendaftaran duta kampus. Isi data diri anda agar kami dapat menilai sesuai ketentuan dan persyaratan duta. Jika sudah lengkap, silakan lanjutkan ke tahap pendaftaran.
                </p>

                {/* Progress track */}
                <div style={{ background: '#f1f5f9', borderRadius: '9999px', height: '8px', overflow: 'hidden', marginBottom: '1.5rem', maxWidth: '600px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${dossierStatus.percent}%`,
                      background: dossierStatus.isComplete ? '#16a34a' : '#C49E59',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('pendaftaran')}
                  className="btn btn-gold"
                  style={{
                    padding: '0.85rem 1.75rem',
                    borderRadius: '8px',
                    fontSize: '0.925rem',
                    fontWeight: 600
                  }}
                >
                  {isSubmitted ? 'Lihat / Perbarui Berkas' : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span>Lengkapi Profil Sekarang</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                  )}
                </button>
              </div>

              {/* Card 2: Program Duta Kampus */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: 'var(--shadow-sm)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#C49E59', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Program Resmi Universitas
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#16324A', margin: '0 0 0.5rem' }}>
                      Program Duta Kampus UIN Siber Syekh Nurjati Cirebon 2026
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, margin: 0, maxWidth: '850px' }}>
                      Program pencarian representasi mahasiswa unggul UIN Siber Syekh Nurjati Cirebon angkatan 2026 yang memiliki integritas keilmuan, kepemimpinan, kepribadian santun, dan wawasan keislaman siber.
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '0.65rem' }}>
                      Status Pengiriman: <strong style={{ color: isSubmitted ? '#166534' : '#b45309' }}>{isSubmitted ? 'Telah Dikirimkan' : 'Belum Dikirim'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pendaftaran')}
                      className="btn btn-gold"
                      style={{
                        padding: '0.85rem 1.75rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      {isSubmitted ? 'Tinjau Pendaftaran' : 'Kirim Pendaftaran'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENDAFTARAN DUTA (FORM DENGAN SPACING RAPIH DI HP & FULL WIDTH DI DESKTOP) */}
          {activeTab === 'pendaftaran' && (
            <div style={{ width: '100%', boxSizing: 'border-box' }}>
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16324A', margin: '0 0 0.35rem' }}>
                  Formulir Pendaftaran & Berkas Calon Duta
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                  Lengkapi data profil dan berkas dokumen pendukung Anda secara presisi untuk proses penilaian seleksi administrasi.
                </p>
              </div>

              {/* Status Bar */}
              <div
                style={{
                  background: dossierStatus.bg,
                  border: `1.5px solid ${dossierStatus.border}`,
                  padding: '1.25rem 1.5rem',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: dossierStatus.color, fontSize: '0.95rem' }}>
                    Status Berkas: {dossierStatus.statusLabel} ({dossierStatus.percent}%)
                  </div>
                  <div style={{ fontSize: '0.825rem', color: dossierStatus.color, marginTop: '2px' }}>
                    {dossierStatus.isComplete 
                      ? 'Seluruh dokumen persyaratan esensial telah lengkap diisi. Anda dapat mengirimkan pendaftaran.'
                      : `Masih ada ${dossierStatus.missingFields.length} data yang belum dilengkapi: ${dossierStatus.missingFields.join(', ')}.`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isSubmitted && (
                    <span style={{ background: '#166534', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                      Berkas Telah Diterima Panitia
                    </span>
                  )}
                </div>
              </div>

              {/* ALERT BANNER */}
              {formAlert.show && (
                <div
                  style={{
                    background: formAlert.type === 'danger' ? '#fef2f2' : formAlert.type === 'success' ? '#f0fdf4' : '#eff6ff',
                    border: `1.5px solid ${formAlert.type === 'danger' ? '#f87171' : formAlert.type === 'success' ? '#86efac' : '#93c5fd'}`,
                    color: formAlert.type === 'danger' ? '#991b1b' : formAlert.type === 'success' ? '#166534' : '#1e40af',
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    {formAlert.type === 'danger' ? (
                      <>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </>
                    ) : (
                      <>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </>
                    )}
                  </svg>
                  <span>{formAlert.message}</span>
                </div>
              )}

              {/* FORM WRAPPER - FULL WIDTH ON DESKTOP, GENEROUS SPACING ON HP */}
              <form
                onSubmit={handleSubmitApplication}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '2.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2.25rem',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {/* SECTION 1: DATA PRIBADI & MAHASISWA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <h4 style={{ margin: '0 0 0.25rem', color: '#16324A', fontSize: '1.1rem', fontWeight: 700 }}>
                      1. Identitas Pribadi & Kemahasiswaan
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                      Data pokok yang telah diverifikasi saat pengajuan akun.
                    </p>
                  </div>

                  <div className="form-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Nama Lengkap Sesuai KTM <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="namaLengkap"
                        value={formData.namaLengkap}
                        onChange={handleInputChange}
                        required
                        placeholder="Contoh: Rizki Pratama Putra"
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Nomor Induk Mahasiswa (NIM) <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="nim"
                        value={formData.nim}
                        onChange={handleInputChange}
                        required
                        placeholder="Contoh: 2308103012"
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Fakultas <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="fakultas"
                        value={formData.fakultas}
                        onChange={handleInputChange}
                        required
                        placeholder="Contoh: Fakultas Ilmu Tarbiyah dan Keguruan (FITK)"
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Program Studi / Jurusan <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="jurusan"
                        value={formData.jurusan}
                        onChange={handleInputChange}
                        required
                        placeholder="Contoh: Tadris Bahasa Inggris"
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: DATA AKADEMIK & KONTAK */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <h4 style={{ margin: '0 0 0.25rem', color: '#16324A', fontSize: '1.1rem', fontWeight: 700 }}>
                      2. Data Akademik & Kontak Aktif
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                      Informasi semester, nilai IPK kumulatif, serta kontak WhatsApp yang dapat dihubungi panitia.
                    </p>
                  </div>

                  <div className="form-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Semester Berjalan <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box', background: '#fff' }}
                      >
                        <option value="2">Semester 2</option>
                        <option value="4">Semester 4</option>
                        <option value="6">Semester 6</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Indeks Prestasi Kumulatif (IPK) <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="ipk"
                        placeholder="Contoh: 3.75 (skala 4.00)"
                        value={formData.ipk}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Nomor WhatsApp Aktif <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        name="noHp"
                        placeholder="Contoh: 081234567890"
                        value={formData.noHp}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Alamat Domisili di Cirebon / Sekitarnya <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="alamat"
                        placeholder="Contoh: Jl. Perjuangan No. 12, Kesambi, Kota Cirebon"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: PORTOFOLIO & MOTIVASI */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <h4 style={{ margin: '0 0 0.25rem', color: '#16324A', fontSize: '1.1rem', fontWeight: 700 }}>
                      3. Rekam Jejak, Prestasi & Motivasi
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                      Sampaikan komitmen dan potensi Anda untuk mewakili almamater UIN Siber Cirebon.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Prestasi Akademik / Non-Akademik (Opsional)
                      </label>
                      <textarea
                        name="prestasi"
                        rows={2}
                        placeholder="Contoh: Juara 1 Debat Bahasa Inggris Tingkat Universitas 2025, Finalis Karya Tulis Ilmiah Al-Quran"
                        value={formData.prestasi}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Pengalaman Organisasi / Kepanitiaan (Opsional)
                      </label>
                      <textarea
                        name="organisasi"
                        rows={2}
                        placeholder="Contoh: Staf Departemen Humas DEMA UIN SSC, Anggota Lembaga Pers Mahasiswa (LPM)"
                        value={formData.organisasi}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Esai Singkat Motivasi & Kontribusi Menjadi Duta Kampus <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <textarea
                        name="motivasi"
                        rows={4}
                        placeholder="Jelaskan alasan kuat Anda ingin menjadi Duta Kampus UIN Siber Syekh Nurjati Cirebon dan apa kontribusi nyata yang akan Anda berikan bagi universitas."
                        value={formData.motivasi}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: 10 BERKAS DOKUMEN PERSYARATAN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem', color: '#16324A', fontSize: '1.1rem', fontWeight: 700 }}>
                        4. Unggah 10 Dokumen Persyaratan
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                        Sesuai ketentuan resmi Pemilihan Duta Kampus UIN SSC 2026. Format yang didukung: PDF, JPG, PNG, ZIP.
                      </p>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: '9999px', background: dossierStatus.isComplete ? '#dcfce7' : '#fef9c3', color: dossierStatus.isComplete ? '#166534' : '#854d0e' }}>
                      Terunggah: {dossierStatus.filledCount} / {DOSSIER_DOCUMENTS.length} Berkas
                    </span>
                  </div>

                  <div className="form-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {DOSSIER_DOCUMENTS.map((doc, idx) => {
                      const isSem1 = String(formData.semester || '').trim() === '1';
                      const isMandatory = doc.required || (doc.id === 'buktiDiterima' && isSem1);
                      const isUploaded = Boolean(formData[doc.key]);
                      const fileValue = formData[doc.key];

                      return (
                        <div
                          key={doc.key}
                          style={{
                            background: isUploaded ? '#f0fdf4' : '#f8fafc',
                            border: `1.5px solid ${isUploaded ? '#86efac' : isMandatory ? '#cbd5e1' : '#e2e8f0'}`,
                            borderRadius: '12px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                                {doc.category}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: isMandatory ? '#fee2e2' : '#f1f5f9',
                                  color: isMandatory ? '#991b1b' : '#64748b'
                                }}
                              >
                                {isMandatory ? 'Wajib' : doc.conditionalNote || 'Tidak Wajib'}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16324A', marginBottom: '0.25rem' }}>
                              {idx + 1}. {doc.label}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                              {doc.sublabel}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Format: {doc.formatLabel}
                            </div>
                          </div>

                          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {isUploaded ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '100%' }}>
                                <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                                  {fileValue}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(doc.key)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  Hapus
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: isMandatory ? '#b91c1c' : '#64748b', fontWeight: 500 }}>
                                {isMandatory ? 'Belum Diunggah' : 'Belum Dilampirkan'}
                              </span>
                            )}

                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: 'var(--navy)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              <input
                                type="file"
                                accept={doc.fileTypes}
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileUpload(doc.key, e.target.files[0])}
                              />
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              <span>{isUploaded ? 'Ganti File' : 'Pilih Berkas'}</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FORM ACTIONS */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    style={{
                      padding: '0.875rem 1.5rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '0.925rem',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                      flex: '1 1 auto'
                    }}
                  >
                    Simpan Draf Berkas
                  </button>

                  <button
                    type="submit"
                    className="btn btn-gold"
                    style={{
                      padding: '0.875rem 2rem',
                      borderRadius: '8px',
                      fontSize: '0.925rem',
                      fontWeight: 700,
                      flex: '2 1 auto'
                    }}
                  >
                    {isSubmitted ? 'Perbarui & Kirim Ulang Berkas' : 'Kirim Pendaftaran Duta Kampus →'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: RIWAYAT PENDAFTARAN */}
          {activeTab === 'riwayat' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.75rem', boxSizing: 'border-box' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16324A', margin: '0 0 0.35rem' }}>
                  Riwayat & Linimasa Seleksi Duta Kampus
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                  Pantau perkembangan tahapan seleksi Anda secara transparan.
                </p>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  background: selectionStage === 'lolos' 
                    ? '#f0fdf4' 
                    : selectionStage === 'tidak_lolos' 
                    ? '#fef2f2' 
                    : isSubmitted ? '#fffbeb' : '#f8fafc',
                  border: `1.5px solid ${
                    selectionStage === 'lolos' 
                      ? '#86efac' 
                      : selectionStage === 'tidak_lolos' 
                      ? '#fecaca' 
                      : isSubmitted ? '#fde68a' : '#e2e8f0'
                  }`,
                  borderRadius: '16px',
                  padding: '1.75rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 800, color: '#16324A', fontSize: '1.1rem' }}>
                    Status Seleksi Administrasi Berkas
                  </div>
                  
                  <span
                    style={{
                      background: selectionStage === 'lolos' ? '#166534' : selectionStage === 'tidak_lolos' ? '#991b1b' : isSubmitted ? '#b45309' : '#64748b',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '6px'
                    }}
                  >
                    {selectionStage === 'lolos' && 'LOLOS SELEKSI BERKAS'}
                    {selectionStage === 'tidak_lolos' && 'TIDAK LOLOS'}
                    {selectionStage !== 'lolos' && selectionStage !== 'tidak_lolos' && (isSubmitted ? 'DALAM REVIEW PANITIA' : 'BELUM KIRIM BERKAS')}
                  </span>
                </div>

                <p style={{ fontSize: '0.925rem', color: '#334155', lineHeight: 1.6, margin: '0 0 1rem' }}>
                  {selectionStage === 'lolos' && (selectionMessage || DEFAULT_MESSAGES.lolos)}
                  {selectionStage === 'tidak_lolos' && (selectionMessage || DEFAULT_MESSAGES.tidak_lolos)}
                  {selectionStage !== 'lolos' && selectionStage !== 'tidak_lolos' && (
                    isSubmitted 
                      ? 'Berkas pendaftaran Anda telah lengkap tersimpan di sistem. Panitia seleksi sedang meninjau kelayakan data akademik dan berkas administrasi Anda.'
                      : 'Akun Anda telah disetujui panitia. Silakan lengkapi formulir pendaftaran duta agar berkas Anda dapat ditinjau.'
                  )}
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.825rem', color: '#64748b', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.75rem' }}>
                  <div>Waktu Akun Dibuat: <strong>{user.createdAt ? formatDateTime(user.createdAt) : '—'}</strong></div>
                  <div>Status Dokumen: <strong style={{ color: dossierStatus.color }}>{dossierStatus.statusLabel}</strong></div>
                </div>
              </div>

              {/* Linimasa Tahapan Seleksi */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16324A', margin: '0 0 1.5rem' }}>
                  Linimasa Rangkaian Seleksi Duta Kampus 2026
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {[
                    {
                      no: '1',
                      title: 'Batch 1: Pendaftaran Akun & Dokumen',
                      date: '5 – 15 Oktober 2026',
                      desc: 'Pengisian biodata pribadi, data akademik, dan pengunggahan 10 berkas persyaratan.',
                      isDone: Boolean(isSubmitted || dossierStatus.isComplete),
                      isCurrent: !isSubmitted,
                      badge: isSubmitted ? 'Selesai Dikirim' : 'Sedang Dilakukan'
                    },
                    {
                      no: '2',
                      title: 'Batch 2: Masa Perpanjangan Berkas',
                      date: '17 s.d. 26 Oktober 2026',
                      desc: 'Perpanjangan pendaftaran dan verifikasi kelengkapan dokumen oleh tim juri admisi.',
                      isDone: selectionStage === 'lolos',
                      isCurrent: selectionStage === 'review',
                      badge: selectionStage === 'lolos' ? 'Dinyatakan Lolos' : selectionStage === 'tidak_lolos' ? 'Belum Berhasil' : 'Dalam Proses'
                    },
                    {
                      no: '3',
                      title: 'Technical Meeting (TM) Pemilihan',
                      date: '31 Oktober 2026',
                      desc: 'Pengarahan teknis mekanisme seleksi, tata tertib, dan penjelasan tahapan tes.',
                      isDone: false,
                      isCurrent: selectionStage === 'lolos',
                      badge: selectionStage === 'lolos' ? 'Tahap Selanjutnya' : 'Menunggu'
                    },
                    {
                      no: '4',
                      title: 'Seleksi Tahap 1: Wawancara Komprehensif',
                      date: '3 November 2026',
                      desc: 'Uji wawasan kebangsaan, keislaman siber, keuniversitasan UIN SSC, dan public speaking.',
                      isDone: false,
                      isCurrent: false,
                      badge: 'Tahap 1'
                    },
                    {
                      no: '5',
                      title: 'Seleksi Tahap 2: Unjuk Bakat & Potensi Diri',
                      date: '7 November 2026',
                      desc: 'Penampilan minat bakat seni, budaya, riset, atau inovasi di hadapan tim juri.',
                      isDone: false,
                      isCurrent: false,
                      badge: 'Tahap 2'
                    },
                    {
                      no: '6',
                      title: 'Pengukuhan & Penobatan Resmi Duta Kampus 2026',
                      date: '9 November 2026',
                      desc: 'Penetapan resmi representasi mahasiswa unggul UIN Siber Syekh Nurjati Cirebon.',
                      isDone: false,
                      isCurrent: false,
                      badge: 'Pengukuhan'
                    }
                  ].map((step) => (
                    <div
                      key={step.no}
                      style={{
                        display: 'flex',
                        gap: '1.25rem',
                        alignItems: 'flex-start',
                        borderLeft: `2.5px solid ${step.isDone ? '#16a34a' : step.isCurrent ? '#C49E59' : '#e2e8f0'}`,
                        paddingLeft: '1.5rem',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: '-13px',
                          top: '0px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: step.isDone ? '#16a34a' : step.isCurrent ? '#C49E59' : '#e2e8f0',
                          color: step.isDone || step.isCurrent ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          boxShadow: '0 0 0 3px #fff'
                        }}
                      >
                        {step.isDone ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          step.no
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: '#16324A', fontSize: '0.975rem' }}>
                            {step.title}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                            {step.date}
                          </span>
                        </div>
                        <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                          {step.desc}
                        </p>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: step.isDone ? '#dcfce7' : step.isCurrent ? '#fef3c7' : '#f1f5f9',
                            color: step.isDone ? '#166534' : step.isCurrent ? '#92400e' : '#64748b'
                          }}
                        >
                          {step.badge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (HP VIEW <= 768px) */}
      <nav className="user-dashboard-bottom-nav">
        <button
          type="button"
          onClick={() => {
            setActiveTab('beranda');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`user-bottom-nav-item ${activeTab === 'beranda' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('pendaftaran');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`user-bottom-nav-item ${activeTab === 'pendaftaran' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>Berkas</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('riwayat');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`user-bottom-nav-item ${activeTab === 'riwayat' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Riwayat</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="user-bottom-nav-item"
          style={{ color: '#ef4444' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Keluar</span>
        </button>
      </nav>
    </div>
  );
}
