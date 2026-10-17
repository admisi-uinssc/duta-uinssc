import React, { useEffect, useState } from 'react';
import Image from './Image';
import { CMS } from '../lib/cms';

export default function GallerySection() {
  const [gallery, setGallery] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedImage, setSelectedImage] = useState(null);

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
          <p className="lead">Momen-momen inspiratif kegiatan Duta Kampus UINSSC</p>
        </div>
        
        <div className="gallery-grid">
          {displayedGallery.map((item, idx) => (
            <div 
              key={item.id || idx} 
              className="gallery-item"
              onClick={() => setSelectedImage(item)}
              title="Ketuk untuk melihat foto"
            >
              <Image 
                src={item.img} 
                alt={item.caption || `Gallery ${idx + 1}`} 
                loading="lazy" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                fallbackSrc="https://ppid.uinssc.ac.id/storage/duta-kampus/01KRX8ZRGXBTT2929HWZQ7CWMM.png"
              />
              {item.caption && (
                <div className="gallery-caption">
                  <span>{item.caption}</span>
                </div>
              )}
            </div>
          ))}
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
                Lihat Semua Foto ({gallery.length})
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

        {/* Modal Lightbox Popup */}
        {selectedImage && (
          <div 
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(11, 19, 41, 0.94)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              backdropFilter: 'blur(6px)'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '680px',
                width: '100%',
                background: '#16324a',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                border: '1px solid rgba(196,158,89,0.3)',
                position: 'relative'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.65)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                ✕
              </button>
              <div style={{ width: '100%', maxHeight: '68vh', overflow: 'hidden', background: '#000' }}>
                <Image 
                  src={selectedImage.img} 
                  alt={selectedImage.caption || 'Foto Galeri'} 
                  style={{ width: '100%', height: '100%', maxHeight: '68vh', objectFit: 'contain', display: 'block' }}
                  fallbackSrc="https://ppid.uinssc.ac.id/storage/duta-kampus/01KRX8ZRGXBTT2929HWZQ7CWMM.png"
                />
              </div>
              {selectedImage.caption && (
                <div style={{ padding: '1rem 1.25rem', color: '#ffffff', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', background: '#16324a' }}>
                  {selectedImage.caption}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
