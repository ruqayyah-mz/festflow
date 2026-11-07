// Query and filter helpers shared across Web and Mobile
import { Task, Announcement, Event, RoleType } from './types';

export function filterAnnouncementsForRole(
  announcements: Announcement[],
  role: RoleType | 'all'
): Announcement[] {
  if (role === 'all') return announcements;
  return announcements.filter(
    (a) => a.audience === 'all' || a.audience === role || (role === 'participant' && a.audience === 'participants') || (role === 'volunteer' && a.audience === 'volunteers') || (role === 'sponsor' && a.audience === 'sponsors')
  );
}

export function calculateTaskStats(tasks: Task[]): {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  percentDone: number;
} {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const percentDone = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, inProgress, todo, percentDone };
}

export function formatTimeRemaining(endsAt: string): {
  isExpired: boolean;
  hours: number;
  minutes: number;
  label: string;
} {
  const diffMs = new Date(endsAt).getTime() - Date.now();
  if (diffMs <= 0) {
    return { isExpired: true, hours: 0, minutes: 0, label: 'Event Ended' };
  }
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    isExpired: false,
    hours,
    minutes,
    label: `${hours}h ${minutes}m remaining`,
  };
}

