import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Meilleur score
    const bestScoreResult = await prisma.sessionPlayer.findFirst({
      where: {
        session: { status: 'completed' },
      },
      orderBy: {
        totalPoints: 'desc',
      },
      include: {
        player: true,
        session: true,
      },
    });

    // Pire score
    const worstScoreResult = await prisma.sessionPlayer.findFirst({
      where: {
        session: { status: 'completed' },
      },
      orderBy: {
        totalPoints: 'asc',
      },
      include: {
        player: true,
        session: true,
      },
    });

    // Séries de victoires
    const allSessions = await prisma.session.findMany({
      where: { status: 'completed' },
      orderBy: { date: 'asc' },
      include: {
        sessionPlayers: {
          orderBy: { totalPoints: 'desc' },
          take: 1,
          include: { player: true },
        },
      },
    });

    let maxStreak = 0;
    let maxStreakPlayer = '';
    let currentStreak = 0;
    let currentPlayer = '';

    allSessions.forEach((session) => {
      const winner = session.sessionPlayers[0];
      if (!winner) return;

      const winnerName = winner.player.firstName;
      if (winnerName === currentPlayer) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
        currentPlayer = winnerName;
      }

      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
        maxStreakPlayer = winnerName;
      }
    });

    // Meilleur taux LF
    const spotResults = await prisma.spotResult.findMany({
      where: {
        sessionPlayer: {
          session: { status: 'completed' },
        },
      },
      include: {
        sessionPlayer: {
          include: { player: true },
        },
      },
    });

    const ftStats = spotResults.reduce((acc, result) => {
      const playerName = result.sessionPlayer.player.firstName;
      
      if (!acc[playerName]) {
        acc[playerName] = { totalAttempts: 0, totalMakes: 0 };
      }
      
      acc[playerName].totalAttempts += 2;
      acc[playerName].totalMakes += result.ftMakes;
      
      return acc;
    }, {} as Record<string, any>);

    let bestFtRate = 0;
    let bestFtPlayer = '';
    let bestFtAttempts = 0;

    Object.entries(ftStats).forEach(([playerName, stats]: [string, any]) => {
      const rate = (stats.totalMakes / stats.totalAttempts) * 100;
      if (rate > bestFtRate && stats.totalAttempts >= 20) {
        bestFtRate = rate;
        bestFtPlayer = playerName;
        bestFtAttempts = stats.totalAttempts;
      }
    });

    return NextResponse.json({
      bestScore: bestScoreResult ? {
        points: bestScoreResult.totalPoints,
        playerName: bestScoreResult.player.firstName,
        date: bestScoreResult.session.date,
        sessionId: bestScoreResult.sessionId,
      } : null,
      worstScore: worstScoreResult ? {
        points: worstScoreResult.totalPoints,
        playerName: worstScoreResult.player.firstName,
        date: worstScoreResult.session.date,
        sessionId: worstScoreResult.sessionId,
      } : null,
      longestWinStreak: maxStreak > 0 ? {
        count: maxStreak,
        playerName: maxStreakPlayer,
      } : null,
      bestFtRate: bestFtPlayer ? {
        rate: bestFtRate,
        playerName: bestFtPlayer,
        totalAttempts: bestFtAttempts,
      } : null,
    });
  } catch (error) {
    console.error('Erreur GET records:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}