'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SpotStat {
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  fullLabel?: string;
  successRate: number;
}

/** Vert au-dessus de 60 %, jaune au-dessus de 40 %, rouge en dessous. */
function rateColor(rate: number) {
  if (rate >= 60) return '#22C55E';
  if (rate >= 40) return '#FACC15';
  return '#F87171';
}

export function SpotPerformance() {
  const [spots, setSpots] = useState<SpotStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const res = await fetch('/api/stats/spots');
      const data = await res.json();
      setSpots(data);
    } catch (error) {
      console.error('Erreur fetch spots:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl mobile:text-lg font-bold text-[#F5F1E8]">Performances par spot</h2>
        <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-10 text-center">
          <p className="text-[rgba(245,241,232,0.55)]">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const getFullLabel = (spot: SpotStat) =>
    spot.fullLabel || `${spot.spotLabel} ${spot.spotSub}`.trim();

  const bestSpot = spots.reduce((best, s) => (s.successRate > best.successRate ? s : best), spots[0]);
  const worstSpot = spots.reduce((worst, s) => (s.successRate < worst.successRate ? s : worst), spots[0]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl mobile:text-lg font-bold text-[#F5F1E8]">Performances par spot</h2>

      {/* Meilleur / à améliorer */}
      <div className="grid grid-cols-2 gap-4 mobile:gap-2.5">
        <div className="bg-gradient-to-br from-[rgba(34,197,94,0.1)] to-[rgba(34,197,94,0.02)] border border-[rgba(34,197,94,0.2)] rounded-2xl p-5 mobile:rounded-xl mobile:p-3">
          <div className="flex items-center gap-2 mb-3 mobile:mb-2">
            <TrendingUp size={18} className="text-green-400 shrink-0 mobile:w-4 mobile:h-4" />
            <span className="text-sm mobile:text-[11px] text-[rgba(245,241,232,0.55)] mobile:uppercase mobile:tracking-wider">
              Meilleur spot
            </span>
          </div>
          <div className="font-mono text-4xl mobile:text-2xl font-extrabold text-green-400 leading-none">
            {bestSpot?.successRate.toFixed(1)}%
          </div>
          <div className="font-bold text-sm mobile:text-xs text-[#F5F1E8] mt-2 mobile:mt-1.5 leading-tight">
            {bestSpot ? getFullLabel(bestSpot) : '—'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[rgba(239,68,68,0.1)] to-[rgba(239,68,68,0.02)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-5 mobile:rounded-xl mobile:p-3">
          <div className="flex items-center gap-2 mb-3 mobile:mb-2">
            <TrendingDown size={18} className="text-red-400 shrink-0 mobile:w-4 mobile:h-4" />
            <span className="text-sm mobile:text-[11px] text-[rgba(245,241,232,0.55)] mobile:uppercase mobile:tracking-wider">
              À améliorer
            </span>
          </div>
          <div className="font-mono text-4xl mobile:text-2xl font-extrabold text-red-400 leading-none">
            {worstSpot?.successRate.toFixed(1)}%
          </div>
          <div className="font-bold text-sm mobile:text-xs text-[#F5F1E8] mt-2 mobile:mt-1.5 leading-tight">
            {worstSpot ? getFullLabel(worstSpot) : '—'}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-5 mobile:rounded-xl mobile:p-3">
        <h3 className="text-lg mobile:text-sm font-bold text-[#F5F1E8] mb-4 mobile:mb-3">
          Taux de réussite par spot
        </h3>

        {/* Desktop : dix tuiles sur une grille */}
        <div className="grid mobile:hidden grid-cols-5 gap-3">
          {spots.map((spot) => (
            <div
              key={spot.spotNum}
              className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-4 hover:bg-[rgba(0,191,255,0.08)] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-[rgba(0,191,255,0.15)] rounded-lg flex items-center justify-center">
                  <span className="font-bold text-sm text-[#00BFFF]">{spot.spotNum}</span>
                </div>
                <div className="text-xl font-bold" style={{ color: rateColor(spot.successRate) }}>
                  {spot.successRate.toFixed(0)}%
                </div>
              </div>
              <div className="text-xs text-[rgba(245,241,232,0.7)] font-semibold">{spot.spotLabel}</div>
              <div className="text-[10px] text-[rgba(245,241,232,0.35)] mt-1 uppercase tracking-wide">
                {spot.spotSub}
              </div>
            </div>
          ))}
        </div>

        {/*
          Mobile : dix tuiles sur deux colonnes donnaient de tout petits pavés
          difficiles à comparer. Une liste de barres se lit d'un coup d'œil et
          laisse la place au nom complet du spot.
        */}
        <div className="hidden mobile:block space-y-2">
          {spots.map((spot) => (
            <div key={spot.spotNum} className="flex items-center gap-2.5">
              <div className="w-6 h-6 shrink-0 bg-[rgba(0,191,255,0.12)] rounded-md flex items-center justify-center font-mono text-[11px] font-bold text-[#00BFFF]">
                {spot.spotNum}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[rgba(245,241,232,0.8)] truncate">
                    {spot.spotLabel}
                    <span className="text-[rgba(245,241,232,0.35)] font-normal"> {spot.spotSub}</span>
                  </span>
                  <span
                    className="font-mono text-sm font-extrabold shrink-0"
                    style={{ color: rateColor(spot.successRate) }}
                  >
                    {spot.successRate.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[rgba(245,241,232,0.07)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, spot.successRate))}%`,
                      backgroundColor: rateColor(spot.successRate),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
