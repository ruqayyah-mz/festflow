import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, Edit3, Settings2, BarChart2, CheckSquare, Eye, KeyRound } from 'lucide-react';

export function OrganizerDashboard() {
  const [events, setEvents] = useState(mockStorage.getEvents());
  const [notification, setNotification] = useState('');

  const refresh = () => {
    setEvents(mockStorage.getEvents());
  };

  const handleSoftDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to soft-delete "${name}"? It will be archived and hidden from public directory.`)) {
      mockStorage.softDeleteEvent(id);
      refresh();
      setNotification(`Event "${name}" was soft-deleted (archived).`);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Organizer Operations Console
            </h1>
            <span className="text-xs px-2.5 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 font-bold font-mono">
              Primary Role
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Coordinate volunteers, participant teams, announcements, and hackathon rounds.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/organizer/events/new">
            <Button size="sm" className="space-x-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Button>
          </Link>
          <Link to="/organizer/analytics">
            <Button variant="outline" size="sm" className="space-x-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Global Analytics</span>
            </Button>
          </Link>
        </div>
      </div>

      {notification && (
        <div className="p-3 text-xs bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification('')} className="font-mono hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Events Listing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Active Managed Events ({events.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Protected with Row Level Security & Route Guards
          </span>
        </div>

        {events.length === 0 ? (
          <EmptyState
            message="No active events found in your organizer portfolio."
            actionLabel="Create New Event"
            onAction={() => {
              window.location.href = '/organizer/events/new';
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {events.map((evt) => {
              const analytics = mockStorage.getEventAnalytics(evt.id);
              const judgeLinks = mockStorage.getJudgeLinks(evt.id);

              return (
                <div
                  key={evt.id}
                  className="border border-slate-200 bg-white p-6 space-y-5 shadow-xs hover:border-blue-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${
                          evt.visibility === 'public'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                        }`}>
                          {evt.visibility}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">
                          {evt.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                        {evt.description}
                      </p>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono">
                        <span>Venue: <strong className="text-slate-800">{evt.venue}</strong></span>
                        <span>Dates: <strong className="text-slate-800">{formatDate(evt.starts_at)}</strong> to <strong className="text-slate-800">{formatDate(evt.ends_at)}</strong></span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-1 shrink-0">
                      <Link to={`/events/${evt.id}`}>
                        <Button variant="ghost" size="sm" title="View Public Page">
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                        </Button>
                      </Link>
                      <Link to={`/organizer/events/${evt.id}/edit`}>
                        <Button variant="outline" size="sm" title="Edit Event & Rounds">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <button
                        onClick={() => handleSoftDelete(evt.id, evt.name)}
                        className="p-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs transition-colors cursor-pointer"
                        title="Soft delete (archive) event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Micro stats banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
                    <div className="p-3 border border-slate-100 bg-slate-50/70">
                      <div className="text-slate-500 text-[11px]">Builders</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {analytics.participantCount} ({analytics.teamCount} teams)
                      </div>
                    </div>
                    <div className="p-3 border border-slate-100 bg-slate-50/70">
                      <div className="text-slate-500 text-[11px]">Tasks Done</div>
                      <div className="text-sm font-bold text-emerald-700 mt-0.5">
                        {analytics.taskCompletionRate}% ({analytics.completedTasks}/{analytics.totalTasks})
                      </div>
                    </div>
                    <div className="p-3 border border-slate-100 bg-slate-50/70">
                      <div className="text-slate-500 text-[11px]">Judge Links</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {judgeLinks.length} active
                      </div>
                    </div>
                    <div className="p-3 border border-slate-100 bg-slate-50/70">
                      <div className="text-slate-500 text-[11px]">Rounds</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {evt.rounds.length} configured
                      </div>
                    </div>
                  </div>

                  {/* Fast Action Link Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Link to={`/organizer/events/${evt.id}/manage`}>
                      <Button size="sm" className="space-x-1.5">
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>Manage Event Workspace</span>
                      </Button>
                    </Link>
                    <Link to={`/organizer/events/${evt.id}/manage#volunteer-links`}>
                      <Button variant="outline" size="sm" className="space-x-1.5 text-blue-700 border-blue-200 hover:bg-blue-50">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        <span>Volunteer Access Links</span>
                      </Button>
                    </Link>
                    <Link to={`/organizer/hackathon?eventId=${evt.id}`}>
                      <Button variant="outline" size="sm" className="space-x-1.5">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Rounds & Judge Links</span>
                      </Button>
                    </Link>
                    <Link to={`/organizer/analytics?eventId=${evt.id}`}>
                      <Button variant="outline" size="sm" className="space-x-1.5">
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>View Analytics</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
