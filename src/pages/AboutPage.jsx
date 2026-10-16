'use client';

import Navbar from '../components/Navbar';
import AboutSection from '../components/AboutSection';
import BenefitsSection from '../components/BenefitsSection';
import GallerySection from '../components/GallerySection';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper about-page-wrapper">
        {/* Khusus Tampilan HP: Galeri Duta Kampus muncul paling atas */}
        <div className="about-gallery-mobile-top">
          <GallerySection />
        </div>

        <AboutSection />
        <BenefitsSection />

        {/* Tampilan Desktop: Galeri muncul di bagian bawah */}
        <div className="about-gallery-desktop-bottom">
          <GallerySection />
        </div>
      </div>
      <CTABanner />
      <Footer />
    </>
  );
}
