import { extractDriveId } from '../components/Image';
import { DB } from './db';
import { Auth } from './auth';

const STORAGE_SETTINGS_KEY = 'dutauinssc_drive_config';

/**
 * Normalizes any document representation (string URL, Data URL, Google Drive link, or Object)
 * into a consistent document metadata object for previewing, downloading, and editing.
 */
export function normalizeDocument(docValue, fallbackName = 'Dokumen Persyaratan') {
  if (!docValue) return null;

  // Already a structured document object
  if (typeof docValue === 'object') {
    const driveId = docValue.driveId || (docValue.url ? extractDriveId(docValue.url) : null);
    const isDrive = Boolean(driveId || (docValue.url && (docValue.url.includes('drive.google.com') || docValue.url.includes('docs.google.com'))));
    
    let previewUrl = docValue.previewUrl || docValue.url;
    if (driveId) {
      previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
    }

    return {
      name: docValue.name || fallbackName,
      url: docValue.url || '',
      previewUrl: previewUrl || docValue.url || '',
      driveId: driveId || null,
      driveLink: docValue.driveLink || (driveId ? `https://drive.google.com/file/d/${driveId}/view` : (isDrive ? docValue.url : null)),
      isDrive,
      type: docValue.type || (docValue.name?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
      size: docValue.size || null,
      uploadedAt: docValue.uploadedAt || new Date().toISOString()
    };
  }

  // If stored as a string (URL, Data URI, or File Summary string)
  if (typeof docValue === 'string') {
    const trimmed = docValue.trim();
    if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed === 'null' || trimmed === 'undefined') return null;

    const driveId = extractDriveId(trimmed);
    const isDrive = Boolean(driveId || trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com'));

    let previewUrl = trimmed;
    let driveLink = null;
    if (driveId) {
      previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
      driveLink = `https://drive.google.com/file/d/${driveId}/view`;
    }

    const isPdf = trimmed.toLowerCase().includes('.pdf') || trimmed.startsWith('data:application/pdf');
    const isImage = trimmed.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)/) || trimmed.startsWith('data:image/');

    return {
      name: isDrive ? `Google Drive (${fallbackName})` : fallbackName,
      url: trimmed,
      previewUrl,
      driveId,
      driveLink,
      isDrive,
      type: isPdf ? 'application/pdf' : (isImage ? 'image/jpeg' : 'application/octet-stream'),
      size: null,
      uploadedAt: new Date().toISOString()
    };
  }

  return null;
}

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzUjsQRBGXvUfMNM9tVV1ZEDpmLvIk47XQbsnK1MB4QGjA-9ECJ_-gyDt46NedMLHF1/exec';

/**
 * Storage CRUD Operations for Applicant Documents (Google Drive Apps Script + Local/Cloud Sync)
 */
