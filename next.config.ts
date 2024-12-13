/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  output: "export", // 静的エクスポートを有効化
  trailingSlash: true, // 必要に応じてパス末尾にスラッシュを付与
};

module.exports = nextConfig;
