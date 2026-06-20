'use client';

import { Event } from '@/types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { isSafeAttachmentUrl } from '@/lib/security';

interface EventModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventModal({ event, isOpen, onClose }: EventModalProps) {
  if (!isOpen) return null;

  const eventTypeLabel = {
    practice: '練習',
    game: '試合',
    meeting: 'ミーティング',
    other: 'その他',
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="bg-primary-500 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <span className="inline-block bg-white text-primary-600 px-3 py-1 rounded-full text-sm font-bold mb-2">
                {eventTypeLabel[event.type]}
              </span>
              <h2 className="text-2xl-mobile md:text-3xl font-bold">{event.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-primary-600 rounded-full w-10 h-10 flex items-center justify-center text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* 本文 */}
        <div className="p-6 space-y-4">
          {/* 日時 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2 text-gray-700">📅 日時</h3>
            <p className="text-lg">
              {format(event.start, 'yyyy年M月d日(E) HH:mm', { locale: ja })}
              {' 〜 '}
              {format(event.end, 'HH:mm', { locale: ja })}
            </p>
          </div>

          {/* 場所 */}
          {event.location && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-2 text-gray-700">📍 場所</h3>
              <p className="text-lg">{event.location}</p>
            </div>
          )}

          {/* 説明 */}
          {event.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-2 text-gray-700">📝 詳細</h3>
              <p className="text-lg whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* 添付ファイル */}
          {event.attachments && event.attachments.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-2 text-gray-700">📎 添付ファイル</h3>
              <ul className="space-y-2">
                {event.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    {isSafeAttachmentUrl(attachment.url) ? (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-800 text-lg underline"
                      >
                        📄 {attachment.name}
                        <span className="text-sm text-gray-500">
                          ({Math.round(attachment.size / 1024)} KB)
                        </span>
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 text-gray-500 text-lg">
                        📄 {attachment.name}
                        <span className="text-sm">(安全でないURLのため開けません)</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg text-xl-mobile font-bold hover:bg-primary-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
