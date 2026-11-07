import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardShell, DashboardNavLink } from '@/components/layout/DashboardShell';
import { NotificationBanner } from '@/components/layout/NotificationBanner';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';

const HOME_LINKS: DashboardNavLink[] = [
  { label: 'Browse Events', path: '/volunteer', exact: true },
  { label: 'My Events', path: '/volunteer/my-events' },
  { label: 'My Profile', path: '/volunteer/profile' },
];

export function VolunteerLayout() {
  const { user } = useAuth();
  // Inside an event, the sidebar becomes that event's workspace (mirrors OrganizerLayout).
  const eventId = useLocation().pathname.match(/^\/volunteer\/events\/([^/]+)/)?.[1];
  const sidebarLinks: DashboardNavLink[] = eventId
    ? [
        { label: '← My Events', path: '/volunteer/my-events', exact: true },
        { label: 'My Tasks', path: `/volunteer/events/${eventId}`, exact: true },
        { label: 'Announcements', path: `/volunteer/events/${eventId}/announcements` },
        { label: 'My Profile', path: `/volunteer/events/${eventId}/profile` },
      ]
    : HOME_LINKS;
  const [, setTick] = useState(0);
  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);

  return (
    <DashboardShell currentRole="volunteer" sidebarLinks={sidebarLinks} topBanner={<NotificationBanner userId={user?.id} />}>
      <Outlet />
    </DashboardShell>
  );
}
