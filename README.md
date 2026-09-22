# 🎟️ CinePulse / District — Real-Time Seat Booking Engine
<div align="center">

![CI Concurrency Verification](https://github.com/Sharyash0955/your-entertainment/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

### **Languages & Core Technologies**
[![My Skills](https://skillicons.dev/icons?i=ts,react,nodejs,express,tailwind,py,docker,sqlite,bash,html,css)](https://skillicons.dev)

*A production-grade cinema & live event ticketing system with race-condition-safe atomic database locking, real-time Socket.IO synchronization, and Gemini AI seat recommendations.*

</div>

---

## 1. The Core Engineering Challenge: Race Condition Handling

### The Flawed Anti-Pattern (Read-Then-Write)
In standard naive web applications, seat booking is often implemented as:
```javascript
// ❌ BROKEN: Two requests entering at the same millisecond both read 'available'
const seat = await db.query("SELECT status FROM seats WHERE id = ?", [seatId]);
if (seat.status === 'available') {
  await db.query("UPDATE seats SET status = 'hold', held_by = ? WHERE id = ?", [userId, seatId]);
  return res.status(200).json({ success: true });
}
return res.status(409).json({ error: "Seat taken" });
```
Under 50 concurrent requests, multiple threads/coroutines read `status === 'available'` before any write finishes. Both proceed to write, resulting in **double-allocated seats** and disastrous revenue/customer conflict.

### The Production Solution: Guarded Atomic Database Write
We eliminate the read step entirely. The write operation itself serves as the atomic serialization barrier:

```sql
UPDATE seats
SET status = 'hold',
    held_by = ?,
    hold_expires_at = ?
WHERE id = ? AND status = 'available';
```

#### Why This Works:
1. **Row-Level Serialization**: Relational databases (PostgreSQL/SQLite) acquire an exclusive row lock during an `UPDATE`. Concurrent update requests are strictly serialized by the database engine.
2. **Atomic Predicate Evaluation**: The `WHERE status = 'available'` check happens inside the database engine at the exact instant the lock is acquired.
3. **Deterministic Row Count**:
   - **`rows_affected === 1`**: The request matched the condition, updated the row, and won the seat.
   - **`rows_affected === 0`**: The seat was already changed away from `'available'` by the winning thread. The request is immediately rejected with **HTTP 409 Conflict ("seat just taken")**.

---

## 2. Seat State Machine

Every seat has strictly one status at any instant:
```
                ┌──────────────┐
                │  AVAILABLE   │◄─────────────────────────────┐
                └──────┬───────┘                              │
                       │ User clicks seat                     │
                       │ (Atomic guarded UPDATE)              │
                       ▼                                      │
                ┌──────────────┐                              │
                │     HOLD     │─[ Payment fails / cancelled ]┤
                └──────┬───────┘─[ 5-minute TTL expires ]─────┘
                       │
                       │ Payment simulation succeeds (~90%)
                       ▼
                ┌──────────────┐
                │    BOOKED    │ (Terminal state, never released)
                └──────────────┘
```

- **AVAILABLE ➔ HOLD**: User selects a seat. A 5-minute TTL (`hold_expires_at`) is set.
- **HOLD ➔ BOOKED**: Payment succeeds. Row status flips to `'booked'` in a database transaction and a booking record is logged.
- **HOLD ➔ AVAILABLE**: Triggered if:
  1. The user manually cancels / releases the hold.
  2. The 5-minute TTL expires (swept automatically by background cleaner every 3 seconds).
  3. Simulated payment fails or declines.
- **BOOKED**: Terminal state. Cannot be held or booked again.

---

## 3. Tech Stack

- **Frontend**: React 19 + TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Node.js + Express.
- **Database**: SQLite with `sql.js` (WebAssembly/Pure JS for zero-native build overhead), supporting ACID transactions and conditional atomic writes.
- **Real-Time Sync**: Socket.IO with event rooms (`event_{eventId}`) broadcasting `seat_held`, `seat_released`, and `seat_booked`.
- **AI**: Gemini 3 (`@google/genai` with `gemini-3.8-flash`) for natural-language seat suggestions with rule-based heuristic fallback.

---

## 4. How to Run the Concurrency Load Test

### Option A: TypeScript Concurrency Runner
```bash
npm run test:concurrency
```

### Option B: Python ThreadPool Concurrency Runner
```bash
# Using npm script:
npm run test:concurrency:py

# Or directly using Python:
python3 scripts/test-concurrency.py
```

### Option C: Instant Zero-Config Setup
```bash
./setup.sh
```

### Option D: Docker Container Build & Run
```bash
docker build -t cinepulse-seat-booking .
docker run -p 3000:3000 cinepulse-seat-booking
```

### Expected Test Output:
```
======================================================================
⚡ STARTING 50 CONCURRENT SEAT HOLD RACE CONDITION TEST
Target URL: http://localhost:3000/api/seats/evt_interstellar_imax_B5/hold
Target Seat: Seat B5 (evt_interstellar_imax_B5)
Concurrent Workers: 50
======================================================================

[Phase 1] Resetting target seat state to AVAILABLE...
Current seat status before firing: "available"

[Phase 2] Firing 50 simultaneous POST requests at the exact same millisecond...

[Phase 3] Concurrency Execution Audit Log:
----------------------------------------------------------------------
 Request # 1 | User: concurrent_tester_1_ab32 | ✅ WINNER (200 OK) in 4ms
 Request # 2 | User: concurrent_tester_2_9f81 | ❌ CONFLICT (409) in 4ms
 Request # 3 | User: concurrent_tester_3_12e4 | ❌ CONFLICT (409) in 5ms
 ... and 47 more requests rejected with 409 Conflict
----------------------------------------------------------------------

📊 SUMMARY STATS:
  Total Requests Dispatched: 50
  Successful Holds (200 OK): 1
  Conflicts (409 Conflict):  49
  Unexpected Errors:         0
  Total Execution Time:      12ms

🏆 Winning User: concurrent_tester_1_ab32 (Acquired lock in 4ms)

🔬 VERIFICATION & ASSERTIONS:
✅ TEST PASSED: EXACTLY ONE WINNER!
   The atomic SQL conditional write successfully guarded against race conditions.
   Zero duplicate bookings occurred under high concurrency.
```

### In-App Visual Concurrency Inspector
The web application also features a built-in **"Concurrency Load Tester"** panel where evaluators can click **"Fire 50 Concurrent Requests"** directly in the browser and see the live waterfall log, winner highlight, and live seat map color update in real-time across tabs!

---

## 5. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/seats?eventId=...` | Returns all seats with current live status |
| `POST` | `/api/seats/:id/hold` | Atomically places a hold (`userId`, `eventId`). Returns `200` or `409 Conflict` |
| `POST` | `/api/seats/:id/release` | Voluntarily releases a hold |
| `POST` | `/api/payment/simulate` | Simulates payment (`?force=success` or `?force=fail`). Moves hold ➔ booked or releases |
| `POST` | `/api/ai/suggest` | Natural language seat recommendation via Gemini with rule fallback |
| `POST` | `/api/test/concurrency` | In-app 50-worker race condition benchmark |
| `POST` | `/api/admin/reset` | Resets the seat map for fresh demonstrations |
