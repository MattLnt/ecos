'use client';

import React, { useRef } from 'react';
import {
  COURT_W, COURT_H, RIM_X, RIM_Y, RIM_R, BACKBOARD_Y, BACKBOARD_W,
  PAINT_W, PAINT_LEFT, PAINT_RIGHT, FT_Y, FT_CIRCLE_R, RA_R,
  THREE_LEFT_X, THREE_RIGHT_X, THREE_RX, THREE_RY,
  COURT_THEMES,
} from './constants';
import type { AnySpot, CourtTheme, Mode, SpotScore, ThemeKey } from './types';

// ============================================================
//  Sub-components
// ============================================================

function HardwoodTexture({ theme }: { theme: CourtTheme }) {
  if (theme.plankStrong === 'transparent') return null;
  const planks: React.ReactNode[] = [];
  const plankWidth = 4.2;
  for (let x = 0; x < COURT_W; x += plankWidth) {
    planks.push(
      <line key={`pk-${x}`} x1={x} y1={0} x2={x} y2={COURT_H}
        stroke={theme.plankStrong} strokeWidth={0.06} />
    );
    if (Math.floor(x / plankWidth) % 2 === 1) {
      planks.push(
        <rect key={`pkb-${x}`} x={x} y={0} width={plankWidth} height={COURT_H} fill={theme.plankSoft} />
      );
    }
  }
  for (let y = 4; y < COURT_H; y += 6.5) {
    planks.push(
      <line key={`gr-${y}`} x1={0} y1={y} x2={COURT_W} y2={y + Math.sin(y) * 0.3}
        stroke={theme.grain} strokeWidth={0.04} strokeDasharray="2 3.5" />
    );
  }
  return <g>{planks}</g>;
}

function CourtLines({ theme }: { theme: CourtTheme }) {
  const sw = theme.lineWidth;
  const line = { stroke: theme.line, strokeWidth: sw, fill: 'none', strokeLinecap: 'square' as const };

  return (
    <g style={theme.glow ? { filter: 'drop-shadow(0 0 0.6px var(--accent)) drop-shadow(0 0 2px rgba(255,215,0,0.4))' } : {}}>
      <rect x={0} y={0} width={COURT_W} height={COURT_H} {...line} />
      <rect x={PAINT_LEFT} y={0} width={PAINT_W} height={FT_Y}
        fill={theme.paint} fillOpacity={theme.paintAlpha}
        stroke={theme.line} strokeWidth={sw} />
      <line x1={PAINT_LEFT} y1={FT_Y} x2={PAINT_RIGHT} y2={FT_Y} {...line} />
      <path d={`M ${PAINT_LEFT} ${FT_Y} A ${FT_CIRCLE_R} ${FT_CIRCLE_R} 0 0 0 ${PAINT_RIGHT} ${FT_Y}`} {...line} />
      <path d={`M ${PAINT_LEFT} ${FT_Y} A ${FT_CIRCLE_R} ${FT_CIRCLE_R} 0 0 1 ${PAINT_RIGHT} ${FT_Y}`}
        {...line} strokeDasharray={`${sw * 4} ${sw * 4}`} />
      <path d={`M ${RIM_X - RA_R} ${RIM_Y} A ${RA_R} ${RA_R} 0 0 0 ${RIM_X + RA_R} ${RIM_Y}`} {...line} />
      <line x1={RIM_X - RA_R} y1={RIM_Y} x2={RIM_X - RA_R} y2={BACKBOARD_Y} {...line} />
      <line x1={RIM_X + RA_R} y1={RIM_Y} x2={RIM_X + RA_R} y2={BACKBOARD_Y} {...line} />
      <path d={`M ${THREE_LEFT_X} 0 A ${THREE_RX} ${THREE_RY} 0 0 0 ${THREE_RIGHT_X} 0`} {...line} />
      <line x1={0} y1={COURT_H} x2={COURT_W} y2={COURT_H} {...line} strokeWidth={sw * 1.1} />
      <path d={`M ${RIM_X - 6} ${COURT_H} A 6 6 0 0 1 ${RIM_X + 6} ${COURT_H}`} {...line} />
      <path d={`M ${RIM_X - 2} ${COURT_H} A 2 2 0 0 1 ${RIM_X + 2} ${COURT_H}`} {...line} />
      {[7, 11, 14].map((y) => (
        <g key={`hash-${y}`}>
          <line x1={PAINT_LEFT - 0.5} y1={y} x2={PAINT_LEFT} y2={y} {...line} />
          <line x1={PAINT_RIGHT} y1={y} x2={PAINT_RIGHT + 0.5} y2={y} {...line} />
        </g>
      ))}
      <rect x={PAINT_LEFT - 0.5} y={7 - 0.4} width={0.5} height={0.8} fill={theme.line} />
      <rect x={PAINT_RIGHT} y={7 - 0.4} width={0.5} height={0.8} fill={theme.line} />
      <line x1={RIM_X - BACKBOARD_W / 2} y1={BACKBOARD_Y} x2={RIM_X + BACKBOARD_W / 2} y2={BACKBOARD_Y}
        stroke={theme.line} strokeWidth={sw * 1.6} strokeLinecap="square" />
      <circle cx={RIM_X} cy={RIM_Y} r={RIM_R} {...line} strokeWidth={sw * 0.9} />
      <circle cx={RIM_X} cy={RIM_Y} r={RIM_R * 0.55} fill={theme.line} fillOpacity={0.25} />
    </g>
  );
}

