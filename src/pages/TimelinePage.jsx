'use client';

import Navbar from '../components/Navbar';
import TimelineSection from '../components/TimelineSection';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';

export default function TimelinePage() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <TimelineSection />
      </div>
      <CTABanner />
      <Footer />
    </>
  );
}
