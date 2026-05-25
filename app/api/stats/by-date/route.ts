import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helpers de classification
const isMid = (label: string) => label?.includes('MID') && !label?.includes('LANCER FRANC');
const isThree = (label: string) => label?.includes('3 PTS') || label?.includes('3PTS');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // format YYYY-MM-DD
    const sessionId = searchParams.get('sessionId'); // optionnel : une session précise

    if (!date && !sessionId) {
      return NextResponse.json({ error: 'date ou sessionId requis' }, { status: 400 });
    }

    // Construire le filtre WHERE
    let sessionWhere: Record<string, unknown> = { status: 'completed' };

    if (sessionId) {
      sessionWhere = { id: sessionId, status: 'completed' };
    } else if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59.999`);
      sessionWhere = {
        status: 'completed',
        date: { gte: start, lte: end },
      };
    }

    // Récupérer les sessions concernées
    const sessions = await prisma.session.findMany({
      where: sessionWhere,
      include: {
        sessionPlayers: {
          include: {
            player: true,
            spotResults: true,
          },
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    if (sessions.length === 0) {
      return NextResponse.json({
        sessionCount: 0,
        players: [],
        spots: [],
        records: null,
      });
    }

    // ===== AGRÉGATION PAR JOUEUR =====
    interface PlayerAgg {
      playerId: string;
      firstName: string;
      lastName: string;
      photo: string | null;
      avatar: string;
      totalPoints: number;
      sessionsPlayed: number;
      midTotal: number;
      midMakes: number;
      threeTotal: number;
      threeMakes: number;
      ftTotal: number;
      ftMakes: number;
      bestScore: number;
      worstScore: number;
    }

    const playerMap: Record<string, PlayerAgg> = {};

    // ===== AGRÉGATION PAR SPOT =====
    interface SpotAgg {
      spotNum: number;
      spotLabel: string;
      spotSub: string;
      total: number;
      makes: number;
    }
    const spotMap: Record<number, SpotAgg> = {};

    sessions.forEach((session) => {
      session.sessionPlayers.forEach((sp) => {
        const pid = sp.playerId;

        if (!playerMap[pid]) {
          playerMap[pid] = {
            playerId: pid,
            firstName: sp.player.firstName,
            lastName: sp.player.lastName,
            photo: sp.player.photo,
            avatar: sp.player.avatar,
            totalPoints: 0,
            sessionsPlayed: 0,
            midTotal: 0,
            midMakes: 0,
            threeTotal: 0,
            threeMakes: 0,
            ftTotal: 0,
            ftMakes: 0,
            bestScore: 0,
            worstScore: Number.MAX_SAFE_INTEGER,
          };
        }

        const p = playerMap[pid];
        p.totalPoints += sp.totalPoints;
        p.sessionsPlayed += 1;
        if (sp.totalPoints > p.bestScore) p.bestScore = sp.totalPoints;
        if (sp.totalPoints < p.worstScore) p.worstScore = sp.totalPoints;

        sp.spotResults.forEach((sr) => {
          // Stats joueur
          if (isMid(sr.spotLabel)) {
            p.midTotal += 10;
            p.midMakes += sr.makes;
          } else if (isThree(sr.spotLabel)) {
            p.threeTotal += 10;
            p.threeMakes += sr.makes;
          }
          p.ftTotal += 2;
          p.ftMakes += sr.ftMakes;

          // Stats spot
          if (!spotMap[sr.spotNum]) {
            spotMap[sr.spotNum] = {
              spotNum: sr.spotNum,
              spotLabel: sr.spotLabel,
              spotSub: sr.spotSub,
              total: 0,
              makes: 0,
            };
          }
          spotMap[sr.spotNum].total += 10;
          spotMap[sr.spotNum].makes += sr.makes;
        });
      });
    });

    // ===== FORMATER LES JOUEURS =====
    const players = Object.values(playerMap)
      .map((p) => ({
        playerId: p.playerId,
        firstName: p.firstName,
        lastName: p.lastName,
        photo: p.photo,
        avatar: p.avatar,
        totalPoints: p.totalPoints,
        avgPoints: Math.round((p.totalPoints / p.sessionsPlayed) * 10) / 10,
        sessionsPlayed: p.sessionsPlayed,
        midRate: p.midTotal > 0 ? Math.round((p.midMakes / p.midTotal) * 1000) / 10 : 0,
        threePointRate: p.threeTotal > 0 ? Math.round((p.threeMakes / p.threeTotal) * 1000) / 10 : 0,
        ftRate: p.ftTotal > 0 ? Math.round((p.ftMakes / p.ftTotal) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // ===== FORMATER LES SPOTS =====
    const spots = Object.values(spotMap)
      .map((s) => ({
        spotNum: s.spotNum,
        spotLabel: s.spotLabel,
        spotSub: s.spotSub,
        fullLabel: `${s.spotLabel} ${s.spotSub}`.trim(),
        successRate: s.total > 0 ? Math.round((s.makes / s.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => a.spotNum - b.spotNum);

    // ===== RECORDS DE LA SÉLECTION =====
    let bestScore = { points: 0, playerName: '' };
    let worstScore = { points: Number.MAX_SAFE_INTEGER, playerName: '' };
    let bestThree = { rate: -1, playerName: '' };
    let bestFt = { rate: -1, playerName: '' };

    players.forEach((p) => {
      if (p.totalPoints > bestScore.points) {
        bestScore = { points: p.totalPoints, playerName: p.firstName };
      }
      if (p.totalPoints < worstScore.points) {
        worstScore = { points: p.totalPoints, playerName: p.firstName };
      }
      if (p.threePointRate > bestThree.rate) {
        bestThree = { rate: p.threePointRate, playerName: p.firstName };
      }
      if (p.ftRate > bestFt.rate) {
        bestFt = { rate: p.ftRate, playerName: p.firstName };
      }
    });

    const records = {
      bestScore: bestScore.playerName ? bestScore : null,
      worstScore: worstScore.playerName ? worstScore : null,
      bestThree: bestThree.playerName ? bestThree : null,
      bestFt: bestFt.playerName ? bestFt : null,
    };

    return NextResponse.json({
      sessionCount: sessions.length,
      players,
      spots,
      records,
    });
  } catch (error) {
    console.error('Erreur GET stats by-date:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}