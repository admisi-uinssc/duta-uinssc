import React, { useState, useEffect } from 'react';
import Link from '../components/Link';
import Image from '../components/Image';
import Navbar from '../components/Navbar';
import HeroSlider from '../components/HeroSlider';
import PromoBannerSlider from '../components/PromoBannerSlider';
import AboutSection from '../components/AboutSection';
import BenefitsSection from '../components/BenefitsSection';
import GallerySection from '../components/GallerySection';
import TimelineSection from '../components/TimelineSection';
import RequirementsSection from '../components/RequirementsSection';
import FAQSection from '../components/FAQSection';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';
import { CMS } from '../lib/cms';

export default function HomePage() {
  const [ambassadors, setAmbassadors] = useState([]);

  useEffect(() => {
    setAmbassadors((CMS.get().ambassadors || []).slice(0, 4));

    CMS.getAsync().then((data) => {
      if (data?.ambassadors) {
        setAmbassadors(data.ambassadors.slice(0, 4));
      }
    }).catch(() => {});

    const unsubscribe = CMS.subscribe((data) => {
      if (data && data.ambassadors) {
        setAmbassadors(data.ambassadors.slice(0, 4));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      <Navbar />
      <HeroSlider />
      
      {/* App Hub Menu (Hanya muncul di Mobile lewat CSS) */}
      <section className="hub-section mobile-only">
        <div className="container">
          <div className="hub-header" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Menu Informasi</h2>
          </div>

          <div className="hub-grid">
            <Link href="/daftar" className="hub-card">
              <div className="hub-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <span>Daftar</span>
            </Link>
            <Link href="/about" className="hub-card">
              <div className="hub-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <span>Tentang</span>
            </Link>
            <Link href="/profil-duta" className="hub-card">
              <div className="hub-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <span>Profil Duta</span>
            </Link>
            <Link href="/benefits" className="hub-card">
              <div className="hub-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <span>Manfaat</span>
            </Link>
            <Link href="/about" className="hub-card">
              <div className="hub-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M20.4 14.5L16 10 4 20"/></svg>
              </div>
              <span>Galeri</span>
            </Link>
            <Link href="/timeline" className="hub-card">
              <div className="hub-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <span>Jadwal</span>
            </Link>
            <Link href="/requirements" className="hub-card">
              <div className="hub-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <span>Persyaratan</span>
            </Link>
            <Link href="/faq" className="hub-card">
              <div className="hub-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <span>FAQ</span>
            </Link>
          </div>
          
          <div className="hub-news" style={{ marginTop: '2.5rem' }}>
            <h3>Informasi Terbaru</h3>
            <div className="news-list">
              <div className="news-item"><div className="news-dot"></div><p>Pendaftaran Duta Kampus 2026 telah dibuka. Pastikan Anda membaca persyaratan sebelum mendaftar.</p></div>
              <div className="news-item"><div className="news-dot"></div><p>Siapkan berkas administrasi seperti KTM, Transkrip Nilai, dan Surat Keterangan Aktif Kuliah.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banner Slider (Mobile - Tepat di bawah Menu Informasi) */}
      <div className="mobile-only">
        <PromoBannerSlider />
      </div>

      {/* Desktop Sections (Hanya muncul di Desktop lewat CSS) */}
      <div className="desktop-sections desktop-only">
        <AboutSection />
        <BenefitsSection />
      </div>

      {/* Featured Ambassadors Showcase (CMS synced) */}
      {ambassadors.length > 0 && (
        <section className="section-pad bg-alt" style={{ padding: '4rem 0' }}>
          <div className="container">
            <div className="section-header" style={{ marginBottom: '2.5rem' }}>
              <h2 className="heading-lg" style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>
                Profil <span>Duta Kampus</span>
              </h2>
              <p className="lead" style={{ margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
                Wajah inspiratif mahasiswa UIN Siber Syekh Nurjati Cirebon yang berprestasi dan berintegritas.
              </p>
            </div>

            <div className="ambassador-grid" style={{ marginBottom: '2.5rem' }}>
              {ambassadors.map((duta) => (
                <div key={duta.id} className="ambassador-card">
                  <div className="ambassador-img-wrapper" style={{ position: 'relative' }}>
                    {duta.img && !duta.img.includes('unsplash.com') ? (
                      <Image 
                        src={duta.img} 
                        alt={duta.name} 
                        fill 
                        style={{ objectFit: 'cover' }} 
                        fallbackSrc="/assets/logo-circle.png"
                      />
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
                    <h3>{duta.name}</h3>
                    <p>{duta.major || duta.faculty || 'Duta Kampus'}</p>
                    {duta.year && (
                      <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600 }}>
                        Angkatan {duta.year}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link href="/profil-duta" className="btn btn-outline-gold" style={{ padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>Lihat Seluruh Profil Duta ({CMS.get().ambassadors?.length || 20})</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section - Show on both Desktop and Mobile */}
      <GallerySection />

      <div className="desktop-sections desktop-only">
        <TimelineSection />
        {/* Promo Banner Slider (Desktop) */}
        <PromoBannerSlider />
        <RequirementsSection />
        <FAQSection />
      </div>

      <CTABanner />
      <Footer />
    </>
  );
}
