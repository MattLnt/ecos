'use client';

import { useEffect } from 'react';
import { startSpotQueue } from '@/lib/spotQueue';

/**
 * Relance la file des saisies partout dans l'application.
 *
 * Monté à la racine, et pas seulement sur l'écran de session : une saisie
 * restée en attente après une coupure réseau doit partir dès que la connexion
 * revient, même si l'utilisateur a quitté la session entre-temps, et sans
 * attendre qu'il rouvre l'écran de saisie.
 *
 * Ne rend rien.
 */
export function SpotQueueFlusher(): null {
  useEffect(() => startSpotQueue(), []);
  return null;
}
