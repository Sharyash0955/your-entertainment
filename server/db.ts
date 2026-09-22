import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { SeatItem, EventItem, UserItem, BookingItem, SelectedMeal } from '../src/types';

let db: Database;
const DB_FILE = path.join(process.cwd(), 'seat_booking.sqlite');

export const SEAT_HOLD_TTL_MS = 5 * 60 * 1000; // 5 minute TTL as required

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt_interstellar_imax',
    name: 'Interstellar (10th Anniversary IMAX 70mm)',
    title: 'Interstellar (10th Anniversary IMAX 70mm)',
    venue: 'Prasad IMAX Auditorium 1, Screen 1',
    showtime: 'Today • 08:30 PM (Dolby Atmos & Laser Projection)',
    category: 'movie',
    genre: 'Sci-Fi • Epic Drama • Adventure',
    duration: '2h 49m',
    rating: 9.8,
    votes: '2.1M votes',
    language: 'English (Dolby Atmos)',
    format: 'IMAX 70mm Laser',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    synopsis: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival. Experience Christopher Nolan's visual triumph in uncompressed 70mm IMAX format with heart-thumping audio.",
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    director: 'Christopher Nolan',
    basePrice: 450,
    venues: [
      { id: 'v1', name: 'Prasad IMAX Screen 1', location: 'Central Dome, IMAX Laser 4K', formats: ['IMAX 70mm', 'Dolby Atmos'], features: ['Laser Projection', 'Curved Screen', 'Recliners'] },
      { id: 'v2', name: "PVR Director's Cut: Gold Class", location: 'Palladium Mall, Audi 3', formats: ['Dolby Cinema', 'Atmos'], features: ['Butler on Call', 'Gourmet Dining', 'Plush Recliners'] },
      { id: 'v3', name: 'Cinépolis VIP Lounge', location: 'Grand Galleria, Screen 5', formats: ['4DX', 'RealD 3D'], features: ['Motion Chairs', 'Environmental FX'] }
    ],
    dates: ['Today (22 Sep)', 'Tomorrow (23 Sep)', 'Wed (24 Sep)', 'Thu (25 Sep)', 'Fri (26 Sep)'],
    showtimes: ['10:30 AM', '02:15 PM', '06:30 PM', '08:30 PM', '10:45 PM']
  },
  {
    id: 'evt_dune_two',
    name: 'Dune: Part Two (IMAX Experience)',
    title: 'Dune: Part Two (IMAX Experience)',
    venue: "PVR Director's Cut Audi 2",
    showtime: 'Today • 07:15 PM (IMAX Laser & Spatial Audio)',
    category: 'movie',
    genre: 'Action • Sci-Fi • Adventure',
    duration: '2h 46m',
    rating: 9.6,
    votes: '980K votes',
    language: 'English / IMAX Laser',
    format: 'IMAX 4DX 3D',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Masterpiece directed by Denis Villeneuve.',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
    director: 'Denis Villeneuve',
    basePrice: 480,
    venues: [
      { id: 'v1', name: 'Prasad IMAX Screen 1', location: 'Central Dome', formats: ['IMAX Laser'], features: ['Dolby Atmos', 'Curved Giant Screen'] },
      { id: 'v2', name: "PVR Director's Cut: Gold Class", location: 'Audi 2', formats: ['Dolby Atmos'], features: ['Gourmet Food', 'Recliners'] },
      { id: 'v4', name: 'INOX Megaplex Laser', location: 'Downtown Hub', formats: ['Dolby Atmos', 'Laser 4K'], features: ['Laser Sound', 'Spacious Seating'] }
    ],
    dates: ['Today (22 Sep)', 'Tomorrow (23 Sep)', 'Wed (24 Sep)', 'Thu (25 Sep)'],
    showtimes: ['11:00 AM', '03:30 PM', '07:15 PM', '09:45 PM', '11:15 PM']
  },
  {
    id: 'evt_deadpool_wolverine',
    name: 'Deadpool & Wolverine',
    title: 'Deadpool & Wolverine',
    venue: 'Cinépolis VIP Grand Screen 4',
    showtime: 'Today • 09:00 PM (Dolby Cinema 3D)',
    category: 'movie',
    genre: 'Action • Comedy • Sci-Fi',
    duration: '2h 08m',
    rating: 9.3,
    votes: '840K votes',
    language: 'English / Hindi (Dolby Cinema)',
    format: '3D Dolby Vision',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&auto=format&fit=crop&q=80',
    synopsis: 'Wolverine is recovering from his injuries when he crosses paths with the loudmouth Deadpool. They team up to defeat a common enemy in the Marvel cinematic multiverse.',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen'],
    director: 'Shawn Levy',
    basePrice: 420,
    venues: [
      { id: 'v3', name: 'Cinépolis VIP Grand Screen 4', location: 'Grand Galleria', formats: ['3D Dolby Cinema'], features: ['Laser 3D', 'Dolby Atmos'] },
      { id: 'v1', name: 'Prasad IMAX Laser', location: 'Screen 2', formats: ['IMAX 3D'], features: ['Laser Screen'] },
      { id: 'v2', name: 'PVR Gold Class', location: 'Audi 4', formats: ['Dolby Atmos'], features: ['Luxury Recliners'] }
    ],
    dates: ['Today (22 Sep)', 'Tomorrow (23 Sep)', 'Wed (24 Sep)', 'Thu (25 Sep)', 'Fri (26 Sep)'],
    showtimes: ['12:15 PM', '04:00 PM', '06:45 PM', '09:00 PM', '11:30 PM']
  },
  {
    id: 'evt_coldplay_tour',
    name: 'Coldplay: Music of the Spheres World Tour',
    title: 'Coldplay: Music of the Spheres World Tour',
    venue: 'District Arena & Stadium Amphitheatre',
    showtime: 'Saturday • 07:00 PM (Mega Live Concert)',
    category: 'concert',
    genre: 'Live Concert • Pop Rock • Stadium Arena',
    duration: '3h 00m',
    rating: 9.9,
    votes: '500K fans',
    language: 'Live Performance',
    format: 'Stadium Experience',
    posterUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
    synopsis: 'Global sensation Coldplay brings their breathtaking stadium concert featuring LED wristbands, cosmic visuals, pyro, and legendary anthems like Yellow, Fix You, and Viva La Vida.',
    cast: ['Chris Martin', 'Jonny Buckland', 'Guy Berryman', 'Will Champion'],
    director: 'Coldplay Live Productions',
    basePrice: 950,
    venues: [
      { id: 'v_arena', name: 'District Arena Main Stage', location: 'Olympic Stadium Zone', formats: ['Live Sound System'], features: ['LED Wristband Included', 'Laser Pyrotechnics', 'VIP Lounge Access'] },
      { id: 'v_bowl', name: 'Sunset Open Air Amphitheatre', location: 'South Arena', formats: ['Dolby Live Acoustic'], features: ['Grandstand Views', 'Festival Village'] }
    ],
    dates: ['Saturday (27 Sep)', 'Sunday (28 Sep)'],
    showtimes: ['06:30 PM', '07:00 PM', '08:00 PM']
  },
  {
    id: 'evt_oppenheimer_70mm',
    name: 'Oppenheimer (70mm Special Screening)',
    title: 'Oppenheimer (70mm Special Screening)',
    venue: 'Prasad IMAX Screen 2',
    showtime: 'Tomorrow • 05:30 PM (70mm Master Print)',
    category: 'movie',
    genre: 'Biography • Drama • History',
    duration: '3h 00m',
    rating: 9.5,
    votes: '1.4M votes',
    language: 'English (70mm 6-Track Sound)',
    format: '70mm Large Format',
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80',
    synopsis: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project.',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
    director: 'Christopher Nolan',
    basePrice: 460,
    venues: [
      { id: 'v1', name: 'Prasad IMAX Screen 1', location: 'Central Dome', formats: ['70mm Film'], features: ['Full Height IMAX Aspect Ratio'] },
      { id: 'v2', name: 'PVR Gold Class', location: 'Audi 1', formats: ['Dolby Atmos'], features: ['Plush Recliners'] }
    ],
    dates: ['Tomorrow (23 Sep)', 'Wed (24 Sep)', 'Thu (25 Sep)'],
    showtimes: ['01:30 PM', '05:30 PM', '09:15 PM']
  },
  {
    id: 'evt_standup_comedy',
    name: 'Zakir Khan Live: Tathastu & Beyond',
    title: 'Zakir Khan Live: Tathastu & Beyond',
    venue: 'St. Andrew’s Auditorium, Bandra',
    showtime: 'Friday • 08:00 PM (Live Comedy Special)',
    category: 'comedy',
    genre: 'Stand-up Comedy • Storytelling • Hindi',
    duration: '1h 45m',
    rating: 9.4,
    votes: '220K fans',
    language: 'Hindi / English',
    format: 'Live Auditorium',
    posterUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80',
    synopsis: "The iconic 'Sakht Launda' returns with an all-new solo show full of hilarious childhood escapades, poignant reflections on adulthood, and unadulterated laughs.",
    cast: ['Zakir Khan'],
    director: 'Only Much Louder',
    basePrice: 380,
    venues: [
      { id: 'v_standrews', name: 'St. Andrew’s Auditorium', location: 'Bandra West', formats: ['Auditorium Sound'], features: ['Tiered Seating', 'Acoustic Treated'] },
      { id: 'v_ncpa', name: 'NCPA Tata Theatre', location: 'Nariman Point', formats: ['Stereo Sound'], features: ['Historic Hall', 'Grand Foyer'] }
    ],
    dates: ['Friday (26 Sep)', 'Saturday (27 Sep)'],
    showtimes: ['05:00 PM', '08:00 PM', '10:15 PM']
  }
];