export const DriveStorage = {
  /**
   * Get Google Apps Script & Drive Folder configuration
   */
  getConfig: () => {
    if (typeof window === 'undefined') {
      return { scriptUrl: DEFAULT_SCRIPT_URL, folderId: '', folderUrl: '', autoUpload: true };
    }
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        scriptUrl: parsed.scriptUrl || import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || DEFAULT_SCRIPT_URL,
        folderId: parsed.folderId || import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '',
        folderUrl: parsed.folderUrl || '',
        autoUpload: parsed.autoUpload !== false
      };
    } catch {
      return { scriptUrl: DEFAULT_SCRIPT_URL, folderId: '', folderUrl: '', autoUpload: true };
    }
  },

  /**
   * Save Google Apps Script & Drive Folder configuration
   */
  saveConfig: (config) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('drive-config-updated', { detail: config }));
  },

  /**
   * Test connection to Google Apps Script Web App
   */
  testConnection: async (overrideUrl = null, overrideFolderId = null) => {
    const config = DriveStorage.getConfig();
    const targetUrl = (overrideUrl || config.scriptUrl || DEFAULT_SCRIPT_URL).trim();
    if (!targetUrl) {
      return { success: false, error: 'URL Google Apps Script belum diisi.' };
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'test',
          folderId: (overrideFolderId || config.folderId || '').trim()
        })
      });

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return data;
      } catch {
        if (text.includes('Anda memerlukan akses') || text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
          return {
            success: false,
            needsPermission: true,
            error: 'Google Apps Script memerlukan izin "Anyone" (Siapa saja). Pada Deploy > Manage deployments > Edit, ganti "Who has access" dari "Only myself" menjadi "Anyone", lalu klik Deploy.'
          };
        }
        return { 
          success: false, 
          error: 'Respon dari Google Apps Script: ' + (text.slice(0, 150) || 'Koneksi ditolak') 
        };
      }
    } catch (err) {
      return { 
        success: false, 
        error: 'Gagal terhubung ke Google Apps Script: ' + (err.message || String(err)) 
      };
    }
  },

  /**
   * Upload a File to Google Drive (via Google Apps Script Web App) or fallback to DataURL
   */
  uploadFile: async (file, meta = {}) => {
    if (!file) throw new Error('File tidak valid');

    // 1. Read file as Base64 Data URL
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const config = DriveStorage.getConfig();

    // 2. If Google Apps Script Web App is configured, send directly to Google Drive
    if (config.scriptUrl && config.scriptUrl.trim().startsWith('https://script.google.com/')) {
      try {
        const payload = {
          action: 'upload',
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
          base64Data: base64Data,
          folderId: config.folderId || '',
          applicantName: meta.applicantName || 'Peserta',
          applicantNim: meta.applicantNim || '',
          applicantEmail: meta.applicantEmail || '',
          docKey: meta.docKey || '',
          docLabel: meta.docLabel || ''
        };

        const response = await fetch(config.scriptUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result && result.success) {
          return {
            name: file.name,
            url: result.viewUrl || result.previewUrl,
            previewUrl: result.previewUrl || `https://drive.google.com/file/d/${result.fileId}/preview`,
            driveId: result.fileId,
            driveLink: result.viewUrl,
            downloadUrl: result.downloadUrl,
            isDrive: true,
            type: file.type || 'application/pdf',
            size: `${(file.size / 1024).toFixed(0)} KB`,
            uploadedAt: new Date().toISOString()
          };
        } else {
          console.warn('Google Apps Script upload failed, using local storage fallback:', result?.error);
        }
      } catch (err) {
        console.warn('Network error uploading to Google Apps Script, using local fallback:', err);
      }
    }

    // 3. Fallback: Store as Data URL (instant previewable PDF/image across all views)
    return {
      name: file.name,
      url: base64Data,
      previewUrl: base64Data,
      driveId: null,
      driveLink: null,
      isDrive: false,
      type: file.type || 'application/pdf',
      size: `${(file.size / 1024).toFixed(0)} KB`,
      uploadedAt: new Date().toISOString()
    };
  },

  /**
   * Delete file from Google Drive (if uploaded via Apps Script)
   */
  deleteDriveFile: async (fileId) => {
    if (!fileId) return false;
    const config = DriveStorage.getConfig();
    if (!config.scriptUrl) return false;

    try {
      await fetch(config.scriptUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', fileId })
      });
      return true;
    } catch (err) {
      console.warn('Failed to delete file from Google Drive via Apps Script:', err);
      return false;
    }
  },

  /**
   * Save a document for an applicant (CRUD: Create & Update)
   */
  saveDocument: (emailOrId, docKey, docData) => {
    if (!emailOrId || !docKey) return false;
    const cleanKey = String(emailOrId).trim().toLowerCase();

    // 1. Update in Auth Users
    const users = Auth.getUsers();
    const uIdx = users.findIndex(u => (u.email && u.email.toLowerCase() === cleanKey) || String(u.id) === cleanKey);
    if (uIdx !== -1) {
      users[uIdx] = {
        ...users[uIdx],
        [docKey]: docData,
        berkas: {
          ...(users[uIdx].berkas || {}),
          [docKey]: docData
        },
        berkasSubmitted: true,
        updatedAt: new Date().toISOString()
      };
      Auth.saveUsers(users);
    }

    // 2. Update in DB (dutauinssc_pendaftar)
    const applicants = DB.getAll();
    const aIdx = applicants.findIndex(a => (a.email && a.email.toLowerCase() === cleanKey) || String(a.id) === cleanKey);
    if (aIdx !== -1) {
      applicants[aIdx] = {
        ...applicants[aIdx],
        [docKey]: docData,
        berkas: {
          ...(applicants[aIdx].berkas || {}),
          [docKey]: docData
        },
        berkasSubmitted: true,
        updatedAt: new Date().toISOString()
      };
      DB.save(applicants);
    }

    window.dispatchEvent(new Event('storage'));
    return true;
  },

  /**
   * Delete a document for an applicant (CRUD: Delete)
   */
  deleteDocument: (emailOrId, docKey, fileIdToDelete = null) => {
    if (!emailOrId || !docKey) return false;
    const cleanKey = String(emailOrId).trim().toLowerCase();

    // If fileId provided, trigger Google Drive deletion in background
    if (fileIdToDelete) {
      DriveStorage.deleteDriveFile(fileIdToDelete).catch(() => {});
    }

    // 1. Remove from Auth Users
    const users = Auth.getUsers();
    const uIdx = users.findIndex(u => (u.email && u.email.toLowerCase() === cleanKey) || String(u.id) === cleanKey);
    if (uIdx !== -1) {
      const updatedUser = { ...users[uIdx] };
      delete updatedUser[docKey];
      if (updatedUser.berkas) {
        delete updatedUser.berkas[docKey];
      }
      users[uIdx] = { ...updatedUser, updatedAt: new Date().toISOString() };
      Auth.saveUsers(users);
    }

    // 2. Remove from DB
    const applicants = DB.getAll();
    const aIdx = applicants.findIndex(a => (a.email && a.email.toLowerCase() === cleanKey) || String(a.id) === cleanKey);
    if (aIdx !== -1) {
      const updatedApp = { ...applicants[aIdx] };
      delete updatedApp[docKey];
      if (updatedApp.berkas) {
        delete updatedApp.berkas[docKey];
      }
      applicants[aIdx] = { ...updatedApp, updatedAt: new Date().toISOString() };
      DB.save(applicants);
    }

    window.dispatchEvent(new Event('storage'));
    return true;
  }
};
