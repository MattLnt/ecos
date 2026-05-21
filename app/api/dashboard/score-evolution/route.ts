import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    // Calculer la date de début selon la période
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

    // Récupérer toutes les sessions terminées dans la période
    const sessions = await prisma.session.findMany({
      where: {
        status: 'completed',
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        sessionPlayers: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Grouper les sessions par période
    const dataByPeriod = new Map<string, { totalPoints: number; count: number }>();

    sessions.forEach((session) => {
      const date = new Date(session.date);
      let key = '';

      if (groupBy === 'day') {
        key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `S${Math.ceil((date.getDate()) / 7)} ${date.toLocaleDateString('fr-FR', { month: 'short' })}`;
      } else {
        key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      }

      const avgPoints = session.sessionPlayers.reduce((sum, sp) => sum + sp.totalPoints, 0) / session.sessionPlayers.length;

      if (!dataByPeriod.has(key)) {
        dataByPeriod.set(key, { totalPoints: 0, count: 0 });
      }

      const current = dataByPeriod.get(key)!;
      current.totalPoints += avgPoints;
      current.count += 1;
    });

    // Calculer les moyennes
    const chartData = Array.from(dataByPeriod.entries()).map(([date, data]) => ({
      date,
      avg: Math.round((data.totalPoints / data.count) * 10) / 10,
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Erreur GET score evolution:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}