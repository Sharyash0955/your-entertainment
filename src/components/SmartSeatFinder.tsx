import React, { useState } from 'react';
import { Sparkles, ArrowRight, Bot, Compass, CheckCircle2, AlertCircle } from 'lucide-react';
import { AISuggestionResponse } from '../types';

interface SmartSeatFinderProps {
  onSuggest: (prompt: string) => Promise<void>;
  isLoading: boolean;
  suggestion: AISuggestionResponse | null;
  onClearSuggestion: () => void;
  onHoldSuggested: (seatIds: string[]) => void;
  isHoldingMultiple: boolean;
  category?: string;
}

export const SmartSeatFinder: React.FC<SmartSeatFinderProps> = ({
  onSuggest,
  isLoading,
  suggestion,
  onClearSuggestion,
  onHoldSuggested,
  isHoldingMultiple,
  category = 'movie',
}) => {
  const [prompt, setPrompt] = useState('');

  const isCinema = category === 'movie';
  const quickChips = isCinema
    ? [
        'Best 2 VIP Recliners (Back Row)',
        '2 contiguous seats in sweet spot',
        'Aisle seat for one',
        'Budget executive seats',
      ]
    : [
        'Best 2 VIP Fan Pit seats (Front Row)',
        '4 contiguous seats in Center Arena',
        'Aisle seat for one',
        'General admission seats',
      ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSuggest(prompt.trim());
    }
  };

  const handleChipClick = (chip: string) => {
    setPrompt(chip);
    onSuggest(chip);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Smart Seat Finder (AI Powered)
          </h2>
        </div>
        <span className="text-[11px] text-slate-400">
          Natural Language • Gemini 3 Flash
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Tell the assistant your seating preference (e.g. group size, aisle, front/back) and it will analyze live available coordinates.
      </p>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="relative mb-3">
        <input
          id="ai-prompt-input"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g., "Find me 2 seats together near the front" or "Aisle seat for one"'
          className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-3.5 pr-28 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
        <button
          id="btn-ai-submit"
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Find</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
        </button>
      </form>

      {/* Quick Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-[11px] text-slate-500 font-medium mr-1">Try asking:</span>
        {quickChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChipClick(chip)}
            className="text-[11px] bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/80 px-2.5 py-1 rounded-full transition hover:border-slate-600"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* AI Suggestion Output card */}
      {suggestion && (
        <div className="mt-3 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-indigo-200">
                    {suggestion.suggestedSeatIds.length} Recommended Seat(s)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      suggestion.isAiPowered
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {suggestion.isAiPowered ? 'Gemini 3 Flash' : 'Rule-Based Fallback'}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{suggestion.reasoning}</p>
              </div>
            </div>

            <button
              onClick={onClearSuggestion}
              className="text-slate-400 hover:text-slate-200 text-xs shrink-0"
              title="Dismiss recommendation"
            >
              ✕
            </button>
          </div>

          {suggestion.suggestedSeatIds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-indigo-500/20 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">
                Seats highlighted with glowing purple ring on the seat map.
              </span>
              <button
                id="btn-hold-all-suggested"
                onClick={() => onHoldSuggested(suggestion.suggestedSeatIds)}
                disabled={isHoldingMultiple}
                className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                {isHoldingMultiple ? (
                  <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hold Suggested Seats</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
