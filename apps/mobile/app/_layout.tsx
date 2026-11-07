import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from '../widgets/widgetTaskHandler';
import { setupNotificationListeners } from '../src/lib/notifications';

// Register Android home screen widget headless task handler
registerWidgetTaskHandler(widgetTaskHandler);

export default function RootLayout() {
  useEffect(() => {
    // Handle notification clicks from lockscreen or notification drawer
    const unsubscribe = setupNotificationListeners((deepLinkUrl) => {
      if (deepLinkUrl.startsWith('festflow://announcement/')) {
        router.push('/(tabs)/announcements');
      } else if (deepLinkUrl.startsWith('festflow://task/')) {
        router.push('/(tabs)/tasks');
      } else if (deepLinkUrl.startsWith('festflow://tasks')) {
        router.push('/(tabs)/tasks');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="invite/[token]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/widgets" options={{ presentation: 'card', headerShown: true, title: 'Add Home Screen Widgets' }} />
      </Stack>
    </>
  );
}

