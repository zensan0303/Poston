'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import Calendar from '@/components/Calendar';
import EventModal from '@/components/EventModal';
import MarqueeBanner from '@/components/MarqueeBanner';
import Link from 'next/link';
import { Event } from '@/types';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // バックグラウンドでFirebaseからデータを取得
    fetchEventsInBackground();
  }, []);

  const fetchEventsInBackground = async () => {
    try {
      const db = getDbInstance();
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('start', 'asc'),
        limit(200)
      );
      
      const querySnapshot = await getDocs(eventsQuery);

      const fetchedEvents: Event[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: data.start.toDate(),
          end: data.end.toDate(),
          type: data.type,
          description: data.description,
          location: data.location,
          attachments: data.attachments || [],
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
      });
      
      // Firestoreにデータがあれば更新
      if (fetchedEvents.length > 0) {
        setEvents(fetchedEvents);
      }
    } catch (error) {
      console.error('イベント取得エラー:', error);
      const err = error as any;
      if (err?.code === 'permission-denied') {
        setError('🔒 権限がありません。Firebaseのセキュリティルールを確認してください。');
      } else if (err?.code === 'unavailable') {
        setError('📡 Firebaseに接続できません。ネットワークを確認してください。');
      } else {
        setError(`⚠️ エラーが発生しました: ${err?.message || '不明'}`);
      }
    }
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* ヘッダー */}
      <header className="bg-primary-500 text-white p-4 md:p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl-mobile md:text-3xl font-bold whitespace-nowrap">
            ⚾ ポストン
          </h1>
          
          {/* メニューボタン（モバイル） */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden bg-white text-primary-600 px-4 py-2 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
          >
            メニュー
          </button>

          {/* ナビゲーション（デスクトップ） */}
          <nav className="hidden md:flex gap-4">
            <Link 
              href="/results"
              className="bg-white text-primary-600 px-6 py-2 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
            >
              🏆 試合結果
            </Link>
            <Link 
              href="/contact"
              className="bg-white text-primary-600 px-6 py-2 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
            >
              📧 お問い合わせ
            </Link>
            <Link 
              href="/admin/login"
              className="bg-primary-700 text-white px-6 py-2 rounded-lg text-lg font-bold hover:bg-primary-800 transition-colors"
            >
              🔐 管理者
            </Link>
          </nav>
        </div>

        {/* モバイルメニュー */}
        {menuOpen && (
          <div className="md:hidden mt-4 space-y-2">
            <Link 
              href="/results"
              className="block bg-white text-primary-600 px-6 py-3 rounded-lg text-xl font-bold hover:bg-gray-100 transition-colors text-center"
              onClick={() => setMenuOpen(false)}
            >
              🏆 試合結果
            </Link>
            <Link 
              href="/contact"
              className="block bg-white text-primary-600 px-6 py-3 rounded-lg text-xl font-bold hover:bg-gray-100 transition-colors text-center"
              onClick={() => setMenuOpen(false)}
            >
              📧 お問い合わせ
            </Link>
            <Link 
              href="/admin/login"
              className="block bg-primary-700 text-white px-6 py-3 rounded-lg text-xl font-bold hover:bg-primary-800 transition-colors text-center"
              onClick={() => setMenuOpen(false)}
            >
              🔐 管理者ログイン
            </Link>
          </div>
        )}
      </header>

      {/* お知らせバナー */}
      <MarqueeBanner />

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <h2 className="text-2xl-mobile md:text-3xl font-bold mb-4 text-center text-gray-800">
          📅 予定カレンダー
        </h2>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <p className="text-lg text-orange-700">{error}</p>
          </div>
        )}

        {/* 凡例 */}
        <div className="mb-6 flex flex-wrap gap-3 justify-center">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-4 h-4 bg-[#00bfff] rounded flex-shrink-0"></div>
            <span className="text-base md:text-lg">練習</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-4 h-4 bg-[#ff6b6b] rounded flex-shrink-0"></div>
            <span className="text-base md:text-lg">試合</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-4 h-4 bg-[#868e96] rounded flex-shrink-0"></div>
            <span className="text-base md:text-lg">その他</span>
          </div>
        </div>

        {/* カレンダー */}
        <Calendar 
          events={events} 
          onSelectEvent={handleSelectEvent}
        />

        {/* 注意書き */}
        <div className="mt-6 bg-blue-50 border-l-4 border-primary-500 p-4 rounded">
          <p className="text-lg text-gray-700">
            💡 予定をタップすると詳細が表示されます
          </p>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-100 mt-16 py-6">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p className="text-lg">© 2026 ポストン</p>
        </div>
      </footer>

      {/* イベント詳細モーダル */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
