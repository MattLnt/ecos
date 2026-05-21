import type { ShotSpot, LFSpot, ThemeKey, CourtTheme } from './types';

export const COURT_W = 50;
export const COURT_H = 47;
export const RIM_X = 25;
export const RIM_Y = 5.25;
export const RIM_R = 0.75;
export const BACKBOARD_Y = 4;
export const BACKBOARD_W = 6;
export const PAINT_W = 16;
export const PAINT_LEFT = (COURT_W - PAINT_W) / 2;
export const PAINT_RIGHT = PAINT_LEFT + PAINT_W;
export const FT_Y = 19;
export const FT_CIRCLE_R = 6;
export const RA_R = 4;

export const CORNER3_INSET = 3;
export const THREE_LEFT_X  = CORNER3_INSET;
export const THREE_RIGHT_X = COURT_W - CORNER3_INSET;
export const THREE_RX = (COURT_W - 2 * CORNER3_INSET) / 2;
export const THREE_RY = RIM_Y + 23.75;

export const SHOT_SPOTS: ShotSpot[] = [
  { id: 'b-r',  num: 1,  label: '0° MID',       sub: 'DROITE', x: 38.5, y: 6.5,  zone: 'mid' },
  { id: 'c-r',  num: 2,  label: '0° 3PTS',      sub: 'DROITE', x: 48.2, y: 4.0,  zone: '3pt' },
  { id: 'el-r', num: 3,  label: '45° MID',      sub: 'DROITE', x: 36.5, y: 17.0, zone: 'mid' },
  { id: 'w-r',  num: 4,  label: '45° 3PTS',     sub: 'DROITE', x: 40.5, y: 24.5, zone: '3pt' },
  { id: 'ft',   num: 5,  label: 'FACE MID',     sub: '15 FT',  x: 23.5, y: 19.5, zone: 'mid' },
  { id: 'top',  num: 6,  label: 'FACE 3PTS',    sub: 'CENTRE', x: 25,   y: 30.4, zone: '3pt' },
  { id: 'el-l', num: 7,  label: '45° MID',      sub: 'GAUCHE', x: 13.5, y: 17.0, zone: 'mid' },
  { id: 'w-l',  num: 8,  label: '45° 3PTS',     sub: 'GAUCHE', x: 9.5,  y: 24.5, zone: '3pt' },
  { id: 'b-l',  num: 9,  label: '0° MID',       sub: 'GAUCHE', x: 11.5, y: 6.5,  zone: 'mid' },
  { id: 'c-l',  num: 10, label: '0° 3PTS',      sub: 'GAUCHE', x: 1.8,  y: 4.0,  zone: '3pt' },
];

export const LF_SPOT: LFSpot = {
  id: 'lf', num: 'LF', label: 'LANCER FRANC', sub: 'VALIDATION',
  x: 25, y: 19.5, zone: 'mid',
};

export const COURT_THEMES: Record<ThemeKey, CourtTheme> = {
  hardwood: {
    bg: '#150802',
    floor: '#C8975A',
    floorDark: '#A87646',
    plankStrong: 'rgba(0,0,0,0.18)',
    plankSoft: 'rgba(0,0,0,0.06)',
    grain: 'rgba(60,30,10,0.10)',
    paint: '#0A1628',
    paintAlpha: 0.92,
    paintAccent: '#00BFFF',        // Bleu ciel
    line: '#F8F0DC',
    lineWidth: 0.20,
    threeArcFill: 'rgba(10,22,40,0.10)',
    spotFill: '#00BFFF',           // Bleu ciel
    spotFillEmpty: 'rgba(10,22,40,0.92)',
    spotStroke: '#F8F0DC',
    spotText: '#0A1628',
    spotTextEmpty: '#F8F0DC',
    glow: false,
    centerLogoColor: 'rgba(248,240,220,0.10)',
    edgeShadow: true,
  },
  midnight: {
    bg: '#000000',
    floor: '#0A0A0F',
    floorDark: '#050507',
    plankStrong: 'rgba(201,169,97,0.03)',
    plankSoft: 'rgba(201,169,97,0.015)',
    grain: 'rgba(201,169,97,0.02)',
    paint: 'rgba(201,169,97,0.06)',
    paintAlpha: 1,
    paintAccent: '#00BFFF',
    line: '#C9A961',
    lineWidth: 0.18,
    threeArcFill: 'rgba(201,169,97,0.04)',
    spotFill: '#00BFFF',
    spotFillEmpty: 'rgba(10,22,40,0.85)',
    spotStroke: '#C9A961',
    spotText: '#000',
    spotTextEmpty: '#C9A961',
    glow: true,
    centerLogoColor: 'rgba(201,169,97,0.15)',
    edgeShadow: false,
  },
  blueprint: {
    bg: '#F4F1EA',
    floor: '#FBF9F3',
    floorDark: '#F2EFE6',
    plankStrong: 'transparent',
    plankSoft: 'transparent',
    grain: 'transparent',
    paint: 'rgba(10,22,40,0.05)',
    paintAlpha: 1,
    paintAccent: '#0A1628',
    line: '#0A1628',
    lineWidth: 0.13,
    threeArcFill: 'rgba(10,22,40,0.025)',
    spotFill: '#00BFFF',
    spotFillEmpty: '#FBF9F3',
    spotStroke: '#0A1628',
    spotText: '#FBF9F3',
    spotTextEmpty: '#0A1628',
    glow: false,
    centerLogoColor: 'rgba(10,22,40,0.06)',
    edgeShadow: false,
  },
};

export function zoneFromPosition(x: number, y: number): import('./types').Zone {
  const dist = Math.sqrt((x - RIM_X) ** 2 + (y - RIM_Y) ** 2);
  if (dist >= 23.75) return '3pt';
  if (x >= PAINT_LEFT && x <= PAINT_RIGHT && y <= FT_Y) return 'paint';
  return 'mid';
}