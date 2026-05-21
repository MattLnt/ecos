'use client';

import { Target } from 'lucide-react';

interface MainStatsProps {
  midRate: number;
  threePointRate: number;
  ftRate: number;
}

export function MainStats({ midRate, threePointRate, ftRate }: MainStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-5 mobile:grid-cols-1">
      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
        <div className="w-12 h-12 bg-[rgba(0,191,255,0.15)] rounded-xl flex items-center justify-center mb-4">
          <Target size={24} className="text-[#00BFFF]" />
        </div>
        <div className="font-mono text-3xl font-extrabold text-[#00BFFF] mb-1">
          {midRate.toFixed(1)}%
        </div>
        <div className="text-sm text-[rgba(245,241,232,0.55)]">Mid-Range</div>
      </div>

      <div className="bg-gradient-to-br from-[rgba(255,215,0,0.08)] to-[rgba(255,215,0,0.04)] border border-[rgba(255,215,0,0.15)] rounded-2xl p-6">
        <div className="w-12 h-12 bg-[rgba(255,215,0,0.15)] rounded-xl flex items-center justify-center mb-4">
          <Target size={24} className="text-[#FFD700]" />
        </div>
        <div className="font-mono text-3xl font-extrabold text-[#FFD700] mb-1">
          {threePointRate.toFixed(1)}%
        </div>
        <div className="text-sm text-[rgba(245,241,232,0.55)]">3 Points</div>
      </div>

      <div className="bg-gradient-to-br from-[rgba(34,197,94,0.08)] to-[rgba(34,197,94,0.04)] border border-[rgba(34,197,94,0.15)] rounded-2xl p-6">
        <div className="w-12 h-12 bg-[rgba(34,197,94,0.15)] rounded-xl flex items-center justify-center mb-4">
          <Target size={24} className="text-green-400" />
        </div>
        <div className="font-mono text-3xl font-extrabold text-green-400 mb-1">
          {ftRate.toFixed(1)}%
        </div>
        <div className="text-sm text-[rgba(245,241,232,0.55)]">Lancers Francs</div>
      </div>
    </div>
  );
}