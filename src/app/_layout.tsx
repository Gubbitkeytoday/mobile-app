import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { rescheduleRenewalReminders } from '@/lib/notifications';
import { StoreProvider, useStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

function ReminderSync() {
  const { state } = useStore();
  useEffect(() => {
    if (!state.ready) return;
    SplashScreen.hideAsync();
    rescheduleRenewalReminders(state.subscriptions).catch(() => {});
  }, [state.ready, state.subscriptions]);
  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StoreProvider>
        <ReminderSync />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="transaction/new" options={{ presentation: 'modal', title: 'เพิ่มรายจ่าย' }} />
          <Stack.Screen name="subscription/new" options={{ presentation: 'modal', title: 'เพิ่มซับสคริปชัน' }} />
          <Stack.Screen name="subscription/[id]" options={{ title: 'รายละเอียด' }} />
        </Stack>
      </StoreProvider>
    </ThemeProvider>
  );
}
