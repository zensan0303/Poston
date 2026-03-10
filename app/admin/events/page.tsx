'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import { Event } from '@/types';
import Calendar from '@/components/Calendar';

type ViewMode = 'calendar' | 'list';

const TYPE_LABEL: Record<string, string> = {
  practice: '練習',
  game: '試合',
  meeting: 'ミーティング',
  other: 'その他',
};
const TYPE_COLOR: Record<string, string> = {
  practice: 'bg-blue-500',
  game: 'bg-red-500',
  meeting: 'bg-gray-500',
  other: 'bg-gray-500',
};

export default function EventsManagement() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

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

      const fetchedEvents: Event[] = querySnapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
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
    if (!confirm('この予定を削除してもよろしいですか？')) return;
    try {
      const db = getDbInstance();
      await deleteDoc(doc(db, 'events', eventId));
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setSelectedEvent(null);
      alert('予定を削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const handleSelectSlot = ({ start }: { start: Date; end: Date }) => {
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, '0');
    const d = String(start.getDate()).padStart(2, '0');
    router.push(`/admin/events/new?date=${y}-${m}-${d}`);
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl md:text-3xl font-bold whitespace-nowrap">
              📅 予定管理
            </h1>
            <div className="flex gap-2 flex-wrap justify-end">
              {/* 表示切り替え */}
              <div className="flex rounded-lg overflow-hidden border border-white/40">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-2 text-sm font-bold transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                >
                  📅 カレンダー
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-bold transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-primary-600'
                      : 'bg-primary-700 text-white hover:bg-primary-800'
                  }`}
                >
                  📋 リスト
                </button>
              </div>
              <Link
                href="/admin/events/new"
                className="bg-white text-primary-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors text-sm"
              >
                ➕ 新規追加
              </Link>
              <Link
                href="/admin/dashboard"
                className="bg-primary-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-800 transition-colors text-sm"
              >
                戻る
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {events.length === 0 && viewMode === 'list' ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-lg text-gray-600 mb-4">予定がまだ登録されていません</p>
            <Link
              href="/admin/events/new"
              className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-600 transition-colors"
            >
              ➕ 最初の予定を追加
            </Link>
          </div>
        ) : viewMode === 'calendar' ? (
          /* ─── カレンダー表示 ─── */
          <>
            <p className="text-sm text-gray-500 mb-3">
              💡 予定をタップ → 編集・削除　／　日付の空欄をタップ → 新規追加
            </p>
            <Calendar
              events={events}
              onSelectEvent={(event) => setSelectedEvent(event)}
              onSelectSlot={handleSelectSlot}
            />
          </>
        ) : (
          /* ─── リスト表示 ─── */
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
                  <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-bold text-white ${TYPE_COLOR[event.type] ?? 'bg-gray-500'}`}>
                    {TYPE_LABEL[event.type] ?? event.type}
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

        <div className="mt-6 text-center">
          <Link
            href="/admin/dashboard"
            className="text-primary-600 hover:text-primary-800 underline text-lg"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>
      </main>

      {/* カレンダーから予定を選択したときの管理者モーダル */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* タイプバッジ */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${TYPE_COLOR[selectedEvent.type] ?? 'bg-gray-500'}`}>
                {TYPE_LABEL[selectedEvent.type] ?? selectedEvent.type}
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-3 leading-tight">
              {selectedEvent.title}
            </h2>

            <div className="text-sm text-gray-600 space-y-1.5 mb-5">
              <p>🕐 開始：{selectedEvent.start.toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p>🕐 終了：{selectedEvent.end.toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              {selectedEvent.location && <p>📍 {selectedEvent.location}</p>}
              {selectedEvent.description && (
                <p className="mt-2 text-gray-500 whitespace-pre-wrap">{selectedEvent.description}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/admin/events/${selectedEvent.id}`}
                className="w-full text-center bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
              >
                ✏️ 編集する
              </Link>
              <button
                onClick={() => handleDelete(selectedEvent.id)}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                🗑️ 削除する
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
