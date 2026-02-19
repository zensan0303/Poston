/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // 開発時の2重実行を避ける
  images: {
    domains: ['firebasestorage.googleapis.com'],
    minimumCacheTTL: 31536000, // 1年間キャッシュ
    formats: ['image/avif', 'image/webp'], // 最適な画像形式を使用
  },
  compress: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60秒
    pagesBufferLength: 5,
  },
  // 本番環境でのビルド時にログを最小化
  productionBrowserSourceMaps: false,
  // 静的なバージョニング
  generateEtags: true,
};

export default nextConfig;
