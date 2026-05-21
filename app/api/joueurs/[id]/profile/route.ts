import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerId } = await params;

    // Récupérer le joueur
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json({ error: 'Joueur introuvable' }, { status: 404 });
    }

    // Récupérer toutes les sessions du joueur
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
      orderBy: {
        session: { date: 'desc' },
      },
    });

    // Stats globales
    const totalSessions = sessionPlayers.length;
    const totalPoints = sessionPlayers.reduce((sum, sp) => sum + sp.totalPoints, 0);
    const avgPoints = totalSessions > 0 ? totalPoints / totalSessions : 0;
    const bestScore = sessionPlayers.length > 0 
      ? Math.max(...sessionPlayers.map(sp => sp.totalPoints)) 
      : 0;

    // Victoires
    const victories = sessionPlayers.filter(sp => {
      const rank = sp.session.sessionPlayers.findIndex(p => p.id === sp.id);
      return rank === 0;
    }).length;

    // Stats mid / 3pts / LF
    const allSpotResults = sessionPlayers.flatMap(sp => sp.spotResults);
    
    const midSpots = allSpotResults.filter(sr => sr.spotLabel.includes('MID'));
    const midAttempts = midSpots.length * 10;
    const midMakes = midSpots.reduce((sum, sr) => sum + sr.makes, 0);
    const midRate = midAttempts > 0 ? (midMakes / midAttempts) * 100 : 0;

    const threeSpots = allSpotResults.filter(sr => sr.spotLabel.includes('3PTS'));
    const threeAttempts = threeSpots.length * 10;
    const threeMakes = threeSpots.reduce((sum, sr) => sum + sr.makes, 0);
    const threePointRate = threeAttempts > 0 ? (threeMakes / threeAttempts) * 100 : 0;

    const ftAttempts = allSpotResults.length * 2;
    const ftMakes = allSpotResults.reduce((sum, sr) => sum + sr.ftMakes, 0);
    const ftRate = ftAttempts > 0 ? (ftMakes / ftAttempts) * 100 : 0;

    // Sessions récentes (5 dernières)
    const recentSessions = sessionPlayers.slice(0, 5).map(sp => {
      const rank = sp.session.sessionPlayers.findIndex(p => p.id === sp.id) + 1;
      return {
        id: sp.sessionId,
        date: sp.session.date,
        points: sp.totalPoints,
        rank,
        totalPlayers: sp.session.sessionPlayers.length,
      };
    });

    // Évolution (10 dernières sessions)
    const evolution = sessionPlayers.slice(0, 10).reverse().map(sp => ({
      date: new Date(sp.session.date).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short' 
      }),
      points: sp.totalPoints,
    }));

    // Performance par spot
    const spotStats = allSpotResults.reduce((acc, sr) => {
      if (!acc[sr.spotNum]) {
        acc[sr.spotNum] = {
          spotNum: sr.spotNum,
          spotLabel: sr.spotLabel,
          totalAttempts: 0,
          totalMakes: 0,
        };
      }
      acc[sr.spotNum].totalAttempts += 10;
      acc[sr.spotNum].totalMakes += sr.makes;
      return acc;
    }, {} as Record<number, any>);

    const spotPerformance = Object.values(spotStats)
      .map((spot: any) => ({
        spotNum: spot.spotNum,
        spotLabel: spot.spotLabel,
        rate: (spot.totalMakes / spot.totalAttempts) * 100,
      }))
      .sort((a, b) => a.spotNum - b.spotNum);

    // Radar data
    const radarData = [
      { category: 'Mid-Range', value: midRate },
      { category: '3 Points', value: threePointRate },
      { category: 'Lancers Francs', value: ftRate },
      { category: 'Régularité', value: totalSessions > 0 ? Math.min((victories / totalSessions) * 100 * 2, 100) : 0 },
      { category: 'Performance', value: avgPoints > 0 ? Math.min((avgPoints / 100) * 100, 100) : 0 },
    ];

    return NextResponse.json({
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      photo: player.photo,
      avatar: player.avatar,
      nbaTeam: player.nbaTeam,
      totalSessions,
      totalPoints,
      avgPoints: Math.round(avgPoints * 10) / 10,
      bestScore,
      victories,
      midRate: Math.round(midRate * 10) / 10,
      threePointRate: Math.round(threePointRate * 10) / 10,
      ftRate: Math.round(ftRate * 10) / 10,
      recentSessions,
      evolution,
      spotPerformance,
      radarData,
    });
  } catch (error) {
    console.error('Erreur GET player profile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}