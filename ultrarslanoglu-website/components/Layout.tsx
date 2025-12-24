import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-galatasaray-dark text-white sticky top-0 z-50 shadow-lg">
        <nav className="container-custom h-16 flex items-center justify-between">
          <div className="text-2xl font-bold">
            <span className="text-galatasaray-yellow">Ultrarslanoglu</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="/" className="hover:text-galatasaray-yellow transition">Anasayfa</a>
            <a href="/projects" className="hover:text-galatasaray-yellow transition">Projeler</a>
            <a href="/about" className="hover:text-galatasaray-yellow transition">Hakkında</a>
            <a href="/contact" className="hover:text-galatasaray-yellow transition">İletişim</a>
          </div>
        </nav>
      </header>

      <main className="min-h-[calc(100vh-64px)]">
        {children}
      </main>

      <footer className="bg-galatasaray-dark text-white py-8 mt-16">
        <div className="container-custom text-center">
          <p>&copy; 2025 Ultrarslanoglu - Galatasaray Dijital Liderlik. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
