// Runs as an Android headless JS task: the widget can be ticked while the app is fully closed.
// Registered in apps/mobile/index.ts (the app entry), NOT inside a screen, so it exists without any UI.
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { MobileStorage, TaskStatus } from '../src/lib/storage';
import { setTaskStatus, syncMyTasks } from '../src/lib/tasks';
import { syncAllAnnouncements } from '../src/lib/events';
import { buildAnnouncementsWidget, buildProgressWidget, buildTasksWidget } from './widgetManager';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

async function handleTasksWidget(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, clickAction, clickActionData } = props;
  const width = widgetInfo.width;
  const id = widgetInfo.widgetId;

  if (widgetAction === 'WIDGET_CLICK' && clickAction === 'TOGGLE_TASK') {
    const taskId = String(clickActionData?.taskId ?? '');
    const status = clickActionData?.status as TaskStatus;
    if (!taskId || !STATUSES.includes(status)) return;

    // 1. Instant feedback: tick the box locally before any network call.
    await MobileStorage.updateTaskStatus(taskId, status);
    props.renderWidget(await buildTasksWidget(width, 'saving', id));

    // 2. Write through to Supabase (queued if offline), then show the result.
    try {
      const { queued } = await setTaskStatus(taskId, status);
      props.renderWidget(await buildTasksWidget(width, queued ? 'offline' : 'ok', id));
    } catch (err) {
      console.warn('Widget tick rejected:', err);
      props.renderWidget(await buildTasksWidget(width, 'error', id));
    }
    return;
  }

  // WIDGET_ADDED / WIDGET_UPDATE (periodic) / WIDGET_RESIZED: show cache now, then refresh from Supabase.
  props.renderWidget(await buildTasksWidget(width, 'ok', id));
  try {
    await syncMyTasks();
    props.renderWidget(await buildTasksWidget(width, 'ok', id));
  } catch {
    props.renderWidget(await buildTasksWidget(width, 'offline', id));
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction } = props;
  const id = widgetInfo.widgetId;

  if (widgetAction === 'WIDGET_DELETED') {
    await MobileStorage.setWidgetEvent(id, null);
    return;
  }

  switch (widgetInfo.widgetName) {
    case 'TasksWidget':
      await handleTasksWidget(props);
      break;

    case 'OrganizerProgressWidget':
      props.renderWidget(await buildProgressWidget(id));
      await syncMyTasks().then(async () => props.renderWidget(await buildProgressWidget(id)), () => undefined);
      break;

    case 'ParticipantAnnouncementsWidget':
      props.renderWidget(await buildAnnouncementsWidget(widgetInfo.height, id)); // cache first
      await syncAllAnnouncements().then(
        async () => props.renderWidget(await buildAnnouncementsWidget(widgetInfo.height, id)),
        () => undefined
      );
      break;
  }
}
