'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Court } from '@/components/shooting/Court';
import { LF_SPOT } from '@/components/shooting/constants';
import { Undo2, X, Trophy, ChevronDown } from 'lucide-react';
import { useMediaQuery } from '@/lib/useMediaQuery';
import type { AnySpot, SpotScore } from '@/components/shooting/types';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
  avatar: string;
}

interface SessionPlayer {
  id: string;
  playerId: string;
  player: Player;
  totalPoints: number;
}

interface Spot {
  id: string;
  num: number;
  label: string;
  sub: string;
  x: number;
  y: number;
  zone: string;
}

interface Session {
  id: string;
  courtId: string;
  court: {
    id: string;
    name: string;
    spotsConfig: Spot[];
  };
  sessionPlayers: SessionPlayer[];
}

interface HistoryEntry {
  spotIndex: number;
  playerIndex: number;
  mode: 'shooting' | 'validating';
  currentMakes: number | null;
  savedScore?: { sessionPlayerId: string; spotId: string; previous: SpotScore } | null;
}

/**
 * 100dvh suit la barre d'URL mobile. `h-screen` reste en repli pour les
 * navigateurs qui ignorent l'unité : la déclaration inline est alors invalide
 * et c'est la classe qui s'applique.
 */
const FULL_HEIGHT_STYLE = { height: '100dvh' } as const;

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentSpotIndex, setCurrentSpotIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [mode, setMode] = useState<'shooting' | 'validating'>('shooting');
  const [currentMakes, setCurrentMakes] = useState<number | null>(null);

  const [scores, setScores] = useState<Record<string, Record<string, SpotScore>>>({});

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Modal de confirmation pour quitter
  const [showQuitModal, setShowQuitModal] = useState(false);
  // Classement : panneau permanent en desktop, feuille glissante en mobile
  const [showRanking, setShowRanking] = useState(false);

  const allowLeaveRef = useRef(false);

  // Sur petit écran le terrain est réduit : on grossit les pastilles de spot
  const isMobile = useMediaQuery('(max-width: 880px)');
  const spotScale = isMobile ? 1.3 : 1;

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Session non trouvée');
      const data = await res.json();

      if (!data.court?.spotsConfig || data.court.spotsConfig.length === 0) {
        alert('Le terrain n\'a aucun spot configuré. Allez sur /api/seed pour initialiser.');
        router.push('/home');
        return;
      }

      setSession(data);

      const initialScores: Record<string, Record<string, SpotScore>> = {};
      data.sessionPlayers.forEach((sp: SessionPlayer) => {
        initialScores[sp.id] = {};
        data.court.spotsConfig.forEach((spot: Spot) => {
          initialScores[sp.id][spot.id] = { makes: null, ftMakes: null, points: 0 };
        });
      });
      setScores(initialScores);
    } catch (error) {
      console.error('Erreur fetch session:', error);
      alert('Session introuvable');
      router.push('/home');
    } finally {
      setLoading(false);
    }
  };

  // Pas de pull-to-refresh pendant une session : un geste vers le bas
  // rechargerait la page et ferait perdre la saisie en cours. Restreint à
  // cette page — ailleurs on garde le défilement natif de Chrome.
  useEffect(() => {
    const el = document.documentElement;
    const previous = el.style.overscrollBehavior;
    el.style.overscrollBehavior = 'none';
    return () => {
      el.style.overscrollBehavior = previous;
    };
  }, []);

  // ====== BLOCAGE TOTAL DU BOUTON RETOUR ======
  useEffect(() => {
    if (!session) return;

    // On pousse plusieurs states d'un coup au démarrage pour créer un buffer solide
    // Ça évite qu'un back sorte de la page
    for (let i = 0; i < 50; i++) {
      window.history.pushState({ sessionLock: true, i }, '');
    }

    const handlePopState = () => {
      // Si sortie autorisée (fin de session ou bouton Quitter)
      if (allowLeaveRef.current) {
        return;
      }

      // Sinon on re-pousse immédiatement pour bloquer
      window.history.pushState({ sessionLock: true }, '');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [session]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;

      const last = prev[prev.length - 1];

      setCurrentSpotIndex(last.spotIndex);
      setCurrentPlayerIndex(last.playerIndex);
      setMode(last.mode);
      setCurrentMakes(last.currentMakes);

      if (last.savedScore) {
        const { sessionPlayerId, spotId, previous } = last.savedScore;
        setScores((s) => ({
          ...s,
          [sessionPlayerId]: {
            ...s[sessionPlayerId],
            [spotId]: previous,
          },
        }));
      }

      return prev.slice(0, -1);
    });
  }, []);

  const handleQuitConfirm = () => {
    allowLeaveRef.current = true;
    router.push('/home');
  };

  const handleMakes = useCallback((makes: number) => {
    if (!session || mode !== 'shooting') return;

    setHistory((prev) => [...prev, {
      spotIndex: currentSpotIndex,
      playerIndex: currentPlayerIndex,
      mode: 'shooting',
      currentMakes: null,
      savedScore: null,
    }]);

    setCurrentMakes(makes);
    setMode('validating');
  }, [session, mode, currentSpotIndex, currentPlayerIndex]);

  const handleFt = useCallback(async (ftMakes: number) => {
    if (!session || mode !== 'validating' || currentMakes === null) return;

    const currentSessionPlayer = session.sessionPlayers[currentPlayerIndex];
    const currentSpot = session.court.spotsConfig[currentSpotIndex];
    const points = currentMakes * ftMakes;

    const previousScore = scores[currentSessionPlayer.id]?.[currentSpot.id]
      || { makes: null, ftMakes: null, points: 0 };

    setHistory((prev) => [...prev, {
      spotIndex: currentSpotIndex,
      playerIndex: currentPlayerIndex,
      mode: 'validating',
      currentMakes,
      savedScore: {
        sessionPlayerId: currentSessionPlayer.id,
        spotId: currentSpot.id,
        previous: previousScore,
      },
    }]);

    try {
      await fetch(`/api/sessions/${sessionId}/spot-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionPlayerId: currentSessionPlayer.id,
          spotNum: currentSpot.num,
          spotLabel: currentSpot.label,
          spotSub: currentSpot.sub,
          makes: currentMakes,
          ftMakes,
          points,
        }),
      });
    } catch (error) {
      console.error('Erreur sauvegarde spot result:', error);
    }

    setScores((prev) => ({
      ...prev,
      [currentSessionPlayer.id]: {
        ...prev[currentSessionPlayer.id],
        [currentSpot.id]: { makes: currentMakes, ftMakes, points },
      },
    }));

    const nextPlayerIndex = currentPlayerIndex + 1;

    if (nextPlayerIndex >= session.sessionPlayers.length) {
      const nextSpotIndex = currentSpotIndex + 1;

      if (nextSpotIndex >= session.court.spotsConfig.length) {
        // Fin de session : on autorise la navigation
        allowLeaveRef.current = true;
        router.push(`/session/${sessionId}/results`);
        return;
      }

      setCurrentSpotIndex(nextSpotIndex);
      setCurrentPlayerIndex(0);
    } else {
      setCurrentPlayerIndex(nextPlayerIndex);
    }

    setCurrentMakes(null);
    setMode('shooting');
  }, [session, mode, currentMakes, currentPlayerIndex, currentSpotIndex, sessionId, router, scores]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const k = e.key;

      if (k === 'Backspace' || k === 'Escape') {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (mode === 'shooting') {
        if (/^[0-9]$/.test(k)) { e.preventDefault(); handleMakes(parseInt(k, 10)); }
        else if (k === '+' || k === '=' || k === 't' || k === 'T') { e.preventDefault(); handleMakes(10); }
      } else if (mode === 'validating') {
        if (k === '0' || k === '1' || k === '2') { e.preventDefault(); handleFt(parseInt(k, 10)); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, handleMakes, handleFt, handleUndo]);

  const spotsToRender = useMemo<AnySpot[]>(() => {
    if (!session) return [];
    const baseSpots = session.court.spotsConfig as AnySpot[];
    return mode === 'validating' ? [LF_SPOT] : baseSpots;
  }, [session, mode]);

  const renderStates = useMemo<Record<string, SpotScore | null>>(() => {
    if (!session) return {};
    const currentSessionPlayer = session.sessionPlayers[currentPlayerIndex];
    return scores[currentSessionPlayer.id] || {};
  }, [session, scores, currentPlayerIndex]);

  const totals = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    Object.entries(scores).forEach(([sessionPlayerId, spotScores]) => {
      out[sessionPlayerId] = Object.values(spotScores).reduce((sum, s) => sum + s.points, 0);
    });
    return out;
  }, [scores]);

  if (loading) {
    return (
      <div
        className="h-screen bg-[#0A1628] flex items-center justify-center"
        style={FULL_HEIGHT_STYLE}
      >
        <div className="text-[rgba(245,241,232,0.55)] font-mono text-sm">Chargement...</div>
      </div>
    );
  }

  if (!session) return null;

  const currentSessionPlayer = session.sessionPlayers[currentPlayerIndex];
  const currentSpot = session.court.spotsConfig[currentSpotIndex];
  const currentPlayer = currentSessionPlayer.player;
  const canUndo = history.length > 0;
  const currentTotal = totals[currentSessionPlayer.id] ?? 0;
  const initials = `${currentPlayer.firstName[0]}${currentPlayer.lastName[0]}`;

  const rankedPlayers = [...session.sessionPlayers].sort(
    (a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0)
  );

  return (
    <div
      className="h-screen overflow-hidden select-none bg-gradient-to-br from-[#0A1628] via-[#0d1f38] to-[#0A1628] flex flex-col pt-safe-t pb-safe-b"
      style={FULL_HEIGHT_STYLE}
    >

      {/* ============ HEADER ============ */}
      <header className="shrink-0 px-8 py-4 mobile:px-2.5 mobile:pt-2 mobile:pb-1.5 short:py-1 border-b border-[rgba(0,191,255,0.1)] bg-[rgba(0,191,255,0.02)]">
        <div className="flex items-center gap-6 mobile:gap-2">

          {/* Quitter */}
          <button
            onClick={() => setShowQuitModal(true)}
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-red-400 hover:bg-[rgba(239,68,68,0.2)] active:scale-90 transition-all"
            aria-label="Quitter la session"
          >
            <X size={20} />
          </button>

          {/* Titre + avancement */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl mobile:text-sm font-extrabold text-[#F5F1E8] tracking-wide truncate leading-tight">
              SESSION EN COURS
            </h1>
            <p className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-widest truncate">
              Spot {currentSpotIndex + 1} / {session.court.spotsConfig.length}
              <span className="mobile:hidden">
                {' '}· Joueur {currentPlayerIndex + 1} / {session.sessionPlayers.length}
              </span>
            </p>
          </div>

          {/* Joueur courant — desktop (en mobile il est collé au pavé de saisie) */}
          <div className="flex mobile:hidden items-center gap-3 px-4 py-2 bg-[rgba(0,191,255,0.08)] rounded-full border border-[rgba(0,191,255,0.15)] shrink-0">
            {currentPlayer.photo ? (
              <img src={currentPlayer.photo} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00BFFF]" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#0A1628] ring-2 ring-[#00BFFF]"
                style={{ backgroundColor: currentPlayer.avatar }}
              >
                {initials}
              </div>
            )}
            <span className="text-base font-bold text-[#F5F1E8] pr-2">
              {currentPlayer.firstName}
            </span>
          </div>

          {/* Annuler */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`shrink-0 flex items-center gap-1.5 h-10 px-4 mobile:px-3 rounded-xl text-sm mobile:text-xs font-bold transition-all ${
              canUndo
                ? 'bg-[rgba(255,180,0,0.15)] border border-[rgba(255,180,0,0.35)] text-[#FFB400] hover:bg-[rgba(255,180,0,0.25)] active:scale-90'
                : 'bg-[rgba(245,241,232,0.04)] border border-[rgba(245,241,232,0.08)] text-[rgba(245,241,232,0.25)] cursor-not-allowed'
            }`}
            aria-label="Annuler la dernière saisie"
          >
            <Undo2 size={16} className="shrink-0" />
            <span>Retour</span>
          </button>
        </div>

        {/* Avancement — segments proportionnels, lisibles à toutes les tailles */}
        <div className="mt-3 mobile:mt-1.5 short:mt-1 flex items-center gap-1.5 mobile:gap-[3px]">
          {session.court.spotsConfig.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1.5 mobile:h-1 rounded-full transition-all ${
                idx < currentSpotIndex
                  ? 'bg-[#00BFFF]'
                  : idx === currentSpotIndex
                  ? 'bg-[#00BFFF] shadow-[0_0_8px_rgba(0,191,255,0.7)]'
                  : 'bg-[rgba(0,191,255,0.15)]'
              }`}
            />
          ))}
        </div>
      </header>

      {/* ============ CORPS ============ */}
      <main className="flex-1 min-h-0 flex gap-8 px-8 py-6 mobile:flex-col mobile:gap-0 mobile:p-0 short:flex-row short:gap-2 short:p-2">

        {/* ---- Terrain : occupe toute la hauteur restante ---- */}
        <div className="flex-[1.4] min-h-0 flex items-center justify-center mobile:flex-1 mobile:px-2 mobile:py-2 short:flex-[1.2] short:p-0">
          <Court
            spots={spotsToRender}
            theme="hardwood"
            mode={mode}
            currentNum={currentSpot.num}
            renderStates={renderStates}
            showLabels={false}
            showSpotNumbers={true}
            spotScale={spotScale}
          />
        </div>

        {/* ---- Panneau de saisie ---- */}
        <div className="flex-1 max-w-[420px] min-w-[300px] min-h-0 flex flex-col gap-5 mobile:flex-none mobile:shrink-0 mobile:max-w-none mobile:min-w-0 mobile:gap-2 mobile:px-2.5 mobile:pb-2.5 short:flex-1 short:max-w-[46%] short:gap-1.5 short:px-0 short:pb-0">

          {/* Contexte mobile : joueur · spot · total.
              Collé au pavé pour rester dans le champ de vision au moment de saisir. */}
          <div className="hidden mobile:flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[rgba(0,191,255,0.08)] rounded-xl border border-[rgba(0,191,255,0.15)] min-w-0">
              {currentPlayer.photo ? (
                <img src={currentPlayer.photo} alt="" className="w-7 h-7 shrink-0 rounded-full object-cover ring-2 ring-[#00BFFF]" />
              ) : (
                <div
                  className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-[#0A1628] ring-2 ring-[#00BFFF]"
                  style={{ backgroundColor: currentPlayer.avatar }}
                >
                  {initials}
                </div>
              )}
              <span className="text-[13px] font-bold text-[#F5F1E8] truncate max-w-[84px]">
                {currentPlayer.firstName}
              </span>
            </div>

            <div className="flex-1 min-w-0 text-right">
              <div className="font-mono text-[10px] text-[rgba(245,241,232,0.45)] uppercase tracking-[0.14em] leading-tight truncate">
                {mode === 'validating' ? 'Lancers francs' : currentSpot.sub}
              </div>
              <div className="text-sm font-extrabold text-[#F5F1E8] leading-tight truncate">
                {mode === 'validating' ? `${currentMakes} / 10` : currentSpot.label}
              </div>
            </div>

            <button
              onClick={() => setShowRanking(true)}
              className="shrink-0 flex items-center gap-1.5 h-10 px-2.5 rounded-xl bg-[rgba(0,191,255,0.1)] border border-[rgba(0,191,255,0.25)] active:scale-90 transition-transform"
              aria-label="Afficher le classement"
            >
              <Trophy size={14} className="text-[#00BFFF]" />
              <span className="font-mono text-base font-extrabold text-[#00BFFF] leading-none">{currentTotal}</span>
            </button>
          </div>

          {/* Carte spot — desktop */}
          <div className="block mobile:hidden relative overflow-hidden rounded-2xl bg-gradient-to-br from-[rgba(0,191,255,0.12)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.2)] p-6 shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00BFFF] opacity-5 blur-3xl rounded-full" />
            <div className="relative">
              <div className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em] mb-2">
                {mode === 'validating' ? 'Validation · Lancers Francs' : currentSpot.sub}
              </div>
              <div className="text-3xl font-extrabold text-[#F5F1E8] tracking-tight">
                {mode === 'validating' ? `${currentMakes} / 10` : currentSpot.label}
              </div>
            </div>
          </div>

          {/* Pavé : paniers réussis */}
          {mode === 'shooting' && (
            <div className="flex-1 min-h-0 rounded-2xl bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] p-6 flex flex-col mobile:flex-none mobile:shrink-0 mobile:p-2">
              <div className="block mobile:hidden font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em] mb-4 shrink-0">
                Paniers Réussis
              </div>
              <div className="grid grid-cols-5 gap-2.5 flex-1 content-center mobile:flex-none mobile:gap-1.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleMakes(i)}
                    className="aspect-square mobile:aspect-auto mobile:h-[clamp(46px,8.6dvh,74px)] rounded-xl bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.15)] text-[#F5F1E8] font-bold text-xl hover:bg-[rgba(0,191,255,0.15)] hover:border-[#00BFFF] active:scale-90 active:bg-[rgba(0,191,255,0.25)] transition-transform"
                  >
                    {i}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleMakes(10)}
                  className="col-span-5 py-4 mobile:py-0 mobile:h-[clamp(48px,8.4dvh,72px)] rounded-xl bg-[#00BFFF] text-[#0A1628] font-extrabold text-2xl hover:shadow-[0_0_40px_rgba(0,191,255,0.4)] active:scale-[0.97] transition-transform"
                >
                  10
                </button>
              </div>
            </div>
          )}

          {/* Pavé : multiplicateur lancers francs */}
          {mode === 'validating' && (
            <div className="flex-1 min-h-0 rounded-2xl bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] p-6 flex flex-col mobile:flex-none mobile:shrink-0 mobile:p-2">
              <div className="block mobile:hidden font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em] mb-4 shrink-0">
                Multiplicateur
              </div>
              <div className="grid grid-cols-3 gap-4 flex-1 content-center mobile:flex-none mobile:gap-1.5">
                {[0, 1, 2].map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => handleFt(ft)}
                    className="aspect-square mobile:aspect-auto mobile:h-[clamp(96px,18dvh,190px)] rounded-xl bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.15)] hover:bg-[rgba(0,191,255,0.15)] hover:border-[#00BFFF] active:scale-95 active:bg-[rgba(0,191,255,0.25)] transition-transform flex flex-col items-center justify-center"
                  >
                    <div className="text-5xl mobile:text-4xl font-extrabold text-[#F5F1E8] leading-none">
                      {ft}<span className="text-2xl mobile:text-xl opacity-40">/2</span>
                    </div>
                    <div className="font-mono text-xs text-[rgba(245,241,232,0.4)] mt-3 mobile:mt-2">×{ft}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Classement — panneau permanent en desktop */}
          <div className="flex mobile:hidden shrink-0 max-h-[280px] rounded-2xl bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] p-5 flex-col">
            <div className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em] mb-3 shrink-0">
              Classement
            </div>
            <div className="space-y-1.5 scroll-area pr-1">
              {session.sessionPlayers.map((sp, idx) => (
                <div
                  key={sp.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    idx === currentPlayerIndex
                      ? 'bg-[rgba(0,191,255,0.15)] border border-[rgba(0,191,255,0.3)]'
                      : 'bg-[rgba(0,191,255,0.02)] border border-transparent'
                  }`}
                >
                  <span className={`text-sm font-bold truncate ${idx === currentPlayerIndex ? 'text-[#00BFFF]' : 'text-[rgba(245,241,232,0.7)]'}`}>
                    {sp.player.firstName}
                  </span>
                  <span className="font-mono text-lg font-extrabold text-[#00BFFF] ml-2">{totals[sp.id] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ============ CLASSEMENT MOBILE (feuille glissante) ============ */}
      {showRanking && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden mobile:flex items-end"
          onClick={() => setShowRanking(false)}
        >
          <div
            className="w-full bg-[#0d1f38] border-t border-[rgba(0,191,255,0.25)] rounded-t-3xl max-h-[75dvh] flex flex-col pb-safe-b animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-[rgba(0,191,255,0.12)]">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-[#00BFFF]" />
                <h2 className="text-base font-bold text-[#F5F1E8]">Classement</h2>
              </div>
              <button
                onClick={() => setShowRanking(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[rgba(245,241,232,0.06)] text-[rgba(245,241,232,0.6)] active:scale-90 transition-transform"
                aria-label="Fermer le classement"
              >
                <ChevronDown size={20} />
              </button>
            </div>

            <div className="scroll-area px-4 py-3 space-y-2">
              {rankedPlayers.map((sp, idx) => {
                const isActive = sp.id === currentSessionPlayer.id;
                return (
                  <div
                    key={sp.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                      isActive
                        ? 'bg-[rgba(0,191,255,0.15)] border border-[rgba(0,191,255,0.35)]'
                        : 'bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.1)]'
                    }`}
                  >
                    <span className={`font-mono text-sm font-extrabold w-6 shrink-0 ${
                      idx === 0
                        ? 'text-[#FFD700]'
                        : idx === 1
                        ? 'text-[#C0C0C0]'
                        : idx === 2
                        ? 'text-[#CD7F32]'
                        : 'text-[rgba(245,241,232,0.35)]'
                    }`}>
                      {idx + 1}
                    </span>
                    {sp.player.photo ? (
                      <img src={sp.player.photo} alt="" className="w-8 h-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-[#0A1628]"
                        style={{ backgroundColor: sp.player.avatar }}
                      >
                        {sp.player.firstName[0]}{sp.player.lastName[0]}
                      </div>
                    )}
                    <span className={`flex-1 min-w-0 text-sm font-bold truncate ${isActive ? 'text-[#00BFFF]' : 'text-[#F5F1E8]'}`}>
                      {sp.player.firstName} {sp.player.lastName}
                    </span>
                    <span className="font-mono text-lg font-extrabold text-[#00BFFF] shrink-0">{totals[sp.id] ?? 0}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL QUITTER ============ */}
      {showQuitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A1628] border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden max-h-[85dvh] flex flex-col">
            <div className="shrink-0 px-6 py-5 mobile:px-4 mobile:py-4 border-b border-red-500/20 bg-gradient-to-r from-red-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 mobile:w-10 mobile:h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <X size={22} className="text-red-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl mobile:text-lg font-bold text-[#F5F1E8]">
                    Quitter la session ?
                  </h2>
                  <p className="text-sm mobile:text-xs text-[rgba(245,241,232,0.55)] mt-0.5">
                    La progression sera perdue
                  </p>
                </div>
              </div>
            </div>

            <div className="scroll-area p-6 mobile:p-4">
              <p className="text-sm text-[#F5F1E8]">
                Vous êtes sur le point de quitter la session en cours. Les scores enregistrés jusqu&apos;ici resteront sauvegardés, mais vous ne pourrez pas reprendre la session.
              </p>
            </div>

            <div className="shrink-0 flex gap-3 px-6 py-4 mobile:px-4 bg-[rgba(245,241,232,0.02)] border-t border-[rgba(245,241,232,0.05)]">
              <button
                onClick={() => setShowQuitModal(false)}
                className="flex-1 px-4 py-3 bg-[rgba(245,241,232,0.08)] text-[#F5F1E8] rounded-xl font-bold text-sm hover:bg-[rgba(245,241,232,0.15)] active:scale-95 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleQuitConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/30"
              >
                <X size={16} />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
