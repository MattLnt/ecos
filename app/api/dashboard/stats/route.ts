import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Sessions totales
    const totalSessions = await prisma.session.count({
      where: { status: 'completed' },
    });

    const lastMonthSessions = await prisma.session.count({
      where: {
        status: 'completed',
        date: { gte: lastMonth },
      },
    });

    // Joueurs actifs (participants uniques ce mois)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const activePlayersData = await prisma.sessionPlayer.findMany({
      where: {
        session: {
          date: { gte: thisMonthStart },
          status: 'completed',
        },
      },
      select: {
        playerId: true,
      },
      distinct: ['playerId'],
    });
    const activePlayers = activePlayersData.length;

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPlayersData = await prisma.sessionPlayer.findMany({
      where: {
        session: {
          date: { gte: lastMonthStart, lt: thisMonthStart },
          status: 'completed',
        },
      },
      select: {
        playerId: true,
      },
      distinct: ['playerId'],
    });
    const lastMonthPlayers = lastMonthPlayersData.length;

    // Moyenne des points
    const avgPointsResult = await prisma.sessionPlayer.aggregate({
      where: {
        session: { status: 'completed' },
      },
      _avg: {
        totalPoints: true,
      },
    });
    const avgPoints = avgPointsResult._avg.totalPoints || 0;

    const lastMonthAvgResult = await prisma.sessionPlayer.aggregate({
      where: {
        session: {
          status: 'completed',
          date: { gte: lastMonth },
        },
      },
      _avg: {
        totalPoints: true,
      },
    });
    const lastMonthAvg = lastMonthAvgResult._avg.totalPoints || 0;

    // Temps total (en minutes)
    const completedSessions = await prisma.session.findMany({
      where: {
        status: 'completed',
        endedAt: { not: null },
      },
      select: {
        startedAt: true,
        endedAt: true,
      },
    });

    const totalMinutes = completedSessions.reduce((sum, session) => {
      if (!session.endedAt) return sum;
      const duration = Math.floor(
        (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000 / 60
      );
      return sum + duration;
    }, 0);

    // Calcul des croissances
    const sessionsGrowth = lastMonthSessions > 0 
      ? ((totalSessions - lastMonthSessions) / lastMonthSessions) * 100 
      : 0;
    
    const playersGrowth = lastMonthPlayers > 0 
      ? ((activePlayers - lastMonthPlayers) / lastMonthPlayers) * 100 
      : 0;
    
    const pointsGrowth = lastMonthAvg > 0 
      ? ((avgPoints - lastMonthAvg) / lastMonthAvg) * 100 
      : 0;

    return NextResponse.json({
      totalSessions,
      activePlayers,
      avgPoints: Math.round(avgPoints * 10) / 10,
      totalMinutes,
      growth: {
        sessions: Math.round(sessionsGrowth * 10) / 10,
        players: Math.round(playersGrowth * 10) / 10,
        points: Math.round(pointsGrowth * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Erreur GET dashboard stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}