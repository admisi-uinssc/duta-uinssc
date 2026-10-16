'use client';

import Navbar from '../components/Navbar';
import BenefitsSection from '../components/BenefitsSection';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';

export default function BenefitsPage() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <BenefitsSection />
      </div>
      <CTABanner />
      <Footer />
    </>
  );
}
