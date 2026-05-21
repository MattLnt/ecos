'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Grid3x3, List } from 'lucide-react';
import PlayerModal from './PlayerModal';
import { PlayerCard } from '@/components/joueurs/PlayerCard';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  number?: number | null;
  position?: string | null;
  photo?: string | null;
  avatar: string;
  nbaTeam?: string | null;
}

interface PlayerWithStats extends Player {
  stats: {
    pts: number;
    threePct: number;
    sessions: number;
    midPct: number;
    victories: number;
    ftPct: number;
  };
}

export default function JoueursPage() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const fetchPlayers = async () => {
    try {
      const resPlayers = await fetch('/api/joueurs');
      const playersData = await resPlayers.json();

      const playersWithStats = await Promise.all(
        playersData.map(async (player: Player) => {
          try {
            const resStats = await fetch(`/api/joueurs/${player.id}/stats`);
            const stats = await resStats.json();
            return { ...player, stats };
          } catch (error) {
            console.error(`Erreur stats joueur ${player.id}:`, error);
            return {
              ...player,
              stats: { pts: 0, threePct: 0, sessions: 0, midPct: 0, victories: 0, ftPct: 0 },
            };
          }
        })
      );

      setPlayers(playersWithStats);
    } catch (error) {
      console.error('Erreur fetch joueurs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Supprimer ce joueur ?')) return;
    try {
      await fetch(`/api/joueurs/${id}`, { method: 'DELETE' });
      fetchPlayers();
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleEdit = (player: Player, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPlayer(player);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingPlayer(null);
    fetchPlayers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[rgba(245,241,232,0.55)] font-mono text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F1E8] tracking-tight">
            Joueurs
          </h1>
          <p className="text-xs sm:text-sm text-[rgba(245,241,232,0.55)] mt-1 sm:mt-2">
            {players.length} joueur{players.length > 1 ? 's' : ''} enregistré{players.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Toggle view mode */}
          <div className="flex items-center gap-1 sm:gap-2 bg-[rgba(0,191,255,0.08)] border border-[rgba(0,191,255,0.15)] rounded-xl p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 ${
                viewMode === 'cards'
                  ? 'bg-[#00BFFF] text-[#0A1628]'
                  : 'text-[rgba(245,241,232,0.7)] hover:text-[#00BFFF]'
              }`}
            >
              <Grid3x3 size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Cartes</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 ${
                viewMode === 'list'
                  ? 'bg-[#00BFFF] text-[#0A1628]'
                  : 'text-[rgba(245,241,232,0.7)] hover:text-[#00BFFF]'
              }`}
            >
              <List size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Liste</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingPlayer(null);
              setModalOpen(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-[#00BFFF] rounded-xl text-[#0A1628] font-bold text-sm sm:text-base hover:bg-[#00A8E8] active:scale-95 transition-all shadow-lg shadow-[rgba(0,191,255,0.3)]"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Nouveau joueur</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Liste */}
      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl text-center">
          <span className="text-5xl sm:text-6xl mb-4 opacity-50">🏀</span>
          <p className="text-[rgba(245,241,232,0.55)] text-base sm:text-lg mb-2">
            Aucun joueur pour le moment
          </p>
          <p className="text-xs sm:text-sm text-[rgba(245,241,232,0.35)]">
            Créez votre premier joueur
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        // Vue cartes premium - RESPONSIVE
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {players.map((player) => (
            <div key={player.id} className="relative group flex justify-center">
              <PlayerCard
                id={player.id}
                firstName={player.firstName}
                lastName={player.lastName}
                position={player.position}
                photo={player.photo}
                avatar={player.avatar}
                nbaTeam={player.nbaTeam}
                stats={player.stats}
              />

{/* Actions MOBILE : petites icônes flottantes en haut à droite */}
<div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20 sm:hidden">
  <button
    onClick={(e) => handleEdit(player, e)}
    className="w-8 h-8 flex items-center justify-center bg-[rgba(0,191,255,0.95)] backdrop-blur-sm text-white rounded-full active:scale-90 transition-all shadow-lg"
    aria-label="Modifier"
  >
    <Edit2 size={14} />
  </button>
  <button
    onClick={(e) => handleDelete(player.id, e)}
    className="w-8 h-8 flex items-center justify-center bg-[rgba(239,68,68,0.95)] backdrop-blur-sm text-white rounded-full active:scale-90 transition-all shadow-lg"
    aria-label="Supprimer"
  >
    <Trash2 size={14} />
  </button>
</div>

            {/* Actions DESKTOP : overlay au hover, en bas de carte */}
            <div className="hidden sm:flex absolute bottom-6 left-6 right-6 gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={(e) => handleEdit(player, e)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[rgba(0,191,255,0.95)] backdrop-blur-sm text-white rounded-lg text-xs font-bold hover:bg-[#00BFFF] active:scale-95 transition-all shadow-xl"
              >
                <Edit2 size={14} />
                Modifier
              </button>
              <button
                onClick={(e) => handleDelete(player.id, e)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[rgba(239,68,68,0.95)] backdrop-blur-sm text-white rounded-lg text-xs font-bold hover:bg-red-500 active:scale-95 transition-all shadow-xl"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </div>
            </div>
          ))}
        </div>
      ) : (
        // Vue liste - RESPONSIVE
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-xl p-4 sm:p-6 hover:border-[rgba(0,191,255,0.25)] transition-all"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-3">
                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-[#0A1628] font-bold text-base sm:text-lg"
                      style={{ backgroundColor: player.avatar }}
                    >
                      {player.firstName[0]}
                      {player.lastName[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#F5F1E8] text-sm sm:text-base truncate">
                      {player.firstName} {player.lastName}
                    </h3>
                    {player.nickname && (
                      <p className="text-xs text-[rgba(245,241,232,0.55)] italic mt-0.5 truncate">
                        &quot;{player.nickname}&quot;
                      </p>
                    )}
                    {player.position && (
                      <p className="text-xs text-[rgba(245,241,232,0.35)] mt-1">
                        {player.position}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 sm:pt-4 border-t border-[rgba(0,191,255,0.1)]">
                <button
                  onClick={(e) => handleEdit(player, e)}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 bg-[rgba(0,191,255,0.1)] text-[#00BFFF] rounded-lg text-xs sm:text-sm font-medium hover:bg-[rgba(0,191,255,0.15)] active:scale-95 transition-all"
                >
                  <Edit2 size={14} className="sm:w-4 sm:h-4" />
                  Modifier
                </button>
                <button
                  onClick={(e) => handleDelete(player.id, e)}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2 bg-[rgba(239,68,68,0.1)] text-red-400 rounded-lg text-xs sm:text-sm font-medium hover:bg-[rgba(239,68,68,0.15)] active:scale-95 transition-all"
                >
                  <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <PlayerModal
          player={editingPlayer}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}