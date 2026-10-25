import React, { useState, useEffect } from 'react';
import Link from './Link';
import Image from './Image';
import { Auth } from '../lib/auth';
import { DB, formatDateTime } from '../lib/db';
import { DOSSIER_DOCUMENTS, evaluateDossierCompleteness, DEFAULT_MESSAGES } from '../lib/dossier';
import { DriveStorage, normalizeDocument } from '../lib/driveStorage';
import { listenToUserFromCloud, fetchApplicantFromCloudByIdentifier, listenToApplicantFromCloud, syncUserToCloud } from '../lib/firebase';
import DocumentPreviewModal from './DocumentPreviewModal';

export default function UserDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('beranda'); // 'beranda' | 'pendaftaran' | 'riwayat'
  const [saveNotice, setSaveNotice] = useState('');
  const [formAlert, setFormAlert] = useState({ show: false, message: '', type: 'info' });
  const [currentUser, setCurrentUser] = useState(user);
  const [previewModal, setPreviewModal] = useState({ isOpen: false, docKey: '', docLabel: '', docValue: null });

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
    docSuratPernyataan: user.docSuratPernyataan || user.berkas?.docSuratPernyataan || '',
    docCv: user.docCv || user.berkas?.docCv || '',
    docSuratRekomendasi: user.docSuratRekomendasi || user.berkas?.docSuratRekomendasi || '',
    docSertifikatPrestasi: user.docSertifikatPrestasi || user.berkas?.docSertifikatPrestasi || '',
    docFotoLengkap: user.docFotoLengkap || user.berkas?.docFotoLengkap || '',
    docMotivationLetter: user.docMotivationLetter || user.berkas?.docMotivationLetter || '',
    docBuktiFollow: user.docBuktiFollow || user.berkas?.docBuktiFollow || '',
    docKtm: user.docKtm || user.berkas?.docKtm || '',
    docTranskripNilai: user.docTranskripNilai || user.berkas?.docTranskripNilai || '',
    docBuktiDiterima: user.docBuktiDiterima || user.berkas?.docBuktiDiterima || '',
  });

  const [isSubmitted, setIsSubmitted] = useState(user.berkasSubmitted || false);
  const [loadingDocKey, setLoadingDocKey] = useState(null); // 'deleting-docKey' or 'uploading-docKey'
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Target deadline countdown: 25 Oktober 2026 pukul 23:59:59 WIB
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0, isExpired: false });

  useEffect(() => {
    const target = new Date(2026, 9, 25, 23, 59, 59).getTime();
    const updateCd = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff > 0) {
        setCountdown({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000),
          isExpired: false
        });
      } else {
        setCountdown({ d: 0, h: 0, m: 0, s: 0, isExpired: true });
      }
    };
    updateCd();
    const timer = setInterval(updateCd, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state from storage and live cloud for instant Lolos/Tidak Lolos announcement updates
  useEffect(() => {
    const refreshUserData = () => {
      const users = Auth.getUsers();
      const fresh = users.find(u => u.email.toLowerCase() === (user.email || '').toLowerCase());
      if (fresh) {
        setCurrentUser(fresh);
        if (fresh.berkasSubmitted) {
          setIsSubmitted(true);
        }
        setFormData(prev => ({
          ...prev,
          docSuratPernyataan: fresh.docSuratPernyataan !== undefined ? fresh.docSuratPernyataan : (fresh.berkas?.docSuratPernyataan || ''),
          docCv: fresh.docCv !== undefined ? fresh.docCv : (fresh.berkas?.docCv || ''),
          docSuratRekomendasi: fresh.docSuratRekomendasi !== undefined ? fresh.docSuratRekomendasi : (fresh.berkas?.docSuratRekomendasi || ''),
          docSertifikatPrestasi: fresh.docSertifikatPrestasi !== undefined ? fresh.docSertifikatPrestasi : (fresh.berkas?.docSertifikatPrestasi || ''),
          docFotoLengkap: fresh.docFotoLengkap !== undefined ? fresh.docFotoLengkap : (fresh.berkas?.docFotoLengkap || ''),
          docMotivationLetter: fresh.docMotivationLetter !== undefined ? fresh.docMotivationLetter : (fresh.berkas?.docMotivationLetter || ''),
          docBuktiFollow: fresh.docBuktiFollow !== undefined ? fresh.docBuktiFollow : (fresh.berkas?.docBuktiFollow || ''),
          docKtm: fresh.docKtm !== undefined ? fresh.docKtm : (fresh.berkas?.docKtm || ''),
          docTranskripNilai: fresh.docTranskripNilai !== undefined ? fresh.docTranskripNilai : (fresh.berkas?.docTranskripNilai || ''),
          docBuktiDiterima: fresh.docBuktiDiterima !== undefined ? fresh.docBuktiDiterima : (fresh.berkas?.docBuktiDiterima || ''),
        }));
      }
      const existingInDb = DB.getAll().find(
        (item) => (item.email || '').toLowerCase() === (user.email || '').toLowerCase()
      );
      if (existingInDb && !existingInDb.isAccountApplication) {
        if (existingInDb.berkasSubmitted) {
          setIsSubmitted(true);
        }
        const { selectionStage: _stage, selectionMessage: _msg, status: _st, accountStatus: _acc, ...cleanDraft } = existingInDb;
        setFormData(prev => ({
          ...prev,
          ...cleanDraft,
          docSuratPernyataan: cleanDraft.docSuratPernyataan !== undefined ? cleanDraft.docSuratPernyataan : (cleanDraft.berkas?.docSuratPernyataan || ''),
          docCv: cleanDraft.docCv !== undefined ? cleanDraft.docCv : (cleanDraft.berkas?.docCv || ''),
          docSuratRekomendasi: cleanDraft.docSuratRekomendasi !== undefined ? cleanDraft.docSuratRekomendasi : (cleanDraft.berkas?.docSuratRekomendasi || ''),
          docSertifikatPrestasi: cleanDraft.docSertifikatPrestasi !== undefined ? cleanDraft.docSertifikatPrestasi : (cleanDraft.berkas?.docSertifikatPrestasi || ''),
          docFotoLengkap: cleanDraft.docFotoLengkap !== undefined ? cleanDraft.docFotoLengkap : (cleanDraft.berkas?.docFotoLengkap || ''),
          docMotivationLetter: cleanDraft.docMotivationLetter !== undefined ? cleanDraft.docMotivationLetter : (cleanDraft.berkas?.docMotivationLetter || ''),
          docBuktiFollow: cleanDraft.docBuktiFollow !== undefined ? cleanDraft.docBuktiFollow : (cleanDraft.berkas?.docBuktiFollow || ''),
          docKtm: cleanDraft.docKtm !== undefined ? cleanDraft.docKtm : (cleanDraft.berkas?.docKtm || ''),
          docTranskripNilai: cleanDraft.docTranskripNilai !== undefined ? cleanDraft.docTranskripNilai : (cleanDraft.berkas?.docTranskripNilai || ''),
          docBuktiDiterima: cleanDraft.docBuktiDiterima !== undefined ? cleanDraft.docBuktiDiterima : (cleanDraft.berkas?.docBuktiDiterima || ''),
        }));
      }
    };

    refreshUserData();
    window.addEventListener('storage', refreshUserData);

    const handleDocDeleted = (e) => {
      const { emailOrId, docKey } = e.detail || {};
      if ((emailOrId || '').toLowerCase() === (user.email || '').toLowerCase()) {
        setFormData(prev => ({ ...prev, [docKey]: '' }));
      }
    };
    window.addEventListener('document-deleted', handleDocDeleted);

    // Live single-user Firestore listener: instant result updates with 0 wasteful reads
    const unsubscribeCloud = listenToUserFromCloud(user.email, (cloudUser) => {
      if (cloudUser === null) {
        const sessionCreated = Number(localStorage.getItem('dutauinssc_session_created') || 0);
        const localUser = Auth.getCurrentUser();
        const isRecent = (sessionCreated && (Date.now() - sessionCreated < 600000)) ||
                         (localUser && localUser.createdAt && (Date.now() - new Date(localUser.createdAt).getTime() < 600000));
        if (isRecent) {
          if (localUser) syncUserToCloud(localUser);
          return;
        }
        // Account has been deleted from server database!
        Auth.logout();
        const allUsers = Auth.getUsers().filter(u => (u.email || '').toLowerCase() !== (user.email || '').toLowerCase());
        localStorage.setItem('dutauinssc_users', JSON.stringify(allUsers));
        if (typeof onLogout === 'function') onLogout();
        else window.location.href = '/login';
        return;
      }
      if (cloudUser) {
        setCurrentUser(prev => ({ ...prev, ...cloudUser }));
        if (cloudUser.berkasSubmitted) {
          setIsSubmitted(true);
        }
        try {
          const allUsers = Auth.getUsers();
          const idx = allUsers.findIndex(u => (u.email || '').toLowerCase() === (user.email || '').toLowerCase());
          if (idx !== -1) {
            allUsers[idx] = { ...allUsers[idx], ...cloudUser };
            localStorage.setItem('dutauinssc_users', JSON.stringify(allUsers));
          }
        } catch (e) {}
      }
    });

    // Live applicant dossier Firestore sync: instant sync on HP and new devices
    fetchApplicantFromCloudByIdentifier(user.email).then(cloudApp => {
      if (cloudApp) {
        setIsSubmitted(true);
        setFormData(prev => ({
          ...prev,
          ...cloudApp,
          docSuratPernyataan: cloudApp.docSuratPernyataan || cloudApp.berkas?.docSuratPernyataan || '',
          docCv: cloudApp.docCv || cloudApp.berkas?.docCv || '',
          docSuratRekomendasi: cloudApp.docSuratRekomendasi || cloudApp.berkas?.docSuratRekomendasi || '',
          docSertifikatPrestasi: cloudApp.docSertifikatPrestasi || cloudApp.berkas?.docSertifikatPrestasi || '',
          docFotoLengkap: cloudApp.docFotoLengkap || cloudApp.berkas?.docFotoLengkap || '',
          docMotivationLetter: cloudApp.docMotivationLetter || cloudApp.berkas?.docMotivationLetter || '',
          docBuktiFollow: cloudApp.docBuktiFollow || cloudApp.berkas?.docBuktiFollow || '',
          docKtm: cloudApp.docKtm || cloudApp.berkas?.docKtm || '',
          docTranskripNilai: cloudApp.docTranskripNilai || cloudApp.berkas?.docTranskripNilai || '',
          docBuktiDiterima: cloudApp.docBuktiDiterima || cloudApp.berkas?.docBuktiDiterima || '',
        }));
        // Cache in local DB so DB.getAll() has it on HP
        const currentList = DB.getAll();
        const k = (cloudApp.email || String(cloudApp.id)).toLowerCase();
        const map = new Map();
        currentList.forEach(a => map.set((a.email || String(a.id)).toLowerCase(), a));
        map.set(k, { ...(map.get(k) || {}), ...cloudApp });
        localStorage.setItem('dutauinssc_pendaftar', JSON.stringify(Array.from(map.values())));
        window.dispatchEvent(new Event('storage'));
      }
    }).catch(() => {});

    const unsubscribeAppCloud = listenToApplicantFromCloud(user.email, (cloudApp) => {
      if (cloudApp) {
        setIsSubmitted(true);
        setFormData(prev => ({
          ...prev,
          ...cloudApp,
          docSuratPernyataan: cloudApp.docSuratPernyataan || cloudApp.berkas?.docSuratPernyataan || '',
          docCv: cloudApp.docCv || cloudApp.berkas?.docCv || '',
          docSuratRekomendasi: cloudApp.docSuratRekomendasi || cloudApp.berkas?.docSuratRekomendasi || '',
          docSertifikatPrestasi: cloudApp.docSertifikatPrestasi || cloudApp.berkas?.docSertifikatPrestasi || '',
          docFotoLengkap: cloudApp.docFotoLengkap || cloudApp.berkas?.docFotoLengkap || '',
          docMotivationLetter: cloudApp.docMotivationLetter || cloudApp.berkas?.docMotivationLetter || '',
          docBuktiFollow: cloudApp.docBuktiFollow || cloudApp.berkas?.docBuktiFollow || '',
          docKtm: cloudApp.docKtm || cloudApp.berkas?.docKtm || '',
          docTranskripNilai: cloudApp.docTranskripNilai || cloudApp.berkas?.docTranskripNilai || '',
          docBuktiDiterima: cloudApp.docBuktiDiterima || cloudApp.berkas?.docBuktiDiterima || '',
        }));
      }
    });

    const handleAuthLogout = () => {
      if (typeof onLogout === 'function') onLogout();
      else window.location.href = '/login';
    };
    window.addEventListener('auth-logout', handleAuthLogout);

    return () => {
      window.removeEventListener('storage', refreshUserData);
      window.removeEventListener('document-deleted', handleDocDeleted);
      window.removeEventListener('auth-logout', handleAuthLogout);
      if (typeof unsubscribeCloud === 'function') unsubscribeCloud();
      if (typeof unsubscribeAppCloud === 'function') unsubscribeAppCloud();
    };
  }, [user.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (docKey, file, docLabel) => {
    if (!file) return;
    setLoadingDocKey(`uploading-${docKey}`);
    setSaveNotice(`Mengunggah berkas ${file.name}...`);
    try {
      const docData = await DriveStorage.uploadFile(file, {
        applicantName: formData.namaLengkap,
        applicantNim: formData.nim,
        applicantEmail: user.email,
        docKey,
        docLabel
      });

      setFormData(prev => ({
        ...prev,
        [docKey]: docData,
        berkas: { ...(prev.berkas || {}), [docKey]: docData }
      }));
      await DriveStorage.saveDocument(user.email, docKey, docData);
      setSaveNotice(`Berkas ${file.name} berhasil disimpan.`);
      triggerAlert(`Berkas ${docLabel} berhasil disimpan.`, 'success');
    } catch (err) {
      const errMsg = 'Kendala unggah berkas: ' + (err.message || 'Gagal menyimpan dokumen.');
      setSaveNotice({ type: 'error', message: errMsg });
      triggerAlert(errMsg, 'danger');
    } finally {
      setLoadingDocKey(null);
      setTimeout(() => setSaveNotice(''), 4500);
    }
  };

  const handleRemoveFile = async (docKey) => {
    const docData = normalizeDocument(formData[docKey]);
    setLoadingDocKey(`deleting-${docKey}`);
    setSaveNotice('Menghapus berkas...');
    try {
      setFormData(prev => {
        const next = { ...prev };
        next[docKey] = '';
        if (next.berkas) {
          next.berkas = { ...next.berkas };
          delete next.berkas[docKey];
        }
        return next;
      });
      await DriveStorage.deleteDocument(user.email, docKey, docData?.driveId);
      setSaveNotice('Berkas berhasil dihapus.');
      triggerAlert('Berkas berhasil dihapus.', 'success');
    } catch (err) {
      triggerAlert('Gagal menghapus berkas: ' + (err.message || 'Terjadi kendala'), 'danger');
    } finally {
      setLoadingDocKey(null);
      setTimeout(() => setSaveNotice(''), 3000);
    }
  };

  const handleSaveDraft = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSavingDraft(true);
    setSaveNotice('Menyimpan draf formulir dan berkas...');
    try {
      const users = Auth.getUsers();
      const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
      const existing = DB.getAll().find(i => (i.email || '').toLowerCase() === user.email.toLowerCase());

      const cleanForm = { ...formData };
      delete cleanForm.selectionStage;
      delete cleanForm.selectionMessage;
      delete cleanForm.accountStatus;
      delete cleanForm.status;

      // Keep only active uploaded documents, never revive deleted documents
      cleanForm.berkas = {};
      DOSSIER_DOCUMENTS.forEach(d => {
        const val = cleanForm[d.key];
        if (val && val !== '' && val !== '-' && val !== 'null') {
          cleanForm.berkas[d.key] = val;
        } else {
          cleanForm[d.key] = '';
        }
      });

      if (idx !== -1) {
        users[idx] = { 
          ...users[idx], 
          ...cleanForm,
          updatedAt: new Date().toISOString()
        };
        DOSSIER_DOCUMENTS.forEach(d => {
          if (!cleanForm[d.key]) {
            users[idx][d.key] = '';
            if (users[idx].berkas) delete users[idx].berkas[d.key];
          }
        });
        Auth.saveUsers(users, users[idx]);
        setCurrentUser(users[idx]);
      }

      // Sync immediately to DB so Admin sees semester and all draft updates right away
      if (existing) {
        let updatedItem = null;
        const allDb = DB.getAll().map(i => {
          if ((i.email || '').toLowerCase() === user.email.toLowerCase()) {
            updatedItem = {
              ...i,
              ...cleanForm,
              semester: formData.semester,
              prodi: formData.jurusan || formData.fakultas,
              updatedAt: new Date().toISOString()
            };
            DOSSIER_DOCUMENTS.forEach(d => {
              if (!cleanForm[d.key]) {
                updatedItem[d.key] = '';
                if (updatedItem.berkas) delete updatedItem.berkas[d.key];
              }
            });
            return updatedItem;
          }
          return i;
        });
        DB.save(allDb, updatedItem);
      } else {
        const newItem = {
          ...cleanForm,
          email: user.email,
          semester: formData.semester,
          prodi: formData.jurusan || formData.fakultas,
          status: 'pending',
          selectionStage: 'review',
        };
        DB.add(newItem);
      }

      setSaveNotice('Draf formulir dan dokumen pendaftaran berhasil disimpan.');
      triggerAlert('Draf formulir dan dokumen berhasil disimpan.', 'success');
    } catch (err) {
      triggerAlert('Gagal menyimpan draf: ' + (err.message || 'Terjadi kesalahan'), 'danger');
    } finally {
      setIsSavingDraft(false);
      setTimeout(() => setSaveNotice(''), 3500);
    }
  };

  const handleSubmitApplication = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.ipk) {
      triggerAlert('Mohon lengkapi data nilai IPK sebelum mengirim pendaftaran.', 'danger');
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

    setIsSubmitting(true);
    setSaveNotice('Mengirim pendaftaran dan berkas persyaratan...');
    try {
      const users = Auth.getUsers();
      const idx = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
      const existing = DB.getAll().find(i => (i.email || '').toLowerCase() === user.email.toLowerCase());

      const cleanForm = { ...formData };
      delete cleanForm.selectionStage;
      delete cleanForm.selectionMessage;
      delete cleanForm.accountStatus;
      delete cleanForm.status;

      cleanForm.berkas = {};
      DOSSIER_DOCUMENTS.forEach(d => {
        if (cleanForm[d.key]) {
          cleanForm.berkas[d.key] = cleanForm[d.key];
        } else {
          cleanForm[d.key] = '';
        }
      });

      // Save or update in DB
      let savedAppItem = null;
      if (existing) {
        const allDb = DB.getAll().map(i => {
          if ((i.email || '').toLowerCase() === user.email.toLowerCase()) {
            savedAppItem = {
              ...i,
              ...cleanForm,
              semester: formData.semester,
              prodi: formData.jurusan || formData.fakultas,
              status: 'pending',
              selectionStage: 'review',
              selectionMessage: '',
              berkasSubmitted: true,
              updatedAt: new Date().toISOString()
            };
            return savedAppItem;
          }
          return i;
        });
        DB.save(allDb, savedAppItem);
      } else {
        savedAppItem = {
          ...cleanForm,
          email: user.email,
          semester: formData.semester,
          prodi: formData.jurusan || formData.fakultas,
          status: 'pending',
          selectionStage: 'review',
          selectionMessage: '',
          berkasSubmitted: true,
        };
        DB.add(savedAppItem);
      }

      // Update user status in Auth
      if (idx !== -1) {
        users[idx] = { 
          ...users[idx], 
          ...cleanForm, 
          semester: formData.semester,
          berkasSubmitted: true, 
          selectionStage: 'review',
          selectionMessage: '',
          status: 'Menunggu Review',
          updatedAt: new Date().toISOString()
        };
        Auth.saveUsers(users, users[idx]);
        setCurrentUser(users[idx]);
      }

      setIsSubmitted(true);
      setSaveNotice('Pendaftaran Duta Kampus dan 10 berkas dokumen persyaratan berhasil dikirimkan.');
      triggerAlert('Pendaftaran dan seluruh berkas berhasil dikirim untuk verifikasi Panitia Seleksi.', 'success');
      setActiveTab('riwayat');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      triggerAlert('Gagal mengirim pendaftaran: ' + (err.message || 'Terjadi kendala'), 'danger');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSaveNotice(''), 4000);
    }
  };

  const dossierStatus = evaluateDossierCompleteness(formData);
  const selectionStage = currentUser.selectionStage || (isSubmitted ? 'review' : 'none');
  const selectionMessage = currentUser.selectionMessage;

  return (
    <div className="user-dashboard-container">
      {/* SIDEBAR (Desktop) */}
      <aside 
        className="user-dashboard-sidebar"
        style={{
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          position: 'sticky',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
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
            <span>Pendaftaran Duta</span>
            {dossierStatus.isComplete ? (
              <span style={{ marginLeft: 'auto', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                Lengkap
              </span>
            ) : (
              <span style={{ marginLeft: 'auto', background: 'rgba(217, 119, 6, 0.25)', color: '#fbbf24', fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                Belum Lengkap
              </span>
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
              {activeTab === 'beranda' && 'Beranda'}
              {activeTab === 'pendaftaran' && 'Pendaftaran'}
              {activeTab === 'riwayat' && 'Riwayat'}
            </h2>
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
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '0.4px' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 800 }}>PADUKA</span> <span style={{ opacity: 0.45, fontWeight: 400 }}>|</span> dutauinssc
              </div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.75)' }}>
                Portal Peserta Duta Kampus
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
        {saveNotice && (() => {
          const isErr = typeof saveNotice === 'object' 
            ? (saveNotice.type === 'error' || saveNotice.type === 'danger')
            : (saveNotice.toLowerCase().includes('gagal') || saveNotice.toLowerCase().includes('kendala'));
          const noticeMsg = typeof saveNotice === 'object' ? saveNotice.message : saveNotice;

          return (
            <div
              style={{
                position: 'fixed',
                top: '1.25rem',
                right: '1.25rem',
                zIndex: 9999,
                background: '#16324A',
                color: '#ffffff',
                padding: '0.9rem 1.35rem',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                borderLeft: `4px solid ${isErr ? '#ef4444' : '#C49E59'}`,
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                maxWidth: '440px',
                lineHeight: 1.45
              }}
            >
              {isErr ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
              )}
              <span style={{ fontWeight: 500 }}>{noticeMsg}</span>
            </div>
          );
        })()}

        {/* TAB CONTENTS (FULL WIDTH ON DESKTOP, COMFORTABLE ON HP) */}
        <main style={{ padding: '1.75rem 2.5rem', flex: 1, width: '100%', boxSizing: 'border-box' }}>
          {/* TAB 1: BERANDA */}
          {activeTab === 'beranda' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* === HASIL KELULUSAN SELEKSI BERKAS (JIKA ADMIN ACC / TOLAK) === */}
              {selectionStage === 'lolos' && (
                <div className="announcement-card announcement-card-lolos">
                  <div className="announcement-top-bar">
                    <span className="announcement-badge-lolos">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>LOLOS SELEKSI BERKAS</span>
                    </span>
                    <span className="announcement-tag announcement-tag-lolos">
                      Tahap Administrasi 2026
                    </span>
                  </div>

                  <h3 className="announcement-title announcement-title-lolos">
                    Selamat, {formData.namaLengkap}!
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#15803d', marginTop: '3px' }}>
                      Anda Dinyatakan Lolos Seleksi Berkas Administrasi
                    </div>
                  </h3>

                  <p className="announcement-desc announcement-desc-lolos">
                    {selectionMessage || DEFAULT_MESSAGES.lolos}
                  </p>

                  <div className="announcement-steps-box announcement-steps-box-lolos">
                    <div className="announcement-steps-header announcement-steps-header-lolos">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      <span>Petunjuk Tahapan Lanjutan:</span>
                    </div>
                    <div className="announcement-steps-list">
                      <div className="announcement-step-item announcement-step-item-lolos">
                        <span className="announcement-step-num announcement-step-num-lolos">1</span>
                        <span>Bergabung ke grup koordinasi calon duta melalui tautan WhatsApp yang dikirimkan ke <strong>{formData.noHp || 'kontak terdaftar'}</strong>.</span>
                      </div>
                      <div className="announcement-step-item announcement-step-item-lolos">
                        <span className="announcement-step-num announcement-step-num-lolos">2</span>
                        <span>Siapkan pakaian formal institusi (jas almamater) untuk rangkaian sesi wawancara dan uji bakat.</span>
                      </div>
                      <div className="announcement-step-item announcement-step-item-lolos">
                        <span className="announcement-step-num announcement-step-num-lolos">3</span>
                        <span>Pantau perkembangan linimasa resmi pada menu Riwayat Pendaftaran secara berkala.</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('riwayat')}
                    className="btn btn-gold announcement-btn"
                  >
                    <span>Lihat Linimasa Lengkap</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              )}

              {selectionStage === 'tidak_lolos' && (
                <div className="announcement-card announcement-card-tidak-lolos">
                  <div className="announcement-top-bar">
                    <span className="announcement-badge-tidak-lolos">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>HASIL SELEKSI BERKAS</span>
                    </span>
                    <span className="announcement-tag announcement-tag-tidak-lolos">
                      Tahap Administrasi 2026
                    </span>
                  </div>

                  <h3 className="announcement-title announcement-title-tidak-lolos">
                    Terima Kasih, {formData.namaLengkap}
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#b91c1c', marginTop: '3px' }}>
                      Hasil Penilaian Seleksi Berkas Administrasi
                    </div>
                  </h3>

                  <p className="announcement-desc announcement-desc-tidak-lolos">
                    {selectionMessage || DEFAULT_MESSAGES.tidak_lolos}
                  </p>

                  <div className="announcement-steps-box announcement-steps-box-tidak-lolos">
                    <div className="announcement-steps-header announcement-steps-header-tidak-lolos">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      <span>Apresiasi & Informasi Kampus:</span>
                    </div>
                    <div className="announcement-steps-list">
                      <div className="announcement-step-item announcement-step-item-tidak-lolos">
                        <span className="announcement-step-num announcement-step-num-tidak-lolos">1</span>
                        <span>Apresiasi setinggi-tingginya atas antusiasme dan partisipasi aktif Anda dalam seleksi Duta Kampus 2026.</span>
                      </div>
                      <div className="announcement-step-item announcement-step-item-tidak-lolos">
                        <span className="announcement-step-num announcement-step-num-tidak-lolos">2</span>
                        <span>Terus asah potensi kepemimpinan dan dedikasi akademik melalui berbagai organisasi di lingkungan kampus.</span>
                      </div>
                      <div className="announcement-step-item announcement-step-item-tidak-lolos">
                        <span className="announcement-step-num announcement-step-num-tidak-lolos">3</span>
                        <span>Tetap pantau portal kegiatan UIN Siber Syekh Nurjati Cirebon untuk kesempatan dan program institusi berikutnya.</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('riwayat')}
                    className="btn btn-outline-gold announcement-btn"
                  >
                    <span>Cek Riwayat Dokumen</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              )}

              {/* === PENGINGAT BATAS WAKTU & KELENGKAPAN BERKAS (OFFICIAL WARNING STYLE) === */}
              <div
                style={{
                  background: '#fffdf5',
                  border: '1.5px solid #fcd34d',
                  borderLeft: '6px solid #d97706',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 2px 10px rgba(217, 119, 6, 0.06)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {/* Official Institutional Warning Header Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  paddingBottom: '0.85rem',
                  marginBottom: '1.1rem',
                  borderBottom: '1px solid #fde68a'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#b45309',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.6px',
                      textTransform: 'uppercase',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      PERINGATAN
                    </span>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#92400e' }}>
                      Batas Akhir Kelengkapan Berkas Seleksi
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#78350f', fontWeight: 600 }}>
                    Penutupan: 25 Oktober 2026 · 23:59 WIB
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  marginBottom: '1.15rem'
                }}>
                  {/* Warning Header with clean alert icon */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem', flex: 1, minWidth: '280px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      color: '#b45309',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>

                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 700, color: '#92400e', letterSpacing: '-0.2px' }}>
                        {dossierStatus.isComplete
                          ? 'Berkas Persyaratan Anda Telah Lengkap'
                          : `Peringatan: ${dossierStatus.missingFields.length} Berkas Persyaratan Belum Diunggah`}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: '#78350f', marginTop: '4px', lineHeight: 1.5 }}>
                        {dossierStatus.isComplete
                          ? 'Seluruh dokumen persyaratan esensial telah berhasil tersimpan di sistem. Pastikan keabsahan seluruh dokumen sebelum verifikasi panitia ditutup.'
                          : 'Segera unggah seluruh berkas yang diperlukan. Akun yang belum melengkapi berkas hingga batas waktu penutupan tidak dapat diproses dalam seleksi administrasi.'}
                      </div>
                    </div>
                  </div>

                  {/* Clean Digital Countdown Tiles with Warning Palette */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '0.65rem 0.95rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(217, 119, 6, 0.08)'
                  }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
                      Sisa Waktu Penutupan
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {[
                        { label: 'Hari', val: countdown.d },
                        { label: 'Jam', val: countdown.h },
                        { label: 'Menit', val: countdown.m },
                        { label: 'Detik', val: countdown.s }
                      ].map((item, idx) => (
                        <React.Fragment key={item.label}>
                          <div style={{
                            background: '#fffdf5',
                            border: '1px solid #fcd34d',
                            borderRadius: '6px',
                            minWidth: '46px',
                            padding: '4px 6px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#92400e', fontFamily: 'monospace', lineHeight: 1.1 }}>
                              {String(item.val).padStart(2, '0')}
                            </div>
                            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', marginTop: '2px' }}>
                              {item.label}
                            </div>
                          </div>
                          {idx < 3 && (
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#d97706' }}>:</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress bar & missing documents alert callout */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '0.95rem 1.25rem',
                  marginBottom: '1.15rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#78350f' }}>
                      Status Kelengkapan Dokumen
                    </span>
                    <span style={{ fontSize: '0.825rem', fontWeight: 700, color: dossierStatus.isComplete ? '#16a34a' : '#b45309' }}>
                      {dossierStatus.filledCount} dari {dossierStatus.totalCount} berkas ({dossierStatus.percent}%)
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: '#fef3c7', borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{
                      width: `${dossierStatus.percent}%`,
                      height: '100%',
                      background: dossierStatus.isComplete ? '#16a34a' : '#d97706',
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  {dossierStatus.isComplete ? (
                    <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Seluruh berkas persyaratan telah lengkap terunggah di sistem.
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#78350f', fontWeight: 600, marginBottom: '6px' }}>
                        Dokumen yang belum diunggah ({dossierStatus.missingFields.length} dokumen):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {dossierStatus.missingFields.map((field) => {
                          const label = typeof field === 'object' ? field.label : field;
                          return (
                            <span
                              key={label}
                              style={{
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                color: '#92400e',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 600
                              }}
                            >
                              • {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {!isSubmitted ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('pendaftaran');
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      className="btn btn-gold btn-sm"
                      style={{ fontWeight: 600, padding: '0.55rem 1.25rem', borderRadius: '6px' }}
                    >
                      Lengkapi Berkas Sekarang →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('riwayat');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="btn btn-gold btn-sm"
                      style={{ fontWeight: 600, padding: '0.55rem 1.25rem', borderRadius: '6px' }}
                    >
                      Lihat Berkas Saya
                    </button>
                  )}

                  <a
                    href="https://drive.google.com/drive/folders/1WQUTBWazFp6GbT4r4wjIKTD6HNGKrgoH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-gold btn-sm"
                    style={{ fontWeight: 600, padding: '0.55rem 1rem', borderRadius: '6px', background: '#ffffff' }}
                  >
                    Unduh Booklet Panduan
                  </a>
                </div>
              </div>

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

          {/* TAB 2: PENDAFTARAN DUTA */}
          {activeTab === 'pendaftaran' && (
            <div style={{ width: '100%', boxSizing: 'border-box' }}>
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16324A', margin: '0' }}>
                  Formulir Pendaftaran
                </h3>
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
                        placeholder="Nama lengkap"
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
                        placeholder="NIM"
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
                        placeholder="Fakultas"
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
                        placeholder="Program studi"
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
                      Informasi semester, nilai IPK kumulatif, serta kontak WhatsApp aktif.
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
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                        <option value="3">Semester 3</option>
                        <option value="4">Semester 4</option>
                        <option value="5">Semester 5</option>
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
                        placeholder="Contoh: 3.75"
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
                        placeholder="Nomor WhatsApp"
                        value={formData.noHp}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#16324A', marginBottom: '0.5rem' }}>
                        Alamat Domisili <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="alamat"
                        placeholder="Alamat domisili"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        required
                        style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.925rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* DOKUMEN PERSYARATAN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ borderBottom: '1.5px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem', color: '#16324A', fontSize: '1.1rem', fontWeight: 700 }}>
                        3. Berkas Dokumen Persyaratan
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                        Lampirkan dokumen resmi persyaratan seleksi Pemilihan Duta Kampus 2026.
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
                      const docData = normalizeDocument(formData[doc.key], doc.label);
                      const isUploaded = Boolean(docData);
                      const fileValue = docData ? docData.name : '';

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
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: isMandatory ? '#fee2e2' : '#f1f5f9',
                                  color: isMandatory ? '#991b1b' : '#64748b'
                                }}
                              >
                                {isMandatory ? 'Wajib' : doc.conditionalNote || 'Tidak Wajib'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {doc.formatLabel}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16324A', marginBottom: '0.25rem' }}>
                              {idx + 1}. {doc.label}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                              {doc.sublabel}
                            </div>
                          </div>

                          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {loadingDocKey === `deleting-${doc.key}` ? (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: '#fee2e2',
                                border: '1px solid #fca5a5',
                                color: '#991b1b',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                              }}>
                                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                                Sedang Menghapus...
                              </div>
                            ) : loadingDocKey === `uploading-${doc.key}` ? (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                color: '#92400e',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                              }}>
                                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                                Mengunggah & Menyimpan...
                              </div>
                            ) : isUploaded ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewModal({
                                    isOpen: true,
                                    docKey: doc.key,
                                    docLabel: doc.label,
                                    docValue: formData[doc.key],
                                    applicantEmailOrId: user.email,
                                    applicantName: formData.namaLengkap
                                  })}
                                  style={{
                                    background: '#dcfce7',
                                    border: '1px solid #86efac',
                                    color: '#166534',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                  Lihat / Pratinjau
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(doc.key)}
                                  disabled={loadingDocKey !== null}
                                  style={{
                                    background: 'rgba(220, 38, 38, 0.08)',
                                    border: '1px solid rgba(220, 38, 38, 0.25)',
                                    color: '#dc2626',
                                    cursor: loadingDocKey !== null ? 'not-allowed' : 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s'
                                  }}
                                  title="Hapus berkas ini secara permanen"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                  Hapus
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: isMandatory ? '#b91c1c' : '#64748b', fontWeight: 500 }}>
                                {isMandatory ? 'Belum Diunggah' : 'Belum Dilampirkan'}
                              </span>
                            )}

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <label
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: 'var(--navy)',
                                  cursor: loadingDocKey !== null ? 'not-allowed' : 'pointer',
                                  opacity: loadingDocKey !== null ? 0.6 : 1,
                                  transition: 'all 0.2s'
                                }}
                              >
                                <input
                                  type="file"
                                  accept={doc.fileTypes}
                                  style={{ display: 'none' }}
                                  disabled={loadingDocKey !== null}
                                  onChange={(e) => handleFileUpload(doc.key, e.target.files[0], doc.label)}
                                />
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                <span>{isUploaded ? 'Ganti File' : 'Pilih Berkas'}</span>
                              </label>

                              <button
                                type="button"
                                disabled={loadingDocKey !== null}
                                onClick={() => setPreviewModal({
                                  isOpen: true,
                                  docKey: doc.key,
                                  docLabel: doc.label,
                                  docValue: formData[doc.key],
                                  applicantEmailOrId: user.email,
                                  applicantName: formData.namaLengkap
                                })}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  fontSize: '0.72rem',
                                  color: 'var(--navy)',
                                  cursor: loadingDocKey !== null ? 'not-allowed' : 'pointer',
                                  opacity: loadingDocKey !== null ? 0.6 : 1,
                                  fontWeight: 600
                                }}
                                title="Tautkan Link Google Drive"
                              >
                                Tautan Drive
                              </button>
                            </div>
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
                    disabled={isSavingDraft || isSubmitting}
                    style={{
                      padding: '0.875rem 1.5rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      background: isSavingDraft ? '#f8fafc' : '#ffffff',
                      fontSize: '0.925rem',
                      fontWeight: 600,
                      color: isSavingDraft ? '#94a3b8' : '#475569',
                      cursor: isSavingDraft || isSubmitting ? 'not-allowed' : 'pointer',
                      flex: '1 1 auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSavingDraft && (
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                    )}
                    {isSavingDraft ? 'Menyimpan Draf Berkas...' : 'Simpan Draf Berkas'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || isSavingDraft}
                    className="btn btn-gold"
                    style={{
                      padding: '0.875rem 2rem',
                      borderRadius: '8px',
                      fontSize: '0.925rem',
                      fontWeight: 700,
                      flex: '2 1 auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: isSubmitting ? 0.75 : 1,
                      cursor: isSubmitting || isSavingDraft ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting && (
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                    )}
                    {isSubmitting ? 'Mengirim Pendaftaran...' : (isSubmitted ? 'Perbarui & Kirim Ulang Berkas' : 'Kirim Pendaftaran Duta Kampus →')}
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
                className={`announcement-card ${
                  selectionStage === 'lolos'
                    ? 'announcement-card-lolos'
                    : selectionStage === 'tidak_lolos'
                    ? 'announcement-card-tidak-lolos'
                    : ''
                }`}
                style={{
                  background: selectionStage === 'lolos' 
                    ? undefined 
                    : selectionStage === 'tidak_lolos' 
                    ? undefined 
                    : isSubmitted ? '#fffbeb' : '#f8fafc',
                  border: selectionStage === 'lolos' || selectionStage === 'tidak_lolos'
                    ? undefined
                    : `1.5px solid ${isSubmitted ? '#fde68a' : '#e2e8f0'}`,
                  borderRadius: '16px',
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
                      date: '17 s.d. 25 Oktober 2026',
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

      {/* Modal Pratinjau & CRUD Berkas Dokumen */}
      <DocumentPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
        docKey={previewModal.docKey}
        docLabel={previewModal.docLabel}
        docValue={formData[previewModal.docKey] || previewModal.docValue}
        applicantEmailOrId={user.email}
        applicantName={formData.namaLengkap}
        canEdit={true}
        onUpdated={(newVal) => {
          if (newVal) {
            setFormData(prev => ({ ...prev, [previewModal.docKey]: newVal }));
          } else {
            setFormData(prev => {
              const next = { ...prev };
              delete next[previewModal.docKey];
              return next;
            });
          }
        }}
      />
    </div>
  );
}
