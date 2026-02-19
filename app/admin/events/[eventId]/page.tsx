'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';

interface EventData {
  title: string;
  description: string;
  location: string;
  type: string;
  start: Date;
  end: Date;
}

export default function EditEvent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EventData>({
    title: '',
    description: '',
    location: '',
    type: 'practice',
    start: new Date(),
    end: new Date(),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchEvent();
    }
  }, [user, eventId]);

  const fetchEvent = async () => {
    try {
      const db = getDbInstance();
      const eventDoc = await getDoc(doc(db, 'events', eventId));

      if (eventDoc.exists()) {
        const data = eventDoc.data();
        setFormData({
          title: data.title,
          description: data.description,
          location: data.location,
          type: data.type,
          start: data.start.toDate(),
          end: data.end.toDate(),
        });
      } else {
        alert('予定が見つかりません');
        router.push('/admin/events');
      }
    } catch (error) {
      console.error('取得エラー:', error);
      alert('予定の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'start' || name === 'end' ? new Date(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const db = getDbInstance();
      await updateDoc(doc(db, 'events', eventId), {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        type: formData.type,
        start: formData.start,
        end: formData.end,
        updatedAt: serverTimestamp(),
      });

      alert('予定を更新しました');
      router.push('/admin/events');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
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

  const startStr = formData.start.toISOString().slice(0, 16);
  const endStr = formData.end.toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* ヘッダー */}
      <header className="bg-primary-500 text-white p-4 md:p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl-mobile md:text-3xl font-bold">📅 予定編集</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto p-4 md:p-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg p-6 md:p-8"
        >
          {/* タイトル */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-700 mb-2">
              タイトル *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* 種類 */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-700 mb-2">
              種類 *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-primary-500"
            >
              <option value="practice">練習</option>
              <option value="game">試合</option>
              <option value="other">その他</option>
            </select>
          </div>

          {/* 説明 */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-700 mb-2">
              説明
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* 場所 */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-700 mb-2">
              場所 *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* 開始日時 */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-700 mb-2">
              開始日時 *
            </label>
            <input
              type="datetime-local"
              name="start"
              value={startStr}
              onChange={handleChange}
              required
              step={3600}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-primary-500"
            />
            <p className="text-sm text-gray-500 mt-1">時間は 5:00 ～ 21:00 の範囲で入力してください</p>
          </div>

          {/* 終了日時 */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-700 mb-2">
              終了日時 *
            </label>
            <input
              type="datetime-local"
              name="end"
              value={endStr}
              onChange={handleChange}
              required
              step={3600}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-4 justify-between">
            <Link
              href="/admin/events"
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors text-lg"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-600 transition-colors text-lg disabled:opacity-50"
            >
              {saving ? '保存中...' : '更新'}
            </button>
          </div>
        </form>

        {/* 戻るリンク */}
        <div className="mt-6 text-center">
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
