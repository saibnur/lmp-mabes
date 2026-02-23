import { Leaf, Truck, ShieldCheck, Users } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "Segar dari Petani",
    description:
      "Bahan pangan langsung dari petani lokal, dipanen hari itu juga untuk menjamin kesegaran.",
  },
  {
    icon: Truck,
    title: "Pengiriman Tepat Waktu",
    description:
      "Armada logistik kami siap mengantar pesanan ke Dapur MBG sesuai jadwal yang ditentukan.",
  },
  {
    icon: ShieldCheck,
    title: "Jaminan Kualitas",
    description:
      "Setiap produk melewati quality control ketat untuk memastikan standar gizi terpenuhi.",
  },
  {
    icon: Users,
    title: "Mendukung Pedagang Lokal",
    description:
      "Koperasi pedagang pasar yang memberdayakan ekonomi lokal dan UMKM Indonesia.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Mengapa Memilih <span className="gradient-text">FreshPasar</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Kami berkomitmen menyediakan bahan pangan terbaik untuk mendukung
            program Makan Bergizi Gratis di seluruh Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-6 md:p-8 hover-lift group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
