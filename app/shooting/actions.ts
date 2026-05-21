'use server';

import { prisma } from '@/lib/prisma';
import type { SessionResult } from '@/components/shooting/types';

/**
 * Save a finished shooting session.
 *
 * Wire this up to your `onComplete` prop on <ShootingSession>:
 *
 *   <ShootingSession
 *     playerName={player.name}
 *     onComplete={(result) => saveSession(player.id, result)}
 *   />
 *
 * The function runs on the server (Server Action) so you can hit Railway
 * Postgres directly via Prisma.
 */
export async function saveSession(playerId: string, result: SessionResult) {
  const session = await prisma.session.create({
    data: {
      playerId,
      startedAt: new Date(result.startedAt),
      endedAt:   new Date(result.endedAt),
      totalPoints: result.totalPoints,
      spotScores: {
        create: result.spots.map((s) => ({
          spotNum: s.num,
          label: s.label,
          sub: s.sub,
          makes: s.makes,
          ftMakes: s.ftMakes,
          points: s.points,
        })),
      },
    },
    include: { spotScores: true },
  });
  return session;
}

/** Stats helpers — useful once you have a few sessions per player. */
export async function getPlayerStats(playerId: string) {
  const sessions = await prisma.session.findMany({
    where: { playerId },
    orderBy: { startedAt: 'desc' },
    include: { spotScores: true },
  });

  const totalPoints = sessions.reduce((a, s) => a + s.totalPoints, 0);
  const avgPoints = sessions.length > 0 ? totalPoints / sessions.length : 0;
  const best = sessions.reduce((m, s) => Math.max(m, s.totalPoints), 0);

  // Per-spot average score across all sessions
  const perSpot: Record<number, { totalPoints: number; n: number }> = {};
  for (const s of sessions) {
    for (const sc of s.spotScores) {
      if (!perSpot[sc.spotNum]) perSpot[sc.spotNum] = { totalPoints: 0, n: 0 };
      perSpot[sc.spotNum].totalPoints += sc.points;
      perSpot[sc.spotNum].n += 1;
    }
  }
  const perSpotAvg = Object.entries(perSpot).map(([num, v]) => ({
    num: Number(num),
    avgPoints: v.totalPoints / v.n,
    samples: v.n,
  }));

  return { sessionCount: sessions.length, totalPoints, avgPoints, best, perSpotAvg, sessions };
}
