import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { MobileStorage } from '../src/lib/storage';
import { isLiveSupabase } from '../src/lib/supabase';
import { getCachedMyTasks } from '../src/lib/tasks';
import { TasksWidget, TasksWidgetState } from './TasksWidget';
import { OrganizerProgressWidget } from './OrganizerProgressWidget';
import { ParticipantAnnouncementsWidget } from './ParticipantAnnouncementsWidget';

/** The event a widget shows: the one picked when it was added, else the event open in the app. */
async function widgetEvent(widgetId?: number) {
  const picked = widgetId !== undefined ? (await MobileStorage.getWidgetEvents())[widgetId] : undefined;
  const events = await MobileStorage.getEvents();
  return events.find((e) => e.id === picked) ?? (await MobileStorage.getEvent());
}

async function myEventTasks(eventId?: string) {
  return (await getCachedMyTasks()).filter((t) => !eventId || t.event_id === eventId);
}

/** Builds the Tasks widget from the local cache (fast; safe to call from a headless task). */
export async function buildTasksWidget(widthDp: number, state: TasksWidgetState = 'ok', widgetId?: number) {
  const event = await widgetEvent(widgetId);
  const signedIn = Boolean(await MobileStorage.getUser()); // local only: the widget must redraw without network
  const pending = await MobileStorage.getPendingTaskOps();
  const effectiveState: TasksWidgetState =
    isLiveSupabase && !signedIn ? 'signed_out' : state === 'ok' && pending.length ? 'offline' : state;
  return (
    <TasksWidget
      tasks={await myEventTasks(event?.id)}
      title={event?.name ?? 'My tasks'}
      state={effectiveState}
      syncedAt={await MobileStorage.getTasksSyncedAt()}
      isSmall={widthDp < 200}
    />
  );
}

export async function buildProgressWidget(widgetId?: number) {
  const event = await widgetEvent(widgetId);
  const tasks = await myEventTasks(event?.id);
  return (
    <OrganizerProgressWidget
      eventName={event?.name ?? 'No event yet'}
      completedTasks={tasks.filter((t) => t.status === 'done').length}
      totalTasks={tasks.length}
    />
  );
}

export async function buildAnnouncementsWidget(heightDp: number, widgetId?: number) {
  const event = await widgetEvent(widgetId);
  const all = await MobileStorage.getAnnouncements();
  return (
    <ParticipantAnnouncementsWidget
      announcements={event ? all.filter((a) => a.event_id === event.id) : all}
      eventName={event?.name}
      isMedium={heightDp > 100}
    />
  );
}

/** Re-renders the Tasks widget only (call after any task change inside the app). */
export async function refreshTasksWidget(state: TasksWidgetState = 'ok') {
  try {
    await requestWidgetUpdate({
      widgetName: 'TasksWidget',
      renderWidget: (info) => buildTasksWidget(info.width, state, info.widgetId),
      widgetNotFound: () => undefined, // no widget on the home screen; nothing to do
    });
  } catch (err) {
    console.warn('Failed to update Tasks widget:', err);
  }
}

export async function refreshAllWidgets() {
  await refreshTasksWidget();
  try {
    await requestWidgetUpdate({
      widgetName: 'OrganizerProgressWidget',
      renderWidget: (info) => buildProgressWidget(info.widgetId),
      widgetNotFound: () => undefined,
    });
    await requestWidgetUpdate({
      widgetName: 'ParticipantAnnouncementsWidget',
      renderWidget: (info) => buildAnnouncementsWidget(info.height, info.widgetId),
      widgetNotFound: () => undefined,
    });
  } catch (err) {
    console.warn('Failed to request widget update:', err);
  }
}
