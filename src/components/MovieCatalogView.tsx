import React, { useState } from 'react';
import { EventItem } from '../types';
import { Star, Clock, Sparkles, Film, Info, X, Play } from 'lucide-react';

interface MovieCatalogViewProps {
  events: EventItem[];
  selectedCategory: string;
  searchQuery: string;
  onSelectEvent: (event: EventItem) => void;
}

export const MovieCatalogView: React.FC<MovieCatalogViewProps> = ({
  events,
  selectedCategory,
  searchQuery,
  onSelectEvent,
}) => {
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ev.name.toLowerCase().includes(q) ||
      (ev.genre && ev.genre.toLowerCase().includes(q)) ||
      (ev.director && ev.director.toLowerCase().includes(q)) ||
      (ev.cast && ev.cast.some((c) => c.toLowerCase().includes(q)));
    return matchesCategory && matchesSearch;
  });

  const featuredEvent = events[0] || null;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Spotlight */}
      {featuredEvent && !searchQuery && selectedCategory === 'all' && (
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen scale-105 filter blur-sm transition-transform duration-700"
            style={{
              backgroundImage: `url(${featuredEvent.backdropUrl || featuredEvent.posterUrl})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />

          <div className="relative p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row items-center gap-8">
            {/* Poster */}
            <div className="w-48 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-rose-950/50 border border-slate-800 group">
              <img
                src={featuredEvent.posterUrl}
                alt={featuredEvent.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>

            {/* Details */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  Trending Spotlight
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {featuredEvent.rating || '9.8'} / 10 ({featuredEvent.votes || '2.1M votes'})
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                  {featuredEvent.format || 'IMAX 70mm'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {featuredEvent.name}
              </h1>

              <p className="text-sm text-slate-300 max-w-2xl line-clamp-3 leading-relaxed">
                {featuredEvent.synopsis}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {featuredEvent.duration || '2h 49m'}
                </span>
                <span>•</span>
                <span>{featuredEvent.genre || 'Sci-Fi • Adventure'}</span>
                <span>•</span>
                <span className="text-slate-300">{featuredEvent.language || 'English (Dolby Atmos)'}</span>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={() => onSelectEvent(featuredEvent)}
                  className="px-6 py-3 bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
                >
                  <Film className="w-4 h-4" />
                  Book Tickets Now (From ₹{featuredEvent.basePrice})
                </button>

                <button
                  onClick={() => setDetailEvent(featuredEvent)}
                  className="px-4 py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm rounded-xl transition flex items-center gap-2"
                >
                  <Info className="w-4 h-4 text-slate-400" />
                  View Details & Cast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Catalog Events */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {selectedCategory === 'all'
                ? 'Now Showing & Upcoming'
                : selectedCategory === 'movie'
                ? 'Cinemas & IMAX Screenings'
                : selectedCategory === 'concert'
                ? 'Live Concerts & Music Tours'
                : 'Stand-up Comedy Specials'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any event to pick cinema, date, real-time seats, and gourmet snacks.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
            {filteredEvents.length} Events Available
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-300 font-semibold">No experiences match your filter.</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing search or picking another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="group flex flex-col bg-slate-900/70 border border-slate-800/90 hover:border-rose-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-rose-950/20"
              >
                {/* Poster container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                  <img
                    src={event.backdropUrl || event.posterUrl}
                    alt={event.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                  {/* Format pill */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white">
                      {event.format || 'Standard'}
                    </span>
                  </div>

                  {/* Rating pill */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/90 text-slate-950 text-xs font-black shadow-md">
                    <Star className="w-3 h-3 fill-slate-950" />
                    <span>{event.rating || '9.0'}</span>
                  </div>

                  {/* Duration overlay bottom */}
                  <div className="absolute bottom-2.5 left-3 text-xs text-slate-300 font-medium flex items-center gap-1.5 drop-shadow">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{event.duration || '2h'}</span>
                    <span>•</span>
                    <span>{event.language || 'English'}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition line-clamp-1">
                      {event.name}
                    </h3>
                    <p className="text-xs text-rose-400/90 font-medium mt-1">
                      {event.genre || 'Entertainment'}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {event.synopsis}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Tickets From</span>
                      <span className="text-base font-extrabold text-white">₹{event.basePrice}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetailEvent(event)}
                        className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                        title="View details"
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onSelectEvent(event)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md shadow-rose-600/20 transition hover:scale-[1.02]"
                      >
                        Book Seats
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header Banner */}
            <div className="relative h-48 sm:h-64 overflow-hidden">
              <img
                src={detailEvent.backdropUrl || detailEvent.posterUrl}
                alt={detailEvent.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
              <button
                onClick={() => setDetailEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <span className="px-2.5 py-1 rounded bg-rose-600 text-white text-xs font-bold">
                  {detailEvent.format || 'IMAX Experience'}
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold text-white mt-1.5">{detailEvent.name}</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {detailEvent.rating} / 10 ({detailEvent.votes})
                </span>
                <span>•</span>
                <span>{detailEvent.duration}</span>
                <span>•</span>
                <span>{detailEvent.genre}</span>
                <span>•</span>
                <span>{detailEvent.language}</span>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Synopsis</h3>
                <p className="text-sm text-slate-200 leading-relaxed">{detailEvent.synopsis}</p>
              </div>

              {detailEvent.cast && detailEvent.cast.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Key Cast & Director</h3>
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">Starring:</strong> {detailEvent.cast.join(', ')}
                  </p>
                  {detailEvent.director && (
                    <p className="text-sm text-slate-300 mt-1">
                      <strong className="text-white">Director:</strong> {detailEvent.director}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Base Ticket Price</span>
                  <span className="text-xl font-black text-white">₹{detailEvent.basePrice}</span>
                </div>

                <button
                  onClick={() => {
                    const ev = detailEvent;
                    setDetailEvent(null);
                    onSelectEvent(ev);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-600/30 transition"
                >
                  Proceed to Cinemas & Showtimes ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
