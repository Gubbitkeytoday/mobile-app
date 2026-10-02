import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Card, IconBubble, Pill, ProgressBar, Row, T, type IconName } from '@/components/ui';
import { auditAll, type SubscriptionAudit, type UsageStatus } from '@/lib/audit';
import { summarizeMonth } from '@/lib/analytics';
import { CATEGORIES, SUBSCRIPTION_KINDS } from '@/lib/categories';
import { formatThaiDate, monthKey, todayISO } from '@/lib/dates';
import { formatTHB } from '@/lib/format';
import { useStore } from '@/lib/store';
import { space, useColors } from '@/lib/theme';
import type { Transaction } from '@/lib/types';

export function useAudit() {
  const { state } = useStore();
  return useMemo(() => auditAll(state.subscriptions, todayISO()), [state.subscriptions]);
}

/** Summary of the current month, compared with the same days of the previous month. */
export function useMonthSummary() {
  const { state } = useStore();
  const today = todayISO();
  return useMemo(
    () => summarizeMonth(state.transactions, monthKey(today), Number(today.slice(8, 10))),
    [state.transactions, today],
  );
}

export function TransactionRow({ tx, onLongPress }: { tx: Transaction; onLongPress?: () => void }) {
  const cat = CATEGORIES[tx.category];
  return (
    <Pressable onLongPress={onLongPress} disabled={!onLongPress}>
      <Row style={{ paddingVertical: space.sm }}>
        <IconBubble name={cat.icon as IconName} color={cat.color} />
        <View style={{ flex: 1 }}>
          <T numberOfLines={1} style={{ fontWeight: '600' }}>
            {tx.merchant}
          </T>
          <T variant="caption" muted>
            {cat.label} · {formatThaiDate(tx.date)}
            {tx.source === 'slip' ? ' · 📷 สลิป' : ''}
          </T>
        </View>
        <T style={{ fontWeight: '700' }}>-{formatTHB(tx.amount)}</T>
      </Row>
    </Pressable>
  );
}

const STATUS_LABEL: Record<UsageStatus, { label: string; tone: 'danger' | 'warning' | 'success' | 'primary' }> = {
  unused: { label: 'ไม่ได้ใช้', tone: 'danger' },
  underused: { label: 'ใช้น้อย', tone: 'warning' },
  new: { label: 'เพิ่งสมัคร', tone: 'primary' },
  healthy: { label: 'คุ้มค่า', tone: 'success' },
};

export function SubscriptionAuditCard({ audit }: { audit: SubscriptionAudit }) {
  const c = useColors();
  const sub = audit.subscription;
  const status = STATUS_LABEL[audit.status];
  const barColor = { danger: c.danger, warning: c.warning, success: c.success, primary: c.primary }[status.tone];
  return (
    <Card
      onPress={() => router.push({ pathname: '/subscription/[id]', params: { id: sub.id } })}
      style={{ marginBottom: space.md, gap: space.md }}>
      <Row>
        <IconBubble name={SUBSCRIPTION_KINDS[sub.kind].icon as IconName} color={c.primary} />
        <View style={{ flex: 1 }}>
          <T style={{ fontWeight: '700' }}>{sub.name}</T>
          <T variant="caption" muted>
            {formatTHB(sub.price)}/{sub.cycle === 'monthly' ? 'เดือน' : sub.cycle === 'yearly' ? 'ปี' : 'สัปดาห์'}
            {' · '}ตัดเงิน {audit.daysUntilBilling === 0 ? 'วันนี้' : `อีก ${audit.daysUntilBilling} วัน`}
          </T>
        </View>
        <Pill label={status.label} tone={status.tone} />
      </Row>
      <View style={{ gap: space.xs }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="caption" muted>
            ใช้ {audit.usesLast30Days}/{sub.targetUsesPerMonth} ครั้ง (30 วัน)
          </T>
          <T variant="caption" muted>
            {audit.costPerUse !== null
              ? `${formatTHB(Math.round(audit.costPerUse))}/ครั้ง`
              : audit.daysSinceLastUse !== null
                ? `ไม่ได้ใช้ ${audit.daysSinceLastUse} วัน`
                : 'ยังไม่เคยบันทึกการใช้'}
          </T>
        </Row>
        <ProgressBar value={audit.valueScore} color={barColor} />
      </View>
    </Card>
  );
}
