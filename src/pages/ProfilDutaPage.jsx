import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Image from '../components/Image';
import { CMS } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';
import MediaModal from '../components/MediaModal';

export default function ProfilDutaPage() {
  const [ambassadors, setAmbassadors] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    setAmbassadors(CMS.get().ambassadors || []);
    
    // Eagerly fetch latest ambassador data directly from Cloud Firestore
    CMS.getAsync().then((data) => {
      if (data?.ambassadors) {
        setAmbassadors(data.ambassadors);
      }
    }).catch(() => {});

    const unsubscribe = CMS.subscribe((data) => {
      if (data && data.ambassadors) {
        setAmbassadors(data.ambassadors);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ paddingTop: '100px', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-alt)' }}>
        <div className="container">
          <div className="section-header text-center" style={{ marginBottom: '2.5rem' }}>
            <h1 className="heading-lg">Profil <span>Duta Kampus</span></h1>
            <p className="lead" style={{ margin: '0.5rem auto 1.5rem' }}>
              Mengenal representasi mahasiswa unggul UIN Siber Syekh Nurjati Cirebon.
            </p>
          </div>
          
          <div className="ambassador-grid">
            {ambassadors.map((duta) => {
              const media = duta.img ? parseMediaUrl(duta.img, duta.mediaType) : null;
              return (
                <div 
                  key={duta.id} 
                  className="ambassador-card"
                  style={{ cursor: duta.img ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (duta.img) {
                      setSelectedMedia({
                        url: duta.img,
                        title: duta.name || 'Profil Duta Kampus',
                        caption: `${duta.name || 'Duta'} · ${duta.major || duta.faculty || 'Duta Kampus'}${duta.year ? ` (Angkatan ${duta.year})` : ''}`,
                        mediaType: duta.mediaType
                      });
                    }
                  }}
                >
                  <div className="ambassador-img-wrapper" style={{ position: 'relative' }}>
                    {duta.img && !duta.img.includes('unsplash.com') ? (
                      media?.isVideo && media.directVideoUrl ? (
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
                          src={media.directVideoUrl}
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
                      ) : media?.isVideo && media.autoplayEmbedUrl ? (
                        <iframe
                          src={media.autoplayEmbedUrl}
                          title={duta.name || 'Video Duta'}
                          style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                          allow="autoplay; encrypted-media"
                        />
                      ) : (
                        <Image 
                          src={media?.thumbnailUrl || duta.img} 
                          alt={duta.name} 
                          fill 
                          style={{ objectFit: 'cover' }} 
                          fallbackSrc="/assets/logo-circle.png"
                        />
                      )
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        background: 'linear-gradient(135deg, #16324A 0%, #0d1e2d 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: 'rgba(196, 158, 89, 0.15)',
                          border: '2px solid var(--gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--gold)',
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          letterSpacing: '1px'
                        }}>
                          {duta.name ? duta.name.split(' ').slice(0, 2).map(n => n[0]).join('') : 'DK'}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          Duta Kampus UINSSC
                        </span>
                      </div>
                    )}
                    {duta.faculty && (
                      <div className="ambassador-badge">
                        {duta.faculty}
                      </div>
                    )}
                  </div>
                  <div className="ambassador-info">
                    <h3>{duta.name}</h3>
                    <p>{duta.major || duta.faculty || 'Duta Kampus'}</p>
                    {duta.year && (
                      <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600 }}>
                        Angkatan {duta.year}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {ambassadors.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-light)', padding: '3rem 0' }}>
                Data Profil Duta Kampus belum tersedia.
              </div>
            )}
          </div>
        </div>
      </div>
      <MediaModal
        isOpen={Boolean(selectedMedia)}
        onClose={() => setSelectedMedia(null)}
        item={selectedMedia}
        fallbackTitle="Profil Duta Kampus"
      />
      <Footer />
    </>
  );
}
