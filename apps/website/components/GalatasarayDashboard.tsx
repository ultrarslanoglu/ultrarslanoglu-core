import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Galatasaray Analytics Integration Component
 * Next.js sayfasına embed edilebilir bileşen
 * 
 * Kullanım:
 * import GalatasarayDashboard from '@/components/GalatasarayDashboard';
 * 
 * <GalatasarayDashboard />
 */

interface Player {
  id: string;
  number: number;
  name: string;
  position: string;
  nationality: string;
  goals: number;
  assists: number;
  appearances: number;
}

interface ClubInfo {
  name: string;
  founded: number;
  city: string;
  stadium: string;
  stadium_capacity: number;
  coach: string;
  president: string;
}

interface SeasonStats {
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

interface Match {
  date: string;
  opponent: string;
  result: string;
  status: 'W' | 'D' | 'L';
  competition: string;
}

const API_BASE = process.env.NEXT_PUBLIC_GALATASARAY_API || 'http://localhost:5002';

export default function GalatasarayDashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [topScorers, setTopScorers] = useState<Player[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'squad' | 'stats'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        playersRes,
        clubRes,
        seasonRes,
        scorersRes,
        matchesRes
      ] = await Promise.all([
        fetch(`${API_BASE}/api/players`),
        fetch(`${API_BASE}/api/club/info`),
        fetch(`${API_BASE}/api/club/season-stats`),
        fetch(`${API_BASE}/api/squad/top-scorers?limit=5`),
        fetch(`${API_BASE}/api/club/recent-matches`)
      ]);

      if (playersRes.ok) {
        const data = await playersRes.json();
        setPlayers(data.players || []);
      }

      if (clubRes.ok) {
        const data = await clubRes.json();
        setClubInfo(data.club);
      }

      if (seasonRes.ok) {
        const data = await seasonRes.json();
        setSeasonStats(data.season_stats);
      }

