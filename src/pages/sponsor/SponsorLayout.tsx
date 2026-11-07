import { Outlet } from 'react-router-dom';
import { DashboardShell, DashboardNavLink } from '@/components/layout/DashboardShell';

const SPONSOR_LINKS: DashboardNavLink[] = [
  { label: 'Browse Events', path: '/sponsor', exact: true },
  { label: 'My Applications', path: '/sponsor/applications' },
  { label: 'Tasks', path: '/sponsor/tasks' },
];

export function SponsorLayout() {
  return (
    <DashboardShell
      currentRole="sponsor"
      sidebarLinks={SPONSOR_LINKS}
    >
      <Outlet />
    </DashboardShell>
  );
}

