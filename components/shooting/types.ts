// Types for the shooting session feature.

export type Zone = '3pt' | 'mid' | 'paint';

export interface ShotSpot {
  /** Stable identifier (matches DB row when persisted). */
  id: string;
  /** Display number 1..10. */
  num: number;
  /** Bold label shown above the dot, e.g. "WING 3". */
  label: string;
  /** Sub-label, e.g. "DROITE". */
  sub: string;
  /** Court coordinates in feet (origin = top-left of half-court). */
  x: number;
  y: number;
  zone: Zone;
}

/**
 * The special "Lancer Franc" spot that appears only during the 2-FT validation
 * phase between numbered spots. It's never persisted — only used for rendering.
 */
export interface LFSpot {
  id: 'lf';
  num: 'LF';
  label: string;
  sub: string;
  x: number;
  y: number;
  zone: Zone;
}

export type AnySpot = ShotSpot | LFSpot;

export interface SpotScore {
  /** Number of made shots out of 10 (null = not yet scored). */
  makes: number | null;
  /** Number of made free throws out of 2 (null = not yet validated). */
  ftMakes: number | null;
  /** Computed points = makes × ftMakes. */
  points: number;
}

/**
 *  shooting    → 0..10 number buttons in the action bar, all 10 spots on court
 *  validating  → 0/2, 1/2, 2/2 buttons, only LF spot on court
 *  complete    → session finished, totals + "new session" button
 */
export type Mode = 'shooting' | 'validating' | 'complete';

export type ThemeKey = 'hardwood' | 'midnight' | 'blueprint';

export interface CourtTheme {
  bg: string;
  floor: string;
  floorDark: string;
  plankStrong: string;
  plankSoft: string;
  grain: string;
  paint: string;
  paintAlpha: number;
  paintAccent: string;
  line: string;
  lineWidth: number;
  threeArcFill: string;
  spotFill: string;
  spotFillEmpty: string;
  spotStroke: string;
  spotText: string;
  spotTextEmpty: string;
  glow: boolean;
  centerLogoColor: string;
  edgeShadow: boolean;
}

/** Shape suitable for persisting a finished session to your DB. */
export interface SessionResult {
  playerId: string;
  startedAt: string; // ISO timestamp
  endedAt: string;
  totalPoints: number;
  spots: Array<{
    num: number;
    label: string;
    sub: string;
    makes: number;
    ftMakes: number;
    points: number;
  }>;
}
