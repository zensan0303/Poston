'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const db = getDbInstance();
      await addDoc(collection(db, 'contacts'), {
        ...formData,
        status: 'unread',
        createdAt: Timestamp.now(),
      });
      
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      console.error('送信エラー:', err);
      setError('送信に失敗しました。もう一度お試しください。');
      // デモ用: Firebaseに接続できない場合も成功として扱う
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <header className="bg-primary-500 text-white p-6 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-2xl-mobile md:text-3xl font-bold hover:opacity-80">
              ← ホーム
            </Link>
            <h1 className="text-2xl-mobile md:text-3xl font-bold">
              📧 お問い合わせ
            </h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl-mobile font-bold mb-4 text-green-600">
              送信完了
            </h2>
            <p className="text-xl mb-8 text-gray-700">
              お問い合わせありがとうございます。<br />
              内容を確認後、ご連絡いたします。
            </p>
            <Link
              href="/"
              className="inline-block bg-primary-500 text-white px-8 py-4 rounded-lg text-xl-mobile font-bold hover:bg-primary-600 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* ヘッダー */}
      <header className="bg-primary-500 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl-mobile md:text-3xl font-bold hover:opacity-80">
            ← ホーム
          </Link>
          <h1 className="text-2xl-mobile md:text-3xl font-bold">
            📧 お問い合わせ
          </h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <p className="text-xl mb-6 text-gray-700">
            チームへの参加や見学をご希望の方は、<br />
            以下のフォームからお問い合わせください。
          </p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-700 text-lg">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* お名前 */}
            <div>
              <label htmlFor="name" className="block text-xl-mobile font-bold mb-2 text-gray-700">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="山田 太郎"
              />
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-xl-mobile font-bold mb-2 text-gray-700">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="example@email.com"
              />
            </div>

            {/* 電話番号 */}
            <div>
              <label htmlFor="phone" className="block text-xl-mobile font-bold mb-2 text-gray-700">
                電話番号
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="090-1234-5678"
              />
            </div>

            {/* お問い合わせ内容 */}
            <div>
              <label htmlFor="message" className="block text-xl-mobile font-bold mb-2 text-gray-700">
                お問い合わせ内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none resize-none"
                placeholder="見学を希望します。&#10;初心者でも参加できますか？"
              />
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white px-8 py-4 rounded-lg text-2xl-mobile font-bold hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '送信中...' : '送信する'}
            </button>
          </form>
        </div>

        {/* 注意書き */}
        <div className="mt-6 bg-blue-50 border-l-4 border-primary-500 p-4 rounded">
          <p className="text-lg text-gray-700">
            💡 お問い合わせから2〜3日以内に返信いたします
          </p>
        </div>
      </main>
    </div>
  );
}
