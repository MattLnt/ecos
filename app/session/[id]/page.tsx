'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Court } from '@/components/shooting/Court';
import { LF_SPOT } from '@/components/shooting/constants';
import { Undo2, X, Trophy, ChevronDown, CloudOff, RefreshCw } from 'lucide-react';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useWakeLock } from '@/lib/useWakeLock';
import {
  enqueueSpotOp,
  startSpotQueue,
  usePendingSpotCount,
  useIsOnline,
} from '@/lib/spotQueue';
import { GROUP_LABELS, groupKeysOf, groupOf } from '@/lib/groups';
import type { AnySpot, SpotScore } from '@/components/shooting/types';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
  avatar: string;
}

interface SavedSpotResult {
  spotNum: number;
  makes: number;
  ftMakes: number;
  points: number;
}

interface SessionPlayer {
  id: string;
  playerId: string;
  player: Player;
  totalPoints: number;
  group: string | null;
  shootOrder: number;
  /** Spots déjà enregistrés, pour reprendre une session interrompue. */
  spotResults?: SavedSpotResult[];
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

/**
 * État de saisie d'un groupe de tir.
 *
 * Les groupes tournent sur des paniers différents et n'avancent pas au même
 * rythme : chacun garde donc son propre spot, son joueur courant et sa saisie
 * en attente. Un seul curseur global imposait un ordre de passage que le
 * terrain ne respecte jamais dès qu'il y a plus d'un panier.
 */
interface GroupState {
  /** Spot en cours. Égal au nombre de spots = groupe terminé. */
  spotIndex: number;
  /** Index dans l'ordre de passage du groupe. */
  playerIndex: number;
  /** Paniers saisis, en attente des lancers francs. `null` = rien en cours. */
  pendingMakes: number | null;
}

interface HistoryEntry extends GroupState {
  group: string;
  savedScore?: {
    sessionPlayerId: string;
    spotId: string;
    spotNum: number;
    previous: SpotScore;
  } | null;
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

  // Un état de saisie par groupe, et l'onglet actuellement affiché.
  const [groupStates, setGroupStates] = useState<Record<string, GroupState>>({});
  const [activeGroup, setActiveGroup] = useState<string>(GROUP_LABELS[0]);

  const [scores, setScores] = useState<Record<string, Record<string, SpotScore>>>({});

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Classement affiché : le groupe courant seul, ou toute la session.
  const [rankingScope, setRankingScope] = useState<'group' | 'all'>('all');

  // Modal de confirmation pour quitter
  const [showQuitModal, setShowQuitModal] = useState(false);
  // Classement : panneau permanent en desktop, feuille glissante en mobile
  const [showRanking, setShowRanking] = useState(false);

  const allowLeaveRef = useRef(false);
  /*
    Verrou de saisie. L'état ne repasse à 'shooting' qu'au rendu suivant : deux
    appuis rapprochés sur le pavé des lancers francs passaient tous deux la
    garde et enregistraient le spot deux fois. On retient donc la saisie qu'on
    vient de valider — groupe, spot, joueur — et on refuse la même.

    Un jeton plutôt qu'un booléen relâché plus tard : il se périme tout seul au
    passage au tireur suivant, sans minuteur. Un `requestAnimationFrame` ne
    s'exécute pas dans un onglet en arrière-plan, et un verrou qui attend un
    minuteur gelé fige toute la saisie.
  */
  const submittedRef = useRef<string | null>(null);

  // Sur petit écran le terrain est réduit : on grossit les pastilles de spot
  const isMobile = useMediaQuery('(max-width: 880px)');
  const spotScale = isMobile ? 1.3 : 1;

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  /**
   * Position d'un groupe à la reprise.
   *
   * La rotation est connue : tout le groupe tire le spot 1, puis le spot 2, et
   * ainsi de suite dans l'ordre de passage. On rend donc la première case
   * vide de cette rotation. Un trou au milieu — un joueur arrivé en retard,
   * une saisie annulée — fait reprendre sur ce trou, ce qui est le bon
   * comportement : c'est bien ce tir-là qui manque.
   */
  const resumeCursor = (
    groupPlayers: SessionPlayer[],
    spots: Spot[]
  ): GroupState => {
    for (let spotIndex = 0; spotIndex < spots.length; spotIndex += 1) {
      for (let playerIndex = 0; playerIndex < groupPlayers.length; playerIndex += 1) {
        const saved = groupPlayers[playerIndex].spotResults ?? [];
        const done = saved.some((r) => r.spotNum === spots[spotIndex].num);
        if (!done) return { spotIndex, playerIndex, pendingMakes: null };
      }
    }

    // Tous les spots du groupe sont remplis : groupe terminé.
    return { spotIndex: spots.length, playerIndex: 0, pendingMakes: null };
  };

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

