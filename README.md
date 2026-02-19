# ポストン ホームページ

ポストンの予定管理・試合結果確認・お問い合わせができるWebアプリケーションです。

## 主な機能

- 📅 **カレンダー機能**: 練習・試合の予定を時間単位で表示
- 🏆 **試合結果**: 過去の試合成績をモーダルで確認
- 📧 **お問い合わせ**: 新規参加希望者向けのフォーム
- 👤 **管理者機能**: 予定・試合結果の追加/編集
- 📎 **ファイル添付**: Excelファイルなどを予定に添付可能

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **バックエンド**: Firebase (Auth, Firestore, Storage)
- **カレンダー**: React Big Calendar
- **日付処理**: date-fns

## デザイン

- モバイルファースト設計
- 高齢者向けの大きなフォント・ボタン
- 水色と白を基調としたカラースキーム
- シンプルでわかりやすいUI

## セットアップ

### 1. 依存関係のインストール

\`\`\`bash
npm install
\`\`\`

### 2. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Authentication, Firestore Database, Storageを有効化
3. \`.env.local.example\`を\`.env.local\`にコピーして、Firebase設定を記入

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

\`.env.local\`に以下の情報を記入:

\`\`\`
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

### 3. Firestore データベース構造

以下のコレクションを作成してください:

#### events (予定)
\`\`\`
{
  title: string,
  start: Timestamp,
  end: Timestamp,
  type: 'practice' | 'game' | 'meeting' | 'other',
  description?: string,
  location?: string,
  attachments?: Array<{
    id: string,
    name: string,
    url: string,
    type: string,
    size: number,
    uploadedAt: Timestamp
  }>,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
\`\`\`

#### gameResults (試合結果)
\`\`\`
{
  date: Timestamp,
  opponent: string,
  ourScore: number,
  opponentScore: number,
  result: 'win' | 'lose' | 'draw',
  location?: string,
  notes?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
\`\`\`

#### contacts (お問い合わせ)
\`\`\`
{
  name: string,
  email: string,
  phone?: string,
  message: string,
  status: 'unread' | 'read' | 'replied',
  createdAt: Timestamp
}
\`\`\`

### 4. 管理者アカウントの作成

Firebase Consoleで管理者用のメールアドレスとパスワードを設定してください。

### 5. 開発サーバーの起動

\`\`\`bash
npm run dev
\`\`\`

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## ビルドとデプロイ

### 本番ビルド

\`\`\`bash
npm run build
npm start
\`\`\`

### Vercelへのデプロイ

1. GitHubにプッシュ
2. [Vercel](https://vercel.com)でインポート
3. 環境変数を設定
4. デプロイ

## プロジェクト構造

\`\`\`
.
├── app/                    # Next.js App Router
│   ├── admin/             # 管理者ページ
│   ├── calendar/          # カレンダーページ
│   ├── contact/           # お問い合わせページ
│   ├── results/           # 試合結果ページ
│   └── layout.tsx         # ルートレイアウト
├── components/            # Reactコンポーネント
│   ├── Calendar.tsx       # カレンダーコンポーネント
│   ├── EventModal.tsx     # イベント詳細モーダル
│   ├── GameResultModal.tsx # 試合結果モーダル
│   └── FileUpload.tsx     # ファイルアップロード
├── contexts/              # Reactコンテキスト
│   └── AuthContext.tsx    # 認証コンテキスト
├── lib/                   # ユーティリティ
│   └── firebase.ts        # Firebase設定
└── types/                 # TypeScript型定義
    └── index.ts
\`\`\`

## ライセンス

MIT

## お問い合わせ

プロジェクトに関する質問は、管理者までお問い合わせください。
