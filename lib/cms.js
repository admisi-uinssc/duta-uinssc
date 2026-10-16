const OFFICIAL_SHOWCASE_IMG = 'https://ppid.uinssc.ac.id/storage/duta-kampus/01KRX8ZRGXBTT2929HWZQ7CWMM.png';

const DEFAULT_CMS = {
  slider: [
    {
      id: 1,
      img: OFFICIAL_SHOWCASE_IMG,
      tag: 'Pendaftaran 2026', 
      title1: 'Wujudkan', 
      title2: 'Langkah Besarmu', 
      desc: 'Bergabunglah menjadi wajah kampus dan representasi mahasiswa UIN Siber Syekh Nurjati Cirebon.',
      btnText: 'Daftar Sekarang',
      btnLink: '/daftar'
    },
    {
      id: 2,
      img: OFFICIAL_SHOWCASE_IMG,
      tag: 'Tahap Seleksi', 
      title1: 'Asah', 
      title2: 'Potensimu', 
      desc: 'Rangkaian seleksi akan menguji kemampuan komunikasi, kepemimpinan, dan nilai keislaman siber.',
      btnText: 'Lihat Persyaratan',
      btnLink: '/requirements'
    },
    {
      id: 3,
      img: OFFICIAL_SHOWCASE_IMG,
      tag: 'Komunitas & Prestasi', 
      title1: 'Bangun', 
      title2: 'Relasi Luas', 
      desc: 'Temukan keluarga baru dan koneksi berharga bersama ratusan alumni Duta Kampus.',
      btnText: 'Profil Duta',
      btnLink: '/profil-duta'
    }
  ],
  gallery: [
    { id: 1, img: OFFICIAL_SHOWCASE_IMG, caption: 'Kegiatan Promosi Kampus' },
    { id: 2, img: '/assets/logo-main.png', caption: 'Penyambutan Tamu Kehormatan' },
    { id: 3, img: OFFICIAL_SHOWCASE_IMG, caption: 'Malam Puncak Pemilihan' },
    { id: 4, img: '/assets/color-palette.png', caption: 'Pelatihan Public Speaking' },
    { id: 5, img: OFFICIAL_SHOWCASE_IMG, caption: 'Event Sosial Duta Kampus' },
    { id: 6, img: '/assets/logo-circle.png', caption: 'Sesi Pemotretan Profil' },
  ],
  promoBanners: [
    { id: 1, title: 'Buka Kesempatan Emas', subtitle: 'Pendaftaran Duta Kampus 2026', img: OFFICIAL_SHOWCASE_IMG, link: '/daftar' },
    { id: 2, title: 'Keluarga Besar Duta Kampus', subtitle: 'Kolaborasi & Aksi Nyata', img: OFFICIAL_SHOWCASE_IMG, link: '/about' }
  ],
  ambassadors: [
    { id: 1, name: 'M. Rizki Fadhlilah', faculty: 'FITK', major: 'Tadris Bahasa Inggris', img: '', year: '2025' },
    { id: 2, name: 'Mitsni Uswatun Hasanah', faculty: 'FITK', major: 'Tadris Bahasa Inggris', img: '', year: '2025' },
    { id: 3, name: 'Rasikin', faculty: 'Fasya', major: 'Hukum Tatanegara', img: '', year: '2024' },
    { id: 4, name: 'Sahla Aina Muflihah', faculty: 'FITK', major: 'Tadris Bahasa Inggris', img: '', year: '2024' },
    { id: 5, name: 'Yudi Prasetya', faculty: 'FEBI', major: 'Perbankan Syariah', img: '', year: '2024' },
    { id: 6, name: 'Berliana Nabila Az-zahra', faculty: 'FDKI', major: 'Komunikasi dan Penyiaran Islam', img: '', year: '2025' },
    { id: 7, name: 'M. Irfan Maulana', faculty: 'FDKI', major: 'Pengembangan Masyarakat Islam', img: '', year: '2025' },
    { id: 8, name: 'Nadia Salma', faculty: 'FDKI', major: 'Komunikasi dan Penyiaran Islam', img: '', year: '2025' },
    { id: 9, name: 'Agus Haerul', faculty: 'FDKI', major: 'Komunikasi dan Penyiaran Islam', img: '', year: '2023' },
    { id: 10, name: 'Amelia Agustina', faculty: 'FDKI', major: 'Komunikasi dan Penyiaran Islam', img: '', year: '2023' },
    { id: 11, name: 'Dhiya Ghisya Aulia', faculty: 'FDKI', major: 'Bimbingan dan Konseling Islam', img: '', year: '2024' },
    { id: 12, name: 'Muhamad Syihabudin Anam', faculty: 'FEBI', major: 'Akuntansi Syariah', img: '', year: '2024' },
    { id: 13, name: 'Moja Yulia Paramita', faculty: 'FUA', major: 'Tasawuf dan Psikoterapi', img: '', year: '2024' },
    { id: 14, name: 'Syahdan Noer Saputra', faculty: 'Fasya', major: 'Hukum Tatanegara', img: '', year: '2024' },
    { id: 15, name: 'Khoridatus Shofa', faculty: 'FUA', major: 'Sejarah Peradaban Islam', img: '', year: '2023' },
    { id: 16, name: 'Mardiya Ghorizadin', faculty: 'FUA', major: 'Sejarah Peradaban Islam', img: '', year: '2023' },
    { id: 17, name: 'Tonisah', faculty: 'FITK', major: 'Tadris Matematika', img: '', year: '2025' },
    { id: 18, name: 'M. Ade Rifki', faculty: 'FITK', major: 'Tadris Bahasa Inggris', img: '', year: '2025' },
    { id: 19, name: 'M. Danu Ar-Rahman', faculty: 'FASYA', major: 'Hukum Ekonomi Syariah', img: '', year: '2025' },
    { id: 20, name: 'Zahra Roudhotun Najah', faculty: 'FEBI', major: 'Ekonomi Syariah', img: '', year: '2025' }
  ],
  about: {
    img: OFFICIAL_SHOWCASE_IMG,
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
  }
};