function CenterLogo({ theme, brand }: { theme: CourtTheme; brand: string }) {
  return (
    <g transform={`translate(${RIM_X}, ${COURT_H - 12}) scale(0.95)`} opacity={0.3}>
      <image 
        href="/jordan-logo.png"
        x={-5}
        y={-5}
        width={10}
        height={10}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

// ============================================================
//  Spot
// ============================================================

interface SpotProps {
  spot: AnySpot;
  score: SpotScore | null;
  theme: CourtTheme;
  isCurrent: boolean;
  isLF: boolean;
  showNumbers: boolean;
  showLabels: boolean;
}

function Spot({ spot, score, theme, isCurrent, isLF, showNumbers, showLabels }: SpotProps) {
  const makes = score?.makes;
  const ftMakes = score?.ftMakes;
  const points = score?.points ?? 0;
  const done = ftMakes != null;
  const inProgress = makes != null && ftMakes == null;
  const empty = !done && !inProgress;

  let fill: string;
  if (isLF || isCurrent) {
    fill = theme.spotFill;
  } else if (done) {
    if (points >= 12)      fill = '#5FB573';
    else if (points >= 6)  fill = theme.spotFill;
    else if (points > 0)   fill = '#C97A3A';
    else                   fill = theme.spotFillEmpty;
  } else {
    fill = theme.spotFillEmpty;
  }
  const textColor = (done || isCurrent || isLF) ? theme.spotText : theme.spotTextEmpty;

  const r = isLF ? 2.1 : 1.35;
  const fontSize = isLF ? 1.7 : 1.25;

  let centerText: string;
  if (isLF) centerText = 'LF';
  else if (done) centerText = String(points);
  else if (inProgress) centerText = String(makes);
  else centerText = showNumbers ? String(spot.num) : '';

  return (
    <g transform={`translate(${spot.x}, ${spot.y})`} data-spot-id={spot.id}>
      {(isCurrent || isLF) && (
        <circle r={r} fill="none" stroke={theme.spotFill}
          strokeWidth={isLF ? 0.4 : 0.25} className="pulse-ring" />
      )}
      <circle r={r} fill={fill} stroke={theme.spotStroke}
        strokeWidth={isLF ? 0.22 : 0.16}
        style={theme.glow
          ? { filter: 'drop-shadow(0 0 1.8px rgba(255,215,0,0.85))' }
          : { filter: 'drop-shadow(0 0.15px 0.4px rgba(0,0,0,0.45))' }}
      />
      {(isCurrent || isLF) && (
        <circle r={r + (isLF ? 0.7 : 0.55)} fill="none"
          stroke={theme.spotFill} strokeWidth={isLF ? 0.16 : 0.14} />
      )}
      <text y={fontSize * 0.36} textAnchor="middle" fill={textColor}
        fontFamily="JetBrains Mono, monospace" fontSize={fontSize}
        fontWeight={700} letterSpacing="-0.02em">
        {centerText}
      </text>
      {showLabels && empty && !isLF && (
        <text y={-1.85} textAnchor="middle" fill={theme.line}
          opacity={isCurrent ? 0.85 : 0.45}
          fontFamily="JetBrains Mono, monospace" fontSize={0.58}
          letterSpacing="0.1em" fontWeight={isCurrent ? 700 : 500}>
          {spot.label}
        </text>
      )}
    </g>
  );
}

// ============================================================
//  Court
// ============================================================

export interface CourtProps {
  spots: AnySpot[];
  theme: ThemeKey;
  mode: Mode;
  currentNum: number;
  renderStates: Record<string, SpotScore | null>;
  showLabels?: boolean;
  showSpotNumbers?: boolean;
  brand?: string;
}

export function Court({
  spots, theme: themeKey, mode, currentNum, renderStates,
  showLabels = true, showSpotNumbers = true, brand = 'ECOS EGUILLES',
}: CourtProps) {
  const theme = COURT_THEMES[themeKey] ?? COURT_THEMES.hardwood;
  const svgRef = useRef<SVGSVGElement>(null);

  const padX = 2.5;
  const padY = 2.5;
  const vbX = -padX;
  const vbY = -padY;
  const vbW = COURT_W + padX * 2;
  const vbH = COURT_H + padY * 2;

  return (
    <svg
      ref={svgRef}
      className="court-svg"
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ ['--accent' as string]: theme.spotFill }}
    >
      <defs>
        <radialGradient id="floorVignette" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={theme.floor} />
          <stop offset="100%" stopColor={theme.floorDark} />
        </radialGradient>
        <linearGradient id="edgeShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="80%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
        </linearGradient>
      </defs>

      <rect x={vbX} y={vbY} width={vbW} height={vbH} fill={theme.bg} />
      <rect x={0} y={0} width={COURT_W} height={COURT_H} fill="url(#floorVignette)" />

      <HardwoodTexture theme={theme} />

      {theme.edgeShadow && (
        <rect x={0} y={COURT_H - 2.5} width={COURT_W} height={2.5} fill="url(#edgeShade)" />
      )}

      <path
        d={`M ${THREE_LEFT_X} 0 A ${THREE_RX} ${THREE_RY} 0 0 0 ${THREE_RIGHT_X} 0 Z`}
        fill={theme.threeArcFill}
      />

      <CenterLogo theme={theme} brand={brand} />
      <CourtLines theme={theme} />

      <g>
        {spots.map((s) => {
          const isLF = s.id === 'lf';
          const isCurrent = !isLF && mode !== 'complete' && (s as { num: number }).num === currentNum;
          return (
            <Spot
              key={s.id}
              spot={s}
              score={renderStates[s.id] ?? null}
              theme={theme}
              isCurrent={isCurrent}
              isLF={isLF}
              showNumbers={showSpotNumbers}
              showLabels={showLabels}
            />
          );
        })}
      </g>
    </svg>
  );
}