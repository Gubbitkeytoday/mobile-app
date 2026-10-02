import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { STATUS_META } from '@/components/finance';
import { Mascot } from '@/components/mascot';
import { Button, Card, EmptyState, Pill, Row, Screen, SectionTitle, Sticker, T } from '@/components/ui';
import { auditSubscription } from '@/lib/audit';
import { addDays, formatThaiDate, todayISO } from '@/lib/dates';
import { formatTHB } from '@/lib/format';
import type { MascotMood } from '@/lib/mascot';
import { ensureNotificationPermission, rescheduleRenewalReminders } from '@/lib/notifications';
import { useStore } from '@/lib/store';
import { serviceColor } from '@/lib/subscription-catalog';
import { space, useColors } from '@/lib/theme';

function confirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'ยกเลิก', style: 'cancel' },
    { text: 'ยืนยัน', style: 'destructive', onPress: onConfirm },
  ]);
}

const MOOD_FOR_STATUS: Record<string, MascotMood> = {
  unused: 'sleepy',
  underused: 'worried',
  new: 'thinking',
  healthy: 'excited',
};

export default function SubscriptionDetailScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const sub = state.subscriptions.find((s) => s.id === id);
  if (!sub) return <EmptyState mood="worried" title="ไม่พบซับสคริปชันนี้" />;

  const today = todayISO();
  const a = auditSubscription(sub, today);
  const status = STATUS_META[a.status];
  const usedToday = sub.usageLog.includes(today);
  const used = new Set(sub.usageLog);
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: sub.name }} />

      <Card gradient={[`${serviceColor(sub.name)}33`, c.card]} lifted style={{ gap: space.md }}>
        <Row style={{ alignItems: 'flex-start' }}>
          <Sticker label={sub.name} color={serviceColor(sub.name)} size={64} />
          <View style={{ flex: 1 }}>
            <T variant="display" style={{ fontSize: 34, lineHeight: 46 }}>
              {formatTHB(sub.price)}
            </T>
            <T variant="caption" muted>
              ต่อ{sub.cycle === 'monthly' ? 'เดือน' : sub.cycle === 'yearly' ? 'ปี' : 'สัปดาห์'} · ตัดเงิน{' '}
              {formatThaiDate(a.nextBillingDate)}
            </T>
          </View>
          <Mascot mood={sub.cancelled ? 'happy' : MOOD_FOR_STATUS[a.status]} size={64} />
        </Row>
        {!sub.cancelled && <Pill tone={status.tone} emoji={status.emoji} label={status.label} />}
      </Card>

      {sub.cancelled ? (
        <Card tone="mint" style={{ marginTop: space.lg }}>
          <T>✅ ยกเลิกแล้ว — ไม่นับรวมในค่าใช้จ่ายรายเดือน</T>
        </Card>
      ) : (
        <Button
          label={usedToday ? 'วันนี้ใช้แล้ว เก่งมาก! 💖' : 'วันนี้ใช้แล้ว! 🙌'}
          icon={usedToday ? 'checkmark-circle' : 'hand-left'}
          variant="mint"
          disabled={usedToday}
          style={{ marginTop: space.lg }}
          onPress={() => dispatch({ type: 'logUsage', id: sub.id, date: today })}
        />
      )}

      <Row style={{ marginTop: space.lg, alignItems: 'stretch' }}>
        <Card tone="primary" style={{ flex: 1 }}>
          <T variant="caption" muted>
            ใช้ใน 30 วัน
          </T>
          <T variant="heading">
            {a.usesLast30Days}/{sub.targetUsesPerMonth} ครั้ง
          </T>
        </Card>
        <Card tone="peach" style={{ flex: 1 }}>
          <T variant="caption" muted>
            ตกครั้งละ
          </T>
          <T variant="heading">{a.costPerUse !== null ? formatTHB(Math.round(a.costPerUse)) : '∞ 🫠'}</T>
        </Card>
      </Row>

      <SectionTitle>ปฏิทินความรัก 30 วัน 💕</SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {last30.map((d) => (
            <Animated.View
              key={d}
              entering={used.has(d) ? ZoomIn.springify() : undefined}
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: used.has(d) ? c.pinkSoft : c.cardMuted,
                borderWidth: d === today ? 2 : 0,
                borderColor: c.primary,
              }}>
              {used.has(d) ? <Text style={{ fontSize: 16 }}>💖</Text> : <T variant="caption" muted>{Number(d.slice(8))}</T>}
            </Animated.View>
          ))}
        </View>
      </Card>

      {(a.status === 'unused' || a.status === 'underused') && !sub.cancelled && (
        <Card tone="pink" style={{ marginTop: space.lg, gap: space.xs }}>
          <T variant="label">💭 น้องตังค์แนะนำ: ลองพิจารณายกเลิกนะ</T>
          <T variant="caption" muted>
            {a.status === 'unused' ? 'ไม่มีการใช้งานเลยใน 30 วัน' : `ใช้แค่ ${a.usesLast30Days} ครั้ง ต่ำกว่าเป้า`} — ยกเลิกแล้วได้คืน{' '}
            {formatTHB(Math.round(a.monthlyCost * 12))}/ปี
          </T>
        </Card>
      )}

      <View style={{ gap: space.md, marginTop: space.xl }}>
        <Button
          label="เตือนก่อนตัดเงิน"
          icon="notifications"
          variant="secondary"
          onPress={async () => {
            if (await ensureNotificationPermission()) {
              const n = await rescheduleRenewalReminders(state.subscriptions);
              Alert.alert('ตั้งแจ้งเตือนแล้ว 🔔', `ตั้งเตือนไว้ ${n} รายการ`);
            }
          }}
        />
        <Button
          label="แก้ไข"
          icon="create"
          variant="secondary"
          onPress={() => router.push({ pathname: '/subscription/new', params: { id: sub.id } })}
        />
        {!sub.cancelled && (
          <Button
            label="ยกเลิกแล้ว บ๊ายบาย 👋"
            variant="danger"
            onPress={() =>
              confirm('ยกเลิกแล้ว?', `ยืนยันว่ายกเลิก ${sub.name} กับผู้ให้บริการแล้ว`, () =>
                dispatch({ type: 'upsertSubscription', subscription: { ...sub, cancelled: true } }),
              )
            }
          />
        )}
        <Button
          label="ลบออกจากแอป"
          icon="trash"
          variant="danger"
          onPress={() =>
            confirm('ลบซับสคริปชัน', `ลบ ${sub.name} และประวัติการใช้งาน?`, () => {
              dispatch({ type: 'deleteSubscription', id: sub.id });
              router.back();
            })
          }
        />
      </View>
      <T variant="caption" muted style={{ textAlign: 'center', marginTop: space.lg }}>
        แอปไม่ได้ยกเลิกบริการให้อัตโนมัติ ต้องไปยกเลิกที่ผู้ให้บริการด้วยนะ
      </T>
    </Screen>
  );
}
