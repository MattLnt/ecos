'use client';

import { FutPlayerCard } from '@/components/cards/FutPlayerCard';
import styles from './PlayerCard.module.css';

interface PlayerCardProps {
  firstName: string;
  lastName: string;
  photo: string | null;
  avatar: string;
  position?: string | null;
  nbaTeam: string | null;
  avgPoints: number;
  midRate: number;
  threePointRate: number;
  ftRate: number;
  victories: number;
  totalSessions: number;
}

/**
 * Carte du profil joueur : la même carte que dans la grille /joueurs, en plus
 * grand. Seules les stats affichées diffèrent — ici la moyenne de points
 * plutôt que le total.
 */
export function PlayerCard({
  firstName,
  lastName,
  photo,
  avatar,
  position,
  nbaTeam,
  avgPoints,
  midRate,
  threePointRate,
  ftRate,
  victories,
  totalSessions,
}: PlayerCardProps) {
  const overall = Math.round((midRate + threePointRate + ftRate) / 3);

  return (
    <div className="flex justify-center">
      <FutPlayerCard
        className={styles.xl}
        firstName={firstName}
        lastName={lastName}
        overall={overall}
        position={position}
        photo={photo}
        avatar={avatar}
        nbaTeam={nbaTeam}
        stats={[
          { label: 'MOY', value: avgPoints.toFixed(1) },
          { label: '3PT', value: Math.round(threePointRate) },
          { label: 'MID', value: Math.round(midRate) },
          { label: 'LF', value: Math.round(ftRate) },
          { label: 'VIC', value: victories },
          { label: 'SES', value: totalSessions },
        ]}
      />
    </div>
  );
}
