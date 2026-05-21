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
        court: true,
        sessionPlayers: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Erreur GET session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}