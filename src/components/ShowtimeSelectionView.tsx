import React, { useState } from 'react';
import { EventItem, VenueOption } from '../types';
import { Calendar, MapPin, Clock, ArrowLeft, Sparkles, Check } from 'lucide-react';

interface ShowtimeSelectionViewProps {
  event: EventItem;
  onBack: () => void;
  onSelectShowtime: (selection: {
    venue: string;
    date: string;
    time: string;
  }) => void;
}

export const ShowtimeSelectionView: React.FC<ShowtimeSelectionViewProps> = ({
  event,
  onBack,
  onSelectShowtime,
}) => {
  const dates = event.dates && event.dates.length > 0
    ? event.dates
    : ['Today (22 Sep)', 'Tomorrow (23 Sep)', 'Wed (24 Sep)', 'Thu (25 Sep)', 'Fri (26 Sep)'];

  const [selectedDate, setSelectedDate] = useState(dates[0]);

  const defaultVenues: VenueOption[] = [
    {
      id: 'v1',
      name: 'Prasad IMAX Auditorium 1, Screen 1',
      location: 'Central Laser Dome • 70mm Curved Screen',
      formats: ['IMAX 70mm', 'Dolby Atmos'],
      features: ['Laser 4K', 'Curved Giant Screen', 'Plush Seating'],
    },
    {
      id: 'v2',
      name: "PVR Director's Cut: Gold Class",
      location: 'Palladium Mall, Audi 2',
      formats: ['Dolby Cinema', 'Atmos'],
      features: ['Recliner Loungers', 'In-Seat Butler', 'Gourmet Dining'],
    },
    {
      id: 'v3',
      name: 'Cinépolis VIP Grand Experience',
      location: 'Grand Galleria, Screen 4',
      formats: ['4DX 3D', 'RealD'],
      features: ['Motion Seats', 'Environmental FX', 'Laser Sound'],
    },
  ];

  const venues = event.venues && event.venues.length > 0 ? event.venues : defaultVenues;
  const showtimes = event.showtimes && event.showtimes.length > 0
    ? event.showtimes
    : ['10:30 AM', '02:15 PM', '06:30 PM', '08:30 PM', '10:45 PM'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Event summary banner header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>
        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Step 2 of 5</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <img
          src={event.posterUrl}
          alt={event.name}
          referrerPolicy="no-referrer"
          className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-xl shadow-lg border border-slate-700/80"
        />
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[11px] font-bold">
              {event.format || 'Cinema Experience'}
            </span>
            <span className="text-xs text-slate-400">{event.language || 'English'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">{event.name}</h2>
          <p className="text-xs text-slate-400">{event.genre} • {event.duration}</p>
        </div>
      </div>

      {/* Date selection carousel */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-rose-500" />
          Select Date
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {dates.map((d) => {
            const isSelected = selectedDate === d;
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Venues & Showtimes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            Select Cinema & Show Timing
          </span>
          <span className="text-slate-500 lowercase font-normal">All times local</span>
        </div>

        <div className="space-y-4">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4"
            >
              {/* Venue header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {venue.name}
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                      Dolby Atmos
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{venue.location}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {venue.features.map((feat) => (
                    <span
                      key={feat}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-medium"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Showtimes Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-3">
                {showtimes.map((st, idx) => {
                  const isFillingFast = idx === 2 || idx === 3;
                  return (
                    <button
                      key={st}
                      onClick={() =>
                        onSelectShowtime({
                          venue: venue.name,
                          date: selectedDate,
                          time: st,
                        })
                      }
                      className="group relative flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border border-emerald-500/40 hover:border-rose-500 bg-slate-950/80 hover:bg-rose-600 transition shadow-sm"
                    >
                      <span className="text-xs font-extrabold text-emerald-400 group-hover:text-white transition">
                        {st}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-rose-100 font-medium mt-0.5">
                        {venue.formats[0] || 'Dolby Laser'}
                      </span>
                      {isFillingFast && (
                        <span className="absolute -top-1.5 -right-1 px-1 rounded bg-amber-500 text-[8px] font-black text-slate-950 uppercase tracking-tighter">
                          Fast
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
