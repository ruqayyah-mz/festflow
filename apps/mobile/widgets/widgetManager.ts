import { requestWidgetUpdate } from 'react-native-android-widget';
import { MobileStorage } from '../src/lib/storage';
import { TasksWidget } from './TasksWidget';
import { OrganizerProgressWidget } from './OrganizerProgressWidget';
import { ParticipantAnnouncementsWidget } from './ParticipantAnnouncementsWidget';

export async function refreshAllWidgets() {
  try {
    const tasks = await MobileStorage.getTasks();
    const role = await MobileStorage.getActiveRole();
    const announcements = await MobileStorage.getAnnouncements();

    // 1. Refresh Tasks Widget
    await requestWidgetUpdate({
      widgetName: 'TasksWidget',
      renderWidget: () => (
        <TasksWidget tasks={tasks} roleTitle={role} isSmall={false} />
      ),
    });

    // 2. Refresh Organizer Progress Widget
    const completed = tasks.filter((t) => t.status === 'done').length;
    await requestWidgetUpdate({
      widgetName: 'OrganizerProgressWidget',
      renderWidget: () => (
        <OrganizerProgressWidget
          eventName="National Builder HackFest 2026"
          completedTasks={completed}
          totalTasks={tasks.length}
          participantCount={48}
        />
      ),
    });

    // 3. Refresh Participant Announcements Widget
    await requestWidgetUpdate({
      widgetName: 'ParticipantAnnouncementsWidget',
      renderWidget: () => (
        <ParticipantAnnouncementsWidget
          announcements={announcements}
          isMedium={true}
        />
      ),
    });
  } catch (err) {
    console.warn('Failed to request widget update:', err);
  }
}