      const spots: Spot[] = data.court.spotsConfig;

      /*
        L'état de saisie est reconstruit depuis la base, pas remis à zéro : un
        onglet fermé, un téléphone qui se verrouille ou un rechargement en
        pleine séance ne doivent rien coûter. L'ordre de passage vient du
        tirage au sort persisté à la création, donc la reprise respecte le
        même ordre.
      */
      const keys = groupKeysOf(data.sessionPlayers);
      const initialStates: Record<string, GroupState> = {};
      keys.forEach((key) => {
        const groupPlayers = (data.sessionPlayers as SessionPlayer[])
          .filter((sp) => groupOf(sp) === key)
          .sort((a, b) => a.shootOrder - b.shootOrder);
        initialStates[key] = resumeCursor(groupPlayers, spots);
      });
      setGroupStates(initialStates);
      setRankingScope(keys.length > 1 ? 'group' : 'all');

      // On ouvre sur un groupe qui a encore des spots à tirer.
      const firstOpen = keys.find((key) => initialStates[key].spotIndex < spots.length);
      setActiveGroup(firstOpen ?? keys[0] ?? GROUP_LABELS[0]);

      // Plus rien à saisir : la session est finie, on va droit aux résultats.
      if (keys.length > 0 && !firstOpen) {
        allowLeaveRef.current = true;
        router.replace(`/session/${sessionId}/results`);
        return;
      }

