'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-2xl text-primary-600">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* ヘッダー */}
      <header className="bg-primary-500 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl-mobile md:text-4xl font-bold">
              🔐 管理ダッシュボード
            </h1>
            <button
              onClick={handleLogout}
              className="bg-white text-primary-600 px-6 py-2 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
            >
              ログアウト
            </button>
          </div>
          <p className="text-lg">ログイン中: {user.email}</p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 予定管理カード */}
          <Link href="/admin/events">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-primary-200 hover:border-primary-500">
              <div className="text-5xl mb-4 text-center">📅</div>
              <h2 className="text-2xl-mobile font-bold text-center mb-2 text-primary-700">
                予定管理
              </h2>
              <p className="text-center text-gray-600 text-lg">
                練習・試合の予定を追加・編集
              </p>
            </div>
          </Link>

          {/* 試合結果管理カード */}
          <Link href="/admin/game-results">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-primary-200 hover:border-primary-500">
              <div className="text-5xl mb-4 text-center">🏆</div>
              <h2 className="text-2xl-mobile font-bold text-center mb-2 text-primary-700">
                試合結果管理
              </h2>
              <p className="text-center text-gray-600 text-lg">
                試合結果を追加・編集
              </p>
            </div>
          </Link>

          {/* お問い合わせ管理カード */}
          <Link href="/admin/contacts">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-primary-200 hover:border-primary-500">
              <div className="text-5xl mb-4 text-center">📧</div>
              <h2 className="text-2xl-mobile font-bold text-center mb-2 text-primary-700">
                お問い合わせ管理
              </h2>
              <p className="text-center text-gray-600 text-lg">
                お問い合わせを確認・返信
              </p>
            </div>
          </Link>

          {/* お知らせバナー管理カード */}
          <Link href="/admin/announcement">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-primary-200 hover:border-primary-500">
              <div className="text-5xl mb-4 text-center">📢</div>
              <h2 className="text-2xl-mobile font-bold text-center mb-2 text-primary-700">
                お知らせバナー
              </h2>
              <p className="text-center text-gray-600 text-lg">
                トップページの流れる帯を編集
              </p>
            </div>
          </Link>
        </div>

        {/* 注意書き */}
        <div className="mt-8 bg-blue-50 border-l-4 border-primary-500 p-4 rounded">
          <p className="text-lg text-gray-700">
            💡 各メニューから予定や試合結果を管理できます
          </p>
        </div>

        {/* ホームに戻るリンク */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-800 underline text-xl"
          >
            ← ホームに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
