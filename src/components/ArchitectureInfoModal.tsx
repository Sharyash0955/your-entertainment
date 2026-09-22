import React from 'react';
import { ShieldAlert, CheckCircle, Database, Radio, Cpu, Lock } from 'lucide-react';

interface ArchitectureInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureInfoModal: React.FC<ArchitectureInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Architecture & Concurrency Control Spec
              </h3>
              <p className="text-[11px] text-slate-400">
                Company Placement Technical Design Blueprint
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

        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Section 1: The Race Condition Problem */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              1. The Flawed Anti-Pattern: Read-Then-Write
            </h4>
            <p className="leading-relaxed">
              When two users click the same seat within milliseconds of each other, naive code performs:
            </p>
            <div className="p-3 bg-slate-950 border border-rose-900/50 rounded-xl font-mono text-[11px] text-rose-300">
              {`// ❌ BROKEN: Read-then-write creates a race window
const seat = await db.get("SELECT status FROM seats WHERE id = ?", [id]);
if (seat.status === 'available') {
  // BOTH concurrent threads enter here!
  await db.run("UPDATE seats SET status = 'hold' WHERE id = ?", [id]);
}`}
            </div>
            <p className="text-slate-400 text-[11px]">
              Because the read and write are disjointed steps, both threads see <code className="text-amber-300">'available'</code> and both write, causing a catastrophic double-allocation.
            </p>
          </div>

          {/* Section 2: The Atomic SQL Guard */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              2. The Solution: Single Atomic Conditional Write
            </h4>
            <p className="leading-relaxed">
              We never trust a separate read before writing. The write statement itself serves as the concurrency guard:
            </p>
            <div className="p-3 bg-slate-950 border border-emerald-900/50 rounded-xl font-mono text-[11px] text-emerald-300">
              {`UPDATE seats 
SET status = 'hold', held_by = ?, hold_expires_at = ? 
WHERE id = ? AND status = 'available';

// rows_affected === 1 -> This request won the lock (200 OK)
// rows_affected === 0 -> Seat was just taken -> Reject with 409 Conflict`}
            </div>
            <p className="text-slate-400 text-[11px]">
              Relational database row-level locking guarantees that exactly one update succeeds. The losing threads receive <code className="text-rose-400">rows_affected = 0</code> and are rejected immediately with <code className="text-amber-400">409 Conflict</code>.
            </p>
          </div>

          {/* Section 3: State Machine */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              3. Seat State Machine
            </h4>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
              <div>AVAILABLE ──[ User Clicks Seat (Atomic UPDATE) ]──► HOLD</div>
              <div>HOLD ─────[ Payment Success (~90% or forced) ]──► BOOKED (Terminal)</div>
              <div>HOLD ─────[ 5-min TTL Expired / Failed / Cancel ]─► AVAILABLE</div>
            </div>
          </div>

          {/* Section 4: Real-time sync & AI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <Radio className="w-3.5 h-3.5" />
                <span>Socket.IO Sync</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Broadcasts <code className="text-slate-300">seat_held</code>, <code className="text-slate-300">seat_released</code>, and <code className="text-slate-300">seat_booked</code> across browser tabs instantly without page polling.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                <span>Smart Seat AI</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Sends live available seat coordinates to Gemini 3 Flash. Gracefully falls back to contiguous rule-based block finder if offline or key is missing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
