'use client';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import CallToAction from '../components/home/CallToAction';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Wrap header + hero in same gradient to remove white gap */}
      <div className="relative" style={{
        background: 'linear-gradient(180deg, #0C3C5C 0%, #3B7C8A 100%)'
      }}>
        <Header />
        <HeroSection />
      </div>
      <main>
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}

