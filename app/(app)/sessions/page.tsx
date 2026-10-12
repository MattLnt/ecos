'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, ChevronRight, Filter, Trash2, X } from 'lucide-react';

interface SessionPlayer {
  id: string;
  totalPoints: number;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string | null;
    avatar: string;
  };
}

interface Session {
  id: string;
  date: string;
  startedAt: string;
  endedAt: string | null;
  status: string;
  court: {
    id: string;
    name: string;
  };
  sessionPlayers: SessionPlayer[];
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');
  // Session dont on demande la suppression ; la confirmation passe par une modale
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error('Erreur fetch sessions');
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sessionToDelete || deleting) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/sessions/${sessionToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Suppression refusée');

      // On retire la ligne localement plutôt que de recharger : la liste est
      // déjà en mémoire et le serveur vient de confirmer.
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
      setSessionToDelete(null);
    } catch (error) {
      console.error('Erreur suppression session:', error);
      alert('La session n\'a pas pu être supprimée.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (filter === 'completed') return s.status === 'completed';
    if (filter === 'active') return s.status === 'active';
    return true;
  });

  const getWinner = (session: Session) => {
    if (session.sessionPlayers.length === 0) return null;
    return [...session.sessionPlayers].sort((a, b) => b.totalPoints - a.totalPoints)[0];
  };

  const getDuration = (session: Session) => {
    if (!session.endedAt) return null;
    const start = new Date(session.startedAt);
    const end = new Date(session.endedAt);
    const minutes = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-[rgba(245,241,232,0.55)] font-mono text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mobile:flex-col">
        <div>
          <h1 className="text-3xl font-extrabold text-[#F5F1E8] tracking-tight mobile:text-2xl">Sessions</h1>
          <p className="text-sm text-[rgba(245,241,232,0.55)] mt-1">
            Historique de toutes vos sessions
          </p>
        </div>

        {/* Filtres — défilement horizontal sur mobile plutôt que débordement */}
        <div className="flex items-center gap-2 shrink-0 mobile:w-full mobile:overflow-x-auto mobile:-mx-4 mobile:px-4 mobile:pb-1">
          <Filter size={18} className="text-[rgba(245,241,232,0.35)] shrink-0 mobile:hidden" />
          {([
            { key: 'all', label: 'Toutes' },
            { key: 'completed', label: 'Terminées' },
            { key: 'active', label: 'En cours' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                filter === key
                  ? 'bg-[#00BFFF] text-[#0A1628]'
                  : 'bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] text-[rgba(245,241,232,0.7)] hover:border-[#00BFFF]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mobile:gap-3">
        <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-5 mobile:p-3">
          <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase tracking-wider mb-2 mobile:text-[10px] mobile:leading-tight">
            Total Sessions
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#00BFFF] mobile:text-2xl">
            {sessions.length}
          </div>
        </div>
        <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-5 mobile:p-3">
          <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase tracking-wider mb-2 mobile:text-[10px] mobile:leading-tight">
            Terminées
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#00BFFF] mobile:text-2xl">
            {sessions.filter(s => s.status === 'completed').length}
          </div>
        </div>
        <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-5 mobile:p-3">
          <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase tracking-wider mb-2 mobile:text-[10px] mobile:leading-tight">
            En cours
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#00BFFF] mobile:text-2xl">
            {sessions.filter(s => s.status === 'active').length}
          </div>
        </div>
      </div>

      {/* Liste des sessions */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[rgba(0,191,255,0.08)] rounded-full mb-4">
            <Calendar size={32} className="text-[rgba(245,241,232,0.35)]" />
          </div>
          <p className="text-[rgba(245,241,232,0.55)] text-lg">Aucune session trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const winner = getWinner(session);
            const duration = getDuration(session);

            return (
              /*
                La carte était un <button> englobant tout. Imbriquer la
                corbeille dedans donnerait un bouton dans un bouton : on sépare
                la zone cliquable de l'action de suppression.
              */
              <div
                key={session.id}
                className="group flex items-stretch bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] hover:bg-[rgba(0,191,255,0.08)] hover:border-[#00BFFF] rounded-xl transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (session.status === 'completed') {
                      router.push(`/session/${session.id}/results`);
                    } else {
                      router.push(`/session/${session.id}`);
                    }
                  }}
                  className="flex-1 min-w-0 text-left p-5 mobile:p-3.5 active:scale-[0.99] transition-transform"
                >
                  {/* Sur mobile la carte passe sur deux lignes (infos puis vainqueur)
                      au lieu d'empiler chaque bloc, ce qui la rendait très haute. */}
                  <div className="flex items-center gap-5 mobile:gap-3">
                    {/* Date */}
                    <div className="shrink-0">
                      <div className="font-mono text-xs mobile:text-[10px] text-[rgba(245,241,232,0.4)] uppercase mb-1 mobile:mb-0">
                        {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div className="font-bold text-2xl mobile:text-lg text-[#F5F1E8] whitespace-nowrap">
                        {new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>

                    <div className="h-12 w-px bg-[rgba(0,191,255,0.15)] mobile:hidden" />

                    {/* Info session */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mobile:gap-2 mb-2 mobile:mb-1 min-w-0">
                        <span className={`px-3 mobile:px-2 py-1 mobile:py-0.5 rounded-full text-xs mobile:text-[10px] font-bold shrink-0 ${
                          session.status === 'completed'
                            ? 'bg-[rgba(0,191,255,0.15)] text-[#00BFFF]'
                            : 'bg-[rgba(255,165,0,0.15)] text-[#FFA500]'
                        }`}>
                          {session.status === 'completed' ? 'Terminée' : 'En cours'}
                        </span>
                        <span className="font-mono text-sm mobile:text-xs text-[rgba(245,241,232,0.55)] truncate">
                          {session.court.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mobile:gap-2 text-sm mobile:text-xs text-[rgba(245,241,232,0.55)]">
                        <span className="flex items-center gap-2 mobile:gap-1 whitespace-nowrap">
                          <Users size={16} className="shrink-0 mobile:w-3.5 mobile:h-3.5" />
                          {session.sessionPlayers.length} joueur{session.sessionPlayers.length > 1 ? 's' : ''}
                        </span>
                        {duration && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-2 mobile:gap-1 whitespace-nowrap">
                              <Calendar size={16} className="shrink-0 mobile:w-3.5 mobile:h-3.5" />
                              {duration}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Gagnant — desktop */}
                    {winner && session.status === 'completed' && (
                      <>
                        <div className="h-12 w-px bg-[rgba(0,191,255,0.15)] mobile:hidden" />
                        <div className="flex items-center gap-3 shrink-0 mobile:hidden">
                          <div className="text-right">
                            <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase mb-1">
                              Vainqueur
                            </div>
                            <div className="font-bold text-[#F5F1E8]">{winner.player.firstName}</div>
                          </div>
                          {winner.player.photo ? (
                            <img
                              src={winner.player.photo}
                              alt=""
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#FFD700]"
                            />
                          ) : (
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-[#0A1628] ring-2 ring-[#FFD700]"
                              style={{ backgroundColor: winner.player.avatar }}
                            >
                              {winner.player.firstName[0]}{winner.player.lastName[0]}
                            </div>
                          )}
                          <div className="text-left">
                            <div className="font-mono text-2xl font-extrabold text-[#FFD700]">
                              {winner.totalPoints}
                            </div>
                            <div className="font-mono text-xs text-[rgba(245,241,232,0.4)]">PTS</div>
                          </div>
                        </div>
                      </>
                    )}

                    <ChevronRight size={20} className="text-[rgba(245,241,232,0.35)] group-hover:text-[#00BFFF] transition-colors shrink-0 mobile:hidden" />
                  </div>

                  {/* Gagnant — mobile, sur sa propre ligne */}
                  {winner && session.status === 'completed' && (
                    <div className="hidden mobile:flex items-center gap-2 mt-3 pt-3 border-t border-[rgba(0,191,255,0.12)]">
                      <span className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase shrink-0">
                        Vainqueur
                      </span>
                      {winner.player.photo ? (
                        <img
                          src={winner.player.photo}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover ring-2 ring-[#FFD700] shrink-0"
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-[#0A1628] ring-2 ring-[#FFD700] shrink-0"
                          style={{ backgroundColor: winner.player.avatar }}
                        >
                          {winner.player.firstName[0]}{winner.player.lastName[0]}
                        </div>
                      )}
                      <span className="font-bold text-sm text-[#F5F1E8] truncate flex-1 min-w-0">
                        {winner.player.firstName}
                      </span>
                      <span className="font-mono text-lg font-extrabold text-[#FFD700] shrink-0">
                        {winner.totalPoints}
                        <span className="text-[10px] text-[rgba(245,241,232,0.4)] ml-1">PTS</span>
                      </span>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSessionToDelete(session)}
                  className="shrink-0 w-14 mobile:w-11 flex items-center justify-center border-l border-[rgba(0,191,255,0.12)] text-[rgba(245,241,232,0.3)] hover:bg-[rgba(239,68,68,0.12)] hover:text-red-400 active:scale-90 transition-all"
                  aria-label={`Supprimer la session du ${new Date(session.date).toLocaleDateString('fr-FR')}`}
                >
                  <Trash2 size={18} className="mobile:w-4 mobile:h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation de suppression */}
      {sessionToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !deleting && setSessionToDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmer la suppression"
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-[#0A1628] border border-red-500/30 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-6 py-5 mobile:px-4 mobile:py-4 border-b border-red-500/20 bg-gradient-to-r from-red-500/10 to-transparent">
              <div className="w-11 h-11 shrink-0 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#F5F1E8]">Supprimer cette session ?</h2>
                <p className="text-xs text-[rgba(245,241,232,0.55)] mt-0.5 truncate">
                  {new Date(sessionToDelete.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                  {' · '}
                  {sessionToDelete.court.name}
                </p>
              </div>
            </div>

            <div className="px-6 py-5 mobile:px-4 space-y-3">
              <p className="text-sm text-[#F5F1E8]">
                {sessionToDelete.sessionPlayers.length > 1
                  ? `Les ${sessionToDelete.sessionPlayers.length} joueurs de la session et tous leurs tirs enregistrés seront effacés.`
                  : 'Le joueur de la session et tous ses tirs enregistrés seront effacés.'}
                {' '}
                Les fiches joueur, elles, sont conservées.
              </p>

              {/* Une session terminée compte dans les statistiques : on le dit. */}
              {sessionToDelete.status === 'completed' && (
                <p className="text-sm text-[#FFB400] bg-[rgba(255,180,0,0.08)] border border-[rgba(255,180,0,0.25)] rounded-lg px-3 py-2">
                  Cette session est terminée : elle compte dans les statistiques et les
                  moyennes, qui changeront après suppression.
                </p>
              )}

              <p className="text-xs text-[rgba(245,241,232,0.45)]">Cette action est définitive.</p>
            </div>

            <div className="flex gap-3 px-6 py-4 mobile:px-4 bg-[rgba(245,241,232,0.02)] border-t border-[rgba(245,241,232,0.05)]">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-xl bg-[rgba(245,241,232,0.08)] text-[#F5F1E8] font-bold text-sm hover:bg-[rgba(245,241,232,0.15)] active:scale-95 transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30 disabled:opacity-60"
              >
                {deleting ? (
                  <span>Suppression...</span>
                ) : (
                  <>
                    <X size={16} />
                    <span>Supprimer</span>
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