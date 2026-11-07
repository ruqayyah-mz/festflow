import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { EventFormatBadges } from '@/components/event/EventFormatBadges';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { getEventCategory } from '@/pages/organizer/OrganizerOverviewPage';
import { getRegistrationStatus } from '@/lib/eventRules';
import { CategoryFilter, CategoryFilterValue, filterByCategory } from '@/components/event/CategoryFilter';
import { ArrowRight, MapPin, Calendar, Layers } from 'lucide-react';

export function ParticipantAllEventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  const [error, setError] = useState<{ eventId: string; message: string } | null>(null);
  const [category, setCategory] = useState<CategoryFilterValue>('all');
  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);

  // Ongoing events stay listed (registered people can open them); the card says registration is closed.
  const allEvents = mockStorage.getPublicEvents().filter((e) => getEventCategory(e) !== 'past');
  const events = filterByCategory(allEvents, category);

  const handleRegister = (eventId: string) => {
    try {
      setError(null);
      mockStorage.registerForEvent(eventId);
      navigate(`/participant/events/${eventId}`);
    } catch (err) {
      setError({ eventId, message: err instanceof Error ? err.message : 'Could not register.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Explore Events</h1>
          <p className="text-xs text-slate-500 mt-1">
            Hackathons and competitions open for registration. Register, then form or join a team inside the event.
          </p>
        </div>
        <Link to="/participant/my-events">
          <Button variant="outline" size="sm" className="space-x-1.5 font-medium">
            <span>View My Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      <CategoryFilter events={allEvents} value={category} onChange={setCategory} />

      {events.length === 0 ? (
        <EmptyState message={allEvents.length ? 'No events of this type right now.' : 'No events are open for registration right now.'} />
      ) : (
        <div className="space-y-4">
          {events.map((evt) => {
            const registered = !!user && mockStorage.isParticipantIn(evt.id, user.id);
            const volunteering = !!user && mockStorage.isVolunteerIn(evt.id, user.id);
            const status = getEventCategory(evt);
            const reg = getRegistrationStatus(evt, 'participants');
            return (
              <div
                key={evt.id}
                className="border border-slate-200 bg-white p-6 shadow-2xs hover:border-blue-300 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {status === 'ongoing' ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-emerald-300 bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Now
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">
                          Upcoming
                        </span>
                      )}
                      <h2 className="text-lg font-bold text-slate-900">{evt.name}</h2>
                      <EventFormatBadges event={evt} />
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{evt.description}</p>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        {evt.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {formatDate(evt.starts_at)} — {formatDate(evt.ends_at)}
                      </span>
                      {evt.tracks?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          {evt.tracks.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-end gap-2">
                    {registered ? (
                      <Link to={`/participant/events/${evt.id}`}>
                        <Button size="sm" className="space-x-1.5 font-medium">
                          <span>✓ Registered — Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    ) : !reg.open ? (
                      <span className="text-xs font-mono text-slate-600 border border-slate-300 bg-slate-100 px-3 py-1.5">{reg.reason}</span>
                    ) : volunteering ? (
                      <span className="text-xs font-mono text-slate-500 border border-slate-200 bg-slate-50 px-3 py-1.5">
                        You're volunteering here
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => handleRegister(evt.id)} className="font-medium">
                        Register
                      </Button>
                    )}
                    {reg.open && !registered && (
                      <span className="text-[11px] text-amber-700 font-medium">Registration closes {formatDate(reg.closesAt)}</span>
                    )}
                    <Link to={`/events/${evt.id}`} className="text-[11px] text-slate-500 hover:text-blue-600">
                      Public event page ↗
                    </Link>
                  </div>
                </div>
                {error?.eventId === evt.id && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2" role="alert">
                    {error.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
