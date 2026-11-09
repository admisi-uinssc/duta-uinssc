// Predefined finalist tokens for participants who registered in other batches
// Enables self-service registration and automatic onboarding directly into finalist status.
import { Auth } from './auth';
import { DB } from './db';
import { syncUserToCloud, syncApplicantToCloud } from './firebase';

export const FINALIST_TOKENS = [
  {
    token: 'DU-FINAL-PA01',
    namaLengkap: 'Tony S, Guiaman',
    jenisKelamin: 'Laki-laki',
    kategori: 'putra'
  },
  {
    token: 'DU-FINAL-PA02',
    namaLengkap: 'Moh Syah Nurpazria',
    jenisKelamin: 'Laki-laki',
    kategori: 'putra'
  },
  {
    token: 'DU-FINAL-PA03',
    namaLengkap: 'Achmad Hilman Zamzami',
    jenisKelamin: 'Laki-laki',
    kategori: 'putra'
  },
  {
    token: 'DU-FINAL-PI01',
    namaLengkap: "Septiani Lu'luatul Fajriyah",
    jenisKelamin: 'Perempuan',
    kategori: 'putri'
  },
  {
    token: 'DU-FINAL-PI02',
    namaLengkap: 'Azizatul Fikriyah Al Qory',
    jenisKelamin: 'Perempuan',
    kategori: 'putri'
  }
];

export function findFinalistToken(inputToken) {
  if (!inputToken || typeof inputToken !== 'string') return null;
  const clean = inputToken.trim().toUpperCase();
  return FINALIST_TOKENS.find(item => item.token.toUpperCase() === clean) || null;
}

