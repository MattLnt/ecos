import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Réaligne le total du joueur sur la somme réelle de ses spots.
 *
 * L'ancienne version incrémentait le total à chaque enregistrement. Un double
 * appui ou un retour arrière le faisait donc dériver sans moyen de le
 * rattraper. Recalculer coûte une requête de plus et ne peut pas dériver.
 */
async function syncTotalPoints(sessionPlayerId: string) {
  const sum = await prisma.spotResult.aggregate({
    where: { sessionPlayerId },
    _sum: { points: true },
  });

  await prisma.sessionPlayer.update({
    where: { id: sessionPlayerId },
    data: { totalPoints: sum._sum.points ?? 0 },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionPlayerId, spotNum, spotLabel, spotSub, makes, ftMakes, points, recordedAt } = body;

    /*
      L'appareil envoie l'heure du tir. Sans elle on retomberait sur l'heure
      d'arrivée au serveur, qui peut arriver bien plus tard : les saisies
      passent par une file rejouée au retour du réseau.
    */
    const recorded = recordedAt ? new Date(recordedAt) : new Date();
    const recordedValid = !Number.isNaN(recorded.getTime()) ? recorded : new Date();

    /*
      Upsert et non create : un joueur ne tire qu'une fois chaque spot dans une
      session. Renvoyer deux fois le même spot — double appui pendant la
      requête, ou ressaisie après un retour arrière — doit écraser la ligne,
      pas en ajouter une seconde.
    */
    const spotResult = await prisma.spotResult.upsert({
      where: {
        sessionPlayerId_spotNum: { sessionPlayerId, spotNum },
      },
      create: {
        sessionPlayerId,
        spotNum,
        spotLabel,
        spotSub,
        makes,
        ftMakes,
        points,
        recordedAt: recordedValid,
      },
      update: {
        spotLabel,
        spotSub,
        makes,
        ftMakes,
        points,
        // Une ressaisie remplace aussi l'horodatage : c'est ce tir-là qui compte.
        recordedAt: recordedValid,
      },
    });

    await syncTotalPoints(sessionPlayerId);

    return NextResponse.json(spotResult);
  } catch (error) {
    console.error('Erreur POST spot result:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/** Retour arrière sur un spot déjà enregistré : la ligne doit disparaître. */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { sessionPlayerId, spotNum } = body;

    if (!sessionPlayerId || typeof spotNum !== 'number') {
      return NextResponse.json(
        { error: 'sessionPlayerId et spotNum requis' },
        { status: 400 }
      );
    }

    // deleteMany plutôt que delete : annuler un spot jamais enregistré ne doit
    // pas renvoyer d'erreur.
    await prisma.spotResult.deleteMany({ where: { sessionPlayerId, spotNum } });

    await syncTotalPoints(sessionPlayerId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur DELETE spot result:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
