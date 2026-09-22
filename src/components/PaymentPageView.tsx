import React, { useState, useEffect } from 'react';
import { EventItem, SeatItem, SelectedMeal, UserItem, ConfirmedBookingDetail } from '../types';
import {
  CreditCard,
  QrCode,
  Building,
  Wallet,
  Clock,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Film,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface PaymentPageViewProps {
  event: EventItem;
  venueName: string;
  dateStr: string;
  timeStr: string;
  selectedSeats: SeatItem[];
  selectedMeals: SelectedMeal[];
  currentUser: UserItem;
  onPaymentSuccess: (bookingDetail: ConfirmedBookingDetail) => void;
  onPaymentFailedOrCancelled: (reason?: string) => void;
}

export const PaymentPageView: React.FC<PaymentPageViewProps> = ({
  event,
  venueName,
  dateStr,
  timeStr,
  selectedSeats,
  selectedMeals,
  currentUser,
  onPaymentSuccess,
  onPaymentFailedOrCancelled,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Card inputs
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8829');
  const [cardHolder, setCardHolder] = useState(currentUser.name);
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('742');

  // UPI input
  const [upiId, setUpiId] = useState(`${currentUser.email.split('@')[0]}@okhdfcbank`);

  // Financial calculations
  const ticketSubtotal = selectedSeats.reduce((acc, s) => acc + s.price, 0);
  const mealsSubtotal = selectedMeals.reduce((acc, m) => acc + m.meal.price * m.quantity, 0);
  const convenienceFee = selectedSeats.length > 0 ? 30 * selectedSeats.length : 0;
  const taxes = Math.round((ticketSubtotal + convenienceFee) * 0.05);
  const grandTotal = ticketSubtotal + mealsSubtotal + convenienceFee + taxes;

  // Hold expiration countdown
  const lowestExpiration = selectedSeats.reduce<number | null>((acc, s) => {
    if (!s.hold_expires_at) return acc;
    if (acc === null || s.hold_expires_at < acc) return s.hold_expires_at;
    return acc;
  }, null);

  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);

  useEffect(() => {
    if (!lowestExpiration) {
      // Default 5-minute fallback countdown if not populated
      setTimeLeftMs(5 * 60 * 1000);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, lowestExpiration - Date.now());
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        onPaymentFailedOrCancelled('Hold expired! The 5-minute window has ended and seats were released.');
      }
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

  /**
   * "Done / Confirm Payment" flow:
   * Per user requirement:
   * "also after that just payment page no api for that if payment success click done else no click or back then failed"
   */
  const handleConfirmDonePayment = async (forceOutcome?: 'success' | 'fail') => {
    setIsProcessing(true);
    setErrorMessage(null);

    const seatIds = selectedSeats.map((s) => s.id);

    try {
      const response = await fetch('/api/payment/complete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatIds,
          userId: currentUser.id,
          eventId: event.id,
          venueName,
          showtime: `${dateStr} • ${timeStr}`,
          meals: selectedMeals,
          totalAmount: grandTotal,
          force: forceOutcome || 'success',
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        const bookingCode = `CP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const bookingDetail: ConfirmedBookingDetail = {
          id: data.bookingIds?.[0] || `bk_${Date.now()}`,
          event,
          venueName,
          dateStr,
          timeStr,
          seats: selectedSeats,
          meals: selectedMeals,
          user: currentUser,
          ticketSubtotal,
          mealsSubtotal,
          convenienceFee,
          taxes,
          totalAmount: grandTotal,
          bookingCode,
          bookingTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          paymentMethod: paymentMethod.toUpperCase(),
        };

        onPaymentSuccess(bookingDetail);
      } else {
        // Payment failed or declined
        setErrorMessage(data.error || 'Payment was declined or hold expired.');
        setTimeout(() => {
          onPaymentFailedOrCancelled(data.error || 'Payment failed. Seat hold released.');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage('Network or server error during checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * "Cancel / Back" flow:
   * Immediately releases the holds back to available so seats are not stuck.
   */
  const handleCancelPayment = async () => {
    setIsProcessing(true);
    try {
      await fetch('/api/seats/release-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatIds: selectedSeats.map((s) => s.id),
          userId: currentUser.id,
        }),
      });
    } catch (_) {}
    onPaymentFailedOrCancelled('Payment cancelled. Your held seats have been released back to Available.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top bar with back & hold timer */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleCancelPayment}
          disabled={isProcessing}
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel & Release Seats (Back)
        </button>

        <div className="flex items-center gap-3">
          {timeLeftMs !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Seat Hold Ends in {formatTimer(timeLeftMs)}</span>
            </div>
          )}
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Step 5 of 5</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 2-column Checkout layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Order Summary (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Film className="w-4 h-4 text-rose-500" />
              Order Summary
            </div>

            {/* Movie Info */}
            <div className="flex items-start gap-3">
              <img
                src={event.posterUrl}
                alt={event.name}
                referrerPolicy="no-referrer"
                className="w-16 aspect-[2/3] object-cover rounded-lg border border-slate-800 shrink-0"
              />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white leading-tight">{event.name}</h3>
                <p className="text-[11px] text-rose-400 font-medium">{event.format || 'IMAX Experience'}</p>
                <p className="text-[11px] text-slate-400">{venueName}</p>
                <p className="text-[11px] text-slate-300 font-semibold">{dateStr} • {timeStr}</p>
              </div>
            </div>

            {/* Seats Breakdown */}
            <div className="pt-3 border-t border-slate-800/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>
                  Seats ({selectedSeats.length}):{' '}
                  <strong className="text-white">
                    {selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')}
                  </strong>
                </span>
                <span className="font-semibold text-white">₹{ticketSubtotal}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {selectedSeats.map((s) => `${s.tier} (₹${s.price})`).join(' • ')}
              </div>
            </div>

            {/* Meals Breakdown */}
            {selectedMeals.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-1 text-xs">
                <div className="text-slate-400 font-semibold mb-1">Snacks & Beverages:</div>
                {selectedMeals.map((m) => (
                  <div key={m.meal.id} className="flex justify-between text-slate-300">
                    <span className="truncate pr-2">{m.quantity}x {m.meal.name}</span>
                    <span className="font-semibold text-white shrink-0">₹{m.meal.price * m.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Taxes & Fees */}
            <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Convenience Fee</span>
                <span>₹{convenienceFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Integrated GST (5%)</span>
                <span>₹{taxes}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">Amount Payable</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Inclusive of all taxes</span>
              </div>
              <span className="text-2xl font-black text-white">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Secure Guarantee */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>256-bit bank-grade simulated encryption. Instant booking confirmation.</span>
          </div>
        </div>

        {/* Right Column: Payment Methods & Actions (7 cols) */}
        <div className="md:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            {/* Method Tabs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Select Payment Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: QrCode },
                  { id: 'card', label: 'Cards', icon: CreditCard },
                  { id: 'netbanking', label: 'NetBanking', icon: Building },
                  { id: 'wallet', label: 'Wallets', icon: Wallet },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                        isSelected
                          ? 'border-rose-500 bg-rose-500/10 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-rose-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UPI View */}
            {paymentMethod === 'upi' && (
              <div className="space-y-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Box */}
                  <div className="w-32 h-32 bg-white p-2 rounded-xl flex flex-col items-center justify-center shrink-0 shadow">
                    <div className="w-full h-full border-2 border-dashed border-slate-900 flex flex-col items-center justify-center text-slate-900">
                      <QrCode className="w-16 h-16 text-slate-900" />
                      <span className="text-[9px] font-black tracking-tight mt-1">SCAN WITH ANY APP</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="text-xs font-bold text-white">Scan QR code using UPI App</div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-[10px] text-slate-400 font-semibold">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Google Pay</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">PhonePe</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Paytm</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">BHIM</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Or pay using Virtual Payment Address (VPA):</p>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@upi"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Card View */}
            {paymentMethod === 'card' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Valid Thru</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Name on Card</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* NetBanking View */}
            {paymentMethod === 'netbanking' && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-300">Popular Banks:</div>
                <div className="grid grid-cols-3 gap-2">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Citibank'].map(
                    (b, i) => (
                      <button
                        key={b}
                        type="button"
                        className={`p-2 rounded-lg border text-center text-xs font-medium transition ${
                          i === 0
                            ? 'border-rose-500 bg-rose-500/10 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {b}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Wallets View */}
            {paymentMethod === 'wallet' && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs text-slate-300">
                <div className="font-semibold text-slate-300">Select Digital Wallet:</div>
                <div className="grid grid-cols-2 gap-2">
                  {['Apple Pay', 'Amazon Pay Balance', 'Paytm Wallet', 'Mobikwik'].map((w, i) => (
                    <button
                      key={w}
                      type="button"
                      className={`p-2.5 rounded-lg border text-left text-xs font-medium transition ${
                        i === 0
                          ? 'border-rose-500 bg-rose-500/10 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Decisive Actions */}
            <div className="space-y-3 pt-2">
              {/* DONE / Confirm Payment (Success button) */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleConfirmDonePayment('success')}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-base rounded-xl shadow-xl shadow-emerald-950/40 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5 text-white" />
                <span>
                  {isProcessing ? 'Processing Payment...' : `Done / Confirm Payment (₹${grandTotal.toLocaleString()})`}
                </span>
              </button>

              {/* Cancel / Back (Failed button) */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCancelPayment}
                  className="flex-1 py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span>Cancel / Back (Failed)</span>
                </button>

                {/* Simulate Decline Button for Reviewer testing */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleConfirmDonePayment('fail')}
                  title="Test failure branch: releases holds back to available"
                  className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition"
                >
                  Simulate Bank Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
