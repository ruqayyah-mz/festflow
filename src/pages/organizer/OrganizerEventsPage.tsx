import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Event } from '@/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { Plus, Edit3, Trash2, Globe, Lock } from 'lucide-react';

export function OrganizerEventsPage() {
  const [events, setEvents] = useState<Event[]>(mockStorage.getEvents());
  const [notification, setNotification] = useState('');

  const refresh = () => {
    setEvents(mockStorage.getEvents());
  };

  useEffect(() => {
    const unsub = mockStorage.subscribe(() => {
      refresh();
    });
    return () => unsub();
  }, []);

  const handleSoftDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to soft-delete "${name}"? It will be archived and hidden from the public directory.`)) {
      mockStorage.softDeleteEvent(id);
      refresh();
      setNotification(`Event "${name}" was archived.`);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with single primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Events Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure event rounds, visibility mode, and dates.
          </p>
        </div>

        <div>
          <Link to="/organizer/events/new">
            <Button size="sm" className="space-x-1.5 font-medium">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Button>
          </Link>
        </div>
      </div>

      {notification && (
        <div className="p-3 text-xs bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification('')} className="font-mono hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {events.length === 0 ? (
        <EmptyState
          message="No active events found in your organizer portfolio."
          actionLabel="Create Event"
          onAction={() => {
            window.location.href = '/organizer/events/new';
          }}
        />
      ) : (
        <div className="space-y-4">
          {events.map((evt) => {
            const activeRound = evt.rounds.find((r) => r.active);

            return (
              <div
                key={evt.id}
                className="border border-slate-200 bg-white p-6 shadow-2xs hover:border-blue-300 transition-colors space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 border flex items-center gap-1 ${
                          evt.visibility === 'public'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                        }`}
                      >
                        {evt.visibility === 'public' ? (
                          <Globe className="w-3 h-3" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        <span>{evt.visibility}</span>
                      </span>

                      <Link to={`/organizer/events/${evt.id}`} className="hover:text-blue-600 transition-colors">
                        <h2 className="text-lg font-bold text-slate-900 hover:text-blue-600">
                          {evt.name}
                        </h2>
                      </Link>
                    </div>

                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono">
                      <span>Venue: <strong className="text-slate-800">{evt.venue}</strong></span>
                      <span>Dates: <strong className="text-slate-800">{formatDate(evt.starts_at)}</strong> to <strong className="text-slate-800">{formatDate(evt.ends_at)}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <Link to={`/organizer/events/${evt.id}`}>
                      <Button size="sm" className="space-x-1.5 font-medium">
                        <span>Open Workspace</span>
                      </Button>
                    </Link>

                    <Link to={`/organizer/events/${evt.id}/edit`}>
                      <Button variant="outline" size="sm" className="space-x-1.5">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Button>
                    </Link>

                    <button
                      onClick={() => handleSoftDelete(evt.id, evt.name)}
                      className="p-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs transition-colors cursor-pointer"
                      title="Archive event"
                      aria-label="Archive event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rounds summary bar */}
                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-medium">Configured Rounds:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {evt.rounds.map((r) => (
                        <span
                          key={r.id}
                          className={`px-2 py-0.5 text-[11px] font-mono border ${
                            r.active
                              ? 'border-blue-400 bg-blue-50 text-blue-800 font-bold'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          {r.name} ({r.weight}%){r.active && ' • Active'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    {evt.tracks?.length || 0} Tracks registered
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