export async function initDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load from disk if exists, otherwise create fresh
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded database from disk');
      createTables();
      seedInitialData();
      persistDb();
      return db;
    } catch (e) {
      console.warn('Failed to read existing db file, creating fresh in-memory db', e);
    }
  }

  db = new SQL.Database();
  createTables();
  seedInitialData();
  persistDb();
  return db;
}

function persistDb() {
  try {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

function createTables() {
  db.run(`
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
      FOREIGN KEY(event_id) REFERENCES events(id)
    );

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
      FOREIGN KEY(seat_id) REFERENCES seats(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(event_id) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatarColor TEXT NOT NULL
    );
  `);
}

function seedInitialData() {
  // Users for placement simulation (Alice, Bob, Charlie, Placement Evaluator)
  const defaultUsers: UserItem[] = [
    { id: 'usr_alice', name: 'Alice Walker', email: 'alice@district.internal', avatarColor: '#10B981' },
    { id: 'usr_bob', name: 'Bob Martinez', email: 'bob@bookmyshow.example', avatarColor: '#3B82F6' },
    { id: 'usr_charlie', name: 'Charlie Dave', email: 'charlie@evaluator.test', avatarColor: '#8B5CF6' },
    { id: 'usr_evaluator', name: 'Placement Reviewer', email: 'reviewer@techcorp.recruitment', avatarColor: '#F59E0B' }
  ];

  for (const user of defaultUsers) {
    db.run(
      `INSERT OR REPLACE INTO users (id, name, email, avatarColor) VALUES (?, ?, ?, ?)`,
      [user.id, user.name, user.email, user.avatarColor]
    );
  }

  // Seed all events
  for (const event of INITIAL_EVENTS) {
    db.run(
      `INSERT OR REPLACE INTO events (id, name, title, venue, showtime, category, genre, duration, rating, votes, language, format, posterUrl, backdropUrl, synopsis, basePrice, metadataJson)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.name,
        event.title || event.name,
        event.venue || null,
        event.showtime || null,
        event.category,
        event.genre || null,
        event.duration || null,
        event.rating || null,
        event.votes || null,
        event.language || null,
        event.format || null,
        event.posterUrl || null,
        event.backdropUrl || null,
        event.synopsis || null,
        event.basePrice,
        JSON.stringify({
          cast: event.cast || [],
          director: event.director || '',
          venues: event.venues || [],
          dates: event.dates || [],
          showtimes: event.showtimes || []
        })
      ]
    );

    // Generate 8 rows (A to H) of 10 seats each = 80 seats for this event
    // In India:
    // For Cinema ('movie'): Screen is in front. Rows closest to screen (A, B, C) are Executive tier (lowest price).
    // Middle rows (D, E) are Premium tier.
    // The last/rear rows (F, G, H) are VIP Recliners (highest price).
    // For Concerts ('concert') and live events: The VIP Fan Pit is at the FRONT (A, B) closest to the stage!
    // Middle rows (C, D, E) are Premium, and rear rows (F, G, H) are Executive / General Admission.
    const isCinema = event.category === 'movie';
    const rows = isCinema
      ? [
          { row: 'A', tier: 'EXECUTIVE', price: event.basePrice },
          { row: 'B', tier: 'EXECUTIVE', price: event.basePrice },
          { row: 'C', tier: 'EXECUTIVE', price: event.basePrice },
          { row: 'D', tier: 'PREMIUM', price: event.basePrice + 100 },
          { row: 'E', tier: 'PREMIUM', price: event.basePrice + 100 },
          { row: 'F', tier: 'VIP', price: event.basePrice + 250 },
          { row: 'G', tier: 'VIP', price: event.basePrice + 250 },
          { row: 'H', tier: 'VIP', price: event.basePrice + 250 },
        ]
      : [
          { row: 'A', tier: 'VIP', price: event.basePrice + 250 },
          { row: 'B', tier: 'VIP', price: event.basePrice + 250 },
          { row: 'C', tier: 'PREMIUM', price: event.basePrice + 100 },
          { row: 'D', tier: 'PREMIUM', price: event.basePrice + 100 },
          { row: 'E', tier: 'PREMIUM', price: event.basePrice + 100 },
          { row: 'F', tier: 'EXECUTIVE', price: event.basePrice },
          { row: 'G', tier: 'EXECUTIVE', price: event.basePrice },
          { row: 'H', tier: 'EXECUTIVE', price: event.basePrice },
        ];

    for (const r of rows) {
      for (let num = 1; num <= 10; num++) {
        const seatId = `${event.id}_${r.row}${num}`;

        // Seed a few pre-booked seats to show realistic hall occupancy
        const isPreBooked = (r.row === 'D' && (num === 4 || num === 5)) || (r.row === 'B' && num === 7);
        const status = isPreBooked ? 'booked' : 'available';

        db.run(
          `INSERT INTO seats (id, event_id, row, number, tier, price, status, held_by, hold_expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)
           ON CONFLICT(id) DO UPDATE SET tier = excluded.tier, price = excluded.price`,
          [seatId, event.id, r.row, num, r.tier, r.price, status]
        );

        if (isPreBooked) {
          db.run(
            `INSERT OR IGNORE INTO bookings (id, seat_id, user_id, event_id, created_at, event_name, venue, showtime, total_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [`bk_pre_${seatId}`, seatId, 'usr_alice', event.id, Date.now() - 3600000, event.name, event.venue || null, event.showtime || null, r.price]
          );
        }
      }
    }
  }
}

