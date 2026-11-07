import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { DashboardShell, DashboardNavLink } from '@/components/layout/DashboardShell';
import { NotificationBanner } from '@/components/layout/NotificationBanner';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';

export function OrganizerLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const [, setTick] = useState(0);
  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);
  const path = location.pathname;

  // Extract eventId when inside a specific event workspace
  const eventMatch = path.match(/\/organizer\/events\/([^/]+)/);
  const eventId = eventMatch && eventMatch[1] !== 'new' ? eventMatch[1] : null;

  const isInsideEvent = Boolean(eventId);

  // Exact uppercase names on sidebar as requested:
  // OVERVIEW, VOLUNTEERS, PARTICIPANTS, JUDGING, SPONSORSHIPS, ANNOUNCEMENTS
  const sidebarLinks: DashboardNavLink[] = isInsideEvent
    ? [
        { label: '← ALL EVENTS', path: '/organizer', exact: true },
        { label: 'OVERVIEW', path: `/organizer/events/${eventId}`, exact: true },
        { label: 'VOLUNTEERS', path: `/organizer/events/${eventId}/volunteers` },
        { label: 'PARTICIPANTS', path: `/organizer/events/${eventId}/participants` },
        { label: 'JUDGING', path: `/organizer/events/${eventId}/judging` },
        { label: 'SPONSORSHIPS', path: `/organizer/events/${eventId}/sponsorships` },
        { label: 'SPONSOR MARKETPLACE', path: `/organizer/events/${eventId}/sponsor-marketplace` },
        { label: 'ANNOUNCEMENTS', path: `/organizer/events/${eventId}/announcements` },
      ]
    : [
        { label: 'OVERVIEW', path: '/organizer', exact: true },
        { label: 'SPONSOR MARKETPLACE', path: '/organizer/sponsorship-marketplace' },
        { label: '+ CREATE EVENT', path: '/organizer/events/new' },
      ];

  return (
    <DashboardShell
      currentRole="organizer"
      sidebarLinks={sidebarLinks}
      topBanner={<NotificationBanner userId={user?.id} />}
    >
      <Outlet />
    </DashboardShell>
  );
}
