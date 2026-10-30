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
    // Initial fetch from memory / cache
    setSlides(CMS.get().slider || []);

    // Eager live fetch directly from Cloud Firestore
    CMS.getAsync().then((data) => {
      if (data?.slider) {
        setSlides([...data.slider]);
      }
    }).catch(() => {});

    // Subscribe to live CMS updates
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
            {/* Visual Media: Autoplaying Video or Image */}
            {parsed.isVideo ? (
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                {parsed.source === 'youtube' ? (
                  <iframe
                    src={parsed.autoplayEmbedUrl || `https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=1&mute=1&loop=1&playlist=${parsed.videoId}&controls=0&showinfo=0&rel=0&playsinline=1`}
                    title="Video Hero"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      minWidth: '100%',
                      minHeight: '100%',
                      pointerEvents: 'none'
                    }}
                    allow="autoplay; encrypted-media; picture-in-picture"
                  />
                ) : parsed.source === 'drive' ? (
                  <iframe
                    src={parsed.autoplayEmbedUrl || `https://drive.google.com/file/d/${parsed.videoId}/preview`}
                    title="Video Hero"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      minWidth: '100%',
                      minHeight: '100%'
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
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
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

            {/* Slide Text Content: Only rendered if text actually exists */}
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
