'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Users, ChevronRight, Loader2 } from 'lucide-react';

interface Court {
  id: string;
  name: string;
  spotsConfig: any;
  isDefault: boolean;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  photo?: string | null;
  avatar: string;
}

export default function NewSessionPage() {
  const router = useRouter();
  const [court, setCourt] = useState<Court | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resCourts = await fetch('/api/terrains');
      const courts: Court[] = await resCourts.json();
      const defaultCourt = courts.find(c => c.isDefault) || courts[0];
      
      if (!defaultCourt) {
        alert('Aucun terrain trouvé. Création automatique en cours...');
        const seedRes = await fetch('/api/seed');
        const seedData = await seedRes.json();
        if (seedData.court) {
          setCourt(seedData.court);
        } else {
          return;
        }
      } else {
        setCourt(defaultCourt);
      }

      const resPlayers = await fetch('/api/joueurs');
      const playersData = await resPlayers.json();
      setPlayers(playersData);
    } catch (error) {
      console.error('Erreur fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleCreateSession = async () => {
    if (selectedPlayers.length === 0) {
      alert('Sélectionnez au moins un joueur');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: court?.id,
          playerIds: selectedPlayers,
        }),
      });

      if (!res.ok) throw new Error('Erreur création session');

      const session = await res.json();
      router.push(`/session/${session.id}`);
    } catch (error) {
      console.error('Erreur création:', error);
      alert('Erreur lors de la création de la session');
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 pb-32 sm:pb-8 px-3 sm:px-0">
      {/* Header */}
      <div className="text-center pt-2 sm:pt-0">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#F5F1E8] tracking-tight mb-2 sm:mb-3">
          NOUVELLE SESSION
        </h1>
        <p className="text-[10px] sm:text-xs lg:text-sm text-[rgba(245,241,232,0.55)] font-mono uppercase tracking-widest">
          Configuration de la session de tir
        </p>
      </div>

      {/* Info terrain (compact) */}
      <div className="flex items-center gap-3 px-3 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[rgba(0,191,255,0.15)] flex items-center justify-center flex-shrink-0">
          <Target size={18} className="text-[#00BFFF] sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-[rgba(245,241,232,0.55)] uppercase tracking-wider font-mono">
            Terrain
          </p>
          <p className="text-sm sm:text-base font-bold text-[#F5F1E8] truncate">
            {court?.name}
          </p>
        </div>
      </div>

      {/* Sélection joueurs */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Users size={20} className="text-[#00BFFF] sm:w-6 sm:h-6 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F5F1E8] truncate">
              Sélectionnez les joueurs
            </h2>
          </div>
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[rgba(0,191,255,0.1)] border border-[rgba(0,191,255,0.2)] rounded-lg flex-shrink-0">
            <span className="text-xs sm:text-sm font-bold text-[#00BFFF] whitespace-nowrap">
              {selectedPlayers.length} sélec.
            </span>
          </div>
        </div>

        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl text-center">
            <span className="text-5xl sm:text-6xl mb-4 opacity-50">🏀</span>
            <p className="text-[rgba(245,241,232,0.55)] text-base sm:text-lg mb-4">
              Aucun joueur enregistré
            </p>
            <button
              onClick={() => router.push('/joueurs')}
              className="px-5 py-2.5 bg-[#00BFFF] text-[#0A1628] rounded-xl font-bold hover:bg-[#00A8E8] active:scale-95 transition-all"
            >
              Créer un joueur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {players.map((player) => {
              const isSelected = selectedPlayers.includes(player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all text-left active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[rgba(0,191,255,0.12)] border-[#00BFFF] shadow-lg shadow-[rgba(0,191,255,0.2)]'
                      : 'bg-[rgba(0,191,255,0.04)] border-[rgba(0,191,255,0.15)] hover:border-[rgba(0,191,255,0.3)] hover:bg-[rgba(0,191,255,0.08)]'
                  }`}
                >
                  {/* Checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#00BFFF] flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pr-8">
                    {/* Avatar */}
                    {player.photo ? (
                      <img
                        src={player.photo}
                        alt={`${player.firstName} ${player.lastName}`}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-[#0A1628] font-bold text-base sm:text-lg flex-shrink-0"
                        style={{ backgroundColor: player.avatar }}
                      >
                        {player.firstName[0]}
                        {player.lastName[0]}
                      </div>
                    )}

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#F5F1E8] truncate text-sm sm:text-base">
                        {player.firstName} {player.lastName}
                      </p>
                      {player.nickname && (
                        <p className="text-xs text-[rgba(245,241,232,0.55)] italic truncate">
                          &quot;{player.nickname}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bouton démarrer - Fixed bottom sur mobile, sticky sur desktop */}
      <div className="fixed bottom-0 left-0 right-0 px-3 pb-4 pt-4 bg-gradient-to-t from-[#0A1628] via-[#0A1628] to-transparent sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:px-0 sm:pt-4 sm:bg-none sm:sticky sm:bottom-6 z-30">
        <button
          onClick={handleCreateSession}
          disabled={selectedPlayers.length === 0 || creating}
          className="w-full px-6 py-4 sm:py-4 bg-gradient-to-r from-[#00BFFF] to-[#00A8E8] text-[#0A1628] rounded-xl font-extrabold text-base sm:text-lg hover:shadow-2xl hover:shadow-[rgba(0,191,255,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 max-w-5xl mx-auto"
        >
          {creating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <span>Démarrer la session</span>
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}