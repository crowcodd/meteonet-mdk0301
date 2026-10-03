import type { NextConfig } from 'next';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3001';

// фронт и бэк живут на одном origin, запросы к /api уходят прокси на Nest, так что CORS не нужен
const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
