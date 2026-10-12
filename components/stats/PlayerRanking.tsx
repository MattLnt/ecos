'use client';

import { useState, useEffect } from 'react';

interface PlayerStat {
  playerId: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  avatar: string;
  midRate: number;
  threePointRate: number;
  ftRate: number;
  spotRates: Record<number, number>;
  spotNames: Record<number, { label: string; sub: string }>;
}

type GeneralKey = 'midRate' | 'threePointRate' | 'ftRate';

const isThreeLabel = (label: string) => label?.includes('3 PTS') || label?.includes('3PTS');

const GENERAL_FILTERS: { key: GeneralKey; label: string; short: string; color: string }[] = [
  { key: 'midRate', label: '% Mid-Range', short: 'Mid', color: '#00BFFF' },
  { key: 'threePointRate', label: '% 3 Points', short: '3 pts', color: '#FFD700' },
  { key: 'ftRate', label: '% Lancers Francs', short: 'LF', color: '#22C55E' },
];

/** Or, argent, bronze pour le podium, gris ensuite. */
function rankColor(index: number) {
  if (index === 0) return 'text-[#FFD700]';
  if (index === 1) return 'text-[#C0C0C0]';
  if (index === 2) return 'text-[#CD7F32]';
  return 'text-[rgba(245,241,232,0.35)]';
}

function Avatar({ player, size }: { player: PlayerStat; size: string }) {
  if (player.photo) {
    return <img src={player.photo} alt="" className={`${size} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center text-xs font-bold text-[#0A1628] shrink-0`}
      style={{ backgroundColor: player.avatar }}
    >
      {player.firstName[0]}{player.lastName[0]}
    </div>
  );
}

