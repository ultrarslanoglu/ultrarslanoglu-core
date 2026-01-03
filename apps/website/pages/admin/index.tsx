import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface User {
  _id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  stats: {
    totalUploads: number;
  };
}

export default function AdminPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/login');
    },
  });
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Admin olmayan kullanıcıları yönlendir
  useEffect(() => {
    if (status === 'authenticated' && 
        session?.user?.role !== 'admin' && 
        session?.user?.role !== 'superadmin') {
      router.push('/dashboard?error=unauthorized');
    }
  }, [status, session, router]);

  // Kullanıcıları yükle
  useEffect(() => {
    if (session?.accessToken) {
      loadUsers();
    }
  }, [session, page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/user/list`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`
        },
        params: { page, limit: 20 }
      });

      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!confirm('Kullanıcının rolünü değiştirmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/user/${userId}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`
          }
        }
      );

      if (response.data.success) {
        loadUsers(); // Listeyi yenile
        alert('Rol başarıyla güncellendi');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Rol güncellenemedi');
    }
  };

  const deactivateUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı devre dışı bırakmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/api/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`
        }
      });

      if (response.data.success) {
        loadUsers(); // Listeyi yenile
        alert('Kullanıcı devre dışı bırakıldı');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'İşlem başarısız');
    }
  };

  if (status === 'loading' || loading) {
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="mt-1 text-sm text-gray-600">Kullanıcı yönetimi ve sistem ayarları</p>
            </div>
            <Link href="/dashboard">
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                Dashboard'a Dön
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Aktif Kullanıcı</p>
            <p className="text-3xl font-bold text-green-600">
              {users.filter(u => u.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Adminler</p>
            <p className="text-3xl font-bold text-purple-600">
              {users.filter(u => u.role === 'admin' || u.role === 'superadmin').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Editörler</p>
            <p className="text-3xl font-bold text-blue-600">
              {users.filter(u => u.role === 'editor').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Kullanıcılar</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        disabled={user.role === 'superadmin'}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                        {session?.user?.role === 'superadmin' && (
                          <option value="superadmin">Superadmin</option>
                        )}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.stats?.totalUploads || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.isActive && user.role !== 'superadmin' && (
                        <button
                          onClick={() => deactivateUser(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Devre Dışı Bırak
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Önceki
              </button>
              <span className="text-sm text-gray-600">
                Sayfa {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
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
