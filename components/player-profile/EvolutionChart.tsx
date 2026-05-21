'use client';

import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EvolutionData {
  date: string;
  points: number;
}

interface EvolutionChartProps {
  data: EvolutionData[];
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  return (
    <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
      <h3 className="text-lg font-bold text-[#F5F1E8] mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-[#00BFFF]" />
        Évolution des performances
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
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
          <Line 
            type="monotone" 
            dataKey="points" 
            stroke="#00BFFF" 
            strokeWidth={3}
            dot={{ fill: '#00BFFF', r: 4 }}
            name="Points"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}