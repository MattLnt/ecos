import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { sessionPlayerId, spotNum, spotLabel, spotSub, makes, ftMakes, points } = body;

    const spotResult = await prisma.spotResult.create({
      data: {
        sessionPlayerId,
        spotNum,
        spotLabel,
        spotSub,
        makes,
        ftMakes,
        points,
      },
    });

    // Mettre à jour le total du joueur
    await prisma.sessionPlayer.update({
      where: { id: sessionPlayerId },
      data: {
        totalPoints: {
          increment: points,
        },
      },
    });

    return NextResponse.json(spotResult);
  } catch (error) {
    console.error('Erreur POST spot result:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}