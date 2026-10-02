import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Chips, Field, Screen, SectionTitle, T } from '@/components/ui';
import { advanceBillingDate } from '@/lib/audit';
import { SUBSCRIPTION_KINDS } from '@/lib/categories';
import { isValidISODate, todayISO } from '@/lib/dates';
import { newId } from '@/lib/format';
import { useStore } from '@/lib/store';
import { SUBSCRIPTION_CATALOG, matchCatalog } from '@/lib/subscription-catalog';
import { space, useColors } from '@/lib/theme';
import type { BillingCycle, Subscription, SubscriptionKind } from '@/lib/types';

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'รายเดือน' },
  { value: 'yearly', label: 'รายปี' },
  { value: 'weekly', label: 'รายสัปดาห์' },
];

function isCycle(v: unknown): v is BillingCycle {
  return v === 'monthly' || v === 'yearly' || v === 'weekly';
}

/** Add a subscription, or edit one when an `id` param is given. */
export default function SubscriptionFormScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ id?: string; name?: string; price?: string; cycle?: string; lastCharged?: string }>();
  const { state, dispatch } = useStore();
  const existing = state.subscriptions.find((s) => s.id === params.id);
  const catalog = params.name ? matchCatalog(params.name) : undefined;
  const initialCycle: BillingCycle = isCycle(params.cycle) ? params.cycle : (catalog?.cycle ?? 'monthly');

  const [name, setName] = useState(existing?.name ?? catalog?.name ?? params.name ?? '');
  const [kind, setKind] = useState<SubscriptionKind>(existing?.kind ?? catalog?.kind ?? 'streaming');
  const [price, setPrice] = useState(String(existing?.price ?? params.price ?? catalog?.defaultPrice ?? ''));
  const [cycle, setCycle] = useState<BillingCycle>(existing?.cycle ?? initialCycle);
  const [nextBilling, setNextBilling] = useState(
    existing?.nextBillingDate ??
      (params.lastCharged && isValidISODate(params.lastCharged)
        ? advanceBillingDate(params.lastCharged, initialCycle)
        : todayISO()),
  );
  const [target, setTarget] = useState(String(existing?.targetUsesPerMonth ?? 8));
  const [remind, setRemind] = useState(String(existing?.remindBeforeDays ?? 2));
  const [error, setError] = useState<string | null>(null);

  const applyCatalog = (entryName: string) => {
    const entry = SUBSCRIPTION_CATALOG.find((e) => e.name === entryName);
    if (!entry) return;
    setName(entry.name);
    setKind(entry.kind);
    setPrice(String(entry.defaultPrice));
    setCycle(entry.cycle);
  };

  const save = () => {
    const priceNum = Number(price.replace(/,/g, ''));
    const targetNum = Number(target);
    const remindNum = Number(remind);
    if (!name.trim()) return setError('กรุณาใส่ชื่อบริการ');
    if (!Number.isFinite(priceNum) || priceNum <= 0) return setError('ราคาไม่ถูกต้อง');
    if (!isValidISODate(nextBilling)) return setError('วันตัดเงินต้องเป็นรูปแบบ YYYY-MM-DD');
    if (!Number.isInteger(targetNum) || targetNum < 1) return setError('เป้าหมายการใช้ต้องเป็นจำนวนเต็ม ≥ 1');
    if (!Number.isInteger(remindNum) || remindNum < 0 || remindNum > 30) return setError('วันแจ้งเตือนต้องอยู่ระหว่าง 0–30');

    const subscription: Subscription = {
      id: existing?.id ?? newId(),
      name: name.trim(),
      kind,
      price: priceNum,
      cycle,
      nextBillingDate: nextBilling,
      startedAt: existing?.startedAt ?? todayISO(),
      usageLog: existing?.usageLog ?? [],
      targetUsesPerMonth: targetNum,
      remindBeforeDays: remindNum,
      cancelled: existing?.cancelled,
    };
    dispatch({ type: 'upsertSubscription', subscription });
    router.back();
  };

  return (
    <Screen safeTop={false}>
      {!existing && (
        <>
          <T variant="caption" muted style={{ marginBottom: space.xs }}>
            เลือกจากบริการยอดนิยม
          </T>
          <Chips
            value={name}
            onChange={applyCatalog}
            options={SUBSCRIPTION_CATALOG.map((e) => ({ value: e.name, label: e.name }))}
          />
          <View style={{ height: space.lg }} />
        </>
      )}
      <Field label="ชื่อบริการ" value={name} onChangeText={setName} placeholder="เช่น Netflix" />
      <T variant="caption" muted style={{ marginBottom: space.xs }}>
        ประเภท
      </T>
      <Chips<SubscriptionKind>
        value={kind}
        onChange={setKind}
        options={(Object.keys(SUBSCRIPTION_KINDS) as SubscriptionKind[]).map((k) => ({
          value: k,
          label: SUBSCRIPTION_KINDS[k].label,
          emoji: SUBSCRIPTION_KINDS[k].emoji,
        }))}
      />
      <View style={{ height: space.md }} />
      <Field label="ราคา (บาท / รอบบิล)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <T variant="caption" muted style={{ marginBottom: space.xs }}>
        รอบบิล
      </T>
      <Chips<BillingCycle> value={cycle} onChange={setCycle} options={CYCLES} />
      <View style={{ height: space.md }} />
      <Field label="วันตัดเงินครั้งถัดไป (YYYY-MM-DD)" value={nextBilling} onChangeText={setNextBilling} />

      <SectionTitle>เกณฑ์ความคุ้มค่า</SectionTitle>
      <Field
        label="ควรใช้อย่างน้อยกี่ครั้ง/เดือนถึงจะคุ้ม"
        value={target}
        onChangeText={setTarget}
        keyboardType="number-pad"
      />
      <Field label="แจ้งเตือนก่อนตัดเงิน (วัน)" value={remind} onChangeText={setRemind} keyboardType="number-pad" />
      {error && (
        <T color={c.danger} style={{ marginBottom: space.md }}>
          {error}
        </T>
      )}
      <Button label="บันทึก" icon="checkmark" onPress={save} />
    </Screen>
  );
}
