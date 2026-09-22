-- ============================================================================
-- CinePulse & District Entertainment Ticketing Platform
-- Relational Database Schema (SQLite / PostgreSQL Compatible)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores authenticated users and evaluators participating in seat booking.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatarColor TEXT NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2. EVENTS TABLE (Movies & Live Shows)
-- Stores event catalogs, dates, showtimes, venues, genres, and pricing bases.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  venue TEXT NOT NULL,
  showtime TEXT NOT NULL,
  category TEXT NOT NULL,
  genre TEXT,
  duration TEXT,
  rating REAL,
  votes TEXT,
  language TEXT,
  format TEXT,
  posterUrl TEXT,
  backdropUrl TEXT,
  synopsis TEXT,
  basePrice REAL NOT NULL,
  metadataJson TEXT
);

-- ----------------------------------------------------------------------------
-- 3. SEATS TABLE
--
-- CRITICAL CONCURRENCY & RACE CONDITION GUARD:
-- All state transitions for seat holding and booking MUST proceed through a
-- single atomic conditional SQL UPDATE statement:
--
--   UPDATE seats
--   SET status = 'hold', held_by = :userId, hold_expires_at = :expiresAt
--   WHERE id = :seatId AND (
--     status = 'available'
--     OR (status = 'hold' AND hold_expires_at < :now)
--   );
--
-- By executing this atomic write at the storage engine level, the database
-- guarantees serializability: when 50+ concurrent requests target the same
-- seat ID in the exact same millisecond, exactly ONE statement modifies a row
-- (returning changes = 1). All remaining 49 requests will affect 0 rows
-- (changes = 0) and are instantly rejected with HTTP 409 Conflict ("Seat already
-- held or booked").
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seats (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  row TEXT NOT NULL,
  number INTEGER NOT NULL,
  tier TEXT NOT NULL DEFAULT 'STANDARD',
  price REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'hold', 'booked')),
  held_by TEXT,
  hold_expires_at INTEGER,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 4. BOOKINGS TABLE
-- Records finalized transactions, confirmed ticket seats, meals, and payment totals.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  seat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  event_name TEXT,
  venue TEXT,
  showtime TEXT,
  meals_summary TEXT,
  total_amount REAL,
  FOREIGN KEY(seat_id) REFERENCES seats(id) ON DELETE RESTRICT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Indexes for High-Traffic Read & Query Performance
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_seats_event_status ON seats(event_id, status);
CREATE INDEX IF NOT EXISTS idx_seats_hold_expiry ON seats(status, hold_expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
