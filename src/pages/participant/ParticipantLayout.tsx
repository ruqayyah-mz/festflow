import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { DashboardShell, DashboardNavLink } from '@/components/layout/DashboardShell';
import { NotificationBanner } from '@/components/layout/NotificationBanner';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { getCountdown } from '@/lib/utils';
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const HOME_LINKS: DashboardNavLink[] = [
  { label: 'Explore Events', path: '/participant', exact: true },
  { label: 'My Events', path: '/participant/my-events' },
];

export function ParticipantLayout() {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);

  // Inside an event, the sidebar becomes that event's workspace (mirrors the organizer/volunteer layouts).
  const eventId = useLocation().pathname.match(/^\/participant\/events\/([^/]+)/)?.[1];
  const event = eventId ? mockStorage.getEventById(eventId) : undefined;
  const sidebarLinks: DashboardNavLink[] = eventId
    ? [
        { label: '← My Events', path: '/participant/my-events', exact: true },
        { label: 'Overview', path: `/participant/events/${eventId}`, exact: true },
        { label: 'Submission', path: `/participant/events/${eventId}/submission` },
        { label: 'Announcements', path: `/participant/events/${eventId}/announcements` },
      ]
    : HOME_LINKS;

  const myTeam = event ? mockStorage.getTeams(event.id).find((t) => t.members?.some((m) => m.id === user?.id)) : undefined;
  const isSubmitted = myTeam?.submission?.status === 'submitted';

  const [countdown, setCountdown] = useState(() => (event ? getCountdown(event.ends_at) : null));
  useEffect(() => {
    if (!event) return setCountdown(null);
    setCountdown(getCountdown(event.ends_at));
    const interval = setInterval(() => setCountdown(getCountdown(event.ends_at)), 1000);
    return () => clearInterval(interval);
  }, [event?.ends_at]);

  // Submission status + deadline, only while inside a registered event.
  const deadlineBanner =
    event && myTeam && (myTeam.status ?? 'accepted') === 'accepted' && countdown ? (
      <div className="border-b border-blue-200 bg-blue-50/90 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {isSubmitted ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold font-mono text-[11px] w-fit">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              SUBMITTED: {myTeam.submission?.title}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 font-bold font-mono text-[11px] w-fit">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              PROJECT NOT SUBMITTED YET
            </span>
          )}
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5 text-blue-950 font-mono">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-600 uppercase text-[10px] tracking-wider font-semibold">Submission closes:</span>
              <span className="font-bold text-blue-900">
                {countdown.expired ? 'Closed' : `${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`}
              </span>
            </span>
            {!isSubmitted && !countdown.expired && (
              <Link
                to={`/participant/events/${event.id}/submission`}
                className="inline-flex items-center font-semibold text-blue-700 hover:text-blue-900 underline"
              >
                Submit Now
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    ) : undefined;

  return (
    <DashboardShell
      currentRole="participant"
      sidebarLinks={sidebarLinks}
      topBanner={
        <>
          <NotificationBanner userId={user?.id} />
          {deadlineBanner}
        </>
      }
    >
      <Outlet />
    </DashboardShell>
  );
}
