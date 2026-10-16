'use client';

import Navbar from '../components/Navbar';
import RequirementsSection from '../components/RequirementsSection';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';

export default function RequirementsPage() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <RequirementsSection />
      </div>
      <CTABanner />
      <Footer />
    </>
  );
}
