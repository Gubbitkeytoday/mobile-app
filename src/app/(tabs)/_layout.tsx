import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { Platform } from 'react-native';

import type { IconName } from '@/components/ui';
import { useColors } from '@/lib/theme';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'ภาพรวม', icon: 'pie-chart-outline' },
  { name: 'transactions', title: 'รายการ', icon: 'list-outline' },
  { name: 'scan', title: 'สแกนสลิป', icon: 'scan-outline' },
  { name: 'subscriptions', title: 'ซับสคริปชัน', icon: 'repeat-outline' },
  { name: 'coach', title: 'AI Coach', icon: 'sparkles-outline' },
];

export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor: c.border,
          // Native tab bars size themselves around the safe area; web needs room for Thai labels.
          ...(Platform.OS === 'web' && { height: 64, paddingBottom: 8 }),
        },
        // Thai vowels/tone marks need extra line height or they get clipped.
        tabBarLabelStyle: { fontSize: 11, lineHeight: 16 },
      }}>
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
