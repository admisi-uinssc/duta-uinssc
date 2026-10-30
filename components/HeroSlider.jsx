import React, { useEffect, useRef, useState } from 'react';
import Link from './Link';
import Image from './Image';
import { CMS } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';

function SlideMediaItem({ slide, parsed, isActive }) {
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      if (isActive) {
        const startPlay = () => {
          const p = video.play();
          if (p !== undefined) p.catch(() => {});
        };

        if (video.readyState >= 2) {
          startPlay();
        } else {
          video.addEventListener('loadeddata', startPlay, { once: true });
          video.addEventListener('canplay', startPlay, { once: true });
          startPlay();
        }
      } else {
        video.pause();
      }
    }

    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        const cmd = isActive
          ? '{"event":"command","func":"playVideo","args":""}'
          : '{"event":"command","func":"pauseVideo","args":""}';
        iframe.contentWindow.postMessage(cmd, '*');
      } catch {}
    }
  }, [isActive]);

  if (!parsed.isVideo) {
    return (
      <Image
        className="slide-img"
        src={slide.img}
        alt=""
        loading={isActive ? 'eager' : 'lazy'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          aspectRatio: '1920 / 1080',
          position: 'absolute',
          inset: 0
        }}
      />
    );
  }

  return (
    <div 
      style={{ 
        position: 'absolute', 
        inset: 0, 
        width: '100%',
        height: '100%',
        aspectRatio: '1920 / 1080',
        overflow: 'hidden', 
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      {parsed.source === 'youtube' ? (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${parsed.videoId}&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
          title="Visual Background"
          style={{
            width: '135%',
            height: '135%',
            aspectRatio: '1920 / 1080',
            border: 'none',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : parsed.source === 'drive' ? (
        <iframe
          ref={iframeRef}
          src={`https://drive.google.com/file/d/${parsed.videoId}/preview?autoplay=1`}
          title="Visual Background"
          style={{
            width: '135%',
            height: '135%',
            aspectRatio: '1920 / 1080',
            border: 'none',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
          allow="autoplay; fullscreen; encrypted-media"
        />
      ) : (
        <video
          ref={videoRef}
          className="slide-img"
          src={parsed.directVideoUrl || slide.img}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            e.currentTarget.muted = true;
            e.currentTarget.defaultMuted = true;
            if (isActive) {
              const p = e.currentTarget.play();
              if (p !== undefined) p.catch(() => {});
            }
          }}
          onCanPlay={(e) => {
            e.currentTarget.muted = true;
            e.currentTarget.defaultMuted = true;
            if (isActive) {
              const p = e.currentTarget.play();
              if (p !== undefined) p.catch(() => {});
            }
          }}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            objectPosition: 'center', 
            aspectRatio: '1920 / 1080',
            position: 'absolute', 
            inset: 0, 
            pointerEvents: 'none' 
          }}
        />
      )}
    </div>
  );
}

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

  // Global browser autoplay unlocker on first user interaction
  useEffect(() => {
    const unlock = () => {
      const activeVideo = document.querySelector('.hero-slider .slide.active video');
      if (activeVideo) {
        activeVideo.muted = true;
        activeVideo.defaultMuted = true;
        activeVideo.play().catch(() => {});
      }
      const activeIframe = document.querySelector('.hero-slider .slide.active iframe');
      if (activeIframe && activeIframe.contentWindow) {
        try {
          activeIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } catch {}
      }
    };
    const events = ['click', 'touchstart', 'scroll', 'pointerdown', 'keydown'];
    events.forEach(ev => window.addEventListener(ev, unlock, { passive: true }));
    return () => {
      events.forEach(ev => window.removeEventListener(ev, unlock));
    };
  }, []);

  const handleGoTo = (idx) => {
    goTo(idx);
    resetTimer();
  };

  if (slides.length === 0) return null;

  return (
    <section 
      className="hero-slider" 
      id="heroSlider" 
      style={{ 
        width: '100%', 
        aspectRatio: '1920 / 1080', 
        height: 'auto',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {slides.map((slide, idx) => {
        const parsed = parseMediaUrl(slide.img, slide.mediaType);
        const isActive = idx === current;
        const hasTitle = Boolean(slide.title1?.trim() || slide.title2?.trim());
        const hasDesc = Boolean(slide.desc?.trim());
        const hasBtn = Boolean(slide.btnText?.trim());
        const hasTag = Boolean(slide.tag?.trim());
        const hasAnyText = hasTitle || hasDesc || hasBtn || hasTag;

        return (
          <div 
            key={slide.id || idx} 
            className={`slide ${isActive ? 'active' : ''}`} 
            style={{ 
              width: '100%', 
              height: '100%', 
              aspectRatio: '1920 / 1080',
              position: 'absolute',
              inset: 0
            }}
          >
            {/* Visual Media: Pemanis visual foto atau video */}
            <SlideMediaItem slide={slide} parsed={parsed} isActive={isActive} />

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
