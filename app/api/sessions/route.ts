import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { activeMinutesBySession } from '@/lib/sessionDuration';

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

    /*
      La durée affichée vient des saisies, pas de `endedAt - startedAt` : une
      session reprise le lendemain afficherait sinon une séance de vingt
      heures.
    */
    const minutes = await activeMinutesBySession();

    return NextResponse.json(
      sessions.map((session) => ({
        ...session,
        activeMinutes: minutes.get(session.id) ?? 0,
      }))
    );
  } catch (error) {
    console.error('Erreur GET sessions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

interface SessionPlayerInput {
  playerId: string;
  group?: string | null;
  shootOrder?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courtId, players, playerIds } = body as {
      courtId: string;
      players?: SessionPlayerInput[];
      playerIds?: string[];
    };

    /*
      Deux formes acceptées. `players` porte la répartition en groupes et
      l'ordre de passage tiré au sort — c'est ce qu'envoie l'écran de création.
      `playerIds` reste accepté pour les appels qui ne connaissent pas les
      groupes : un seul groupe, ordre de la liste.
    */
    const entries: SessionPlayerInput[] =
      players && players.length > 0
        ? players
        : (playerIds ?? []).map((playerId, index) => ({
            playerId,
            group: null,
            shootOrder: index,
          }));

    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un joueur est requis' },
        { status: 400 }
      );
    }

    const session = await prisma.session.create({
      data: {
        courtId,
        status: 'active',
        sessionPlayers: {
          create: entries.map((entry, index) => ({
            playerId: entry.playerId,
            totalPoints: 0,
            group: entry.group ?? null,
            shootOrder: entry.shootOrder ?? index,
          })),
        },
      },
      include: {
        sessionPlayers: {
          include: {
            player: true,
          },
          orderBy: [{ group: 'asc' }, { shootOrder: 'asc' }],
        },
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Erreur POST session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}