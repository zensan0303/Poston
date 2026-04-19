'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import Link from 'next/link';
import { GameResult } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function ResultsPage() {
  const [games, setGames] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

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
          isHomeTeam: data.isHomeTeam ?? false,
          inningScores: data.inningScores || [],
          ourScore: data.ourScore,
          opponentScore: data.opponentScore,
          location: data.location,
          notes: data.notes,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
      });

      setGames(fetchedGames);
    } catch (error) {
      console.error('試合結果の取得に失敗しました:', error);
      // デモデータを表示
      setGames([
        {
          id: '1',
          date: new Date(2026, 1, 15),
          ourTeamName: 'ポストン',
          opponent: 'チームA',
          isHomeTeam: false,
          inningScores: [
            { inning: 1, ourScore: 2, opponentScore: 0 },
            { inning: 2, ourScore: 0, opponentScore: 1 },
            { inning: 3, ourScore: 3, opponentScore: 2 },
            { inning: 4, ourScore: 1, opponentScore: 0 },
            { inning: 5, ourScore: 0, opponentScore: 1 },
            { inning: 6, ourScore: 2, opponentScore: 0 },
            { inning: 7, ourScore: 0, opponentScore: 1 },
          ],
          ourScore: 8,
          opponentScore: 5,
          location: 'スタジアムA',
          notes: '序盤リードを守り切った',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          date: new Date(2026, 1, 8),
          ourTeamName: 'ポストン',
          opponent: 'チームB',
          isHomeTeam: true,
          inningScores: [
            { inning: 1, ourScore: 0, opponentScore: 2 },
            { inning: 2, ourScore: 1, opponentScore: 1 },
            { inning: 3, ourScore: 0, opponentScore: 3 },
            { inning: 4, ourScore: 2, opponentScore: 1 },
            { inning: 5, ourScore: 0, opponentScore: 0 },
          ],
          ourScore: 3,
          opponentScore: 7,
          location: 'グラウンドB',
          notes: '投手陣が踏ん張れず',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          date: new Date(2026, 1, 1),
          ourTeamName: 'ポストン',
          opponent: 'チームC',
          isHomeTeam: true,
          inningScores: [
            { inning: 1, ourScore: 1, opponentScore: 0 },
            { inning: 2, ourScore: 0, opponentScore: 2 },
            { inning: 3, ourScore: 2, opponentScore: 1 },
            { inning: 4, ourScore: 1, opponentScore: 1 },
            { inning: 5, ourScore: 0, opponentScore: 0 },
            { inning: 6, ourScore: 1, opponentScore: 1 },
          ],
          ourScore: 5,
          opponentScore: 5,
          location: 'メインスタジアム',
          notes: '延長戦までもつれた',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-2xl text-primary-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* ヘッダー */}
      <header className="bg-primary-500 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl-mobile md:text-3xl font-bold hover:opacity-80">
            ← ホーム
          </Link>
          <h1 className="text-2xl-mobile md:text-3xl font-bold">🏆 試合結果</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {/* 試合数 */}
        <div className="mb-6">
          <div className="inline-block bg-white rounded-lg shadow px-6 py-3 border-2 border-primary-200">
            <span className="text-gray-600 text-lg">試合数：</span>
            <span className="text-2xl font-bold text-primary-600">{games.length}</span>
            <span className="text-gray-600 text-lg"> 試合</span>
          </div>
        </div>

        {/* 試合リスト */}
        <div className="space-y-4">
          {games.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-xl text-gray-600">試合結果がまだありません</p>
            </div>
          ) : (
            games.map(game => {
              const isExpanded = expandedId === game.id;
              const hasDetail = (game.inningScores && game.inningScores.length > 0) || game.notes;
              return (
                <div
                  key={game.id}
                  className="bg-white rounded-xl shadow border-l-4 border-primary-500 overflow-hidden"
                >
                  {/* カードヘッダー（常に表示） */}
                  <div className="p-5">
                    {/* 日付・会場 */}
                    <p className="text-gray-500 text-base mb-1">
                      {format(game.date, 'yyyy年M月d日(E)', { locale: ja })}
                      {game.location && <span className="ml-3">📍 {game.location}</span>}
                    </p>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      {/* スコア表示 */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">{game.ourTeamName}</p>
                          <p className="text-4xl font-bold text-primary-600">{game.ourScore}</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-400">－</p>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">{game.opponent}</p>
                          <p className="text-4xl font-bold text-gray-600">{game.opponentScore}</p>
                        </div>
                      </div>

                      {/* 詳細を開くボタン */}
                      {hasDetail && (
                        <button
                          onClick={() => toggleExpand(game.id)}
                          className="bg-primary-100 text-primary-700 px-5 py-3 rounded-xl font-bold hover:bg-primary-200 transition-colors text-lg"
                        >
                          {isExpanded ? '閉じる ▲' : '詳細を見る ▼'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* アコーディオン展開部分 */}
                  {isExpanded && hasDetail && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                      {/* イニング別スコア表 */}
                      {game.inningScores && game.inningScores.length > 0 && (() => {
                          const scores = game.inningScores;
                          const lastIdx = scores.length - 1;
                          const homeWon = game.isHomeTeam
                            ? game.ourScore > game.opponentScore
                            : game.opponentScore > game.ourScore;
                          const topTeamName = game.isHomeTeam ? game.opponent : game.ourTeamName;
                          const bottomTeamName = game.isHomeTeam ? game.ourTeamName : game.opponent;
                          const topTotal = game.isHomeTeam ? game.opponentScore : game.ourScore;
                          const bottomTotal = game.isHomeTeam ? game.ourScore : game.opponentScore;
                          const topScores = scores.map(s => game.isHomeTeam ? s.opponentScore : s.ourScore);
                          const bottomScores = scores.map(s => game.isHomeTeam ? s.ourScore : s.opponentScore);
                          return (
                            <div>
                              <p className="text-base font-bold text-gray-600 mb-2">⚾ 回ごとのスコア</p>
                              <div className="overflow-x-auto">
                                <table className="text-center text-base border-collapse" style={{ minWidth: '360px' }}>
                                  <thead>
                                    <tr className="bg-primary-500 text-white">
                                      <th className="px-3 py-2 text-left rounded-tl-lg w-24">チーム</th>
                                      {scores.map(s => (
                                        <th key={s.inning} className="px-2 py-2 w-9">{s.inning}</th>
                                      ))}
                                      <th className="px-3 py-2 bg-primary-700 font-bold rounded-tr-lg w-10">計</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-t border-gray-200">
                                      <td className="px-3 py-2 text-left font-bold text-gray-700 bg-gray-50">{topTeamName}</td>
                                      {topScores.map((score, i) => (
                                        <td key={i} className="px-2 py-2 font-bold text-gray-700 bg-gray-50">{score}</td>
                                      ))}
                                      <td className="px-3 py-2 font-bold text-gray-700 bg-gray-100">{topTotal}</td>
                                    </tr>
                                    <tr className="border-t border-gray-200">
                                      <td className="px-3 py-2 text-left font-bold text-primary-700 bg-primary-50">{bottomTeamName}</td>
                                      {bottomScores.map((score, i) => (
                                        <td key={i} className="px-2 py-2 font-bold text-primary-700 bg-primary-50">
                                          {i === lastIdx && homeWon
                                            ? <span>{score}<span className="text-gray-500">x</span></span>
                                            : score}
                                        </td>
                                      ))}
                                      <td className="px-3 py-2 font-bold text-primary-700 bg-primary-100">{bottomTotal}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}

                      {/* メモ */}
                      {game.notes && (
                        <div>
                          <p className="text-base font-bold text-gray-600 mb-1">📝 メモ</p>
                          <p className="text-lg text-gray-700 whitespace-pre-wrap">{game.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="mt-16 py-6 bg-gray-100 text-center">
        <Link href="/" className="text-primary-600 hover:text-primary-800 underline text-lg">
          ← ホームに戻る
        </Link>
      </footer>
    </div>
  );
}
