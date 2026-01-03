import React from 'react';
import Header from './layout/Header';
import Footer from './layout/Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="min-h-[calc(100vh-64px)]">
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
