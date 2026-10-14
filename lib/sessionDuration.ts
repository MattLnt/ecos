import { prisma } from '@/lib/prisma';

/**
 * Durée réelle des sessions, mesurée sur les saisies.
 *
 * `endedAt - startedAt` ne convient pas : `startedAt` est l'instant où la
 * session a été créée, et une session interrompue puis reprise le lendemain
 * afficherait une séance de vingt heures. La fenêtre des saisies — du premier
 * au dernier tir enregistré — est la seule mesure qui corresponde au temps
 * passé sur le terrain.
 *
 * On s'appuie sur `recordedAt`, l'heure envoyée par l'appareil, et non sur
 * `createdAt` : les saisies passent par une file rejouée au retour du réseau,
 * donc l'heure d'arrivée au serveur ne dit plus quand le tir a eu lieu.
 */

interface Window {
  sessionId: string;
  first: Date;
  last: Date;
}

/** Fenêtre de saisie de chaque session, en minutes, indexée par session. */
export async function activeMinutesBySession(): Promise<Map<string, number>> {
  /*
    Une seule requête agrégée plutôt que de charger tous les spots : une saison
    complète représente plusieurs milliers de lignes dont on ne veut que deux
    bornes par session.
  */
  const windows = await prisma.$queryRaw<Window[]>`
    SELECT sp."sessionId" AS "sessionId",
           MIN(sr."recordedAt") AS "first",
           MAX(sr."recordedAt") AS "last"
    FROM "SpotResult" sr
    JOIN "SessionPlayer" sp ON sp."id" = sr."sessionPlayerId"
    GROUP BY sp."sessionId"
  `;

  const minutes = new Map<string, number>();
  windows.forEach((row) => {
    const span = new Date(row.last).getTime() - new Date(row.first).getTime();
    minutes.set(row.sessionId, Math.max(0, Math.round(span / 60000)));
  });

  return minutes;
}

/** Heure de la dernière saisie d'une session, ou `null` si elle est vide. */
export async function lastEntryAt(sessionId: string): Promise<Date | null> {
  const result = await prisma.spotResult.aggregate({
    where: { sessionPlayer: { sessionId } },
    _max: { recordedAt: true },
  });

  return result._max.recordedAt ?? null;
}
