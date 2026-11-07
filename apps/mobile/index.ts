// App entry point (package.json "main"). Things that must exist even when no screen is open
// (home-screen widget taps, background pushes) are registered here, at module scope.
import 'expo-router/entry';

import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { registerWidgetConfigurationScreen, registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widgets/widgetTaskHandler';
import { WidgetConfigurationScreen } from './widgets/WidgetConfigurationScreen';
import { BACKGROUND_NOTIFICATION_TASK } from './src/lib/notifications';
import { handleBackgroundNotification } from './src/lib/backgroundRefresh';

registerWidgetTaskHandler(widgetTaskHandler);
registerWidgetConfigurationScreen(WidgetConfigurationScreen); // "Which event?" picker when the Tasks widget is added

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, handleBackgroundNotification);
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch((err) =>
  console.warn('Could not register background notification task:', err)
);
