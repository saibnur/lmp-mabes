import Hero from '@/app/components/landing/Hero';
import Stats from '@/app/components/landing/Stats';
import About from '@/app/components/landing/About';
import Services from '@/app/components/landing/Services';
import News from '@/app/components/landing/News';
import Gallery from '@/app/components/landing/Gallery';
import CTASection from '@/app/components/landing/CTASection';
import Footer from '@/app/components/landing/Footer';

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
