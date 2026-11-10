import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Image from '../components/Image';
import { CMS, AMBASSADOR_CATEGORIES, AMBASSADOR_YEARS, getAmbassadorCategoryLabel } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';
import MediaModal from '../components/MediaModal';

export default function ProfilDutaPage() {
  const [ambassadors, setAmbassadors] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  // Compute available years dynamically combining preset years and items from data
  const availableYears = useMemo(() => {
    const set = new Set(AMBASSADOR_YEARS);
    ambassadors.forEach(a => {
      if (a.year) set.add(String(a.year).trim());
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [ambassadors]);

  // Filtered ambassadors
  const filteredAmbassadors = useMemo(() => {
    return ambassadors.filter((duta) => {
      const dutaYear = String(duta.year || '2025').trim();
      const dutaCategory = String(duta.category || 'winner').trim().toLowerCase();

      const matchYear = selectedYear === 'all' || dutaYear === selectedYear;
      const matchCategory = selectedCategory === 'all' || dutaCategory === selectedCategory.toLowerCase();

      return matchYear && matchCategory;
    });
  }, [ambassadors, selectedYear, selectedCategory]);

  return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ paddingTop: '100px', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-alt)' }}>
        <div className="container">
          <div className="section-header text-center" style={{ marginBottom: '2rem' }}>
            <h1 className="heading-lg">Profil <span>Duta Kampus</span></h1>
            <p className="lead" style={{ margin: '0.5rem auto 1.5rem', maxWidth: '640px' }}>
              Mengenal representasi mahasiswa unggul dan inspiratif UIN Siber Syekh Nurjati Cirebon.
            </p>

            {/* FILTER KONTROL TAHUN & KATEGORI */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxWidth: '820px',
              margin: '1.5rem auto 0',
              padding: '1rem',
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
            }}>
              {/* Filter Tahun (Tab Pills) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', marginRight: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tahun Angkatan:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedYear('all')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: selectedYear === 'all' ? '1px solid var(--gold)' : '1px solid #e2e8f0',
                    background: selectedYear === 'all' ? 'var(--navy)' : '#f8fafc',
                    color: selectedYear === 'all' ? '#ffffff' : 'var(--text-mid)'
                  }}
                >
                  Semua Angkatan
                </button>
                {availableYears.map(year => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: selectedYear === year ? '1px solid var(--gold)' : '1px solid #e2e8f0',
                      background: selectedYear === year ? 'linear-gradient(135deg, #16324A 0%, #0d1e2d 100%)' : '#f8fafc',
                      color: selectedYear === year ? 'var(--gold)' : 'var(--text-mid)'
                    }}
                  >
                    Angkatan {year}
                  </button>
                ))}
              </div>

              {/* Filter Kategori Duta */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.4rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', marginRight: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Kategori Duta:
                </span>
                {AMBASSADOR_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: selectedCategory === cat.id ? '1px solid var(--gold)' : '1px solid transparent',
                      background: selectedCategory === cat.id ? 'rgba(196, 158, 89, 0.15)' : 'transparent',
                      color: selectedCategory === cat.id ? '#9e7b36' : 'var(--text-mid)'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Status Hasil Filter */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center', marginTop: '-0.25rem' }}>
                Menampilkan <strong>{filteredAmbassadors.length}</strong> profil Duta Kampus
                {selectedYear !== 'all' && ` • Angkatan ${selectedYear}`}
                {selectedCategory !== 'all' && ` • ${getAmbassadorCategoryLabel(selectedCategory)}`}
              </div>
            </div>
          </div>
          
          <div className="ambassador-grid">
            {filteredAmbassadors.map((duta) => {
              const media = duta.img ? parseMediaUrl(duta.img, duta.mediaType) : null;
              const categoryLabel = getAmbassadorCategoryLabel(duta.category);
              const dutaYear = String(duta.year || '2025');

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
                        caption: `${duta.name || 'Duta'}${categoryLabel ? ` · ${categoryLabel}` : ''} · ${duta.major || duta.faculty || 'Duta Kampus'} (Angkatan ${dutaYear})`,
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
                    {categoryLabel && (
                      <div style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--gold)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        {categoryLabel}
                      </div>
                    )}
                    <h3>{duta.name}</h3>
                    <p>{duta.major || duta.faculty || 'Duta Kampus'}</p>
                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                      Angkatan {dutaYear}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredAmbassadors.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-light)', padding: '3.5rem 1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.5rem' }}>
                  Tidak ada data profil Duta Kampus untuk filter ini.
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-mid)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                  Silakan pilih kombinasi tahun angkatan atau kategori lainnya.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => { setSelectedYear('all'); setSelectedCategory('all'); }}
                >
                  Reset Filter
                </button>
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
