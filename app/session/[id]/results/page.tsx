'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trophy, Home, ChevronRight } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0d1f38] to-[#0A1628] flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.55)] font-mono text-sm">Chargement des résultats...</div>
      </div>
    );
  }

  if (!session) return null;

  const rankedPlayers = [...session.sessionPlayers].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#0d1f38] to-[#0A1628] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#00BFFF] to-[#0088cc] rounded-full mb-6 shadow-[0_0_40px_rgba(0,191,255,0.3)]">
            <Trophy size={40} className="text-[#0A1628]" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#F5F1E8] mb-3 mobile:text-3xl">
            SESSION TERMINÉE
          </h1>
          <p className="font-mono text-sm text-[rgba(245,241,232,0.4)] uppercase tracking-widest">
            {new Date(session.date).toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        {/* Podium Top 3 */}
        {rankedPlayers.length >= 3 && (
          <div className="grid grid-cols-3 gap-6 mb-16 items-end mobile:gap-3">
            {/* 2ème place */}
            <div className="text-center">
              <div className="relative bg-gradient-to-br from-[rgba(192,192,192,0.15)] to-[rgba(192,192,192,0.05)] border border-[rgba(192,192,192,0.3)] rounded-2xl p-6 backdrop-blur-sm mobile:p-4">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#C0C0C0] rounded-full flex items-center justify-center text-[#0A1628] font-bold text-sm mobile:w-6 mobile:h-6 mobile:text-xs">
                  2
                </div>
                {rankedPlayers[1].player.photo ? (
                  <img 
                    src={rankedPlayers[1].player.photo} 
                    alt="" 
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-[#C0C0C0] mobile:w-16 mobile:h-16" 
                  />
                ) : (
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-[#0A1628] mx-auto mb-4 ring-2 ring-[#C0C0C0] mobile:w-16 mobile:h-16 mobile:text-lg"
                    style={{ backgroundColor: rankedPlayers[1].player.avatar }}
                  >
                    {rankedPlayers[1].player.firstName[0]}{rankedPlayers[1].player.lastName[0]}
                  </div>
                )}
                <div className="font-bold text-[#F5F1E8] mb-1 mobile:text-sm">
                  {rankedPlayers[1].player.firstName}
                </div>
                <div className="font-mono text-3xl font-extrabold text-[#C0C0C0] mobile:text-2xl">
                  {rankedPlayers[1].totalPoints}
                </div>
                <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)] uppercase tracking-wider">PTS</div>
              </div>
            </div>

            {/* 1ère place */}
            <div className="text-center -mt-8 mobile:-mt-4">
              <div className="relative bg-gradient-to-br from-[rgba(255,215,0,0.25)] to-[rgba(255,215,0,0.08)] border-2 border-[#FFD700] rounded-2xl p-8 backdrop-blur-sm shadow-[0_0_40px_rgba(255,215,0,0.2)] mobile:p-6">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,215,0,0.4)] mobile:w-10 mobile:h-10">
                  <Trophy size={24} className="text-[#0A1628] mobile:w-5 mobile:h-5" />
                </div>
                {rankedPlayers[0].player.photo ? (
                  <img 
                    src={rankedPlayers[0].player.photo} 
                    alt="" 
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-[#FFD700] mobile:w-20 mobile:h-20" 
                  />
                ) : (
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-[#0A1628] mx-auto mb-4 ring-4 ring-[#FFD700] mobile:w-20 mobile:h-20 mobile:text-xl"
                    style={{ backgroundColor: rankedPlayers[0].player.avatar }}
                  >
                    {rankedPlayers[0].player.firstName[0]}{rankedPlayers[0].player.lastName[0]}
                  </div>
                )}
                <div className="font-bold text-[#F5F1E8] text-lg mb-2 mobile:text-base">
                  {rankedPlayers[0].player.firstName}
                </div>
                <div className="font-mono text-4xl font-extrabold text-[#FFD700] mobile:text-3xl">
                  {rankedPlayers[0].totalPoints}
                </div>
                <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)] uppercase tracking-wider">PTS</div>
              </div>
            </div>

            {/* 3ème place */}
            <div className="text-center">
              <div className="relative bg-gradient-to-br from-[rgba(205,127,50,0.15)] to-[rgba(205,127,50,0.05)] border border-[rgba(205,127,50,0.3)] rounded-2xl p-6 backdrop-blur-sm mobile:p-4">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#CD7F32] rounded-full flex items-center justify-center text-[#0A1628] font-bold text-sm mobile:w-6 mobile:h-6 mobile:text-xs">
                  3
                </div>
                {rankedPlayers[2].player.photo ? (
                  <img 
                    src={rankedPlayers[2].player.photo} 
                    alt="" 
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-[#CD7F32] mobile:w-16 mobile:h-16" 
                  />
                ) : (
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-[#0A1628] mx-auto mb-4 ring-2 ring-[#CD7F32] mobile:w-16 mobile:h-16 mobile:text-lg"
                    style={{ backgroundColor: rankedPlayers[2].player.avatar }}
                  >
                    {rankedPlayers[2].player.firstName[0]}{rankedPlayers[2].player.lastName[0]}
                  </div>
                )}
                <div className="font-bold text-[#F5F1E8] mb-1 mobile:text-sm">
                  {rankedPlayers[2].player.firstName}
                </div>
                <div className="font-mono text-3xl font-extrabold text-[#CD7F32] mobile:text-2xl">
                  {rankedPlayers[2].totalPoints}
                </div>
                <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)] uppercase tracking-wider">PTS</div>
              </div>
            </div>
          </div>
        )}

        {/* Classement complet */}
        <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6 backdrop-blur-sm mb-8">
          <h2 className="font-mono text-[11px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em] mb-5">
            Classement Complet
          </h2>
          <div className="space-y-3">
            {rankedPlayers.map((sp, index) => (
              <button
                key={sp.id}
                onClick={() => setSelectedPlayer(sp)}
                className="w-full group"
              >
                <div className="flex items-center gap-4 p-4 bg-[rgba(0,191,255,0.06)] hover:bg-[rgba(0,191,255,0.12)] border border-[rgba(0,191,255,0.15)] hover:border-[#00BFFF] rounded-xl transition-all">
                  <div className={`font-mono text-lg font-extrabold w-10 text-center shrink-0 ${
                    index === 0 ? 'text-[#FFD700]' : 
                    index === 1 ? 'text-[#C0C0C0]' : 
                    index === 2 ? 'text-[#CD7F32]' : 
                    'text-[rgba(245,241,232,0.35)]'
                  }`}>
                    #{index + 1}
                  </div>
                  
                  {sp.player.photo ? (
                    <img src={sp.player.photo} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-[#0A1628] shrink-0"
                      style={{ backgroundColor: sp.player.avatar }}
                    >
                      {sp.player.firstName[0]}{sp.player.lastName[0]}
                    </div>
                  )}
                  
                  <div className="flex-1 text-left">
                    <div className="font-bold text-[#F5F1E8] mb-0.5">
                      {sp.player.firstName} {sp.player.lastName}
                    </div>
                    <div className="font-mono text-xs text-[rgba(245,241,232,0.4)]">
                      {sp.spotResults.length} spots complétés
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="font-mono text-2xl font-extrabold text-[#00BFFF]">{sp.totalPoints}</div>
                    <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)]">POINTS</div>
                  </div>
                  
                  <ChevronRight size={20} className="text-[rgba(245,241,232,0.35)] group-hover:text-[#00BFFF] transition-colors shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bouton retour */}
        <button
          onClick={() => router.push('/home')}
          className="w-full px-6 py-4 bg-gradient-to-r from-[#00BFFF] to-[#0088cc] text-[#0A1628] rounded-xl font-extrabold text-lg flex items-center justify-center gap-3 hover:shadow-[0_8px_32px_rgba(0,191,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Home size={22} />
          <span>Retour à l'accueil</span>
        </button>
      </div>

      {/* Modal détails joueur */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="bg-gradient-to-br from-[#0d1f38] to-[#0A1628] border border-[rgba(0,191,255,0.2)] rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="bg-[rgba(0,191,255,0.08)] border-b border-[rgba(0,191,255,0.15)] p-6">
              <div className="flex items-center gap-4">
                {selectedPlayer.player.photo ? (
                  <img src={selectedPlayer.player.photo} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-[#00BFFF]" />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-[#0A1628] ring-2 ring-[#00BFFF]"
                    style={{ backgroundColor: selectedPlayer.player.avatar }}
                  >
                    {selectedPlayer.player.firstName[0]}{selectedPlayer.player.lastName[0]}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-[#F5F1E8]">
                    {selectedPlayer.player.firstName} {selectedPlayer.player.lastName}
                  </h2>
                  <p className="font-mono text-sm text-[rgba(245,241,232,0.4)] mt-1">
                    Performance détaillée
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-4xl font-extrabold text-[#00BFFF]">{selectedPlayer.totalPoints}</div>
                  <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase tracking-wider">Points</div>
                </div>
              </div>
            </div>

            {/* Body modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              <div className="space-y-3">
                {selectedPlayer.spotResults.map((result) => (
                  <div 
                    key={result.spotNum} 
                    className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-4 hover:bg-[rgba(0,191,255,0.08)] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-[rgba(0,191,255,0.15)] border border-[#00BFFF] flex items-center justify-center font-bold text-sm text-[#00BFFF]">
                            {result.spotNum}
                          </div>
                          <div>
                            <div className="font-bold text-[#F5F1E8]">{result.spotLabel}</div>
                            <div className="font-mono text-xs text-[rgba(245,241,232,0.4)]">{result.spotSub}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 font-mono text-sm text-[rgba(245,241,232,0.55)]">
                          <span>Tirs: <span className="text-[#F5F1E8] font-bold">{result.makes}/10</span></span>
                          <span>·</span>
                          <span>LF: <span className="text-[#F5F1E8] font-bold">{result.ftMakes}/2</span></span>
                        </div>
                      </div>
                      <div className="font-mono text-3xl font-extrabold text-[#00BFFF]">{result.points}</div>
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