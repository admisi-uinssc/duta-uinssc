import React, { useEffect, useState } from 'react';
import Image from './Image';
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
              <Image 
                src={item.img} 
                alt={item.caption || `Gallery ${idx + 1}`} 
                loading="lazy" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                fallbackSrc="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80"
              />
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
