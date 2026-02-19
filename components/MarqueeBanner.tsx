'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';

interface AnnouncementData {
  text: string;
  isVisible: boolean;
}

export default function MarqueeBanner() {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const db = getDbInstance();
      const docRef = doc(db, 'settings', 'announcement');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAnnouncement({
          text: data.text || '',
          isVisible: data.isVisible !== false,
        });
      }
    } catch (error) {
      console.error('お知らせの取得に失敗しました:', error);
    }
  };

  // 非表示 or テキストなし の場合は何も表示しない
  if (!announcement || !announcement.isVisible || !announcement.text.trim()) {
    return null;
  }

  return (
    <div className="bg-yellow-400 text-gray-900 overflow-hidden py-2 shadow-sm">
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .marquee-text {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 20s linear infinite;
        }
      `}</style>
      <div className="relative flex items-center">
        <span className="shrink-0 bg-yellow-500 text-gray-900 font-bold px-3 py-0.5 mr-2 text-base z-10">
          📢 お知らせ
        </span>
        <div className="overflow-hidden flex-1">
          <span className="marquee-text text-base md:text-lg font-medium">
            {announcement.text}
          </span>
        </div>
      </div>
    </div>
  );
}
