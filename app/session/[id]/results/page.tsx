'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trophy, Home, ChevronRight, X } from 'lucide-react';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
  avatar: string;
}

interface SpotResult {
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  makes: number;
  ftMakes: number;
  points: number;
}

interface SessionPlayer {
  id: string;
  player: Player;
  totalPoints: number;
  rank: number | null;
  spotResults: SpotResult[];
}

interface Session {
  id: string;
  date: string;
  sessionPlayers: SessionPlayer[];
}

const PODIUM_STYLES = [
  { ring: 'ring-[#FFD700]', text: 'text-[#FFD700]' },
  { ring: 'ring-[#C0C0C0]', text: 'text-[#C0C0C0]' },
  { ring: 'ring-[#CD7F32]', text: 'text-[#CD7F32]' },
];

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<SessionPlayer | null>(null);

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/results`);
      if (!res.ok) throw new Error('Résultats non trouvés');
      const data = await res.json();
      setSession(data);
    } catch (error) {
      console.error('Erreur fetch résultats:', error);
      alert('Erreur lors du chargement des résultats');
      router.push('/home');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0d1f38] to-[#0A1628] flex items-center justify-center px-4 text-center">
        <div className="text-[rgba(245,241,232,0.55)] font-mono text-sm">Chargement des résultats...</div>
      </div>
    );
  }

  if (!session) return null;

  const rankedPlayers = [...session.sessionPlayers].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0d1f38] to-[#0A1628] pt-safe-t">
      <div className="max-w-6xl mx-auto px-6 py-10 mobile:px-3 mobile:py-6 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">

        {/* Header */}
        <div className="text-center mb-12 mobile:mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mobile:w-14 mobile:h-14 bg-gradient-to-br from-[#00BFFF] to-[#0088cc] rounded-full mb-6 mobile:mb-4 shadow-[0_0_40px_rgba(0,191,255,0.3)]">
            <Trophy className="text-[#0A1628] w-10 h-10 mobile:w-7 mobile:h-7" />
          </div>
          <h1 className="text-4xl mobile:text-2xl font-extrabold tracking-tight text-[#F5F1E8] mb-3 mobile:mb-2">
            SESSION TERMINÉE
          </h1>
          <p className="font-mono text-sm mobile:text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-widest">
            {new Date(session.date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Podium Top 3 — ordre visuel 2 · 1 · 3 */}
        {rankedPlayers.length >= 3 && (
          <div className="grid grid-cols-3 gap-6 mobile:gap-2 mb-16 mobile:mb-8 items-end">
            {[1, 0, 2].map((rank) => {
              const sp = rankedPlayers[rank];
              const style = PODIUM_STYLES[rank];
              const isFirst = rank === 0;

              return (
                <div key={sp.id} className={isFirst ? '-mt-8 mobile:-mt-4' : ''}>
                  <div
                    className={`relative text-center rounded-2xl backdrop-blur-sm mobile:px-2 mobile:py-4 ${
                      isFirst
                        ? 'p-8 bg-gradient-to-br from-[rgba(255,215,0,0.25)] to-[rgba(255,215,0,0.08)] border-2 border-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.2)]'
                        : rank === 1
                        ? 'p-6 bg-gradient-to-br from-[rgba(192,192,192,0.15)] to-[rgba(192,192,192,0.05)] border border-[rgba(192,192,192,0.3)]'
                        : 'p-6 bg-gradient-to-br from-[rgba(205,127,50,0.15)] to-[rgba(205,127,50,0.05)] border border-[rgba(205,127,50,0.3)]'
                    }`}
                  >
                    {/* Médaille */}
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-bold text-[#0A1628] ${
                        isFirst
                          ? '-top-4 mobile:-top-3 w-12 h-12 mobile:w-8 mobile:h-8 bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-[0_4px_20px_rgba(255,215,0,0.4)]'
                          : rank === 1
                          ? '-top-3 mobile:-top-2.5 w-8 h-8 mobile:w-6 mobile:h-6 bg-[#C0C0C0] text-sm mobile:text-[10px]'
                          : '-top-3 mobile:-top-2.5 w-8 h-8 mobile:w-6 mobile:h-6 bg-[#CD7F32] text-sm mobile:text-[10px]'
                      }`}
                    >
                      {isFirst ? <Trophy className="w-6 h-6 mobile:w-4 mobile:h-4" /> : rank + 1}
                    </div>

                    {sp.player.photo ? (
                      <img
                        src={sp.player.photo}
                        alt=""
                        className={`rounded-full object-cover mx-auto mb-4 mobile:mb-2 ${
                          isFirst
                            ? 'w-24 h-24 mobile:w-14 mobile:h-14 ring-4 mobile:ring-2'
                            : 'w-20 h-20 mobile:w-12 mobile:h-12 ring-2'
                        } ${style.ring}`}
                      />
                    ) : (
                      <div
                        className={`rounded-full flex items-center justify-center font-bold text-[#0A1628] mx-auto mb-4 mobile:mb-2 ${
                          isFirst
                            ? 'w-24 h-24 mobile:w-14 mobile:h-14 text-2xl mobile:text-base ring-4 mobile:ring-2'
                            : 'w-20 h-20 mobile:w-12 mobile:h-12 text-xl mobile:text-sm ring-2'
                        } ${style.ring}`}
                        style={{ backgroundColor: sp.player.avatar }}
                      >
                        {sp.player.firstName[0]}{sp.player.lastName[0]}
                      </div>
                    )}

                    <div className={`font-bold text-[#F5F1E8] mb-1 truncate ${isFirst ? 'text-lg mobile:text-sm' : 'text-base mobile:text-xs'}`}>
                      {sp.player.firstName}
                    </div>
                    <div className={`font-mono font-extrabold ${style.text} ${isFirst ? 'text-4xl mobile:text-2xl' : 'text-3xl mobile:text-xl'}`}>
                      {sp.totalPoints}
                    </div>
                    <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)] uppercase tracking-wider">PTS</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Classement complet */}
        <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6 mobile:p-3 backdrop-blur-sm mb-8 mobile:mb-6">
          <h2 className="font-mono text-[11px] mobile:text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em] mb-5 mobile:mb-3">
            Classement Complet
          </h2>
          <div className="space-y-3 mobile:space-y-2">
            {rankedPlayers.map((sp, index) => (
              <button
                key={sp.id}
                onClick={() => setSelectedPlayer(sp)}
                className="w-full group text-left"
              >
                <div className="flex items-center gap-4 mobile:gap-2.5 p-4 mobile:p-2.5 bg-[rgba(0,191,255,0.06)] hover:bg-[rgba(0,191,255,0.12)] border border-[rgba(0,191,255,0.15)] hover:border-[#00BFFF] active:scale-[0.99] rounded-xl transition-all">
                  <div className={`font-mono text-lg mobile:text-base font-extrabold w-10 mobile:w-6 text-center shrink-0 ${
                    index === 0 ? 'text-[#FFD700]' :
                    index === 1 ? 'text-[#C0C0C0]' :
                    index === 2 ? 'text-[#CD7F32]' :
                    'text-[rgba(245,241,232,0.35)]'
                  }`}>
                    {index + 1}
                  </div>

                  {sp.player.photo ? (
                    <img src={sp.player.photo} alt="" className="w-12 h-12 mobile:w-10 mobile:h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-12 h-12 mobile:w-10 mobile:h-10 rounded-full flex items-center justify-center text-sm mobile:text-xs font-bold text-[#0A1628] shrink-0"
                      style={{ backgroundColor: sp.player.avatar }}
                    >
                      {sp.player.firstName[0]}{sp.player.lastName[0]}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#F5F1E8] text-base mobile:text-sm truncate">
                      {sp.player.firstName} {sp.player.lastName}
                    </div>
                    <div className="font-mono text-xs mobile:text-[10px] text-[rgba(245,241,232,0.4)] truncate">
                      {sp.spotResults.length} spots complétés
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-2xl mobile:text-xl font-extrabold text-[#00BFFF] leading-none">{sp.totalPoints}</div>
                    <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)] mt-0.5">POINTS</div>
                  </div>

                  <ChevronRight size={20} className="text-[rgba(245,241,232,0.35)] group-hover:text-[#00BFFF] transition-colors shrink-0 mobile:hidden" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bouton retour */}
        <button
          onClick={() => router.push('/home')}
          className="w-full px-6 py-4 mobile:py-3.5 bg-gradient-to-r from-[#00BFFF] to-[#0088cc] text-[#0A1628] rounded-xl font-extrabold text-lg mobile:text-base flex items-center justify-center gap-3 hover:shadow-[0_8px_32px_rgba(0,191,255,0.4)] active:scale-[0.98] transition-all"
        >
          <Home size={20} />
          <span>Retour à l&apos;accueil</span>
        </button>
      </div>

      {/* Modal détails joueur — feuille glissante en mobile */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 mobile:p-0 mobile:items-end"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-gradient-to-br from-[#0d1f38] to-[#0A1628] border border-[rgba(0,191,255,0.2)] rounded-3xl mobile:rounded-b-none w-full max-w-3xl max-h-[88dvh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] mobile:pb-safe-b"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="shrink-0 bg-[rgba(0,191,255,0.08)] border-b border-[rgba(0,191,255,0.15)] p-6 mobile:p-4">
              <div className="flex items-center gap-4 mobile:gap-3">
                {selectedPlayer.player.photo ? (
                  <img src={selectedPlayer.player.photo} alt="" className="w-16 h-16 mobile:w-12 mobile:h-12 rounded-full object-cover ring-2 ring-[#00BFFF] shrink-0" />
                ) : (
                  <div
                    className="w-16 h-16 mobile:w-12 mobile:h-12 rounded-full flex items-center justify-center text-xl mobile:text-base font-bold text-[#0A1628] ring-2 ring-[#00BFFF] shrink-0"
                    style={{ backgroundColor: selectedPlayer.player.avatar }}
                  >
                    {selectedPlayer.player.firstName[0]}{selectedPlayer.player.lastName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl mobile:text-base font-extrabold text-[#F5F1E8] truncate">
                    {selectedPlayer.player.firstName} {selectedPlayer.player.lastName}
                  </h2>
                  <p className="font-mono text-sm mobile:text-[10px] text-[rgba(245,241,232,0.4)] mt-1 mobile:mt-0.5">
                    Performance détaillée
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-4xl mobile:text-2xl font-extrabold text-[#00BFFF] leading-none">{selectedPlayer.totalPoints}</div>
                  <div className="font-mono text-xs mobile:text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-wider mt-0.5">Points</div>
                </div>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="hidden mobile:flex w-9 h-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(245,241,232,0.06)] text-[rgba(245,241,232,0.6)] active:scale-90 transition-transform"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body modal */}
            <div className="scroll-area p-6 mobile:p-3">
              <div className="space-y-3 mobile:space-y-2">
                {selectedPlayer.spotResults.map((result) => (
                  <div
                    key={result.spotNum}
                    className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-4 mobile:p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mobile:gap-2.5 mb-2 mobile:mb-1.5">
                          <div className="w-8 h-8 mobile:w-7 mobile:h-7 shrink-0 rounded-full bg-[rgba(0,191,255,0.15)] border border-[#00BFFF] flex items-center justify-center font-bold text-sm mobile:text-xs text-[#00BFFF]">
                            {result.spotNum}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-base mobile:text-sm text-[#F5F1E8] truncate">{result.spotLabel}</div>
                            <div className="font-mono text-xs mobile:text-[10px] text-[rgba(245,241,232,0.4)] truncate">{result.spotSub}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mobile:gap-2 font-mono text-sm mobile:text-xs text-[rgba(245,241,232,0.55)]">
                          <span>Tirs: <span className="text-[#F5F1E8] font-bold">{result.makes}/10</span></span>
                          <span>·</span>
                          <span>LF: <span className="text-[#F5F1E8] font-bold">{result.ftMakes}/2</span></span>
                        </div>
                      </div>
                      <div className="font-mono text-3xl mobile:text-2xl font-extrabold text-[#00BFFF] shrink-0">{result.points}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
