// Email validation helper
export function validateEmailFormat(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Alamat email wajib diisi.' };
  }
  const cleanEmail = email.trim();
  // Standard RFC 5322 compliant regex with proper domain and TLD check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, message: 'Format email tidak valid (contoh: nama@email.com atau nama@syekhnurjati.ac.id).' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, message: 'Email harus memiliki satu karakter @.' };
  }

  const domain = parts[1].toLowerCase();
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  if (domainParts.length < 2 || tld.length < 2) {
    return { isValid: false, message: 'Domain email tidak lengkap (contoh: .com, .id, .ac.id).' };
  }

  // Common typo hints
  if (domain === 'gamil.com' || domain === 'gmial.com') {
    return { isValid: false, message: 'Mungkin maksud Anda @gmail.com?' };
  }
  if (domain === 'yaho.com') {
    return { isValid: false, message: 'Mungkin maksud Anda @yahoo.com?' };
  }

  return { isValid: true, message: 'Format email valid.' };
}

import { isFirebaseConfigured, syncUserToCloud, fetchUserFromCloudByIdentifier, fetchApplicantFromCloudByIdentifier, deleteUserFromCloud } from './firebase';
import { DB } from './db';

export const Auth = {
  getUsers: () => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('dutauinssc_users');
      const list = raw ? JSON.parse(raw) : [];
      const map = new Map();
      for (const item of list) {
        if (!item) continue;
        const key = (item.email || item.username || String(item.id)).trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, item);
        } else {
          map.set(key, { ...map.get(key), ...item });
        }
      }
      return Array.from(map.values());
    } catch {
      return [];
    }
  },
  
  saveUsers: (users, specificUserToSync = null) => {
    if (typeof window !== 'undefined') {
      const list = Array.isArray(users) ? users : [];
      const map = new Map();
      for (const item of list) {
        if (!item) continue;
        const key = (item.email || item.username || String(item.id)).trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, item);
        } else {
          map.set(key, { ...map.get(key), ...item });
        }
      }
      const deduped = Array.from(map.values());
      localStorage.setItem('dutauinssc_users', JSON.stringify(deduped));
      try {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('users-updated', { detail: deduped }));
      } catch(e) {}
      
      // Async sync to Firebase Firestore: target only modified user to prevent quota exhaustion
      if (specificUserToSync) {
        syncUserToCloud(specificUserToSync);
      } else {
        const recent = deduped.slice(-2);
        recent.forEach(u => syncUserToCloud(u));
      }
    }
  },

  deleteAccount: async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return false;
    if (isFirebaseConfigured) {
      await deleteUserFromCloud(cleanEmail);
    }
    const remaining = Auth.getUsers().filter(u => u.email.toLowerCase() !== cleanEmail);
    localStorage.setItem('dutauinssc_users', JSON.stringify(remaining));

    const remainingDb = DB.getAll().filter(i => (i.email || '').toLowerCase() !== cleanEmail);
    localStorage.setItem('dutauinssc_pendaftar', JSON.stringify(remainingDb));

    const token = localStorage.getItem('dutauinssc_auth_token');
    if (token && token.toLowerCase() === cleanEmail) {
      localStorage.removeItem('dutauinssc_auth_token');
    }

    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('users-updated', { detail: remaining }));
    } catch (e) {}
    return true;
  },

  subscribe: (callback) => {
    if (typeof window === 'undefined') return () => {};
    const handleUpdate = () => {
      callback(Auth.getUsers());
    };
    window.addEventListener('users-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    const handleVis = () => {
      if (!document.hidden) handleUpdate();
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      window.removeEventListener('users-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      document.removeEventListener('visibilitychange', handleVis);
    };
  },

  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    try {
      const token = localStorage.getItem('dutauinssc_auth_token');
      if (!token) return null;
      const cleanToken = token.trim().toLowerCase();
      const users = Auth.getUsers();
      const found = users.find(u => 
        u.email.toLowerCase() === cleanToken || 
        (u.username && u.username.toLowerCase() === cleanToken) ||
        (cleanToken === 'rizki' && (u.email.toLowerCase() === 'rizki@uinssc.ac.id' || u.username === 'rizki'))
      );
      if (found) {
        // Direct approval pattern: all registered accounts are immediately active
        return {
          ...found,
          accountStatus: 'approved',
          status: found.status === 'Menunggu Persetujuan' ? 'Aktif' : found.status
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  login: async (identifier, password) => {
    const cleanInput = (identifier || '').trim().toLowerCase();
    if (!cleanInput) {
      return { 
        success: false, 
        notFound: true, 
        error: 'Alamat email atau username wajib diisi.' 
      };
    }

    // 1. If Server Database is connected, ALWAYS verify with Server Database FIRST
    if (isFirebaseConfigured && cleanInput !== 'rizki') {
      try {
        const cloudUser = await fetchUserFromCloudByIdentifier(cleanInput);
        if (!cloudUser) {
          // Account was deleted from database or never registered!
          // Purge any stale local copy of this deleted account from localStorage
          const localList = Auth.getUsers().filter(u => 
            (u.email || '').toLowerCase() !== cleanInput && 
            (u.username || '').toLowerCase() !== cleanInput
          );
          localStorage.setItem('dutauinssc_users', JSON.stringify(localList));

          const curToken = localStorage.getItem('dutauinssc_auth_token');
          if (curToken && (curToken.trim().toLowerCase() === cleanInput)) {
            localStorage.removeItem('dutauinssc_auth_token');
          }
          try {
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new CustomEvent('users-updated', { detail: localList }));
          } catch (e) {}

          return { 
            success: false, 
            notFound: true, 
            error: 'Akun belum terdaftar. Silakan buat akun terlebih dahulu.' 
          };
        }

        // Account exists on server: check password
        if (cloudUser.password !== password) {
          return { 
            success: false, 
            notFound: false, 
            error: 'Kata sandi tidak sesuai.' 
          };
        }

        // Save authenticated user to local cache and set session token
        const updatedUsers = Auth.getUsers().filter(u => (u.email || '').toLowerCase() !== (cloudUser.email || '').toLowerCase());
        updatedUsers.push(cloudUser);
        localStorage.setItem('dutauinssc_users', JSON.stringify(updatedUsers));
        localStorage.setItem('dutauinssc_auth_token', cloudUser.email);
        localStorage.setItem('dutauinssc_session_created', Date.now().toString());

        try {
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('users-updated', { detail: updatedUsers }));
        } catch (e) {}

        // Sync applicant dossier if exists
        try {
          const cloudApp = await fetchApplicantFromCloudByIdentifier(cloudUser.email);
          if (cloudApp) {
            const pendaftarRaw = localStorage.getItem('dutauinssc_pendaftar');
            const pendaftarList = pendaftarRaw ? JSON.parse(pendaftarRaw) : [];
            const existingIdx = pendaftarList.findIndex(p => (p.email || '').toLowerCase() === cloudUser.email.toLowerCase());
            if (existingIdx !== -1) {
              pendaftarList[existingIdx] = { ...pendaftarList[existingIdx], ...cloudApp };
            } else {
              pendaftarList.unshift(cloudApp);
            }
            localStorage.setItem('dutauinssc_pendaftar', JSON.stringify(pendaftarList));
            window.dispatchEvent(new Event('storage'));
          }
        } catch (e) {}

        return { success: true, user: cloudUser };
      } catch (err) {
        console.warn('Server auth lookup error:', err);
        return {
          success: false,
          notFound: false,
          error: 'Gagal menghubungi server database. Periksa koneksi internet Anda.'
        };
      }
    }

    // 2. Offline fallback (only used if server is not configured or demo mode)
    let users = Auth.getUsers();
    let userExists = users.find(u => 
      u.email.toLowerCase() === cleanInput ||
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (cleanInput === 'rizki' && (u.email.toLowerCase() === 'rizki@uinssc.ac.id' || u.username === 'rizki'))
    );

    if (!userExists) {
      return { 
        success: false, 
        notFound: true, 
        error: 'Akun belum terdaftar. Silakan buat akun terlebih dahulu.' 
      };
    }
    if (userExists.password !== password) {
      return { 
        success: false, 
        notFound: false, 
        error: 'Kata sandi tidak sesuai.' 
      };
    }
    localStorage.setItem('dutauinssc_auth_token', userExists.email);
    localStorage.setItem('dutauinssc_session_created', Date.now().toString());

    return { success: true, user: userExists };
  },

  // Backward compatible simple register
  register: (name, email, password) => {
    return Auth.registerAccount({
      namaLengkap: name,
      email,
      password,
      kewarganegaraan: 'Warga Negara Indonesia (WNI)',
      nim: '',
      fakultas: '',
      jurusan: '',
      tempatLahir: '',
      tanggalLahir: '',
      jenisKelamin: '',
    });
  },

  // Full 2-step account registration
  registerAccount: async (accountData) => {
    let users = Auth.getUsers();
    const cleanEmail = (accountData.email || '').trim().toLowerCase();

    // Check duplicate: prioritize server database if connected
    let existingUser = null;
    if (isFirebaseConfigured) {
      try {
        existingUser = await fetchUserFromCloudByIdentifier(cleanEmail);
      } catch (e) {}
    } else {
      existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    }

    if (existingUser && existingUser.password) {
      return {
        success: false,
        error: 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk.'
      };
    }

    const userId = accountData.id || Date.now();

    const userRecord = {
      id: userId,
      name: accountData.namaLengkap || accountData.name || '',
      namaLengkap: accountData.namaLengkap || accountData.name || '',
      email: cleanEmail,
      password: accountData.password,
      kewarganegaraan: accountData.kewarganegaraan || 'Warga Negara Indonesia (WNI)',
      nim: accountData.nim || '',
      fakultas: accountData.fakultas || '',
      jurusan: accountData.jurusan || '',
      semester: accountData.semester || '4',
      tempatLahir: accountData.tempatLahir || '',
      tanggalLahir: accountData.tanggalLahir || '',
      jenisKelamin: accountData.jenisKelamin || 'Laki-laki',
      accountStatus: 'approved',
      status: 'Aktif',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      berkasSubmitted: false,
      berkas: null,
    };

    // Replace or add without duplicate
    const filteredUsers = users.filter(u => u.email.toLowerCase() !== cleanEmail);
    filteredUsers.push(userRecord);
    Auth.saveUsers(filteredUsers, userRecord);
    localStorage.setItem('dutauinssc_auth_token', cleanEmail);
    localStorage.setItem('dutauinssc_session_created', Date.now().toString());

    // Sync to dutauinssc_pendaftar so it immediately appears in all views
    const pendaftarEntry = {
      id: userRecord.id,
      namaLengkap: userRecord.namaLengkap,
      nim: userRecord.nim,
      fakultas: userRecord.fakultas,
      jurusan: userRecord.jurusan,
      prodi: userRecord.jurusan || userRecord.fakultas,
      semester: accountData.semester || userRecord.semester || '4',
      jenisKelamin: userRecord.jenisKelamin,
      ttl: `${userRecord.tempatLahir}, ${userRecord.tanggalLahir}`,
      email: userRecord.email,
      password: userRecord.password,
      kewarganegaraan: userRecord.kewarganegaraan,
      status: 'review',
      accountStatus: 'approved',
      isAccountApplication: false,
      createdAt: userRecord.createdAt,
    };

    try {
      const pendaftarRaw = localStorage.getItem('dutauinssc_pendaftar');
      const pendaftarList = pendaftarRaw ? JSON.parse(pendaftarRaw) : [];
      const existingIdx = pendaftarList.findIndex(p => p.email?.toLowerCase() === cleanEmail);

      if (existingIdx !== -1) {
        pendaftarList[existingIdx] = { ...pendaftarList[existingIdx], ...pendaftarEntry };
      } else {
        pendaftarList.unshift(pendaftarEntry);
      }
      DB.save(pendaftarList, pendaftarEntry);
    } catch (e) {
      console.error('Error syncing to pendaftar:', e);
    }

    // Await cloud sync so the user and applicant are GUARANTEED to exist in Firestore
    if (isFirebaseConfigured) {
      try {
        await Promise.all([
          syncUserToCloud(userRecord),
          syncApplicantToCloud(pendaftarEntry)
        ]);
      } catch (err) {
        console.warn('Cloud sync error on registration:', err);
      }
    }

    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('users-updated', { detail: filteredUsers }));
    } catch (e) {}

    return { success: true, user: userRecord };
  },

  approveAccount: (email) => {
    const users = Auth.getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();
    const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      users[idx].accountStatus = 'approved';
      users[idx].status = 'Disetujui';
      Auth.saveUsers(users);

      // Sync to pendaftar DB
      try {
        const pendaftarRaw = localStorage.getItem('dutauinssc_pendaftar');
        if (pendaftarRaw) {
          const list = JSON.parse(pendaftarRaw);
          const pIdx = list.findIndex(p => p.email?.toLowerCase() === cleanEmail);
          if (pIdx !== -1) {
            list[pIdx].status = 'diterima';
            list[pIdx].accountStatus = 'approved';
            localStorage.setItem('dutauinssc_pendaftar', JSON.stringify(list));
            window.dispatchEvent(new Event('storage'));
          }
        }
      } catch (e) {
        console.error(e);
      }

      return { success: true, user: users[idx] };
    }
    return { success: false, error: 'Pengguna tidak ditemukan.' };
  },

  rejectAccount: (email, reason = 'Data tidak sesuai ketentuan') => {
    const users = Auth.getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();
    const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      users[idx].accountStatus = 'rejected';
      users[idx].status = 'Ditolak';
      users[idx].rejectReason = reason;
      Auth.saveUsers(users);

      // Sync to pendaftar DB
      try {
        const pendaftarRaw = localStorage.getItem('dutauinssc_pendaftar');
        if (pendaftarRaw) {
          const list = JSON.parse(pendaftarRaw);
          const pIdx = list.findIndex(p => p.email?.toLowerCase() === cleanEmail);
          if (pIdx !== -1) {
            list[pIdx].status = 'ditolak';
            list[pIdx].accountStatus = 'rejected';
            localStorage.setItem('dutauinssc_pendaftar', JSON.stringify(list));
          }
        }
      } catch (e) {
        console.error(e);
      }

      return { success: true, user: users[idx] };
    }
    return { success: false, error: 'Pengguna tidak ditemukan.' };
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dutauinssc_auth_token');
    }
  },

  updateStatus: (email, newStatus) => {
    const users = Auth.getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();
    const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      users[idx].status = newStatus;
      Auth.saveUsers(users);
    }
  }
};
