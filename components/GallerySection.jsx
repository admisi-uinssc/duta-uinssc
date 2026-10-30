import React, { useEffect, useState } from 'react';
import Image from './Image';
import { CMS } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';
import MediaModal from './MediaModal';

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
                style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
              >
                {parsed.isVideo && parsed.directVideoUrl ? (
                  <video 
                    ref={(el) => {
                      if (el) {
                        el.muted = true;
                        el.defaultMuted = true;
                        const p = el.play();
                        if (p && typeof p.catch === 'function') {
                          p.catch(() => {});
                        }
                      }
                    }}
                    src={parsed.directVideoUrl} 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    preload="auto"
                    onCanPlay={(e) => {
                      e.target.muted = true;
                      e.target.play().catch(() => {});
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                  />
                ) : parsed.isVideo && parsed.autoplayEmbedUrl ? (
                  <iframe
                    src={parsed.autoplayEmbedUrl}
                    title={item.caption || 'Video Dokumentasi'}
                    style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                    allow="autoplay; encrypted-media"
                  />
                ) : (
                  <Image 
                    src={parsed.thumbnailUrl || item.img} 
                    alt={item.caption || `Gallery ${idx + 1}`} 
                    loading="lazy" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    fallbackSrc="https://ppid.uinssc.ac.id/storage/duta-kampus/01KRX8ZRGXBTT2929HWZQ7CWMM.png"
                  />
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
