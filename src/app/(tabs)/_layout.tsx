import { Tabs } from 'expo-router/js-tabs';

import { CandyTabBar } from '@/components/tab-bar';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CandyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="subscriptions" />
      <Tabs.Screen name="coach" />
    </Tabs>
  );
}
