'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CalendarDays, Crosshair, Target, Zap } from 'lucide-react';
import { useMediaQuery } from '@/lib/useMediaQuery';

interface OverviewData {
  totalSessions: number;
  midRate: number;
  midMakes: number;
  midAttempts: number;
  threePointRate: number;
  threeMakes: number;
  threeAttempts: number;
  ftRate: number;
  ftMakes: number;
  ftAttempts: number;
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
  const isMobile = useMediaQuery('(max-width: 880px)');

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
      <div className="h-48 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  /*
    Quatre chiffres clés. Sur mobile, l'ancienne version empilait une grosse
    pastille d'icône identique au-dessus de chaque valeur : 400px d'écran pour
    quatre nombres. L'icône passe en filigrane dans le coin, la carte se
    resserre, et le libellé tient sur une ligne.
  */
  const kpis = [
    { icon: CalendarDays, value: String(data.totalSessions), volume: null, label: 'Sessions', color: '#00BFFF' },
    {
      icon: Target,
      value: `${data.midRate.toFixed(1)}%`,
      volume: `${data.midMakes}/${data.midAttempts} tirs`,
      label: 'Mid-range',
      color: '#00BFFF',
    },
    {
      icon: Zap,
      value: `${data.threePointRate.toFixed(1)}%`,
      volume: `${data.threeMakes}/${data.threeAttempts} tirs`,
      label: '3 points',
      color: '#FFD700',
    },
    {
      icon: Crosshair,
      value: `${data.ftRate.toFixed(1)}%`,
      volume: `${data.ftMakes}/${data.ftAttempts} LF`,
      label: 'Lancers francs',
      color: '#22C55E',
    },
  ];

  const periodUnit =
    period === '7d' || period === '15d' || period === '30d'
      ? 'jour'
      : period === '3m' || period === '6m'
      ? 'semaine'
      : 'mois';

  return (
    <div className="space-y-5 mobile:space-y-4">
      {/* Chiffres clés */}
      <div className="grid grid-cols-4 gap-4 mobile:grid-cols-2 mobile:gap-2.5">
        {kpis.map(({ icon: Icon, value, volume, label, color }) => (
          <div
            key={label}
            className="relative overflow-hidden bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.03)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-5 mobile:rounded-xl mobile:p-3.5"
          >
            <Icon
              size={64}
              className="absolute -right-3 -bottom-3 opacity-[0.07] mobile:w-12 mobile:h-12"
              style={{ color }}
            />
            <div className="relative">
              <div
                className="font-mono text-3xl mobile:text-2xl font-extrabold leading-none"
                style={{ color }}
              >
                {value}
              </div>
              {/* Le volume sous le taux : sans lui, 100 % sur deux tirs se lit
                  comme un sans-faute. */}
              {volume && (
                <div className="font-mono text-[11px] mobile:text-[10px] text-[rgba(245,241,232,0.35)] mt-1">
                  {volume}
                </div>
              )}
              <div className="text-sm mobile:text-[11px] text-[rgba(245,241,232,0.55)] mt-2 mobile:mt-1.5 mobile:uppercase mobile:tracking-wider mobile:leading-tight">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Évolution */}
      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6 mobile:rounded-xl mobile:p-3.5">
        <div className="flex items-start justify-between gap-4 mb-5 mobile:flex-col mobile:gap-3 mobile:mb-3">
          <div>
            <h2 className="text-lg mobile:text-base font-bold text-[#F5F1E8]">
              Évolution des taux de réussite
            </h2>
            <p className="text-sm mobile:text-xs text-[rgba(245,241,232,0.55)] mt-1 mobile:mt-0.5">
              Par {periodUnit}
            </p>
          </div>

          {/*
            Sept périodes : en `flex-wrap` elles prenaient deux lignes sur
            mobile. Une seule rangée qui défile, débordant jusqu'aux bords de
            la carte pour montrer qu'il y a une suite.
          */}
          <div className="flex items-center gap-2 flex-wrap mobile:flex-nowrap mobile:w-full mobile:overflow-x-auto mobile:-mx-3.5 mobile:px-3.5 mobile:pb-1 shrink-0">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
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

        <ResponsiveContainer width="100%" height={isMobile ? 210 : 300}>
          <LineChart
            data={data.evolution}
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
              dataKey="midRate"
              stroke="#00BFFF"
              strokeWidth={isMobile ? 2 : 3}
              name="Mid-range"
              dot={{ fill: '#00BFFF', r: isMobile ? 2.5 : 4 }}
            />
            <Line
              type="monotone"
              dataKey="threePointRate"
              stroke="#FFD700"
              strokeWidth={isMobile ? 2 : 3}
              name="3 points"
              dot={{ fill: '#FFD700', r: isMobile ? 2.5 : 4 }}
            />
            <Line
              type="monotone"
              dataKey="ftRate"
              stroke="#22C55E"
              strokeWidth={isMobile ? 2 : 3}
              name="Lancers francs"
              dot={{ fill: '#22C55E', r: isMobile ? 2.5 : 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
