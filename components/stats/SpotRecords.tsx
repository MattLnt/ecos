'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Crown } from 'lucide-react';
import { PlayerAvatar } from '@/components/PlayerAvatar';

interface SpotRecord {
  spotNum: number;
  spotLabel: string;
  spotSub: string;
  points: number;
  makes: number;
  ftMakes: number;
  playerId: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  avatar: string;
  date: string;
  sessionId: string;
}

/** Le maximum atteignable sur un spot : dix paniers, deux lancers francs. */
const MAX_SPOT_POINTS = 20;

const PERIODS = [
  { key: 'all', label: 'Depuis toujours' },
  { key: '6m', label: '6 derniers mois' },
  { key: '1m', label: 'Ce mois-ci' },
] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function SpotRecords() {
  const router = useRouter();
  const [records, setRecords] = useState<SpotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('all');

  useEffect(() => {
    /*
      Le chargement vit dans l'effet : il dépend de la période, et une
      fonction déclarée en dehors obligerait à la lister en dépendance pour
      rien.
    */
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stats/spot-records?period=${period}`);
        const data = await res.json();
        if (cancelled) return;
        setRecords(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erreur fetch spot records:', error);
      } finally {
        // Deux changements de période rapprochés : seule la dernière réponse
        // doit éteindre le chargement.
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [period]);

  const filters = (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
      {PERIODS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setPeriod(key)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs mobile:text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 border ${
            period === key
              ? 'bg-[#00BFFF] text-[#0A1628] border-[#00BFFF]'
              : 'bg-[rgba(0,191,255,0.06)] text-[rgba(245,241,232,0.65)] border-[rgba(0,191,255,0.15)] hover:bg-[rgba(0,191,255,0.12)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const header = (
    <div className="flex items-end justify-between gap-3 mobile:flex-col mobile:items-stretch mobile:gap-2">
      <div className="min-w-0">
        <h2 className="text-2xl mobile:text-lg font-bold text-[#F5F1E8]">Meilleurs scores par spot</h2>
        <p className="text-sm mobile:text-xs text-[rgba(245,241,232,0.5)] mt-1 mobile:mt-0.5">
          Le record de chaque position, et son détenteur
        </p>
      </div>
      {filters}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {header}
        <div className="h-32 flex items-center justify-center">
          <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {header}

      {records.length === 0 && (
        <div className="rounded-xl border border-[rgba(0,191,255,0.15)] bg-[rgba(0,191,255,0.04)] p-8 text-center text-sm text-[rgba(245,241,232,0.45)]">
          Aucune session sur cette période.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mobile:gap-2">
        {records.map((record) => {
          const share = Math.min(100, (record.points / MAX_SPOT_POINTS) * 100);
          const isPerfect = record.points === MAX_SPOT_POINTS;

          return (
            <button
              key={record.spotNum}
              type="button"
              onClick={() => router.push(`/joueurs/${record.playerId}`)}
              className={`text-left rounded-xl p-3 mobile:p-2.5 border transition-all active:scale-[0.98] ${
                isPerfect
                  ? 'bg-gradient-to-br from-[rgba(255,215,0,0.14)] to-[rgba(255,215,0,0.04)] border-[rgba(255,215,0,0.4)]'
                  : 'bg-[rgba(0,191,255,0.04)] border-[rgba(0,191,255,0.15)] hover:border-[rgba(0,191,255,0.35)] hover:bg-[rgba(0,191,255,0.08)]'
              }`}
            >
              {/* Spot */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 shrink-0 rounded-md bg-[rgba(0,191,255,0.12)] flex items-center justify-center font-mono text-[11px] font-bold text-[#00BFFF]">
                  {record.spotNum}
                </span>
                <span className="min-w-0 text-[11px] font-bold text-[rgba(245,241,232,0.8)] truncate">
                  {record.spotLabel}
                </span>
                {isPerfect && <Crown size={13} className="shrink-0 text-[#FFD700]" />}
              </div>

              {/* Score */}
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-mono text-2xl mobile:text-xl font-extrabold leading-none"
                  style={{ color: isPerfect ? '#FFD700' : '#00BFFF' }}
                >
                  {record.points}
                </span>
                <span className="font-mono text-[10px] text-[rgba(245,241,232,0.4)]">PTS</span>
              </div>

              <div className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] mt-0.5">
                {record.makes}/10 · {record.ftMakes}/2 LF
              </div>

              {/* Barre de remplissage, sur les 20 points possibles. */}
              <div className="mt-2 h-1.5 rounded-full bg-[rgba(245,241,232,0.07)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${share}%`, backgroundColor: isPerfect ? '#FFD700' : '#00BFFF' }}
                />
              </div>

              {/* Détenteur */}
              <div className="flex items-center gap-2 mt-2.5">
                <PlayerAvatar
                  photo={record.photo}
                  avatar={record.avatar}
                  firstName={record.firstName}
                  lastName={record.lastName}
                  className="w-7 h-7 text-sm"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F5F1E8] truncate leading-tight">
                    {record.firstName}
                  </div>
                  <div className="font-mono text-[9px] text-[rgba(245,241,232,0.35)] truncate">
                    {formatDate(record.date)}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
