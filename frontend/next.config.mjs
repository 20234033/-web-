/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // フロントから見る URL
        source: '/api/:path*',
        // 実際の API サーバー（EC2）に飛ばす
        destination:
          'http://localhost:3000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
