'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      console.error('ログインエラー:', err);
      const authError = err as { code?: string };
      
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found') {
        setError('メールアドレスまたはパスワードが間違っています');
      } else if (authError.code === 'auth/too-many-requests') {
        setError('ログイン試行回数が多すぎます。しばらくしてから再度お試しください');
      } else {
        setError('ログインに失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl-mobile font-bold text-gray-800 mb-2">
              管理者ログイン
            </h1>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <p className="text-red-700 text-lg">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xl-mobile font-bold mb-2 text-gray-700">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xl-mobile font-bold mb-2 text-gray-700">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white px-8 py-4 rounded-lg text-2xl-mobile font-bold hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-800 underline text-lg"
            >
              ← ホームに戻る
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
