import React, { useEffect, useRef, useState } from 'react';
import Link from './Link';
import Image from './Image';
import { CMS } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    setSlides(CMS.get().slider || []);

    CMS.getAsync().then((data) => {
      if (data?.slider) {
        setSlides([...data.slider]);
      }
    }).catch(() => {});

    const unsubscribe = CMS.subscribe((data) => {
      if (data && data.slider) {
        setSlides([...data.slider]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const goTo = (idx) => {
    if (slides.length === 0) return;
    setCurrent((idx + slides.length) % slides.length);
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % slides.length);
      }, 7000);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const handleGoTo = (idx) => {
    goTo(idx);
    resetTimer();
  };

  if (slides.length === 0) return null;

  return (
    <section className="hero-slider" id="heroSlider">
      {slides.map((slide, idx) => {
        const parsed = parseMediaUrl(slide.img, slide.mediaType);
        const hasTitle = Boolean(slide.title1?.trim() || slide.title2?.trim());
        const hasDesc = Boolean(slide.desc?.trim());
        const hasBtn = Boolean(slide.btnText?.trim());
        const hasTag = Boolean(slide.tag?.trim());
        const hasAnyText = hasTitle || hasDesc || hasBtn || hasTag;

        return (
          <div key={slide.id || idx} className={`slide ${idx === current ? 'active' : ''}`}>
            {/* Visual Media: Murni pemanis visual (foto atau video yang berputar otomatis tanpa tombol/tautan ke sumber) */}
            {parsed.isVideo ? (
              <div 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  overflow: 'hidden', 
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              >
                {parsed.source === 'youtube' ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=1&mute=1&loop=1&playlist=${parsed.videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&playsinline=1`}
                    title="Visual Background"
                    style={{
                      width: '130%',
                      height: '130%',
                      border: 'none',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none'
                    }}
                    allow="autoplay; encrypted-media"
                  />
                ) : parsed.source === 'drive' ? (
                  <iframe
                    src={`https://drive.google.com/file/d/${parsed.videoId}/preview`}
                    title="Visual Background"
                    style={{
                      width: '135%',
                      height: '135%',
                      border: 'none',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none'
                    }}
                    allow="autoplay"
                  />
                ) : (
                  <video
                    className="slide-img"
                    src={parsed.directVideoUrl || slide.img}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      position: 'absolute', 
                      inset: 0, 
                      pointerEvents: 'none' 
                    }}
                  />
                )}
              </div>
            ) : (
              <Image
                className="slide-img"
                src={slide.img}
                alt=""
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            )}

            {/* Konten teks hanya tampil jika ada teks yang diisi di CMS. Jika kosong, tidak ada overlay maupun wadah teks */}
            {hasAnyText && (
              <>
                <div className="slide-overlay" />
                <div className="slide-content">
                  <div className="slide-text">
                    {hasTag && <span className="slide-tag">{slide.tag}</span>}
                    {hasTitle && (
                      <h1 className="slide-title">
                        {slide.title1}
                        {slide.title2 && (
                          <>
                            <br />
                            <span>{slide.title2}</span>
                          </>
                        )}
                      </h1>
                    )}
                    {hasDesc && <p className="slide-desc">{slide.desc}</p>}
                    {hasBtn && (
                      <div className="slide-actions">
                        <Link
                          href={slide.btnLink || '/daftar'}
                          className="btn btn-gold btn-lg"
                          style={{ textDecoration: 'none' }}
                        >
                          {slide.btnText}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {slides.length > 1 && (
        <div className="slider-nav">
          <div className="slider-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                className={`slider-dot ${idx === current ? 'active' : ''}`}
                onClick={() => handleGoTo(idx)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
