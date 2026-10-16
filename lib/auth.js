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

export const Auth = {
  getUsers: () => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('dutauinssc_users');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  
  saveUsers: (users) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dutauinssc_users', JSON.stringify(users));
      try {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('users-updated', { detail: users }));
      } catch(e) {}
    }
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
      return users.find(u => 
        u.email.toLowerCase() === cleanToken || 
        (u.username && u.username.toLowerCase() === cleanToken) ||
        (cleanToken === 'rizki' && (u.email.toLowerCase() === 'rizki@uinssc.ac.id' || u.username === 'rizki'))
      ) || null;
    } catch {
      return null;
    }
  },

  login: (identifier, password) => {
    const users = Auth.getUsers();
    const cleanInput = (identifier || '').trim().toLowerCase();
    
    // Support login by email, username, or 'rizki'
    const userExists = users.find(u => 
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
  registerAccount: (accountData) => {
    const users = Auth.getUsers();
    const cleanEmail = (accountData.email || '').trim().toLowerCase();

    // Check duplicate
    if (users.find(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Email ini sudah terdaftar di sistem. Silakan masuk.' };
    }

    const newUser = {
      id: Date.now(),
      name: accountData.namaLengkap || accountData.name || '',
      namaLengkap: accountData.namaLengkap || accountData.name || '',
      email: cleanEmail,
      password: accountData.password,
      kewarganegaraan: accountData.kewarganegaraan || 'Warga Negara Indonesia (WNI)',
      nim: accountData.nim || '',
      fakultas: accountData.fakultas || '',
      jurusan: accountData.jurusan || '',
      tempatLahir: accountData.tempatLahir || '',
      tanggalLahir: accountData.tanggalLahir || '',
      jenisKelamin: accountData.jenisKelamin || 'Laki-laki',
      
      // Status Akun: 'pending' (menunggu persetujuan) atau 'approved'
      accountStatus: 'pending',
      status: 'Menunggu Persetujuan',
      createdAt: new Date().toISOString(),
      
      // Berkas pendaftaran (diisi nanti setelah akun disetujui)
      berkasSubmitted: false,
      berkas: null,
    };

    users.push(newUser);
    Auth.saveUsers(users);
    localStorage.setItem('dutauinssc_auth_token', cleanEmail);

    // Sync to dutauinssc_pendaftar so it immediately appears in all admin dashboard views and admin.html
    try {
      const pendaftarRaw = localStorage.getItem('dutauinssc_pendaftar');
      const pendaftarList = pendaftarRaw ? JSON.parse(pendaftarRaw) : [];
      const existingIdx = pendaftarList.findIndex(p => p.email?.toLowerCase() === cleanEmail);

      const pendaftarEntry = {
        id: newUser.id,
        namaLengkap: newUser.namaLengkap,
        nim: newUser.nim,
        fakultas: newUser.fakultas,
        jurusan: newUser.jurusan,
        prodi: newUser.jurusan || newUser.fakultas,
        semester: '—',
        jenisKelamin: newUser.jenisKelamin,
        ttl: `${newUser.tempatLahir}, ${newUser.tanggalLahir}`,
        email: newUser.email,
        kewarganegaraan: newUser.kewarganegaraan,
        status: 'pending',
        accountStatus: 'pending',
        isAccountApplication: true,
        createdAt: newUser.createdAt,
      };

      if (existingIdx !== -1) {
        pendaftarList[existingIdx] = { ...pendaftarList[existingIdx], ...pendaftarEntry };
      } else {
        pendaftarList.unshift(pendaftarEntry);
      }
      localStorage.setItem('dutauinssc_pendaftar', JSON.stringify(pendaftarList));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error syncing to pendaftar:', e);
    }

    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('users-updated', { detail: users }));
    } catch (e) {}

    return { success: true, user: newUser };
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
