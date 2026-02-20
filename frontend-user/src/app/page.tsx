import Navbar from '@/components/landing/Navbar';
import LandingBottomNav from '@/components/landing/LandingBottomNav';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import About from '@/components/landing/About';
import Services from '@/components/landing/Services';
import News from '@/components/landing/News';
import Gallery from '@/components/landing/Gallery';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <About />
        <Services />
        <News />
        <Gallery />
        <CTASection />
        <Footer />
      </main>
      <LandingBottomNav />
    </div>
  );
}
