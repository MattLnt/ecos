import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  /** Couleur d'accent de la carte. Chaque indicateur a la sienne. */
  color: string;
  /** Variation d'un mois sur l'autre. `null` quand il n'y a rien à comparer. */
  growth?: number | null;
  /** Précision sous la valeur : « 3 ce mois-ci », « 548/1040 tirs »… */
  hint?: string;
}

export function StatCard({ icon: Icon, value, label, color, growth, hint }: StatCardProps) {
  const isUp = growth !== undefined && growth !== null && growth >= 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 mobile:p-3.5 border backdrop-blur-sm"
      style={{
        // Teinte et bordure dérivées de la couleur de l'indicateur : les
        // quatre cartes ne sont plus un mur de bleu identique.
        background: `linear-gradient(135deg, ${color}1f 0%, ${color}08 100%)`,
        borderColor: `${color}33`,
      }}
    >
      {/* Icône en filigrane dans le coin : présente sans manger la place. */}
      <Icon
        size={72}
        className="absolute -right-4 -bottom-4 opacity-[0.08] mobile:w-14 mobile:h-14"
        style={{ color }}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-2 mb-3 mobile:mb-2">
          <div
            className="w-10 h-10 mobile:w-8 mobile:h-8 shrink-0 rounded-xl mobile:rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}26` }}
          >
            <Icon className="w-5 h-5 mobile:w-4 mobile:h-4" style={{ color }} />
          </div>

          {growth !== undefined && growth !== null && (
            <div
              className={`flex items-center gap-1 text-xs mobile:text-[10px] font-bold shrink-0 ${
                isUp ? 'text-green-400' : 'text-red-400'
              }`}
              title="Par rapport au mois dernier"
            >
              {isUp ? (
                <TrendingUp size={13} className="mobile:w-3 mobile:h-3" />
              ) : (
                <TrendingDown size={13} className="mobile:w-3 mobile:h-3" />
              )}
              <span>{isUp ? '+' : ''}{growth}%</span>
            </div>
          )}
        </div>

        <div
          className="font-mono text-3xl mobile:text-2xl font-extrabold leading-none truncate"
          style={{ color }}
        >
          {value}
        </div>

        {hint && (
          <div className="font-mono text-[11px] mobile:text-[10px] text-[rgba(245,241,232,0.35)] mt-1 truncate">
            {hint}
          </div>
        )}

        <div className="text-sm mobile:text-[11px] text-[rgba(245,241,232,0.55)] leading-tight mt-1.5 mobile:mt-1">
          {label}
        </div>
      </div>
    </div>
  );
}
