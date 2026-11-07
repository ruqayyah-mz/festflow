import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { JoinByInviteLink } from '@/components/volunteer/JoinByInviteLink';
import { Event, Role } from '@/types';
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

export function VolunteerMyEventsPage() {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);

  // An accepted application (or invite) creates a volunteer role — that's what puts an event here.
  const mine: { event: Event; role: Role }[] = mockStorage
    .getRoles()
    .filter((r) => r.user_id === user?.id && r.role_type === 'volunteer')
    .map((role) => ({ role, event: mockStorage.getEventById(role.event_id) }))
    .filter((x): x is { event: Event; role: Role } => !!x.event);

  const byTab = (k: EventStatusCategory) => mine.filter((x) => getEventCategory(x.event) === k);
  const [tab, setTab] = useState<EventStatusCategory>(
    () => TABS.find((t) => byTab(t.key).length > 0)?.key ?? 'upcoming'
  );
  const list = byTab(tab);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Events</h1>
        <p className="text-xs text-slate-500 mt-1">Events you've been accepted to volunteer at.</p>
      </div>

      <JoinByInviteLink />

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
          actionLabel="Browse Opportunities"
          onAction={() => {
            window.location.href = '/volunteer';
          }}
        />
      ) : (
        <div className="space-y-4">
          {list.map(({ event, role }) => (
            <div
              key={role.id}
              className="border border-slate-200 bg-white p-6 shadow-2xs hover:border-blue-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">
                  {role.role_title || 'General Volunteer'}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{event.name}</h2>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{event.venue}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {formatDate(event.starts_at)} — {formatDate(event.ends_at)}
                    </span>
                  </span>
                </div>
              </div>
              <Link to={`/volunteer/events/${event.id}`} className="shrink-0">
                <Button size="sm" className="space-x-1.5 font-medium">
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
