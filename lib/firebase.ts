import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebaseの設定
// 本番環境では環境変数を使用してください
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// デバッグ：環境変数が設定されているか確認
if (!firebaseConfig.projectId) {
  console.error('⚠️ Firebase環境変数が設定されていません。.env.local ファイルを確認してください。');
}

// Firebaseアプリの初期化（重複初期化を防ぐ）
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase instances
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Lazy initialization helpers
export const getDbInstance = () => db;
export const getAuthInstance = () => auth;
export const getStorageInstance = () => storage;

export default app;
