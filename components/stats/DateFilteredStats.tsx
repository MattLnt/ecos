'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingDown, Target, Crosshair, ChevronRight, X } from 'lucide-react';

interface SessionInfo {
  sessionId: string;
  time: string;
  startedAt: string;
  playerCount: number;
}

/** Détail d'un joueur sur un spot, cumulé sur la sélection courante. */
interface PlayerSpotStat {
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  attempts: number;
  makes: number;
  shotsTotal: number;
  ftMakes: number;
  ftTotal: number;
  points: number;
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
  midMakes: number;
  midAttempts: number;
  threePointRate: number;
  threeMakes: number;
  threeAttempts: number;
  ftRate: number;
  ftMakes: number;
  ftAttempts: number;
  spots: PlayerSpotStat[];
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

/** « 2 sessions ce jour-là » — le pluriel change, pas la phrase. */
function SESSIONS_LABEL(count: number) {
  return count > 1 ? count + ' sessions ce jour-là' : '1 session ce jour-là';
}

export function DateFilteredStats({ selectedDate, sessionsOfDay }: DateFilteredStatsProps) {
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [data, setData] = useState<DateStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  // Joueur dont on affiche le détail spot par spot
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSession('all');
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedSession]);

  /*
    Le détail est dérivé des données, pas recopié dans un état : au changement
    de jour ou de session il suit la nouvelle sélection, et se referme de
    lui-même si le joueur n'y figure plus.
  */
  const selectedPlayer = data?.players.find((p) => p.playerId === selectedPlayerId) ?? null;

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
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h3 className="text-lg font-bold text-[#F5F1E8]">Classement des joueurs</h3>
              <span className="text-xs text-[rgba(245,241,232,0.4)]">
                Touchez un joueur pour le détail par spot
              </span>
            </div>
            <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl overflow-hidden">
              <div className="hidden sm:grid grid-cols-[50px_1fr_90px_90px_90px_90px_24px] gap-3 p-4 border-b border-[rgba(0,191,255,0.15)] bg-[rgba(0,191,255,0.04)]">
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">#</div>
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">Joueur</div>
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">Points</div>
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% Mid</div>
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% 3pts</div>
                <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% LF</div>
                <div />
              </div>

              <div className="divide-y divide-[rgba(0,191,255,0.08)]">
                {data.players.map((player, index) => (
                  <button
                    key={player.playerId}
                    type="button"
                    onClick={() => setSelectedPlayerId(player.playerId)}
                    className="w-full text-left grid grid-cols-[40px_1fr_auto] sm:grid-cols-[50px_1fr_90px_90px_90px_90px_24px] gap-3 p-4 hover:bg-[rgba(0,191,255,0.08)] active:bg-[rgba(0,191,255,0.12)] transition-colors items-center"
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

                    <div className="sm:hidden font-mono text-lg font-extrabold text-[#00BFFF]">
                      {player.totalPoints}
                    </div>

                    <div className="hidden sm:block font-mono text-lg font-extrabold text-[#00BFFF]">
                      {player.totalPoints}
                    </div>
                    <div className="hidden sm:block font-mono font-bold text-[#00BFFF]">
                      {player.midRate}%
                      <div className="font-mono text-[11px] font-normal text-[rgba(245,241,232,0.35)]">
                        {player.midMakes}/{player.midAttempts}
                      </div>
                    </div>
                    <div className="hidden sm:block font-mono font-bold text-[#FFD700]">
                      {player.threePointRate}%
                      <div className="font-mono text-[11px] font-normal text-[rgba(245,241,232,0.35)]">
                        {player.threeMakes}/{player.threeAttempts}
                      </div>
                    </div>
                    <div className="hidden sm:block font-mono font-bold text-green-400">
                      {player.ftRate}%
                      <div className="font-mono text-[11px] font-normal text-[rgba(245,241,232,0.35)]">
                        {player.ftMakes}/{player.ftAttempts}
                      </div>
                    </div>

                    <ChevronRight size={18} className="hidden sm:block text-[rgba(245,241,232,0.3)]" />
                  </button>
                ))}
              </div>
            </div>

            {/* Détail % en cartes sur mobile */}
            <div className="sm:hidden grid grid-cols-1 gap-2 mt-3">
              {data.players.map((player) => (
                <button
                  key={player.playerId}
                  type="button"
                  onClick={() => setSelectedPlayerId(player.playerId)}
                  className="w-full text-left bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-xl p-3 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-bold text-[#F5F1E8] text-sm truncate">{player.firstName} {player.lastName}</div>
                    <ChevronRight size={16} className="shrink-0 text-[rgba(245,241,232,0.3)]" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="font-mono font-bold text-[#00BFFF]">{player.midRate}%</div>
                      <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)]">
                        {player.midMakes}/{player.midAttempts}
                      </div>
                      <div className="text-[10px] text-[rgba(245,241,232,0.4)]">MID</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-[#FFD700]">{player.threePointRate}%</div>
                      <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)]">
                        {player.threeMakes}/{player.threeAttempts}
                      </div>
                      <div className="text-[10px] text-[rgba(245,241,232,0.4)]">3 PTS</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-green-400">{player.ftRate}%</div>
                      <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)]">
                        {player.ftMakes}/{player.ftAttempts}
                      </div>
                      <div className="text-[10px] text-[rgba(245,241,232,0.4)]">LF</div>
                    </div>
                  </div>
                </button>
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

      {/*
        Détail spot par spot du joueur sélectionné. Modale centrée en desktop,
        feuille glissante en mobile, comme l'écran de fin de session.
      */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 max-sm:items-end max-sm:p-0"
          onClick={() => setSelectedPlayerId(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Détail du joueur"
        >
          <div
            className="w-full max-w-2xl max-h-[88dvh] flex flex-col overflow-hidden rounded-3xl max-sm:rounded-b-none bg-gradient-to-br from-[#0d1f38] to-[#0A1628] border border-[rgba(0,191,255,0.2)] shadow-[0_20px_60px_rgba(0,0,0,0.5)] max-sm:pb-safe-b animate-in fade-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="shrink-0 bg-[rgba(0,191,255,0.08)] border-b border-[rgba(0,191,255,0.15)] p-5 sm:p-6">
              <div className="flex items-center gap-4 max-sm:gap-3">
                {selectedPlayer.photo ? (
                  <img
                    src={selectedPlayer.photo}
                    alt=""
                    className="w-14 h-14 max-sm:w-11 max-sm:h-11 shrink-0 rounded-full object-cover ring-2 ring-[#00BFFF]"
                  />
                ) : (
                  <div
                    className="w-14 h-14 max-sm:w-11 max-sm:h-11 shrink-0 rounded-full flex items-center justify-center text-lg max-sm:text-sm font-bold text-[#0A1628] ring-2 ring-[#00BFFF]"
                    style={{ backgroundColor: selectedPlayer.avatar }}
                  >
                    {selectedPlayer.firstName[0]}{selectedPlayer.lastName[0]}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl max-sm:text-base font-extrabold text-[#F5F1E8] truncate">
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </h2>
                  <p className="font-mono text-xs max-sm:text-[10px] text-[rgba(245,241,232,0.4)] mt-0.5 truncate">
                    {selectedSession === 'all'
                      ? SESSIONS_LABEL(selectedPlayer.sessionsPlayed)
                      : 'Détail de la session'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-3xl max-sm:text-2xl font-extrabold text-[#00BFFF] leading-none">
                    {selectedPlayer.totalPoints}
                  </div>
                  <div className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-wider mt-0.5">
                    Points
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlayerId(null)}
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-[rgba(245,241,232,0.06)] text-[rgba(245,241,232,0.6)] hover:bg-[rgba(245,241,232,0.12)] active:scale-90 transition-all"
                  aria-label="Fermer le détail"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Rappel des trois pourcentages généraux */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="rounded-lg bg-[rgba(0,191,255,0.06)] px-3 py-2 text-center">
                  <div className="font-mono font-bold text-[#00BFFF]">{selectedPlayer.midRate}%</div>
                  <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)]">
                    {selectedPlayer.midMakes}/{selectedPlayer.midAttempts}
                  </div>
                  <div className="text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-wider">Mid</div>
                </div>
                <div className="rounded-lg bg-[rgba(255,215,0,0.06)] px-3 py-2 text-center">
                  <div className="font-mono font-bold text-[#FFD700]">{selectedPlayer.threePointRate}%</div>
                  <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)]">
                    {selectedPlayer.threeMakes}/{selectedPlayer.threeAttempts}
                  </div>
                  <div className="text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-wider">3 pts</div>
                </div>
                <div className="rounded-lg bg-[rgba(34,197,94,0.06)] px-3 py-2 text-center">
                  <div className="font-mono font-bold text-green-400">{selectedPlayer.ftRate}%</div>
                  <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)]">
                    {selectedPlayer.ftMakes}/{selectedPlayer.ftAttempts}
                  </div>
                  <div className="text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-wider">LF</div>
                </div>
              </div>
            </div>

            {/* Liste des spots */}
            <div className="flex-1 min-h-0 scroll-area p-4 sm:p-6">
              {selectedPlayer.spots.length === 0 ? (
                <p className="text-center text-sm text-[rgba(245,241,232,0.45)] py-8">
                  Aucun spot enregistré pour ce joueur.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {selectedPlayer.spots.map((spot) => (
                    <div
                      key={spot.spotNum}
                      className="rounded-xl bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] p-3 sm:p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-[rgba(0,191,255,0.15)] border border-[#00BFFF] flex items-center justify-center font-bold text-sm text-[#00BFFF]">
                          {spot.spotNum}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm sm:text-base text-[#F5F1E8] truncate">
                            {spot.spotLabel}
                          </div>
                          <div className="font-mono text-[10px] sm:text-xs text-[rgba(245,241,232,0.4)] truncate">
                            {spot.spotSub}
                          </div>
                        </div>

                        <div className="shrink-0 text-center w-14">
                          <div className="font-mono text-base sm:text-lg font-extrabold text-[#F5F1E8] leading-none">
                            {spot.makes}<span className="text-[rgba(245,241,232,0.35)]">/{spot.shotsTotal}</span>
                          </div>
                          <div className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-wider mt-1">
                            Tirs
                          </div>
                        </div>

                        <div className="shrink-0 text-center w-12">
                          <div className="font-mono text-base sm:text-lg font-extrabold text-green-400 leading-none">
                            {spot.ftMakes}<span className="text-[rgba(245,241,232,0.35)]">/{spot.ftTotal}</span>
                          </div>
                          <div className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-wider mt-1">
                            LF
                          </div>
                        </div>

                        <div className="shrink-0 text-right w-12">
                          <div className="font-mono text-xl sm:text-2xl font-extrabold text-[#00BFFF] leading-none">
                            {spot.points}
                          </div>
                          <div className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-wider mt-1">
                            Pts
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}