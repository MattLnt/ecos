import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerId } = await params;

    const sessionPlayers = await prisma.sessionPlayer.findMany({
      where: {
        playerId,
        session: { status: 'completed' },
      },
      include: {
        session: {
          include: {
            sessionPlayers: {
              orderBy: { totalPoints: 'desc' },
            },
          },
        },
        spotResults: true,
      },
    });

    if (sessionPlayers.length === 0) {
      return NextResponse.json({
        pts: 0,
        threePct: 0,
        sessions: 0,
        midPct: 0,
        victories: 0,
        ftPct: 0,
      });
    }

    // Moyenne points
    const totalPoints = sessionPlayers.reduce((sum, sp) => sum + sp.totalPoints, 0);
    const avgPoints = Math.round((totalPoints / sessionPlayers.length) * 10) / 10;

    // Victoires
    const victories = sessionPlayers.filter(sp => {
      return sp.session.sessionPlayers[0]?.id === sp.id;
    }).length;

    // Stats spots
    const allSpotResults = sessionPlayers.flatMap(sp => sp.spotResults);

    const midSpots = allSpotResults.filter(sr => sr.spotLabel.includes('MID'));
    const midAttempts = midSpots.length * 10;
    const midMakes = midSpots.reduce((sum, sr) => sum + sr.makes, 0);
    const midPct = midAttempts > 0 ? Math.round((midMakes / midAttempts) * 1000) / 10 : 0;

    const threeSpots = allSpotResults.filter(sr => sr.spotLabel.includes('3PTS'));
    const threeAttempts = threeSpots.length * 10;
    const threeMakes = threeSpots.reduce((sum, sr) => sum + sr.makes, 0);
    const threePct = threeAttempts > 0 ? Math.round((threeMakes / threeAttempts) * 1000) / 10 : 0;

    const ftAttempts = allSpotResults.length * 2;
    const ftMakes = allSpotResults.reduce((sum, sr) => sum + sr.ftMakes, 0);
    const ftPct = ftAttempts > 0 ? Math.round((ftMakes / ftAttempts) * 1000) / 10 : 0;

    return NextResponse.json({
      pts: avgPoints,
      threePct,
      sessions: sessionPlayers.length,
      midPct,
      victories,
      ftPct,
    });
  } catch (error) {
    console.error('Erreur GET player stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}