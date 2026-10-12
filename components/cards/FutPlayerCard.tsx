'use client';

import React from 'react';
import styles from './FutPlayerCard.module.css';
import { NBA_LOGOS, teamColor } from './nbaTeams';

export interface FutStat {
  label: string;
  value: string | number;
}

interface FutPlayerCardProps {
  firstName: string;
  lastName: string;
  /** Note globale, à la place du classique « OVR ». */
  overall: number;
  position?: string | null;
  photo?: string | null;
  /** Couleur du joueur, utilisée pour le halo quand il n'a pas de photo. */
  avatar: string;
  nbaTeam?: string | null;
  /** Exactement six stats : trois colonnes, deux lignes. */
  stats: FutStat[];
  className?: string;
}

export function FutPlayerCard({
  firstName,
  lastName,
  overall,
  position,
  photo,
  avatar,
  nbaTeam,
  stats,
  className,
}: FutPlayerCardProps) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const logo = nbaTeam ? NBA_LOGOS[nbaTeam] : undefined;

  return (
    <div
      className={className ? `${styles.wrap} ${className}` : styles.wrap}
      style={{ '--team-color': teamColor(nbaTeam) } as React.CSSProperties}
    >
      <div className={styles.card}>
        {/* Calque doré au contour extérieur ; tout le reste vit dans le corps,
            découpé 4px plus à l'intérieur, pour ne jamais masquer le liseré. */}
        <div className={styles.frame} />

        <div className={styles.body}>
          <div className={styles.teamAura} />
          <div className={styles.portraitHalo} />

          <div className={styles.portraitWrap}>
            {photo ? (
              <img src={photo} alt={`${firstName} ${lastName}`} className={styles.portrait} />
            ) : (
              <div
                className={styles.portraitFallback}
                style={{ '--avatar': avatar } as React.CSSProperties}
              >
                {initials}
              </div>
            )}
          </div>

          <div className={styles.veil} />

          <div className={styles.identity}>
            <div className={styles.overall}>{overall}</div>
            <div className={styles.position}>{position || 'SF'}</div>
            <div className={styles.identityRule} />
            {logo && (
              <div className={styles.teamLogoWrap}>
                <div className={styles.teamGlow} />
                <img src={logo} alt={nbaTeam ?? ''} className={styles.teamLogo} />
              </div>
            )}
          </div>

          <div className={styles.name}>{lastName.toUpperCase()}</div>
          <div className={styles.divider} />
          <div className={styles.dividerGem} />

          <div className={styles.stats}>
            {stats.slice(0, 6).map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.sheen} />
        </div>
      </div>
    </div>
  );
}
