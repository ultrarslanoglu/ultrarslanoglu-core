import React from 'react';
import Head from 'next/head';
import GalatasarayDashboard from '@/components/GalatasarayDashboard';

export default function GalatasarayPage() {
  return (
    <>
      <Head>
        <title>Galatasaray Analytics | ultrarslanoglu</title>
        <meta name="description" content="Galatasaray Spor Kulübü - Canlı oyuncu ve klub verisi analizi" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🟡</div>
              <div>
                <h1 className="text-2xl font-bold">Galatasaray Analytics</h1>
                <p className="text-red-100 text-sm">Real-time Platform</p>
              </div>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-red-200 transition">Anasayfa</a>
              <a href="#" className="hover:text-red-200 transition">Hakkında</a>
              <a href="http://localhost:8501" target="_blank" rel="noopener noreferrer" 
                 className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition">
                📊 Full Dashboard
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-red-50 to-white py-12 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              🟡 Galatasaray <span className="text-red-600">Canlı</span> Analizi
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Galatasaray Spor Kulübü'nün oyuncu kadrosu, sezon performansı ve sosyal medya analiziyle 
              ilgili gerçek zamanlı veriler. Bugünün en iyi veri teknolojileri ile powered.
            </p>
            <div className="flex justify-center gap-4">
              <a href="#dashboard" className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                ⬇️ Verileri Gör
              </a>
              <a href="http://localhost:8501" target="_blank" rel="noopener noreferrer"
                 className="px-8 py-3 bg-white text-red-600 border-2 border-red-600 rounded-lg font-semibold hover:bg-red-50 transition">
                📊 Full Dashboard
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              ✨ Platform Özellikleri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-gradient-to-br from-red-50 to-white border-l-4 border-red-600 rounded-lg">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Oyuncu Verisi</h3>
                <p className="text-gray-600">
                  Galatasaray 2024-2025 sezonunun 18 oyuncusu: form, istatistik, sosyal medya mentions
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-yellow-50 to-white border-l-4 border-yellow-500 rounded-lg">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Klub İstatistikleri</h3>
                <p className="text-gray-600">
                  Sezon performansı, puan tablosu, maç sonuçları ve tarihsel başarılar
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-600 rounded-lg">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sosyal Medya Analizi</h3>
                <p className="text-gray-600">
                  Twitter, Instagram, TikTok'tan canlı veri ve sentiment analizi
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-white border-l-4 border-green-600 rounded-lg">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">İnteraktif Grafikler</h3>
                <p className="text-gray-600">
                  Plotly ile power dashboard: top scorers, form analizi, engagement metrikleri
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-white border-l-4 border-purple-600 rounded-lg">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI Powered</h3>
                <p className="text-gray-600">
                  NLP sentiment analizi, oyuncu performans forecasting, trend detection
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-indigo-50 to-white border-l-4 border-indigo-600 rounded-lg">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Updates</h3>
                <p className="text-gray-600">
                  Otomatik güncellemeler, webhook entegrasyonu, 24/7 monitoring
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Section */}
        <section id="dashboard" className="py-12 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">📊 Canlı Dashboard</h2>
            <GalatasarayDashboard />
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-12 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              🛠️ Teknoloji Stack
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'Flask', icon: '🐍', desc: 'REST API' },
                { name: 'Azure Cosmos DB', icon: '☁️', desc: 'NoSQL Database' },
                { name: 'Streamlit', icon: '📊', desc: 'Dashboard UI' },
                { name: 'Twitter API', icon: '🐦', desc: 'Social Media' },
                { name: 'Instagram API', icon: '📸', desc: 'Social Media' },
                { name: 'YouTube API', icon: '🎥', desc: 'Video Data' },
                { name: 'NLTK/TextBlob', icon: '🤖', desc: 'NLP Processing' },
                { name: 'Plotly', icon: '📈', desc: 'Visualizations' },
                { name: 'Pandas', icon: '📋', desc: 'Data Analysis' },
                { name: 'Redis', icon: '⚡', desc: 'Caching' },
                { name: 'Docker', icon: '🐳', desc: 'Containerization' },
                { name: 'Next.js', icon: '⚛️', desc: 'Web Framework' },
              ].map((tech, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg text-center hover:shadow-lg transition">
                  <div className="text-3xl mb-2">{tech.icon}</div>
                  <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                  <p className="text-sm text-gray-600">{tech.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">🚀 Full Experience İçin</h2>
            <p className="text-lg mb-8 text-red-100">
              Detaylı analiz, interaktif grafikler ve gerçek zamanlı güncellemeleri görmek için 
              tam Streamlit dashboard'unu ziyaret edin.
            </p>
            <a href="http://localhost:8501" target="_blank" rel="noopener noreferrer"
               className="inline-block px-8 py-3 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition text-lg">
              📊 Streamlit Dashboard Aç →
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-4">Galatasaray Analytics</h3>
                <p className="text-gray-400">Real-time veri analiz platformu</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">Bağlantılar</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition">Anasayfa</a></li>
                  <li><a href="http://localhost:8501" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Dashboard</a></li>
                  <li><a href="#" className="hover:text-white transition">API Dokümanı</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4">İletişim</h3>
                <p className="text-gray-400">GitHub Issues yoluyla sorularınızı gönderebilirsiniz</p>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
              <p>© 2024 Galatasaray Analytics - Powered by ultrarslanoglu</p>
              <p className="text-sm mt-2">🟡 GALATASARAY 🟡</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
