'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import FileUpload from '@/components/FileUpload';
import { Attachment } from '@/types';

interface EventFormProps {
  onSuccess?: () => void;
}

export default function EventForm({ onSuccess }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'practice' as 'practice' | 'game' | 'meeting' | 'other',
    date: '',
    startTime: '10:00',
    endTime: '12:00',
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.title || !formData.date) {
        throw new Error('タイトルと日付は必須です');
      }

      const [chkStartHour] = formData.startTime.split(':').map(Number);
      const [chkEndHour] = formData.endTime.split(':').map(Number);
      if (chkStartHour < 5 || chkStartHour > 21 || chkEndHour < 5 || chkEndHour > 21) {
        throw new Error('時間は 5:00 ～ 21:00 の範囲で入力してください');
      }

      const db = getDbInstance();

      // 日付と時刻を組み合わせて Date オブジェクトを作成
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);

      const startDate = new Date(formData.date);
      startDate.setHours(startHour, startMin, 0, 0);

      const endDate = new Date(formData.date);
      endDate.setHours(endHour, endMin, 0, 0);

      console.log('📝 予定を保存中:', {
        title: formData.title,
        startDate,
        endDate,
      });

      const docRef = await addDoc(collection(db, 'events'), {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        type: formData.type,
        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(endDate),
        attachments: attachments,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log('✅ 予定を保存しました:', docRef.id);

      // 成功時は即座に遷移（ローディングを完了させてから遷移）
      setLoading(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予定の作成に失敗しました';
      console.error('❌ エラー:', errorMessage, err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📅 新規予定作成</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
          ✅ 予定を作成しました！
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* タイトル */}
        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-700">
            予定名 *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="例：通常練習"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        {/* 予定タイプ */}
        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-700">
            予定タイプ
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="practice">練習</option>
            <option value="game">試合</option>
            <option value="meeting">ミーティング</option>
            <option value="other">その他</option>
          </select>
        </div>

        {/* 日付 */}
        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-700">
            日付 *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>

        {/* 開始時刻・終了時刻 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-700">
              開始時刻
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              min="05:00"
              max="21:00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-lg font-semibold mb-2 text-gray-700">
              終了時刻
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              min="05:00"
              max="21:00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 場所 */}
        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-700">
            場所
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="例：グラウンドA"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* 説明 */}
        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-700">
            説明
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="詳細な説明を入力してください"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* ファイルアップロード */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            📎 ファイル添付（Excel、PDF等）
          </h3>
          <FileUpload 
            onUploadComplete={handleFileUploadComplete}
            acceptedTypes=".xlsx,.xls,.doc,.docx,.pdf,.png,.jpg,.jpeg"
            maxSizeMB={10}
          />

          {/* 添付ファイル一覧 */}
          {attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-gray-700">添付ファイル:</h4>
              <ul className="space-y-2">
                {attachments.map(att => (
                  <li
                    key={att.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="font-medium text-gray-800">{att.name}</p>
                        <p className="text-sm text-gray-500">
                          {(att.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-500 text-white py-3 rounded-lg font-bold text-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {loading ? '作成中...' : '予定を作成'}
        </button>
      </form>
    </div>
  );
}
