import { Mali_400Regular, Mali_500Medium, Mali_600SemiBold, Mali_700Bold, useFonts } from '@expo-google-fonts/mali';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { rescheduleRenewalReminders } from '@/lib/notifications';
import { StoreProvider, useStore } from '@/lib/store';
import { fonts, useColors, useIsDark } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { state } = useStore();
  const c = useColors();
  const [fontsLoaded, fontError] = useFonts({ Mali_400Regular, Mali_500Medium, Mali_600SemiBold, Mali_700Bold });
  const ready = state.ready && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (state.ready) rescheduleRenewalReminders(state.subscriptions).catch(() => {});
  }, [state.ready, state.subscriptions]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerShadowVisible: false,
        headerTintColor: c.primary,
        headerTitleStyle: { fontFamily: fonts.bold, color: c.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: c.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/new" options={{ presentation: 'modal', title: 'เพิ่มรายจ่าย ✍️' }} />
      <Stack.Screen name="subscription/new" options={{ presentation: 'modal', title: 'ซับสคริปชัน' }} />
      <Stack.Screen name="subscription/[id]" options={{ title: '' }} />
      <Stack.Screen name="subscription/review" options={{ presentation: 'modal', title: 'ปัดเลือก ปัดทิ้ง 💘' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const dark = useIsDark();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
        <StoreProvider>
          <AppStack />
        </StoreProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
