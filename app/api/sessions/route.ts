import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        court: true,
        sessionPlayers: {
          include: {
            player: true,
          },
          orderBy: {
            totalPoints: 'desc',
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Erreur GET sessions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courtId, playerIds } = body;

    const session = await prisma.session.create({
      data: {
        courtId,
        status: 'active',
        sessionPlayers: {
          create: playerIds.map((playerId: string) => ({
            playerId,
            totalPoints: 0,
          })),
        },
      },
      include: {
        sessionPlayers: {
          include: {
            player: true,
          },
        },
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Erreur POST session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}