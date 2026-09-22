import React, { useState, useEffect } from 'react';
import { SeatItem, UserItem, BookingItem } from '../types';
import { downloadTicketAsHtml, downloadTicketAsText } from '../utils/ticketGenerator';
import { CreditCard, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight, Shield, RefreshCw, Download, FileText } from 'lucide-react';

interface PaymentModalProps {
  seat: SeatItem | null;
  currentUser: UserItem;
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (booking: BookingItem) => void;
  onReleaseHold: (seatId: string) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  seat,
  currentUser,
  isOpen,
  onClose,
  onPaymentComplete,
  onReleaseHold,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<BookingItem | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);

  // Live countdown timer for the 5-minute hold TTL
  useEffect(() => {
    if (!isOpen || !seat || !seat.hold_expires_at) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((seat.hold_expires_at! - Date.now()) / 1000));
      setSecondsRemaining(diff);
      if (diff <= 0) {
        setErrorMsg('Hold expired! The seat has automatically been released back to Available.');
      }
    }, 1000);

    // Initial sync
    const initialDiff = Math.max(0, Math.floor((seat.hold_expires_at - Date.now()) / 1000));
    setSecondsRemaining(initialDiff);

    return () => clearInterval(interval);
  }, [isOpen, seat]);

  if (!isOpen || !seat) return null;

  const handleSimulatePayment = async (forceOption?: 'success' | 'fail') => {
    setIsProcessing(true);
    setErrorMsg(null);

    let url = '/api/payment/simulate';
    if (forceOption) {
      url += `?force=${forceOption}`;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatId: seat.id,
          userId: currentUser.id,
          eventId: seat.event_id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setSuccessBooking(data.booking);
        onPaymentComplete(data.booking);
      } else {
        // Payment failed or 409 conflict
        setErrorMsg(
          data.error ||
          data.message ||
          'Payment simulation declined. The seat hold has been released immediately.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error during simulated payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelHold = async () => {
    if (seat) {
      await onReleaseHold(seat.id);
      onClose();
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isExpired = secondsRemaining <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Simulated Checkout</h3>
              <p className="text-[11px] text-slate-400">Atomic Hold Confirmed</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {successBooking ? (
            /* Success State */
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Booking Confirmed!</h4>
              <p className="text-xs text-slate-300">
                Seat <span className="font-bold text-emerald-400">{seat.row}{seat.number}</span> is now in terminal <span className="font-semibold text-rose-400">BOOKED</span> state.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 text-left space-y-1">
                <div>Booking ID: <span className="text-amber-400">{successBooking.id}</span></div>
                <div>User: <span className="text-slate-200">{currentUser.name}</span></div>
                <div>Amount: <span className="text-emerald-400">₹{seat.price}</span></div>
              </div>

              {/* Download Ticket Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="btn-download-ticket-modal"
                  type="button"
                  onClick={() => {
                    const detail = {
                      id: successBooking.id,
                      event: {
                        id: 'evt_interstellar_imax',
                        name: 'Interstellar: 10th Anniversary IMAX 70mm',
                        category: 'movie' as const,
                        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
                        synopsis: 'IMAX 70mm Special Screening',
                        basePrice: seat.price,
                      },
                      venueName: 'Central Laser Dome Audi 1',
                      dateStr: 'Today',
                      timeStr: '08:30 PM',
                      seats: [seat],
                      meals: [],
                      user: currentUser,
                      ticketSubtotal: seat.price,
                      mealsSubtotal: 0,
                      convenienceFee: 30,
                      taxes: 25,
                      totalAmount: seat.price + 55,
                      bookingCode: successBooking.id.substring(0, 8).toUpperCase(),
                      bookingTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      paymentMethod: 'CARD',
                    };
                    downloadTicketAsHtml(detail);
                  }}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Ticket (PDF/HTML)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const detail = {
                      id: successBooking.id,
                      event: {
                        id: 'evt_interstellar_imax',
                        name: 'Interstellar: 10th Anniversary IMAX 70mm',
                        category: 'movie' as const,
                        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
                        synopsis: 'IMAX 70mm Special Screening',
                        basePrice: seat.price,
                      },
                      venueName: 'Central Laser Dome Audi 1',
                      dateStr: 'Today',
                      timeStr: '08:30 PM',
                      seats: [seat],
                      meals: [],
                      user: currentUser,
                      ticketSubtotal: seat.price,
                      mealsSubtotal: 0,
                      convenienceFee: 30,
                      taxes: 25,
                      totalAmount: seat.price + 55,
                      bookingCode: successBooking.id.substring(0, 8).toUpperCase(),
                      bookingTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      paymentMethod: 'CARD',
                    };
                    downloadTicketAsText(detail);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  title="Download Text Receipt (.txt)"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
              >
                Close & Return to Seat Map
              </button>
            </div>
          ) : (
            <>
              {/* Hold TTL Notice */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                secondsRemaining < 60
                  ? 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                  : 'bg-amber-950/30 border-amber-700/50 text-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>Hold Expires In:</span>
                </div>
                <span className="font-mono font-bold text-sm tracking-wider">
                  {minutes}:{seconds < 10 ? '0' : ''}{seconds}
                </span>
              </div>

              {/* Seat Details card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Selected Seat</span>
                  <span className="font-bold text-white text-sm">
                    Row {seat.row} • Seat {seat.number} ({seat.tier})
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Ticket Price</span>
                  <span className="font-bold text-emerald-400">${seat.price}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-850">
                  <span>Holder ID</span>
                  <span className="font-mono">{currentUser.name}</span>
                </div>
              </div>

              {/* Error display */}
              {errorMsg && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start gap-2 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Payment simulation buttons */}
              <div className="space-y-2 pt-2">
                <button
                  id="btn-simulate-payment-auto"
                  onClick={() => handleSimulatePayment()}
                  disabled={isProcessing || isExpired}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Simulate Payment (90% Success Rate)</span>
                    </>
                  )}
                </button>

                {/* Placement testing buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    id="btn-force-success"
                    type="button"
                    onClick={() => handleSimulatePayment('success')}
                    disabled={isProcessing || isExpired}
                    className="py-1.5 px-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[11px] font-medium transition flex items-center justify-center gap-1"
                    title="Force payment to succeed to test hold -> booked transition"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Force Success</span>
                  </button>

                  <button
                    id="btn-force-fail"
                    type="button"
                    onClick={() => handleSimulatePayment('fail')}
                    disabled={isProcessing || isExpired}
                    className="py-1.5 px-2 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[11px] font-medium transition flex items-center justify-center gap-1"
                    title="Force payment to fail to test immediate release to available"
                  >
                    <XCircle className="w-3 h-3 text-rose-400" />
                    <span>Force Failure</span>
                  </button>
                </div>

                {/* Voluntary release button */}
                <button
                  id="btn-release-hold"
                  type="button"
                  onClick={handleCancelHold}
                  disabled={isProcessing}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1 transition underline underline-offset-2"
                >
                  Voluntarily release hold without paying
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
