'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  Trophy,
  Clock,
  ChevronRight,
  Plus,
  Target,
  Zap,
  Crosshair,
  Crown,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ShootingCard } from '@/components/dashboard/ShootingCard';
import { TopPlayers, type TopPlayer } from '@/components/dashboard/TopPlayers';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { ScoreEvolutionChart } from '@/components/dashboard/ScoreEvolutionChart';

interface Rate {
  makes: number;
  attempts: number;
  rate: number;
}

interface Stats {
  totalSessions: number;
  sessionsThisMonth: number;
  activePlayers: number;
  avgPoints: number;
  totalMinutes: number;
  shooting: { mid: Rate; three: Rate; ft: Rate };
  bestScore: {
    points: number;
    firstName: string;
    lastName: string;
    photo: string | null;
    avatar: string;
    playerId: string;
    date: string;
  } | null;
  growth: {
    sessions: number | null;
    players: number | null;
    points: number | null;
  };
}

interface RecentSession {
  id: string;
  date: string;
  courtName: string;
  playerCount: number;
  winner: {
    name: string;
    points: number;
    avatar: string;
    photo?: string | null;
  };
}

interface TopPlayersPayload {
  minSessions: number;
  qualified: boolean;
  players: TopPlayer[];
}

/** « 14h 42m », ou « 42m » tant qu'on n'a pas une heure de jeu. */
function formatPlayTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [top, setTop] = useState<TopPlayersPayload>({ minSessions: 2, qualified: false, players: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, sessionsRes, playersRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-sessions'),
        fetch('/api/dashboard/top-players'),
      ]);

      setStats(await statsRes.json());
      setRecentSessions(await sessionsRes.json());
      setTop(await playersRes.json());
    } catch (error) {
      console.error('Erreur fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-[rgba(245,241,232,0.55)] font-mono text-sm">
          Chargement du tableau de bord...
        </div>
      </div>
    );
  }

  const best = stats.bestScore;

  return (
    <div className="space-y-6 mobile:space-y-4">
      {/* Header avec CTA */}
      <div className="flex items-center justify-between gap-4 mobile:flex-col mobile:items-stretch">
        <div>
          <h1 className="text-4xl font-extrabold text-[#F5F1E8] tracking-tight mobile:text-2xl">
            Tableau de bord
          </h1>
          <p className="text-[rgba(245,241,232,0.55)] mt-2 mobile:mt-1 mobile:text-sm">
            Vue d&apos;ensemble de vos performances
          </p>
        </div>

        <button
          onClick={() => router.push('/session/new')}
          className="px-6 py-3 bg-gradient-to-r from-[#00BFFF] to-[#0088cc] text-[#0A1628] rounded-xl font-bold text-base flex items-center gap-2 hover:shadow-[0_8px_32px_rgba(0,191,255,0.4)] hover:scale-105 active:scale-95 transition-all mobile:w-full mobile:justify-center"
        >
          <Plus size={20} />
          <span>Nouvelle Session</span>
        </button>
      </div>

      {/* ===== LES QUATRE REPÈRES ===== */}
      <div className="grid grid-cols-4 gap-4 mobile:grid-cols-2 mobile:gap-2.5">
        <StatCard
          icon={Calendar}
          value={stats.totalSessions}
          label="Sessions terminées"
          color="#00BFFF"
          growth={stats.growth.sessions}
          hint={`${stats.sessionsThisMonth} ce mois-ci`}
        />
        <StatCard
          icon={Users}
          value={stats.activePlayers}
          label="Joueurs actifs"
          color="#A78BFA"
          growth={stats.growth.players}
          hint="ce mois-ci"
        />
        <StatCard
          icon={Trophy}
          value={stats.avgPoints}
          label="Points par joueur"
          color="#FFD700"
          growth={stats.growth.points}
          hint="moyenne par session"
        />
        <StatCard
          icon={Clock}
          value={formatPlayTime(stats.totalMinutes)}
          label="Temps de jeu"
          color="#22C55E"
          hint="toutes sessions"
        />
      </div>

      {/* ===== L'ADRESSE DU CLUB ===== */}
      <div className="grid grid-cols-3 gap-4 mobile:gap-2.5">
        <ShootingCard
          icon={Target}
          label="Mid-range"
          rate={stats.shooting.mid.rate}
          makes={stats.shooting.mid.makes}
          attempts={stats.shooting.mid.attempts}
          color="#00BFFF"
          unit="tirs"
        />
        <ShootingCard
          icon={Zap}
          label="3 points"
          rate={stats.shooting.three.rate}
          makes={stats.shooting.three.makes}
          attempts={stats.shooting.three.attempts}
          color="#FFD700"
          unit="tirs"
        />
        <ShootingCard
          icon={Crosshair}
          label="Lancers francs"
          rate={stats.shooting.ft.rate}
          makes={stats.shooting.ft.makes}
          attempts={stats.shooting.ft.attempts}
          color="#22C55E"
          unit="LF"
        />
      </div>

      {/* ===== RECORD DU CLUB ===== */}
      {best && (
        <button
          type="button"
          onClick={() => router.push(`/joueurs/${best.playerId}`)}
          className="w-full text-left flex items-center gap-4 mobile:gap-3 rounded-2xl p-4 mobile:p-3 border border-[rgba(255,215,0,0.3)] bg-gradient-to-r from-[rgba(255,215,0,0.14)] via-[rgba(255,215,0,0.06)] to-transparent hover:border-[rgba(255,215,0,0.5)] active:scale-[0.995] transition-all"
        >
          <div className="w-11 h-11 mobile:w-9 mobile:h-9 shrink-0 rounded-xl bg-[rgba(255,215,0,0.18)] flex items-center justify-center">
            <Crown size={20} className="text-[#FFD700] mobile:w-4 mobile:h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(255,215,0,0.7)]">
              Record du club
            </div>
            <div className="font-bold text-[#F5F1E8] mobile:text-sm truncate">
              {best.firstName} {best.lastName}
              <span className="text-[rgba(245,241,232,0.45)] font-normal">
                {' '}· {new Date(best.date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {best.photo ? (
            <img src={best.photo} alt="" className="w-10 h-10 mobile:w-8 mobile:h-8 rounded-full object-cover shrink-0 ring-2 ring-[rgba(255,215,0,0.5)]" />
          ) : (
            <div
              className="w-10 h-10 mobile:w-8 mobile:h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#0A1628] shrink-0 ring-2 ring-[rgba(255,215,0,0.5)]"
              style={{ backgroundColor: best.avatar }}
            >
              {best.firstName[0]}{best.lastName[0]}
            </div>
          )}

          <div className="shrink-0 text-right">
            <div className="font-mono text-3xl mobile:text-2xl font-extrabold text-[#FFD700] leading-none">
              {best.points}
            </div>
            <div className="font-mono text-[10px] text-[rgba(245,241,232,0.35)]">POINTS</div>
          </div>
        </button>
      )}

      {/* ===== ÉVOLUTION + TOP 5 ===== */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-4 mobile:grid-cols-1">
        <ScoreEvolutionChart />
        <TopPlayers players={top.players} minSessions={top.minSessions} qualified={top.qualified} />
      </div>

      {/* ===== DERNIÈRES SESSIONS ===== */}
      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-5 mobile:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 mb-4 mobile:mb-3">
          <div className="min-w-0">
            <h2 className="text-lg mobile:text-base font-bold text-[#F5F1E8] truncate">
              Dernières sessions
            </h2>
            <p className="text-sm text-[rgba(245,241,232,0.5)] mt-0.5 mobile:text-xs">3 plus récentes</p>
          </div>
          <button
            onClick={() => router.push('/sessions')}
            className="shrink-0 flex items-center gap-2 mobile:gap-1 px-4 mobile:px-3 py-2 bg-[rgba(0,191,255,0.08)] hover:bg-[rgba(0,191,255,0.15)] border border-[rgba(0,191,255,0.2)] rounded-lg text-[#00BFFF] font-semibold text-sm mobile:text-xs whitespace-nowrap active:scale-95 transition-all"
          >
            <span>Voir tout</span>
            <ChevronRight size={16} className="shrink-0" />
          </button>
        </div>

        <div className="space-y-3 mobile:space-y-2">
          {recentSessions.length === 0 ? (
            <div className="text-center py-8 text-[rgba(245,241,232,0.35)]">
              Aucune session terminée
            </div>
          ) : (
            recentSessions.map((session) => <SessionCard key={session.id} session={session} />)
          )}
        </div>
      </div>
    </div>
  );
}
