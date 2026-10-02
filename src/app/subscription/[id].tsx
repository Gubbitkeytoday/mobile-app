import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, View } from 'react-native';

import { Button, Card, EmptyState, Row, Screen, SectionTitle, T } from '@/components/ui';
import { auditSubscription } from '@/lib/audit';
import { formatThaiDate, todayISO } from '@/lib/dates';
import { formatTHB } from '@/lib/format';
import { ensureNotificationPermission, rescheduleRenewalReminders } from '@/lib/notifications';
import { useStore } from '@/lib/store';
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

export default function SubscriptionDetailScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const sub = state.subscriptions.find((s) => s.id === id);
  if (!sub) return <EmptyState icon="alert-circle-outline" title="ไม่พบซับสคริปชันนี้" />;

  const today = todayISO();
  const a = auditSubscription(sub, today);
  const usedToday = sub.usageLog.includes(today);
  const recentLog = [...sub.usageLog].sort().reverse().slice(0, 10);

  return (
    <Screen safeTop={false}>
      <Stack.Screen options={{ title: sub.name }} />
      <T variant="money">{formatTHB(sub.price)}</T>
      <T muted>
        ต่อ{sub.cycle === 'monthly' ? 'เดือน' : sub.cycle === 'yearly' ? 'ปี' : 'สัปดาห์'} · ตัดเงินครั้งถัดไป{' '}
        {formatThaiDate(a.nextBillingDate)}
      </T>

      {sub.cancelled ? (
        <Card tone="success" style={{ marginTop: space.lg }}>
          <T>ยกเลิกแล้ว — ไม่นับรวมในค่าใช้จ่ายรายเดือน</T>
        </Card>
      ) : (
        <Button
          label={usedToday ? 'บันทึกการใช้วันนี้แล้ว ✓' : 'ใช้วันนี้'}
          icon="hand-left"
          disabled={usedToday}
          style={{ marginTop: space.lg }}
          onPress={() => dispatch({ type: 'logUsage', id: sub.id, date: today })}
        />
      )}

      <Row style={{ marginTop: space.lg, alignItems: 'stretch' }}>
        <Card style={{ flex: 1 }}>
          <T variant="caption" muted>
            ใช้ใน 30 วัน
          </T>
          <T variant="heading">
            {a.usesLast30Days}/{sub.targetUsesPerMonth} ครั้ง
          </T>
        </Card>
        <Card style={{ flex: 1 }}>
          <T variant="caption" muted>
            ต้นทุนต่อครั้ง
          </T>
          <T variant="heading">{a.costPerUse !== null ? formatTHB(Math.round(a.costPerUse)) : '—'}</T>
        </Card>
      </Row>

      {(a.status === 'unused' || a.status === 'underused') && !sub.cancelled && (
        <Card tone="danger" style={{ marginTop: space.lg, gap: space.xs }}>
          <T style={{ fontWeight: '700' }}>คำแนะนำ: พิจารณายกเลิก</T>
          <T muted>
            {a.status === 'unused'
              ? `ไม่มีการใช้งานใน 30 วันที่ผ่านมา`
              : `ใช้เพียง ${a.usesLast30Days} ครั้ง ต่ำกว่าเป้าหมาย`}{' '}
            — ยกเลิกแล้วประหยัด {formatTHB(Math.round(a.monthlyCost * 12))}/ปี
          </T>
        </Card>
      )}

      <SectionTitle>ประวัติการใช้งานล่าสุด</SectionTitle>
      <Card>
        {recentLog.length === 0 ? (
          <T muted>ยังไม่มีบันทึก</T>
        ) : (
          recentLog.map((d) => (
            <T key={d} style={{ paddingVertical: 2 }}>
              • {formatThaiDate(d)}
            </T>
          ))
        )}
      </Card>

      <View style={{ gap: space.md, marginTop: space.xl }}>
        <Button
          label="เปิดแจ้งเตือนก่อนตัดเงิน"
          icon="notifications"
          variant="secondary"
          onPress={async () => {
            if (await ensureNotificationPermission()) {
              const n = await rescheduleRenewalReminders(state.subscriptions);
              Alert.alert('ตั้งแจ้งเตือนแล้ว', `ตั้งเตือนไว้ ${n} รายการ`);
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
            label="ทำเครื่องหมายว่ายกเลิกแล้ว"
            icon="close-circle"
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
      <T variant="caption" muted style={{ textAlign: 'center', marginTop: space.lg }} color={c.textMuted}>
        แอปไม่ได้ยกเลิกบริการให้อัตโนมัติ — ต้องยกเลิกที่ผู้ให้บริการโดยตรง
      </T>
    </Screen>
  );
}
