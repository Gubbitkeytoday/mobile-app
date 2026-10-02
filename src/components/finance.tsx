import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Mascot } from '@/components/mascot';
import { Bouncy, Card, EmojiTile, Pill, ProgressBar, Row, Sticker, T } from '@/components/ui';
import { auditAll, type SubscriptionAudit, type UsageStatus } from '@/lib/audit';
import { summarizeMonth } from '@/lib/analytics';
import { CATEGORIES } from '@/lib/categories';
import { formatThaiDate, monthKey, todayISO } from '@/lib/dates';
import { formatTHB } from '@/lib/format';
import { useStore } from '@/lib/store';
import { serviceColor } from '@/lib/subscription-catalog';
import { space, useColors, type Tone } from '@/lib/theme';
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
    <Bouncy onLongPress={onLongPress} disabled={!onLongPress} scaleTo={0.98}>
      <Row style={{ paddingVertical: space.sm }}>
        <EmojiTile emoji={cat.emoji} bg={cat.soft} />
        <View style={{ flex: 1 }}>
          <T numberOfLines={1} variant="label" style={{ fontSize: 15 }}>
            {tx.merchant}
          </T>
          <T variant="caption" muted numberOfLines={1}>
            {cat.label} · {formatThaiDate(tx.date)}
            {tx.source === 'slip' ? ' · 📸' : ''}
          </T>
        </View>
        <T variant="label" style={{ fontSize: 15 }}>
          -{formatTHB(tx.amount)}
        </T>
      </Row>
    </Bouncy>
  );
}

export const STATUS_META: Record<UsageStatus, { label: string; emoji: string; tone: Tone; bar: readonly [string, string] }> = {
  unused: { label: 'หลับอยู่', emoji: '😴', tone: 'danger', bar: ['#FFB3C4', '#FF5C7A'] },
  underused: { label: 'ใช้น้อย', emoji: '🥱', tone: 'warning', bar: ['#FFE08A', '#F5A524'] },
  new: { label: 'เพิ่งสมัคร', emoji: '🌱', tone: 'sky', bar: ['#A9DBFF', '#5AB8FF'] },
  healthy: { label: 'คุ้มสุดๆ', emoji: '💖', tone: 'mint', bar: ['#9BF5C9', '#2FCB95'] },
};

export function SubscriptionAuditCard({ audit }: { audit: SubscriptionAudit }) {
  const c = useColors();
  const sub = audit.subscription;
  const status = STATUS_META[audit.status];
  const asleep = audit.status === 'unused';
  return (
    <Card
      onPress={() => router.push({ pathname: '/subscription/[id]', params: { id: sub.id } })}
      style={{ marginBottom: space.md, gap: space.md, opacity: asleep ? 0.92 : 1 }}>
      <Row>
        <Sticker label={sub.name} color={serviceColor(sub.name)} />
        <View style={{ flex: 1 }}>
          <T variant="heading" numberOfLines={1} style={{ fontSize: 16 }}>
            {sub.name}
          </T>
          <T variant="caption" muted>
            {formatTHB(sub.price)}/{sub.cycle === 'monthly' ? 'เดือน' : sub.cycle === 'yearly' ? 'ปี' : 'สัปดาห์'}
            {' · '}
            {audit.daysUntilBilling === 0 ? 'ตัดเงินวันนี้!' : `ตัดเงินอีก ${audit.daysUntilBilling} วัน`}
          </T>
        </View>
        {asleep ? <Mascot mood="sleepy" size={44} animated={false} /> : <Pill label={status.label} emoji={status.emoji} tone={status.tone} />}
      </Row>
      <View style={{ gap: space.xs }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="caption" muted>
            ใช้ {audit.usesLast30Days}/{sub.targetUsesPerMonth} ครั้ง ใน 30 วัน
          </T>
          <T variant="caption" color={asleep ? c.danger : c.textMuted}>
            {audit.costPerUse !== null
              ? `ครั้งละ ${formatTHB(Math.round(audit.costPerUse))}`
              : audit.daysSinceLastUse !== null
                ? `หลับมา ${audit.daysSinceLastUse} วัน`
                : 'ยังไม่เคยใช้'}
          </T>
        </Row>
        <ProgressBar value={audit.valueScore} colors={status.bar} />
      </View>
    </Card>
  );
}