// -------------------------------------------------------------
// CORE RACE-CONDITION-SAFE ATOMIC OPERATIONS
// -------------------------------------------------------------

/**
 * ATOMIC CONDITIONAL UPDATE:
 * Two users must never be able to hold or book the same seat simultaneously.
 * We execute:
 * UPDATE seats SET status='hold', held_by=?, hold_expires_at=? WHERE id=? AND status='available';
 *
 * If rows modified === 1: this request won the hold.
 * If rows modified === 0: seat already taken or not available -> reject with 409 Conflict.
 */
export function holdSeatAtomic(
  seatId: string,
  userId: string,
  ttlMs: number = SEAT_HOLD_TTL_MS
): { success: boolean; seat?: SeatItem; reason?: string } {
  const expiresAt = Date.now() + ttlMs;

  // Single atomic write guard:
  const sql = `UPDATE seats 
               SET status = 'hold', held_by = ?, hold_expires_at = ?
               WHERE id = ? AND status = 'available';`;

  db.run(sql, [userId, expiresAt, seatId]);
  const rowsAffected = db.getRowsModified();

  if (rowsAffected === 1) {
    persistDb();
    const updatedSeat = getSeatById(seatId);
    return { success: true, seat: updatedSeat || undefined };
  } else {
    // 0 rows affected -> The seat was already held, booked, or non-existent
    const currentSeat = getSeatById(seatId);
    let reason = 'Seat is no longer available';
    if (!currentSeat) {
      reason = 'Seat does not exist';
    } else if (currentSeat.status === 'hold') {
      reason = 'Seat was just taken by another user';
    } else if (currentSeat.status === 'booked') {
      reason = 'Seat is already permanently booked';
    }
    return { success: false, reason };
  }
}

