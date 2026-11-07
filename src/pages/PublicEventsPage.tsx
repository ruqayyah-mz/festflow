import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

export function PublicEventsPage() {
  const events = mockStorage.getPublicEvents();
  const [search, setSearch] = useState('');

  const filtered = events.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.venue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Public Events & Hackathons Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse active hackathons, conferences, and symposia powered by FestFlow.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search events or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 shadow-2xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((evt) => {
          const analytics = mockStorage.getEventAnalytics(evt.id);

          return (
            <div
              key={evt.id}
              className="border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-5 shadow-xs hover:border-blue-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">
                    {evt.visibility}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {formatDate(evt.starts_at)}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  {evt.name}
                </h2>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {evt.description}
                </p>

                <div className="text-xs text-slate-500 space-y-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-slate-800">{evt.venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formatDate(evt.starts_at)} to {formatDate(evt.ends_at)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {evt.tracks.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  {analytics.participantCount} Builders • {evt.rounds.length} Rounds
                </span>
                <Link to={`/events/${evt.id}`}>
                  <Button size="sm" variant="outline" className="space-x-1">
                    <span>View Event</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
