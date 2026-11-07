import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  // Set up Android notification channel
  await Notifications.setNotificationChannelAsync('default', {
    name: 'FestFlow Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1d4ed8',
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;

    // Persist token to Supabase device_tokens table
    if (supabase && userId) {
      await supabase.from('device_tokens').upsert(
        {
          user_id: userId,
          fcm_token: token,
          platform: 'android',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,fcm_token' }
      );
    }

    return token;
  } catch (err) {
    console.warn('Failed to retrieve push token:', err);
    return null;
  }
}

export async function unregisterPushNotificationAsync(userId: string, token: string): Promise<void> {
  if (supabase && userId && token) {
    await supabase.from('device_tokens').delete().match({
      user_id: userId,
      fcm_token: token,
    });
  }
}

export function setupNotificationListeners(onDeepLink: (url: string) => void) {
  // Listener for user tapping notification in system tray or lock screen
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.url) {
      onDeepLink(data.url);
    } else if (data?.type === 'announcement' && data?.id) {
      onDeepLink(`festflow://announcement/${data.id}`);
    } else if (data?.type === 'task' && data?.id) {
      onDeepLink(`festflow://task/${data.id}`);
    }
  });

  return () => {
    subscription.remove();
  };
}

