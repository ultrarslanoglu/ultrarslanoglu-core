import React from 'react';
import Link from 'next/link';

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-galatasaray-dark text-gray-300 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Ultrarslanoglu</h3>
            <p className="text-sm">
              Galatasaray'ın dijital liderlik platformu. Yapay zeka, video işleme ve sosyal medya otomasyon araçları.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Hızlı Bağlantılar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-galatasaray-yellow transition">
                  Anasayfa
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-galatasaray-yellow transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/galatasaray" className="hover:text-galatasaray-yellow transition">
                  Galatasaray
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-4">Destek</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:info@ultrarslanoglu.com" className="hover:text-galatasaray-yellow transition">
                  E-posta Gönder
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-galatasaray-yellow transition">
                  Yardım Merkezi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-galatasaray-yellow transition">
                  İletişim
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-bold mb-4">Sosyal Medya</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-galatasaray-yellow transition">
                Twitter
              </a>
              <a href="#" className="hover:text-galatasaray-yellow transition">
                Facebook
              </a>
              <a href="#" className="hover:text-galatasaray-yellow transition">
                Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-700 mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-center md:text-left">
            &copy; {currentYear} Ultrarslanoglu. Tüm hakları saklıdır.
          </p>
          <div className="flex space-x-6 text-sm mt-4 md:mt-0">
            <Link href="#" className="hover:text-galatasaray-yellow transition">
              Gizlilik Politikası
            </Link>
            <Link href="#" className="hover:text-galatasaray-yellow transition">
              Kullanım Şartları
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
