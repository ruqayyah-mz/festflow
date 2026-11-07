import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { getEventCategory, EventStatusCategory } from '@/pages/organizer/OrganizerOverviewPage';
import { ArrowRight, MapPin, Calendar } from 'lucide-react';

const TABS: { key: EventStatusCategory; label: string }[] = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

export function ParticipantMyEventsPage() {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);

  const mine = user ? mockStorage.getEvents().filter((e) => mockStorage.isParticipantIn(e.id, user.id)) : [];
  const byTab = (k: EventStatusCategory) => mine.filter((e) => getEventCategory(e) === k);
  const [tab, setTab] = useState<EventStatusCategory>(
    () => TABS.find((t) => byTab(t.key).length > 0)?.key ?? 'upcoming'
  );
  const list = byTab(tab);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Events</h1>
        <p className="text-xs text-slate-500 mt-1">Events you've registered for.</p>
      </div>

      <div className="flex space-x-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              tab === t.key
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label} ({byTab(t.key).length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          message={`No ${tab} events.`}
          actionLabel="Explore Events"
          onAction={() => {
            window.location.href = '/participant';
          }}
        />
      ) : (
        <div className="space-y-4">
          {list.map((evt) => {
            const myTeam = mockStorage.getTeams(evt.id).find((t) => t.members?.some((m) => m.id === user?.id));
            const submitted = myTeam?.submission?.status === 'submitted';
            return (
              <div
                key={evt.id}
                className="border border-slate-200 bg-white p-6 shadow-2xs hover:border-blue-300 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold text-slate-900">{evt.name}</h2>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        {evt.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {formatDate(evt.starts_at)} — {formatDate(evt.ends_at)}
                      </span>
                    </div>
                  </div>
                  <Link to={`/participant/events/${evt.id}`} className="shrink-0">
                    <Button size="sm" className="space-x-1.5 font-medium">
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>
                    <span className="text-slate-500">Team: </span>
                    {myTeam ? (
                      <strong className="text-slate-900">{myTeam.name}</strong>
                    ) : (
                      <span className="text-amber-700 font-medium">No team yet</span>
                    )}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold border ${
                      submitted || (myTeam?.status ?? 'accepted') === 'accepted'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : myTeam?.status === 'rejected'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {!myTeam
                      ? 'Needs a team'
                      : submitted
                      ? 'Project Submitted'
                      : myTeam.status === 'forming'
                      ? 'Not applied yet'
                      : myTeam.status === 'pending'
                      ? 'Application pending'
                      : myTeam.status === 'rejected'
                      ? 'Not accepted'
                      : 'Accepted · Not submitted'}
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