      const spotByNum = new Map(spots.map((spot) => [spot.num, spot]));
      const initialScores: Record<string, Record<string, SpotScore>> = {};
      data.sessionPlayers.forEach((sp: SessionPlayer) => {
        initialScores[sp.id] = {};
        spots.forEach((spot: Spot) => {
          initialScores[sp.id][spot.id] = { makes: null, ftMakes: null, points: 0 };
        });

        // Les spots déjà saisis réapparaissent sur le terrain et dans les totaux.
        (sp.spotResults ?? []).forEach((result) => {
          const spot = spotByNum.get(result.spotNum);
          if (!spot) return;
          initialScores[sp.id][spot.id] = {
            makes: result.makes,
            ftMakes: result.ftMakes,
            points: result.points,
          };
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

  /*
    Deux réglages du document, le temps de la session seulement.

    1. Pas de pull-to-refresh : un geste vers le bas rechargerait la page et
       ferait perdre la saisie en cours.

    2. `body` porte un `min-height: 100vh` global, utile aux pages qui
       défilent. Ici l'écran fait `100dvh` : sur mobile, `vh` ignore la barre
       d'URL alors que `dvh` en tient compte, donc le body dépassait le
       contenu de la hauteur exacte de cette barre — une bande vide en bas,
       et la page se mettait à défiler. On relâche la contrainte, le body
       suit alors l'écran.

    Les deux sont restaurés au démontage : les autres pages en ont besoin.
  */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previous = {
      overscroll: html.style.overscrollBehavior,
      minHeight: body.style.minHeight,
      overflow: body.style.overflow,
    };

    html.style.overscrollBehavior = 'none';
    body.style.minHeight = '0';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overscrollBehavior = previous.overscroll;
      body.style.minHeight = previous.minHeight;
      body.style.overflow = previous.overflow;
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

  const spotCount = session?.court.spotsConfig.length ?? 0;

  /** Groupes de la session, dans l'ordre des étiquettes. */
  const groupKeys = useMemo(
    () => (session ? groupKeysOf(session.sessionPlayers) : []),
    [session]
  );

  /** Joueurs de chaque groupe, dans leur ordre de passage. */
  const playersByGroup = useMemo(() => {
    const map: Record<string, SessionPlayer[]> = {};
    if (!session) return map;

    groupKeys.forEach((key) => { map[key] = []; });
    session.sessionPlayers.forEach((sp) => {
      const key = groupOf(sp);
      (map[key] = map[key] ?? []).push(sp);
    });
    // L'API trie déjà, mais la rotation ne doit pas en dépendre.
    Object.values(map).forEach((list) => list.sort((a, b) => a.shootOrder - b.shootOrder));

    return map;
  }, [session, groupKeys]);

  const isGroupFinished = useCallback(
    (state: GroupState | undefined) => !!state && spotCount > 0 && state.spotIndex >= spotCount,
    [spotCount]
  );

  const activeState = groupStates[activeGroup];
  const activeGroupPlayers = useMemo(
    () => playersByGroup[activeGroup] ?? [],
    [playersByGroup, activeGroup]
  );
  const mode: 'shooting' | 'validating' =
    activeState?.pendingMakes === null || activeState === undefined ? 'shooting' : 'validating';

  const handleUndo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;

    /*
      Une seule pile pour toute la session : « Retour » annule la dernière
      saisie faite, quel que soit le groupe, et ramène l'onglet dessus. C'est
      le seul comportement lisible quand trois paniers saisissent en alternance
      sur le même téléphone.
    */
    // Le jeton vise la saisie qu'on vient de défaire : il doit redevenir
    // valide, sinon ressaisir ce même tir serait refusé.
    submittedRef.current = null;

    setActiveGroup(last.group);
    setGroupStates((prev) => ({
      ...prev,
      [last.group]: {
        spotIndex: last.spotIndex,
        playerIndex: last.playerIndex,
        pendingMakes: last.pendingMakes,
      },
    }));

    if (last.savedScore) {
      const { sessionPlayerId, spotId, spotNum, previous } = last.savedScore;

      setScores((s) => ({
        ...s,
        [sessionPlayerId]: {
          ...s[sessionPlayerId],
          [spotId]: previous,
        },
      }));

      /*
        Le serveur garde aussi une trace du spot : sans ça, la ligne survivait
        au retour arrière et la ressaisie en créait une seconde. On supprime,
        ou on réécrit la valeur d'avant si le spot avait déjà été rempli.

        Comme la saisie, l'annulation part dans la file : hors réseau elle
        attend son tour, et elle remplace l'enregistrement du même spot qui n'a
        peut-être pas encore été envoyé.
      */
      if (previous.makes === null) {
        enqueueSpotOp({ kind: 'delete', sessionId, sessionPlayerId, spotNum });
      } else {
        enqueueSpotOp({
          kind: 'save',
          sessionId,
          sessionPlayerId,
          spotNum,
          spotLabel: session?.court.spotsConfig[last.spotIndex]?.label ?? '',
          spotSub: session?.court.spotsConfig[last.spotIndex]?.sub ?? '',
          makes: previous.makes,
          ftMakes: previous.ftMakes ?? 0,
          points: previous.points,
        });
      }
    }

    setHistory((prev) => prev.slice(0, -1));
  }, [history, sessionId, session]);

  const handleQuitConfirm = () => {
    allowLeaveRef.current = true;
    router.push('/home');
  };

  const handleMakes = useCallback((makes: number) => {
    if (!session) return;

    const state = groupStates[activeGroup];
    if (!state || state.pendingMakes !== null) return;
    // Groupe arrivé au bout de ses spots : plus rien à saisir.
    if (state.spotIndex >= session.court.spotsConfig.length) return;

    setHistory((prev) => [...prev, {
      group: activeGroup,
      spotIndex: state.spotIndex,
      playerIndex: state.playerIndex,
      pendingMakes: null,
      savedScore: null,
    }]);

    setGroupStates((prev) => ({
      ...prev,
      [activeGroup]: { ...state, pendingMakes: makes },
    }));
  }, [session, groupStates, activeGroup]);

  const handleFt = useCallback((ftMakes: number) => {
    if (!session) return;

    const state = groupStates[activeGroup];
    if (!state || state.pendingMakes === null) return;

    // Deuxième appui pendant que le premier est traité : même jeton, on ignore.
    const token = `${activeGroup}:${state.spotIndex}:${state.playerIndex}`;
    if (submittedRef.current === token) return;

    const groupPlayers = playersByGroup[activeGroup] ?? [];
    const currentSessionPlayer = groupPlayers[state.playerIndex];
    const currentSpot = session.court.spotsConfig[state.spotIndex];
    if (!currentSessionPlayer || !currentSpot) return;

    submittedRef.current = token;

    const currentMakes = state.pendingMakes;
    const points = currentMakes * ftMakes;

    const previousScore = scores[currentSessionPlayer.id]?.[currentSpot.id]
      || { makes: null, ftMakes: null, points: 0 };

    setHistory((prev) => [...prev, {
      group: activeGroup,
      spotIndex: state.spotIndex,
      playerIndex: state.playerIndex,
      pendingMakes: currentMakes,
      savedScore: {
        sessionPlayerId: currentSessionPlayer.id,
        spotId: currentSpot.id,
        spotNum: currentSpot.num,
        previous: previousScore,
      },
    }]);

    setScores((prev) => ({
      ...prev,
      [currentSessionPlayer.id]: {
        ...prev[currentSessionPlayer.id],
        [currentSpot.id]: { makes: currentMakes, ftMakes, points },
      },
    }));

    /*
      La saisie part dans la file, qui l'envoie tout de suite si le réseau
      répond et la garde sinon. L'écran n'attend jamais : sur un terrain mal
      couvert, le joueur suivant doit pouvoir saisir dans la foulée.
    */
    enqueueSpotOp({
      kind: 'save',
      sessionId,
      sessionPlayerId: currentSessionPlayer.id,
      spotNum: currentSpot.num,
      spotLabel: currentSpot.label,
      spotSub: currentSpot.sub,
      makes: currentMakes,
      ftMakes,
      points,
    });

    /*
      Avancement du seul groupe actif : joueur suivant dans l'ordre de passage,
      puis spot suivant quand tout le groupe a tiré. Les autres groupes gardent
      leur position.
    */
    const nextPlayerIndex = state.playerIndex + 1;
    const advanced: GroupState =
      nextPlayerIndex >= groupPlayers.length
        ? { spotIndex: state.spotIndex + 1, playerIndex: 0, pendingMakes: null }
        : { spotIndex: state.spotIndex, playerIndex: nextPlayerIndex, pendingMakes: null };

    const nextStates = { ...groupStates, [activeGroup]: advanced };
    setGroupStates(nextStates);

    const total = session.court.spotsConfig.length;
    const finished = (key: string) => (nextStates[key]?.spotIndex ?? 0) >= total;

    // La session ne se termine que quand tous les paniers ont fini leurs spots.
    if (groupKeys.every(finished)) {
      allowLeaveRef.current = true;
      router.push(`/session/${sessionId}/results`);
      return;
    }

    // Ce groupe a fini : on bascule sur un panier encore en cours plutôt que
    // de laisser un écran de saisie inerte à l'appareil posé sur le terrain.
    if (finished(activeGroup)) {
      const nextGroup = groupKeys.find((key) => !finished(key));
      if (nextGroup) setActiveGroup(nextGroup);
    }
  }, [session, groupStates, activeGroup, playersByGroup, groupKeys, sessionId, router, scores]);

  /*
    Bascule d'onglet. Un groupe terminé n'est pas sélectionnable : son écran de
    saisie n'aurait plus de tireur, et son score reste consultable dans le
    classement.
  */
  const handleSelectGroup = useCallback((key: string) => {
    if (isGroupFinished(groupStates[key])) return;
    setActiveGroup(key);
  }, [groupStates, isGroupFinished]);

  /*
    L'écran reste allumé tant que la session tourne : le téléphone est posé au
    milieu du terrain et les joueurs viennent saisir entre deux spots.
  */
  useWakeLock(!!session);

  /*
    La file est rejouée au retour du réseau et quand l'onglet repasse au
    premier plan — y compris les saisies d'une visite précédente, qu'un
    rechargement aurait sinon laissées en plan.
  */
  useEffect(() => startSpotQueue(), []);

  const pendingSaves = usePendingSpotCount();
  const isOnline = useIsOnline();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const k = e.key;

      // Pendant qu'une modale est ouverte, aucune frappe ne doit saisir un score.
      if (showRanking || showQuitModal) {
        if (k === 'Escape') {
          e.preventDefault();
          setShowRanking(false);
          setShowQuitModal(false);
        }
        return;
      }

      if (k === 'Backspace' || k === 'Escape') {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (k === 's' || k === 'S') {
        e.preventDefault();
        setShowRanking(true);
        return;
      }

      // Flèches : passer d'un groupe à l'autre au clavier.
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        if (groupKeys.length < 2) return;
        e.preventDefault();
        const from = groupKeys.indexOf(activeGroup);
        const step = k === 'ArrowRight' ? 1 : -1;
        for (let i = 1; i <= groupKeys.length; i += 1) {
          const index = (((from + step * i) % groupKeys.length) + groupKeys.length) % groupKeys.length;
          const candidate = groupKeys[index];
          if (!isGroupFinished(groupStates[candidate])) {
            setActiveGroup(candidate);
            return;
          }
        }
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
  }, [mode, handleMakes, handleFt, handleUndo, showRanking, showQuitModal,
      groupKeys, activeGroup, groupStates, isGroupFinished]);

  const spotsToRender = useMemo<AnySpot[]>(() => {
    if (!session) return [];
    const baseSpots = session.court.spotsConfig as AnySpot[];
    return mode === 'validating' ? [LF_SPOT] : baseSpots;
  }, [session, mode]);

  const renderStates = useMemo<Record<string, SpotScore | null>>(() => {
    if (!session) return {};
    const shooter = activeGroupPlayers[activeState?.playerIndex ?? 0];
    return (shooter && scores[shooter.id]) || {};
  }, [session, scores, activeGroupPlayers, activeState]);

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

  /*
    Replis volontaires. Un groupe terminé n'est pas sélectionnable et la session
    part sur les résultats dès que tous les groupes ont fini : ces bornes ne
    servent qu'à garantir qu'aucun rendu intermédiaire ne tombe sur `undefined`.
  */
  const currentSpotIndex = Math.min(activeState?.spotIndex ?? 0, Math.max(spotCount - 1, 0));
  const currentPlayerIndex = activeState?.playerIndex ?? 0;
  const currentMakes = activeState?.pendingMakes ?? null;

  const currentSessionPlayer = activeGroupPlayers[currentPlayerIndex] ?? activeGroupPlayers[0];
  const currentSpot = session.court.spotsConfig[currentSpotIndex];
  if (!currentSessionPlayer || !currentSpot) return null;

  const currentPlayer = currentSessionPlayer.player;
  const canUndo = history.length > 0;
  const currentTotal = totals[currentSessionPlayer.id] ?? 0;
  const initials = `${currentPlayer.firstName[0]}${currentPlayer.lastName[0]}`;

  const hasGroups = groupKeys.length > 1;

  // Classement : le groupe affiché seul, ou toute la session.
  const rankingPlayers = rankingScope === 'group' && hasGroups
    ? activeGroupPlayers
    : session.sessionPlayers;

  const rankedPlayers = [...rankingPlayers].sort(
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
              {hasGroups && <>Groupe {activeGroup} · </>}
              Spot {currentSpotIndex + 1} / {spotCount}
              <span className="mobile:hidden">
                {' '}· Joueur {currentPlayerIndex + 1} / {activeGroupPlayers.length}
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

          {/* Score en direct — ouvre la popup de classement */}
          <button
            onClick={() => setShowRanking(true)}
            className="flex mobile:hidden shrink-0 items-center gap-2 h-10 px-4 rounded-xl bg-[rgba(0,191,255,0.1)] border border-[rgba(0,191,255,0.25)] text-[#00BFFF] text-sm font-bold hover:bg-[rgba(0,191,255,0.2)] active:scale-90 transition-all"
            aria-label="Afficher le score en direct"
          >
            <Trophy size={16} className="shrink-0" />
            <span>Score live</span>
          </button>

          {/* État d'envoi.
              Visible seulement quand il y a quelque chose à signaler : une
              saisie pas encore confirmée, ou la connexion tombée. Tant que ce
              badge est affiché, il ne faut pas fermer l'onglet. */}
          {(!isOnline || pendingSaves > 0) && (
            <div
              className={`shrink-0 flex items-center gap-1.5 h-10 px-3 mobile:px-2 rounded-xl border text-xs font-bold ${
                isOnline
                  ? 'bg-[rgba(255,180,0,0.12)] border-[rgba(255,180,0,0.3)] text-[#FFB400]'
                  : 'bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.3)] text-red-400'
              }`}
              title={
                isOnline
                  ? `${pendingSaves} saisie(s) en cours d'envoi`
                  : 'Hors ligne — les saisies sont gardées et envoyées au retour du réseau'
              }
            >
              {isOnline ? (
                <RefreshCw size={14} className="shrink-0 animate-spin" />
              ) : (
                <CloudOff size={14} className="shrink-0" />
              )}
              <span className="mobile:hidden">
                {isOnline ? 'Envoi' : 'Hors ligne'}
              </span>
              {pendingSaves > 0 && <span className="font-mono">{pendingSaves}</span>}
            </div>
          )}

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

        {/* Onglets de groupe.
            Un seul téléphone posé au milieu du terrain sert tous les paniers :
            on tape l'onglet du groupe qui se présente, et sa rotation reprend
            où elle s'était arrêtée. Masqués quand il n'y a qu'un groupe. */}
        {hasGroups && (
          <div className="mt-3 mobile:mt-1.5 short:mt-1 flex items-stretch gap-1.5 mobile:gap-1">
            {groupKeys.map((key) => {
              const state = groupStates[key];
              const players = playersByGroup[key] ?? [];
              const finished = isGroupFinished(state);
              const shooter = players[state?.playerIndex ?? 0]?.player;
              const isActive = key === activeGroup;

              return (
                <button
                  key={key}
                  onClick={() => handleSelectGroup(key)}
                  disabled={finished}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex-1 min-w-0 flex items-center gap-2 mobile:gap-1.5 px-2.5 mobile:px-1.5 py-2 mobile:py-1.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-[rgba(0,191,255,0.18)] border-[#00BFFF] shadow-[0_0_16px_rgba(0,191,255,0.25)]'
                      : finished
                      ? 'bg-[rgba(245,241,232,0.03)] border-[rgba(245,241,232,0.08)] cursor-default'
                      : 'bg-[rgba(0,191,255,0.04)] border-[rgba(0,191,255,0.15)] active:scale-95'
                  }`}
                >
                  <span
                    className={`w-6 h-6 mobile:w-5 mobile:h-5 shrink-0 rounded-lg flex items-center justify-center text-xs mobile:text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-[#00BFFF] text-[#0A1628]'
                        : finished
                        ? 'bg-[rgba(245,241,232,0.08)] text-[rgba(245,241,232,0.35)]'
                        : 'bg-[rgba(0,191,255,0.15)] text-[#00BFFF]'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="min-w-0 flex-1 text-left leading-tight">
                    <span
                      className={`block text-xs mobile:text-[11px] font-bold truncate ${
                        finished ? 'text-[rgba(245,241,232,0.35)]' : 'text-[#F5F1E8]'
                      }`}
                    >
                      {finished ? 'Terminé' : shooter?.firstName ?? '—'}
                    </span>
                    <span className="block font-mono text-[9px] text-[rgba(245,241,232,0.4)] truncate mobile:hidden">
                      {finished ? `${spotCount} spots` : `Spot ${(state?.spotIndex ?? 0) + 1}/${spotCount}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

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
            <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
              <div className="font-mono text-[10px] text-[rgba(245,241,232,0.4)] uppercase tracking-[0.2em]">
                Classement
              </div>
              {hasGroups && (
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.12)]">
                  {([
                    { key: 'group', label: `Groupe ${activeGroup}` },
                    { key: 'all', label: 'Général' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setRankingScope(key)}
                      className={`px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-all ${
                        rankingScope === key
                          ? 'bg-[#00BFFF] text-[#0A1628] font-bold'
                          : 'text-[rgba(245,241,232,0.5)] hover:text-[#F5F1E8]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5 scroll-area pr-1">
              {rankedPlayers.map((sp, idx) => {
                const isActive = sp.id === currentSessionPlayer.id;
                return (
                  <div
                    key={sp.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-[rgba(0,191,255,0.15)] border border-[rgba(0,191,255,0.3)]'
                        : 'bg-[rgba(0,191,255,0.02)] border border-transparent'
                    }`}
                  >
                    <span className="font-mono text-[11px] font-bold text-[rgba(245,241,232,0.3)] w-4 shrink-0">
                      {idx + 1}
                    </span>
                    <span className={`flex-1 min-w-0 text-sm font-bold truncate ${isActive ? 'text-[#00BFFF]' : 'text-[rgba(245,241,232,0.7)]'}`}>
                      {sp.player.firstName}
                    </span>
                    {hasGroups && rankingScope === 'all' && (
                      <span className="font-mono text-[9px] text-[rgba(245,241,232,0.35)] shrink-0">
                        {groupOf(sp)}
                      </span>
                    )}
                    <span className="font-mono text-lg font-extrabold text-[#00BFFF] ml-1 shrink-0">{totals[sp.id] ?? 0}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ============ SCORE EN DIRECT ============
          Modale centrée en desktop, feuille glissante en mobile. */}
      {showRanking && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 mobile:items-end mobile:p-0"
          onClick={() => setShowRanking(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Score en direct"
        >
          <div
            className="w-full max-w-md bg-[#0d1f38] border border-[rgba(0,191,255,0.25)] rounded-2xl max-h-[85dvh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 mobile:max-w-none mobile:max-h-[75dvh] mobile:rounded-2xl mobile:rounded-b-none mobile:rounded-t-3xl mobile:border-x-0 mobile:border-b-0 mobile:pb-safe-b"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-[rgba(0,191,255,0.12)]">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy size={18} className="text-[#00BFFF] shrink-0" />
                <h2 className="text-base font-bold text-[#F5F1E8] truncate">Score en direct</h2>
                <span className="shrink-0 flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-[rgba(0,191,255,0.12)] font-mono text-[9px] uppercase tracking-[0.18em] text-[#00BFFF]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00BFFF] animate-pulse" />
                  Live
                </span>
              </div>
              <button
                onClick={() => setShowRanking(false)}
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-[rgba(245,241,232,0.06)] text-[rgba(245,241,232,0.6)] hover:bg-[rgba(245,241,232,0.12)] active:scale-90 transition-all"
                aria-label="Fermer le score"
              >
                <ChevronDown size={20} className="mobile:block hidden" />
                <X size={18} className="block mobile:hidden" />
              </button>
            </div>

            <div className="shrink-0 flex items-center justify-between gap-2 px-5 py-2 border-b border-[rgba(0,191,255,0.08)]">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(245,241,232,0.4)] truncate">
                {hasGroups && <>Groupe {activeGroup} · </>}
                Spot {currentSpotIndex + 1} / {spotCount}
              </span>
              {hasGroups && (
                <div className="flex items-center gap-1 p-0.5 shrink-0 rounded-lg bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.12)]">
                  {([
                    { key: 'group', label: `Groupe ${activeGroup}` },
                    { key: 'all', label: 'Général' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setRankingScope(key)}
                      className={`px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-all active:scale-95 ${
                        rankingScope === key
                          ? 'bg-[#00BFFF] text-[#0A1628] font-bold'
                          : 'text-[rgba(245,241,232,0.5)] '
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 scroll-area px-4 py-3 space-y-2">
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
                    {hasGroups && rankingScope === 'all' && (
                      <span className="shrink-0 w-5 h-5 rounded-md bg-[rgba(0,191,255,0.12)] font-mono text-[9px] font-bold text-[#00BFFF] flex items-center justify-center">
                        {groupOf(sp)}
                      </span>
                    )}
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
                    Vous pourrez la reprendre plus tard
                  </p>
                </div>
              </div>
            </div>

            <div className="scroll-area p-6 mobile:p-4">
              <p className="text-sm text-[#F5F1E8]">
                Vous êtes sur le point de quitter la session en cours. Tout ce qui a été saisi est sauvegardé : vous la retrouverez dans la liste des sessions, en cours, et elle reprendra exactement où vous l&apos;avez laissée.
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
