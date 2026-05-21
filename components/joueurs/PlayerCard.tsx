'use client';

import styles from './PlayerCard.module.css';
import React from 'react';

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

const NBA_LOGOS: Record<string, string> = {
  ATL: 'https://cdn.nba.com/logos/nba/1610612737/global/L/logo.svg',
  BOS: 'https://cdn.nba.com/logos/nba/1610612738/global/L/logo.svg',
  BKN: 'https://cdn.nba.com/logos/nba/1610612751/global/L/logo.svg',
  CHO: 'https://cdn.nba.com/logos/nba/1610612766/global/L/logo.svg',
  CHI: 'https://cdn.nba.com/logos/nba/1610612741/global/L/logo.svg',
  CLE: 'https://cdn.nba.com/logos/nba/1610612739/global/L/logo.svg',
  DAL: 'https://cdn.nba.com/logos/nba/1610612742/global/L/logo.svg',
  DEN: 'https://cdn.nba.com/logos/nba/1610612743/global/L/logo.svg',
  DET: 'https://cdn.nba.com/logos/nba/1610612765/global/L/logo.svg',
  GSW: 'https://cdn.nba.com/logos/nba/1610612744/global/L/logo.svg',
  HOU: 'https://cdn.nba.com/logos/nba/1610612745/global/L/logo.svg',
  IND: 'https://cdn.nba.com/logos/nba/1610612754/global/L/logo.svg',
  LAC: 'https://cdn.nba.com/logos/nba/1610612746/global/L/logo.svg',
  LAL: 'https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg',
  MEM: 'https://cdn.nba.com/logos/nba/1610612763/global/L/logo.svg',
  MIA: 'https://cdn.nba.com/logos/nba/1610612748/global/L/logo.svg',
  MIL: 'https://cdn.nba.com/logos/nba/1610612749/global/L/logo.svg',
  MIN: 'https://cdn.nba.com/logos/nba/1610612750/global/L/logo.svg',
  NOP: 'https://cdn.nba.com/logos/nba/1610612740/global/L/logo.svg',
  NYK: 'https://cdn.nba.com/logos/nba/1610612752/global/L/logo.svg',
  OKC: 'https://cdn.nba.com/logos/nba/1610612760/global/L/logo.svg',
  ORL: 'https://cdn.nba.com/logos/nba/1610612753/global/L/logo.svg',
  PHI: 'https://cdn.nba.com/logos/nba/1610612755/global/L/logo.svg',
  PHX: 'https://cdn.nba.com/logos/nba/1610612756/global/L/logo.svg',
  POR: 'https://cdn.nba.com/logos/nba/1610612757/global/L/logo.svg',
  SAC: 'https://cdn.nba.com/logos/nba/1610612758/global/L/logo.svg',
  SAS: 'https://cdn.nba.com/logos/nba/1610612759/global/L/logo.svg',
  TOR: 'https://cdn.nba.com/logos/nba/1610612761/global/L/logo.svg',
  UTA: 'https://cdn.nba.com/logos/nba/1610612762/global/L/logo.svg',
  WAS: 'https://cdn.nba.com/logos/nba/1610612764/global/L/logo.svg',
};

const NBA_TEAM_COLORS: Record<string, string> = {
  ATL: '#E03A3E',
  BOS: '#007A33',
  BKN: '#FFFFFF',
  CHO: '#1D1160',
  CHI: '#CE1141',
  CLE: '#860038',
  DAL: '#00538C',
  DEN: '#0E2240',
  DET: '#C8102E',
  GSW: '#1D428A',
  HOU: '#CE1141',
  IND: '#FDBB30',
  LAC: '#C8102E',
  LAL: '#FDB927',
  MEM: '#5D76A9',
  MIA: '#98002E',
  MIL: '#00471B',
  MIN: '#0C2340',
  NOP: '#0C2340',
  NYK: '#F58426',
  OKC: '#007AC1',
  ORL: '#0077C0',
  PHI: '#006BB6',
  PHX: '#E56020',
  POR: '#E03A3E',
  SAC: '#5A2D81',
  SAS: '#C4CED4',
  TOR: '#CE1141',
  UTA: '#002B5C',
  WAS: '#002B5C',
};

export function PlayerCard({
  firstName,
  lastName,
  position,
  photo,
  avatar,
  nbaTeam,
  stats,
}: PlayerCardProps) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  const teamColor = nbaTeam ? NBA_TEAM_COLORS[nbaTeam] || '#00BFFF' : '#00BFFF';

  return (
    <div className={styles.card}>
      {/* Frame gold avec décorations */}
      <div className={styles.cardFrame}>
        {/* Shards décoratifs en haut à droite */}
        <div className={styles.shards}>
          <div className={styles.shard1}></div>
          <div className={styles.shard2}></div>
          <div className={styles.shard3}></div>
          <div className={styles.shard4}></div>
        </div>

        {/* Corner marks gold */}
        <div className={`${styles.cornerMark} ${styles.cornerTopLeft}`}></div>
        <div className={`${styles.cornerMark} ${styles.cornerTopRight}`}></div>
        <div className={`${styles.cornerMark} ${styles.cornerBottomLeft}`}></div>
        <div className={`${styles.cornerMark} ${styles.cornerBottomRight}`}></div>

        {/* Position en haut à gauche */}
        <div className={styles.position}>
          {position || 'SF'}
        </div>

        {/* Logo équipe NBA avec effet glow */}
        {nbaTeam && (
          <div 
            className={styles.teamLogoContainer}
            style={{ '--team-color': teamColor } as React.CSSProperties}
          >
            <div className={styles.teamGlow}></div>
            <div className={styles.teamGlowPulse}></div>
            <img 
              src={NBA_LOGOS[nbaTeam]} 
              alt={nbaTeam} 
              className={styles.teamLogo}
            />
          </div>
        )}

        {/* Halo derrière le portrait */}
        <div className={styles.portraitHalo}></div>

        {/* Photo joueur ou initiales */}
        <div className={styles.portraitContainer}>
          {photo ? (
            <img 
              src={photo} 
              alt={`${firstName} ${lastName}`}
              className={styles.portrait}
            />
          ) : (
            <div 
              className={styles.portraitFallback}
              style={{ backgroundColor: avatar }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Voile dégradé sur le portrait */}
        <div className={styles.veil}></div>

        {/* Nom du joueur */}
        <div className={styles.name}>
          {lastName.toUpperCase()}
        </div>

        {/* Ligne dorée séparatrice */}
        <div className={styles.divider}></div>

        {/* Grille de stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.pts}</span>
            <span className={styles.statLabel}>PTS</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.threePct}</span>
            <span className={styles.statLabel}>3PT %</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.sessions}</span>
            <span className={styles.statLabel}>SES</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.midPct}</span>
            <span className={styles.statLabel}>MID %</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.victories}</span>
            <span className={styles.statLabel}>VIC</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.ftPct}</span>
            <span className={styles.statLabel}>LF %</span>
          </div>
        </div>

        {/* Sheen effect (lueur qui passe) */}
        <div className={styles.sheen}></div>
      </div>
    </div>
  );
}