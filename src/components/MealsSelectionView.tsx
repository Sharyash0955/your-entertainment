import React, { useState } from 'react';
import { MealItem, SelectedMeal, SeatItem, EventItem } from '../types';
import { THEATER_MEALS } from '../data/meals';
import { Plus, Minus, ArrowLeft, UtensilsCrossed, Sparkles, Check, ChevronRight } from 'lucide-react';

interface MealsSelectionViewProps {
  event: EventItem;
  venueName: string;
  dateStr: string;
  timeStr: string;
  selectedSeats: SeatItem[];
  selectedMeals: SelectedMeal[];
  onUpdateMeals: (meals: SelectedMeal[]) => void;
  onBack: () => void;
  onProceedToPayment: () => void;
}

export const MealsSelectionView: React.FC<MealsSelectionViewProps> = ({
  event,
  venueName,
  dateStr,
  timeStr,
  selectedSeats,
  selectedMeals,
  onUpdateMeals,
  onBack,
  onProceedToPayment,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const ticketSubtotal = selectedSeats.reduce((acc, s) => acc + s.price, 0);

  const getQuantity = (mealId: string) => {
    const found = selectedMeals.find((m) => m.meal.id === mealId);
    return found ? found.quantity : 0;
  };

  const handleIncrement = (meal: MealItem) => {
    const existing = selectedMeals.find((m) => m.meal.id === meal.id);
    let updated: SelectedMeal[];
    if (existing) {
      updated = selectedMeals.map((m) =>
        m.meal.id === meal.id ? { ...m, quantity: m.quantity + 1 } : m
      );
    } else {
      updated = [...selectedMeals, { meal, quantity: 1 }];
    }
    onUpdateMeals(updated);
  };

  const handleDecrement = (mealId: string) => {
    const existing = selectedMeals.find((m) => m.meal.id === mealId);
    if (!existing) return;

    if (existing.quantity <= 1) {
      onUpdateMeals(selectedMeals.filter((m) => m.meal.id !== mealId));
    } else {
      onUpdateMeals(
        selectedMeals.map((m) =>
          m.meal.id === mealId ? { ...m, quantity: m.quantity - 1 } : m
        )
      );
    }
  };

  const filteredMeals = THEATER_MEALS.filter(
    (m) => activeCategory === 'all' || m.category === activeCategory
  );

  const mealsSubtotal = selectedMeals.reduce(
    (acc, item) => acc + item.meal.price * item.quantity,
    0
  );
  const totalGrand = ticketSubtotal + mealsSubtotal;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Seat Selection
        </button>
        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Step 4 of 5</span>
      </div>

      {/* Booking Summary Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            {event.name}
            <span className="text-[11px] text-slate-400 font-normal">
              • {selectedSeats.length} Seat(s):{' '}
              <span className="text-emerald-400 font-semibold">
                {selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')}
              </span>
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {venueName} • {dateStr} at {timeStr}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onProceedToPayment}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Skip Snacks
          </button>
        </div>
      </div>

      {/* Meals Category Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Grab A Bite</h3>
            <p className="text-xs text-slate-400">Pre-order movie snacks & have them ready at your seat</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'combos', label: 'Value Combos' },
            { id: 'popcorn', label: 'Popcorn Tubs' },
            { id: 'snacks', label: 'Nachos & Hotdogs' },
            { id: 'beverages', label: 'Cold Beverages' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMeals.map((meal) => {
          const qty = getQuantity(meal.id);
          return (
            <div
              key={meal.id}
              className={`flex flex-col justify-between bg-slate-900/80 border rounded-2xl overflow-hidden transition-all duration-200 ${
                qty > 0 ? 'border-rose-500/60 shadow-lg shadow-rose-950/20' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                  <img
                    src={meal.image}
                    alt={meal.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  />
                  {meal.tag && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-rose-600 text-[10px] font-bold text-white shadow">
                      {meal.tag}
                    </span>
                  )}
                  <span
                    className={`absolute bottom-2 left-2 w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                      meal.isVeg ? 'border-emerald-500 bg-emerald-950/80' : 'border-rose-500 bg-rose-950/80'
                    }`}
                    title={meal.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        meal.isVeg ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                  </span>
                </div>

                <div className="p-4 space-y-1.5">
                  <h4 className="text-xs font-bold text-white line-clamp-1">{meal.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {meal.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-800/80 mt-2">
                <span className="text-sm font-black text-white">₹{meal.price}</span>

                {qty === 0 ? (
                  <button
                    onClick={() => handleIncrement(meal)}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-950 border border-rose-500/50 rounded-lg px-2 py-1">
                    <button
                      onClick={() => handleDecrement(meal.id)}
                      className="text-slate-400 hover:text-white p-0.5 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-rose-400 min-w-[14px] text-center">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleIncrement(meal)}
                      className="text-slate-400 hover:text-white p-0.5 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md p-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Tickets ({selectedSeats.length})</span>
              <span className="text-sm font-bold text-slate-200">₹{ticketSubtotal.toLocaleString()}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Food & Beverages ({selectedMeals.reduce((a, b) => a + b.quantity, 0)})
              </span>
              <span className="text-sm font-bold text-rose-400">₹{mealsSubtotal.toLocaleString()}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800 hidden md:block" />
            <div className="hidden md:block">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount</span>
              <span className="text-base font-black text-emerald-400">₹{totalGrand.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onProceedToPayment}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <span>Continue to Payment Page (₹{totalGrand.toLocaleString()})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
