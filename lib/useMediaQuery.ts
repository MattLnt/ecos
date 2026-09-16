'use client';

import { useEffect, useState } from 'react';

/**
 * Suit une media query côté client.
 *
 * Retourne `false` au premier rendu (serveur + hydratation) puis la vraie
 * valeur : les composants qui l'utilisent doivent donc rester corrects dans
 * les deux cas, et ne l'employer que pour des ajustements visuels.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
