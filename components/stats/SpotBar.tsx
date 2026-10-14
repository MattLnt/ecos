'use client';

/**
 * Une ligne « spot + barre de remplissage ».
 *
 * Dix tuiles sur deux colonnes donnent de petits pavés difficiles à comparer :
 * une liste de barres se lit d'un coup d'œil et laisse la place au nom complet
 * du spot. Partagé par les stats globales et les stats par date, pour que les
 * deux vues se lisent de la même façon.
 */

/** Vert au-dessus de 60 %, jaune au-dessus de 40 %, rouge en dessous. */
export function rateColor(rate: number) {
  if (rate >= 60) return '#22C55E';
  if (rate >= 40) return '#FACC15';
  return '#F87171';
}

interface SpotBarProps {
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  rate: number;
  /** Volume, affiché à droite du taux quand il est connu : « 56/120 ». */
  makes?: number;
  attempts?: number;
}

export function SpotBar({ spotNum, spotLabel, spotSub, rate, makes, attempts }: SpotBarProps) {
  const color = rateColor(rate);

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-6 h-6 shrink-0 bg-[rgba(0,191,255,0.12)] rounded-md flex items-center justify-center font-mono text-[11px] font-bold text-[#00BFFF]">
        {spotNum}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-semibold text-[rgba(245,241,232,0.8)] truncate">
            {spotLabel}
            <span className="text-[rgba(245,241,232,0.35)] font-normal"> {spotSub}</span>
          </span>
          <span className="flex items-baseline gap-1.5 shrink-0">
            {attempts !== undefined && (
              <span className="font-mono text-[10px] text-[rgba(245,241,232,0.35)]">
                {makes}/{attempts}
              </span>
            )}
            <span className="font-mono text-sm font-extrabold" style={{ color }}>
              {rate.toFixed(0)}%
            </span>
          </span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-[rgba(245,241,232,0.07)] overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, rate))}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    </div>
  );
}
