import React, { useEffect, useState } from 'react';
import Image from './Image';
import { CMS } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';
import MediaModal, { VideoPlayBadge } from './MediaModal';

export default function GallerySection() {
  const [gallery, setGallery] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    setGallery(CMS.get().gallery || []);
    CMS.getAsync().then((data) => {
      if (data?.gallery) {
        setGallery(data.gallery);
      }
    }).catch(() => {});
    const unsubscribe = CMS.subscribe((data) => {
      if (data && data.gallery) {
        setGallery(data.gallery);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 900) {
      setVisibleCount(12);
    }
  }, []);

  if (gallery.length === 0) return null;

  const displayedGallery = gallery.slice(0, visibleCount);
  const hasMore = visibleCount < gallery.length;

  return (
    <section className="section-pad bg-alt" id="gallery">
      <div className="container" style={{ maxWidth: '1480px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="section-header text-center" style={{ marginBottom: '2.5rem' }}>
          <h2 className="heading-lg">Galeri <span>Duta Kampus</span></h2>
          <p className="lead">Dokumentasi foto dan video momen inspiratif kegiatan Duta Kampus UINSSC</p>
        </div>
        
        <div className="gallery-grid">
          {displayedGallery.map((item, idx) => {
            const parsed = parseMediaUrl(item.img, item.mediaType);
            return (
              <div 
                key={item.id || idx} 
                className="gallery-item"
                onClick={() => setSelectedMedia(item)}
                title={parsed.isVideo ? 'Ketuk untuk memutar video' : 'Ketuk untuk melihat foto'}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <Image 
                  src={item.img} 
                  alt={item.caption || `Gallery ${idx + 1}`} 
                  loading="lazy" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  fallbackSrc="https://ppid.uinssc.ac.id/storage/duta-kampus/01KRX8ZRGXBTT2929HWZQ7CWMM.png"
                />

                {/* Video Play Indicator Overlay */}
                {parsed.isVideo && (
                  <>
                    <VideoPlayBadge />
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(22, 50, 74, 0.85)',
                        border: '1px solid rgba(196, 158, 89, 0.6)',
                        color: '#F8E7C9',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        zIndex: 3,
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                    >
                      ▶ Video
                    </div>
                  </>
                )}

                {item.caption && (
                  <div className="gallery-caption">
                    <span>{item.caption}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {gallery.length > 6 && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            {hasMore ? (
              <button 
                type="button"
                onClick={() => setVisibleCount(gallery.length)}
                className="btn btn-outline-gold"
                style={{ padding: '0.65rem 1.75rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '50px', cursor: 'pointer' }}
              >
                Lihat Semua Dokumentasi ({gallery.length})
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => setVisibleCount(typeof window !== 'undefined' && window.innerWidth > 900 ? 12 : 6)}
                className="btn btn-outline-gold"
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '50px', cursor: 'pointer', opacity: 0.85 }}
              >
                Tampilkan Lebih Sedikit
              </button>
            )}
          </div>
        )}

        {/* Universal Media Modal (Foto & Video) */}
        <MediaModal 
          isOpen={Boolean(selectedMedia)} 
          onClose={() => setSelectedMedia(null)} 
          item={selectedMedia} 
          fallbackTitle="Dokumentasi Duta Kampus"
        />
      </div>
    </section>
  );
}
