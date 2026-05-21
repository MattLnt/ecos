import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        sessionPlayers: {
          include: {
            player: true,
            spotResults: {
              orderBy: { spotNum: 'asc' },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    // Marquer la session comme terminée
    await prisma.session.update({
      where: { id: params.id },
      data: { 
        status: 'completed',
        endedAt: new Date(),
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Erreur GET résultats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}