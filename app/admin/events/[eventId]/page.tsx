'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { getDbInstance, getStorageInstance } from '@/lib/firebase';
import FileUpload from '@/components/FileUpload';
import { Attachment } from '@/types';
import { isSafeAttachmentUrl, sanitizePlainText } from '@/lib/security';

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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
        // 添付ファイルを読み込む
        if (data.attachments && Array.isArray(data.attachments)) {
          setAttachments(data.attachments.map((att: Attachment) => {
            const ts = att.uploadedAt as unknown;
            const uploadedAt =
              typeof (ts as { toDate?: unknown }).toDate === 'function'
                ? (ts as { toDate: () => Date }).toDate()
                : ts instanceof Date
                ? ts
                : new Date();
            return { ...att, uploadedAt };
          }));
        }
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
    if (name === 'start' || name === 'end') {
      const [datePart, timePart] = value.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
      setFormData(prev => ({ ...prev, [name]: localDate }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 添付ファイル追加
  const handleFileUploadComplete = (url: string, fileName: string, fileSize: number) => {
    const newAttachment: Attachment = {
      id: Date.now().toString(),
      name: fileName,
      url,
      type: fileName.split('.').pop() || 'file',
      size: fileSize,
      uploadedAt: new Date(),
    };
    setAttachments(prev => [...prev, newAttachment]);
  };

  // 添付ファイル削除（StorageからもFirestoreからも即削除）
  const handleRemoveAttachment = async (att: Attachment) => {
    if (!confirm(`「${att.name}」を削除しますか？`)) return;
    try {
      // Storage からファイルを削除（URL からパスを抽出）
      const url = new URL(att.url);
      const pathMatch = url.pathname.match(/\/o\/(.+)/);
      if (pathMatch) {
        const storagePath = decodeURIComponent(pathMatch[1].split('?')[0]);
        const storageRef = ref(getStorageInstance(), storagePath);
        await deleteObject(storageRef).catch(() => {/* すでに削除済みは無視 */});
      }
    } catch {/* Storage削除失敗は無視してリストからは除去 */}
    setAttachments(prev => prev.filter(a => a.id !== att.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const db = getDbInstance();
      const safeAttachments = attachments.filter((att) => isSafeAttachmentUrl(att.url));
      await updateDoc(doc(db, 'events', eventId), {
        title: sanitizePlainText(formData.title, 120),
        description: sanitizePlainText(formData.description, 3000),
        location: sanitizePlainText(formData.location, 120),
        type: formData.type,
        start: formData.start,
        end: formData.end,
        attachments: safeAttachments,
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

  // toISOString()はUTCを返すため9時間ズレる → ローカル時刻で文字列を生成
  const toLocalDateTimeString = (date: Date) => {
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${mo}-${d}T${h}:${mi}`;
  };

  const startStr = toLocalDateTimeString(formData.start);
  const endStr = toLocalDateTimeString(formData.end);

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

          {/* 添付ファイル */}
          <div className="mb-6 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-700 mb-3">📎 添付ファイル</h3>

            {/* 現在の添付ファイル一覧 */}
            {attachments.length > 0 && (
              <ul className="space-y-2 mb-4">
                {attachments.map(att => (
                  <li
                    key={att.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl flex-shrink-0">📄</span>
                      <div className="min-w-0">
                        {isSafeAttachmentUrl(att.url) ? (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary-600 hover:underline truncate block"
                          >
                            {att.name}
                          </a>
                        ) : (
                          <span className="font-medium text-gray-500 truncate block">
                            {att.name}（安全でないURL）
                          </span>
                        )}
                        <p className="text-sm text-gray-500">
                          {(att.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att)}
                      className="flex-shrink-0 ml-3 bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors"
                    >
                      🗑 削除
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* 新規アップロード */}
            <FileUpload
              onUploadComplete={handleFileUploadComplete}
              acceptedTypes=".xlsx,.xls,.doc,.docx,.pdf,.png,.jpg,.jpeg"
              maxSizeMB={10}
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
