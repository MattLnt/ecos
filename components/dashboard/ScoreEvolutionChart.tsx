'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const periods = [
  { value: '7d', label: '7 jours' },
  { value: '15d', label: '15 jours' },
  { value: '30d', label: '30 jours' },
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '12m', label: '12 mois' },
  { value: '24m', label: '24 mois' },
];

interface ChartData {
  date: string;
  avg: number;
}

export function ScoreEvolutionChart() {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/score-evolution?period=${period}`);
      const chartData = await res.json();
      setData(chartData);
    } catch (error) {
      console.error('Erreur fetch score evolution:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6 backdrop-blur-sm">
      {/* Header avec filtres */}
      <div className="flex items-center justify-between mb-6 mobile:flex-col mobile:items-start mobile:gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#F5F1E8]">Évolution des scores</h2>
          <p className="text-sm text-[rgba(245,241,232,0.55)] mt-1">
            Moyenne par {period === '7d' || period === '15d' || period === '30d' ? 'jour' : period === '3m' || period === '6m' ? 'semaine' : 'mois'}
          </p>
        </div>

        {/* Filtres période */}
        <div className="flex items-center gap-2 flex-wrap">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.value
                  ? 'bg-[#00BFFF] text-[#0A1628]'
                  : 'bg-[rgba(0,191,255,0.08)] text-[rgba(245,241,232,0.7)] hover:bg-[rgba(0,191,255,0.15)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-[280px] flex items-center justify-center">
          <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center">
          <div className="text-[rgba(245,241,232,0.35)] text-sm">Aucune donnée disponible</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,191,255,0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="rgba(245,241,232,0.35)" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="rgba(245,241,232,0.35)" 
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
            contentStyle={{ 
                backgroundColor: '#0d1f38', 
                border: '1px solid rgba(0,191,255,0.2)',
                borderRadius: '12px',
                color: '#F5F1E8',
                padding: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
            labelStyle={{
                color: '#F5F1E8',
                fontWeight: 'bold',
                marginBottom: '4px'
            }}
            itemStyle={{
                color: '#00BFFF',
                fontWeight: '600'
            }}
            cursor={{ fill: 'rgba(0,191,255,0.05)' }}
            />
            <Line 
              type="monotone" 
              dataKey="avg" 
              stroke="#00BFFF" 
              strokeWidth={3}
              dot={{ fill: '#00BFFF', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}