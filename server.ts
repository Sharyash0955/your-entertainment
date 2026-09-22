import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import {
  initDb,
  holdSeatAtomic,
  releaseSeat,
  completeBooking,
  completeMultiSeatOrder,
  releaseExpiredHolds,
  getAllSeats,
  getAvailableSeats,
  getSeatById,
  getAllEvents,
  getEventById,
  getAllUsers,
  createOrUpdateUser,
  getAllBookings,
  resetSeatMap,
} from './server/db';
import { suggestSeatsWithAI, chatWithAI } from './server/gemini';

dotenv.config();

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3000;

// Socket.IO Room Management
io.on('connection', (socket) => {
  // Join event room
  socket.on('join_event', (eventId: string) => {
    socket.join(`event_${eventId}`);
  });

  socket.on('leave_event', (eventId: string) => {
    socket.leave(`event_${eventId}`);
  });
});

// Periodic background job: Release expired holds (5-minute TTL)
setInterval(() => {
  try {
    const expiredSeats = releaseExpiredHolds();
    for (const seat of expiredSeats) {
      io.to(`event_${seat.event_id}`).emit('seat_released', {
        seatId: seat.id,
        eventId: seat.event_id,
        reason: 'expired',
      });
    }
  } catch (err) {
    console.error('Error during hold expiration sweep:', err);
  }
}, 3000);

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Get all events / movies / shows
app.get('/api/events', (req, res) => {
  const events = getAllEvents();
  res.json(events);
});

