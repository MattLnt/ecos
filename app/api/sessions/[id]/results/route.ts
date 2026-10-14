import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lastEntryAt } from '@/lib/sessionDuration';

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
          orderBy: [{ group: 'asc' }, { shootOrder: 'asc' }],
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    /*
      Marquer la session comme terminée — une seule fois.

      Cette route posait `endedAt: new Date()` à chaque appel : rouvrir la page
      résultats d'une vieille session la redatait à l'instant présent, et une
      séance de 52 min s'affichait à 38 545 min. On ne pose la date que si elle
      manque, et on prend l'heure de la dernière saisie plutôt que l'heure de
      consultation.
    */
    if (!session.endedAt) {
      const lastEntry = await lastEntryAt(params.id);

      await prisma.session.update({
        where: { id: params.id },
        data: {
          status: 'completed',
          endedAt: lastEntry ?? new Date(),
        },
      });
    } else if (session.status !== 'completed') {
      await prisma.session.update({
        where: { id: params.id },
        data: { status: 'completed' },
      });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Erreur GET résultats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}