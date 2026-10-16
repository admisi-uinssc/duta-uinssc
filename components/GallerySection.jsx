'use client';

import { useEffect, useState } from 'react';
import { CMS } from '../lib/cms';

export default function GallerySection() {
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    setGallery(CMS.get().gallery || []);
    const unsubscribe = CMS.subscribe((data) => {
      if (data && data.gallery) {
        setGallery(data.gallery);
      }
    });
    return unsubscribe;
  }, []);

  if (gallery.length === 0) return null;

  return (
    <section className="section-pad bg-alt" id="gallery">
      <div className="container" style={{ maxWidth: '1480px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="section-header text-center" style={{ marginBottom: '3rem' }}>
          <h2 className="heading-lg">Galeri <span>Duta Kampus</span></h2>
          <p className="lead">Momen-momen inspiratif dari kegiatan Duta Kampus pada periode sebelumnya.</p>
        </div>
        
        <div className="gallery-grid">
          {gallery.map((item, idx) => (
            <div key={item.id || idx} className="gallery-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.img} alt={item.caption || `Gallery ${idx + 1}`} loading="lazy" />
              {item.caption && (
                <div className="gallery-caption">
                  <span>{item.caption}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
