'use client';

import { useSyncExternalStore } from 'react';

/**
 * File d'attente des saisies de spot.
 *
 * Les gymnases captent mal. Avant, l'enregistrement d'un spot partait en
 * `fetch` et un échec réseau finissait en `console.error` : la saisie
 * disparaissait sans que personne sur le terrain ne le voie. Tout passe
 * désormais par cette file, persistée dans le navigateur et rejouée dès que la
 * connexion revient — y compris après un rechargement de l'onglet.
 *
 * L'écran de saisie n'attend jamais le réseau : il met son état à jour, dépose
 * l'opération ici, et continue.
 */

export interface SpotSaveOp {
  kind: 'save';
  sessionId: string;
  sessionPlayerId: string;
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  makes: number;
  ftMakes: number;
  points: number;
}

/** Heure du tir, figée au dépôt et transmise telle quelle au serveur. */
type Stamped = { recordedAt: string };

export interface SpotDeleteOp {
  kind: 'delete';
  sessionId: string;
  sessionPlayerId: string;
  spotNum: number;
}

export type SpotOp = SpotSaveOp | SpotDeleteOp;

type Entry = SpotOp & Stamped & { queuedAt: number; attempts: number };

const STORAGE_KEY = 'ecos:spot-queue:v1';

/** Au-delà, l'opération vient d'une session oubliée : on l'abandonne. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const RETRY_BASE_MS = 2000;
const RETRY_MAX_MS = 30000;

let queue: Entry[] = [];
let loaded = false;
let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();

/**
 * Une opération par couple (joueur, spot).
 *
 * Le serveur fait un `upsert` sur cette même clé : deux saisies successives du
 * même spot — ressaisie après un retour arrière, double appui — doivent donc
 * se remplacer dans la file, pas s'empiler. Seule la dernière compte.
 */
function keyOf(op: SpotOp): string {
  return `${op.sessionPlayerId}:${op.spotNum}`;
}

function load(): void {
  if (loaded) return;
  loaded = true;
  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    queue = Array.isArray(parsed)
      ? (parsed as Entry[]).filter((e) => e && now - (e.queuedAt ?? 0) < MAX_AGE_MS)
      : [];
  } catch {
    // Stockage illisible ou désactivé : on repart d'une file vide plutôt que
    // de bloquer la session.
    queue = [];
  }
}

function persist(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Quota plein ou mode restreint : la file reste valide en mémoire.
  }
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function scheduleRetry(attempts: number): void {
  if (retryTimer || typeof window === 'undefined') return;
  const delay = Math.min(RETRY_BASE_MS * 2 ** Math.max(attempts - 1, 0), RETRY_MAX_MS);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flush();
  }, delay);
}

async function send(entry: Entry): Promise<Response> {
  const url = `/api/sessions/${entry.sessionId}/spot-result`;

  if (entry.kind === 'delete') {
    return fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionPlayerId: entry.sessionPlayerId,
        spotNum: entry.spotNum,
      }),
    });
  }

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionPlayerId: entry.sessionPlayerId,
      spotNum: entry.spotNum,
      spotLabel: entry.spotLabel,
      spotSub: entry.spotSub,
      makes: entry.makes,
      ftMakes: entry.ftMakes,
      points: entry.points,
      recordedAt: entry.recordedAt,
    }),
  });
}

/**
 * Vide la file, dans l'ordre de dépôt.
 *
 * Un arrêt au premier échec, et non un saut à l'opération suivante : si le
 * réseau est tombé, les suivantes échoueraient aussi, et l'ordre compte quand
 * deux opérations touchent le même spot.
 */
export async function flush(): Promise<void> {
  load();
  if (flushing || queue.length === 0) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    scheduleRetry(1);
    return;
  }

  flushing = true;

  try {
    while (queue.length > 0) {
      const entry = queue[0];

      let response: Response;
      try {
        response = await send(entry);
      } catch {
        // Réseau coupé : on garde l'opération et on retente plus tard.
        entry.attempts += 1;
        persist();
        scheduleRetry(entry.attempts);
        return;
      }

      if (!response.ok && response.status >= 500) {
        // Panne serveur : même traitement qu'une coupure réseau.
        entry.attempts += 1;
        persist();
        scheduleRetry(entry.attempts);
        return;
      }

      /*
        Succès, ou refus définitif (4xx : session supprimée, joueur retiré…).
        Dans les deux cas l'opération ne sera jamais acceptée telle quelle :
        la retenir bloquerait toutes les saisies suivantes.
      */
      if (!response.ok) {
        console.error('Saisie refusée par le serveur, abandonnée:', entry, response.status);
      }

      /*
        On retire l'entrée envoyée par identité, pas la première de la file :
        une ressaisie du même spot pendant l'envoi l'a peut-être remplacée, et
        un `shift()` aveugle aurait jeté la nouvelle valeur sans l'envoyer.
      */
      const index = queue.indexOf(entry);
      if (index !== -1) queue.splice(index, 1);
      persist();
      notify();
    }
  } finally {
    flushing = false;
  }
}

/** Dépose une opération et tente de l'envoyer tout de suite. */
export function enqueueSpotOp(op: SpotOp): void {
  load();

  const key = keyOf(op);
  const now = new Date();
  queue = queue.filter((entry) => keyOf(entry) !== key);
  /*
    L'heure est figée ici, au moment du tir, et non à l'envoi : hors réseau,
    une séance entière pourrait partir d'un bloc une heure plus tard et
    paraître avoir duré quelques secondes.
  */
  queue.push({
    ...op,
    recordedAt: now.toISOString(),
    queuedAt: now.getTime(),
    attempts: 0,
  });

  persist();
  notify();
  void flush();
}

/** Nombre de saisies pas encore confirmées par le serveur. */
export function pendingCount(): number {
  load();
  return queue.length;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/**
 * Nombre de saisies en attente, suivi en direct.
 *
 * `useSyncExternalStore` plutôt qu'un `useEffect` + `setState` : la file vit en
 * dehors de React, et on évite une cascade de rendus au montage.
 */
export function usePendingSpotCount(): number {
  return useSyncExternalStore(subscribe, pendingCount, () => 0);
}

function subscribeOnline(listener: () => void): () => void {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}

/** Rendu serveur et navigateurs sans l'info : on suppose la connexion présente. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
}

/**
 * Relance la file au retour du réseau et quand l'onglet revient au premier
 * plan. Un navigateur mobile gèle les minuteurs d'un onglet en arrière-plan :
 * sans ce second déclencheur, une saisie pouvait attendre le prochain appui.
 */
export function startSpotQueue(): () => void {
  if (typeof window === 'undefined') return () => {};

  const onOnline = () => { void flush(); };
  const onVisible = () => {
    if (document.visibilityState === 'visible') void flush();
  };

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);
  void flush();

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
