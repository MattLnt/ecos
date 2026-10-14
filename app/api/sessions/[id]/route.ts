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
        /*
          L'ordre compte : l'écran de saisie fait tourner les joueurs d'un
          groupe dans leur ordre de passage, tiré au sort à la création. Sans
          `orderBy`, Postgres rend les lignes dans un ordre non garanti et la
          rotation changeait d'un rechargement à l'autre.
        */
        sessionPlayers: {
          include: {
            player: true,
            /*
              Les spots déjà saisis : ils permettent de reprendre une session
              interrompue là où elle s'est arrêtée. Sans eux, rouvrir une
              session repartait du premier spot sur un terrain vierge alors que
              les résultats étaient bien en base.
            */
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

    return NextResponse.json(session);
  } catch (error) {
    console.error('Erreur GET session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * Supprime une session et tout ce qu'elle contient.
 *
 * Les `sessionPlayers` et leurs `spotResults` partent en cascade (déclarée
 * dans le schéma), les joueurs eux-mêmes ne sont pas touchés.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const session = await prisma.session.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    await prisma.session.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true, deletedId: params.id });
  } catch (error) {
    console.error('Erreur DELETE session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
