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
        session: {
          include: {
            sessionPlayers: {
              orderBy: {
                totalPoints: 'desc',
              },
            },
          },
        },
      },
    });

    // Grouper par joueur
    const playerStats = sessionPlayers.reduce((acc, sp) => {
      const playerId = sp.playerId;
      
      if (!acc[playerId]) {
        acc[playerId] = {
          playerId: sp.player.id,
          firstName: sp.player.firstName,
          lastName: sp.player.lastName,
          photo: sp.player.photo,
          avatar: sp.player.avatar,
          totalSessions: 0,
          totalPoints: 0,
          victories: 0,
          bestScore: 0,
          scores: [],
        };
      }
      
      acc[playerId].totalSessions += 1;
      acc[playerId].totalPoints += sp.totalPoints;
      acc[playerId].scores.push(sp.totalPoints);
      
      if (sp.totalPoints > acc[playerId].bestScore) {
        acc[playerId].bestScore = sp.totalPoints;
      }
      
      // Vérifier si c'est une victoire (1er du classement)
      const isWinner = sp.session.sessionPlayers[0]?.id === sp.id;
      if (isWinner) {
        acc[playerId].victories += 1;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculer moyenne
    const playersArray = Object.values(playerStats).map((player: any) => ({
      playerId: player.playerId,
      firstName: player.firstName,
      lastName: player.lastName,
      photo: player.photo,
      avatar: player.avatar,
      totalSessions: player.totalSessions,
      totalPoints: player.totalPoints,
      avgPoints: Math.round((player.totalPoints / player.totalSessions) * 10) / 10,
      victories: player.victories,
      bestScore: player.bestScore,
    }));

    return NextResponse.json(playersArray);
  } catch (error) {
    console.error('Erreur GET players stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}