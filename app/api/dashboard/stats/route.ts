import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { activeMinutesBySession } from '@/lib/sessionDuration';

// Classification des spots, identique aux statistiques détaillées.
const isMid = (label: string) => label?.includes('MID') && !label?.includes('LANCER FRANC');
const isThree = (label: string) => label?.includes('3 PTS') || label?.includes('3PTS');

const SHOTS_PER_SPOT = 10;
const FT_PER_SPOT = 2;

/** Évolution d'un mois sur l'autre. `null` quand il n'y a rien à comparer. */
function growth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function rate(makes: number, attempts: number) {
  return {
    makes,
    attempts,
    rate: attempts > 0 ? Math.round((makes / attempts) * 1000) / 10 : 0,
  };
}

export async function GET() {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const completedSessions = await prisma.session.findMany({
      where: { status: 'completed' },
      select: { id: true, date: true },
    });

    const totalSessions = completedSessions.length;
    const sessionsThisMonth = completedSessions.filter((s) => s.date >= thisMonthStart).length;
    const sessionsLastMonth = completedSessions.filter(
      (s) => s.date >= lastMonthStart && s.date < thisMonthStart
    ).length;

    /*
      Joueurs actifs : participants distincts du mois en cours, comparés au
      mois précédent et non au total. L'ancienne version divisait un cumul de
      toute l'histoire par le dernier mois : la variation affichée sur les
      sessions ne voulait rien dire.
    */
    const [activeThisMonth, activeLastMonth] = await Promise.all([
      prisma.sessionPlayer.findMany({
        where: { session: { date: { gte: thisMonthStart }, status: 'completed' } },
        select: { playerId: true },
        distinct: ['playerId'],
      }),
      prisma.sessionPlayer.findMany({
        where: {
          session: { date: { gte: lastMonthStart, lt: thisMonthStart }, status: 'completed' },
        },
        select: { playerId: true },
        distinct: ['playerId'],
      }),
    ]);

    const [avgAll, avgThisMonth, avgLastMonth] = await Promise.all([
      prisma.sessionPlayer.aggregate({
        where: { session: { status: 'completed' } },
        _avg: { totalPoints: true },
      }),
      prisma.sessionPlayer.aggregate({
        where: { session: { status: 'completed', date: { gte: thisMonthStart } } },
        _avg: { totalPoints: true },
      }),
      prisma.sessionPlayer.aggregate({
        where: {
          session: { status: 'completed', date: { gte: lastMonthStart, lt: thisMonthStart } },
        },
        _avg: { totalPoints: true },
      }),
    ]);

    // Temps de jeu, mesuré sur les saisies et non sur `endedAt - startedAt`.
    const minutesBySession = await activeMinutesBySession();
    const totalMinutes = completedSessions.reduce(
      (sum, session) => sum + (minutesBySession.get(session.id) ?? 0),
      0
    );

    /*
      Adresse du club. C'est le cœur de l'application, et le tableau de bord
      l'ignorait : il fallait ouvrir les statistiques pour savoir si on tirait
      bien.
    */
    const spotResults = await prisma.spotResult.findMany({
      where: { sessionPlayer: { session: { status: 'completed' } } },
      select: { spotLabel: true, makes: true, ftMakes: true },
    });

    let midMakes = 0;
    let midAttempts = 0;
    let threeMakes = 0;
    let threeAttempts = 0;
    let ftMakes = 0;
    let ftAttempts = 0;

    spotResults.forEach((result) => {
      if (isMid(result.spotLabel)) {
        midAttempts += SHOTS_PER_SPOT;
        midMakes += result.makes;
      } else if (isThree(result.spotLabel)) {
        threeAttempts += SHOTS_PER_SPOT;
        threeMakes += result.makes;
      }
      ftAttempts += FT_PER_SPOT;
      ftMakes += result.ftMakes;
    });

    // Record du club : le meilleur score réalisé sur une session.
    const best = await prisma.sessionPlayer.findFirst({
      where: { session: { status: 'completed' } },
      orderBy: { totalPoints: 'desc' },
      include: { player: true, session: { select: { id: true, date: true } } },
    });

    return NextResponse.json({
      totalSessions,
      sessionsThisMonth,
      activePlayers: activeThisMonth.length,
      avgPoints: Math.round((avgAll._avg.totalPoints || 0) * 10) / 10,
      totalMinutes,
      shooting: {
        mid: rate(midMakes, midAttempts),
        three: rate(threeMakes, threeAttempts),
        ft: rate(ftMakes, ftAttempts),
      },
      bestScore: best
        ? {
            points: best.totalPoints,
            firstName: best.player.firstName,
            lastName: best.player.lastName,
            photo: best.player.photo,
            avatar: best.player.avatar,
            playerId: best.player.id,
            date: best.session.date,
          }
        : null,
      growth: {
        sessions: growth(sessionsThisMonth, sessionsLastMonth),
        players: growth(activeThisMonth.length, activeLastMonth.length),
        points: growth(avgThisMonth._avg.totalPoints || 0, avgLastMonth._avg.totalPoints || 0),
      },
    });
  } catch (error) {
    console.error('Erreur GET dashboard stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
