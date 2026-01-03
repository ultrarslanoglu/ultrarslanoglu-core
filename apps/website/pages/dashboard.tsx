import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/login');
    },
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Hoş geldiniz, {session?.user?.name || session?.user?.username}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Kullanıcı Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{session?.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Kullanıcı Adı</p>
              <p className="font-medium">{session?.user?.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rol</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                session?.user?.role === 'admin' || session?.user?.role === 'superadmin'
                  ? 'bg-purple-100 text-purple-800'
                  : session?.user?.role === 'editor'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {session?.user?.role === 'superadmin' ? 'Süper Admin' :
                 session?.user?.role === 'admin' ? 'Admin' :
                 session?.user?.role === 'editor' ? 'Editör' : 'İzleyici'}
              </span>
            </div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bağlı Platformlar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['tiktok', 'instagram', 'youtube', 'x'].map((platform) => {
              const isConnected = session?.user?.connectedPlatforms?.[platform];
              return (
                <div
                  key={platform}
                  className={`p-4 rounded-lg border-2 ${
                    isConnected
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <p className="font-medium capitalize">{platform}</p>
                  <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                    {isConnected ? 'Bağlı' : 'Bağlı değil'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(session?.user?.role === 'editor' || 
            session?.user?.role === 'admin' || 
            session?.user?.role === 'superadmin') && (
            <Link href="/upload">
              <div className="bg-gradient-to-br from-red-500 to-yellow-500 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
                <h3 className="text-xl font-bold mb-2">Video Yükle</h3>
                <p className="text-sm opacity-90">Sosyal medya platformlarına video yükleyin</p>
              </div>
            </Link>
          )}

          <Link href="/analytics">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
              <h3 className="text-xl font-bold mb-2">Analytics</h3>
              <p className="text-sm opacity-90">Performans verilerinizi görüntüleyin</p>
            </div>
          </Link>

          {(session?.user?.role === 'admin' || session?.user?.role === 'superadmin') && (
            <Link href="/admin">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
                <h3 className="text-xl font-bold mb-2">Admin Panel</h3>
                <p className="text-sm opacity-90">Kullanıcıları ve sistemi yönetin</p>
              </div>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  // SSR ile render edilerek build-time prerender hataları önlenir
  return { props: {} };
}
