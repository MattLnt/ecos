'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SpotStat {
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  successRate: number;
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
      <div className="h-64 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  const bestSpot = spots.reduce((best, spot) => spot.successRate > best.successRate ? spot : best, spots[0]);
  const worstSpot = spots.reduce((worst, spot) => spot.successRate < worst.successRate ? spot : worst, spots[0]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#F5F1E8]">Performances par spot</h2>

      {/* Best & Worst */}
      <div className="grid grid-cols-2 gap-5 mobile:grid-cols-1">
        <div className="bg-gradient-to-br from-[rgba(34,197,94,0.08)] to-[rgba(34,197,94,0.02)] border border-[rgba(34,197,94,0.2)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[rgba(34,197,94,0.15)] rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-green-400" />
            </div>
            <div>
              <div className="text-sm text-[rgba(245,241,232,0.55)]">Meilleur spot</div>
              <div className="font-bold text-[#F5F1E8]">{bestSpot?.spotLabel}</div>
            </div>
          </div>
          <div className="font-mono text-4xl font-extrabold text-green-400">
            {bestSpot?.successRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-[rgba(239,68,68,0.08)] to-[rgba(239,68,68,0.02)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[rgba(239,68,68,0.15)] rounded-xl flex items-center justify-center">
              <TrendingDown size={24} className="text-red-400" />
            </div>
            <div>
              <div className="text-sm text-[rgba(245,241,232,0.55)]">À améliorer</div>
              <div className="font-bold text-[#F5F1E8]">{worstSpot?.spotLabel}</div>
            </div>
          </div>
          <div className="font-mono text-4xl font-extrabold text-red-400">
            {worstSpot?.successRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Heatmap des 10 spots - SIMPLIFIÉ */}
      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-[#F5F1E8] mb-4">Taux de réussite par spot</h3>
        <div className="grid grid-cols-5 gap-3 mobile:grid-cols-2">
          {spots.map((spot) => (
            <div
              key={spot.spotNum}
              className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-4 hover:bg-[rgba(0,191,255,0.08)] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-[rgba(0,191,255,0.15)] rounded-lg flex items-center justify-center">
                  <span className="font-bold text-sm text-[#00BFFF]">{spot.spotNum}</span>
                </div>
                <div className={`text-xl font-bold ${
                  spot.successRate >= 60 ? 'text-green-400' :
                  spot.successRate >= 40 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {spot.successRate.toFixed(0)}%
                </div>
              </div>
              <div className="text-xs text-[rgba(245,241,232,0.7)] font-semibold">
                {spot.spotLabel}
              </div>
              <div className="text-[10px] text-[rgba(245,241,232,0.35)] mt-1">
                {spot.spotSub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}