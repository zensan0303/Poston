'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import { Event } from '@/types';

export default function EventsManagement() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const db = getDbInstance();
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('start', 'asc')
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

      setEvents(fetchedEvents);
    } catch (error) {
      console.error('イベントの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('この予定を削除してもよろしいですか？')) {
      return;
    }

    try {
      const db = getDbInstance();
      await deleteDoc(doc(db, 'events', eventId));
      setEvents(events.filter(event => event.id !== eventId));
      alert('予定を削除しました');
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* ヘッダー */}
      <header className="bg-primary-500 text-white p-4 md:p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl-mobile md:text-3xl font-bold">
              📅 予定管理
            </h1>
            <div className="flex gap-2">
              <Link
                href="/admin/events/new"
                className="bg-white text-primary-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                ➕ 新規追加
              </Link>
              <Link
                href="/admin/dashboard"
                className="bg-primary-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-800 transition-colors"
              >
                戻る
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-lg text-gray-600 mb-4">予定がまだ登録されていません</p>
            <Link
              href="/admin/events/new"
              className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-600 transition-colors"
            >
              ➕ 最初の予定を追加
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-md p-4 border-l-4 border-primary-400"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-lg font-bold text-primary-700 leading-tight">
                    {event.title}
                  </span>
                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-sm font-bold text-white ${
                      event.type === 'practice'
                        ? 'bg-blue-500'
                        : event.type === 'game'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                    }`}
                  >
                    {event.type === 'practice'
                      ? '練習'
                      : event.type === 'game'
                      ? '試合'
                      : 'その他'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5 mb-3">
                  <p>🕐 開始：{event.start.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p>🕐 終了：{event.end.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  {event.location && <p>📍 {event.location}</p>}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="flex-1 text-center bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors text-sm"
                  >
                    ✏️ 編集
                  </Link>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️ 削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ホームに戻るリンク */}
        <div className="mt-6 text-center">
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
