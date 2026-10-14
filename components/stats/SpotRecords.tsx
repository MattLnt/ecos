'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Crown } from 'lucide-react';

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function SpotRecords() {
  const router = useRouter();
  const [records, setRecords] = useState<SpotRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/stats/spot-records');
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur fetch spot records:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  if (records.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-2xl mobile:text-lg font-bold text-[#F5F1E8]">Meilleurs scores par spot</h2>
        <p className="text-sm mobile:text-xs text-[rgba(245,241,232,0.5)] mt-1 mobile:mt-0.5">
          Le record de chaque position, et son détenteur
        </p>
      </div>

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
                {record.photo ? (
                  <img src={record.photo} alt="" className="w-7 h-7 shrink-0 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-[#0A1628]"
                    style={{ backgroundColor: record.avatar }}
                  >
                    {record.firstName[0]}{record.lastName[0]}
                  </div>
                )}
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
