'use client';

import { SpotBar } from '@/components/stats/SpotBar';

interface SpotData {
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  rate: number;
  makes: number;
  attempts: number;
}

interface SpotPerformanceChartProps {
  data: SpotData[];
}

/**
 * Performance du joueur sur les dix spots.
 *
 * Un histogramme Recharts avec les libellés inclinés à 45° : illisible sur
 * téléphone, et il fallait survoler chaque barre pour connaître la valeur. Les
 * mêmes barres que les statistiques globales montrent le taux, le volume et
 * l'écart entre spots d'un seul regard.
 */
export function SpotPerformanceChart({ data }: SpotPerformanceChartProps) {
  return (
    <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6 mobile:p-4">
      <h3 className="text-lg mobile:text-base font-bold text-[#F5F1E8] mb-4 mobile:mb-3">
        Performance par spot
      </h3>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-[rgba(245,241,232,0.35)]">
          Aucun spot enregistré.
        </p>
      ) : (
        // Deux colonnes sur grand écran : dix barres pleine largeur s'étiraient
        // sur toute la page et rendaient la comparaison pénible.
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 mobile:grid-cols-1 mobile:gap-y-2">
          {data.map((spot) => (
            <SpotBar
              key={spot.spotNum}
              spotNum={spot.spotNum}
              spotLabel={spot.spotLabel}
              spotSub={spot.spotSub}
              rate={spot.rate}
              makes={spot.makes}
              attempts={spot.attempts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
