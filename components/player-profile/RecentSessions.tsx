'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface Session {
  id: string;
  date: string;
  points: number;
  rank: number;
  totalPlayers: number;
}

interface RecentSessionsProps {
  sessions: Session[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[rgba(0,191,255,0.15)] bg-[rgba(0,191,255,0.04)]">
        <h3 className="text-lg font-bold text-[#F5F1E8] flex items-center gap-2">
          <Calendar size={20} className="text-[#00BFFF]" />
          Sessions récentes
        </h3>
      </div>

      <div className="divide-y divide-[rgba(0,191,255,0.08)]">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/sessions/${session.id}`}
            className="flex items-center justify-between p-4 hover:bg-[rgba(0,191,255,0.04)] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                session.rank === 1 ? 'bg-[rgba(255,215,0,0.15)] text-[#FFD700]' :
                session.rank === 2 ? 'bg-[rgba(192,192,192,0.15)] text-[#C0C0C0]' :
                session.rank === 3 ? 'bg-[rgba(205,127,50,0.15)] text-[#CD7F32]' :
                'bg-[rgba(0,191,255,0.08)] text-[rgba(245,241,232,0.55)]'
              }`}>
                #{session.rank}
              </div>
              <div>
                <div className="font-bold text-[#F5F1E8]">{session.points} points</div>
                <div className="text-sm text-[rgba(245,241,232,0.55)]">
                  {new Date(session.date).toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </div>
            <div className="text-sm text-[rgba(245,241,232,0.35)]">
              {session.totalPlayers} joueurs
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}