      if (scorersRes.ok) {
        const data = await scorersRes.json();
        setTopScorers(data.top_scorers || []);
      }

      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setRecentMatches(data.matches || []);
      }
    } catch (err) {
      setError('Veri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMatchStatusColor = (status: 'W' | 'D' | 'L') => {
    switch (status) {
      case 'W':
        return 'bg-green-100 text-green-800';
      case 'D':
        return 'bg-yellow-100 text-yellow-800';
      case 'L':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchStatusIcon = (status: 'W' | 'D' | 'L') => {
    switch (status) {
      case 'W':
        return '✅';
      case 'D':
        return '⚖️';
      case 'L':
        return '❌';
      default:
        return '⚽';
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-b from-red-50 to-white p-8 rounded-lg">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin">
            <svg
              className="w-12 h-12 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <span className="ml-4 text-gray-600">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 p-8 rounded-lg border-2 border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-bold text-lg">⚠️ Hata</h3>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-red-50 to-white p-6 rounded-lg">
      {/* Header */}
      <div className="mb-8 border-b-2 border-red-200 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-red-600">🟡 Galatasaray</h1>
            <p className="text-gray-600 mt-2">Real-time Veri & Analiz Platformu</p>
          </div>
          <div className="text-right">
            <Link href="http://localhost:8501" target="_blank">
              <a className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
                📊 Full Dashboard →
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {seasonStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg">
            <div className="text-sm font-semibold opacity-90">Konum</div>
            <div className="text-3xl font-bold mt-2">{seasonStats.position}.</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 rounded-lg">
            <div className="text-sm font-semibold opacity-90">Puan</div>
            <div className="text-3xl font-bold mt-2">{seasonStats.points}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="text-sm font-semibold opacity-90">Galibiyet</div>
            <div className="text-3xl font-bold mt-2">{seasonStats.wins}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="text-sm font-semibold opacity-90">Attığımız Gol</div>
            <div className="text-3xl font-bold mt-2">{seasonStats.goals_for}</div>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white p-4 rounded-lg">
            <div className="text-sm font-semibold opacity-90">Oyuncu Sayısı</div>
            <div className="text-3xl font-bold mt-2">{players.length}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b-2 border-gray-200">
        <div className="flex gap-0">
          {['overview', 'squad', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-600 border-transparent hover:text-gray-800'
              }`}
            >
              {tab === 'overview' && '📊 Genel Bakış'}
              {tab === 'squad' && '👥 Kadro'}
              {tab === 'stats' && '📈 İstatistikler'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Club Info */}
          {clubInfo && (
            <div className="bg-white p-6 rounded-lg border-l-4 border-red-600">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Kulüp Bilgileri</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Kuruluş</span>
                  <div className="font-semibold text-gray-900">{clubInfo.founded}</div>
                </div>
                <div>
                  <span className="text-gray-600">Şehir</span>
                  <div className="font-semibold text-gray-900">{clubInfo.city}</div>
                </div>
                <div>
                  <span className="text-gray-600">Stadyum Kapasitesi</span>
                  <div className="font-semibold text-gray-900">{clubInfo.stadium_capacity.toLocaleString('tr-TR')}</div>
                </div>
                <div>
                  <span className="text-gray-600">Teknik Direktör</span>
                  <div className="font-semibold text-gray-900">{clubInfo.coach}</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Matches */}
          {recentMatches.length > 0 && (
            <div className="bg-white p-6 rounded-lg border-l-4 border-yellow-500">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Son Maçlar</h2>
              <div className="space-y-3">
                {recentMatches.slice(0, 3).map((match, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${getMatchStatusColor(match.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getMatchStatusIcon(match.status)}</span>
                        <div>
                          <div className="font-semibold">{match.opponent}</div>
                          <div className="text-sm opacity-75">{match.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{match.result}</div>
                        <div className="text-xs opacity-75">{match.competition}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Scorers */}
          {topScorers.length > 0 && (
            <div className="bg-white p-6 rounded-lg border-l-4 border-green-600">
              <h2 className="text-xl font-bold text-gray-800 mb-4">⚽ Sezonun En Çok Gol Atanları</h2>
              <div className="space-y-2">
                {topScorers.map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <span className="inline-block w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold mr-3">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-900">{player.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">{player.goals} gol</div>
                      {player.assists > 0 && (
                        <div className="text-xs text-gray-600">{player.assists} asist</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'squad' && (
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">👥 Galatasaray Kadrosu ({players.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <div key={player.id} className="border-l-4 border-red-600 p-4 bg-gray-50 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-2xl font-bold text-red-600">#{player.number}</div>
                    <div className="font-semibold text-gray-900">{player.name}</div>
                    <div className="text-sm text-gray-600">{player.position}</div>
                  </div>
                  <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    {player.nationality}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-lg font-bold text-green-600">{player.goals}</div>
                    <div className="text-gray-600">Gol</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{player.assists}</div>
                    <div className="text-gray-600">Asist</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-600">{player.appearances}</div>
                    <div className="text-gray-600">Maç</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stats' && seasonStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border-l-4 border-red-600">
              <h3 className="font-bold text-gray-800 mb-4">Müsabakalar</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Toplam Maç</span>
                  <span className="font-bold text-gray-900">{seasonStats.played}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Galibiyet</span>
                  <span className="font-bold text-green-600">{seasonStats.wins}W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Beraberlik</span>
                  <span className="font-bold text-yellow-600">{seasonStats.draws}D</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mağlubiyet</span>
                  <span className="font-bold text-red-600">{seasonStats.losses}L</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border-l-4 border-blue-600">
              <h3 className="font-bold text-gray-800 mb-4">Gol</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Attığımız</span>
                  <span className="font-bold text-blue-600">{seasonStats.goals_for}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Yediğimiz</span>
                  <span className="font-bold text-red-600">{seasonStats.goals_against}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-gray-600">Gol Farkı</span>
                  <span className="font-bold text-green-600">
                    {seasonStats.goals_for - seasonStats.goals_against > 0 ? '+' : ''}
                    {seasonStats.goals_for - seasonStats.goals_against}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
        <p>⏰ Son güncellenme: {new Date().toLocaleString('tr-TR')}</p>
        <p className="mt-2">
          <Link href="http://localhost:8501">
            <a className="text-red-600 hover:text-red-700 font-semibold">
              📊 Detaylı analiz için Full Dashboard'ı ziyaret edin →
            </a>
          </Link>
        </p>
      </div>
    </div>
  );
}
