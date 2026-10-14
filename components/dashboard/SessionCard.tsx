import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { PlayerAvatar } from '@/components/PlayerAvatar';

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
      className="w-full group text-left"
    >
      {/* Sur mobile : une ligne date + infos, puis une ligne vainqueur.
          L'empilement complet donnait des cartes beaucoup trop hautes. */}
      <div className="bg-[rgba(0,191,255,0.04)] hover:bg-[rgba(0,191,255,0.08)] border border-[rgba(0,191,255,0.15)] hover:border-[#00BFFF] active:scale-[0.99] rounded-xl p-5 mobile:p-3.5 transition-all">
        <div className="flex items-center gap-5 mobile:gap-3">
          {/* Date */}
          <div className="shrink-0">
            <div className="font-mono text-xs mobile:text-[10px] text-[rgba(245,241,232,0.4)] uppercase mb-1 mobile:mb-0">
              {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
            </div>
            <div className="font-bold text-2xl mobile:text-lg text-[#F5F1E8] whitespace-nowrap">
              {new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </div>
          </div>

          <div className="h-12 w-px bg-[rgba(0,191,255,0.15)] mobile:hidden" />

          {/* Info session */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[#F5F1E8] mb-1 mobile:mb-0 mobile:text-sm truncate">
              {session.courtName}
            </div>
            <div className="text-sm mobile:text-xs text-[rgba(245,241,232,0.55)]">
              {session.playerCount} joueur{session.playerCount > 1 ? 's' : ''}
            </div>
          </div>

          <div className="h-12 w-px bg-[rgba(0,191,255,0.15)] mobile:hidden" />

          {/* Vainqueur — desktop */}
          <div className="flex items-center gap-3 shrink-0 mobile:hidden">
            <div className="text-right">
              <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] uppercase mb-1">Vainqueur</div>
              <div className="font-bold text-[#F5F1E8]">{session.winner.name}</div>
            </div>
            <PlayerAvatar
              photo={session.winner.photo}
              avatar={session.winner.avatar}
              firstName={session.winner.name}
              className="w-12 h-12 text-xl"
              ringClassName="ring-2 ring-[#FFD700]"
            />
            <div className="text-left">
              <div className="font-mono text-2xl font-extrabold text-[#FFD700]">{session.winner.points}</div>
              <div className="font-mono text-xs text-[rgba(245,241,232,0.4)]">PTS</div>
            </div>
          </div>

          <ChevronRight size={20} className="text-[rgba(245,241,232,0.35)] group-hover:text-[#00BFFF] transition-colors shrink-0 mobile:hidden" />
        </div>

        {/* Vainqueur — mobile */}
        <div className="hidden mobile:flex items-center gap-2 mt-3 pt-3 border-t border-[rgba(0,191,255,0.12)]">
          <span className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase shrink-0">Vainqueur</span>
          <PlayerAvatar
            photo={session.winner.photo}
            avatar={session.winner.avatar}
            firstName={session.winner.name}
            className="w-7 h-7 text-sm"
            ringClassName="ring-2 ring-[#FFD700]"
          />
          <span className="font-bold text-sm text-[#F5F1E8] truncate flex-1 min-w-0">{session.winner.name}</span>
          <span className="font-mono text-lg font-extrabold text-[#FFD700] shrink-0">
            {session.winner.points}
            <span className="text-[10px] text-[rgba(245,241,232,0.4)] ml-1">PTS</span>
          </span>
        </div>
      </div>
    </button>
  );
}
