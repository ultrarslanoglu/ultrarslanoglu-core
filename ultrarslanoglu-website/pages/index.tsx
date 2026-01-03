import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Layout from '@/components/Layout';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Ultrarslanoglu - Galatasaray Dijital Liderlik Portalı</title>
        <meta name="description" content="Ultrarslanoglu: Galatasaray'ın dijital liderlik platformu. Yapay zeka, video işleme, analitik ve sosyal medya otomasyon." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-galatasaray-dark to-galatasaray-red py-20">
          <div className="container-custom text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-galatasaray-yellow">Ultrarslanoglu</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8">Galatasaray'ın Dijital Liderlik Platformu</p>
            <p className="max-w-2xl mx-auto text-lg mb-8">
              Yapay zeka, video işleme, analitik ve sosyal medya otomasyon araçlarıyla Galatasaray'ı dijital çağda öncü kılan platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="btn-primary">Projeleri Keşfet</button>
              <button className="btn-secondary">Daha Fazla Bilgi</button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-4xl font-bold text-center mb-12">
              Özellikler
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white p-8 rounded-lg shadow-lg hover:shadow-2xl transition transform hover:scale-105"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-4 text-galatasaray-red">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section className="py-20">
          <div className="container-custom">
            <h2 className="text-4xl font-bold text-center mb-12">
              Ana Projeler
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((project, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-galatasaray-yellow p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition"
                >
                  <h3 className="text-2xl font-bold mb-2 text-galatasaray-red">
                    {project.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, tidx) => (
                      <span key={tidx} className="bg-galatasaray-light px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-galatasaray-dark text-white py-16">
          <div className="container-custom text-center">
            <h2 className="text-4xl font-bold mb-6">
              Başlamaya Hazır Mısınız?
            </h2>
            <p className="text-xl mb-8">
              Galatasaray'ın dijital liderliğinin bir parçası olun.
            </p>
            <button className="px-8 py-4 bg-galatasaray-yellow text-galatasaray-dark font-bold rounded-lg hover:bg-galatasaray-red hover:text-white transition">
              Bize Ulaşın
            </button>
          </div>
        </section>
      </Layout>
    </>
  );
};

const features = [
  {
    icon: '🎬',
    title: 'AI Video Editör',
    description: 'Yapay zeka destekli video düzenleme, otomatik kesme ve optimizasyon.',
  },
  {
    icon: '📊',
    title: 'Analytics Dashboard',
    description: 'Sosyal medya performans analizi ve gerçek zamanlı içgörüler.',
  },
  {
    icon: '🤖',
    title: 'Otomasyon Araçları',
    description: 'Sosyal medya görevlerinin otomatikleştirilmesi ve zamanlama.',
  },
  {
    icon: '🎨',
    title: 'Brand Kit',
    description: 'Marka kimliği, renk paletleri ve tasarım şablonları.',
  },
  {
    icon: '📅',
    title: 'İçerik Zamanlama',
    description: 'Multi-platform içerik planlama ve programlanmış paylaşım.',
  },
  {
    icon: '📹',
    title: 'Video Pipeline',
    description: 'Büyük ölçekli video işleme, transcoding ve optimizasyon.',
  },
];

const projects = [
  {
    name: '🎬 GS AI Editor',
    description: 'Yapay zeka destekli video düzenleme aracı. Otomatik sahne tespiti, edit önerileri ve platform optimizasyonu.',
    tags: ['Flask', 'PyTorch', 'OpenCV', 'MoviePy'],
  },
  {
    name: '📊 GS Analytics Dashboard',
    description: 'Sosyal medya performans analizi. Real-time dashboard, trend tahmini ve özel raporlar.',
    tags: ['Flask', 'Streamlit', 'Plotly', 'Pandas'],
  },
  {
    name: '🤖 GS Automation Tools',
    description: 'Sosyal medya otomasyon. Instagram paylaşımı, scraping, batch posting.',
    tags: ['Flask', 'Celery', 'Selenium', 'APIs'],
  },
  {
    name: '📹 GS Video Pipeline',
    description: 'Video işleme pipeline. Transcode, kalite optimizasyon, bulut depolama entegrasyonu.',
    tags: ['Flask', 'FFmpeg', 'Celery', 'AWS/Azure'],
  },
];

export default Home;
