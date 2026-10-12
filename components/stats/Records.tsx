'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Target, TrendingDown, type LucideIcon } from 'lucide-react';

interface RecordsData {
  bestScore: { points: number; playerName: string; date: string; sessionId: string } | null;
  worstScore: { points: number; playerName: string; date: string; sessionId: string } | null;
  longestWinStreak: { count: number; playerName: string } | null;
  bestFtRate: { rate: number; playerName: string; totalAttempts: number } | null;
}

interface RecordCard {
  icon: LucideIcon;
  title: string;
  color: string;
  tint: string;
  value: string | null;
  who: string;
  detail: string;
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

export function Records() {
  const [records, setRecords] = useState<RecordsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/stats/records');
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error('Erreur fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  if (!records) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Aucune donnée disponible</div>
      </div>
    );
  }

  /*
    Quatre records de même forme : titre, chiffre, détenteur, précision. Les
    décrire en données plutôt qu'en quatre blocs de JSON copiés évite que les
    tailles divergent entre les cartes, ce qui était le cas.
  */
  const cards: RecordCard[] = [
    {
      icon: Trophy,
      title: 'Meilleur score',
      color: '#FFD700',
      tint: 'rgba(255,215,0',
      value: records.bestScore ? String(records.bestScore.points) : null,
      who: records.bestScore?.playerName ?? '',
      detail: records.bestScore ? shortDate(records.bestScore.date) : '',
    },
    {
      icon: TrendingDown,
      title: 'Pire score',
      color: '#F87171',
      tint: 'rgba(239,68,68',
      value: records.worstScore ? String(records.worstScore.points) : null,
      who: records.worstScore?.playerName ?? '',
      detail: records.worstScore ? shortDate(records.worstScore.date) : '',
    },
    {
      icon: Flame,
      title: 'Plus longue série',
      color: '#FB923C',
      tint: 'rgba(251,146,60',
      value:
        records.longestWinStreak && records.longestWinStreak.count > 0
          ? String(records.longestWinStreak.count)
          : null,
      who: records.longestWinStreak?.playerName ?? '',
      detail: 'victoires d’affilée',
    },
    {
      icon: Target,
      title: 'Meilleur taux LF',
      color: '#22C55E',
      tint: 'rgba(34,197,94',
      value:
        records.bestFtRate && records.bestFtRate.rate > 0
          ? `${records.bestFtRate.rate.toFixed(1)}%`
          : null,
      who: records.bestFtRate?.playerName ?? '',
      detail: records.bestFtRate ? `sur ${records.bestFtRate.totalAttempts} tentatives` : '',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl mobile:text-lg font-bold text-[#F5F1E8]">Records</h2>

      {/* Deux colonnes y compris sur mobile : quatre cartes pleine largeur
          faisaient défiler près de 900px pour quatre chiffres. */}
      <div className="grid grid-cols-2 gap-4 mobile:gap-2.5">
        {cards.map(({ icon: Icon, title, color, tint, value, who, detail }) => (
          <div
            key={title}
            className="relative overflow-hidden rounded-2xl mobile:rounded-xl p-5 mobile:p-3 border"
            style={{
              borderColor: `${tint},0.2)`,
              background: `linear-gradient(135deg, ${tint},0.1) 0%, ${tint},0.02) 100%)`,
            }}
          >
            <Icon
              size={56}
              className="absolute -right-2 -bottom-2 opacity-[0.08] mobile:w-10 mobile:h-10"
              style={{ color }}
            />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2.5 mobile:mb-2">
                <Icon size={16} style={{ color }} className="shrink-0 mobile:w-3.5 mobile:h-3.5" />
                <span className="text-sm mobile:text-[11px] text-[rgba(245,241,232,0.55)] mobile:uppercase mobile:tracking-wider truncate">
                  {title}
                </span>
              </div>

              {value === null ? (
                <div className="text-sm mobile:text-xs text-[rgba(245,241,232,0.35)] py-2">
                  Aucune donnée
                </div>
              ) : (
                <>
                  <div
                    className="font-mono text-4xl mobile:text-2xl font-extrabold leading-none"
                    style={{ color }}
                  >
                    {value}
                  </div>
                  <div className="font-bold text-sm mobile:text-xs text-[#F5F1E8] mt-2 mobile:mt-1.5 truncate">
                    {who}
                  </div>
                  <div className="text-xs mobile:text-[10px] text-[rgba(245,241,232,0.45)] mt-0.5 truncate">
                    {detail}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* La date complète reste lisible en desktop, hors des cartes resserrées */}
      {records.bestScore && (
        <p className="mobile:hidden text-xs text-[rgba(245,241,232,0.35)]">
          Meilleur score réalisé le {longDate(records.bestScore.date)}
          {records.worstScore ? `, pire score le ${longDate(records.worstScore.date)}.` : '.'}
        </p>
      )}
    </div>
  );
}
