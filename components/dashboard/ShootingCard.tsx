'use client';

import { LucideIcon } from 'lucide-react';

interface ShootingCardProps {
  icon: LucideIcon;
  label: string;
  rate: number;
  color: string;
}

/**
 * L'adresse du club sur une catégorie de tir.
 *
 * Volontairement réduit au taux et à sa barre : le volume (« 1182/2480 ») ne
 * tenait pas à côté du pourcentage sur trois colonnes de téléphone, il
 * débordait, et il n'apprend rien ici — c'est le total du club, pas une
 * moyenne fragile qu'il faudrait relativiser. Il reste affiché là où il sert,
 * dans les statistiques détaillées et sur les fiches joueur.
 */
export function ShootingCard({ icon: Icon, label, rate, color }: ShootingCardProps) {
  return (
    <div
      className="min-w-0 rounded-2xl p-4 mobile:p-3 border"
      style={{
        background: `linear-gradient(135deg, ${color}17 0%, ${color}07 100%)`,
        borderColor: `${color}2e`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} className="shrink-0 mobile:w-3 mobile:h-3" style={{ color }} />
        <span className="min-w-0 text-[11px] mobile:text-[10px] font-bold uppercase tracking-wider text-[rgba(245,241,232,0.6)] truncate">
          {label}
        </span>
      </div>

      <div className="font-mono text-3xl mobile:text-xl font-extrabold leading-none" style={{ color }}>
        {rate.toFixed(1)}
        <span className="text-base mobile:text-xs opacity-60">%</span>
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
