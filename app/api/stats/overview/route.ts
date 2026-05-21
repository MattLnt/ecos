import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    // Total sessions
    const totalSessions = await prisma.session.count({
      where: { status: 'completed' },
    });

    // Récupérer tous les spotResults
    const spotResults = await prisma.spotResult.findMany({
      where: {
        sessionPlayer: {
          session: { status: 'completed' },
        },
      },
    });

    // Identifier spots mid vs 3pts (basé sur le label)
    const midSpots = spotResults.filter(r => r.spotLabel.includes('MID'));
    const threePointSpots = spotResults.filter(r => r.spotLabel.includes('3PTS'));

    // Calculer taux mid-range
    const midAttempts = midSpots.length * 10;
    const midMakes = midSpots.reduce((sum, r) => sum + r.makes, 0);
    const midRate = midAttempts > 0 ? (midMakes / midAttempts) * 100 : 0;

    // Calculer taux 3 points
    const threeAttempts = threePointSpots.length * 10;
    const threeMakes = threePointSpots.reduce((sum, r) => sum + r.makes, 0);
    const threePointRate = threeAttempts > 0 ? (threeMakes / threeAttempts) * 100 : 0;

    // Calculer taux lancers francs
    const ftAttempts = spotResults.length * 2;
    const ftMakes = spotResults.reduce((sum, r) => sum + r.ftMakes, 0);
    const ftRate = ftAttempts > 0 ? (ftMakes / ftAttempts) * 100 : 0;

    // Évolution selon période
    const now = new Date();
    let startDate = new Date();
    let groupBy: 'day' | 'week' | 'month' = 'day';

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        groupBy = 'day';
        break;
      case '15d':
        startDate.setDate(now.getDate() - 15);
        groupBy = 'day';
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        groupBy = 'day';
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        groupBy = 'week';
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        groupBy = 'week';
        break;
      case '12m':
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = 'month';
        break;
      case '24m':
        startDate.setFullYear(now.getFullYear() - 2);
        groupBy = 'month';
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Récupérer sessions dans la période
    const sessions = await prisma.session.findMany({
      where: {
        status: 'completed',
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        sessionPlayers: {
          include: {
            spotResults: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Grouper par période
    const dataByPeriod = new Map<string, { midTotal: number; midMakes: number; threeTotal: number; threeMakes: number; ftTotal: number; ftMakes: number }>();

    sessions.forEach((session) => {
      const date = new Date(session.date);
      let key = '';

      if (groupBy === 'day') {
        key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      } else if (groupBy === 'week') {
        key = `S${Math.ceil((date.getDate()) / 7)} ${date.toLocaleDateString('fr-FR', { month: 'short' })}`;
      } else {
        key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      }

      if (!dataByPeriod.has(key)) {
        dataByPeriod.set(key, { midTotal: 0, midMakes: 0, threeTotal: 0, threeMakes: 0, ftTotal: 0, ftMakes: 0 });
      }

      const current = dataByPeriod.get(key)!;

      session.sessionPlayers.forEach(sp => {
        sp.spotResults.forEach(sr => {
          if (sr.spotLabel.includes('MID')) {
            current.midTotal += 10;
            current.midMakes += sr.makes;
          } else if (sr.spotLabel.includes('3PTS')) {
            current.threeTotal += 10;
            current.threeMakes += sr.makes;
          }
          current.ftTotal += 2;
          current.ftMakes += sr.ftMakes;
        });
      });
    });

    // Calculer les taux
    const evolution = Array.from(dataByPeriod.entries()).map(([date, data]) => ({
      date,
      midRate: data.midTotal > 0 ? Math.round((data.midMakes / data.midTotal) * 1000) / 10 : 0,
      threePointRate: data.threeTotal > 0 ? Math.round((data.threeMakes / data.threeTotal) * 1000) / 10 : 0,
      ftRate: data.ftTotal > 0 ? Math.round((data.ftMakes / data.ftTotal) * 1000) / 10 : 0,
    }));

    return NextResponse.json({
      totalSessions,
      midRate: Math.round(midRate * 10) / 10,
      threePointRate: Math.round(threePointRate * 10) / 10,
      ftRate: Math.round(ftRate * 10) / 10,
      evolution,
    });
  } catch (error) {
    console.error('Erreur GET overview stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}