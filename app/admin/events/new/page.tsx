'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EventForm from '@/components/EventForm';
import Link from 'next/link';

export default function NewEventPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

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
      <header className="bg-primary-500 text-white p-4 md:p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl-mobile md:text-3xl font-bold">
            📅 新規予定作成
          </h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <EventForm onSuccess={() => router.push('/admin/events')} />

        {/* ナビゲーション */}
        <div className="mt-8 text-center">
          <Link
            href="/admin/events"
            className="text-primary-600 hover:text-primary-800 underline text-lg"
          >
            ← 予定管理に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
