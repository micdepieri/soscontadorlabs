"use client";

import { useState } from "react";
import Link from "next/link";

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  type: "WEBINAR" | "LIVE" | "WORKSHOP" | "OUTRO";
  startDate: string;
  endDate: string | null;
  registrationUrl: string | null;
  thumbnail: string | null;
  isPremium: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  WEBINAR: "Webinário",
  LIVE: "Live",
  WORKSHOP: "Workshop",
  OUTRO: "Evento",
};

const TYPE_COLORS: Record<string, string> = {
  WEBINAR: "bg-tech-blue text-white",
  LIVE: "bg-red-500 text-white",
  WORKSHOP: "bg-brass-gold text-deep-navy",
  OUTRO: "bg-cyan-ia text-deep-navy",
};

const TYPE_DOT_COLORS: Record<string, string> = {
  WEBINAR: "bg-tech-blue",
  LIVE: "bg-red-500",
  WORKSHOP: "bg-brass-gold",
  OUTRO: "bg-cyan-ia",
};

const WEEKDAY_HEADERS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function formatTimeOnly(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function isSameDay(isoA: string, year: number, month: number, day: number) {
  const d = new Date(isoA);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month &&
    d.getDate() === day
  );
}

export default function EventsCalendar({ events }: { events: EventItem[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Build days grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  }

  function eventsForDay(day: number) {
    return events.filter(e => isSameDay(e.startDate, viewYear, viewMonth, day));
  }

  const selectedEvents = selectedDay !== null ? eventsForDay(selectedDay) : [];

  // Upcoming events (from today forward, sorted)
  const nowIso = new Date().toISOString();
  const upcomingEvents = events.filter(e => e.startDate >= nowIso || (e.endDate && e.endDate >= nowIso));

  return (
    <div className="space-y-8">
      {/* Calendar */}
      <div className="rounded-2xl border border-app-border bg-midnight-blue p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="rounded-lg p-2 text-cloud-white/60 hover:bg-deep-navy hover:text-cloud-white transition-colors"
            aria-label="Mês anterior"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-cloud-white">
            {MONTHS_PT[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={nextMonth}
            className="rounded-lg p-2 text-cloud-white/60 hover:bg-deep-navy hover:text-cloud-white transition-colors"
            aria-label="Próximo mês"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAY_HEADERS.map(d => (
            <div key={d} className="py-1 text-center text-xs font-semibold text-cloud-white/40 uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-px">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dayEvents = eventsForDay(day);
            const isToday =
              today.getFullYear() === viewYear &&
              today.getMonth() === viewMonth &&
              today.getDate() === day;
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative flex flex-col items-center rounded-lg p-1.5 min-h-[44px] transition-colors ${
                  isSelected
                    ? "bg-tech-blue/30 ring-1 ring-tech-blue"
                    : isToday
                    ? "bg-cyan-ia/10 ring-1 ring-cyan-ia/40"
                    : dayEvents.length > 0
                    ? "hover:bg-deep-navy cursor-pointer"
                    : "hover:bg-deep-navy/50 cursor-default"
                }`}
              >
                <span
                  className={`text-sm font-medium leading-none ${
                    isSelected
                      ? "text-cyan-ia"
                      : isToday
                      ? "text-cyan-ia"
                      : "text-cloud-white/80"
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="mt-1 flex gap-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map(e => (
                      <span
                        key={e.id}
                        className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT_COLORS[e.type] || "bg-cyan-ia"}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day events */}
        {selectedDay !== null && (
          <div className="mt-6 border-t border-app-border pt-4">
            <h3 className="mb-3 text-sm font-semibold text-cloud-white/70">
              Eventos em {selectedDay} de {MONTHS_PT[viewMonth]}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-cloud-white/40">Nenhum evento neste dia.</p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map(e => (
                  <EventCard key={e.id} event={e} compact />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT_COLORS[key]}`} />
            <span className="text-xs text-cloud-white/50">{label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming events list */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-cloud-white">
          Próximos eventos
        </h2>
        {upcomingEvents.length === 0 ? (
          <div className="py-12 text-center text-cloud-white/40">
            <svg className="mx-auto mb-3 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium">Nenhum evento agendado</p>
            <p className="mt-1 text-sm">Fique ligado — em breve novos eventos!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map(e => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>

      {/* Past events (collapsed) */}
      {(() => {
        const past = events.filter(e => e.startDate < nowIso && (!e.endDate || e.endDate < nowIso));
        if (past.length === 0) return null;
        return (
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center gap-2 text-sm font-medium text-cloud-white/40 hover:text-cloud-white/60 transition-colors">
                <svg className="h-4 w-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {past.length} evento{past.length > 1 ? "s" : ""} passado{past.length > 1 ? "s" : ""}
              </div>
            </summary>
            <div className="mt-4 space-y-4">
              {past.reverse().map(e => (
                <EventCard key={e.id} event={e} past />
              ))}
            </div>
          </details>
        );
      })()}
    </div>
  );
}

function EventCard({ event, compact = false, past = false }: { event: EventItem; compact?: boolean; past?: boolean }) {
  return (
    <div className={`flex gap-4 rounded-xl border transition-all ${
      past
        ? "border-app-border bg-midnight-blue/50 opacity-60"
        : "border-app-border bg-midnight-blue hover:border-cyan-ia/40 hover:shadow-lg"
    } ${compact ? "p-3" : "p-5"}`}>
      {/* Date block */}
      <div className="flex-shrink-0 text-center">
        <div className={`flex flex-col items-center justify-center rounded-lg bg-deep-navy ${compact ? "h-12 w-12" : "h-16 w-16"}`}>
          <span className={`font-bold text-cyan-ia leading-none ${compact ? "text-lg" : "text-2xl"}`}>
            {new Date(event.startDate).getDate()}
          </span>
          <span className="text-[10px] font-semibold uppercase text-cloud-white/50 mt-0.5">
            {new Date(event.startDate).toLocaleString("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" })}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[event.type] || "bg-cyan-ia text-deep-navy"}`}>
            {TYPE_LABELS[event.type] || event.type}
          </span>
          {event.isPremium && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-100 uppercase">
              Premium
            </span>
          )}
        </div>

        <h3 className={`font-bold text-cloud-white line-clamp-2 ${compact ? "text-sm" : "text-base"}`}>
          {event.title}
        </h3>

        {!compact && event.description && (
          <p className="text-sm text-cloud-white/50 line-clamp-2">{event.description}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-cloud-white/50 mt-1">
          <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {formatDateTime(event.startDate)}
            {event.endDate && ` – ${formatTimeOnly(event.endDate)}`}
          </span>
        </div>

        {!compact && event.registrationUrl && !past && (
          <div className="mt-2">
            <Link
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-tech-blue px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-tech-blue/80 active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Inscrever-se
            </Link>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      {!compact && event.thumbnail && (
        <div className="hidden sm:block flex-shrink-0">
          <img
            src={event.thumbnail}
            alt={event.title}
            className="h-20 w-32 rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  );
}
