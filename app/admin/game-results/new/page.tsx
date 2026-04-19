'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import { InningScore } from '@/types';

const DEFAULT_INNINGS = 9;

const emptyInnings = (count: number): InningScore[] =>
  Array.from({ length: count }, (_, i) => ({
    inning: i + 1,
    ourScore: null,
    opponentScore: null,
  }));

export default function NewGameResultPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [ourTeamName, setOurTeamName] = useState('ポストン');
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isHomeTeam, setIsHomeTeam] = useState(false); // false=先攻, true=後攻
  const [showX, setShowX] = useState(false);
  const [inningScores, setInningScores] = useState<InningScore[]>(emptyInnings(DEFAULT_INNINGS));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  // 合計スコアを自動計算
  const ourTotal = inningScores.reduce((sum, s) => sum + (s.ourScore ?? 0), 0);
  const oppTotal = inningScores.reduce((sum, s) => sum + (s.opponentScore ?? 0), 0);

  const handleInningChange = (
    index: number,
    field: 'ourScore' | 'opponentScore',
    value: string
  ) => {
    setInningScores(prev =>
      prev.map((s, i) =>
        i === index
          ? { ...s, [field]: value === '' ? null : Number(value) }
          : s
      )
    );
  };

  const addInning = () => {
    setInningScores(prev => [
      ...prev,
      { inning: prev.length + 1, ourScore: null, opponentScore: null },
    ]);
  };

  const removeLastInning = () => {
    if (inningScores.length <= 1) return;
    setInningScores(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!date || !opponent.trim()) {
      setError('試合日と対戦相手は必須です');
      return;
    }

    setLoading(true);
    try {
      const db = getDbInstance();
      const dateObj = new Date(date);
      dateObj.setHours(12, 0, 0, 0);

      // 両チームともスコアがない回を除外
      const filteredScores = inningScores.filter(
        s => s.ourScore !== null || s.opponentScore !== null
      );

      await addDoc(collection(db, 'gameResults'), {
        date: Timestamp.fromDate(dateObj),
        ourTeamName: ourTeamName.trim() || 'ポストン',
        opponent: opponent.trim(),
        isHomeTeam,
        showX,
        inningScores: filteredScores.map(s => ({
          inning: s.inning,
          ourScore: s.ourScore ?? 0,
          opponentScore: s.opponentScore ?? 0,
        })),
        ourScore: ourTotal,
        opponentScore: oppTotal,
        location: location.trim(),
        notes: notes.trim(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      router.push('/admin/game-results');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
      setLoading(false);
    }
  };

  if (authLoading) {
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl-mobile md:text-3xl font-bold">🏆 試合結果追加</h1>
          <Link
            href="/admin/game-results"
            className="bg-white text-primary-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            ← 一覧に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700 text-lg">{error}</p>
            </div>
          )}

          {/* 基本情報 */}
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">📋 基本情報</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 試合日 */}
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">試合日 *</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* 会場 */}
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">会場</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="例：〇〇グラウンド"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* 自チーム名 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-lg font-bold text-gray-700">自チーム名</label>
                  <button
                    type="button"
                    onClick={() => setIsHomeTeam(prev => !prev)}
                    className={`text-sm font-bold px-2 py-0.5 rounded transition-colors ${
                      !isHomeTeam ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {!isHomeTeam ? '▶ 先攻' : '後攻'}
                  </button>
                </div>
                <input
                  type="text"
                  value={ourTeamName}
                  onChange={e => setOurTeamName(e.target.value)}
                  placeholder="ポストン"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* 対戦相手 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-lg font-bold text-gray-700">対戦相手 *</label>
                  <button
                    type="button"
                    onClick={() => setIsHomeTeam(prev => !prev)}
                    className={`text-sm font-bold px-2 py-0.5 rounded transition-colors ${
                      isHomeTeam ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {isHomeTeam ? '▶ 先攻' : '後攻'}
                  </button>
                </div>
                <input
                  type="text"
                  value={opponent}
                  onChange={e => setOpponent(e.target.value)}
                  placeholder="例：〇〇チーム"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-xl focus:outline-none focus:border-primary-500"
                />
              </div>

            </div>
          </div>

          {/* スコアボード */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">⚾ 回ごとのスコア</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse" style={{ minWidth: '520px' }}>
                <thead>
                  <tr className="bg-primary-500 text-white">
                    <th className="px-3 py-3 text-left text-lg rounded-tl-lg w-28">チーム</th>
                    {inningScores.map(s => (
                      <th key={s.inning} className="px-2 py-3 text-lg w-12">
                        {s.inning}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-lg font-bold bg-primary-700 rounded-tr-lg w-14">計</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 先攻（表）・後攻（裏）の順で行を表示 */}
                  {[!isHomeTeam ? 'our' : 'opp', !isHomeTeam ? 'opp' : 'our'].map((team, rowIdx) => {
                    const isOur = team === 'our';
                    const isFirst = rowIdx === 0; // 先攻行
                    return (
                      <tr key={team} className={isFirst ? 'border-b border-gray-200' : ''}>
                        <td className={`px-3 py-2 text-left font-bold text-base ${
                          isOur ? 'text-primary-700 bg-primary-50' : 'text-gray-700 bg-gray-50'
                        }`}>
                          <div className="text-xs font-semibold text-gray-400 mb-0.5">{isFirst ? '先攻' : '後攻'}</div>
                          {isOur ? (ourTeamName || 'ポストン') : (opponent || '相手チーム')}
                        </td>
                        {inningScores.map((s, i) => (
                          <td key={i} className="px-1 py-2">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={(isOur ? s.ourScore : s.opponentScore) ?? ''}
                              onChange={e => handleInningChange(i, isOur ? 'ourScore' : 'opponentScore', e.target.value)}
                              className={`w-10 h-10 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 ${
                                isOur ? 'text-primary-700' : 'text-gray-700'
                              }`}
                            />
                          </td>
                        ))}
                        <td className={`px-3 py-2 text-2xl font-bold ${
                          isOur ? 'text-primary-700 bg-primary-50' : 'text-gray-700 bg-gray-50'
                        }`}>
                          {isOur ? ourTotal : oppTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 延長イニング追加/削除 */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                type="button"
                onClick={addInning}
                className="bg-primary-100 text-primary-700 px-4 py-2 rounded-lg font-bold hover:bg-primary-200 transition-colors text-lg"
              >
                ＋ 延長イニング追加
              </button>
              {inningScores.length > 1 && (
                <button
                  type="button"
                  onClick={removeLastInning}
                  className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors text-lg"
                >
                  － 最終イニング削除
                </button>
              )}
            </div>

            {/* x表示トグル */}
            <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={showX}
                onChange={e => setShowX(e.target.checked)}
                className="w-5 h-5 accent-primary-500"
              />
              <span className="text-lg text-gray-700">後攻チームの最終回に <span className="font-bold">x</span> を表示する（後攻が勝った場合）</span>
            </label>

            {/* 合計スコアプレビュー */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center border-2 border-gray-200">
              <p className="text-gray-500 text-base mb-1">合計スコア（自動計算）</p>
              <p className="text-4xl font-bold text-gray-800">
                {ourTotal} <span className="text-gray-400 text-2xl">－</span> {oppTotal}
              </p>
            </div>
          </div>

          {/* メモ */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">📝 メモ</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="例：序盤リードを守り切った、MVP: 〇〇選手"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-4 pb-8">
            <Link
              href="/admin/game-results"
              className="flex-1 text-center bg-gray-200 text-gray-700 py-4 rounded-xl text-xl font-bold hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-500 text-white py-4 rounded-xl text-xl font-bold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : '💾 保存する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