export function PlayerRanking() {
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [generalFilter, setGeneralFilter] = useState<GeneralKey>('midRate');
  const [spotFilter, setSpotFilter] = useState<number | ''>(1);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/stats/players-detailed');
      const data = await res.json();
      setPlayers(data);
    } catch (error) {
      console.error('Erreur fetch players:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedByGeneral = [...players].sort((a, b) => b[generalFilter] - a[generalFilter]);

  const sortedBySpot = [...players].sort((a, b) => {
    if (spotFilter === '') return 0;
    return (b.spotRates[spotFilter] || 0) - (a.spotRates[spotFilter] || 0);
  });

  const spotOptions =
    players.length > 0 && players[0].spotNames
      ? Object.entries(players[0].spotNames)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([num, info]) => ({ num: parseInt(num), label: info.label, sub: info.sub }))
      : [];

  const getSpotColor = (spotNum: number) => {
    const spot = spotOptions.find((s) => s.num === spotNum);
    if (!spot) return '#00BFFF';
    return isThreeLabel(spot.label) ? '#FFD700' : '#00BFFF';
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mobile:space-y-5">
      <h2 className="text-2xl mobile:text-lg font-bold text-[#F5F1E8]">Classement des joueurs</h2>

      {/* ========== STATS GÉNÉRALES ========== */}
      <div className="space-y-3">
        <h3 className="text-sm mobile:text-xs font-bold text-[rgba(245,241,232,0.7)] mobile:uppercase mobile:tracking-wider">
          Statistiques générales
        </h3>

        {/* Le tri. Trois boutons pleine largeur sur mobile : plus de rangée
            qui déborde, et on voit d'un coup le critère actif. */}
        <div className="flex items-center gap-3 mobile:grid mobile:grid-cols-3 mobile:gap-1.5">
          {GENERAL_FILTERS.map(({ key, label, short, color }) => {
            const active = generalFilter === key;
            return (
              <button
                key={key}
                onClick={() => setGeneralFilter(key)}
                className="px-5 py-2.5 mobile:px-2 mobile:py-2 rounded-xl mobile:rounded-lg text-sm mobile:text-xs font-bold transition-all whitespace-nowrap border"
                style={{
                  backgroundColor: active ? color : `${color}14`,
                  color: active ? '#0A1628' : 'rgba(245,241,232,0.7)',
                  borderColor: active ? color : `${color}26`,
                  boxShadow: active ? `0 4px 18px ${color}4d` : 'none',
                }}
              >
                <span className="mobile:hidden">{label}</span>
                <span className="hidden mobile:inline">{short}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop : tableau */}
        <div className="mobile:hidden bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_120px_120px_120px] gap-4 p-4 border-b border-[rgba(0,191,255,0.15)] bg-[rgba(0,191,255,0.04)]">
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">#</div>
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">Joueur</div>
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% Mid</div>
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% 3pts</div>
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% LF</div>
          </div>

          <div className="divide-y divide-[rgba(0,191,255,0.08)]">
            {sortedByGeneral.map((player, index) => (
              <div
                key={player.playerId}
                className="grid grid-cols-[60px_1fr_120px_120px_120px] gap-4 p-4 hover:bg-[rgba(0,191,255,0.04)] transition-colors items-center"
              >
                <div className={`font-mono font-bold text-lg ${rankColor(index)}`}>#{index + 1}</div>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar player={player} size="w-10 h-10" />
                  <div className="font-bold text-[#F5F1E8] truncate">
                    {player.firstName} {player.lastName}
                  </div>
                </div>
                <div className="font-mono text-lg font-bold text-[#00BFFF]">{player.midRate.toFixed(1)}%</div>
                <div className="font-mono text-lg font-bold text-[#FFD700]">{player.threePointRate.toFixed(1)}%</div>
                <div className="font-mono text-lg font-bold text-green-400">{player.ftRate.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/*
          Mobile : le tableau en `grid-cols-1` empilait le rang, le joueur puis
          trois pourcentages nus — impossible de savoir lequel était lequel, et
          près de 900px par joueur. Une carte par joueur, avec les trois taux
          étiquetés côte à côte et le critère de tri mis en avant.
        */}
        <div className="hidden mobile:block space-y-2">
          {sortedByGeneral.map((player, index) => (
            <div
              key={player.playerId}
              className="bg-gradient-to-br from-[rgba(0,191,255,0.05)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-xl p-3"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className={`font-mono text-sm font-extrabold w-7 shrink-0 ${rankColor(index)}`}>
                  #{index + 1}
                </span>
                <Avatar player={player} size="w-8 h-8" />
                <span className="font-bold text-sm text-[#F5F1E8] truncate">
                  {player.firstName} {player.lastName}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {GENERAL_FILTERS.map(({ key, short, color }) => {
                  const active = generalFilter === key;
                  return (
                    <div
                      key={key}
                      className="rounded-lg px-2 py-1.5 text-center transition-colors"
                      style={{
                        backgroundColor: active ? `${color}1f` : 'rgba(245,241,232,0.03)',
                        boxShadow: active ? `inset 0 0 0 1px ${color}59` : 'none',
                      }}
                    >
                      <div className="font-mono text-base font-extrabold leading-none" style={{ color }}>
                        {player[key].toFixed(1)}
                        <span className="text-[10px] opacity-60">%</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[rgba(245,241,232,0.45)] mt-1">
                        {short}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== PAR SPOT ========== */}
      <div className="space-y-3">
        <h3 className="text-sm mobile:text-xs font-bold text-[rgba(245,241,232,0.7)] mobile:uppercase mobile:tracking-wider">
          Par spot
        </h3>

        <div className="overflow-x-auto pb-2 -mx-2 px-2 mobile:-mx-4 mobile:px-4">
          <div className="flex items-center gap-2 min-w-max">
            {spotOptions.map((spot) => {
              const color = isThreeLabel(spot.label) ? '#FFD700' : '#00BFFF';
              const isActive = spotFilter === spot.num;

              return (
                <button
                  key={spot.num}
                  onClick={() => setSpotFilter(spot.num)}
                  className="px-4 py-2.5 mobile:px-3 mobile:py-2 rounded-xl mobile:rounded-lg text-xs mobile:text-[11px] font-bold transition-all whitespace-nowrap border text-left"
                  style={{
                    backgroundColor: isActive ? color : `${color}15`,
                    color: isActive ? '#0A1628' : 'rgba(245,241,232,0.7)',
                    borderColor: isActive ? color : `${color}30`,
                    boxShadow: isActive ? `0 4px 20px ${color}50` : 'none',
                  }}
                >
                  <div className="font-extrabold">{spot.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{spot.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {spotFilter !== '' && (
          <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl mobile:rounded-xl overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_150px] gap-4 p-4 border-b border-[rgba(0,191,255,0.15)] bg-[rgba(0,191,255,0.04)] mobile:hidden">
              <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">#</div>
              <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">Joueur</div>
              <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% Réussite</div>
            </div>

            <div className="divide-y divide-[rgba(0,191,255,0.08)]">
              {sortedBySpot.map((player, index) => {
                const rate = player.spotRates[spotFilter as number] || 0;
                const color = getSpotColor(spotFilter as number);

                return (
                  <div
                    key={player.playerId}
                    className="grid grid-cols-[60px_1fr_150px] gap-4 p-4 items-center hover:bg-[rgba(0,191,255,0.04)] transition-colors mobile:flex mobile:gap-2.5 mobile:p-2.5"
                  >
                    <div className={`font-mono font-bold text-lg mobile:text-sm mobile:w-7 mobile:shrink-0 ${rankColor(index)}`}>
                      #{index + 1}
                    </div>

                    <div className="flex items-center gap-3 mobile:gap-2 min-w-0 mobile:flex-1">
                      <Avatar player={player} size="w-10 h-10 mobile:w-8 mobile:h-8" />
                      <div className="font-bold text-[#F5F1E8] mobile:text-sm truncate">
                        {player.firstName} {player.lastName}
                      </div>
                    </div>

                    {/* Mobile : barre de niveau sous le pourcentage, pour comparer d'un coup d'œil */}
                    <div className="font-mono text-lg mobile:text-base font-bold mobile:shrink-0 mobile:w-20 mobile:text-right" style={{ color }}>
                      {rate.toFixed(1)}%
                      <div className="hidden mobile:block mt-1 h-1 rounded-full bg-[rgba(245,241,232,0.07)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, rate))}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
