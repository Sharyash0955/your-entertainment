import React from 'react';
import { Film, Clock, Grid, UtensilsCrossed, CreditCard, TicketCheck } from 'lucide-react';

export type BookingStep = 'catalog' | 'showtime' | 'seats' | 'meals' | 'payment' | 'confirmation';

interface StepProgressProps {
  currentStep: BookingStep;
  onNavigateStep?: (step: BookingStep) => void;
  canNavigateBackTo?: BookingStep[];
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  onNavigateStep,
  canNavigateBackTo = [],
}) => {
  const steps: { id: BookingStep; label: string; icon: any }[] = [
    { id: 'catalog', label: '1. Select Event', icon: Film },
    { id: 'showtime', label: '2. Cinema & Time', icon: Clock },
    { id: 'seats', label: '3. Choose Seats', icon: Grid },
    { id: 'meals', label: '4. Snacks & Meals', icon: UtensilsCrossed },
    { id: 'payment', label: '5. Payment', icon: CreditCard },
    { id: 'confirmation', label: '6. E-Ticket', icon: TicketCheck },
  ];

  const currentIdx = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full bg-slate-950/60 border-b border-slate-900 py-3 px-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isClickable = onNavigateStep && canNavigateBackTo.includes(step.id);

          return (
            <div key={step.id} className="flex items-center gap-2 shrink-0">
              <button
                disabled={!isClickable}
                onClick={() => isClickable && onNavigateStep(step.id)}
                className={`flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ${
                  isCurrent
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : isCompleted
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-slate-600 cursor-default'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-rose-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                </div>
                <span className="whitespace-nowrap">{step.label}</span>
              </button>

              {idx < steps.length - 1 && (
                <div
                  className={`w-4 h-[1px] ${
                    idx < currentIdx ? 'bg-emerald-500/40' : 'bg-slate-800'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
