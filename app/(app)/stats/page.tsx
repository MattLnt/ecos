'use client';

import { OverviewStats } from '@/components/stats/OverviewStats';
import { SpotPerformance } from '@/components/stats/SpotPerformance';
import { PlayerRanking } from '@/components/stats/PlayerRanking';
import { Records } from '@/components/stats/Records';
import { Trends } from '@/components/stats/Trends';

export default function StatsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-[#F5F1E8] tracking-tight mobile:text-3xl">
          Statistiques
        </h1>
        <p className="text-[rgba(245,241,232,0.55)] mt-2">
          Analyse complète de vos performances
        </p>
      </div>

      <OverviewStats />
      <SpotPerformance />
      <PlayerRanking />
      <Records />
      <Trends />
    </div>
  );
}