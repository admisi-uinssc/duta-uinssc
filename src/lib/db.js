import { syncApplicantToCloud, deleteApplicantFromCloud } from './firebase';

const DB_KEY = 'dutauinssc_pendaftar';

export const DB = {
  getAll: () => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(DB_KEY);
      const list = data ? JSON.parse(data) : [];
      // Intelligent deduplication by email / NIM
      const map = new Map();
      for (const item of list) {
        if (!item) continue;
        const key = (item.email || item.nim || String(item.id)).trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, item);
        } else {
          // Merge preserving existing data
          map.set(key, { ...map.get(key), ...item });
        }
      }
      return Array.from(map.values());
    } catch {
      return [];
    }
  },
  getById: (id) => {
    return DB.getAll().find(i => String(i.id) === String(id)) || null;
  },
  save: (data, specificItemToSync = null) => {
    if (typeof window !== 'undefined') {
      const list = Array.isArray(data) ? data : [];
      // Deduplicate before saving
      const map = new Map();
      for (const item of list) {
        if (!item) continue;
        const key = (item.email || item.nim || String(item.id)).trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, item);
        } else {
          map.set(key, { ...map.get(key), ...item });
        }
      }
      const deduped = Array.from(map.values());
      localStorage.setItem(DB_KEY, JSON.stringify(deduped));
      window.dispatchEvent(new Event('storage'));

      // Async sync to Firebase Firestore: target only modified dossier to prevent quota exhaustion
      if (specificItemToSync) {
        syncApplicantToCloud(specificItemToSync);
      } else {
        deduped.forEach(item => syncApplicantToCloud(item));
      }
    }
  },
  add: (item) => {
    const all = DB.getAll();
    const newItem = { ...item, id: item.id || Date.now(), createdAt: item.createdAt || new Date().toISOString() };
    all.unshift(newItem);
    DB.save(all, newItem);
    return newItem;
  },
  insert: (item) => {
    return DB.add(item);
  },
  updateStatus: (id, status) => {
    const all = DB.getAll();
    const idx = all.findIndex(i => String(i.id) === String(id));
    if (idx !== -1) {
      all[idx].status = status;
      all[idx].updatedAt = new Date().toISOString();
      DB.save(all);
    }
  },
  delete: (id) => {
    const all = DB.getAll();
    const filtered = all.filter(i => String(i.id) !== String(id));
    DB.save(filtered);
    deleteApplicantFromCloud(id);
  },
  clearAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DB_KEY, JSON.stringify([]));
      window.dispatchEvent(new Event('storage'));
    }
  },
  subscribe: (callback) => {
    if (typeof window === 'undefined') return () => { };
    const handleUpdate = () => {
      callback(DB.getAll());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    const handleVis = () => {
      if (!document.hidden) handleUpdate();
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }
};

export function seedDemoData(force = false) {
  if (typeof window === 'undefined') return;
  // Jangan pernah seed otomatis jika tidak dipaksa oleh aksi pengguna
  if (!force) return;

  const demo = [
    {
      id: 1718000000001,
      namaLengkap: 'Rizki Pratama Putra',
      nim: '2308103012',
      fakultas: 'Fakultas Ilmu Tarbiyah dan Keguruan (FITK)',
      jurusan: 'Tadris Bahasa Inggris',
      prodi: 'Tadris Bahasa Inggris',
      semester: '4',
      jenisKelamin: 'Laki-laki',
      ttl: 'Cirebon, 14 Mei 2004',
      noHp: '081234567890',
      email: 'rizki@uinssc.ac.id',
      alamat: 'Jl. Kesambi No. 45, Kota Cirebon',
      ipk: '3.82',
      prestasi: 'Juara 1 Lomba Debat Bahasa Inggris Tingkat Universitas 2025',
      organisasi: 'HMPS Tadris Bahasa Inggris, Lembaga Pers Mahasiswa',
      motivasi: 'Saya bertekad menjadi representasi mahasiswa UIN Siber Syekh Nurjati Cirebon yang berkarakter, berwawasan keislaman siber, dan mampu mengharumkan nama almamater di kancah nasional maupun internasional.',
      status: 'diterima',
      selectionStage: 'lolos',
      selectionMessage: 'Selamat! Anda dinyatakan lolos seleksi berkas administrasi Duta Kampus UIN Siber Syekh Nurjati Cirebon 2026. Persiapkan diri Anda untuk tahapan wawancara dan uji bakat.',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 1718000000002,
      namaLengkap: 'Anisa Rahmawati',
      nim: '2308201015',
      fakultas: 'Fakultas Dakwah dan Komunikasi Islam (FDKI)',
      jurusan: 'Komunikasi dan Penyiaran Islam',
      prodi: 'Komunikasi dan Penyiaran Islam',
      semester: '4',
      jenisKelamin: 'Perempuan',
      ttl: 'Indramayu, 12 Januari 2005',
      noHp: '082198765432',
      email: 'anisa.rahma@student.uinssc.ac.id',
      alamat: 'Jl. Pemuda No. 12, Cirebon',
      ipk: '3.88',
      prestasi: 'Finalis Festival Da\'i Muda Nasional 2024',
      organisasi: 'Protokoler Mahasiswa Kampus',
      motivasi: 'Ingin mengabdi aktif mengenalkan transformasi siber UIN SSC kepada generasi muda melalui media digital dan kegiatan edukatif.',
      status: 'pending',
      selectionStage: 'review',
      selectionMessage: '',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 1718000000003,
      namaLengkap: 'Fauzi Ahmad Syarif',
      nim: '2308302008',
      fakultas: 'Fakultas Ekonomi dan Bisnis Islam (FEBI)',
      jurusan: 'Perbankan Syariah',
      prodi: 'Perbankan Syariah',
      semester: '6',
      jenisKelamin: 'Laki-laki',
      ttl: 'Kuningan, 22 September 2003',
      noHp: '085712349876',
      email: 'fauzi.syarif@student.uinssc.ac.id',
      alamat: 'Jl. Perjuangan No. 8, Cirebon',
      ipk: '3.65',
      prestasi: 'Juara 2 Business Plan Competition FEBI 2024',
      organisasi: 'KSEI FoSSEI Cirebon',
      motivasi: 'Berkomitmen menjadi teladan mahasiswa yang menjunjung etika ekonomi syariah dan kepemimpinan adaptif di era digital.',
      status: 'pending',
      selectionStage: 'review',
      selectionMessage: '',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 1718000000004,
      namaLengkap: 'Nadia Safitri',
      nim: '2308401020',
      fakultas: 'Fakultas Syariah (Fasya)',
      jurusan: 'Hukum Keluarga Islam',
      prodi: 'Hukum Keluarga Islam',
      semester: '2',
      jenisKelamin: 'Perempuan',
      ttl: 'Majalengka, 5 Mei 2005',
      noHp: '087811223344',
      email: 'nadia.safitri@student.uinssc.ac.id',
      alamat: 'Jl. Sunan Gunung Jati No. 88, Cirebon',
      ipk: '3.45',
      prestasi: 'Peserta Lomba Karya Tulis Ilmiah Tingkat Wilayah',
      organisasi: 'Lembaga Kajian Hukum Mahasiswa',
      motivasi: 'Menjadi representasi duta yang berintegritas tinggi serta mengedukasi mahasiswa mengenai kesadaran hukum dan keadilan sosial.',
      status: 'ditolak',
      selectionStage: 'tidak_lolos',
      selectionMessage: 'Terima kasih telah berpartisipasi. Mohon maaf berkas Anda belum memenuhi kualifikasi seleksi periode ini. Tetap semangat berkarya!',
      createdAt: new Date().toISOString()
    }
  ];

  localStorage.setItem(DB_KEY, JSON.stringify(demo));
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
