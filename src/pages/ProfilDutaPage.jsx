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
      let dutaCategory = String(duta.category || 'duta_kampus').trim().toLowerCase();
      if (dutaCategory === 'winner') dutaCategory = 'utama';

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

            {/* FILTER KONTROL UMUM (BERSIH & MODERN) */}
            <div style={{
              maxWidth: '860px',
              margin: '1.5rem auto 0',
              padding: '1.25rem 1.5rem',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1rem',
                alignItems: 'center'
              }}>
                {/* Dropdown / Select Tahun Angkatan */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--navy)',
                    marginBottom: '6px',
                    textAlign: 'left'
                  }}>
                    Tahun Angkatan
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border)',
                      background: '#ffffff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--navy)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="all">Semua Angkatan</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>Duta {year}</option>
                    ))}
                  </select>
                </div>

                {/* Dropdown / Select Kategori Duta */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--navy)',
                    marginBottom: '6px',
                    textAlign: 'left'
                  }}>
                    Kategori Gelar
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border)',
                      background: '#ffffff',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--navy)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {AMBASSADOR_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Hasil & Tombol Reset Cepat */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.78rem',
                color: 'var(--text-light)'
              }}>
                <div>
                  Menampilkan <strong style={{ color: 'var(--navy)' }}>{filteredAmbassadors.length}</strong> profil
                  {selectedYear !== 'all' && ` • Duta ${selectedYear}`}
                  {selectedCategory !== 'all' && ` • ${getAmbassadorCategoryLabel(selectedCategory)}`}
                </div>
                {(selectedYear !== 'all' || selectedCategory !== 'all') && (
                  <button
                    type="button"
                    onClick={() => { setSelectedYear('all'); setSelectedCategory('all'); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Atur Ulang Filter
                  </button>
                )}
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
