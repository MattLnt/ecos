import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Les meilleures moyennes du club.
 *
 * Une moyenne sur une seule session ne compare rien : un joueur venu une fois
 * un bon soir passait devant celui qui tire depuis deux ans. On exige donc le
 * même volume minimum que le classement des statistiques.
 */
const MIN_SESSIONS = 2;

interface PlayerAcc {
  playerId: string;
  firstName: string;
  avatar: string;
  photo: string | null;
  totalPoints: number;
  bestScore: number;
  sessionsCount: number;
}

export async function GET() {
  try {
    const sessionPlayers = await prisma.sessionPlayer.findMany({
      where: {
        session: { status: 'completed' },
      },
      include: {
        player: true,
      },
    });

    const playerStats = sessionPlayers.reduce((acc, sp) => {
      const playerId = sp.playerId;
      if (!acc[playerId]) {
        acc[playerId] = {
          playerId,
          firstName: sp.player.firstName,
          avatar: sp.player.avatar,
          photo: sp.player.photo,
          totalPoints: 0,
          bestScore: 0,
          sessionsCount: 0,
        };
      }
      acc[playerId].totalPoints += sp.totalPoints;
      acc[playerId].bestScore = Math.max(acc[playerId].bestScore, sp.totalPoints);
      acc[playerId].sessionsCount += 1;
      return acc;
    }, {} as Record<string, PlayerAcc>);

    const ranked = Object.values(playerStats)
      .map((stats) => ({
        playerId: stats.playerId,
        name: stats.firstName,
        avgPoints: Math.round((stats.totalPoints / stats.sessionsCount) * 10) / 10,
        bestScore: stats.bestScore,
        sessionsCount: stats.sessionsCount,
        avatar: stats.avatar,
        photo: stats.photo,
      }))
      .sort((a, b) => b.avgPoints - a.avgPoints);

    const qualified = ranked.filter((p) => p.sessionsCount >= MIN_SESSIONS);

    /*
      Repli pour un club qui démarre : si personne n'atteint le seuil, mieux
      vaut un classement imparfait qu'un cadre vide. Le client est prévenu par
      `qualified` et peut le dire.
    */
    const players = qualified.length > 0 ? qualified : ranked;

    return NextResponse.json({
      minSessions: MIN_SESSIONS,
      qualified: qualified.length > 0,
      players: players.slice(0, 5),
    });
  } catch (error) {
    console.error('Erreur GET top players:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
