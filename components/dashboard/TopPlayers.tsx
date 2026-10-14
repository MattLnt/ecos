'use client';

import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { PlayerAvatar } from '@/components/PlayerAvatar';

export interface TopPlayer {
  playerId: string;
  name: string;
  avgPoints: number;
  bestScore: number;
  sessionsCount: number;
  avatar: string;
  photo?: string | null;
}

interface TopPlayersProps {
  players: TopPlayer[];
  minSessions: number;
  qualified: boolean;
}

/** Or, argent, bronze, puis bleu. */
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const rankColor = (index: number) => RANK_COLORS[index] ?? '#00BFFF';

/**
 * Le podium du club, par moyenne de points.
 *
 * Un histogramme Recharts occupait tout le cadre pour cinq valeurs, sans
 * visage ni volume. Une liste de barres montre qui c'est, sur combien de
 * sessions, et à quel point l'écart est réel.
 */
export function TopPlayers({ players, minSessions, qualified }: TopPlayersProps) {
  const router = useRouter();
  const best = players[0]?.avgPoints ?? 0;

  return (
    <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-5 mobile:p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 mb-4 mobile:mb-3">
        <div className="min-w-0">
          <h2 className="text-lg mobile:text-base font-bold text-[#F5F1E8] flex items-center gap-2">
            <Trophy size={17} className="text-[#FFD700] shrink-0" />
            Top 5 joueurs
          </h2>
          <p className="text-sm mobile:text-xs text-[rgba(245,241,232,0.5)] mt-0.5">
            Moyenne de points par session
          </p>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="py-10 text-center text-sm text-[rgba(245,241,232,0.35)]">
          Aucune session terminée
        </div>
      ) : (
        <div className="space-y-2.5">
          {players.map((player, index) => {
            const color = rankColor(index);
            const share = best > 0 ? (player.avgPoints / best) * 100 : 0;

            return (
              <button
                key={player.playerId}
                type="button"
                onClick={() => router.push(`/joueurs/${player.playerId}`)}
                className="w-full text-left flex items-center gap-3 mobile:gap-2.5 p-2 rounded-xl hover:bg-[rgba(0,191,255,0.06)] active:scale-[0.99] transition-all"
              >
                <span
                  className="font-mono text-sm font-extrabold w-5 shrink-0 text-center"
                  style={{ color }}
                >
                  {index + 1}
                </span>

                <PlayerAvatar
                  photo={player.photo}
                  avatar={player.avatar}
                  firstName={player.name}
                  className="w-9 h-9 mobile:w-8 mobile:h-8 text-base"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-sm text-[#F5F1E8] truncate">{player.name}</span>
                    <span className="font-mono text-base mobile:text-sm font-extrabold shrink-0" style={{ color }}>
                      {player.avgPoints}
                    </span>
                  </div>

                  <div className="mt-1 h-1.5 rounded-full bg-[rgba(245,241,232,0.07)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${share}%`, backgroundColor: color }}
                    />
                  </div>

                  <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)] mt-1">
                    {player.sessionsCount} session{player.sessionsCount > 1 ? 's' : ''} · record {player.bestScore}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* La règle du classement, dite plutôt que subie. */}
      <p className="mt-3 pt-3 border-t border-[rgba(0,191,255,0.08)] font-mono text-[10px] text-[rgba(245,241,232,0.3)] leading-relaxed">
        {qualified
          ? `À partir de ${minSessions} sessions — une moyenne sur une seule séance ne compare rien.`
          : `Moins de ${minSessions} sessions par joueur : classement encore indicatif.`}
      </p>
    </div>
  );
}
