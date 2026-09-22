#!/usr/bin/env python3
"""
==============================================================================
Concurrency Load Test Script (Python Port)
==============================================================================

Fires 50 concurrent seat hold requests at the exact same seat ID and asserts
that exactly ONE request succeeds with HTTP 200, while all other 49 requests
are rejected with HTTP 409 Conflict ("Seat already held or booked").

Matches the behavior of test-concurrency.ts.

Usage:
    python3 scripts/test-concurrency.py [BASE_URL] [TARGET_SEAT_ID]
Or with environment variables:
    TEST_URL=http://localhost:3000 TEST_SEAT_ID=evt_interstellar_imax_B5 python3 scripts/test-concurrency.py
"""

import sys
import os
import time
import json
import random
import string
from concurrent.futures import ThreadPoolExecutor, as_completed

# Prefer the `requests` library as requested, with standard library fallback if missing
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    import urllib.request
    import urllib.error

# Resolve Configuration
BASE_URL = os.environ.get('TEST_URL')
if not BASE_URL:
    if len(sys.argv) > 1 and not sys.argv[1].startswith('-'):
        BASE_URL = sys.argv[1]
    else:
        BASE_URL = 'http://localhost:3000'

TARGET_SEAT_ID = os.environ.get('TEST_SEAT_ID')
if not TARGET_SEAT_ID:
    if len(sys.argv) > 2:
        TARGET_SEAT_ID = sys.argv[2]
    else:
        TARGET_SEAT_ID = 'evt_interstellar_imax_B5'

CONCURRENT_REQUESTS = 50


def http_post(url: str, payload: dict) -> tuple[int, dict, float]:
    """Execute a POST request and return (status_code, response_json, duration_ms)."""
    start_time = time.perf_counter()
    duration_ms = 0.0

    if HAS_REQUESTS:
        try:
            resp = requests.post(url, json=payload, timeout=10)
            duration_ms = (time.perf_counter() - start_time) * 1000
            try:
                data = resp.json()
            except Exception:
                data = {'raw': resp.text}
            return resp.status_code, data, duration_ms
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            return 500, {'error': str(e)}, duration_ms
    else:
        # Standard library urllib fallback
        data_bytes = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                duration_ms = (time.perf_counter() - start_time) * 1000
                res_body = response.read().decode('utf-8')
                return response.status, json.loads(res_body), duration_ms
        except urllib.error.HTTPError as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            res_body = e.read().decode('utf-8')
            try:
                data = json.loads(res_body)
            except Exception:
                data = {'error': res_body}
            return e.code, data, duration_ms
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            return 500, {'error': str(e)}, duration_ms


