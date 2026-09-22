import React, { useState, useEffect } from 'react';
import { UserItem, ConfirmedBookingDetail, EventItem } from '../types';
import { downloadTicketAsHtml, downloadTicketAsText } from '../utils/ticketGenerator';
import { X, Ticket, Download, FileText, Calendar, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserItem;
  events: EventItem[];
}

export const MyBookingsModal: React.FC<MyBookingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  events,
}) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      // Filter bookings for the current user
      const userBookings = (data || []).filter(
        (b: any) => b.user_id === currentUser.id
      );
      setBookings(userBookings);
    } catch (err) {
      console.error('Failed to fetch user bookings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBookings();
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const buildBookingDetail = (b: any): ConfirmedBookingDetail => {
    const ev = events.find((e) => e.id === b.event_id) || {
      id: b.event_id || 'ev_1',
      name: b.movie_name || 'Cinema Screening',
      category: 'movie',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      synopsis: 'District & CinePulse movie pass',
      basePrice: 500,
    };

    let seatsArray = [];
    try {
      const parsed = typeof b.seat_labels === 'string' ? JSON.parse(b.seat_labels) : b.seat_labels;
      seatsArray = Array.isArray(parsed)
        ? parsed.map((label: string, i: number) => ({
            id: `seat_${i}`,
            event_id: b.event_id || 'evt_interstellar_imax',
            row: label.charAt(0),
            number: parseInt(label.slice(1)) || 1,
            tier: 'PREMIUM' as const,
            price: Math.round((b.total_amount || 500) / (parsed.length || 1)),
            status: 'booked' as const,
            held_by: null,
            hold_expires_at: null,
          }))
        : [];
    } catch (_) {
      seatsArray = [
        {
          id: b.seat_id || 'seat_1',
          event_id: b.event_id || 'evt_interstellar_imax',
          row: 'C',
          number: 5,
          tier: 'PREMIUM' as const,
          price: b.total_amount || 500,
          status: 'booked' as const,
          held_by: null,
          hold_expires_at: null,
        },
      ];
    }

    let parsedMeals = [];
    try {
      if (b.meals_summary) {
        parsedMeals = typeof b.meals_summary === 'string' ? JSON.parse(b.meals_summary) : b.meals_summary;
      }
    } catch (_) {}

    return {
      id: b.id,
      event: ev,
      venueName: b.venue_name || 'Central Laser Dome Audi 1',
      dateStr: b.showtime?.split('•')?.[0]?.trim() || 'Today',
      timeStr: b.showtime?.split('•')?.[1]?.trim() || '08:00 PM',
      seats: seatsArray,
      meals: parsedMeals || [],
      user: currentUser,
      ticketSubtotal: b.total_amount ? Math.round(b.total_amount * 0.8) : 500,
      mealsSubtotal: 0,
      convenienceFee: 30,
      taxes: 25,
      totalAmount: b.total_amount || 555,
      bookingCode: b.id?.toUpperCase().substring(0, 8) || 'CP-TICKET',
      bookingTime: new Date(b.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: 'UPI',
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">My Confirmed Tickets</h2>
              <p className="text-xs text-slate-400">Past & Upcoming Cinema Bookings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bookings List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading your tickets...</div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No active tickets found for {currentUser.name}</p>
              <p className="text-xs text-slate-500">Pick a movie, select your seats, and complete booking!</p>
            </div>
          ) : (
            bookings.map((b) => {
              const detail = buildBookingDetail(b);
              const seatLabels = detail.seats.map((s) => `${s.row}${s.number}`).join(', ');

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-md hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                          Confirmed & Paid
                        </span>
                        <span className="text-xs font-mono text-slate-400 font-bold">
                          ID: {b.id.substring(0, 10)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{detail.event.name}</h3>
                      <p className="text-xs text-slate-400">{detail.venueName}</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Paid</span>
                      <span className="text-base font-black text-emerald-400">₹{detail.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-4 text-slate-300">
                      <span>Seats: <strong className="text-white">{seatLabels || b.seat_id}</strong></span>
                      <span>Timing: <strong className="text-white">{b.showtime || 'Today'}</strong></span>
                    </div>

                    {/* Download Ticket Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadTicketAsHtml(detail)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Ticket
                      </button>

                      <button
                        onClick={() => downloadTicketAsText(detail)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Download Text Receipt"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
