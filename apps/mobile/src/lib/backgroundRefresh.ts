// Runs when a push arrives while the app is in the background or closed (Android delivers the
// edge function's data-only "widget-refresh" message here). Pulls new tasks + announcements and redraws
// the widgets, so they update on the home screen without opening the app.
import type { TaskManagerTaskBody } from 'expo-task-manager';
import { syncMyTasks } from './tasks';
import { syncAllAnnouncements } from './events';
import { refreshAllWidgets, refreshTasksWidget } from '../../widgets/widgetManager';

/** Tasks + the active event's announcements -> cache -> every widget. Shared by app, push and widget. */
export async function refreshEverything(): Promise<void> {
  try {
    await syncMyTasks();
    await syncAllAnnouncements();
    await refreshAllWidgets();
  } catch {
    await refreshTasksWidget('offline'); // cached data stays; pending ticks retry on the next refresh
  }
}

export async function handleBackgroundNotification({ error }: TaskManagerTaskBody<unknown>): Promise<void> {
  if (error) {
    console.warn('Background notification task error:', error.message);
    return;
  }
  await refreshEverything();
}
