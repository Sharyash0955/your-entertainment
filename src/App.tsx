import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  EventItem,
  SeatItem,
  UserItem,
  SelectedMeal,
  ConfirmedBookingDetail,
  SocketSeatHeldPayload,
  SocketSeatReleasedPayload,
  SocketSeatBookedPayload,
} from './types';
import { Navbar } from './components/Navbar';
import { StepProgress, BookingStep } from './components/StepProgress';
import { MovieCatalogView } from './components/MovieCatalogView';
import { ShowtimeSelectionView } from './components/ShowtimeSelectionView';
import { SeatSelectionView } from './components/SeatSelectionView';
import { MealsSelectionView } from './components/MealsSelectionView';
import { PaymentPageView } from './components/PaymentPageView';
import { BookingConfirmationView } from './components/BookingConfirmationView';
import { AuthModal } from './components/AuthModal';
import { GeminiChatbot } from './components/GeminiChatbot';
import { MyBookingsModal } from './components/MyBookingsModal';
import { ConcurrencyModal } from './components/ConcurrencyModal';
import { ActivityFeed, ActivityLogItem } from './components/ActivityFeed';
import { AlertCircle, CheckCircle2, Bot, Sparkles, Film, ArrowRight } from 'lucide-react';

export default function App() {
  // Navigation & Step state
  const [currentStep, setCurrentStep] = useState<BookingStep>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Domain data
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string>('Prasad IMAX Auditorium 1, Screen 1');
  const [selectedDate, setSelectedDate] = useState<string>('Today (22 Sep)');
  const [selectedTime, setSelectedTime] = useState<string>('08:30 PM');

  // Seats & Meals
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>([]);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBookingDetail | null>(null);

  // User state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserItem>({
    id: 'user_alice',
    name: 'Alice Walker',
    email: 'alice@example.com',
    avatarColor: '#e11d48',
  });

  // UI Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isConcurrencyOpen, setIsConcurrencyOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);

  // Interaction loading
  const [isHoldingLoadingId, setIsHoldingLoadingId] = useState<string | null>(null);

  // Notifications & Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    type: 'success' | 'conflict' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const addLog = useCallback(
    (type: ActivityLogItem['type'], message: string, user?: string, seatLabel?: string) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog: ActivityLogItem = {
        id: `${Date.now()}_${Math.random()}`,
        type,
        message,
        timestamp: timeStr,
        user,
        seatLabel,
      };
      setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    },
    []
  );

  const showToast = useCallback(
    (type: 'success' | 'conflict' | 'info', title: string, message: string) => {
      const id = `${Date.now()}`;
      setToastNotification({ id, type, title, message });
      setTimeout(() => {
        setToastNotification((curr) => (curr?.id === id ? null : curr));
      }, 5000);
    },
    []
  );

  // 1. Initial Data Fetch
  const fetchAllEventsAndUsers = useCallback(async () => {
    try {
      const [eventsRes, usersRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/users'),
      ]);

      if (eventsRes.ok) {
        const evData = await eventsRes.json();
        setEvents(evData);
      }

      if (usersRes.ok) {
        const uList = await usersRes.json();
        setUsers(uList);
        if (uList.length > 0) {
          setCurrentUser(uList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load events & users', err);
    }
  }, []);

  useEffect(() => {
    fetchAllEventsAndUsers();
  }, [fetchAllEventsAndUsers]);

  // Fetch seats whenever an event is selected
  const activeEventId = selectedEvent?.id || 'evt_interstellar_imax';

  const fetchSeatsForEvent = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/seats?eventId=${eventId}`);
      if (res.ok) {
        const seatData = await res.json();
        setSeats(seatData);
      }
    } catch (err) {
      console.error('Failed to load seats for event', err);
    }
  }, []);

  useEffect(() => {
    fetchSeatsForEvent(activeEventId);
  }, [activeEventId, fetchSeatsForEvent]);

  // 2. Socket.IO Real-time Synchronization
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_event', activeEventId);
      addLog('info', `Joined live seat channel for ${activeEventId}`);
    });

    socket.on('seat_held', (data: SocketSeatHeldPayload) => {
      if (data.eventId !== activeEventId) return;
      setSeats((prev) =>
        prev.map((s) =>
          s.id === data.seatId
            ? {
                ...s,
                status: 'hold',
                held_by: data.heldBy,
                hold_expires_at: data.holdExpiresAt,
              }
            : s
        )
      );
      addLog('held', `Seat ${data.seatId} held by user`, data.heldBy, data.seatId);
    });

    socket.on('seat_released', (data: SocketSeatReleasedPayload) => {
      if (data.eventId !== activeEventId) return;
      setSeats((prev) =>
        prev.map((s) =>
          s.id === data.seatId
            ? {
                ...s,
                status: 'available',
                held_by: null,
                hold_expires_at: null,
              }
            : s
        )
      );
      addLog('released', `Seat ${data.seatId} released back to Available`, undefined, data.seatId);
    });

    socket.on('seat_booked', (data: SocketSeatBookedPayload) => {
      if (data.eventId !== activeEventId) return;
      setSeats((prev) =>
        prev.map((s) =>
          s.id === data.seatId
            ? {
                ...s,
                status: 'booked',
                held_by: null,
                hold_expires_at: null,
              }
            : s
        )
      );
      addLog('booked', `Seat ${data.seatId} booked permanently!`, data.userId, data.seatId);
    });

    socket.on('seat_map_reset', () => {
      fetchSeatsForEvent(activeEventId);
      showToast('info', 'Seat Map Reset', 'All seats reset to initial inventory.');
      addLog('info', 'Seat inventory reset');
    });

    return () => {
      socket.disconnect();
    };
  }, [activeEventId, addLog, fetchSeatsForEvent, showToast]);

  // 3. User clicks a seat (Atomic Hold or Release toggle)
  const handleSeatClick = async (seat: SeatItem) => {
    if (!currentUser) return;

    // If already held by current user: release it on toggle
    if (seat.status === 'hold' && seat.held_by === currentUser.id) {
      setIsHoldingLoadingId(seat.id);
      try {
        await fetch(`/api/seats/${seat.id}/release`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            eventId: activeEventId,
          }),
        });
        setSeats((prev) =>
          prev.map((s) =>
            s.id === seat.id
              ? { ...s, status: 'available', held_by: null, hold_expires_at: null }
              : s
          )
        );
        addLog('released', `Unselected seat ${seat.row}${seat.number}`, currentUser.name);
      } catch (err) {
        console.error('Error releasing seat', err);
      } finally {
        setIsHoldingLoadingId(null);
      }
      return;
    }

    if (seat.status !== 'available') return;

    setIsHoldingLoadingId(seat.id);

    try {
      const res = await fetch(`/api/seats/${seat.id}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          eventId: activeEventId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.seat) {
        setSeats((prev) =>
          prev.map((s) => (s.id === data.seat.id ? data.seat : s))
        );
        showToast('success', 'Lock Acquired', `Seat ${seat.row}${seat.number} held for 5 minutes.`);
        addLog('held', `Acquired lock on ${seat.row}${seat.number}`, currentUser.name);
      } else if (res.status === 409) {
        // Race condition caught!
        showToast('conflict', '409 Conflict: Seat Taken!', data.message || 'Another user locked this seat.');
        addLog('conflict', `Race condition guard blocked hold on ${seat.row}${seat.number}`, currentUser.name);
      } else {
        showToast('conflict', 'Unable to hold', data.message || 'Seat unavailable');
      }
    } catch (err: any) {
      showToast('conflict', 'Hold Failed', err.message || 'Network error');
    } finally {
      setIsHoldingLoadingId(null);
    }
  };

  // Step 1: Select Event
  const handleSelectEvent = (ev: EventItem) => {
    setSelectedEvent(ev);
    setSelectedMeals([]);
    setCurrentStep('showtime');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2: Select Showtime & Venue
  const handleSelectShowtime = (selection: { venue: string; date: string; time: string }) => {
    setSelectedVenue(selection.venue);
    setSelectedDate(selection.date);
    setSelectedTime(selection.time);
    setCurrentStep('seats');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3: Proceed to Meals
  const handleProceedToMeals = (myHeldSeats: SeatItem[]) => {
    if (myHeldSeats.length === 0) {
      showToast('conflict', 'No seats selected', 'Please select at least 1 available seat.');
      return;
    }
    setCurrentStep('meals');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 4: Proceed to Payment Page
  const handleProceedToPayment = () => {
    setCurrentStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 5: Payment Success
  const handlePaymentSuccess = (bookingDetail: ConfirmedBookingDetail) => {
    setConfirmedBooking(bookingDetail);
    setCurrentStep('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('success', 'Booking Confirmed!', `Ticket pass generated (${bookingDetail.bookingCode})`);
  };

  // Step 5: Payment Cancelled or Failed
  const handlePaymentCancelled = (reason?: string) => {
    showToast('info', 'Payment Cancelled', reason || 'Held seats were released back to Available.');
    fetchSeatsForEvent(activeEventId);
    setCurrentStep('seats');
  };

  // Step 6: Book Another
  const handleBookAnother = () => {
    setSelectedEvent(null);
    setSelectedMeals([]);
    setConfirmedBooking(null);
    setCurrentStep('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const myHeldSeats = seats.filter(
    (s) => s.status === 'hold' && s.held_by === currentUser.id
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Toast Notification Top Banner */}
      {toastNotification && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transition-all ${
            toastNotification.type === 'conflict'
              ? 'bg-rose-950/90 border-rose-500/80 text-rose-200'
              : toastNotification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200'
              : 'bg-slate-900/90 border-slate-700 text-slate-200'
          }`}
        >
          {toastNotification.type === 'conflict' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold leading-tight">{toastNotification.title}</h4>
            <p className="text-[11px] opacity-90 leading-snug">{toastNotification.message}</p>
          </div>
        </div>
      )}

      {/* Main Sticky Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenConcurrency={() => setIsConcurrencyOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenMyBookings={() => setIsMyBookingsOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (currentStep !== 'catalog') setCurrentStep('catalog');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onGoHome={() => {
          setCurrentStep('catalog');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Interactive Step Progress Header */}
      <StepProgress
        currentStep={currentStep}
        onNavigateStep={(step) => {
          if (step === 'catalog') setCurrentStep('catalog');
          else if (step === 'showtime' && selectedEvent) setCurrentStep('showtime');
          else if (step === 'seats' && selectedEvent) setCurrentStep('seats');
          else if (step === 'meals' && selectedEvent && myHeldSeats.length > 0) setCurrentStep('meals');
        }}
        canNavigateBackTo={['catalog', 'showtime', 'seats']}
      />

      {/* Page Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Step 1: Movie & Event Discovery Catalog */}
        {currentStep === 'catalog' && (
          <MovieCatalogView
            events={events}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {/* Step 2: Date, Cinema Venue & Showtime Selection */}
        {currentStep === 'showtime' && selectedEvent && (
          <ShowtimeSelectionView
            event={selectedEvent}
            onBack={() => setCurrentStep('catalog')}
            onSelectShowtime={handleSelectShowtime}
          />
        )}

        {/* Step 3: Interactive Seat Map with Atomic Holds */}
        {currentStep === 'seats' && selectedEvent && (
          <SeatSelectionView
            event={selectedEvent}
            venueName={selectedVenue}
            dateStr={selectedDate}
            timeStr={selectedTime}
            seats={seats}
            currentUser={currentUser}
            onSeatClick={handleSeatClick}
            isHoldingLoadingId={isHoldingLoadingId}
            onBack={() => setCurrentStep('showtime')}
            onProceedToMeals={handleProceedToMeals}
          />
        )}

        {/* Step 4: Food & Beverages Selection ("Meals and all") */}
        {currentStep === 'meals' && selectedEvent && (
          <MealsSelectionView
            event={selectedEvent}
            venueName={selectedVenue}
            dateStr={selectedDate}
            timeStr={selectedTime}
            selectedSeats={myHeldSeats}
            selectedMeals={selectedMeals}
            onUpdateMeals={setSelectedMeals}
            onBack={() => setCurrentStep('seats')}
            onProceedToPayment={handleProceedToPayment}
          />
        )}

        {/* Step 5: Dedicated Payment Page */}
        {currentStep === 'payment' && selectedEvent && (
          <PaymentPageView
            event={selectedEvent}
            venueName={selectedVenue}
            dateStr={selectedDate}
            timeStr={selectedTime}
            selectedSeats={myHeldSeats}
            selectedMeals={selectedMeals}
            currentUser={currentUser}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailedOrCancelled={handlePaymentCancelled}
          />
        )}

        {/* Step 6: Confirmation & Download Ticket Screen */}
        {currentStep === 'confirmation' && confirmedBooking && (
          <BookingConfirmationView
            booking={confirmedBooking}
            onBookAnother={handleBookAnother}
          />
        )}
      </main>

      {/* Floating Bottom-Right Trigger for Gemini AI Concierge */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-full shadow-2xl shadow-rose-950/60 hover:scale-105 active:scale-95 transition"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-wide">Ask AI Concierge</span>
        </button>
      )}

      {/* Floating Real-time Activity Drawer Toggle */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setShowActivityFeed(!showActivityFeed)}
          className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-white backdrop-blur-md shadow-lg transition flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Activity Logs ({activityLogs.length})</span>
        </button>
      </div>

      {/* Collapsible Activity Feed Overlay */}
      {showActivityFeed && (
        <div className="fixed bottom-16 left-6 z-40 w-80 max-h-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-300">
            <span>Seat Race Condition Logs</span>
            <button
              onClick={() => setShowActivityFeed(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-1.5 pt-2 text-[11px]">
            {activityLogs.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No events yet</p>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80 flex items-start gap-1.5"
                >
                  <span className="text-[9px] text-slate-500 font-mono shrink-0">{log.timestamp}</span>
                  <span className="text-slate-300 line-clamp-2">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* All Modal Overlays */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onSelectUser={(u) => {
          setCurrentUser(u);
          showToast('info', 'Active User Switched', `Now logged in as ${u.name}`);
        }}
        allUsers={users}
      />

      <GeminiChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSuggestMovie={(movie) => {
          const match = events.find((e) => e.name.toLowerCase().includes(movie.toLowerCase()));
          if (match) {
            handleSelectEvent(match);
            setIsChatOpen(false);
          }
        }}
      />

      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
        currentUser={currentUser}
        events={events}
      />

      <ConcurrencyModal
        isOpen={isConcurrencyOpen}
        onClose={() => setIsConcurrencyOpen(false)}
        seats={seats}
        onTestComplete={() => {
          fetchSeatsForEvent(activeEventId);
        }}
      />
    </div>
  );
}
