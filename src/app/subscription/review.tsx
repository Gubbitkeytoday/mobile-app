import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { STATUS_META } from '@/components/finance';
import { Mascot } from '@/components/mascot';
import { Bouncy, Button, Card, Pill, Row, Screen, Sticker, T, tapFeedback } from '@/components/ui';
import { auditAll, type SubscriptionAudit } from '@/lib/audit';
import { todayISO } from '@/lib/dates';
import { formatTHB } from '@/lib/format';
import { useStore } from '@/lib/store';
import { serviceColor } from '@/lib/subscription-catalog';
import { clayShadow, fonts, radius, space, useColors } from '@/lib/theme';

type Decision = 'keep' | 'cancel';

/** Tinder-style deck: swipe right to keep a subscription, left to cancel it. */
export default function ReviewScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const { state, dispatch } = useStore();
  // Snapshot the deck once so cards don't disappear mid-review as we cancel them.
  const [deck] = useState<SubscriptionAudit[]>(() =>
    auditAll(state.subscriptions, todayISO()).audits.filter((a) => a.status === 'unused' || a.status === 'underused'),
  );
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(0);

  const x = useSharedValue(0);
  const threshold = Math.min(width * 0.28, 140);

  const decide = (decision: Decision) => {
    const card = deck[index];
    if (!card) return;
    if (decision === 'cancel') {
      dispatch({ type: 'upsertSubscription', subscription: { ...card.subscription, cancelled: true } });
      setSaved((s) => s + card.monthlyCost);
      tapFeedback(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      tapFeedback();
    }
    x.set(0);
    setIndex((i) => i + 1);
  };

  const fling = (decision: Decision) => {
    x.set(
      withTiming(decision === 'keep' ? width * 1.3 : -width * 1.3, { duration: 220 }, (done) => {
        if (done) scheduleOnRN(decide, decision);
      }),
    );
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      x.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > threshold) {
        x.value = withTiming(width * 1.3, { duration: 200 }, () => scheduleOnRN(decide, 'keep'));
      } else if (e.translationX < -threshold) {
        x.value = withTiming(-width * 1.3, { duration: 200 }, () => scheduleOnRN(decide, 'cancel'));
      } else {
        x.value = withSpring(0, { damping: 14 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { rotate: `${interpolate(x.value, [-width, width], [-18, 18])}deg` }],
  }));
  const keepStamp = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, threshold], [0, 1], 'clamp') }));
  const byeStamp = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-threshold, 0], [1, 0], 'clamp') }));
  const nextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(Math.abs(x.value), [0, threshold], [0.92, 1], 'clamp') }],
  }));

  const total = useMemo(() => deck.reduce((s, a) => s + a.monthlyCost, 0), [deck]);
  const current = deck[index];
  const next = deck[index + 1];

  if (!current) {
    return (
      <Screen safeTop={false} tabBar={false}>
        <Animated.View entering={ZoomIn.springify()} style={{ alignItems: 'center', gap: space.md, marginTop: space.xl }}>
          <Mascot mood={saved > 0 ? 'excited' : 'happy'} size={160} />
          <T variant="title" style={{ textAlign: 'center' }}>
            {deck.length === 0 ? 'ไม่มีตัวไหนต้องตัดสินใจ 🎉' : saved > 0 ? 'เย้! กระปุกอ้วนขึ้นแล้ว' : 'ตัดสินใจครบแล้ว!'}
          </T>
          {saved > 0 && (
            <Card tone="mint" style={{ alignItems: 'center', alignSelf: 'stretch' }}>
              <T variant="caption" muted>
                ประหยัดได้
              </T>
              <T variant="display" color={c.mint}>
                {formatTHB(Math.round(saved))}
              </T>
              <T muted>ต่อเดือน = {formatTHB(Math.round(saved * 12))} ต่อปี 🫙</T>
            </Card>
          )}
          <T muted style={{ textAlign: 'center' }}>
            อย่าลืมไปกดยกเลิกที่ผู้ให้บริการด้วยนะ แอปไม่ได้ยกเลิกให้อัตโนมัติ
          </T>
          <Button label="กลับหน้าหลัก" icon="home" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen safeTop={false} tabBar={false} scroll={false}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="label" muted>
          {index + 1} / {deck.length}
        </T>
        <Pill tone="mint" emoji="🫙" label={`ประหยัดแล้ว ${formatTHB(Math.round(saved))}/ด.`} />
      </Row>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {next && (
          <Animated.View style={[styles.cardBase, { backgroundColor: c.card, boxShadow: clayShadow(c) }, nextStyle]}>
            <DeckCardBody audit={next} />
          </Animated.View>
        )}
        <GestureDetector gesture={pan}>
          <Animated.View
            key={current.subscription.id}
            style={[styles.cardBase, { backgroundColor: c.card, boxShadow: clayShadow(c, true) }, cardStyle]}>
            <DeckCardBody audit={current} />
            <Animated.View style={[styles.stamp, styles.stampKeep, { borderColor: c.mint }, keepStamp]}>
              <Text style={[styles.stampText, { color: c.mint }]}>เก็บไว้ 💖</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.stampBye, { borderColor: c.danger }, byeStamp]}>
              <Text style={[styles.stampText, { color: c.danger }]}>บ๊ายบาย 👋</Text>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>

      <Row style={{ justifyContent: 'center', gap: space.xxl, paddingBottom: space.xl }}>
        <Bouncy onPress={() => fling('cancel')} scaleTo={0.85}>
          <View style={[styles.round, { backgroundColor: c.dangerSoft, boxShadow: clayShadow(c) }]}>
            <Text style={{ fontSize: 30 }}>👋</Text>
          </View>
          <T variant="caption" muted style={{ textAlign: 'center', marginTop: 4 }}>
            ยกเลิก
          </T>
        </Bouncy>
        <Bouncy onPress={() => fling('keep')} scaleTo={0.85}>
          <View style={[styles.round, { backgroundColor: c.mintSoft, boxShadow: clayShadow(c) }]}>
            <Text style={{ fontSize: 30 }}>💖</Text>
          </View>
          <T variant="caption" muted style={{ textAlign: 'center', marginTop: 4 }}>
            เก็บไว้
          </T>
        </Bouncy>
      </Row>
      <T variant="caption" muted style={{ textAlign: 'center', marginBottom: space.lg }}>
        ทั้งหมด {formatTHB(Math.round(total))}/เดือน ที่อาจไม่คุ้ม
      </T>
    </Screen>
  );
}

