'use client';

import Navbar from '../components/Navbar';
import AboutSection from '../components/AboutSection';
import BenefitsSection from '../components/BenefitsSection';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <AboutSection />
        <BenefitsSection />
      </div>
      <CTABanner />
      <Footer />
    </>
  );
}
