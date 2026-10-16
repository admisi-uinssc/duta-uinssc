'use client';

const SETTINGS_KEY = 'dutauinssc_settings';

export const Settings = {
  get: () => {
    if (typeof window === 'undefined') return { pendaftaranOpen: true, adminPass: 'dutauinssc2026' };
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"pendaftaranOpen":true,"adminPass":"dutauinssc2026"}');
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