/**
 * Voluntary or programmatic release of a held seat
 */
export function releaseSeat(
  seatId: string,
  userId?: string
): { success: boolean; seat?: SeatItem; reason?: string } {
  let sql = `UPDATE seats 
             SET status = 'available', held_by = NULL, hold_expires_at = NULL
             WHERE id = ? AND status = 'hold'`;
  const params: (string | number)[] = [seatId];

  if (userId) {
    sql += ` AND held_by = ?`;
    params.push(userId);
  }

  db.run(sql, params);
  const rows = db.getRowsModified();
  if (rows > 0) {
    persistDb();
    const seat = getSeatById(seatId);
    return { success: true, seat: seat || undefined };
  }
  return { success: false, reason: 'Seat was not held by this user or already released' };
}

/**
 * Background cleaner: Automatically releases expired holds
 * Returns array of released seats so server can broadcast WebSocket updates
 */
export function releaseExpiredHolds(): SeatItem[] {
  const now = Date.now();
  
  // Find expired holds first
  const stmt = db.prepare(`SELECT * FROM seats WHERE status = 'hold' AND hold_expires_at <= ?`);
  stmt.bind([now]);
  const expired: SeatItem[] = [];
  while (stmt.step()) {
    expired.push(stmt.getAsObject() as unknown as SeatItem);
  }
  stmt.free();

  if (expired.length > 0) {
    db.run(`UPDATE seats 
            SET status = 'available', held_by = NULL, hold_expires_at = NULL
            WHERE status = 'hold' AND hold_expires_at <= ?`, [now]);
    persistDb();
  }

  return expired;
}

