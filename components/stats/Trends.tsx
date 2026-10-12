'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useMediaQuery } from '@/lib/useMediaQuery';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
}

interface TrendData {
  date: string;
  points: number;
}

export function Trends() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [comparePlayer, setComparePlayer] = useState<string>('');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [compareTrendData, setCompareTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isMobile = useMediaQuery('(max-width: 880px)');

  // Dropdowns
  const [mainOpen, setMainOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerTrend(selectedPlayer, setTrendData);
    }
  }, [selectedPlayer]);

  useEffect(() => {
    if (comparePlayer) {
      fetchPlayerTrend(comparePlayer, setCompareTrendData);
    } else {
      setCompareTrendData([]);
    }
  }, [comparePlayer]);

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/joueurs');
      const data = await res.json();
      setPlayers(data);
      if (data.length > 0) {
        setSelectedPlayer(data[0].id);
      }
    } catch (error) {
      console.error('Erreur fetch players:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerTrend = async (playerId: string, setter: (data: TrendData[]) => void) => {
    try {
      const res = await fetch(`/api/stats/player-trend?playerId=${playerId}`);
      const data = await res.json();
      setter(data);
    } catch (error) {
      console.error('Erreur fetch player trend:', error);
    }
  };

  const mergedData = trendData.map((item, index) => ({
    date: item.date,
    player1: item.points,
    player2: compareTrendData[index]?.points || null,
  }));

  const selectedPlayerObj = players.find(p => p.id === selectedPlayer);
  const comparePlayerObj = players.find(p => p.id === comparePlayer);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl mobile:text-lg font-bold text-[#F5F1E8]">Tendances</h2>

      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl mobile:rounded-xl p-6 mobile:p-3.5">
        {/* Custom Dropdowns */}
        <div className="grid grid-cols-2 gap-4 mb-6 mobile:gap-2.5 mobile:mb-4">
          {/* Joueur principal */}
          <div>
            <label className="block text-sm mobile:text-[11px] mobile:uppercase mobile:tracking-wider font-bold text-[rgba(245,241,232,0.7)] mb-2 mobile:mb-1.5">
              Joueur principal
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  setMainOpen(!mainOpen);
                  setCompareOpen(false);
                }}
                className="w-full px-4 mobile:px-2.5 py-3 mobile:py-2.5 pr-10 mobile:pr-7 bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.2)] rounded-xl mobile:rounded-lg text-[#F5F1E8] mobile:text-xs font-semibold focus:outline-none hover:bg-[rgba(0,191,255,0.1)] transition-all text-left cursor-pointer truncate"
              >
                {selectedPlayerObj ? `${selectedPlayerObj.firstName} ${selectedPlayerObj.lastName}` : 'Sélectionner...'}
              </button>
              <ChevronDown 
                size={20} 
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(245,241,232,0.5)] pointer-events-none transition-transform ${
                  mainOpen ? 'rotate-180' : ''
                }`}
              />
              
              {mainOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#0d1f38] border border-[rgba(0,191,255,0.2)] rounded-xl overflow-hidden shadow-2xl max-h-[200px] overflow-y-auto">
                  {players.map((player, index) => (
                    <button
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayer(player.id);
                        setMainOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-[#F5F1E8] font-semibold hover:bg-[rgba(0,191,255,0.1)] transition-colors ${
                        index > 0 ? 'border-t border-[rgba(0,191,255,0.1)]' : ''
                      }`}
                    >
                      {player.firstName} {player.lastName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comparer avec */}
          <div>
            <label className="block text-sm mobile:text-[11px] mobile:uppercase mobile:tracking-wider font-bold text-[rgba(245,241,232,0.7)] mb-2 mobile:mb-1.5">
              <span className="mobile:hidden">Comparer avec (optionnel)</span>
              <span className="hidden mobile:inline">Comparer</span>
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  setCompareOpen(!compareOpen);
                  setMainOpen(false);
                }}
                className="w-full px-4 mobile:px-2.5 py-3 mobile:py-2.5 pr-10 mobile:pr-7 bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.2)] rounded-xl mobile:rounded-lg text-[#F5F1E8] mobile:text-xs font-semibold focus:outline-none hover:bg-[rgba(0,191,255,0.1)] transition-all text-left cursor-pointer truncate"
              >
                {comparePlayerObj ? `${comparePlayerObj.firstName} ${comparePlayerObj.lastName}` : 'Aucun'}
              </button>
              <ChevronDown 
                size={20} 
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(245,241,232,0.5)] pointer-events-none transition-transform ${
                  compareOpen ? 'rotate-180' : ''
                }`}
              />
              
              {compareOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#0d1f38] border border-[rgba(0,191,255,0.2)] rounded-xl overflow-hidden shadow-2xl max-h-[200px] overflow-y-auto">
                  <button
                    onClick={() => {
                      setComparePlayer('');
                      setCompareOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-[#F5F1E8] font-semibold hover:bg-[rgba(0,191,255,0.1)] transition-colors"
                  >
                    Aucun
                  </button>
                  {players
                    .filter(p => p.id !== selectedPlayer)
                    .map((player) => (
                      <button
                        key={player.id}
                        onClick={() => {
                          setComparePlayer(player.id);
                          setCompareOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-[#F5F1E8] font-semibold hover:bg-[rgba(0,191,255,0.1)] transition-colors border-t border-[rgba(0,191,255,0.1)]"
                      >
                        {player.firstName} {player.lastName}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        {trendData.length === 0 ? (
          <div className="h-[210px] sm:h-[300px] flex items-center justify-center">
            <div className="text-[rgba(245,241,232,0.35)] text-sm">Aucune donnée disponible</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 210 : 300}>
            <LineChart
              data={mergedData}
              margin={isMobile ? { top: 4, right: 8, bottom: 0, left: 0 } : { top: 5, right: 10, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,191,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="rgba(245,241,232,0.35)"
                style={{ fontSize: isMobile ? '10px' : '12px' }}
                tickMargin={6}
                minTickGap={isMobile ? 12 : 5}
              />
              <YAxis
                stroke="rgba(245,241,232,0.35)"
                style={{ fontSize: isMobile ? '10px' : '12px' }}
                width={isMobile ? 30 : 60}
                tickCount={isMobile ? 4 : 6}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0d1f38', 
                  border: '1px solid rgba(0,191,255,0.2)',
                  borderRadius: '12px',
                  color: '#F5F1E8',
                  padding: isMobile ? '8px' : '12px',
                  fontSize: isMobile ? '12px' : '14px',
                }}
              />
              <Legend
                wrapperStyle={{ color: '#F5F1E8', fontSize: isMobile ? '10px' : '12px' }}
                iconSize={isMobile ? 8 : 14}
              />
              <Line 
                type="monotone" 
                dataKey="player1" 
                stroke="#00BFFF" 
                strokeWidth={isMobile ? 2 : 3}
                name={selectedPlayerObj?.firstName || ''}
                dot={{ fill: '#00BFFF', r: isMobile ? 2.5 : 4 }}
              />
              {comparePlayer && (
                <Line 
                  type="monotone" 
                  dataKey="player2" 
                  stroke="#FFD700" 
                  strokeWidth={isMobile ? 2 : 3}
                  name={comparePlayerObj?.firstName || ''}
                  dot={{ fill: '#FFD700', r: isMobile ? 2.5 : 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}