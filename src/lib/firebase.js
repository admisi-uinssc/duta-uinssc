import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  deleteField,
  getDocs, 
  getDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  limit
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCO9qBaurZAndOW2w-LdGZGeq6Kzmxw-hg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "duta-kampus.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "duta-kampus",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "duta-kampus.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "960208224753",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:960208224753:web:9669f19a3b9f4d68c20450"
};

// Check if credentials have been properly populated
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('YOUR_') &&
  firebaseConfig.apiKey.length > 10
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Enable multi-tab IndexedDB cache persistence
    // This allows Firestore to serve data from browser cache instead of counting server reads!
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      db = getFirestore(app);
    }
    console.log('Firebase initialized with persistent local cache for:', firebaseConfig.projectId);
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
  }
}

export { app, auth, db, firebaseConfig };

// ==========================================
// ZERO-READ SMART CACHE & SYNC HELPERS
// ==========================================

// Fast cooldown 5 detik untuk sync agar perubahan pendaftar langsung tampil tanpa hapus cache
export const SYNC_COOLDOWN_MS = 5 * 1000;

export function getLastSyncTime() {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem('dutauinssc_last_cloud_sync') || 0);
}

/**
 * Smart Sync: Sinkronisasi data Firestore ke localStorage.
 * Jika local cache kosong, otomatis fetch dari Cloud Backend tanpa menunggu.
 */
