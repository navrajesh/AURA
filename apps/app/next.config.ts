import type { NextConfig } from 'next';

const config: NextConfig = {
  // Vercel-portable: standalone output works for any Docker host.
  output: 'standalone',
  // The shared @aura/db package is TS source, not pre-built.
  transpilePackages: ['@aura/db'],
  experimental: {
    serverActions: { bodySizeLimit: '6mb' }, // CSV upload up to 5 MB + overhead
  },
};

export default config;
