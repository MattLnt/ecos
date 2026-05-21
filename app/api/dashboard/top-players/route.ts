import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Grouper par joueur
    const playerStats = sessionPlayers.reduce((acc, sp) => {
      const playerId = sp.playerId;
      if (!acc[playerId]) {
        acc[playerId] = {
          player: sp.player,
          totalPoints: 0,
          sessionsCount: 0,
        };
      }
      acc[playerId].totalPoints += sp.totalPoints;
      acc[playerId].sessionsCount += 1;
      return acc;
    }, {} as Record<string, any>);

    // Calculer moyenne et trier
    const topPlayers = Object.values(playerStats)
      .map((stats: any) => ({
        name: stats.player.firstName,
        avgPoints: Math.round((stats.totalPoints / stats.sessionsCount) * 10) / 10,
        sessionsCount: stats.sessionsCount,
        avatar: stats.player.avatar,
        photo: stats.player.photo,
      }))
      .sort((a, b) => b.avgPoints - a.avgPoints)
      .slice(0, 5);

    return NextResponse.json(topPlayers);
  } catch (error) {
    console.error('Erreur GET top players:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}