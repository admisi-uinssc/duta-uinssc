'use client';

const SETTINGS_KEY = 'dutauinssc_settings';

export const Settings = {
  get: () => {
    if (typeof window === 'undefined') {
      return { pendaftaranOpen: true, adminUser: 'rasikinganteng', adminPass: 'ghoriztea2026' };
    }
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return {
        pendaftaranOpen: saved.pendaftaranOpen !== undefined ? saved.pendaftaranOpen : true,
        adminUser: saved.adminUser || 'rasikinganteng',
        adminPass: (!saved.adminPass || saved.adminPass === 'dutauinssc2026') ? 'ghoriztea2026' : saved.adminPass,
      };
    } catch {
      return { pendaftaranOpen: true, adminUser: 'rasikinganteng', adminPass: 'ghoriztea2026' };
    }
  },
  save: (s) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)),
  isPendaftaranOpen: () => Settings.get().pendaftaranOpen,
  toggle: () => {
    const s = Settings.get();
    s.pendaftaranOpen = !s.pendaftaranOpen;
    Settings.save(s);
    return s.pendaftaranOpen;
  },
};
