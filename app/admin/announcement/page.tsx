'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import Link from 'next/link';

export default function AnnouncementAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [text, setText] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchAnnouncement();
    }
  }, [user]);

  const fetchAnnouncement = async () => {
    try {
      const db = getDbInstance();
      const docRef = doc(db, 'settings', 'announcement');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setText(data.text || '');
        setIsVisible(data.isVisible !== false);
      }
    } catch (error) {
      console.error('お知らせの取得に失敗:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const db = getDbInstance();
      await setDoc(doc(db, 'settings', 'announcement'), {
        text,
        isVisible,
        updatedAt: new Date(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('保存に失敗:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
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
      <header className="bg-primary-500 text-white p-6 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">📢 お知らせバナー管理</h1>
          <Link
            href="/admin/dashboard"
            className="bg-white text-primary-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            ← 戻る
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
          {/* プレビュー */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-3">プレビュー</h2>
            <div className="bg-yellow-400 text-gray-900 overflow-hidden py-2 rounded-lg">
              <div className="relative flex items-center">
                <span className="shrink-0 bg-yellow-500 font-bold px-3 py-0.5 mr-2 text-base rounded">
                  📢 お知らせ
                </span>
                <span className="text-base font-medium truncate">
                  {text || '（テキストを入力してください）'}
                </span>
              </div>
            </div>
          </div>

          <hr />

          {/* テキスト入力 */}
          <div>
            <label className="block text-xl font-bold text-gray-700 mb-2">
              流れるテキスト
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:border-primary-500 focus:outline-none resize-none"
              placeholder="例：次回の練習は3月1日（土）10:00〜グラウンドAです。みなさんの参加をお待ちしています！"
            />
            <p className="text-sm text-gray-500 mt-1">複数の文章を入れると繰り返し流れます</p>
          </div>

          {/* 表示・非表示トグル */}
          <div>
            <p className="text-xl font-bold text-gray-700 mb-3">バナーの表示設定</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsVisible(true)}
                className={`flex-1 py-3 rounded-xl text-lg font-bold border-2 transition-colors ${
                  isVisible
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                ✅ 表示する
              </button>
              <button
                type="button"
                onClick={() => setIsVisible(false)}
                className={`flex-1 py-3 rounded-xl text-lg font-bold border-2 transition-colors ${
                  !isVisible
                    ? 'bg-gray-500 text-white border-gray-500'
                    : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                🚫 非表示
              </button>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary-500 text-white px-8 py-3 rounded-xl text-xl font-bold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '💾 保存する'}
            </button>
            {saved && (
              <span className="text-green-600 text-lg font-bold animate-pulse">
                ✅ 保存しました！
              </span>
            )}
          </div>
        </div>

        {/* 使い方メモ */}
        <div className="mt-6 bg-blue-50 border-l-4 border-primary-500 p-4 rounded">
          <p className="text-lg text-gray-700 font-bold mb-1">💡 使い方</p>
          <ul className="text-gray-600 space-y-1 list-disc list-inside">
            <li>テキストを入力して「保存する」を押すと、トップページの帯に表示されます</li>
            <li>バナーを非表示にすると帯ごと消えます</li>
            <li>テキストが空の場合も帯は表示されません</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
