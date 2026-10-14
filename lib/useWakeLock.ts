'use client';

import { useEffect } from 'react';

/**
 * Empêche l'écran de se verrouiller pendant la session.
 *
 * Le téléphone est posé au milieu du terrain et les joueurs viennent saisir
 * leur résultat entre deux spots : sans ça l'écran s'éteint au bout de
 * quelques dizaines de secondes et il faut le déverrouiller à chaque passage.
 *
 * Le verrou est relâché par le navigateur dès que l'onglet passe en arrière-
 * plan, d'où la redemande sur `visibilitychange`. L'API n'existe pas partout
 * (Safari iOS avant 16.4, navigateurs sans HTTPS) : l'absence est silencieuse,
 * la session fonctionne comme avant.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const request = async () => {
      if (released || document.visibilityState !== 'visible') return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
      } catch {
        // Refus de l'OS (batterie faible, réglage système) : rien à faire.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') request();
    };

    request();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
