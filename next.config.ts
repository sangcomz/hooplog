import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, '_http_common'];
    }
    return config;
  },
};

export default nextConfig;
