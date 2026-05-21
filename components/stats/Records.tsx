'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Target, TrendingDown } from 'lucide-react';

interface RecordsData {
  bestScore: {
    points: number;
    playerName: string;
    date: string;
    sessionId: string;
  } | null;
  worstScore: {
    points: number;
    playerName: string;
    date: string;
    sessionId: string;
  } | null;
  longestWinStreak: {
    count: number;
    playerName: string;
  } | null;
  bestFtRate: {
    rate: number;
    playerName: string;
    totalAttempts: number;
  } | null;
}

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
      <div className="h-64 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  if (!records) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Aucune donnée disponible</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#F5F1E8]">Records</h2>

      <div className="grid grid-cols-2 gap-5 mobile:grid-cols-1">
        {/* Meilleur score */}
        {records.bestScore ? (
          <div className="bg-gradient-to-br from-[rgba(255,215,0,0.08)] to-[rgba(255,215,0,0.02)] border border-[rgba(255,215,0,0.2)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[rgba(255,215,0,0.15)] rounded-xl flex items-center justify-center">
                <Trophy size={24} className="text-[#FFD700]" />
              </div>
              <div>
                <div className="text-sm text-[rgba(245,241,232,0.55)]">Meilleur score</div>
                <div className="font-bold text-[#F5F1E8]">{records.bestScore.playerName}</div>
              </div>
            </div>
            <div className="font-mono text-5xl font-extrabold text-[#FFD700] mb-2">
              {records.bestScore.points}
            </div>
            <div className="text-sm text-[rgba(245,241,232,0.55)]">
              {new Date(records.bestScore.date).toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[rgba(255,215,0,0.08)] to-[rgba(255,215,0,0.02)] border border-[rgba(255,215,0,0.2)] rounded-2xl p-6 flex items-center justify-center">
            <div className="text-[rgba(245,241,232,0.35)] text-sm">Aucune donnée</div>
          </div>
        )}

        {/* Pire score */}
        {records.worstScore ? (
          <div className="bg-gradient-to-br from-[rgba(239,68,68,0.08)] to-[rgba(239,68,68,0.02)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[rgba(239,68,68,0.15)] rounded-xl flex items-center justify-center">
                <TrendingDown size={24} className="text-red-400" />
              </div>
              <div>
                <div className="text-sm text-[rgba(245,241,232,0.55)]">Pire score</div>
                <div className="font-bold text-[#F5F1E8]">{records.worstScore.playerName}</div>
              </div>
            </div>
            <div className="font-mono text-5xl font-extrabold text-red-400 mb-2">
              {records.worstScore.points}
            </div>
            <div className="text-sm text-[rgba(245,241,232,0.55)]">
              {new Date(records.worstScore.date).toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[rgba(239,68,68,0.08)] to-[rgba(239,68,68,0.02)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-6 flex items-center justify-center">
            <div className="text-[rgba(245,241,232,0.35)] text-sm">Aucune donnée</div>
          </div>
        )}

        {/* Plus longue série */}
        {records.longestWinStreak && records.longestWinStreak.count > 0 ? (
          <div className="bg-gradient-to-br from-[rgba(239,68,68,0.08)] to-[rgba(239,68,68,0.02)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[rgba(239,68,68,0.15)] rounded-xl flex items-center justify-center">
                <Flame size={24} className="text-red-400" />
              </div>
              <div>
                <div className="text-sm text-[rgba(245,241,232,0.55)]">Plus longue série</div>
                <div className="font-bold text-[#F5F1E8]">{records.longestWinStreak.playerName}</div>
              </div>
            </div>
            <div className="font-mono text-5xl font-extrabold text-red-400 mb-2">
              {records.longestWinStreak.count}
            </div>
            <div className="text-sm text-[rgba(245,241,232,0.55)]">
              victoires consécutives
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[rgba(239,68,68,0.08)] to-[rgba(239,68,68,0.02)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-6 flex items-center justify-center">
            <div className="text-[rgba(245,241,232,0.35)] text-sm">Aucune donnée</div>
          </div>
        )}

        {/* Meilleur taux LF */}
        {records.bestFtRate && records.bestFtRate.rate > 0 ? (
          <div className="bg-gradient-to-br from-[rgba(34,197,94,0.08)] to-[rgba(34,197,94,0.02)] border border-[rgba(34,197,94,0.2)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[rgba(34,197,94,0.15)] rounded-xl flex items-center justify-center">
                <Target size={24} className="text-green-400" />
              </div>
              <div>
                <div className="text-sm text-[rgba(245,241,232,0.55)]">Meilleur taux LF</div>
                <div className="font-bold text-[#F5F1E8]">{records.bestFtRate.playerName}</div>
              </div>
            </div>
            <div className="font-mono text-5xl font-extrabold text-green-400 mb-2">
              {records.bestFtRate.rate.toFixed(1)}%
            </div>
            <div className="text-sm text-[rgba(245,241,232,0.55)]">
              Sur {records.bestFtRate.totalAttempts} tentatives
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[rgba(34,197,94,0.08)] to-[rgba(34,197,94,0.02)] border border-[rgba(34,197,94,0.2)] rounded-2xl p-6 flex items-center justify-center">
            <div className="text-[rgba(245,241,232,0.35)] text-sm">Aucune donnée</div>
          </div>
        )}
      </div>
    </div>
  );
}