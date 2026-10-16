'use client';

import Navbar from '../../components/Navbar';
import FAQSection from '../../components/FAQSection';
import CTABanner from '../../components/CTABanner';
import Footer from '../../components/Footer';

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <FAQSection />
      </div>
      <CTABanner />
      <Footer />
    </>
  );
}
