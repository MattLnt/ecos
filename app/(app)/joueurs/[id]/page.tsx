'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProfileHeader } from '@/components/player-profile/ProfileHeader';
import { MainStats } from '@/components/player-profile/MainStats';
import { EvolutionChart } from '@/components/player-profile/EvolutionChart';
import { RadarPerformance } from '@/components/player-profile/RadarPerformance';
import { SpotPerformanceChart } from '@/components/player-profile/SpotPerformanceChart';
import { RecentSessions } from '@/components/player-profile/RecentSessions';

interface PlayerProfile {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  avatar: string;
  nbaTeam: string | null;
  totalSessions: number;
  totalPoints: number;
  avgPoints: number;
  bestScore: number;
  victories: number;
  midRate: number;
  threePointRate: number;
  ftRate: number;
  recentSessions: Array<{
    id: string;
    date: string;
    points: number;
    rank: number;
    totalPlayers: number;
  }>;
  evolution: Array<{
    date: string;
    points: number;
  }>;
  spotPerformance: Array<{
    spotNum: number;
    spotLabel: string;
    rate: number;
  }>;
  radarData: Array<{
    category: string;
    value: number;
  }>;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerProfile();
  }, [params.id]);

  const fetchPlayerProfile = async () => {
    try {
      const res = await fetch(`/api/joueurs/${params.id}/profile`);
      const data = await res.json();
      setPlayer(data);
    } catch (error) {
      console.error('Erreur fetch profil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-[rgba(245,241,232,0.55)] text-lg">Joueur introuvable</div>
        <Link
          href="/joueurs"
          className="px-5 py-2.5 bg-[#00BFFF] rounded-xl text-[#0A1628] font-bold hover:bg-[#00A8E8] transition-all"
        >
          Retour aux joueurs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileHeader
        firstName={player.firstName}
        lastName={player.lastName}
        photo={player.photo}
        avatar={player.avatar}
        nbaTeam={player.nbaTeam}
        totalSessions={player.totalSessions}
        victories={player.victories}
        avgPoints={player.avgPoints}
        bestScore={player.bestScore}
        midRate={player.midRate}
        threePointRate={player.threePointRate}
        ftRate={player.ftRate}
      />

      <MainStats
        midRate={player.midRate}
        threePointRate={player.threePointRate}
        ftRate={player.ftRate}
      />

      <div className="grid grid-cols-2 gap-6 mobile:grid-cols-1">
        <EvolutionChart data={player.evolution} />
        <RadarPerformance data={player.radarData} />
      </div>

      <SpotPerformanceChart data={player.spotPerformance} />

      <RecentSessions sessions={player.recentSessions} />
    </div>
  );
}