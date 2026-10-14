'use client';

import { LucideIcon } from 'lucide-react';

interface ShootingCardProps {
  icon: LucideIcon;
  label: string;
  rate: number;
  makes: number;
  attempts: number;
  color: string;
  /** Unité du volume : « tirs » ou « LF ». */
  unit: string;
}

/**
 * L'adresse du club sur une catégorie de tir.
 *
 * Le taux, son volume, et une barre remplie à hauteur du taux : la même
 * lecture que dans les statistiques, pour que les deux écrans se comprennent
 * sans réapprentissage.
 */
export function ShootingCard({ icon: Icon, label, rate, makes, attempts, color, unit }: ShootingCardProps) {
  return (
    <div
      className="rounded-2xl p-5 mobile:p-3.5 border"
      style={{
        background: `linear-gradient(135deg, ${color}17 0%, ${color}07 100%)`,
        borderColor: `${color}2e`,
      }}
    >
      <div className="flex items-center gap-2 mb-3 mobile:mb-2">
        <Icon size={16} className="shrink-0 mobile:w-3.5 mobile:h-3.5" style={{ color }} />
        <span className="text-xs mobile:text-[11px] font-bold uppercase tracking-wider text-[rgba(245,241,232,0.6)] truncate">
          {label}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-3xl mobile:text-2xl font-extrabold leading-none" style={{ color }}>
          {rate.toFixed(1)}
          <span className="text-base mobile:text-sm opacity-60">%</span>
        </span>
        <span className="font-mono text-[11px] mobile:text-[10px] text-[rgba(245,241,232,0.35)] shrink-0">
          {makes}/{attempts} {unit}
        </span>
      </div>

      <div className="mt-3 mobile:mt-2 h-2 mobile:h-1.5 rounded-full bg-[rgba(245,241,232,0.07)] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${Math.min(100, Math.max(0, rate))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
