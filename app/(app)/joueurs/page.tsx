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
      // Récupérer les joueurs
      const resPlayers = await fetch('/api/joueurs');
      const playersData = await resPlayers.json();

      // Récupérer les stats de chaque joueur
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
              stats: {
                pts: 0,
                threePct: 0,
                sessions: 0,
                midPct: 0,
                victories: 0,
                ftPct: 0,
              },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mobile:flex-col mobile:items-start mobile:gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#F5F1E8] tracking-tight mobile:text-3xl">
            Joueurs
          </h1>
          <p className="text-[rgba(245,241,232,0.55)] mt-2">
            {players.length} joueur{players.length > 1 ? 's' : ''} enregistré{players.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 mobile:w-full">
          {/* Toggle view mode */}
          <div className="flex items-center gap-2 bg-[rgba(0,191,255,0.08)] border border-[rgba(0,191,255,0.15)] rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                viewMode === 'cards'
                  ? 'bg-[#00BFFF] text-[#0A1628]'
                  : 'text-[rgba(245,241,232,0.7)] hover:text-[#00BFFF]'
              }`}
            >
              <Grid3x3 size={16} />
              Cartes
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-[#00BFFF] text-[#0A1628]'
                  : 'text-[rgba(245,241,232,0.7)] hover:text-[#00BFFF]'
              }`}
            >
              <List size={16} />
              Liste
            </button>
          </div>

          <button
            onClick={() => {
              setEditingPlayer(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00BFFF] rounded-xl text-[#0A1628] font-bold hover:bg-[#00A8E8] transition-all shadow-lg shadow-[rgba(0,191,255,0.3)] mobile:flex-1 mobile:justify-center"
          >
            <Plus size={20} />
            <span>Nouveau joueur</span>
          </button>
        </div>
      </div>

      {/* Liste */}
      {players.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl text-center mobile:p-12">
          <span className="text-6xl mb-4 opacity-50">🏀</span>
          <p className="text-[rgba(245,241,232,0.55)] text-lg mb-2">
            Aucun joueur pour le moment
          </p>
          <p className="text-sm text-[rgba(245,241,232,0.35)]">
            Créez votre premier joueur
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        // Vue cartes premium
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
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

              {/* Actions overlay */}
              <div className="absolute bottom-8 left-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => handleEdit(player, e)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[rgba(0,191,255,0.95)] backdrop-blur-sm text-white rounded-lg text-xs font-bold hover:bg-[#00BFFF] transition-all shadow-xl"
                >
                  <Edit2 size={14} />
                  Modifier
                </button>
                <button
                  onClick={(e) => handleDelete(player.id, e)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[rgba(239,68,68,0.95)] backdrop-blur-sm text-white rounded-lg text-xs font-bold hover:bg-red-500 transition-all shadow-xl"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Vue liste
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-xl p-6 hover:border-[rgba(0,191,255,0.25)] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-[#0A1628] font-bold text-lg"
                      style={{ backgroundColor: player.avatar }}
                    >
                      {player.firstName[0]}
                      {player.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-[#F5F1E8] text-base">
                      {player.firstName} {player.lastName}
                    </h3>
                    {player.nickname && (
                      <p className="text-xs text-[rgba(245,241,232,0.55)] italic mt-0.5">
                        "{player.nickname}"
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

              <div className="flex gap-2 pt-4 border-t border-[rgba(0,191,255,0.1)]">
                <button
                  onClick={(e) => handleEdit(player, e)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[rgba(0,191,255,0.1)] text-[#00BFFF] rounded-lg text-sm font-medium hover:bg-[rgba(0,191,255,0.15)] transition-all"
                >
                  <Edit2 size={16} />
                  Modifier
                </button>
                <button
                  onClick={(e) => handleDelete(player.id, e)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[rgba(239,68,68,0.1)] text-red-400 rounded-lg text-sm font-medium hover:bg-[rgba(239,68,68,0.15)] transition-all"
                >
                  <Trash2 size={16} />
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