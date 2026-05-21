'use client';

interface PlayerCardProps {
  firstName: string;
  lastName: string;
  photo: string | null;
  nbaTeam: string | null;
  avgPoints: number;
  midRate: number;
  threePointRate: number;
  ftRate: number;
  victories: number;
  totalSessions: number;
}

const NBA_TEAMS: Record<string, { name: string; logo: string; primary: string; secondary: string }> = {
  'LAL': { name: 'Lakers', logo: '🏀', primary: '#552583', secondary: '#FDB927' },
  'GSW': { name: 'Warriors', logo: '🏀', primary: '#1D428A', secondary: '#FFC72C' },
  'CHO': { name: 'Hornets', logo: '🏀', primary: '#1D1160', secondary: '#00788C' },
  'BOS': { name: 'Celtics', logo: '🏀', primary: '#007A33', secondary: '#BA9653' },
  'MIA': { name: 'Heat', logo: '🏀', primary: '#98002E', secondary: '#F9A01B' },
  'CHI': { name: 'Bulls', logo: '🏀', primary: '#CE1141', secondary: '#000000' },
  'BKN': { name: 'Nets', logo: '🏀', primary: '#000000', secondary: '#FFFFFF' },
  'PHX': { name: 'Suns', logo: '🏀', primary: '#1D1160', secondary: '#E56020' },
  'DAL': { name: 'Mavericks', logo: '🏀', primary: '#00538C', secondary: '#002B5E' },
  'MIL': { name: 'Bucks', logo: '🏀', primary: '#00471B', secondary: '#EEE1C6' },
};

export function PlayerCard({
  firstName,
  lastName,
  photo,
  nbaTeam,
  avgPoints,
  midRate,
  threePointRate,
  ftRate,
  victories,
  totalSessions,
}: PlayerCardProps) {
  const team = nbaTeam ? NBA_TEAMS[nbaTeam] : null;
  const overall = Math.round((midRate + threePointRate + ftRate) / 3);

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[3/4]">
      {/* Background avec effet glitch */}
      <div 
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg, 
              ${team?.primary || '#1D428A'} 0%,
              ${team?.secondary || '#FFC72C'} 50%,
              ${team?.primary || '#1D428A'} 100%
            )
          `,
        }}
      >
        {/* Effet glitch/grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)
            `,
          }}
        />

        {/* Cubes 3D style */}
        <div className="absolute top-10 right-10 w-32 h-32 opacity-30">
          <div className="w-full h-full relative">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-gradient-to-br from-white/20 to-transparent rounded-lg"
                style={{
                  width: `${20 + (i % 3) * 15}px`,
                  height: `${20 + (i % 3) * 15}px`,
                  left: `${(i % 3) * 35}px`,
                  top: `${Math.floor(i / 3) * 35}px`,
                  transform: `rotate(${i * 15}deg)`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Border effet holographique */}
      <div className="absolute inset-0 rounded-3xl border-4 border-cyan-400/50 shadow-[0_0_30px_rgba(0,191,255,0.5)]" />
      <div className="absolute inset-0 rounded-3xl border-2 border-white/30" style={{ margin: '8px' }} />

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col">
        {/* Header - Overall + Position */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-left">
            <div className="text-6xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
              {overall}
            </div>
            <div className="text-lg font-bold text-white/90 tracking-widest mt-1">
              OVR
            </div>
          </div>

          {/* Logo équipe */}
          {team && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-5xl">{team.logo}</div>
              <div className="text-xs font-bold text-white/80 uppercase tracking-wider">
                {team.name}
              </div>
            </div>
          )}
        </div>

        {/* Photo joueur */}
        <div className="flex-1 flex items-center justify-center mb-4">
          {photo ? (
            <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl">
              <img 
                src={photo} 
                alt="" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          ) : (
            <div className="w-56 h-56 rounded-full bg-gradient-to-br from-white/20 to-white/5 border-4 border-white/30 flex items-center justify-center shadow-2xl">
              <span className="text-8xl font-black text-white/50">
                {firstName[0]}{lastName[0]}
              </span>
            </div>
          )}
        </div>

        {/* Nom */}
        <div className="text-center mb-6">
          <div className="text-4xl font-black text-white uppercase tracking-wider drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            {firstName.split(' ')[0]}
          </div>
          <div className="h-1 w-32 bg-white/50 mx-auto my-2 rounded-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 bg-black/30 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          {/* Colonne gauche */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Avg</span>
              <span className="text-2xl font-black text-white">{avgPoints.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Mid</span>
              <span className="text-2xl font-black text-white">{midRate.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">3PT</span>
              <span className="text-2xl font-black text-white">{threePointRate.toFixed(0)}</span>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">FT</span>
              <span className="text-2xl font-black text-white">{ftRate.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Wins</span>
              <span className="text-2xl font-black text-white">{victories}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Games</span>
              <span className="text-2xl font-black text-white">{totalSessions}</span>
            </div>
          </div>
        </div>

        {/* Footer icon */}
        <div className="flex justify-center mt-4">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
            <div className="text-white text-2xl">🏀</div>
          </div>
        </div>
      </div>
    </div>
  );
}