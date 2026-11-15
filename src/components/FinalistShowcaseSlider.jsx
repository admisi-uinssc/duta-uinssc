import React, { useState, useEffect, useRef } from 'react';
import Image from './Image';
import { CMS } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';
import { DB } from '../lib/db';
import { Auth } from '../lib/auth';
import { fetchApplicantsFromCloud } from '../lib/firebase';
import MediaModal from './MediaModal';

export default function FinalistShowcaseSlider() {
  const [cmsData, setCmsData] = useState(CMS.get());
  const [finalists, setFinalists] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const unsub = CMS.subscribe((data) => {
      if (data) setCmsData(data);
    });

    const loadFinalists = () => {
      try {
        const customList = (CMS.get().finalists || []);
        const dbApps = DB.getAll();
        const users = Auth.getUsers();
        const map = new Map();

        // 1. Masukkan dari custom CMS jika ada
        customList.forEach((c, idx) => {
          if (!c) return;
          const k = String(c.id || c.email || idx);
          map.set(k, {
            id: k,
            name: c.name || 'Finalis Duta Kampus',
            faculty: c.faculty || '',
            major: c.major || '',
            year: c.year || '2026',
            img: c.img || ''
          });
        });

        // 2. Gabungkan dari pendaftar yang berstatus finalis
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
            img: photoUrl
          });
        });

        setFinalists(Array.from(map.values()));
      } catch (err) {}
    };

    loadFinalists();
    fetchApplicantsFromCloud().then(loadFinalists).catch(() => {});

    window.addEventListener('storage', loadFinalists);
    return () => {
      unsub();
      window.removeEventListener('storage', loadFinalists);
    };
  }, []);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollBy = (offset) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Cek apakah fitur showcase finalis diaktifkan oleh admin (via CMS.finalistShowcase.enabled)
  const isEnabled = cmsData.finalistShowcase?.enabled !== false;
  if (!isEnabled || finalists.length === 0) {
    return null;
  }

  const sectionTitle = cmsData.finalistShowcase?.title || 'Sorotan Finalis Duta Kampus 2026';
  const sectionSubtitle = cmsData.finalistShowcase?.subtitle || 'Representasi mahasiswa berprestasi dan berdaya saing global UIN Siber Syekh Nurjati Cirebon.';

  return (
    <section 
      className="finalist-showcase-section"
      style={{
        padding: '3.5rem 0',
        background: 'linear-gradient(180deg, #0d1e2d 0%, #16324A 100%)',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Header Section dengan Navigasi Panah */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'rgba(196, 158, 89, 0.2)',
              border: '1px solid rgba(196, 158, 89, 0.4)',
              color: '#ffd88a',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
              marginBottom: '0.5rem'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
              FINALIS RESMI 2026 ({finalists.length} PESERTA)
            </div>
            <h2 style={{
              fontFamily: '"Instrument Serif", "Times New Roman", Georgia, serif',
              fontSize: '2.4rem',
              fontWeight: 400,
              color: '#ffffff',
              margin: '0 0 0.35rem',
              lineHeight: 1.15
            }}>
              {sectionTitle}
            </h2>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.75)',
              margin: 0,
              maxWidth: '620px'
            }}>
              {sectionSubtitle}
            </p>
          </div>

          {/* Tombol Geser / Slider Controls */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => scrollBy(-320)}
              disabled={!canScrollLeft}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: canScrollLeft ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: canScrollLeft ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canScrollLeft ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
              title="Geser Sebelumnya"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              type="button"
              onClick={() => scrollBy(320)}
              disabled={!canScrollRight}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: canScrollRight ? 'var(--gold)' : 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: canScrollRight ? '#16324A' : 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canScrollRight ? 'pointer' : 'default',
                transition: 'all 0.2s',
                fontWeight: 700
              }}
              title="Geser Selanjutnya"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* Horizontal Slider Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          style={{
            display: 'flex',
            gap: '1.25rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: '1rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {finalists.map((f, idx) => {
            const media = f.img ? parseMediaUrl(f.img, f.mediaType) : null;
            return (
              <div
                key={f.id || idx}
                onClick={() => {
                  if (f.img) {
                    setSelectedMedia({
                      url: f.img,
                      title: f.name || 'Finalis Duta Kampus 2026',
                      caption: `${f.name} · Finalis Duta Kampus 2026 · ${f.major || f.faculty || 'UIN Siber Cirebon'}`,
                      mediaType: f.mediaType
                    });
                  }
                }}
                style={{
                  flex: '0 0 230px',
                  scrollSnapAlign: 'start',
                  background: '#16324A',
                  borderRadius: '16px',
                  border: '1px solid rgba(196, 158, 89, 0.3)',
                  overflow: 'hidden',
                  cursor: f.img ? 'pointer' : 'default',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  position: 'relative'
                }}
              >
                {/* Frame Foto Finalis */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '3 / 4',
                  background: '#0d1e2d',
                  overflow: 'hidden'
                }}>
                  {f.img && !f.img.includes('unsplash.com') ? (
                    <Image
                      src={media?.thumbnailUrl || f.img}
                      alt={f.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      fallbackSrc="/assets/logo-circle.png"
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #16324A 0%, #0d1e2d 100%)',
                      color: 'var(--gold)',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(196, 158, 89, 0.15)',
                        border: '2px solid var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.2rem'
                      }}>
                        {f.name ? f.name.split(' ').slice(0, 2).map(n => n[0]).join('') : 'DK'}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>
                        FINALIS 2026
                      </span>
                    </div>
                  )}

                  {/* Badge Tahun & Fakultas */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'var(--gold)',
                    color: '#16324A',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px'
                  }}>
                    FINALIS
                  </div>
                </div>

                {/* Info Text */}
                <div style={{ padding: '1rem 0.85rem 1.15rem', textAlign: 'center' }}>
                  <h4 style={{
                    fontFamily: '"Instrument Serif", "Times New Roman", Georgia, serif',
                    fontSize: '1.25rem',
                    fontWeight: 400,
                    color: '#ffffff',
                    margin: '0 0 4px',
                    lineHeight: 1.15,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {f.name}
                  </h4>
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.75rem',
                    color: '#cbd5e1',
                    margin: 0,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {f.major || f.faculty || 'Finalis Duta Kampus 2026'}
                  </p>
                  {f.faculty && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      fontSize: '0.68rem',
                      color: '#ffd88a',
                      fontWeight: 600
                    }}>
                      {f.faculty}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MediaModal
        isOpen={Boolean(selectedMedia)}
        onClose={() => setSelectedMedia(null)}
        item={selectedMedia}
        fallbackTitle="Profil Finalis Duta Kampus 2026"
      />
    </section>
  );
}