def http_get(url: str) -> tuple[int, any]:
    """Execute a GET request and return (status_code, parsed_json)."""
    if HAS_REQUESTS:
        try:
            resp = requests.get(url, timeout=10)
            return resp.status_code, resp.json()
        except Exception as e:
            return 500, {'error': str(e)}
    else:
        try:
            req = urllib.request.Request(url, headers={'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=10) as response:
                return response.status, json.loads(response.read().decode('utf-8'))
        except Exception as e:
            return 500, {'error': str(e)}


def random_suffix(length: int = 4) -> str:
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def run_concurrency_test():
    print('=' * 70)
    print(f'⚡ STARTING {CONCURRENT_REQUESTS} CONCURRENT SEAT HOLD RACE CONDITION TEST (Python)')
    print(f'Target URL:          {BASE_URL}/api/seats/{TARGET_SEAT_ID}/hold')
    print(f'Target Seat ID:      {TARGET_SEAT_ID}')
    print(f'Concurrent Workers:  {CONCURRENT_REQUESTS}')
    print(f'HTTP Library:        {"requests" if HAS_REQUESTS else "urllib (standard library fallback)"}')
    print('=' * 70)

    # -------------------------------------------------------------------------
    # Phase 1: Reset seat to available state
    # -------------------------------------------------------------------------
    print('\n[Phase 1] Resetting target seat state to AVAILABLE...')
    http_post(
        f'{BASE_URL}/api/seats/{TARGET_SEAT_ID}/release',
        {}
    )

    _, all_seats = http_get(f'{BASE_URL}/api/seats')
    target_seat = None
    if isinstance(all_seats, list):
        target_seat = next((s for s in all_seats if s.get('id') == TARGET_SEAT_ID), None)

    status_before = target_seat.get('status') if target_seat else 'unknown'
    print(f'Current seat status before firing: "{status_before}"')

    # -------------------------------------------------------------------------
    # Phase 2: Dispatch 50 concurrent requests via ThreadPoolExecutor
    # -------------------------------------------------------------------------
    print(f'\n[Phase 2] Firing {CONCURRENT_REQUESTS} simultaneous POST requests at the exact same millisecond...')
    start_total_time = time.perf_counter()

    results = []

    def send_worker_hold(index: int) -> dict:
        user_id = f'py_concurrent_tester_{index}_{random_suffix()}'
        hold_url = f'{BASE_URL}/api/seats/{TARGET_SEAT_ID}/hold'
        payload = {
            'userId': user_id,
            'eventId': 'evt_interstellar_imax',
        }
        status_code, data, duration_ms = http_post(hold_url, payload)
        return {
            'index': index,
            'user_id': user_id,
            'status': status_code,
            'data': data,
            'duration_ms': round(duration_ms, 2),
        }

    with ThreadPoolExecutor(max_workers=CONCURRENT_REQUESTS) as executor:
        future_to_index = {
            executor.submit(send_worker_hold, i + 1): i + 1
            for i in range(CONCURRENT_REQUESTS)
        }
        for future in as_completed(future_to_index):
            results.append(future.result())

    total_time_ms = round((time.perf_counter() - start_total_time) * 1000, 2)
    results.sort(key=lambda r: r['index'])

    # -------------------------------------------------------------------------
    # Phase 3: Audit log and statistics
    # -------------------------------------------------------------------------
    winners = [r for r in results if r['status'] == 200]
    conflicts = [r for r in results if r['status'] == 409]
    errors = [r for r in results if r['status'] not in (200, 409)]

    print('\n[Phase 3] Concurrency Execution Audit Log:')
    print('-' * 70)
    for r in results[:10]:
        mark = '✅ WINNER (200 OK)' if r['status'] == 200 else '❌ CONFLICT (409)'
        print(f" Request #{str(r['index']).rjust(2)} | User: {r['user_id']} | {mark} in {r['duration_ms']}ms")

    if len(results) > 10:
        print(f' ... and {len(results) - 10} more requests rejected with 409 Conflict')
    print('-' * 70)

    print('\n📊 SUMMARY STATS:')
    print(f'  Total Requests Dispatched: {CONCURRENT_REQUESTS}')
    print(f'  Successful Holds (200 OK): {len(winners)}')
    print(f'  Conflicts (409 Conflict):  {len(conflicts)}')
    print(f'  Unexpected Errors:         {len(errors)}')
    print(f'  Total Execution Time:      {total_time_ms}ms')

    if winners:
        winner = winners[0]
        print(f"\n🏆 Winning User: {winner['user_id']} (Acquired lock in {winner['duration_ms']}ms)")

    # -------------------------------------------------------------------------
    # Phase 4: Strict Assertion
    # -------------------------------------------------------------------------
    print('\n🔬 VERIFICATION & ASSERTIONS:')
    assert len(winners) == 1, (
        f"FAILED: Expected exactly 1 winner, but found {len(winners)}."
    )
    assert len(conflicts) == CONCURRENT_REQUESTS - 1, (
        f"FAILED: Expected {CONCURRENT_REQUESTS - 1} conflicts, but found {len(conflicts)}."
    )
    assert len(errors) == 0, (
        f"FAILED: Encountered unexpected errors: {errors}"
    )

    print('✅ TEST PASSED: EXACTLY ONE WINNER!')
    print('   The atomic SQL conditional write successfully guarded against race conditions.')
    print('   Zero duplicate bookings occurred under high concurrency.')
    sys.exit(0)


if __name__ == '__main__':
    try:
        run_concurrency_test()
    except AssertionError as ae:
        print(f'❌ TEST FAILED: {ae}', file=sys.stderr)
        sys.exit(1)
    except Exception as ex:
        print(f'❌ UNHANDLED EXCEPTION: {ex}', file=sys.stderr)
        sys.exit(1)
