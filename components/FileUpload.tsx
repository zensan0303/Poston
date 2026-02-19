'use client';

import { useState, ChangeEvent } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string, fileSize: number) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

export default function FileUpload({ 
  onUploadComplete, 
  acceptedTypes = '.xlsx,.xls,.doc,.docx,.pdf,.png,.jpg,.jpeg',
  maxSizeMB = 10 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    
    // ファイルサイズチェック
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`ファイルサイズは${maxSizeMB}MB以下にしてください`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // ファイル名にタイムスタンプを追加してユニークにする
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `attachments/${fileName}`);

      // ファイルをアップロード
      await uploadBytes(storageRef, file);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(storageRef);
      
      setProgress(100);
      onUploadComplete(downloadURL, file.name, file.size);
      
      // リセット
      e.target.value = '';
    } catch (err) {
      console.error('アップロードエラー:', err);
      setError('ファイルのアップロードに失敗しました');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label
          htmlFor="file-upload"
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg text-lg font-bold 
            cursor-pointer transition-colors
            ${uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-primary-500 hover:bg-primary-600 text-white'
            }
          `}
        >
          📎 ファイルを選択
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            accept={acceptedTypes}
            className="hidden"
          />
        </label>
        {uploading && (
          <span className="text-lg text-gray-600">アップロード中...</span>
        )}
      </div>

      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <p className="text-sm text-gray-600">
        対応形式: Excel, Word, PDF, 画像ファイル (最大{maxSizeMB}MB)
      </p>
    </div>
  );
}
