import React, { useEffect } from 'react';
import Image from './Image';
import { parseMediaUrl } from '../lib/media';

/**
 * Overlay badge with golden play icon to indicate video content
 */
export function VideoPlayBadge() {
  return null;
}

/**
 * Universal Modal / Lightbox for viewing both Photos and Videos seamlessly
 */
export default function MediaModal({ isOpen, onClose, item, fallbackTitle = '' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  // Support passing either a raw URL string or an object with img/src/url/mediaType
  const rawUrl = typeof item === 'string' ? item : (item.img || item.src || item.url || item.videoUrl || '');
  const explicitType = typeof item === 'object' ? item.mediaType : null;
  const caption = typeof item === 'object' ? (item.caption || item.title || fallbackTitle) : fallbackTitle;
  const parsed = parseMediaUrl(rawUrl, explicitType);

  const autoplayEmbed = parsed.embedUrl
    ? (parsed.embedUrl.includes('?') ? `${parsed.embedUrl}&autoplay=1` : `${parsed.embedUrl}?autoplay=1`)
    : '';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 19, 41, 0.94)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: parsed.isVideo ? '860px' : '720px',
          width: '100%',
          background: '#16324a',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(196, 158, 89, 0.35)',
          position: 'relative'
        }}
      >
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '6px 12px',
            borderRadius: '20px',
            background: 'rgba(0, 0, 0, 0.65)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background 0.2s'
          }}
        >
          Tutup
        </button>

        {/* Media Container */}
        <div style={{ width: '100%', background: '#000000', position: 'relative' }}>
          {parsed.isVideo ? (
            parsed.source === 'direct' && parsed.directVideoUrl ? (
              <video
                src={parsed.directVideoUrl}
                controls
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  maxHeight: '75vh',
                  display: 'block',
                  background: '#000000'
                }}
              />
            ) : autoplayEmbed ? (
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                <iframe
                  src={autoplayEmbed}
                  title={caption || 'Video Duta Kampus'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                />
              </div>
            ) : (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#cbd5e1' }}>
                <p>Tautan video tidak dapat diputar langsung.</p>
              </div>
            )
          ) : (
            <div style={{ width: '100%', maxHeight: '72vh', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Image
                src={parsed.thumbnailUrl || parsed.rawUrl}
                alt={caption || 'Foto Galeri'}
                style={{ width: '100%', height: '100%', maxHeight: '72vh', objectFit: 'contain', display: 'block' }}
                fallbackSrc="https://ppid.uinssc.ac.id/storage/duta-kampus/01KRX8ZRGXBTT2929HWZQ7CWMM.png"
              />
            </div>
          )}
        </div>

        {/* Footer Info Bar */}
        {(caption || parsed.isVideo) && (
          <div
            style={{
              padding: '0.9rem 1.25rem',
              background: '#16324a',
              borderTop: '1px solid rgba(196, 158, 89, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ flex: 1 }}>
              {caption && (
                <div style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.4 }}>
                  {caption}
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: parsed.isVideo ? '#F8E7C9' : '#C49E59',
                background: parsed.isVideo ? 'rgba(196, 158, 89, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}
            >
              {parsed.isVideo ? 'Video' : 'Foto'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
