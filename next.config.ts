// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // ダッシュボードページのSSRを無効化
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig