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
  const [isHovered, setIsHovered] = useState(false);

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

        // 2. Gabungkan dari pelamar yang berstatus finalis
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

  const scrollByOffset = (offset) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Auto slide di Desktop (setiap 3.5 detik berjalan otomatis jika kursor tidak dihover)
  useEffect(() => {
    if (finalists.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const el = scrollRef.current;
      const cardWidth = 240;
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 15) {
        // Kembali ke titik awal secara halus
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [finalists.length, isHovered]);

  // Cek apakah fitur showcase finalis diaktifkan oleh admin (via CMS.finalistShowcase.enabled)
  const isEnabled = cmsData.finalistShowcase?.enabled !== false;
  if (!isEnabled || finalists.length === 0) {
    return null;
  }

  const sectionTitle = cmsData.finalistShowcase?.title || 'Finalis Duta Kampus 2026';
  const sectionSubtitle = cmsData.finalistShowcase?.subtitle || 'Representasi mahasiswa berprestasi dan berdaya saing global UIN Siber Syekh Nurjati Cirebon.';

  return (
    <section 
      className="finalist-showcase-section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container">
        {/* Header Section: Minimalis, Clean, Bebas dari Pill Badge & Bebas dari Eyebrow Text */}
        <div className="finalist-header-row">
          <div>
            <h2 className="finalist-section-title">
              {sectionTitle}
            </h2>
            <p className="finalist-section-subtitle">
              {sectionSubtitle}
            </p>
          </div>

          {/* Desktop Only: Navigasi Panah Geser Manual */}
          <div className="finalist-nav-arrows desktop-only">
            <button
              type="button"
              onClick={() => scrollByOffset(-300)}
              disabled={!canScrollLeft}
              className={`finalist-arrow-btn ${canScrollLeft ? 'active' : ''}`}
              title="Geser Sebelumnya"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByOffset(300)}
              disabled={!canScrollRight}
              className={`finalist-arrow-btn ${canScrollRight ? 'active' : ''}`}
              title="Geser Selanjutnya"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* Horizontal Slider Container (Desktop: Auto-slide & Smooth Scroll; HP: Native Swipe Card Scroll) */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="finalist-slider-track"
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
                className="finalist-slide-card"
              >
                {/* Frame Foto Finalis */}
                <div className="finalist-slide-img-wrap">
                  {f.img && !f.img.includes('unsplash.com') ? (
                    <Image
                      src={media?.thumbnailUrl || f.img}
                      alt={f.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      fallbackSrc="/assets/logo-circle.png"
                    />
                  ) : (
                    <div className="finalist-avatar-fallback">
                      <div className="finalist-avatar-initials">
                        {f.name ? f.name.split(' ').slice(0, 2).map(n => n[0]).join('') : 'DK'}
                      </div>
                      <span className="finalist-avatar-caption">
                        FINALIS 2026
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Text: Clean, Ramping, Elegan */}
                <div className="finalist-slide-info">
                  <h4>{f.name}</h4>
                  <p>{f.major || f.faculty || 'Finalis Duta Kampus 2026'}</p>
                  {f.faculty && (
                    <span className="finalist-slide-faculty">
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
