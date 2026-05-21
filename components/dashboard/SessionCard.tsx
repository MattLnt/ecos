import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface SessionCardProps {
  session: {
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
  };
}

export function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/session/${session.id}/results`)}
      className="w-full group"
    >
      <div className="bg-[rgba(0,191,255,0.04)] hover:bg-[rgba(0,191,255,0.08)] border border-[rgba(0,191,255,0.15)] hover:border-[#00BFFF] rounded-xl p-5 transition-all flex items-center gap-5 mobile:flex-col mobile:items-start">
        {/* Date */}
        <div className="shrink-0">
          <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase mb-1">
            {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
          </div>
          <div className="font-bold text-2xl text-[#F5F1E8]">
            {new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </div>
        </div>

        <div className="h-12 w-px bg-[rgba(0,191,255,0.15)] mobile:hidden" />

        {/* Info session */}
        <div className="flex-1 text-left">
          <div className="font-bold text-[#F5F1E8] mb-1">{session.courtName}</div>
          <div className="text-sm text-[rgba(245,241,232,0.55)]">
            {session.playerCount} joueur{session.playerCount > 1 ? 's' : ''}
          </div>
        </div>

        <div className="h-12 w-px bg-[rgba(0,191,255,0.15)] mobile:hidden" />

        {/* Winner */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase mb-1">Vainqueur</div>
            <div className="font-bold text-[#F5F1E8]">{session.winner.name}</div>
          </div>
          {session.winner.photo ? (
            <img src={session.winner.photo} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-[#FFD700]" />
          ) : (
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-[#0A1628] ring-2 ring-[#FFD700]"
              style={{ backgroundColor: session.winner.avatar }}
            >
              {session.winner.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="text-left">
            <div className="font-mono text-2xl font-extrabold text-[#FFD700]">{session.winner.points}</div>
            <div className="font-mono text-xs text-[rgba(245,241,232,0.4)]">PTS</div>
          </div>
        </div>

        <ChevronRight size={20} className="text-[rgba(245,241,232,0.35)] group-hover:text-[#00BFFF] transition-colors shrink-0 mobile:hidden" />
      </div>
    </button>
  );
}