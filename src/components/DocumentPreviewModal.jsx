import React, { useState } from 'react';
import { normalizeDocument, DriveStorage } from '../lib/driveStorage';

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  docKey,
  docLabel,
  docValue,
  applicantEmailOrId,
  applicantName,
  canEdit = true,
  onUpdated
}) {
  const [editing, setEditing] = useState(false);
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [notice, setNotice] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const doc = normalizeDocument(docValue, docLabel);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setNotice('Mengunggah berkas...');
    try {
      const docData = await DriveStorage.uploadFile(file, {
        applicantName,
        applicantEmail: applicantEmailOrId,
        docKey,
        docLabel
      });

      await DriveStorage.saveDocument(applicantEmailOrId, docKey, docData);
      setNotice('Berkas berhasil diperbarui.');
      setEditing(false);
      if (onUpdated) onUpdated(docData);
    } catch (err) {
      setNotice('Kendala unggah berkas: ' + (err.message || 'Gagal mengunggah berkas.'));
    } finally {
      setUploading(false);
      setTimeout(() => setNotice(''), 4000);
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!driveUrlInput.trim()) return;

    setIsSubmittingLink(true);
    setNotice('Menyimpan tautan Google Drive...');
    try {
      const normalized = normalizeDocument(driveUrlInput.trim(), docLabel);
      await DriveStorage.saveDocument(applicantEmailOrId, docKey, normalized);
      setNotice('Tautan Google Drive berhasil disimpan.');
      setEditing(false);
      setDriveUrlInput('');
      if (onUpdated) onUpdated(normalized);
    } catch (err) {
      setNotice('Gagal menyimpan tautan: ' + (err.message || 'Error'));
    } finally {
      setIsSubmittingLink(false);
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    setNotice('Menghapus berkas...');
    try {
      await DriveStorage.deleteDocument(applicantEmailOrId, docKey, doc?.driveId);
      if (onUpdated) onUpdated(null);
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      setNotice('Gagal menghapus berkas: ' + (err.message || 'Error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-alt)',
            gap: '1rem'
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.5px' }}>
                Pratinjau Dokumen
              </span>
              {doc?.isDrive && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>
                  Google Drive
                </span>
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {docLabel}
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Nama File: <strong>{doc?.name || 'Dokumen'}</strong> {applicantName ? `· Pelamar: ${applicantName}` : ''}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {doc && (
              <>
                <a
                  href={doc.driveLink || doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline-gold"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 12px' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Buka Tab Baru
                </a>
                {doc.url && !doc.isDrive && (
                  <a
                    href={doc.url}
                    download={doc.name}
                    className="btn btn-sm btn-gold"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Unduh
                  </a>
                )}
              </>
            )}

            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontWeight: 700
              }}
              title="Tutup"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Institutional Confirmation Alert for Deletion */}
        {showConfirmDelete && (
          <div style={{
            padding: '1rem 1.5rem',
            background: '#fff1f2',
            borderBottom: '1px solid #fecdd3',
            borderLeft: '4px solid #e11d48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontSize: '0.84rem', color: '#9f1239', lineHeight: 1.45 }}>
              <strong>Konfirmasi Hapus:</strong> Apakah Anda yakin ingin menghapus dokumen <strong>{docLabel}</strong>? Tindakan ini tidak dapat dibatalkan.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-sm"
                disabled={isDeleting}
                style={{
                  background: '#e11d48',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.75 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={executeDelete}
              >
                {isDeleting && (
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                )}
                {isDeleting ? 'Menghapus Dokumen...' : 'Hapus Dokumen'}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  background: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setShowConfirmDelete(false)}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Action Bar (CRUD: Edit / Replace / Delete) */}
        {canEdit && (
          <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${editing ? 'btn-gold' : 'btn-outline-gold'}`}
                style={{ fontSize: '0.78rem', padding: '6px 14px', letterSpacing: '0.3px', fontWeight: 600 }}
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Tutup Formulir Perubahan' : 'Perbarui Dokumen'}
              </button>
              {doc && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  style={{ fontSize: '0.78rem', padding: '6px 14px', letterSpacing: '0.3px', fontWeight: 600 }}
                  onClick={() => setShowConfirmDelete(true)}
                >
                  Hapus Dokumen
                </button>
              )}
            </div>

            {notice && (
              <span style={{ 
                fontSize: '0.78rem', 
                color: notice.includes('Kendala') || notice.includes('Gagal') ? '#b91c1c' : '#15803d', 
                fontWeight: 600,
                background: notice.includes('Kendala') || notice.includes('Gagal') ? '#fef2f2' : '#f0fdf4',
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${notice.includes('Kendala') || notice.includes('Gagal') ? '#fecaca' : '#bbf7d0'}`
              }}>
                {notice}
              </span>
            )}
          </div>
        )}

        {/* Edit Form Panel (if toggled) */}
        {editing && canEdit && (
          <div style={{ padding: '1rem 1.5rem', background: '#fffbeb', borderBottom: '1px solid #fef3c7' }}>
            <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Pilih Cara Pembaruan Dokumen:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {/* Opsi 1: Upload File */}
              <div style={{ background: '#ffffff', padding: '0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', display: 'block', marginBottom: '0.4rem' }}>
                  1. Unggah File Baru (PDF / JPG / PNG)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.zip"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              {/* Opsi 2: Link Google Drive */}
              <form onSubmit={handleLinkSubmit} style={{ background: '#ffffff', padding: '0.875rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', display: 'block', marginBottom: '0.4rem' }}>
                  2. Tautkan Link Google Drive
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/d/.../view"
                    value={driveUrlInput}
                    onChange={(e) => setDriveUrlInput(e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <button type="submit" className="btn btn-sm btn-gold" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Viewer Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '480px' }}>
          {!doc ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', opacity: 0.6 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <h4 style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontSize: '1.1rem' }}>Belum Ada Berkas</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Dokumen ini belum dilampirkan atau diunggah oleh pelamar.</p>
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-gold btn-sm"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setEditing(true)}
                >
                  + Unggah / Tautkan Sekarang
                </button>
              )}
            </div>
          ) : doc.isDrive ? (
            <iframe
              src={doc.previewUrl}
              title={doc.name}
              style={{ width: '100%', height: '580px', border: 'none', borderRadius: '8px', background: '#ffffff' }}
              allow="autoplay"
            />
          ) : doc.type === 'application/pdf' || doc.url?.startsWith('data:application/pdf') ? (
            <iframe
              src={doc.previewUrl}
              title={doc.name}
              style={{ width: '100%', height: '580px', border: 'none', borderRadius: '8px', background: '#ffffff' }}
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
              <img
                src={doc.previewUrl || doc.url}
                alt={doc.name}
                style={{ maxWidth: '100%', maxHeight: '560px', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
