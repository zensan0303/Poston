'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ContactMessage } from '@/types';

type StatusFilter = 'all' | 'unread' | 'read' | 'replied';

const STATUS_LABEL: Record<ContactMessage['status'], string> = {
  unread: '未読',
  read: '既読',
  replied: '返信済み',
};

const STATUS_COLOR: Record<ContactMessage['status'], string> = {
  unread: 'bg-red-100 text-red-700 border-red-300',
  read: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  replied: 'bg-green-100 text-green-700 border-green-300',
};

export default function AdminContactsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      const db = getDbInstance();
      const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data: ContactMessage[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name,
          email: d.email,
          phone: d.phone || undefined,
          message: d.message,
          status: d.status ?? 'unread',
          createdAt:
            d.createdAt instanceof Timestamp
              ? d.createdAt.toDate()
              : new Date(d.createdAt),
        };
      });
      setContacts(data);
    } catch (error) {
      console.error('お問い合わせの取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ContactMessage['status']) => {
    setUpdatingId(id);
    try {
      const db = getDbInstance();
      await updateDoc(doc(db, 'contacts', id), { status: newStatus });
      setContacts(prev =>
        prev.map(c => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const db = getDbInstance();
      await deleteDoc(doc(db, 'contacts', id));
      setContacts(prev => prev.filter(c => c.id !== id));
      setDeleteTargetId(null);
      if (expandedId === id) setExpandedId(null);
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const filteredContacts = contacts.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const unreadCount = contacts.filter(c => c.status === 'unread').length;

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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="text-xl md:text-2xl font-bold hover:opacity-80"
          >
            ← ダッシュボード
          </Link>
          <h1 className="text-xl md:text-2xl font-bold">
            📧 お問い合わせ管理
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8">

        {/* サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(
            [
              { label: '全件', value: contacts.length, color: 'bg-white border-gray-200' },
              { label: '未読', value: contacts.filter(c => c.status === 'unread').length, color: 'bg-red-50 border-red-200' },
              { label: '既読', value: contacts.filter(c => c.status === 'read').length, color: 'bg-yellow-50 border-yellow-200' },
              { label: '返信済み', value: contacts.filter(c => c.status === 'replied').length, color: 'bg-green-50 border-green-200' },
            ] as const
          ).map(item => (
            <div
              key={item.label}
              className={`${item.color} border-2 rounded-lg p-4 text-center`}
            >
              <div className="text-3xl font-bold text-gray-800">{item.value}</div>
              <div className="text-lg text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>

        {/* フィルター */}
        <div className="flex flex-wrap gap-3 mb-6">
          {(
            [
              { key: 'all', label: 'すべて' },
              { key: 'unread', label: '未読' },
              { key: 'read', label: '既読' },
              { key: 'replied', label: '返信済み' },
            ] as const
          ).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2 rounded-full text-lg font-bold border-2 transition-colors ${
                filter === f.key
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
              }`}
            >
              {f.label}
              {f.key === 'unread' && unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-sm rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 一覧 */}
        {filteredContacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-xl">
            該当するお問い合わせはありません
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                className={`bg-white rounded-lg shadow-md border-l-4 ${
                  contact.status === 'unread'
                    ? 'border-red-400'
                    : contact.status === 'read'
                    ? 'border-yellow-400'
                    : 'border-green-400'
                }`}
              >
                {/* カードヘッダー */}
                <div className="p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    {/* 名前・日時 */}
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-bold text-gray-800">
                          {contact.name}
                        </span>
                        <span
                          className={`text-sm font-bold border rounded-full px-3 py-0.5 ${STATUS_COLOR[contact.status]}`}
                        >
                          {STATUS_LABEL[contact.status]}
                        </span>
                      </div>
                      <div className="text-gray-500 text-base mt-1">
                        {contact.createdAt.toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* 詳細ボタン */}
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === contact.id ? null : contact.id)
                      }
                      className="bg-primary-100 text-primary-700 px-4 py-2 rounded-lg text-lg font-bold hover:bg-primary-200 transition-colors"
                    >
                      {expandedId === contact.id ? '閉じる ▲' : '詳細を見る ▼'}
                    </button>
                  </div>

                  {/* メッセージプレビュー（折りたたみ時） */}
                  {expandedId !== contact.id && (
                    <p className="text-gray-600 text-base line-clamp-2">
                      {contact.message}
                    </p>
                  )}
                </div>

                {/* 展開エリア */}
                {expandedId === contact.id && (
                  <div className="border-t border-gray-100 p-4 md:p-5 bg-gray-50 rounded-b-lg">
                    {/* 連絡先情報 */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500 font-bold mb-1">メールアドレス</div>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-primary-600 underline text-lg break-all"
                        >
                          {contact.email}
                        </a>
                      </div>
                      {contact.phone && (
                        <div>
                          <div className="text-sm text-gray-500 font-bold mb-1">電話番号</div>
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-primary-600 underline text-lg"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* メッセージ本文 */}
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 font-bold mb-1">メッセージ</div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-800 text-lg whitespace-pre-wrap">
                        {contact.message}
                      </div>
                    </div>

                    {/* アクション */}
                    <div className="flex flex-wrap gap-3 items-center">
                      {/* ステータス変更 */}
                      <div className="flex flex-wrap gap-2">
                        {(['unread', 'read', 'replied'] as ContactMessage['status'][]).map(
                          s => (
                            <button
                              key={s}
                              disabled={contact.status === s || updatingId === contact.id}
                              onClick={() => handleStatusChange(contact.id, s)}
                              className={`px-4 py-2 rounded-lg text-base font-bold border-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                contact.status === s
                                  ? STATUS_COLOR[s] + ' cursor-default'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                              }`}
                            >
                              {updatingId === contact.id && contact.status !== s
                                ? '更新中...'
                                : STATUS_LABEL[s]}
                            </button>
                          )
                        )}
                      </div>

                      {/* 返信リンク */}
                      <a
                        href={`mailto:${contact.email}?subject=Re: お問い合わせへのご回答&body=%0D%0A%0D%0A----%0D%0A${encodeURIComponent(contact.name)} 様のお問い合わせ:%0D%0A${encodeURIComponent(contact.message)}`}
                        onClick={() => {
                          if (contact.status === 'unread') {
                            handleStatusChange(contact.id, 'read');
                          }
                        }}
                        className="bg-primary-500 text-white px-4 py-2 rounded-lg text-base font-bold hover:bg-primary-600 transition-colors"
                      >
                        📨 メールで返信
                      </a>

                      {/* 削除ボタン */}
                      <div className="ml-auto">
                        {deleteTargetId === contact.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-bold text-base">本当に削除？</span>
                            <button
                              onClick={() => handleDelete(contact.id)}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg text-base font-bold hover:bg-red-600 transition-colors"
                            >
                              はい
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(null)}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-base font-bold hover:bg-gray-400 transition-colors"
                            >
                              いいえ
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteTargetId(contact.id)}
                            className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-base font-bold hover:bg-red-200 transition-colors"
                          >
                            🗑 削除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
