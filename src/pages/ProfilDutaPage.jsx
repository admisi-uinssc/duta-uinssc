
const abbreviateFaculty = (faculty = '') => {
  if (!faculty) return '';
  const f = faculty.trim().toUpperCase();
  if (f.includes('TARBIYAH') || f.includes('FITK') || f.includes('KEGURUAN')) return 'FITK';
  if (f.includes('SYARIAH') || f.includes('FASYA') || f.includes('HUKUM')) return 'FASYA';
  if (f.includes('USHULUDDIN') || f.includes('FUAD') || f.includes('DAKWAH') || f.includes('ADAB')) return 'FUAD';
  if (f.includes('EKONOMI') || f.includes('FEBI') || f.includes('BISNIS')) return 'FEBI';
  if (f.includes('SAINS') || f.includes('FST') || f.includes('TEKNOLOGI')) return 'FST';
  if (f.length > 8) {
    const words = faculty.split(' ').filter(w => !['DAN', '&', 'ILMU'].includes(w.toUpperCase()));
    if (words.length > 1) return words.map(w => w[0].toUpperCase()).join('');
  }
  return faculty;
};
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Image from '../components/Image';
import { CMS, AMBASSADOR_CATEGORIES, AMBASSADOR_YEARS, getAmbassadorCategoryLabel } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';
import { Settings } from '../lib/settings';
import { DB } from '../lib/db';
import { Auth } from '../lib/auth';
import { fetchApplicantsFromCloud } from '../lib/firebase';
import MediaModal from '../components/MediaModal';

