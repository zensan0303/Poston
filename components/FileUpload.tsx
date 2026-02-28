'use client';

import { useState, ChangeEvent } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from '@/lib/firebase';

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
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(getStorageInstance(), `attachments/${fileName}`);

      await new Promise<void>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(pct);
          },
          (err) => {
            console.error('アップロードエラー:', err.code, err.message);
            switch (err.code) {
              case 'storage/unauthorized':
                reject(new Error('権限エラー: Firebase Storage のルールで書き込みが拒否されました'));
                break;
              case 'storage/canceled':
                reject(new Error('アップロードがキャンセルされました'));
                break;
              default:
                reject(new Error(`アップロードに失敗しました (${err.code})`));
            }
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              onUploadComplete(downloadURL, file.name, file.size);
              resolve();
            } catch (urlErr) {
              reject(urlErr);
            }
          }
        );
      });

      e.target.value = '';
    } catch (err) {
      console.error('アップロードエラー:', err);
      const msg = err instanceof Error ? err.message : 'ファイルのアップロードに失敗しました';
      setError(msg);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1500);
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
          <span className="text-lg text-gray-600">アップロード中... {progress}%</span>
        )}
      </div>

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {!uploading && progress === 100 && (
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-green-500 h-3 rounded-full w-full transition-all duration-300" />
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
