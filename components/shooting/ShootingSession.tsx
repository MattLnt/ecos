'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Court } from './Court';
import { SHOT_SPOTS, LF_SPOT } from './constants';
import type { AnySpot, Mode, SessionResult, SpotScore, ThemeKey } from './types';

// ============================================================
//  Helpers
// ============================================================

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(-2)}`;
}

function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function useSessionTimer() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return { elapsed: formatDuration(now - start), startedAt: start };
}

// ============================================================
//  Logo ECOS
// ============================================================

function EcosLogo({ size = 36 }: { size?: number }) {
  return (
    <img 
      src="/ecos.png" 
      alt="ECOS" 
      width={size} 
      height={size}
      style={{ display: 'block' }}
    />
  );
}

// ============================================================
//  Main component
// ============================================================

export interface ShootingSessionProps {
  playerName?: string;
  playerPos?: string;
  sessionName?: string;
  theme?: ThemeKey;
  onComplete?: (result: SessionResult) => void;
}

export function ShootingSession({
  playerName = 'JOUEUR',
  playerPos  = 'SG',
  sessionName = 'SESSION 1',
  theme = 'hardwood',
  onComplete,
}: ShootingSessionProps) {
  const [mode, setMode] = useState<Mode>('shooting');
  const [currentNum, setCurrentNum] = useState(1);
  const [scores, setScores] = useState<Record<number, SpotScore>>(() => {
    const init: Record<number, SpotScore> = {};
    for (let n = 1; n <= 10; n++) init[n] = { makes: null, ftMakes: null, points: 0 };
    return init;
  });
  const [history, setHistory] = useState<Array<{ type: 'makes' | 'ft'; num: number; prev: SpotScore }>>([]);

  const { elapsed, startedAt } = useSessionTimer();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const recordMakes = useCallback((n: number) => {
    if (mode !== 'shooting') return;
    setScores((prev) => {
      setHistory((h) => [...h, { type: 'makes', num: currentNum, prev: prev[currentNum] }]);
      return { ...prev, [currentNum]: { makes: n, ftMakes: null, points: 0 } };
    });
    setMode('validating');
  }, [mode, currentNum]);

  const recordFt = useCallback((ftMakes: number) => {
    if (mode !== 'validating') return;
    setScores((prev) => {
      const cur = prev[currentNum];
      if (cur.makes == null) return prev;
      setHistory((h) => [...h, { type: 'ft', num: currentNum, prev: cur }]);
      const next = { ...prev, [currentNum]: { makes: cur.makes, ftMakes, points: cur.makes * ftMakes } };
      if (currentNum === 10 && onComplete) {
        const totalPoints = Object.values(next).reduce((a, s) => a + (s.points || 0), 0);
        onComplete({
          playerId: playerName,
          startedAt: new Date(startedAt).toISOString(),
          endedAt: new Date().toISOString(),
          totalPoints,
          spots: SHOT_SPOTS.map((s) => ({
            num: s.num,
            label: s.label,
            sub: s.sub,
            makes: next[s.num].makes ?? 0,
            ftMakes: next[s.num].ftMakes ?? 0,
            points: next[s.num].points,
          })),
        });
      }
      return next;
    });
    if (currentNum < 10) {
      setCurrentNum((n) => n + 1);
      setMode('shooting');
    } else {
      setMode('complete');
    }
  }, [mode, currentNum, onComplete, playerName, startedAt]);

  const undoLast = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setScores((prev) => ({ ...prev, [last.num]: last.prev }));
      setCurrentNum(last.num);
      setMode(last.type === 'makes' ? 'shooting' : 'validating');
      return h.slice(0, -1);
    });
  }, []);

  const resetAll = useCallback(() => {
    if (!confirm('Nouvelle session ? Tous les scores seront effacés.')) return;
    const fresh: Record<number, SpotScore> = {};
    for (let n = 1; n <= 10; n++) fresh[n] = { makes: null, ftMakes: null, points: 0 };
    setScores(fresh);
    setHistory([]);
    setCurrentNum(1);
    setMode('shooting');
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt?.tagName === 'INPUT' || tgt?.tagName === 'TEXTAREA') return;
      const k = e.key;
      if (mode === 'shooting') {
        if (/^[0-9]$/.test(k)) { e.preventDefault(); recordMakes(parseInt(k, 10)); }
        else if (k === '+' || k === '=' || k === 't' || k === 'T') { e.preventDefault(); recordMakes(10); }
      } else if (mode === 'validating') {
        if (k === '0' || k === '1' || k === '2') { e.preventDefault(); recordFt(parseInt(k, 10)); }
      }
      if (k === 'z' || k === 'Z') { e.preventDefault(); undoLast(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, recordMakes, recordFt, undoLast]);

  const totals = useMemo(() => {
    let points = 0, completed = 0;
    for (let n = 1; n <= 10; n++) {
      const s = scores[n];
      if (s.ftMakes != null) { completed += 1; points += s.points; }
    }
    return { points, completed };
  }, [scores]);

  const currentSpot = SHOT_SPOTS.find((s) => s.num === currentNum);
  const currentScore = scores[currentNum];

  const spotsToRender: AnySpot[] = mode === 'validating' ? [LF_SPOT] : SHOT_SPOTS;
  const renderStates = useMemo(() => {
    const o: Record<string, SpotScore | null> = {};
    SHOT_SPOTS.forEach((s) => { o[s.id] = scores[s.num]; });
    o[LF_SPOT.id] = null;
    return o;
  }, [scores]);

  return (
    <div className="app">
      {/* ============ TOP BAR ============ */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><EcosLogo /></div>
          <div className="brand-text">
            <span className="name">ECOS EGUILLES</span>
            <span className="sub">CLUB OMNISPORTS · EST. 1968</span>
          </div>
        </div>

        <div className="top-center">
          SHOOTING SESSION<span className="dot"></span>{sessionName}
        </div>

        <div className="top-right">
          <div className="meta">
            <span className="k">DATE</span>
            <span className="v mono">{todayStr()}</span>
          </div>
          <div className="meta">
            <span className="k">CHRONO</span>
            <span className="v mono">{elapsed}</span>
          </div>
          <div className="meta">
            <span className="k">POINTS</span>
            <span className="v mono" style={{ color: 'var(--accent)' }}>{totals.points}</span>
          </div>
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <main className="main">
        {/* Stats mobiles */}
        <div className="mobile-stats">
          <div className="mobile-stat accent">
            <span className="label">POINTS</span>
            <span className="value">{totals.points}</span>
          </div>
          <div className="mobile-stat">
            <span className="label">SPOTS</span>
            <span className="value">{totals.completed}</span>
            <span className="sub">/10</span>
          </div>
          <div className="mobile-stat">
            <span className="label">ACTUEL</span>
            <span className="value">{currentNum}</span>
            <span className="sub">{currentSpot?.sub ?? '—'}</span>
          </div>
        </div>
        {/* LEFT */}
        <aside className="panel side left">
          <div className="card">
            <div className="card-title">JOUEUR</div>
            <div className="player">
              <div className="player-avatar">
                {playerName.split(' ').map((s) => s[0]).join('').slice(0, 2)}
              </div>
              <div className="player-info">
                <div className="player-name">{playerName}</div>
                <div className="player-pos">{playerPos} · #07</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">SCORE TOTAL</div>
            <div className="big-stat">
              <span className="num">{totals.points}</span>
              <span className="num-unit">PTS</span>
            </div>
            <div className="big-stat-sub">SUR UN MAXIMUM DE 200</div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(100, totals.points / 2)}%` }} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>PROGRESSION</span>
              <span className="count">{totals.completed}/10</span>
            </div>
            <div className="step-grid">
              {Array.from({ length: 10 }, (_, i) => {
                const n = i + 1;
                const sc = scores[n];
                const done = sc.ftMakes != null;
                const current = n === currentNum && mode !== 'complete';
                return (
                  <div key={n} className={`step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                    <span className="step-n">{n}</span>
                    {done && <span className="step-pts mono">{sc.points}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* COURT */}
        <section className="court-area">
          <Court
            spots={spotsToRender}
            theme={theme}
            mode={mode}
            currentNum={currentNum}
            renderStates={renderStates}
          />
        </section>

        {/* RIGHT */}
        <aside className="panel side">
          <div className="card" style={{ flex: '0 0 auto' }}>
            <div className="card-title">
              <span>SPOTS</span>
              <span className="count">{totals.completed}/10</span>
            </div>
            <div style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
              {SHOT_SPOTS.map((s) => {
                const sc = scores[s.num];
                const done = sc.ftMakes != null;
                const inProgress = sc.makes != null && sc.ftMakes == null;
                const active = currentNum === s.num && mode !== 'complete';
                return (
                  <div key={s.id} className={`spot-row ${active ? 'active' : ''} ${done ? 'completed' : ''}`}>
                    <span className="idx mono">{String(s.num).padStart(2, '0')}</span>
                    <span className="label">
                      {s.label}
                      <span style={{ marginLeft: 6, color: 'var(--text-faint)', fontSize: 10, letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
                        {s.sub}
                      </span>
                    </span>
                    <span className="mk mono">
                      {sc.makes != null ? `${sc.makes}/10` : '—'}
                      {sc.ftMakes != null && <span style={{ marginLeft: 4, opacity: 0.55 }}> · {sc.ftMakes}/2</span>}
                      {inProgress && <span style={{ marginLeft: 4, color: 'var(--accent)' }}> · LF…</span>}
                    </span>
                    <span className="pct mono" style={{
                      color: done
                        ? (sc.points >= 12 ? '#5FB573' : sc.points > 0 ? 'var(--accent)' : 'var(--text-faint)')
                        : active ? 'var(--accent)' : 'var(--text-faint)',
                    }}>
                      {done ? `${sc.points} PTS` : active ? '●' : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </main>

      {/* ============ BOTTOM ACTION BAR ============ */}
      <footer className={`action-bar mode-${mode}`}>
        <div className="action-left">
          {mode === 'complete' ? (
            <>
              <span style={{ color: 'var(--text-faint)' }}>SESSION TERMINÉE</span>
              <div className="now-shooting">
                <span className="k">TOTAL</span>
                <span className="v" style={{ color: 'var(--accent)', fontSize: 18 }}>{totals.points} PTS</span>
              </div>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--text-faint)' }}>
                {mode === 'validating' ? 'VALIDATION' : 'SPOT ACTIF'}
              </span>
              <div className="now-shooting">
                <span className="k">
                  {mode === 'validating' ? '2 LANCERS FRANCS' : (currentSpot?.sub ?? '—')}
                </span>
                <span className="v">
                  {mode === 'validating'
                    ? `SPOT ${currentNum} · ${currentScore?.makes ?? 0}/10`
                    : (currentSpot?.label ?? '—')}
                </span>
              </div>
              {mode === 'validating' && (
                <div className="now-shooting">
                  <span className="k">MULTIPLICATEUR</span>
                  <span className="v mono" style={{ color: 'var(--accent)' }}>0× · 1× · 2×</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="action-center">
          {mode === 'shooting' && (
            <div className="num-grid">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`btn-num ${i === 10 ? 'perfect' : ''}`}
                  onClick={() => recordMakes(i)}
                >
                  {i}
                </button>
              ))}
            </div>
          )}
          {mode === 'validating' && (
            <div className="ft-grid">
              <button type="button" className="btn-ft ft-0" onClick={() => recordFt(0)}>
                <span className="ft-n">0<span className="ft-d">/2</span></span>
                <span className="ft-x">×0</span>
              </button>
              <button type="button" className="btn-ft ft-1" onClick={() => recordFt(1)}>
                <span className="ft-n">1<span className="ft-d">/2</span></span>
                <span className="ft-x">×1</span>
              </button>
              <button type="button" className="btn-ft ft-2" onClick={() => recordFt(2)}>
                <span className="ft-n">2<span className="ft-d">/2</span></span>
                <span className="ft-x">×2</span>
              </button>
            </div>
          )}
          {mode === 'complete' && (
            <button type="button" className="btn btn-made" onClick={resetAll}>
              NOUVELLE SESSION
            </button>
          )}
        </div>

        <div className="action-right">
          <button type="button" className="btn btn-ghost" onClick={undoLast} disabled={history.length === 0}>
            ↶ ANNULER
          </button>
          {mode === 'shooting' && (
            <span style={{ marginLeft: 12 }}>
              <span className="kbd">0</span><span className="kbd" style={{ marginLeft: 4 }}>…</span><span className="kbd" style={{ marginLeft: 4 }}>9</span> · <span className="kbd" style={{ marginLeft: 4 }}>T</span> = 10
            </span>
          )}
          {mode === 'validating' && (
            <span style={{ marginLeft: 12 }}>
              <span className="kbd">0</span> <span className="kbd">1</span> <span className="kbd">2</span> = LF
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}