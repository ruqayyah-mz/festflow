import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { MobileStorage } from './storage';

// Background task name; defined in apps/mobile/index.ts (must be registered at the JS entry, not in a screen).
export const BACKGROUND_NOTIFICATION_TASK = 'festflow-background-notification';

// Foreground behaviour: show real notifications, stay silent for data-only "widget-refresh" pushes.
Notifications.setNotificationHandler({
  handleNotification: async (n) => {
    const silent = !n.request.content.title && !n.request.content.body;
    return {
      shouldShowAlert: !silent,
      shouldPlaySound: !silent,
      shouldSetBadge: false,
    };
  },
});

function easProjectId(): string | null {
  const id =
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ?? Constants.easConfig?.projectId ?? null;
  // app.json ships with a placeholder; `eas init` writes the real UUID.
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

/**
 * Asks for notification permission, gets an Expo push token and stores it in public.device_tokens.
 * The `push-notifications` edge function sends to these tokens through Expo's push service (which uses FCM).
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  // Channel id must match `channelId` sent by the edge function.
  await Notifications.setNotificationChannelAsync('tasks', {
    name: 'Task assignments',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1d4ed8',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  await Notifications.setNotificationChannelAsync('default', {
    name: 'FestFlow alerts',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId = easProjectId();
  if (!projectId) {
    console.warn('Push disabled: run `eas init` so app.json has a real extra.eas.projectId');
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data; // ExponentPushToken[...]
    await MobileStorage.setPushToken(token);

    if (supabase && userId) {
      const { error } = await supabase.from('device_tokens').upsert(
        {
          user_id: userId,
          fcm_token: token,
          provider: 'expo',
          platform: 'android',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,fcm_token' }
      );
      if (error) console.warn('Could not save push token:', error.message);
    }
    return token;
  } catch (err) {
    console.warn('Failed to get push token:', err);
    return null;
  }
}

export async function unregisterPushNotificationAsync(userId: string): Promise<void> {
  const token = await MobileStorage.getPushToken();
  if (supabase && userId && token) {
    await supabase.from('device_tokens').delete().match({ user_id: userId, fcm_token: token });
  }
}

/**
 * - Tapping a notification opens the matching screen.
 * - A task push arriving while the app is open refreshes the task list + widget.
 */
export function setupNotificationListeners(onDeepLink: (url: string) => void, onTaskPush: () => void) {
  const tapped = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = response.notification.request.content.data as Record<string, string> | undefined;
    // Open the notification's event, not whichever one was last selected.
    const evt = data?.event_id && (await MobileStorage.getEvents()).find((e) => e.id === data.event_id);
    if (evt) await MobileStorage.setEvent(evt);
    if (data?.type === 'task') onTaskPush();
    if (data?.url) onDeepLink(data.url);
    else if (data?.type === 'announcement' && data?.id) onDeepLink(`festflow://announcement/${data.id}`);
    else if (data?.type === 'task' && data?.id) onDeepLink(`festflow://task/${data.id}`);
  });

  const received = Notifications.addNotificationReceivedListener((n) => {
    const type = (n.request.content.data as Record<string, string> | undefined)?.type;
    if (type === 'task' || type === 'announcement' || type === 'widget-refresh') onTaskPush();
  });

  return () => {
    tapped.remove();
    received.remove();
  };
}
