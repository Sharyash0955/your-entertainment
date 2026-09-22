import React from 'react';
import { ConfirmedBookingDetail } from '../types';
import { downloadTicketAsHtml, downloadTicketAsText } from '../utils/ticketGenerator';
import {
  CheckCircle,
  Download,
  Printer,
  FileText,
  Film,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Share2,
} from 'lucide-react';

interface BookingConfirmationViewProps {
  booking: ConfirmedBookingDetail;
  onBookAnother: () => void;
}

export const BookingConfirmationView: React.FC<BookingConfirmationViewProps> = ({
  booking,
  onBookAnother,
}) => {
  const seatLabels = booking.seats.map((s) => `${s.row}${s.number}`).join(', ');

  const handlePrint = () => {
    // Open printable HTML window or trigger print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      import('../utils/ticketGenerator').then(({ generateTicketHtml }) => {
        printWindow.document.write(generateTicketHtml(booking));
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      });
    } else {
      window.print();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/50">
          <CheckCircle className="w-9 h-9 text-emerald-400" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Booking Confirmed & Guaranteed
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            You're Going to the Show!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Booking Ref: <strong className="text-white font-mono">{booking.bookingCode}</strong> • An official E-Ticket has been generated.
          </p>
        </div>
      </div>

      {/* Official Cinema Pass Ticket */}
      <div className="rounded-3xl overflow-hidden bg-white text-slate-900 shadow-2xl border border-slate-200">
        {/* Pass Top Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-6 sm:p-8 relative">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-widest bg-black/20 px-2.5 py-0.5 rounded backdrop-blur">
              CinePulse / District Pass
            </span>
            <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
              Ref: {booking.bookingCode}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{booking.event.name}</h2>
          <p className="text-xs text-rose-100 mt-1 font-medium">
            {booking.event.genre || 'Cinema Experience'} • {booking.event.format || 'IMAX 70mm'} • {booking.event.duration || '2h'}
          </p>
        </div>

        {/* Pass Middle Information Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Date</span>
              <span className="text-sm font-extrabold text-slate-900">{booking.dateStr}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Showtime</span>
              <span className="text-sm font-extrabold text-rose-600">{booking.timeStr}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Seats ({booking.seats.length})</span>
              <span className="text-base font-black text-slate-900">{seatLabels}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Screen</span>
              <span className="text-xs font-bold text-slate-800 line-clamp-1">{booking.venueName}</span>
            </div>
          </div>

          {/* Perforation Line */}
          <div className="relative border-t-2 border-dashed border-slate-300 -mx-6 sm:-mx-8">
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-slate-950" />
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-slate-950" />
          </div>

          {/* Snacks & Attendee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Food & Beverage Vouchers
              </span>
              {booking.meals.length > 0 ? (
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                  {booking.meals.map((m) => (
                    <li key={m.meal.id}>
                      {m.quantity}x {m.meal.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-500 italic">No snacks pre-ordered</span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Attendee & Payment
              </span>
              <p className="text-slate-900 font-semibold">{booking.user.name}</p>
              <p className="text-slate-500">{booking.user.email}</p>
              <p className="text-emerald-600 font-bold mt-1">
                ₹{booking.totalAmount.toLocaleString()} Paid via {booking.paymentMethod}
              </p>
            </div>
          </div>
        </div>

        {/* Pass Bottom Bar with Barcode */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="font-mono text-xl sm:text-2xl font-black tracking-[0.3em] text-slate-900">
              ||| | | |||| | ||| | ||
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Present barcode at auditorium turnstile</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadTicketAsHtml(booking)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Ticket (PDF/HTML)
            </button>

            <button
              onClick={handlePrint}
              className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition"
              title="Print E-Ticket"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Main Download Ticket Button (Primary user requirement) */}
        <button
          onClick={() => downloadTicketAsHtml(booking)}
          className="px-6 py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Official Ticket (PDF/HTML)
        </button>

        {/* Text Receipt download */}
        <button
          onClick={() => downloadTicketAsText(booking)}
          className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-sm rounded-xl transition flex items-center gap-2"
        >
          <FileText className="w-4 h-4 text-slate-400" />
          Download Text Summary (.txt)
        </button>

        {/* Book Another Movie */}
        <button
          onClick={onBookAnother}
          className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 font-semibold text-sm rounded-xl transition flex items-center gap-2"
        >
          <span>Book Another Experience</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
