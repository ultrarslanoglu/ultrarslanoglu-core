import React, { ReactNode } from 'react';
import Link from 'next/link';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-galatasaray-dark text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <h1 className="text-2xl font-bold text-galatasaray-yellow">
                Ultra<span className="text-galatasaray-red">rslanoglu</span>
              </h1>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-galatasaray-yellow transition">
              Anasayfa
            </Link>
            <Link href="/galatasaray" className="hover:text-galatasaray-yellow transition">
              Galatasaray
            </Link>
            <Link href="/vr-stadium" className="hover:text-galatasaray-yellow transition">
              VR Stadı
            </Link>
            <Link href="/dashboard" className="hover:text-galatasaray-yellow transition">
              Dashboard
            </Link>
            <Link href="/auth/login" className="hover:text-galatasaray-yellow transition">
              Giriş Yap
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-galatasaray-yellow">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
