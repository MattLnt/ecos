import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SpotAcc {
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  totalAttempts: number;
  totalMakes: number;
}

export async function GET() {
  try {
    const spotResults = await prisma.spotResult.findMany({
      where: {
        sessionPlayer: {
          session: { status: 'completed' },
        },
      },
    });

    const spotStats = spotResults.reduce((acc, result) => {
      const key = result.spotNum;

      if (!acc[key]) {
        acc[key] = {
          spotNum: result.spotNum,
          spotLabel: result.spotLabel,
          spotSub: result.spotSub,
          totalAttempts: 0,
          totalMakes: 0,
        };
      }

      acc[key].totalAttempts += 10;
      acc[key].totalMakes += result.makes;

      return acc;
    }, {} as Record<number, SpotAcc>);

    const spotsArray = Object.values(spotStats)
      .map((spot) => ({
        spotNum: spot.spotNum,
        spotLabel: spot.spotLabel,
        spotSub: spot.spotSub,
        // ✅ Label complet pour l'affichage : "0° MID DROITE"
        fullLabel: `${spot.spotLabel} ${spot.spotSub}`.trim(),
        successRate: (spot.totalMakes / spot.totalAttempts) * 100,
      }))
      .sort((a, b) => a.spotNum - b.spotNum);

    return NextResponse.json(spotsArray);
  } catch (error) {
    console.error('Erreur GET spots stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}