/**
 * Simulated payment confirmation:
 * Converts active hold to permanent booking atomically inside a transaction.
 */
export function completeBooking(
  seatId: string,
  userId: string
): { success: boolean; booking?: BookingItem; seat?: SeatItem; reason?: string } {
  const now = Date.now();

  try {
    db.run('BEGIN TRANSACTION;');

    // Guarded write: must be in 'hold' status held by this exact user and NOT expired
    const updateSql = `UPDATE seats 
                       SET status = 'booked', held_by = NULL, hold_expires_at = NULL
                       WHERE id = ? AND status = 'hold' AND held_by = ? AND hold_expires_at > ?;`;
    db.run(updateSql, [seatId, userId, now]);
    const rows = db.getRowsModified();

    if (rows !== 1) {
      db.run('ROLLBACK;');
      return { success: false, reason: 'Hold expired or seat is not held by user' };
    }

    const currentSeat = getSeatById(seatId);
    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventId = currentSeat?.event_id || 'evt_interstellar_imax';
    const event = getEventById(eventId);

    db.run(
      `INSERT INTO bookings (id, seat_id, user_id, event_id, created_at, event_name, venue, showtime, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, seatId, userId, eventId, now, event?.name || 'Cinema Event', event?.venue || '', event?.showtime || '', currentSeat?.price || 450]
    );

    db.run('COMMIT;');
    persistDb();

    return {
      success: true,
      booking: {
        id: bookingId,
        seat_id: seatId,
        user_id: userId,
        event_id: eventId,
        created_at: now,
        seat_label: currentSeat ? `${currentSeat.row}${currentSeat.number}` : seatId,
        amount: currentSeat?.price || 450,
        event_name: event?.name,
        venue: event?.venue,
        showtime: event?.showtime,
      },
      seat: currentSeat || undefined
    };
  } catch (err: any) {
    try { db.run('ROLLBACK;'); } catch (_) {}
    return { success: false, reason: err?.message || 'Transaction failed' };
  }
}

/**
 * Complete order with multiple seats + meals
 */
export function completeMultiSeatOrder(params: {
  seatIds: string[];
  userId: string;
  eventId: string;
  venueName?: string;
  showtime?: string;
  meals?: SelectedMeal[];
  totalAmount?: number;
}): { success: boolean; bookingIds: string[]; bookedSeats: SeatItem[]; reason?: string } {
  const { seatIds, userId, eventId, venueName, showtime, meals, totalAmount } = params;
  const now = Date.now();
  const event = getEventById(eventId);
  const bookedSeats: SeatItem[] = [];
  const bookingIds: string[] = [];

  const mealsSummary = (meals || [])
    .filter(m => m.quantity > 0)
    .map(m => `${m.quantity}x ${m.meal.name}`)
    .join(', ');

  try {
    db.run('BEGIN TRANSACTION;');

    for (const seatId of seatIds) {
      // Guarded write for each seat
      const updateSql = `UPDATE seats 
                         SET status = 'booked', held_by = NULL, hold_expires_at = NULL
                         WHERE id = ? AND status = 'hold' AND held_by = ? AND hold_expires_at > ?;`;
      db.run(updateSql, [seatId, userId, now]);
      const rows = db.getRowsModified();

      if (rows !== 1) {
        db.run('ROLLBACK;');
        return { success: false, bookingIds: [], bookedSeats: [], reason: `Seat ${seatId} hold expired or was taken` };
      }

      const currentSeat = getSeatById(seatId);
      if (currentSeat) bookedSeats.push(currentSeat);

      const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      bookingIds.push(bookingId);

      db.run(
        `INSERT INTO bookings (id, seat_id, user_id, event_id, created_at, event_name, venue, showtime, meals_summary, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingId,
          seatId,
          userId,
          eventId,
          now,
          event?.name || 'Cinema Ticket',
          venueName || event?.venue || '',
          showtime || event?.showtime || '',
          mealsSummary || null,
          totalAmount || currentSeat?.price || 450
        ]
      );
    }

    db.run('COMMIT;');
    persistDb();

    return { success: true, bookingIds, bookedSeats };
  } catch (err: any) {
    try { db.run('ROLLBACK;'); } catch (_) {}
    return { success: false, bookingIds: [], bookedSeats: [], reason: err?.message || 'Transaction failed' };
  }
}

