/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // appDirは新しいバージョンではデフォルトで有効
    serverActions: true,
  }
}

module.exports = nextConfig