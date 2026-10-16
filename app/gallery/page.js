'use client';

import Navbar from '../../components/Navbar';
import GallerySection from '../../components/GallerySection';
import CTABanner from '../../components/CTABanner';
import Footer from '../../components/Footer';

export default function GalleryPage() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <GallerySection />
      </div>
      <CTABanner />
      <Footer />
    </>
  );
}
