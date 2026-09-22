import React from 'react';
import { SeatItem, UserItem } from '../types';
import { Lock, Sparkles, Check, Clock } from 'lucide-react';

interface SeatMapProps {
  seats: SeatItem[];
  currentUser: UserItem | null;
  onSeatClick: (seat: SeatItem) => void;
  suggestedSeatIds: string[];
  isHoldingLoadingId: string | null;
  category?: 'movie' | 'concert' | 'comedy' | 'sports';
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  currentUser,
  onSeatClick,
  suggestedSeatIds,
  isHoldingLoadingId,
  category = 'movie',
}) => {
  // Group seats by row
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatsByRow: Record<string, SeatItem[]> = {};
  rows.forEach((r) => {
    seatsByRow[r] = seats.filter((s) => s.row === r).sort((a, b) => a.number - b.number);
  });

  const isCinema = category === 'movie';

  // Compute live prices from the current event's seats
  const vipSeat = seats.find((s) => s.tier === 'VIP');
  const premiumSeat = seats.find((s) => s.tier === 'PREMIUM');
  const execSeat = seats.find((s) => s.tier === 'EXECUTIVE');

  const vipPrice = vipSeat ? `₹${vipSeat.price}` : '₹650';
  const premiumPrice = premiumSeat ? `₹${premiumSeat.price}` : '₹500';
  const execPrice = execSeat ? `₹${execSeat.price}` : '₹350';

  const getTierLabel = (row: string) => {
    if (isCinema) {
      // In Indian Cinema: Front rows near screen are Executive (budget/standard);
      // Middle rows are Premium; Last/Rear rows are VIP Recliners/Platinum
      if (row === 'A' || row === 'B' || row === 'C') {
        return {
          name: 'EXECUTIVE TIER (FRONT ROWS • SCREEN SIGHTLINE)',
          price: execPrice,
          color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        };
      }
      if (row === 'D' || row === 'E') {
        return {
          name: 'PREMIUM TIER (MIDDLE ROWS • SWEET SPOT)',
          price: premiumPrice,
          color: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
        };
      }
      return {
        name: 'VIP RECLINER TIER (LAST ROWS • LUXURY SEATING)',
        price: vipPrice,
        color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      };
    } else {
      // In Concerts / Live shows: Front rows are VIP (Fan Pit / Front of Stage);
      // Middle rows are Premium; Rear/Balcony rows are Executive
      if (row === 'A' || row === 'B') {
        return {
          name: 'VIP FAN PIT (FRONT ROW • STAGE ACCESS)',
          price: vipPrice,
          color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        };
      }
      if (row === 'C' || row === 'D' || row === 'E') {
        return {
          name: 'PREMIUM TIER (CENTER ARENA)',
          price: premiumPrice,
          color: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
        };
      }
      return {
        name: 'EXECUTIVE / GENERAL ADMISSION (REAR)',
        price: execPrice,
        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      };
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-8 shadow-2xl relative">
      {/* Curved Screen Perspective for Cinema OR Stage Area for Concerts */}
      {isCinema ? (
        <div className="max-w-2xl mx-auto mb-10 text-center">
          <div className="screen-curve h-4 w-full mb-3" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300 flex items-center justify-center gap-2">
            <span>Cinema Screen Direction (All eyes this way)</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Indian Cinema Layout: Executive at Front • VIP Recliners at the Back
          </p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto mb-10 text-center">
          <div className="h-4 w-full mb-3 rounded-t-xl bg-gradient-to-r from-amber-500/20 via-rose-500/40 to-amber-500/20 border-t-2 border-rose-500" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300 flex items-center justify-center gap-2">
            <span>Stage & Artist Performance Area (Fan Pit Front)</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Concert Layout: VIP Fan Pit at the Front • Executive at the Rear
          </p>
        </div>
      )}

      {/* Seat Grid Layout */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[620px] max-w-3xl mx-auto space-y-4">
          {rows.map((rowLetter) => {
            const rowSeats = seatsByRow[rowLetter] || [];
            const tierInfo = getTierLabel(rowLetter);
            const isFirstOfTier = isCinema
              ? rowLetter === 'A' || rowLetter === 'D' || rowLetter === 'F'
              : rowLetter === 'A' || rowLetter === 'C' || rowLetter === 'F';

            return (
              <div key={rowLetter} className="space-y-1.5">
                {/* Tier header divider when tier changes */}
                {isFirstOfTier && (
                  <div className="flex items-center justify-between text-xs font-semibold py-1.5 px-3 rounded-lg bg-slate-950/60 border border-slate-800/80 mt-4 mb-2">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${tierInfo.color}`}>
                      {tierInfo.name}
                    </span>
                    <span className="text-emerald-400 text-xs font-bold font-mono">{tierInfo.price} / ticket</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {/* Row Marker Left */}
                  <span className="w-5 text-center text-xs font-bold text-slate-400">
                    {rowLetter}
                  </span>

                  {/* Left Aisle (Seats 1..5) */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {rowSeats.slice(0, 5).map((seat) => renderSeat(seat))}
                  </div>

                  {/* Center Aisle Gap */}
                  <div className="w-6 sm:w-10 text-center text-[10px] text-slate-600 select-none font-mono">
                    AISLE
                  </div>

                  {/* Right Aisle (Seats 6..10) */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {rowSeats.slice(5, 10).map((seat) => renderSeat(seat))}
                  </div>

                  {/* Row Marker Right */}
                  <span className="w-5 text-center text-xs font-bold text-slate-400">
                    {rowLetter}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Color State Legend */}
      <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-[10px] font-bold text-emerald-300">
            A
          </div>
          <span className="text-slate-300 font-medium">Available (Click to hold)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-[10px] text-amber-300">
            <Clock className="w-3 h-3" />
          </div>
          <span className="text-slate-300 font-medium">Holding (5-min TTL lock)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-[10px] text-rose-400">
            <Lock className="w-3 h-3" />
          </div>
          <span className="text-slate-400 font-medium">Booked (Terminal)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-[10px] text-indigo-300 ring-2 ring-indigo-400/40">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="text-slate-300 font-medium">AI Suggested</span>
        </div>
      </div>
    </div>
  );

  function renderSeat(seat: SeatItem) {
    const isAvailable = seat.status === 'available';
    const isHold = seat.status === 'hold';
    const isBooked = seat.status === 'booked';
    const isHeldByMe = isHold && currentUser && seat.held_by === currentUser.id;
    const isSuggested = suggestedSeatIds.includes(seat.id);
    const isLoading = isHoldingLoadingId === seat.id;

    // Remaining hold timer calculation if held by me
    let holdRemainingText = '';
    if (isHeldByMe && seat.hold_expires_at) {
      const remainingSec = Math.max(0, Math.floor((seat.hold_expires_at - Date.now()) / 1000));
      const m = Math.floor(remainingSec / 60);
      const s = remainingSec % 60;
      holdRemainingText = `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    let seatClasses = 'relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all duration-150 select-none ';

    if (isAvailable) {
      seatClasses += 'bg-slate-800/90 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30 cursor-pointer ';
    } else if (isHeldByMe) {
      seatClasses += 'bg-amber-500 text-slate-950 font-bold border-2 border-amber-300 shadow-md shadow-amber-500/30 cursor-pointer seat-holding-pulse ';
    } else if (isHold) {
      seatClasses += 'bg-amber-950/40 border border-amber-700/60 text-amber-500/80 cursor-not-allowed opacity-80 ';
    } else if (isBooked) {
      seatClasses += 'bg-slate-900 border border-rose-900/60 text-rose-500/60 cursor-not-allowed ';
    }

    if (isSuggested && isAvailable) {
      seatClasses += 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105 shadow-md shadow-indigo-500/30 ';
    }

    return (
      <button
        key={seat.id}
        id={`seat-${seat.row}${seat.number}`}
        onClick={() => onSeatClick(seat)}
        disabled={isBooked || (isHold && !isHeldByMe) || isLoading}
        className={seatClasses}
        title={`Seat ${seat.row}${seat.number} (${seat.tier}) - ₹${seat.price} | Status: ${seat.status}${isHold ? (isHeldByMe ? ' (Held by You)' : ' (Held by another user)') : ''}`}
      >
        {isLoading ? (
          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isHeldByMe ? (
          <>
            <span className="text-[10px] leading-tight font-extrabold">{seat.row}{seat.number}</span>
            <span className="text-[9px] leading-none opacity-90">{holdRemainingText || 'HELD'}</span>
          </>
        ) : isHold ? (
          <>
            <Lock className="w-3 h-3 text-amber-400 mb-0.5" />
            <span className="text-[9px] leading-none text-amber-400/80">{seat.row}{seat.number}</span>
          </>
        ) : isBooked ? (
          <>
            <span className="text-[9px] text-rose-500/60 line-through">{seat.row}{seat.number}</span>
          </>
        ) : (
          <>
            <span className="text-xs">{seat.row}{seat.number}</span>
            {isSuggested && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-400 rounded-full ring-2 ring-slate-900" />
            )}
          </>
        )}
      </button>
    );
  }
};
