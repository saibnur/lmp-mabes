import { Link } from "react-router-dom";
import kppiLogo from "@/assets/kppi-logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src={kppiLogo}
                alt="KPPI Logo"
                className="h-12 w-12 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold">FreshPasar</span>
                <span className="text-xs text-primary-foreground/70">
                  by KPPI
                </span>
              </div>
            </Link>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Menyediakan bahan pangan segar berkualitas untuk mendukung program
              Makan Bergizi Gratis di seluruh Indonesia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Navigasi</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  to="/katalog"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Katalog Produk
                </Link>
              </li>
              <li>
                <Link
                  to="/lacak"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Lacak Pesanan
                </Link>
              </li>
              <li>
                <Link
                  to="/tentang"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Kontak</h4>
            <ul className="space-y-3">
              <li className="text-sm text-primary-foreground/70">
                <span className="block text-primary-foreground">Email:</span>
                freshpasar.kppi@gmail.com
              </li>
              <li className="text-sm text-primary-foreground/70">
                <span className="block text-primary-foreground">Telepon:</span>
                082120189513
              </li>
              <li className="text-sm text-primary-foreground/70">
                <span className="block text-primary-foreground">Alamat:</span>
                Jl. Swadaya Mulia No 2 RT. 003 RW. 04 Limo Depok Jawa Barat
              </li>
            </ul>
          </div>

          {/* Admin Access */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Layanan</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/admin-portal"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Portal Admin
                </Link>
              </li>
              <li>
                <a
                  href="https://bgn.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  Badan Gizi Nasional ↗
                </a>
              </li>
              <li className="text-sm text-primary-foreground/70">
                <span className="block text-primary-foreground">Jam Operasional:</span>
                Senin - Sabtu, 05:00 - 18:00
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © 2025 FreshPasar by Koperasi Pedagang Pasar Indonesia. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/kebijakan-privasi"
              className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              Kebijakan Privasi
            </Link>
            <Link
              to="/syarat-ketentuan"
              className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
