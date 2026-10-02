import { useState } from 'react';
import { View } from 'react-native';

import { Button, Chips, Field, T } from '@/components/ui';
import { CATEGORIES, CATEGORY_IDS } from '@/lib/categories';
import { isValidISODate, todayISO } from '@/lib/dates';
import { newId } from '@/lib/format';
import { matchCatalog } from '@/lib/subscription-catalog';
import { space, useColors } from '@/lib/theme';
import type { CategoryId, Transaction, TransactionSource } from '@/lib/types';

export interface TransactionDraft {
  merchant: string;
  amount: string;
  date: string;
  category: CategoryId;
  note: string;
}

export function emptyDraft(): TransactionDraft {
  return { merchant: '', amount: '', date: todayISO(), category: 'food', note: '' };
}

/** Editable transaction form shared by manual entry and slip-scan review. */
export function TransactionForm({
  initial,
  source,
  submitLabel = 'บันทึก',
  onSubmit,
}: {
  initial: TransactionDraft;
  source: TransactionSource;
  submitLabel?: string;
  onSubmit: (tx: Transaction) => void;
}) {
  const c = useColors();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof TransactionDraft>(key: K, value: TransactionDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const submit = () => {
    const amount = Number(draft.amount.replace(/,/g, ''));
    if (!draft.merchant.trim()) return setError('กรุณาใส่ชื่อร้าน/ผู้รับเงิน');
    if (!Number.isFinite(amount) || amount <= 0) return setError('จำนวนเงินไม่ถูกต้อง');
    if (!isValidISODate(draft.date)) return setError('วันที่ต้องเป็นรูปแบบ YYYY-MM-DD');
    setError(null);
    onSubmit({
      id: newId(),
      merchant: draft.merchant.trim(),
      amount,
      date: draft.date,
      category: draft.category,
      note: draft.note.trim() || undefined,
      source,
    });
  };

  return (
    <View>
      <Field
        label="ร้านค้า / ผู้รับเงิน"
        value={draft.merchant}
        onChangeText={(v) => {
          set('merchant', v);
          if (matchCatalog(v)) set('category', 'subscription');
        }}
        placeholder="เช่น 7-Eleven, Netflix"
      />
      <Field
        label="จำนวนเงิน (บาท)"
        value={draft.amount}
        onChangeText={(v) => set('amount', v)}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <Field label="วันที่ (YYYY-MM-DD)" value={draft.date} onChangeText={(v) => set('date', v)} />
      <T variant="caption" muted style={{ marginBottom: space.xs }}>
        หมวดหมู่
      </T>
      <Chips<CategoryId>
        value={draft.category}
        onChange={(v) => set('category', v)}
        options={CATEGORY_IDS.map((id) => ({ value: id, label: CATEGORIES[id].label }))}
      />
      <View style={{ height: space.md }} />
      <Field label="โน้ต (ไม่บังคับ)" value={draft.note} onChangeText={(v) => set('note', v)} />
      {error && (
        <T color={c.danger} style={{ marginBottom: space.md }}>
          {error}
        </T>
      )}
      <Button label={submitLabel} icon="checkmark" onPress={submit} />
    </View>
  );
}
