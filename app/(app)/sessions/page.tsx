'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Trophy, ChevronRight, Filter } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#F5F1E8] tracking-tight">Sessions</h1>
          <p className="text-sm text-[rgba(245,241,232,0.55)] mt-1">
            Historique de toutes vos sessions
          </p>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[rgba(245,241,232,0.35)]" />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              filter === 'all'
                ? 'bg-[#00BFFF] text-[#0A1628]'
                : 'bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] text-[rgba(245,241,232,0.7)] hover:border-[#00BFFF]'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              filter === 'completed'
                ? 'bg-[#00BFFF] text-[#0A1628]'
                : 'bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] text-[rgba(245,241,232,0.7)] hover:border-[#00BFFF]'
            }`}
          >
            Terminées
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              filter === 'active'
                ? 'bg-[#00BFFF] text-[#0A1628]'
                : 'bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] text-[rgba(245,241,232,0.7)] hover:border-[#00BFFF]'
            }`}
          >
            En cours
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mobile:grid-cols-1">
        <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-5">
          <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase tracking-wider mb-2">
            Total Sessions
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#00BFFF]">
            {sessions.length}
          </div>
        </div>
        <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-5">
          <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase tracking-wider mb-2">
            Terminées
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#00BFFF]">
            {sessions.filter(s => s.status === 'completed').length}
          </div>
        </div>
        <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-5">
          <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase tracking-wider mb-2">
            En cours
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#00BFFF]">
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
              <button
                key={session.id}
                onClick={() => {
                  if (session.status === 'completed') {
                    router.push(`/session/${session.id}/results`);
                  } else {
                    router.push(`/session/${session.id}`);
                  }
                }}
                className="w-full group"
              >
                <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] hover:bg-[rgba(0,191,255,0.08)] hover:border-[#00BFFF] rounded-xl p-5 transition-all">
                  <div className="flex items-center gap-5 mobile:flex-col mobile:items-start">
                    {/* Date */}
                    <div className="shrink-0">
                      <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase mb-1">
                        {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div className="font-bold text-2xl text-[#F5F1E8]">
                        {new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>

                    <div className="h-12 w-px bg-[rgba(0,191,255,0.15)] mobile:hidden" />

                    {/* Info session */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          session.status === 'completed'
                            ? 'bg-[rgba(0,191,255,0.15)] text-[#00BFFF]'
                            : 'bg-[rgba(255,165,0,0.15)] text-[#FFA500]'
                        }`}>
                          {session.status === 'completed' ? 'Terminée' : 'En cours'}
                        </span>
                        <span className="font-mono text-sm text-[rgba(245,241,232,0.55)]">
                          {session.court.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[rgba(245,241,232,0.55)]">
                        <span className="flex items-center gap-2">
                          <Users size={16} />
                          {session.sessionPlayers.length} joueur{session.sessionPlayers.length > 1 ? 's' : ''}
                        </span>
                        {duration && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-2">
                              <Calendar size={16} />
                              {duration}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Gagnant */}
                    {winner && session.status === 'completed' && (
                      <>
                        <div className="h-12 w-px bg-[rgba(0,191,255,0.15)] mobile:hidden" />
                        <div className="flex items-center gap-3 shrink-0">
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
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}