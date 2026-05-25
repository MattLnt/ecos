'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SessionInfo {
  sessionId: string;
  time: string;
  playerCount: number;
}

interface StatsCalendarProps {
  sessionsByDay: Record<string, SessionInfo[]>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function StatsCalendar({ sessionsByDay, selectedDate, onSelectDate }: StatsCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const dayKey = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-gradient-to-br from-[rgba(0,191,255,0.06)] to-[rgba(0,191,255,0.02)] border border-[rgba(0,191,255,0.15)] rounded-xl p-3">
      {/* Header navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-[rgba(0,191,255,0.08)] text-[#00BFFF] hover:bg-[rgba(0,191,255,0.15)] active:scale-95 transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="text-sm font-bold text-[#F5F1E8]">
          {MONTHS[viewMonth]} {viewYear}
        </div>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-[rgba(0,191,255,0.08)] text-[#00BFFF] hover:bg-[rgba(0,191,255,0.15)] active:scale-95 transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-[rgba(245,241,232,0.35)]">
            {d}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;

          const key = dayKey(day);
          const hasSessions = !!sessionsByDay[key];
          const sessionCount = sessionsByDay[key]?.length || 0;
          const isSelected = selectedDate === key;
          const isToday =
            day === today.getDate() &&
            viewMonth === today.getMonth() &&
            viewYear === today.getFullYear();

          return (
            <button
              key={key}
              onClick={() => hasSessions && onSelectDate(key)}
              disabled={!hasSessions}
              className={`relative aspect-square rounded-md flex flex-col items-center justify-center text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-[#00BFFF] text-[#0A1628]'
                  : hasSessions
                  ? 'bg-[rgba(0,191,255,0.12)] text-[#F5F1E8] hover:bg-[rgba(0,191,255,0.25)] cursor-pointer'
                  : 'text-[rgba(245,241,232,0.25)] cursor-default'
              } ${isToday && !isSelected ? 'ring-1 ring-[rgba(0,191,255,0.4)]' : ''}`}
            >
              <span className="leading-none">{day}</span>
              {hasSessions && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(sessionCount, 3) }, (_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-[#0A1628]' : 'bg-[#00BFFF]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[rgba(0,191,255,0.1)]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-[rgba(0,191,255,0.25)]" />
          <span className="text-[10px] text-[rgba(245,241,232,0.55)]">Sessions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-[#00BFFF]" />
          <span className="text-[10px] text-[rgba(245,241,232,0.55)]">= 1 session</span>
        </div>
      </div>
    </div>
  );
}