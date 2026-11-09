// Predefined finalist tokens for participants who registered in other batches
// Enables self-service registration and automatic onboarding directly into finalist status.
import { Auth } from './auth';
import { DB } from './db';
import { syncUserToCloud, syncApplicantToCloud } from './firebase';

export const FINALIST_TOKENS = [
  {
    token: 'DU-FINAL-PA01',
    namaLengkap: 'MOH SYAH NURPAZRIA',
    jenisKelamin: 'Laki-laki',
    kategori: 'putra',
    email: 'moh.syah@uinssc.ac.id'
  },
  {
    token: 'DU-FINAL-PA02',
    namaLengkap: 'TONY S. GUIAMAN',
    jenisKelamin: 'Laki-laki',
    kategori: 'putra',
    email: 'tony.guiaman@uinssc.ac.id'
  },
  {
    token: 'DU-FINAL-PI01',
    namaLengkap: "SEPTIANI LU'LUATUL FAJRIYAH",
    jenisKelamin: 'Perempuan',
    kategori: 'putri',
    email: 'septiani.luluatul@uinssc.ac.id'
  },
  {
    token: 'DU-FINAL-PI02',
    namaLengkap: 'DUROTUNNAFISAH',
    jenisKelamin: 'Perempuan',
    kategori: 'putri',
    email: 'durotunnafisah@uinssc.ac.id'
  },
  {
    token: 'DU-FINAL-PI03',
    namaLengkap: 'AZIZATUL FIKRIYAH AL QORY',
    jenisKelamin: 'Perempuan',
    kategori: 'putri',
    email: 'azizatul.fikriyah@uinssc.ac.id'
  },
  {
    token: 'DU-FINAL-PI04',
    namaLengkap: 'SAKIA MUSDALIFAH',
    jenisKelamin: 'Perempuan',
    kategori: 'putri',
    email: 'sakia.musdalifah@uinssc.ac.id'
  }
];

export async function verifyAndClaimFinalistToken(inputToken) {
  if (!inputToken || typeof inputToken !== 'string') {
    return { success: false, message: 'Nomor pendaftaran tidak terdaftar pada sistem seleksi.' };
  }

  const clean = inputToken.trim().toUpperCase();
  const matched = FINALIST_TOKENS.find(item => item.token.toUpperCase() === clean);

  if (!matched) {
    return { success: false, message: 'Nomor pendaftaran tidak terdaftar pada sistem seleksi.' };
  }

  // Check if an account already exists with this token or email or name
  const existingUsers = Auth.getUsers();
  let user = existingUsers.find(u => 
    (u.finalistToken && u.finalistToken.toUpperCase() === clean) ||
    (u.email && u.email.toLowerCase() === matched.email.toLowerCase()) ||
    (u.fullName && u.fullName.trim().toUpperCase() === matched.namaLengkap.toUpperCase())
  );

  const nowIso = new Date().toISOString();

  if (!user) {
    // Generate new participant account
    const cleanUsername = matched.namaLengkap.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'finalis';
    user = {
      id: 'fin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      fullName: matched.namaLengkap,
      username: cleanUsername,
      password: 'duta2026', // Password awal default yang bisa diubah oleh peserta di profil
      email: matched.email,
      jenisKelamin: matched.jenisKelamin,
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

    // Save to users list
    const updatedUsers = [...existingUsers, user];
    Auth.saveUsers(updatedUsers, user);
    try {
      await syncUserToCloud(user);
    } catch (e) {
      console.warn('Sync user to cloud failed:', e);
    }
  } else {
    // Ensure finalist flags are set
    user = {
      ...user,
      fullName: matched.namaLengkap,
      jenisKelamin: matched.jenisKelamin,
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
    (a.email && a.email.toLowerCase() === matched.email.toLowerCase()) ||
    (a.namaLengkap && a.namaLengkap.trim().toUpperCase() === matched.namaLengkap.toUpperCase())
  );

  if (!applicant) {
    applicant = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: user.id,
      namaLengkap: matched.namaLengkap,
      email: matched.email,
      jenisKelamin: matched.jenisKelamin,
      kategori: matched.kategori,
      status: 'approved',
      selectionStage: 'lolos',
      isFinalist: true,
      finalistStatus: 'finalis',
      finalistToken: matched.token,
      createdAt: nowIso,
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
      namaLengkap: matched.namaLengkap,
      jenisKelamin: matched.jenisKelamin,
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
    message: 'Verifikasi berhasil. Selamat datang, ' + matched.namaLengkap + '.'
  };
}

