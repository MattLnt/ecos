import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const spotResults = await prisma.spotResult.findMany({
      where: {
        sessionPlayer: {
          session: { status: 'completed' },
        },
      },
    });

    // Grouper par spot
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
    }, {} as Record<number, any>);

    // Calculer taux de réussite
    const spotsArray = Object.values(spotStats)
      .map((spot: any) => ({
        spotNum: spot.spotNum,
        spotLabel: spot.spotLabel,
        spotSub: spot.spotSub,
        successRate: (spot.totalMakes / spot.totalAttempts) * 100,
      }))
      .sort((a, b) => a.spotNum - b.spotNum);

    return NextResponse.json(spotsArray);
  } catch (error) {
    console.error('Erreur GET spots stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}