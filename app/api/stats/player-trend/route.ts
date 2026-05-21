import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'playerId requis' }, { status: 400 });
    }

    const sessionPlayers = await prisma.sessionPlayer.findMany({
      where: {
        playerId,
        session: { status: 'completed' },
      },
      include: {
        session: true,
      },
      orderBy: {
        session: {
          date: 'asc',
        },
      },
    });

    const trendData = sessionPlayers.map((sp) => ({
      date: new Date(sp.session.date).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short' 
      }),
      points: sp.totalPoints,
    }));

    return NextResponse.json(trendData);
  } catch (error) {
    console.error('Erreur GET player trend:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}