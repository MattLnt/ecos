import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pas besoin de la clé eslint dans Next.js 16
  // ESLint est géré différemment maintenant

  /**
   * Les réponses de l'API ne sont jamais mises en cache par le navigateur.
   *
   * Toutes ces routes lisent la base à chaque appel, mais sans en-tête
   * explicite le navigateur est libre d'en garder une copie : après la
   * suppression d'une session, un retour sur la liste ou le tableau de bord
   * pouvait réafficher l'ancienne réponse, et donc une session qui n'existe
   * plus. Une règle ici évite de la répéter dans chaque route.
   */
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },
};

export default nextConfig;
