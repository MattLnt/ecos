'use client';

import { useState, useEffect } from 'react';
import { BarChart3, CalendarDays } from 'lucide-react';
import { OverviewStats } from '@/components/stats/OverviewStats';
import { SpotPerformance } from '@/components/stats/SpotPerformance';
import { PlayerRanking } from '@/components/stats/PlayerRanking';
import { Records } from '@/components/stats/Records';
import { Trends } from '@/components/stats/Trends';
import { StatsCalendar } from '@/components/stats/StatsCalendar';
import { DateFilteredStats } from '@/components/stats/DateFilteredStats';

interface SessionInfo {
  sessionId: string;
  time: string;
  playerCount: number;
}

type ViewMode = 'global' | 'date';

export default function StatsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [sessionsByDay, setSessionsByDay] = useState<Record<string, SessionInfo[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);

  useEffect(() => {
    if (viewMode === 'date' && Object.keys(sessionsByDay).length === 0) {
      fetchSessionDates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const fetchSessionDates = async () => {
    setLoadingDates(true);
    try {
      const res = await fetch('/api/sessions/dates');
      const data = await res.json();
      setSessionsByDay(data);

      const days = Object.keys(data).sort().reverse();
      if (days.length > 0) {
        setSelectedDate(days[0]);
      }
    } catch (error) {
      console.error('Erreur fetch session dates:', error);
    } finally {
      setLoadingDates(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-[#F5F1E8] tracking-tight mobile:text-3xl">
          Statistiques
        </h1>
        <p className="text-[rgba(245,241,232,0.55)] mt-2">
          Analyse complète de vos performances
        </p>
      </div>

      {/* Toggle Global / Par date */}
      <div className="flex items-center gap-2 bg-[rgba(0,191,255,0.06)] border border-[rgba(0,191,255,0.15)] rounded-xl p-1.5 w-fit">
        <button
          onClick={() => setViewMode('global')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'global'
              ? 'bg-[#00BFFF] text-[#0A1628] shadow-lg shadow-[rgba(0,191,255,0.3)]'
              : 'text-[rgba(245,241,232,0.7)] hover:text-[#00BFFF]'
          }`}
        >
          <BarChart3 size={16} />
          <span>Global</span>
        </button>
        <button
          onClick={() => setViewMode('date')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            viewMode === 'date'
              ? 'bg-[#00BFFF] text-[#0A1628] shadow-lg shadow-[rgba(0,191,255,0.3)]'
              : 'text-[rgba(245,241,232,0.7)] hover:text-[#00BFFF]'
          }`}
        >
          <CalendarDays size={16} />
          <span>Par date</span>
        </button>
      </div>

      {/* ===== MODE GLOBAL ===== */}
      {viewMode === 'global' && (
        <div className="space-y-8">
          <OverviewStats />
          <SpotPerformance />
          <PlayerRanking />
          <Records />
          <Trends />
        </div>
      )}

      {/* ===== MODE PAR DATE ===== */}
      {viewMode === 'date' && (
        <div>
          {loadingDates ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-[rgba(245,241,232,0.35)] text-sm">Chargement du calendrier...</div>
            </div>
          ) : Object.keys(sessionsByDay).length === 0 ? (
            <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-12 text-center">
              <p className="text-[rgba(245,241,232,0.55)]">Aucune session enregistrée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
              {/* Colonne gauche : calendrier (sticky sur desktop) */}
              <div className="lg:sticky lg:top-6">
                <StatsCalendar
                  sessionsByDay={sessionsByDay}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </div>

              {/* Colonne droite : stats filtrées */}
              <div>
                {selectedDate && sessionsByDay[selectedDate] ? (
                  <DateFilteredStats
                    selectedDate={selectedDate}
                    sessionsOfDay={sessionsByDay[selectedDate]}
                  />
                ) : (
                  <div className="bg-[rgba(0,191,255,0.04)] border border-[rgba(0,191,255,0.15)] rounded-2xl p-12 text-center">
                    <p className="text-[rgba(245,241,232,0.55)]">Sélectionnez un jour dans le calendrier</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}