import { syncCmsToCloud, listenToCmsFromCloud } from './firebase';

const STORAGE_KEY = 'dutauinssc_cms_v2';

function sanitizeCms(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeCms(item));
  }
  const clean = { ...obj };
  for (const k of Object.keys(clean)) {
    if (typeof clean[k] === 'string' && clean[k].includes('unsplash.com')) {
      clean[k] = k === 'img' ? (clean.caption ? OFFICIAL_SHOWCASE_IMG : '') : clean[k];
    } else if (typeof clean[k] === 'object' && clean[k] !== null) {
      clean[k] = sanitizeCms(clean[k]);
    }
  }
  return clean;
}

let isRealtimeSyncSetup = false;
function initRealtimeCmsSync() {
  if (typeof window === 'undefined' || isRealtimeSyncSetup) return;
  isRealtimeSyncSetup = true;
  try {
    listenToCmsFromCloud((cloudData) => {
      if (!cloudData || typeof cloudData !== 'object') return;
      const clean = sanitizeCms(cloudData);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
        window.dispatchEvent(new CustomEvent('cms-updated', { detail: clean }));
      } catch (e) {}
    });
  } catch (err) {
    console.warn('CMS Real-time listener init skipped:', err);
  }
}

if (typeof window !== 'undefined') {
  setTimeout(initRealtimeCmsSync, 100);
}

export const CMS = {
  get: () => {
    if (typeof window === 'undefined') return DEFAULT_CMS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { 
        let data = JSON.parse(stored);
        let hasUnsplash = stored.includes('unsplash.com');

        // Migration safeguard
        if (!data.slider || data.slider.length === 0) data.slider = DEFAULT_CMS.slider;
        if (!data.gallery || data.gallery.length === 0) data.gallery = DEFAULT_CMS.gallery;
        if (!data.promoBanners || data.promoBanners.length === 0) data.promoBanners = DEFAULT_CMS.promoBanners;
        if (!data.ambassadors || data.ambassadors.length === 0) data.ambassadors = DEFAULT_CMS.ambassadors;
        if (!data.about) data.about = DEFAULT_CMS.about;

        if (hasUnsplash) {
          data = sanitizeCms(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        return data;
      } catch(e) {}
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CMS));
    return DEFAULT_CMS;
  },

  save: (data) => {
    if (typeof window === 'undefined') return;
    const cleanData = sanitizeCms(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
    try {
      window.dispatchEvent(new CustomEvent('cms-updated', { detail: cleanData }));
      window.dispatchEvent(new Event('storage'));
    } catch(e) {}
    try {
      syncCmsToCloud(cleanData).catch(() => {});
    } catch(e) {}
  },

  subscribe: (callback) => {
    if (typeof window === 'undefined') return () => {};
    initRealtimeCmsSync();
    const handleUpdate = () => {
      callback(CMS.get());
    };
    window.addEventListener('cms-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    const handleVis = () => {
      if (!document.hidden) handleUpdate();
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => {
      window.removeEventListener('cms-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }
};
