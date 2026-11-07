import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { MobileStorage } from '../src/lib/storage';
import { supabase } from '../src/lib/supabase';
import { TasksWidget } from './TasksWidget';
import { OrganizerProgressWidget } from './OrganizerProgressWidget';
import { ParticipantAnnouncementsWidget } from './ParticipantAnnouncementsWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, clickAction, clickActionData } = props;

  // 1. Handle interactive checkbox clicks directly from Android home screen
  if (clickAction === 'TASK_MARK_DONE' && clickActionData?.taskId) {
    const taskId = clickActionData.taskId as string;
    try {
      // Optimistic update in local cache (works even when app is closed)
      const updatedTasks = await MobileStorage.updateTaskStatus(taskId, 'done');

      // Sync to Supabase if live connection is configured
      if (supabase) {
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'done',
            completed_at: new Date().toISOString(),
          })
          .eq('id', taskId);

        if (error) {
          console.warn('Widget task update Supabase sync error:', error);
          // Revert if persistent failure
        }
      }

      // Re-render Tasks widget with updated state
      const role = await MobileStorage.getActiveRole();
      props.renderWidget(
        <TasksWidget
          tasks={updatedTasks}
          roleTitle={role}
          isSmall={widgetInfo.width < 200}
        />
      );
      return;
    } catch (err) {
      console.error('Failed to handle headless widget task action:', err);
    }
  }

  // 2. Handle periodic widget update cycle or initial widget mount
  switch (widgetInfo.widgetName) {
    case 'TasksWidget': {
      const tasks = await MobileStorage.getTasks();
      const role = await MobileStorage.getActiveRole();
      props.renderWidget(
        <TasksWidget
          tasks={tasks}
          roleTitle={role}
          isSmall={widgetInfo.width < 200}
        />
      );
      break;
    }
    case 'OrganizerProgressWidget': {
      const tasks = await MobileStorage.getTasks();
      const completed = tasks.filter((t) => t.status === 'done').length;
      props.renderWidget(
        <OrganizerProgressWidget
          eventName="National Builder HackFest 2026"
          completedTasks={completed}
          totalTasks={tasks.length}
          participantCount={48}
        />
      );
      break;
    }
    case 'ParticipantAnnouncementsWidget': {
      const announcements = await MobileStorage.getAnnouncements();
      props.renderWidget(
        <ParticipantAnnouncementsWidget
          announcements={announcements}
          isMedium={widgetInfo.height > 100}
        />
      );
      break;
    }
  }
}

