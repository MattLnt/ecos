import { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  growth?: number;
}

export function StatCard({ icon: Icon, value, label, growth }: StatCardProps) {
  return (
    <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6 mobile:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 mb-4 mobile:mb-3">
        <div className="w-12 h-12 mobile:w-9 mobile:h-9 shrink-0 bg-[rgba(0,191,255,0.15)] rounded-xl mobile:rounded-lg flex items-center justify-center">
          <Icon className="text-[#00BFFF] w-6 h-6 mobile:w-[18px] mobile:h-[18px]" />
        </div>
        {growth !== undefined && (
          <div className="flex items-center gap-1 text-xs mobile:text-[10px] font-bold text-green-400 shrink-0">
            <TrendingUp size={14} className="mobile:w-3 mobile:h-3" />
            <span>+{growth}%</span>
          </div>
        )}
      </div>
      <div className="font-mono text-3xl mobile:text-2xl font-extrabold text-[#F5F1E8] mb-1 truncate">
        {value}
      </div>
      <div className="text-sm mobile:text-xs text-[rgba(245,241,232,0.55)] leading-tight">{label}</div>
    </div>
  );
}
