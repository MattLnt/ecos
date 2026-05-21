'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SpotData {
  spotNum: number;
  spotLabel: string;
  rate: number;
}

interface SpotPerformanceChartProps {
  data: SpotData[];
}

export function SpotPerformanceChart({ data }: SpotPerformanceChartProps) {
  return (
    <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
      <h3 className="text-lg font-bold text-[#F5F1E8] mb-4">Performance par spot</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,191,255,0.1)" />
          <XAxis 
            dataKey="spotLabel" 
            stroke="rgba(245,241,232,0.35)" 
            style={{ fontSize: '11px' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
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
          <Bar dataKey="rate" fill="#00BFFF" radius={[8, 8, 0, 0]} name="Taux de réussite %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}