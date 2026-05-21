'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown } from 'lucide-react';

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
      <h2 className="text-2xl font-bold text-[#F5F1E8]">Tendances</h2>

      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
        {/* Custom Dropdowns */}
        <div className="grid grid-cols-2 gap-4 mb-6 mobile:grid-cols-1">
          {/* Joueur principal */}
          <div>
            <label className="block text-sm font-bold text-[rgba(245,241,232,0.7)] mb-2">
              Joueur principal
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  setMainOpen(!mainOpen);
                  setCompareOpen(false);
                }}
                className="w-full px-4 py-3 pr-10 bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.2)] rounded-xl text-[#F5F1E8] font-semibold focus:outline-none hover:bg-[rgba(0,191,255,0.1)] transition-all text-left cursor-pointer"
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
            <label className="block text-sm font-bold text-[rgba(245,241,232,0.7)] mb-2">
              Comparer avec (optionnel)
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  setCompareOpen(!compareOpen);
                  setMainOpen(false);
                }}
                className="w-full px-4 py-3 pr-10 bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.2)] rounded-xl text-[#F5F1E8] font-semibold focus:outline-none hover:bg-[rgba(0,191,255,0.1)] transition-all text-left cursor-pointer"
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
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-[rgba(245,241,232,0.35)] text-sm">Aucune donnée disponible</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,191,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(245,241,232,0.35)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(245,241,232,0.35)" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0d1f38', 
                  border: '1px solid rgba(0,191,255,0.2)',
                  borderRadius: '12px',
                  color: '#F5F1E8',
                  padding: '12px',
                }}
              />
              <Legend wrapperStyle={{ color: '#F5F1E8', fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="player1" 
                stroke="#00BFFF" 
                strokeWidth={3}
                name={selectedPlayerObj?.firstName || ''}
                dot={{ fill: '#00BFFF', r: 4 }}
              />
              {comparePlayer && (
                <Line 
                  type="monotone" 
                  dataKey="player2" 
                  stroke="#FFD700" 
                  strokeWidth={3}
                  name={comparePlayerObj?.firstName || ''}
                  dot={{ fill: '#FFD700', r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}