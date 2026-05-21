'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target } from 'lucide-react';

interface OverviewData {
  totalSessions: number;
  midRate: number;
  threePointRate: number;
  ftRate: number;
  evolution: Array<{ 
    date: string; 
    midRate: number; 
    threePointRate: number; 
    ftRate: number; 
  }>;
}

const periods = [
  { value: '7d', label: '7 jours' },
  { value: '15d', label: '15 jours' },
  { value: '30d', label: '30 jours' },
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '12m', label: '12 mois' },
  { value: '24m', label: '24 mois' },
];

export function OverviewStats() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/overview?period=${period}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Erreur fetch overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-5 mobile:grid-cols-2">
        <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
          <div className="w-12 h-12 bg-[rgba(0,191,255,0.15)] rounded-xl flex items-center justify-center mb-4">
            <Target size={24} className="text-[#00BFFF]" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#F5F1E8] mb-1">
            {data.totalSessions}
          </div>
          <div className="text-sm text-[rgba(245,241,232,0.55)]">Sessions totales</div>
        </div>

        <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
          <div className="w-12 h-12 bg-[rgba(0,191,255,0.15)] rounded-xl flex items-center justify-center mb-4">
            <Target size={24} className="text-[#00BFFF]" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#F5F1E8] mb-1">
            {data.midRate.toFixed(1)}%
          </div>
          <div className="text-sm text-[rgba(245,241,232,0.55)]">Taux Mid-Range</div>
        </div>

        <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
          <div className="w-12 h-12 bg-[rgba(0,191,255,0.15)] rounded-xl flex items-center justify-center mb-4">
            <Target size={24} className="text-[#00BFFF]" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#F5F1E8] mb-1">
            {data.threePointRate.toFixed(1)}%
          </div>
          <div className="text-sm text-[rgba(245,241,232,0.55)]">Taux 3 points</div>
        </div>

        <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
          <div className="w-12 h-12 bg-[rgba(0,191,255,0.15)] rounded-xl flex items-center justify-center mb-4">
            <Target size={24} className="text-[#00BFFF]" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-[#F5F1E8] mb-1">
            {data.ftRate.toFixed(1)}%
          </div>
          <div className="text-sm text-[rgba(245,241,232,0.55)]">Taux Lancers Francs</div>
        </div>
      </div>

      {/* Evolution chart */}
      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6 mobile:flex-col mobile:items-start mobile:gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#F5F1E8]">Évolution des taux de réussite</h2>
            <p className="text-sm text-[rgba(245,241,232,0.55)] mt-1">
              Par {period === '7d' || period === '15d' || period === '30d' ? 'jour' : period === '3m' || period === '6m' ? 'semaine' : 'mois'}
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

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.evolution}>
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
            <Line type="monotone" dataKey="midRate" stroke="#00BFFF" strokeWidth={3} name="Mid-Range %" dot={{ fill: '#00BFFF', r: 4 }} />
            <Line type="monotone" dataKey="threePointRate" stroke="#FFD700" strokeWidth={3} name="3 points %" dot={{ fill: '#FFD700', r: 4 }} />
            <Line type="monotone" dataKey="ftRate" stroke="#22C55E" strokeWidth={3} name="Lancers Francs %" dot={{ fill: '#22C55E', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}