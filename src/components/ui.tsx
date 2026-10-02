import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, space, useColors } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  scroll = true,
  safeTop = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** Pass false on stack screens that already render a header. */
  safeTop?: boolean;
}) {
  const c = useColors();
  return (
    <SafeAreaView edges={safeTop ? ['top'] : []} style={{ flex: 1, backgroundColor: c.background }}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screenContent, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

type TextVariant = 'title' | 'heading' | 'body' | 'caption' | 'money';

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

export function Card({
  children,
  style,
  onPress,
  tone,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'primary' | 'danger' | 'warning' | 'success';
}) {
  const c = useColors();
  const bg = tone ? c[`${tone}Soft`] : c.card;
  const content = (
    <View style={[styles.card, { backgroundColor: bg, borderColor: tone ? bg : c.border }, style]}>
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.75 }}>
      {content}
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Row style={{ marginTop: space.lg, marginBottom: space.sm, justifyContent: 'space-between' }}>
      <T variant="heading">{children}</T>
      {action}
    </Row>
  );
}

export function IconBubble({ name, color, size = 40 }: { name: IconName; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${color}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={name} size={size * 0.5} color={color} />
    </View>
  );
}

export function Pill({ label, tone }: { label: string; tone: 'danger' | 'warning' | 'success' | 'primary' }) {
  const c = useColors();
  return (
    <View style={[styles.pill, { backgroundColor: c[`${tone}Soft`] }]}>
      <Text style={[styles.pillText, { color: c[tone] }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color: string }) {
  const c = useColors();
  return (
    <View style={[styles.progressTrack, { backgroundColor: c.cardMuted }]}>
      <View
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 4,
        }}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const bg = variant === 'primary' ? c.primary : variant === 'danger' ? c.dangerSoft : c.cardMuted;
  const fg = variant === 'primary' ? c.onPrimary : variant === 'danger' ? c.danger : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ marginBottom: space.md }}>
      <T variant="caption" muted style={{ marginBottom: space.xs }}>
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
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.chip,
              { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.border },
            ]}>
            <Text style={{ color: active ? c.onPrimary : c.text, fontSize: 13, fontWeight: '600' }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', padding: space.xl, gap: space.sm }}>
      <Ionicons name={icon} size={40} color={c.textMuted} />
      <T variant="heading">{title}</T>
      {hint && (
        <T muted style={{ textAlign: 'center' }}>
          {hint}
        </T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { padding: space.lg, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800' },
  heading: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 16 },
  money: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  card: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
});
