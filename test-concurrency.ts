/**
 * Concurrency Load Test Script
 *
 * Requirements:
 * Fires 50 concurrent hold requests at the same seat ID and asserts that exactly ONE succeeds
 * with HTTP 200, and all other 49 are rejected with HTTP 409 Conflict ("seat just taken").
 *
 * Run with:
 *   npm run test:concurrency
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TARGET_SEAT_ID = 'evt_interstellar_imax_B5'; // Target Seat B5
const CONCURRENT_REQUESTS = 50;

interface ResultItem {
  index: number;
  userId: string;
  status: number;
  data: any;
  durationMs: number;
}

async function runConcurrencyTest() {
  console.log('='.repeat(70));
  console.log('⚡ STARTING 50 CONCURRENT SEAT HOLD RACE CONDITION TEST');
  console.log(`Target URL: ${BASE_URL}/api/seats/${TARGET_SEAT_ID}/hold`);
  console.log(`Target Seat: Seat B5 (${TARGET_SEAT_ID})`);
  console.log(`Concurrent Workers: ${CONCURRENT_REQUESTS}`);
  console.log('='.repeat(70));

  // Step 1: Ensure the seat is in AVAILABLE state
  console.log('\n[Phase 1] Resetting target seat state to AVAILABLE...');
  try {
    await fetch(`${BASE_URL}/api/seats/${TARGET_SEAT_ID}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'setup_cleanup' }),
    });
  } catch (_) {
    // Ignore if not previously held
  }

  // Verify seat is available
  const seatCheckRes = await fetch(`${BASE_URL}/api/seats`);
  const allSeats = await seatCheckRes.json();
  const targetSeat = allSeats.find((s: any) => s.id === TARGET_SEAT_ID);
  console.log(`Current seat status before firing: "${targetSeat?.status}"`);

  // Step 2: Fire 50 simultaneous hold requests using Promise.all
  console.log(`\n[Phase 2] Firing ${CONCURRENT_REQUESTS} simultaneous POST requests at the exact same millisecond...`);
  const startTime = Date.now();

  const promises = Array.from({ length: CONCURRENT_REQUESTS }, async (_, i) => {
    const userId = `concurrent_tester_${i + 1}_${Math.random().toString(36).substring(2, 6)}`;
    const reqStart = Date.now();
    try {
      const response = await fetch(`${BASE_URL}/api/seats/${TARGET_SEAT_ID}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventId: 'evt_interstellar_imax',
        }),
      });

      const data = await response.json();
      const durationMs = Date.now() - reqStart;
      return {
        index: i + 1,
        userId,
        status: response.status,
        data,
        durationMs,
      } as ResultItem;
    } catch (err: any) {
      return {
        index: i + 1,
        userId,
        status: 500,
        data: { error: err.message },
        durationMs: Date.now() - reqStart,
      } as ResultItem;
    }
  });

  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;

  // Step 3: Analyze results
  const winners = results.filter((r) => r.status === 200);
  const conflicts = results.filter((r) => r.status === 409);
  const errors = results.filter((r) => r.status !== 200 && r.status !== 409);

  console.log('\n[Phase 3] Concurrency Execution Audit Log:');
  console.log('-'.repeat(70));
  for (const r of results.slice(0, 10)) {
    const mark = r.status === 200 ? '✅ WINNER (200 OK)' : '❌ CONFLICT (409)';
    console.log(` Request #${String(r.index).padStart(2, ' ')} | User: ${r.userId} | ${mark} in ${r.durationMs}ms`);
  }
  if (results.length > 10) {
    console.log(` ... and ${results.length - 10} more requests rejected with 409 Conflict`);
  }
  console.log('-'.repeat(70));

  console.log('\n📊 SUMMARY STATS:');
  console.log(`  Total Requests Dispatched: ${CONCURRENT_REQUESTS}`);
  console.log(`  Successful Holds (200 OK): ${winners.length}`);
  console.log(`  Conflicts (409 Conflict):  ${conflicts.length}`);
  console.log(`  Unexpected Errors:         ${errors.length}`);
  console.log(`  Total Execution Time:      ${totalDuration}ms`);

  if (winners.length > 0) {
    console.log(`\n🏆 Winning User: ${winners[0].userId} (Acquired lock in ${winners[0].durationMs}ms)`);
  }

  // Step 4: Strict Placement Criteria Assertion
  console.log('\n🔬 VERIFICATION & ASSERTIONS:');
  if (winners.length === 1 && conflicts.length === CONCURRENT_REQUESTS - 1 && errors.length === 0) {
    console.log('✅ TEST PASSED: EXACTLY ONE WINNER!');
    console.log('   The atomic SQL conditional write successfully guarded against race conditions.');
    console.log('   Zero duplicate bookings occurred under high concurrency.');
    process.exit(0);
  } else {
    console.error('❌ TEST FAILED: Concurrency violation detected!');
    console.error(`   Expected 1 winner and ${CONCURRENT_REQUESTS - 1} conflicts, but got:`);
    console.error(`   Winners: ${winners.length}, Conflicts: ${conflicts.length}, Errors: ${errors.length}`);
    process.exit(1);
  }
}

runConcurrencyTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
