import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { TransactionRow } from '@/components/finance';
import { Button, Card, Chips, EmptyState, Row, Screen, T } from '@/components/ui';
import { CATEGORIES, CATEGORY_IDS } from '@/lib/categories';
import { formatThaiMonth, monthKey } from '@/lib/dates';
import { formatTHB } from '@/lib/format';
import { useStore } from '@/lib/store';
import { space } from '@/lib/theme';
import type { CategoryId, Transaction } from '@/lib/types';

type Filter = 'all' | CategoryId;

export default function TransactionsScreen() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState<Filter>('all');

  const sections = useMemo(() => {
    const filtered = state.transactions.filter((t) => filter === 'all' || t.category === filter);
    const byMonth = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = monthKey(t.date);
      byMonth.set(key, [...(byMonth.get(key) ?? []), t]);
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, data]) => ({
        month,
        title: formatThaiMonth(month),
        total: data.reduce((s, t) => s + t.amount, 0),
        data,
      }));
  }, [state.transactions, filter]);

  const confirmDelete = (tx: Transaction) => {
    const remove = () => dispatch({ type: 'deleteTransaction', id: tx.id });
    if (Platform.OS === 'web') {
      if (window.confirm(`ลบ ${tx.merchant}?`)) remove();
      return;
    }
    Alert.alert('ลบรายการ', `ลบ ${tx.merchant} ${formatTHB(tx.amount)}?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="title">รายการ</T>
        <Button label="จดเอง" icon="pencil" size="sm" onPress={() => router.push('/transaction/new')} />
      </Row>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20, marginTop: space.md }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: space.sm }}>
        <Chips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'ทั้งหมด', emoji: '🌈' },
            ...CATEGORY_IDS.map((id) => ({ value: id, label: CATEGORIES[id].label, emoji: CATEGORIES[id].emoji })),
          ]}
        />
      </ScrollView>

      {sections.length === 0 && (
        <EmptyState title="ยังไม่มีรายการ" hint="สแกนสลิปหรือจดรายจ่ายเองได้เลย น้องตังค์รออยู่!" />
      )}

      {sections.map((section, i) => (
        <Animated.View key={section.month} entering={FadeInDown.delay(i * 60).duration(400)}>
          <Row style={{ justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.sm }}>
            <T variant="heading">{section.title}</T>
            <T variant="label" muted>
              {formatTHB(section.total)}
            </T>
          </Row>
          <Card style={{ paddingVertical: space.sm }}>
            {section.data.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onLongPress={() => confirmDelete(tx)} />
            ))}
          </Card>
        </Animated.View>
      ))}

      {sections.length > 0 && (
        <T variant="caption" muted style={{ textAlign: 'center', marginTop: space.lg }}>
          กดค้างที่รายการเพื่อลบ
        </T>
      )}
    </Screen>
  );
}
