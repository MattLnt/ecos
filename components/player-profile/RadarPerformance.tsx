'use client';

import { Target } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface RadarData {
  category: string;
  value: number;
}

interface RadarPerformanceProps {
  data: RadarData[];
}

export function RadarPerformance({ data }: RadarPerformanceProps) {
  return (
    <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6">
      <h3 className="text-lg font-bold text-[#F5F1E8] mb-4 flex items-center gap-2">
        <Target size={20} className="text-[#00BFFF]" />
        Vue d'ensemble
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(0,191,255,0.2)" />
          <PolarAngleAxis 
            dataKey="category" 
            stroke="rgba(245,241,232,0.7)"
            style={{ fontSize: '12px' }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            stroke="rgba(245,241,232,0.35)"
            style={{ fontSize: '10px' }}
          />
          <Radar 
            name="Performance" 
            dataKey="value" 
            stroke="#00BFFF" 
            fill="#00BFFF" 
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}