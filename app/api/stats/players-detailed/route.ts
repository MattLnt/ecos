import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helpers de classification
const isMid = (label: string) => label?.includes('MID') && !label?.includes('LANCER FRANC');
const isThree = (label: string) => label?.includes('3 PTS') || label?.includes('3PTS');

/** Tirs tentés par spot, et lancers francs de validation par spot. */
const SHOTS_PER_SPOT = 10;
const FT_PER_SPOT = 2;

interface Tally {
  makes: number;
  attempts: number;
}

interface PlayerAcc {
  playerId: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  avatar: string;
  sessions: number;
  mid: Tally;
  three: Tally;
  ft: Tally;
  spotStats: Record<number, Tally>;
  spotNames: Record<number, { label: string; sub: string }>;
}

/**
 * Pourcentage de réussite, accompagné de son volume.
 *
 * Le taux seul ne veut rien dire : un joueur venu une fois, qui met son seul
 * lancer franc, afficherait 100 %. L'écran a besoin du nombre de tirs pour
 * afficher « 67,3 % (350/520) » et pour écarter du classement les volumes trop
 * faibles.
 */
function withRate(tally: Tally) {
  return {
    makes: tally.makes,
    attempts: tally.attempts,
    rate: tally.attempts > 0 ? Math.round((tally.makes / tally.attempts) * 1000) / 10 : 0,
  };
}

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

    const playerStats = sessionPlayers.reduce((acc, sp) => {
      const playerId = sp.playerId;

      if (!acc[playerId]) {
        acc[playerId] = {
          playerId: sp.player.id,
          firstName: sp.player.firstName,
          lastName: sp.player.lastName,
          photo: sp.player.photo,
          avatar: sp.player.avatar,
          sessions: 0,
          mid: { makes: 0, attempts: 0 },
          three: { makes: 0, attempts: 0 },
          ft: { makes: 0, attempts: 0 },
          spotStats: {},
          spotNames: {},
        };
      }

      // Une session sans aucun spot saisi ne compte pas : elle ne dit rien du
      // niveau du joueur et gonflerait le volume affiché.
      if (sp.spotResults.length > 0) {
        acc[playerId].sessions += 1;
      }

      sp.spotResults.forEach(sr => {
        // Stats générales - FILTRE CORRIGÉ
        if (isMid(sr.spotLabel)) {
          acc[playerId].mid.attempts += SHOTS_PER_SPOT;
          acc[playerId].mid.makes += sr.makes;
        } else if (isThree(sr.spotLabel)) {
          acc[playerId].three.attempts += SHOTS_PER_SPOT;
          acc[playerId].three.makes += sr.makes;
        }
        acc[playerId].ft.attempts += FT_PER_SPOT;
        acc[playerId].ft.makes += sr.ftMakes;

        // Stats par spot
        if (!acc[playerId].spotStats[sr.spotNum]) {
          acc[playerId].spotStats[sr.spotNum] = { makes: 0, attempts: 0 };
          acc[playerId].spotNames[sr.spotNum] = { label: sr.spotLabel, sub: sr.spotSub };
        }
        acc[playerId].spotStats[sr.spotNum].attempts += SHOTS_PER_SPOT;
        acc[playerId].spotStats[sr.spotNum].makes += sr.makes;
      });

      return acc;
    }, {} as Record<string, PlayerAcc>);

    const playersArray = Object.values(playerStats).map((player) => {
      const spots: Record<number, ReturnType<typeof withRate>> = {};

      Object.entries(player.spotStats).forEach(([spotNum, tally]) => {
        spots[parseInt(spotNum)] = withRate(tally);
      });

      return {
        playerId: player.playerId,
        firstName: player.firstName,
        lastName: player.lastName,
        photo: player.photo,
        avatar: player.avatar,
        sessions: player.sessions,
        mid: withRate(player.mid),
        three: withRate(player.three),
        ft: withRate(player.ft),
        spots,
        spotNames: player.spotNames,
      };
    });

    return NextResponse.json(playersArray);
  } catch (error) {
    console.error('Erreur GET players detailed stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
