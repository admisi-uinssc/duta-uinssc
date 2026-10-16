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
  getDocs, 
  getDoc, 
  deleteDoc, 
  onSnapshot 
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

// Cooldown 30 detik untuk sync berkala (jika data lokal kosong langsung fetch dari Firestore)
export const SYNC_COOLDOWN_MS = 30 * 1000;

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
  
  const lastSync = getLastSyncTime();
  const now = Date.now();
  
  const localAppsRaw = typeof window !== 'undefined' ? localStorage.getItem('dutauinssc_pendaftar') : null;
  const localUsersRaw = typeof window !== 'undefined' ? localStorage.getItem('dutauinssc_users') : null;
  const isLocalEmpty = !localAppsRaw || localAppsRaw === '[]' || !localUsersRaw || localUsersRaw === '[]';

  // Jika bukan force, data lokal sudah ada, dan belum lewat cooldown, gunakan cache
  if (!force && !isLocalEmpty && (now - lastSync < SYNC_COOLDOWN_MS)) {
    return { 
      success: true, 
      fromCache: true, 
      message: 'Data aktif dari cache lokal.' 
    };
  }

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

/**
 * Save / sync a single user to Firestore (Writes only = 1 Write, 0 Reads)
 */
export async function syncUserToCloud(user) {
  if (!db || !user) return;
  try {
    const docId = String(user.email || user.username || user.id).toLowerCase();
    const userRef = doc(db, 'duta_users', docId);
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }
}

/**
 * Direct lookup for a single user by email or username in Firestore
 */
export async function fetchUserFromCloudByIdentifier(identifier) {
  if (!db || !identifier) return null;
  const clean = identifier.trim().toLowerCase();
  try {
    // 1. Direct get by email document ID
    const directDoc = await getDoc(doc(db, 'duta_users', clean));
    if (directDoc.exists()) {
      return directDoc.data();
    }
  } catch (e) {}

  try {
    // 2. Scan collection for matching email, username, or rizki
    const snap = await getDocs(collection(db, 'duta_users'));
    let matched = null;
    snap.forEach((d) => {
      const u = d.data();
      if (!u) return;
      const uEmail = (u.email || '').toLowerCase();
      const uUsername = (u.username || '').toLowerCase();
      if (
        uEmail === clean ||
        uUsername === clean ||
        (clean === 'rizki' && (uEmail === 'rizki@uinssc.ac.id' || uUsername === 'rizki'))
      ) {
        matched = u;
      }
    });
    return matched;
  } catch (err) {
    console.warn('Could not query user from Firestore:', err);
    return null;
  }
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
    const appRef = doc(db, 'duta_applicants', String(applicant.id));
    await setDoc(appRef, {
      ...applicant,
      updatedAt: new Date().toISOString()
    }, { merge: true });
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

