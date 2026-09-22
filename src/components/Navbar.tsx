import React, { useState } from 'react';
import { UserItem } from '../types';
import {
  Film,
  MapPin,
  Search,
  Bot,
  Flame,
  Ticket,
  ChevronDown,
  User,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserItem;
  onOpenAuth: () => void;
  onOpenConcurrency: () => void;
  onOpenChat: () => void;
  onOpenMyBookings: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenConcurrency,
  onOpenChat,
  onOpenMyBookings,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onGoHome,
}) => {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const cities = ['Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad', 'London', 'New York'];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md">
      {/* Top utility row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={onGoHome}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 group-hover:scale-105 transition">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-white">
                    CINE<span className="text-rose-500">PULSE</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30">
                    District
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-none">
                  Cinema & Live Tickets
                </p>
              </div>
            </button>

            {/* City Selector */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showCityDropdown && (
                <div className="absolute left-0 mt-1 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 z-50">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 transition ${
                        selectedCity === city ? 'text-rose-400 font-semibold bg-rose-500/10' : 'text-slate-300'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search movies, live concerts, comedy specials..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
              />
            </div>
          </div>

          {/* Right quick actions */}
          <div className="flex items-center gap-2.5">
            {/* Reviewer / Concurrency Load Test Button */}
            <button
              onClick={onOpenConcurrency}
              title="Run 50-thread atomic concurrency race condition verification"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="hidden md:inline">50x Load Test</span>
            </button>

            {/* AI Concierge Chatbot Button */}
            <button
              onClick={onOpenChat}
              className="relative flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Bot className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">AI Concierge</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </button>

            {/* My Bookings Button */}
            <button
              onClick={onOpenMyBookings}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold transition"
            >
              <Ticket className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">My Tickets</span>
            </button>

            {/* User Account / Login */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <span className="hidden sm:inline max-w-[90px] truncate">{currentUser.name}</span>
            </button>
          </div>
        </div>

        {/* Secondary Category Sub-Nav */}
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 border-t border-slate-900 scrollbar-none">
          {[
            { id: 'all', label: 'All Experiences', icon: Film },
            { id: 'movie', label: 'Movies & IMAX', icon: Film },
            { id: 'concert', label: 'Concerts & Music', icon: Flame },
            { id: 'comedy', label: 'Stand-up Comedy', icon: User },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