// Get Event info by ID
app.get('/api/events/:id', (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// Get all seats for an event
app.get('/api/seats', (req, res) => {
  const eventId = (req.query.eventId as string) || 'evt_interstellar_imax';
  const seats = getAllSeats(eventId);
  res.json(seats);
});

// Get demo & registered users
app.get('/api/users', (req, res) => {
  const users = getAllUsers();
  res.json(users);
});

// Login / Signup endpoint (WWE / Cinema user profile)
app.post('/api/users/auth', (req, res) => {
  const { name, email, avatarColor } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const displayName = name || email.split('@')[0];
  const user = createOrUpdateUser({ name: displayName, email, avatarColor });
  res.json({ success: true, user });
});

// Get recent bookings (optionally filter by eventId and/or userId)
app.get('/api/bookings', (req, res) => {
  const eventId = req.query.eventId as string | undefined;
  const userId = req.query.userId as string | undefined;
  const bookings = getAllBookings(eventId, userId);
  res.json(bookings);
});

/**
 * ATOMIC SEAT HOLD
 * Core placement criteria:
 * UPDATE seats SET status='hold', held_by=?, hold_expires_at=? WHERE id=? AND status='available';
 * If rows affected === 0, reject with 409 Conflict.
 */
app.post('/api/seats/:id/hold', (req, res) => {
  const seatId = req.params.id;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const result = holdSeatAtomic(seatId, userId);

  if (result.success && result.seat) {
    // Notify all clients in the event room
    io.to(`event_${result.seat.event_id}`).emit('seat_held', {
      seatId: result.seat.id,
      eventId: result.seat.event_id,
      heldBy: userId,
      holdExpiresAt: result.seat.hold_expires_at,
    });

    return res.status(200).json({
      success: true,
      message: 'Seat hold acquired successfully',
      seat: result.seat,
    });
  } else {
    // 0 rows updated: Return 409 Conflict ("seat just taken")
    return res.status(409).json({
      error: 'Conflict: seat just taken',
      message: result.reason || 'Seat was taken by another request',
    });
  }
});

/**
 * HOLD MULTIPLE SEATS ATOMICALLY
 * For cart / multi-seat selection
 */
app.post('/api/seats/hold-multiple', (req, res) => {
  const { seatIds, userId, eventId } = req.body;
  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0 || !userId) {
    return res.status(400).json({ error: 'seatIds array and userId are required' });
  }

  const successfulSeats: any[] = [];
  const failedSeats: string[] = [];

  for (const seatId of seatIds) {
    const result = holdSeatAtomic(seatId, userId);
    if (result.success && result.seat) {
      successfulSeats.push(result.seat);
      io.to(`event_${result.seat.event_id}`).emit('seat_held', {
        seatId: result.seat.id,
        eventId: result.seat.event_id,
        heldBy: userId,
        holdExpiresAt: result.seat.hold_expires_at,
      });
    } else {
      failedSeats.push(seatId);
    }
  }

  if (failedSeats.length > 0 && successfulSeats.length === 0) {
    return res.status(409).json({
      error: 'Could not hold requested seats',
      failedSeats,
    });
  }

  return res.json({
    success: true,
    heldSeats: successfulSeats,
    failedSeats,
  });
});

/**
 * VOLUNTARY RELEASE
 */
app.post('/api/seats/:id/release', (req, res) => {
  const seatId = req.params.id;
  const { userId } = req.body;

  const result = releaseSeat(seatId, userId);
  if (result.success && result.seat) {
    io.to(`event_${result.seat.event_id}`).emit('seat_released', {
      seatId: result.seat.id,
      eventId: result.seat.event_id,
      reason: 'user_cancelled',
    });
    return res.json({ success: true, message: 'Seat released successfully' });
  }

  return res.status(400).json({ error: result.reason || 'Unable to release seat' });
});

/**
 * RELEASE MULTIPLE SEATS (E.g. user clicked back/cancel on payment page)
 */
app.post('/api/seats/release-multiple', (req, res) => {
  const { seatIds, userId } = req.body;
  if (!seatIds || !Array.isArray(seatIds)) {
    return res.status(400).json({ error: 'seatIds array required' });
  }

  const released: string[] = [];
  for (const seatId of seatIds) {
    const result = releaseSeat(seatId, userId);
    if (result.success && result.seat) {
      released.push(seatId);
      io.to(`event_${result.seat.event_id}`).emit('seat_released', {
        seatId: result.seat.id,
        eventId: result.seat.event_id,
        reason: 'user_cancelled',
      });
    }
  }

  return res.json({ success: true, released });
});

/**
 * SIMULATED PAYMENT ENDPOINT (Single seat)
 */
app.post('/api/payment/simulate', (req, res) => {
  const { seatId, userId } = req.body;
  const force = req.query.force as string | undefined;

  if (!seatId || !userId) {
    return res.status(400).json({ error: 'seatId and userId are required' });
  }

  const seat = getSeatById(seatId);
  if (!seat) {
    return res.status(404).json({ error: 'Seat not found' });
  }

  const now = Date.now();
  if (seat.status !== 'hold' || seat.held_by !== userId || (seat.hold_expires_at && seat.hold_expires_at <= now)) {
    return res.status(400).json({
      error: 'Invalid hold state',
      message: 'No active unexpired hold found for this user on this seat',
    });
  }

  let paymentSucceeded = Math.random() < 0.90;
  if (force === 'success') paymentSucceeded = true;
  if (force === 'fail' || force === 'failure') paymentSucceeded = false;

  if (paymentSucceeded) {
    const bookingResult = completeBooking(seatId, userId);
    if (!bookingResult.success || !bookingResult.booking) {
      return res.status(409).json({
        error: 'Booking failed',
        message: bookingResult.reason || 'Hold expired during payment processing',
      });
    }

    io.to(`event_${seat.event_id}`).emit('seat_booked', {
      seatId: seat.id,
      eventId: seat.event_id,
      bookingId: bookingResult.booking.id,
      userId,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Payment simulation succeeded! Booking confirmed.',
      booking: bookingResult.booking,
      seat: bookingResult.seat,
    });
  } else {
    releaseSeat(seatId, userId);

    io.to(`event_${seat.event_id}`).emit('seat_released', {
      seatId: seat.id,
      eventId: seat.event_id,
      reason: 'payment_failed',
    });

    return res.status(402).json({
      status: 'failed',
      error: 'Simulated payment failed (declined/timeout). The hold on this seat has been released back to Available.',
    });
  }
});

/**
 * COMPLETE ORDER (Multiple seats + Meals)
 * Direct payment page flow: "if payment success click done else no click or back then failed"
 */
app.post('/api/payment/complete-order', (req, res) => {
  const { seatIds, userId, eventId, venueName, showtime, meals, totalAmount, force } = req.body;

  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0 || !userId || !eventId) {
    return res.status(400).json({ error: 'Missing required order fields (seatIds, userId, eventId)' });
  }

  // Check if force failure requested
  if (force === 'fail' || force === 'failure') {
    // Release seats
    for (const sId of seatIds) {
      releaseSeat(sId, userId);
      const seatObj = getSeatById(sId);
      if (seatObj) {
        io.to(`event_${eventId}`).emit('seat_released', {
          seatId: sId,
          eventId,
          reason: 'payment_failed',
        });
      }
    }
    return res.status(402).json({
      status: 'failed',
      error: 'Payment declined by bank or user cancelled. Held seats have been released.',
    });
  }

  const result = completeMultiSeatOrder({
    seatIds,
    userId,
    eventId,
    venueName,
    showtime,
    meals,
    totalAmount,
  });

  if (!result.success) {
    return res.status(409).json({
      status: 'failed',
      error: result.reason || 'Could not complete booking',
    });
  }

  // Broadcast all booked seats
  for (const bookedSeat of result.bookedSeats) {
    io.to(`event_${eventId}`).emit('seat_booked', {
      seatId: bookedSeat.id,
      eventId,
      bookingId: result.bookingIds[0] || 'bk_multi',
      userId,
    });
  }

  return res.status(200).json({
    status: 'success',
    message: 'Booking confirmed!',
    bookingIds: result.bookingIds,
    bookedSeats: result.bookedSeats,
  });
});

