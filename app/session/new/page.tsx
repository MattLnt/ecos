'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Users, ChevronRight, Loader2, Shuffle, LayoutGrid } from 'lucide-react';
import { drawGroups, GROUP_LABELS, MAX_GROUPS, type DrawnPlayer } from '@/lib/groups';

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

/**
 * Nombre de groupes conseillé : 3 à 4 joueurs par panier.
 *
 * C'est la taille qui marche en vrai — en dessous on attend trop entre deux
 * tirs, au-dessus la rotation du groupe devient interminable.
 */
function suggestedGroupCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  return Math.min(MAX_GROUPS, Math.ceil(playerCount / 4));
}

/** Au moins deux joueurs par groupe, sinon le tirage n'a plus de sens. */
function maxGroupsFor(playerCount: number): number {
  return Math.max(1, Math.min(MAX_GROUPS, Math.floor(playerCount / 2)));
}

export default function NewSessionPage() {
  const router = useRouter();
  const [court, setCourt] = useState<Court | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Répartition : nombre de groupes et tirage au sort courant.
  const [groupCount, setGroupCount] = useState(1);
  const [draw, setDraw] = useState<DrawnPlayer[]>([]);
  /*
    Tant que le nombre de groupes n'a pas été choisi à la main, il suit la
    suggestion : cocher onze joueurs propose trois groupes tout seul. Dès que
    l'utilisateur tranche, on ne touche plus à son choix.
  */
  const groupCountTouched = useRef(false);

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

  /*
    Toute modification de la sélection ou du nombre de groupes relance le
    tirage : un tirage périmé, qui ne contiendrait pas le joueur qu'on vient
    de cocher, ne doit jamais rester affiché.
  */
  const applyDraw = (playerIds: string[], count: number) => {
    setDraw(playerIds.length > 0 ? drawGroups(playerIds, count) : []);
  };

  const togglePlayer = (playerId: string) => {
    const next = selectedPlayers.includes(playerId)
      ? selectedPlayers.filter((id) => id !== playerId)
      : [...selectedPlayers, playerId];

    const count = groupCountTouched.current
      ? Math.min(groupCount, maxGroupsFor(next.length))
      : suggestedGroupCount(next.length);

    setSelectedPlayers(next);
    setGroupCount(count);
    applyDraw(next, count);
  };

  const handleGroupCount = (count: number) => {
    groupCountTouched.current = true;
    setGroupCount(count);
    applyDraw(selectedPlayers, count);
  };

  const handleReroll = () => applyDraw(selectedPlayers, groupCount);

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
          // Le tirage porte le groupe et l'ordre de passage de chaque joueur.
          players: draw.length > 0 ? draw : drawGroups(selectedPlayers, groupCount),
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

  const playersById = new Map(players.map((p) => [p.id, p]));
  const maxGroups = maxGroupsFor(selectedPlayers.length);

  // Le tirage regroupé pour l'affichage, chaque groupe dans son ordre de passage.
  const drawnGroups = GROUP_LABELS.filter((label) => draw.some((d) => d.group === label)).map(
    (label) => ({
      label,
      members: draw
        .filter((d) => d.group === label)
        .sort((a, b) => a.shootOrder - b.shootOrder),
    })
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 pt-safe-t pb-[calc(8rem+env(safe-area-inset-bottom,0px))] sm:pb-8 px-3 sm:px-6">
      {/* Header */}
      <div className="text-center pt-3 sm:pt-6">
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

      {/* Répartition en groupes + tirage au sort */}
      {selectedPlayers.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <LayoutGrid size={20} className="text-[#00BFFF] sm:w-6 sm:h-6 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#F5F1E8] truncate">
                Répartition
              </h2>
            </div>
            <button
              onClick={handleReroll}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[rgba(0,191,255,0.1)] border border-[rgba(0,191,255,0.25)] rounded-lg text-[#00BFFF] text-xs sm:text-sm font-bold whitespace-nowrap hover:bg-[rgba(0,191,255,0.2)] active:scale-95 transition-all flex-shrink-0"
            >
              <Shuffle size={14} className="flex-shrink-0" />
              <span>Relancer</span>
            </button>
          </div>

          {/* Nombre de groupes */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {Array.from({ length: MAX_GROUPS }, (_, i) => i + 1).map((count) => {
              const disabled = count > maxGroups;
              const active = count === groupCount;
              return (
                <button
                  key={count}
                  onClick={() => handleGroupCount(count)}
                  disabled={disabled}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 border ${
                    active
                      ? 'bg-[#00BFFF] text-[#0A1628] border-[#00BFFF]'
                      : disabled
                      ? 'bg-[rgba(245,241,232,0.03)] text-[rgba(245,241,232,0.2)] border-transparent cursor-not-allowed'
                      : 'bg-[rgba(0,191,255,0.06)] text-[rgba(245,241,232,0.7)] border-[rgba(0,191,255,0.15)] hover:bg-[rgba(0,191,255,0.12)]'
                  }`}
                >
                  {count === 1 ? '1 groupe' : `${count} groupes`}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] sm:text-xs text-[rgba(245,241,232,0.45)] font-mono leading-relaxed">
            {groupCount === 1
              ? "Un seul panier : l’ordre de passage est tiré au sort."
              : `${groupCount} paniers en parallèle, un seul classement général. Groupes et ordre de passage tirés au sort.`}
          </p>

          {/* Groupes tirés */}
          <div className={`grid gap-3 sm:gap-4 ${
            drawnGroups.length === 1
              ? 'grid-cols-1'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {drawnGroups.map((group) => (
              <div
                key={group.label}
                className="rounded-xl bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] p-3 sm:p-4"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#00BFFF] text-[#0A1628] font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                      {group.label}
                    </div>
                    <span className="text-sm font-bold text-[#F5F1E8] truncate">
                      {drawnGroups.length === 1 ? 'Ordre de passage' : `Groupe ${group.label}`}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-wider flex-shrink-0">
                    {group.members.length} j.
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.members.map((member, index) => {
                    const player = playersById.get(member.playerId);
                    if (!player) return null;
                    return (
                      <div key={member.playerId} className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[rgba(245,241,232,0.35)] w-4 flex-shrink-0">
                          {index + 1}
                        </span>
                        {player.photo ? (
                          <img src={player.photo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-[#0A1628] flex-shrink-0"
                            style={{ backgroundColor: player.avatar }}
                          >
                            {player.firstName[0]}{player.lastName[0]}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-[#F5F1E8] truncate">
                          {player.firstName} {player.lastName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton démarrer - Fixed bottom sur mobile, sticky sur desktop */}
      <div className="fixed bottom-0 left-0 right-0 px-3 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#0A1628] via-[#0A1628] to-transparent sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:px-0 sm:pt-4 sm:pb-0 sm:bg-none sm:sticky sm:bottom-6 z-30">
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