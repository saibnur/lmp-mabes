import { Link } from "react-router-dom";
import { ArrowRight, Search, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import heroFood from "@/assets/hero-food.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-36 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="max-w-xl animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              Mendukung Program MBG Nasional
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Bahan Pangan{" "}
              <span className="gradient-text">Segar & Berkualitas</span> untuk
              Dapur MBG
            </h1>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              FreshPasar oleh KPPI menyediakan sayuran, buah-buahan, dan protein
              segar langsung dari pedagang pasar lokal untuk mendukung program
              Makan Bergizi Gratis di seluruh Indonesia.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button asChild variant="hero" size="xl">
                <Link to="/katalog">
                  Lihat Katalog
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline-hero" size="xl">
                <Link to="/lacak">
                  <Search className="w-5 h-5 mr-2" />
                  Lacak Pesanan
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div>
                <p className="text-2xl md:text-3xl font-bold gradient-text">
                  500+
                </p>
                <p className="text-sm text-muted-foreground">Dapur MBG</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold gradient-text">
                  1000+
                </p>
                <p className="text-sm text-muted-foreground">Produk Tersedia</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold gradient-text">
                  99%
                </p>
                <p className="text-sm text-muted-foreground">Tepat Waktu</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-fade-in">
            <div className="relative z-10">
              <img
                src={heroFood}
                alt="Fresh vegetables and fruits for MBG program"
                className="w-full h-auto rounded-3xl shadow-2xl object-cover"
              />

              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 glass-card p-4 shadow-xl animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <span className="text-2xl">🥬</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Sayuran Segar</p>
                    <p className="text-xs text-muted-foreground">
                      Dipanen hari ini
                    </p>
                  </div>
                </div>
              </div>

              {/* Another Floating Card */}
              <div className="absolute -top-4 -right-4 glass-card p-4 shadow-xl animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <span className="text-2xl">🍊</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Buah Pilihan</p>
                    <p className="text-xs text-muted-foreground">
                      Kualitas terjamin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full border-2 border-dashed border-primary/20" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
