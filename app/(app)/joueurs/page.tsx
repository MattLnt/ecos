'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Grid3x3, List, X, AlertTriangle, Check } from 'lucide-react';
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

type ActionMode = 'none' | 'edit' | 'delete';

export default function JoueursPage() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  
  // Mode action (edit/delete) + sélection
  const [actionMode, setActionMode] = useState<ActionMode>('none');
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // Click sur une carte selon le mode
  const handleCardClick = (player: Player) => {
    if (actionMode === 'edit') {
      // Mode édition : ouvre direct le modal
      setEditingPlayer(player);
      setModalOpen(true);
      setActionMode('none');
    } else if (actionMode === 'delete') {
      // Mode suppression : toggle sélection
      setSelectedForDelete((prev) =>
        prev.includes(player.id)
          ? prev.filter((id) => id !== player.id)
          : [...prev, player.id]
      );
    }
    // En mode 'none', rien (ou plus tard, ouvrir profil)
  };

  const handleConfirmDelete = async () => {
    if (selectedForDelete.length === 0) return;
    setDeleting(true);
    try {
      await Promise.all(
        selectedForDelete.map((id) =>
          fetch(`/api/joueurs/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedForDelete([]);
      setActionMode('none');
      setConfirmDeleteOpen(false);
      fetchPlayers();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelAction = () => {
    setActionMode('none');
    setSelectedForDelete([]);
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

  // Joueurs sélectionnés pour la confirmation
  const playersToDelete = players.filter(p => selectedForDelete.includes(p.id));

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F5F1E8] tracking-tight">
            Joueurs
          </h1>
          <p className="text-xs sm:text-sm text-[rgba(245,241,232,0.55)] mt-1 sm:mt-2">
            {actionMode === 'delete' && selectedForDelete.length > 0
              ? `${selectedForDelete.length} sélectionné${selectedForDelete.length > 1 ? 's' : ''} à supprimer`
              : actionMode === 'edit'
              ? 'Sélectionnez un joueur à modifier'
              : actionMode === 'delete'
              ? 'Sélectionnez les joueurs à supprimer'
              : `${players.length} joueur${players.length > 1 ? 's' : ''} enregistré${players.length > 1 ? 's' : ''}`}
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

          {/* Bouton Ajouter (caché en mode action) */}
          {actionMode === 'none' && (
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
          )}

          {/* Boutons Modifier / Supprimer (mode action) */}
          {actionMode === 'none' && (
            <>
              <button
                onClick={() => setActionMode('edit')}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-[rgba(0,191,255,0.15)] border border-[rgba(0,191,255,0.3)] text-[#00BFFF] rounded-xl hover:bg-[rgba(0,191,255,0.25)] active:scale-95 transition-all flex-shrink-0"
                aria-label="Modifier un joueur"
                title="Modifier"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => setActionMode('delete')}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] text-red-400 rounded-xl hover:bg-[rgba(239,68,68,0.25)] active:scale-95 transition-all flex-shrink-0"
                aria-label="Supprimer des joueurs"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}

          {/* Mode action : Annuler + Confirmer */}
          {actionMode !== 'none' && (
            <div className="flex gap-2 flex-1 sm:flex-initial">
              <button
                onClick={handleCancelAction}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-[rgba(245,241,232,0.08)] border border-[rgba(245,241,232,0.15)] text-[#F5F1E8] rounded-xl text-sm font-bold hover:bg-[rgba(245,241,232,0.15)] active:scale-95 transition-all"
              >
                Annuler
              </button>
              {actionMode === 'delete' && selectedForDelete.length > 0 && (
                <button
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30"
                >
                  <Trash2 size={16} />
                  <span>Supprimer ({selectedForDelete.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Barre d'info mode action */}
      {actionMode === 'edit' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(0,191,255,0.08)] border border-[rgba(0,191,255,0.2)] rounded-xl">
          <div className="w-8 h-8 rounded-full bg-[rgba(0,191,255,0.2)] flex items-center justify-center flex-shrink-0">
            <Edit2 size={14} className="text-[#00BFFF]" />
          </div>
          <p className="text-sm text-[#F5F1E8] font-medium">
            Tapez sur le joueur que vous souhaitez modifier
          </p>
        </div>
      )}
      {actionMode === 'delete' && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl">
          <div className="w-8 h-8 rounded-full bg-[rgba(239,68,68,0.2)] flex items-center justify-center flex-shrink-0">
            <Trash2 size={14} className="text-red-400" />
          </div>
          <p className="text-sm text-[#F5F1E8] font-medium">
            Sélectionnez les joueurs à supprimer
          </p>
        </div>
      )}

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
        // Vue cartes premium
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {players.map((player) => {
            const isSelected = selectedForDelete.includes(player.id);
            const isClickable = actionMode !== 'none';

            return (
              <div
                key={player.id}
                className={`relative flex justify-center transition-all ${
                  isClickable ? 'cursor-pointer' : ''
                } ${isSelected ? 'scale-95' : ''}`}
                onClick={() => handleCardClick(player)}
              >
                <div className={`relative transition-all ${
                  actionMode === 'edit' ? 'hover:scale-105 hover:ring-4 hover:ring-[#00BFFF]/50 rounded-2xl' : ''
                } ${
                  isSelected ? 'ring-4 ring-red-500 rounded-2xl' : ''
                } ${
                  actionMode === 'delete' && !isSelected ? 'opacity-60 hover:opacity-100' : ''
                }`}>
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

                  {/* Checkmark sélection en mode delete */}
                  {actionMode === 'delete' && isSelected && (
                    <div className="absolute top-3 right-3 w-9 h-9 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 z-30 animate-in zoom-in duration-200">
                      <Check size={20} className="text-white" strokeWidth={3} />
                    </div>
                  )}

                  {/* Icône edit visible en mode edit */}
                  {actionMode === 'edit' && (
                    <div className="absolute top-3 right-3 w-9 h-9 bg-[#00BFFF] rounded-full flex items-center justify-center shadow-lg shadow-[#00BFFF]/50 z-30">
                      <Edit2 size={16} className="text-[#0A1628]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Vue liste
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {players.map((player) => {
            const isSelected = selectedForDelete.includes(player.id);
            const isClickable = actionMode !== 'none';

            return (
              <div
                key={player.id}
                onClick={() => isClickable && handleCardClick(player)}
                className={`bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border rounded-xl p-4 sm:p-6 transition-all ${
                  isClickable ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'border-red-500 ring-2 ring-red-500/50'
                    : actionMode === 'edit'
                    ? 'border-[rgba(0,191,255,0.15)] hover:border-[#00BFFF] hover:ring-2 hover:ring-[#00BFFF]/30'
                    : 'border-[rgba(0,191,255,0.15)] hover:border-[rgba(0,191,255,0.25)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-[#0A1628] font-bold text-base sm:text-lg flex-shrink-0"
                      style={{ backgroundColor: player.avatar }}
                    >
                      {player.firstName[0]}{player.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
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
                  
                  {/* Indicateur sélection / edit */}
                  {actionMode === 'delete' && isSelected && (
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={16} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                  {actionMode === 'edit' && (
                    <div className="w-8 h-8 bg-[#00BFFF] rounded-full flex items-center justify-center flex-shrink-0">
                      <Edit2 size={14} className="text-[#0A1628]" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal édition joueur */}
      {modalOpen && (
        <PlayerModal player={editingPlayer} onClose={handleModalClose} />
      )}

      {/* Modal confirmation suppression */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0A1628] border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header alert */}
            <div className="px-6 py-5 border-b border-red-500/20 bg-gradient-to-r from-red-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F5F1E8]">
                    Confirmer la suppression
                  </h2>
                  <p className="text-sm text-[rgba(245,241,232,0.55)] mt-0.5">
                    Cette action est irréversible
                  </p>
                </div>
              </div>
            </div>

            {/* Liste des joueurs à supprimer */}
            <div className="p-6 space-y-3 max-h-[300px] overflow-y-auto">
              <p className="text-sm text-[#F5F1E8] mb-3">
                Vous êtes sur le point de supprimer <span className="font-bold text-red-400">{playersToDelete.length}</span> joueur{playersToDelete.length > 1 ? 's' : ''} :
              </p>
              <div className="space-y-2">
                {playersToDelete.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                    {player.photo ? (
                      <img
                        src={player.photo}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[#0A1628] font-bold text-xs flex-shrink-0"
                        style={{ backgroundColor: player.avatar }}
                      >
                        {player.firstName[0]}{player.lastName[0]}
                      </div>
                    )}
                    <span className="text-sm font-medium text-[#F5F1E8] truncate">
                      {player.firstName} {player.lastName}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[rgba(245,241,232,0.55)] mt-3">
                Toutes les statistiques et historiques associés seront définitivement perdus.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 py-4 bg-[rgba(245,241,232,0.02)] border-t border-[rgba(245,241,232,0.05)]">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-[rgba(245,241,232,0.08)] text-[#F5F1E8] rounded-xl font-bold text-sm hover:bg-[rgba(245,241,232,0.15)] active:scale-95 transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50"
              >
                {deleting ? (
                  <span>Suppression...</span>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Supprimer définitivement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}