// Helper untuk validasi kelengkapan dokumen persyaratan Duta Kampus UIN Siber Syekh Nurjati Cirebon
// Sesuai dokumen resmi Pemilihan Duta Kampus 2026

export const DOSSIER_DOCUMENTS = [
  {
    id: 'suratPernyataan',
    key: 'docSuratPernyataan',
    label: 'Surat Pernyataan Mengikuti Seluruh Peraturan',
    sublabel: 'Surat pernyataan bermaterai bersedia mematuhi seluruh peraturan pemilihan.',
    required: true,
    fileTypes: '.pdf',
    formatLabel: 'PDF',
    category: 'Administrasi'
  },
  {
    id: 'cv',
    key: 'docCv',
    label: 'Curriculum Vitae (CV)',
    sublabel: 'CV memuat data pribadi, pendidikan, dan riwayat pengalaman.',
    required: true,
    fileTypes: '.pdf',
    formatLabel: 'PDF',
    category: 'Administrasi'
  },
  {
    id: 'suratRekomendasi',
    key: 'docSuratRekomendasi',
    label: 'Surat Rekomendasi Resmi',
    sublabel: 'Surat rekomendasi resmi dari HMPS, Jurusan, atau Fakultas.',
    required: true,
    fileTypes: '.pdf',
    formatLabel: 'PDF',
    category: 'Administrasi'
  },
  {
    id: 'sertifikatPrestasi',
    key: 'docSertifikatPrestasi',
    label: 'Sertifikat Prestasi Akademik / Non-Akademik',
    sublabel: 'Sertifikat prestasi atau kejuaraan 3 tahun terakhir (opsional).',
    required: false,
    fileTypes: '.pdf,.zip,.rar',
    formatLabel: 'PDF / ZIP (Opsional)',
    category: 'Pendukung'
  },
  {
    id: 'fotoLengkap',
    key: 'docFotoLengkap',
    label: 'Paket Pas Foto Formal Mahasiswa',
    sublabel: 'Foto full badan, setengah badan, dan pas foto 3x4 (jas almamater).',
    required: true,
    fileTypes: '.jpg,.jpeg,.png,.zip',
    formatLabel: 'JPG / PNG / ZIP',
    category: 'Visual'
  },
  {
    id: 'motivationLetter',
    key: 'docMotivationLetter',
    label: 'Motivation Letter',
    sublabel: 'Esai motivasi, kontribusi promosi kampus, serta visi misi.',
    required: true,
    fileTypes: '.pdf',
    formatLabel: 'PDF',
    category: 'Esai'
  },
  {
    id: 'buktiFollow',
    key: 'docBuktiFollow',
    label: 'Bukti Follow Media Sosial Resmi',
    sublabel: 'Screenshot follow IG @duta_uinssc, @admisi.uinssc, & @uinsscofficial.',
    required: true,
    fileTypes: '.pdf,.jpg,.jpeg,.png',
    formatLabel: 'PDF / JPG / PNG',
    category: 'Administrasi'
  },
  {
    id: 'ktm',
    key: 'docKtm',
    label: 'Kartu Tanda Mahasiswa (KTM)',
    sublabel: 'Scan KTM aktif atau surat keterangan mahasiswa aktif.',
    required: true,
    fileTypes: '.pdf,.jpg,.jpeg,.png',
    formatLabel: 'PDF / JPG / PNG',
    category: 'Akademik'
  },
  {
    id: 'transkripNilai',
    key: 'docTranskripNilai',
    label: 'Transkrip Nilai / KHS Kumulatif',
    sublabel: 'Transkrip nilai atau KHS resmi semester terakhir.',
    required: true,
    fileTypes: '.pdf',
    formatLabel: 'PDF',
    category: 'Akademik'
  },
  {
    id: 'buktiDiterima',
    key: 'docBuktiDiterima',
    label: 'Bukti Diterima di UINSSC',
    sublabel: 'Bukti kelulusan / registrasi mahasiswa baru (khusus semester 1).',
    required: false,
    conditionalNote: 'Khusus Semester 1',
    fileTypes: '.pdf',
    formatLabel: 'PDF (Khusus Sem 1)',
    category: 'Akademik'
  }
];

export const DOSSIER_FIELDS = DOSSIER_DOCUMENTS.map(doc => ({
  key: doc.key,
  label: doc.label,
  sublabel: doc.sublabel,
  required: doc.required,
  formatLabel: doc.formatLabel,
  category: doc.category,
  conditionalNote: doc.conditionalNote || null
}));

