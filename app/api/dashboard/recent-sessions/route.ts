import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      where: { status: 'completed' },
      take: 3,
      orderBy: { date: 'desc' },
      include: {
        court: true,
        sessionPlayers: {
          include: {
            player: true,
          },
          orderBy: {
            totalPoints: 'desc',
          },
          take: 1, // Winner only
        },
      },
    });

    const formatted = sessions.map((session) => ({
      id: session.id,
      date: session.date,
      courtName: session.court.name,
      playerCount: session.sessionPlayers.length,
      winner: session.sessionPlayers[0]
        ? {
            name: session.sessionPlayers[0].player.firstName,
            points: session.sessionPlayers[0].totalPoints,
            avatar: session.sessionPlayers[0].player.avatar,
            photo: session.sessionPlayers[0].player.photo,
          }
        : null,
    })).filter(s => s.winner !== null);

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Erreur GET recent sessions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}