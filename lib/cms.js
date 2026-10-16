const DEFAULT_CMS = {
  slider: [
    {
      id: 1,
      img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1920&q=80',
      tag: 'Pendaftaran 2026', 
      title1: 'Wujudkan', 
      title2: 'Langkah Besarmu', 
      desc: 'Bergabunglah menjadi wajah kampus dan representasi mahasiswa UIN Siber Syekh Nurjati Cirebon.',
      btnText: 'Daftar Sekarang',
      btnLink: '/daftar'
    },
    {
      id: 2,
      img: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80',
      tag: 'Tahap Seleksi', 
      title1: 'Asah', 
      title2: 'Potensimu', 
      desc: 'Rangkaian seleksi akan menguji kemampuan komunikasi, kepemimpinan, dan nilai keislaman siber.',
      btnText: 'Lihat Persyaratan',
      btnLink: '/requirements'
    },
    {
      id: 3,
      img: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1920&q=80',
      tag: 'Komunitas & Prestasi', 
      title1: 'Bangun', 
      title2: 'Relasi Luas', 
      desc: 'Temukan keluarga baru dan koneksi berharga bersama ratusan alumni Duta Kampus.',
      btnText: 'Profil Duta',
      btnLink: '/profil-duta'
    }
  ],
  gallery: [
    { id: 1, img: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80', caption: 'Kegiatan Promosi Kampus' },
    { id: 2, img: 'https://images.unsplash.com/photo-1511629091441-ee46146481b6?auto=format&fit=crop&w=800&q=80', caption: 'Penyambutan Tamu Kehormatan' },
    { id: 3, img: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800&q=80', caption: 'Malam Puncak Pemilihan' },
    { id: 4, img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80', caption: 'Pelatihan Public Speaking' },
    { id: 5, img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80', caption: 'Event Sosial Duta Kampus' },
    { id: 6, img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80', caption: 'Sesi Pemotretan Profil' },
  ],
  promoBanners: [
    { id: 1, title: 'Buka Kesempatan Emas', subtitle: 'Pendaftaran Duta Kampus 2026', img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&h=400&q=80', link: '/daftar' },
    { id: 2, title: 'Keluarga Besar Duta Kampus', subtitle: 'Kolaborasi & Aksi Nyata', img: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1600&h=400&q=80', link: '/about' }
  ],
  ambassadors: [
    { id: 1, name: 'M. Rizki Fadhlilah', faculty: 'FITK', major: 'Tadris Bahasa Inggris', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', year: '2025' },
    { id: 2, name: 'Mitsni Uswatun Hasanah', faculty: 'FITK', major: 'Tadris Bahasa Inggris', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80', year: '2025' },
    { id: 3, name: 'Rasikin', faculty: 'Fasya', major: 'Hukum Tatanegara', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', year: '2024' },
    { id: 4, name: 'Sahla Aina Muflihah', faculty: 'FITK', major: 'Tadris Bahasa Inggris', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', year: '2024' },
    { id: 5, name: 'Yudi Prasetya', faculty: 'FEBI', major: 'Perbankan Syariah', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', year: '2024' },
    { id: 6, name: 'Berliana Nabila Az-zahra', faculty: 'FDKI', major: 'Komunikasi dan Penyiaran Islam', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80', year: '2025' },
    { id: 7, name: 'M. Irfan Maulana', faculty: 'FDKI', major: 'Pengembangan Masyarakat Islam', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', year: '2025' },
    { id: 8, name: 'Nadia Salma', faculty: 'FDKI', major: 'Komunikasi dan Penyiaran Islam', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80', year: '2025' },
    { id: 9, name: 'Agus Haerul', faculty: 'FDKI', major: 'Komunikasi dan Penyiaran Islam', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80', year: '2023' },
    { id: 10, name: 'Amelia Agustina', faculty: 'FDKI', major: 'Komunikasi dan Penyiaran Islam', img: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=80', year: '2023' },
    { id: 11, name: 'Dhiya Ghisya Aulia', faculty: 'FDKI', major: 'Bimbingan dan Konseling Islam', img: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=600&q=80', year: '2024' },
    { id: 12, name: 'Muhamad Syihabudin Anam', faculty: 'FEBI', major: 'Akuntansi Syariah', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', year: '2024' },
    { id: 13, name: 'Moja Yulia Paramita', faculty: 'FUA', major: 'Tasawuf dan Psikoterapi', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', year: '2024' },
    { id: 14, name: 'Syahdan Noer Saputra', faculty: 'Fasya', major: 'Hukum Tatanegara', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', year: '2024' },
    { id: 15, name: 'Khoridatus Shofa', faculty: 'FUA', major: 'Sejarah Peradaban Islam', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80', year: '2023' },
    { id: 16, name: 'Mardiya Ghorizadin', faculty: 'FUA', major: 'Sejarah Peradaban Islam', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80', year: '2023' },
    { id: 17, name: 'Tonisah', faculty: 'FITK', major: 'Tadris Matematika', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80', year: '2025' },
    { id: 18, name: 'M. Ade Rifki', faculty: 'FITK', major: 'Tadris Bahasa Inggris', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', year: '2025' },
    { id: 19, name: 'M. Danu Ar-Rahman', faculty: 'FASYA', major: 'Hukum Ekonomi Syariah', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', year: '2025' },
    { id: 20, name: 'Zahra Roudhotun Najah', faculty: 'FEBI', major: 'Ekonomi Syariah', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', year: '2025' }
  ]
};

const STORAGE_KEY = 'dutauinssc_cms_v2';

export const CMS = {
  get: () => {
    if (typeof window === 'undefined') return DEFAULT_CMS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { 
        const data = JSON.parse(stored); 
        // Migration safeguard
        if (!data.slider || data.slider.length === 0) data.slider = DEFAULT_CMS.slider;
        if (!data.gallery || data.gallery.length === 0) data.gallery = DEFAULT_CMS.gallery;
        if (!data.promoBanners || data.promoBanners.length === 0) data.promoBanners = DEFAULT_CMS.promoBanners;
        if (!data.ambassadors || data.ambassadors.length === 0) data.ambassadors = DEFAULT_CMS.ambassadors;
        return data;
      } catch(e) {}
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CMS));
    return DEFAULT_CMS;
  },

  save: (data) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    try {
      window.dispatchEvent(new CustomEvent('cms-updated', { detail: data }));
      window.dispatchEvent(new Event('storage'));
    } catch(e) {}
  },

  subscribe: (callback) => {
    if (typeof window === 'undefined') return () => {};
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
