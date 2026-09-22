import React from 'react';
import { EventItem, SeatItem } from '../types';
import { Calendar, MapPin, Sparkles, Film, Clock, HelpCircle } from 'lucide-react';

interface EventBannerProps {
  event: EventItem | null;
  seats: SeatItem[];
  onOpenInfoModal: () => void;
}

export const EventBanner: React.FC<EventBannerProps> = ({ event, seats, onOpenInfoModal }) => {
  const availableCount = seats.filter((s) => s.status === 'available').length;
  const heldCount = seats.filter((s) => s.status === 'hold').length;
  const bookedCount = seats.filter((s) => s.status === 'booked').length;
  const total = seats.length || 80;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl mb-6">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        {/* Left: Event Details */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Film className="w-3 h-3" />
              {event?.category || 'Cinema Premiere'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
              IMAX 70mm Laser
            </span>
            <button
              onClick={onOpenInfoModal}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 underline underline-offset-2 transition ml-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              How concurrency works
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {event?.name || 'Interstellar: 10th Anniversary Special Screening'}
          </h1>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{event?.venue || 'Prasad IMAX Auditorium 1, Screen 1'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{event?.showtime || 'Today • 08:30 PM'}</span>
            </div>
          </div>
        </div>

        {/* Right: Live Capacity Breakdown */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 shrink-0">
          <div className="text-center px-2 sm:px-3">
            <div className="text-lg sm:text-xl font-bold text-emerald-400">{availableCount}</div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Available
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          <div className="text-center px-2 sm:px-3">
            <div className="text-lg sm:text-xl font-bold text-amber-400">{heldCount}</div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Holding
            </div>
          </div>

          <div className="w-px h-8 bg-slate-800" />

          <div className="text-center px-2 sm:px-3">
            <div className="text-lg sm:text-xl font-bold text-rose-400">{bookedCount}</div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Booked
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
