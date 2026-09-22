import React from 'react';
import { Activity, Clock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

export interface ActivityLogItem {
  id: string;
  type: 'held' | 'released' | 'booked' | 'conflict' | 'info';
  message: string;
  timestamp: string;
  seatLabel?: string;
  user?: string;
}

interface ActivityFeedProps {
  logs: ActivityLogItem[];
  onClearLogs: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
            Real-Time Audit Stream
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-400 font-mono">
            {logs.length} events
          </span>
          <button
            onClick={onClearLogs}
            className="text-[10px] text-slate-500 hover:text-slate-300 underline"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-72 pr-1 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-sans">
            Listening for Socket.IO seat events...
          </div>
        ) : (
          logs.map((log) => {
            let badgeClasses = 'text-slate-400 bg-slate-800/80 border-slate-700';
            let icon = <Clock className="w-3 h-3 text-slate-400" />;

            if (log.type === 'held') {
              badgeClasses = 'text-amber-300 bg-amber-950/40 border-amber-700/50';
              icon = <Clock className="w-3 h-3 text-amber-400" />;
            } else if (log.type === 'booked') {
              badgeClasses = 'text-emerald-300 bg-emerald-950/40 border-emerald-700/50';
              icon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
            } else if (log.type === 'released') {
              badgeClasses = 'text-sky-300 bg-sky-950/40 border-sky-700/50';
              icon = <XCircle className="w-3 h-3 text-sky-400" />;
            } else if (log.type === 'conflict') {
              badgeClasses = 'text-rose-300 bg-rose-950/40 border-rose-700/50';
              icon = <ShieldCheck className="w-3 h-3 text-rose-400" />;
            }

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border ${badgeClasses} transition-all duration-150 flex items-start justify-between gap-2`}
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">{icon}</span>
                  <div>
                    <div className="font-semibold">{log.message}</div>
                    {log.user && (
                      <div className="text-[10px] opacity-75 font-sans">User: {log.user}</div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] opacity-60 shrink-0 font-sans">{log.timestamp}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