export function evaluateDossierCompleteness(applicant) {
  if (!applicant) {
    return {
      isComplete: false,
      isStarted: false,
      percent: 0,
      filledCount: 0,
      totalCount: DOSSIER_DOCUMENTS.length,
      requiredCount: DOSSIER_DOCUMENTS.filter(d => d.required).length,
      missingFields: DOSSIER_DOCUMENTS.filter(d => d.required).map(d => d.label),
      checklist: DOSSIER_DOCUMENTS.map(d => ({ ...d, filled: false, value: '' })),
      statusLabel: 'Belum Mengisi',
      badgeClass: 'badge-muted',
      color: '#64748b',
      bg: '#f1f5f9',
      border: '#cbd5e1'
    };
  }

  const isSemester1 = String(applicant.semester || '').trim() === '1';

  const checklist = DOSSIER_DOCUMENTS.map(doc => {
    // Cek apakah dokumen ini benar-benar diunggah via berkas / dokumen URL
    const rawVal = applicant[doc.key] || (applicant.berkas && applicant.berkas[doc.key]);
    
    let isFilled = false;
    let displayVal = '';

    if (rawVal) {
      if (typeof rawVal === 'object') {
        isFilled = Boolean(rawVal.url || rawVal.name || rawVal.driveLink || rawVal.driveId);
        displayVal = rawVal.name || rawVal.url || 'Berkas Terlampir';
      } else if (typeof rawVal === 'string') {
        const str = rawVal.trim();
        isFilled = Boolean(str && str !== '-' && str !== '—' && str !== 'null' && str !== 'undefined');
        displayVal = str;
      }
    }

    return {
      ...doc,
      filled: isFilled,
      value: displayVal
    };
  });

  const filledCount = checklist.filter(c => c.filled).length;
  
  // Hitung dokumen wajib yang relevan (jika semester 1, bukti diterima juga dinilai)
  const mandatoryDocs = checklist.filter(c => {
    if (c.required) return true;
    if (c.id === 'buktiDiterima' && isSemester1) return true;
    return false;
  });

  const missingRequired = mandatoryDocs.filter(c => !c.filled).map(c => c.label);
  const requiredCount = mandatoryDocs.length;
  const filledRequiredCount = mandatoryDocs.filter(c => c.filled).length;

  const percent = Math.round((filledCount / DOSSIER_DOCUMENTS.length) * 100);
  const isComplete = filledRequiredCount === requiredCount && requiredCount > 0;
  const isStarted = filledCount > 0;

  let statusLabel = 'Belum Ada Berkas';
  let badgeClass = 'badge-muted';
  let color = '#64748b';
  let bg = '#f1f5f9';
  let border = '#cbd5e1';

  if (isComplete) {
    statusLabel = 'Dokumen Lengkap';
    badgeClass = 'badge-success';
    color = '#15803d';
    bg = '#dcfce7';
    border = '#86efac';
  } else if (isStarted) {
    statusLabel = `Draf (${filledCount}/${DOSSIER_DOCUMENTS.length})`;
    badgeClass = 'badge-warning';
    color = '#a16207';
    bg = '#fef9c3';
    border = '#fde047';
  }

  return {
    isComplete,
    isStarted,
    percent,
    filledCount,
    totalCount: DOSSIER_DOCUMENTS.length,
    requiredCount,
    filledRequiredCount,
    missingFields: missingRequired,
    checklist,
    statusLabel,
    badgeClass,
    color,
    bg,
    border
  };
}

export const DEFAULT_MESSAGES = {
  lolos: 'Selamat! Berkas pendaftaran dan dokumen persyaratan Anda telah diverifikasi oleh Panitia Seleksi Duta Kampus UIN Siber Syekh Nurjati Cirebon 2026 dan dinyatakan LOLOS seleksi administrasi berkas. Silakan persiapkan diri untuk tahapan Technical Meeting dan Seleksi Tahap 1.',
  tidak_lolos: 'Terima kasih atas partisipasi dan dedikasi Anda. Berdasarkan hasil verifikasi berkas administrasi oleh Panitia Seleksi Duta Kampus UIN SSC 2026, berkas Anda dinyatakan BELUM MEMENUHI syarat kelulusan seleksi administrasi berkas pada periode ini.',
  review: 'Berkas dan dokumen persyaratan Anda saat ini sedang dalam proses peninjauan dan verifikasi faktual oleh Panitia Seleksi Duta Kampus UIN SSC 2026. Pantau secara berkala status pengumuman di portal ini.'
};
