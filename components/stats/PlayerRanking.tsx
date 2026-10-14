'use client';

import { useState, useEffect } from 'react';

interface Rate {
  makes: number;
  attempts: number;
  rate: number;
}

interface PlayerStat {
  playerId: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  avatar: string;
  sessions: number;
  mid: Rate;
  three: Rate;
  ft: Rate;
  spots: Record<number, Rate>;
  spotNames: Record<number, { label: string; sub: string }>;
}

type GeneralKey = 'mid' | 'three' | 'ft';

const isThreeLabel = (label: string) => label?.includes('3 PTS') || label?.includes('3PTS');

const GENERAL_FILTERS: { key: GeneralKey; label: string; short: string; color: string }[] = [
  { key: 'mid', label: '% Mid-Range', short: 'Mid', color: '#00BFFF' },
  { key: 'three', label: '% 3 Points', short: '3 pts', color: '#FFD700' },
  { key: 'ft', label: '% Lancers Francs', short: 'LF', color: '#22C55E' },
];

/*
  Volume minimum pour entrer au classement.

  Un pourcentage sans volume ne compare rien : un joueur venu une seule fois,
  qui met son unique lancer franc, affiche 100 % et passe devant celui qui tire
  depuis deux ans. Les joueurs sous le seuil restent affichés, à part et avec
  leur volume — ils ne sont pas cachés, ils ne sont simplement pas classés.
*/
const MIN_SESSIONS = 2;
const MIN_ATTEMPTS = 20;

/** Un spot n'est tiré qu'une fois par session : deux passages au minimum. */
const MIN_SPOT_ATTEMPTS = 20;

function isRanked(player: PlayerStat, key: GeneralKey): boolean {
  return player.sessions >= MIN_SESSIONS && player[key].attempts >= MIN_ATTEMPTS;
}

/** Or, argent, bronze pour le podium, gris ensuite. */
function rankColor(index: number) {
  if (index === 0) return 'text-[#FFD700]';
  if (index === 1) return 'text-[#C0C0C0]';
  if (index === 2) return 'text-[#CD7F32]';
  return 'text-[rgba(245,241,232,0.35)]';
}

function Avatar({ player, size }: { player: PlayerStat; size: string }) {
  if (player.photo) {
    return <img src={player.photo} alt="" className={`${size} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center text-xs font-bold text-[#0A1628] shrink-0`}
      style={{ backgroundColor: player.avatar }}
    >
      {player.firstName[0]}{player.lastName[0]}
    </div>
  );
}

/** Taux et volume : « 52.7% » au-dessus de « 548/1040 ». */
function RateCell({ value, color, className = '' }: { value: Rate; color: string; className?: string }) {
  return (
    <div className={className}>
      <div className="font-mono text-lg font-bold" style={{ color }}>
        {value.rate.toFixed(1)}%
      </div>
      <div className="font-mono text-[11px] text-[rgba(245,241,232,0.35)]">
        {value.makes}/{value.attempts}
      </div>
    </div>
  );
}

