import Hero from '@/features/landing/components/Hero';
import Stats from '@/features/landing/components/Stats';
import About from '@/features/landing/components/About';
import Services from '@/features/landing/components/Services';
import News from '@/features/landing/components/News';
import Gallery from '@/features/landing/components/Gallery';
import CTASection from '@/features/landing/components/CTASection';
import Footer from '@/features/landing/components/Footer';

export default function Home() {
  return (
    <div className="bg-white text-slate-900">
      <Hero />
      <Stats />
      <About />
      <Services />
      <News />
      <Gallery />
      <CTASection />
      <Footer />
    </div>
  );
}
