import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mascot } from '@/components/mascot';
import type { MascotMood } from '@/lib/mascot';
import { clayShadow, fonts, radius, space, toneColors, useColors, type Tone } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Space reserved at the bottom of tab screens for the floating tab bar. */
export const TAB_BAR_CLEARANCE = 120;

export function tapFeedback(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => {});
}

export function Screen({
  children,
  scroll = true,
  safeTop = true,
  tabBar = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** Pass false on stack screens that already render a header. */
  safeTop?: boolean;
  /** Leave room for the floating tab bar. */
  tabBar?: boolean;
}) {
  const c = useColors();
  const padBottom = tabBar && safeTop ? TAB_BAR_CLEARANCE : 48;
  return (
    <View style={{ flex: 1, backgroundColor: c.background, overflow: 'hidden' }}>
      {/* soft candy blobs behind content */}
      <View pointerEvents="none" style={[styles.blob, { backgroundColor: c.primarySoft, top: -120, right: -90 }]} />
      <View
        pointerEvents="none"
        style={[styles.blob, { backgroundColor: c.pinkSoft, top: 220, left: -150, width: 260, height: 260 }]}
      />
      <SafeAreaView edges={safeTop ? ['top'] : []} style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.screenContent, { paddingBottom: padBottom }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.screenContent, { flex: 1, paddingBottom: 0 }]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

export function T({
  children,
  variant = 'body',
  muted,
  color,
  style,
  numberOfLines,
  onPress,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: TextVariant;
  muted?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const c = useColors();
  return (
    <Text
      numberOfLines={numberOfLines}
      onPress={onPress}
      style={[styles[variant], { color: color ?? (muted ? c.textMuted : c.text) }, style]}>
      {children}
    </Text>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that squishes on touch, with a light haptic tap. */
export function Bouncy({
  children,
  onPress,
  onLongPress,
  style,
  disabled,
  scaleTo = 0.96,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleTo?: number;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={
        onPress &&
        (() => {
          tapFeedback();
          onPress();
        })
      }
      onLongPress={onLongPress}
      onPressIn={() => scale.set(withSpring(scaleTo, { damping: 15, stiffness: 400 }))}
      onPressOut={() => scale.set(withSpring(1, { damping: 10, stiffness: 300 }))}
      style={[animated, style]}>
      {children}
    </AnimatedPressable>
  );
}

export function Card({
  children,
  style,
  onPress,
  tone,
  gradient,
  lifted,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: Tone;
  /** Two or more colors for a candy gradient background. */
  gradient?: readonly [string, string, ...string[]];
  lifted?: boolean;
}) {
  const c = useColors();
  const bg = tone ? toneColors(c, tone).bg : c.card;
  const shell: StyleProp<ViewStyle> = [styles.card, { backgroundColor: bg, boxShadow: clayShadow(c, lifted) }, style];
  const content = gradient ? (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={shell}>
      {children}
    </LinearGradient>
  ) : (
    <View style={shell}>{children}</View>
  );
  if (!onPress) return content;
  return <Bouncy onPress={onPress}>{content}</Bouncy>;
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Row style={{ marginTop: space.xl, marginBottom: space.md, justifyContent: 'space-between' }}>
      <T variant="heading">{children}</T>
      {action}
    </Row>
  );
}

/** Emoji on a pastel squircle — used for categories. */
export function EmojiTile({ emoji, bg, size = 44 }: { emoji: string; bg: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.36,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

/** Colored letter badge standing in for a service logo. */
export function Sticker({ label, color, size = 48 }: { label: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-4deg' }],
        boxShadow: `0px 4px 0px rgba(0,0,0,0.15), inset 0px 2px 0px rgba(255,255,255,0.35)`,
      }}>
      <Text style={{ color: '#FFFFFF', fontFamily: fonts.bold, fontSize: size * 0.42, lineHeight: size * 0.6 }}>
        {label.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

export function Pill({
  label,
  tone,
  emoji,
  style,
}: {
  label: string;
  tone: Tone;
  emoji?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const t = toneColors(c, tone);
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.pillText, { color: t.fg }]}>
        {emoji ? `${emoji} ` : ''}
        {label}
      </Text>
    </View>
  );
}

export function ProgressBar({ value, colors, height = 12 }: { value: number; colors: readonly [string, string]; height?: number }) {
  const c = useColors();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: c.cardMuted, overflow: 'hidden' }}>
      {pct > 0 && (
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${Math.max(pct, 6)}%`, height: '100%', borderRadius: height }}
        />
      )}
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'mint';

/** Chunky 3D candy button: a darker base sits under the face and the face sinks when pressed. */
export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  loading,
  disabled,
  style,
  size = 'md',
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}) {
  const c = useColors();
  const scheme: Record<ButtonVariant, { face: string; base: string; fg: string; border?: string }> = {
    primary: { face: c.primary, base: c.primaryDeep, fg: c.onPrimary },
    mint: { face: c.mint, base: '#1FA578', fg: '#FFFFFF' },
    danger: { face: c.dangerSoft, base: c.danger, fg: c.danger },
    secondary: { face: c.card, base: c.border, fg: c.text, border: c.border },
  };
  const s = scheme[variant];
  const depth = 4;
  const press = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value * depth }] }));
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      disabled={inactive}
      onPressIn={() => press.set(withSpring(1, { damping: 20, stiffness: 600 }))}
      onPressOut={() => press.set(withSpring(0, { damping: 12, stiffness: 400 }))}
      onPress={() => {
        tapFeedback(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}>
      <View style={{ borderRadius: radius.md, backgroundColor: s.base, paddingBottom: depth }}>
        <Animated.View
          style={[
            styles.buttonFace,
            size === 'sm' && styles.buttonFaceSm,
            { backgroundColor: s.face, borderColor: s.border ?? s.face },
            faceStyle,
          ]}>
          {loading ? (
            <ActivityIndicator color={s.fg} />
          ) : (
            <>
              {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={s.fg} />}
              <Text style={[styles.buttonText, size === 'sm' && { fontSize: 14 }, { color: s.fg }]}>{label}</Text>
            </>
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ marginBottom: space.lg }}>
      <T variant="label" muted style={{ marginBottom: space.xs, marginLeft: space.xs }}>
        {label}
      </T>
      <TextInput
        placeholderTextColor={c.textMuted}
        {...props}
        style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
      />
    </View>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; emoji?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Bouncy
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? c.primary : c.card,
                borderColor: active ? c.primaryDeep : c.border,
                boxShadow: active ? `0px 3px 0px ${c.primaryDeep}` : `0px 3px 0px ${c.border}`,
              },
            ]}>
            <Text style={{ color: active ? c.onPrimary : c.text, fontSize: 13.5, fontFamily: fonts.semibold }}>
              {o.emoji ? `${o.emoji} ` : ''}
              {o.label}
            </Text>
          </Bouncy>
        );
      })}
    </View>
  );
}

/** Rounded speech bubble with a tail pointing left (towards the mascot). */
export function SpeechBubble({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <View style={[{ flex: 1, justifyContent: 'center' }, style]}>
      <View style={[styles.bubble, { backgroundColor: c.card, boxShadow: clayShadow(c) }]}>
        {typeof children === 'string' ? <T style={{ lineHeight: 22 }}>{children}</T> : children}
      </View>
      <View style={[styles.bubbleTail, { backgroundColor: c.card }]} />
    </View>
  );
}

export function EmptyState({ mood = 'thinking', title, hint }: { mood?: MascotMood; title: string; hint?: string }) {
  return (
    <View style={{ alignItems: 'center', padding: space.xl, gap: space.sm }}>
      <Mascot mood={mood} size={110} />
      <T variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </T>
      {hint && (
        <T muted style={{ textAlign: 'center' }}>
          {hint}
        </T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { padding: space.lg + 4 },
  blob: { position: 'absolute', width: 320, height: 320, borderRadius: 999, opacity: 0.7 },
  display: { fontSize: 40, lineHeight: 54, fontFamily: fonts.bold, letterSpacing: -0.5 },
  title: { fontSize: 28, lineHeight: 40, fontFamily: fonts.bold },
  heading: { fontSize: 18, lineHeight: 28, fontFamily: fonts.bold },
  body: { fontSize: 15, lineHeight: 23, fontFamily: fonts.medium },
  label: { fontSize: 13, lineHeight: 19, fontFamily: fonts.semibold },
  caption: { fontSize: 12.5, lineHeight: 18, fontFamily: fonts.medium },
  card: { borderRadius: radius.lg, padding: space.lg + 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, lineHeight: 18, fontFamily: fonts.bold },
  buttonFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 13,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  buttonFaceSm: { paddingVertical: 7, paddingHorizontal: space.md },
  buttonText: { fontSize: 16, lineHeight: 24, fontFamily: fonts.bold },
  input: {
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 2 },
  bubble: { borderRadius: radius.md, padding: space.md + 2, borderBottomLeftRadius: 6 },
  bubbleTail: {
    position: 'absolute',
    left: -6,
    bottom: 14,
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
});
