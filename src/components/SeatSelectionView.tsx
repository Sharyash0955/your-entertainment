import React, { useState, useEffect } from 'react';
import { EventItem, SeatItem, UserItem, AISuggestionResponse } from '../types';
import { SeatMap } from './SeatMap';
import { SmartSeatFinder } from './SmartSeatFinder';
import { ArrowLeft, Clock, Sparkles, Check, AlertCircle, ShoppingBag } from 'lucide-react';

interface SeatSelectionViewProps {
  event: EventItem;
  venueName: string;
  dateStr: string;
  timeStr: string;
  seats: SeatItem[];
  currentUser: UserItem;
  onSeatClick: (seat: SeatItem) => void;
  isHoldingLoadingId: string | null;
  onBack: () => void;
  onProceedToMeals: (selectedSeats: SeatItem[]) => void;
}

export const SeatSelectionView: React.FC<SeatSelectionViewProps> = ({
  event,
  venueName,
  dateStr,
  timeStr,
  seats,
  currentUser,
  onSeatClick,
  isHoldingLoadingId,
  onBack,
  onProceedToMeals,
}) => {
  const [suggestedSeatIds, setSuggestedSeatIds] = useState<string[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestionResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isHoldingMultiple, setIsHoldingMultiple] = useState<boolean>(false);

  // Find all seats currently held by this user
  const myHeldSeats = seats.filter(
    (s) => s.status === 'hold' && s.held_by === currentUser.id
  );

  // Lowest hold expiration timestamp among held seats
  const lowestExpiration = myHeldSeats.reduce<number | null>((acc, s) => {
    if (!s.hold_expires_at) return acc;
    if (acc === null || s.hold_expires_at < acc) return s.hold_expires_at;
    return acc;
  }, null);

  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);

  useEffect(() => {
    if (!lowestExpiration) {
      setTimeLeftMs(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, lowestExpiration - Date.now());
      setTimeLeftMs(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lowestExpiration]);

  const formatTimer = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPrice = myHeldSeats.reduce((acc, s) => acc + s.price, 0);

  const handleAISuggest = async (promptText: string) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          prompt: promptText,
        }),
      });

      if (res.ok) {
        const data: AISuggestionResponse = await res.json();
        setAiSuggestion(data);
        setSuggestedSeatIds(data.suggestedSeatIds || []);
      }
    } catch (err) {
      console.error('AI suggestion failed', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleHoldMultipleSuggested = async (seatIds: string[]) => {
    setIsHoldingMultiple(true);
    for (const id of seatIds) {
      const seat = seats.find((s) => s.id === id);
      if (seat && seat.status === 'available') {
        await onSeatClick(seat);
      }
    }
    setIsHoldingMultiple(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Top navigation & Event meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Change Cinema & Showtime
        </button>

        <div className="flex items-center gap-3">
          {/* Active Hold Countdown Badge */}
          {timeLeftMs !== null && timeLeftMs > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Holds expire in {formatTimer(timeLeftMs)}</span>
            </div>
          )}
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Step 3 of 5</span>
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {event.name}
            <span className="text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {event.format || 'IMAX'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {venueName} • <span className="text-slate-200 font-semibold">{dateStr}</span> at{' '}
            <span className="text-emerald-400 font-semibold">{timeStr}</span>
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Attendee</span>
          <span className="text-xs font-semibold text-slate-300">{currentUser.name}</span>
        </div>
      </div>

      {/* Gemini AI Smart Seat Finder Bar */}
      <SmartSeatFinder
        onSuggest={handleAISuggest}
        isLoading={isAiLoading}
        suggestion={aiSuggestion}
        onClearSuggestion={() => {
          setAiSuggestion(null);
          setSuggestedSeatIds([]);
        }}
        onHoldSuggested={handleHoldMultipleSuggested}
        isHoldingMultiple={isHoldingMultiple}
      />

      {/* Real-time Seat Map */}
      <SeatMap
        seats={seats}
        currentUser={currentUser}
        onSeatClick={onSeatClick}
        suggestedSeatIds={suggestedSeatIds}
        isHoldingLoadingId={isHoldingLoadingId}
      />

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md p-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
              {myHeldSeats.length}
            </div>
            <div>
              <div className="text-xs text-slate-400">
                {myHeldSeats.length === 0
                  ? 'No seats selected yet'
                  : `${myHeldSeats.length} seat(s) held for you:`}
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {myHeldSeats.length > 0 ? (
                  myHeldSeats.map((s) => `${s.row}${s.number}`).join(', ')
                ) : (
                  <span className="text-slate-500 text-xs font-normal">
                    Click any available green seat on the map
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {myHeldSeats.length > 0 && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Ticket Total</span>
                <span className="text-lg font-black text-emerald-400">₹{totalPrice.toLocaleString()}</span>
              </div>
            )}

            <button
              disabled={myHeldSeats.length === 0}
              onClick={() => onProceedToMeals(myHeldSeats)}
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Proceed to Food & Beverages ({myHeldSeats.length} Seats) ➔</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
