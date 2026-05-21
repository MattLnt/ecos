'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Users, Trophy, Clock, ChevronRight, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/dashboard/StatCard';
import { SessionCard } from '@/components/dashboard/SessionCard';
import { ScoreEvolutionChart } from '@/components/dashboard/ScoreEvolutionChart';

interface Stats {
  totalSessions: number;
  activePlayers: number;
  avgPoints: number;
  totalMinutes: number;
  growth: {
    sessions: number;
    players: number;
    points: number;
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

interface TopPlayer {
  name: string;
  avgPoints: number;
  sessionsCount: number;
  avatar: string;
  photo?: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
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

      const statsData = await statsRes.json();
      const sessionsData = await sessionsRes.json();
      const playersData = await playersRes.json();

      setStats(statsData);
      setRecentSessions(sessionsData);
      setTopPlayers(playersData);
    } catch (error) {
      console.error('Erreur fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-[rgba(245,241,232,0.55)] font-mono text-sm">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header avec CTA */}
      <div className="flex items-center justify-between mobile:flex-col mobile:items-start mobile:gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#F5F1E8] tracking-tight mobile:text-3xl">
            Tableau de bord
          </h1>
          <p className="text-[rgba(245,241,232,0.55)] mt-2">
            Vue d'ensemble de vos performances
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

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-5 mobile:grid-cols-2">
        <StatCard
          icon={Target}
          value={stats.totalSessions}
          label="Sessions totales"
          growth={stats.growth.sessions}
        />
        <StatCard
          icon={Users}
          value={stats.activePlayers}
          label="Joueurs actifs"
          growth={stats.growth.players}
        />
        <StatCard
          icon={Trophy}
          value={stats.avgPoints}
          label="Points moyens"
          growth={stats.growth.points}
        />
        <StatCard
          icon={Clock}
          value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`}
          label="Temps de jeu"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-6 mobile:grid-cols-1">
        {/* Line Chart avec filtres */}
        <ScoreEvolutionChart />

        {/* Bar Chart - Top Players */}
        <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#F5F1E8]">Top 5 Joueurs</h2>
            <p className="text-sm text-[rgba(245,241,232,0.55)] mt-1">Par moyenne de points</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topPlayers}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,191,255,0.1)" />
              <XAxis 
                dataKey="name" 
                stroke="rgba(245,241,232,0.35)" 
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="rgba(245,241,232,0.35)" 
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0d1f38', 
                  border: '1px solid rgba(0,191,255,0.2)',
                  borderRadius: '12px',
                  color: '#F5F1E8',
                  padding: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
                labelStyle={{
                  color: '#F5F1E8',
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}
                itemStyle={{
                  color: '#00BFFF',
                  fontWeight: '600'
                }}
                cursor={{ fill: 'rgba(0,191,255,0.05)' }}
              />
              <Bar 
                dataKey="avgPoints" 
                fill="#00BFFF"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dernières Sessions */}
      <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#F5F1E8]">Dernières Sessions</h2>
            <p className="text-sm text-[rgba(245,241,232,0.55)] mt-1">3 plus récentes</p>
          </div>
          <button
            onClick={() => router.push('/sessions')}
            className="flex items-center gap-2 px-4 py-2 bg-[rgba(0,191,255,0.08)] hover:bg-[rgba(0,191,255,0.15)] border border-[rgba(0,191,255,0.2)] rounded-lg text-[#00BFFF] font-semibold text-sm transition-all"
          >
            <span>Voir tout</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {recentSessions.length === 0 ? (
            <div className="text-center py-8 text-[rgba(245,241,232,0.35)]">
              Aucune session terminée
            </div>
          ) : (
            recentSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}