/**
 * Reset seat map for an event (Testing & live playground helper)
 */
export function resetSeatMap(eventId: string = 'evt_interstellar_imax') {
  db.run(`UPDATE seats SET status = 'available', held_by = NULL, hold_expires_at = NULL WHERE event_id = ?`, [eventId]);
  // Reset demo bookings for this event
  db.run(`DELETE FROM bookings WHERE event_id = ? AND id NOT LIKE 'bk_pre_%'`, [eventId]);
  persistDb();
}

export function getAllEvents(): EventItem[] {
  const stmt = db.prepare(`SELECT * FROM events ORDER BY id ASC`);
  const events: EventItem[] = [];
  while (stmt.step()) {
    const raw = stmt.getAsObject() as any;
    let meta: any = {};
    try {
      if (raw.metadataJson) meta = JSON.parse(raw.metadataJson);
    } catch (_) {}
    events.push({
      id: raw.id,
      name: raw.name,
      title: raw.title || raw.name,
      venue: raw.venue,
      showtime: raw.showtime,
      category: raw.category,
      genre: raw.genre,
      duration: raw.duration,
      rating: raw.rating,
      votes: raw.votes,
      language: raw.language,
      format: raw.format,
      posterUrl: raw.posterUrl,
      backdropUrl: raw.backdropUrl,
      synopsis: raw.synopsis,
      basePrice: raw.basePrice,
      cast: meta.cast || [],
      director: meta.director || '',
      venues: meta.venues || [],
      dates: meta.dates || [],
      showtimes: meta.showtimes || []
    });
  }
  stmt.free();
  return events;
}

export function getAllSeats(eventId: string = 'evt_interstellar_imax'): SeatItem[] {
  // Release any expired seats before reading
  releaseExpiredHolds();

  const stmt = db.prepare(`SELECT * FROM seats WHERE event_id = ? ORDER BY row ASC, number ASC`);
  stmt.bind([eventId]);
  const seats: SeatItem[] = [];
  while (stmt.step()) {
    seats.push(stmt.getAsObject() as unknown as SeatItem);
  }
  stmt.free();
  return seats;
}

