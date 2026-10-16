import React, { useState, useEffect, useRef } from 'react';
import Image from './Image';
import Link from './Link';
import { CMS } from '../lib/cms';

export default function PromoBannerSlider() {
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    setBanners(CMS.get().promoBanners || []);
    const unsubscribe = CMS.subscribe((data) => {
      if (data && data.promoBanners) {
        setBanners([...data.promoBanners]);
      }
    });

    const heartbeat = setInterval(() => {
      const currentCms = CMS.get();
      if (currentCms && currentCms.promoBanners) {
        setBanners([...currentCms.promoBanners]);
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(heartbeat);
    };
  }, []);

  // Auto slide logic
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => {
        const nextIndex = (current + 1) % banners.length;
        if (scrollRef.current) {
          const slideWidth = scrollRef.current.clientWidth;
          scrollRef.current.scrollTo({
            left: slideWidth * nextIndex,
            behavior: 'smooth'
          });
        }
        return nextIndex;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Handle manual scroll to update active index for dots
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const slideWidth = scrollRef.current.clientWidth;
    const newIndex = Math.round(scrollLeft / slideWidth);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  if (banners.length === 0) return null;

  return (
    <section className="promo-banner-section" style={{ padding: '1rem 0 2.5rem', background: 'var(--bg-alt)' }}>
      <div className="promo-container">
        <div 
          className="promo-slider" 
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            scrollSnapType: 'x mandatory', 
            gap: '1rem', 
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '0.5rem'
          }}
        >
          {banners.map((banner, idx) => (
            <Link 
              key={banner.id || idx} 
              href={banner.link || '/daftar'} 
              className="promo-slide"
              style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'center',
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(22, 50, 74, 0.08)',
                display: 'block',
                textDecoration: 'none'
              }}
            >
              <div className="promo-image-wrapper" style={{ position: 'relative' }}>
                <Image 
                  src={banner.img || 'https://ppid.uinssc.ac.id/storage/duta-kampus/01KRX8ZRGXBTT2929HWZQ7CWMM.png'} 
                  alt={banner.title || 'Promo Banner Duta Kampus'} 
                  fill 
                  style={{ objectFit: 'cover' }}
                />
                <div 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to right, rgba(22, 50, 74, 0.75) 0%, rgba(22, 50, 74, 0.25) 60%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1.5rem 2.5rem'
                  }}
                >
                  <div style={{ maxWidth: '520px', color: '#fff' }}>
                    {banner.title && (
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.35rem' }}>
                        {banner.title}
                      </h3>
                    )}
                    {banner.subtitle && (
                      <p style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0, fontWeight: 400 }}>
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Indicators */}
        {banners.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1rem' }}>
            {banners.map((_, idx) => (
              <button 
                key={idx} 
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => {
                  setActiveIndex(idx);
                  if (scrollRef.current) {
                    const slideWidth = scrollRef.current.clientWidth;
                    scrollRef.current.scrollTo({ left: slideWidth * idx, behavior: 'smooth' });
                  }
                }}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  width: activeIndex === idx ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: activeIndex === idx ? 'var(--gold)' : 'rgba(22, 50, 74, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
