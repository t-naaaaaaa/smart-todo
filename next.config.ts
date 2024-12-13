/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb", // 必要に応じてリクエストサイズを調整
    },
  },
  output: "export", // 静的エクスポートを有効化
  trailingSlash: true, // 各ページのパスにスラッシュを付加
};

module.exports = nextConfig;
