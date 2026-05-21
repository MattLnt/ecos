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
    <div className="bg-gradient-to-br from-[rgba(0,191,255,0.08)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-[rgba(0,191,255,0.15)] rounded-xl flex items-center justify-center">
          <Icon size={24} className="text-[#00BFFF]" />
        </div>
        {growth !== undefined && (
          <div className="flex items-center gap-1 text-xs font-bold text-green-400">
            <TrendingUp size={14} />
            <span>+{growth}%</span>
          </div>
        )}
      </div>
      <div className="font-mono text-3xl font-extrabold text-[#F5F1E8] mb-1">
        {value}
      </div>
      <div className="text-sm text-[rgba(245,241,232,0.55)]">{label}</div>
    </div>
  );
}