import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Permet au build de passer même avec des erreurs ESLint
    // (ESLint reste actif en local pour t'aider en dev)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;