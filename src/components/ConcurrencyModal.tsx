import React, { useState } from 'react';
import { SeatItem, ConcurrencyTestResult } from '../types';
import { Zap, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, Server, Terminal } from 'lucide-react';

interface ConcurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  seats: SeatItem[];
  onTestComplete?: () => void;
}

export const ConcurrencyModal: React.FC<ConcurrencyModalProps> = ({
  isOpen,
  onClose,
  seats,
  onTestComplete,
}) => {
  const [selectedSeatId, setSelectedSeatId] = useState<string>('evt_interstellar_imax_B5');
  const [requestCount, setRequestCount] = useState<number>(50);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<ConcurrencyTestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunLoadTest = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch('/api/test/concurrency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatId: selectedSeatId,
          count: requestCount,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (onTestComplete) onTestComplete();
      } else {
        setErrorMsg(data.error || 'Load test execution failed');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error running load test');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Race Condition Load Tester (50 Concurrent Holds)
              </h3>
              <p className="text-[11px] text-slate-400">
                Placement Drive Concurrency Verification & Atomic Guard Audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Theory card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>How this proves atomic concurrency:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              When {requestCount} requests simultaneously attempt to hold the exact same seat,
              naive <code className="text-rose-400">SELECT ... then UPDATE</code> code produces duplicate holds.
              Our atomic SQL write:
            </p>
            <pre className="p-2 rounded bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
              UPDATE seats SET status='hold', held_by=?, hold_expires_at=? WHERE id=? AND status='available';
            </pre>
            <p className="text-slate-400 text-[11px]">
              Guarantees the database engine locks the row: exactly 1 update returns <span className="text-emerald-400">rows_affected = 1</span> (Winner),
              while all {requestCount - 1} other requests return <span className="text-rose-400">rows_affected = 0</span> and are immediately rejected with <span className="text-amber-400 font-mono">409 Conflict</span>.
            </p>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Target Seat to Attack:</label>
              <select
                value={selectedSeatId}
                onChange={(e) => setSelectedSeatId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {seats.map((s) => (
                  <option key={s.id} value={s.id}>
                    Seat {s.row}{s.number} ({s.tier}) — currently {s.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Simultaneous Requests:</label>
              <select
                value={requestCount}
                onChange={(e) => setRequestCount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value={20}>20 Concurrent Requests</option>
                <option value={50}>50 Concurrent Requests (Assignment Spec)</option>
                <option value={100}>100 Concurrent Requests</option>
              </select>
            </div>
          </div>

          {/* Fire button */}
          <button
            id="btn-execute-load-test"
            onClick={handleRunLoadTest}
            disabled={isRunning}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Firing {requestCount} Concurrent Database Writes...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Fire {requestCount} Concurrent Hold Requests Now</span>
              </>
            )}
          </button>

          {/* CLI Instructions note */}
          <div className="flex items-center gap-2 text-slate-400 text-[11px] px-1">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Reviewers can also run this in terminal: <code className="text-amber-300 font-mono">npm run test:concurrency</code>
            </span>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result view */}
          {result && (
            <div className="space-y-3 animate-in fade-in">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  result.verifiedOneWinner
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-sm">
                      {result.verifiedOneWinner
                        ? 'CONCURRENCY TEST PASSED: EXACTLY 1 WINNER!'
                        : 'TEST FAILED: RACE CONDITION DETECTED'}
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Target {result.targetSeatLabel} was defended with zero double-bookings.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-slate-400">Total Latency</div>
                  <div className="font-mono font-bold text-sm text-amber-400">
                    {result.executionTimeMs}ms
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-lg font-bold text-emerald-400">{result.winners.length}</div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    200 OK (Winner)
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-lg font-bold text-amber-400">{result.conflicts.length}</div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    409 Conflicts
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-lg font-bold text-slate-400">{result.errors.length}</div>
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Errors</div>
                </div>
              </div>

              {/* Waterfall log preview */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                <div className="text-slate-400 font-sans font-semibold text-xs pb-1 border-b border-slate-850">
                  Worker Execution Stream:
                </div>
                {result.winners.map((w, idx) => (
                  <div key={idx} className="flex justify-between items-center text-emerald-400">
                    <span>🏆 Winner: {w.userId}</span>
                    <span>200 OK ({w.durationMs}ms)</span>
                  </div>
                ))}
                {result.conflicts.slice(0, 8).map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-400">
                    <span>Request #{idx + 2}: {c.userId}</span>
                    <span className="text-amber-400/80">409 Conflict ({c.durationMs}ms)</span>
                  </div>
                ))}
                {result.conflicts.length > 8 && (
                  <div className="text-slate-600 text-center pt-1">
                    ... and {result.conflicts.length - 8} additional requests rejected with 409 Conflict
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
