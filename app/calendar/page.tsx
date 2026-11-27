'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import Calendar from '@/components/Calendar';
import EventModal from '@/components/EventModal';
import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import { Event } from '@/types';

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

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
      // デモデータを表示
      setEvents([
        {
          id: '1',
          title: '練習',
          start: new Date(2026, 1, 20, 10, 0),
          end: new Date(2026, 1, 20, 12, 0),
          type: 'practice',
          description: '通常練習',
          location: 'グラウンドA',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: '試合 vs チームB',
          start: new Date(2026, 1, 22, 14, 0),
          end: new Date(2026, 1, 22, 16, 0),
          type: 'game',
          description: '公式戦',
          location: 'スタジアム',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
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
        <div className="max-w-6xl mx-auto flex items-center justify-start">
          <Link href="/" className="text-2xl-mobile md:text-3xl font-bold hover:opacity-80">
            ← ホーム
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {/* 凡例 */}
        <div className="mb-6 flex flex-wrap gap-4 justify-center md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#00bfff] rounded"></div>
            <span className="text-lg">練習</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#ff6b6b] rounded"></div>
            <span className="text-lg">試合</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#51cf66] rounded"></div>
            <span className="text-lg">ミーティング</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#868e96] rounded"></div>
            <span className="text-lg">その他</span>
          </div>
        </div>

        {/* カレンダー */}
        <Calendar 
          events={events} 
          onSelectEvent={handleSelectEvent}
        />

        {/* 注意書き */}
        <div className="mt-6 bg-blue-50 border-l-4 border-primary-500 p-4 rounded">
          <p className="text-lg text-gray-700 inline-flex items-center gap-2">
            <Lightbulb size={20} aria-hidden="true" className="text-primary-600" />
            予定をタップすると詳細が表示されます
          </p>
        </div>
      </main>

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
