// Data Fakultas dan Program Studi UIN Siber Syekh Nurjati Cirebon
// Sesuai dengan fakultas.md

export const FAKULTAS_DATA = [
  {
    id: 'fitk',
    name: 'Fakultas Ilmu Tarbiyah dan Keguruan',
    shortName: 'FITK',
    jurusan: [
      'Pendidikan Agama Islam',
      'Pendidikan Bahasa Arab',
      'Tadris Bahasa Inggris',
      'Tadris Ilmu Pengetahuan Sosial',
      'Tadris Matematika',
      'Tadris Biologi',
      'Pendidikan Guru Madrasah Ibtidaiyah',
      'Pendidikan Islam Anak Usia Dini',
      'Manajemen Pendidikan Islam',
      'Tadris Bahasa Indonesia',
      'Tadris Kimia',
      'Informatika',
      'Matematika',
      'PJJ Pendidikan Agama Islam',
      'PJJ Pendidikan Bahasa Arab',
      'PJJ Pendidikan Guru Madrasah Ibtidaiyah',
    ],
    get majors() { return this.jurusan; }
  },
  {
    id: 'febi',
    name: 'Fakultas Ekonomi dan Bisnis Islam',
    shortName: 'FEBI',
    jurusan: [
      'Perbankan Syariah',
      'Ekonomi Syariah',
      'Akuntansi Syariah',
      'Pariwisata Syariah',
      'Bioteknologi',
    ],
    get majors() { return this.jurusan; }
  },
  {
    id: 'fasya',
    name: 'Fakultas Syariah',
    shortName: 'FASYA',
    jurusan: [
      'Hukum Keluarga (Akhwal Syakhsiyah)',
      'Hukum Ekonomi Syariah',
      'Hukum Tatanegara Islam',
      'Ilmu Falak',
      'PJJ Hukum Keluarga Islam',
    ],
    get majors() { return this.jurusan; }
  },
  {
    id: 'fdki',
    name: 'Fakultas Dakwah dan Komunikasi Islam',
    shortName: 'FDKI',
    jurusan: [
      'Komunikasi dan Penyiaran Islam',
      'Pengembangan Masyarakat Islam',
      'Bimbingan dan Konseling Islam',
      'Sosiologi Agama',
    ],
    get majors() { return this.jurusan; }
  },
  {
    id: 'fua',
    name: 'Fakultas Ushuluddin dan Adab',
    shortName: 'FUA',
    jurusan: [
      'Sejarah Peradaban Islam',
      'Aqidah dan Filsafat Islam',
      'Ilmu Al-Quran dan Tafsir',
      'Ilmu Hadits',
      'Bahasa dan Sastra Arab',
      'Tasawuf dan Psikoterapi',
      'PJJ Sejarah Peradaban Islam',
    ],
    get majors() { return this.jurusan; }
  },
];

export const KEWARGANEGARAAN_OPTIONS = [
  'Warga Negara Indonesia (WNI)',
  'Warga Negara Asing (WNA)',
];