export function PlayerRanking() {
  const [players, setPlayers] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [generalFilter, setGeneralFilter] = useState<GeneralKey>('mid');
  const [spotFilter, setSpotFilter] = useState<number | ''>(1);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/stats/players-detailed');
      const data = await res.json();
      setPlayers(data);
    } catch (error) {
      console.error('Erreur fetch players:', error);
    } finally {
      setLoading(false);
    }
  };

  const byGeneral = (a: PlayerStat, b: PlayerStat) =>
    b[generalFilter].rate - a[generalFilter].rate;

  const rankedGeneral = players.filter((p) => isRanked(p, generalFilter)).sort(byGeneral);
  // Les non-classés sont triés par volume : le plus proche du seuil en premier.
  const unrankedGeneral = players
    .filter((p) => !isRanked(p, generalFilter))
    .sort((a, b) => b[generalFilter].attempts - a[generalFilter].attempts);

  const spotAttempts = (player: PlayerStat) =>
    spotFilter === '' ? 0 : player.spots[spotFilter]?.attempts ?? 0;
  const spotRate = (player: PlayerStat) =>
    spotFilter === '' ? 0 : player.spots[spotFilter]?.rate ?? 0;

  const rankedBySpot = players
    .filter((p) => spotAttempts(p) >= MIN_SPOT_ATTEMPTS)
    .sort((a, b) => spotRate(b) - spotRate(a));
  const unrankedBySpot = players
    .filter((p) => spotAttempts(p) > 0 && spotAttempts(p) < MIN_SPOT_ATTEMPTS)
    .sort((a, b) => spotAttempts(b) - spotAttempts(a));

  const spotOptions =
    players.length > 0 && players[0].spotNames
      ? Object.entries(players[0].spotNames)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([num, info]) => ({ num: parseInt(num), label: info.label, sub: info.sub }))
      : [];

  const getSpotColor = (spotNum: number) => {
    const spot = spotOptions.find((s) => s.num === spotNum);
    if (!spot) return '#00BFFF';
    return isThreeLabel(spot.label) ? '#FFD700' : '#00BFFF';
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mobile:space-y-5">
      <h2 className="text-2xl mobile:text-lg font-bold text-[#F5F1E8]">Classement des joueurs</h2>

      {/* ========== STATS GÉNÉRALES ========== */}
      <div className="space-y-3">
        <h3 className="text-sm mobile:text-xs font-bold text-[rgba(245,241,232,0.7)] mobile:uppercase mobile:tracking-wider">
          Statistiques générales
        </h3>

        {/* Le tri. Trois boutons pleine largeur sur mobile : plus de rangée
            qui déborde, et on voit d'un coup le critère actif. */}
        <div className="flex items-center gap-3 mobile:grid mobile:grid-cols-3 mobile:gap-1.5">
          {GENERAL_FILTERS.map(({ key, label, short, color }) => {
            const active = generalFilter === key;
            return (
              <button
                key={key}
                onClick={() => setGeneralFilter(key)}
                className="px-5 py-2.5 mobile:px-2 mobile:py-2 rounded-xl mobile:rounded-lg text-sm mobile:text-xs font-bold transition-all whitespace-nowrap border"
                style={{
                  backgroundColor: active ? color : `${color}14`,
                  color: active ? '#0A1628' : 'rgba(245,241,232,0.7)',
                  borderColor: active ? color : `${color}26`,
                  boxShadow: active ? `0 4px 18px ${color}4d` : 'none',
                }}
              >
                <span className="mobile:hidden">{label}</span>
                <span className="hidden mobile:inline">{short}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop : tableau */}
        <div className="mobile:hidden bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_90px_120px_120px_120px] gap-4 p-4 border-b border-[rgba(0,191,255,0.15)] bg-[rgba(0,191,255,0.04)]">
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">#</div>
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">Joueur</div>
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">Sessions</div>
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% Mid</div>
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% 3pts</div>
            <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% LF</div>
          </div>

          <div className="divide-y divide-[rgba(0,191,255,0.08)]">
            {rankedGeneral.map((player, index) => (
              <div
                key={player.playerId}
                className="grid grid-cols-[60px_1fr_90px_120px_120px_120px] gap-4 p-4 hover:bg-[rgba(0,191,255,0.04)] transition-colors items-center"
              >
                <div className={`font-mono font-bold text-lg ${rankColor(index)}`}>#{index + 1}</div>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar player={player} size="w-10 h-10" />
                  <div className="font-bold text-[#F5F1E8] truncate">
                    {player.firstName} {player.lastName}
                  </div>
                </div>
                <div className="font-mono text-sm text-[rgba(245,241,232,0.55)]">{player.sessions}</div>
                <RateCell value={player.mid} color="#00BFFF" />
                <RateCell value={player.three} color="#FFD700" />
                <RateCell value={player.ft} color="#22C55E" />
              </div>
            ))}

            {/* Volume trop faible : affichés, mais hors classement. */}
            {unrankedGeneral.length > 0 && (
              <>
                <div className="px-4 py-2.5 bg-[rgba(245,241,232,0.02)] text-[11px] font-mono uppercase tracking-wider text-[rgba(245,241,232,0.35)]">
                  Hors classement — moins de {MIN_SESSIONS} sessions
                </div>
                {unrankedGeneral.map((player) => (
                  <div
                    key={player.playerId}
                    className="grid grid-cols-[60px_1fr_90px_120px_120px_120px] gap-4 p-4 items-center opacity-50"
                  >
                    <div className="font-mono font-bold text-lg text-[rgba(245,241,232,0.2)]">—</div>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar player={player} size="w-10 h-10" />
                      <div className="font-bold text-[#F5F1E8] truncate">
                        {player.firstName} {player.lastName}
                      </div>
                    </div>
                    <div className="font-mono text-sm text-[rgba(245,241,232,0.55)]">{player.sessions}</div>
                    <RateCell value={player.mid} color="#00BFFF" />
                    <RateCell value={player.three} color="#FFD700" />
                    <RateCell value={player.ft} color="#22C55E" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/*
          Mobile : le tableau en `grid-cols-1` empilait le rang, le joueur puis
          trois pourcentages nus — impossible de savoir lequel était lequel, et
          près de 900px par joueur. Une carte par joueur, avec les trois taux
          étiquetés côte à côte et le critère de tri mis en avant.
        */}
        <div className="hidden mobile:block space-y-2">
          {rankedGeneral.map((player, index) => (
            <PlayerCardMobile
              key={player.playerId}
              player={player}
              rank={index + 1}
              generalFilter={generalFilter}
            />
          ))}

          {unrankedGeneral.length > 0 && (
            <>
              <div className="pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-[rgba(245,241,232,0.35)]">
                Hors classement — moins de {MIN_SESSIONS} sessions
              </div>
              {unrankedGeneral.map((player) => (
                <PlayerCardMobile
                  key={player.playerId}
                  player={player}
                  rank={null}
                  generalFilter={generalFilter}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* ========== PAR SPOT ========== */}
      <div className="space-y-3">
        <h3 className="text-sm mobile:text-xs font-bold text-[rgba(245,241,232,0.7)] mobile:uppercase mobile:tracking-wider">
          Par spot
        </h3>

        <div className="overflow-x-auto pb-2 -mx-2 px-2 mobile:-mx-4 mobile:px-4">
          <div className="flex items-center gap-2 min-w-max">
            {spotOptions.map((spot) => {
              const color = isThreeLabel(spot.label) ? '#FFD700' : '#00BFFF';
              const isActive = spotFilter === spot.num;

              return (
                <button
                  key={spot.num}
                  onClick={() => setSpotFilter(spot.num)}
                  className="px-4 py-2.5 mobile:px-3 mobile:py-2 rounded-xl mobile:rounded-lg text-xs mobile:text-[11px] font-bold transition-all whitespace-nowrap border text-left"
                  style={{
                    backgroundColor: isActive ? color : `${color}15`,
                    color: isActive ? '#0A1628' : 'rgba(245,241,232,0.7)',
                    borderColor: isActive ? color : `${color}30`,
                    boxShadow: isActive ? `0 4px 20px ${color}50` : 'none',
                  }}
                >
                  <div className="font-extrabold">{spot.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{spot.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {spotFilter !== '' && (
          <div className="bg-gradient-to-br from-[rgba(0,191,255,0.04)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-2xl mobile:rounded-xl overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_150px] gap-4 p-4 border-b border-[rgba(0,191,255,0.15)] bg-[rgba(0,191,255,0.04)] mobile:hidden">
              <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">#</div>
              <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">Joueur</div>
              <div className="text-xs font-bold text-[rgba(245,241,232,0.35)] uppercase">% Réussite</div>
            </div>

            <div className="divide-y divide-[rgba(0,191,255,0.08)]">
              {rankedBySpot.map((player, index) => (
                <SpotRow
                  key={player.playerId}
                  player={player}
                  rank={index + 1}
                  value={player.spots[spotFilter as number]}
                  color={getSpotColor(spotFilter as number)}
                />
              ))}

              {unrankedBySpot.length > 0 && (
                <>
                  <div className="px-4 py-2.5 mobile:px-2.5 bg-[rgba(245,241,232,0.02)] text-[11px] mobile:text-[10px] font-mono uppercase tracking-wider text-[rgba(245,241,232,0.35)]">
                    Hors classement — un seul passage sur ce spot
                  </div>
                  {unrankedBySpot.map((player) => (
                    <SpotRow
                      key={player.playerId}
                      player={player}
                      rank={null}
                      value={player.spots[spotFilter as number]}
                      color={getSpotColor(spotFilter as number)}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Une carte joueur en mobile. `rank` à `null` = hors classement. */
function PlayerCardMobile({
  player,
  rank,
  generalFilter,
}: {
  player: PlayerStat;
  rank: number | null;
  generalFilter: GeneralKey;
}) {
  return (
    <div
      className={`bg-gradient-to-br from-[rgba(0,191,255,0.05)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-xl p-3 ${
        rank === null ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <span
          className={`font-mono text-sm font-extrabold w-7 shrink-0 ${
            rank === null ? 'text-[rgba(245,241,232,0.2)]' : rankColor(rank - 1)
          }`}
        >
          {rank === null ? '—' : `#${rank}`}
        </span>
        <Avatar player={player} size="w-8 h-8" />
        <span className="font-bold text-sm text-[#F5F1E8] truncate flex-1 min-w-0">
          {player.firstName} {player.lastName}
        </span>
        <span className="font-mono text-[10px] text-[rgba(245,241,232,0.35)] shrink-0">
          {player.sessions} sess.
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {GENERAL_FILTERS.map(({ key, short, color }) => {
          const active = generalFilter === key;
          const value = player[key];
          return (
            <div
              key={key}
              className="rounded-lg px-2 py-1.5 text-center transition-colors"
              style={{
                backgroundColor: active ? `${color}1f` : 'rgba(245,241,232,0.03)',
                boxShadow: active ? `inset 0 0 0 1px ${color}59` : 'none',
              }}
            >
              <div className="font-mono text-base font-extrabold leading-none" style={{ color }}>
                {value.rate.toFixed(1)}
                <span className="text-[10px] opacity-60">%</span>
              </div>
              {/* Le volume, sans quoi un 100 % sur deux tirs passe pour un exploit. */}
              <div className="font-mono text-[9px] text-[rgba(245,241,232,0.4)] mt-0.5">
                {value.makes}/{value.attempts}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[rgba(245,241,232,0.45)] mt-0.5">
                {short}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Une ligne du classement par spot. `rank` à `null` = hors classement. */
function SpotRow({
  player,
  rank,
  value,
  color,
}: {
  player: PlayerStat;
  rank: number | null;
  value?: Rate;
  color: string;
}) {
  const rate = value?.rate ?? 0;

  return (
    <div
      className={`grid grid-cols-[60px_1fr_150px] gap-4 p-4 items-center hover:bg-[rgba(0,191,255,0.04)] transition-colors mobile:flex mobile:gap-2.5 mobile:p-2.5 ${
        rank === null ? 'opacity-50' : ''
      }`}
    >
      <div
        className={`font-mono font-bold text-lg mobile:text-sm mobile:w-7 mobile:shrink-0 ${
          rank === null ? 'text-[rgba(245,241,232,0.2)]' : rankColor(rank - 1)
        }`}
      >
        {rank === null ? '—' : `#${rank}`}
      </div>

      <div className="flex items-center gap-3 mobile:gap-2 min-w-0 mobile:flex-1">
        <Avatar player={player} size="w-10 h-10 mobile:w-8 mobile:h-8" />
        <div className="font-bold text-[#F5F1E8] mobile:text-sm truncate">
          {player.firstName} {player.lastName}
        </div>
      </div>

      {/* Mobile : barre de niveau sous le pourcentage, pour comparer d'un coup d'œil */}
      <div className="font-mono text-lg mobile:text-base font-bold mobile:shrink-0 mobile:w-24 mobile:text-right" style={{ color }}>
        {rate.toFixed(1)}%
        <div className="font-mono text-[11px] mobile:text-[10px] font-normal text-[rgba(245,241,232,0.35)]">
          {value?.makes ?? 0}/{value?.attempts ?? 0}
        </div>
        <div className="hidden mobile:block mt-1 h-1 rounded-full bg-[rgba(245,241,232,0.07)] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, rate))}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
