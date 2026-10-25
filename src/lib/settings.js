'use client';

const SETTINGS_KEY = 'dutauinssc_settings';

// Target batas akhir penutupan pendaftaran resmi: 25 Oktober 2026 pukul 23:59:59 WIB
export const REGISTRATION_DEADLINE = new Date(2026, 9, 25, 23, 59, 59).getTime();

export const Settings = {
  get: () => {
    if (typeof window === 'undefined') {
      return { pendaftaranOpen: true, adminUser: 'rasikinganteng', adminPass: 'ghoriztea2026' };
    }
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return {
        pendaftaranOpen: saved.pendaftaranOpen !== undefined ? saved.pendaftaranOpen : true,
        customDeadline: saved.customDeadline || null,
        forceOpen: saved.forceOpen || false,
        adminUser: saved.adminUser || 'rasikinganteng',
        adminPass: (!saved.adminPass || saved.adminPass === 'dutauinssc2026') ? 'ghoriztea2026' : saved.adminPass,
      };
    } catch {
      return { pendaftaranOpen: true, adminUser: 'rasikinganteng', adminPass: 'ghoriztea2026' };
    }
  },

  save: (s) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
      window.dispatchEvent(new Event('storage'));
    }
  },

  // Menentukan status pendaftaran:
  // 1. Jika admin menutup manual (pendaftaranOpen: false), maka pendaftaran DITUTUP.
  // 2. Jika waktu sekarang >= deadline (25 Oktober 2026 23:59:59 WIB), OTOMATIS DITUTUP (kecuali jika admin membuka kembali / perpanjangan via forceOpen).
  isPendaftaranOpen: () => {
    if (typeof window === 'undefined') return true;
    const s = Settings.get();
    if (s.pendaftaranOpen === false) return false;
    if (s.forceOpen) return true;
    const deadline = s.customDeadline ? new Date(s.customDeadline).getTime() : REGISTRATION_DEADLINE;
    return Date.now() < deadline;
  },

  isRegistrationClosed: () => {
    return !Settings.isPendaftaranOpen();
  },

  getDeadlineTime: () => {
    const s = Settings.get();
    return s.customDeadline ? new Date(s.customDeadline).getTime() : REGISTRATION_DEADLINE;
  },

  toggle: () => {
    const s = Settings.get();
    const currentlyOpen = Settings.isPendaftaranOpen();
    if (currentlyOpen) {
      s.pendaftaranOpen = false;
      s.forceOpen = false;
    } else {
      // Dibuka kembali oleh panitia (perpanjangan waktu)
      s.pendaftaranOpen = true;
      s.forceOpen = true;
    }
    Settings.save(s);
    return Settings.isPendaftaranOpen();
  },

  // Menghitung jumlah pendaftar secara dinamis dengan batas minimum 37+ pendaftar
  getApplicantCountDisplay: () => {
    if (typeof window === 'undefined') return '37+';
    try {
      const dbRaw = localStorage.getItem('dutauinssc_pendaftar');
      const usersRaw = localStorage.getItem('dutauinssc_users');
      const dbCount = dbRaw ? JSON.parse(dbRaw).length : 0;
      const userCount = usersRaw ? JSON.parse(usersRaw).filter(u => u && u.role !== 'admin').length : 0;
      const count = Math.max(dbCount, userCount, 37);
      return `${count}+`;
    } catch {
      return '37+';
    }
  }
};