export default function ProfilDutaPage() {
  const [ambassadors, setAmbassadors] = useState([]);
  const [finalists, setFinalists] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeMainTab, setActiveMainTab] = useState('duta'); // 'duta' | 'finalis'
  const isFinalistsPublic = Settings.isShowFinalistsPublic();

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

    // Load finalis dari local database & cloud
    const loadFinalists = () => {
      try {
        const dbApps = DB.getAll();
        const users = Auth.getUsers();
        const map = new Map();

        // Gabungkan data pelamar yang isFinalist / finalistStatus === 'finalis'
        [...dbApps, ...users].forEach((item) => {
          if (!item) return;
          const isFin = item.isFinalist || item.finalistStatus === 'finalis';
          if (!isFin) return;
          const key = (item.email || item.id || '').toLowerCase();
          if (!key) return;

          const existing = map.get(key) || {};
          const photoUrl = item.fotoProfil?.url || item.fotoProfil || item.docFotoLengkap?.url || item.docFotoLengkap || existing.img || '';

          map.set(key, {
            ...existing,
            ...item,
            id: item.id || existing.id || key,
            name: item.namaLengkap || item.fullName || item.name || existing.name || 'Finalis Duta Kampus',
            faculty: item.fakultas || existing.faculty || '',
            major: item.jurusan || existing.major || 'Finalis Duta Kampus',
            year: item.year || '2026',
            category: 'finalis',
            img: photoUrl
          });
        });

        setFinalists(Array.from(map.values()).slice(0, 20));
      } catch (err) {}
    };

    loadFinalists();
    fetchApplicantsFromCloud().then(loadFinalists).catch(() => {});

    window.addEventListener('storage', loadFinalists);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', loadFinalists);
    };
  }, []);

  // Compute available years dynamically combining preset years and items from data
  const availableYears = useMemo(() => {
    const set = new Set(AMBASSADOR_YEARS);
    ambassadors.forEach(a => {
      if (a.year) set.add(String(a.year).trim());
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [ambassadors]);

  // Filtered ambassadors (diurutkan descending: tahun terbaru paling atas, diikuti kategori/prioritas)
  const filteredAmbassadors = useMemo(() => {
    return ambassadors
      .filter((duta) => {
        const dutaYear = String(duta.year || '2025').trim();
        let dutaCategory = String(duta.category || 'duta_kampus').trim().toLowerCase();
        if (dutaCategory === 'winner') dutaCategory = 'utama';

        const matchYear = selectedYear === 'all' || dutaYear === selectedYear;
        const matchCategory = selectedCategory === 'all' || dutaCategory === selectedCategory.toLowerCase();

        return matchYear && matchCategory;
      })
      .sort((a, b) => {
        // Urutkan tahun terbaru di paling atas (misal 2026 di atas 2025)
        const yearA = parseInt(a.year || '2025', 10);
        const yearB = parseInt(b.year || '2025', 10);
        if (yearB !== yearA) {
          return yearB - yearA;
        }

        // Jika tahun sama, urutkan berdasarkan prioritas gelar duta
        const categoryPriority = {
          'utama': 1,
          'winner': 1,
          'wakil_1': 2,
          'digital_innovation': 3,
          'kip': 4,
          'sdgs_eco': 5,
          'sdgs_inklusivitas': 6,
          'sdgs_empowerment': 7,
          'intercultural_partnership': 8,
          'duta_kampus': 9
        };

        const catA = categoryPriority[a.category] || 99;
        const catB = categoryPriority[b.category] || 99;
        if (catA !== catB) {
          return catA - catB;
        }

        // Fallback urut ID / abjad
        return (a.id || 0) - (b.id || 0);
      });
  }, [ambassadors, selectedYear, selectedCategory]);

  return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ paddingTop: '100px', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-alt)' }}>
        <div className="container">
          <div className="section-header text-center" style={{ marginBottom: '1.5rem' }}>
            <h1 className="heading-lg">
              {activeMainTab === 'finalis' ? <>Daftar <span>Finalis Duta 2026</span></> : <>Profil <span>Duta Kampus</span></>}
            </h1>
            <p className="lead" style={{ margin: '0.5rem auto 1.5rem', maxWidth: '640px' }}>
              {activeMainTab === 'finalis'
                ? 'Mengenal para mahasiswa terpilih sebagai Finalis Pemilihan Duta Kampus UIN Siber Cirebon 2026.'
                : 'Mengenal representasi mahasiswa unggul dan inspiratif UIN Siber Syekh Nurjati Cirebon.'}
            </p>

            {/* SWITCH TAB DUTA KAMPUS & FINALIS (JIKA FINALIS AKTIF DARI ADMIN) */}
            {isFinalistsPublic && (
              <div style={{
                display: 'inline-flex',
                background: 'rgba(0, 18, 38, 0.8)', border: '1px solid rgba(0, 145, 255, 0.25)',
                padding: '4px',
                borderRadius: '9999px',
                gap: '4px',
                marginBottom: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveMainTab('duta')}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: activeMainTab === 'duta' ? 700 : 500,
                    background: activeMainTab === 'duta' ? '#0091ff' : 'transparent',
                    color: activeMainTab === 'duta' ? '#ffffff' : 'var(--text-mid)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Duta Kampus Resmi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMainTab('finalis')}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: activeMainTab === 'finalis' ? 700 : 500,
                    background: activeMainTab === 'finalis' ? '#0091ff' : 'transparent', boxShadow: activeMainTab === 'finalis' ? '0 2px 10px rgba(0, 145, 255, 0.45)' : 'none',
                    color: activeMainTab === 'finalis' ? 'var(--white)' : 'var(--white)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Finalis 2026 ({finalists.length})
                </button>
              </div>
            )}
          </div>

          {/* FILTER BAR MINIMALIS & SEJAJAR (CLEAN UI/UX) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1rem 0',
            marginBottom: '2rem',
            borderBottom: '1px solid var(--border)'
          }}>
            {/* Bagian Kiri: Kategori Tab Pills yang bisa di-scroll secara horizontal */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 300px', minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                overflowX: 'auto',
                maxWidth: '100%',
                paddingBottom: '4px',
                paddingRight: '1rem',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {AMBASSADOR_CATEGORIES.map(cat => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        whiteSpace: 'nowrap',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.825rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        border: isActive ? '1px solid #0091ff' : '1px solid rgba(0, 145, 255, 0.22)',
                        background: isActive ? '#0091ff' : 'linear-gradient(180deg, rgba(10, 26, 48, 0.6) 0%, rgba(2, 8, 18, 0.9) 100%)',
                        color: isActive ? '#ffffff' : '#e2e8f0',
                        boxShadow: isActive ? '0 4px 16px rgba(0, 145, 255, 0.45)' : '0 2px 8px rgba(0,0,0,0.3)',
                        borderRadius: '9999px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Penanda Geser Kategori */}
              <div className="filter-scroll-hint" style={{ marginLeft: '0.5rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18"/>
                </svg>
                <span className="desktop-only" style={{ fontSize: '0.72rem' }}>Geser</span>
                <span className="mobile-only" style={{ fontSize: '0.65rem' }}>Geser</span>
              </div>
            </div>

            {/* Bagian Kanan: Filter Tahun & Counter */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginLeft: 'auto'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>
                {filteredAmbassadors.length} Profil
              </span>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    padding: '0.5rem 2.2rem 0.5rem 0.9rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: '#050505',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    color: 'var(--white)',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <option value="all">Semua Tahun</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>Duta {year}</option>
                  ))}
                </select>
                <div style={{
                  position: 'absolute',
                  right: '10px',
                  pointerEvents: 'none',
                  color: 'var(--text-light)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {(selectedYear !== 'all' || selectedCategory !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setSelectedYear('all'); setSelectedCategory('all'); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.4rem 0.6rem'
                  }}
                  title="Reset Filter"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          
          {/* TAMPILAN KATALOG KARTU: DUTA ATAU FINALIS */}
          <div className="ambassador-grid">
            {(activeMainTab === 'finalis' ? finalists : filteredAmbassadors).map((duta) => {
              const media = duta.img ? parseMediaUrl(duta.img, duta.mediaType) : null;
              const categoryLabel = activeMainTab === 'finalis' ? 'Finalis Duta Kampus 2026' : getAmbassadorCategoryLabel(duta.category);
              const dutaYear = String(duta.year || (activeMainTab === 'finalis' ? '2026' : '2025'));

              return (
                <div 
                  key={duta.id || duta.email} 
                  className="ambassador-card"
                  style={{ cursor: duta.img ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (duta.img) {
                      setSelectedMedia({
                        url: duta.img,
                        title: duta.name || 'Profil Finalis / Duta Kampus',
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
                        background: 'linear-gradient(135deg, var(--navy) 0%, #0d1e2d 100%)',
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
                          background: 'rgba(104, 61, 151, 0.15)',
                          border: '2px solid var(--gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0091ff', textShadow: '0 0 12px rgba(0,145,255,0.4)',
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          letterSpacing: '1px'
                        }}>
                          {duta.name ? duta.name.split(' ').slice(0, 2).map(n => n[0]).join('') : 'DK'}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          {activeMainTab === 'finalis' ? 'Finalis Duta 2026' : 'Duta Kampus UINSSC'}
                        </span>
                      </div>
                    )}
                    {duta.faculty && (
                      <div className="ambassador-badge" style={{
                        background: 'rgba(0, 145, 255, 0.9)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: '0 2px 10px rgba(0, 145, 255, 0.4)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        fontWeight: 700
                      }}>
                        {abbreviateFaculty(duta.faculty)}
                      </div>
                    )}
                  </div>
                  <div className="ambassador-info">
                    {categoryLabel && (
                      <div style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#0091ff', textShadow: '0 0 12px rgba(0,145,255,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                      }}>
                        {categoryLabel}
                      </div>
                    )}
                    <h3>{duta.name}</h3>
                    <p style={{ color: '#e2e8f0', fontSize: '0.825rem', margin: '4px 0 0' }}>{duta.major || duta.faculty || (activeMainTab === 'finalis' ? 'Finalis Duta Kampus 2026' : 'Duta Kampus')}</p>
                    <span style={{ display: 'inline-block', marginTop: '6px', fontSize: '0.72rem', color: 'var(--white)', fontWeight: 600 }}>
                      {activeMainTab === 'finalis' ? 'Tahun Seleksi 2026' : `Angkatan ${dutaYear}`}
                    </span>
                  </div>
                </div>
              );
            })}
            {(activeMainTab === 'finalis' ? finalists : filteredAmbassadors).length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-light)', padding: '3.5rem 1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--white)', marginBottom: '0.5rem' }}>
                  {activeMainTab === 'finalis' ? 'Belum ada data finalis yang dipublikasikan.' : 'Tidak ada data profil Duta Kampus untuk filter ini.'}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-mid)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                  {activeMainTab === 'finalis' ? 'Silakan periksa kembali berkala atau kembali ke profil duta resmi.' : 'Silakan pilih kombinasi tahun angkatan atau kategori lainnya.'}
                </p>
                {activeMainTab !== 'finalis' && (
                  <button
                    type="button"
                    className="btn btn-outline-gold btn-sm"
                    onClick={() => { setSelectedYear('all'); setSelectedCategory('all'); }}
                  >
                    Reset Filter
                  </button>
                )}
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
