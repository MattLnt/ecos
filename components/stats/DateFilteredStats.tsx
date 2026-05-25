'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingDown, Target, Crosshair } from 'lucide-react';

interface SessionInfo {
  sessionId: string;
  time: string;
  playerCount: number;
}

interface PlayerStat {
  playerId: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  avatar: string;
  totalPoints: number;
  avgPoints: number;
  sessionsPlayed: number;
  midRate: number;
  threePointRate: number;
  ftRate: number;
}

interface SpotStat {
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  fullLabel: string;
  successRate: number;
}

interface Records {
  bestScore: { points: number; playerName: string } | null;
  worstScore: { points: number; playerName: string } | null;
  bestThree: { rate: number; playerName: string } | null;
  bestFt: { rate: number; playerName: string } | null;
}

interface DateStatsData {
  sessionCount: number;
  players: PlayerStat[];
  spots: SpotStat[];
  records: Records | null;
}

interface DateFilteredStatsProps {
  selectedDate: string;
  sessionsOfDay: SessionInfo[];
}

export function DateFilteredStats({ selectedDate, sessionsOfDay }: DateFilteredStatsProps) {
  // 'all' = toutes les sessions du jour, sinon un sessionId
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [data, setData] = useState<DateStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Reset le choix de session quand on change de date
  useEffect(() => {
    setSelectedSession('all');
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedSession]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url =
        selectedSession === 'all'
          ? `/api/stats/by-date?date=${selectedDate}`
          : `/api/stats/by-date?sessionId=${selectedSession}`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Erreur fetch date stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formatage de la date pour affichage
  const dateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* En-tête date + sélecteur de session */}
      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.2)] rounded-2xl p-4 sm:p-5">
        <div className="text-sm text-[rgba(245,241,232,0.55)] mb-1">Statistiques du</div>
        <div className="text-lg sm:text-xl font-bold text-[#F5F1E8] capitalize mb-4">{dateLabel}</div>

        {/* Sélecteur : toutes les sessions OU une session */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSession('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
              selectedSession === 'all'
                ? 'bg-[#00BFFF] text-[#0A1628] border-[#00BFFF]'
                : 'bg-[rgba(0,191,255,0.08)] text-[rgba(245,241,232,0.7)] border-[rgba(0,191,255,0.15)] hover:bg-[rgba(0,191,255,0.15)]'
            }`}
          >
            Toutes les sessions ({sessionsOfDay.length})
          </button>
          {sessionsOfDay.map((s, idx) => (
            <button
              key={s.sessionId}
              onClick={() => setSelectedSession(s.sessionId)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                selectedSession === s.sessionId
                  ? 'bg-[#00BFFF] text-[#0A1628] border-[#00BFFF]'
                  : 'bg-[rgba(0,191,255,0.08)] text-[rgba(245,241,232,0.7)] border-[rgba(0,191,255,0.15)] hover:bg-[rgba(0,191,255,0.15)]'
              }`}
            >
              Session {idx + 1} · {s.time}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
        </div>
      ) : !data || data.players.length === 0 ? (
        <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-12 text-center">
          <p className="text-[rgba(245,241,232,0.55)]">Aucune donnée pour cette sélection</p>
        </div>
      ) : (
        <>
          {/* ===== RECORDS ===== */}
          {data.records && (
            <div>
              <h3 className="text-lg font-bold text-[#F5F1E8] mb-3">
                Records {selectedSession === 'all' ? 'du jour' : 'de la session'}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-[rgba(255,215,0,0.08)] to-[rgba(255,215,0,0.02)] border border-[rgba(255,215,0,0.2)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={16} className="text-[#FFD700]" />
                    <span className="text-xs text-[rgba(245,241,232,0.55)]">Meilleur score</span>
                  </div>
                  <div className="font-mono text-2xl font-extrabold text-[#FFD700]">
                    {data.records.bestScore?.points ?? '—'}
                  </div>
                  <div className="text-xs text-[rgba(245,241,232,0.7)] mt-1">
                    {data.records.bestScore?.playerName ?? ''}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[rgba(239,68,68,0.08)] to-[rgba(239,68,68,0.02)] border border-[rgba(239,68,68,0.2)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={16} className="text-red-400" />
                    <span className="text-xs text-[rgba(245,241,232,0.55)]">Pire score</span>
                  </div>
                  <div className="font-mono text-2xl font-extrabold text-red-400">
                    {data.records.worstScore?.points ?? '—'}
                  </div>
                  <div className="text-xs text-[rgba(245,241,232,0.7)] mt-1">
                    {data.records.worstScore?.playerName ?? ''}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[rgba(255,215,0,0.08)] to-[rgba(255,215,0,0.02)] border border-[rgba(255,215,0,0.2)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-[#FFD700]" />
                    <span className="text-xs text-[rgba(245,241,232,0.55)]">Meilleur 3pts</span>
                  </div>
                  <div className="font-mono text-2xl font-extrabold text-[#FFD700]">
                    {data.records.bestThree ? `${data.records.bestThree.rate}%` : '—'}
                  </div>
                  <div className="text-xs text-[rgba(245,241,232,0.7)] mt-1">
                    {data.records.bestThree?.playerName ?? ''}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[rgba(34,197,94,0.08)] to-[rgba(34,197,94,0.02)] border border-[rgba(34,197,94,0.2)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crosshair size={16} className="text-green-400" />
                    <span className="text-xs text-[rgba(245,241,232,0.55)]">Meilleur LF</span>
                  </div>
                  <div className="font-mono text-2xl font-extrabold text-green-400">
                    {data.records.bestFt ? `${data.records.bestFt.rate}%` : '—'}
                  </div>
                  <div className="text-xs text-[rgba(245,241,232,0.7)] mt-1">
                    {data.records.bestFt?.playerName ?? ''}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== CLASSEMENT + % ===== */}
          <div>
            <h3 className="text-lg font-bold text-[#F5F1E8] mb-3">Classement des joueurs</h3>
            <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl overflow-hidden">
              <div className="hidden sm:grid grid-cols-[50px_1fr_90px_90px_90px_90px] gap-3 p-4 border-b border-[rgba(0,191,255,0.15)] bg-[rgba(0,191,255,0.04)]">
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">#</div>
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">Joueur</div>
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">Points</div>
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% Mid</div>
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% 3pts</div>
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% LF</div>
              </div>

              <div className="divide-y divide-[rgba(0,191,255,0.08)]">
                {data.players.map((player, index) => (
                  <div
                    key={player.playerId}
                    className="grid grid-cols-[40px_1fr_auto] sm:grid-cols-[50px_1fr_90px_90px_90px_90px] gap-3 p-4 hover:bg-[rgba(0,191,255,0.04)] transition-colors items-center"
                  >
                    <div className={`font-mono font-bold text-lg ${
                      index === 0 ? 'text-[#FFD700]' :
                      index === 1 ? 'text-[#C0C0C0]' :
                      index === 2 ? 'text-[#CD7F32]' :
                      'text-[rgba(245,241,232,0.35)]'
                    }`}>
                      #{index + 1}
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      {player.photo ? (
                        <img src={player.photo} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-[#0A1628] flex-shrink-0"
                          style={{ backgroundColor: player.avatar }}
                        >
                          {player.firstName[0]}{player.lastName[0]}
                        </div>
                      )}
                      <div className="font-bold text-[#F5F1E8] truncate">
                        {player.firstName} {player.lastName}
                      </div>
                    </div>

                    {/* Mobile : juste les points */}
                    <div className="sm:hidden font-mono text-lg font-extrabold text-[#00BFFF]">
                      {player.totalPoints}
                    </div>

                    {/* Desktop : toutes les colonnes */}
                    <div className="hidden sm:block font-mono text-lg font-extrabold text-[#00BFFF]">
                      {player.totalPoints}
                    </div>
                    <div className="hidden sm:block font-mono font-bold text-[#00BFFF]">
                      {player.midRate}%
                    </div>
                    <div className="hidden sm:block font-mono font-bold text-[#FFD700]">
                      {player.threePointRate}%
                    </div>
                    <div className="hidden sm:block font-mono font-bold text-green-400">
                      {player.ftRate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Détail % en cartes sur mobile */}
            <div className="sm:hidden grid grid-cols-1 gap-2 mt-3">
              {data.players.map((player) => (
                <div key={player.playerId} className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-3">
                  <div className="font-bold text-[#F5F1E8] text-sm mb-2">{player.firstName} {player.lastName}</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="font-mono font-bold text-[#00BFFF]">{player.midRate}%</div>
                      <div className="text-[10px] text-[rgba(245,241,232,0.4)]">MID</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-[#FFD700]">{player.threePointRate}%</div>
                      <div className="text-[10px] text-[rgba(245,241,232,0.4)]">3 PTS</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-green-400">{player.ftRate}%</div>
                      <div className="text-[10px] text-[rgba(245,241,232,0.4)]">LF</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== PERF PAR SPOT ===== */}
          {data.spots.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-[#F5F1E8] mb-3">Taux de réussite par spot</h3>
              <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {data.spots.map((spot) => (
                    <div
                      key={spot.spotNum}
                      className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-[rgba(0,191,255,0.15)] rounded-lg flex items-center justify-center">
                          <span className="font-bold text-sm text-[#00BFFF]">{spot.spotNum}</span>
                        </div>
                        <div className={`text-xl font-bold ${
                          spot.successRate >= 60 ? 'text-green-400' :
                          spot.successRate >= 40 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {spot.successRate.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-xs text-[rgba(245,241,232,0.7)] font-semibold">
                        {spot.spotLabel}
                      </div>
                      <div className="text-[10px] text-[rgba(245,241,232,0.35)] mt-1 uppercase tracking-wide">
                        {spot.spotSub}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}