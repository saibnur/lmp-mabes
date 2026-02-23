import { ClipboardList, PackageCheck, Truck, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Pilih Bahan Pangan",
    description:
      "Browse katalog lengkap sayur, buah, dan protein segar. Tentukan jumlah sesuai kebutuhan dapur.",
  },
  {
    icon: PackageCheck,
    step: "02",
    title: "Konfirmasi Pesanan",
    description:
      "Tim kami akan memverifikasi pesanan dan memberikan konfirmasi beserta estimasi pengiriman.",
  },
  {
    icon: Truck,
    step: "03",
    title: "Proses Pengiriman",
    description:
      "Pesanan dikemas dengan standar cold-chain dan dikirim langsung ke lokasi Dapur MBG.",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Terima & Verifikasi",
    description:
      "Tim dapur menerima pesanan, melakukan pengecekan kualitas, dan mengkonfirmasi penerimaan.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Cara Kerja
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Proses Pemesanan yang{" "}
            <span className="gradient-text">Mudah & Cepat</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Hanya dengan 4 langkah sederhana, bahan pangan segar siap diantar ke
            Dapur MBG Anda.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-30" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center group">
                {/* Step Number Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-block px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold">
                    {step.step}
                  </span>
                </div>

                {/* Icon Container */}
                <div className="w-20 h-20 mx-auto rounded-3xl bg-card border-2 border-primary/20 flex items-center justify-center mb-6 group-hover:border-primary/50 group-hover:shadow-glass transition-all">
                  <step.icon className="w-9 h-9 text-primary" />
                </div>

                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