export async function smartSyncAll(force = false) {
  if (!db) return { success: false, reason: 'offline' };
  
  // Selalu ambil data langsung dari cloud secara online tanpa harus hapus cache
  try {
    // 1. Ambil pendaftar dari cloud (Deduplikasi cerdas berdasarkan Email / NIM / ID)
    const cloudApps = await fetchApplicantsFromCloud();
    if (cloudApps && cloudApps.length > 0) {
      const localApps = localAppsRaw ? JSON.parse(localAppsRaw) : [];
      const appMap = new Map();
      localApps.forEach(a => {
        const key = (a.email || a.nim || String(a.id)).trim().toLowerCase();
        appMap.set(key, a);
      });
      cloudApps.forEach(a => {
        const key = (a.email || a.nim || String(a.id)).trim().toLowerCase();
        if (appMap.has(key)) {
          appMap.set(key, { ...appMap.get(key), ...a });
        } else {
          appMap.set(key, a);
        }
      });
      const mergedApps = Array.from(appMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      localStorage.setItem('dutauinssc_pendaftar', JSON.stringify(mergedApps));
      window.dispatchEvent(new Event('storage'));
    }

    // 2. Ambil user dari cloud (Deduplikasi cerdas berdasarkan Email)
    const cloudUsers = await fetchUsersFromCloud();
    if (cloudUsers && cloudUsers.length > 0) {
      const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : [];
      const userMap = new Map();
      localUsers.forEach(u => {
        const key = (u.email || u.username || String(u.id)).trim().toLowerCase();
        userMap.set(key, u);
      });
      cloudUsers.forEach(u => {
        const key = (u.email || u.username || String(u.id)).trim().toLowerCase();
        if (userMap.has(key)) {
          userMap.set(key, { ...userMap.get(key), ...u });
        } else {
          userMap.set(key, u);
        }
      });
      localStorage.setItem('dutauinssc_users', JSON.stringify(Array.from(userMap.values())));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('users-updated', { detail: Array.from(userMap.values()) }));
    }

    // 3. Ambil data CMS dari cloud (Slider, Banner, Foto Galeri, Profil Duta)
    try {
      const cloudCms = await fetchCmsFromCloud();
      if (cloudCms) {
        const stored = localStorage.getItem('dutauinssc_cms_v2');
        const current = stored ? JSON.parse(stored) : {};
        const merged = { ...current, ...cloudCms };
        localStorage.setItem('dutauinssc_cms_v2', JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('cms-updated', { detail: merged }));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {}

    localStorage.setItem('dutauinssc_last_cloud_sync', String(now));
    return { 
      success: true, 
      fromCache: false, 
      countUsers: cloudUsers?.length || 0, 
      countApps: cloudApps?.length || 0 
    };
  } catch (err) {
    console.warn('Smart sync failed:', err);
    return { success: false, error: err.message };
  }
}

const DOSSIER_DOC_KEYS = [
  'docSuratPernyataan',
  'docCv',
  'docSuratRekomendasi',
  'docSertifikatPrestasi',
  'docFotoLengkap',
  'docMotivationLetter',
  'docBuktiFollow',
  'docKtm',
  'docTranskripNilai',
  'docBuktiDiterima'
];

/**
 * Save / sync a single user to Firestore (Writes only = 1 Write, 0 Reads)
 */
export async function syncUserToCloud(user) {
  if (!db || !user) return;
  try {
    const docId = String(user.email || user.username || user.id).toLowerCase();
    const userRef = doc(db, 'duta_users', docId);
    const emptyDocKeys = DOSSIER_DOC_KEYS.filter(k => user[k] === '' || (user.berkas && user.berkas[k] === ''));

    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (emptyDocKeys.length > 0) {
      const delPayload = {};
      emptyDocKeys.forEach(k => {
        delPayload[k] = deleteField();
        delPayload[`berkas.${k}`] = deleteField();
      });
      await updateDoc(userRef, delPayload).catch(() => {});
    }

    // Also sync to numeric ID doc if different to avoid split state
    if (user.id && String(user.id).toLowerCase() !== docId) {
      try {
        const altRef = doc(db, 'duta_users', String(user.id).toLowerCase());
        await setDoc(altRef, {
          ...user,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        if (emptyDocKeys.length > 0) {
          const delPayload = {};
          emptyDocKeys.forEach(k => {
            delPayload[k] = deleteField();
            delPayload[`berkas.${k}`] = deleteField();
          });
          await updateDoc(altRef, delPayload).catch(() => {});
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }
}

/**
 * Direct lookup for a single user by email or username in Firestore
 * Strictly optimized to consume at most 1 read instead of scanning entire collection.
 */
export async function fetchUserFromCloudByIdentifier(identifier) {
  if (!db || !identifier) return null;
  const clean = identifier.trim().toLowerCase();
  
  // 1. Direct get by email document ID (1 read)
  try {
    const directDoc = await getDoc(doc(db, 'duta_users', clean));
    if (directDoc.exists()) {
      return directDoc.data();
    }
  } catch (e) {}

  // 2. Targeted limit(1) query by username (1 read max)
  try {
    const qUser = query(collection(db, 'duta_users'), where('username', '==', clean), limit(1));
    const snapUser = await getDocs(qUser);
    if (!snapUser.empty) {
      return snapUser.docs[0].data();
    }
  } catch (err) {}

  // 3. Fallback targeted limit(1) query by email field if doc ID was different
  try {
    const qEmail = query(collection(db, 'duta_users'), where('email', '==', clean), limit(1));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      return snapEmail.docs[0].data();
    }
  } catch (err) {}

  return null;
}

/**
 * Real-time listener for a single user document.
 * Enables instant Lolos/Tidak Lolos announcement updates without page refresh.
 * Only consumes 1 read per active session, 0 reads when unchanged.
 */
export function listenToUserFromCloud(identifier, callback) {
  if (!db || !identifier || typeof callback !== 'function') return () => {};
  const clean = String(identifier).trim().toLowerCase();
  try {
    const userRef = doc(db, 'duta_users', clean);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    }, (err) => {
      console.warn('User status sync notice:', err);
    });
  } catch (err) {
    console.warn('Could not establish user listener:', err);
    return () => {};
  }
}

/**
 * Direct lookup for a single applicant dossier by email or ID in Firestore
 */
export async function fetchApplicantFromCloudByIdentifier(identifier) {
  if (!db || !identifier) return null;
  const clean = String(identifier).trim().toLowerCase();
  
  // 1. Direct get by email document ID
  try {
    const directDoc = await getDoc(doc(db, 'duta_applicants', clean));
    if (directDoc.exists()) {
      return directDoc.data();
    }
  } catch (e) {}

  // 2. Query by email field
  try {
    const qEmail = query(collection(db, 'duta_applicants'), where('email', '==', clean), limit(1));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      return snapEmail.docs[0].data();
    }
  } catch (err) {}

  // 3. Query by numeric ID if identifier is numeric
  try {
    const directIdDoc = await getDoc(doc(db, 'duta_applicants', String(identifier)));
    if (directIdDoc.exists()) {
      return directIdDoc.data();
    }
  } catch (e) {}

  return null;
}

/**
 * Real-time listener for a single applicant dossier document (Instant HP sync)
 */
export function listenToApplicantFromCloud(identifier, callback) {
  if (!db || !identifier || typeof callback !== 'function') return () => {};
  const clean = String(identifier).trim().toLowerCase();
  try {
    const appRef = doc(db, 'duta_applicants', clean);
    return onSnapshot(appRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    }, (err) => {
      console.warn('Applicant dossier sync notice:', err);
    });
  } catch (err) {
    return () => {};
  }
}

/**
 * Delete a specific document field from Firestore cloud
 */
export async function deleteDocumentFieldFromCloud(emailOrId, docKey) {
  if (!db || !emailOrId || !docKey) return;
  const clean = String(emailOrId).trim().toLowerCase();

  const idSet = new Set([clean]);

  if (typeof window !== 'undefined') {
    try {
      const rawUsers = localStorage.getItem('dutauinssc_users');
      if (rawUsers) {
        const list = JSON.parse(rawUsers);
        list.forEach(u => {
          if ((u.email && u.email.toLowerCase() === clean) || String(u.id).toLowerCase() === clean || (u.username && u.username.toLowerCase() === clean)) {
            if (u.email) idSet.add(u.email.toLowerCase());
            if (u.id) idSet.add(String(u.id).toLowerCase());
            if (u.username) idSet.add(u.username.toLowerCase());
          }
        });
      }
      const rawApps = localStorage.getItem('dutauinssc_pendaftar');
      if (rawApps) {
        const list = JSON.parse(rawApps);
        list.forEach(a => {
          if ((a.email && a.email.toLowerCase() === clean) || String(a.id).toLowerCase() === clean || (a.nim && String(a.nim).toLowerCase() === clean)) {
            if (a.email) idSet.add(a.email.toLowerCase());
            if (a.id) idSet.add(String(a.id).toLowerCase());
          }
        });
      }
    } catch (e) {}
  }

  const deletePromises = [];
  idSet.forEach(id => {
    const delPayload = {
      [docKey]: deleteField(),
      [`berkas.${docKey}`]: deleteField(),
      updatedAt: new Date().toISOString()
    };
    deletePromises.push(updateDoc(doc(db, 'duta_applicants', id), delPayload).catch(() => {}));
    deletePromises.push(updateDoc(doc(db, 'duta_users', id), delPayload).catch(() => {}));
  });

  await Promise.all(deletePromises);
}


/**
 * Fetch all users from Firestore
 */
export async function fetchUsersFromCloud() {
  if (!db) return null;
  try {
    const snap = await getDocs(collection(db, 'duta_users'));
    const list = [];
    snap.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    console.warn('Could not fetch users from Firestore:', err);
    return null;
  }
}

/**
 * Save / sync a single applicant dossier submission to Firestore (Writes only = 1 Write, 0 Reads)
 */
export async function syncApplicantToCloud(applicant) {
  if (!db || !applicant) return;
  try {
    const docId = String(applicant.id || applicant.email).toLowerCase();
    const appRef = doc(db, 'duta_applicants', docId);
    const emptyDocKeys = DOSSIER_DOC_KEYS.filter(k => applicant[k] === '' || (applicant.berkas && applicant.berkas[k] === ''));

    await setDoc(appRef, {
      ...applicant,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (emptyDocKeys.length > 0) {
      const delPayload = {};
      emptyDocKeys.forEach(k => {
        delPayload[k] = deleteField();
        delPayload[`berkas.${k}`] = deleteField();
      });
      await updateDoc(appRef, delPayload).catch(() => {});
    }

    // Also sync to email doc ID if applicant has email and it differs
    if (applicant.email && String(applicant.email).toLowerCase() !== docId) {
      try {
        const emailRef = doc(db, 'duta_applicants', String(applicant.email).toLowerCase());
        await setDoc(emailRef, {
          ...applicant,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        if (emptyDocKeys.length > 0) {
          const delPayload = {};
          emptyDocKeys.forEach(k => {
            delPayload[k] = deleteField();
            delPayload[`berkas.${k}`] = deleteField();
          });
          await updateDoc(emailRef, delPayload).catch(() => {});
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Could not sync applicant dossier to Firestore:', err);
  }
}

/**
 * Fetch all applicant dossier submissions from Firestore
 */
export async function fetchApplicantsFromCloud() {
  if (!db) return null;
  try {
    const snap = await getDocs(collection(db, 'duta_applicants'));
    const list = [];
    snap.forEach((d) => list.push(d.data()));
    return list;
  } catch (err) {
    console.warn('Could not fetch applicants from Firestore:', err);
    return null;
  }
}

/**
 * Real-time listener for all applicants in Firestore (Instant updates in Admin)
 */
export function listenToApplicantsFromCloud(callback) {
  if (!db || typeof callback !== 'function') return () => {};
  try {
    return onSnapshot(collection(db, 'duta_applicants'), (snap) => {
      const list = [];
      snap.forEach(d => list.push(d.data()));
      callback(list);
    }, (err) => {
      console.warn('Applicants real-time sync notice:', err);
    });
  } catch (err) {
    return () => {};
  }
}

/**
 * Real-time listener for all registered users in Firestore (Instant updates in Admin)
 */
export function listenToUsersFromCloud(callback) {
  if (!db || typeof callback !== 'function') return () => {};
  try {
    return onSnapshot(collection(db, 'duta_users'), (snap) => {
      const list = [];
      snap.forEach(d => list.push(d.data()));
      callback(list);
    }, (err) => {
      console.warn('Users real-time sync notice:', err);
    });
  } catch (err) {
    return () => {};
  }
}

/**
 * Delete an applicant from Firestore
 */
export async function deleteApplicantFromCloud(id) {
  if (!db || !id) return;
  try {
    await deleteDoc(doc(db, 'duta_applicants', String(id)));
  } catch (err) {
    console.warn('Could not delete applicant from Firestore:', err);
  }
}

/**
 * Save / sync CMS content to Firestore
 */
export async function syncCmsToCloud(cmsData) {
  if (!db || !cmsData) return;
  try {
    const cmsRef = doc(db, 'duta_settings', 'cms');
    await setDoc(cmsRef, {
      ...cmsData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync CMS to Firestore:', err);
  }
}

/**
 * Fetch CMS content from Firestore
 */
export async function fetchCmsFromCloud() {
  if (!db) return null;
  try {
    const cmsDoc = await getDoc(doc(db, 'duta_settings', 'cms'));
    if (cmsDoc.exists()) {
      return cmsDoc.data();
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch CMS from Firestore:', err);
    return null;
  }
}

/**
 * Listen to real-time CMS content changes from Firestore
 */
export function listenToCmsFromCloud(callback) {
  if (!db || typeof callback !== 'function') return () => {};
  try {
    const cmsRef = doc(db, 'duta_settings', 'cms');
    return onSnapshot(cmsRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    }, (err) => {
      console.warn('Real-time CMS sync notice:', err);
    });
  } catch (err) {
    console.warn('Could not establish CMS listener:', err);
    return () => {};
  }
}


