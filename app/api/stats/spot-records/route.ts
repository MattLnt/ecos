import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Le meilleur score réalisé sur chaque spot, et par qui.
 *
 * Le score d'un spot est celui de la session : paniers réussis multipliés par
 * les lancers francs de validation. Un 9/10 non validé vaut donc 0, et c'est
 * bien le record du jeu tel qu'il se joue.
 */

interface SpotRecord {
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  points: number;
  makes: number;
  ftMakes: number;
  playerId: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  avatar: string;
  date: Date;
  sessionId: string;
}

/**
 * À points égaux, le plus de paniers réussis l'emporte, puis la performance la
 * plus ancienne : un record se garde tant qu'il n'est pas battu, il ne change
 * pas de propriétaire sur une égalité.
 */
function isBetter(candidate: SpotRecord, current: SpotRecord): boolean {
  if (candidate.points !== current.points) return candidate.points > current.points;
  if (candidate.makes !== current.makes) return candidate.makes > current.makes;
  return candidate.date < current.date;
}

export async function GET() {
  try {
    const spotResults = await prisma.spotResult.findMany({
      where: {
        sessionPlayer: {
          session: { status: 'completed' },
        },
      },
      include: {
        sessionPlayer: {
          include: {
            player: true,
            session: { select: { id: true, date: true } },
          },
        },
      },
    });

    const best = spotResults.reduce((acc, result) => {
      const { player, session } = result.sessionPlayer;

      const candidate: SpotRecord = {
        spotNum: result.spotNum,
        spotLabel: result.spotLabel,
        spotSub: result.spotSub,
        points: result.points,
        makes: result.makes,
        ftMakes: result.ftMakes,
        playerId: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        photo: player.photo,
        avatar: player.avatar,
        date: session.date,
        sessionId: session.id,
      };

      const current = acc[result.spotNum];
      if (!current || isBetter(candidate, current)) {
        acc[result.spotNum] = candidate;
      }

      return acc;
    }, {} as Record<number, SpotRecord>);

    const records = Object.values(best).sort((a, b) => a.spotNum - b.spotNum);

    return NextResponse.json(records);
  } catch (error) {
    console.error('Erreur GET spot records:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
