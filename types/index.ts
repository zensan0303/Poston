// イベント型定義
export interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'practice' | 'game' | 'meeting' | 'other';
  description?: string;
  location?: string;
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

// ファイル添付型
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

// 回ごとのスコア型
export interface InningScore {
  inning: number;
  ourScore: number | null;
  opponentScore: number | null;
}

// 試合結果型
export interface GameResult {
  id: string;
  date: Date;
  ourTeamName: string;
  opponent: string;
  inningScores: InningScore[];
  ourScore: number;       // 合計（自動計算）
  opponentScore: number;  // 合計（自動計算）
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// お問い合わせ型
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: Date;
}

// ユーザー型
export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'member';
  displayName?: string;
}
