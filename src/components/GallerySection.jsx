import React, { useEffect, useState, useMemo } from 'react';
import Image from './Image';
import { CMS, GALLERY_CATEGORIES, getGalleryCategoryLabel } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';
import MediaModal from './MediaModal';

export default function GallerySection() {
  const [gallery, setGallery] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  // Filter gallery items berdasarkan kategori
  const filteredGallery = useMemo(() => {
    if (selectedCategory === 'all') return gallery;
    return gallery.filter(item => {
      const cat = (item.category || 'sosialisasi').toLowerCase();
      return cat === selectedCategory.toLowerCase();
    });
  }, [gallery, selectedCategory]);

  if (gallery.length === 0) return null;

  const displayedGallery = filteredGallery.slice(0, visibleCount);
  const hasMore = visibleCount < filteredGallery.length;

  return (
    <section className="section-pad bg-alt" id="gallery">
      <div className="container" style={{ maxWidth: '1480px', margin: '0 auto' }}>
        {/* Header Section: Clean, Tanpa Eyebrow, Tanpa Pill Badge */}
        <div className="section-header text-center" style={{ marginBottom: '1.75rem' }}>
          <h2 className="heading-lg">Galeri <span>Duta Kampus</span></h2>
          <p className="lead">Dokumentasi foto dan video momen inspiratif kegiatan Duta Kampus UINSSC</p>
        </div>

        {/* Filter Kategori Galeri: Responsif, Minimalis, Native Mobile Scroll dengan Penanda Geser */}
        <div className="gallery-filter-bar">
          <div className="gallery-filter-scroll-wrapper">
            <div className="gallery-filter-scroll">
              {GALLERY_CATEGORIES.map(cat => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setVisibleCount(typeof window !== 'undefined' && window.innerWidth > 900 ? 12 : 6);
                    }}
                    className={`gallery-filter-btn ${isActive ? 'active' : ''}`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Penanda Geser (Scroll Hint) Desktop & HP */}
          <div className="filter-scroll-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18"/>
            </svg>
            <span className="desktop-only" style={{ fontSize: '0.75rem' }}>Geser kategori</span>
            <span className="mobile-only" style={{ fontSize: '0.68rem' }}>Geser</span>
          </div>
          
          <span className="gallery-counter desktop-only">
            {filteredGallery.length} Dokumentasi
          </span>
        </div>
        
        {/* Grid Galeri: Desktop 3-4 kolom, HP 2 kolom rapi ala katalog */}
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

        {filteredGallery.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-light)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-mid)', marginBottom: '1rem' }}>
              Belum ada foto atau video pada kategori ini.
            </p>
            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={() => setSelectedCategory('all')}
            >
              Lihat Semua Kegiatan
            </button>
          </div>
        )}

        {filteredGallery.length > 6 && (
          <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
            {hasMore ? (
              <button 
                type="button"
                onClick={() => setVisibleCount(filteredGallery.length)}
                className="btn btn-outline-gold"
                style={{ padding: '0.55rem 1.5rem', fontSize: '0.825rem', fontWeight: 600, borderRadius: '9999px', cursor: 'pointer' }}
              >
                Lihat Semua Dokumentasi ({filteredGallery.length})
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => setVisibleCount(typeof window !== 'undefined' && window.innerWidth > 900 ? 12 : 6)}
                className="btn btn-outline-gold"
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.78rem', fontWeight: 600, borderRadius: '9999px', cursor: 'pointer', opacity: 0.85 }}
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
