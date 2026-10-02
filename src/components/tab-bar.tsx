import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouncy, type IconName } from '@/components/ui';
import { clayShadow, fonts, useColors } from '@/lib/theme';

const META: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'หน้าหลัก', icon: 'home-outline', iconActive: 'home' },
  transactions: { label: 'รายการ', icon: 'receipt-outline', iconActive: 'receipt' },
  scan: { label: 'สแกน', icon: 'scan', iconActive: 'scan' },
  subscriptions: { label: 'ซับฯ', icon: 'albums-outline', iconActive: 'albums' },
  coach: { label: 'โค้ช', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
};

/** Floating pill tab bar with a raised gradient scan button in the middle. */
export function CandyTabBar({ state, navigation }: BottomTabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, { backgroundColor: c.tabBar, boxShadow: clayShadow(c, true) }]}>
        {state.routes.map((route, index) => {
          const meta = META[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          const go = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (route.name === 'scan') {
            return (
              <Bouncy key={route.key} onPress={go} scaleTo={0.9} style={styles.scanWrap}>
                <LinearGradient
                  colors={['#FF9EC7', c.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.scan, { borderColor: c.tabBar, boxShadow: `0px 8px 18px ${c.shadow}` }]}>
                  <Ionicons name="scan" size={28} color="#FFFFFF" />
                </LinearGradient>
              </Bouncy>
            );
          }

          return (
            <Bouncy key={route.key} onPress={go} scaleTo={0.88} style={styles.item}>
              <View style={[styles.iconPill, focused && { backgroundColor: c.primarySoft }]}>
                <Ionicons name={focused ? meta.iconActive : meta.icon} size={22} color={focused ? c.primary : c.textMuted} />
              </View>
              <Text style={[styles.label, { color: focused ? c.primary : c.textMuted }]}>{meta.label}</Text>
            </Bouncy>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 480,
    borderRadius: 32,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 1 },
  iconPill: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999 },
  label: { fontSize: 11, lineHeight: 16, fontFamily: fonts.semibold },
  scanWrap: { flex: 1, alignItems: 'center', marginTop: -34 },
  scan: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    transform: [{ rotate: '-6deg' }],
  },
});
