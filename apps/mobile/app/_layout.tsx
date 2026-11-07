import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setupNotificationListeners } from '../src/lib/notifications';
import { refreshEverything } from '../src/lib/backgroundRefresh';

// The widget handler and background push task are registered in /index.ts (app entry) so they
// also work when no screen is mounted.


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
    }, refreshEverything);

    // Coming back to the app: replay offline ticks and pull anything assigned meanwhile.
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshEverything();
    });

    return () => {
      unsubscribe();
      appState.remove();
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
        <Stack.Screen name="task/[id]" />
        <Stack.Screen name="settings/widgets" options={{ presentation: 'card', headerShown: true, title: 'Add Home Screen Widgets' }} />
      </Stack>
    </>
  );
}