/**
 * MULTI-TURN GEMINI AI CHATBOT
 * POST /api/chat
 * Body: { message, history }
 */
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message string is required' });
  }

  try {
    const reply = await chatWithAI(message, Array.isArray(history) ? history : []);
    res.json({ reply });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process AI chat message' });
  }
});

/**
 * AI FEATURE: SMART SEAT FINDER
 * POST /api/ai/suggest
 * Body: { eventId, prompt }
 */
app.post('/api/ai/suggest', async (req, res) => {
  const { eventId, prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const targetEventId = eventId || 'evt_interstellar_imax';
  const targetEvent = getEventById(targetEventId);
  const availableSeats = getAvailableSeats(targetEventId);

  const suggestion = await suggestSeatsWithAI(
    prompt,
    availableSeats,
    targetEvent?.category || 'movie'
  );
  res.json(suggestion);
});

/**
 * SEAT MAP RESET (FOR TESTING / DEMO REPLAY)
 */
app.post('/api/admin/reset', (req, res) => {
  const eventId = req.body.eventId || 'evt_interstellar_imax';
  resetSeatMap(eventId);
  const seats = getAllSeats(eventId);
  io.to(`event_${eventId}`).emit('seat_map_reset', { eventId });
  res.json({ success: true, message: 'Seat map reset to initial state', seats });
});

/**
 * IN-APP CONCURRENCY LOAD TEST RUNNER
 * Allows testing directly from the web UI to verify the race-condition atomic guard live!
 */
app.post('/api/test/concurrency', async (req, res) => {
  const { seatId, count = 50 } = req.body;
  const targetSeatId = seatId || 'evt_interstellar_imax_B5';

  // Ensure target seat is reset to available first
  releaseSeat(targetSeatId);

  const targetSeat = getSeatById(targetSeatId);
  const seatLabel = targetSeat ? `${targetSeat.row}${targetSeat.number}` : targetSeatId;

  const total = Math.min(Math.max(Number(count) || 50, 10), 100);
  const start = Date.now();

  const winners: any[] = [];
  const conflicts: any[] = [];
  const errors: any[] = [];

  // Generate 50 concurrent requests simultaneously
  const requests = Array.from({ length: total }, (_, i) => {
    const virtualUserId = `load_tester_${i + 1}_${Math.random().toString(36).substring(2, 6)}`;
    const reqStart = Date.now();
    return new Promise<void>((resolve) => {
      try {
        const result = holdSeatAtomic(targetSeatId, virtualUserId);
        const duration = Date.now() - reqStart;
        if (result.success) {
          winners.push({
            userId: virtualUserId,
            statusCode: 200,
            durationMs: duration,
            message: 'Seat hold acquired successfully (Winner)',
          });
        } else {
          conflicts.push({
            userId: virtualUserId,
            statusCode: 409,
            durationMs: duration,
            message: result.reason || 'Conflict: seat just taken',
          });
        }
      } catch (err: any) {
        errors.push({
          userId: virtualUserId,
          statusCode: 500,
          durationMs: Date.now() - reqStart,
          message: err?.message || 'Server error',
        });
      }
      resolve();
    });
  });

  await Promise.all(requests);
  const executionTimeMs = Date.now() - start;

  // Broadcast the update so the UI seat map reflects the single winner
  if (winners.length > 0) {
    const winningSeat = getSeatById(targetSeatId);
    if (winningSeat) {
      io.to(`event_${winningSeat.event_id}`).emit('seat_held', {
        seatId: winningSeat.id,
        eventId: winningSeat.event_id,
        heldBy: winners[0].userId,
        holdExpiresAt: winningSeat.hold_expires_at,
      });
    }
  }

  res.json({
    totalRequests: total,
    targetSeatId,
    targetSeatLabel: seatLabel,
    winners,
    conflicts,
    errors,
    executionTimeMs,
    verifiedOneWinner: winners.length === 1 && conflicts.length === total - 1,
  });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// -------------------------------------------------------------

async function startServer() {
  await initDb();
  console.log('Database initialized successfully with events and seats.');

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CinePulse Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
