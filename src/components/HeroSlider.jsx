import React, { useEffect, useRef, useState } from 'react';
import Link from './Link';
import Image from './Image';
import { CMS } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';
import MediaModal from './MediaModal';

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
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
      }, 6500);
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
        return (
          <div key={slide.id || idx} className={`slide ${idx === current ? 'active' : ''}`}>
            <Image
              className="slide-img"
              src={slide.img}
              alt={`Slide ${idx + 1}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
            <div className="slide-overlay" />
            <div className="slide-content">
              <div className="slide-text">
                <h1 className="slide-title">
                  {slide.title1}
                  {slide.title2 && (
                    <>
                      <br />
                      <span>{slide.title2}</span>
                    </>
                  )}
                </h1>
                <p className="slide-desc">{slide.desc}</p>
                <div className="slide-actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <Link
                    href={slide.btnLink || '/daftar'}
                    className="btn btn-gold btn-lg"
                    style={{ textDecoration: 'none' }}
                  >
                    {slide.btnText || 'Daftar Sekarang'}
                  </Link>

                  {parsed.isVideo ? (
                    <button
                      type="button"
                      onClick={() => setSelectedVideo(slide)}
                      className="btn btn-outline-gold btn-lg"
                      style={{
                        textDecoration: 'none',
                        background: 'rgba(22, 50, 74, 0.7)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#C49E59"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      <span>Tonton Video</span>
                    </button>
                  ) : (
                    <Link
                      href="/requirements"
                      className="btn btn-outline-gold btn-lg"
                      style={{ textDecoration: 'none', background: 'rgba(22, 50, 74, 0.4)' }}
                    >
                      Persyaratan
                    </Link>
                  )}
                </div>
              </div>
            </div>
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
                aria-label={`Ke slide ${idx + 1}`}
                className={`slider-dot ${idx === current ? 'active' : ''}`}
                onClick={() => handleGoTo(idx)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Video Modal if slide is a video */}
      <MediaModal
        isOpen={Boolean(selectedVideo)}
        onClose={() => setSelectedVideo(null)}
        item={selectedVideo}
        fallbackTitle="Video Hero Duta Kampus"
      />
    </section>
  );
}