function DeckCardBody({ audit }: { audit: SubscriptionAudit }) {
  const c = useColors();
  const sub = audit.subscription;
  const status = STATUS_META[audit.status];
  return (
    <View style={{ alignItems: 'center', gap: space.md, flex: 1, justifyContent: 'center' }}>
      <Sticker label={sub.name} color={serviceColor(sub.name)} size={84} />
      <T variant="title" style={{ textAlign: 'center' }}>
        {sub.name}
      </T>
      <Pill tone={status.tone} emoji={status.emoji} label={status.label} style={{ alignSelf: 'center' }} />
      <View style={{ alignSelf: 'stretch', gap: space.sm, marginTop: space.sm }}>
        <StatRow label="ค่าบริการ" value={`${formatTHB(Math.round(audit.monthlyCost))}/เดือน`} />
        <StatRow label="ใช้ใน 30 วัน" value={`${audit.usesLast30Days} ครั้ง`} />
        <StatRow
          label="ใช้ล่าสุด"
          value={audit.daysSinceLastUse === null ? 'ไม่เคยเลย 🫠' : `${audit.daysSinceLastUse} วันก่อน`}
        />
        <StatRow label="ต่อปีเสีย" value={formatTHB(Math.round(audit.monthlyCost * 12))} color={c.danger} />
      </View>
    </View>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  const c = useColors();
  return (
    <Row style={{ justifyContent: 'space-between', backgroundColor: c.cardMuted, borderRadius: radius.sm, padding: space.sm + 2 }}>
      <T variant="caption" muted>
        {label}
      </T>
      <T variant="label" color={color}>
        {value}
      </T>
    </Row>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    position: 'absolute',
    width: '100%',
    maxWidth: 360,
    height: 440,
    borderRadius: 32,
    padding: space.xl,
  },
  round: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  stamp: {
    position: 'absolute',
    top: 28,
    borderWidth: 4,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stampKeep: { left: 22, transform: [{ rotate: '-14deg' }] },
  stampBye: { right: 22, transform: [{ rotate: '14deg' }] },
  stampText: { fontSize: 22, lineHeight: 32, fontFamily: fonts.bold },
});
