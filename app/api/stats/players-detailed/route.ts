import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sessionPlayers = await prisma.sessionPlayer.findMany({
      where: {
        session: { status: 'completed' },
      },
      include: {
        player: true,
        spotResults: true,
      },
    });

    // Grouper par joueur
    const playerStats = sessionPlayers.reduce((acc, sp) => {
      const playerId = sp.playerId;
      
      if (!acc[playerId]) {
        acc[playerId] = {
          playerId: sp.player.id,
          firstName: sp.player.firstName,
          lastName: sp.player.lastName,
          photo: sp.player.photo,
          avatar: sp.player.avatar,
          midTotal: 0,
          midMakes: 0,
          threeTotal: 0,
          threeMakes: 0,
          ftTotal: 0,
          ftMakes: 0,
          spotStats: {} as Record<number, { total: number; makes: number }>,
          spotNames: {} as Record<number, { label: string; sub: string }>,
        };
      }
      
      sp.spotResults.forEach(sr => {
        // Stats générales
        if (sr.spotLabel.includes('MID')) {
          acc[playerId].midTotal += 10;
          acc[playerId].midMakes += sr.makes;
        } else if (sr.spotLabel.includes('3PTS')) {
          acc[playerId].threeTotal += 10;
          acc[playerId].threeMakes += sr.makes;
        }
        acc[playerId].ftTotal += 2;
        acc[playerId].ftMakes += sr.ftMakes;

        // Stats par spot
        if (!acc[playerId].spotStats[sr.spotNum]) {
          acc[playerId].spotStats[sr.spotNum] = { total: 0, makes: 0 };
          acc[playerId].spotNames[sr.spotNum] = { label: sr.spotLabel, sub: sr.spotSub };
        }
        acc[playerId].spotStats[sr.spotNum].total += 10;
        acc[playerId].spotStats[sr.spotNum].makes += sr.makes;
      });
      
      return acc;
    }, {} as Record<string, any>);

    // Calculer les taux
    const playersArray = Object.values(playerStats).map((player: any) => {
      const spotRates: Record<number, number> = {};
      
      Object.entries(player.spotStats).forEach(([spotNum, stats]: [string, any]) => {
        spotRates[parseInt(spotNum)] = (stats.makes / stats.total) * 100;
      });

      return {
        playerId: player.playerId,
        firstName: player.firstName,
        lastName: player.lastName,
        photo: player.photo,
        avatar: player.avatar,
        midRate: player.midTotal > 0 ? Math.round((player.midMakes / player.midTotal) * 1000) / 10 : 0,
        threePointRate: player.threeTotal > 0 ? Math.round((player.threeMakes / player.threeTotal) * 1000) / 10 : 0,
        ftRate: player.ftTotal > 0 ? Math.round((player.ftMakes / player.ftTotal) * 1000) / 10 : 0,
        spotRates,
        spotNames: player.spotNames,
      };
    });

    return NextResponse.json(playersArray);
  } catch (error) {
    console.error('Erreur GET players detailed stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}