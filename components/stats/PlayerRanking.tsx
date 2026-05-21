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

  const sortedByGeneral = [...players].sort((a, b) => {
    return b[generalFilter] - a[generalFilter];
  });

  const sortedBySpot = [...players].sort((a, b) => {
    if (spotFilter === '') return 0;
    const aRate = a.spotRates[spotFilter] || 0;
    const bRate = b.spotRates[spotFilter] || 0;
    return bRate - aRate;
  });

  const spotOptions = players.length > 0 && players[0].spotNames
    ? Object.entries(players[0].spotNames)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([num, info]) => ({
          num: parseInt(num),
          label: info.label,
          sub: info.sub,
        }))
    : [];

  const getSpotColor = (spotNum: number) => {
    const spot = spotOptions.find(s => s.num === spotNum);
    if (!spot) return '#00BFFF';
    
    if (spot.label.includes('MID')) return '#00BFFF';
    if (spot.label.includes('3PTS')) return '#FFD700';
    return '#00BFFF';
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-[#F5F1E8]">Classement des joueurs</h2>

      {/* ========== SECTION 1 : STATS GÉNÉRALES ========== */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[rgba(245,241,232,0.7)]">Statistiques générales</h3>
        
        {/* Filtres boutons */}
        <div className="flex items-center gap-3 mobile:overflow-x-auto mobile:pb-2">
          <button
            onClick={() => setGeneralFilter('midRate')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
              generalFilter === 'midRate'
                ? 'bg-[#00BFFF] text-[#0A1628] border-[#00BFFF] shadow-lg shadow-[rgba(0,191,255,0.3)]'
                : 'bg-[rgba(0,191,255,0.08)] text-[rgba(245,241,232,0.7)] border-[rgba(0,191,255,0.15)] hover:bg-[rgba(0,191,255,0.15)]'
            }`}
          >
            % Mid-Range
          </button>

          <button
            onClick={() => setGeneralFilter('threePointRate')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
              generalFilter === 'threePointRate'
                ? 'bg-[#FFD700] text-[#0A1628] border-[#FFD700] shadow-lg shadow-[rgba(255,215,0,0.3)]'
                : 'bg-[rgba(255,215,0,0.08)] text-[rgba(245,241,232,0.7)] border-[rgba(255,215,0,0.15)] hover:bg-[rgba(255,215,0,0.15)]'
            }`}
          >
            % 3 Points
          </button>

          <button
            onClick={() => setGeneralFilter('ftRate')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
              generalFilter === 'ftRate'
                ? 'bg-[#22C55E] text-[#0A1628] border-[#22C55E] shadow-lg shadow-[rgba(34,197,94,0.3)]'
                : 'bg-[rgba(34,197,94,0.08)] text-[rgba(245,241,232,0.7)] border-[rgba(34,197,94,0.15)] hover:bg-[rgba(34,197,94,0.15)]'
            }`}
          >
            % Lancers Francs
          </button>
        </div>

        {/* Tableau stats générales */}
        <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_120px_120px_120px] gap-4 p-4 border-b border-[rgba(0,191,255,0.15)] bg-[rgba(0,191,255,0.04)] mobile:hidden">
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
                className="grid grid-cols-[60px_1fr_120px_120px_120px] gap-4 p-4 hover:bg-[rgba(0,191,255,0.04)] transition-colors mobile:grid-cols-1 mobile:gap-2"
              >
                <div className={`font-mono font-bold text-lg ${
                  index === 0 ? 'text-[#FFD700]' :
                  index === 1 ? 'text-[#C0C0C0]' :
                  index === 2 ? 'text-[#CD7F32]' :
                  'text-[rgba(245,241,232,0.35)]'
                }`}>
                  #{index + 1}
                </div>

                <div className="flex items-center gap-3">
                  {player.photo ? (
                    <img src={player.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#0A1628]"
                      style={{ backgroundColor: player.avatar }}
                    >
                      {player.firstName[0]}{player.lastName[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-[#F5F1E8]">{player.firstName} {player.lastName}</div>
                  </div>
                </div>

                <div className="font-mono text-lg font-bold text-[#00BFFF]">
                  {player.midRate.toFixed(1)}%
                </div>

                <div className="font-mono text-lg font-bold text-[#FFD700]">
                  {player.threePointRate.toFixed(1)}%
                </div>

                <div className="font-mono text-lg font-bold text-green-400">
                  {player.ftRate.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== SECTION 2 : PAR SPOT ========== */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[rgba(245,241,232,0.7)]">Par spot</h3>
        
        {/* Filtres boutons avec scroll horizontal */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex items-center gap-2 min-w-max">
            {spotOptions.map((spot) => {
              const color = spot.label.includes('MID') ? '#00BFFF' : 
                           spot.label.includes('3PTS') ? '#FFD700' : '#00BFFF';
              const isActive = spotFilter === spot.num;
              
              return (
                <button
                  key={spot.num}
                  onClick={() => setSpotFilter(spot.num)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border"
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

        {/* Tableau par spot */}
        {spotFilter !== '' && (
          <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl overflow-hidden">
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
                    className="grid grid-cols-[60px_1fr_150px] gap-4 p-4 hover:bg-[rgba(0,191,255,0.04)] transition-colors mobile:grid-cols-1 mobile:gap-2"
                  >
                    <div className={`font-mono font-bold text-lg ${
                      index === 0 ? 'text-[#FFD700]' :
                      index === 1 ? 'text-[#C0C0C0]' :
                      index === 2 ? 'text-[#CD7F32]' :
                      'text-[rgba(245,241,232,0.35)]'
                    }`}>
                      #{index + 1}
                    </div>

                    <div className="flex items-center gap-3">
                      {player.photo ? (
                        <img src={player.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#0A1628]"
                          style={{ backgroundColor: player.avatar }}
                        >
                          {player.firstName[0]}{player.lastName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-[#F5F1E8]">{player.firstName} {player.lastName}</div>
                      </div>
                    </div>

                    <div 
                      className="font-mono text-lg font-bold"
                      style={{ color }}
                    >
                      {rate.toFixed(1)}%
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