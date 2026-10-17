import React, { useEffect, useRef, useState } from 'react';
import Link from './Link';
import Image from './Image';
import { CMS } from '../lib/cms';

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
      {slides.map((slide, idx) => (
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
              <div className="slide-actions">
                <Link
                  href={slide.btnLink || '/daftar'}
                  className="btn btn-gold btn-lg"
                  style={{ textDecoration: 'none' }}
                >
                  {slide.btnText || 'Daftar Sekarang'}
                </Link>
                <Link
                  href="/requirements"
                  className="btn btn-outline-gold btn-lg"
                  style={{ marginLeft: '1rem', textDecoration: 'none', background: 'rgba(22, 50, 74, 0.4)' }}
                >
                  Persyaratan
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

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
    </section>
  );
}
