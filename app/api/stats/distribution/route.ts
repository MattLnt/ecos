import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Sessions par terrain
    const sessions = await prisma.session.findMany({
      where: { status: 'completed' },
      include: { court: true },
    });

    const byCourt = sessions.reduce((acc, session) => {
      const courtName = session.court.name;
      acc[courtName] = (acc[courtName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCourtArray = Object.entries(byCourt).map(([name, sessions]) => ({
      name,
      sessions,
    }));

    // Participation par joueur
    const sessionPlayers = await prisma.sessionPlayer.findMany({
      where: {
        session: { status: 'completed' },
      },
      include: { player: true },
    });

    const byPlayer = sessionPlayers.reduce((acc, sp) => {
      const playerName = sp.player.firstName;
      acc[playerName] = (acc[playerName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPlayerArray = Object.entries(byPlayer)
      .map(([name, participations]) => ({
        name,
        participations,
      }))
      .sort((a, b) => b.participations - a.participations);

    return NextResponse.json({
      byCourt: byCourtArray,
      byPlayer: byPlayerArray,
    });
  } catch (error) {
    console.error('Erreur GET distribution:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}