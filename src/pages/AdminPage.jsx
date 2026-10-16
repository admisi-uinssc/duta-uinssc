'use client';

import { useState, useEffect } from 'react';
import Image, { formatImageUrl } from '../components/Image';
import Link from '../components/Link';
import { DB, seedDemoData, formatDate, formatDateTime } from '../lib/db';
import { Settings } from '../lib/settings';
import { CMS } from '../lib/cms';
import { Auth } from '../lib/auth';
import { FAKULTAS_DATA } from '../lib/fakultasData';
import { evaluateDossierCompleteness, DEFAULT_MESSAGES } from '../lib/dossier';
import { isFirebaseConfigured, firebaseConfig, smartSyncAll, getLastSyncTime } from '../lib/firebase';
import { DriveStorage, normalizeDocument } from '../lib/driveStorage';
import DocumentPreviewModal from '../components/DocumentPreviewModal';

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(() => typeof window !== 'undefined' && localStorage.getItem('dutauinssc_admin_logged') === 'true');
  const [loginError, setLoginError] = useState(false);
  const [credentials, setCredentials] = useState({ user: '', pass: '' });
  const [showPass, setShowPass] = useState(false);
  const [page, setPage] = useState('dashboard'); // 'dashboard' | 'akun_pelamar' | 'pendaftar' | 'cms' | 'settings' | 'direktori_berkas'
  const [previousPage, setPreviousPage] = useState('akun_pelamar');
  const [applicants, setApplicants] = useState(() => DB.getAll());
  const [search, setSearch] = useState('');
  
  // Advanced Filters for Pendaftar
  const [filterFakultas, setFilterFakultas] = useState('');
  const [filterProdi, setFilterProdi] = useState('');
  const [filterCompleteness, setFilterCompleteness] = useState('');
  const [filterSelection, setFilterSelection] = useState('');

  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState(-1);
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [regOpen, setRegOpen] = useState(true);
  const [passwords, setPasswords] = useState({ cur: '', newP: '', conf: '' });
  const [cmsData, setCmsData] = useState(null);
  const [cmsTab, setCmsTab] = useState('slider'); // 'slider' | 'promo' | 'ambassadors' | 'gallery'
  const [toast, setToast] = useState('');

  // Document Preview & CRUD Modal
  const [docPreviewModal, setDocPreviewModal] = useState({
    isOpen: false,
    docKey: '',
    docLabel: '',
    docValue: null,
    applicantEmailOrId: '',
    applicantName: ''
  });

  // Google Drive & Apps Script Settings State
  const [driveConfig, setDriveConfig] = useState(() => DriveStorage.getConfig());
  const [driveSaveStatus, setDriveSaveStatus] = useState('');
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [driveTestResult, setDriveTestResult] = useState(null);
  const [isTestingDrive, setIsTestingDrive] = useState(false);

  const handleTestDriveConnection = async () => {
    setIsTestingDrive(true);
    setDriveTestResult(null);
    try {
      const res = await DriveStorage.testConnection(driveConfig.scriptUrl, driveConfig.folderId);
      setDriveTestResult(res);
      if (res.success) {
        showToast('Koneksi Google Apps Script & Google Drive Berhasil!');
      } else {
        showToast(res.needsPermission ? 'Perlu ubah Who has access ke Anyone.' : 'Uji koneksi gagal.');
      }
    } catch (err) {
      setDriveTestResult({ success: false, error: err.message || String(err) });
    } finally {
      setIsTestingDrive(false);
    }
  };

  // Selection decision message customizer in detail modal
  const [customMsg, setCustomMsg] = useState('');

  // Modals for adding new accounts and applicants
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    namaLengkap: '',
    email: '',
    password: 'rizki',
    nim: '',
    fakultas: FAKULTAS_DATA[0]?.name || '',
    jurusan: FAKULTAS_DATA[0]?.majors[0] || '',
    accountStatus: 'approved'
  });

  const [isAddApplicantModalOpen, setIsAddApplicantModalOpen] = useState(false);
  const [newApplicantForm, setNewApplicantForm] = useState({
    namaLengkap: '',
    nim: '',
    email: '',
    fakultas: FAKULTAS_DATA[0]?.name || '',
    jurusan: FAKULTAS_DATA[0]?.majors[0] || '',
    semester: '4',
    ipk: '3.75',
    noHp: '081234567890',
    alamat: 'Cirebon',
    motivasi: 'Bertekad menjadi wajah representasi mahasiswa UIN Siber Syekh Nurjati Cirebon.',
    selectionStage: 'review'
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    cancelText: 'Batalkan',
    isDestructive: false,
    onConfirm: null,
  });

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [lastSyncDisplay, setLastSyncDisplay] = useState(() => {
    const t = getLastSyncTime();
    return t ? new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Belum pernah';
  });

  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await smartSyncAll(true);
      if (res.success) {
        setLastSyncDisplay(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        refresh();
        refreshUsers();
        showToast(`Sinkronisasi Cloud berhasil! ${res.countApps || 0} pendaftar & ${res.countUsers || 0} akun dimuat.`);
      } else {
        showToast(res.error || 'Gagal menyinkronkan data cloud.', 'danger');
      }
    } catch {
      showToast('Terjadi kesalahan saat sinkronisasi cloud.', 'danger');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const askConfirmation = ({ title, message, confirmText = 'Lanjutkan', cancelText = 'Batalkan', isDestructive = false, onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDestructive,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };

  const showToast = (msg, type = 'success') => {
    setToast(typeof msg === 'string' ? msg : 'Operasi berhasil');
    setTimeout(() => setToast(''), 3500);
  };

  const [registeredUsers, setRegisteredUsers] = useState(() => Auth.getUsers());
  const [userSearch, setUserSearch] = useState('');
  const [userFilterStatus, setUserFilterStatus] = useState('');
  const [userFilterFakultas, setUserFilterFakultas] = useState('');

  // Live real-time sync with localStorage and cross-tab events
  useEffect(() => { 
    const syncAll = () => {
      setApplicants(DB.getAll()); 
      setRegisteredUsers(Auth.getUsers());
      setRegOpen(Settings.isPendaftaranOpen()); 
    };

    syncAll();
    if (!cmsData) setCmsData(CMS.get());

    const unsubUsers = Auth.subscribe(syncAll);
    const unsubDb = DB.subscribe(syncAll);
    const interval = setInterval(syncAll, 1000);

    return () => {
      unsubUsers();
      unsubDb();
      clearInterval(interval);
    };
  }, []);

  const doLogin = (e) => {
    e.preventDefault();
    const s = Settings.get();
    const validUser = (s.adminUser || 'rasikinganteng').trim().toLowerCase();
    const inputUser = (credentials.user || '').trim().toLowerCase();
    const validPass = s.adminPass || 'ghoriztea2026';

    if (inputUser === validUser && credentials.pass === validPass) {
      setLoggedIn(true); 
      setLoginError(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dutauinssc_admin_logged', 'true');
      }
    } else { 
      setLoginError(true); 
      setTimeout(() => setLoginError(false), 3000); 
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dutauinssc_admin_logged');
    }
  };

  const refresh = () => setApplicants([...DB.getAll()]);
  const refreshUsers = () => setRegisteredUsers([...Auth.getUsers()]);

  const handleApproveUser = (email) => {
    Auth.approveAccount(email);
    refreshUsers();
    refresh();
    showToast('Akun calon duta berhasil disetujui.');
  };

  const handleRejectUser = (email) => {
    Auth.rejectAccount(email);
    refreshUsers();
    refresh();
    showToast('Pengajuan akun telah ditolak.');
  };

  const handleDeleteUser = (email) => {
    askConfirmation({
      title: 'Hapus Akun Calon Duta',
      message: `Apakah Anda yakin ingin menghapus akun ${email} secara permanen? Seluruh berkas pendaftaran yang tertaut juga akan dihapus.`,
      confirmText: 'Ya, Hapus Permanen',
      isDestructive: true,
      onConfirm: () => {
        const remaining = Auth.getUsers().filter(u => u.email.toLowerCase() !== email.toLowerCase());
        Auth.saveUsers(remaining);
        const remainingDb = DB.getAll().filter(i => (i.email || '').toLowerCase() !== email.toLowerCase());
        DB.save(remainingDb);
        refreshUsers();
        refresh();
        showToast('Akun pendaftar berhasil dihapus permanen.');
      }
    });
  };

  // Dossier Approval / Rejection Controller
  const handleSetDossierStatus = (identifier, stage, messageText = '') => {
    const finalMsg = messageText || (stage === 'lolos' ? DEFAULT_MESSAGES.lolos : stage === 'tidak_lolos' ? DEFAULT_MESSAGES.tidak_lolos : DEFAULT_MESSAGES.review);

    // Sync to DB
    const allDb = DB.getAll();
    const dbIdx = allDb.findIndex(i => String(i.id) === String(identifier) || (i.email && i.email.toLowerCase() === String(identifier).toLowerCase()));
    if (dbIdx !== -1) {
      allDb[dbIdx].selectionStage = stage;
      allDb[dbIdx].selectionMessage = finalMsg;
      allDb[dbIdx].status = stage === 'lolos' ? 'diterima' : stage === 'tidak_lolos' ? 'ditolak' : 'pending';
      allDb[dbIdx].updatedAt = new Date().toISOString();
      DB.save(allDb);
    }

    // Sync to Auth Users
    const allUsers = Auth.getUsers();
    const userIdx = allUsers.findIndex(u => String(u.id) === String(identifier) || (u.email && u.email.toLowerCase() === String(identifier).toLowerCase()));
    if (userIdx !== -1) {
      allUsers[userIdx].selectionStage = stage;
      allUsers[userIdx].selectionMessage = finalMsg;
      allUsers[userIdx].status = stage === 'lolos' ? 'Lolos Seleksi Berkas' : stage === 'tidak_lolos' ? 'Tidak Lolos' : 'Menunggu Review';
      Auth.saveUsers(allUsers);
    }

    refresh();
    refreshUsers();
    showToast(
      stage === 'lolos' 
        ? 'Status berkas pendaftar ditetapkan: Lolos Seleksi Berkas.' 
        : stage === 'tidak_lolos' 
        ? 'Status berkas pendaftar ditetapkan: Tidak Lolos.' 
        : 'Status berkas diatur dalam peninjauan.'
    );
  };

  const handleCmsSave = () => {
    CMS.save(cmsData);
    showToast('Konten CMS berhasil disimpan dan langsung dipublikasikan ke web.');
  };

  // CMS Slider Helpers
  const updateSlide = (idx, field, val) => {
    const updatedSlider = (cmsData.slider || []).map((item, i) =>
      i === idx ? { ...item, [field]: val } : item
    );
    const newData = { ...cmsData, slider: updatedSlider };
    setCmsData(newData);
    CMS.save(newData);
  };
  const addSlide = () => {
    const newData = {
      ...cmsData,
      slider: [
        ...(cmsData.slider || []),
        {
          id: Date.now(),
          img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1920&q=80',
          tag: 'Pendaftaran 2026',
          title1: 'Judul Baru',
          title2: 'Sorotan Emas',
          desc: 'Tuliskan deskripsi ringkas yang menarik perhatian calon mahasiswa.',
          btnText: 'Ajukan Akun & Mulai Pendaftaran',
          btnLink: '/login'
        }
      ]
    };
    setCmsData(newData);
    CMS.save(newData);
    showToast('Slide baru ditambahkan dan langsung aktif di beranda.');
  };
  const removeSlide = (idx) => {
    askConfirmation({
      title: 'Hapus Slide Hero',
      message: 'Apakah Anda yakin ingin menghapus slide ini dari slider beranda utama?',
      confirmText: 'Hapus Slide',
      isDestructive: true,
      onConfirm: () => {
        const updatedSlider = (cmsData.slider || []).filter((_, i) => i !== idx);
        const newData = { ...cmsData, slider: updatedSlider };
        setCmsData(newData);
        CMS.save(newData);
        showToast('Slide hero dihapus dan beranda diperbarui.');
      }
    });
  };

  // CMS Promo Banner Helpers
  const updatePromoBanner = (idx, field, val) => {
    const updatedPromo = (cmsData.promoBanners || []).map((item, i) =>
      i === idx ? { ...item, [field]: val } : item
    );
    const newData = { ...cmsData, promoBanners: updatedPromo };
    setCmsData(newData);
    CMS.save(newData);
  };
  const addPromoBanner = () => {
    const newData = {
      ...cmsData,
      promoBanners: [
        ...(cmsData.promoBanners || []),
        {
          id: Date.now(),
          title: 'Judul Banner Baru',
          subtitle: 'Informasi atau ajakan singkat',
          img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&h=400&q=80',
          link: '/login'
        }
      ]
    };
    setCmsData(newData);
    CMS.save(newData);
    showToast('Banner promo baru ditambahkan dan langsung aktif.');
  };
  const removePromoBanner = (idx) => {
    askConfirmation({
      title: 'Hapus Banner Promo',
      message: 'Hapus banner promosi ini dari daftar banner?',
      confirmText: 'Hapus Banner',
      isDestructive: true,
      onConfirm: () => {
        const updatedPromo = (cmsData.promoBanners || []).filter((_, i) => i !== idx);
        const newData = { ...cmsData, promoBanners: updatedPromo };
        setCmsData(newData);
        CMS.save(newData);
        showToast('Banner promo dihapus dan website diperbarui.');
      }
    });
  };

  // CMS Ambassador Helpers
  const updateAmbassador = (idx, field, val) => {
    const updatedAmbassadors = (cmsData.ambassadors || []).map((item, i) =>
      i === idx ? { ...item, [field]: val } : item
    );
    const newData = { ...cmsData, ambassadors: updatedAmbassadors };
    setCmsData(newData);
    CMS.save(newData);
  };
  const addAmbassador = () => {
    const newData = {
      ...cmsData,
      ambassadors: [
        ...(cmsData.ambassadors || []),
        {
          id: Date.now(),
          name: 'Nama Duta Baru',
          faculty: 'FITK',
          major: 'Tadris Bahasa Inggris',
          img: '',
          year: '2026'
        }
      ]
    };
    setCmsData(newData);
    CMS.save(newData);
    showToast('Profil duta baru ditambahkan dan langsung aktif.');
  };
  const removeAmbassador = (idx) => {
    askConfirmation({
      title: 'Hapus Profil Duta',
      message: 'Apakah Anda yakin ingin menghapus data profil duta ini?',
      confirmText: 'Hapus Duta',
      isDestructive: true,
      onConfirm: () => {
        const updatedAmbassadors = (cmsData.ambassadors || []).filter((_, i) => i !== idx);
        const newData = { ...cmsData, ambassadors: updatedAmbassadors };
        setCmsData(newData);
        CMS.save(newData);
        showToast('Profil duta dihapus dan website diperbarui.');
      }
    });
  };

  // CMS Gallery Helpers
  const updateGallery = (idx, field, val) => {
    const updatedGallery = (cmsData.gallery || []).map((item, i) =>
      i === idx ? { ...item, [field]: val } : item
    );
    const newData = { ...cmsData, gallery: updatedGallery };
    setCmsData(newData);
    CMS.save(newData);
  };
  const addGallery = () => {
    const newData = { ...cmsData };
    newData.gallery.push({ 
      id: Date.now(), 
      img: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80', 
      caption: 'Kegiatan Duta Kampus' 
    });
    setCmsData(newData);
    CMS.save(newData);
    showToast('Foto galeri baru ditambahkan dan langsung aktif.');
  };
  const removeGallery = (idx) => {
    askConfirmation({
      title: 'Hapus Foto Galeri',
      message: 'Apakah Anda yakin ingin menghapus foto ini dari galeri publik?',
      confirmText: 'Hapus Foto',
      isDestructive: true,
      onConfirm: () => {
        const newData = { ...cmsData };
        newData.gallery.splice(idx, 1);
        setCmsData(newData);
        CMS.save(newData);
        showToast('Foto galeri dihapus dan website diperbarui.');
      }
    });
  };

  // CMS About Section Helper
  const updateAbout = (field, val) => {
    const defaultAbout = {
      img: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
      badgeYear: '2026',
      badgeText: 'Pemilihan Resmi',
      title: 'Program Duta Kampus',
      desc: 'Melakukan Expo & Sosialisasi ke sekolah-sekolah se-Ciayumajakuning bahkan lebih tentang UIN Siber Syekh Nurjati Cirebon, melakukan promosi dalam bentuk video atau flyer melalui laman Instagram UPT Admisi dan Promosi, pelayanan Admisi untuk mensosialisasi calon mahasiswa baru UIN Siber Syekh Nurjati Cirebon selama periode SPAN-PTKIN sampai SPMB MANDIRI, serta mengayomi Paguyuban Duta dalam lingkungan UIN Siber Syekh Nurjati Cirebon.',
      point1Title: 'Sosialisasi & Edukasi Calon Mahasiswa',
      point1Desc: 'Mendampingi calon mahasiswa baru dari seleksi SPAN-PTKIN, UM-PTKIN, hingga SPMB Mandiri.',
      point2Title: 'Duta Promosi Multimedia & Humas',
      point2Desc: 'Menghadirkan konten kreatif flyer, video promosi, dan aktivasi media sosial institusi.',
      btnText: 'Ajukan Akun & Mulai Pendaftaran',
      btnLink: '/login'
    };
    const updatedAbout = {
      ...(cmsData.about || defaultAbout),
      [field]: val
    };
    const newData = { ...cmsData, about: updatedAbout };
    setCmsData(newData);
    CMS.save(newData);
  };

  // Add User Form Submission
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.namaLengkap) {
      showToast('Nama lengkap dan email wajib diisi.', 'danger');
      return;
    }
    const cleanEmail = newUserForm.email.trim().toLowerCase();
    const users = Auth.getUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      showToast('Email sudah terdaftar. Silakan gunakan email lain.', 'danger');
      return;
    }

    const created = {
      id: Date.now(),
      namaLengkap: newUserForm.namaLengkap,
      name: newUserForm.namaLengkap,
      email: cleanEmail,
      password: newUserForm.password || 'rizki',
      nim: newUserForm.nim || '-',
      fakultas: newUserForm.fakultas,
      jurusan: newUserForm.jurusan,
      accountStatus: newUserForm.accountStatus,
      status: newUserForm.accountStatus === 'approved' ? 'Disetujui' : 'Pending',
      createdAt: new Date().toISOString()
    };

    users.unshift(created);
    Auth.saveUsers(users);

    // Also sync to applicant DB
    DB.add({
      id: created.id,
      namaLengkap: created.namaLengkap,
      email: created.email,
      nim: created.nim,
      fakultas: created.fakultas,
      jurusan: created.jurusan,
      prodi: created.jurusan,
      semester: '4',
      status: 'pending',
      selectionStage: 'review',
      selectionMessage: '',
      createdAt: created.createdAt
    });

    refreshUsers();
    refresh();
    setIsAddUserModalOpen(false);
    setNewUserForm({
      namaLengkap: '',
      email: '',
      password: 'rizki',
      nim: '',
      fakultas: FAKULTAS_DATA[0]?.name || '',
      jurusan: FAKULTAS_DATA[0]?.majors[0] || '',
      accountStatus: 'approved'
    });
    showToast('Akun calon duta baru berhasil ditambahkan.');
  };

  // Add Applicant Dossier Submission
  const handleCreateApplicant = (e) => {
    e.preventDefault();
    if (!newApplicantForm.namaLengkap || !newApplicantForm.email) {
      showToast('Nama lengkap dan email wajib diisi.', 'danger');
      return;
    }

    const created = DB.add({
      ...newApplicantForm,
      prodi: newApplicantForm.jurusan,
      status: newApplicantForm.selectionStage === 'lolos' ? 'diterima' : newApplicantForm.selectionStage === 'tidak_lolos' ? 'ditolak' : 'pending',
      selectionMessage: newApplicantForm.selectionStage === 'lolos' ? DEFAULT_MESSAGES.lolos : newApplicantForm.selectionStage === 'tidak_lolos' ? DEFAULT_MESSAGES.tidak_lolos : ''
    });

    // Also sync to user accounts if not present
    const users = Auth.getUsers();
    const cleanEmail = newApplicantForm.email.trim().toLowerCase();
    const existIdx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (existIdx === -1) {
      users.unshift({
        id: created.id,
        namaLengkap: newApplicantForm.namaLengkap,
        name: newApplicantForm.namaLengkap,
        email: cleanEmail,
        password: 'rizki',
        nim: newApplicantForm.nim,
        fakultas: newApplicantForm.fakultas,
        jurusan: newApplicantForm.jurusan,
        accountStatus: 'approved',
        selectionStage: newApplicantForm.selectionStage,
        selectionMessage: created.selectionMessage,
        createdAt: new Date().toISOString()
      });
      Auth.saveUsers(users);
    }

    refresh();
    refreshUsers();
    setIsAddApplicantModalOpen(false);
    showToast('Berkas pendaftar baru berhasil ditambahkan.');
  };

  // System Backup / Reset helpers
  const handleExportBackupJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      users: Auth.getUsers(),
      applicants: DB.getAll(),
      cms: CMS.get(),
      settings: Settings.get()
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-duta-uinssc-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Cadangan data sistem berhasil diunduh.');
  };

  const handleResetDemoData = () => {
    askConfirmation({
      title: 'Muat Ulang Data Sampel',
      message: 'Muat ulang data sampel pendaftar dan akun uji coba untuk keperluan simulasi?',
      confirmText: 'Muat Data Sampel',
      onConfirm: () => {
        seedDemoData(true);
        refresh();
        refreshUsers();
        showToast('Data sampel pendaftar berhasil dimuat.');
      }
    });
  };

  const handleClearDemoData = () => {
    askConfirmation({
      title: 'Bersihkan Seluruh Data Pendaftar',
      message: 'Seluruh akun calon duta, berkas pendaftaran, dan data sesi uji coba akan dihapus bersih (reset dari nol). Lanjutkan?',
      confirmText: 'Ya, Bersihkan Semua Data',
      isDestructive: true,
      onConfirm: () => {
        localStorage.setItem('dutauinssc_pendaftar', JSON.stringify([]));
        localStorage.setItem('dutauinssc_users', JSON.stringify([]));
        localStorage.removeItem('dutauinssc_auth_token');
        refresh();
        refreshUsers();
        showToast('Seluruh data pendaftar telah dibersihkan (reset ke nol).');
      }
    });
  };

  // Available majors based on chosen faculty in filters
  const selectedFacultyObj = FAKULTAS_DATA.find(f => f.shortName === filterFakultas || f.name === filterFakultas);
  const availableMajors = selectedFacultyObj ? selectedFacultyObj.majors : [];

  // Combine applicants and registered users so no applicant is ever left behind,
  // and prioritize the most up-to-date fields (including semester) from both sources
  const combinedApplicants = applicants.map(a => {
    const matchingUser = registeredUsers.find(u => 
      (u.email && a.email && u.email.toLowerCase() === a.email.toLowerCase()) || 
      String(u.id) === String(a.id)
    );
    if (!matchingUser) return a;

    const resolvedSemester = (a.semester && a.semester !== '—' && String(a.semester).trim()) 
      ? String(a.semester).trim() 
      : (matchingUser.semester && matchingUser.semester !== '—' && String(matchingUser.semester).trim() 
          ? String(matchingUser.semester).trim() 
          : '—');

    return {
      ...matchingUser,
      ...a,
      semester: resolvedSemester,
      namaLengkap: a.namaLengkap || matchingUser.namaLengkap || matchingUser.name,
      nim: a.nim || matchingUser.nim,
      fakultas: a.fakultas || matchingUser.fakultas,
      jurusan: a.jurusan || matchingUser.jurusan,
      prodi: a.prodi || a.jurusan || matchingUser.jurusan || matchingUser.fakultas,
      accountStatus: matchingUser.accountStatus || a.accountStatus || 'approved',
    };
  });

  registeredUsers.forEach(u => {
    if (!combinedApplicants.some(a => (a.email || '').toLowerCase() === (u.email || '').toLowerCase() || String(a.id) === String(u.id))) {
      combinedApplicants.unshift({
        id: u.id,
        namaLengkap: u.namaLengkap || u.name,
        nim: u.nim,
        fakultas: u.fakultas,
        jurusan: u.jurusan,
        prodi: u.jurusan || u.fakultas,
        semester: u.semester && u.semester !== '—' ? String(u.semester).trim() : '—',
        jenisKelamin: u.jenisKelamin,
        ttl: u.tempatLahir && u.tanggalLahir ? `${u.tempatLahir}, ${u.tanggalLahir}` : '—',
        email: u.email,
        kewarganegaraan: u.kewarganegaraan,
        status: u.accountStatus === 'approved' ? (u.status === 'Lolos Seleksi Berkas' ? 'diterima' : u.status === 'Tidak Lolos' ? 'ditolak' : 'pending') : 'pending',
        accountStatus: u.accountStatus || 'pending',
        selectionStage: u.selectionStage || 'review',
        isAccountApplication: true,
        createdAt: u.createdAt || new Date().toISOString()
      });
    }
  });

  // Filtered applicants based on combined list
  const filtered = combinedApplicants
    .filter(i => {
      const q = search.toLowerCase();
      const matchQ = !search || [i.namaLengkap, i.nim, i.prodi, i.jurusan, i.email, i.fakultas].some(v => (v || '').toLowerCase().includes(q));
      const matchFakultas = !filterFakultas || (i.fakultas || '').toLowerCase().includes(filterFakultas.toLowerCase());
      const matchProdi = !filterProdi || (i.prodi || i.jurusan || '').toLowerCase().includes(filterProdi.toLowerCase());
      
      const evalData = evaluateDossierCompleteness(i);
      const matchComp = !filterCompleteness 
        || (filterCompleteness === 'lengkap' && evalData.isComplete)
        || (filterCompleteness === 'draf' && evalData.isStarted && !evalData.isComplete)
        || (filterCompleteness === 'kosong' && !evalData.isStarted);

      const stage = i.selectionStage || (i.status === 'diterima' ? 'lolos' : i.status === 'ditolak' ? 'tidak_lolos' : 'review');
      const matchSelection = !filterSelection || stage === filterSelection;

      return matchQ && matchFakultas && matchProdi && matchComp && matchSelection;
    })
    .sort((a, b) => {
      const va = a[sortKey] || '';
      const vb = b[sortKey] || '';
      return va < vb ? -sortDir : va > vb ? sortDir : 0;
    });

  // Summary counts
  const pendingUsersCount = registeredUsers.filter(u => (u.accountStatus || 'pending') === 'pending').length;
  const completeDossiersCount = combinedApplicants.filter(a => evaluateDossierCompleteness(a).isComplete).length;
  const incompleteDossiersCount = combinedApplicants.filter(a => !evaluateDossierCompleteness(a).isComplete).length;
  const lolosCount = combinedApplicants.filter(a => a.selectionStage === 'lolos' || a.status === 'diterima').length;

  const selectedItem = selectedId ? (
    combinedApplicants.find(a => String(a.id) === String(selectedId) || (a.email && String(a.email).toLowerCase() === String(selectedId).toLowerCase())) ||
    registeredUsers.find(u => String(u.id) === String(selectedId) || (u.email && String(u.email).toLowerCase() === String(selectedId).toLowerCase())) ||
    DB.getById(selectedId)
  ) : null;

  const matchingRegUser = selectedItem ? registeredUsers.find(u => (u.email || '').toLowerCase() === (selectedItem.email || '').toLowerCase()) : null;
  const mergedSelectedItem = selectedItem ? {
    ...matchingRegUser,
    ...selectedItem,
    semester: (selectedItem.semester && selectedItem.semester !== '—' && String(selectedItem.semester).trim()) 
      ? String(selectedItem.semester).trim() 
      : (matchingRegUser?.semester && matchingRegUser.semester !== '—' && String(matchingRegUser.semester).trim() 
          ? String(matchingRegUser.semester).trim() 
          : (selectedItem.semester || '—')),
    prodi: selectedItem.prodi || selectedItem.jurusan || matchingRegUser?.jurusan || matchingRegUser?.fakultas || '—'
  } : null;

  const selectedDossier = mergedSelectedItem ? evaluateDossierCompleteness(mergedSelectedItem) : null;

  const exportCSV = () => {
    if (!applicants.length) return;
    const headers = ['ID','Nama Lengkap','NIM','Fakultas','Prodi','Semester','Jenis Kelamin','TTL','No HP','Email','Alamat','IPK','Kelengkapan Dokumen','Status Seleksi Berkas','Tanggal Daftar'];
    const rows = applicants.map(i => {
      const evalData = evaluateDossierCompleteness(i);
      const stage = i.selectionStage || (i.status === 'diterima' ? 'Lolos' : i.status === 'ditolak' ? 'Tidak Lolos' : 'Menunggu Review');
      return [
        i.id,
        i.namaLengkap,
        i.nim,
        i.fakultas || '—',
        i.prodi || i.jurusan,
        i.semester,
        i.jenisKelamin,
        i.ttl,
        i.noHp,
        i.email,
        i.alamat,
        i.ipk,
        evalData.statusLabel,
        stage,
        formatDateTime(i.createdAt)
      ].map(v => `"${String(v || '').replace(/"/g, '""')}"`);
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pendaftar-duta-uinssc-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSort = (key) => { 
    if (sortKey === key) setSortDir(d => d * -1); 
    else { setSortKey(key); setSortDir(1); } 
  };

  const changePassword = () => {
    const s = Settings.get();
    if (passwords.cur !== s.adminPass) { 
      showToast('Password lama salah.', 'danger'); 
      return; 
    }
    if (!passwords.newP || passwords.newP.length < 6) { 
      showToast('Password baru minimal 6 karakter.', 'danger'); 
      return; 
    }
    if (passwords.newP !== passwords.conf) { 
      showToast('Konfirmasi password tidak cocok.', 'danger'); 
      return; 
    }
    s.adminPass = passwords.newP; 
    Settings.save(s);
    setPasswords({ cur: '', newP: '', conf: '' }); 
    showToast('Password admin berhasil diubah.');
  };

  // LOGIN SCREEN
  if (!loggedIn) return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-logo">
          <Image src="/assets/logo-circle.png" alt="Logo" width={64} height={64} style={{ margin: '0 auto' }} />
        </div>
        <h1>Admin Panel</h1>
        <p className="login-sub">Duta Kampus UIN SSC 2026</p>
        <form onSubmit={doLogin}>
          <div className="login-field">
            <label htmlFor="loginUser">Username</label>
            <input 
              id="loginUser" 
              type="text" 
              placeholder="Masukkan username admin" 
              value={credentials.user} 
              onChange={e => setCredentials(c => ({ ...c, user: e.target.value }))} 
            />
          </div>
          <div className="login-field">
            <label htmlFor="loginPass">Password</label>
            <div className="pass-wrapper">
              <input 
                id="loginPass" 
                type={showPass ? 'text' : 'password'} 
                placeholder="Masukkan password" 
                value={credentials.pass} 
                onChange={e => setCredentials(c => ({ ...c, pass: e.target.value }))} 
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          {loginError && <p className="login-error">Username atau password salah.</p>}
          <button type="submit" className="btn btn-gold" style={{ width: '100%', padding: '15px', fontSize: '0.95rem', marginTop: '0.75rem' }}>
            Masuk ke Panel
          </button>
        </form>
        <Link href="/" className="back-to-home" style={{ marginTop: '1.25rem', display: 'inline-block' }}>Kembali ke Beranda Publik</Link>
      </div>
    </div>
  );

  const navItems = [
    { key: 'dashboard', label: 'Ringkasan', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { key: 'pendaftar', label: 'Seleksi Berkas Pendaftar', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, badge: applicants.length },
    { key: 'akun_pelamar', label: 'Data Akun Peserta', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>, badge: registeredUsers.length },
    { key: 'cms', label: 'Manajemen Konten (CMS)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
    { key: 'settings', label: 'Pengaturan Sistem', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ];

  const pageTitles = { 
    dashboard: 'Ringkasan Sistem & Statistik', 
    pendaftar: 'Verifikasi & Seleksi Berkas Dokumen', 
    akun_pelamar: 'Direktori Akun Peserta Terdaftar', 
    cms: 'Pusat Manajemen Konten Web (CMS)', 
    settings: 'Pengaturan Sistem' 
  };

  return (
    <div id="dashboard" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* SIDEBAR (Desktop) */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Image src="/assets/logo-main.png" alt="Logo" width={36} height={36} className="sidebar-logo" style={{ filter: 'brightness(0) invert(1) opacity(0.85)' }} />
          <div className="sidebar-brand">
            <span className="brand-title">Admin Panel</span>
            <span className="brand-sub">Duta Kampus UIN SSC</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(n => (
            <button key={n.key} className={`nav-item ${page === n.key ? 'active' : ''}`} onClick={() => { setPage(n.key); setSidebarOpen(false); }}>
              {n.icon} {n.label}
              {n.badge !== undefined && <span className="nav-badge">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Keluar Panel
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER (FULL WIDTH ON DESKTOP) */}
      <main className="admin-main" style={{ overflowY: 'auto', flex: 1, width: '100%' }}>
        {/* TOPBAR */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <h2>{pageTitles[page]}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="btn btn-outline-gold btn-sm" 
              onClick={() => {
                refresh();
                refreshUsers();
                if (page === 'cms') setCmsData(CMS.get());
                showToast('Data pendaftar & akun berhasil disegarkan.');
              }}
              title="Segarkan data pendaftar & akun terkini"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '5px 10px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              <span>Sinkron Data</span>
            </button>
            <div className="admin-badge"><span className="admin-dot"></span>Administrator</div>
            <button 
              className="btn btn-sm mobile-only" 
              onClick={handleLogout}
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '4px 10px' }}
            >
              Keluar
            </button>
          </div>
        </div>

        {/* ========================================================
            PAGE 1: DASHBOARD / RINGKASAN
            ======================================================== */}
        {page === 'dashboard' && (
          <div className="page active" style={{ width: '100%', boxSizing: 'border-box' }}>
            {/* Banner info if there are pending accounts */}
            {pendingUsersCount > 0 && (
              <div style={{
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.75rem',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.08)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#d97706', flexShrink: 0, boxShadow: '0 0 0 4px rgba(217, 119, 6, 0.2)' }} />
                    <div>
                      <div style={{ fontWeight: 800, color: '#92400e', fontSize: '1rem' }}>
                        Ada {pendingUsersCount} Pengajuan Akun Calon Duta yang Menunggu Verifikasi
                      </div>
                      <div style={{ fontSize: '0.825rem', color: '#b45309', marginTop: '2px' }}>
                        Pendaftar telah mengajukan akun dan membutuhkan persetujuan admin untuk mulai mengunggah berkas persyaratan.
                      </div>
                    </div>
                  </div>

                  <button 
                    className="btn btn-gold btn-sm" 
                    onClick={() => { setPage('akun_pelamar'); setUserFilterStatus('pending'); }}
                    style={{ fontWeight: 700 }}
                  >
                    Buka Halaman Verifikasi Akun ({pendingUsersCount})
                  </button>
                </div>

                {/* Quick Action Pending Cards List */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
                  {registeredUsers.filter(u => (u.accountStatus || 'pending') === 'pending').slice(0, 3).map((u) => (
                    <div
                      key={u.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #fcd34d',
                        borderRadius: '10px',
                        padding: '0.875rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.875rem' }}>{u.namaLengkap || u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NIM: {u.nim || '—'} · {u.fakultas || u.jurusan}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-gold btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}
                          onClick={() => handleApproveUser(u.email)}
                        >
                          Setujui
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-gold btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          onClick={() => {
                            setSelectedId(u.id);
                            setPage('direktori_berkas');
                            setPreviousPage('dashboard');
                          }}
                        >
                          Direktori
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clickable Stat Cards Overview */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
              <div 
                className="stat-card" 
                onClick={() => { setPage('akun_pelamar'); setUserFilterStatus(''); }}
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                title="Klik untuk melihat semua akun pelamar"
              >
                <div className="stat-card-icon" style={{ background: 'rgba(22,50,74,0.1)', color: 'var(--navy)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <span className="stat-card-num">{registeredUsers.length}</span>
                  <span className="stat-card-label">Total Calon Duta Terdaftar</span>
                </div>
              </div>

              <div 
                className="stat-card" 
                onClick={() => { setPage('akun_pelamar'); setUserFilterStatus('pending'); }}
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                title="Klik untuk melihat akun yang menunggu persetujuan"
              >
                <div className="stat-card-icon" style={{ background: 'rgba(180,83,9,0.15)', color: '#b45309' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <span className="stat-card-num">{pendingUsersCount}</span>
                  <span className="stat-card-label">Akun Menunggu Verifikasi</span>
                </div>
              </div>

              <div 
                className="stat-card" 
                onClick={() => { setPage('pendaftar'); setFilterCompleteness('lengkap'); }}
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                title="Klik untuk melihat berkas pendaftar yang 100% lengkap"
              >
                <div className="stat-card-icon" style={{ background: 'rgba(22,163,74,0.15)', color: '#16a34a' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div>
                  <span className="stat-card-num">{completeDossiersCount}</span>
                  <span className="stat-card-label">Dokumen Lengkap (100%)</span>
                </div>
              </div>

              <div 
                className="stat-card" 
                onClick={() => { setPage('pendaftar'); setFilterCompleteness('draf'); }}
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                title="Klik untuk melihat pendaftar yang berkasnya masih draf"
              >
                <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <span className="stat-card-num">{incompleteDossiersCount}</span>
                  <span className="stat-card-label">Berkas Draf / Belum Lengkap</span>
                </div>
              </div>

              <div 
                className="stat-card" 
                onClick={() => { setPage('pendaftar'); setFilterSelection('lolos'); }}
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                title="Klik untuk melihat peserta yang lolos seleksi berkas"
              >
                <div className="stat-card-icon" style={{ background: 'rgba(22,50,74,0.15)', color: 'var(--navy)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div>
                  <span className="stat-card-num">{lolosCount}</span>
                  <span className="stat-card-label">Lolos Seleksi Berkas</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Applicants */}
            <div style={{ marginTop: '2rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                    Calon Duta Terdaftar Terbaru
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: 'var(--text-light)' }}>
                    Pantau kelengkapan berkas dan status akun secara real-time.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    className="btn btn-outline-gold btn-sm" 
                    onClick={() => setPage('akun_pelamar')}
                  >
                    Kelola Akun ({registeredUsers.length})
                  </button>
                  <button 
                    className="btn btn-gold btn-sm" 
                    onClick={() => setPage('pendaftar')}
                  >
                    Buka Data Berkas
                  </button>
                </div>
              </div>

              <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nama dan Email</th>
                      <th>NIM</th>
                      <th>Fakultas / Prodi</th>
                      <th>Kelengkapan Dokumen</th>
                      <th>Status Akun</th>
                      <th>Status Berkas</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredUsers.slice(0, 6).map((u, idx) => {
                      const evalData = evaluateDossierCompleteness(u);
                      const currentStage = u.selectionStage || (u.status === 'Disetujui' ? 'review' : 'none');

                      return (
                        <tr key={u.id || idx}>
                          <td style={{ color: 'var(--text-light)' }}>{idx + 1}</td>
                          <td>
                            <div className="td-name">{u.namaLengkap || u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{u.email}</div>
                          </td>
                          <td className="td-nim">{u.nim || '—'}</td>
                          <td style={{ fontSize: '0.825rem' }}>{u.fakultas || u.jurusan || '—'}</td>
                          <td>
                            <span 
                              style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                padding: '3px 9px', 
                                borderRadius: '9999px',
                                background: evalData.bg,
                                color: evalData.color,
                                border: `1px solid ${evalData.border}`
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: evalData.color }} />
                              {evalData.statusLabel}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${u.accountStatus === 'approved' ? 'badge-success' : u.accountStatus === 'rejected' ? 'badge-danger' : 'badge-pending'}`}>
                              {u.accountStatus === 'approved' ? 'Disetujui' : u.accountStatus === 'rejected' ? 'Ditolak' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <span 
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: currentStage === 'lolos' ? '#dcfce7' : currentStage === 'tidak_lolos' ? '#fee2e2' : '#f1f5f9',
                                color: currentStage === 'lolos' ? '#166534' : currentStage === 'tidak_lolos' ? '#991b1b' : '#64748b'
                              }}
                            >
                              {currentStage === 'lolos' ? 'Lolos Seleksi' : currentStage === 'tidak_lolos' ? 'Tidak Lolos' : 'Dalam Peninjauan'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-outline-gold btn-sm" 
                              onClick={() => { 
                                setSelectedId(u.id); 
                                setPage('direktori_berkas'); 
                                setPreviousPage('dashboard');
                              }}
                              style={{ fontWeight: 600, padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              Direktori Berkas
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 2: VERIFIKASI AKUN PELAMAR
            ======================================================== */}
        {page === 'akun_pelamar' && (
          <div className="page active" style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="table-toolbar">
              <div className="toolbar-left" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                <div className="search-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input type="text" placeholder="Cari nama, email, NIM..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                </div>

                <select className="filter-select" value={userFilterStatus} onChange={e => setUserFilterStatus(e.target.value)}>
                  <option value="">Semua Status Akun</option>
                  <option value="pending">Menunggu Verifikasi</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </select>

                <select className="filter-select" value={userFilterFakultas} onChange={e => setUserFilterFakultas(e.target.value)}>
                  <option value="">Semua Fakultas</option>
                  {FAKULTAS_DATA.map(f => (
                    <option key={f.id} value={f.name}>{f.shortName} — {f.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  type="button"
                  className="btn btn-outline-danger btn-sm" 
                  onClick={handleClearDemoData}
                  style={{ border: '1px solid #fca5a5', color: '#dc2626', background: '#fff', fontWeight: 600, padding: '0.45rem 0.85rem' }}
                  title="Bersihkan semua data pendaftar untuk menguji dari awal"
                >
                  Bersihkan Semua Data (Uji dari Nol)
                </button>
                <button 
                  className="btn btn-gold btn-sm" 
                  onClick={() => setIsAddUserModalOpen(true)}
                >
                  + Tambah Akun Calon Duta
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama dan Email</th>
                    <th>NIM</th>
                    <th>Fakultas / Prodi</th>
                    <th>Kelengkapan Dokumen</th>
                    <th>Status Akun</th>
                    <th>Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredUsers
                    .filter(u => {
                      const s = userSearch.toLowerCase();
                      const matchSearch = !userSearch || [u.namaLengkap, u.email, u.nim, u.fakultas, u.jurusan].some(v => (v || '').toLowerCase().includes(s));
                      const matchStatus = !userFilterStatus || (u.accountStatus || 'pending') === userFilterStatus;
                      const matchFac = !userFilterFakultas || (u.fakultas || '').toLowerCase().includes(userFilterFakultas.toLowerCase());
                      return matchSearch && matchStatus && matchFac;
                    })
                    .map((u, idx) => {
                      const evalData = evaluateDossierCompleteness(u);
                      const status = u.accountStatus || 'pending';

                      return (
                        <tr key={u.id || idx}>
                          <td style={{ color: 'var(--text-light)' }}>{idx + 1}</td>
                          <td>
                            <div className="td-name">{u.namaLengkap || u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{u.email}</div>
                          </td>
                          <td className="td-nim">{u.nim || '—'}</td>
                          <td style={{ fontSize: '0.825rem' }}>
                            <div>{u.fakultas || '—'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{u.jurusan}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, marginTop: '2px' }}>
                              Semester {u.semester && u.semester !== '—' ? u.semester : '—'}
                            </div>
                          </td>
                          <td>
                            <span 
                              style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                padding: '3px 9px', 
                                borderRadius: '9999px',
                                background: evalData.bg,
                                color: evalData.color,
                                border: `1px solid ${evalData.border}`
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: evalData.color }} />
                              {evalData.statusLabel}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${status === 'approved' ? 'badge-success' : status === 'rejected' ? 'badge-danger' : 'badge-pending'}`}>
                              {status === 'approved' ? 'Disetujui' : status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              {status === 'pending' && (
                                <>
                                  <button 
                                    className="btn btn-sm btn-gold" 
                                    style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700 }}
                                    onClick={() => handleApproveUser(u.email)}
                                  >
                                    Setujui Akun
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-danger" 
                                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                    onClick={() => handleRejectUser(u.email)}
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}

                              {status === 'approved' && (
                                <button 
                                  className="btn btn-sm" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', border: '1px solid var(--border)', color: 'var(--text-mid)' }}
                                  onClick={() => handleRejectUser(u.email)}
                                >
                                  Batalkan
                                </button>
                              )}

                              {status === 'rejected' && (
                                <button 
                                  className="btn btn-sm btn-gold" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  onClick={() => handleApproveUser(u.email)}
                                >
                                  Setujui Ulang
                                </button>
                              )}

                              <button 
                                className="btn btn-outline-gold btn-sm" 
                                style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}
                                onClick={() => {
                                  setSelectedId(u.id);
                                  setPage('direktori_berkas');
                                  setPreviousPage('akun_pelamar');
                                }}
                              >
                                Buka Direktori Berkas
                              </button>

                              <button 
                                className="btn btn-sm" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#dc2626', background: 'transparent', border: 'none' }}
                                onClick={() => handleDeleteUser(u.email)}
                                title="Hapus Akun"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 3: DATA BERKAS PENDAFTAR
            ======================================================== */}
        {page === 'pendaftar' && (
          <div className="page active" style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="table-toolbar">
              <div className="toolbar-left" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', width: '100%' }}>
                {/* Search */}
                <div className="search-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input type="text" placeholder="Cari nama, NIM, atau prodi..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {/* Filter Fakultas */}
                <select className="filter-select" value={filterFakultas} onChange={e => { setFilterFakultas(e.target.value); setFilterProdi(''); }}>
                  <option value="">Semua Fakultas</option>
                  {FAKULTAS_DATA.map(f => (
                    <option key={f.id} value={f.name}>{f.shortName} — {f.name}</option>
                  ))}
                </select>

                {/* Filter Jurusan / Prodi */}
                <select className="filter-select" value={filterProdi} onChange={e => setFilterProdi(e.target.value)}>
                  <option value="">Semua Jurusan / Prodi</option>
                  {availableMajors.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* Filter Kelengkapan Dokumen */}
                <select className="filter-select" value={filterCompleteness} onChange={e => setFilterCompleteness(e.target.value)}>
                  <option value="">Semua Kelengkapan Dokumen</option>
                  <option value="lengkap">Dokumen Lengkap (100%)</option>
                  <option value="draf">Draf (Belum Lengkap)</option>
                  <option value="kosong">Belum Mengisi</option>
                </select>

                {/* Filter Status Seleksi Berkas */}
                <select className="filter-select" value={filterSelection} onChange={e => setFilterSelection(e.target.value)}>
                  <option value="">Semua Hasil Seleksi</option>
                  <option value="lolos">Lolos Seleksi Berkas</option>
                  <option value="tidak_lolos">Tidak Lolos</option>
                  <option value="review">Dalam Peninjauan</option>
                </select>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline-danger btn-sm" onClick={handleClearDemoData} title="Bersihkan seluruh berkas pendaftar dan akun pelamar untuk mulai uji dari awal">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Bersihkan Semua Data
                  </button>
                  <button className="btn btn-gold btn-sm" onClick={() => setIsAddApplicantModalOpen(true)}>
                    + Tambah Berkas Pendaftar
                  </button>
                  <button className="btn btn-outline-gold btn-sm" onClick={exportCSV}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export CSV ({filtered.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th className="sortable" onClick={() => handleSort('namaLengkap')}>Nama dan Email</th>
                    <th>NIM</th>
                    <th>Fakultas dan Prodi</th>
                    <th>IPK</th>
                    <th>Kelengkapan Dokumen</th>
                    <th>Hasil Seleksi Berkas</th>
                    <th>Aksi Seleksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="table-empty"><p>Tidak ada pendaftar yang cocok dengan filter yang dipilih.</p></td></tr>
                  ) : filtered.map((item, idx) => {
                    const evalData = evaluateDossierCompleteness(item);
                    const stage = item.selectionStage || (item.status === 'diterima' ? 'lolos' : item.status === 'ditolak' ? 'tidak_lolos' : 'review');

                    return (
                      <tr key={item.id}>
                        <td style={{ color: 'var(--text-light)' }}>{idx + 1}</td>
                        <td>
                          <div className="td-name">{item.namaLengkap}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{item.email}</div>
                        </td>
                        <td className="td-nim">{item.nim}</td>
                        <td style={{ fontSize: '0.8rem', maxWidth: 190 }}>
                          <div>{item.fakultas || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{item.prodi || item.jurusan}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700, marginTop: '2px' }}>
                            Semester {item.semester && item.semester !== '—' ? item.semester : '—'}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--navy)' }}>
                          {item.ipk || '—'}
                        </td>
                        <td>
                          <span 
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              padding: '3px 8px', 
                              borderRadius: '9999px',
                              background: evalData.bg,
                              color: evalData.color,
                              border: `1px solid ${evalData.border}`
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: evalData.color }} />
                            {evalData.statusLabel}
                          </span>
                        </td>
                        <td>
                          {stage === 'lolos' && (
                            <span className="badge" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontWeight: 800 }}>
                              LOLOS SELEKSI
                            </span>
                          )}
                          {stage === 'tidak_lolos' && (
                            <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontWeight: 800 }}>
                              TIDAK LOLOS
                            </span>
                          )}
                          {stage === 'review' && (
                            <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', fontWeight: 700 }}>
                              DALAM PENINJAUAN
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="td-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button 
                              className="btn btn-outline-gold btn-sm" 
                              style={{ fontWeight: 600, padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => { 
                                setSelectedId(item.id); 
                                setCustomMsg(item.selectionMessage || ''); 
                                setPage('direktori_berkas');
                                setPreviousPage('pendaftar');
                              }}
                            >
                              Buka Direktori Berkas
                            </button>

                            {/* Quick Toggle Lolos / Batalkan */}
                            {stage !== 'lolos' ? (
                              <button
                                className="btn btn-sm btn-gold"
                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                onClick={() => handleSetDossierStatus(item.id, 'lolos')}
                                title="Terima dan nyatakan lolos seleksi berkas"
                              >
                                Loloskan Berkas
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm"
                                style={{ padding: '4px 8px', fontSize: '0.72rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
                                onClick={() => handleSetDossierStatus(item.id, 'review')}
                                title="Kembalikan ke status peninjauan"
                              >
                                Batalkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 4: MANAJEMEN KONTEN (CMS)
            ======================================================== */}
        {page === 'cms' && cmsData && (
          <div className="page active" style={{ width: '100%', boxSizing: 'border-box' }}>
            {/* CMS Top Header & Instant Sync Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '1rem' }}>Manajemen Konten Publik (CMS)</div>
                <div style={{ fontSize: '0.8rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Sinkronisasi Otomatis Aktif — Setiap perubahan otomatis tersimpan & tayang ke website publik.
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-gold btn-sm" 
                onClick={handleCmsSave} 
                style={{ fontWeight: 700, padding: '0.55rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Simpan & Publikasikan</span>
              </button>
            </div>

            {/* CMS Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                className={`btn btn-sm ${cmsTab === 'slider' ? 'btn-gold' : 'btn-outline-gold'}`} 
                onClick={() => setCmsTab('slider')}
              >
                Hero Slider Beranda ({cmsData.slider?.length || 0})
              </button>
              <button 
                className={`btn btn-sm ${cmsTab === 'promo' ? 'btn-gold' : 'btn-outline-gold'}`} 
                onClick={() => setCmsTab('promo')}
              >
                Banner Promo Slider ({cmsData.promoBanners?.length || 0})
              </button>
              <button 
                className={`btn btn-sm ${cmsTab === 'ambassadors' ? 'btn-gold' : 'btn-outline-gold'}`} 
                onClick={() => setCmsTab('ambassadors')}
              >
                Profil Duta Kampus ({cmsData.ambassadors?.length || 0})
              </button>
              <button 
                className={`btn btn-sm ${cmsTab === 'gallery' ? 'btn-gold' : 'btn-outline-gold'}`} 
                onClick={() => setCmsTab('gallery')}
              >
                Galeri Foto ({cmsData.gallery?.length || 0})
              </button>
              <button 
                className={`btn btn-sm ${cmsTab === 'about' ? 'btn-gold' : 'btn-outline-gold'}`} 
                onClick={() => setCmsTab('about')}
              >
                Tentang / Program
              </button>
            </div>

            {/* TAB 1: HERO SLIDER */}
            {cmsTab === 'slider' && (
              <div className="settings-card" style={{ marginBottom: '2rem', width: '100%' }}>
                <div className="settings-card-header">
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)' }}>Slider Hero Beranda</h3>
                    <p>Atur gambar latar belakang, judul, deskripsi, dan tombol yang langsung tampil di halaman depan website publik.</p>
                  </div>
                  <button className="btn btn-sm btn-outline-gold" onClick={addSlide}>+ Tambah Slide Baru</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
                  {cmsData.slider.map((slide, idx) => (
                    <div key={slide.id || idx} style={{ background: 'var(--bg-alt)', padding: '1.75rem', borderRadius: '16px', border: '1.5px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                        <h4 style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '1.1rem', margin: 0 }}>Slide #{idx + 1}</h4>
                        <button className="btn btn-sm btn-danger" onClick={() => removeSlide(idx)}>Hapus Slide</button>
                      </div>

                      <div className="form-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        <div className="form-group">
                          <label>URL Gambar Latar (1920x1080)</label>
                          <input type="text" value={slide.img} onChange={e => updateSlide(idx, 'img', e.target.value)} placeholder="https://..." />
                          {slide.img && (
                            <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', height: '100px', width: '100%', position: 'relative' }}>
                              <Image src={slide.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Label Kecil (Warna Emas)</label>
                          <input type="text" placeholder="Contoh: Pendaftaran 2026" value={slide.tag || ''} onChange={e => updateSlide(idx, 'tag', e.target.value)} />
                        </div>

                        <div className="form-group">
                          <label>Judul Utama Baris 1 (Teks Putih)</label>
                          <input type="text" placeholder="Contoh: Wujudkan" value={slide.title1 || ''} onChange={e => updateSlide(idx, 'title1', e.target.value)} />
                        </div>

                        <div className="form-group">
                          <label>Judul Utama Baris 2 (Teks Emas)</label>
                          <input type="text" placeholder="Contoh: Langkah Besarmu" value={slide.title2 || ''} onChange={e => updateSlide(idx, 'title2', e.target.value)} />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Deskripsi Ringkas</label>
                          <textarea rows="2" placeholder="Deskripsi slide..." value={slide.desc || ''} onChange={e => updateSlide(idx, 'desc', e.target.value)} />
                        </div>

                        <div className="form-group">
                          <label>Teks Tombol Aksi</label>
                          <input type="text" placeholder="Daftar Sekarang" value={slide.btnText || 'Daftar Sekarang'} onChange={e => updateSlide(idx, 'btnText', e.target.value)} />
                        </div>

                        <div className="form-group">
                          <label>Tautan Tombol</label>
                          <input type="text" placeholder="/daftar" value={slide.btnLink || '/daftar'} onChange={e => updateSlide(idx, 'btnLink', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {cmsData.slider.length === 0 && <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>Tidak ada slide hero. Silakan klik tambah slide.</p>}
                </div>
              </div>
            )}

            {/* TAB 2: PROMO BANNER SLIDER */}
            {cmsTab === 'promo' && (
              <div className="settings-card" style={{ marginBottom: '2rem', width: '100%' }}>
                <div className="settings-card-header">
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)' }}>Banner Promo Slider</h3>
                    <p>Atur banner bergaya slide di bawah Menu Informasi publik (Home page).</p>
                  </div>
                  <button className="btn btn-sm btn-outline-gold" onClick={addPromoBanner}>+ Tambah Banner Promo</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  {cmsData.promoBanners?.map((item, idx) => (
                    <div key={item.id || idx} style={{ background: 'var(--bg-alt)', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                        <h4 style={{ fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Banner #{idx + 1}</h4>
                        <button className="btn btn-sm btn-danger" onClick={() => removePromoBanner(idx)}>Hapus</button>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Judul Banner</label>
                        <input type="text" value={item.title || ''} onChange={e => updatePromoBanner(idx, 'title', e.target.value)} placeholder="Contoh: Kesempatan Emas Duta Kampus" />
                      </div>

                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>Sub-judul / Ajakan</label>
                        <input type="text" value={item.subtitle || ''} onChange={e => updatePromoBanner(idx, 'subtitle', e.target.value)} placeholder="Contoh: Segera daftarkan diri Anda" />
                      </div>

                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label>URL Gambar Banner (Rasio 4:1)</label>
                        <input type="text" value={item.img} onChange={e => updatePromoBanner(idx, 'img', e.target.value)} placeholder="https://..." />
                      </div>

                      <div className="form-group">
                        <label>Tautan Link Tujuan</label>
                        <input type="text" value={item.link || ''} onChange={e => updatePromoBanner(idx, 'link', e.target.value)} placeholder="/daftar atau https://..." />
                      </div>

                      {item.img && (
                        <div style={{ marginTop: '1rem', borderRadius: '8px', overflow: 'hidden', height: '110px', position: 'relative' }}>
                          <Image src={item.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                  ))}
                  {(!cmsData.promoBanners || cmsData.promoBanners.length === 0) && <div style={{ textAlign: 'center', color: 'var(--text-light)', gridColumn: '1 / -1' }}>Belum ada banner promo.</div>}
                </div>
              </div>
            )}

            {/* TAB 3: PROFIL DUTA KAMPUS */}
            {cmsTab === 'ambassadors' && (
              <div className="settings-card" style={{ marginBottom: '2rem', width: '100%' }}>
                <div className="settings-card-header">
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)' }}>Profil Duta Kampus</h3>
                    <p>Atur daftar profil duta mahasiswa yang ditampilkan di halaman publik Profil Duta dan showcase Beranda.</p>
                  </div>
                  <button className="btn btn-sm btn-outline-gold" onClick={addAmbassador}>+ Tambah Duta Baru</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  {cmsData.ambassadors?.map((item, idx) => (
                    <div key={item.id || idx} style={{ background: 'var(--bg-alt)', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                        <h4 style={{ fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Duta #{idx + 1}</h4>
                        <button className="btn btn-sm btn-danger" onClick={() => removeAmbassador(idx)}>Hapus</button>
                      </div>

                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Nama Lengkap</label>
                        <input type="text" value={item.name} onChange={e => updateAmbassador(idx, 'name', e.target.value)} placeholder="Nama Lengkap Duta" />
                      </div>

                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Fakultas (Singkatan)</label>
                        <input type="text" value={item.faculty} onChange={e => updateAmbassador(idx, 'faculty', e.target.value)} placeholder="Contoh: FITK / FEBI / Fasya / FUA / FDKI" />
                      </div>

                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Program Studi / Jurusan</label>
                        <input type="text" value={item.major} onChange={e => updateAmbassador(idx, 'major', e.target.value)} placeholder="Contoh: Tadris Bahasa Inggris" />
                      </div>

                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Tahun Angkatan</label>
                        <input type="text" value={item.year || '2026'} onChange={e => updateAmbassador(idx, 'year', e.target.value)} placeholder="2026" />
                      </div>

                      <div className="form-group">
                        <label>URL Foto Duta (Potret)</label>
                        <input type="text" value={item.img} onChange={e => updateAmbassador(idx, 'img', e.target.value)} placeholder="https://..." />
                      </div>

                      {item.img && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                          <Image src={item.img} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--gold)' }} />
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-mid)' }}>
                            <strong>{item.name || 'Nama'}</strong>
                            <div>{item.faculty} · {item.major}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!cmsData.ambassadors || cmsData.ambassadors.length === 0) && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-light)' }}>Belum ada profil duta.</div>}
                </div>
              </div>
            )}

            {/* TAB 4: GALERI DOKUMENTASI */}
            {cmsTab === 'gallery' && (
              <div className="settings-card" style={{ marginBottom: '2rem', width: '100%' }}>
                <div className="settings-card-header">
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)' }}>Galeri Dokumentasi Kegiatan</h3>
                    <p>Atur dokumentasi momen dan kegiatan Duta Kampus yang tampil di web publik.</p>
                  </div>
                  <button className="btn btn-sm btn-outline-gold" onClick={addGallery}>+ Tambah Foto</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  {cmsData.gallery.map((item, idx) => (
                    <div key={item.id || idx} style={{ background: 'var(--bg-alt)', padding: '1.25rem', borderRadius: '16px', border: '1.5px solid var(--border)' }}>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>URL Foto</label>
                        <input type="text" value={item.img} onChange={e => updateGallery(idx, 'img', e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Keterangan Foto</label>
                        <input type="text" value={item.caption} onChange={e => updateGallery(idx, 'caption', e.target.value)} placeholder="Momen kegiatan..." />
                      </div>
                      {item.img && <Image src={item.img} alt="" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />}
                      <button className="btn btn-sm btn-danger" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => removeGallery(idx)}>Hapus Foto</button>
                    </div>
                  ))}
                  {cmsData.gallery.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-light)' }}>Galeri kosong.</div>}
                </div>
              </div>
            )}

            {/* TAB 5: ABOUT / PROGRAM SECTION */}
            {cmsTab === 'about' && (
              <div className="settings-card" style={{ marginBottom: '2rem', width: '100%' }}>
                <div className="settings-card-header">
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)' }}>Foto & Konten Program Duta Kampus (Tentang)</h3>
                    <p>Atur foto utama, lencana tahun, deskripsi, dan poin penting yang tampil di seksi Program Duta Kampus (Home & Halaman Tentang).</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem', marginTop: '1.5rem', alignItems: 'start' }}>
                  {/* Left Column: Form Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label style={{ fontWeight: 700 }}>URL Foto Program (Mendukung Google Drive & Web Link)</label>
                      <input 
                        type="text" 
                        value={cmsData.about?.img || ''} 
                        onChange={e => updateAbout('img', e.target.value)} 
                        placeholder="https://drive.google.com/... atau https://..." 
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label style={{ fontWeight: 700 }}>Tahun Lencana</label>
                        <input 
                          type="text" 
                          value={cmsData.about?.badgeYear || '2026'} 
                          onChange={e => updateAbout('badgeYear', e.target.value)} 
                          placeholder="2026" 
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: 700 }}>Teks Lencana</label>
                        <input 
                          type="text" 
                          value={cmsData.about?.badgeText || 'Pemilihan Resmi'} 
                          onChange={e => updateAbout('badgeText', e.target.value)} 
                          placeholder="Pemilihan Resmi" 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 700 }}>Deskripsi Program</label>
                      <textarea 
                        rows={4}
                        value={cmsData.about?.desc || ''} 
                        onChange={e => updateAbout('desc', e.target.value)} 
                        placeholder="Deskripsi program duta kampus..."
                        style={{ width: '100%', borderRadius: '8px', padding: '0.75rem', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.5 }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 700 }}>Poin 1: Sosialisasi & Edukasi</label>
                      <input 
                        type="text" 
                        value={cmsData.about?.point1Title || ''} 
                        onChange={e => updateAbout('point1Title', e.target.value)} 
                        placeholder="Judul Poin 1" 
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <input 
                        type="text" 
                        value={cmsData.about?.point1Desc || ''} 
                        onChange={e => updateAbout('point1Desc', e.target.value)} 
                        placeholder="Keterangan Poin 1" 
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 700 }}>Poin 2: Multimedia & Humas</label>
                      <input 
                        type="text" 
                        value={cmsData.about?.point2Title || ''} 
                        onChange={e => updateAbout('point2Title', e.target.value)} 
                        placeholder="Judul Poin 2" 
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <input 
                        type="text" 
                        value={cmsData.about?.point2Desc || ''} 
                        onChange={e => updateAbout('point2Desc', e.target.value)} 
                        placeholder="Keterangan Poin 2" 
                      />
                    </div>
                  </div>

                  {/* Right Column: Live Preview Card */}
                  <div>
                    <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>Pratinjau Foto & Lencana Langsung</label>
                    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', aspectRatio: '4/5', maxWidth: '360px', background: 'var(--bg-alt)' }}>
                      <Image 
                        src={cmsData.about?.img || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80'} 
                        alt="Pratinjau Program"
                        fill
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', background: 'var(--navy)', color: '#fff', padding: '12px 18px', borderRadius: '10px', zIndex: 2, textAlign: 'center' }}>
                        <strong style={{ color: 'var(--gold)', fontSize: '1.25rem', display: 'block', lineHeight: 1 }}>{cmsData.about?.badgeYear || '2026'}</strong>
                        <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{cmsData.about?.badgeText || 'Pemilihan Resmi'}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-light)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                      Foto ini tampil di halaman Beranda publik (seksi "Program Duta Kampus") dan di halaman Tentang (`/about`).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SAVE BUTTON FOR CMS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4rem' }}>
              <button className="btn btn-gold btn-lg" onClick={handleCmsSave} style={{ padding: '0.875rem 2.5rem', fontWeight: 700 }}>
                Simpan Perubahan CMS
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 5: PENGATURAN SISTEM
            ======================================================== */}
        {page === 'settings' && (
          <div className="page active" style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="settings-grid">
              {/* Registration Toggle */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                  <div><h3>Status Pendaftaran Terbuka</h3><p>Buka atau tutup akses formulir pendaftaran duta kampus bagi publik.</p></div>
                </div>
                <div className="toggle-row">
                  <span>Akses Pendaftaran: <strong style={{ color: regOpen ? '#16a34a' : '#dc2626' }}>{regOpen ? 'Dibuka' : 'Ditutup'}</strong></span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={regOpen} onChange={() => { const open = Settings.toggle(); setRegOpen(open); showToast(`Pendaftaran berhasil ${open ? 'dibuka' : 'ditutup'}.`); }} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Password update */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                  <div><h3>Ubah Kata Sandi Admin</h3><p>Perbarui kredensial untuk masuk ke panel administrator ini.</p></div>
                </div>
                <div className="settings-form">
                  <div className="form-group"><input type="password" placeholder="Password saat ini" value={passwords.cur} onChange={e => setPasswords(p => ({ ...p, cur: e.target.value }))} /></div>
                  <div className="form-group"><input type="password" placeholder="Password baru" value={passwords.newP} onChange={e => setPasswords(p => ({ ...p, newP: e.target.value }))} /></div>
                  <div className="form-group"><input type="password" placeholder="Ulangi password baru" value={passwords.conf} onChange={e => setPasswords(p => ({ ...p, conf: e.target.value }))} /></div>
                  <button className="btn btn-gold" onClick={changePassword}>Simpan Password</button>
                </div>
              </div>

              {/* Data & Backup Tools */}
              <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
                <div className="settings-card-header">
                  <div className="settings-card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
                  <div><h3>Pemeliharaan Data dan Cadangan Sistem</h3><p>Unduh cadangan data sistem atau muat ulang data sampel untuk pengujian fitur.</p></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline-gold" onClick={handleExportBackupJSON}>
                    Unduh Cadangan Data JSON
                  </button>
                  <button className="btn btn-outline-gold" onClick={handleResetDemoData}>
                    Muat Ulang Data Sampel Pendaftar
                  </button>
                  <button className="btn btn-danger" onClick={handleClearDemoData}>
                    Bersihkan Seluruh Data Uji Coba
                  </button>
                </div>
              </div>

              {/* Firebase Cloud Sync Status */}
              <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
                <div className="settings-card-header">
                  <div className="settings-card-icon" style={{ background: isFirebaseConfigured ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)', color: isFirebaseConfigured ? '#16a34a' : '#ca8a04' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0 }}>Integrasi Cloud Database (Firebase Firestore)</h3>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: '20px', 
                        background: isFirebaseConfigured ? '#dcfce7' : '#fef9c3', 
                        color: isFirebaseConfigured ? '#15803d' : '#854d0e' 
                      }}>
                        {isFirebaseConfigured ? 'Terhubung ke Cloud' : 'Mode Offline / LocalStorage'}
                      </span>
                    </div>
                    <p style={{ margin: 0 }}>
                      {isFirebaseConfigured 
                        ? `Aplikasi terhubung ke Firebase Project ID: ${firebaseConfig.projectId}. Semua akun dan berkas pendaftar tersinkronisasi secara otomatis ke Cloud Firestore.`
                        : 'Aplikasi saat ini berjalan menggunakan LocalStorage browser. Untuk mengaktifkan sinkronisasi cloud real-time antar perangkat, masukkan kredensial Firebase Anda ke file .env.'}
                    </p>
                  </div>
                </div>

                {isFirebaseConfigured && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#15803d', fontWeight: 700 }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></span>
                        <span>Sistem Hemat Kuota Aktif: 0 Read Firestore Saat Refresh Browser</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', display: 'block', marginTop: '2px' }}>
                        Data dibaca instan dari cache lokal. Terakhir sinkronisasi cloud: <strong>{lastSyncDisplay}</strong>
                      </span>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-sm btn-gold" 
                      onClick={handleManualCloudSync}
                      disabled={isSyncingCloud}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontWeight: 700 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isSyncingCloud ? 'spin-animation' : ''}>
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                        <path d="M16 21h5v-5"/>
                      </svg>
                      <span>{isSyncingCloud ? 'Menyinkronkan...' : 'Sinkronkan Data Cloud Sekarang'}</span>
                    </button>
                  </div>
                )}

                {!isFirebaseConfigured && (
                  <div style={{ background: 'var(--bg-alt)', padding: '1.25rem', borderRadius: '10px', marginTop: '1rem', border: '1px solid var(--border-soft)' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--navy)', display: 'block', marginBottom: '0.5rem' }}>
                      Panduan 4 Langkah Menghubungkan Firebase:
                    </strong>
                    <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>
                      <li>Buka <strong>Firebase Console</strong> (<a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>console.firebase.google.com</a>) dan buat/pilih project.</li>
                      <li>Aktifkan <strong>Cloud Firestore</strong> (mode Test atau Production) di menu <i>Build &gt; Firestore Database</i>.</li>
                      <li>Di <strong>Project Settings</strong> &gt; <strong>General</strong> &gt; <strong>Your Apps</strong>, buat web app (ikon <code>&lt;/&gt;</code>) dan salin kredensial <code>firebaseConfig</code>.</li>
                      <li>Buka file <code>.env</code> di root folder proyek ini, tempel nilai konfigurasi (API Key, Project ID, dll), lalu jalankan ulang <code>npm run dev</code>.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Google Drive & Google Apps Script Storage Integration */}
              <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
                <div className="settings-card-header">
                  <div className="settings-card-icon" style={{ background: driveConfig.scriptUrl ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)', color: driveConfig.scriptUrl ? '#16a34a' : '#ca8a04' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0 }}>Penyimpanan Berkas Google Drive (Google Apps Script)</h3>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: '20px', 
                        background: driveConfig.scriptUrl ? '#dcfce7' : '#fef9c3', 
                        color: driveConfig.scriptUrl ? '#15803d' : '#854d0e' 
                      }}>
                        {driveConfig.scriptUrl ? 'Terhubung ke Google Apps Script' : 'Mode Penyimpanan Mandiri / Siap Dihubungkan'}
                      </span>
                    </div>
                    <p style={{ margin: 0 }}>
                      Dokumen persyaratan (PDF, Surat Pernyataan, CV, Transkrip, dll.) dapat otomatis diunggah dan disimpan ke Folder Google Drive panitia menggunakan Google Apps Script Web App dengan hak akses CRUD penuh.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>URL Web App Google Apps Script</label>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={driveConfig.scriptUrl || ''}
                      onChange={(e) => setDriveConfig(prev => ({ ...prev, scriptUrl: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                    <small style={{ color: '#64748b' }}>URL Web App hasil deployment dari Google Apps Script.</small>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>ID atau URL Folder Google Drive Utama (Tempat Berkas Disimpan)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 1a2B3c4D5e... atau https://drive.google.com/drive/folders/..."
                      value={driveConfig.folderId || ''}
                      onChange={(e) => setDriveConfig(prev => ({ ...prev, folderId: e.target.value }))}
                      style={{ width: '100%' }}
                    />
                    <small style={{ color: '#64748b' }}>Folder Google Drive yang menampung subfolder berkas tiap pelamar.</small>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-gold"
                      onClick={() => {
                        DriveStorage.saveConfig(driveConfig);
                        setDriveSaveStatus('Pengaturan Google Drive berhasil disimpan!');
                        showToast('Pengaturan Google Drive berhasil disimpan.');
                        setTimeout(() => setDriveSaveStatus(''), 4000);
                      }}
                    >
                      Simpan Pengaturan Google Drive
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-gold"
                      disabled={isTestingDrive}
                      onClick={handleTestDriveConnection}
                    >
                      {isTestingDrive ? 'Menguji Koneksi...' : 'Uji Koneksi Google Apps Script'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-gold"
                      onClick={() => setShowScriptModal(true)}
                    >
                      Lihat & Salin Kode Google Apps Script
                    </button>

                    {driveSaveStatus && (
                      <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700 }}>
                        {driveSaveStatus}
                      </span>
                    )}
                  </div>

                  {/* Test Connection Result Alert */}
                  {driveTestResult && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      borderRadius: '8px',
                      background: driveTestResult.success ? '#f0fdf4' : (driveTestResult.needsPermission ? '#fffbeb' : '#fef2f2'),
                      border: `1px solid ${driveTestResult.success ? '#bbf7d0' : (driveTestResult.needsPermission ? '#fde68a' : '#fecaca')}`,
                      borderLeft: `4px solid ${driveTestResult.success ? '#16a34a' : (driveTestResult.needsPermission ? '#d97706' : '#dc2626')}`,
                      color: driveTestResult.success ? '#166534' : (driveTestResult.needsPermission ? '#92400e' : '#991b1b'),
                      fontSize: '0.875rem'
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>
                        {driveTestResult.success ? 'Koneksi Google Drive Berhasil Terhubung' : (driveTestResult.needsPermission ? 'Perlu Penyesuaian Hak Akses di Google Apps Script' : 'Koneksi Gagal Terhubung')}
                      </div>
                      <div>
                        {driveTestResult.success ? (
                          <>
                            Folder Target: <strong>{driveTestResult.folderName}</strong> (ID: <code>{driveTestResult.folderId}</code>).<br />
                            <a href={driveTestResult.folderUrl} target="_blank" rel="noreferrer" style={{ color: '#16a34a', textDecoration: 'underline', fontWeight: 600 }}>
                              Buka Folder Google Drive ↗
                            </a>
                          </>
                        ) : driveTestResult.needsPermission ? (
                          <div>
                            <p style={{ margin: '0 0 0.5rem 0' }}>
                              URL script sudah aktif, namun Google menolak akses publik karena pengaturan <strong>"Who has access"</strong> masih disetel ke <em>"Only myself" (Hanya saya)</em>.
                            </p>
                            <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.5' }}>
                              <li>Buka editor Google Apps Script Anda.</li>
                              <li>Klik <strong>Deploy</strong> (Terapkan) → <strong>Manage deployments</strong> (Kelola deployment).</li>
                              <li>Klik ikon <strong>Pensil (Edit)</strong> pada deployment yang aktif.</li>
                              <li>Pada kolom <strong>Who has access (Siapa yang memiliki akses)</strong>, pilih <strong>"Anyone" (Siapa saja)</strong>.</li>
                              <li>Klik <strong>Deploy</strong>. Selesai! Klik Uji Koneksi kembali.</li>
                            </ol>
                          </div>
                        ) : (
                          <div>{driveTestResult.error || 'Terjadi kesalahan saat menghubungi Google Apps Script.'}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 6: DIREKTORI BERKAS & VERIFIKASI CALON DUTA (FULL DIRECTORY VIEW)
            TAMPILAN DIREKTORI PENUH (DESKTOP FULL WIDTH, TANPA TERPOTONG DI SISI KANAN)
            ======================================================== */}
        {page === 'direktori_berkas' && mergedSelectedItem && selectedDossier && (
          <div className="page active" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', boxSizing: 'border-box', padding: '1.5rem 2rem' }}>
            {/* Top Navigation & Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <button
                  type="button"
                  onClick={() => { setSelectedId(null); setPage(previousPage || 'akun_pelamar'); }}
                  className="btn btn-sm btn-outline-gold"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: '7px 14px' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  <span>Kembali ke Daftar</span>
                </button>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-light)' }}>
                  <span>Admin Panel</span> <span style={{ margin: '0 4px' }}>/</span> 
                  <span style={{ color: 'var(--text-mid)', fontWeight: 600 }}>Direktori Berkas</span> <span style={{ margin: '0 4px' }}>/</span> 
                  <strong style={{ color: 'var(--navy)' }}>{mergedSelectedItem.namaLengkap}</strong>
                </div>
              </div>

              {/* Quick Status & Account Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className={`badge ${mergedSelectedItem.accountStatus === 'approved' ? 'badge-success' : mergedSelectedItem.accountStatus === 'rejected' ? 'badge-danger' : 'badge-pending'}`} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                  Status Akun: {mergedSelectedItem.accountStatus === 'approved' ? 'Disetujui' : mergedSelectedItem.accountStatus === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
                </span>

                {mergedSelectedItem.accountStatus === 'pending' && (
                  <button
                    type="button"
                    className="btn btn-sm btn-gold"
                    onClick={() => { handleApproveUser(mergedSelectedItem.email); }}
                    style={{ fontWeight: 700, padding: '7px 16px' }}
                  >
                    Setujui Akun Ini
                  </button>
                )}

                {mergedSelectedItem.accountStatus === 'approved' && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => { handleRejectUser(mergedSelectedItem.email); }}
                    style={{ border: '1px solid #fca5a5', color: '#dc2626', background: '#fff', padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Batalkan Persetujuan
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ border: '1px solid #fca5a5', color: '#dc2626', background: '#fff', padding: '6px 10px', fontSize: '0.75rem' }}
                  onClick={() => handleDeleteUser(mergedSelectedItem.email)}
                >
                  Hapus Akun
                </button>
              </div>
            </div>

            {/* Expansive Header Banner Card (Full Width) */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.75rem 2rem',
              marginBottom: '1.75rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: '300px' }}>
                <div style={{
                  width: 76, height: 76, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #16324A 0%, #C49E59 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.85rem', fontWeight: 800, color: '#ffffff',
                  boxShadow: '0 6px 18px rgba(22, 50, 74, 0.25)', flexShrink: 0
                }}>
                  {mergedSelectedItem.namaLengkap?.charAt(0) || 'U'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>
                      {mergedSelectedItem.namaLengkap}
                    </h2>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: '9999px', background: selectedDossier.bg, color: selectedDossier.color, border: `1px solid ${selectedDossier.border}` }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: selectedDossier.color }} />
                      {selectedDossier.statusLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-mid)', marginTop: '4px' }}>
                    NIM: <strong>{mergedSelectedItem.nim || '—'}</strong> · {mergedSelectedItem.prodi || mergedSelectedItem.jurusan || 'Program Studi'} · {mergedSelectedItem.fakultas || '—'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '3px' }}>
                    Terdaftar: {formatDateTime(mergedSelectedItem.createdAt)} · Semester: <strong>{mergedSelectedItem.semester || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Completeness Indicator Widget */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.125rem 1.5rem', minWidth: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)' }}>Kelengkapan Berkas</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: selectedDossier.color }}>
                    {selectedDossier.filledCount} / {selectedDossier.totalCount} ({selectedDossier.percent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selectedDossier.percent}%`, background: selectedDossier.color, borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                  {selectedDossier.isComplete ? 'Seluruh berkas persyaratan telah lengkap.' : `Kurang ${selectedDossier.missingFields.length} berkas wajib.`}
                </div>
              </div>
            </div>

            {/* Main 2-Column Responsive Desktop Grid */}
            <div className="direktori-layout" style={{ marginBottom: '2rem' }}>
              {/* LEFT COLUMN: Data Mahasiswa, Kontak, Prestasi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Card: Identitas Akademik */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.625rem' }}>
                    Data Akademik Mahasiswa
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    {[['NIM', mergedSelectedItem.nim], ['Fakultas', mergedSelectedItem.fakultas], ['Program Studi', mergedSelectedItem.prodi || mergedSelectedItem.jurusan]].map(([lbl, val]) => (
                      <div key={lbl}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>{lbl}</div>
                        <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{val || '—'}</div>
                      </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Semester</div>
                        <div style={{ fontWeight: 700, color: 'var(--navy)' }}>Semester {mergedSelectedItem.semester || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>IPK</div>
                        <div style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '1rem' }}>{mergedSelectedItem.ipk || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card: Kontak & Domisili */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.625rem' }}>
                    Kontak & Domisili
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Email</div>
                      <div style={{ fontWeight: 600, color: 'var(--navy)', wordBreak: 'break-all' }}>{mergedSelectedItem.email}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Nomor WhatsApp</div>
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                        {mergedSelectedItem.noHp ? (
                          <a href={`https://wa.me/${mergedSelectedItem.noHp.replace(/^0/, '62').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 700 }}>
                            {mergedSelectedItem.noHp} (Hubungi WA)
                          </a>
                        ) : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>TTL</div>
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                        {mergedSelectedItem.ttl || (mergedSelectedItem.tempatLahir ? `${mergedSelectedItem.tempatLahir}, ${mergedSelectedItem.tanggalLahir}` : '—')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Alamat</div>
                      <div style={{ fontWeight: 500, color: 'var(--text-mid)' }}>{mergedSelectedItem.alamat || '—'}</div>
                    </div>
                  </div>
                </div>

                {/* Card: Portofolio & Esai */}
                {(mergedSelectedItem.prestasi || mergedSelectedItem.organisasi || mergedSelectedItem.motivasi) && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                    <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.625rem' }}>
                      Prestasi & Esai Motivasi
                    </h4>
                    {mergedSelectedItem.prestasi && <div style={{ marginBottom: '0.875rem' }}><div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Prestasi</div><div style={{ fontSize: '0.825rem', color: 'var(--navy)', marginTop: '2px' }}>{mergedSelectedItem.prestasi}</div></div>}
                    {mergedSelectedItem.organisasi && <div style={{ marginBottom: '0.875rem' }}><div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Organisasi</div><div style={{ fontSize: '0.825rem', color: 'var(--navy)', marginTop: '2px' }}>{mergedSelectedItem.organisasi}</div></div>}
                    {mergedSelectedItem.motivasi && <div><div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Esai Motivasi</div><div style={{ fontSize: '0.825rem', color: 'var(--navy)', marginTop: '4px', lineHeight: 1.65, fontStyle: 'italic', borderLeft: '3px solid var(--gold)', paddingLeft: '0.75rem' }}>{mergedSelectedItem.motivasi}</div></div>}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: DIREKTORI 10 DOKUMEN PERSYARATAN */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy)' }}>Direktori Berkas Dokumen Persyaratan</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-light)' }}>Periksa kelengkapan berkas administrasi calon Duta Kampus UIN SSC 2026.</p>
                  </div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--navy)', background: '#f8fafc', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    Terunggah: <strong style={{ color: selectedDossier.color }}>{selectedDossier.filledCount} dari {selectedDossier.totalCount}</strong>
                  </div>
                </div>

                {/* Document Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {selectedDossier.checklist.map((doc, idx) => (
                    <div
                      key={doc.key}
                      style={{
                        background: doc.filled ? '#f0fdf4' : '#fcfcfd',
                        border: `1.5px solid ${doc.filled ? '#86efac' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: doc.filled ? '#16a34a' : '#94a3b8',
                            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.72rem', fontWeight: 800, flexShrink: 0, marginTop: '2px'
                          }}>
                            {doc.filled ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : idx + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '0.9rem' }}>{idx + 1}. {doc.label}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{doc.sublabel}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: doc.required ? '#fee2e2' : '#f1f5f9', color: doc.required ? '#991b1b' : '#64748b' }}>
                            {doc.required ? 'Wajib' : doc.conditionalNote || 'Opsional'}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.625rem', paddingTop: '0.625rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ fontSize: '0.8rem', color: doc.filled ? '#166534' : '#94a3b8', fontWeight: doc.filled ? 600 : 400, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.filled ? `Terlampir: ${doc.value}` : 'Belum dilampirkan oleh peserta'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {doc.filled ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-gold"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                onClick={() => setDocPreviewModal({
                                  isOpen: true,
                                  docKey: doc.key,
                                  docLabel: doc.label,
                                  docValue: mergedSelectedItem[doc.key] || doc.value,
                                  applicantEmailOrId: mergedSelectedItem.email || mergedSelectedItem.id,
                                  applicantName: mergedSelectedItem.namaLengkap
                                })}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                Pratinjau Berkas
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-gold"
                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                onClick={() => setDocPreviewModal({
                                  isOpen: true,
                                  docKey: doc.key,
                                  docLabel: doc.label,
                                  docValue: mergedSelectedItem[doc.key] || doc.value,
                                  applicantEmailOrId: mergedSelectedItem.email || mergedSelectedItem.id,
                                  applicantName: mergedSelectedItem.namaLengkap
                                })}
                              >
                                Edit / Ganti
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                onClick={() => {
                                  askConfirmation({
                                    title: 'Hapus Berkas Dokumen',
                                    message: `Apakah Anda yakin ingin menghapus berkas "${doc.label}" untuk ${mergedSelectedItem.namaLengkap}? Tindakan ini bersifat permanen.`,
                                    confirmText: 'Ya, Hapus Berkas',
                                    cancelText: 'Batalkan',
                                    isDestructive: true,
                                    onConfirm: () => {
                                      DriveStorage.deleteDocument(mergedSelectedItem.email || mergedSelectedItem.id, doc.key);
                                      setApplicants(DB.getAll());
                                      setRegisteredUsers(Auth.getUsers());
                                      showToast('Berkas berhasil dihapus.');
                                    }
                                  });
                                }}
                              >
                                Hapus
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-gold"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setDocPreviewModal({
                                isOpen: true,
                                docKey: doc.key,
                                docLabel: doc.label,
                                docValue: null,
                                applicantEmailOrId: mergedSelectedItem.email || mergedSelectedItem.id,
                                applicantName: mergedSelectedItem.namaLengkap
                              })}
                            >
                              + Unggah / Tautkan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* BOTTOM DECISION CONSOLE */}
                <div style={{ marginTop: '2rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 800, color: 'var(--navy)' }}>
                    Keputusan Hasil Seleksi Administrasi Berkas
                  </h4>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.825rem', color: '#64748b' }}>
                    Tentukan kelulusan seleksi berkas calon duta ini. Status akan langsung tampil di dashboard peserta secara real-time.
                  </p>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.4rem' }}>
                      Pesan untuk Peserta (opsional):
                    </label>
                    <textarea
                      rows="3"
                      value={customMsg}
                      onChange={e => setCustomMsg(e.target.value)}
                      placeholder="Biarkan kosong untuk menggunakan pesan standar resmi..."
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ background: '#16a34a', color: '#fff', padding: '0.75rem 1.6rem', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                      onClick={() => { handleSetDossierStatus(mergedSelectedItem.id, 'lolos', customMsg); }}
                    >
                      Tetapkan LOLOS Seleksi Berkas
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ padding: '0.75rem 1.6rem', fontWeight: 700 }}
                      onClick={() => { handleSetDossierStatus(mergedSelectedItem.id, 'tidak_lolos', customMsg); }}
                    >
                      Tetapkan Tidak Lolos
                    </button>

                    <button
                      type="button"
                      className="btn"
                      style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', padding: '0.75rem 1.4rem', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
                      onClick={() => { handleSetDossierStatus(mergedSelectedItem.id, 'review', customMsg); }}
                    >
                      Atur Dalam Peninjauan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================
          MODAL: TAMBAH AKUN CALON DUTA (VERIFIKASI AKUN)
          ======================================================== */}
      {isAddUserModalOpen && (
        <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) setIsAddUserModalOpen(false); }}>
          <div className="modal-box" style={{ maxWidth: '600px', width: '92%' }}>
            <div className="modal-header">
              <h3>Tambah Akun Calon Duta Baru</h3>
              <button className="modal-close" onClick={() => setIsAddUserModalOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Contoh: Ahmad Hidayat"
                  value={newUserForm.namaLengkap} 
                  onChange={e => setNewUserForm(f => ({ ...f, namaLengkap: e.target.value }))} 
                />
              </div>

              <div className="form-group">
                <label>Alamat Email Mahasiswa</label>
                <input 
                  type="email" 
                  required 
                  placeholder="ahmad@student.uinssc.ac.id"
                  value={newUserForm.email} 
                  onChange={e => setNewUserForm(f => ({ ...f, email: e.target.value }))} 
                />
              </div>

              <div className="form-group">
                <label>Nomor Induk Mahasiswa (NIM)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Contoh: 2308101050"
                  value={newUserForm.nim} 
                  onChange={e => setNewUserForm(f => ({ ...f, nim: e.target.value }))} 
                />
              </div>

              <div className="form-group">
                <label>Fakultas</label>
                <select 
                  className="filter-select"
                  value={newUserForm.fakultas}
                  onChange={e => {
                    const facName = e.target.value;
                    const fObj = FAKULTAS_DATA.find(f => f.name === facName);
                    setNewUserForm(f => ({
                      ...f,
                      fakultas: facName,
                      jurusan: fObj?.majors[0] || ''
                    }));
                  }}
                >
                  {FAKULTAS_DATA.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Program Studi / Jurusan</label>
                <select 
                  className="filter-select"
                  value={newUserForm.jurusan}
                  onChange={e => setNewUserForm(f => ({ ...f, jurusan: e.target.value }))}
                >
                  {(FAKULTAS_DATA.find(f => f.name === newUserForm.fakultas)?.majors || []).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Kata Sandi Akun</label>
                <input 
                  type="text" 
                  value={newUserForm.password} 
                  onChange={e => setNewUserForm(f => ({ ...f, password: e.target.value }))} 
                />
              </div>

              <div className="form-group">
                <label>Status Akun Langsung</label>
                <select 
                  className="filter-select"
                  value={newUserForm.accountStatus}
                  onChange={e => setNewUserForm(f => ({ ...f, accountStatus: e.target.value }))}
                >
                  <option value="approved">Langsung Disetujui (Approved)</option>
                  <option value="pending">Menunggu Verifikasi (Pending)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline-gold" onClick={() => setIsAddUserModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-gold">
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: TAMBAH BERKAS PENDAFTAR MANUAL
          ======================================================== */}
      {isAddApplicantModalOpen && (
        <div className="modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) setIsAddApplicantModalOpen(false); }}>
          <div className="modal-box" style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Tambah Berkas Pendaftar Manual</h3>
              <button className="modal-close" onClick={() => setIsAddApplicantModalOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreateApplicant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Nama Lengkap Calon Duta"
                    value={newApplicantForm.namaLengkap} 
                    onChange={e => setNewApplicantForm(f => ({ ...f, namaLengkap: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label>NIM</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="230810xxxx"
                    value={newApplicantForm.nim} 
                    onChange={e => setNewApplicantForm(f => ({ ...f, nim: e.target.value }))} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="email@student.uinssc.ac.id"
                    value={newApplicantForm.email} 
                    onChange={e => setNewApplicantForm(f => ({ ...f, email: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label>Nomor WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="081234567890"
                    value={newApplicantForm.noHp} 
                    onChange={e => setNewApplicantForm(f => ({ ...f, noHp: e.target.value }))} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Fakultas</label>
                  <select 
                    className="filter-select"
                    value={newApplicantForm.fakultas}
                    onChange={e => {
                      const facName = e.target.value;
                      const fObj = FAKULTAS_DATA.find(f => f.name === facName);
                      setNewApplicantForm(f => ({
                        ...f,
                        fakultas: facName,
                        jurusan: fObj?.majors[0] || ''
                      }));
                    }}
                  >
                    {FAKULTAS_DATA.map(f => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Program Studi</label>
                  <select 
                    className="filter-select"
                    value={newApplicantForm.jurusan}
                    onChange={e => setNewApplicantForm(f => ({ ...f, jurusan: e.target.value }))}
                  >
                    {(FAKULTAS_DATA.find(f => f.name === newApplicantForm.fakultas)?.majors || []).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Semester</label>
                  <input 
                    type="text" 
                    value={newApplicantForm.semester} 
                    onChange={e => setNewApplicantForm(f => ({ ...f, semester: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label>Nilai IPK</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 3.75"
                    value={newApplicantForm.ipk} 
                    onChange={e => setNewApplicantForm(f => ({ ...f, ipk: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Alamat Domisili</label>
                <input 
                  type="text" 
                  value={newApplicantForm.alamat} 
                  onChange={e => setNewApplicantForm(f => ({ ...f, alamat: e.target.value }))} 
                />
              </div>

              <div className="form-group">
                <label>Esai Motivasi Duta</label>
                <textarea 
                  rows="3" 
                  value={newApplicantForm.motivasi} 
                  onChange={e => setNewApplicantForm(f => ({ ...f, motivasi: e.target.value }))} 
                />
              </div>

              <div className="form-group">
                <label>Status Seleksi Berkas</label>
                <select 
                  className="filter-select"
                  value={newApplicantForm.selectionStage}
                  onChange={e => setNewApplicantForm(f => ({ ...f, selectionStage: e.target.value }))}
                >
                  <option value="review">Dalam Peninjauan (Review)</option>
                  <option value="lolos">Lolos Seleksi Berkas</option>
                  <option value="tidak_lolos">Tidak Lolos</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline-gold" onClick={() => setIsAddApplicantModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-gold">
                  Simpan Berkas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION (HP VIEW <= 768px)
          ======================================================== */}
      <nav className="admin-bottom-nav">
        <button
          type="button"
          onClick={() => { setPage('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`admin-bottom-nav-item ${page === 'dashboard' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span>Ringkasan</span>
        </button>

        <button
          type="button"
          onClick={() => { setPage('akun_pelamar'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`admin-bottom-nav-item ${page === 'akun_pelamar' ? 'active' : ''}`}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
            {pendingUsersCount > 0 && <span className="admin-bottom-badge">{pendingUsersCount}</span>}
          </div>
          <span>Verifikasi</span>
        </button>

        <button
          type="button"
          onClick={() => { setPage('pendaftar'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`admin-bottom-nav-item ${page === 'pendaftar' ? 'active' : ''}`}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            {applicants.length > 0 && <span className="admin-bottom-badge">{applicants.length}</span>}
          </div>
          <span>Berkas</span>
        </button>

        <button
          type="button"
          onClick={() => { setPage('cms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`admin-bottom-nav-item ${page === 'cms' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>CMS Web</span>
        </button>

        <button
          type="button"
          onClick={() => { setPage('settings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`admin-bottom-nav-item ${page === 'settings' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Sistem</span>
        </button>
      </nav>

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: confirmModal.isDestructive ? '#fee2e2' : '#fef3c7',
              color: confirmModal.isDestructive ? '#dc2626' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              {confirmModal.isDestructive ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.5rem' }}>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              {confirmModal.message}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {confirmModal.cancelText || 'Batalkan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  if (cb) cb();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: confirmModal.isDestructive ? '#dc2626' : 'var(--navy)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {confirmModal.confirmText || 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU & CRUD BERKAS DOKUMEN (ADMIN) */}
      <DocumentPreviewModal
        isOpen={docPreviewModal.isOpen}
        onClose={() => setDocPreviewModal(prev => ({ ...prev, isOpen: false }))}
        docKey={docPreviewModal.docKey}
        docLabel={docPreviewModal.docLabel}
        docValue={docPreviewModal.docValue}
        applicantEmailOrId={docPreviewModal.applicantEmailOrId}
        applicantName={docPreviewModal.applicantName}
        canEdit={true}
        onUpdated={() => {
          setApplicants(DB.getAll());
          setRegisteredUsers(Auth.getUsers());
          showToast('Data berkas berhasil diperbarui.');
        }}
      />

      {/* MODAL SALIN KODE GOOGLE APPS SCRIPT */}
      {showScriptModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setShowScriptModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '840px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-alt)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy)' }}>
                  Kode Google Apps Script (Backend Google Drive)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Deploy kode ini di Google Apps Script akun Google Anda agar berkas pendaftar otomatis masuk ke Google Drive.
                </p>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 700 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', fontSize: '0.875rem' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', color: '#166534' }}>
                <strong>Langkah Mudah 3 Menit:</strong>
                <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                  <li>Buka <a href="https://script.google.com/" target="_blank" rel="noreferrer" style={{ color: '#15803d', fontWeight: 700 }}>script.google.com</a> &gt; Klik <strong>"New project"</strong>.</li>
                  <li>Hapus semua teks, lalu tempel kode di bawah ini.</li>
                  <li>Klik <strong>Deploy &gt; New deployment</strong> &gt; Pilih type <strong>Web app</strong>.</li>
                  <li>Set: <i>Execute as</i>: <strong>Me</strong> dan <i>Who has access</i>: <strong>Anyone</strong>.</li>
                  <li>Klik <strong>Deploy</strong>, lalu salin Web app URL dan masukkan ke kolom URL di pengaturan sistem.</li>
                </ol>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--navy)' }}>File: google-apps-script.js</span>
                <button
                  type="button"
                  className="btn btn-sm btn-gold"
                  onClick={() => {
                    const scriptText = `/**
 * GOOGLE APPS SCRIPT - PENYIMPANAN BERKAS DUTA KAMPUS UIN SSC 2026
 */
var DEFAULT_FOLDER_NAME = "Berkas Pendaftaran Duta Kampus UIN SSC 2026";
var DEFAULT_FOLDER_ID = ""; 

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "active", message: "Google Apps Script Aktif" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents);
    var action = request.action || "upload";

    if (action === "delete") {
      DriveApp.getFileById(request.fileId).setTrashed(true);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "upload") {
      var folder = DEFAULT_FOLDER_ID ? DriveApp.getFolderById(DEFAULT_FOLDER_ID) : DriveApp.getFoldersByName(DEFAULT_FOLDER_NAME).hasNext() ? DriveApp.getFoldersByName(DEFAULT_FOLDER_NAME).next() : DriveApp.createFolder(DEFAULT_FOLDER_NAME);
      var subfolderName = (request.applicantName || "Peserta") + " - " + (request.applicantNim || request.applicantEmail || "Dokumen");
      var subfolder = folder.getFoldersByName(subfolderName).hasNext() ? folder.getFoldersByName(subfolderName).next() : folder.createFolder(subfolderName);

      var raw = request.base64Data.indexOf("base64,") !== -1 ? request.base64Data.split("base64,")[1] : request.base64Data;
      var blob = Utilities.newBlob(Utilities.base64Decode(raw), request.mimeType || "application/pdf", request.fileName);
      var file = subfolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileId: file.getId(),
        viewUrl: file.getUrl(),
        previewUrl: "https://drive.google.com/file/d/" + file.getId() + "/preview",
        downloadUrl: "https://drive.google.com/uc?export=download&id=" + file.getId()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
                    navigator.clipboard.writeText(scriptText);
                    showToast('Kode Google Apps Script berhasil disalin ke clipboard!');
                  }}
                >
                  Salin Seluruh Kode
                </button>
              </div>

              <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.78rem', overflowX: 'auto', maxHeight: '280px', lineHeight: 1.5 }}>
{`// Salin file google-apps-script.js dari proyek atau klik tombol "Salin Seluruh Kode" di atas.`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--navy)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.875rem',
          fontWeight: 600,
          borderLeft: '4px solid var(--gold)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
