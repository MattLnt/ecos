'use client';

import { FutPlayerCard } from '@/components/cards/FutPlayerCard';

interface PlayerCardProps {
  id: string;
  firstName: string;
  lastName: string;
  position?: string | null;
  photo?: string | null;
  avatar: string;
  nbaTeam?: string | null;
  stats: {
    pts: number;
    threePct: number;
    sessions: number;
    midPct: number;
    victories: number;
    ftPct: number;
  };
}

/**
 * Carte de la grille /joueurs. Toute la peinture vit dans <FutPlayerCard /> :
 * ici on ne fait que traduire les stats de la liste en six cases de carte.
 */
export function PlayerCard({
  firstName,
  lastName,
  position,
  photo,
  avatar,
  nbaTeam,
  stats,
}: PlayerCardProps) {
  // Note globale : moyenne des trois pourcentages de réussite.
  const overall = Math.round((stats.threePct + stats.midPct + stats.ftPct) / 3);

  return (
    <FutPlayerCard
      firstName={firstName}
      lastName={lastName}
      overall={overall}
      position={position}
      photo={photo}
      avatar={avatar}
      nbaTeam={nbaTeam}
      stats={[
        { label: 'PTS', value: stats.pts },
        { label: '3PT', value: stats.threePct },
        { label: 'MID', value: stats.midPct },
        { label: 'LF', value: stats.ftPct },
        { label: 'VIC', value: stats.victories },
        { label: 'SES', value: stats.sessions },
      ]}
    />
  );
}