export async function verifyAndClaimFinalistToken(inputToken, userDetails = {}) {
  if (!inputToken || typeof inputToken !== 'string') {
    return { success: false, message: 'Nomor pendaftaran tidak terdaftar pada sistem seleksi.' };
  }

  const clean = inputToken.trim().toUpperCase();
  const matched = FINALIST_TOKENS.find(item => item.token.toUpperCase() === clean);

  if (!matched) {
    return { success: false, message: 'Nomor pendaftaran tidak terdaftar pada sistem seleksi.' };
  }

  const {
    email = '',
    password = 'duta2026',
    namaLengkap = '',
    kewarganegaraan = 'Warga Negara Indonesia (WNI)',
    nim = '',
    fakultas = '',
    jurusan = '',
    semester = '4',
    tempatLahir = '',
    tanggalLahir = '',
    jenisKelamin = matched.jenisKelamin
  } = userDetails;

  // Nama lengkap wajib diambil dari input yang diisi oleh peserta (fallback ke token nama jika kosong)
  const resolvedNama = (namaLengkap && namaLengkap.trim()) ? namaLengkap.trim() : matched.namaLengkap;

  // Check if an account already exists with this token or name
  const existingUsers = Auth.getUsers();
  let user = existingUsers.find(u => 
    (u.finalistToken && u.finalistToken.toUpperCase() === clean) ||
    (email && u.email && u.email.toLowerCase() === email.trim().toLowerCase()) ||
    (u.fullName && u.fullName.trim().toUpperCase() === matched.namaLengkap.toUpperCase())
  );

  const nowIso = new Date().toISOString();
  const effectiveEmail = (email || (user && user.email) || '').trim().toLowerCase();
  const effectivePassword = password || (user && user.password) || 'duta2026';

  if (!user) {
    const cleanUsername = matched.namaLengkap.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'finalis';
    user = {
      id: 'fin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      fullName: resolvedNama,
      username: cleanUsername,
      password: effectivePassword,
      email: effectiveEmail,
      kewarganegaraan,
      nim,
      fakultas,
      jurusan,
      semester: String(semester || '4'),
      tempatLahir,
      tanggalLahir,
      jenisKelamin: jenisKelamin || matched.jenisKelamin,
      kategori: matched.kategori,
      role: 'user',
      accountStatus: 'approved',
      selectionStage: 'lolos',
      isFinalist: true,
      finalistStatus: 'finalis',
      finalistToken: matched.token,
      batchAsal: 'Batch Khusus / Susulan',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const updatedUsers = [...existingUsers, user];
    Auth.saveUsers(updatedUsers, user);
    try {
      await syncUserToCloud(user);
    } catch (e) {
      console.warn('Sync user to cloud failed:', e);
    }
  } else {
    user = {
      ...user,
      fullName: resolvedNama,
      jenisKelamin: jenisKelamin || matched.jenisKelamin,
      email: effectiveEmail || user.email || '',
      password: password || user.password || effectivePassword,
      kewarganegaraan: kewarganegaraan || user.kewarganegaraan || 'Warga Negara Indonesia (WNI)',
      nim: nim || user.nim || '',
      fakultas: fakultas || user.fakultas || '',
      jurusan: jurusan || user.jurusan || '',
      semester: String(semester || user.semester || '4'),
      tempatLahir: tempatLahir || user.tempatLahir || '',
      tanggalLahir: tanggalLahir || user.tanggalLahir || '',
      accountStatus: 'approved',
      selectionStage: 'lolos',
      isFinalist: true,
      finalistStatus: 'finalis',
      finalistToken: matched.token,
      updatedAt: nowIso
    };
    Auth.updateUser(user);
    try {
      await syncUserToCloud(user);
    } catch (e) {
      console.warn('Sync user update to cloud failed:', e);
    }
  }

  // Check or create dossier in DB
  const existingApplicants = DB.getApplicants();
  let applicant = existingApplicants.find(a => 
    (a.userId && a.userId === user.id) ||
    (effectiveEmail && a.email && a.email.toLowerCase() === effectiveEmail) ||
    (a.finalistToken && a.finalistToken.toUpperCase() === clean) ||
    (a.namaLengkap && a.namaLengkap.trim().toUpperCase() === matched.namaLengkap.toUpperCase())
  );

  if (!applicant) {
    applicant = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user.id,
      namaLengkap: resolvedNama,
      email: effectiveEmail,
      password: effectivePassword,
      kewarganegaraan: user.kewarganegaraan,
      nim: user.nim,
      fakultas: user.fakultas,
      jurusan: user.jurusan,
      prodi: user.jurusan || user.fakultas,
      semester: user.semester,
      tempatLahir: user.tempatLahir,
      tanggalLahir: user.tanggalLahir,
      jenisKelamin: user.jenisKelamin,
      kategori: matched.kategori,
      status: 'approved',
      selectionStage: 'lolos',
      isFinalist: true,
      finalistStatus: 'finalis',
      finalistToken: matched.token,
      createdAt: user.createdAt || nowIso,
      submittedAt: nowIso
    };
    const updatedApplicants = [...existingApplicants, applicant];
    DB.saveApplicants(updatedApplicants);
    try {
      await syncApplicantToCloud(applicant);
    } catch (e) {
      console.warn('Sync applicant to cloud failed:', e);
    }
  } else {
    applicant = {
      ...applicant,
      userId: user.id,
      namaLengkap: resolvedNama,
      email: effectiveEmail || applicant.email || '',
      password: password || applicant.password || effectivePassword,
      kewarganegaraan: user.kewarganegaraan || applicant.kewarganegaraan,
      nim: user.nim || applicant.nim,
      fakultas: user.fakultas || applicant.fakultas,
      jurusan: user.jurusan || applicant.jurusan,
      prodi: user.jurusan || applicant.jurusan || user.fakultas || applicant.fakultas,
      semester: user.semester || applicant.semester,
      tempatLahir: user.tempatLahir || applicant.tempatLahir,
      tanggalLahir: user.tanggalLahir || applicant.tanggalLahir,
      jenisKelamin: user.jenisKelamin || applicant.jenisKelamin,
      status: 'approved',
      selectionStage: 'lolos',
      isFinalist: true,
      finalistStatus: 'finalis',
      finalistToken: matched.token,
      updatedAt: nowIso
    };
    DB.saveApplicant(applicant);
    try {
      await syncApplicantToCloud(applicant);
    } catch (e) {
      console.warn('Sync applicant update failed:', e);
    }
  }

  // Set session login
  Auth.setCurrentUser(user);

  return {
    success: true,
    user,
    applicant,
    message: 'Registrasi berhasil. Selamat datang, ' + matched.namaLengkap + '.'
  };
}

