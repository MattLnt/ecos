'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PlayerCard } from './PlayerCard';

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  photo: string | null;
  avatar: string;
  nbaTeam: string | null;
  totalSessions: number;
  victories: number;
  avgPoints: number;
  bestScore: number;
  midRate: number;
  threePointRate: number;
  ftRate: number;
}

export function ProfileHeader({ 
  firstName, 
  lastName, 
  photo, 
  avatar,
  nbaTeam,
  totalSessions, 
  victories, 
  avgPoints, 
  bestScore,
  midRate,
  threePointRate,
  ftRate,
}: ProfileHeaderProps) {
  const router = useRouter();

  return (
    <>
      {/* Header avec retour */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-[rgba(0,191,255,0.08)] border border-[rgba(0,191,255,0.15)] rounded-xl flex items-center justify-center hover:bg-[rgba(0,191,255,0.15)] transition-all"
        >
          <ArrowLeft size={20} className="text-[#00BFFF]" />
        </button>
        <div>
          <h1 className="text-4xl font-extrabold text-[#F5F1E8] tracking-tight mobile:text-3xl">
            Profil joueur
          </h1>
          <p className="text-[rgba(245,241,232,0.55)] mt-1">Statistiques détaillées et performances</p>
        </div>
      </div>

      {/* Carte FIFA style */}
      <PlayerCard
        firstName={firstName}
        lastName={lastName}
        photo={photo}
        nbaTeam={nbaTeam}
        avgPoints={avgPoints}
        midRate={midRate}
        threePointRate={threePointRate}
        ftRate={ftRate}
        victories={victories}
        totalSessions={totalSessions}
      />

      {/* Stats supplémentaires */}
      <div className="grid grid-cols-4 gap-4 mt-6 mobile:grid-cols-2">
        <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-4 text-center">
          <div className="text-xs text-[rgba(245,241,232,0.55)] mb-1">Sessions</div>
          <div className="text-2xl font-bold text-[#00BFFF]">{totalSessions}</div>
        </div>
        <div className="bg-gradient-to-br from-[rgba(255,215,0,0.08)] to-[rgba(255,215,0,0.04)] border border-[rgba(255,215,0,0.15)] rounded-xl p-4 text-center">
          <div className="text-xs text-[rgba(245,241,232,0.55)] mb-1">Victoires</div>
          <div className="text-2xl font-bold text-[#FFD700]">{victories}</div>
        </div>
        <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-4 text-center">
          <div className="text-xs text-[rgba(245,241,232,0.55)] mb-1">Moyenne</div>
          <div className="text-2xl font-bold text-[#F5F1E8]">{avgPoints.toFixed(1)}</div>
        </div>
        <div className="bg-gradient-to-br from-[rgba(34,197,94,0.08)] to-[rgba(34,197,94,0.04)] border border-[rgba(34,197,94,0.15)] rounded-xl p-4 text-center">
          <div className="text-xs text-[rgba(245,241,232,0.55)] mb-1">Record</div>
          <div className="text-2xl font-bold text-green-400">{bestScore}</div>
        </div>
      </div>
    </>
  );
}