export function getAvailableSeats(eventId: string = 'evt_interstellar_imax'): SeatItem[] {
  releaseExpiredHolds();

  const stmt = db.prepare(`SELECT * FROM seats WHERE event_id = ? AND status = 'available' ORDER BY row ASC, number ASC`);
  stmt.bind([eventId]);
  const seats: SeatItem[] = [];
  while (stmt.step()) {
    seats.push(stmt.getAsObject() as unknown as SeatItem);
  }
  stmt.free();
  return seats;
}

export function getSeatById(seatId: string): SeatItem | null {
  const stmt = db.prepare(`SELECT * FROM seats WHERE id = ?`);
  stmt.bind([seatId]);
  if (stmt.step()) {
    const seat = stmt.getAsObject() as unknown as SeatItem;
    stmt.free();
    return seat;
  }
  stmt.free();
  return null;
}

export function getEventById(eventId: string): EventItem | null {
  const stmt = db.prepare(`SELECT * FROM events WHERE id = ?`);
  stmt.bind([eventId]);
  if (stmt.step()) {
    const raw = stmt.getAsObject() as any;
    let meta: any = {};
    try {
      if (raw.metadataJson) meta = JSON.parse(raw.metadataJson);
    } catch (_) {}
    stmt.free();
    return {
      id: raw.id,
      name: raw.name,
      title: raw.title || raw.name,
      venue: raw.venue,
      showtime: raw.showtime,
      category: raw.category,
      genre: raw.genre,
      duration: raw.duration,
      rating: raw.rating,
      votes: raw.votes,
      language: raw.language,
      format: raw.format,
      posterUrl: raw.posterUrl,
      backdropUrl: raw.backdropUrl,
      synopsis: raw.synopsis,
      basePrice: raw.basePrice,
      cast: meta.cast || [],
      director: meta.director || '',
      venues: meta.venues || [],
      dates: meta.dates || [],
      showtimes: meta.showtimes || []
    };
  }
  stmt.free();
  return null;
}

export function getAllUsers(): UserItem[] {
  const stmt = db.prepare(`SELECT * FROM users`);
  const users: UserItem[] = [];
  while (stmt.step()) {
    users.push(stmt.getAsObject() as unknown as UserItem);
  }
  stmt.free();
  return users;
}

export function createOrUpdateUser(user: { id?: string; name: string; email: string; avatarColor?: string }): UserItem {
  const existingStmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
  existingStmt.bind([user.email]);
  if (existingStmt.step()) {
    const existing = existingStmt.getAsObject() as unknown as UserItem;
    existingStmt.free();
    return existing;
  }
  existingStmt.free();

  const id = user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const colors = ['#E11D48', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4'];
  const avatarColor = user.avatarColor || colors[Math.floor(Math.random() * colors.length)];

  db.run(
    `INSERT INTO users (id, name, email, avatarColor) VALUES (?, ?, ?, ?)`,
    [id, user.name, user.email, avatarColor]
  );
  persistDb();

  return { id, name: user.name, email: user.email, avatarColor };
}

export function getAllBookings(eventId?: string, userId?: string): BookingItem[] {
  let query = `SELECT b.*, s.row, s.number, s.price as amount 
               FROM bookings b 
               JOIN seats s ON b.seat_id = s.id`;
  const conditions: string[] = [];
  const params: string[] = [];
  
  if (eventId) {
    conditions.push(`b.event_id = ?`);
    params.push(eventId);
  }
  if (userId) {
    conditions.push(`b.user_id = ?`);
    params.push(userId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }
  query += ` ORDER BY b.created_at DESC`;

  const stmt = db.prepare(query);
  if (params.length > 0) stmt.bind(params);
  const bookings: BookingItem[] = [];
  while (stmt.step()) {
    const obj = stmt.getAsObject() as any;
    bookings.push({
      id: obj.id,
      seat_id: obj.seat_id,
      user_id: obj.user_id,
      event_id: obj.event_id,
      created_at: obj.created_at,
      seat_label: `${obj.row}${obj.number}`,
      amount: obj.amount,
      event_name: obj.event_name,
      venue: obj.venue,
      showtime: obj.showtime,
      meals_summary: obj.meals_summary,
      total_amount: obj.total_amount
    });
  }
  stmt.free();
  return bookings;
}
