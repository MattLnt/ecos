'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Court } from '@/components/shooting/Court';
import { LF_SPOT } from '@/components/shooting/constants';
import { Undo2 } from 'lucide-react';
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

// Historique pour le retour arrière
interface HistoryEntry {
  spotIndex: number;
  playerIndex: number;
  mode: 'shooting' | 'validating';
  currentMakes: number | null;
  savedScore?: { sessionPlayerId: string; spotId: string; previous: SpotScore } | null;
}

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
  
  // Historique des actions pour le retour arrière
  const [history, setHistory] = useState<HistoryEntry[]>([]);

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

  const handleMakes = useCallback((makes: number) => {
    if (!session || mode !== 'shooting') return;
    
    // Sauvegarde l'état AVANT de changer
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

    // Sauvegarde l'état AVANT (avec l'ancien score pour pouvoir le restaurer)
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

  // ⏪ RETOUR ARRIÈRE
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const last = history[history.length - 1];

    // Restaure l'état précédent
    setCurrentSpotIndex(last.spotIndex);
    setCurrentPlayerIndex(last.playerIndex);
    setMode(last.mode);
    setCurrentMakes(last.currentMakes);

    // Si on annule une validation, on restaure l'ancien score
    if (last.savedScore) {
      const { sessionPlayerId, spotId, previous } = last.savedScore;
      setScores((prev) => ({
        ...prev,
        [sessionPlayerId]: {
          ...prev[sessionPlayerId],
          [spotId]: previous,
        },
      }));
    }

    // Retire la dernière entrée de l'historique
    setHistory((prev) => prev.slice(0, -1));
  }, [history]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const k = e.key;
      
      // Backspace ou Échap pour annuler
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

  if (loading) {
    return (
      <div className="h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-[rgba(245,241,232,0.55)] font-mono text-sm">Chargement...</div>
      </div>
    );
  }

  if (!session) return null;

  const currentSessionPlayer = session.sessionPlayers[currentPlayerIndex];
  const currentSpot = session.court.spotsConfig[currentSpotIndex];
  const currentPlayer = currentSessionPlayer.player;
  const canUndo = history.length > 0;

  return (
    <div className="min-h-screen lg:h-screen bg-gradient-to-br from-[#0A1628] via-[#0d1f38] to-[#0A1628] flex flex-col lg:overflow-hidden">
      
      {/* ============ HEADER ============ */}
      <header className="px-3 sm:px-6 lg:px-8 py-3 lg:py-4 border-b border-[rgba(0,191,255,0.1)] backdrop-blur-sm bg-[rgba(0,191,255,0.02)] shrink-0">
        <div className="flex items-center justify-between gap-3">
          
          {/* Info session */}
          <div className="flex items-center gap-3 lg:gap-8 min-w-0 flex-1">
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-xl font-extrabold text-[#F5F1E8] tracking-wide truncate">
                SESSION EN COURS
              </h1>
              <p className="font-mono text-[9px] sm:text-[10px] text-[rgba(245,241,232,0.35)] uppercase tracking-widest mt-0.5 lg:mt-1">
                Spot {currentSpotIndex + 1} / {session.court.spotsConfig.length}
              </p>
            </div>
            
            <div className="hidden lg:block h-10 w-px bg-[rgba(0,191,255,0.15)]" />
            
            {/* Joueur actuel */}
            <div className="flex items-center gap-2 lg:gap-3 px-2 sm:px-3 lg:px-4 py-1.5 lg:py-2 bg-[rgba(0,191,255,0.08)] rounded-full border border-[rgba(0,191,255,0.15)] flex-shrink-0">
              {currentPlayer.photo ? (
                <img src={currentPlayer.photo} alt="" className="w-7 h-7 lg:w-8 lg:h-8 rounded-full object-cover ring-2 ring-[#00BFFF]" />
              ) : (
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold text-[#0A1628] ring-2 ring-[#00BFFF]" style={{ backgroundColor: currentPlayer.avatar }}>
                  {currentPlayer.firstName[0]}{currentPlayer.lastName[0]}
                </div>
              )}
              <span className="text-sm lg:text-base font-bold text-[#F5F1E8] pr-1 lg:pr-2 truncate max-w-[80px] sm:max-w-none">
                {currentPlayer.firstName}
              </span>
            </div>
          </div>

          {/* Bouton RETOUR + Progress dots */}
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {/* Bouton Retour */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                canUndo
                  ? 'bg-[rgba(255,180,0,0.15)] border border-[rgba(255,180,0,0.35)] text-[#FFB400] hover:bg-[rgba(255,180,0,0.25)] active:scale-95'
                  : 'bg-[rgba(245,241,232,0.04)] border border-[rgba(245,241,232,0.08)] text-[rgba(245,241,232,0.25)] cursor-not-allowed'
              }`}
            >
              <Undo2 size={16} />
              <span className="hidden sm:inline">Retour</span>
            </button>

            {/* Progress dots - desktop */}
            <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {session.court.spotsConfig.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx < currentSpotIndex 
                      ? 'w-6 lg:w-8 bg-[#00BFFF]' 
                      : idx === currentSpotIndex 
                      ? 'w-10 lg:w-12 bg-[#00BFFF]' 
                      : 'w-4 lg:w-6 bg-[rgba(0,191,255,0.15)]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar mobile (remplace les dots) */}
        <div className="md:hidden mt-2 flex items-center gap-1">
          {session.court.spotsConfig.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-all ${
                idx <= currentSpotIndex ? 'bg-[#00BFFF]' : 'bg-[rgba(0,191,255,0.15)]'
              }`}
            />
          ))}
        </div>
      </header>

      {/* ============ MAIN LAYOUT ============ */}
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 lg:px-8 lg:min-h-0">
        
        {/* ============ TERRAIN ============ */}
        <div className="flex items-center justify-center px-3 py-3 sm:py-4 lg:py-8 order-1">
          <div className="w-full max-w-md lg:max-w-none lg:w-[75%] lg:h-[75%]">
            <Court
              spots={spotsToRender}
              theme="hardwood"
              mode={mode}
              currentNum={currentSpot.num}
              renderStates={renderStates}
              showLabels={false}
              showSpotNumbers={true}
            />
          </div>
        </div>

        {/* ============ PANEL ACTIONS ============ */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5 min-h-0 px-3 lg:px-0 pb-4 lg:py-8 order-2">
          
          {/* Card Spot Info */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[rgba(0,191,255,0.12)] to-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.2)] p-4 sm:p-5 lg:p-6 backdrop-blur-sm shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00BFFF] opacity-5 blur-3xl rounded-full" />
            <div className="relative">
              <div className="font-mono text-[9px] sm:text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em] mb-1.5 lg:mb-2">
                {mode === 'validating' ? 'Validation · Lancers Francs' : currentSpot.sub}
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#F5F1E8] tracking-tight">
                {mode === 'validating' ? `${currentMakes} / 10` : currentSpot.label}
              </div>
            </div>
          </div>

          {/* Shooting Buttons */}
          {mode === 'shooting' && (
            <div className="flex-1 rounded-2xl bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] p-3 sm:p-4 lg:p-6 backdrop-blur-sm min-h-0 flex flex-col">
              <div className="font-mono text-[9px] sm:text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em] mb-3 lg:mb-4 shrink-0">
                Paniers Réussis
              </div>
              <div className="flex-1 grid grid-cols-5 gap-2 sm:gap-2.5 content-start">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleMakes(i)}
                    className="aspect-square rounded-xl bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.15)] text-[#F5F1E8] font-bold text-lg sm:text-xl hover:bg-[rgba(0,191,255,0.15)] hover:border-[#00BFFF] active:scale-95 transition-all touch-manipulation"
                  >
                    {i}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleMakes(10)}
                  className="col-span-5 py-3 sm:py-4 rounded-xl bg-[#00BFFF] text-[#0A1628] font-extrabold text-xl sm:text-2xl hover:shadow-[0_0_40px_rgba(0,191,255,0.4)] active:scale-95 transition-all touch-manipulation"
                >
                  10
                </button>
              </div>
            </div>
          )}

          {/* Validation LF */}
          {mode === 'validating' && (
            <div className="flex-1 rounded-2xl bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] p-3 sm:p-4 lg:p-6 backdrop-blur-sm min-h-0 flex flex-col">
              <div className="font-mono text-[9px] sm:text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em] mb-3 lg:mb-4 shrink-0">
                Multiplicateur
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 content-center">
                {[0, 1, 2].map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => handleFt(ft)}
                    className="aspect-square rounded-xl bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.15)] hover:bg-[rgba(0,191,255,0.15)] hover:border-[#00BFFF] active:scale-95 transition-all flex flex-col items-center justify-center touch-manipulation"
                  >
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F5F1E8] leading-none">
                      {ft}<span className="text-lg sm:text-xl lg:text-2xl opacity-40">/2</span>
                    </div>
                    <div className="font-mono text-[10px] sm:text-xs text-[rgba(245,241,232,0.4)] mt-2 lg:mt-3">×{ft}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scores / Classement */}
          <div className="rounded-2xl bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] p-3 sm:p-4 lg:p-5 backdrop-blur-sm shrink-0 max-h-[200px] sm:max-h-[240px] lg:max-h-[280px] flex flex-col">
            <div className="font-mono text-[9px] sm:text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em] mb-2 lg:mb-3 shrink-0">
              Classement
            </div>
            <div className="space-y-1 sm:space-y-1.5 overflow-y-auto pr-1">
              {session.sessionPlayers.map((sp, idx) => {
                const total = Object.values(scores[sp.id] || {}).reduce((sum, s) => sum + s.points, 0);
                const isActive = idx === currentPlayerIndex;
                return (
                  <div 
                    key={sp.id} 
                    className={`flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all shrink-0 ${
                      isActive ? 'bg-[rgba(0,191,255,0.15)] border border-[rgba(0,191,255,0.3)]' : 'bg-[rgba(0,191,255,0.02)] border border-transparent'
                    }`}
                  >
                    <span className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-[#00BFFF]' : 'text-[rgba(245,241,232,0.7)]'}`}>
                      {sp.player.firstName}
                    </span>
                    <span className="font-mono text-base sm:text-lg font-extrabold text-[#00BFFF] ml-2">{total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}