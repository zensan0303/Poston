'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import { GameResult } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function GameResultsManagement() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchGames();
    }
  }, [user]);

  const fetchGames = async () => {
    try {
      const db = getDbInstance();
      const gamesQuery = query(
        collection(db, 'gameResults'),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(gamesQuery);

      const fetchedGames: GameResult[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date.toDate(),
          ourTeamName: data.ourTeamName || 'ポストン',
          opponent: data.opponent,
          inningScores: data.inningScores || [],
          ourScore: data.ourScore,
          opponentScore: data.opponentScore,
          location: data.location || '',
          notes: data.notes || '',
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
      });

      setGames(fetchedGames);
    } catch (error) {
      console.error('試合結果の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gameId: string) => {
    try {
      const db = getDbInstance();
      await deleteDoc(doc(db, 'gameResults', gameId));
      setGames(games.filter(g => g.id !== gameId));
      setDeleteTargetId(null);
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-2xl text-primary-600">読み込み中...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* ヘッダー */}
      <header className="bg-primary-500 text-white p-4 md:p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl-mobile md:text-3xl font-bold">🏆 試合結果管理</h1>
          <div className="flex gap-2">
            <Link
              href="/admin/game-results/new"
              className="bg-white text-primary-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors text-lg"
            >
              ➕ 新規追加
            </Link>
            <Link
              href="/admin/dashboard"
              className="bg-primary-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-800 transition-colors text-lg"
            >
              戻る
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {games.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-xl text-gray-600 mb-4">試合結果がまだ登録されていません</p>
            <Link
              href="/admin/game-results/new"
              className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-600 transition-colors text-lg"
            >
              ➕ 最初の試合結果を追加
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map(game => (
              <div
                key={game.id}
                className="bg-white rounded-lg shadow-lg border-l-4 border-primary-500 overflow-hidden"
              >
                {/* アコーディオンヘッダー */}
                <div className="p-5">
                  <div className="flex flex-col gap-3">
                    {/* 日付・対戦相手 */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-gray-500 text-base mb-1">
                          {format(game.date, 'yyyy年M月d日(E)', { locale: ja })}
                        </p>
                        <p className="text-xl font-bold text-gray-800">vs {game.opponent}</p>
                        {game.location && (
                          <p className="text-gray-500 text-base mt-1">📍 {game.location}</p>
                        )}
                      </div>
                      {/* 操作ボタン */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/admin/game-results/${game.id}`}
                          className="bg-blue-500 text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors text-base"
                        >
                          編集
                        </Link>
                        {deleteTargetId === game.id ? (
                          <>
                            <span className="text-red-600 font-bold text-base">本当に削除？</span>
                            <button
                              onClick={() => handleDelete(game.id)}
                              className="bg-red-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors text-base"
                            >
                              はい
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(null)}
                              className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg font-bold hover:bg-gray-400 transition-colors text-base"
                            >
                              いいえ
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteTargetId(game.id)}
                            className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors text-base"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    </div>

                    {/* スコア + 展開ボタン */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">{game.ourTeamName}</p>
                          <p className="text-3xl font-bold text-primary-600">{game.ourScore}</p>
                        </div>
                        <p className="text-xl font-bold text-gray-400">-</p>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">{game.opponent}</p>
                          <p className="text-3xl font-bold text-gray-600">{game.opponentScore}</p>
                        </div>
                      </div>

                      {/* 詳細展開ボタン */}
                      {game.inningScores && game.inningScores.length > 0 && (
                        <button
                          onClick={() => setExpandedId(expandedId === game.id ? null : game.id)}
                          className="bg-primary-100 text-primary-700 px-4 py-2 rounded-lg font-bold hover:bg-primary-200 transition-colors text-base"
                        >
                          {expandedId === game.id ? '閉じる ▲' : '詳細 ▼'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* アコーディオン展開部分 */}
                {expandedId === game.id && game.inningScores && game.inningScores.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="overflow-x-auto">
                      <table className="text-center text-sm border-collapse" style={{ minWidth: '360px' }}>
                        <thead>
                          <tr className="bg-primary-500 text-white">
                            <th className="px-2 py-2 text-left rounded-tl-lg w-20">チーム</th>
                            {game.inningScores.map(s => (
                              <th key={s.inning} className="px-2 py-2 w-8">{s.inning}</th>
                            ))}
                            <th className="px-2 py-2 bg-primary-700 font-bold rounded-tr-lg w-10">計</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-gray-200">
                            <td className="px-2 py-2 text-left font-bold text-primary-700 bg-primary-50">{game.ourTeamName}</td>
                            {game.inningScores.map((s, i) => (
                              <td key={i} className="px-2 py-2 font-bold text-primary-700 bg-primary-50">{s.ourScore}</td>
                            ))}
                            <td className="px-2 py-2 font-bold text-primary-700 bg-primary-100">{game.ourScore}</td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="px-2 py-2 text-left font-bold text-gray-700 bg-gray-50">{game.opponent}</td>
                            {game.inningScores.map((s, i) => (
                              <td key={i} className="px-2 py-2 font-bold text-gray-700 bg-gray-50">{s.opponentScore}</td>
                            ))}
                            <td className="px-2 py-2 font-bold text-gray-700 bg-gray-100">{game.opponentScore}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {game.notes && (
                      <p className="mt-3 text-gray-600 text-base">📝 {game.notes}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/admin/dashboard"
            className="text-primary-600 hover:text-primary-800 underline text-lg"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
